import { AuthenticatedUser } from '../../core/middleware/authenticate';

import { AuditService } from '../audit/audit.service';
import { EventBus } from '../../events/event-bus';
import { EventAccessPolicy } from './policies/event-access.policy';
import { EventRepository } from './event.repository';
import { EventMapper } from './event.mapper';
import { ListEventsQuery } from './queries/list-events.query';
import { EventSummaryQuery } from './queries/event-summary.query';
import { GetEventQuery } from './queries/get-event.query';
import {
  ListEventsFilter,
  ListEventsQueryResult,
  EventSummaryDTO,
  EventDetailDTO,
  CreateEventInput
} from './event.types';

export class EventService {
  public static async listEvents(
    user: AuthenticatedUser,
    filters: ListEventsFilter
  ): Promise<ListEventsQueryResult> {
    return ListEventsQuery.execute(user, filters);
  }

  public static async getEventSummary(
    user: AuthenticatedUser,
    requestedProducerId?: string
  ): Promise<EventSummaryDTO> {
    return EventSummaryQuery.execute(user, requestedProducerId);
  }

  public static async getEventById(
    user: AuthenticatedUser,
    eventIdOrCode: string
  ): Promise<EventDetailDTO> {
    return GetEventQuery.execute(user, eventIdOrCode);
  }

  public static async createEvent(
    user: AuthenticatedUser,
    input: CreateEventInput
  ): Promise<EventDetailDTO> {
    // 1. Enforce producer access policy
    EventAccessPolicy.verifyProducerAccess(user, input.producerId);

    // 2. Persist in database
    const event = await EventRepository.create(input, user.id);

    // 3. Audit Logging (Fase 1.1.5.12)
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_EVENT',
      resource: `EVENT:${event.id}`,
      producerId: event.producerId,
      eventId: event.id,
      details: `Evento '${event.name}' (${event.publicCode}) criado com sucesso em status Rascunho.`,
      result: 'SUCCESS'
    });

    // 4. Publish Domain Event
    await EventBus.publish({
      id: `evt_created_${event.id}_${Date.now()}`,
      type: 'EVENT_CREATED',
      resourceType: 'EVENT',
      resourceId: event.id,
      actorUserId: user.id,
      data: {
        eventId: event.id,
        publicCode: event.publicCode,
        producerId: event.producerId,
        name: event.name,
        status: event.status
      },
      timestamp: new Date()
    });

    return EventMapper.toDetail(event);
  }

  public static async selectEventContext(
    user: AuthenticatedUser,
    eventId: string
  ): Promise<EventDetailDTO> {
    const event = await GetEventQuery.execute(user, eventId);

    // Audit context change
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CHANGE_EVENT_CONTEXT',
      resource: 'CONTEXT',
      eventId: event.id,
      producerId: event.producerId,
      details: `Contexto operacional alterado para o evento '${event.name}' (${event.publicCode}).`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `evt_ctx_${event.id}_${Date.now()}`,
      type: 'EVENT_CONTEXT_SELECTED',
      resourceType: 'EVENT',
      resourceId: event.id,
      actorUserId: user.id,
      data: {
        eventId: event.id,
        publicCode: event.publicCode,
        producerId: event.producerId
      },
      timestamp: new Date()
    });

    return event;
  }
}
