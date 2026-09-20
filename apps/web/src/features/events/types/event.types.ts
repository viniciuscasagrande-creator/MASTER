import {
  EventStatus,
  EventListItemDTO,
  EventDetailDTO,
  EventSummaryDTO,
  ListEventsFilter,
  EventFormat,
  EventVisibility,
  EventAgeRating,
  EventCategoryDTO,
  EventMediaDTO,
  EventResponsibilityDTO,
  EventResponsibilityType,
  EventWizardStepId,
  StepValidationStatus,
  StepIssue,
  StepValidationDetail,
  EventWizardValidationResult,
  EventWizardStateDTO,
  CreateEventDraftInput,
  PatchEventDraftInput
} from '@shared/types/index';

export type {
  EventStatus,
  EventListItemDTO,
  EventDetailDTO,
  EventSummaryDTO,
  ListEventsFilter,
  EventFormat,
  EventVisibility,
  EventAgeRating,
  EventCategoryDTO,
  EventMediaDTO,
  EventResponsibilityDTO,
  EventResponsibilityType,
  EventWizardStepId,
  StepValidationStatus,
  StepIssue,
  StepValidationDetail,
  EventWizardValidationResult,
  EventWizardStateDTO,
  CreateEventDraftInput,
  PatchEventDraftInput
};

export type EventsViewMode = 'cards' | 'table';

export interface CreateEventInputDTO {
  name: string;
  slug?: string;
  producerId: string;
  category?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  description?: string;
}

export interface EventContextResponse {
  success: boolean;
  event: EventDetailDTO;
  context: {
    selectedEventId: string;
    selectedProducerId: string;
  };
}
