import {
  EventDocumentRequirementDTO,
  CreateDocumentRequirementInput,
  UploadEventDocumentInput,
  EventDocumentRequirementStatus
} from '@shared/types/index';

const buildBaseUrl = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/documents`;

export async function fetchDocumentRequirements(
  eventId: string,
  customFetch: typeof fetch = fetch
): Promise<EventDocumentRequirementDTO[]> {
  const res = await customFetch(buildBaseUrl(eventId));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar requisitos documentais');
  }
  return res.json();
}

export async function createDocumentRequirement(
  eventId: string,
  input: CreateDocumentRequirementInput,
  customFetch: typeof fetch = fetch
): Promise<EventDocumentRequirementDTO> {
  const res = await customFetch(buildBaseUrl(eventId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar requisito documental');
  }
  return res.json();
}

export async function uploadEventDocument(
  eventId: string,
  input: UploadEventDocumentInput,
  customFetch: typeof fetch = fetch
): Promise<EventDocumentRequirementDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao anexar documento');
  }
  return res.json();
}

export async function updateDocumentStatus(
  eventId: string,
  requirementId: string,
  status: EventDocumentRequirementStatus,
  rejectionReason?: string,
  customFetch: typeof fetch = fetch
): Promise<EventDocumentRequirementDTO> {
  const res = await customFetch(`${buildBaseUrl(eventId)}/${encodeURIComponent(requirementId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, rejectionReason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar status do documento');
  }
  return res.json();
}
