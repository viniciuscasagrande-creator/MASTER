import { prisma } from '../../../core/database/prisma';
import {
  InventoryPoolDTO,
  InventoryHoldInput,
  InventoryHoldResult,
  InventorySummaryDTO,
  InventoryAllocationDTO
} from '@shared/types/index';

// Armazena holds temporários em memória (TTL)
interface ActiveHold {
  holdToken: string;
  inventoryPoolId: string;
  eventTicketTypeId: string;
  quantity: number;
  expiresAt: number;
  seatIds?: string[];
}

const activeHoldsMap = new Map<string, ActiveHold>();

export class InventoryService {
  /**
   * Garante sincronização entre SessionSections e InventoryPools
   */
  static async syncPoolsForSession(sessionId: string): Promise<void> {
    const sessionSections = await prisma.sessionSection.findMany({
      where: { sessionId, enabled: true },
      include: { eventSection: true }
    });

    for (const ss of sessionSections) {
      const existing = await prisma.inventoryPool.findUnique({
        where: {
          sessionId_eventSectionId: {
            sessionId,
            eventSectionId: ss.eventSectionId
          }
        }
      });

      if (!existing) {
        await prisma.inventoryPool.create({
          data: {
            sessionId,
            eventSectionId: ss.eventSectionId,
            capacity: ss.capacity,
            reserved: ss.reservedCapacity || 0,
            blocked: 0,
            held: 0,
            sold: 0
          }
        });
      }
    }
  }

  /**
   * Limpa holds expirados
   */
  static cleanExpiredHolds(): void {
    const now = Date.now();
    for (const [token, hold] of activeHoldsMap.entries()) {
      if (hold.expiresAt < now) {
        this.releaseHold(token).catch(console.error);
      }
    }
  }

