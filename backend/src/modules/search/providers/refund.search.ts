import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class RefundSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.refunds) {
      return [];
    }

    const allRefunds = await prisma.refund.findMany();
    const allOrders = await prisma.order.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allRefunds.filter((r: any) => {
      // Producer/Event scope isolation
      if (!ScopeFilterService.matchesScope(r, scope)) {
        return false;
      }

      // Refund code match
      if (query.detectedType === 'REFUND_CODE') {
        const matchFull = r.refundCode?.toLowerCase().includes(norm.toLowerCase());
        const matchDigits = digits && r.refundCodeNormalized?.includes(digits);
        return matchFull || matchDigits;
      }

      // Order match
      const order = allOrders.find((o: any) => o.id === r.orderId);
      const codeMatch = r.refundCode?.toLowerCase().includes(norm) || (digits.length >= 3 && r.refundCodeNormalized?.includes(digits));
      const custMatch = r.customerName?.toLowerCase().includes(norm);
      const reasonMatch = r.reason?.toLowerCase().includes(norm);
      const orderMatch = order && order.orderNumber?.toLowerCase().includes(norm);

      return codeMatch || custMatch || reasonMatch || orderMatch;
    });

    return matches.map((r: any) => {
      const isPending = r.status === 'PENDING_APPROVAL';
      const isApproved = r.status === 'APPROVED';
      const badge = isPending ? 'Aguardando Aprovação' : isApproved ? 'Aprovado' : 'Rejeitado';
      const badgeVariant = isPending ? 'warning' : isApproved ? 'success' : 'danger';

      return {
        id: r.id,
        entityType: 'REFUND',
        title: `Estorno #${r.refundCode}`,
        subtitle: `${r.customerName} • Valor: R$ ${Number(r.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${r.reason}`,
        status: r.status,
        badge,
        badgeVariant,
        producerId: r.producerId,
        eventId: r.eventId,
        meta: {
          refundCode: r.refundCode,
          orderId: r.orderId,
          amount: r.amount,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt
        },
        actionUrl: `/refunds/${r.id}`
      };
    });
  }
}
