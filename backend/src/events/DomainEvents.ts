import { EventBus } from './event-bus';
import { DomainEvent, DomainEventType, DomainEventHandler } from './event.types';

export class DomainEvents {
  public static async dispatch<T = any>(
    eventOrType: DomainEvent<T> | DomainEventType,
    payload?: Partial<DomainEvent<T>> | any
  ): Promise<{ published: boolean; duplicate?: boolean }> {
    if (typeof eventOrType === 'string') {
      const event: DomainEvent = {
        id: payload?.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: eventOrType,
        resourceType: payload?.resourceType || 'UNKNOWN',
        resourceId: payload?.resourceId || 'UNKNOWN',
        actorUserId: payload?.actorUserId,
        producerId: payload?.producerId,
        eventId: payload?.eventId,
        data: payload?.data !== undefined ? payload.data : payload || {},
        timestamp: new Date()
      };
      return EventBus.publish(event);
    }
    return EventBus.publish(eventOrType);
  }

  public static subscribe(type: DomainEventType, handler: DomainEventHandler): void {
    EventBus.subscribe(type, handler);
  }

  public static subscribeAll(handler: DomainEventHandler): void {
    EventBus.subscribeAll(handler);
  }

  public static clearSubscribers(): void {
    EventBus.clearSubscribers();
  }
}
