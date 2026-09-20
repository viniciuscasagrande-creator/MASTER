import {
  EventTeamDTO,
  CreateEventTeamInput,
  EventTeamMemberDTO,
  CreateEventTeamMemberInput,
  EventTeamShiftDTO,
  CreateEventTeamShiftInput,
  EventResponsibilityDTO,
  CreateEventResponsibilityInput,
  ShiftConflictDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/team`;

export async function fetchEventTeams(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventTeamDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/teams`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar equipes');
  }
  return res.json();
}

export async function createEventTeam(
  eventId: string,
  input: CreateEventTeamInput,
  customFetch: typeof fetch = fetch
): Promise<EventTeamDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar equipe');
  }
  return res.json();
}

export async function fetchTeamMembers(
  eventId: string,
  teamId?: string,
  customFetch: typeof fetch = fetch
): Promise<EventTeamMemberDTO[]> {
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const res = await customFetch(`${buildBaseUrl(eventId)}/members${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar membros');
  }
  return res.json();
}

export async function addTeamMember(
  eventId: string,
  input: CreateEventTeamMemberInput,
  customFetch: typeof fetch = fetch
): Promise<EventTeamMemberDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao adicionar membro');
  }
  return res.json();
}

export async function fetchShifts(
  eventId: string,
  teamId?: string,
  sessionId?: string,
  customFetch: typeof fetch = fetch
): Promise<EventTeamShiftDTO[]> {
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);
  if (sessionId) params.append('sessionId', sessionId);
  const q = params.toString() ? `?${params.toString()}` : '';

  const res = await customFetch(`${buildBaseUrl(eventId)}/shifts${q}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar escalas');
  }
  return res.json();
}

export async function createShift(
  eventId: string,
  input: CreateEventTeamShiftInput,
  customFetch: typeof fetch = fetch
): Promise<EventTeamShiftDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar turno de trabalho');
  }
  return res.json();
}

export async function assignMembersToShift(
  eventId: string,
  shiftId: string,
  memberIds: string[],
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean; assignedCount?: number; conflicts?: ShiftConflictDTO[] }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/shifts/${encodeURIComponent(shiftId)}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 409 && err.conflicts) {
      return { success: false, conflicts: err.conflicts };
    }
    throw new Error(err.error || 'Falha ao alocar membros no turno');
  }
  return res.json();
}

export async function fetchResponsibilities(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventResponsibilityDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/responsibilities`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar responsabilidades');
  }
  return res.json();
}

export async function assignResponsibility(
  eventId: string,
  input: CreateEventResponsibilityInput,
  customFetch: typeof fetch = fetch
): Promise<EventResponsibilityDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/responsibilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atribuir responsabilidade');
  }
  return res.json();
}
