import { prisma } from '../../../core/database/prisma';
import {
  SalesChannelDTO,
  EventSalesChannelDTO,
  ConfigureEventSalesChannelInput,
  SaveChannelAllocationInput,
  ChannelAllocationDTO,
  SalesPointDTO,
  CreateSalesPointInput,
  SalesPartnerDTO
} from '@shared/types/index';

export class SalesChannelService {
  /**
   * Lista canais de venda disponíveis globalmente ou para o produtor
   */
  static async listAvailableChannels(): Promise<SalesChannelDTO[]> {
    const channels = await prisma.salesChannel.findMany({
      where: { active: true }
    });

    return channels.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      scope: c.scope,
      producerId: c.producerId,
      active: c.active,
      configuration: c.configuration,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Lista os canais configurados especificamente para o evento
   */
  static async getEventChannels(eventId: string): Promise<EventSalesChannelDTO[]> {
    const list = await prisma.eventSalesChannel.findMany({
      where: { eventId },
      include: {
        salesChannel: true,
        allocations: true,
        sessions: true,
        sections: true,
        ticketTypes: true
      }
    });

    // Se nenhum canal configurado, inicializa com os canais padrão habilitados (ex: Site DiskIngressos)
    if (list.length === 0) {
      const allChannels = await prisma.salesChannel.findMany({ where: { active: true } });
      for (const channel of allChannels) {
        const created = await prisma.eventSalesChannel.create({
          data: {
            eventId,
            salesChannelId: channel.id,
            enabled: channel.code === 'ONLINE_WEB' || channel.code === 'BOX_OFFICE'
          }
        });
        list.push({
          ...created,
          salesChannel: channel,
          allocations: [],
          sessions: [],
          sections: [],
          ticketTypes: []
        });
      }
    }

    // Carrega nomes de setores para as alocações
    const pools = await prisma.inventoryPool.findMany();
    const sections = await prisma.eventSection.findMany({ where: { eventId } });

    return list.map((esc: any) => {
      const channelDTO: SalesChannelDTO | undefined = esc.salesChannel
        ? {
            id: esc.salesChannel.id,
            code: esc.salesChannel.code,
            name: esc.salesChannel.name,
            type: esc.salesChannel.type,
            scope: esc.salesChannel.scope,
            producerId: esc.salesChannel.producerId,
            active: esc.salesChannel.active,
            configuration: esc.salesChannel.configuration,
            createdAt: esc.salesChannel.createdAt ? new Date(esc.salesChannel.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: esc.salesChannel.updatedAt ? new Date(esc.salesChannel.updatedAt).toISOString() : new Date().toISOString()
          }
        : undefined;

      const allocationsDTO: ChannelAllocationDTO[] = (esc.allocations || []).map((ca: any) => {
        const pool = pools.find((p: any) => p.id === ca.inventoryPoolId);
        const section = pool ? sections.find((s: any) => s.id === pool.eventSectionId) : null;
        return {
          id: ca.id,
          eventSalesChannelId: ca.eventSalesChannelId,
          inventoryPoolId: ca.inventoryPoolId,
          poolSectionName: section?.name || 'Setor do Pool',
          quantityLimit: ca.quantityLimit,
          quantityConsumed: ca.quantityConsumed || 0,
          startsAt: ca.startsAt ? new Date(ca.startsAt).toISOString() : null,
          endsAt: ca.endsAt ? new Date(ca.endsAt).toISOString() : null,
          createdAt: ca.createdAt ? new Date(ca.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: ca.updatedAt ? new Date(ca.updatedAt).toISOString() : new Date().toISOString()
        };
      });

      return {
        id: esc.id,
        eventId: esc.eventId,
        salesChannelId: esc.salesChannelId,
        salesChannel: channelDTO,
        enabled: esc.enabled,
        salesStartAt: esc.salesStartAt ? new Date(esc.salesStartAt).toISOString() : null,
        salesEndAt: esc.salesEndAt ? new Date(esc.salesEndAt).toISOString() : null,
        configuration: esc.configuration,
        sessionIds: (esc.sessions || []).map((s: any) => s.sessionId),
        sectionIds: (esc.sections || []).map((s: any) => s.eventSectionId),
        ticketTypeIds: (esc.ticketTypes || []).map((t: any) => t.eventTicketTypeId),
        batchIds: esc.batchIds || [],
        allocations: allocationsDTO,
        createdBy: esc.createdBy,
        createdAt: esc.createdAt ? new Date(esc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: esc.updatedAt ? new Date(esc.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  /**
   * Configura o escopo de um canal de venda no evento (sessões, setores, modalidades de ingresso)
   */
  static async configureChannel(eventId: string, input: ConfigureEventSalesChannelInput): Promise<EventSalesChannelDTO> {
    const existing = await prisma.eventSalesChannel.findFirst({
      where: {
        eventId,
        salesChannelId: input.salesChannelId
      }
    });

    let escRecord: any;
    if (existing) {
      escRecord = await prisma.eventSalesChannel.update({
        where: { id: existing.id },
        data: {
          enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
          salesStartAt: input.salesStartAt ? new Date(input.salesStartAt) : existing.salesStartAt,
          salesEndAt: input.salesEndAt ? new Date(input.salesEndAt) : existing.salesEndAt,
          configuration: input.configuration || existing.configuration
        }
      });
    } else {
      escRecord = await prisma.eventSalesChannel.create({
        data: {
          eventId,
          salesChannelId: input.salesChannelId,
          enabled: input.enabled !== undefined ? input.enabled : true,
          salesStartAt: input.salesStartAt ? new Date(input.salesStartAt) : null,
          salesEndAt: input.salesEndAt ? new Date(input.salesEndAt) : null,
          configuration: input.configuration || {}
        }
      });
    }

    // Atualiza vínculos de sessões
    if (input.sessionIds !== undefined) {
      await prisma.eventSalesChannelSession.deleteMany({
        where: { eventSalesChannelId: escRecord.id }
      });
      for (const sId of input.sessionIds) {
        await prisma.eventSalesChannelSession.create({
          data: {
            eventSalesChannelId: escRecord.id,
            sessionId: sId
          }
        });
      }
    }

    // Atualiza vínculos de setores
    if (input.sectionIds !== undefined) {
      await prisma.eventSalesChannelSection.deleteMany({
        where: { eventSalesChannelId: escRecord.id }
      });
      for (const secId of input.sectionIds) {
        await prisma.eventSalesChannelSection.create({
          data: {
            eventSalesChannelId: escRecord.id,
            eventSectionId: secId
          }
        });
      }
    }

    // Atualiza vínculos de tipos de ingresso
    if (input.ticketTypeIds !== undefined) {
      await prisma.eventSalesChannelTicketType.deleteMany({
        where: { eventSalesChannelId: escRecord.id }
      });
      for (const ttId of input.ticketTypeIds) {
        await prisma.eventSalesChannelTicketType.create({
          data: {
            eventSalesChannelId: escRecord.id,
            eventTicketTypeId: ttId
          }
        });
      }
    }

    const allChannels = await this.getEventChannels(eventId);
    const updated = allChannels.find(c => c.id === escRecord.id);
    if (!updated) throw new Error('Falha ao recuperar canal atualizado');
    return updated;
  }

  /**
   * Habilita ou desabilita um canal no evento
   */
  static async toggleChannel(eventId: string, salesChannelId: string, enabled: boolean): Promise<EventSalesChannelDTO> {
    const existing = await prisma.eventSalesChannel.findFirst({
      where: { eventId, salesChannelId }
    });

    if (!existing) {
      return this.configureChannel(eventId, { salesChannelId, enabled });
    }

    await prisma.eventSalesChannel.update({
      where: { id: existing.id },
      data: { enabled }
    });

    const all = await this.getEventChannels(eventId);
    return all.find(c => c.id === existing.id)!;
  }

  /**
   * Define cota/alocação de canal em um Pool existente
   * Invariante arquitetural: O canal NÃO cria um estoque paralelo.
   */
  static async setChannelAllocation(
    eventId: string,
    eventSalesChannelId: string,
    input: SaveChannelAllocationInput
  ): Promise<ChannelAllocationDTO> {
    // 1. Valida existência do canal no evento
    const esc = await prisma.eventSalesChannel.findUnique({
      where: { id: eventSalesChannelId }
    });
    if (!esc || esc.eventId !== eventId) {
      throw new Error('Configuração de canal de venda não encontrada para este evento');
    }

    // 2. Valida pool de inventário
    const pool = await prisma.inventoryPool.findUnique({
      where: { id: input.inventoryPoolId }
    });
    if (!pool) {
      throw new Error('Pool de inventário não encontrado');
    }

    if (input.quantityLimit > pool.capacity) {
      throw new Error(
        `Alocação de canal (${input.quantityLimit}) não pode exceder a capacidade total do setor (${pool.capacity})`
      );
    }

    // 3. Upsert na tabela de alocação de canal
    const existing = await prisma.channelAllocation.findUnique({
      where: {
        eventSalesChannelId_inventoryPoolId: {
          eventSalesChannelId,
          inventoryPoolId: input.inventoryPoolId
        }
      }
    });

    let record: any;
    if (existing) {
      record = await prisma.channelAllocation.update({
        where: { id: existing.id },
        data: {
          quantityLimit: input.quantityLimit,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null
        }
      });
    } else {
      record = await prisma.channelAllocation.create({
        data: {
          eventSalesChannelId,
          inventoryPoolId: input.inventoryPoolId,
          quantityLimit: input.quantityLimit,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null
        }
      });
    }

    const section = await prisma.eventSection.findUnique({ where: { id: pool.eventSectionId } });

    return {
      id: record.id,
      eventSalesChannelId: record.eventSalesChannelId,
      inventoryPoolId: record.inventoryPoolId,
      poolSectionName: section?.name || 'Setor do Pool',
      quantityLimit: record.quantityLimit,
      quantityConsumed: record.quantityConsumed || 0,
      startsAt: record.startsAt ? new Date(record.startsAt).toISOString() : null,
      endsAt: record.endsAt ? new Date(record.endsAt).toISOString() : null,
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Pontos de venda físicos (Bilheteria / PDV)
   */
  static async listSalesPoints(venueId?: string): Promise<SalesPointDTO[]> {
    const list = await prisma.salesPoint.findMany({
      where: venueId ? { venueId } : undefined
    });

    const venues = await prisma.venue.findMany();

    return list.map((sp: any) => {
      const v = venues.find((x: any) => x.id === sp.venueId);
      return {
        id: sp.id,
        producerId: sp.producerId,
        name: sp.name,
        type: sp.type,
        venueId: sp.venueId,
        venueName: v?.name || null,
        address: sp.address,
        active: sp.active,
        terminalsCount: sp.terminalsCount || 0,
        createdAt: sp.createdAt ? new Date(sp.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: sp.updatedAt ? new Date(sp.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  static async createSalesPoint(input: CreateSalesPointInput): Promise<SalesPointDTO> {
    const created = await prisma.salesPoint.create({
      data: {
        producerId: input.producerId || null,
        name: input.name,
        type: input.type,
        venueId: input.venueId || null,
        address: input.address || null,
        active: input.active !== undefined ? input.active : true
      }
    });

    return {
      id: created.id,
      producerId: created.producerId,
      name: created.name,
      type: created.type,
      venueId: created.venueId,
      venueName: null,
      address: created.address,
      active: created.active,
      terminalsCount: 0,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Parceiros e Afiliados comerciais
   */
  static async listSalesPartners(): Promise<SalesPartnerDTO[]> {
    const partners = await prisma.salesPartner.findMany();
    return partners.map((p: any) => ({
      id: p.id,
      producerId: p.producerId,
      name: p.name,
      document: p.document,
      type: p.type,
      status: p.status,
      email: p.email,
      phone: p.phone,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  static async createSalesPartner(input: Partial<SalesPartnerDTO>): Promise<SalesPartnerDTO> {
    const created = await prisma.salesPartner.create({
      data: {
        producerId: input.producerId || null,
        name: input.name!,
        document: input.document || '00.000.000/0001-00',
        type: input.type || 'PROMOTER',
        status: input.status || 'ACTIVE',
        email: input.email || null,
        phone: input.phone || null
      }
    });

    return {
      id: created.id,
      producerId: created.producerId,
      name: created.name,
      document: created.document,
      type: created.type,
      status: created.status,
      email: created.email,
      phone: created.phone,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
