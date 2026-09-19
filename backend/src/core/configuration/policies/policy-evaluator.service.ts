import { ConditionEvaluatorService } from './condition-evaluator.service';
import { PolicyRuleAction } from '../configuration.types';

export interface EvaluatedRuleOutcome {
  matchedRule: any;
  action: PolicyRuleAction;
  explanation: string;
}

export class PolicyEvaluatorService {
  /**
   * Sorts rules in deterministic order:
   * 1. Priority desc (higher priority number first)
   * 2. Specificity desc (more conditions first)
   * 3. OrderIndex asc
   */
  public static sortRulesDeterministically(rules: any[]): any[] {
    return [...rules].sort((a, b) => {
      // 1. Priority (descending)
      const pDiff = (b.priority || 0) - (a.priority || 0);
      if (pDiff !== 0) return pDiff;

      // 2. Specificity (more conditions = higher specificity)
      const aConds = Array.isArray(a.conditions) ? a.conditions.length : (JSON.parse(a.conditionJson || '[]')).length;
      const bConds = Array.isArray(b.conditions) ? b.conditions.length : (JSON.parse(b.conditionJson || '[]')).length;
      const sDiff = bConds - aConds;
      if (sDiff !== 0) return sDiff;

      // 3. Order index (ascending)
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });
  }

  /**
   * Evaluates rules against the input payload and finds the first matching rule
   */
  public static evaluate(rules: any[], inputPayload: Record<string, any>): EvaluatedRuleOutcome | null {
    if (!rules || rules.length === 0) return null;

    const sortedRules = this.sortRulesDeterministically(rules);

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;

      let conditions: any[] = [];
      if (Array.isArray(rule.conditions)) {
        conditions = rule.conditions;
      } else if (typeof rule.conditionJson === 'string') {
        try {
          conditions = JSON.parse(rule.conditionJson);
        } catch {
          conditions = [];
        }
      }

      const isMatch = ConditionEvaluatorService.evaluateAll(conditions, inputPayload);

      if (isMatch) {
        let action: PolicyRuleAction;
        if (rule.action && typeof rule.action === 'object') {
          action = rule.action;
        } else if (typeof rule.actionJson === 'string') {
          action = JSON.parse(rule.actionJson);
        } else {
          action = { decision: true };
        }

        const explanation =
          action.message ||
          rule.description ||
          `Regra "${rule.name}" aplicada com sucesso para esta operação.`;

        return {
          matchedRule: rule,
          action,
          explanation
        };
      }
    }

    return null;
  }
}
