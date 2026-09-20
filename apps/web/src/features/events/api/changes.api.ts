import {
  EventChangeRequestDTO,
  CreateEventChangeRequestInput
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/changes`;

export async function fetchEventChanges(
  eventId: string,
  filters?: { status?: string; classification?: string },
  customFetch: typeof fetch = fetch
): Promise<EventChangeRequestDTO[]> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.classification) query.set('classification', filters.classification);

  const res = await customFetch(`${buildBaseUrl(eventId)}?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao carregar alterações do evento');
  }
  const data = await res.json();
  return data.changeRequests;
}

export async function fetchEventChangeById(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<EventChangeRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar alteração');
  }
  const data = await res.json();
  return data.changeRequest;
}

export async function createEventChange(
  eventId: string,
  input: CreateEventChangeRequestInput,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(buildBaseUrl(eventId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar solicitação de alteração');
  }
  return res.json();
}

export async function recalculateChangeImpact(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/recalculate`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao recalcular impacto');
  }
  return res.json();
}

export async function submitChangeForApproval(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/submit`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao submeter solicitação');
  }
  return res.json();
}

export async function approveChangeRequest(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/approve`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao aprovar alteração');
  }
  return res.json();
}

export async function rejectChangeRequest(
  eventId: string,
  id: string,
  reason: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao rejeitar alteração');
  }
  return res.json();
}

export async function executeChangeRequest(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/execute`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao executar alteração');
  }
  return res.json();
}

export async function cancelChangeRequest(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; changeRequest: EventChangeRequestDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(id)}/cancel`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cancelar alteração');
  }
  return res.json();
}
