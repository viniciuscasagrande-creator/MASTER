import {
  SalesChannelDTO,
  EventSalesChannelDTO,
  ConfigureEventSalesChannelInput,
  SaveChannelAllocationInput,
  ChannelAllocationDTO,
  SalesPointDTO,
  SalesPartnerDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/sales-channels`;

export async function fetchAvailableChannels(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<SalesChannelDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/available`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar canais disponíveis');
  }
  return res.json();
}

export async function fetchEventChannels(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventSalesChannelDTO[]> {
  const res = await customFetch(buildBaseUrl(eventId));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar canais do evento');
  }
  return res.json();
}

export async function configureChannel(
  eventId: string,
  input: ConfigureEventSalesChannelInput,
  customFetch: typeof fetch = fetch
): Promise<EventSalesChannelDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao configurar canal de venda');
  }
  return res.json();
}

export async function toggleChannel(
  eventId: string,
  salesChannelId: string,
  enabled: boolean,
  customFetch: typeof fetch = fetch
): Promise<EventSalesChannelDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(salesChannelId)}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao alterar status do canal');
  }
  return res.json();
}

export async function saveChannelAllocation(
  eventId: string,
  eventSalesChannelId: string,
  input: SaveChannelAllocationInput,
  customFetch: typeof fetch = fetch
): Promise<ChannelAllocationDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(eventSalesChannelId)}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao alocar estoque para o canal');
  }
  return res.json();
}

export async function fetchSalesPoints(
  eventId: string,
  venueId?: string,
  customFetch: typeof fetch = fetch
): Promise<SalesPointDTO[]> {
  const query = venueId ? `?venueId=${encodeURIComponent(venueId)}` : '';
  const res = await customFetch(`${buildBaseUrl(eventId)}/points/list${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar pontos de venda');
  }
  return res.json();
}

export async function fetchSalesPartners(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<SalesPartnerDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/partners/list`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar parceiros comerciais');
  }
  return res.json();
}
