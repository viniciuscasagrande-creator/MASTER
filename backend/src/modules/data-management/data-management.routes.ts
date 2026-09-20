import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { DataManagementController } from './data-management.controller';

// 1. Imports Router (/data/imports)
export const importRoutes = Router();
importRoutes.use(authenticate);

importRoutes.get('/', requirePermission('dados.importacao.visualizar'), DataManagementController.listImports);
importRoutes.post('/upload', requirePermission('dados.importacao.criar'), DataManagementController.uploadAndCreate);
importRoutes.get('/:id', requirePermission('dados.importacao.visualizar'), DataManagementController.getImportById);
importRoutes.post('/:id/mapping', requirePermission('dados.importacao.mapear'), DataManagementController.saveMapping);
importRoutes.post('/:id/validate', requirePermission('dados.importacao.validar'), DataManagementController.validateImport);
importRoutes.post('/:id/confirm', requirePermission('dados.importacao.processar'), DataManagementController.confirmImport);
importRoutes.post('/:id/cancel', requirePermission('dados.importacao.cancelar'), DataManagementController.cancelImport);
importRoutes.get('/:id/errors/export', requirePermission('dados.importacao.visualizar'), DataManagementController.exportErrorReport);
importRoutes.get('/:id/rollback/eligibility', requirePermission('dados.importacao.desfazer'), DataManagementController.getRollbackEligibility);
importRoutes.post('/:id/rollback', requirePermission('dados.importacao.desfazer'), DataManagementController.executeRollback);

// 2. Templates Router (/data/import-templates)
export const templateRoutes = Router();
templateRoutes.use(authenticate);

templateRoutes.get('/', requirePermission('dados.modelos.baixar'), DataManagementController.listTemplates);
templateRoutes.get('/:type/download', requirePermission('dados.modelos.baixar'), DataManagementController.downloadTemplate);

// 3. Data Quality Router (/data-quality)
export const dataQualityRoutes = Router();
dataQualityRoutes.use(authenticate);

dataQualityRoutes.get('/rules', requirePermission('dados.qualidade.visualizar'), DataManagementController.getQualityRules);
dataQualityRoutes.patch('/rules/:code', requirePermission('dados.qualidade.gerenciar_regras'), DataManagementController.updateQualityRule);
dataQualityRoutes.get('/issues', requirePermission('dados.qualidade.visualizar'), DataManagementController.getQualityIssues);
dataQualityRoutes.patch('/issues/:id/resolve', requirePermission('dados.qualidade.resolver_problema'), DataManagementController.resolveQualityIssue);
dataQualityRoutes.patch('/issues/:id/dismiss', requirePermission('dados.qualidade.resolver_problema'), DataManagementController.dismissQualityIssue);
dataQualityRoutes.get('/stats', requirePermission('dados.qualidade.visualizar'), DataManagementController.getQualityStats);
dataQualityRoutes.post('/scan', requirePermission('dados.qualidade.executar_scan'), DataManagementController.runQualityScan);

// 4. Migration Router (/data/migrations)
export const migrationRoutes = Router();
migrationRoutes.use(authenticate);

migrationRoutes.post('/', requirePermission('dados.migracao.criar_projeto'), DataManagementController.createMigrationProject);
migrationRoutes.get('/', requirePermission('dados.migracao.visualizar'), DataManagementController.listMigrationProjects);
migrationRoutes.get('/:id', requirePermission('dados.migracao.visualizar'), DataManagementController.getMigrationProject);
migrationRoutes.post('/:id/stages/:stageNumber/execute', requirePermission('dados.migracao.executar'), DataManagementController.executeMigrationStage);
migrationRoutes.get('/:id/reconciliations', requirePermission('dados.migracao.visualizar'), DataManagementController.getMigrationReconciliations);
migrationRoutes.get('/:id/legacy-ids', requirePermission('dados.migracao.visualizar'), DataManagementController.getLegacyIdMappings);

// 5. Mappings Router (/data/mappings)
export const mappingRoutes = Router();
mappingRoutes.use(authenticate);
mappingRoutes.get('/', requirePermission('dados.importacao.mapear'), DataManagementController.listAllMappings);
mappingRoutes.post('/', requirePermission('dados.importacao.mapear'), DataManagementController.createSavedMapping);
mappingRoutes.delete('/:id', requirePermission('dados.importacao.mapear'), DataManagementController.deleteSavedMapping);

// 6. Duplicates & Merges Router (/data/duplicates)
export const duplicateRoutes = Router();
duplicateRoutes.use(authenticate);
duplicateRoutes.get('/', requirePermission('dados.duplicidades.visualizar'), DataManagementController.listDuplicates);
duplicateRoutes.post('/:id/resolve', requirePermission('dados.duplicidades.mesclar'), DataManagementController.resolveDuplicate);
duplicateRoutes.get('/merge-plans', requirePermission('dados.duplicidades.visualizar'), DataManagementController.listMergePlans);
duplicateRoutes.post('/merge-plans', requirePermission('dados.duplicidades.mesclar'), DataManagementController.createMergePlan);
duplicateRoutes.post('/merge-plans/:id/execute', requirePermission('dados.duplicidades.mesclar'), DataManagementController.executeMergePlan);

