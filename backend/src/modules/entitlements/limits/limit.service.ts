import { prisma } from '../../../core/database/prisma';
import { usageProvider, IUsageProvider } from './usage-provider';

export interface LimitCheckResult {
  exceeded: boolean;
  limitKey: string;
  limitValue: number;
  currentUsage: number;
  unit: string;
}

export class LimitService {
  private static usageProviderInstance: IUsageProvider = usageProvider;

  public static setUsageProvider(provider: IUsageProvider): void {
    this.usageProviderInstance = provider;
  }

  /**
   * Evaluates all limits attached to an entitlement against real-time consumption
   */
  public static async evaluateEntitlementLimits(
    producerId: string,
    entitlementId: string,
    requestedAmount = 1
  ): Promise<LimitCheckResult | null> {
    const limits = await prisma.producerEntitlementLimit.findMany({
      where: { entitlementId }
    });

    if (!limits || limits.length === 0) {
      return null;
    }

    for (const lim of limits) {
      // Check date window for limit if specified
      const now = new Date();
      if (lim.effectiveFrom && new Date(lim.effectiveFrom) > now) {
        continue;
      }
      if (lim.effectiveUntil && new Date(lim.effectiveUntil) < now) {
        continue;
      }

      // If boolean flag, value 1 means allowed, 0 means forbidden
      if (lim.limitType === 'BOOLEAN_FLAG') {
        if (lim.value <= 0) {
          return {
            exceeded: true,
            limitKey: lim.limitKey,
            limitValue: lim.value,
            currentUsage: 1,
            unit: lim.unit || 'FLAG'
          };
        }
        continue;
      }

      const currentUsage = await this.usageProviderInstance.getUsage(producerId, lim.limitKey);

      if (currentUsage + requestedAmount > lim.value) {
        return {
          exceeded: true,
          limitKey: lim.limitKey,
          limitValue: lim.value,
          currentUsage,
          unit: lim.unit || 'UNITS'
        };
      }
    }

    // Return the first limit info with exceeded = false for reporting usage
    const primaryLimit = limits[0];
    const currentUsage = await this.usageProviderInstance.getUsage(producerId, primaryLimit.limitKey);
    return {
      exceeded: false,
      limitKey: primaryLimit.limitKey,
      limitValue: primaryLimit.value,
      currentUsage,
      unit: primaryLimit.unit || 'UNITS'
    };
  }
}
