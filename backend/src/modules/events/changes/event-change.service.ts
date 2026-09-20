import { prisma } from '../../../core/database/prisma';
import {
  CreateEventChangeRequestInput,
  EventChangeRequestDTO,
  EventChangeRequestStatus,
  EventStatus
} from '@shared/types/index';
import { EventChangeClassificationService } from './event-change-classification.service';
import { EventChangeImpactService } from './event-change-impact.service';
import { EventChangeExecutionService } from './event-change-execution.service';
import { AuditService } from '../../audit/audit.service';

export class EventChangeService {
  /**
   * Converte registro do Prisma em DTO padronizado
   */
  private static toDTO(record: any): EventChangeRequestDTO {
    let payload = record.payloadJson;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    let impact = record.impactJson;
    if (typeof impact === 'string') {
      try {
        impact = JSON.parse(impact);
      } catch {
        impact = null;
      }
    }

    return {
      id: record.id,
      publicCode: record.publicCode,
      eventId: record.eventId,
      sessionId: record.sessionId,
      sessionName: record.sessionName,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      changeType: record.changeType,
      classification: record.classification,
      status: record.status as EventChangeRequestStatus,
      requestedBy: record.requestedBy,
      requestedByName: record.requestedByName,
      requestedAt: record.requestedAt?.toISOString ? record.requestedAt.toISOString() : record.requestedAt,
      reason: record.reason,
      businessJustification: record.businessJustification,
      changePayload: {
        field: payload.field || 'generic',
        fieldName: payload.fieldName || payload.field || 'Campo',
        before: payload.before,
        after: payload.after,
        beforeFormatted: String(payload.before ?? ''),
        afterFormatted: String(payload.after ?? '')
      },
      impact,
      approvalRequestId: record.approvalRequestId,
      approvalStatus: record.approvalStatus,
      rejectionReason: record.rejectionReason,
      executedBy: record.executedBy,
      executedAt: record.executedAt?.toISOString ? record.executedAt.toISOString() : record.executedAt,
      createdAt: record.createdAt?.toISOString ? record.createdAt.toISOString() : record.createdAt,
      updatedAt: record.updatedAt?.toISOString ? record.updatedAt.toISOString() : record.updatedAt
    };
  }

