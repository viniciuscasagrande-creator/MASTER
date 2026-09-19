import { prisma } from '../../../core/database/prisma';

export class DutyRouterService {
  /**
   * Find on-duty operators for an event or team at current time
   */
  public static async findOnDutyUser(params: { teamId?: string; eventId?: string; producerId?: string }): Promise<string | null> {
    const schedules = await prisma.dutySchedule.findMany({
      where: {
        isActive: true,
        OR: [
          { eventId: params.eventId || undefined },
          { teamId: params.teamId || undefined },
          { producerId: params.producerId || undefined }
        ]
      }
    });

    if (schedules.length === 0) return null;

    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const duty of schedules) {
      let active = false;
      const start = duty.shiftStart; // e.g. "18:00"
      const end = duty.shiftEnd;     // e.g. "00:00" or "06:00"

      if (start <= end) {
        active = currentHourMin >= start && currentHourMin <= end;
      } else {
        // Overnight shift (e.g. 18:00 to 06:00)
        active = currentHourMin >= start || currentHourMin <= end;
      }

      if (active) {
        let userIds: string[] = [];
        if (typeof duty.activeUserIds === 'string') {
          try {
            userIds = JSON.parse(duty.activeUserIds);
          } catch {
            userIds = [];
          }
        } else if (Array.isArray(duty.activeUserIds)) {
          userIds = duty.activeUserIds;
        }

        if (userIds.length > 0) {
          return userIds[0]; // Return first on-duty user
        }
      }
    }

    return null;
  }
}
