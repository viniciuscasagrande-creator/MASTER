export interface TermValidationResult {
  valid: boolean;
  errors: string[];
  requiresApproval: boolean;
  approvalReasons: string[];
}

export class CommercialTermsValidator {
  private static readonly MIN_PLATFORM_COMMISSION_WITHOUT_APPROVAL = 7.0; // %

  /**
   * Valida as condições comerciais da proposta estruturada
   */
  public static validateTerms(terms: any[]): TermValidationResult {
    const errors: string[] = [];
    const approvalReasons: string[] = [];
    let requiresApproval = false;

    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      errors.push('A proposta deve conter ao menos uma condição comercial definida.');
      return { valid: false, errors, requiresApproval, approvalReasons };
    }

    let hasPlatformTerm = false;

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const index = i + 1;

      if (!term.name || term.name.trim() === '') {
        errors.push(`Termo #${index}: Nome da condição é obrigatório.`);
      }

      if (!term.termType) {
        errors.push(`Termo #${index}: Tipo da condição comercial é obrigatório.`);
      }

      if (term.termType === 'PLATFORM_COMMISSION') {
        hasPlatformTerm = true;
      }

      const calcType = term.calculationType || 'PERCENTAGE';

      if (calcType === 'PERCENTAGE') {
        if (term.percentage === undefined || term.percentage === null || isNaN(Number(term.percentage))) {
          errors.push(`Termo #${index} (${term.name || 'Sem nome'}): Percentual é obrigatório para o modelo PERCENTUAL.`);
        } else {
          const pct = Number(term.percentage);
          if (pct < 0 || pct > 100) {
            errors.push(`Termo #${index}: Percentual deve estar entre 0% e 100%.`);
          }

          // Verificação de alçada interna para taxa de plataforma DiskIngressos
          if (term.termType === 'PLATFORM_COMMISSION' && pct < this.MIN_PLATFORM_COMMISSION_WITHOUT_APPROVAL) {
            requiresApproval = true;
            approvalReasons.push(`Taxa de plataforma de ${pct}% está abaixo do piso padrão de ${this.MIN_PLATFORM_COMMISSION_WITHOUT_APPROVAL}%.`);
          }
        }
      } else if (calcType === 'FIXED_AMOUNT' || calcType === 'PER_TICKET') {
        if (term.amount === undefined || term.amount === null || isNaN(Number(term.amount))) {
          errors.push(`Termo #${index} (${term.name || 'Sem nome'}): Valor monetário é obrigatório para cálculo FIXO ou POR INGRESSO.`);
        } else {
          const val = Number(term.amount);
          if (val < 0) {
            errors.push(`Termo #${index}: Valor não pode ser negativo.`);
          }
        }
      }

      // Verificação de Pagador
      if (term.payer === 'SPLIT') {
        const prodPct = Number(term.splitProducerPercentage || 0);
        const buyerPct = Number(term.splitBuyerPercentage || 0);
        if (Math.abs(prodPct + buyerPct - 100) > 0.01) {
          errors.push(`Termo #${index}: Divisão (Split) entre produtor (${prodPct}%) e comprador (${buyerPct}%) deve totalizar exatamente 100%.`);
        }
      }

      // Concessões especiais como REBATE ou MINIMUM_GUARANTEE exigem aprovação
      if (term.termType === 'REBATE' || term.termType === 'MINIMUM_GUARANTEE') {
        requiresApproval = true;
        approvalReasons.push(`Inclusão de condição contratual de risco comercial: ${term.termType}.`);
      }
    }

    if (!hasPlatformTerm) {
      // Not an error, but flag that platform commission was omitted
      approvalReasons.push('Proposta sem cobrança direta de taxa de plataforma configurada.');
    }

    return {
      valid: errors.length === 0,
      errors,
      requiresApproval,
      approvalReasons
    };
  }
}