  /**
   * Cria uma nova solicitação de alteração com classificação automática e análise de impacto imediata
   */
  static async createChangeRequest(
    eventId: string,
    input: CreateEventChangeRequestInput,
    user: { id: string; name?: string }
  ): Promise<EventChangeRequestDTO> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error(`Evento ${eventId} não encontrado.`);
    }

    // 1. Classificação da Mudança
    const classification = EventChangeClassificationService.classify(
      input.changeType,
      event.status as EventStatus
    );

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const publicCode = `ALT-${randomCode}`;
    const generatedId = `alt_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 2. Análise de Impacto Imediata
    const impact = await EventChangeImpactService.evaluateImpact(
      eventId,
      input.changeType,
      input.resourceType,
      input.resourceId,
      input.changePayload,
      input.sessionId,
      generatedId
    );

    // 3. Determina status inicial
    let initialStatus: EventChangeRequestStatus = 'READY_FOR_SUBMISSION';
    if (impact.blockers.length > 0) {
      initialStatus = 'DRAFT'; // Não pode submeter com bloqueadores ativos
    }

    let sessionName = null;
    if (input.sessionId) {
      const session = await prisma.eventSession.findUnique({ where: { id: input.sessionId } });
      if (session) sessionName = session.name;
    }

    // 4. Salva no banco de dados
    const record = await (prisma as any).eventChangeRequest.create({
      data: {
        id: generatedId,
        publicCode,
        eventId,
        sessionId: input.sessionId || null,
        sessionName,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        changeType: input.changeType,
        classification,
        status: initialStatus,
        requestedBy: user.id,
        requestedByName: user.name || 'Operador DiskIngressos',
        requestedAt: new Date(),
        reason: input.reason,
        businessJustification: input.businessJustification || null,
        payloadJson: JSON.stringify(input.changePayload),
        impactJson: JSON.stringify(impact),
        approvalRequestId: null,
        approvalStatus: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_REQUEST_CREATED',
      resource: 'EventChangeRequest',
      resourceId: record.id,
      userId: user.id,
      eventId,
      details: {
        publicCode,
        eventId,
        changeType: input.changeType,
        classification,
        impactSummary: {
          tickets: impact.affectedTickets,
          orders: impact.affectedOrders,
          amount: impact.financialAmount,
          hasBlockers: impact.blockers.length > 0
        }
      }
    });

    return this.toDTO(record);
  }

  /**
   * Lista todas as solicitações de alteração do evento
   */
  static async listChangeRequests(
    eventId: string,
    filters?: { status?: string; classification?: string }
  ): Promise<EventChangeRequestDTO[]> {
    const where: any = { eventId };
    if (filters?.status) where.status = filters.status;
    if (filters?.classification) where.classification = filters.classification;

    const records = await (prisma as any).eventChangeRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' }
    });

    return (records || []).map(this.toDTO);
  }

  /**
   * Obtém detalhes de uma solicitação com verificação de STALE em tempo real
   */
  static async getChangeRequestById(id: string): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação de alteração ${id} não encontrada.`);
    }

    const dto = this.toDTO(record);

    // Se possui análise de impacto e ainda não foi executado ou rejeitado, checa se está stale
    if (dto.impact && dto.status !== 'EXECUTED' && dto.status !== 'REJECTED' && dto.status !== 'CANCELLED') {
      const staleCheck = await EventChangeImpactService.checkIsStale(
        dto.eventId,
        dto.impact,
        dto.sessionId,
        { changeType: dto.changeType, resourceType: dto.resourceType, resourceId: dto.resourceId }
      );
      dto.impact.isStale = staleCheck.isStale;
    }

    return dto;
  }

  /**
   * Recalcula a análise de impacto da solicitação
   */
  static async recalculateImpact(id: string, user: { id: string }): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação de alteração ${id} não encontrada.`);
    }

    const payload = typeof record.payloadJson === 'string' ? JSON.parse(record.payloadJson) : record.payloadJson;

    const impact = await EventChangeImpactService.evaluateImpact(
      record.eventId,
      record.changeType,
      record.resourceType,
      record.resourceId,
      payload,
      record.sessionId,
      id
    );

    const updated = await (prisma as any).eventChangeRequest.update({
      where: { id },
      data: {
        impactJson: JSON.stringify(impact),
        status: impact.blockers.length > 0 ? 'DRAFT' : 'READY_FOR_SUBMISSION',
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_IMPACT_RECALCULATED',
      resource: 'EventChangeRequest',
      resourceId: id,
      userId: user.id,
      eventId: record.eventId,
      details: { publicCode: record.publicCode, impact }
    });

    return this.toDTO(updated);
  }

  /**
   * Submete a solicitação para esteira de aprovação
   */
  static async submitForApproval(id: string, user: { id: string; name?: string }): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação ${id} não encontrada.`);
    }

    const impact = typeof record.impactJson === 'string' ? JSON.parse(record.impactJson) : record.impactJson;
    if (impact && impact.blockers && impact.blockers.length > 0) {
      throw new Error(`Submissão bloqueada: Existem ${impact.blockers.length} impeditivos técnicos que inviabilizam a alteração.`);
    }

    // Cria registro de aprovação no ApprovalEngine
    const approvalReq = await (prisma as any).approvalRequest?.create?.({
      data: {
        id: `app_chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        operation: 'EVENT_CRITICAL_CHANGE',
        title: `Aprovação de Alteração ${record.publicCode}: ${record.changeType}`,
        description: record.reason,
        eventId: record.eventId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const updated = await (prisma as any).eventChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVAL_PENDING',
        approvalRequestId: approvalReq?.id || `mock_app_${Date.now()}`,
        approvalStatus: 'PENDING',
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_SUBMITTED_FOR_APPROVAL',
      resource: 'EventChangeRequest',
      resourceId: id,
      userId: user.id,
      eventId: record.eventId,
      details: { publicCode: record.publicCode, approvalRequestId: updated.approvalRequestId }
    });

    return this.toDTO(updated);
  }

  /**
   * Aprova a solicitação
   */
  static async approve(id: string, user: { id: string; name?: string }): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação ${id} não encontrada.`);
    }

    const updated = await (prisma as any).eventChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_APPROVED',
      resource: 'EventChangeRequest',
      resourceId: id,
      userId: user.id,
      eventId: record.eventId,
      details: { publicCode: record.publicCode }
    });

    return this.toDTO(updated);
  }

  /**
   * Rejeita a solicitação com motivo obrigatório
   */
  static async reject(id: string, reason: string, user: { id: string; name?: string }): Promise<EventChangeRequestDTO> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Motivo de rejeição é obrigatório (mínimo 5 caracteres).');
    }

    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação ${id} não encontrada.`);
    }

    const updated = await (prisma as any).eventChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvalStatus: 'REJECTED',
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_REJECTED',
      resource: 'EventChangeRequest',
      resourceId: id,
      userId: user.id,
      eventId: record.eventId,
      details: { publicCode: record.publicCode, reason }
    });

    return this.toDTO(updated);
  }

  /**
   * Executa a alteração aprovada
   */
  static async execute(id: string, user: { id: string; name?: string }): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação ${id} não encontrada.`);
    }

    if (record.status !== 'APPROVED' && record.status !== 'READY_FOR_SUBMISSION') {
      if (record.classification !== 'NON_CRITICAL') {
        throw new Error(`Não é possível executar alteração com status ${record.status}. É necessária aprovação.`);
      }
    }

    await EventChangeExecutionService.executeChange(record, user);

    const updated = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    return this.toDTO(updated);
  }

  /**
   * Cancela a solicitação
   */
  static async cancel(id: string, user: { id: string; name?: string }): Promise<EventChangeRequestDTO> {
    const record = await (prisma as any).eventChangeRequest.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Solicitação ${id} não encontrada.`);
    }

    if (record.status === 'EXECUTED') {
      throw new Error('Alterações já executadas não podem ser canceladas diretamente.');
    }

    const updated = await (prisma as any).eventChangeRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_CHANGE_CANCELLED',
      resource: 'EventChangeRequest',
      resourceId: id,
      userId: user.id,
      eventId: record.eventId,
      details: { publicCode: record.publicCode }
    });

    return this.toDTO(updated);
  }
}
