import {
  InventorySummaryDTO,
  InventoryPoolDTO,
  InventoryAllocationDTO,
  SaveInventoryAllocationInput,
  InventoryBlockDTO,
  CreateInventoryBlockInput
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/inventory`;

export async function fetchInventorySummary(
  eventId: string,
  sessionId?: string,
  customFetch: typeof fetch = fetch
): Promise<InventorySummaryDTO> {
  const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  const url = `${buildBaseUrl(eventId)}/summary${params}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar resumo de inventário');
  }
  return res.json();
}

export async function fetchInventoryPools(
  eventId: string,
  sessionId: string,
  eventSectionId?: string,
  customFetch: typeof fetch = fetch
): Promise<InventoryPoolDTO[]> {
  const params = new URLSearchParams({ sessionId });
  if (eventSectionId) params.set('eventSectionId', eventSectionId);

  const url = `${buildBaseUrl(eventId)}/pools?${params.toString()}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar pools de inventário');
  }
  return res.json();
}

export async function saveInventoryAllocation(
  eventId: string,
  poolId: string,
  input: SaveInventoryAllocationInput,
  customFetch: typeof fetch = fetch
): Promise<InventoryAllocationDTO> {
  const url = `${buildBaseUrl(eventId)}/pools/${encodeURIComponent(poolId)}/allocations`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao salvar cota de inventário');
  }
  return res.json();
}

export async function removeInventoryAllocation(
  eventId: string,
  poolId: string,
  eventTicketTypeId: string,
  customFetch: typeof fetch = fetch
): Promise<void> {
  const url = `${buildBaseUrl(eventId)}/pools/${encodeURIComponent(poolId)}/allocations/${encodeURIComponent(eventTicketTypeId)}`;
  const res = await customFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao remover cota de inventário');
  }
}

export async function createInventoryBlock(
  eventId: string,
  poolId: string,
  input: CreateInventoryBlockInput,
  customFetch: typeof fetch = fetch
): Promise<InventoryBlockDTO> {
  const url = `${buildBaseUrl(eventId)}/pools/${encodeURIComponent(poolId)}/blocks`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar bloqueio de capacidade');
  }
  return res.json();
}

export async function releaseInventoryBlock(
  eventId: string,
  blockId: string,
  customFetch: typeof fetch = fetch
): Promise<void> {
  const url = `${buildBaseUrl(eventId)}/blocks/${encodeURIComponent(blockId)}`;
  const res = await customFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao liberar bloqueio');
  }
}
