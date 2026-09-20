import { prisma } from '../../../../core/database/prisma';
import { CheckinSummaryDTO, AccessValidationResultDTO } from '@shared/types/index';

export class CheckinSummaryService {
  /**
   * Consolidates check-in metrics strictly from real transactional data.
   * Invariant: Zero fake metrics. If no tickets exist, displays 0.
   */
  public static async getSummary(eventId: string, sessionId?: string): Promise<CheckinSummaryDTO> {
    // 1. Fetch tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId,
        ...(sessionId ? { sessionId } : {})
      }
    });
    const totalTicketsSold = tickets.length;

    // 2. Fetch access entries
    const entries = await prisma.accessEntry.findMany({
      where: {
        eventId,
        ...(sessionId ? { sessionId } : {})
      }
    });

    const checkedInTicketIds = new Set<string>();
    let totalExits = 0;
    const ticketLastMovement: Record<string, string> = {};

    for (const entry of entries) {
      if (entry.movementType === 'ENTRY' || entry.movementType === 'REENTRY' || entry.movementType === 'MANUAL_ENTRY') {
        checkedInTicketIds.add(entry.ticketId);
        ticketLastMovement[entry.ticketId] = 'INSIDE';
      } else if (entry.movementType === 'EXIT') {
        totalExits += 1;
        ticketLastMovement[entry.ticketId] = 'OUTSIDE';
      }
    }

    const totalCheckedIn = checkedInTicketIds.size;
    const checkInPercentage = totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 1000) / 10 : 0;
    const totalInsideVenue = Object.values(ticketLastMovement).filter(state => state === 'INSIDE').length;

    // 3. Fetch access validations
    const validations = await prisma.accessValidation.findMany({
      where: {
        eventId,
        ...(sessionId ? { sessionId } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    const validationsTotal = validations.length;
    let validationsAllowed = 0;
    let validationsDenied = 0;
    let validationsReview = 0;

    for (const v of validations) {
      if (v.decision === 'ALLOW') validationsAllowed += 1;
      else if (v.decision === 'DENY') validationsDenied += 1;
      else if (v.decision === 'REVIEW') validationsReview += 1;
    }

    // 4. Breakdown by Access Point
    const accessPoints = await prisma.venueAccessPoint.findMany({});
    const apMap: Record<string, { id: string; name: string; code: string; allowed: number; denied: number }> = {};

    for (const p of accessPoints) {
      apMap[p.id] = { id: p.id, name: p.name, code: p.code, allowed: 0, denied: 0 };
    }

    for (const v of validations) {
      if (!apMap[v.accessPointId]) {
        apMap[v.accessPointId] = { id: v.accessPointId, name: 'Ponto de Acesso', code: v.accessPointId.substring(0, 6), allowed: 0, denied: 0 };
      }
      if (v.decision === 'ALLOW') apMap[v.accessPointId].allowed += 1;
      else apMap[v.accessPointId].denied += 1;
    }

    const byAccessPoint = Object.values(apMap)
      .filter(ap => ap.allowed > 0 || ap.denied > 0)
      .map(ap => ({
        accessPointId: ap.id,
        accessPointName: ap.name,
        code: ap.code,
        totalAllowed: ap.allowed,
        totalDenied: ap.denied
      }));

    // 5. Breakdown by Ticket Type
    const ticketTypes = await prisma.eventTicketType.findMany({ where: { eventId } });
    const ttStats: Record<string, { id: string; name: string; sold: number; checkedIn: number }> = {};

    for (const tt of ticketTypes) {
      ttStats[tt.id] = { id: tt.id, name: tt.name, sold: 0, checkedIn: 0 };
    }

    for (const t of tickets) {
      const typeId = t.ticketTypeId || 'default';
      if (!ttStats[typeId]) {
        ttStats[typeId] = { id: typeId, name: t.ticketTypeName || 'Geral', sold: 0, checkedIn: 0 };
      }
      ttStats[typeId].sold += 1;
      if (checkedInTicketIds.has(t.id)) {
        ttStats[typeId].checkedIn += 1;
      }
    }

    const byTicketType = Object.values(ttStats).map(tt => ({
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      sold: tt.sold,
      checkedIn: tt.checkedIn,
      percentage: tt.sold > 0 ? Math.round((tt.checkedIn / tt.sold) * 1000) / 10 : 0
    }));

    // 6. Conflicts Count
    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId } });
    const batchIds = batches.map((b: any) => b.batchId);
    const conflicts = await prisma.offlineConflict.findMany({
      where: { batchId: { in: batchIds }, resolved: false }
    });
    const conflictsCount = conflicts.length;

    // 7. Devices Online Count (heartbeat in last 15 minutes)
    const devices = await prisma.accessDevice.findMany({ where: { eventId } });
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const devicesOnlineCount = devices.filter((d: any) =>
      d.status === 'ACTIVE' && d.lastHeartbeatAt && new Date(d.lastHeartbeatAt).getTime() >= fifteenMinsAgo
    ).length;

    // 8. Recent Validations formatted
    const recentValidations: AccessValidationResultDTO[] = validations.slice(0, 15).map((v: any) => ({
      id: v.id,
      decision: v.decision,
      reasonCode: v.reasonCode,
      message: v.decision === 'ALLOW' ? 'Acesso liberado.' : 'Acesso recusado.',
      timestamp: new Date(v.createdAt).toISOString(),
      validationRequestId: v.validationRequestId,
      movementType: v.movementType,
      entriesCount: 1,
      maxEntriesAllowed: 1,
      ticket: v.ticketNumber ? {
        id: v.ticketId || '',
        ticketNumber: v.ticketNumber,
        ticketType: 'Ingresso'
      } : undefined,
      requiresSupervisorReview: v.decision === 'REVIEW',
      offlineProcessed: v.isOfflineProcessed
    }));

    return {
      eventId,
      sessionId,
      totalTicketsSold,
      totalCheckedIn,
      checkInPercentage,
      totalExits,
      totalInsideVenue,
      validationsTotal,
      validationsAllowed,
      validationsDenied,
      validationsReview,
      recentValidations,
      byAccessPoint,
      byTicketType,
      conflictsCount,
      devicesOnlineCount,
      generatedAt: new Date().toISOString()
    };
  }
}
