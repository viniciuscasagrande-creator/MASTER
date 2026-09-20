import { EventReadinessDTO } from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/readiness`;

export async function fetchEventReadiness(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventReadinessDTO> {
  const res = await customFetch(buildBaseUrl(eventId));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao avaliar prontidão do evento');
  }
  return res.json();
}

export async function triggerReadinessEvaluation(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventReadinessDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/evaluate`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao reavaliar prontidão do evento');
  }
  return res.json();
}
