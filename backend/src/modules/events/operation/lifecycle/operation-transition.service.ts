import { prisma } from '../../../../core/database/prisma';
import { OperationStateMachine, TransitionContext } from './operation-state-machine';
import { OperationReadinessService } from '../readiness/operation-readiness.service';
import { OperationTimelineService } from '../timeline/operation-timeline.service';
import { AuditService } from '../../../audit/audit.service';
import { OperationStatus } from '@shared/types/index';

export interface TransitionRequest {
  eventId: string;
  sessionId: string;
  targetStatus: OperationStatus;
  userId: string;
  userName?: string;
  override?: boolean;
  overrideReason?: string;
  notes?: string;
}

export class OperationTransitionService {
  public static async executeTransition(req: TransitionRequest): Promise<any> {
    const { eventId, sessionId, targetStatus, userId, userName, override, overrideReason, notes } = req;

    // 1. Get or create operation session
    let opSession = await prisma.eventOperationSession.findUnique({
      where: { eventId_sessionId: { eventId, sessionId } }
    });

    if (!opSession) {
      opSession = await prisma.eventOperationSession.create({
        data: {
          eventId,
          sessionId,
          status: 'PREPARATION',
          plannedOpeningAt: new Date(),
          version: 1,
          sequence: 1
        }
      });
    }

    const currentStatus: OperationStatus = opSession.status as OperationStatus;
    if (currentStatus === targetStatus) {
      return opSession; // No-op idempotent
    }

    // 2. Build context
    const context: TransitionContext = {
      override,
      overrideReason
    };

    if (targetStatus === 'READY' || targetStatus === 'OPENING') {
      const readiness = await OperationReadinessService.evaluateReadiness(eventId, sessionId, opSession.id);
      context.isReadinessBlocked = readiness.blockingCount > 0;
    }

    if (targetStatus === 'CLOSED') {
      const criticalIncidents = await prisma.supportTicket.findMany({
        where: { eventId, type: 'INCIDENT', status: 'OPEN', severity: 'CRITICAL' }
      });
      context.hasCriticalIncidents = criticalIncidents.length > 0;
    }

    // 3. Validate state machine
    const validation = OperationStateMachine.validateTransition(currentStatus, targetStatus, context);
    if (!validation.allowed) {
      throw new Error(validation.reason || 'Transição operacional bloqueada.');
    }

    // 4. Determine timestamps & user attribution
    const now = new Date();
    const updateData: any = {
      status: targetStatus,
      version: (opSession.version || 1) + 1,
      sequence: (opSession.sequence || 1) + 1,
      notes: notes || opSession.notes,
      updatedAt: now
    };

    if (targetStatus === 'OPENING' || targetStatus === 'ACTIVE') {
      if (!opSession.actualOpeningAt) {
        updateData.actualOpeningAt = now;
      }
      if (!opSession.startedAt) {
        updateData.startedAt = now;
      }
      if (!opSession.openedBy) {
        updateData.openedBy = userId;
      }
    } else if (targetStatus === 'CLOSING') {
      if (!opSession.closingStartedAt) {
        updateData.closingStartedAt = now;
      }
    } else if (targetStatus === 'CLOSED') {
      updateData.closedAt = now;
      updateData.closedBy = userId;
    }

    const updated = await prisma.eventOperationSession.update({
      where: { id: opSession.id },
      data: updateData
    });

    // 5. Timeline event
    OperationTimelineService.addEvent({
      operationId: opSession.id,
      category: 'COMMAND',
      severity: targetStatus === 'CLOSED' ? 'INFO' : 'SUCCESS',
      title: `Operação transicionada para ${targetStatus}`,
      description: override
        ? `Status alterado de ${currentStatus} para ${targetStatus} com override/justificativa: "${overrideReason}"`
        : `Status alterado de ${currentStatus} para ${targetStatus}.`,
      actorName: userName || userId,
      metadata: { fromStatus: currentStatus, toStatus: targetStatus, override, overrideReason }
    });

    // 6. Audit log
    await AuditService.log({
      action: 'OPERATION_STATUS_TRANSITION',
      resource: 'EVENT_OPERATION_SESSION',
      resourceId: opSession.id,
      userId,
      details: {
        eventId,
        sessionId,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        override: !!override,
        overrideReason: overrideReason || null
      }
    });

    return updated;
  }
}
