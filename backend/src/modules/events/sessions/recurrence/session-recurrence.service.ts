import { prisma } from '../../../../core/database/prisma';
import { AuthenticatedUser } from '../../../../core/middleware/authenticate';
import { AuditService } from '../../../audit/audit.service';
import { SessionConflictService } from '../conflicts/session-conflict.service';
import {
  BulkSessionsPreviewInput,
  BulkSessionsPreviewResult,
  EventSessionDTO
} from '@shared/types/index';

export class SessionRecurrenceService {
  /**
   * Generates prospective dates based on recurrence rule and runs conflict detection.
   */
  public static async previewRecurrence(
    input: BulkSessionsPreviewInput
  ): Promise<BulkSessionsPreviewResult> {
    const dates: Date[] = [];
    const interval = input.interval || 1;
    const maxCount = input.occurrencesCount || 30; // safety ceiling

    if (input.pattern === 'CUSTOM_DATES' && input.customDates && input.customDates.length > 0) {
      for (const dStr of input.customDates) {
        const [cy, cm, cd] = dStr.split('T')[0].split('-').map(Number);
        dates.push(new Date(cy, cm - 1, cd, 12, 0, 0));
      }
    } else {
      const [y, m, day] = input.startDate.split('T')[0].split('-').map(Number);
      const current = new Date(y, m - 1, day, 12, 0, 0);
      let endLimit: Date | null = null;
      if (input.endDate) {
        const [ey, em, ed] = input.endDate.split('T')[0].split('-').map(Number);
        endLimit = new Date(ey, em - 1, ed, 23, 59, 59);
      }
      let count = 0;

      while (count < maxCount) {
        if (endLimit && current > endLimit) break;

        if (input.pattern === 'DAILY') {
          dates.push(new Date(current));
          current.setDate(current.getDate() + interval);
          count++;
        } else if (input.pattern === 'WEEKLY') {
          const day = current.getDay();
          if (!input.daysOfWeek || input.daysOfWeek.includes(day)) {
            dates.push(new Date(current));
            count++;
          }
          current.setDate(current.getDate() + 1);
        } else if (input.pattern === 'MONTHLY') {
          dates.push(new Date(current));
          current.setMonth(current.getMonth() + interval);
          count++;
        } else {
          dates.push(new Date(current));
          break;
        }
      }
    }

    const previewItems: BulkSessionsPreviewResult['sessions'] = [];
    let hasConflicts = false;

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const startTimeStr = input.startTime || (input.times && input.times[0]?.startTime) || '20:00';
      const doorsOpenTimeStr = input.doorsOpenTime || (input.times && input.times[0]?.doorsOpenTime);
      const endTimeStr = input.endTime || (input.times && input.times[0]?.endTime);

      // Combine date with time strings
      const startAt = new Date(`${dateStr}T${startTimeStr}:00`);
      let doorsOpenAt: Date | undefined;
      if (doorsOpenTimeStr) {
        doorsOpenAt = new Date(`${dateStr}T${doorsOpenTimeStr}:00`);
      }
      let endAt: Date | undefined;
      if (endTimeStr) {
        endAt = new Date(`${dateStr}T${endTimeStr}:00`);
        // If end time is before start time, it rolls over to next day
        if (endAt < startAt) {
          endAt.setDate(endAt.getDate() + 1);
        }
      }

      // Check conflicts
      const conflictResult = await SessionConflictService.detectConflicts(
        input.venueId || '',
        startAt,
        endAt,
        doorsOpenAt
      );

      if (conflictResult.hasConflicts) hasConflicts = true;

      const sessionName = input.namePrefix
        ? `${input.namePrefix} #${i + 1}`
        : `Sessão ${dd}/${mm}/${yyyy}`;

      previewItems.push({
        index: i + 1,
        name: sessionName,
        date: dateStr,
        doorsOpenAt: doorsOpenAt ? doorsOpenAt.toISOString() : undefined,
        startAt: startAt.toISOString(),
        endAt: endAt ? endAt.toISOString() : undefined,
        hasConflict: conflictResult.hasConflicts,
        conflictMessage: conflictResult.conflicts[0]?.message,
        conflicts: conflictResult.conflicts.length > 0 ? conflictResult.conflicts : undefined
      });
    }

    return {
      totalCount: previewItems.length,
      hasConflicts,
      sessions: previewItems
    };
  }

  /**
   * Bulk creates sessions for an event from a recurrence preview input.
   */
  public static async createBulkSessions(
    eventId: string,
    input: BulkSessionsPreviewInput & { capacity: number; venueMapVersionId?: string },
    user: AuthenticatedUser
  ): Promise<EventSessionDTO[]> {
    const preview = await this.previewRecurrence(input);
    if (preview.sessions.length === 0) {
      throw new Error('Nenhuma sessão válida gerada pelas regras de recorrência.');
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    // Fetch active event sections to replicate for each session
    const eventSections = await prisma.eventSection.findMany({
      where: { eventId, enabled: true }
    });

    // 1. Create Recurrence Group
    const group = await prisma.sessionRecurrenceGroup.create({
      data: {
        eventId,
        rule: JSON.stringify(input),
        totalSessions: preview.sessions.length
      }
    });

    const createdSessions: EventSessionDTO[] = [];
    const year = new Date().getFullYear();

    for (const item of preview.sessions) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const publicCode = `SES-${year}-${rand}`;

      const session = await prisma.eventSession.create({
        data: {
          eventId,
          publicCode,
          name: item.name || 'Sessão',
          doorsOpenAt: item.doorsOpenAt ? new Date(item.doorsOpenAt) : null,
          startAt: new Date(item.startAt),
          endAt: item.endAt ? new Date(item.endAt) : null,
          timezone: 'America/Sao_Paulo',
          venueId: input.venueId,
          venueMapVersionId: input.venueMapVersionId || null,
          status: 'CONFIGURED',
          capacity: input.capacity,
          reservedCapacity: 0,
          isPrimary: false,
          recurrenceGroupId: group.id,
          createdBy: user.id
        }
      });

      // Create SessionSection for each active EventSection
      for (const es of eventSections) {
        await prisma.sessionSection.create({
          data: {
            sessionId: session.id,
            eventSectionId: es.id,
            enabled: true,
            capacity: es.capacity,
            reservedCapacity: 0
          }
        });
      }

      createdSessions.push(session);
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'BULK_CREATE_SESSIONS',
      resource: `RECURRENCE_GROUP:${group.id}`,
      eventId,
      details: `${createdSessions.length} sessões geradas em lote para o evento '${event.name}'.`,
      result: 'SUCCESS'
    });

    return createdSessions;
  }
}
