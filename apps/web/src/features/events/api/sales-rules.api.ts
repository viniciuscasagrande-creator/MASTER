import {
  SalesRuleDTO,
  CreateSalesRuleInput,
  UpdateSalesRuleInput,
  SalesRuleScope
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/sales-rules`;

export async function fetchSalesRules(
  eventId: string,
  scope?: SalesRuleScope,
  scopeId?: string,
  customFetch: typeof fetch = fetch
): Promise<SalesRuleDTO[]> {
  const params = new URLSearchParams();
  if (scope) params.set('scope', scope);
  if (scopeId) params.set('scopeId', scopeId);

  const url = `${buildBaseUrl(eventId)}?${params.toString()}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar regras de venda');
  }
  return res.json();
}

export async function createSalesRule(
  eventId: string,
  input: CreateSalesRuleInput,
  customFetch: typeof fetch = fetch
): Promise<SalesRuleDTO> {
  const url = buildBaseUrl(eventId);
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar regra de venda');
  }
  return res.json();
}

export async function updateSalesRule(
  eventId: string,
  id: string,
  input: UpdateSalesRuleInput,
  customFetch: typeof fetch = fetch
): Promise<SalesRuleDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar regra de venda');
  }
  return res.json();
}

export async function deleteSalesRule(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<void> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao excluir regra de venda');
  }
}
