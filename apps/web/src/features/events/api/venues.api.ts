import {
  VenueDTO,
  VenueSummaryDTO,
  CreateVenueInput,
  UpdateVenueInput,
  ListVenuesFilter,
  VenueSectionDTO,
  CreateVenueSectionInput,
  VenueAccessPointDTO,
  VenueAccessPointType,
  VenueMapDTO,
  VenueMapVersionDTO,
  EventVenueDTO,
  EventSectionDTO
} from '@shared/types/index';

const BASE_URL = '/api/v1/venues';

// --- 1. Resumo e Estatísticas ---
export async function fetchVenueSummary(
  producerId?: string,
  customFetch: typeof fetch = fetch
): Promise<VenueSummaryDTO> {
  const params = new URLSearchParams();
  if (producerId && producerId !== 'all') {
    params.set('producerId', producerId);
  }

  const url = `${BASE_URL}/summary?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao carregar resumo de locais');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 2. Listagem de Locais ---
export async function fetchVenues(
  filters: ListVenuesFilter = {},
  customFetch: typeof fetch = fetch
): Promise<{ venues: VenueDTO[]; total: number; nextCursor?: string }> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.city) params.set('city', filters.city);
  if (filters.state) params.set('state', filters.state);
  if (filters.type && filters.type !== 'ALL') params.set('type', filters.type);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.scope && filters.scope !== 'ALL') params.set('scope', filters.scope);
  if (filters.producerId && filters.producerId !== 'all') params.set('producerId', filters.producerId);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.cursor) params.set('cursor', filters.cursor);

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Falha ao carregar catálogo de locais');
  }

  const data = await response.json();
  return {
    venues: data.data || data.venues || [],
    total: data.total ?? data.pagination?.total ?? (data.data || []).length,
    nextCursor: data.nextCursor || data.pagination?.nextCursor
  };
}

// --- 3. Detalhes de um Local ---
export async function fetchVenueById(
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Local não encontrado');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 4. Criar Local ---
export async function createVenue(
  input: CreateVenueInput,
  customFetch: typeof fetch = fetch
): Promise<VenueDTO> {
  const response = await customFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar local');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 5. Atualizar Local ---
export async function updateVenue(
  venueId: string,
  input: UpdateVenueInput,
  customFetch: typeof fetch = fetch
): Promise<VenueDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao atualizar local');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 6. Arquivar Local ---
export async function archiveVenue(
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/archive`;
  const response = await customFetch(url, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao arquivar local');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 7. Setores Físicos ---
export async function fetchVenueSections(
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueSectionDTO[]> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/sections`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar setores');
  }

  const data = await response.json();
  return data.data || data;
}

export async function createVenueSection(
  venueId: string,
  input: CreateVenueSectionInput,
  customFetch: typeof fetch = fetch
): Promise<VenueSectionDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/sections`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar setor físico');
  }

  const data = await response.json();
  return data.data || data;
}

export async function updateVenueSection(
  sectionId: string,
  input: Partial<CreateVenueSectionInput> & { active?: boolean },
  customFetch: typeof fetch = fetch
): Promise<VenueSectionDTO> {
  const url = `${BASE_URL}/sections/${encodeURIComponent(sectionId)}`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao atualizar setor');
  }

  const data = await response.json();
  return data.data || data;
}

export async function deleteVenueSection(
  sectionId: string,
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean }> {
  const url = `${BASE_URL}/sections/${encodeURIComponent(sectionId)}`;
  const response = await customFetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao remover setor');
  }

  return response.json();
}

// --- 8. Acessos e Portões ---
export async function fetchVenueAccessPoints(
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueAccessPointDTO[]> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/access-points`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar acessos');
  }

  const data = await response.json();
  return data.data || data;
}

export async function createVenueAccessPoint(
  venueId: string,
  input: { name: string; code?: string; type: VenueAccessPointType; active?: boolean },
  customFetch: typeof fetch = fetch
): Promise<VenueAccessPointDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/access-points`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar ponto de acesso');
  }

  const data = await response.json();
  return data.data || data;
}

export async function updateVenueAccessPoint(
  accessPointId: string,
  input: { name?: string; code?: string; type?: VenueAccessPointType; active?: boolean },
  customFetch: typeof fetch = fetch
): Promise<VenueAccessPointDTO> {
  const url = `${BASE_URL}/access-points/${encodeURIComponent(accessPointId)}`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao atualizar ponto de acesso');
  }

  const data = await response.json();
  return data.data || data;
}

