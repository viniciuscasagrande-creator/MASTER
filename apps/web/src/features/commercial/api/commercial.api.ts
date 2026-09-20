import {
  CommercialDashboardDTO,
  CommercialPerformanceDTO,
  OrderDTO,
  OrderStatus
} from '@shared/types/index';

const BASE_URL = '/api/v1/commercial';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface CommercialFilterParams {
  producerId?: string;
  eventId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListOrdersParams extends CommercialFilterParams {
  search?: string;
  status?: OrderStatus | 'ALL';
  salesChannelId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrdersResponse {
  orders: OrderDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const CommercialApi = {
  async getDashboard(params?: CommercialFilterParams): Promise<CommercialDashboardDTO> {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.eventId) query.set('eventId', params.eventId);
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`${BASE_URL}/dashboard?${query.toString()}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar dashboard comercial.');
    }

    return res.json();
  },

  async getPerformance(params?: CommercialFilterParams): Promise<CommercialPerformanceDTO> {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.eventId) query.set('eventId', params.eventId);
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`${BASE_URL}/performance?${query.toString()}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar performance comercial.');
    }

    return res.json();
  },

  async listOrders(params?: ListOrdersParams): Promise<PaginatedOrdersResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.eventId) query.set('eventId', params.eventId);
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.salesChannelId) query.set('salesChannelId', params.salesChannelId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`${BASE_URL}/orders?${query.toString()}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar pedidos.');
    }

    return res.json();
  },

  async getOrderById(id: string): Promise<OrderDTO> {
    const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar detalhes do pedido.');
    }

    return res.json();
  },

  async transitionOrder(id: string, targetStatus: OrderStatus, reason?: string, expectedVersion?: number): Promise<OrderDTO> {
    const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetStatus, reason, expectedVersion })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao alterar status do pedido.');
    }

    return res.json();
  },

  getExportOrdersUrl(params?: ListOrdersParams): string {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.eventId) query.set('eventId', params.eventId);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    return `${BASE_URL}/export/orders?${query.toString()}`;
  },

  getExportSalesUrl(params?: CommercialFilterParams): string {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.eventId) query.set('eventId', params.eventId);
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    return `${BASE_URL}/export/sales?${query.toString()}`;
  }
};
