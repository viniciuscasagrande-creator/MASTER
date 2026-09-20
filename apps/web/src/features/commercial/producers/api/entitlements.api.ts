import {
  ProducerEntitlementDTO,
  ContractedProductSummaryDTO,
  EntitlementCheckResultDTO,
  CreateEntitlementOverrideDTO,
  EntitlementOverrideDTO,
  ReconcileEntitlementsResultDTO,
  LegacyMigrationDTO,
  EntitlementAuditLogDTO
} from '@shared/types/index';

const BASE_URL = '/api/v1/entitlements';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const EntitlementsApi = {
  async getProducerEntitlements(producerId: string): Promise<ProducerEntitlementDTO[]> {
    const res = await fetch(`${BASE_URL}/producer/${producerId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao carregar habilitações do produtor.');
    const json = await res.json();
    return json.data || [];
  },

  async getContractedProducts(producerId: string): Promise<ContractedProductSummaryDTO[]> {
    const res = await fetch(`${BASE_URL}/producer/${producerId}/contracted-products`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao carregar produtos contratados.');
    const json = await res.json();
    return json.data || [];
  },

  async checkEntitlement(producerId: string, featureCode: string, count = 1): Promise<EntitlementCheckResultDTO> {
    const res = await fetch(`${BASE_URL}/check/${producerId}/${featureCode}?count=${count}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao checar recurso.');
    const json = await res.json();
    return json.data;
  },

  async reconcileProducer(producerId: string): Promise<ReconcileEntitlementsResultDTO> {
    const res = await fetch(`${BASE_URL}/reconcile/${producerId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao reconciliar habilitações.');
    const json = await res.json();
    return json.data;
  },

  async createOverride(dto: CreateEntitlementOverrideDTO): Promise<EntitlementOverrideDTO> {
    const res = await fetch(`${BASE_URL}/overrides`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar override administrativo.');
    }
    const json = await res.json();
    return json.data;
  },

  async listOverrides(producerId?: string, status?: string): Promise<EntitlementOverrideDTO[]> {
    const params = new URLSearchParams();
    if (producerId) params.append('producerId', producerId);
    if (status) params.append('status', status);

    const res = await fetch(`${BASE_URL}/overrides?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao carregar overrides.');
    const json = await res.json();
    return json.data || [];
  },

  async revokeOverride(overrideId: string): Promise<EntitlementOverrideDTO> {
    const res = await fetch(`${BASE_URL}/overrides/${overrideId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao revogar override.');
    const json = await res.json();
    return json.data;
  },

  async migrateLegacy(dto: LegacyMigrationDTO): Promise<ProducerEntitlementDTO[]> {
    const res = await fetch(`${BASE_URL}/migration/legacy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    if (!res.ok) throw new Error('Falha ao migrar produtor legado.');
    const json = await res.json();
    return json.data || [];
  },

  async getAuditLogs(producerId: string): Promise<EntitlementAuditLogDTO[]> {
    const res = await fetch(`${BASE_URL}/audit/${producerId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao carregar logs de auditoria.');
    const json = await res.json();
    return json.data || [];
  },

  async listFeatures(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/features`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao carregar catálogo de recursos.');
    const json = await res.json();
    return json.data || [];
  }
};
