import crypto from 'crypto';
import {
  ImportRequest,
  ImportType,
  ImportMapping,
  ImportMappingField,
  ImportSummary,
  ImportValidationError,
  ImportDuplicate,
  DuplicateStrategy,
  AtomicityPolicy,
  ImportTemplate
} from '@shared/types/index';
import { EventBus } from '../../events/event-bus';
import { ImportTypeRegistry } from './import.registry';
import { ParserRegistry } from '../parsers/parser.registry';
import { MappingSuggestionService } from '../mapping/mapping-suggestion.service';
import { MappingService } from '../mapping/mapping.service';
import { SchemaValidatorService } from '../validation/schema-validator.service';
import { DomainValidatorService } from '../validation/domain-validator.service';
import { DuplicateDetectorService } from '../duplicates/duplicate-detector.service';
import { ValidationReportService } from '../validation/validation-report.service';
import { ImportProcessorService } from './import-processor.service';
import { ImportRepository } from './import.repository';

export interface CreateImportInput {
  importType: ImportType;
  fileName: string;
  fileBuffer: Buffer | string;
  producerId?: string | null;
  eventId?: string | null;
  creatorUserId: string;
  creatorUserName: string;
  duplicateStrategy?: DuplicateStrategy;
  atomicityPolicy?: AtomicityPolicy;
}

export interface CreateImportResponse {
  request: ImportRequest;
  headers: string[];
  suggestedFields: ImportMappingField[];
  sampleRows: Record<string, any>[];
}

interface FileCacheEntry {
  rawRows: Record<string, any>[];
  headers: string[];
  fileBuffer: Buffer | string;
}

export class ImportService {
  private static fileCache: Map<string, FileCacheEntry> = new Map();
  private static sequenceCounter = 1000;

  /**
   * Step 1: Upload, parse file, detect format, calculate checksum, suggest mapping, save initial DRAFT
   */
  public static async createImportRequest(input: CreateImportInput): Promise<CreateImportResponse> {
    const definition = ImportTypeRegistry.get(input.importType);
    if (!definition) {
      throw new Error(`Tipo de importação "${input.importType}" não suportado ou não registrado.`);
    }

    const isCsv = input.fileName.toLowerCase().endsWith('.csv');
    const isXlsx = input.fileName.toLowerCase().endsWith('.xlsx');
    if (!isCsv && !isXlsx) {
      throw new Error('Formato de arquivo inválido. Suportados apenas .csv e .xlsx.');
    }

    const fileFormat: 'CSV' | 'XLSX' = isCsv ? 'CSV' : 'XLSX';

    // Calculate Checksum (SHA-256)
    const content = typeof input.fileBuffer === 'string' ? input.fileBuffer : input.fileBuffer.toString('utf8');
    const fileChecksum = crypto.createHash('sha256').update(content).digest('hex');
    const fileSize = typeof input.fileBuffer === 'string' ? Buffer.byteLength(input.fileBuffer) : input.fileBuffer.length;

    // Parse File
    const parsed = ParserRegistry.parseFile(input.fileBuffer, fileFormat);
    if (parsed.headers.length === 0) {
      throw new Error('O arquivo enviado não contém cabeçalhos válidos ou está vazio.');
    }

    // Auto Mapping Suggestion
    const suggestions = MappingSuggestionService.suggestMappings(parsed.headers, definition.columns);
    const suggestedFields: ImportMappingField[] = suggestions
      .filter(s => !!s.targetColumn)
      .map(s => ({
        fileColumn: s.fileColumn,
        targetColumn: s.targetColumn!,
        transformation: s.suggestedTransformation || 'TRIM'
      }));

    const year = new Date().getFullYear();
    this.sequenceCounter++;
    const code = `IMP-${year}-${String(this.sequenceCounter).padStart(4, '0')}`;

    const request = await ImportRepository.create({
      code,
      importType: input.importType,
      documentId: `doc-${Date.now()}`,
      fileName: input.fileName,
      fileSize,
      fileFormat,
      fileChecksum,
      producerId: input.producerId || null,
      eventId: input.eventId || null,
      creatorUserId: input.creatorUserId,
      creatorUserName: input.creatorUserName,
      duplicateStrategy: input.duplicateStrategy || 'IGNORE',
      atomicityPolicy: input.atomicityPolicy || 'ALL_OR_NOTHING',
      summary: {
        totalRows: parsed.totalRows,
        validRows: 0,
        warningRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        createdCount: 0,
        updatedCount: 0,
        ignoredCount: 0,
        failedCount: 0
      }
    });

    // Cache file rows for subsequent wizard steps
    this.fileCache.set(request.id, {
      rawRows: parsed.rows,
      headers: parsed.headers,
      fileBuffer: input.fileBuffer
    });

    // Publish event
    await EventBus.publish({
      id: `evt-imp-created-${request.id}`,
      type: 'DATA_IMPORT_CREATED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: request.id,
      timestamp: new Date(),
      actorUserId: input.creatorUserId,
      data: {
        importRequestId: request.id,
        code: request.code,
        importType: request.importType,
        totalRows: parsed.totalRows,
        creatorUserId: input.creatorUserId
      }
    });

    return {
      request,
      headers: parsed.headers,
      suggestedFields,
      sampleRows: parsed.rows.slice(0, 5)
    };
  }

