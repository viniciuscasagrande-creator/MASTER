import { prisma } from '../../../core/database/prisma';
import { CommercialPerformanceDTO } from '@shared/types/index';
import { AuthenticatedUserContext, CommercialScopePolicy } from '../policies/commercial-scope.policy';
import { CommercialDataVisibilityPolicy } from '../policies/commercial-data-visibility.policy';
import { SaleQualificationPolicy } from '../policies/sale-qualification.policy';
import { CommercialAlertService } from '../alerts/commercial-alert.service';
import { CommercialOpportunityProvider } from '../opportunities/commercial-opportunity.provider';

export interface PerformanceFilterParams {
  producerId?: string;
  eventId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
}

export class CommercialPerformanceService {
  public static async getPerformance(
    user: AuthenticatedUserContext,
    params: PerformanceFilterParams,
    ipAddress?: string
  ): Promise<CommercialPerformanceDTO> {
    // 1. Resolve multi-tenant scope
    const scope = CommercialScopePolicy.resolveScopeFilters(
      user,
      params.producerId,
      params.eventId
    );

    const canViewValues = CommercialDataVisibilityPolicy.canViewFinancialValues(user);

    // 2. Fetch all orders with hydrated relations
    const allOrders = await prisma.order.findMany({
      include: {
        items: true,
        buyerSnapshot: true,
        timeline: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Filter orders matching scope and params
    const scopedOrders = allOrders.filter((order: any) => {
      if (scope.producerIds && scope.producerIds.length > 0) {
        if (!scope.producerIds.includes(order.producerId)) return false;
      }
      if (scope.eventIds && scope.eventIds.length > 0) {
        if (order.eventId && !scope.eventIds.includes(order.eventId)) return false;
      }
      if (params.eventId && order.eventId !== params.eventId) return false;
      if (params.sessionId) {
        const hasSession = order.items?.some((i: any) => i.sessionId === params.sessionId);
        if (!hasSession) return false;
      }
      if (params.startDate) {
        if (new Date(order.createdAt).getTime() < new Date(params.startDate).getTime()) return false;
      }
      if (params.endDate) {
        if (new Date(order.createdAt).getTime() > new Date(params.endDate).getTime()) return false;
      }
      return true;
    });

    const confirmedOrders = scopedOrders.filter((o: any) =>
      SaleQualificationPolicy.isConfirmedSale(o.status)
    );

    // 4. Calculate Sales Velocity
    const now = new Date();
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    const last24hAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let salesPerHour = 0;
    let todayCount = 0;
    let last24hCount = 0;
    let last7dCount = 0;

    let totalTicketsSold = 0;
    let totalGrossSalesRaw = 0;

    for (const order of confirmedOrders) {
      const orderTime = new Date(order.createdAt).getTime();
      let tCount = 0;
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          tCount += Number(item.quantity) || 1;
        }
      } else {
        tCount = Number(order.totalTicketsCount) || 1;
      }

      totalTicketsSold += tCount;
      totalGrossSalesRaw += Number(order.totalAmount) || 0;

      if (orderTime >= oneHourAgo) salesPerHour += tCount;
      if (orderTime >= todayMidnight) todayCount += tCount;
      if (orderTime >= last24hAgo) last24hCount += tCount;
      if (orderTime >= sevenDaysAgo) last7dCount += tCount;
    }

    const last7dDailyAverage = Math.round(last7dCount / 7);

    // 5. Multi-level drilldown: Events
    const events = await prisma.event.findMany();
    const relevantEvents = events.filter((e: any) => {
      if (scope.producerIds && !scope.producerIds.includes(e.producerId)) return false;
      if (scope.eventIds && !scope.eventIds.includes(e.id)) return false;
      if (params.eventId && e.id !== params.eventId) return false;
      return true;
    });

    let totalCapacity = 0;
    const eventsDrilldown = relevantEvents.map((evt: any) => {
      const evtOrders = confirmedOrders.filter((o: any) => o.eventId === evt.id);
      let evtTickets = 0;
      let evtGross = 0;
      for (const o of evtOrders) {
        if (o.items && o.items.length > 0) {
          for (const item of o.items) {
            evtTickets += Number(item.quantity) || 1;
          }
        } else {
          evtTickets += Number(o.totalTicketsCount) || 1;
        }
        evtGross += Number(o.totalAmount) || 0;
      }
      totalCapacity += Number(evt.capacity) || 0;
      const occPct = evt.capacity > 0 ? Math.min(100, Math.round((evtTickets / evt.capacity) * 100)) : 0;

      return {
        eventId: evt.id,
        eventName: evt.name || evt.title || 'Evento',
        status: evt.status || 'ON_SALE',
        ordersCount: evtOrders.length,
        ticketsSold: evtTickets,
        capacity: Number(evt.capacity) || 0,
        occupancyPercentage: occPct,
        grossSales: canViewValues ? evtGross : null
      };
    });

    const commercialOccupancyPercentage = totalCapacity > 0
      ? Math.min(100, Math.round((totalTicketsSold / totalCapacity) * 100))
      : 0;

    const averageOrderValueRaw = confirmedOrders.length > 0
      ? totalGrossSalesRaw / confirmedOrders.length
      : 0;

    // 6. Multi-level drilldown: Sessions
    const sessions = await prisma.eventSession.findMany();
    const relevantSessions = sessions.filter((s: any) => {
      if (params.eventId && s.eventId !== params.eventId) return false;
      if (params.sessionId && s.id !== params.sessionId) return false;
      return true;
    });

    const sessionsDrilldown = relevantSessions.map((ses: any) => {
      let sesTickets = 0;
      let sesGross = 0;
      let sesOrdersCount = 0;

      for (const o of confirmedOrders) {
        const matchingItems = (o.items || []).filter((i: any) => i.sessionId === ses.id);
        if (matchingItems.length > 0) {
          sesOrdersCount += 1;
          for (const item of matchingItems) {
            sesTickets += Number(item.quantity) || 1;
            sesGross += Number(item.totalAmount) || 0;
          }
        }
      }

      const capacity = Number(ses.capacity) || 0;
      const occPct = capacity > 0 ? Math.min(100, Math.round((sesTickets / capacity) * 100)) : 0;

      return {
        sessionId: ses.id,
        sessionName: ses.name || 'Sessão Principal',
        status: ses.status || 'ACTIVE',
        date: ses.startAt ? new Date(ses.startAt).toISOString() : new Date().toISOString(),
        ordersCount: sesOrdersCount,
        ticketsSold: sesTickets,
        capacity,
        occupancyPercentage: occPct,
        grossSales: canViewValues ? sesGross : null
      };
    });

    // 7. Multi-level drilldown: Sections
    const sections = await prisma.eventSection.findMany();
    const relevantSections = sections.filter((s: any) => {
      if (params.eventId && s.eventId !== params.eventId) return false;
      return true;
    });

    const sectionsDrilldown = relevantSections.map((sec: any) => {
      let secSold = 0;
      let secGross = 0;

      for (const o of confirmedOrders) {
        const matchingItems = (o.items || []).filter((i: any) => i.eventSectionId === sec.id);
        for (const item of matchingItems) {
          secSold += Number(item.quantity) || 1;
          secGross += Number(item.totalAmount) || 0;
        }
      }

      const capacity = Number(sec.capacity) || 0;
      const reserved = Number(sec.technicalReservation) || 0;
      const blocked = Number(sec.blocked) || 0;
      const available = Math.max(0, capacity - secSold - reserved - blocked);
      const occPct = capacity > 0 ? Math.min(100, Math.round((secSold / capacity) * 100)) : 0;

      return {
        sectionId: sec.id,
        sectionName: sec.name || 'Setor',
        capacity,
        sold: secSold,
        available,
        reserved,
        blocked,
        occupancyPercentage: occPct,
        grossSales: canViewValues ? secGross : null
      };
    });

    // 8. Multi-level drilldown: Ticket Types
    const ticketTypesMap: Record<string, { id: string; name: string; sold: number; gross: number }> = {};
    for (const o of confirmedOrders) {
      for (const item of o.items || []) {
        const ttId = item.eventTicketTypeId || 'tt_standard';
        const ttName = item.ticketTypeName || 'Ingresso Padrão';
        if (!ticketTypesMap[ttId]) {
          ticketTypesMap[ttId] = { id: ttId, name: ttName, sold: 0, gross: 0 };
        }
        ticketTypesMap[ttId].sold += Number(item.quantity) || 1;
        ticketTypesMap[ttId].gross += Number(item.totalAmount) || 0;
      }
    }

    const ticketTypesDrilldown = Object.values(ticketTypesMap).map(tt => ({
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      sold: tt.sold,
      grossSales: canViewValues ? tt.gross : null
    }));

    // 9. Multi-level drilldown: Batches
    const batches = await prisma.ticketBatch.findMany();
    const relevantBatches = batches.filter((b: any) => {
      if (params.eventId && b.eventId !== params.eventId) return false;
      return true;
    });

    const batchesDrilldown = relevantBatches.map((b: any) => {
      let batchGross = 0;
      let batchSoldFromItems = 0;

      for (const o of confirmedOrders) {
        const matchingItems = (o.items || []).filter((i: any) => i.ticketBatchId === b.id);
        for (const item of matchingItems) {
          batchSoldFromItems += Number(item.quantity) || 1;
          batchGross += Number(item.totalAmount) || 0;
        }
      }

      const sold = batchSoldFromItems > 0 ? batchSoldFromItems : (Number(b.soldCount) || 0);

      return {
        batchId: b.id,
        batchName: b.name || 'Lote',
        status: b.status || 'ACTIVE',
        sold,
        capacity: Number(b.totalQuantityLimit) || 0,
        price: canViewValues ? (Number(b.price) || null) : null,
        grossSales: canViewValues ? batchGross : null
      };
    });

    // 10. Multi-level drilldown: Channels
    const channelsMap: Record<string, { id: string; name: string; orders: number; tickets: number; gross: number }> = {};
    for (const o of confirmedOrders) {
      const chId = o.salesChannelId || 'sc_online';
      const chName = o.salesChannelName || (chId === 'sc_online' ? 'Site Oficial' : chId);
      if (!channelsMap[chId]) {
        channelsMap[chId] = { id: chId, name: chName, orders: 0, tickets: 0, gross: 0 };
      }
      channelsMap[chId].orders += 1;
      let tCount = 0;
      for (const item of o.items || []) {
        tCount += Number(item.quantity) || 1;
      }
      channelsMap[chId].tickets += tCount;
      channelsMap[chId].gross += Number(o.totalAmount) || 0;
    }

    const channelsDrilldown = Object.values(channelsMap).map(ch => ({
      channelId: ch.id,
      channelName: ch.name,
      ordersCount: ch.orders,
      ticketsSold: ch.tickets,
      grossSales: canViewValues ? ch.gross : null
    }));

    // 11. Alerts & Opportunities
    const alerts = await CommercialAlertService.evaluateAlerts(user, params.producerId, params.eventId);
    const opportunities = await CommercialOpportunityProvider.getOpportunitySummary(user, params.producerId, params.eventId);

    return {
      context: {
        producerId: params.producerId,
        eventId: params.eventId,
        sessionId: params.sessionId
      },
      period: {
        from: params.startDate,
        to: params.endDate,
        label: params.startDate && params.endDate ? `${params.startDate} até ${params.endDate}` : 'Período Total'
      },
      summary: {
        grossSales: canViewValues ? totalGrossSalesRaw : null,
        ordersCount: confirmedOrders.length,
        ticketsSold: totalTicketsSold,
        averageOrderValue: canViewValues ? averageOrderValueRaw : null,
        commercialOccupancyPercentage
      },
      velocity: {
        salesPerHour,
        todayCount,
        last24hCount,
        last7dDailyAverage
      },
      events: eventsDrilldown,
      sessions: sessionsDrilldown,
      sections: sectionsDrilldown,
      ticketTypes: ticketTypesDrilldown,
      batches: batchesDrilldown,
      channels: channelsDrilldown,
      alerts,
      opportunities,
      freshness: {
        lastUpdatedAt: new Date().toISOString()
      }
    };
  }
}
