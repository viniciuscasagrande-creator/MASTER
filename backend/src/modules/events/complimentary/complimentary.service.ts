import { prisma } from '../../../core/database/prisma';
import {
  ComplimentaryCategoryDTO,
  ComplimentaryQuotaDTO,
  ComplimentaryRequestDTO,
  ComplimentaryGuestDTO,
  CreateComplimentaryRequestInput,
  AddComplimentaryGuestsInput
} from '@shared/types/index';

export class ComplimentaryService {
  /**
   * Categorias de cortesia (Imprensa, Artistas, Patrocinadores, Diretoria, etc.)
   */
  static async listCategories(): Promise<ComplimentaryCategoryDTO[]> {
    const categories = await prisma.complimentaryCategory.findMany({
      where: { active: true }
    });
    return categories.map((c: any) => ({
      id: c.id,
      eventId: c.eventId,
      code: c.code,
      name: c.name,
      description: c.description,
      active: c.active
    }));
  }

  static async createCategory(data: Partial<ComplimentaryCategoryDTO>): Promise<ComplimentaryCategoryDTO> {
    const created = await prisma.complimentaryCategory.create({
      data: {
        code: data.code || `CAT_${Date.now()}`,
        name: data.name!,
        description: data.description || null,
        active: true,
        eventId: data.eventId || null
      }
    });
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      active: created.active,
      eventId: created.eventId
    };
  }

  /**
   * Cotas de cortesia por evento / sessão / setor
   */
  static async getQuotas(eventId: string): Promise<ComplimentaryQuotaDTO[]> {
    const quotas = await prisma.complimentaryQuota.findMany({
      where: { eventId }
    });
    return quotas.map((q: any) => ({
      id: q.id,
      eventId: q.eventId,
      sessionId: q.sessionId,
      sectionId: q.sectionId,
      quantityLimit: q.quantityLimit,
      quantityUsed: q.quantityUsed || 0,
      quantityReserved: q.quantityReserved || 0,
      policyId: q.policyId,
      createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  public static findMatchingQuota(quotas: any[], sessionId?: string | null, sectionId?: string | null) {
    if (sessionId && sectionId) {
      const exact = quotas.find((q: any) => q.sessionId === sessionId && q.sectionId === sectionId);
      if (exact) return exact;
    }
    if (sectionId) {
      const secOnly = quotas.find((q: any) => q.sectionId === sectionId && !q.sessionId);
      if (secOnly) return secOnly;
    }
    if (sessionId) {
      const sesOnly = quotas.find((q: any) => q.sessionId === sessionId && !q.sectionId);
      if (sesOnly) return sesOnly;
    }
    return quotas.find((q: any) => !q.sessionId && !q.sectionId) || null;
  }

  static async setQuota(
    eventId: string,
    data: { sessionId?: string; sectionId?: string; quantityLimit: number; policyId?: string }
  ): Promise<ComplimentaryQuotaDTO> {
    // Valida capacidade do pool de inventário se sessão e setor fornecidos
    if (data.sessionId && data.sectionId) {
      const pool = await prisma.inventoryPool.findUnique({
        where: {
          sessionId_eventSectionId: {
            sessionId: data.sessionId,
            eventSectionId: data.sectionId
          }
        }
      });
      if (pool && data.quantityLimit > pool.capacity) {
        throw new Error(`Cota de cortesia (${data.quantityLimit}) não pode exceder capacidade física/operacional do setor (${pool.capacity})`);
      }
    }

    const quotas = await prisma.complimentaryQuota.findMany({ where: { eventId } });
    const existing = quotas.find(
      (q: any) =>
        (data.sessionId ? q.sessionId === data.sessionId : !q.sessionId) &&
        (data.sectionId ? q.sectionId === data.sectionId : !q.sectionId)
    );

    let record: any;
    if (existing) {
      record = await prisma.complimentaryQuota.update({
        where: { id: existing.id },
        data: {
          quantityLimit: data.quantityLimit,
          policyId: data.policyId || existing.policyId
        }
      });
    } else {
      record = await prisma.complimentaryQuota.create({
        data: {
          eventId,
          sessionId: data.sessionId || null,
          sectionId: data.sectionId || null,
          quantityLimit: data.quantityLimit,
          policyId: data.policyId || null
        }
      });
    }

    return {
      id: record.id,
      eventId: record.eventId,
      sessionId: record.sessionId,
      sectionId: record.sectionId,
      quantityLimit: record.quantityLimit,
      quantityUsed: record.quantityUsed || 0,
      quantityReserved: record.quantityReserved || 0,
      policyId: record.policyId,
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Listagem de solicitações de cortesias com enriquecimento de dados
   */
  static async listRequests(eventId: string, status?: string): Promise<ComplimentaryRequestDTO[]> {
    const list = await prisma.complimentaryRequest.findMany({
      where: {
        eventId,
        status: status ? status : undefined
      },
      include: {
        guests: true
      }
    });

    const sessions = await prisma.eventSession.findMany({ where: { eventId } });
    const sections = await prisma.eventSection.findMany({ where: { eventId } });
    const categories = await prisma.complimentaryCategory.findMany();

    return list.map((r: any) => {
      const session = sessions.find((s: any) => s.id === r.sessionId);
      const section = sections.find((sec: any) => sec.id === r.sectionId);
      const cat = categories.find((c: any) => c.id === r.categoryId);

      return {
        id: r.id,
        code: r.code,
        eventId: r.eventId,
        sessionId: r.sessionId,
        sessionName: session?.name || 'Sessão',
        sectionId: r.sectionId,
        sectionName: section?.name || 'Setor',
        categoryId: r.categoryId,
        categoryName: cat?.name || 'Categoria',
        quantity: r.quantity,
        quantityIssued: r.quantityIssued || 0,
        reason: r.reason,
        requesterId: r.requesterId,
        requesterName: r.requesterName,
        status: r.status,
        approvalRequestId: r.approvalRequestId,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : null,
        rejectionReason: r.rejectionReason,
        guests: (r.guests || []).map((g: any) => ({
          id: g.id,
          requestId: g.requestId,
          name: g.name,
          email: g.email,
          document: g.document,
          phone: g.phone,
          notes: g.notes,
          ticketId: g.ticketId,
          issued: g.issued,
          issuedAt: g.issuedAt ? new Date(g.issuedAt).toISOString() : null
        })),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  /**
   * Criação de solicitação com reserva de cota e garantia anti-overselling
   */
  static async createRequest(
    eventId: string,
    input: CreateComplimentaryRequestInput,
    requesterId: string,
    requesterName: string
  ): Promise<ComplimentaryRequestDTO> {
    // 1. Verifica pool de inventário
    const pool = await prisma.inventoryPool.findUnique({
      where: {
        sessionId_eventSectionId: {
          sessionId: input.sessionId,
          eventSectionId: input.sectionId
        }
      }
    });

    if (!pool) {
      throw new Error('Setor não configurado no inventário para esta sessão');
    }

    const poolAvailable = pool.capacity - (pool.reserved + pool.blocked + pool.held + pool.sold);
    if (poolAvailable < input.quantity) {
      const err: any = new Error(
        `Capacidade insuficiente no setor para emissão de cortesia. Disponível: ${Math.max(0, poolAvailable)}, Solicitado: ${input.quantity}`
      );
      err.statusCode = 409;
      throw err;
    }

    // 2. Verifica cota de cortesia
    const quotas = await prisma.complimentaryQuota.findMany({ where: { eventId } });
    const matchedQuota = this.findMatchingQuota(quotas, input.sessionId, input.sectionId);

    if (matchedQuota) {
      const remainingQuota = matchedQuota.quantityLimit - (matchedQuota.quantityUsed + matchedQuota.quantityReserved);
      if (remainingQuota < input.quantity) {
        const err: any = new Error(
          `Cota de cortesias excedida. Limite restante na cota: ${Math.max(0, remainingQuota)}, Solicitado: ${input.quantity}`
        );
        err.statusCode = 409;
        throw err;
      }

      // Reserva a quantidade na cota
      await prisma.complimentaryQuota.update({
        where: { id: matchedQuota.id },
        data: { quantityReserved: matchedQuota.quantityReserved + input.quantity }
      });
    }

    // 3. Cria a solicitação
    const code = `SOL-${Math.floor(100000 + Math.random() * 900000)}`;
    const reqRecord = await prisma.complimentaryRequest.create({
      data: {
        code,
        eventId,
        sessionId: input.sessionId,
        sectionId: input.sectionId,
        categoryId: input.categoryId,
        quantity: input.quantity,
        reason: input.reason,
        requesterId,
        requesterName,
        status: 'SUBMITTED'
      }
    });

    // 4. Cria convidados iniciais se enviados
    if (input.guests && input.guests.length > 0) {
      for (const guest of input.guests) {
        await prisma.complimentaryGuest.create({
          data: {
            requestId: reqRecord.id,
            name: guest.name,
            email: guest.email || null,
            document: guest.document || null,
            phone: guest.phone || null,
            notes: guest.notes || null
          }
        });
      }
    }

    const all = await this.listRequests(eventId);
    return all.find(r => r.id === reqRecord.id)!;
  }

  /**
   * Adiciona convidados a uma solicitação já existente
   */
  static async addGuests(requestId: string, input: AddComplimentaryGuestsInput): Promise<ComplimentaryGuestDTO[]> {
    const request = await prisma.complimentaryRequest.findUnique({
      where: { id: requestId },
      include: { guests: true }
    });
    if (!request) throw new Error('Solicitação de cortesia não encontrada');

    const currentCount = (request.guests || []).length;
    if (currentCount + input.guests.length > request.quantity) {
      throw new Error(`Quantidade de convidados (${currentCount + input.guests.length}) excede a quantidade aprovada na solicitação (${request.quantity})`);
    }

    const createdList: ComplimentaryGuestDTO[] = [];
    for (const g of input.guests) {
      const created = await prisma.complimentaryGuest.create({
        data: {
          requestId,
          name: g.name,
          email: g.email || null,
          document: g.document || null,
          phone: g.phone || null,
          notes: g.notes || null
        }
      });
      createdList.push({
        id: created.id,
        requestId: created.requestId,
        name: created.name,
        email: created.email,
        document: created.document,
        phone: created.phone,
        notes: created.notes,
        ticketId: created.ticketId,
        issued: created.issued,
        issuedAt: created.issuedAt ? new Date(created.issuedAt).toISOString() : null
      });
    }

    return createdList;
  }

  /**
   * Aprovação de solicitação de cortesia
   */
  static async approveRequest(requestId: string, approverId: string, approverName: string): Promise<ComplimentaryRequestDTO> {
    const request = await prisma.complimentaryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Solicitação de cortesia não encontrada');

    if (request.status !== 'SUBMITTED' && request.status !== 'APPROVAL_PENDING') {
      throw new Error(`Solicitação não pode ser aprovada no status atual (${request.status})`);
    }

    await prisma.complimentaryRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: approverName,
        approvedAt: new Date()
      }
    });

    const all = await this.listRequests(request.eventId);
    return all.find(r => r.id === requestId)!;
  }

  /**
   * Rejeição de solicitação de cortesia (libera cota reservada)
   */
  static async rejectRequest(requestId: string, reason: string): Promise<ComplimentaryRequestDTO> {
    const request = await prisma.complimentaryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Solicitação de cortesia não encontrada');

    if (request.status === 'ISSUED' || request.status === 'CANCELLED') {
      throw new Error(`Solicitação não pode ser rejeitada no status atual (${request.status})`);
    }

    // Libera cota reservada
    const quotas = await prisma.complimentaryQuota.findMany({ where: { eventId: request.eventId } });
    const matchedQuota = this.findMatchingQuota(quotas, request.sessionId, request.sectionId);

    if (matchedQuota) {
      const newReserved = Math.max(0, matchedQuota.quantityReserved - request.quantity);
      await prisma.complimentaryQuota.update({
        where: { id: matchedQuota.id },
        data: { quantityReserved: newReserved }
      });
    }

    await prisma.complimentaryRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    const all = await this.listRequests(request.eventId);
    return all.find(r => r.id === requestId)!;
  }

  /**
   * Emissão real dos ingressos de cortesia:
   * Consome diretamente da capacidade vendida do Pool Oficial de Inventário!
   */
  static async issueTickets(requestId: string, guestIds?: string[]): Promise<ComplimentaryRequestDTO> {
    const request = await prisma.complimentaryRequest.findUnique({
      where: { id: requestId },
      include: { guests: true }
    });
    if (!request) throw new Error('Solicitação de cortesia não encontrada');

    if (request.status !== 'APPROVED' && request.status !== 'PARTIALLY_ISSUED') {
      throw new Error(`Solicitação precisa estar aprovada para emissão. Status atual: ${request.status}`);
    }

    // 1. Convidados elegíveis para emissão
    let targetGuests = (request.guests || []).filter((g: any) => !g.issued);
    if (guestIds && guestIds.length > 0) {
      targetGuests = targetGuests.filter((g: any) => guestIds.includes(g.id));
    }

    const issueCount = targetGuests.length > 0 ? targetGuests.length : Math.max(0, request.quantity - request.quantityIssued);
    if (issueCount <= 0) {
      throw new Error('Não há ingressos pendentes de emissão nesta solicitação');
    }

    // 2. Consome do Pool de Inventário (garantia de estoque único)
    const pool = await prisma.inventoryPool.findUnique({
      where: {
        sessionId_eventSectionId: {
          sessionId: request.sessionId,
          eventSectionId: request.sectionId
        }
      }
    });

    if (!pool) {
      throw new Error('Pool de inventário não encontrado para este setor e sessão');
    }

    const poolAvailable = pool.capacity - (pool.reserved + pool.blocked + pool.held + pool.sold);
    if (poolAvailable < issueCount) {
      const err: any = new Error(`Inventário insuficiente no momento da emissão. Disponível: ${poolAvailable}, Necessário: ${issueCount}`);
      err.statusCode = 409;
      throw err;
    }

    // Atualiza o pool incrementando 'sold'
    await prisma.inventoryPool.update({
      where: { id: pool.id },
      data: {
        sold: pool.sold + issueCount
      }
    });

    // 3. Marca convidados como emitidos e gera ingressos cortesia
    const now = new Date();
    for (const g of targetGuests) {
      const ticketId = `tkt_cortesia_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await prisma.complimentaryGuest.update({
        where: { id: g.id },
        data: {
          issued: true,
          issuedAt: now,
          ticketId
        }
      });
    }

    // 4. Atualiza cota (move de reservado para usado)
    const quotas = await prisma.complimentaryQuota.findMany({ where: { eventId: request.eventId } });
    const matchedQuota = this.findMatchingQuota(quotas, request.sessionId, request.sectionId);

    if (matchedQuota) {
      await prisma.complimentaryQuota.update({
        where: { id: matchedQuota.id },
        data: {
          quantityReserved: Math.max(0, matchedQuota.quantityReserved - issueCount),
          quantityUsed: matchedQuota.quantityUsed + issueCount
        }
      });
    }

    // 5. Atualiza a solicitação
    const newQuantityIssued = request.quantityIssued + issueCount;
    const finalStatus = newQuantityIssued >= request.quantity ? 'ISSUED' : 'PARTIALLY_ISSUED';

    await prisma.complimentaryRequest.update({
      where: { id: requestId },
      data: {
        quantityIssued: newQuantityIssued,
        status: finalStatus
      }
    });

    const all = await this.listRequests(request.eventId);
    return all.find(r => r.id === requestId)!;
  }

  /**
   * Cancelamento de solicitação de cortesia (estorna pool e cotas)
   */
  static async cancelRequest(requestId: string, reason: string): Promise<ComplimentaryRequestDTO> {
    const request = await prisma.complimentaryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Solicitação de cortesia não encontrada');

    if (request.status === 'CANCELLED') {
      throw new Error('Solicitação já se encontra cancelada');
    }

    // 1. Estorna pool se algum ingresso já foi emitido
    if (request.quantityIssued > 0) {
      const pool = await prisma.inventoryPool.findUnique({
        where: {
          sessionId_eventSectionId: {
            sessionId: request.sessionId,
            eventSectionId: request.sectionId
          }
        }
      });
      if (pool) {
        await prisma.inventoryPool.update({
          where: { id: pool.id },
          data: {
            sold: Math.max(0, pool.sold - request.quantityIssued)
          }
        });
      }
    }

    // 2. Estorna cota
    const quotas = await prisma.complimentaryQuota.findMany({ where: { eventId: request.eventId } });
    const matchedQuota = this.findMatchingQuota(quotas, request.sessionId, request.sectionId);

    if (matchedQuota) {
      const unissued = request.quantity - request.quantityIssued;
      await prisma.complimentaryQuota.update({
        where: { id: matchedQuota.id },
        data: {
          quantityUsed: Math.max(0, matchedQuota.quantityUsed - request.quantityIssued),
          quantityReserved: Math.max(0, matchedQuota.quantityReserved - unissued)
        }
      });
    }

    await prisma.complimentaryRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason
      }
    });

    const all = await this.listRequests(request.eventId);
    return all.find(r => r.id === requestId)!;
  }
}
