import { ImportDefinition, ImportValidationError } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class DomainValidatorService {
  /**
   * Validates business and domain rules for a row in a specific context.
   */
  public static async validateDomain(
    importId: string,
    rowNumber: number,
    data: Record<string, any>,
    definition: ImportDefinition,
    context: { producerId?: string | null; eventId?: string | null }
  ): Promise<ImportValidationError[]> {
    const errors: ImportValidationError[] = [];

    // 1. Multi-tenant Scope Validation (Section 1.1.5.15.10 & 11)
    if (context.producerId && data.producerId && data.producerId !== context.producerId) {
      errors.push({
        id: `err_dom_${rowNumber}_producer`,
        importId,
        rowNumber,
        columnName: 'producerId',
        cellValue: data.producerId,
        severity: 'BLOCKING',
        ruleCode: 'scope.producer_mismatch',
        message: `Registro indica Produtor "${data.producerId}", divergente do contexto autorizado "${context.producerId}".`,
        suggestedFix: `O contexto operacional autorizado não pode ser sobrescrito pelo arquivo.`
      });
    }

    if (context.eventId && data.eventId && data.eventId !== context.eventId) {
      errors.push({
        id: `err_dom_${rowNumber}_event`,
        importId,
        rowNumber,
        columnName: 'eventId',
        cellValue: data.eventId,
        severity: 'BLOCKING',
        ruleCode: 'scope.event_mismatch',
        message: `Registro indica Evento "${data.eventId}", divergente do evento selecionado "${context.eventId}".`,
        suggestedFix: `Remover identificadores externos que colidam com o evento da importação.`
      });
    }

    // 2. ACCOUNTS_PAYABLE Domain Rules
    if (definition.type === 'ACCOUNTS_PAYABLE') {
      const amount = parseFloat(data.amount);
      if (amount <= 0) {
        errors.push({
          id: `err_dom_${rowNumber}_amount`,
          importId,
          rowNumber,
          columnName: 'amount',
          cellValue: data.amount,
          severity: 'BLOCKING',
          ruleCode: 'finance.positive_amount',
          message: `O valor da conta a pagar deve ser estritamente maior que zero (R$ 0,00).`,
          suggestedFix: `Informar o valor nominal correto da obrigação.`
        });
      }
    }

    // 3. FINANCIAL_TRANSACTIONS Domain Rules
    if (definition.type === 'FINANCIAL_TRANSACTIONS') {
      const amount = parseFloat(data.amount);
      if (amount <= 0) {
        errors.push({
          id: `err_dom_${rowNumber}_amount`,
          importId,
          rowNumber,
          columnName: 'amount',
          cellValue: data.amount,
          severity: 'BLOCKING',
          ruleCode: 'finance.positive_amount',
          message: `Lançamentos de movimentação financeira exigem valor absoluto positivo.`,
          suggestedFix: `O sinal do lançamento é definido pela coluna Tipo (DÉBITO / CRÉDITO).`
        });
      }
    }

    return errors;
  }
}
