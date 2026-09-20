import { prisma } from '../../../../core/database/prisma';
import { SessionConflictDTO } from '@shared/types/index';

export class SessionConflictService {
  public static async detectConflicts(
    venueId: string,
    startAt: Date,
    endAt?: Date | null,
    doorsOpenAt?: Date | null,
    excludeSessionId?: string
  ): Promise<SessionConflictDTO> {
    if (!venueId) {
      return { hasConflicts: false, conflicts: [] };
    }

    // Calculate effective interval [windowStart, windowEnd]
    const windowStart = (doorsOpenAt && doorsOpenAt < startAt) ? doorsOpenAt.getTime() : startAt.getTime();
    const windowEnd = endAt ? endAt.getTime() : (startAt.getTime() + 4 * 60 * 60 * 1000); // default 4h duration

    // Fetch existing active sessions in this venue
    const sessions = await prisma.eventSession.findMany({
      where: { venueId }
    });

    const activeSessions = sessions.filter(
      (s: any) =>
        s.id !== excludeSessionId &&
        s.status !== 'CANCELLED' &&
        s.status !== 'ARCHIVED'
    );

    const conflicts: SessionConflictDTO['conflicts'] = [];

    for (const s of activeSessions) {
      const sStart = (s.doorsOpenAt && new Date(s.doorsOpenAt) < new Date(s.startAt))
        ? new Date(s.doorsOpenAt).getTime()
        : new Date(s.startAt).getTime();
      const sEnd = s.endAt
        ? new Date(s.endAt).getTime()
        : (new Date(s.startAt).getTime() + 4 * 60 * 60 * 1000);

      // Overlap condition
      if (windowStart < sEnd && windowEnd > sStart) {
        const event = await prisma.event.findUnique({ where: { id: s.eventId } });
        conflicts.push({
          type: 'VENUE_TIME_CONFLICT',
          severity: 'BLOCKING',
          message: `Conflito de horário no mesmo local com a sessão '${s.name || s.publicCode}' do evento '${event?.name || ''}'.`,
          conflictingSessionId: s.id,
          conflictingSessionName: s.name || s.publicCode
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }
}
