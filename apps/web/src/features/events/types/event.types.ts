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
  PatchEventDraftInput,
  // Venues & Map types (Fase 1.2.3)
  VenueType,
  VenueScope,
  VenueStatus,
  VenueDTO,
  VenueSummaryDTO,
  CreateVenueInput,
  UpdateVenueInput,
  ListVenuesFilter,
  VenueSectionType,
  VenueSectionDTO,
  CreateVenueSectionInput,
  VenueMapDTO,
  VenueMapVersionDTO,
  VenueMapElementType,
  VenueMapElementDTO,
  VenueRowDTO,
  VenueSeatDTO,
  VenueAccessPointType,
  VenueAccessPointDTO,
  EventVenueDTO,
  EventSectionDTO,
  // Sessions & Capacity types (Fase 1.2.4)
  EventSessionStatus,
  EventSessionDTO,
  CreateEventSessionInput,
  UpdateEventSessionInput,
  DuplicateEventSessionInput,
  SessionSectionDTO,
  SessionReservationType,
  SessionCapacityReservationDTO,
  SessionConflictDTO,
  BulkSessionsPreviewInput,
  BulkSessionsPreviewResult
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
  PatchEventDraftInput,
  // Venues & Maps
  VenueType,
  VenueScope,
  VenueStatus,
  VenueDTO,
  VenueSummaryDTO,
  CreateVenueInput,
  UpdateVenueInput,
  ListVenuesFilter,
  VenueSectionType,
  VenueSectionDTO,
  CreateVenueSectionInput,
  VenueMapDTO,
  VenueMapVersionDTO,
  VenueMapElementType,
  VenueMapElementDTO,
  VenueRowDTO,
  VenueSeatDTO,
  VenueAccessPointType,
  VenueAccessPointDTO,
  EventVenueDTO,
  EventSectionDTO,
  // Sessions & Capacity
  EventSessionStatus,
  EventSessionDTO,
  CreateEventSessionInput,
  UpdateEventSessionInput,
  DuplicateEventSessionInput,
  SessionSectionDTO,
  SessionReservationType,
  SessionCapacityReservationDTO,
  SessionConflictDTO,
  BulkSessionsPreviewInput,
  BulkSessionsPreviewResult
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