  /**
   * Step 2: Save custom or confirmed field mappings
   */
  public static async saveMapping(
    importRequestId: string,
    name: string,
    fields: ImportMappingField[],
    partnerName?: string | null
  ): Promise<ImportMapping> {
    const imp = await ImportRepository.findById(importRequestId);
    if (!imp) throw new Error(`Importação "${importRequestId}" não encontrada.`);

    const mapping = await MappingService.saveMapping(
      name,
      imp.importType,
      fields,
      partnerName,
      imp.producerId
    );

    await ImportRepository.updateStatus(imp.id, imp.status, {
      mappingId: mapping.id
    });

    return mapping;
  }

  /**
   * Step 3: Run comprehensive schema & domain validation + duplicate detection
   */
  public static async validateImport(importRequestId: string): Promise<{
    summary: ImportSummary;
    errors: ImportValidationError[];
    totalErrors: number;
    duplicates: ImportDuplicate[];
  }> {
    const imp = await ImportRepository.findById(importRequestId);
    if (!imp) throw new Error(`Importação "${importRequestId}" não encontrada.`);

    const cached = this.fileCache.get(importRequestId);
    if (!cached) {
      throw new Error('Conteúdo do arquivo não encontrado em cache. Por favor, reenvie a planilha.');
    }

    const definition = ImportTypeRegistry.get(imp.importType);
    if (!definition) throw new Error(`Definição do tipo "${imp.importType}" não encontrada.`);

    let mappingFields: ImportMappingField[] = [];
    if (imp.mappingId) {
      const savedMapping = await MappingService.getMappingById(imp.mappingId);
      if (savedMapping) mappingFields = savedMapping.fields;
    }

    if (mappingFields.length === 0) {
      const suggestions = MappingSuggestionService.suggestMappings(cached.headers, definition.columns);
      mappingFields = suggestions
        .filter(s => !!s.targetColumn)
        .map(s => ({
          fileColumn: s.fileColumn,
          targetColumn: s.targetColumn!,
          transformation: s.suggestedTransformation || 'TRIM'
        }));
    }

    const collectedErrors: ImportValidationError[] = [];
    const validRows: { rowNumber: number; data: Record<string, any> }[] = [];

    for (let i = 0; i < cached.rawRows.length; i++) {
      const raw = cached.rawRows[i];
      const rowNumber = raw._rowNumber || i + 1;

      const { errors: schemaErrors, sanitizedData } = SchemaValidatorService.validateRow(
        imp.id,
        raw,
        rowNumber,
        definition,
        mappingFields
      );

      const domainErrors = await DomainValidatorService.validateDomain(
        imp.id,
        rowNumber,
        sanitizedData,
        definition,
        {
          producerId: imp.producerId,
          eventId: imp.eventId
        }
      );

      const rowErrors = [...schemaErrors, ...domainErrors];
      if (rowErrors.length > 0) {
        collectedErrors.push(...rowErrors);
      } else {
        validRows.push({ rowNumber, data: sanitizedData });
      }
    }

    // Duplicate detection
    const duplicates = await DuplicateDetectorService.detectDuplicates(
      imp.id,
      validRows,
      definition,
      imp.duplicateStrategy
    );

    // Save in database
    await ImportRepository.saveValidationErrors(collectedErrors);
    if (duplicates.length > 0) {
      await ImportRepository.saveDuplicates(duplicates);
    }

    const summary = ValidationReportService.calculateSummary(cached.rawRows.length, collectedErrors, duplicates.length);

    await ImportRepository.updateStatus(imp.id, 'VALIDATED', {
      summary
    });

    await EventBus.publish({
      id: `evt-imp-val-${imp.id}`,
      type: 'DATA_IMPORT_VALIDATED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: imp.id,
      timestamp: new Date(),
      actorUserId: imp.creatorUserId,
      data: {
        importRequestId: imp.id,
        code: imp.code,
        summary
      }
    });

    return {
      summary,
      errors: collectedErrors.slice(0, 100),
      totalErrors: collectedErrors.length,
      duplicates
    };
  }

