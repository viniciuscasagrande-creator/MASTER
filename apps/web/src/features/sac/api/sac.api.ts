export type SacTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type SacTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SacTicketChannel = 'WHATSAPP' | 'EMAIL' | 'CHAT' | 'PHONE' | 'INTERNAL';
export type SacMessageType = 'CUSTOMER' | 'AGENT' | 'INTERNAL_NOTE' | 'SYSTEM_EVENT';

export interface SacMessage {
  id: string;
  ticketId: string;
  type: SacMessageType;
  authorName: string;
  authorUserId?: string;
  content: string;
  createdAt: string;
}

export interface SacTicketItem {
  id: string;
  ticketCode: string;
  customerId: string;
  customerName: string;
  customerDocumentMasked?: string;
  orderId?: string;
  orderNumber?: string;
  eventId?: string;
  eventName?: string;
  producerId?: string;
  channel: SacTicketChannel;
  subject: string;
  status: SacTicketStatus;
  priority: SacTicketPriority;
  queue: string;
  agentName?: string;
  agentUserId?: string;
  slaMinutesRemaining?: number;
  slaBreached?: boolean;
  slaPaused?: boolean;
  incidentId?: string;
  messages: SacMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSacTicketDTO {
  customerId: string;
  orderId?: string;
  eventId?: string;
  producerId?: string;
  channel: SacTicketChannel;
  subject: string;
  priority?: SacTicketPriority;
  queue?: string;
  initialMessage: string;
}

export interface AddSacMessageDTO {
  type: SacMessageType;
  content: string;
}

export interface CreateSacRefundRequestDTO {
  orderId: string;
  customerId: string;
  ticketId?: string;
  reason: 'ARREPENDIMENTO_7D' | 'DUPLICIDADE' | 'EVENTO_CANCELADO' | 'DIVERGENCIA_COBRANCA' | 'OUTRO';
  type: 'TOTAL' | 'PARCIAL';
  items?: string[];
  justification: string;
}

const BASE_URL = '/api/v1/sac';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || 'dev_superadmin_token';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface SacMetrics {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  slaBreached: number;
  byQueue: Record<string, number>;
  byChannel: Record<string, number>;
}

export interface ListSacTicketsParams {
  search?: string;
  status?: string;
  channel?: string;
  queue?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export const SacApi = {
  async getMetrics(): Promise<SacMetrics> {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao obter métricas de SAC`);
    }
    return res.json();
  },

  async getTickets(params?: ListSacTicketsParams): Promise<{ total: number; tickets: SacTicketItem[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.channel && params.channel !== 'ALL') query.set('channel', params.channel);
    if (params?.queue && params.queue !== 'ALL') query.set('queue', params.queue);
    if (params?.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${BASE_URL}/tickets?${query.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao listar tickets de SAC`);
    }
    return res.json();
  },

  async getTicket(id: string): Promise<SacTicketItem> {
    const res = await fetch(`${BASE_URL}/tickets/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao obter ticket ${id}`);
    }
    return res.json();
  },

  async queryCentral(q: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/query?q=${encodeURIComponent(q)}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao consultar central SAC`);
    }
    return res.json();
  },

  async createTicket(dto: Partial<CreateSacTicketDTO> & { customerName?: string; orderNumber?: string; eventName?: string }): Promise<SacTicketItem> {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao criar ticket SAC`);
    }
    return res.json();
  },

  async addMessage(ticketId: string, dto: AddSacMessageDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao enviar mensagem no ticket ${ticketId}`);
    }
    return res.json();
  },

  async updateStatus(ticketId: string, status: SacTicketStatus, notes?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao atualizar status do ticket ${ticketId}`);
    }
    return res.json();
  },

  async createRefundRequest(dto: CreateSacRefundRequestDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/refund-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao criar solicitação de estorno pelo SAC`);
    }
    return res.json();
  }
};
