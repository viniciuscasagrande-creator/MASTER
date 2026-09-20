import {
  TicketBatchDTO,
  CreateTicketBatchInput,
  UpdateTicketBatchInput,
  TicketBatchStatus
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/batches`;

export async function fetchBatches(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<TicketBatchDTO[]> {
  const url = buildBaseUrl(eventId);
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar lotes');
  }
  return res.json();
}

export async function fetchBatch(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<TicketBatchDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar lote');
  }
  return res.json();
}

export async function createBatch(
  eventId: string,
  input: CreateTicketBatchInput,
  customFetch: typeof fetch = fetch
): Promise<TicketBatchDTO> {
  const url = buildBaseUrl(eventId);
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar lote');
  }
  return res.json();
}

export async function updateBatch(
  eventId: string,
  id: string,
  input: UpdateTicketBatchInput,
  customFetch: typeof fetch = fetch
): Promise<TicketBatchDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar lote');
  }
  return res.json();
}

export async function transitionBatchStatus(
  eventId: string,
  id: string,
  status: TicketBatchStatus,
  customFetch: typeof fetch = fetch
): Promise<TicketBatchDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/status`;
  const res = await customFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao alterar status do lote');
  }
  return res.json();
}

export async function deleteBatch(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<void> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao excluir lote');
  }
}
