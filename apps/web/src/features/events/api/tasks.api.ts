import {
  EventTaskDTO,
  CreateEventTaskInput,
  ReadinessIssueDTO
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/tasks`;

export async function fetchEventTasks(
  eventId: string,
  status?: string,
  customFetch: typeof fetch = fetch
): Promise<EventTaskDTO[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await customFetch(`${buildBaseUrl(eventId)}${q}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar pendências');
  }
  return res.json();
}

export async function createEventTask(
  eventId: string,
  input: CreateEventTaskInput,
  customFetch: typeof fetch = fetch
): Promise<EventTaskDTO> {
  const res = await customFetch(buildBaseUrl(eventId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar pendência');
  }
  return res.json();
}

export async function updateEventTaskStatus(
  eventId: string,
  taskId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  customFetch: typeof fetch = fetch
): Promise<EventTaskDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(taskId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar status da pendência');
  }
  return res.json();
}

export async function generateTasksFromReadiness(
  eventId: string,
  issues: ReadinessIssueDTO[],
  customFetch: typeof fetch = fetch
): Promise<{ success: boolean; count: number; tasks: EventTaskDTO[] }> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/generate-from-readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issues })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao sincronizar pendências');
  }
  return res.json();
}
