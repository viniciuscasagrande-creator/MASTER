import {
  CommercialContractDTO,
  CommercialContractMetricsDTO,
  CommercialContractVersionDTO,
  ContractAmendmentDTO,
  ContractRenewalDTO,
  SignatureEnvelopeDTO,
  EffectiveCommercialTermsDTO,
  CreateContractFromProposalDTO,
  CreateContractDTO,
  UpdateContractDTO,
  PrepareSignatureDTO,
  CreateContractAmendmentDTO,
  CreateContractRenewalDTO,
  SuspendContractDTO,
  TerminateContractDTO
} from '@shared/types/index';

const BASE_URL = '/api/v1/commercial/contracts';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface ListContractsParams {
  status?: string;
  producerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  expiringInDays?: number;
}

export interface PaginatedContractsResponse {
  data: CommercialContractDTO[];
  total: number;
  page: number;
  limit: number;
}

export const CommercialContractsApi = {
  async listContracts(params?: ListContractsParams): Promise<PaginatedContractsResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.expiringInDays) query.set('expiringInDays', String(params.expiringInDays));

    const res = await fetch(`${BASE_URL}?${query.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar contratos comerciais.');
    }
    return res.json();
  },

  async getMetrics(): Promise<CommercialContractMetricsDTO> {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar métricas de contratos.');
    }
    return res.json();
  },

  async getContractById(id: string): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar detalhes do contrato comercial.');
    }
    return res.json();
  },

  async createContractFromProposal(data: CreateContractFromProposalDTO): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/from-proposal`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao gerar contrato a partir da proposta.');
    }
    return res.json();
  },

  async createDirectContract(data: CreateContractDTO): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar contrato direto.');
    }
    return res.json();
  },

  async updateContractDraft(id: string, data: UpdateContractDTO): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar rascunho do contrato.');
    }
    return res.json();
  },

  async submitApproval(id: string): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/submit-approval`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao submeter contrato para aprovação.');
    }
    return res.json();
  },

  async processDecision(
    id: string,
    data: { decision: 'APPROVE' | 'REJECT'; reason?: string; expectedVersion?: number }
  ): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao processar decisão de aprovação.');
    }
    return res.json();
  },

  async generateDocument(
    id: string,
    versionNumber: number
  ): Promise<{ documentId: string; documentChecksum: string; htmlContent: string }> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/versions/${versionNumber}/document`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao gerar minuta contratual.');
    }
    return res.json();
  },

  async prepareAndSendSignature(id: string, data: PrepareSignatureDTO): Promise<SignatureEnvelopeDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/prepare-signature`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao preparar e despachar envelope de assinatura.');
    }
    return res.json();
  },

  async createAmendment(id: string, data: CreateContractAmendmentDTO): Promise<ContractAmendmentDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/amendments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar aditivo contratual.');
    }
    return res.json();
  },

  async approveAmendment(id: string, amendmentId: string): Promise<ContractAmendmentDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/amendments/${encodeURIComponent(amendmentId)}/approve`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao aprovar aditivo contratual.');
    }
    return res.json();
  },

  async activateAmendment(id: string, amendmentId: string): Promise<ContractAmendmentDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/amendments/${encodeURIComponent(amendmentId)}/activate`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao ativar aditivo contratual.');
    }
    return res.json();
  },

  async createRenewal(id: string, data: CreateContractRenewalDTO): Promise<ContractRenewalDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/renewals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar renovação do contrato.');
    }
    return res.json();
  },

  async completeRenewal(id: string, renewalId: string): Promise<ContractRenewalDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/renewals/${encodeURIComponent(renewalId)}/complete`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao concluir renovação contratual.');
    }
    return res.json();
  },

  async suspendContract(id: string, data: SuspendContractDTO): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/suspend`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao suspender contrato.');
    }
    return res.json();
  },

  async reactivateContract(id: string): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/reactivate`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao reativar contrato suspenso.');
    }
    return res.json();
  },

  async terminateContract(id: string, data: TerminateContractDTO): Promise<CommercialContractDTO> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/terminate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao rescindir contrato.');
    }
    return res.json();
  },

  async getEffectiveTerms(producerId: string, atDate?: string): Promise<EffectiveCommercialTermsDTO> {
    const query = atDate ? `?at=${encodeURIComponent(atDate)}` : '';
    const res = await fetch(`${BASE_URL}/effective-terms/${encodeURIComponent(producerId)}${query}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao consultar condições comerciais efetivas.');
    }
    return res.json();
  },

  async simulateSignatureWebhook(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/webhook/signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao simular webhook de assinatura.');
    }
    return res.json();
  }
};
