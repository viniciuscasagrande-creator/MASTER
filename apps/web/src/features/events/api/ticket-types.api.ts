import {
  TicketTypeDTO,
  EventTicketTypeDTO,
  CreateEventTicketTypeInput,
  UpdateEventTicketTypeInput
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/ticket-types`;

export async function fetchTicketTypeCatalog(
  category?: string,
  customFetch: typeof fetch = fetch
): Promise<TicketTypeDTO[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const url = `/api/v1/events/dummy/ticket-types/catalog${params}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar catálogo de tipos de ingresso');
  }
  return res.json();
}

export async function fetchEventTicketTypes(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventTicketTypeDTO[]> {
  const url = buildBaseUrl(eventId);
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar tipos de ingresso do evento');
  }
  return res.json();
}

export async function fetchEventTicketType(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<EventTicketTypeDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar tipo de ingresso');
  }
  return res.json();
}

export async function createEventTicketType(
  eventId: string,
  input: CreateEventTicketTypeInput,
  customFetch: typeof fetch = fetch
): Promise<EventTicketTypeDTO> {
  const url = buildBaseUrl(eventId);
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar tipo de ingresso');
  }
  return res.json();
}

export async function updateEventTicketType(
  eventId: string,
  id: string,
  input: UpdateEventTicketTypeInput,
  customFetch: typeof fetch = fetch
): Promise<EventTicketTypeDTO> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar tipo de ingresso');
  }
  return res.json();
}

export async function deleteEventTicketType(
  eventId: string,
  id: string,
  customFetch: typeof fetch = fetch
): Promise<void> {
  const url = `${buildBaseUrl(eventId)}/${encodeURIComponent(id)}`;
  const res = await customFetch(url, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao excluir tipo de ingresso');
  }
}
