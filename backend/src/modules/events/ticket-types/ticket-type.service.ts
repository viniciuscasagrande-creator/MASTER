import { prisma } from '../../../core/database/prisma';
import { CreateEventTicketTypeInput, UpdateEventTicketTypeInput, EventTicketTypeDTO, TicketTypeDTO } from '@shared/types/index';

export class TicketTypeService {
  /**
   * Retorna o catálogo base global de tipos de ingresso
   */
  static async listCatalog(category?: string): Promise<TicketTypeDTO[]> {
    const where: any = { active: true };
    if (category) {
      where.category = category;
    }
    return prisma.ticketType.findMany({ where }) as Promise<TicketTypeDTO[]>;
  }

  /**
   * Lista os tipos de ingresso configurados para o evento especificado
   */
  static async listEventTicketTypes(eventId: string): Promise<EventTicketTypeDTO[]> {
    const list = await prisma.eventTicketType.findMany({
      where: { eventId },
      include: {
        sections: true,
        sessions: true,
        benefits: true,
        allocations: true
      }
    });

    return list.map((item: any) => ({
      id: item.id,
      eventId: item.eventId,
      ticketTypeId: item.ticketTypeId,
      name: item.name,
      code: item.code,
      category: item.category,
      description: item.description,
      halfPriceLawCompliance: item.halfPriceLawCompliance ?? false,
      requiresDocument: item.requiresDocument ?? false,
      documentType: item.documentType,
      requiresCode: item.requiresCode ?? false,
      requiresBenefit: item.requiresBenefit ?? false,
      benefitDescription: item.benefitDescription,
      active: item.active ?? true,
      sortOrder: item.sortOrder ?? 0,
      minPerOrder: item.minPerOrder ?? 1,
      maxPerOrder: item.maxPerOrder ?? 6,
      sections: (item.sections || []).map((s: any) => ({
        eventSectionId: s.eventSectionId,
        sectionName: s.eventSection?.name || 'Setor'
      })),
      sessions: (item.sessions || []).map((s: any) => ({
        sessionId: s.sessionId,
        sessionName: s.session?.name || 'Sessão'
      })),
      benefits: item.benefits || [],
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Busca um tipo de ingresso por ID
   */
  static async getEventTicketType(id: string): Promise<EventTicketTypeDTO | null> {
    const item = await prisma.eventTicketType.findUnique({
      where: { id },
      include: {
        sections: true,
        sessions: true,
        benefits: true
      }
    });

    if (!item) return null;

    return {
      id: item.id,
      eventId: item.eventId,
      ticketTypeId: item.ticketTypeId,
      name: item.name,
      code: item.code,
      category: item.category,
      description: item.description,
      halfPriceLawCompliance: item.halfPriceLawCompliance ?? false,
      requiresDocument: item.requiresDocument ?? false,
      documentType: item.documentType,
      requiresCode: item.requiresCode ?? false,
      requiresBenefit: item.requiresBenefit ?? false,
      benefitDescription: item.benefitDescription,
      active: item.active ?? true,
      sortOrder: item.sortOrder ?? 0,
      minPerOrder: item.minPerOrder ?? 1,
      maxPerOrder: item.maxPerOrder ?? 6,
      sections: (item.sections || []).map((s: any) => ({
        eventSectionId: s.eventSectionId,
        sectionName: s.eventSection?.name
      })),
      sessions: (item.sessions || []).map((s: any) => ({
        sessionId: s.sessionId,
        sessionName: s.session?.name
      })),
      benefits: item.benefits || [],
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Cria um novo tipo de ingresso para o evento
   */
  static async createEventTicketType(eventId: string, input: CreateEventTicketTypeInput): Promise<EventTicketTypeDTO> {
    // Gera código se não fornecido
    const code = input.code || input.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);

    const created = await prisma.eventTicketType.create({
      data: {
        eventId,
        ticketTypeId: input.ticketTypeId,
        name: input.name,
        code,
        category: input.category,
        description: input.description,
        halfPriceLawCompliance: input.halfPriceLawCompliance ?? false,
        requiresDocument: input.requiresDocument ?? false,
        documentType: input.documentType,
        requiresCode: input.requiresCode ?? false,
        requiresBenefit: input.requiresBenefit ?? false,
        benefitDescription: input.benefitDescription,
        minPerOrder: input.minPerOrder ?? 1,
        maxPerOrder: input.maxPerOrder ?? 6,
        active: true
      }
    });

    // Vincula setores
    if (input.sectionIds && input.sectionIds.length > 0) {
      await prisma.eventTicketTypeSection.createMany({
        data: input.sectionIds.map(secId => ({
          eventTicketTypeId: created.id,
          eventSectionId: secId
        }))
      });
    }

    // Vincula sessões
    if (input.sessionIds && input.sessionIds.length > 0) {
      await prisma.eventTicketTypeSession.createMany({
        data: input.sessionIds.map(sesId => ({
          eventTicketTypeId: created.id,
          sessionId: sesId
        }))
      });
    }

    // Vincula benefícios
    if (input.benefits && input.benefits.length > 0) {
      for (const ben of input.benefits) {
        await prisma.eventTicketTypeBenefit.create({
          data: {
            eventTicketTypeId: created.id,
            name: ben.name,
            description: ben.description
          }
        });
      }
    }

    const full = await this.getEventTicketType(created.id);
    return full!;
  }

  /**
   * Atualiza um tipo de ingresso existente
   */
  static async updateEventTicketType(id: string, input: UpdateEventTicketTypeInput): Promise<EventTicketTypeDTO> {
    const existing = await prisma.eventTicketType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Tipo de ingresso não encontrado');
    }

    await prisma.eventTicketType.update({
      where: { id },
      data: {
        name: input.name,
        code: input.code,
        category: input.category,
        description: input.description,
        halfPriceLawCompliance: input.halfPriceLawCompliance,
        requiresDocument: input.requiresDocument,
        documentType: input.documentType,
        requiresCode: input.requiresCode,
        requiresBenefit: input.requiresBenefit,
        benefitDescription: input.benefitDescription,
        minPerOrder: input.minPerOrder,
        maxPerOrder: input.maxPerOrder,
        active: input.active
      }
    });

    // Atualiza setores se especificado
    if (input.sectionIds !== undefined) {
      await prisma.eventTicketTypeSection.deleteMany({ where: { eventTicketTypeId: id } });
      if (input.sectionIds.length > 0) {
        await prisma.eventTicketTypeSection.createMany({
          data: input.sectionIds.map(secId => ({
            eventTicketTypeId: id,
            eventSectionId: secId
          }))
        });
      }
    }

    // Atualiza sessões se especificado
    if (input.sessionIds !== undefined) {
      await prisma.eventTicketTypeSession.deleteMany({ where: { eventTicketTypeId: id } });
      if (input.sessionIds.length > 0) {
        await prisma.eventTicketTypeSession.createMany({
          data: input.sessionIds.map(sesId => ({
            eventTicketTypeId: id,
            sessionId: sesId
          }))
        });
      }
    }

    // Atualiza benefícios se especificado
    if (input.benefits !== undefined) {
      await prisma.eventTicketTypeBenefit.deleteMany({ where: { eventTicketTypeId: id } });
      for (const ben of input.benefits) {
        await prisma.eventTicketTypeBenefit.create({
          data: {
            eventTicketTypeId: id,
            name: ben.name,
            description: ben.description
          }
        });
      }
    }

    const full = await this.getEventTicketType(id);
    return full!;
  }

  /**
   * Exclui um tipo de ingresso se não houver vendas atreladas
   */
  static async deleteEventTicketType(id: string): Promise<void> {
    const allocations = await prisma.inventoryAllocation.findMany({
      where: { eventTicketTypeId: id }
    });

    const hasSales = allocations.some((a: any) => (a.soldQuantity || 0) > 0);
    if (hasSales) {
      const err: any = new Error('Não é possível excluir um tipo de ingresso com ingressos já vendidos. Recomendamos pausar ou desativar.');
      err.statusCode = 409;
      throw err;
    }

    await prisma.eventTicketTypeSection.deleteMany({ where: { eventTicketTypeId: id } });
    await prisma.eventTicketTypeSession.deleteMany({ where: { eventTicketTypeId: id } });
    await prisma.eventTicketTypeBenefit.deleteMany({ where: { eventTicketTypeId: id } });
    await prisma.inventoryAllocation.deleteMany({ where: { eventTicketTypeId: id } });
    await prisma.eventTicketType.delete({ where: { id } });
  }
}
