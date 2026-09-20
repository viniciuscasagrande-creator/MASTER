import {
  AvailableTransitionDTO,
  EventReviewSnapshotDTO,
  EventPublicationScheduleDTO,
  EventPreviewTokenDTO,
  EventTransitionInput,
  PublishEventInput,
  PauseSalesInput,
  EventStatus
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}`;

export async function fetchEventTransitions(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<{ currentStatus: EventStatus; transitions: AvailableTransitionDTO[] }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/lifecycle/transitions`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao carregar transições do evento');
  }
  return res.json();
}

export async function requestEventTransition(
  eventId: string,
  input: EventTransitionInput,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; data: any }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/lifecycle/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao executar transição de status');
  }
  return res.json();
}

export async function fetchLatestSnapshot(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventReviewSnapshotDTO | null> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/review/snapshot`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar snapshot de revisão');
  }
  const data = await res.json();
  return data.snapshot;
}

export async function createReviewSnapshot(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; snapshot: EventReviewSnapshotDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/review/snapshot`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar snapshot de revisão');
  }
  return res.json();
}

export async function verifySnapshotIntegrity(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<{ valid: boolean; currentHash: string; snapshotHash?: string; reason?: string; snapshot?: EventReviewSnapshotDTO | null }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/review/verify`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao verificar integridade do snapshot');
  }
  return res.json();
}

export async function publishEventImmediate(
  eventId: string,
  input: PublishEventInput,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; data: any }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao publicar evento');
  }
  return res.json();
}

export async function schedulePublication(
  eventId: string,
  input: PublishEventInput,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; schedule: EventPublicationScheduleDTO }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao agendar publicação');
  }
  return res.json();
}

export async function fetchPublicationSchedules(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventPublicationScheduleDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/schedules`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao listar agendamentos');
  }
  const data = await res.json();
  return data.schedules;
}

export async function pauseSales(
  eventId: string,
  input: PauseSalesInput,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; data: any }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao pausar vendas');
  }
  return res.json();
}

export async function resumeSales(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<{ message: string; data: any }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/resume`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao retomar vendas');
  }
  return res.json();
}

export async function fetchPreviewToken(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventPreviewTokenDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/publication/preview-token`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao gerar token de pré-visualização');
  }
  return res.json();
}
