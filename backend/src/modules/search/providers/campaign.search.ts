import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class CampaignSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.campaigns) {
      return [];
    }

    const allCampaigns = await prisma.marketingCampaign.findMany();
    const norm = query.normalized;

    const matches = allCampaigns.filter((c: any) => {
      // Producer/Event scope isolation
      if (!ScopeFilterService.matchesScope(c, scope)) {
        return false;
      }

      const nameMatch = c.name?.toLowerCase().includes(norm) || c.nameNormalized?.includes(norm);
      const platMatch = c.platform?.toLowerCase().includes(norm);
      const evtMatch = c.eventName?.toLowerCase().includes(norm);

      return nameMatch || platMatch || evtMatch;
    });

    return matches.map((c: any) => {
      const isActive = c.status === 'ACTIVE';
      const badge = isActive ? 'Ativa' : 'Pausada';
      const badgeVariant = isActive ? 'success' : 'warning';

      return {
        id: c.id,
        entityType: 'CAMPAIGN',
        title: c.name,
        subtitle: `Plataforma: ${c.platform} • Evento: ${c.eventName} • ROAS: ${c.roas}x • Investimento: R$ ${Number(c.spend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        status: c.status,
        badge,
        badgeVariant,
        producerId: c.producerId,
        eventId: c.eventId,
        meta: {
          name: c.name,
          platform: c.platform,
          eventName: c.eventName,
          spend: c.spend,
          attributedRevenue: c.attributedRevenue,
          roas: c.roas,
          cpa: c.cpa,
          status: c.status
        },
        actionUrl: `/marketing/campaigns/${c.id}`
      };
    });
  }
}
