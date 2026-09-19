import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class DocumentSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.documents) {
      return [];
    }

    const allDocuments = await prisma.document.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        versions: true,
        links: true
      }
    });

    const norm = query.normalized.toLowerCase();

    const matches = allDocuments.filter((doc: any) => {
      // Scope filter: producer and event isolation
      if (!ScopeFilterService.matchesScope(doc, scope)) {
        return false;
      }

      const titleMatch = doc.title?.toLowerCase().includes(norm);
      const descMatch = doc.description?.toLowerCase().includes(norm);
      const catMatch = doc.category?.name?.toLowerCase().includes(norm) || doc.category?.code?.toLowerCase().includes(norm);
      const fileMatch = doc.versions?.some((v: any) => v.originalFileName?.toLowerCase().includes(norm));

      return titleMatch || descMatch || catMatch || fileMatch;
    });

    return matches.map((doc: any) => {
      const categoryName = doc.category?.name || 'Documento';
      const versionNumber = doc.versions?.[0]?.version || 1;

      return {
        id: doc.id,
        entityType: 'DOCUMENT',
        title: doc.title,
        subtitle: `${categoryName} • Versão ${versionNumber} • Status: ${doc.status}`,
        status: doc.status,
        badge: categoryName,
        badgeVariant: doc.status === 'AVAILABLE' ? 'success' : doc.status === 'QUARANTINED' ? 'danger' : 'default',
        producerId: doc.producerId,
        eventId: doc.eventId,
        meta: {
          title: doc.title,
          category: categoryName,
          status: doc.status,
          currentVersion: versionNumber,
          createdAt: doc.createdAt
        },
        actionUrl: `/documents/${doc.id}`
      };
    });
  }
}
