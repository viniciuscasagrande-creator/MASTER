import assert from 'assert';
import { CsvParser } from '../src/data-management/parsers/csv.parser';
import { XlsxParser } from '../src/data-management/parsers/xlsx.parser';
import { TransformationService } from '../src/data-management/mapping/transformation.service';
import { MappingSuggestionService } from '../src/data-management/mapping/mapping-suggestion.service';
import { ImportTypeRegistry } from '../src/data-management/imports/import.registry';
import { SchemaValidatorService } from '../src/data-management/validation/schema-validator.service';
import { DomainValidatorService } from '../src/data-management/validation/domain-validator.service';
import { ValidationReportService } from '../src/data-management/validation/validation-report.service';
import { DuplicateDetectorService } from '../src/data-management/duplicates/duplicate-detector.service';
import { MergePlanService } from '../src/data-management/duplicates/merge-plan.service';
import { MergeService } from '../src/data-management/duplicates/merge.service';
import { QualityRuleRegistry } from '../src/data-management/quality/quality-rule.registry';
import { QualityScanService } from '../src/data-management/quality/quality-scan.service';
import { DataQualityService } from '../src/data-management/quality/data-quality.service';
import { LegacyIdService } from '../src/data-management/migration/legacy-id.service';
import { ReconciliationService } from '../src/data-management/migration/reconciliation.service';
import { MigrationService } from '../src/data-management/migration/migration.service';
import { RollbackEligibilityService } from '../src/data-management/rollback/rollback-eligibility.service';
import { CompensationService } from '../src/data-management/rollback/compensation.service';
import { ImportService } from '../src/data-management/imports/import.service';
import { ImportRepository } from '../src/data-management/imports/import.repository';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('=== INICIANDO BATERIA DE TESTES: FASE 1.1.5.15 — CENTRAL DE DADOS ===');

  // Test 1: CSV Parser Delimiter Detection & Formula Injection Neutralization
  console.log('Test 1: CSV Parser Delimiter & Formula Injection...');
  const csvContent = 'Nome;CPF;Formula\nJoão;12345678909;=cmd|"/C calc"!A0\nMaria;98765432100;+123456';
  const parsedCsv = CsvParser.parse(csvContent);
  assert.strictEqual(parsedCsv.headers.length, 3);
  assert.strictEqual(parsedCsv.rows.length, 2);
  // Neutralized formula must start with quote '
  assert.ok(parsedCsv.rows[0].Formula.startsWith("'"));
  assert.ok(parsedCsv.rows[1].Formula.startsWith("'"));
  console.log('✓ Test 1 passou!');

  // Test 2: XLSX Parser Anti-Formula Neutralization
  console.log('Test 2: XLSX Parser...');
  const mockXml = `<Row><Data>Nome</Data><Data>Documento</Data></Row><Row><Data>@SUM(1,2)</Data><Data>11122233344</Data></Row>`;
  const parsedXlsx = XlsxParser.parse(mockXml);
  assert.strictEqual(parsedXlsx.headers.length, 2);
  assert.strictEqual(parsedXlsx.rows.length, 1);
  assert.ok(parsedXlsx.rows[0].Nome.startsWith("'"));
  console.log('✓ Test 2 passou!');

  // Test 3: Transformation Service (pt-BR and non-eval)
  console.log('Test 3: Transformation Service...');
  assert.strictEqual(TransformationService.transform('  teste@email.com  ', 'TRIM'), 'teste@email.com');
  assert.strictEqual(TransformationService.transform('41999887766', 'NORMALIZE_PHONE'), '5541999887766');
  assert.strictEqual(TransformationService.transform('123.456.789-09', 'NORMALIZE_DOCUMENT'), '12345678909');
  assert.strictEqual(TransformationService.transform('R$ 1.250,50', 'PARSE_CURRENCY'), 1250.5);
  assert.strictEqual(TransformationService.transform('25/12/2026', 'PARSE_DATE'), new Date(Date.UTC(2026, 11, 25)).toISOString());
  assert.strictEqual(TransformationService.transform('ativo', 'MAP_ENUM', { ativo: 'ACTIVE', inativo: 'INACTIVE' }), 'ACTIVE');
  console.log('✓ Test 3 passou!');

  // Test 4: Mapping Suggestions for Columns
  console.log('Test 4: Auto-mapping Suggestions...');
  const customerDef = ImportTypeRegistry.get('CUSTOMERS')!;
  assert.ok(customerDef, 'Definição de CUSTOMERS deve existir');
  const headers = ['Nome do Cliente', 'cpf_cliente', 'E-mail', 'desconhecido'];
  const suggestions = MappingSuggestionService.suggestMappings(headers, customerDef.columns);
  assert.strictEqual(suggestions[0].targetColumn, 'name');
  assert.strictEqual(suggestions[1].targetColumn, 'cpf');
  assert.strictEqual(suggestions[2].targetColumn, 'email');
  assert.strictEqual(suggestions[3].status, 'UNMAPPED');
  console.log('✓ Test 4 passou!');

  // Test 5: Schema Validation (Mod11 CPF and Protected Fields)
  console.log('Test 5: Schema Validation & Protected Fields...');
  // Valid CPF: 52998224725
  const validRow = { name: 'Carlos Santos', cpf: '52998224725', email: 'carlos@teste.com' };
  const valResult = SchemaValidatorService.validateRow('imp-1', validRow, 1, customerDef, [
    { fileColumn: 'name', targetColumn: 'name', transformation: 'TRIM' },
    { fileColumn: 'cpf', targetColumn: 'cpf', transformation: 'NORMALIZE_DOCUMENT' },
    { fileColumn: 'email', targetColumn: 'email', transformation: 'TRIM' }
  ]);
  assert.strictEqual(valResult.errors.length, 0);

  // Invalid CPF
  const invalidRow = { name: 'Carlos Santos', cpf: '11111111111', email: 'carlos@teste.com' };
  const invalidResult = SchemaValidatorService.validateRow('imp-1', invalidRow, 2, customerDef, [
    { fileColumn: 'name', targetColumn: 'name', transformation: 'TRIM' },
    { fileColumn: 'cpf', targetColumn: 'cpf', transformation: 'NORMALIZE_DOCUMENT' },
    { fileColumn: 'email', targetColumn: 'email', transformation: 'TRIM' }
  ]);
  assert.ok(invalidResult.errors.some(e => e.ruleCode === 'cpf.invalid_cpf'));

  // Protected Field injection attempt
  const protectedInjectRow = { name: 'Carlos', cpf: '52998224725', balance: '999999' };
  const protectedResult = SchemaValidatorService.validateRow('imp-1', protectedInjectRow, 3, customerDef, [
    { fileColumn: 'name', targetColumn: 'name', transformation: 'TRIM' },
    { fileColumn: 'cpf', targetColumn: 'cpf', transformation: 'NORMALIZE_DOCUMENT' },
    { fileColumn: 'balance', targetColumn: 'balance', transformation: 'TRIM' }
  ]);
  assert.ok(protectedResult.errors.some(e => e.ruleCode === 'field.protected'));
  console.log('✓ Test 5 passou!');

  // Test 6: Domain Validation (Context immunity & Scope Mismatch)
  console.log('Test 6: Multi-tenant Scope Validation...');
  const domainMismatchErrors = await DomainValidatorService.validateDomain(
    'imp-1',
    1,
    { producerId: 'outro_produtor_hacker', amount: 100 },
    customerDef,
    { producerId: 'prod_autorizado_123' }
  );
  assert.ok(domainMismatchErrors.some(e => e.ruleCode === 'scope.producer_mismatch'));
  console.log('✓ Test 6 passou!');

  // Test 7: Validation Report Brazilian CSV Export
  console.log('Test 7: Brazilian Error CSV Generation (UTF-8 BOM)...');
  const errorCsv = ValidationReportService.generateErrorExportCsv([
    {
      id: 'err-1',
      importId: 'imp-1',
      rowNumber: 2,
      columnName: 'CPF',
      cellValue: '11111111111',
      severity: 'BLOCKING',
      ruleCode: 'cpf.invalid_checksum',
      message: 'CPF com checksum incorreto',
      suggestedFix: 'Revisar dígito verificador'
    }
  ]);
  assert.ok(errorCsv.startsWith('\uFEFF'));
  assert.ok(errorCsv.includes('Linha;Campo;Valor Informado;Severidade'));
  assert.ok(errorCsv.includes('11111111111'));
  console.log('✓ Test 7 passou!');

  // Test 8: Duplicate Detector & Merge Plan Creation
  console.log('Test 8: Duplicate Detector & Merge Plan...');
  // Seed customer into in-memory store
  await prisma.customer.create({
    data: {
      id: 'cust-existing-1',
      name: 'Maria Antônia',
      document: '52998224725',
      email: 'maria@antonia.com',
      createdAt: new Date()
    }
  });

  const dupRows = [
    { rowNumber: 1, data: { name: 'Maria A. Silva', cpf: '529.982.247-25', email: 'maria2@antonia.com' } }
  ];
  const detectedDups = await DuplicateDetectorService.detectDuplicates(
    'imp-1',
    dupRows,
    customerDef,
    'MANUAL_DECISION'
  );
  assert.strictEqual(detectedDups.length, 1);
  assert.strictEqual(detectedDups[0].matchField, 'cpf');

  const plan = await MergePlanService.createPlan('CUSTOMERS', 'cust-existing-1', 'cust-new-fake');
  assert.strictEqual(plan.primaryId, 'cust-existing-1');
  assert.strictEqual(plan.duplicateId, 'cust-new-fake');
  console.log('✓ Test 8 passou!');

  // Test 9: Quality Rules & Scans (6 Dimensions)
  console.log('Test 9: Quality Rules & Scans...');
  const rules = QualityRuleRegistry.getAll();
  assert.ok(rules.length >= 8);
  assert.ok(rules.some(r => r.dimension === 'COMPLETENESS'));
  assert.ok(rules.some(r => r.dimension === 'VALIDITY'));
  assert.ok(rules.some(r => r.dimension === 'UNIQUENESS'));
  assert.ok(rules.some(r => r.dimension === 'CONSISTENCY'));
  assert.ok(rules.some(r => r.dimension === 'TIMELINESS'));
  assert.ok(rules.some(r => r.dimension === 'REFERENTIAL_INTEGRITY'));

  // Run on-demand quality scan
  const scanResult = await QualityScanService.runScan();
  assert.ok(scanResult.scannedRulesCount > 0);

  const stats = await DataQualityService.getStats();
  assert.ok(stats.totalRecordsAudited > 0);
  assert.ok(stats.domainHealth.CUSTOMERS !== undefined);
  console.log('✓ Test 9 passou!');

  // Test 10: Migration DAG Execution & Legacy IDs
  console.log('Test 10: Migration DAG & Legacy IDs...');
  const migrationProject = await MigrationService.createProject(
    'Migração Ingresse/Sympla',
    'Importação histórica completa',
    'SYMPLA_LEGACY'
  );
  assert.strictEqual(migrationProject.status, 'PLANNING');
  assert.strictEqual(migrationProject.stages.length, 5);

  // Executing stage 1 (SUPPLIERS)
  const updatedProj = await MigrationService.executeStage(
    migrationProject.id,
    1,
    [{ legacyId: 'sympla_prod_99', data: { name: 'Produtora Alpha', document: '11222333000199' } }],
    { sourceCount: 1 }
  );
  assert.strictEqual(updatedProj.stages[0].status, 'COMPLETED');

  // Verify Legacy ID mapping
  const resolvedNewId = await LegacyIdService.resolveNewId(migrationProject.id, 'SUPPLIERS', 'sympla_prod_99');
  assert.ok(resolvedNewId, 'Legacy ID deve mapear para novo ID interno');

  // Dependency constraint: stage 4 (LEGACY_ORDERS) cannot run before stage 2 & 3
  try {
    await MigrationService.executeStage(migrationProject.id, 4, []);
    assert.fail('Deveria ter bloqueado execução de etapa com dependência não concluída');
  } catch (err: any) {
    assert.ok(err.message.includes('Dependência não satisfeita'));
  }
  console.log('✓ Test 10 passou!');

  // Test 11: Reconciliation Service
  console.log('Test 11: Migration Reconciliation...');
  const reconciliation = await ReconciliationService.reconcile({
    migrationId: migrationProject.id,
    entityType: 'LEGACY_ORDERS',
    sourceCount: 2,
    sourceSum: 500.0,
    sumFieldName: 'totalAmount',
    targetEntityRecords: [
      { id: 'rec-1', totalAmount: 250.0 },
      { id: 'rec-2', totalAmount: 250.0 }
    ]
  });
  assert.strictEqual(reconciliation.countMatched, true);
  assert.strictEqual(reconciliation.sumMatched, true);
  assert.strictEqual(reconciliation.destSum, 500.0);
  console.log('✓ Test 11 passou!');

  // Test 12: Rollback Eligibility & Compensation
  console.log('Test 12: Rollback Eligibility & Compensation...');
  const dummyImport = await ImportRepository.create({
    code: 'IMP-2026-TEST',
    importType: 'CUSTOMERS',
    documentId: 'doc-1',
    fileName: 'teste.csv',
    fileSize: 1024,
    fileFormat: 'CSV',
    fileChecksum: 'abc123',
    creatorUserId: 'usr-1',
    creatorUserName: 'Testador',
    duplicateStrategy: 'IGNORE',
    atomicityPolicy: 'ALL_OR_NOTHING'
  });

  await ImportRepository.updateStatus(dummyImport.id, 'COMPLETED');
  const eligibility = await RollbackEligibilityService.checkEligibility(dummyImport.id);
  assert.strictEqual(eligibility.eligible, true);

  // Execute physical rollback
  const rollbackRes = await CompensationService.executeRollbackOrCompensation(dummyImport.id, 'usr-1');
  assert.strictEqual(rollbackRes.actionTaken, 'PHYSICAL_ROLLBACK');

  const afterRollback = await ImportRepository.findById(dummyImport.id);
  assert.strictEqual(afterRollback?.status, 'ROLLED_BACK');
  console.log('✓ Test 12 passou!');

  // Test 13: End-to-End Import Service Workflow
  console.log('Test 13: End-to-End Import Workflow...');
  const csvBuffer = Buffer.from(
    'Nome;CPF;E-mail\nLucas Pereira;52998224725;lucas@teste.com\nAna Beatriz;01234567890;ana@teste.com',
    'utf-8'
  );

  const initResult = await ImportService.createImportRequest({
    importType: 'CUSTOMERS',
    fileName: 'clientes_novos.csv',
    fileBuffer: csvBuffer,
    creatorUserId: 'usr-1',
    creatorUserName: 'Admin Teste',
    atomicityPolicy: 'PARTIAL',
    duplicateStrategy: 'UPDATE'
  });
  assert.strictEqual(initResult.request.status, 'DRAFT');
  assert.strictEqual(initResult.headers.length, 3);

  // Validate
  const valSummary = await ImportService.validateImport(initResult.request.id);
  assert.ok(valSummary.summary.totalRows >= 2);

  // Confirm
  const confirmResult = await ImportService.confirmImport(initResult.request.id);
  assert.strictEqual(confirmResult.request.status, 'QUEUED');

  // Cancel check
  const cancelImp = await ImportRepository.create({
    code: 'IMP-2026-CANCEL',
    importType: 'CUSTOMERS',
    documentId: 'doc-2',
    fileName: 'cancel.csv',
    fileSize: 500,
    fileFormat: 'CSV',
    fileChecksum: 'def456',
    creatorUserId: 'usr-1',
    creatorUserName: 'Admin',
    duplicateStrategy: 'IGNORE',
    atomicityPolicy: 'ALL_OR_NOTHING'
  });
  const cancelled = await ImportService.cancelImport(cancelImp.id, 'usr-1');
  assert.strictEqual(cancelled.status, 'CANCELLED');

  // Templates
  const templates = ImportService.getTemplates();
  assert.ok(templates.length >= 8);
  const templateCsv = ImportService.generateTemplateContent('CUSTOMERS');
  assert.ok(templateCsv.startsWith('\uFEFF'));
  assert.ok(templateCsv.includes('Nome do Cliente'));
  console.log('✓ Test 13 passou!');

  console.log('\n======================================================');
  console.log('TODOS OS 13 TESTES DA FASE 1.1.5.15 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Falha nos testes de Data Management:', err);
  process.exit(1);
});
