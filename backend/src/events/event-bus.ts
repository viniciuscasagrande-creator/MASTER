import { DomainEvent, DomainEventType, DomainEventHandler } from './event.types';
import { prisma } from '../core/database/prisma';

export class EventBus {
  private static subscribers = new Map<DomainEventType, Set<DomainEventHandler>>();
  private static globalSubscribers = new Set<DomainEventHandler>();

  /**
   * Subscribe to specific domain event type
   */
  public static subscribe(type: DomainEventType, handler: DomainEventHandler): void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);
  }

  /**
   * Subscribe to all domain events
   */
  public static subscribeAll(handler: DomainEventHandler): void {
    this.globalSubscribers.add(handler);
  }

  /**
   * Publish domain event with Outbox Pattern & Idempotency Guarantee
   */
  public static async publish<T = any>(event: DomainEvent<T>): Promise<{ published: boolean; duplicate?: boolean }> {
    // 1. Idempotency Check: Verify if event with this ID was already registered
    const existing = await prisma.eventOutbox.findUnique({
      where: { eventId: event.id }
    });

    if (existing) {
      // Duplicate event detected, ignore processing
      return { published: false, duplicate: true };
    }

    // 2. Persist to Event Outbox (Transactional consistency)
    const outboxRecord = await prisma.eventOutbox.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        producerId: event.producerId,
        eventIdRef: event.eventId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actorUserId: event.actorUserId,
        payload: JSON.stringify(event.data),
        status: 'PENDING'
      }
    });

    try {
      // 3. Dispatch to specific and global subscribers
      const handlers = this.subscribers.get(event.type) || new Set();
      const allHandlers = [...Array.from(handlers), ...Array.from(this.globalSubscribers)];

      for (const handler of allHandlers) {
        await handler(event);
      }

      // 4. Mark outbox record as PROCESSED
      await prisma.eventOutbox.update({
        where: { eventId: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      });

      return { published: true };
    } catch (err) {
      // If processing failed, update outbox to FAILED for retry worker
      await prisma.eventOutbox.update({
        where: { eventId: event.id },
        data: { status: 'FAILED' }
      }).catch(() => {});

      throw err;
    }
  }

  /**
   * Reset subscribers (used in test tear-down)
   */
  public static clearSubscribers(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }
}
