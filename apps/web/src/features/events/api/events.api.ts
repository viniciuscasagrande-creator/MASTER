import {
  EventListItemDTO,
  EventDetailDTO,
  EventSummaryDTO,
  ListEventsFilter,
  CreateEventInputDTO,
  EventContextResponse
} from '../types/event.types';

const BASE_URL = '/api/v1/events';

export async function fetchEvents(
  filters: ListEventsFilter = {},
  customFetch: typeof fetch = fetch
): Promise<{ events: EventListItemDTO[]; total: number; nextCursor?: string }> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.producerId && filters.producerId !== 'all') params.set('producerId', filters.producerId);
  if (filters.city) params.set('city', filters.city);
  if (filters.state) params.set('state', filters.state);
  if (filters.period && filters.period !== 'all') params.set('period', filters.period);
  if (filters.from) params.set('from', typeof filters.from === 'string' ? filters.from : filters.from.toISOString());
  if (filters.to) params.set('to', typeof filters.to === 'string' ? filters.to : filters.to.toISOString());
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.cursor) params.set('cursor', filters.cursor);

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao carregar eventos');
  }

  const data = await response.json();
  return {
    events: data.data || data.events || [],
    total: data.total ?? data.pagination?.total ?? (data.data || []).length,
    nextCursor: data.nextCursor || data.pagination?.nextCursor
  };
}

export async function fetchEventSummary(
  producerId?: string,
  customFetch: typeof fetch = fetch
): Promise<EventSummaryDTO> {
  const params = new URLSearchParams();
  if (producerId && producerId !== 'all') {
    params.set('producerId', producerId);
  }

  const url = `${BASE_URL}/summary?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao carregar resumo de eventos');
  }

  const data = await response.json();
  return data.data || data;
}

export async function fetchEventById(
  eventIdOrCode: string,
  customFetch: typeof fetch = fetch
): Promise<EventDetailDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(eventIdOrCode)}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Evento não encontrado');
  }

  const data = await response.json();
  return data.data || data;
}

export async function createEvent(
  input: CreateEventInputDTO,
  customFetch: typeof fetch = fetch
): Promise<EventDetailDTO> {
  const response = await customFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar evento');
  }

  const data = await response.json();
  return data.data || data;
}

export async function selectEventContext(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventContextResponse> {
  const url = `${BASE_URL}/${encodeURIComponent(eventId)}/context`;
  const response = await customFetch(url, {
    method: 'PUT'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao selecionar contexto do evento');
  }

  return response.json();
}
