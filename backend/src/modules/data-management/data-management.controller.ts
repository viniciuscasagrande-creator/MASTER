import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../../data-management/imports/import.service';
import { ImportRepository } from '../../data-management/imports/import.repository';
import { RollbackEligibilityService } from '../../data-management/rollback/rollback-eligibility.service';
import { CompensationService } from '../../data-management/rollback/compensation.service';
import { DataQualityService } from '../../data-management/quality/data-quality.service';
import { QualityScanService } from '../../data-management/quality/quality-scan.service';
import { MigrationService } from '../../data-management/migration/migration.service';
import { ReconciliationService } from '../../data-management/migration/reconciliation.service';
import { LegacyIdService } from '../../data-management/migration/legacy-id.service';
import { MappingService } from '../../data-management/mapping/mapping.service';
import { MergePlanService } from '../../data-management/duplicates/merge-plan.service';
import { MergeService } from '../../data-management/duplicates/merge.service';
import { prisma } from '../../core/database/prisma';
import { AppError } from '../../core/errors/AppError';
import { ImportType, DuplicateStrategy } from '@shared/types/index';

export class DataManagementController {
  // ==================== IMPORTS ====================

  public static async uploadAndCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const body = req.body;

      let fileBuffer: Buffer | string;
      if (body.fileBase64 || body.fileContent) {
        const raw = String(body.fileBase64 || body.fileContent).replace(/^data:([A-Za-z-+/]+);base64,/, '');
        fileBuffer = Buffer.from(raw, 'base64');
      } else if (body.rawCsv) {
        fileBuffer = String(body.rawCsv);
      } else if ((req as any).file && (req as any).file.buffer) {
        fileBuffer = (req as any).file.buffer;
      } else {
        throw new AppError('Arquivo ou conteúdo da planilha não informado.', 400);
      }

      const result = await ImportService.createImportRequest({
        importType: body.importType,
        fileName: body.fileName || 'importacao.csv',
        fileBuffer,
        producerId: body.producerId || user.scope?.producers?.[0] || null,
        eventId: body.eventId || user.scope?.events?.[0] || null,
        creatorUserId: user.id,
        creatorUserName: user.name,
        duplicateStrategy: body.duplicateStrategy,
        atomicityPolicy: body.atomicityPolicy
      });

