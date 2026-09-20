import { prisma } from '../../../../core/database/prisma';
import { EventOperationalReportDTO } from '@shared/types/index';

export class PostEventService {
  /**
   * Generates a consolidated post-event operational report from real records.
   */
  public static async getReport(eventId: string): Promise<EventOperationalReportDTO> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    const sessions = await prisma.eventSession.findMany({ where: { eventId } });
    const tickets = await prisma.ticket.findMany({ where: { eventId } });
    const entries = await prisma.accessEntry.findMany({ where: { eventId } });
    const validations = await prisma.accessValidation.findMany({ where: { eventId } });
    const incidents = await prisma.supportTicket.findMany({ where: { eventId, type: 'INCIDENT' } });
    const handoffs = await prisma.operationHandoff.findMany({ where: { operationId: eventId } });
    const devices = await prisma.accessDevice.findMany({ where: { eventId } });
    const sessionClosures = await prisma.sessionClosureRecord.findMany({ where: { eventId } });
    const closureMap = new Map<string, any>(sessionClosures.map((c: any) => [c.sessionId, c]));

    const totalCapacity = sessions.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    const totalTicketsSold = tickets.length;
    const checkedInTicketIds = new Set(entries.map((e: any) => e.ticketId));
    const totalTicketsCheckedIn = checkedInTicketIds.size;
    const attendancePercentage = totalTicketsSold > 0 ? Math.round((totalTicketsCheckedIn / totalTicketsSold) * 1000) / 10 : 0;

    // Peak validations per minute
    const validationsByMinute: Record<string, number> = {};
    const validationsByHour: Record<string, number> = {};
    for (const v of validations) {
      const dt = new Date(v.createdAt);
      const minKey = `${dt.getHours()}:${dt.getMinutes()}`;
      const hourKey = `${dt.getHours()}:00`;
      validationsByMinute[minKey] = (validationsByMinute[minKey] || 0) + 1;
      validationsByHour[hourKey] = (validationsByHour[hourKey] || 0) + 1;
    }

    let peakMinuteCount = 0;
    for (const count of Object.values(validationsByMinute)) {
      if (count > peakMinuteCount) peakMinuteCount = count;
    }

    let peakHour = '—';
    let peakHourCount = 0;
    for (const [hour, count] of Object.entries(validationsByHour)) {
      if (count > peakHourCount) {
        peakHourCount = count;
        peakHour = hour;
      }
    }

    // Incidents distribution
    const criticalIncidents = incidents.filter((i: any) => i.priority === 'CRITICAL').length;
    const incidentsByType: Record<string, number> = {};
    for (const inc of incidents) {
      const cat = inc.category || 'GERAL';
      incidentsByType[cat] = (incidentsByType[cat] || 0) + 1;
    }

    // Sessions detail
    const sessionReports = sessions.map((s: any) => {
      const sTickets = tickets.filter((t: any) => t.sessionId === s.id);
      const sEntries = entries.filter((e: any) => e.sessionId === s.id);
      const sChecked = new Set(sEntries.map((e: any) => e.ticketId)).size;
      const closure = closureMap.get(s.id);

      return {
        sessionId: s.id,
        sessionName: s.name,
        status: s.status,
        capacity: s.capacity || 0,
        sold: sTickets.length,
        checkedIn: sChecked,
        closedAt: closure?.closedAt ? new Date(closure.closedAt).toISOString() : undefined
      };
    });

    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId } });
    const conflicts = await prisma.offlineConflict.findMany({
      where: { batchId: { in: batches.map((b: any) => b.batchId) } }
    });
    const conflictsResolvedCount = conflicts.filter((c: any) => c.resolved).length;

    const eventClosure = await prisma.eventClosureRecord.findUnique({ where: { eventId } });

    return {
      eventId,
      eventName: event.name,
      eventStatus: event.status,
      period: {
        startAt: event.startAt ? new Date(event.startAt).toISOString() : undefined,
        endAt: event.endAt ? new Date(event.endAt).toISOString() : undefined,
        closedAt: eventClosure?.closedAt ? new Date(eventClosure.closedAt).toISOString() : undefined
      },
      venue: {
        name: event.venue || undefined,
        city: event.city || undefined,
        state: event.state || undefined
      },
      operationalKPIs: {
        totalCapacity,
        totalTicketsSold,
        totalTicketsCheckedIn,
        attendancePercentage,
        peakCheckinHour: peakHour !== '—' ? peakHour : undefined,
        peakValidationsPerMinute: peakMinuteCount,
        totalIncidents: incidents.length,
        criticalIncidents,
        totalHandoffs: handoffs.length,
        devicesUsedCount: devices.length,
        conflictsResolvedCount
      },
      sessions: sessionReports,
      incidentsByType,
      generatedAt: new Date().toISOString()
    };
  }
}
