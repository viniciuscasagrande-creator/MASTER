import { EventBus } from './event-bus';
import { DomainEvent, DomainEventType, DomainEventHandler } from './event.types';

export class DomainEvents {
  public static async dispatch<T = any>(event: DomainEvent<T>): Promise<{ published: boolean; duplicate?: boolean }> {
    return EventBus.publish(event);
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
