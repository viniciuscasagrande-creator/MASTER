export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'WAITING_INFORMATION'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export type RefundKind = 'TOTAL' | 'PARTIAL';

export type RefundRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RefundReason =
  | 'CDC_7_DAYS'
  | 'EVENT_CANCELLED'
  | 'EVENT_POSTPONED'
  | 'OPERATIONAL_ERROR'
  | 'MEDICAL_REASON'
  | 'FRAUD_CHARGEBACK_PREVENT'
  | 'OTHER';

export interface RefundApprovalRecord {
  level: number;
  approverId: string;
  approverName: string;
  role: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt: string;
}

export interface RefundTimelineEntry {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface RefundItem {
  id: string;
  refundCode: string;
  refundCodeNormalized: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCpfMasked: string;
  producerId: string;
  eventId: string;
  eventName: string;
  kind: RefundKind;
  amount: number;
  amountCents: number;
  originalOrderAmount: number;
  eligibleRemainingAmount: number;
  reason: RefundReason;
  reasonDescription: string;
  status: RefundStatus;
  riskLevel: RefundRiskLevel;
  requiredApprovals: number;
  approvalsReceived: number;
  approvals: RefundApprovalRecord[];
  requestedBy: string;
  requestedByUserId: string;
  paymentMethod: string;
  paymentGateway: string;
  transactionCode: string;
  gatewayRefundId?: string;
  idempotencyKey: string;
  ticketIds?: string[];
  orderItemIds?: string[];
  sacTicketId?: string;
  timeline: RefundTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateRefundRequestDTO {
  orderId: string;
  kind: RefundKind;
  amount?: number;
  itemIds?: string[];
  ticketIds?: string[];
  reason: RefundReason;
  reasonDescription: string;
  ticketId?: string;
}

export interface RefundMetricsSummary {
  totalRequested: number;
  totalApproved: number;
  totalProcessed: number;
  totalRejected: number;
  amountRequested: number;
  amountProcessed: number;
  avgResolutionHours: number;
  complianceSlaRate: number;
}

const BASE_URL = '/api/v1/refunds';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || 'dev_superadmin_token';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface ListRefundsParams {
  status?: string;
  reason?: string;
  riskLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const RefundsApi = {
  async getMetrics(): Promise<RefundMetricsSummary> {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao obter métricas de estorno`);
    }
    const data = await res.json();
    return data.data || data;
  },

  async listRefunds(params?: ListRefundsParams): Promise<{ total: number; refunds: RefundItem[] }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.reason && params.reason !== 'ALL') query.set('reason', params.reason);
    if (params?.riskLevel && params.riskLevel !== 'ALL') query.set('riskLevel', params.riskLevel);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${BASE_URL}?${query.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao listar estornos`);
    }
    return res.json();
  },

  async getRefund(id: string): Promise<RefundItem> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao obter detalhes do estorno ${id}`);
    }
    const data = await res.json();
    return data.refund || data;
  },

  async checkEligibility(orderId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/eligibility/${orderId}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao verificar elegibilidade do pedido ${orderId}`);
    }
    return res.json();
  },

  async createRefund(dto: CreateRefundRequestDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao criar solicitação de estorno`);
    }
    return res.json();
  },

  async approveRefund(id: string, notes?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao aprovar estorno ${id}`);
    }
    return res.json();
  },

  async rejectRefund(id: string, reason: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao rejeitar estorno ${id}`);
    }
    return res.json();
  },

  async processRefund(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/${id}/process`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao processar estorno no gateway ${id}`);
    }
    return res.json();
  },

  async retryRefund(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/${id}/retry`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao retentar estorno ${id}`);
    }
    return res.json();
  },

  async cancelRefund(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao cancelar estorno ${id}`);
    }
    return res.json();
  }
};
