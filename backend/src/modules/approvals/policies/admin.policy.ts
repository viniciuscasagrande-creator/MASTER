export class AdminPolicy {
  validateRequest(requestData: any, rule: any): { valid: boolean; error?: string } {
    return { valid: true };
  }
}

export const adminPolicy = new AdminPolicy();
