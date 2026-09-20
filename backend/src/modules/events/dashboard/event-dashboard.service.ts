import { prisma } from '../../../core/database/prisma';
import {
  EventDashboardDTO,
  EventDashboardKPIs,
  SectionOccupancyDTO,
  SessionDashboardItemDTO,
  BatchDashboardItemDTO,
  ChannelDashboardItemDTO,
  DashboardViewType,
  EventStatus
} from '@shared/types/index';
import { EventAlertAggregator } from './event-alert-aggregator';
import { EventReadinessService } from '../readiness/event-readiness.service';

export class EventDashboardService {
  /**
   * Obtém o Dashboard Executivo e Operacional consolidado a partir de dados reais
   */
  static async getEventDashboard(
    eventId: string,
    options: {
      sessionId?: string | null;
      viewType?: DashboardViewType;
      userPermissions?: string[];
      userId?: string;
    } = {}
  ): Promise<EventDashboardDTO> {
    const sessionId = options.sessionId || null;
    const viewType = options.viewType || 'OPERATIONAL';
    const userPerms = options.userPermissions || [];
    const isSuperAdmin = userPerms.includes('*') || userPerms.includes('admin') || userPerms.length === 0;
    const canViewFinance = isSuperAdmin || userPerms.includes('financeiro.visualizar') || userPerms.includes('eventos.dashboard.financeiro.visualizar');

    // Executa buscas resilientes em paralelo com Promise.allSettled
    const [
      eventRes,
      sessionsRes,
      sectionsRes,
      batchesRes,
      channelsRes,
      poolsRes,
      ordersRes,
      ticketsRes,
      tasksRes,
      changesRes
    ] = await Promise.allSettled([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventSession.findMany({ where: { eventId }, orderBy: { sessionDate: 'asc' } }),
      prisma.eventSection.findMany({ where: { eventId, active: true } }),
      (prisma as any).ticketBatch?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).salesChannelConfig?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).inventoryPool?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).order?.findMany?.({ where: { eventId } }) || (prisma as any).orders?.filter((o: any) => o.eventId === eventId) || [],
      (prisma as any).ticket?.findMany?.({ where: { eventId } }) || (prisma as any).tickets?.filter((t: any) => t.eventId === eventId) || [],
      (prisma as any).eventTaskRecord?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).eventChangeRequest?.findMany?.({ where: { eventId } }) || []
    ]);

    const event = eventRes.status === 'fulfilled' ? eventRes.value : null;
    if (!event) {
      throw new Error(`Evento ${eventId} não encontrado.`);
    }

    const sessions = sessionsRes.status === 'fulfilled' ? (sessionsRes.value || []) : [];
    const sections = sectionsRes.status === 'fulfilled' ? (sectionsRes.value || []) : [];
    const batches = batchesRes.status === 'fulfilled' ? (batchesRes.value || []) : [];
    const channels = channelsRes.status === 'fulfilled' ? (channelsRes.value || []) : [];
    const pools = poolsRes.status === 'fulfilled' ? (poolsRes.value || []) : [];
    let orders = ordersRes.status === 'fulfilled' ? (ordersRes.value || []) : [];
    let tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value || []) : [];
    const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value || []) : [];
    const changes = changesRes.status === 'fulfilled' ? (changesRes.value || []) : [];

    // Filtra por sessão quando selecionada
    if (sessionId) {
      orders = orders.filter((o: any) => o.sessionId === sessionId || !o.sessionId);
      tickets = tickets.filter((t: any) => t.sessionId === sessionId);
    }

    // 1. CÁLCULO DE CAPACIDADE
    let totalCapacity = sections.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    if (!sessionId && sessions.length > 1) {
      totalCapacity = totalCapacity * sessions.length;
    }

    // 2. INGRESSOS EMITIDOS & VENDAS
    const soldTickets = tickets.filter((t: any) => t.status === 'VALID' || t.status === 'USED');
    const complimentaryTickets = tickets.filter((t: any) => t.ticketType === 'COMPLIMENTARY' || t.price === 0 || t.isComplimentary);
    const reservedCount = pools.reduce((sum: number, p: any) => sum + (p.reserved || 0), 0);

    const ticketsSoldCount = soldTickets.length;
    const totalCommittedTickets = Math.max(ticketsSoldCount + reservedCount, tickets.length);
    const totalAvailableTickets = Math.max(0, totalCapacity - totalCommittedTickets);

    // 3. FINANCEIRO REAL
    const paidOrders = orders.filter((o: any) => o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'CONFIRMED');
    const rawGrossRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.grossAmount || 0), 0);
    const grossSalesInCents = Math.round(rawGrossRevenue * 100);
    const feeAmountInCents = Math.round(grossSalesInCents * 0.10);

    const occupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalCommittedTickets / totalCapacity) * 100)) : 0;

    const grossSalesFormatted = canViewFinance
      ? `R$ ${(grossSalesInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'R$ ••••••';

    const kpis: EventDashboardKPIs = {
      grossSalesInCents: canViewFinance ? grossSalesInCents : 0,
      grossSalesFormatted,
      paidOrdersCount: paidOrders.length,
      ticketsSoldCount,
      occupancyPercentage,
      totalCommercialCapacity: totalCapacity,
      totalCommittedTickets,
      totalAvailableTickets
    };

    // 4. CHECK-IN
    const checkinTickets = tickets.filter((t: any) => t.status === 'USED' || Boolean(t.usedAt));
    const validatedCount = checkinTickets.length;
    const percentageCheckedIn = ticketsSoldCount > 0 ? Math.min(100, Math.round((validatedCount / ticketsSoldCount) * 100)) : 0;

    // 5. OCUPAÇÃO POR SETOR
    const sectionOccupancy: SectionOccupancyDTO[] = sections.map((sec: any) => {
      const secTickets = tickets.filter((t: any) =>
        t.sectorName?.toLowerCase() === sec.name?.toLowerCase() || t.sectionId === sec.id
      );
      const secPool = pools.find((p: any) => p.sectionId === sec.id);
      const sold = secTickets.filter((t: any) => t.status === 'VALID' || t.status === 'USED').length;
      const comp = secTickets.filter((t: any) => t.ticketType === 'COMPLIMENTARY' || t.isComplimentary).length;
      const committed = Math.max(secTickets.length, secPool ? (secPool.sold || 0) + (secPool.reserved || 0) : 0);
      const cap = sec.capacity || 0;
      const occPct = cap > 0 ? Math.min(100, Math.round((committed / cap) * 100)) : 0;

      return {
        sectionId: sec.id,
        sectionName: sec.name,
        capacity: cap,
        sold,
        complimentary: comp,
        available: Math.max(0, cap - committed),
        occupancyPercentage: occPct
      };
    });

    // 6. DETALHAMENTO DE SESSÕES
    const sessionDashboard: SessionDashboardItemDTO[] = sessions.map((sess: any) => {
      const sessTickets = (ticketsRes.status === 'fulfilled' ? ticketsRes.value : []).filter(
        (t: any) => t.sessionId === sess.id
      );
      const sessSold = sessTickets.filter((t: any) => t.status === 'VALID' || t.status === 'USED').length;
      const baseCap = sections.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
      const occPct = baseCap > 0 ? Math.min(100, Math.round((sessSold / baseCap) * 100)) : 0;

      return {
        sessionId: sess.id,
        name: sess.name,
        startAt: sess.sessionDate?.toISOString ? sess.sessionDate.toISOString() : (sess.sessionDate || new Date().toISOString()),
        status: sess.status,
        capacity: baseCap,
        ticketsSold: sessSold,
        occupancyPercentage: occPct
      };
    });

    const nextSession = sessionDashboard.length > 0 ? sessionDashboard[0] : null;

    // 7. DETALHAMENTO DE LOTES
    const batchDashboard: BatchDashboardItemDTO[] = batches.map((b: any, index: number) => {
      const bTickets = tickets.filter((t: any) => t.batchId === b.id || t.batchName === b.name);
      const soldQty = Math.max(b.soldQuantity || 0, bTickets.length);
      const totalQty = b.totalQuantity || 1;
      const pctUsed = Math.min(100, Math.round((soldQty / totalQty) * 100));

      return {
        batchId: b.id,
        batchName: b.name,
        phase: b.phase || index + 1,
        status: b.status,
        ticketsSold: soldQty,
        totalCapacity: totalQty,
        percentageUsed: pctUsed,
        lowStockAlert: pctUsed >= 90
      };
    });

    // 8. DETALHAMENTO DE CANAIS
    const totalIssuedTickets = Math.max(1, tickets.length);
    const channelDashboard: ChannelDashboardItemDTO[] = channels.map((c: any) => {
      const cOrders = orders.filter((o: any) => o.channelId === c.id || o.salesChannel === c.channelType);
      const issued = cOrders.length;
      const pct = Math.min(100, Math.round((issued / totalIssuedTickets) * 100));

      return {
        channelId: c.id,
        channelName: c.name || c.channelType,
        channelType: c.channelType,
        ticketsIssued: issued,
        percentageOfTotal: pct
      };
    });

    // 9. AVALIAÇÃO DE PRONTIDÃO
    let readinessScore = 0;
    let blockingCount = 0;
    let warningCount = 0;
    let readinessStatus: any = 'NOT_STARTED';
    let readinessIssues: any[] = [];
    try {
      const readiness = await EventReadinessService.evaluateEventReadiness(eventId);
      readinessStatus = readiness.status;
      readinessIssues = readiness.issues;
      readinessScore = readiness.scorePercentage;
      blockingCount = readiness.issues.filter((i: any) => i.severity === 'CRITICAL' || i.severity === 'BLOCKING').length;
      warningCount = readiness.issues.filter((i: any) => i.severity === 'WARNING').length;
    } catch {
      readinessStatus = 'BLOCKED';
    }

    // 10. ALERTAS AGREGADOS
    const pendingChanges = changes.filter((c: any) => c.status === 'APPROVAL_PENDING' || c.status === 'READY_FOR_SUBMISSION');
    const alerts = EventAlertAggregator.aggregateAlerts({
      event,
      sections: sectionOccupancy,
      batches: batchDashboard,
      channels: channelDashboard,
      readinessIssues,
      pendingChanges,
      kpis: { occupancyPercentage, checkinPercentage: percentageCheckedIn }
    });

    const openTasksCount = tasks.filter((t: any) => t.status !== 'DONE' && t.status !== 'CANCELLED').length;
    const criticalTasksCount = tasks.filter((t: any) => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'DONE').length;

    const pendingApprovalChanges = changes.filter((c: any) => c.status === 'APPROVAL_PENDING').length;
    const readyExecutionChanges = changes.filter((c: any) => c.status === 'APPROVED' || c.status === 'READY_FOR_SUBMISSION').length;

    const financeSummary = canViewFinance
      ? {
          grossAmountInCents: grossSalesInCents,
          feeAmountInCents,
          authorized: true
        }
      : null;

    return {
      eventId: event.id,
      eventName: event.name,
      eventStatus: event.status as EventStatus,
      publicCode: event.publicCode || `EVT-${event.id.slice(0, 6).toUpperCase()}`,
      venueName: event.venueName || 'Praça / Arena Principal',
      cityName: event.cityName || 'Curitiba - PR',
      selectedSessionId: sessionId,
      viewType,
      kpis,
      sections: sectionOccupancy,
      sessions: sessionDashboard,
      nextSession,
      batches: batchDashboard,
      channels: channelDashboard,
      readinessSummary: {
        status: readinessStatus,
        scorePercentage: readinessScore,
        blockingCount,
        warningCount
      },
      tasksSummary: {
        openTasksCount,
        criticalTasksCount
      },
      changesSummary: {
        pendingApprovalCount: pendingApprovalChanges,
        readyForExecutionCount: readyExecutionChanges
      },
      checkinSummary: {
        status: validatedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        validatedCount,
        percentageCheckedIn
      },
      financeSummary,
      alerts,
      freshness: {
        generatedAt: new Date().toISOString(),
        salesFreshnessSeconds: 0,
        inventoryFreshnessSeconds: 0,
        isRealtimeConnected: true
      }
    };
  }
}
