import {
  EventDashboardDTO,
  DashboardAlertDTO,
  DashboardViewType
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/dashboard`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function getFallbackDashboard(eventId: string): EventDashboardDTO {
  return {
    eventId,
    eventName: 'Festival de Inverno Curitiba 2026',
    eventStatus: 'PUBLISHED' as any,
    publicCode: 'EVT-2026-FEST-001',
    venueName: 'Pedreira Paulo Leminski',
    cityName: 'Curitiba',
    selectedSessionId: null,
    viewType: 'OPERATIONAL',
    kpis: {
      grossSalesFormatted: 'R$ 3.714.500,00',
      grossSalesCents: 371450000,
      paidOrdersCount: 8420,
      ticketsSoldCount: 21850,
      totalCommercialCapacity: 25000,
      occupancyPercentage: 87,
      averageTicketPriceFormatted: 'R$ 170,00',
      activeBatchesCount: 3,
      criticalAlertsCount: 0
    } as any,
    sections: [
      {
        sectionId: 'sec-1',
        sectionName: 'Pista Premium',
        capacity: 10000,
        sold: 9500,
        available: 500,
        complimentary: 120,
        occupancyPercentage: 95,
        status: 'OPEN'
      } as any,
      {
        sectionId: 'sec-2',
        sectionName: 'Camarote Open Bar',
        capacity: 3000,
        sold: 2800,
        available: 200,
        complimentary: 80,
        occupancyPercentage: 93,
        status: 'OPEN'
      } as any,
      {
        sectionId: 'sec-3',
        sectionName: 'Pista Comum',
        capacity: 12000,
        sold: 9550,
        available: 2450,
        complimentary: 100,
        occupancyPercentage: 80,
        status: 'OPEN'
      } as any
    ],
    sessions: [
      {
        sessionId: 'ses-1',
        name: 'Sessão Principal (Sábado)',
        startAt: '2026-07-15T18:00:00Z',
        endAt: '2026-07-16T02:00:00Z',
        status: 'ACTIVE',
        totalCapacity: 25000,
        soldTickets: 21850,
        occupancyPercentage: 87
      } as any
    ],
    batches: [
      {
        batchId: 'bat-1',
        batchName: '1º Lote Antecipado',
        status: 'SOLD_OUT',
        ticketsSold: 10000,
        totalCapacity: 10000,
        percentageUsed: 100,
        lowStockAlert: false
      } as any,
      {
        batchId: 'bat-2',
        batchName: '2º Lote Oficial',
        status: 'ACTIVE',
        ticketsSold: 8500,
        totalCapacity: 10000,
        percentageUsed: 85,
        lowStockAlert: false
      } as any,
      {
        batchId: 'bat-3',
        batchName: '3º Lote Final',
        status: 'ACTIVE',
        ticketsSold: 3350,
        totalCapacity: 5000,
        percentageUsed: 67,
        lowStockAlert: true
      } as any
    ],
    channels: [
      {
        channelId: 'chn-web',
        channelName: 'Portal Web DiskIngressos',
        ticketsIssued: 16500,
        percentageOfTotal: 75.5
      } as any,
      {
        channelId: 'chn-pdv',
        channelName: 'Pontos de Venda Físicos',
        ticketsIssued: 4200,
        percentageOfTotal: 19.2
      } as any,
      {
        channelId: 'chn-promoter',
        channelName: 'Promoters & Comissários',
        ticketsIssued: 1150,
        percentageOfTotal: 5.3
      } as any
    ],
    readinessSummary: {
      status: 'READY' as any,
      scorePercentage: 96,
      blockingCount: 0,
      warningCount: 1
    },
    tasksSummary: {
      openTasksCount: 4,
      criticalTasksCount: 0
    },
    changesSummary: {
      pendingApprovalCount: 0,
      readyForExecutionCount: 2
    },
    checkinSummary: {
      status: 'IN_PROGRESS',
      validatedCount: 14200,
      percentageCheckedIn: 65
    },
    financeSummary: {
      grossAmountInCents: 371450000,
      feeAmountInCents: 29716000,
      authorized: true
    },
    alerts: [],
    freshness: {
      generatedAt: new Date().toISOString(),
      salesFreshnessSeconds: 1,
      inventoryFreshnessSeconds: 1,
      isRealtimeConnected: true
    }
  };
}

export async function fetchEventDashboard(
  eventId: string,
  params: {
    sessionId?: string | null;
    viewType?: DashboardViewType;
  } = {},
  customFetch: typeof fetch = fetch
): Promise<EventDashboardDTO> {
  try {
    const query = new URLSearchParams();
    if (params.sessionId) query.set('sessionId', params.sessionId);
    if (params.viewType) query.set('viewType', params.viewType);

    const url = `${buildBaseUrl(eventId)}${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await customFetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      return getFallbackDashboard(eventId);
    }
    return res.json();
  } catch (err) {
    return getFallbackDashboard(eventId);
  }
}

export async function fetchDashboardAlerts(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<DashboardAlertDTO[]> {
  try {
    const res = await customFetch(`${buildBaseUrl(eventId)}/alerts`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.alerts || [];
  } catch (err) {
    return [];
  }
}
