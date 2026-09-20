import {
  ImportRequest,
  ImportMapping,
  ImportValidationError,
  ImportSummary,
  ImportDuplicate,
  ImportStatus
} from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { EventBus } from '../../events/event-bus';
import { ImportTypeRegistry } from './import.registry';
import { SchemaValidatorService } from '../validation/schema-validator.service';
import { DomainValidatorService } from '../validation/domain-validator.service';
import { DuplicateDetectorService } from '../duplicates/duplicate-detector.service';
import { ValidationReportService } from '../validation/validation-report.service';
import { MergePlanService } from '../duplicates/merge-plan.service';
import { ImportRepository } from './import.repository';

export interface ProcessImportResult {
  importRequestId: string;
  summary: ImportSummary;
  status: ImportStatus;
  errorMessage?: string;
}

export class ImportProcessorService {
  /**
   * Processes rows of an import request using mapping, validation, duplicate strategies, and atomicity policies
   */
  public static async process(
    importRequest: ImportRequest,
    rawRows: Record<string, any>[],
    mapping: ImportMapping,
    actorUserId: string,
    onProgress?: (processed: number, total: number, percentage: number) => Promise<void>
  ): Promise<ProcessImportResult> {
    const definition = ImportTypeRegistry.get(importRequest.importType);
    if (!definition) {
      throw new Error(`Tipo de importação "${importRequest.importType}" não possui definição registrada.`);
    }

    const totalRows = rawRows.length;
    await ImportRepository.updateStatus(importRequest.id, 'PROCESSING', {
      startedAt: new Date().toISOString()
    });

    await EventBus.publish({
      id: `evt-imp-start-${Date.now()}`,
      type: 'DATA_IMPORT_STARTED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: importRequest.id,
      timestamp: new Date(),
      actorUserId,
      data: { importRequestId: importRequest.id, totalRows, importType: importRequest.importType }
    });

    const collectedErrors: ImportValidationError[] = [];
    const validRowsToCommit: { rowNumber: number; sanitizedData: Record<string, any> }[] = [];

    // Step 1: Schema and Domain Validation
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const rowNumber = raw._rowNumber || i + 1;

      const { errors: schemaErrors, sanitizedData } = SchemaValidatorService.validateRow(
        importRequest.id,
        raw,
        rowNumber,
        definition,
        mapping.fields
      );

      const domainErrors = await DomainValidatorService.validateDomain(
        importRequest.id,
        rowNumber,
        sanitizedData,
        definition,
        {
          producerId: importRequest.producerId,
          eventId: importRequest.eventId
        }
      );

      const rowErrors = [...schemaErrors, ...domainErrors];
      if (rowErrors.length > 0) {
        collectedErrors.push(...rowErrors);
      } else {
        // Multi-tenant context enforcement
        if (importRequest.producerId) sanitizedData.producerId = importRequest.producerId;
        if (importRequest.eventId) sanitizedData.eventId = importRequest.eventId;
        validRowsToCommit.push({ rowNumber, sanitizedData });
      }
    }

    // Atomicity Check on ALL_OR_NOTHING
    const hasBlockingErrors = collectedErrors.some(e => e.severity === 'BLOCKING' || e.severity === 'ERROR');
    if (importRequest.atomicityPolicy === 'ALL_OR_NOTHING' && hasBlockingErrors) {
      await ImportRepository.saveValidationErrors(collectedErrors);
      const summary = ValidationReportService.calculateSummary(totalRows, collectedErrors, 0);
      summary.failedCount = totalRows;

      await ImportRepository.updateStatus(importRequest.id, 'FAILED', {
        summary,
        errorMessage: 'Política ALL_OR_NOTHING violada: lote contém inconsistências impeditivas.',
        completedAt: new Date().toISOString()
      });

      await EventBus.publish({
        id: `evt-imp-fail-${Date.now()}`,
        type: 'DATA_IMPORT_FAILED',
        resourceType: 'IMPORT_REQUEST',
        resourceId: importRequest.id,
        timestamp: new Date(),
        actorUserId,
        data: {
          importRequestId: importRequest.id,
          reason: 'Importação abortada: política ALL_OR_NOTHING acionada por erros de validação.'
        }
      });

      return {
        importRequestId: importRequest.id,
        summary,
        status: 'FAILED',
        errorMessage: 'Política ALL_OR_NOTHING violada: lote contém inconsistências impeditivas.'
      };
    }

