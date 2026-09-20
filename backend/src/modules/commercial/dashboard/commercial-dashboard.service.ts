import { prisma } from '../../../core/database/prisma';
import { CommercialDashboardDTO, OrderStatus } from '@shared/types/index';
import { AuthenticatedUserContext, CommercialScopePolicy } from '../policies/commercial-scope.policy';
import { CommercialDataVisibilityPolicy } from '../policies/commercial-data-visibility.policy';
import { SaleQualificationPolicy } from '../policies/sale-qualification.policy';
import { CommercialOpportunityProvider } from '../opportunities/commercial-opportunity.provider';

export interface DashboardFilterParams {
  producerId?: string;
  eventId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
}

export class CommercialDashboardService {
  public static async getDashboard(
    user: AuthenticatedUserContext,
    params: DashboardFilterParams,
    ipAddress?: string
  ): Promise<CommercialDashboardDTO> {
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

    // 4. Calculate confirmed sales metrics
    const confirmedOrders = scopedOrders.filter((o: any) =>
      SaleQualificationPolicy.isConfirmedSale(o.status)
    );

    const ordersCount = confirmedOrders.length;
    let ticketsSold = 0;
    let grossSalesRaw = 0;

    for (const order of confirmedOrders) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          ticketsSold += Number(item.quantity) || 1;
        }
      } else {
        ticketsSold += Number(order.totalTicketsCount) || Number(order.itemsCount) || 1;
      }
      grossSalesRaw += Number(order.totalAmount) || 0;
    }

    const averageOrderValueRaw = ordersCount > 0 ? grossSalesRaw / ordersCount : 0;

    // 5. Calculate total capacity and occupancy
    const events = await prisma.event.findMany();
    const relevantEvents = events.filter((e: any) => {
      if (scope.producerIds && !scope.producerIds.includes(e.producerId)) return false;
      if (scope.eventIds && !scope.eventIds.includes(e.id)) return false;
      if (params.eventId && e.id !== params.eventId) return false;
      return true;
    });

    const totalCapacity = relevantEvents.reduce((acc: number, e: any) => acc + (Number(e.capacity) || 0), 0);
    const commercialOccupancyPercentage = totalCapacity > 0
      ? Math.min(100, Math.round((ticketsSold / totalCapacity) * 100))
      : 0;

    // 6. Calculate trend (last 7 days by default)
    const dayBuckets: Record<string, { orders: number; tickets: number; grossSales: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayBuckets[key] = { orders: 0, tickets: 0, grossSales: 0 };
    }

    for (const order of confirmedOrders) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (dayBuckets[orderDate]) {
        dayBuckets[orderDate].orders += 1;
        let tCount = 0;
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            tCount += Number(item.quantity) || 1;
          }
        } else {
          tCount = Number(order.totalTicketsCount) || 1;
        }
        dayBuckets[orderDate].tickets += tCount;
        dayBuckets[orderDate].grossSales += Number(order.totalAmount) || 0;
      }
    }

    const trend = Object.entries(dayBuckets).map(([dateKey, values]) => {
      const [year, month, day] = dateKey.split('-');
      return {
        date: dateKey,
        label: `${day}/${month}`,
        orders: values.orders,
        tickets: values.tickets,
        grossSales: canViewValues ? values.grossSales : null
      };
    });

    // 7. Calculate status breakdown
    const allStatuses: OrderStatus[] = ['CONFIRMED', 'PENDING', 'PROCESSING', 'CANCELLED', 'EXPIRED'];
    const totalAllScopedOrders = scopedOrders.length;
    const ordersByStatus = allStatuses.map(status => {
      const count = scopedOrders.filter((o: any) => {
        if (status === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'PAID';
        return o.status === status;
      }).length;
      const percentage = totalAllScopedOrders > 0 ? Math.round((count / totalAllScopedOrders) * 100) : 0;
      return {
        status,
        label: SaleQualificationPolicy.getStatusLabel(status),
        count,
        percentage
      };
    });

    // 8. Calculate sales by event
    const salesByEvent = relevantEvents.map((evt: any) => {
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
      const occPct = evt.capacity > 0 ? Math.min(100, Math.round((evtTickets / evt.capacity) * 100)) : 0;

      return {
        eventId: evt.id,
        eventName: evt.name || evt.title || 'Evento sem título',
        ordersCount: evtOrders.length,
        ticketsSold: evtTickets,
        grossSales: canViewValues ? evtGross : null,
        occupancyPercentage: occPct
      };
    });

    // 9. Calculate sales by channel
    const channelMap: Record<string, { channelId: string; channelName: string; ordersCount: number; ticketsSold: number; grossSales: number }> = {};
    for (const order of confirmedOrders) {
      const chId = order.salesChannelId || 'sc_online';
      const chName = order.salesChannelName || (chId === 'sc_online' ? 'Site Oficial' : chId);
      if (!channelMap[chId]) {
        channelMap[chId] = { channelId: chId, channelName: chName, ordersCount: 0, ticketsSold: 0, grossSales: 0 };
      }
      channelMap[chId].ordersCount += 1;
      let tCount = 0;
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          tCount += Number(item.quantity) || 1;
        }
      } else {
        tCount = Number(order.totalTicketsCount) || 1;
      }
      channelMap[chId].ticketsSold += tCount;
      channelMap[chId].grossSales += Number(order.totalAmount) || 0;
    }

    const salesByChannel = Object.values(channelMap).map(ch => {
      const sharePercentage = ordersCount > 0 ? Math.round((ch.ordersCount / ordersCount) * 100) : 0;
      return {
        channelId: ch.channelId,
        channelName: ch.channelName,
        ordersCount: ch.ordersCount,
        ticketsSold: ch.ticketsSold,
        grossSales: canViewValues ? ch.grossSales : null,
        sharePercentage
      };
    });

    // 10. Recent orders (top 10 sanitized)
    const recentOrders = scopedOrders
      .slice(0, 10)
      .map((o: any) => CommercialDataVisibilityPolicy.sanitizeOrder(user, o));

    // 11. Remarketing opportunities summary
    const opportunities = await CommercialOpportunityProvider.getOpportunitySummary(
      user,
      params.producerId,
      params.eventId
    );

    return {
      context: {
        producerId: params.producerId,
        eventId: params.eventId,
        sessionId: params.sessionId
      },
      period: {
        from: params.startDate,
        to: params.endDate,
        label: params.startDate && params.endDate ? `${params.startDate} até ${params.endDate}` : 'Últimos 7 dias'
      },
      summary: {
        ordersCount,
        ticketsSold,
        grossSales: canViewValues ? grossSalesRaw : null,
        averageOrderValue: canViewValues ? averageOrderValueRaw : null,
        commercialOccupancyPercentage
      },
      trend,
      ordersByStatus,
      salesByEvent,
      salesByChannel,
      recentOrders,
      opportunities,
      freshness: {
        lastUpdatedAt: new Date().toISOString(),
        source: 'DISK_CORE_COMMERCIAL'
      }
    };
  }
}
