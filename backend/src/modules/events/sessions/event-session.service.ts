import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import { EventSessionStateMachine } from './lifecycle/event-session-state-machine';
import { SessionConflictService } from './conflicts/session-conflict.service';
import {
  EventSessionDTO,
  CreateEventSessionInput,
  UpdateEventSessionInput,
  DuplicateEventSessionInput,
  EventSessionStatus
} from '@shared/types/index';

export class EventSessionService {
  public static async listSessions(
    eventId: string,
    filters: { status?: string; venueId?: string; startAtFrom?: string; startAtTo?: string } = {}
  ): Promise<EventSessionDTO[]> {
    let sessions = await prisma.eventSession.findMany({
      where: { eventId },
      include: {
        venue: true,
        mapVersion: true,
        sessionSections: { include: { eventSection: true } },
        reservations: true
      }
    });

    if (filters.status) {
      sessions = sessions.filter((s: any) => s.status === filters.status);
    }
    if (filters.venueId) {
      sessions = sessions.filter((s: any) => s.venueId === filters.venueId);
    }
    if (filters.startAtFrom) {
      const fromTime = new Date(filters.startAtFrom).getTime();
      sessions = sessions.filter((s: any) => new Date(s.startAt).getTime() >= fromTime);
    }
    if (filters.startAtTo) {
      const toTime = new Date(filters.startAtTo).getTime();
      sessions = sessions.filter((s: any) => new Date(s.startAt).getTime() <= toTime);
    }

    // Sort by startAt ascending
    sessions.sort(
      (a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    return sessions;
  }

  public static async getSessionSummary(eventId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    openSessions: number;
    totalCapacity: number;
    totalReservedCapacity: number;
    availableCapacity: number;
  }> {
    const sessions = await this.listSessions(eventId);

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(
      s => s.status !== 'CANCELLED' && s.status !== 'ARCHIVED'
    ).length;
    const openSessions = sessions.filter(s => s.status === 'OPEN').length;
    const totalCapacity = sessions.reduce((acc, s) => acc + (s.capacity || 0), 0);
    const totalReservedCapacity = sessions.reduce(
      (acc, s) => acc + (s.reservedCapacity || 0),
      0
    );
    const availableCapacity = Math.max(totalCapacity - totalReservedCapacity, 0);

    return {
      totalSessions,
      activeSessions,
      openSessions,
      totalCapacity,
      totalReservedCapacity,
      availableCapacity
    };
  }

  public static async getSessionById(sessionId: string): Promise<EventSessionDTO> {
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: {
        venue: true,
        mapVersion: true,
        sessionSections: { include: { eventSection: true } },
        reservations: true
      }
    });

    if (!session) throw new Error('Sessão não encontrada.');
    return session;
  }

  public static async createSession(
    eventId: string,
    input: CreateEventSessionInput,
    user: AuthenticatedUser
  ): Promise<EventSessionDTO> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    const startAt = new Date(input.startAt);
    const doorsOpenAt = input.doorsOpenAt ? new Date(input.doorsOpenAt) : null;
    const endAt = input.endAt ? new Date(input.endAt) : null;

    if (endAt && endAt <= startAt) {
      throw new Error('A data/hora de término da sessão deve ser posterior ao início.');
    }
    if (doorsOpenAt && doorsOpenAt > startAt) {
      throw new Error('A abertura dos portões deve ocorrer antes ou no mesmo horário do início.');
    }

    // Check conflict if venue specified
    if (input.venueId) {
      const conflictResult = await SessionConflictService.detectConflicts(
        input.venueId,
        startAt,
        endAt,
        doorsOpenAt
      );
      if (conflictResult.hasConflicts) {
        throw new Error(
          `Conflito detectado: O local já possui a sessão "${conflictResult.conflicts[0]?.conflictingSessionName}" agendada no mesmo horário.`
        );
      }
    }

    // Determine if session should be primary
    const existingSessions = await prisma.eventSession.findMany({ where: { eventId } });
    const isPrimary = existingSessions.length === 0 || !!input.isPrimary;