export async function deleteVenueAccessPoint(
  accessPointId: string,
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean }> {
  const url = `${BASE_URL}/access-points/${encodeURIComponent(accessPointId)}`;
  const response = await customFetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao remover ponto de acesso');
  }

  return response.json();
}

// --- 9. Mapas e Plantas ---
export async function fetchVenueMaps(
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueMapDTO[]> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/maps`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar mapas');
  }

  const data = await response.json();
  return data.data || data;
}

export async function createVenueMap(
  venueId: string,
  input: { name: string; description?: string },
  customFetch: typeof fetch = fetch
): Promise<VenueMapDTO> {
  const url = `${BASE_URL}/${encodeURIComponent(venueId)}/maps`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao criar mapa');
  }

  const data = await response.json();
  return data.data || data;
}

export async function fetchVenueMapById(
  mapId: string,
  versionId?: string,
  customFetch: typeof fetch = fetch
): Promise<{ map: VenueMapDTO; activeVersion: VenueMapVersionDTO | null; elements?: any[]; rows?: any[]; seats?: any[] }> {
  const params = new URLSearchParams();
  if (versionId) params.set('versionId', versionId);

  const url = `${BASE_URL}/maps/${encodeURIComponent(mapId)}?${params.toString()}`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar mapa');
  }

  const data = await response.json();
  return data.data || data;
}

export async function saveMapLayout(
  versionId: string,
  input: {
    elements?: any[];
    rows?: any[];
    seats?: any[];
    svgData?: string;
    width?: number;
    height?: number;
    scale?: number;
  },
  customFetch: typeof fetch = fetch
): Promise<VenueMapVersionDTO> {
  const url = `${BASE_URL}/map-versions/${encodeURIComponent(versionId)}/layout`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao salvar layout do mapa');
  }

  const data = await response.json();
  return data.data || data;
}

export async function publishMapVersion(
  versionId: string,
  customFetch: typeof fetch = fetch
): Promise<VenueMapVersionDTO> {
  const url = `${BASE_URL}/map-versions/${encodeURIComponent(versionId)}/publish`;
  const response = await customFetch(url, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao publicar versão do mapa');
  }

  const data = await response.json();
  return data.data || data;
}

export async function duplicateMapVersion(
  versionId: string,
  name?: string,
  customFetch: typeof fetch = fetch
): Promise<VenueMapVersionDTO> {
  const url = `${BASE_URL}/map-versions/${encodeURIComponent(versionId)}/duplicate`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao duplicar versão');
  }

  const data = await response.json();
  return data.data || data;
}

export async function bulkUpdateSeats(
  versionId: string,
  input: {
    seatIds: string[];
    updates: {
      seatType?: 'STANDARD' | 'VIP' | 'BOX' | 'TABLE_SEAT';
      accessible?: boolean;
      companionSeat?: boolean;
      restrictedView?: boolean;
      active?: boolean;
    };
  },
  customFetch: typeof fetch = fetch
): Promise<{ updatedCount: number }> {
  const url = `${BASE_URL}/map-versions/${encodeURIComponent(versionId)}/seats/bulk`;
  const response = await customFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro na atualização em lote de assentos');
  }

  const data = await response.json();
  return data.data || data;
}

// --- 10. Vínculo Evento-Local e Estrutura Operacional ---
export async function linkVenueToEvent(
  eventId: string,
  venueId: string,
  venueMapVersionId?: string,
  customFetch: typeof fetch = fetch
): Promise<{ eventVenue: EventVenueDTO; sectionsCount: number }> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/venues`;
  const response = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venueId, venueMapVersionId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao vincular local ao evento');
  }

  const data = await response.json();
  return data.data || data;
}

export async function fetchEventVenues(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventVenueDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/venues`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar locais vinculados ao evento');
  }

  const data = await response.json();
  return data.data || data;
}

export async function unlinkVenueFromEvent(
  eventId: string,
  venueId: string,
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean }> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/venues/${encodeURIComponent(venueId)}`;
  const response = await customFetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao desvincular local');
  }

  return response.json();
}

export async function fetchEventSections(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventSectionDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/sections`;
  const response = await customFetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao buscar setores operacionais do evento');
  }

  const data = await response.json();
  return data.data || data;
}

export async function updateEventSection(
  eventId: string,
  sectionId: string,
  input: { name?: string; capacity?: number; technicalReservation?: number; enabled?: boolean },
  customFetch: typeof fetch = fetch
): Promise<EventSectionDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/sections/${encodeURIComponent(sectionId)}`;
  const response = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Erro ao atualizar setor do evento');
  }

  const data = await response.json();
  return data.data || data;
}