  /**
   * Step 4: Confirm import execution, route through approvals if needed, or trigger async processor
   */
  public static async confirmImport(
    importRequestId: string,
    options?: {
      duplicateStrategy?: DuplicateStrategy;
      atomicityPolicy?: AtomicityPolicy;
    },
    actorUserId?: string
  ): Promise<{ request: ImportRequest; requiresApproval: boolean }> {
    const imp = await ImportRepository.findById(importRequestId);
    if (!imp) throw new Error(`Importação "${importRequestId}" não encontrada.`);

    const cached = this.fileCache.get(importRequestId);
    if (!cached) throw new Error('Conteúdo do arquivo não encontrado em cache. Por favor, reenvie a planilha.');

    const definition = ImportTypeRegistry.get(imp.importType);
    if (!definition) throw new Error(`Definição do tipo "${imp.importType}" não encontrada.`);

    const suggestions = MappingSuggestionService.suggestMappings(cached.headers, definition.columns);
    let mapping: ImportMapping = {
      id: 'default',
      name: 'Default Mapping',
      importType: imp.importType,
      fields: suggestions.filter(s => !!s.targetColumn).map(s => ({
        fileColumn: s.fileColumn,
        targetColumn: s.targetColumn!,
        transformation: s.suggestedTransformation || 'TRIM'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (imp.mappingId) {
      const saved = await MappingService.getMappingById(imp.mappingId);
      if (saved) mapping = saved;
    }

    const updated = await ImportRepository.updateStatus(imp.id, 'QUEUED', {
      duplicateStrategy: options?.duplicateStrategy || imp.duplicateStrategy,
      atomicityPolicy: options?.atomicityPolicy || imp.atomicityPolicy
    });

    await EventBus.publish({
      id: `evt-imp-conf-${imp.id}`,
      type: 'DATA_IMPORT_CONFIRMED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: imp.id,
      timestamp: new Date(),
      actorUserId: actorUserId || imp.creatorUserId,
      data: { importRequestId: imp.id, code: imp.code }
    });

    // Execute processor asynchronously
    setImmediate(async () => {
      try {
        await ImportProcessorService.process(
          updated,
          cached.rawRows,
          mapping,
          actorUserId || updated.creatorUserId
        );
      } catch (err: any) {
        await ImportRepository.updateStatus(imp.id, 'FAILED', {
          errorMessage: err.message || 'Erro durante o processamento do lote.'
        });
      }
    });

    return { request: updated, requiresApproval: false };
  }

  /**
   * Cancel an import in draft or validated state
   */
  public static async cancelImport(importRequestId: string, actorUserId: string): Promise<ImportRequest> {
    const imp = await ImportRepository.findById(importRequestId);
    if (!imp) throw new Error(`Importação "${importRequestId}" não encontrada.`);

    if (imp.status === 'COMPLETED' || imp.status === 'PROCESSING') {
      throw new Error(`Não é possível cancelar uma importação no status "${imp.status}".`);
    }

    const updated = await ImportRepository.updateStatus(imp.id, 'CANCELLED');
    this.fileCache.delete(importRequestId);

    await EventBus.publish({
      id: `evt-imp-cancel-${imp.id}`,
      type: 'DATA_IMPORT_CANCELLED',
      resourceType: 'IMPORT_REQUEST',
      resourceId: imp.id,
      timestamp: new Date(),
      actorUserId,
      data: { importRequestId: imp.id, actorUserId }
    });

    return updated;
  }

  /**
   * Export validation errors as Brazilian UTF-8 BOM CSV
   */
  public static async exportErrorReport(importRequestId: string): Promise<string> {
    const errors = await ImportRepository.getValidationErrors(importRequestId);
    return ValidationReportService.generateErrorExportCsv(errors);
  }

  /**
   * Download official import template with columns and sample row
   */
  public static getTemplates(): ImportTemplate[] {
    const definitions = ImportTypeRegistry.getAll();
    return definitions.map(def => ({
      id: `tpl-${def.type.toLowerCase()}`,
      name: `Modelo Oficial: ${def.name}`,
      importType: def.type,
      description: def.description,
      version: 1,
      fileName: `modelo_importacao_${def.type.toLowerCase()}.csv`,
      format: 'CSV',
      columns: def.columns,
      downloadUrl: `/api/data/import-templates/${def.type}/download`,
      updatedAt: new Date().toISOString()
    }));
  }

  public static generateTemplateContent(importType: ImportType): string {
    const def = ImportTypeRegistry.get(importType);
    if (!def) throw new Error(`Definição do tipo "${importType}" não encontrada.`);

    const BOM = '\uFEFF';
    const header = def.columns.map(c => `"${c.label}"`).join(';');
    const sampleRow = def.columns.map(c => `"${c.example || ''}"`).join(';');

    return `${BOM}${header}\n${sampleRow}\n`;
  }
}