    if (isPrimary && existingSessions.length > 0) {
      for (const s of existingSessions) {
        if (s.isPrimary) {
          await prisma.eventSession.update({
            where: { id: s.id },
            data: { isPrimary: false }
          });
        }
      }
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const publicCode = `SES-${year}-${rand}`;

    const session = await prisma.eventSession.create({
      data: {
        eventId,
        publicCode,
        name: input.name || `Sessão ${new Date(startAt).toLocaleDateString('pt-BR')}`,
        doorsOpenAt,
        startAt,
        endAt,
        timezone: input.timezone || 'America/Sao_Paulo',
        venueId: input.venueId || null,
        venueMapVersionId: input.venueMapVersionId || null,
        status: input.status || 'CONFIGURED',
        capacity: input.capacity,
        reservedCapacity: 0,
        isPrimary,
        version: 1,
        createdBy: user.id
      }
    });

    // Populate SessionSections from active EventSections
    const eventSections = await prisma.eventSection.findMany({
      where: { eventId, enabled: true }
    });

    for (const es of eventSections) {
      await prisma.sessionSection.create({
        data: {
          sessionId: session.id,
          eventSectionId: es.id,
          capacity: es.capacity,
          reservedCapacity: 0,
          enabled: true
        }
      });
    }

    // Sync event primary dates if primary
    if (isPrimary) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          startAt,
          endAt: endAt || undefined
        }
      });
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_SESSION',
      resource: `SESSION:${session.id}`,
      eventId,
      details: `Sessão '${session.name}' (${session.publicCode}) criada com capacidade de ${session.capacity} lugares. Início: ${startAt.toISOString()}.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `ses_created_${session.id}_${Date.now()}`,
      type: 'EVENT_SESSION_CREATED',
      resourceType: 'EVENT_SESSION',
      resourceId: session.id,
      actorUserId: user.id,
      producerId: event.producerId,
      eventId,
      timestamp: new Date(),
      data: { sessionId: session.id, eventId, startAt: session.startAt }
    });

    return this.getSessionById(session.id);
  }

  public static async updateSession(
    sessionId: string,
    input: UpdateEventSessionInput,
    user: AuthenticatedUser
  ): Promise<EventSessionDTO> {
    const existing = await this.getSessionById(sessionId);

    const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
    const endAt = input.endAt !== undefined ? (input.endAt ? new Date(input.endAt) : null) : existing.endAt;
    const doorsOpenAt =
      input.doorsOpenAt !== undefined
        ? input.doorsOpenAt
          ? new Date(input.doorsOpenAt)
          : null
        : existing.doorsOpenAt;

    if (endAt && endAt <= startAt) {
      throw new Error('A data/hora de término da sessão deve ser posterior ao início.');
    }
    if (doorsOpenAt && doorsOpenAt > startAt) {
      throw new Error('A abertura dos portões deve ocorrer antes ou no mesmo horário do início.');
    }

    // Check conflict if venue or date changed
    const venueId = input.venueId !== undefined ? input.venueId : existing.venueId;
    if (venueId && (input.startAt || input.endAt || input.venueId)) {
      const conflictResult = await SessionConflictService.detectConflicts(
        venueId,
        new Date(startAt),
        endAt ? new Date(endAt) : null,
        doorsOpenAt ? new Date(doorsOpenAt) : null,
        sessionId
      );
      if (conflictResult.hasConflicts) {
        throw new Error(
          `Conflito detectado com a sessão "${conflictResult.conflicts[0]?.conflictingSessionName}" no mesmo local e horário.`
        );
      }
    }

    // If isPrimary set to true, clear other primary flags
    if (input.isPrimary) {
      const otherSessions = await prisma.eventSession.findMany({
        where: { eventId: existing.eventId }
      });
      for (const s of otherSessions) {
        if (s.id !== sessionId && s.isPrimary) {
          await prisma.eventSession.update({
            where: { id: s.id },
            data: { isPrimary: false }
          });
        }
      }
    }

    const updated = await prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        doorsOpenAt,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
        venueId,
        venueMapVersionId:
          input.venueMapVersionId !== undefined ? input.venueMapVersionId : existing.venueMapVersionId,
        capacity: input.capacity !== undefined ? input.capacity : existing.capacity,
        isPrimary: input.isPrimary !== undefined ? input.isPrimary : existing.isPrimary,
        updatedBy: user.id
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_SESSION',
      resource: `SESSION:${sessionId}`,
      eventId: existing.eventId,
      details: `Sessão '${updated.name}' (${updated.publicCode}) atualizada.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `ses_updated_${sessionId}_${Date.now()}`,
      type: 'EVENT_SESSION_UPDATED',
      resourceType: 'EVENT_SESSION',
      resourceId: sessionId,
      actorUserId: user.id,
      eventId: existing.eventId,
      timestamp: new Date(),
      data: { sessionId, eventId: existing.eventId }
    });

    return this.getSessionById(sessionId);
  }

  public static async changeSessionStatus(
    sessionId: string,
    targetStatus: EventSessionStatus,
    user: AuthenticatedUser,
    reason?: string
  ): Promise<EventSessionDTO> {
    const existing = await this.getSessionById(sessionId);

    // Validate state machine
    EventSessionStateMachine.validateTransition(existing.status, targetStatus);

    const updated = await prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        status: targetStatus,
        updatedBy: user.id
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CHANGE_SESSION_STATUS',
      resource: `SESSION:${sessionId}`,
      eventId: existing.eventId,
      details: `Status da sessão '${existing.name}' alterado de ${existing.status} para ${targetStatus}. Motivo: ${reason || 'Nenhum'}.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `ses_status_${sessionId}_${Date.now()}`,
      type: 'EVENT_SESSION_STATUS_CHANGED',
      resourceType: 'EVENT_SESSION',
      resourceId: sessionId,
      actorUserId: user.id,
      eventId: existing.eventId,
      timestamp: new Date(),
      data: { sessionId, from: existing.status, to: targetStatus }
    });

    return this.getSessionById(sessionId);
  }

  public static async duplicateSession(
    sessionId: string,
    input: DuplicateEventSessionInput,
    user: AuthenticatedUser
  ): Promise<EventSessionDTO> {
    const source = await this.getSessionById(sessionId);

    const startAt = new Date(input.startAt);
    const doorsOpenAt = input.doorsOpenAt ? new Date(input.doorsOpenAt) : null;
    const endAt = input.endAt ? new Date(input.endAt) : null;

    if (source.venueId) {
      const conflictResult = await SessionConflictService.detectConflicts(
        source.venueId,
        startAt,
        endAt,
        doorsOpenAt
      );
      if (conflictResult.hasConflicts) {
        throw new Error(
          `Conflito detectado com a sessão "${conflictResult.conflicts[0]?.conflictingSessionName}" no mesmo local e horário.`
        );
      }
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const publicCode = `SES-${year}-${rand}`;

    const newSession = await prisma.eventSession.create({
      data: {
        eventId: source.eventId,
        publicCode,
        name: input.name || `${source.name} (Cópia)`,
        doorsOpenAt,
        startAt,
        endAt,
        timezone: source.timezone,
        venueId: source.venueId,
        venueMapVersionId: source.venueMapVersionId,
        status: 'CONFIGURED',
        capacity: source.capacity,
        reservedCapacity: 0,
        isPrimary: false,
        createdBy: user.id
      }
    });

    // Clone session sections if requested
    if (input.replicateSections !== false && source.sessionSections) {
      for (const ss of source.sessionSections) {
        await prisma.sessionSection.create({
          data: {
            sessionId: newSession.id,
            eventSectionId: ss.eventSectionId,
            capacity: ss.capacity,
            reservedCapacity: 0,
            enabled: ss.enabled
          }
        });
      }
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DUPLICATE_SESSION',
      resource: `SESSION:${newSession.id}`,
      eventId: source.eventId,
      details: `Sessão duplicada a partir de '${source.name}' (${source.publicCode}) para nova sessão '${newSession.name}' (${newSession.publicCode}).`,
      result: 'SUCCESS'
    });

    return this.getSessionById(newSession.id);
  }

  public static async archiveSession(
    sessionId: string,
    user: AuthenticatedUser
  ): Promise<EventSessionDTO> {
    const existing = await this.getSessionById(sessionId);

    if (existing.status === 'OPEN' || existing.status === 'IN_PROGRESS') {
      throw new Error(
        'Não é possível arquivar uma sessão aberta ou em andamento. Conclua ou cancele-a primeiro.'
      );
    }

    const archived = await prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedBy: user.id
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'ARCHIVE_SESSION',
      resource: `SESSION:${sessionId}`,
      eventId: existing.eventId,
      details: `Sessão '${existing.name}' (${existing.publicCode}) arquivada.`,
      result: 'SUCCESS'
    });

    return this.getSessionById(sessionId);
  }
}
