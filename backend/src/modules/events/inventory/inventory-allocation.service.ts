import { prisma } from '../../../core/database/prisma';
import { InventoryAllocationType, SaveInventoryAllocationInput, InventoryAllocationDTO } from '@shared/types/index';

export class InventoryAllocationService {
  /**
   * Salva ou atualiza cota (alocação) de um tipo de ingresso em um pool
   */
  static async saveAllocation(
    poolId: string,
    input: SaveInventoryAllocationInput
  ): Promise<InventoryAllocationDTO> {
    const pool = await prisma.inventoryPool.findUnique({
      where: { id: poolId },
      include: { allocations: true }
    });

    if (!pool) {
      throw new Error('Pool de inventário não encontrado');
    }

    // Calcula a quantidade efetiva
    let allocatedQuantity = input.allocationValue;
    if (input.allocationType === 'PERCENTAGE') {
      if (input.allocationValue < 0 || input.allocationValue > 100) {
        throw new Error('Percentual de cota deve estar entre 0 e 100%');
      }
      allocatedQuantity = Math.floor((pool.capacity * input.allocationValue) / 100);
    } else if (input.allocationType === 'UNLIMITED') {
      allocatedQuantity = pool.capacity;
    }

    // Valida que quotas fixas não ultrapassem a capacidade total do setor
    const otherAllocations = (pool.allocations || []).filter(
      (a: any) => a.eventTicketTypeId !== input.eventTicketTypeId && a.allocationType === 'FIXED'
    );
    const sumFixed = otherAllocations.reduce((sum: number, a: any) => sum + a.allocatedQuantity, 0);

    if (input.allocationType === 'FIXED' && sumFixed + allocatedQuantity > pool.capacity) {
      const err: any = new Error(
        `A soma das cotas fixas (${sumFixed + allocatedQuantity}) excede a capacidade operacional do setor (${pool.capacity}).`
      );
      err.statusCode = 400;
      throw err;
    }

    const allocation = await prisma.inventoryAllocation.upsert({
      where: {
        inventoryPoolId_eventTicketTypeId: {
          inventoryPoolId: poolId,
          eventTicketTypeId: input.eventTicketTypeId
        }
      },
      update: {
        allocationType: input.allocationType,
        allocationValue: input.allocationValue,
        allocatedQuantity
      },
      create: {
        inventoryPoolId: poolId,
        eventTicketTypeId: input.eventTicketTypeId,
        allocationType: input.allocationType,
        allocationValue: input.allocationValue,
        allocatedQuantity,
        soldQuantity: 0,
        heldQuantity: 0
      }
    });

    const ett = await prisma.eventTicketType.findUnique({ where: { id: input.eventTicketTypeId } });

    return {
      id: allocation.id,
      inventoryPoolId: allocation.inventoryPoolId,
      eventTicketTypeId: allocation.eventTicketTypeId,
      ticketTypeName: ett?.name,
      ticketTypeCategory: ett?.category,
      allocationType: allocation.allocationType as InventoryAllocationType,
      allocationValue: allocation.allocationValue,
      allocatedQuantity: allocation.allocatedQuantity,
      soldQuantity: allocation.soldQuantity || 0,
      heldQuantity: allocation.heldQuantity || 0,
      availableQuantity: Math.max(0, allocation.allocatedQuantity - ((allocation.soldQuantity || 0) + (allocation.heldQuantity || 0)))
    };
  }

  /**
   * Remove uma alocação específica (volta a ser UNLIMITED compartilhado)
   */
  static async removeAllocation(poolId: string, eventTicketTypeId: string): Promise<void> {
    await prisma.inventoryAllocation.deleteMany({
      where: {
        inventoryPoolId: poolId,
        eventTicketTypeId
      }
    });
  }
}
