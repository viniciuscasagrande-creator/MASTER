import { prisma } from '../../../core/database/prisma';
import { EventResponsibilityDTO, EventResponsibilityType } from '../wizard/event-wizard.types';

export class EventResponsibilityService {
  public static async listByEvent(eventId: string): Promise<EventResponsibilityDTO[]> {
    const records = await prisma.eventResponsibility.findMany({
      where: { eventId }
    });

    const users = await prisma.user.findMany();
    const teams = await prisma.team.findMany();

    return records.map((r: any) => {
      const user = r.userId ? users.find((u: any) => u.id === r.userId) : null;
      const team = r.teamId ? teams.find((t: any) => t.id === r.teamId) : null;

      return {
        id: r.id,
        eventId: r.eventId,
        responsibilityType: r.responsibilityType as EventResponsibilityType,
        userId: r.userId || null,
        userName: user?.name || null,
        userEmail: user?.email || null,
        teamId: r.teamId || null,
        teamName: team?.name || null,
        notes: r.notes || null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      };
    });
  }

  public static async setResponsibility(
    eventId: string,
    data: {
      responsibilityType: EventResponsibilityType;
      userId?: string | null;
      teamId?: string | null;
      notes?: string;
    },
    createdByUserId: string
  ): Promise<EventResponsibilityDTO> {
    // Delete existing responsibility of same type on this event if any
    const existing = await prisma.eventResponsibility.findMany({ where: { eventId } });
    const toRemove = existing.filter((e: any) => e.responsibilityType === data.responsibilityType);
    for (const r of toRemove) {
      await prisma.eventResponsibility.deleteMany({ where: { id: r.id } });
    }

    const record = await prisma.eventResponsibility.create({
      data: {
        eventId,
        responsibilityType: data.responsibilityType,
        userId: data.userId || null,
        teamId: data.teamId || null,
        notes: data.notes || null,
        createdBy: createdByUserId
      }
    });

    return {
      id: record.id,
      eventId: record.eventId,
      responsibilityType: record.responsibilityType,
      userId: record.userId,
      teamId: record.teamId,
      notes: record.notes,
      createdAt: new Date().toISOString()
    };
  }

  public static async removeResponsibility(eventId: string, responsibilityId: string): Promise<boolean> {
    await prisma.eventResponsibility.deleteMany({
      where: { id: responsibilityId }
    });
    return true;
  }
}
