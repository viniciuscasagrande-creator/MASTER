import { prisma } from '../../../core/database/prisma';
import { CancellationImpactSnapshotDTO } from '@shared/types/index';

export class CancellationImpactService {
  /**
   * Calculates the exact systemic impact of cancelling an event or a session.
   * Based 100% on real database records.
   */
  public static async calculateImpact(params: {
    eventId: string;
    sessionId?: string;
  }): Promise<CancellationImpactSnapshotDTO> {
    const isPartial = !!params.sessionId;

    // 1. Sessions affected
    const allSessions = await prisma.eventSession.findMany({ where: { eventId: params.eventId } });
    const affectedSessions = isPartial
      ? allSessions.filter((s: any) => s.id === params.sessionId)
      : allSessions;

    // 2. Tickets
    const allTickets = await prisma.ticket.findMany({
      where: {
        eventId: params.eventId,
        ...(isPartial ? { sessionId: params.sessionId } : {})
      }
    });

    const totalTicketsIssued = allTickets.length;
    const soldTickets = allTickets.filter((t: any) => t.status !== 'CANCELLED' && t.status !== 'REFUNDED');
    const totalTicketsSold = soldTickets.length;

    // 3. Checked In
    const entries = await prisma.accessEntry.findMany({
      where: {
        eventId: params.eventId,
        ...(isPartial ? { sessionId: params.sessionId } : {})
      }
    });
    const checkedInTicketIds = new Set(entries.map((e: any) => e.ticketId));
    const totalTicketsCheckedIn = checkedInTicketIds.size;

    // 4. Orders & Revenue to Refund
    const orderIds = new Set(soldTickets.map((t: any) => t.orderId).filter(Boolean));
    const orders = await prisma.order.findMany({
      where: { id: { in: Array.from(orderIds) } }
    });

    const totalOrdersCount = orders.length;
    const grossRevenueToRefund = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    // 5. Unique customers affected
    const customerIds = new Set(orders.map((o: any) => o.customerId).filter(Boolean));
    const customersAffectedCount = customerIds.size;

    // 6. Access points and staff
    const accessPoints = await prisma.sessionAccessPoint.findMany({
      where: {
        ...(isPartial ? { sessionId: params.sessionId } : {})
      }
    });

    const staffShifts = await prisma.operationShift.findMany({
      where: {
        ...(isPartial ? { sessionId: params.sessionId } : {})
      }
    });

    // 7. Sales channels
    const channels = await prisma.eventSalesChannel.findMany({
      where: { eventId: params.eventId }
    });

    // 8. Marketing campaigns
    const campaigns = await prisma.marketingCampaign.findMany({
      where: { eventId: params.eventId }
    });

    const snapshot: CancellationImpactSnapshotDTO = {
      eventId: params.eventId,
      sessionId: params.sessionId,
      isPartialSessionCancellation: isPartial,
      totalSessionsAffected: affectedSessions.length,
      totalTicketsIssued,
      totalTicketsSold,
      totalTicketsCheckedIn,
      totalOrdersCount,
      grossRevenueToRefund,
      customersAffectedCount,
      activeAccessPointsCount: accessPoints.length,
      activeStaffAllocatedCount: staffShifts.length,
      activeSalesChannelsCount: channels.length,
      activeMarketingCampaignsCount: campaigns.length,
      calculatedAt: new Date().toISOString()
    };

    // Store in database
    await prisma.cancellationImpactSnapshot.create({
      data: {
        eventId: snapshot.eventId,
        sessionId: snapshot.sessionId || null,
        isPartialSession: snapshot.isPartialSessionCancellation,
        totalSessionsAffected: snapshot.totalSessionsAffected,
        totalTicketsIssued: snapshot.totalTicketsIssued,
        totalTicketsSold: snapshot.totalTicketsSold,
        totalTicketsCheckedIn: snapshot.totalTicketsCheckedIn,
        totalOrdersCount: snapshot.totalOrdersCount,
        grossRevenueToRefund: snapshot.grossRevenueToRefund,
        customersAffectedCount: snapshot.customersAffectedCount,
        calculatedAt: new Date(snapshot.calculatedAt)
      }
    });

    return snapshot;
  }
}
