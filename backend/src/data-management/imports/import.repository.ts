import {
  ImportRequest,
  ImportValidationError,
  ImportDuplicate,
  ImportStatus,
  ImportType,
  DuplicateStrategy,
  AtomicityPolicy,
  ImportSummary
} from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class ImportRepository {
  public static async create(data: {
    code: string;
    importType: ImportType;
    documentId: string;
    fileName: string;
    fileSize: number;
    fileFormat: 'CSV' | 'XLSX';
    fileChecksum: string;
    producerId?: string | null;
    eventId?: string | null;
    creatorUserId: string;
    creatorUserName: string;
    duplicateStrategy: DuplicateStrategy;
    atomicityPolicy: AtomicityPolicy;
    summary?: ImportSummary;
  }): Promise<ImportRequest> {
    const defaultSummary: ImportSummary = data.summary || {
      totalRows: 0,
      validRows: 0,
      warningRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      createdCount: 0,
      updatedCount: 0,
      ignoredCount: 0,
      failedCount: 0
    };

    const raw = await prisma.importRequestModel.create({
      data: {
        code: data.code,
        importType: data.importType,
        producerId: data.producerId || null,
        eventId: data.eventId || null,
        documentId: data.documentId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileFormat: data.fileFormat,
        fileChecksum: data.fileChecksum,
        status: 'DRAFT',
        duplicateStrategy: data.duplicateStrategy,
        atomicityPolicy: data.atomicityPolicy,
        templateVersion: 1,
        summary: JSON.stringify(defaultSummary),
        creatorUserId: data.creatorUserId,
        creatorUserName: data.creatorUserName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return this.mapToDto(raw);
  }

  public static async findById(id: string): Promise<ImportRequest | null> {
    const raw = await prisma.importRequestModel.findUnique({ where: { id } });
    return raw ? this.mapToDto(raw) : null;
  }

  public static async list(filter?: {
    producerId?: string | null;
    eventId?: string | null;
    status?: ImportStatus;
    importType?: ImportType;
  }): Promise<ImportRequest[]> {
    const list = await prisma.importRequestModel.findMany({
      where: {
        ...(filter?.producerId ? { producerId: filter.producerId } : {}),
        ...(filter?.eventId ? { eventId: filter.eventId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.importType ? { importType: filter.importType } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    return list.map(r => this.mapToDto(r));
  }

  public static async updateStatus(
    id: string,
    status: ImportStatus,
    extra?: Partial<ImportRequest>
  ): Promise<ImportRequest> {
    const updateData: any = { status, updatedAt: new Date() };

    if (extra?.summary !== undefined) updateData.summary = JSON.stringify(extra.summary);
    if (extra?.mappingId !== undefined) updateData.mappingId = extra.mappingId;
    if (extra?.jobId !== undefined) updateData.jobId = extra.jobId;
    if (extra?.batchId !== undefined) updateData.batchId = extra.batchId;
    if (extra?.approvalId !== undefined) updateData.approvalId = extra.approvalId;
    if (extra?.errorMessage !== undefined) updateData.errorMessage = extra.errorMessage;
    if (extra?.startedAt !== undefined) updateData.startedAt = extra.startedAt ? new Date(extra.startedAt) : null;
    if (extra?.completedAt !== undefined) updateData.completedAt = extra.completedAt ? new Date(extra.completedAt) : null;

    const raw = await prisma.importRequestModel.update({
      where: { id },
      data: updateData
    });

    return this.mapToDto(raw);
  }

  public static async saveValidationErrors(errors: ImportValidationError[]): Promise<void> {
    for (const err of errors) {
      await prisma.importValidationErrorModel.create({
        data: {
          importId: err.importId,
          rowNumber: err.rowNumber,
          columnName: err.columnName,
          cellValue: err.cellValue !== undefined ? String(err.cellValue) : null,
          severity: err.severity,
          ruleCode: err.ruleCode,
          message: err.message,
          suggestedFix: err.suggestedFix || null,
          createdAt: new Date()
        }
      });
    }
  }

  public static async getValidationErrors(importId: string): Promise<ImportValidationError[]> {
    const list = await prisma.importValidationErrorModel.findMany({
      where: { importId }
    });

    return list.map(e => ({
      id: e.id,
      importId: e.importId,
      rowNumber: e.rowNumber,
      columnName: e.columnName,
      cellValue: e.cellValue || undefined,
      severity: e.severity as any,
      ruleCode: e.ruleCode,
      message: e.message,
      suggestedFix: e.suggestedFix || undefined
    }));
  }

  public static async saveDuplicates(duplicates: ImportDuplicate[]): Promise<void> {
    for (const dup of duplicates) {
      await prisma.importDuplicateModel.create({
        data: {
          importId: dup.importId,
          rowNumber: dup.rowNumber,
          matchField: dup.matchField,
          matchValue: dup.matchValue,
          existingEntityId: dup.existingEntityId,
          existingData: JSON.stringify(dup.existingData),
          incomingData: JSON.stringify(dup.incomingData),
          strategy: dup.strategy,
          resolved: dup.resolved,
          resolvedAction: dup.resolvedAction || null,
          resolvedBy: dup.resolvedBy || null,
          resolvedAt: dup.resolvedAt ? new Date(dup.resolvedAt) : null,
          createdAt: new Date()
        }
      });
    }
  }

  public static async getDuplicates(importId: string): Promise<ImportDuplicate[]> {
    const list = await prisma.importDuplicateModel.findMany({
      where: { importId }
    });

    return list.map(d => ({
      id: d.id,
      importId: d.importId,
      rowNumber: d.rowNumber,
      matchField: d.matchField,
      matchValue: d.matchValue,
      existingEntityId: d.existingEntityId,
      existingData: typeof d.existingData === 'string' ? JSON.parse(d.existingData) : d.existingData,
      incomingData: typeof d.incomingData === 'string' ? JSON.parse(d.incomingData) : d.incomingData,
      strategy: d.strategy as any,
      resolved: d.resolved,
      resolvedAction: d.resolvedAction as any,
      resolvedBy: d.resolvedBy || undefined,
      resolvedAt: d.resolvedAt ? (d.resolvedAt.toISOString ? d.resolvedAt.toISOString() : d.resolvedAt) : undefined
    }));
  }

  private static mapToDto(raw: any): ImportRequest {
    const summary: ImportSummary = raw.summary
      ? (typeof raw.summary === 'string' ? JSON.parse(raw.summary) : raw.summary)
      : {
          totalRows: 0,
          validRows: 0,
          warningRows: 0,
          invalidRows: 0,
          duplicateRows: 0,
          createdCount: 0,
          updatedCount: 0,
          ignoredCount: 0,
          failedCount: 0
        };

    return {
      id: raw.id,
      code: raw.code,
      importType: raw.importType as ImportType,
      producerId: raw.producerId || null,
      eventId: raw.eventId || null,
      documentId: raw.documentId,
      fileName: raw.fileName,
      fileSize: raw.fileSize,
      fileFormat: raw.fileFormat as 'CSV' | 'XLSX',
      fileChecksum: raw.fileChecksum,
      mappingId: raw.mappingId || null,
      status: raw.status as ImportStatus,
      duplicateStrategy: raw.duplicateStrategy as DuplicateStrategy,
      atomicityPolicy: raw.atomicityPolicy as AtomicityPolicy,
      templateVersion: raw.templateVersion || 1,
      summary,
      jobId: raw.jobId || null,
      batchId: raw.batchId || null,
      approvalId: raw.approvalId || null,
      beforeSnapshot: raw.beforeSnapshot ? (typeof raw.beforeSnapshot === 'string' ? JSON.parse(raw.beforeSnapshot) : raw.beforeSnapshot) : undefined,
      errorMessage: raw.errorMessage || null,
      creatorUserId: raw.creatorUserId,
      creatorUserName: raw.creatorUserName,
      createdAt: raw.createdAt.toISOString ? raw.createdAt.toISOString() : raw.createdAt,
      updatedAt: raw.updatedAt.toISOString ? raw.updatedAt.toISOString() : raw.updatedAt,
      startedAt: raw.startedAt ? (raw.startedAt.toISOString ? raw.startedAt.toISOString() : raw.startedAt) : null,
      completedAt: raw.completedAt ? (raw.completedAt.toISOString ? raw.completedAt.toISOString() : raw.completedAt) : null
    };
  }

  public static async resolveDuplicate(id: string, action: DuplicateStrategy, actorUserId: string): Promise<any> {
    const updated = await prisma.importDuplicateModel.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAction: action,
        resolvedBy: actorUserId,
        resolvedAt: new Date()
      }
    });
    return updated;
  }

  public static async listAllDuplicates(resolved?: boolean): Promise<ImportDuplicate[]> {
    const list = await prisma.importDuplicateModel.findMany({
      where: resolved !== undefined ? { resolved } : undefined
    });
    return list.map(d => ({
      id: d.id,
      importId: d.importId,
      rowNumber: d.rowNumber,
      matchField: d.matchField,
      matchValue: d.matchValue,
      existingEntityId: d.existingEntityId,
      existingData: typeof d.existingData === 'string' ? JSON.parse(d.existingData) : d.existingData,
      incomingData: typeof d.incomingData === 'string' ? JSON.parse(d.incomingData) : d.incomingData,
      strategy: d.strategy as any,
      resolved: d.resolved,
      resolvedAction: d.resolvedAction as any,
      resolvedBy: d.resolvedBy || undefined,
      resolvedAt: d.resolvedAt ? (d.resolvedAt.toISOString ? d.resolvedAt.toISOString() : d.resolvedAt) : undefined
    }));
  }
}

