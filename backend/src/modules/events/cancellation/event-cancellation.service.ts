import { prisma } from '../../../core/database/prisma';
import { EventCancellationRequestDTO } from '@shared/types/index';
import { CancellationImpactService } from './cancellation-impact.service';
import { AuditService } from '../../audit/audit.service';
import { OperationTimelineService } from '../operation/timeline/operation-timeline.service';

export class EventCancellationService {
  /**
   * Submits a formal event cancellation request with calculated impact.
   */
  public static async requestCancellation(params: {
    eventId: string;
    reason: string;
    cancellationCategory: 'FORCE_MAJEURE' | 'ORGANIZER_DECISION' | 'WEATHER' | 'SECURITY' | 'LEGAL' | 'OTHER';
    refundPolicyNotes: string;
    notifyCustomers?: boolean;
    requestedBy: string;
    requestedByName: string;
    immediateExecuteIfPermitted?: boolean;
  }): Promise<EventCancellationRequestDTO> {
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) throw new Error('Evento não encontrado.');
    if (event.status === 'CANCELLED') throw new Error('O evento já se encontra cancelado.');
    if (event.status === 'ARCHIVED') throw new Error('Eventos arquivados não podem ser cancelados.');

    // 1. Calculate impact
    const impact = await CancellationImpactService.calculateImpact({ eventId: params.eventId });

    // 2. Create Request record
    const request = await prisma.eventCancellationRequest.create({
      data: {
        eventId: params.eventId,
        sessionId: null,
        isPartialSession: false,
        reason: params.reason,
        cancellationCategory: params.cancellationCategory,
        impactData: JSON.stringify(impact),
        requestedBy: params.requestedBy,
        requestedByName: params.requestedByName,
        requestedAt: new Date(),
        status: params.immediateExecuteIfPermitted ? 'APPROVED' : 'PENDING_APPROVAL',
        refundPolicyNotes: params.refundPolicyNotes,
        notifyCustomers: params.notifyCustomers ?? true
      }
    });

    await AuditService.log({
      action: 'EVENT_CANCELLATION_REQUESTED',
      resource: 'event',
      resourceId: params.eventId,
      userId: params.requestedBy,
      details: {
        reason: params.reason,
        category: params.cancellationCategory,
        grossRevenueToRefund: impact.grossRevenueToRefund,
        customersAffected: impact.customersAffectedCount
      }
    });

    // If immediate execution requested and approved
    if (params.immediateExecuteIfPermitted) {
      return await this.executeCancellation({
        requestId: request.id,
        executedBy: params.requestedBy,
        executedByName: params.requestedByName
      });
    }

    return this.mapToDTO(request, impact);
  }

  /**
   * Executes an approved event cancellation.
   * Cancels tickets, closes device sessions, updates orders to REFUND_PENDING,
   * transitions event state machine to CANCELLED and publishes outbox event.
   */
  public static async executeCancellation(params: {
    requestId: string;
    executedBy: string;
    executedByName: string;
  }): Promise<EventCancellationRequestDTO> {
    const request = await prisma.eventCancellationRequest.findUnique({ where: { id: params.requestId } });
    if (!request) throw new Error('Solicitação de cancelamento não encontrada.');
    if (request.status === 'EXECUTED') throw new Error('Cancelamento já executado anteriormente.');

    const event = await prisma.event.findUnique({ where: { id: request.eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    const now = new Date();

    // 1. Recalculate impact to ensure fresh data
    const impact = await CancellationImpactService.calculateImpact({ eventId: request.eventId });

    // 2. Update Event status to CANCELLED
    await prisma.event.update({
      where: { id: request.eventId },
      data: {
        status: 'CANCELLED',
        updatedAt: now
      }
    });

    // 3. Mark all event sessions as CANCELLED
    const sessions = await prisma.eventSession.findMany({ where: { eventId: request.eventId } });
    for (const session of sessions) {
      await prisma.eventSession.update({
        where: { id: session.id },
        data: { status: 'CANCELLED' }
      });
    }

    // 4. Invalidate all tickets issued for this event
    await prisma.ticket.updateMany({
      where: { eventId: request.eventId },
      data: {
        status: 'CANCELLED',
        updatedAt: now
      }
    });

    // 5. Close all active device sessions for the event
    await prisma.deviceSession.updateMany({
      where: { eventId: request.eventId, isActive: true },
      data: { isActive: false, endedAt: now }
    });

    // 6. Close real-time operation session if one was running
    const opSessions = await prisma.eventOperationSession.findMany({ where: { eventId: request.eventId } });
    for (const op of opSessions) {
      await prisma.eventOperationSession.update({
        where: { id: op.id },
        data: { status: 'CLOSED', closedAt: now, updatedAt: now }
      });

      OperationTimelineService.addEvent({
        operationId: op.id,
        category: 'SYSTEM',
        severity: 'ERROR',
        title: 'Evento Cancelado',
        description: `Cancelamento geral executado por ${params.executedByName}. Motivo: ${request.reason}`,
        actorName: params.executedByName
      });
    }

    // 7. Publish domain event to Outbox for Financial / Refund engine
    await prisma.outboxRecords.push({
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      aggregateType: 'EVENT',
      aggregateId: request.eventId,
      eventType: 'EVENT_CANCELLED',
      payload: JSON.stringify({
        eventId: request.eventId,
        reason: request.reason,
        grossRevenueToRefund: impact.grossRevenueToRefund,
        customersAffectedCount: impact.customersAffectedCount,
        refundPolicyNotes: request.refundPolicyNotes,
        cancelledAt: now.toISOString()
      }),
      status: 'PENDING',
      createdAt: now
    });

    // 8. Update request status to EXECUTED
    const updatedRequest = await prisma.eventCancellationRequest.update({
      where: { id: params.requestId },
      data: {
        status: 'EXECUTED',
        executedBy: params.executedBy,
        executedByName: params.executedByName,
        executedAt: now
      }
    });

    await AuditService.log({
      action: 'EVENT_CANCELLED_EXECUTED',
      resource: 'event',
      resourceId: request.eventId,
      userId: params.executedBy,
      details: {
        reason: request.reason,
        grossRevenueToRefund: impact.grossRevenueToRefund
      }
    });

    return this.mapToDTO(updatedRequest, impact);
  }

  /**
   * Lists cancellation requests for an event.
   */
  public static async listRequests(eventId: string): Promise<EventCancellationRequestDTO[]> {
    const list = await prisma.eventCancellationRequest.findMany({
      where: { eventId },
      orderBy: { requestedAt: 'desc' }
    });
    return list.map((r: any) => {
      const impact = typeof r.impactData === 'string' ? JSON.parse(r.impactData) : (r.impactData || {});
      return this.mapToDTO(r, impact);
    });
  }

  private static mapToDTO(r: any, impact: any): EventCancellationRequestDTO {
    return {
      id: r.id,
      eventId: r.eventId,
      sessionId: r.sessionId || undefined,
      isPartialSession: r.isPartialSession || false,
      reason: r.reason,
      cancellationCategory: r.cancellationCategory,
      impactSnapshot: impact,
      requestedBy: r.requestedBy,
      requestedByName: r.requestedByName,
      requestedAt: new Date(r.requestedAt).toISOString(),
      approvalRequestId: r.approvalRequestId || undefined,
      status: r.status,
      executedBy: r.executedBy || undefined,
      executedByName: r.executedByName || undefined,
      executedAt: r.executedAt ? new Date(r.executedAt).toISOString() : undefined,
      refundPolicyNotes: r.refundPolicyNotes,
      notifyCustomers: r.notifyCustomers ?? true
    };
  }
}
