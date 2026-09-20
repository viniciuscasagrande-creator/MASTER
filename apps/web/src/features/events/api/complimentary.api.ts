import {
  ComplimentaryCategoryDTO,
  ComplimentaryQuotaDTO,
  ComplimentaryRequestDTO,
  CreateComplimentaryRequestInput,
  AddComplimentaryGuestsInput,
  ComplimentaryGuestDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/complimentary`;

export async function fetchComplimentaryCategories(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryCategoryDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/categories`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar categorias de cortesia');
  }
  return res.json();
}

export async function fetchComplimentaryQuotas(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryQuotaDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/quotas`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar cotas de cortesia');
  }
  return res.json();
}

export async function saveComplimentaryQuota(
  eventId: string,
  data: { sessionId?: string; sectionId?: string; quantityLimit: number; policyId?: string },
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryQuotaDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/quotas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao salvar cota de cortesia');
  }
  return res.json();
}

export async function fetchComplimentaryRequests(
  eventId: string,
  status?: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar solicitações de cortesia');
  }
  return res.json();
}

export async function createComplimentaryRequest(
  eventId: string,
  input: CreateComplimentaryRequestInput,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar solicitação de cortesia');
  }
  return res.json();
}

export async function addComplimentaryGuests(
  eventId: string,
  requestId: string,
  input: AddComplimentaryGuestsInput,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryGuestDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests/${encodeURIComponent(requestId)}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao adicionar convidados');
  }
  return res.json();
}

export async function approveComplimentaryRequest(
  eventId: string,
  requestId: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao aprovar solicitação');
  }
  return res.json();
}

export async function rejectComplimentaryRequest(
  eventId: string,
  requestId: string,
  reason: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao rejeitar solicitação');
  }
  return res.json();
}

export async function issueComplimentaryTickets(
  eventId: string,
  requestId: string,
  guestIds?: string[],
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests/${encodeURIComponent(requestId)}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao emitir ingressos cortesia');
  }
  return res.json();
}

export async function cancelComplimentaryRequest(
  eventId: string,
  requestId: string,
  reason: string,
  customFetch: typeof fetch = fetch
): Promise<ComplimentaryRequestDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cancelar solicitação');
  }
  return res.json();
}
