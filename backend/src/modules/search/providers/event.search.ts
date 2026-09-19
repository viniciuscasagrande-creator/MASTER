import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class EventSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.events) {
      return [];
    }

    const allEvents = await prisma.event.findMany();
    const allProducers = await prisma.producer.findMany();
    const norm = query.normalized;

    const matches = allEvents.filter((e: any) => {
      // Scope filter: producer and event isolation
      if (!ScopeFilterService.matchesScope(e, scope)) {
        return false;
      }

      const producer = allProducers.find((p: any) => p.id === e.producerId);
      const titleMatch = e.title?.toLowerCase().includes(norm);
      const venueMatch = e.venue?.toLowerCase().includes(norm);
      const prodMatch = producer?.name?.toLowerCase().includes(norm);

      return titleMatch || venueMatch || prodMatch;
    });

    return matches.map((e: any) => {
      const producer = allProducers.find((p: any) => p.id === e.producerId);
      const isPublished = e.status === 'PUBLISHED' || e.status === 'on_sale';
      const badge = isPublished ? 'Em Vendas' : 'Programado';
      const badgeVariant = isPublished ? 'success' : 'info';

      return {
        id: e.id,
        entityType: 'EVENT',
        title: e.title,
        subtitle: `${e.venue || 'Local a definir'} • Produtora: ${producer?.name || 'Disk Produtora'}`,
        status: e.status,
        badge,
        badgeVariant,
        producerId: e.producerId,
        producerName: producer?.name,
        eventId: e.id,
        eventName: e.title,
        meta: {
          title: e.title,
          venue: e.venue,
          producerId: e.producerId,
          producerName: producer?.name,
          date: e.date,
          status: e.status
        },
        actionUrl: `/events/${e.id}`
      };
    });
  }
}
