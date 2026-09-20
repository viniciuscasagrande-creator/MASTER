import {
  CommercialDashboardDTO,
  CommercialPerformanceDTO,
  OrderDTO,
  OrderStatus,
  CommercialProposalDTO,
  CommercialProposalVersionDTO,
  CommercialOfferingCategoryDTO,
  CommercialOfferingDTO,
  ProposalDiffDTO,
  CommercialProposalMetricsDTO,
  CreateProposalDTO,
  UpdateProposalDTO,
  CreateProposalVersionDTO,
  SubmitProposalApprovalDTO,
  SendProposalDTO,
  RegisterProposalAcceptanceDTO,
  DeclineProposalDTO
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
  },

  // ===========================================================================
  // FASE 1.3.3 — CENTRAL DE PRODUTORES & CARTEIRA COMERCIAL
  // ===========================================================================

  async listProducers(params?: {
    search?: string;
    segmentId?: string;
    classification?: string;
    ownerId?: string;
    commercialStatus?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.segmentId && params.segmentId !== 'ALL') query.set('segmentId', params.segmentId);
    if (params?.classification && params.classification !== 'ALL') query.set('classification', params.classification);
    if (params?.ownerId && params.ownerId !== 'ALL') query.set('ownerId', params.ownerId);
    if (params?.commercialStatus && params.commercialStatus !== 'ALL') query.set('commercialStatus', params.commercialStatus);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`${BASE_URL}/producers?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar produtores.');
    return res.json();
  },

  async getProducerSummary(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/producers/${encodeURIComponent(id)}/summary`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar visão comercial do produtor.');
    return res.json();
  },

  async getCommercialAccount(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/producers/${encodeURIComponent(id)}/account`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar conta comercial.');
    return res.json();
  },

  async updateCommercialAccount(id: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/producers/${encodeURIComponent(id)}/account`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar conta comercial.');
    }
    return res.json();
  },

  async listContacts(producerId: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/producers/${encodeURIComponent(producerId)}/contacts`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar contatos do produtor.');
    return res.json();
  },

  async addContact(producerId: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/producers/${encodeURIComponent(producerId)}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao adicionar contato.');
    }
    return res.json();
  },

  async updateContact(contactId: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/contacts/${encodeURIComponent(contactId)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar contato.');
    }
    return res.json();
  },

  async deleteContact(contactId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/contacts/${encodeURIComponent(contactId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao remover contato.');
  },

  // Carteira
  async getMyPortfolioSummary(): Promise<any> {
    const res = await fetch(`${BASE_URL}/portfolio/my-summary`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar resumo da carteira.');
    return res.json();
  },

  async getMyPortfolioProducers(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/portfolio/my-producers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar carteira comercial.');
    return res.json();
  },

  async assignProducerToPortfolio(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/portfolio/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atribuir produtor à carteira.');
    }
    return res.json();
  },

  // Prospecções / Leads
  async listLeads(params?: { search?: string; status?: string; ownerId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.ownerId && params.ownerId !== 'ALL') query.set('ownerId', params.ownerId);

    const res = await fetch(`${BASE_URL}/leads?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar prospecções.');
    return res.json();
  },

  async getLeadById(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads/${encodeURIComponent(id)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar prospecção.');
    return res.json();
  },

  async createLead(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar prospecção.');
    }
    return res.json();
  },

  async updateLead(id: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar prospecção.');
    }
    return res.json();
  },

  async deleteLead(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao desqualificar prospecção.');
  },

  async convertLead(id: string): Promise<{ producerId: string; commercialAccountId: string }> {
    const res = await fetch(`${BASE_URL}/leads/${encodeURIComponent(id)}/convert`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao converter prospecção em produtor.');
    }
    return res.json();
  },

  // Atividades
  async listActivities(params?: { producerId?: string; leadId?: string; opportunityId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.opportunityId) query.set('opportunityId', params.opportunityId);

    const res = await fetch(`${BASE_URL}/activities?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar atividades comerciais.');
    return res.json();
  },

  async registerActivity(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar atividade comercial.');
    }
    return res.json();
  },

  // ===========================================================================
  // FASE 1.3.4 — PIPELINE, ESTÁGIOS & OPORTUNIDADES
  // ===========================================================================

  async getDefaultPipeline(): Promise<any> {
    const res = await fetch(`${BASE_URL}/pipelines/default`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar pipeline comercial.');
    return res.json();
  },

  async listPipelines(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/pipelines`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar pipelines.');
    return res.json();
  },

  async listStages(pipelineId: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/pipelines/${encodeURIComponent(pipelineId)}/stages`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar estágios.');
    return res.json();
  },

  async listCloseReasons(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/close-reasons`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar motivos de encerramento.');
    return res.json();
  },

  async listOpportunities(params?: {
    pipelineId?: string;
    stageId?: string;
    producerId?: string;
    leadId?: string;
    ownerId?: string;
    status?: string;
    search?: string;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.pipelineId) query.set('pipelineId', params.pipelineId);
    if (params?.stageId && params.stageId !== 'ALL') query.set('stageId', params.stageId);
    if (params?.producerId && params.producerId !== 'ALL') query.set('producerId', params.producerId);
    if (params?.leadId && params.leadId !== 'ALL') query.set('leadId', params.leadId);
    if (params?.ownerId && params.ownerId !== 'ALL') query.set('ownerId', params.ownerId);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${BASE_URL}/opportunities?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao listar oportunidades.');
    return res.json();
  },

  async getOpportunityMetrics(pipelineId?: string): Promise<any> {
    const query = new URLSearchParams();
    if (pipelineId) query.set('pipelineId', pipelineId);

    const res = await fetch(`${BASE_URL}/opportunities/metrics?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar métricas de oportunidades.');
    return res.json();
  },

  async getOpportunityById(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities/${encodeURIComponent(id)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar detalhes da oportunidade.');
    return res.json();
  },

  async createOpportunity(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar oportunidade.');
    }
    return res.json();
  },

  async updateOpportunity(id: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar oportunidade.');
    }
    return res.json();
  },

  async transitionOpportunity(id: string, data: { targetStageId: string; expectedVersion: number; reason?: string; closeReasonId?: string; closeNotes?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao mover estágio da oportunidade.');
    }
    return res.json();
  },

  async winOpportunity(id: string, data: { expectedVersion?: number; notes?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities/${encodeURIComponent(id)}/win`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao marcar oportunidade como ganha.');
    }
    return res.json();
  },

  async closeOpportunity(id: string, data: { closeReasonId: string; closeNotes: string; expectedVersion?: number }): Promise<any> {
    const res = await fetch(`${BASE_URL}/opportunities/${encodeURIComponent(id)}/close`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao encerrar oportunidade.');
    }
    return res.json();
  },

  // ===========================================================================
  // FASE 1.3.5 — PROPOSTAS COMERCIAIS & CATÁLOGO DE OFERTAS
  // ===========================================================================

  async listOfferingCategories(): Promise<CommercialOfferingCategoryDTO[]> {
    const res = await fetch(`${BASE_URL}/offerings/categories`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar categorias de ofertas.');
    }
    return res.json();
  },

  async listOfferings(categoryId?: string): Promise<CommercialOfferingDTO[]> {
    const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    const res = await fetch(`${BASE_URL}/offerings${query}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar ofertas do catálogo.');
    }
    return res.json();
  },

  async listProposals(params?: {
    status?: string;
    producerId?: string;
    opportunityId?: string;
    ownerId?: string;
    search?: string;
    page?: number;
    limit?: number;
    pendingApproval?: boolean;
  }): Promise<{ data: CommercialProposalDTO[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.producerId) query.set('producerId', params.producerId);
    if (params?.opportunityId) query.set('opportunityId', params.opportunityId);
    if (params?.ownerId) query.set('ownerId', params.ownerId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.pendingApproval) query.set('pendingApproval', 'true');

    const res = await fetch(`${BASE_URL}/proposals?${query.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar propostas comerciais.');
    }
    return res.json();
  },

  async getProposalMetrics(): Promise<CommercialProposalMetricsDTO> {
    const res = await fetch(`${BASE_URL}/proposals/metrics`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar métricas de propostas.');
    }
    return res.json();
  },

  async getProposalById(id: string): Promise<CommercialProposalDTO> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar detalhes da proposta comercial.');
    }
    return res.json();
  },

  async createProposal(data: CreateProposalDTO): Promise<CommercialProposalDTO> {
    const res = await fetch(`${BASE_URL}/proposals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar proposta comercial.');
    }
    return res.json();
  },

  async updateProposal(id: string, data: UpdateProposalDTO): Promise<CommercialProposalDTO> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar rascunho da proposta.');
    }
    return res.json();
  },

  async cancelProposal(id: string, reason: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao cancelar proposta.');
    }
    return res.json();
  },

  async createProposalVersion(id: string, data: CreateProposalVersionDTO): Promise<CommercialProposalVersionDTO> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar nova versão da proposta.');
    }
    return res.json();
  },

  async getProposalDiff(id: string, base: number, target: number): Promise<ProposalDiffDTO> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/diff?base=${base}&target=${target}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao comparar versões da proposta.');
    }
    return res.json();
  },

  async submitProposalApproval(id: string, versionNumber: number, data: SubmitProposalApprovalDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/submit-approval`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao submeter proposta para aprovação.');
    }
    return res.json();
  },

  async processProposalDecision(
    id: string,
    versionNumber: number,
    data: { decision: 'APPROVE' | 'REJECT'; reason?: string; expectedVersion?: number }
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar decisão de aprovação.');
    }
    return res.json();
  },

  async generateProposalDocument(id: string, versionNumber: number): Promise<{ documentId: string; documentChecksum: string; htmlContent: string }> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/document`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao gerar documento formal da proposta.');
    }
    return res.json();
  },

  async sendProposal(id: string, versionNumber: number, data: SendProposalDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao enviar proposta ao produtor.');
    }
    return res.json();
  },

  async registerProposalAcceptance(id: string, versionNumber: number, data: RegisterProposalAcceptanceDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/accept`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao registrar aceite formal da proposta.');
    }
    return res.json();
  },

  async declineProposal(id: string, versionNumber: number, data: DeclineProposalDTO): Promise<any> {
    const res = await fetch(`${BASE_URL}/proposals/${encodeURIComponent(id)}/versions/${versionNumber}/decline`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao recusar proposta.');
    }
    return res.json();
  }
};

