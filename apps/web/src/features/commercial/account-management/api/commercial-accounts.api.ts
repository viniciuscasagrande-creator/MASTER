import {
  CommercialAccountSummaryDTO,
  CommercialAccountDetailsDTO,
  AccountManagementMetricsDTO,
  CommercialRenewalDTO,
  CreateRenewalNegotiationDTO,
  UpdateRenewalStatusDTO,
  CommercialMovementDTO,
  CreateCommercialMovementDTO,
  CommercialChangeImpactDTO,
  AccountCommercialTimelineDTO,
  AccountCommercialAlertDTO,
  CommercialRenewalStatus,
  CommercialRenewalType,
  CommercialMovementType,
  AccountCommercialStatus
} from '@shared/types/index';

const BASE_URL = '/api/v1/commercial';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const CommercialAccountsApi = {
  // 1. Contas & Carteira
  async listAccounts(params?: {
    search?: string;
    responsibleId?: string;
    commercialStatus?: AccountCommercialStatus;
    onlyWithExpiringContracts?: boolean;
  }): Promise<CommercialAccountSummaryDTO[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.responsibleId) query.set('responsibleId', params.responsibleId);
    if (params?.commercialStatus) query.set('commercialStatus', params.commercialStatus);
    if (params?.onlyWithExpiringContracts) query.set('onlyWithExpiringContracts', 'true');

    const res = await fetch(`${BASE_URL}/accounts?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar contas comerciais.');
    }
    return res.json();
  },

  async getAccountDetails(producerId: string): Promise<CommercialAccountDetailsDTO> {
    const res = await fetch(`${BASE_URL}/accounts/${producerId}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar detalhes da conta comercial.');
    }
    return res.json();
  },

  async getMetrics(): Promise<AccountManagementMetricsDTO> {
    const res = await fetch(`${BASE_URL}/accounts/metrics`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar métricas de gestão de contas.');
    }
    return res.json();
  },

  async getAccountTimeline(producerId: string): Promise<AccountCommercialTimelineDTO> {
    const res = await fetch(`${BASE_URL}/accounts/${producerId}/timeline`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar linha do tempo comercial.');
    }
    return res.json();
  },

  async getAccountAlerts(producerId?: string): Promise<AccountCommercialAlertDTO[]> {
    const url = producerId ? `${BASE_URL}/accounts/${producerId}/alerts` : `${BASE_URL}/accounts/alerts`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar alertas comerciais.');
    }
    return res.json();
  },

  // 2. Central de Renovações
  async listRenewals(params?: {
    producerId?: string;
    status?: CommercialRenewalStatus;
    renewalType?: CommercialRenewalType;
    responsibleId?: string;
    onlyPlanningWindow?: boolean;
    onlyOverdue?: boolean;
  }): Promise<CommercialRenewalDTO[]> {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.status) query.set('status', params.status);
    if (params?.renewalType) query.set('renewalType', params.renewalType);
    if (params?.responsibleId) query.set('responsibleId', params.responsibleId);
    if (params?.onlyPlanningWindow) query.set('onlyPlanningWindow', 'true');
    if (params?.onlyOverdue) query.set('onlyOverdue', 'true');

    const res = await fetch(`${BASE_URL}/renewals?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar central de renovações.');
    }
    return res.json();
  },

  async getRenewalById(id: string): Promise<CommercialRenewalDTO> {
    const res = await fetch(`${BASE_URL}/renewals/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao buscar detalhes da renovação.');
    }
    return res.json();
  },

  async startRenewalNegotiation(data: CreateRenewalNegotiationDTO): Promise<CommercialRenewalDTO> {
    const res = await fetch(`${BASE_URL}/renewals/start-negotiation`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao iniciar negociação de renovação.');
    }
    return res.json();
  },

  async updateRenewalStatus(id: string, data: UpdateRenewalStatusDTO): Promise<CommercialRenewalDTO> {
    const res = await fetch(`${BASE_URL}/renewals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar status da renovação.');
    }
    return res.json();
  },

  async decideRenewal(id: string, data: {
    status: 'COMPLETED' | 'NOT_RENEWED' | 'CANCELLED';
    decisionReason?: string;
    decisionNotes?: string;
    targetEffectiveUntil?: string;
    version: number;
  }): Promise<CommercialRenewalDTO> {
    const res = await fetch(`${BASE_URL}/renewals/${id}/decide`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar decisão de renovação.');
    }
    return res.json();
  },

  // 3. Movimentações Comerciais
  async listMovements(params?: {
    producerId?: string;
    movementType?: CommercialMovementType;
    status?: 'OPEN' | 'WON' | 'CLOSED';
    ownerId?: string;
  }): Promise<CommercialMovementDTO[]> {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.movementType) query.set('movementType', params.movementType);
    if (params?.status) query.set('status', params.status);
    if (params?.ownerId) query.set('ownerId', params.ownerId);

    const res = await fetch(`${BASE_URL}/movements?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar movimentações comerciais.');
    }
    return res.json();
  },

  async createMovement(data: CreateCommercialMovementDTO): Promise<CommercialMovementDTO> {
    const res = await fetch(`${BASE_URL}/movements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar movimentação comercial.');
    }
    return res.json();
  },

  // 4. Comparador de Impacto Comercial (Simulação)
  async simulateChangeImpact(data: {
    producerId: string;
    movementType: CommercialMovementType;
    originContractId?: string;
    currentOfferingId?: string;
    proposedOfferingId: string;
  }): Promise<CommercialChangeImpactDTO> {
    const res = await fetch(`${BASE_URL}/change-impact/simulate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao simular impacto comercial.');
    }
    return res.json();
  }
};
