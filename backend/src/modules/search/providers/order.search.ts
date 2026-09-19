import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class OrderSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.orders) {
      return [];
    }

    const allOrders = await prisma.order.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allOrders.filter((o: any) => {
      // Producer/Event scope isolation
      if (!ScopeFilterService.matchesScope(o, scope)) {
        return false;
      }

      // Order code match
      if (query.detectedType === 'ORDER_CODE' && digits) {
        return o.orderNumberNormalized?.includes(digits) || o.orderNumber?.toLowerCase().includes(norm);
      }

      // CPF match (orders of this customer)
      if (query.detectedType === 'CPF' && digits) {
        return o.customerCpf?.replace(/\D/g, '').includes(digits);
      }

      // Text match (orderNumber, customerName, eventName)
      const numMatch = o.orderNumber?.toLowerCase().includes(norm) || (digits.length >= 3 && o.orderNumberNormalized?.includes(digits));
      const custMatch = o.customerName?.toLowerCase().includes(norm);
      const evtMatch = o.eventName?.toLowerCase().includes(norm);

      return numMatch || custMatch || evtMatch;
    });

    return matches.map((o: any) => {
      const isPaid = o.status === 'PAID';
      const isCancelled = o.status === 'CANCELLED';
      const badge = isPaid ? 'Pago' : isCancelled ? 'Cancelado' : 'Pendente';
      const badgeVariant = isPaid ? 'success' : isCancelled ? 'danger' : 'warning';

      return {
        id: o.id,
        entityType: 'ORDER',
        title: `Pedido #${o.orderNumber}`,
        subtitle: `${o.customerName} • ${o.eventName} • R$ ${Number(o.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        status: o.status,
        badge,
        badgeVariant,
        producerId: o.producerId,
        eventId: o.eventId,
        eventName: o.eventName,
        meta: {
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          totalAmount: o.totalAmount,
          itemsCount: o.itemsCount,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt
        },
        actionUrl: `/sac/orders/${o.id}`
      };
    });
  }
}
