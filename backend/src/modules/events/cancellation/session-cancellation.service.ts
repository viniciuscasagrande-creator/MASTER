import { prisma } from '../../../core/database/prisma';
import { EventCancellationRequestDTO } from '@shared/types/index';
import { CancellationImpactService } from './cancellation-impact.service';
import { AuditService } from '../../audit/audit.service';
import { OperationTimelineService } from '../operation/timeline/operation-timeline.service';

export class SessionCancellationService {
  /**
   * Cancels a single session of an event without cancelling the whole event.
   */
  public static async cancelSession(params: {
    eventId: string;
    sessionId: string;
    reason: string;
    cancellationCategory: 'FORCE_MAJEURE' | 'ORGANIZER_DECISION' | 'WEATHER' | 'SECURITY' | 'LEGAL' | 'OTHER';
    refundPolicyNotes: string;
    notifyCustomers?: boolean;
    cancelledBy: string;
    cancelledByName: string;
  }): Promise<EventCancellationRequestDTO> {
    const session = await prisma.eventSession.findUnique({ where: { id: params.sessionId } });
    if (!session) throw new Error('Sessão não encontrada.');
    if (session.status === 'CANCELLED') throw new Error('A sessão já se encontra cancelada.');

    const now = new Date();

    // 1. Calculate impact specifically for this session
    const impact = await CancellationImpactService.calculateImpact({
      eventId: params.eventId,
      sessionId: params.sessionId
    });

    // 2. Mark session status as CANCELLED
    await prisma.eventSession.update({
      where: { id: params.sessionId },
      data: {
        status: 'CANCELLED'
      }
    });

    // 3. Mark all tickets for this session as CANCELLED
    await prisma.ticket.updateMany({
      where: { eventId: params.eventId, sessionId: params.sessionId },
      data: {
        status: 'CANCELLED',
        updatedAt: now
      }
    });

    // 4. Close any active device sessions for this session
    await prisma.deviceSession.updateMany({
      where: { sessionId: params.sessionId, isActive: true },
      data: { isActive: false, endedAt: now }
    });

    // 5. Create Cancellation Request record with EXECUTED status
    const request = await prisma.eventCancellationRequest.create({
      data: {
        eventId: params.eventId,
        sessionId: params.sessionId,
        isPartialSession: true,
        reason: params.reason,
        cancellationCategory: params.cancellationCategory,
        impactData: JSON.stringify(impact),
        requestedBy: params.cancelledBy,
        requestedByName: params.cancelledByName,
        requestedAt: now,
        status: 'EXECUTED',
        executedBy: params.cancelledBy,
        executedByName: params.cancelledByName,
        executedAt: now,
        refundPolicyNotes: params.refundPolicyNotes,
        notifyCustomers: params.notifyCustomers ?? true
      }
    });

    // 6. Push event to Operation Timeline
    const opSession = await prisma.eventOperationSession.findFirst({
      where: { sessionId: params.sessionId }
    });
    if (opSession) {
      await prisma.eventOperationSession.update({
        where: { id: opSession.id },
        data: { status: 'CLOSED', closedAt: now }
      });

      OperationTimelineService.addEvent({
        operationId: opSession.id,
        category: 'SYSTEM',
        severity: 'ERROR',
        title: `Sessão Cancelada: ${session.name}`,
        description: `Cancelamento parcial executado por ${params.cancelledByName}. Motivo: ${params.reason}`,
        actorName: params.cancelledByName
      });
    }

    // 7. Publish to Outbox
    await prisma.outboxRecords.push({
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      aggregateType: 'SESSION',
      aggregateId: params.sessionId,
      eventType: 'SESSION_CANCELLED',
      payload: JSON.stringify({
        eventId: params.eventId,
        sessionId: params.sessionId,
        sessionName: session.name,
        grossRevenueToRefund: impact.grossRevenueToRefund,
        customersAffectedCount: impact.customersAffectedCount,
        refundPolicyNotes: params.refundPolicyNotes,
        cancelledAt: now.toISOString()
      }),
      status: 'PENDING',
      createdAt: now
    });

    await AuditService.log({
      action: 'EVENT_SESSION_CANCELLED',
      resource: 'event_session',
      resourceId: params.sessionId,
      userId: params.cancelledBy,
      details: {
        reason: params.reason,
        grossRevenueToRefund: impact.grossRevenueToRefund
      }
    });

    return {
      id: request.id,
      eventId: request.eventId,
      sessionId: request.sessionId,
      isPartialSession: true,
      reason: request.reason,
      cancellationCategory: request.cancellationCategory,
      impactSnapshot: impact,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName,
      requestedAt: now.toISOString(),
      status: 'EXECUTED',
      executedBy: params.cancelledBy,
      executedByName: params.cancelledByName,
      executedAt: now.toISOString(),
      refundPolicyNotes: request.refundPolicyNotes,
      notifyCustomers: request.notifyCustomers
    };
  }
}
