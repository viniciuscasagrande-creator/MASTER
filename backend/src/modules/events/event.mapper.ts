import { EventListItemDTO, EventDetailDTO, EventStatus } from './event.types';

export class EventMapper {
  public static toListItem(event: any, producerName?: string): EventListItemDTO {
    const capacity = typeof event.capacity === 'number' && event.capacity > 0 ? event.capacity : null;
    const soldTickets = typeof event.soldTickets === 'number' ? event.soldTickets : 0;
    const occupancyPercentage = capacity
      ? Math.min(100, Math.round((soldTickets / capacity) * 1000) / 10)
      : null;

    const name = event.name || event.title || 'Evento sem título';

    return {
      id: event.id,
      publicCode: event.publicCode || `EVT-${event.id.slice(0, 8).toUpperCase()}`,
      producerId: event.producerId,
      producerName: producerName || event.producer?.name || undefined,
      name,
      title: name,
      slug: event.slug || null,
      status: (event.status || 'DRAFT') as EventStatus,
      startAt: event.startAt ? new Date(event.startAt).toISOString() : (event.eventDate ? new Date(event.eventDate).toISOString() : null),
      endAt: event.endAt ? new Date(event.endAt).toISOString() : null,
      timezone: event.timezone || 'America/Sao_Paulo',
      venue: event.venue || null,
      city: event.city || null,
      state: event.state || null,
      country: event.country || 'BR',
      capacity,
      soldTickets,
      occupancyPercentage,
      coverDocumentId: event.coverDocumentId || null,
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  public static toDetail(event: any, producerName?: string): EventDetailDTO {
    const base = this.toListItem(event, producerName);

    // Preliminary readiness calculation for 1.2.1
    let readinessScore = 40;
    if (base.venue && base.city) readinessScore += 20;
    if (base.startAt) readinessScore += 20;
    if (base.capacity && base.capacity > 0) readinessScore += 20;

    const pendingItemsCount = 100 - readinessScore > 0 ? Math.ceil((100 - readinessScore) / 20) : 0;

    return {
      ...base,
      description: event.description || null,
      categoryId: event.categoryId || null,
      categoryName: event.categoryName || event.category || undefined,
      createdBy: event.createdBy || null,
      updatedBy: event.updatedBy || null,
      archivedAt: event.archivedAt ? new Date(event.archivedAt).toISOString() : null,
      readinessScore,
      pendingItemsCount
    };
  }
}
