import {
  EventSessionDTO,
  EventSessionStatus,
  CreateEventSessionInput,
  UpdateEventSessionInput,
  DuplicateEventSessionInput,
  SessionCapacityReservationDTO,
  SessionReservationType,
  SessionConflictDTO,
  BulkSessionsPreviewInput,
  BulkSessionsPreviewResult
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/sessions`;

export interface SessionSummaryDTO {
  total: number;
  byStatus: Record<EventSessionStatus, number>;
  totalCapacity: number;
  totalReserved: number;
  totalAvailable: number;
  nextSessionDate?: string | null;
}

// --- 1. Resumo e Estatísticas de Sessões ---
export async function fetchSessionSummary(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<SessionSummaryDTO> {
  const url = `${buildBaseUrl(eventId)}/summary`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao carregar resumo de sessões');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 2. Listagem de Sessões ---
export async function fetchEventSessions(
  eventId: string,
  filters?: { status?: string; from?: string; to?: string },
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);

  const url = `${buildBaseUrl(eventId)}?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao buscar sessões do evento');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 3. Detalhes de uma Sessão ---
export async function fetchSessionById(
  eventId: string,
  sessionId: string,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Sessão não encontrada');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 4. Criar Sessão ---
export async function createEventSession(
  eventId: string,
  input: CreateEventSessionInput,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = buildBaseUrl(eventId);
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar sessão');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 5. Atualizar Sessão ---
export async function updateEventSession(
  eventId: string,
  sessionId: string,
  input: UpdateEventSessionInput,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao atualizar sessão');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 6. Alterar Status da Sessão (State Machine) ---
export async function changeSessionStatus(
  eventId: string,
  sessionId: string,
  status: EventSessionStatus,
  notes?: string,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}/status`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao alterar status da sessão');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 7. Duplicar Sessão ---
export async function duplicateSession(
  eventId: string,
  sessionId: string,
  input: DuplicateEventSessionInput,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}/duplicate`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao duplicar sessão');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 8. Conflitos de Agenda e Capacidade ---
export async function checkSessionConflicts(
  eventId: string,
  params: {
    venueId?: string;
    startAt?: string;
    endAt?: string;
    doorsOpenAt?: string;
    excludeSessionId?: string;
  },
  customFetch: typeof fetch = fetch
): Promise<SessionConflictDTO> {
  const qp = new URLSearchParams();
  if (params.venueId) qp.set('venueId', params.venueId);
  if (params.startAt) qp.set('startAt', params.startAt);
  if (params.endAt) qp.set('endAt', params.endAt);
  if (params.doorsOpenAt) qp.set('doorsOpenAt', params.doorsOpenAt);
  if (params.excludeSessionId) qp.set('excludeSessionId', params.excludeSessionId);

  const url = `${buildBaseUrl(eventId)}/conflicts?${qp.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao verificar conflitos de agenda');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 9. Recorrência e Criação em Lote ---
export async function previewSessionRecurrence(
  eventId: string,
  input: BulkSessionsPreviewInput,
  customFetch: typeof fetch = fetch
): Promise<BulkSessionsPreviewResult> {
  const url = `${buildBaseUrl(eventId)}/bulk-preview`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao pré-visualizar recorrência');
  }

  const data = await response.json();
  return data.data || data;
}

export async function createBulkSessions(
  eventId: string,
  input: BulkSessionsPreviewInput,
  customFetch: typeof fetch = fetch
): Promise<{ count: number; sessions: EventSessionDTO[] }> {
  const url = `${buildBaseUrl(eventId)}/bulk-create`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao gerar sessões em lote');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 10. Reservas Técnicas de Capacidade ---
export async function addSessionReservation(
  eventId: string,
  sessionId: string,
  input: {
    sectionId?: string;
    type: SessionReservationType;
    quantity: number;
    reason?: string;
  },
  customFetch: typeof fetch = fetch
): Promise<SessionCapacityReservationDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}/reservations`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao adicionar reserva técnica');
  }

  const data = await response.json();
  return data.data || data;
}

export async function removeSessionReservation(
  eventId: string,
  sessionId: string,
  reservationId: string,
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean }> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}/reservations/${encodeURIComponent(reservationId)}`;
  const response = await customFetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao remover reserva');
  }

  return response.json();
}

// --- 11. Arquivar Sessão ---
export async function archiveSession(
  eventId: string,
  sessionId: string,
  customFetch: typeof fetch = fetch
): Promise<EventSessionDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(sessionId)}/archive`;
  const response = await customFetch(url, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao arquivar sessão');
  }

  const data = await response.json();
  return data.data || data;
}
