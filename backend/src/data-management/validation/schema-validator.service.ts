import {
  ImportColumnDefinition,
  ImportDefinition,
  ImportMappingField,
  ImportSeverity,
  ImportValidationError
} from '@shared/types/index';
import { TransformationService } from '../mapping/transformation.service';

export class SchemaValidatorService {
  /**
   * Validates Brazilian CPF checksum (mod 11)
   */
  public static isValidCpf(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false; // Reject sequences like 111.111.111-11

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(clean.charAt(10), 10);
  }

  /**
   * Validates Brazilian CNPJ checksum
   */
  public static isValidCnpj(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;

    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
  }

  public static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * Validates mapping against protected fields (section 1.1.5.15.34)
   */
  public static validateProtectedFields(
    definition: ImportDefinition,
    mappings: ImportMappingField[]
  ): string[] {
    const violations: string[] = [];
    for (const m of mappings) {
      if (definition.protectedFields.includes(m.targetColumn)) {
        violations.push(`A coluna "${m.fileColumn}" tenta mapear o campo protegido do sistema "${m.targetColumn}".`);
      }
    }
    return violations;
  }

  /**
   * Validates a single row against the import definition and mappings.
   */
  public static validateRow(
    importId: string,
    row: Record<string, any>,
    rowNumber: number,
    definition: ImportDefinition,
    mappings: ImportMappingField[]
  ): { errors: ImportValidationError[]; sanitizedData: Record<string, any> } {
    const errors: ImportValidationError[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const map of mappings) {
      // 0. Protected field check (Section 1.1.5.15.11 & 12)
      if (definition.protectedFields && definition.protectedFields.includes(map.targetColumn)) {
        errors.push({
          id: `err_${rowNumber}_${map.targetColumn}`,
          importId,
          rowNumber,
          columnName: map.fileColumn,
          cellValue: row[map.fileColumn],
          severity: 'BLOCKING',
          ruleCode: 'field.protected',
          message: `O campo "${map.targetColumn}" é protegido pelo sistema e não pode ser sobrescrito por importação.`,
          suggestedFix: `Remover o mapeamento da coluna protegida.`
        });
        continue;
      }

      const colDef = definition.columns.find(c => c.name === map.targetColumn);
      if (!colDef) continue;

      const rawVal = row[map.fileColumn];
      const transformedVal = TransformationService.transform(rawVal, map.transformation, map.transformationArg || map.defaultValue);
      sanitizedData[colDef.name] = transformedVal;

      // 1. Required field check
      if (colDef.required && (transformedVal === null || transformedVal === undefined || transformedVal === '')) {
        errors.push({
          id: `err_${rowNumber}_${colDef.name}`,
          importId,
          rowNumber,
          columnName: map.fileColumn,
          cellValue: rawVal,
          severity: 'BLOCKING',
          ruleCode: `${colDef.name}.required`,
          message: `O campo obrigatório "${colDef.label}" está em branco.`,
          suggestedFix: `Preencher o campo com um valor válido.`
        });
        continue;
      }

      if (transformedVal === null || transformedVal === undefined || transformedVal === '') {
        continue;
      }

      // 2. Type-specific validations
      if (colDef.type === 'DOCUMENT') {
        const cleanDoc = String(transformedVal).replace(/\D/g, '');
        if (cleanDoc.length === 11) {
          if (!this.isValidCpf(cleanDoc)) {
            errors.push({
              id: `err_${rowNumber}_${colDef.name}`,
              importId,
              rowNumber,
              columnName: map.fileColumn,
              cellValue: rawVal,
              severity: 'ERROR',
              ruleCode: `${colDef.name}.invalid_cpf`,
              message: `CPF "${rawVal}" possui dígito verificador inválido.`,
              suggestedFix: `Corrigir o número do documento.`
            });
          }
        } else if (cleanDoc.length === 14) {
          if (!this.isValidCnpj(cleanDoc)) {
            errors.push({
              id: `err_${rowNumber}_${colDef.name}`,
              importId,
              rowNumber,
              columnName: map.fileColumn,
              cellValue: rawVal,
              severity: 'ERROR',
              ruleCode: `${colDef.name}.invalid_cnpj`,
              message: `CNPJ "${rawVal}" possui dígito verificador inválido.`,
              suggestedFix: `Corrigir o número do CNPJ.`
            });
          }
        } else {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'ERROR',
            ruleCode: `${colDef.name}.invalid_length`,
            message: `Documento "${rawVal}" não possui tamanho de CPF (11) ou CNPJ (14).`,
            suggestedFix: `Verificar se o documento foi digitado corretamente.`
          });
        }
      } else if (colDef.type === 'EMAIL') {
        if (!this.isValidEmail(String(transformedVal))) {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'WARNING',
            ruleCode: `${colDef.name}.invalid_email`,
            message: `E-mail "${rawVal}" possui formato inválido.`,
            suggestedFix: `Verificar se faltam caracteres como @ ou domínio.`
          });
        }
      } else if (colDef.type === 'PHONE') {
        const cleanPhone = String(transformedVal).replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'WARNING',
            ruleCode: `${colDef.name}.invalid_phone`,
            message: `Telefone "${rawVal}" com quantidade de dígitos incomum.`,
            suggestedFix: `Informar DDD + número completo.`
          });
        }
      } else if (colDef.type === 'CURRENCY') {
        const num = parseFloat(transformedVal);
        if (isNaN(num) || num < 0) {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'ERROR',
            ruleCode: `${colDef.name}.invalid_currency`,
            message: `Valor monetário "${rawVal}" não pôde ser convertido ou é negativo.`,
            suggestedFix: `Informar um número monetário positivo.`
          });
        }
      } else if (colDef.type === 'DATE') {
        const d = new Date(transformedVal);
        if (isNaN(d.getTime())) {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'ERROR',
            ruleCode: `${colDef.name}.invalid_date`,
            message: `Data "${rawVal}" inválida. Formato esperado: DD/MM/AAAA.`,
            suggestedFix: `Ajustar a data no padrão brasileiro.`
          });
        }
      } else if (colDef.type === 'ENUM' && colDef.allowedValues) {
        if (!colDef.allowedValues.includes(String(transformedVal).toUpperCase())) {
          errors.push({
            id: `err_${rowNumber}_${colDef.name}`,
            importId,
            rowNumber,
            columnName: map.fileColumn,
            cellValue: rawVal,
            severity: 'ERROR',
            ruleCode: `${colDef.name}.invalid_enum`,
            message: `Valor "${rawVal}" não é aceito. Valores permitidos: ${colDef.allowedValues.join(', ')}.`,
            suggestedFix: `Utilizar uma das opções homologadas.`
          });
        }
      }
    }

    return { errors, sanitizedData };
  }
}
