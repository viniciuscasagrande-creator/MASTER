import { CommercialOpportunitySummaryDTO } from '@shared/types/index';
import { AuthenticatedUserContext } from '../policies/commercial-scope.policy';
import { CommercialDataVisibilityPolicy } from '../policies/commercial-data-visibility.policy';
import { prisma } from '../../../core/database/prisma';

export class CommercialOpportunityProvider {
  /**
   * Provides aggregated opportunity summary for Remarketing integration without exposing any PII.
   */
  public static async getOpportunitySummary(
    user: AuthenticatedUserContext,
    producerId?: string,
    eventId?: string
  ): Promise<CommercialOpportunitySummaryDTO> {
    const canViewValues = CommercialDataVisibilityPolicy.canViewFinancialValues(user);

    // Filter pending/expired orders as commercial opportunities
    const orders = await prisma.order.findMany();

    const opportunities = orders.filter((o: any) => {
      if (producerId && o.producerId !== producerId) return false;
      if (eventId && o.eventId !== eventId) return false;
      if (!user.isSuperAdmin && !user.scope?.isGlobal) {
        if (!user.scope?.producers?.includes(o.producerId)) return false;
        if (user.scope?.events?.length > 0 && o.eventId && !user.scope?.events?.includes(o.eventId)) return false;
      }
      return true;
    });

    const pendingOrExpired = opportunities.filter((o: any) => o.status === 'PENDING' || o.status === 'EXPIRED');
    const confirmed = opportunities.filter((o: any) => o.status === 'CONFIRMED' || o.status === 'PAID');

    const abandonedCartsCount = pendingOrExpired.length;
    const potentialValueRaw = pendingOrExpired.reduce((acc: number, curr: any) => acc + (Number(curr.totalAmount) || 0), 0);

    // Recovered approximations based on confirmed orders created after prior pending states
    const recoveredOrdersCount = confirmed.filter((o: any) => (o.timeline || []).some((t: any) => t.eventType === 'ORDER_CONFIRMED' && (o.version || 1) > 1)).length;
    const recoveredRevenueRaw = confirmed
      .filter((o: any) => (o.timeline || []).some((t: any) => t.eventType === 'ORDER_CONFIRMED' && (o.version || 1) > 1))
      .reduce((acc: number, curr: any) => acc + (Number(curr.totalAmount) || 0), 0);

    const totalOpportunityPool = abandonedCartsCount + recoveredOrdersCount;
    const recoveryRate = totalOpportunityPool > 0
      ? Math.round((recoveredOrdersCount / totalOpportunityPool) * 100)
      : null;

    return {
      abandonedCarts: abandonedCartsCount,
      potentialValue: canViewValues ? potentialValueRaw : null,
      recoveredCarts: recoveredOrdersCount,
      recoveredRevenue: canViewValues ? recoveredRevenueRaw : null,
      recoveryRate,
      lastUpdatedAt: new Date().toISOString()
    };
  }
}
