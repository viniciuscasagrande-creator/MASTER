export class FinancePolicy {
  /**
   * Validates financial specific requirements, such as required documents
   * (e.g. NOTA_FISCAL, CONTRATO) if specified in rule.
   */
  validateRequest(requestData: any, rule: any): { valid: boolean; error?: string } {
    if (rule?.requiredDocuments) {
      let requiredDocs: string[] = [];
      try {
        requiredDocs = typeof rule.requiredDocuments === 'string'
          ? JSON.parse(rule.requiredDocuments)
          : rule.requiredDocuments;
      } catch {
        requiredDocs = [];
      }

      if (requiredDocs.length > 0) {
        const attached = (requestData.attachments || []).map((a: any) => a.fileType || a.fileName);
        for (const reqDoc of requiredDocs) {
          const hasDoc = attached.some((a: string) => a.toUpperCase().includes(reqDoc.toUpperCase()));
          if (!hasDoc) {
            return {
              valid: false,
              error: `Documento obrigatório ausente: ${reqDoc}. Anexe o documento para prosseguir.`
            };
          }
        }
      }
    }

    return { valid: true };
  }
}

export const financePolicy = new FinancePolicy();