      res.status(201).json({
        success: true,
        message: 'Lote de importação criado e analisado com sucesso.',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listImports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, status, importType } = req.query;
      const list = await ImportRepository.list({
        producerId: producerId ? String(producerId) : undefined,
        eventId: eventId ? String(eventId) : undefined,
        status: status as any,
        importType: importType as any
      });

      res.json({ success: true, total: list.length, items: list });
    } catch (err) {
      next(err);
    }
  }

  public static async getImportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const item = await ImportRepository.findById(id);
      if (!item) throw new AppError('Importação não encontrada.', 404);

      const validationErrors = await ImportRepository.getValidationErrors(id);
      const duplicates = await ImportRepository.getDuplicates(id);

      res.json({
        success: true,
        item,
        errorsCount: validationErrors.length,
        duplicatesCount: duplicates.length,
        errorsPreview: validationErrors.slice(0, 50),
        duplicatesPreview: duplicates.slice(0, 50)
      });
    } catch (err) {
      next(err);
    }
  }

  public static async saveMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { name, fields, partnerName } = req.body;
      if (!fields || !Array.isArray(fields)) {
        throw new AppError('Lista de mapeamento de campos (fields) é obrigatória.', 400);
      }

      const mapping = await ImportService.saveMapping(id, name || 'Mapeamento Customizado', fields, partnerName);
      res.json({ success: true, message: 'Mapeamento salvo com sucesso.', mapping });
    } catch (err) {
      next(err);
    }
  }

  public static async validateImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await ImportService.validateImport(id);
      res.json({ success: true, message: 'Validação concluída com sucesso.', ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async confirmImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const { duplicateStrategy, atomicityPolicy } = req.body;

      const result = await ImportService.confirmImport(
        id,
        { duplicateStrategy, atomicityPolicy },
        user.id
      );

      res.json({
        success: true,
        message: result.requiresApproval
          ? 'Importação submetida ao fluxo de aprovação obrigatória.'
          : 'Lote de importação confirmado e enfileirado para processamento assíncrono.',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const result = await ImportService.cancelImport(id, user.id);
      res.json({ success: true, message: 'Importação cancelada com sucesso.', request: result });
    } catch (err) {
      next(err);
    }
  }

  public static async exportErrorReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const csv = await ImportService.exportErrorReport(id);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="erros_importacao_${id}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  public static async getRollbackEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await RollbackEligibilityService.checkEligibility(id);
      res.json({ success: true, eligibility: result });
    } catch (err) {
      next(err);
    }
  }

  public static async executeRollback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const { forceCompensation } = req.body;

      const result = await CompensationService.executeRollbackOrCompensation(
        id,
        user.id,
        forceCompensation === true
      );

      res.json({
        success: true,
        message: result.actionTaken === 'PHYSICAL_ROLLBACK'
          ? 'Rollback físico de registros executado com sucesso.'
          : 'Ação compensatória executada com cancelamento lógico de dependências.',
        result
      });
    } catch (err) {
      next(err);
    }
  }

  // ==================== TEMPLATES ====================

  public static async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = ImportService.getTemplates();
      res.json({ success: true, items: templates });
    } catch (err) {
      next(err);
    }
  }

  public static async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = String(req.params.type) as ImportType;
      const csv = ImportService.generateTemplateContent(type);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="modelo_importacao_${type.toLowerCase()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  // ==================== DATA QUALITY ====================

  public static async getQualityRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await DataQualityService.getRules();
      res.json({ success: true, items: rules });
    } catch (err) {
      next(err);
    }
  }

  public static async updateQualityRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params.code);
      const updated = await DataQualityService.updateRule(code, req.body);
      res.json({ success: true, message: 'Regra de qualidade atualizada com sucesso.', rule: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async getQualityIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, dimension, severity, entity } = req.query;
      const issues = await DataQualityService.getIssues({
        status: status ? String(status) as any : undefined,
        dimension: dimension ? String(dimension) as any : undefined,
        severity: severity ? String(severity) as any : undefined,
        entity: entity ? String(entity) : undefined
      });

      res.json({ success: true, total: issues.length, items: issues });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveQualityIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const resolved = await DataQualityService.resolveIssue(id);
      res.json({ success: true, message: 'Não conformidade de qualidade resolvida.', issue: resolved });
    } catch (err) {
      next(err);
    }
  }

  public static async dismissQualityIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const dismissed = await DataQualityService.dismissIssue(id);
      res.json({ success: true, message: 'Não conformidade de qualidade ignorada.', issue: dismissed });
    } catch (err) {
      next(err);
    }
  }

  public static async getQualityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DataQualityService.getStats();
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  }

  public static async runQualityScan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ruleCode } = req.body;
      const result = await QualityScanService.runScan(ruleCode ? String(ruleCode) : undefined);
      res.json({ success: true, message: 'Varredura de qualidade executada com sucesso.', result });
    } catch (err) {
      next(err);
    }
  }

  // ==================== MIGRATIONS ====================

  public static async createMigrationProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, sourceSystem, stages } = req.body;
      if (!name || !sourceSystem) {
        throw new AppError('Nome do projeto e sistema de origem são obrigatórios.', 400);
      }

      const project = await MigrationService.createProject(name, description, sourceSystem, stages);
      res.status(201).json({ success: true, message: 'Projeto de migração criado com sucesso.', project });
    } catch (err) {
      next(err);
    }
  }

  public static async listMigrationProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await MigrationService.listProjects();
      res.json({ success: true, total: projects.length, items: projects });
    } catch (err) {
      next(err);
    }
  }

  public static async getMigrationProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await MigrationService.getProject(id);
      const reconciliations = await ReconciliationService.getReconciliations(id);
      const legacyMappings = await LegacyIdService.getMappingsForProject(id);

      res.json({
        success: true,
        project,
        reconciliations,
        legacyMappingsCount: legacyMappings.length,
        legacyMappingsPreview: legacyMappings.slice(0, 50)
      });
    } catch (err) {
      next(err);
    }
  }

  public static async executeMigrationStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const stageNumber = Number(req.params.stageNumber);
      const { records, reconciliationMeta } = req.body;

      if (!records || !Array.isArray(records)) {
        throw new AppError('Array de registros da etapa (records) é obrigatório.', 400);
      }

      const project = await MigrationService.executeStage(
        id,
        stageNumber,
        records,
        reconciliationMeta
      );

      res.json({
        success: true,
        message: `Etapa #${stageNumber} executada com sucesso.`,
        project
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMigrationReconciliations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const reconciliations = await ReconciliationService.getReconciliations(id);
      res.json({ success: true, items: reconciliations });
    } catch (err) {
      next(err);
    }
  }

  public static async getLegacyIdMappings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { entityType } = req.query;
      const mappings = await LegacyIdService.getMappingsForProject(id, entityType ? String(entityType) : undefined);
      res.json({ success: true, total: mappings.length, items: mappings });
    } catch (err) {
      next(err);
    }
  }

  // ==================== SAVED MAPPINGS ====================

  public static async listAllMappings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { importType } = req.query;
      const mappings = await MappingService.listMappings(importType as any);
      res.json({ success: true, total: mappings.length, items: mappings });
    } catch (err) {
      next(err);
    }
  }

  public static async createSavedMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, importType, fields, partnerName, producerId } = req.body;
      if (!name || !importType || !fields) {
        throw new AppError('Nome, tipo de importação e campos são obrigatórios.', 400);
      }
      const mapping = await MappingService.saveMapping(name, importType, fields, partnerName, producerId);
      res.status(201).json({ success: true, message: 'Mapeamento salvo com sucesso.', mapping });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSavedMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await MappingService.deleteMapping(id);
      res.json({ success: true, message: 'Mapeamento excluído com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // ==================== DUPLICATES & MERGES ====================

  public static async listDuplicates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resolved } = req.query;
      const isResolved = resolved !== undefined ? resolved === 'true' : undefined;
      const items = await ImportRepository.listAllDuplicates(isResolved);
      res.json({ success: true, total: items.length, items });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveDuplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const { action } = req.body;
      if (!action) throw new AppError('Ação de resolução é obrigatória.', 400);
      const updated = await ImportRepository.resolveDuplicate(id, action as DuplicateStrategy, user.id);
      res.json({ success: true, message: 'Duplicidade resolvida com sucesso.', duplicate: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async listMergePlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const list = await prisma.mergePlanModel.findMany({
        where: status ? { status: String(status) } : undefined
      });
      const items = list.map((raw: any) => ({
        id: raw.id,
        entityType: raw.entityType,
        primaryId: raw.primaryId,
        duplicateId: raw.duplicateId,
        primaryData: typeof raw.primaryData === 'string' ? JSON.parse(raw.primaryData) : raw.primaryData,
        duplicateData: typeof raw.duplicateData === 'string' ? JSON.parse(raw.duplicateData) : raw.duplicateData,
        mergedData: typeof raw.mergedData === 'string' ? JSON.parse(raw.mergedData) : raw.mergedData,
        reassignedRelations: typeof raw.reassignedRelations === 'string' ? JSON.parse(raw.reassignedRelations) : raw.reassignedRelations,
        requiresApproval: raw.requiresApproval,
        status: raw.status,
        createdAt: raw.createdAt.toISOString ? raw.createdAt.toISOString() : raw.createdAt
      }));
      res.json({ success: true, total: items.length, items });
    } catch (err) {
      next(err);
    }
  }

  public static async createMergePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, primaryId, duplicateId } = req.body;
      if (!entityType || !primaryId || !duplicateId) {
        throw new AppError('Tipo de entidade, primaryId e duplicateId são obrigatórios.', 400);
      }
      const plan = await MergePlanService.createPlan(entityType, primaryId, duplicateId);
      res.status(201).json({ success: true, message: 'Plano de mesclagem criado com sucesso.', plan });
    } catch (err) {
      next(err);
    }
  }

  public static async executeMergePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const plan = await MergeService.executeMerge(id, user.id);
      res.json({ success: true, message: 'Mesclagem de entidades executada com sucesso.', plan });
    } catch (err) {
      next(err);
    }
  }
}

