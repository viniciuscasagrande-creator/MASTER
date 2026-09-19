import { RuleOperator } from '../configuration.types';

export class ConditionEvaluatorService {
  /**
   * Safely extracts nested property from object using dot notation (e.g. "order.total" or "amount")
   */
  public static extractValue(payload: any, path: string): any {
    if (!payload || !path) return undefined;
    const parts = path.split('.');
    let curr = payload;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  /**
   * Evaluates a single condition against the payload
   */
  public static evaluateCondition(
    condition: { field: string; operator: RuleOperator; value: any },
    payload: any
  ): boolean {
    const actual = this.extractValue(payload, condition.field);
    const target = condition.value;

    switch (condition.operator) {
      case 'EQUAL':
        if (actual instanceof Date || target instanceof Date) {
          return new Date(actual).getTime() === new Date(target).getTime();
        }
        return actual === target;

      case 'NOT_EQUAL':
        if (actual instanceof Date || target instanceof Date) {
          return new Date(actual).getTime() !== new Date(target).getTime();
        }
        return actual !== target;

      case 'GREATER_THAN': {
        const a = typeof actual === 'string' && !isNaN(Number(actual)) ? Number(actual) : actual;
        const b = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;
        return a > b;
      }

      case 'GREATER_OR_EQUAL': {
        const a = typeof actual === 'string' && !isNaN(Number(actual)) ? Number(actual) : actual;
        const b = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;
        return a >= b;
      }

      case 'LESS_THAN': {
        const a = typeof actual === 'string' && !isNaN(Number(actual)) ? Number(actual) : actual;
        const b = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;
        return a < b;
      }

      case 'LESS_OR_EQUAL': {
        const a = typeof actual === 'string' && !isNaN(Number(actual)) ? Number(actual) : actual;
        const b = typeof target === 'string' && !isNaN(Number(target)) ? Number(target) : target;
        return a <= b;
      }

      case 'CONTAINS': {
        if (Array.isArray(actual)) {
          return actual.includes(target);
        }
        if (typeof actual === 'string') {
          return actual.toLowerCase().includes(String(target).toLowerCase());
        }
        return false;
      }

      case 'IN': {
        if (!Array.isArray(target)) return false;
        return target.includes(actual);
      }

      case 'NOT_IN': {
        if (!Array.isArray(target)) return true;
        return !target.includes(actual);
      }

      case 'BETWEEN': {
        if (!Array.isArray(target) || target.length < 2) return false;
        const val = typeof actual === 'string' && !isNaN(Number(actual)) ? Number(actual) : actual;
        return val >= target[0] && val <= target[1];
      }

      default:
        return false;
    }
  }

  /**
   * Evaluates all conditions of a rule (AND logic by default)
   */
  public static evaluateAll(
    conditions: Array<{ field: string; operator: RuleOperator; value: any }>,
    payload: any
  ): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(cond => this.evaluateCondition(cond, payload));
  }
}
