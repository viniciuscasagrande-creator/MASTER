import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class ObservabilitySearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    const canView =
      user.roles?.includes('ADMIN') ||
      (user as any).isSuperAdmin ||
      (user as any).roleSlug === 'admin_geral' ||
      user.permissions?.includes('observabilidade.trace.visualizar') ||
      user.permissions?.includes('auditoria.central.visualizar') ||
      user.permissions?.includes('observabilidade.dashboard.visualizar');

    if (!canView) return [];

    const results: SearchResultItem[] = [];
    const norm = query.normalized.toLowerCase();
    const isCor = query.detectedType === 'CORRELATION_ID';
    const isReq = query.detectedType === 'REQUEST_ID';
    const isErr = query.detectedType === 'ERROR_CODE';

    // 1. Busca em OperationTrace
    const allTraces = await prisma.operationTrace.findMany({
      include: { spans: true }
    });

    const matchingTraces = allTraces.filter((t: any) => {
      if (t.producerId && !ScopeFilterService.matchesScope(t, scope)) {
        return false;
      }
      if (isCor && query.extractedCode) {
        return t.correlationId?.toLowerCase() === query.extractedCode.toLowerCase();
      }
      const corMatch = t.correlationId?.toLowerCase().includes(norm);
      const nameMatch = t.operationName?.toLowerCase().includes(norm);
      const rootMatch = t.rootResourceId?.toLowerCase().includes(norm);
      return corMatch || nameMatch || rootMatch;
    });

    for (const t of matchingTraces) {
      results.push({
        id: t.id,
        entityType: 'TRACE',
        title: `${t.correlationId}: ${t.operationName}`,
        subtitle: `Status: ${t.status} • Duração: ${t.durationMs ? t.durationMs + 'ms' : 'Em andamento'} • ${t.spans?.length || 0} passos`,
        status: t.status,
        badge: t.correlationId,
        badgeVariant: t.status === 'COMPLETED' ? 'success' : t.status === 'FAILED' ? 'danger' : 'info',
        producerId: t.producerId,
        eventId: t.eventId,
        meta: {
          correlationId: t.correlationId,
          operationName: t.operationName,
          status: t.status,
          durationMs: t.durationMs
        },
        actionUrl: `/observability?tab=traces&correlationId=${encodeURIComponent(t.correlationId)}`
      });
    }

    // 2. Busca em ErrorGroup
    const allErrors = await prisma.errorGroup.findMany({});
    const matchingErrors = allErrors.filter((e: any) => {
      if (isErr && query.extractedCode) {
        return e.fingerprint?.toLowerCase().includes(query.extractedCode.toLowerCase()) ||
               e.errorCode?.toLowerCase() === query.extractedCode.toLowerCase();
      }
      const codeMatch = e.errorCode?.toLowerCase().includes(norm);
      const titleMatch = e.title?.toLowerCase().includes(norm);
      const serviceMatch = e.service?.toLowerCase().includes(norm);
      return codeMatch || titleMatch || serviceMatch;
    });

    for (const e of matchingErrors) {
      results.push({
        id: e.id,
        entityType: 'ERROR_GROUP',
        title: `[${e.errorCode}] ${e.title}`,
        subtitle: `Serviço: ${e.service} • Severidade: ${e.severity} • ${e.occurrencesCount} ocorrências`,
        status: e.status,
        badge: e.severity,
        badgeVariant: e.severity === 'CRITICAL' ? 'danger' : e.severity === 'HIGH' ? 'warning' : 'info',
        meta: {
          fingerprint: e.fingerprint,
          errorCode: e.errorCode,
          service: e.service,
          occurrencesCount: e.occurrencesCount
        },
        actionUrl: `/observability?tab=errors&errorId=${encodeURIComponent(e.id)}`
      });
    }

    return results;
  }
}
