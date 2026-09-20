import {
  OperationSnapshotDTO,
  OperationReadinessDTO,
  OperationCommandDTO,
  OperationAreaDTO,
  OperationShiftDTO,
  SessionAccessPointDTO,
  OperationBroadcastDTO,
  OperationHandoffDTO,
  OperationTimelineEventDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string, sessionId?: string | null) => {
  if (sessionId) {
    return `/api/v1/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(sessionId)}/operation`;
  }
  return `/api/v1/events/${encodeURIComponent(eventId)}/operation`;
};

export async function fetchOperationSnapshot(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationSnapshotDTO> {
  const url = `${buildBaseUrl(eventId, sessionId)}/snapshot`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar snapshot da Central de Operação');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationReadiness(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationReadinessDTO> {
  const url = `${buildBaseUrl(eventId, sessionId)}/readiness`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar prontidão operacional');
  }
  const data = await res.json();
  return data.data;
}

export async function startOperation(
  eventId: string,
  sessionId?: string | null,
  payload: { override?: boolean; overrideReason?: string; notes?: string } = {},
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `${buildBaseUrl(eventId, sessionId)}/start`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...payload })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao iniciar operação');
  }
  const data = await res.json();
  return data.data;
}

export async function closingOperation(
  eventId: string,
  sessionId?: string | null,
  payload: { override?: boolean; overrideReason?: string; notes?: string } = {},
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `${buildBaseUrl(eventId, sessionId)}/closing`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...payload })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao iniciar processo de encerramento');
  }
  const data = await res.json();
  return data.data;
}

export async function closeOperation(
  eventId: string,
  sessionId?: string | null,
  payload: { override?: boolean; overrideReason?: string; notes?: string } = {},
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `${buildBaseUrl(eventId, sessionId)}/close`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...payload })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao encerrar operação');
  }
  const data = await res.json();
  return data.data;
}

export async function executeOperationCommand(
  eventId: string,
  payload: {
    commandType: string;
    targetType?: string;
    targetId?: string | null;
    executionMode?: 'LOGICAL' | 'INTEGRATION';
    idempotencyKey?: string;
    reason?: string;
    payload?: any;
    sessionId?: string | null;
  },
  customFetch: typeof fetch = fetch
): Promise<OperationCommandDTO> {
  const url = `${buildBaseUrl(eventId, payload.sessionId)}/commands`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao executar comando operacional');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationCommands(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationCommandDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/commands`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao listar comandos');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationAreas(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationAreaDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/areas`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar áreas operacionais');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationTeamShifts(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationShiftDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/team`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar escala da equipe');
  }
  const data = await res.json();
  return data.data;
}

export async function checkInOperationShift(
  shiftId: string,
  notes?: string,
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `/api/v1/events/_/operation/team/${encodeURIComponent(shiftId)}/checkin`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao confirmar presença');
  }
  const data = await res.json();
  return data.data;
}

export async function checkOutOperationShift(
  shiftId: string,
  notes?: string,
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `/api/v1/events/_/operation/team/${encodeURIComponent(shiftId)}/checkout`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao registrar saída');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationAccessPoints(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<SessionAccessPointDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/access-points`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao buscar pontos de acesso');
  }
  const data = await res.json();
  return data.data;
}

export async function updateAccessPointStatus(
  accessPointId: string,
  status: 'OPEN' | 'CLOSED' | 'PAUSED',
  executionMode: 'LOGICAL' | 'INTEGRATION' = 'LOGICAL',
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `/api/v1/events/_/operation/access-points/${encodeURIComponent(accessPointId)}/status`;
  const res = await customFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, executionMode })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao atualizar ponto de acesso');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationBroadcasts(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationBroadcastDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/broadcasts`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar comunicados');
  }
  const data = await res.json();
  return data.data;
}

export async function createOperationBroadcast(
  eventId: string,
  payload: {
    targetAreaId?: string | null;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    requiresAck?: boolean;
    sessionId?: string | null;
  },
  customFetch: typeof fetch = fetch
): Promise<OperationBroadcastDTO> {
  const url = `${buildBaseUrl(eventId, payload.sessionId)}/broadcasts`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao enviar comunicado');
  }
  const data = await res.json();
  return data.data;
}

export async function ackOperationBroadcast(
  broadcastId: string,
  customFetch: typeof fetch = fetch
): Promise<any> {
  const url = `/api/v1/events/_/operation/broadcasts/${encodeURIComponent(broadcastId)}/ack`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao confirmar leitura');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationHandoffs(
  eventId: string,
  sessionId?: string | null,
  customFetch: typeof fetch = fetch
): Promise<OperationHandoffDTO[]> {
  const url = `${buildBaseUrl(eventId, sessionId)}/handoff`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar passagens de turno');
  }
  const data = await res.json();
  return data.data;
}

export async function registerOperationHandoff(
  eventId: string,
  payload: {
    areaId?: string | null;
    toUserId: string;
    toUserName: string;
    notes: string;
    sessionId?: string | null;
  },
  customFetch: typeof fetch = fetch
): Promise<OperationHandoffDTO> {
  const url = `${buildBaseUrl(eventId, payload.sessionId)}/handoff`;
  const res = await customFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao registrar passagem de turno');
  }
  const data = await res.json();
  return data.data;
}

export async function fetchOperationTimeline(
  eventId: string,
  params: {
    sessionId?: string | null;
    afterSequence?: number;
    limit?: number;
  } = {},
  customFetch: typeof fetch = fetch
): Promise<{ timeline: OperationTimelineEventDTO[]; sequence: number }> {
  const query = new URLSearchParams();
  if (params.afterSequence !== undefined) query.set('afterSequence', String(params.afterSequence));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const url = `${buildBaseUrl(eventId, params.sessionId)}/timeline?${query.toString()}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha ao carregar linha do tempo operacional');
  }
  const data = await res.json();
  return { timeline: data.data, sequence: data.sequence };
}
