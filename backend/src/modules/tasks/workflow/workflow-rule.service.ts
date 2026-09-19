export class WorkflowRuleService {
  /**
   * Evaluate a condition JSON against an event payload
   */
  public static evaluateCondition(conditionJson: any, payload: any): boolean {
    if (!conditionJson || Object.keys(conditionJson).length === 0) {
      return true; // No conditions = always matches
    }

    for (const key of Object.keys(conditionJson)) {
      const condition = conditionJson[key];
      const payloadVal = payload[key];

      if (typeof condition === 'object' && condition !== null) {
        if (condition.gt !== undefined) {
          if (!(Number(payloadVal) > Number(condition.gt))) return false;
        }
        if (condition.gte !== undefined) {
          if (!(Number(payloadVal) >= Number(condition.gte))) return false;
        }
        if (condition.lt !== undefined) {
          if (!(Number(payloadVal) < Number(condition.lt))) return false;
        }
        if (condition.lte !== undefined) {
          if (!(Number(payloadVal) <= Number(condition.lte))) return false;
        }
        if (condition.equals !== undefined) {
          if (payloadVal !== condition.equals) return false;
        }
      } else {
        // Direct value comparison
        if (payloadVal !== condition) return false;
      }
    }

    return true;
  }
}
