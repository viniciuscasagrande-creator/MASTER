import {
  AccessValidationRequestDTO,
  AccessValidationResultDTO,
  CheckinSummaryDTO,
  AccessDeviceDTO,
  DeviceSessionDTO,
  AccessRuleDTO,
  OfflineValidationBundleDTO,
  OfflineSyncBatchDTO,
  OfflineConflictDTO,
  AccessExceptionRequestDTO,
  TicketAccessBlockDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string, sessionId?: string | null) => {
  if (sessionId) {
    return `/api/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/checkin`;
  }
  return `/api/v1/events/${encodeURIComponent(eventId)}/checkin`;
};

export async function validateTicket(
  eventId: string,
  payload: AccessValidationRequestDTO,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<AccessValidationResultDTO> {
  const url = `${buildBaseUrl(eventId, sessionId)}/validate`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao validar ingresso');
  }
  return res.json();
}

export async function fetchCheckinSummary(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<CheckinSummaryDTO> {
  const url = `${buildBaseUrl(eventId, sessionId)}/summary`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao buscar resumo de check-in');
  }
  return res.json();
}

export async function listAccessDevices(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<AccessDeviceDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar dispositivos');
  }
  return res.json();
}

export async function registerAccessDevice(
  eventId: string,
  payload: {
    name: string;
    deviceCode?: string;
    type: string;
    allowedAccessPointIds?: string[];
    allowedSessionIds?: string[];
  },
  customFetch: typeof fetch = fetch
): Promise<AccessDeviceDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao cadastrar dispositivo');
  }
  return res.json();
}

export async function authorizeAccessDevice(
  eventId: string,
  deviceId: string,
  customFetch: typeof fetch = fetch
): Promise<AccessDeviceDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices/${encodeURIComponent(deviceId)}/authorize`;
  const res = await customFetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao autorizar dispositivo');
  }
  return res.json();
}

export async function revokeAccessDevice(
  eventId: string,
  deviceId: string,
  reason: string,
  customFetch: typeof fetch = fetch
): Promise<AccessDeviceDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices/${encodeURIComponent(deviceId)}/revoke`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao revogar dispositivo');
  }
  return res.json();
}

export async function startDeviceSession(
  eventId: string,
  payload: {
    deviceId: string;
    sessionId: string;
    accessPointId: string;
    operatorName?: string;
  },
  customFetch: typeof fetch = fetch
): Promise<DeviceSessionDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices/sessions/start`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao iniciar turno no dispositivo');
  }
  return res.json();
}

export async function endDeviceSession(
  eventId: string,
  sessionId: string,
  customFetch: typeof fetch = fetch
): Promise<DeviceSessionDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/devices/sessions/${encodeURIComponent(sessionId)}/end`;
  const res = await customFetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao finalizar turno no dispositivo');
  }
  return res.json();
}

export async function listAccessRules(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<AccessRuleDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/rules`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar regras de acesso');
  }
  return res.json();
}

export async function createAccessRule(
  eventId: string,
  payload: Partial<AccessRuleDTO>,
  customFetch: typeof fetch = fetch
): Promise<AccessRuleDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/rules`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao criar regra de acesso');
  }
  return res.json();
}

export async function generateOfflineBundle(
  eventId: string,
  payload: {
    sessionId: string;
    accessPointId: string;
    deviceId: string;
    validityHours?: number;
  },
  customFetch: typeof fetch = fetch
): Promise<OfflineValidationBundleDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/offline/bundle`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao gerar pacote offline');
  }
  return res.json();
}

export async function syncOfflineBatch(
  eventId: string,
  batch: OfflineSyncBatchDTO,
  customFetch: typeof fetch = fetch
): Promise<{ batchId: string; itemsCount: number; acceptedCount: number; conflictsCount: number; conflicts: OfflineConflictDTO[] }> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/offline/sync`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao sincronizar lote offline');
  }
  return res.json();
}

export async function listOfflineConflicts(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<OfflineConflictDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/offline/conflicts`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar conflitos offline');
  }
  return res.json();
}

export async function resolveOfflineConflict(
  eventId: string,
  conflictId: string,
  notes: string,
  customFetch: typeof fetch = fetch
): Promise<OfflineConflictDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/offline/conflicts/${encodeURIComponent(conflictId)}/resolve`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao resolver conflito offline');
  }
  return res.json();
}

export async function listPendingExceptions(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<AccessExceptionRequestDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/exceptions/pending`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar exceções');
  }
  return res.json();
}

export async function reviewException(
  eventId: string,
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  decisionNotes?: string,
  customFetch: typeof fetch = fetch
): Promise<AccessExceptionRequestDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/exceptions/${encodeURIComponent(requestId)}/review`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, decisionNotes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao avaliar exceção');
  }
  return res.json();
}

export async function listTicketBlocks(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<TicketAccessBlockDTO[]> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/blocks`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao listar bloqueios de ingressos');
  }
  return res.json();
}

export async function blockTicket(
  eventId: string,
  payload: { ticketId: string; ticketNumber: string; reason: string },
  customFetch: typeof fetch = fetch
): Promise<TicketAccessBlockDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/blocks`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao bloquear ingresso');
  }
  return res.json();
}

export async function unblockTicket(
  eventId: string,
  ticketId: string,
  unblockReason: string,
  customFetch: typeof fetch = fetch
): Promise<TicketAccessBlockDTO> {
  const url = `/api/v1/events/${encodeURIComponent(eventId)}/checkin/blocks/${encodeURIComponent(ticketId)}/unblock`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unblockReason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Falha ao desbloquear ingresso');
  }
  return res.json();
}
