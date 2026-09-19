import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { DataMaskService } from '../data-mask.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class CustomerSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.customers) {
      return [];
    }

    const allCustomers = await prisma.customer.findMany({
      include: { orders: true }
    });

    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allCustomers.filter((c: any) => {
      // If producer is locked, customer must have at least one order within this producer's scope
      if (!scope.isGlobal && scope.forcedProducerId) {
        const hasOrderInScope = c.orders?.some((o: any) => ScopeFilterService.matchesScope(o, scope));
        if (!hasOrderInScope) return false;
      }

      // Check CPF match
      if (query.detectedType === 'CPF' && digits) {
        return c.cpfNormalized?.includes(digits) || c.cpf?.includes(query.raw);
      }

      // Check Email match
      if (query.detectedType === 'EMAIL') {
        return c.emailNormalized?.includes(norm) || c.email?.toLowerCase().includes(norm);
      }

      // Check Phone match
      if (query.detectedType === 'PHONE' && digits) {
        return c.phoneNormalized?.includes(digits);
      }

      // General Text match (Name, CPF, Email, Phone)
      const nameMatch = c.name?.toLowerCase().includes(norm);
      const emailMatch = c.emailNormalized?.includes(norm);
      const cpfMatch = digits.length >= 4 && c.cpfNormalized?.includes(digits);
      const phoneMatch = digits.length >= 4 && c.phoneNormalized?.includes(digits);

      return nameMatch || emailMatch || cpfMatch || phoneMatch;
    });

    return matches.map((c: any) => {
      const masked = DataMaskService.maskCustomerData(c, user);
      return {
        id: c.id,
        entityType: 'CUSTOMER',
        title: c.name,
        subtitle: `CPF: ${masked.cpf} • ${masked.email} • ${masked.phone}`,
        badge: `${c.totalOrders || 0} pedidos`,
        badgeVariant: 'info',
        meta: {
          cpf: masked.cpf,
          email: masked.email,
          phone: masked.phone,
          city: c.city,
          state: c.state,
          totalSpent: c.totalSpent
        },
        actionUrl: `/sac/customers/${c.id}`
      };
    });
  }
}
