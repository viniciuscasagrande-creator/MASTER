import {
  EventStatus,
  EventListItemDTO,
  EventDetailDTO,
  EventSummaryDTO,
  ListEventsFilter
} from '@shared/types/index';

export type {
  EventStatus,
  EventListItemDTO,
  EventDetailDTO,
  EventSummaryDTO,
  ListEventsFilter
};

export interface CreateEventInput {
  producerId: string;
  name: string;
  title?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  startAt?: Date | string;
  endAt?: Date | string;
  timezone?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  coverDocumentId?: string;
}

export interface UpdateEventInput {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  startAt?: Date | string;
  endAt?: Date | string;
  timezone?: string;
  venue?: string;
  city?: string;
  state?: string;
  capacity?: number;
  status?: EventStatus;
  coverDocumentId?: string;
}

export interface ListEventsQueryResult {
  items: EventListItemDTO[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
