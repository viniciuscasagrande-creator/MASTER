export class RefundPolicy {
  validateRequest(requestData: any, rule: any): { valid: boolean; error?: string } {
    if (requestData.amount !== undefined && requestData.amount < 0) {
      return { valid: false, error: 'O valor do estorno não pode ser negativo.' };
    }
    return { valid: true };
  }
}

export const refundPolicy = new RefundPolicy();