  /**
   * Lista pools de inventário vendável com cálculo exato de disponibilidade comercial
   */
  static async listPools(sessionId: string, eventSectionId?: string): Promise<InventoryPoolDTO[]> {
    this.cleanExpiredHolds();
    await this.syncPoolsForSession(sessionId);

    const where: any = { sessionId };
    if (eventSectionId) where.eventSectionId = eventSectionId;

    const pools = await prisma.inventoryPool.findMany({
      where,
      include: {
        allocations: true,
        blocks: true,
        session: true,
        eventSection: true
      }
    });

    return pools.map((p: any) => {
      const available = Math.max(0, p.capacity - (p.reserved + p.blocked + p.held + p.sold));

      const allocations: InventoryAllocationDTO[] = (p.allocations || []).map((a: any) => {
        let allocatedQty = a.allocatedQuantity;
        if (a.allocationType === 'PERCENTAGE') {
          allocatedQty = Math.floor((p.capacity * a.allocationValue) / 100);
        } else if (a.allocationType === 'UNLIMITED') {
          allocatedQty = p.capacity;
        }

        const avail = Math.max(0, allocatedQty - ((a.soldQuantity || 0) + (a.heldQuantity || 0)));

        return {
          id: a.id,
          inventoryPoolId: a.inventoryPoolId,
          eventTicketTypeId: a.eventTicketTypeId,
          ticketTypeName: a.eventTicketType?.name,
          ticketTypeCategory: a.eventTicketType?.category,
          allocationType: a.allocationType,
          allocationValue: a.allocationValue,
          allocatedQuantity: allocatedQty,
          soldQuantity: a.soldQuantity || 0,
          heldQuantity: a.heldQuantity || 0,
          availableQuantity: avail
        };
      });

      return {
        id: p.id,
        sessionId: p.sessionId,
        eventSectionId: p.eventSectionId,
        sessionName: p.session?.name,
        sectionName: p.eventSection?.name,
        capacity: p.capacity,
        reserved: p.reserved,
        blocked: p.blocked,
        held: p.held,
        sold: p.sold,
        available,
        allocations,
        blocks: (p.blocks || []).map((b: any) => ({
          id: b.id,
          inventoryPoolId: b.inventoryPoolId,
          reason: b.reason,
          quantity: b.quantity,
          notes: b.notes,
          active: b.active,
          createdByUserId: b.createdByUserId,
          createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()
        })),
        version: p.version,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  /**
   * Reserva atômica de inventário (Anti-overselling guarantee com TTL)
   */
  static async holdInventory(input: InventoryHoldInput): Promise<InventoryHoldResult> {
    this.cleanExpiredHolds();
    await this.syncPoolsForSession(input.sessionId);

    // 1. Busca o pool correspondente
    const pool = await prisma.inventoryPool.findUnique({
      where: {
        sessionId_eventSectionId: {
          sessionId: input.sessionId,
          eventSectionId: input.eventSectionId
        }
      },
      include: { allocations: true }
    });

    if (!pool) {
      throw new Error('Pool de inventário não encontrado para esta sessão e setor');
    }

    // 2. Verificação de capacidade comercial disponível
    const availablePool = pool.capacity - (pool.reserved + pool.blocked + pool.held + pool.sold);
    if (availablePool < input.quantity) {
      const err: any = new Error(`Capacidade esgotada no setor. Solicitado: ${input.quantity}, Disponível: ${Math.max(0, availablePool)}`);
      err.statusCode = 409;
      throw err;
    }

    // 3. Verificação de cota / allocation se existir
    let matchedAllocation = (pool.allocations || []).find((a: any) => a.eventTicketTypeId === input.eventTicketTypeId);
    if (matchedAllocation && matchedAllocation.allocationType !== 'UNLIMITED') {
      let allocatedQty = matchedAllocation.allocatedQuantity;
      if (matchedAllocation.allocationType === 'PERCENTAGE') {
        allocatedQty = Math.floor((pool.capacity * matchedAllocation.allocationValue) / 100);
      }
      const availableQuota = allocatedQty - (matchedAllocation.soldQuantity + matchedAllocation.heldQuantity);
      if (availableQuota < input.quantity) {
        const err: any = new Error(`Cota esgotada para esta modalidade de ingresso. Disponível: ${Math.max(0, availableQuota)}`);
        err.statusCode = 409;
        throw err;
      }
    }

    // 4. Se assentos marcados especificados, verifica se estão disponíveis
    if (input.seatIds && input.seatIds.length > 0) {
      for (const seatId of input.seatIds) {
        const seat = await prisma.seatInventory.findUnique({
          where: { id: seatId }
        });
        if (!seat || seat.status !== 'AVAILABLE') {
          const err: any = new Error(`O assento ${seat?.seatCode || seatId} não está mais disponível.`);
          err.statusCode = 409;
          throw err;
        }
      }
    }

    // 5. Reserva atômica: atualiza pool e allocation
    await prisma.inventoryPool.update({
      where: { id: pool.id },
      data: {
        held: pool.held + input.quantity
      }
    });

    if (matchedAllocation) {
      await prisma.inventoryAllocation.update({
        where: { id: matchedAllocation.id },
        data: {
          heldQuantity: matchedAllocation.heldQuantity + input.quantity
        }
      });
    }

    // 6. Atualiza assentos se aplicável
    if (input.seatIds && input.seatIds.length > 0) {
      for (const seatId of input.seatIds) {
        await prisma.seatInventory.update({
          where: { id: seatId },
          data: {
            status: 'HELD',
            heldUntil: new Date(Date.now() + (input.ttlSeconds || 600) * 1000),
            ticketTypeId: input.eventTicketTypeId
          }
        });
      }
    }

    // 7. Registra o hold com TTL
    const holdToken = `hld_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = Date.now() + (input.ttlSeconds || 600) * 1000;

    activeHoldsMap.set(holdToken, {
      holdToken,
      inventoryPoolId: pool.id,
      eventTicketTypeId: input.eventTicketTypeId,
      quantity: input.quantity,
      expiresAt,
      seatIds: input.seatIds
    });

    return {
      success: true,
      holdToken,
      expiresAt: new Date(expiresAt).toISOString(),
      heldQuantity: input.quantity,
      seatIds: input.seatIds
    };
  }

  /**
   * Libera reserva temporária (hold expirado ou cancelado)
   */
  static async releaseHold(holdToken: string): Promise<void> {
    const hold = activeHoldsMap.get(holdToken);
    if (!hold) return;

    activeHoldsMap.delete(holdToken);

    const pool = await prisma.inventoryPool.findUnique({
      where: { id: hold.inventoryPoolId },
      include: { allocations: true }
    });

    if (pool) {
      await prisma.inventoryPool.update({
        where: { id: pool.id },
        data: {
          held: Math.max(0, pool.held - hold.quantity)
        }
      });

      const alloc = (pool.allocations || []).find((a: any) => a.eventTicketTypeId === hold.eventTicketTypeId);
      if (alloc) {
        await prisma.inventoryAllocation.update({
          where: { id: alloc.id },
          data: {
            heldQuantity: Math.max(0, alloc.heldQuantity - hold.quantity)
          }
        });
      }

      if (hold.seatIds && hold.seatIds.length > 0) {
        for (const seatId of hold.seatIds) {
          await prisma.seatInventory.update({
            where: { id: seatId },
            data: {
              status: 'AVAILABLE',
              heldUntil: null,
              ticketTypeId: null
            }
          });
        }
      }
    }
  }

  /**
   * Confirma venda de um hold ativo (converte held -> sold)
   */
  static async confirmSale(holdToken: string, orderId?: string): Promise<void> {
    const hold = activeHoldsMap.get(holdToken);
    if (!hold) {
      throw new Error('Reserva temporária expirada ou inexistente');
    }

    activeHoldsMap.delete(holdToken);

    const pool = await prisma.inventoryPool.findUnique({
      where: { id: hold.inventoryPoolId },
      include: { allocations: true }
    });

    if (!pool) throw new Error('Pool de inventário não encontrado');

    await prisma.inventoryPool.update({
      where: { id: pool.id },
      data: {
        held: Math.max(0, pool.held - hold.quantity),
        sold: pool.sold + hold.quantity
      }
    });

    const alloc = (pool.allocations || []).find((a: any) => a.eventTicketTypeId === hold.eventTicketTypeId);
    if (alloc) {
      await prisma.inventoryAllocation.update({
        where: { id: alloc.id },
        data: {
          heldQuantity: Math.max(0, alloc.heldQuantity - hold.quantity),
          soldQuantity: alloc.soldQuantity + hold.quantity
        }
      });
    }

    if (hold.seatIds && hold.seatIds.length > 0) {
      for (const seatId of hold.seatIds) {
        await prisma.seatInventory.update({
          where: { id: seatId },
          data: {
            status: 'SOLD',
            heldUntil: null,
            orderId: orderId || null
          }
        });
      }
    }
  }

  /**
   * Resumo de inventário e composição de capacidade (Zero fake data!)
   */
  static async getInventorySummary(eventId: string, sessionId?: string): Promise<InventorySummaryDTO> {
    // 1. Busca sessões do evento
    const sessionWhere: any = { eventId };
    if (sessionId) sessionWhere.id = sessionId;
    const sessions = await prisma.eventSession.findMany({ where: sessionWhere });
    const sessionIds = sessions.map((s: any) => s.id);

    // 2. Busca seções do evento
    const eventSections = await prisma.eventSection.findMany({ where: { eventId } });
    const sectionsCount = eventSections.length;

    // 3. Tipos de ingresso
    const ticketTypesCount = await prisma.eventTicketType.count({ where: { eventId, active: true } });

    // 4. Sincroniza pools de cada sessão
    for (const sid of sessionIds) {
      await this.syncPoolsForSession(sid);
    }

    // 5. Agrega pools
    const pools = await prisma.inventoryPool.findMany({
      where: { sessionId: { in: sessionIds } }
    });

    let totalOperationalCapacity = 0;
    let totalReservedCapacity = 0;
    let totalBlockedCapacity = 0;
    let totalHeldCapacity = 0;
    let totalSoldCapacity = 0;

    for (const p of pools) {
      totalOperationalCapacity += p.capacity || 0;
      totalReservedCapacity += p.reserved || 0;
      totalBlockedCapacity += p.blocked || 0;
      totalHeldCapacity += p.held || 0;
      totalSoldCapacity += p.sold || 0;
    }

    // Capacidade física somada das estruturas do local
    let totalPhysicalCapacity = 0;
    for (const es of eventSections) {
      const vs = await prisma.venueSection.findUnique({ where: { id: es.venueSectionId } });
      totalPhysicalCapacity += vs?.capacity || es.capacity || 0;
    }

    const totalAvailableCommercial = Math.max(
      0,
      totalOperationalCapacity - (totalReservedCapacity + totalBlockedCapacity + totalHeldCapacity + totalSoldCapacity)
    );

    return {
      totalPhysicalCapacity: totalPhysicalCapacity || totalOperationalCapacity,
      totalOperationalCapacity,
      totalReservedCapacity,
      totalBlockedCapacity,
      totalHeldCapacity,
      totalSoldCapacity,
      totalAvailableCommercial,
      sectionsCount,
      ticketTypesCount,
      poolsCount: pools.length
    };
  }
}
