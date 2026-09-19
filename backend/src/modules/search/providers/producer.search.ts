import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class ProducerSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.producers) {
      return [];
    }

    const allProducers = await prisma.producer.findMany();
    const allEvents = await prisma.event.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allProducers.filter((p: any) => {
      // Producer isolation: Producer cannot search other producers
      if (!scope.isGlobal && scope.forcedProducerId) {
        const matchesScope = ScopeFilterService.matchesScope({ producerId: p.id }, scope);
        if (!matchesScope) return false;
      }

      const nameMatch = p.name?.toLowerCase().includes(norm);
      const cnpjMatch = p.cnpj?.replace(/\D/g, '').includes(digits || norm);

      return nameMatch || cnpjMatch;
    });

    return matches.map((p: any) => {
      const activeEventsCount = allEvents.filter((e: any) => e.producerId === p.id).length;
      return {
        id: p.id,
        entityType: 'PRODUCER',
        title: p.name,
        subtitle: `CNPJ: ${p.cnpj} • ${activeEventsCount} evento(s) associado(s)`,
        status: p.status,
        badge: p.status === 'ACTIVE' ? 'Ativo' : 'Pendente',
        badgeVariant: p.status === 'ACTIVE' ? 'success' : 'warning',
        producerId: p.id,
        producerName: p.name,
        meta: {
          name: p.name,
          cnpj: p.cnpj,
          activeEventsCount,
          status: p.status
        },
        actionUrl: `/commercial/producers/${p.id}`
      };
    });
  }
}