    // Step 2: Duplicate Detection
    const duplicateRows = await DuplicateDetectorService.detectDuplicates(
      importRequest.id,
      validRowsToCommit.map(r => ({ rowNumber: r.rowNumber, data: r.sanitizedData })),
      definition,
      importRequest.duplicateStrategy
    );

    if (duplicateRows.length > 0) {
      await ImportRepository.saveDuplicates(duplicateRows);
    }

    const duplicateRowMap = new Map<number, ImportDuplicate>();
    duplicateRows.forEach(d => duplicateRowMap.set(d.rowNumber, d));

    // Step 3: Ingestion and Persistence of Valid Records
    let createdCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;

    for (let idx = 0; idx < validRowsToCommit.length; idx++) {
      const item = validRowsToCommit[idx];
      const dup = duplicateRowMap.get(item.rowNumber);

      if (dup) {
        if (importRequest.duplicateStrategy === 'BLOCK') {
          collectedErrors.push({
            id: `err_dup_${item.rowNumber}`,
            importId: importRequest.id,
            rowNumber: item.rowNumber,
            columnName: dup.matchField,
            cellValue: dup.matchValue,
            severity: 'BLOCKING',
            ruleCode: 'duplicate.blocked',
            message: `Registro duplicado bloqueado conforme estratégia BLOCK (${dup.matchField}: ${dup.matchValue})`,
            suggestedFix: 'Remover linha duplicada ou alterar a estratégia de duplicidade.'
          });
          continue;
        } else if (importRequest.duplicateStrategy === 'IGNORE') {
          ignoredCount++;
          continue;
        } else if (importRequest.duplicateStrategy === 'MANUAL_DECISION') {
          await MergePlanService.createPlan(
            importRequest.importType,
            dup.existingEntityId,
            `row-${item.rowNumber}`
          );
          ignoredCount++;
          continue;
        } else if (importRequest.duplicateStrategy === 'UPDATE') {
          await this.updateExistingRecord(importRequest.importType, dup.existingEntityId, item.sanitizedData);
          updatedCount++;
          continue;
        }
      }

      await this.persistNewRecord(importRequest.importType, item.sanitizedData, importRequest.id);
      createdCount++;

      // Progress reporting
      if (idx % 10 === 0 || idx === validRowsToCommit.length - 1) {
        const pct = Math.round(((idx + 1) / totalRows) * 100);
        if (onProgress) {
          await onProgress(idx + 1, totalRows, pct);
        }
        await EventBus.publish({
          id: `evt-imp-prog-${idx}`,
          type: 'DATA_IMPORT_PROGRESS',
          resourceType: 'IMPORT_REQUEST',
          resourceId: importRequest.id,
          timestamp: new Date(),
          actorUserId,
          data: { importRequestId: importRequest.id, processedRows: idx + 1, totalRows, percentage: pct }
        });
      }
    }

    if (collectedErrors.length > 0) {
      await ImportRepository.saveValidationErrors(collectedErrors);
    }

    const summary = ValidationReportService.calculateSummary(totalRows, collectedErrors, duplicateRows.length);
    summary.createdCount = createdCount;
    summary.updatedCount = updatedCount;
    summary.ignoredCount = ignoredCount;
    summary.failedCount = summary.invalidRows;

    const finalStatus: ImportStatus = summary.invalidRows === 0
      ? 'COMPLETED'
      : (createdCount > 0 || updatedCount > 0)
        ? 'PARTIALLY_COMPLETED'
        : 'FAILED';

