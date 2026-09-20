import {
  DuplicateStrategy,
  ImportDefinition,
  ImportDuplicate,
  ImportType
} from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class DuplicateDetectorService {
  /**
   * Checks for duplicates both within the uploaded file (intra-file duplicates)
   * and against existing database records.
   */
  public static async detectDuplicates(
    importId: string,
    rows: { rowNumber: number; data: Record<string, any> }[],
    definition: ImportDefinition,
    strategy: DuplicateStrategy
  ): Promise<ImportDuplicate[]> {
    const duplicates: ImportDuplicate[] = [];
    const seenInFile = new Map<string, number>();

    for (const item of rows) {
      const { rowNumber, data } = item;

      // 1. Identify primary natural key per import type
      let matchField = '';
      let matchValue = '';

      if (definition.type === 'CUSTOMERS') {
        const cpf = String(data.cpf || '').replace(/\D/g, '');
        if (cpf) {
          matchField = 'cpf';
          matchValue = cpf;
        } else if (data.email) {
          matchField = 'email';
          matchValue = String(data.email).toLowerCase().trim();
        }
      } else if (definition.type === 'SUPPLIERS') {
        const cnpj = String(data.cnpj || '').replace(/\D/g, '');
        if (cnpj) {
          matchField = 'cnpj';
          matchValue = cnpj;
        }
      } else if (definition.type === 'MARKETING_CONTACTS') {
        const phone = String(data.phone || '').replace(/\D/g, '');
        if (phone) {
          matchField = 'phone';
          matchValue = phone;
        }
      } else if (definition.type === 'LEGACY_ORDERS') {
        if (data.legacyId) {
          matchField = 'legacyId';
          matchValue = String(data.legacyId).trim();
        }
      }

      if (!matchField || !matchValue) continue;

      const dedupeKey = `${matchField}:${matchValue}`;

      // A) Intra-file duplicate
      if (seenInFile.has(dedupeKey)) {
        duplicates.push({
          id: `dup_${importId}_${rowNumber}`,
          importId,
          rowNumber,
          matchField,
          matchValue,
          existingEntityId: `linha_${seenInFile.get(dedupeKey)}`,
          existingData: { info: `Duplicado em relação à linha ${seenInFile.get(dedupeKey)} da mesma planilha.` },
          incomingData: data,
          strategy,
          resolved: false
        });
        continue;
      }
      seenInFile.set(dedupeKey, rowNumber);

      // B) Database duplicate check
      let existingRecord: any = null;

      if (definition.type === 'CUSTOMERS') {
        if (matchField === 'cpf') {
          existingRecord = await prisma.customer.findUnique({
            where: { cpf: matchValue }
          });
        } else if (matchField === 'email') {
          existingRecord = await prisma.customer.findFirst({
            where: { emailNormalized: matchValue }
          });
        }
      }

      if (existingRecord) {
        duplicates.push({
          id: `dup_${importId}_${rowNumber}`,
          importId,
          rowNumber,
          matchField,
          matchValue,
          existingEntityId: existingRecord.id,
          existingData: existingRecord,
          incomingData: data,
          strategy,
          resolved: false
        });
      }
    }

    return duplicates;
  }
}
