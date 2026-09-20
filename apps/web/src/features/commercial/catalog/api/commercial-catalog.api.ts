import {
  CommercialOfferingDTO,
  CommercialOfferingVersionDTO,
  CommercialCatalogMetricsDTO,
  CommercialCatalogImpactDTO,
  CommercialFeatureDTO,
  CommercialOfferingCategoryDTO,
  CommercialDefaultTermDTO,
  CreateOfferingDTO,
  UpdateOfferingDTO,
  CreateOfferingVersionDTO,
  PublishOfferingVersionDTO,
  DiscontinueOfferingDTO
} from '@shared/types/index';

const BASE_URL = '/api/v1/commercial/catalog';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export interface ListOfferingsParams {
  type?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  activeOnly?: boolean;
}

export const CommercialCatalogApi = {
  async getMetrics(): Promise<CommercialCatalogMetricsDTO> {
    const res = await fetch(`${BASE_URL}/metrics`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar métricas do catálogo.');
    }
    return res.json();
  },

  async listOfferings(params?: ListOfferingsParams): Promise<CommercialOfferingDTO[]> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') query.set('type', params.type);
    if (params?.categoryId && params.categoryId !== 'ALL') query.set('categoryId', params.categoryId);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.activeOnly) query.set('activeOnly', 'true');

    const res = await fetch(`${BASE_URL}/offerings?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar ofertas comerciais.');
    }
    return res.json();
  },

  async getOfferingById(id: string): Promise<CommercialOfferingDTO> {
    const res = await fetch(`${BASE_URL}/offerings/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao carregar detalhes da oferta.');
    }
    return res.json();
  },

  async createOffering(dto: CreateOfferingDTO): Promise<CommercialOfferingDTO> {
    const res = await fetch(`${BASE_URL}/offerings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar nova oferta comercial.');
    }
    return res.json();
  },

  async updateOffering(id: string, dto: UpdateOfferingDTO): Promise<CommercialOfferingDTO> {
    const res = await fetch(`${BASE_URL}/offerings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar oferta comercial.');
    }
    return res.json();
  },

  async discontinueOffering(id: string, dto: DiscontinueOfferingDTO): Promise<CommercialOfferingDTO> {
    const res = await fetch(`${BASE_URL}/offerings/${id}/discontinue`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao descontinuar oferta comercial.');
    }
    return res.json();
  },

  async getOfferingImpact(id: string): Promise<CommercialCatalogImpactDTO> {
    const res = await fetch(`${BASE_URL}/offerings/${id}/impact`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao calcular impacto da oferta.');
    }
    return res.json();
  },

  async listOfferingVersions(offeringId: string): Promise<CommercialOfferingVersionDTO[]> {
    const res = await fetch(`${BASE_URL}/offerings/${offeringId}/versions`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar versões da oferta.');
    }
    return res.json();
  },

  async createDraftVersion(offeringId: string, dto: CreateOfferingVersionDTO): Promise<CommercialOfferingVersionDTO> {
    const res = await fetch(`${BASE_URL}/offerings/${offeringId}/versions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar versão em rascunho.');
    }
    return res.json();
  },

  async publishVersion(versionId: string, dto: PublishOfferingVersionDTO): Promise<CommercialOfferingVersionDTO> {
    const res = await fetch(`${BASE_URL}/versions/${versionId}/publish`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao publicar versão da oferta.');
    }
    return res.json();
  },

  async listFeatures(category?: string): Promise<CommercialFeatureDTO[]> {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`${BASE_URL}/features${query}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar recursos técnicos.');
    }
    return res.json();
  },

  async createFeature(dto: { code: string; name: string; description?: string; category: string }): Promise<CommercialFeatureDTO> {
    const res = await fetch(`${BASE_URL}/features`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar recurso técnico.');
    }
    return res.json();
  },

  async listPlans(): Promise<CommercialOfferingDTO[]> {
    const res = await fetch(`${BASE_URL}/plans`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar planos.');
    }
    return res.json();
  },

  async listPackages(): Promise<CommercialOfferingDTO[]> {
    const res = await fetch(`${BASE_URL}/packages`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar pacotes.');
    }
    return res.json();
  },

  async listServices(): Promise<CommercialOfferingDTO[]> {
    const res = await fetch(`${BASE_URL}/services`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar serviços.');
    }
    return res.json();
  },

  async listCategories(): Promise<CommercialOfferingCategoryDTO[]> {
    const res = await fetch(`${BASE_URL}/categories`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao listar categorias com ofertas.');
    }
    return res.json();
  },

  async resolveOfferingTerms(offeringId: string, versionNumber?: number): Promise<CommercialDefaultTermDTO[]> {
    const query = versionNumber ? `?versionNumber=${versionNumber}` : '';
    const res = await fetch(`${BASE_URL}/offerings/${offeringId}/terms${query}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao resolver condições da oferta.');
    }
    return res.json();
  }
};