    await ImportRepository.updateStatus(importRequest.id, finalStatus, {
      summary,
      completedAt: new Date().toISOString()
    });

    await EventBus.publish({
      id: `evt-imp-comp-${Date.now()}`,
      type: 'DATA_IMPORT_COMPLETED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: importRequest.id,
      timestamp: new Date(),
      actorUserId,
      data: {
        importRequestId: importRequest.id,
        summary,
        finalStatus
      }
    });

    return {
      importRequestId: importRequest.id,
      summary,
      status: finalStatus
    };
  }

  private static async persistNewRecord(
    importType: string,
    data: Record<string, any>,
    importRequestId: string
  ): Promise<void> {
    const recordId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    switch (importType) {
      case 'CUSTOMERS':
      case 'MARKETING_CONTACTS':
        await prisma.customer.create({
          data: {
            id: recordId,
            name: data.name || 'Sem Nome',
            email: data.email || null,
            phone: data.phone || null,
            document: data.document || data.cpf || null,
            tags: importType === 'MARKETING_CONTACTS' ? ['MARKETING', importRequestId] : [importRequestId],
            createdAt: new Date()
          }
        });
        break;

      case 'SUPPLIERS':
        await prisma.supplier.create({
          data: {
            id: recordId,
            name: data.name || data.tradeName || 'Fornecedor',
            document: data.document || data.cnpj || null,
            bankDetails: data.bankDetails || (data.pixKey ? { pixKey: data.pixKey } : null),
            createdAt: new Date()
          }
        });
        break;

      case 'FINANCIAL_TRANSACTIONS':
      case 'ACCOUNTS_PAYABLE':
      case 'ACCOUNTS_RECEIVABLE':
        await prisma.financialTransaction.create({
          data: {
            id: recordId,
            description: `${data.description || 'Importação'} [Lote ${importRequestId}]`,
            amount: Number(data.amount) || 0,
            type: data.type || (importType === 'ACCOUNTS_RECEIVABLE' ? 'CREDIT' : 'DEBIT'),
            status: data.status || 'PENDING',
            createdAt: data.date ? new Date(data.date) : new Date()
          }
        });
        break;

      case 'EVENT_PARTICIPANTS':
        await prisma.ticket.create({
          data: {
            id: recordId,
            orderId: `ord-imp-${importRequestId}`,
            ticketTypeId: data.ticketTypeId || 'default',
            barcode: data.barcode || `TCK-${Date.now()}`,
            holderName: data.name || data.holderName || 'Participante',
            holderDocument: data.document || data.cpf || null,
            status: 'VALID',
            createdAt: new Date()
          }
        });
        break;

      case 'LEGACY_ORDERS':
        await prisma.order.create({
          data: {
            id: recordId,
            customerId: data.customerId || `cust-imp-${importRequestId}`,
            eventId: data.eventId || null,
            totalAmount: Number(data.totalAmount) || 0,
            status: data.status || 'CONFIRMED',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          }
        });
        break;

      default:
        break;
    }
  }

  private static async updateExistingRecord(
    importType: string,
    existingId: string,
    incomingData: Record<string, any>
  ): Promise<void> {
    switch (importType) {
      case 'CUSTOMERS':
      case 'MARKETING_CONTACTS':
        await prisma.customer.update({
          where: { id: existingId },
          data: {
            name: incomingData.name,
            email: incomingData.email,
            phone: incomingData.phone
          }
        });
        break;

      case 'SUPPLIERS':
        await prisma.supplier.update({
          where: { id: existingId },
          data: {
            name: incomingData.name || incomingData.tradeName,
            bankDetails: incomingData.bankDetails || (incomingData.pixKey ? { pixKey: incomingData.pixKey } : undefined)
          }
        });
        break;

      default:
        break;
    }
  }
}
