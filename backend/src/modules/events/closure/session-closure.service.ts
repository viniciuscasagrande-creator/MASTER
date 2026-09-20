import { prisma } from '../../../core/database/prisma';
import { SessionClosureReadinessDTO, SessionClosureRecordDTO } from '@shared/types/index';
import { ClosureCheckRegistry } from './checks/closure-check.registry';
import { ClosureOverrideService } from './overrides/closure-override.service';
import { AuditService } from '../../audit/audit.service';
import { OperationTimelineService } from '../operation/timeline/operation-timeline.service';

export class SessionClosureService {
  /**
   * Evaluates if session can be closed without errors.
   */
  public static async getReadiness(eventId: string, sessionId: string): Promise<SessionClosureReadinessDTO> {
    const session = await prisma.eventSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Sessão não encontrada.');

    const checks = await ClosureCheckRegistry.evaluateSessionChecks(eventId, sessionId);
    const blockers = checks.filter(c => c.blocking);
    const warnings = checks.filter(c => c.status === 'WARNING');
    const passed = checks.filter(c => c.status === 'PASSED');

    return {
      sessionId,
      sessionName: session.name,
      canClose: blockers.length === 0,
      hasBlockers: blockers.length > 0,
      checks,
      summary: {
        passedCount: passed.length,
        warningCount: warnings.length,
        blockerCount: blockers.length
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Closes a session formally.
   */
  public static async closeSession(params: {
    eventId: string;
    sessionId: string;
    closedBy: string;
    closedByName: string;
    notes?: string;
  }): Promise<SessionClosureRecordDTO> {
    const session = await prisma.eventSession.findUnique({ where: { id: params.sessionId } });
    if (!session) throw new Error('Sessão não encontrada.');

    // 1. Check if already closed
    const existing = await prisma.sessionClosureRecord.findUnique({ where: { sessionId: params.sessionId } });
    if (existing) {
      return this.mapToDTO(existing);
    }

    // 2. Evaluate checks
    const readiness = await this.getReadiness(params.eventId, params.sessionId);
    if (!readiness.canClose) {
      const blockerMessages = readiness.checks.filter(c => c.blocking).map(c => c.title).join(', ');
      throw new Error(`Não é possível encerrar a sessão devido a bloqueadores ativos: ${blockerMessages}`);
    }

    // 3. Count overrides applied
    const overrides = await ClosureOverrideService.listOverrides('SESSION', params.sessionId);
    const hadBlockerOverrides = overrides.length > 0;

    // 4. Calculate final check-in numbers
    const entries = await prisma.accessEntry.findMany({
      where: { sessionId: params.sessionId }
    });
    const uniqueCheckedIn = new Set(entries.map((e: any) => e.ticketId)).size;
    const capacity = session.capacity || 0;
    const finalCapacityUsed = capacity > 0 ? Math.round((uniqueCheckedIn / capacity) * 1000) / 10 : 0;

    // 5. Update session in database
    await prisma.eventSession.update({
      where: { id: params.sessionId },
      data: {
        status: 'CLOSED'
      }
    });

    // 6. Close any open device sessions
    await prisma.deviceSession.updateMany({
      where: { sessionId: params.sessionId, isActive: true },
      data: { isActive: false, endedAt: new Date() }
    });

    // 7. Create SessionClosureRecord
    const record = await prisma.sessionClosureRecord.create({
      data: {
        sessionId: params.sessionId,
        sessionName: session.name,
        eventId: params.eventId,
        closedBy: params.closedBy,
        closedByName: params.closedByName,
        closedAt: new Date(),
        hadBlockerOverrides,
        overridesCount: overrides.length,
        finalCheckinCount: uniqueCheckedIn,
        finalCapacityUsed,
        notes: params.notes || null
      }
    });

    // 8. Push timeline event
    const opSession = await prisma.eventOperationSession.findFirst({
      where: { sessionId: params.sessionId }
    });
    if (opSession) {
      OperationTimelineService.addEvent({
        operationId: opSession.id,
        category: 'SYSTEM',
        severity: 'SUCCESS',
        title: 'Sessão Oficialmente Encerrada',
        description: `Sessão "${session.name}" encerrada por ${params.closedByName}. Total de check-ins: ${uniqueCheckedIn}.`,
        actorName: params.closedByName,
        metadata: { recordId: record.id, finalCheckinCount: uniqueCheckedIn }
      });
    }

    await AuditService.log({
      action: 'EVENT_SESSION_CLOSED',
      resource: 'event_session',
      resourceId: params.sessionId,
      userId: params.closedBy,
      details: {
        finalCheckinCount: uniqueCheckedIn,
        hadBlockerOverrides
      }
    });

    return this.mapToDTO(record);
  }

  private static mapToDTO(r: any): SessionClosureRecordDTO {
    return {
      id: r.id,
      sessionId: r.sessionId,
      sessionName: r.sessionName,
      eventId: r.eventId,
      closedBy: r.closedBy,
      closedByName: r.closedByName,
      closedAt: new Date(r.closedAt).toISOString(),
      hadBlockerOverrides: r.hadBlockerOverrides,
      overridesCount: r.overridesCount || 0,
      finalCheckinCount: r.finalCheckinCount || 0,
      finalCapacityUsed: r.finalCapacityUsed || 0,
      notes: r.notes || undefined
    };
  }
}
