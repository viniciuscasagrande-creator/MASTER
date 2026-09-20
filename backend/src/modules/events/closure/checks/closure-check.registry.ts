import { prisma } from '../../../../core/database/prisma';
import { ClosureCheckItemDTO } from '@shared/types/index';
import { ClosureOverrideService } from '../overrides/closure-override.service';

export class ClosureCheckRegistry {
  /**
   * Evaluates all closure checks for a specific session.
   */
  public static async evaluateSessionChecks(eventId: string, sessionId: string): Promise<ClosureCheckItemDTO[]> {
    const checks: ClosureCheckItemDTO[] = [];

    // Check 1: Active Device Sessions (Turnos de Operador Abertos)
    const activeDeviceSessions = await prisma.deviceSession.findMany({
      where: { sessionId, isActive: true }
    });
    const hasActiveDevices = activeDeviceSessions.length > 0;
    const isOverrideDevices = await ClosureOverrideService.hasOverride('SESSION', sessionId, 'CHECKIN_ACTIVE_SESSIONS');
    checks.push({
      code: 'CHECKIN_ACTIVE_SESSIONS',
      category: 'DEVICES',
      title: 'Sessões de Dispositivos e Operadores',
      description: 'Verifica se existem scanners ou operadores com turno ainda aberto na sessão.',
      status: !hasActiveDevices ? 'PASSED' : (isOverrideDevices ? 'WARNING' : 'BLOCKER'),
      blocking: hasActiveDevices && !isOverrideDevices,
      metrics: { activeSessionsCount: activeDeviceSessions.length },
      resolutionAdvice: hasActiveDevices ? 'Encerre todas as sessões ativas de operadores nos dispositivos antes do fechamento.' : undefined
    });

    // Check 2: Unresolved Offline Conflicts
    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId, sessionId } });
    const batchIds = batches.map((b: any) => b.batchId);
    const unresolvedConflicts = await prisma.offlineConflict.findMany({
      where: { batchId: { in: batchIds }, resolved: false }
    });
    const hasConflicts = unresolvedConflicts.length > 0;
    const isOverrideConflicts = await ClosureOverrideService.hasOverride('SESSION', sessionId, 'OFFLINE_UNRESOLVED_CONFLICTS');
    checks.push({
      code: 'OFFLINE_UNRESOLVED_CONFLICTS',
      category: 'OFFLINE_SYNC',
      title: 'Conflitos de Sincronização Offline',
      description: 'Verifica se há leituras duplicadas ou divergências offline pendentes de resolução.',
      status: !hasConflicts ? 'PASSED' : (isOverrideConflicts ? 'WARNING' : 'BLOCKER'),
      blocking: hasConflicts && !isOverrideConflicts,
      metrics: { unresolvedConflictsCount: unresolvedConflicts.length },
      resolutionAdvice: hasConflicts ? 'Acesse a Central de Sincronização e resolva todos os conflitos pendentes com parecer do supervisor.' : undefined
    });

    // Check 3: Realtime Operation Session Status
    const opSession = await prisma.eventOperationSession.findFirst({
      where: { sessionId }
    });
    const isOpActive = opSession && (opSession.status === 'ACTIVE' || opSession.status === 'OPENING' || opSession.status === 'READY');
    const isOverrideOp = await ClosureOverrideService.hasOverride('SESSION', sessionId, 'OPERATION_SESSION_ACTIVE');
    checks.push({
      code: 'OPERATION_SESSION_ACTIVE',
      category: 'OPERATION',
      title: 'Status da Central de Operação',
      description: 'Verifica se a operação em tempo real da sessão foi formalmente encerrada.',
      status: !isOpActive ? 'PASSED' : (isOverrideOp ? 'WARNING' : 'BLOCKER'),
      blocking: isOpActive && !isOverrideOp,
      metrics: { operationStatus: opSession?.status || 'NOT_STARTED' },
      resolutionAdvice: isOpActive ? 'Finalize a operação na Central de Comando em Tempo Real antes de encerrar a sessão.' : undefined
    });

    // Check 4: Critical Open Incidents
    const criticalIncidents = await prisma.supportTicket.findMany({
      where: {
        eventId,
        type: 'INCIDENT',
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAR_ROOM'] },
        priority: 'CRITICAL'
      }
    });
    const hasCriticalIncidents = criticalIncidents.length > 0;
    const isOverrideIncidents = await ClosureOverrideService.hasOverride('SESSION', sessionId, 'OPEN_CRITICAL_INCIDENTS');
    checks.push({
      code: 'OPEN_CRITICAL_INCIDENTS',
      category: 'INCIDENTS',
      title: 'Incidentes Críticos em Aberto',
      description: 'Verifica se existem ocorrências graves ou de segurança sem encerramento formal.',
      status: !hasCriticalIncidents ? 'PASSED' : (isOverrideIncidents ? 'WARNING' : 'BLOCKER'),
      blocking: hasCriticalIncidents && !isOverrideIncidents,
      metrics: { criticalIncidentsCount: criticalIncidents.length },
      resolutionAdvice: hasCriticalIncidents ? 'Resolva os incidentes críticos na Central de Incidentes ou registre justificativa operacional.' : undefined
    });

    // Check 5: Mandatory Event Tasks
    const pendingTasks = await prisma.eventTask.findMany({
      where: {
        eventId,
        sessionId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });
    const hasPendingTasks = pendingTasks.length > 0;
    checks.push({
      code: 'MANDATORY_TASKS_COMPLETED',
      category: 'TASKS',
      title: 'Tarefas e Pendências Operacionais',
      description: 'Verifica se todas as tarefas obrigatórias da sessão foram concluídas.',
      status: !hasPendingTasks ? 'PASSED' : 'WARNING',
      blocking: false, // Warning only
      metrics: { pendingTasksCount: pendingTasks.length }
    });

    // Check 6: Checkin Activity Window
    const session = await prisma.eventSession.findUnique({ where: { id: sessionId } });
    const now = new Date();
    const isPastEndTime = session?.endAt ? new Date(session.endAt) <= now : true;
    checks.push({
      code: 'SESSION_TIME_WINDOW_FINISHED',
      category: 'CHECKIN',
      title: 'Horário Oficial da Sessão',
      description: 'Verifica se o horário programado de término da sessão já foi atingido.',
      status: isPastEndTime ? 'PASSED' : 'WARNING',
      blocking: false,
      metrics: { scheduledEndAt: session?.endAt ? new Date(session.endAt).toISOString() : null }
    });

    return checks;
  }

  /**
   * Evaluates overall event closure checks.
   */
  public static async evaluateEventChecks(eventId: string): Promise<{
    canClose: boolean;
    allSessionsClosed: boolean;
    sessionsSummary: Array<{ sessionId: string; sessionName: string; status: string; isClosed: boolean }>;
    checks: ClosureCheckItemDTO[];
    blockers: string[];
  }> {
    const sessions = await prisma.eventSession.findMany({ where: { eventId } });
    const closureRecords = await prisma.sessionClosureRecord.findMany({ where: { eventId } });
    const closedSessionIds = new Set(closureRecords.map((r: any) => r.sessionId));

    const sessionsSummary = sessions.map((s: any) => {
      const isClosed = closedSessionIds.has(s.id) || s.status === 'CLOSED' || s.status === 'CANCELLED';
      return {
        sessionId: s.id,
        sessionName: s.name,
        status: s.status,
        isClosed
      };
    });

    const allSessionsClosed = sessionsSummary.every(s => s.isClosed);
    const checks: ClosureCheckItemDTO[] = [];
    const blockers: string[] = [];

    // Check 1: All sessions closed
    checks.push({
      code: 'ALL_SESSIONS_CLOSED',
      category: 'OPERATION',
      title: 'Fechamento de Todas as Sessões',
      description: 'Todas as sessões do evento precisam estar devidamente encerradas e conciliadas.',
      status: allSessionsClosed ? 'PASSED' : 'BLOCKER',
      blocking: !allSessionsClosed,
      metrics: {
        totalSessions: sessions.length,
        closedSessions: sessionsSummary.filter(s => s.isClosed).length
      },
      resolutionAdvice: !allSessionsClosed ? 'Encerre individualmente as sessões pendentes antes de fechar o evento.' : undefined
    });

    if (!allSessionsClosed) {
      blockers.push('Existem sessões do evento que ainda não foram encerradas.');
    }

    // Check 2: Unresolved Offline Conflicts in Event
    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId } });
    const batchIds = batches.map((b: any) => b.batchId);
    const conflicts = await prisma.offlineConflict.findMany({
      where: { batchId: { in: batchIds }, resolved: false }
    });
    if (conflicts.length > 0) {
      const isOverride = await ClosureOverrideService.hasOverride('EVENT', eventId, 'EVENT_OFFLINE_CONFLICTS');
      checks.push({
        code: 'EVENT_OFFLINE_CONFLICTS',
        category: 'OFFLINE_SYNC',
        title: 'Conflitos Offline Não Resolvidos',
        description: 'Existem leituras conflitantes em lotes offline do evento.',
        status: isOverride ? 'WARNING' : 'BLOCKER',
        blocking: !isOverride,
        metrics: { conflictsCount: conflicts.length }
      });
      if (!isOverride) {
        blockers.push(`Existem ${conflicts.length} conflitos offline não resolvidos no evento.`);
      }
    } else {
      checks.push({
        code: 'EVENT_OFFLINE_CONFLICTS',
        category: 'OFFLINE_SYNC',
        title: 'Conflitos Offline Não Resolvidos',
        description: 'Nenhum conflito offline pendente de conciliação.',
        status: 'PASSED',
        blocking: false
      });
    }

    const canClose = blockers.length === 0;

    return {
      canClose,
      allSessionsClosed,
      sessionsSummary,
      checks,
      blockers
    };
  }
}
