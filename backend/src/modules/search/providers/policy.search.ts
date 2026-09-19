import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class PolicySearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    // Check permission to view policies/configurations
    const canView =
      user.roles?.includes('ADMIN') ||
      (user as any).isSuperAdmin ||
      user.permissions?.includes('configuracoes.politica.visualizar') ||
      user.permissions?.includes('configuracoes.central.visualizar') ||
      user.roles?.includes('PRODUTOR');

    if (!canView) return [];

    const allPolicies = await prisma.policy.findMany({});
    const norm = query.normalized.toLowerCase();
    const isPolicyCode = query.detectedType === 'POLICY_CODE';

    const matches = allPolicies.filter((policy: any) => {
      // Scope filter: producer and event isolation
      if (policy.scopeType === 'PRODUCER' || policy.scopeType === 'EVENT') {
        if (!ScopeFilterService.matchesScope(policy, scope)) {
          return false;
        }
      }

      if (isPolicyCode && query.extractedCode) {
        return policy.code?.toLowerCase() === query.extractedCode.toLowerCase();
      }

      const codeMatch = policy.code?.toLowerCase().includes(norm);
      const nameMatch = policy.name?.toLowerCase().includes(norm);
      const domainMatch = policy.domain?.toLowerCase().includes(norm);
      const descMatch = policy.description?.toLowerCase().includes(norm);

      return codeMatch || nameMatch || domainMatch || descMatch;
    });

    return matches.map((policy: any) => {
      return {
        id: policy.id,
        entityType: 'POLICY',
        title: `${policy.code}: ${policy.name}`,
        subtitle: `${policy.domain} • Escopo: ${policy.scopeType} • Versão: v${policy.currentVersion} • Status: ${policy.status}`,
        status: policy.status,
        badge: `v${policy.currentVersion}`,
        badgeVariant: policy.status === 'ACTIVE' ? 'success' : policy.status === 'SCHEDULED' ? 'info' : 'warning',
        producerId: policy.producerId,
        eventId: policy.eventId,
        meta: {
          code: policy.code,
          domain: policy.domain,
          version: policy.currentVersion,
          scopeType: policy.scopeType
        },
        actionUrl: `/admin/policies/${policy.id}`
      };
    });
  }
}
