import {
  EventDashboardDTO,
  DashboardAlertDTO,
  DashboardViewType
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/dashboard`;

export async function fetchEventDashboard(
  eventId: string,
  params: {
    sessionId?: string | null;
    viewType?: DashboardViewType;
  } = {},
  customFetch: typeof fetch = fetch
): Promise<EventDashboardDTO> {
  const query = new URLSearchParams();
  if (params.sessionId) query.set('sessionId', params.sessionId);
  if (params.viewType) query.set('viewType', params.viewType);

  const url = `${buildBaseUrl(eventId)}${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await customFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao carregar dashboard do evento');
  }
  return res.json();
}

export async function fetchDashboardAlerts(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<DashboardAlertDTO[]> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/alerts`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar alertas do dashboard');
  }
  const data = await res.json();
  return data.alerts;
}
