import { ImportSummary, ImportValidationError } from '@shared/types/index';

export class ValidationReportService {
  public static calculateSummary(
    totalRows: number,
    errors: ImportValidationError[],
    duplicateRowsCount: number = 0
  ): ImportSummary {
    const errorRowsSet = new Set<number>();
    const warningRowsSet = new Set<number>();

    for (const err of errors) {
      if (err.severity === 'ERROR' || err.severity === 'BLOCKING') {
        errorRowsSet.add(err.rowNumber);
      } else if (err.severity === 'WARNING') {
        warningRowsSet.add(err.rowNumber);
      }
    }

    const invalidRows = errorRowsSet.size;
    // Warnings on rows that don't already have blocking errors
    let warningRows = 0;
    warningRowsSet.forEach(r => {
      if (!errorRowsSet.has(r)) warningRows++;
    });

    const validRows = Math.max(0, totalRows - invalidRows - duplicateRowsCount);

    return {
      totalRows,
      validRows,
      warningRows,
      invalidRows,
      duplicateRows: duplicateRowsCount,
      createdCount: 0,
      updatedCount: 0,
      ignoredCount: 0,
      failedCount: 0
    };
  }

  /**
   * Generates a CSV export of errors formatted with UTF-8 BOM and Brazilian standard (;)
   * Section 1.1.5.15.51: Linha | Campo | Valor | Problema | Orientação
   */
  public static generateErrorExportCsv(errors: ImportValidationError[]): string {
    const BOM = '\uFEFF';
    const header = 'Linha;Campo;Valor Informado;Severidade;Código da Regra;Problema Identificado;Orientação para Correção\n';

    const rows = errors.map(e => {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      return [
        e.rowNumber,
        escape(e.columnName),
        escape(e.cellValue),
        e.severity,
        escape(e.ruleCode),
        escape(e.message),
        escape(e.suggestedFix)
      ].join(';');
    }).join('\n');

    return BOM + header + rows;
  }
}
