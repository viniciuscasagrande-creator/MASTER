import {
  SessionClosureReadinessDTO,
  SessionClosureRecordDTO,
  EventClosureReadinessDTO,
  EventClosureRecordDTO,
  EventClosureSnapshotDTO,
  ClosureOverrideDTO,
  EventOperationalReportDTO,
  CancellationImpactSnapshotDTO,
  EventCancellationRequestDTO,
  EventArchiveRecordDTO
} from '@shared/types/index';

export async function fetchSessionClosureReadiness(
  eventId: string,
  sessionId: string,
  customFetch: typeof fetch = fetch
): Promise<SessionClosureReadinessDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/sessions/${encodeURIComponent(sessionId)}/readiness`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao buscar prontidão da sessão');
  }
  return res.json();
}

export async function closeSession(
  eventId: string,
  sessionId: string,
  notes?: string,
  customFetch: typeof fetch = fetch
): Promise<SessionClosureRecordDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/sessions/${encodeURIComponent(sessionId)}/close`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao encerrar sessão');
  }
  return res.json();
}

export async function fetchEventClosureReadiness(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventClosureReadinessDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/readiness`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao buscar prontidão do evento');
  }
  return res.json();
}

export async function closeEvent(
  eventId: string,
  notes?: string,
  customFetch: typeof fetch = fetch
): Promise<{ closureRecord: EventClosureRecordDTO; snapshot: EventClosureSnapshotDTO }> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/close`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao encerrar evento');
  }
  return res.json();
}

export async function applyClosureOverride(
  eventId: string,
  payload: {
    scope: 'SESSION' | 'EVENT';
    targetId: string;
    checkCode: string;
    justification: string;
  },
  customFetch: typeof fetch = fetch
): Promise<ClosureOverrideDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/overrides`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao aplicar override');
  }
  return res.json();
}

export async function fetchPostEventReport(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventOperationalReportDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/closure/post-event`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao buscar relatório pós-evento');
  }
  return res.json();
}

export async function calculateCancellationImpact(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<CancellationImpactSnapshotDTO> {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/cancellation/impact${q}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao calcular impacto de cancelamento');
  }
  return res.json();
}

export async function requestEventCancellation(
  eventId: string,
  payload: {
    reason: string;
    cancellationCategory: string;
    refundPolicyNotes: string;
    notifyCustomers?: boolean;
    immediateExecuteIfPermitted?: boolean;
  },
  customFetch: typeof fetch = fetch
): Promise<EventCancellationRequestDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/cancellation/request`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao solicitar cancelamento');
  }
  return res.json();
}

export async function executeEventCancellation(
  eventId: string,
  requestId: string,
  customFetch: typeof fetch = fetch
): Promise<EventCancellationRequestDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/cancellation/requests/${encodeURIComponent(requestId)}/execute`;
  const res = await customFetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao executar cancelamento');
  }
  return res.json();
}

export async function cancelSessionOnly(
  eventId: string,
  sessionId: string,
  payload: {
    reason: string;
    cancellationCategory: string;
    refundPolicyNotes: string;
    notifyCustomers?: boolean;
  },
  customFetch: typeof fetch = fetch
): Promise<EventCancellationRequestDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/cancellation/sessions/${encodeURIComponent(sessionId)}/cancel`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao cancelar sessão');
  }
  return res.json();
}

export async function listCancellationRequests(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventCancellationRequestDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/cancellation/requests`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar solicitações de cancelamento');
  }
  return res.json();
}

export async function archiveEvent(
  eventId: string,
  justification: string,
  customFetch: typeof fetch = fetch
): Promise<EventArchiveRecordDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/archive/archive`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao arquivar evento');
  }
  return res.json();
}

export async function fetchEventArchiveRecord(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventArchiveRecordDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/archive/archive-record`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao buscar registro de arquivamento');
  }
  return res.json();
}

export async function listArchivedEvents(
  customFetch: typeof fetch = fetch
): Promise<EventArchiveRecordDTO[]> {
  const url = `/api/v1/events/archive/archived-list`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar eventos arquivados');
  }
  return res.json();
}
