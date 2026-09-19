import { prisma } from '../../../core/database/prisma';
import { ApprovalOperation } from '../approval.types';

export interface ResolvedRule {
  rule: any;
  scopeLevel: 'EVENT' | 'PRODUCER' | 'GLOBAL';
}

export class RuleResolverService {
  /**
   * Resolves the applicable approval rule following the strict hierarchy:
   * 1. EVENT (producerId + eventId match)
   * 2. PRODUCER (producerId match + eventId is null)
   * 3. GLOBAL (producerId is null + eventId is null)
   */
  async resolveRule(
    operation: ApprovalOperation,
    amount?: number | null,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<ResolvedRule | null> {
    const rules = await prisma.approvalRule.findMany({
      where: {
        operation,
        isActive: true
      }
    });

    if (!rules || rules.length === 0) {
      return null;
    }

    // Filter rules matching amount range
    const matchingAmountRules = rules.filter((r: any) => {
      if (amount !== undefined && amount !== null) {
        const minOk = r.minAmount === null || r.minAmount === undefined || amount >= r.minAmount;
        const maxOk = r.maxAmount === null || r.maxAmount === undefined || amount <= r.maxAmount;
        return minOk && maxOk;
      } else {
        // If amount is not specified, matches rules that don't enforce an amount or start at 0
        return r.minAmount === null || r.minAmount === 0;
      }
    });

    if (matchingAmountRules.length === 0) {
      return null;
    }

    // 1. Check Event-specific rules
    if (producerId && eventId) {
      const eventRule = matchingAmountRules.find(
        (r: any) => r.producerId === producerId && r.eventId === eventId
      );
      if (eventRule) {
        return { rule: eventRule, scopeLevel: 'EVENT' };
      }
    }

    // 2. Check Producer-specific rules
    if (producerId) {
      const producerRule = matchingAmountRules.find(
        (r: any) => r.producerId === producerId && (!r.eventId || r.eventId === null)
      );
      if (producerRule) {
        return { rule: producerRule, scopeLevel: 'PRODUCER' };
      }
    }

    // 3. Check Global rules
    const globalRule = matchingAmountRules.find(
      (r: any) => (!r.producerId || r.producerId === null) && (!r.eventId || r.eventId === null)
    );
    if (globalRule) {
      return { rule: globalRule, scopeLevel: 'GLOBAL' };
    }

    return null;
  }
}

export const ruleResolverService = new RuleResolverService();
