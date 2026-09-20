import {
  PricingMatrixDTO,
  SavePriceConfigurationInput,
  PriceConfigurationDTO,
  BulkPricingUpdateInput,
  BulkPricingUpdateResult,
  PriceSimulationInput,
  PriceSimulationResult
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/pricing`;

export async function fetchPricingMatrix(
  eventId: string,
  batchId: string,
  customFetch: typeof fetch = fetch
): Promise<PricingMatrixDTO> {
  const url = `${buildBaseUrl(eventId)}/matrix?batchId=${encodeURIComponent(batchId)}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao carregar matriz de preços');
  }
  return res.json();
}

export async function savePriceConfiguration(
  eventId: string,
  input: SavePriceConfigurationInput,
  customFetch: typeof fetch = fetch
): Promise<PriceConfigurationDTO> {
  const url = `${buildBaseUrl(eventId)}/config`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao salvar configuração de preço');
  }
  return res.json();
}

export async function bulkUpdatePricing(
  eventId: string,
  input: BulkPricingUpdateInput,
  customFetch: typeof fetch = fetch
): Promise<BulkPricingUpdateResult> {
  const url = `${buildBaseUrl(eventId)}/bulk`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha na alteração em massa de preços');
  }
  return res.json();
}

export async function copyPricingFromBatch(
  eventId: string,
  fromBatchId: string,
  toBatchId: string,
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean; copiedCount: number }> {
  const url = `${buildBaseUrl(eventId)}/copy`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromBatchId, toBatchId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao copiar preços entre lotes');
  }
  return res.json();
}

export async function simulatePrice(
  eventId: string,
  input: PriceSimulationInput,
  customFetch: typeof fetch = fetch
): Promise<PriceSimulationResult> {
  const url = `${buildBaseUrl(eventId)}/simulate`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao simular preço');
  }
  return res.json();
}
