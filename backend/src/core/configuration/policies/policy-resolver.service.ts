import { prisma } from '../../database/prisma';

export interface ResolvedActivePolicy {
  policy: any;
  scope: 'EVENT' | 'PRODUCER' | 'GLOBAL';
}

export class PolicyResolverService {
  /**
   * Resolves the active policy in hierarchy: EVENT -> PRODUCER -> GLOBAL
   */
  public static async resolveActivePolicy(
    domain: string,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<ResolvedActivePolicy | null> {
    const now = new Date();

    const isValidPolicy = (p: any) => {
      if (!p || p.status !== 'ACTIVE') return false;
      if (p.effectiveFrom && new Date(p.effectiveFrom) > now) return false;
      if (p.effectiveUntil && new Date(p.effectiveUntil) < now) return false;
      return true;
    };

    // 1. Level 1: Event Scope
    if (eventId) {
      const eventPolicies = await prisma.policy.findMany({
        where: {
          domain: domain.toUpperCase(),
          scopeType: 'EVENT',
          eventId
        },
        include: { rules: true, versions: true },
        orderBy: { priority: 'desc' }
      });

      const valid = eventPolicies.find(isValidPolicy);
      if (valid) {
        return { policy: valid, scope: 'EVENT' };
      }
    }

    // 2. Level 2: Producer Scope
    if (producerId) {
      const producerPolicies = await prisma.policy.findMany({
        where: {
          domain: domain.toUpperCase(),
          scopeType: 'PRODUCER',
          producerId
        },
        include: { rules: true, versions: true },
        orderBy: { priority: 'desc' }
      });

      const valid = producerPolicies.find(isValidPolicy);
      if (valid) {
        return { policy: valid, scope: 'PRODUCER' };
      }
    }

    // 3. Level 3: Global Scope
    const globalPolicies = await prisma.policy.findMany({
      where: {
        domain: domain.toUpperCase(),
        scopeType: 'GLOBAL'
      },
      include: { rules: true, versions: true },
      orderBy: { priority: 'desc' }
    });

    const validGlobal = globalPolicies.find(isValidPolicy);
    if (validGlobal) {
      return { policy: validGlobal, scope: 'GLOBAL' };
    }

    return null;
  }
}
