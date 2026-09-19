import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class PaymentSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.payments) {
      return [];
    }

    const allPayments = await prisma.payment.findMany();
    const allOrders = await prisma.order.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allPayments.filter((p: any) => {
      // Producer/Event scope isolation
      if (!ScopeFilterService.matchesScope(p, scope)) {
        return false;
      }

      // Transaction code match
      if (query.detectedType === 'PAYMENT_CODE') {
        const matchFull = p.transactionCode?.toLowerCase().includes(norm.toLowerCase());
        const matchDigits = digits && p.transactionCodeNormalized?.includes(digits);
        return matchFull || matchDigits;
      }

      // Order match
      const order = allOrders.find((o: any) => o.id === p.orderId);
      const codeMatch = p.transactionCode?.toLowerCase().includes(norm) || (digits.length >= 3 && p.transactionCodeNormalized?.includes(digits));
      const methodMatch = p.method?.toLowerCase().includes(norm);
      const orderMatch = order && (order.orderNumber?.toLowerCase().includes(norm) || order.customerName?.toLowerCase().includes(norm));

      return codeMatch || methodMatch || orderMatch;
    });

    return matches.map((p: any) => {
      const order = allOrders.find((o: any) => o.id === p.orderId);
      const isApproved = p.status === 'APPROVED';
      const badge = isApproved ? 'Aprovada' : 'Pendente';
      const badgeVariant = isApproved ? 'success' : 'warning';

      return {
        id: p.id,
        entityType: 'PAYMENT',
        title: `Transação #${p.transactionCode}`,
        subtitle: `Método: ${p.method} • Valor: R$ ${Number(p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Pedido #${order?.orderNumber || p.orderId}`,
        status: p.status,
        badge,
        badgeVariant,
        producerId: p.producerId,
        eventId: p.eventId,
        meta: {
          transactionCode: p.transactionCode,
          orderId: p.orderId,
          orderNumber: order?.orderNumber,
          gateway: p.gateway,
          method: p.method,
          amount: p.amount,
          netAmount: p.netAmount,
          isReconciled: p.isReconciled,
          createdAt: p.createdAt
        },
        actionUrl: `/finance/transactions/${p.id}`
      };
    });
  }
}
