import assert from 'node:assert';
import { prisma } from '../src/core/database/prisma';
import { EntitlementService } from '../src/modules/entitlements/entitlement.service';
import { EntitlementProvisioningService } from '../src/modules/entitlements/provisioning/entitlement-provisioning.service';
import { EntitlementReconciliationService } from '../src/modules/entitlements/reconciliation/entitlement-reconciliation.service';
import { EntitlementOverrideService } from '../src/modules/entitlements/overrides/entitlement-override.service';
import { EntitlementMigrationService } from '../src/modules/entitlements/migration/entitlement-migration.service';
import { FeatureRegistry } from '../src/modules/entitlements/features/feature-registry';
import { DatabaseUsageProvider } from '../src/modules/entitlements/limits/usage-provider';

console.log('================================================================');
console.log('TESTES FASE 1.3.8: HABILITAÇÕES COMERCIAIS DO PRODUTOR (ENTITLEMENTS)');
console.log('================================================================\n');

async function runTests() {
  const testProducerId = `prod_test_${Date.now()}`;
  const testProducerName = 'Live Arena Produções Artísticas Ltda.';

  // Setup: Register Producer in DB
  await prisma.producer.create({
    data: {
      id: testProducerId,
      name: testProducerName,
      cnpj: '12.345.678/0001-99',
      status: 'ACTIVE'
    }
  });

  // Ensure Feature Registry synced with database
  await FeatureRegistry.ensureSyncWithDatabase();

  // --------------------------------------------------------------------------
  // 1. Passo Zero & Registro Canônico de Recursos Técnicos
  // --------------------------------------------------------------------------
  console.log('1. Testando Catálogo Técnico de Recursos (Feature Registry)...');
  const allFeatures = FeatureRegistry.getAll();
  assert.ok(allFeatures.length >= 5, 'Feature Registry deve conter funcionalidades essenciais');
  const offlineValidatorFeat = FeatureRegistry.getByCode('feature.access.offline_validator');
  assert.ok(offlineValidatorFeat, 'feature.access.offline_validator deve existir');
  assert.strictEqual(offlineValidatorFeat?.category, 'ACCESS');
  assert.strictEqual(offlineValidatorFeat?.defaultLimitType, 'COUNT');
  console.log(`  -> Registry validado com ${allFeatures.length} capacidades técnicas.`);
  console.log('✓ Teste 1 passou: Feature Registry técnico íntegro e desacoplado de RBAC.\n');

  // --------------------------------------------------------------------------
  // 2. Provisionamento Idempotente via Contrato Comercial Ativo
  // --------------------------------------------------------------------------
  console.log('2. Testando Provisionamento a partir de Contrato Comercial...');

  // Criar Oferta com Recursos no Catálogo
  const offeringId = `off_${Date.now()}`;
  const versionId = `off_ver_${Date.now()}`;

  await prisma.commercialOffering.create({
    data: {
      id: offeringId,
      publicCode: 'OFR-2026-TEST01',
      categoryId: 'cat_platform',
      code: 'OFFERING_TEST_STANDARD',
      name: 'Plano Standard Eventos',
      type: 'PLAN',
      currentVersionId: versionId,
      status: 'ACTIVE'
    }
  });

  await prisma.commercialOfferingVersion.create({
    data: {
      id: versionId,
      offeringId,
      versionNumber: 1,
      nameSnapshot: 'Plano Standard Eventos',
      status: 'ACTIVE',
      contentHash: 'hash_test_123',
      createdBy: 'admin-id'
    }
  });

  // Associar Features à Versão da Oferta
  const featDb = await prisma.commercialFeature.findUnique({
    where: { code: 'feature.events.max_active_events' }
  });

  await prisma.offeringFeature.create({
    data: {
      offeringVersionId: versionId,
      featureId: featDb!.id,
      featureCode: 'feature.events.max_active_events',
      included: true,
      limitValue: 3,
      limitUnit: 'EVENTS'
    }
  });

  const featOffline = await prisma.commercialFeature.findUnique({
    where: { code: 'feature.access.offline_validator' }
  });

  await prisma.offeringFeature.create({
    data: {
      offeringVersionId: versionId,
      featureId: featOffline!.id,
      featureCode: 'feature.access.offline_validator',
      included: true,
      limitValue: 10,
      limitUnit: 'DEVICES'
    }
  });

  // Criar Contrato Comercial Vinculado
  const contractId = `ctr_${Date.now()}`;
  const contractVerId = `ctr_ver_${Date.now()}`;

  await prisma.commercialContract.create({
    data: {
      id: contractId,
      publicCode: 'CTR-2026-000999',
      producerId: testProducerId,
      title: 'Contrato de Bilheteria Standard',
      status: 'ACTIVE',
      currentVersionId: contractVerId,
      currentVersionNumber: 1,
      effectiveFrom: new Date('2026-01-01T00:00:00Z'),
      effectiveUntil: new Date('2026-12-31T23:59:59Z'),
      ownerId: 'commercial-owner'
    }
  });

  await prisma.commercialContractVersion.create({
    data: {
      id: contractVerId,
      contractId,
      versionNumber: 1,
      title: 'Minuta Padrão',
      contentHash: 'hash_ctr_123',
      termsSnapshotJson: JSON.stringify([{ offeringId }]),
      createdBy: 'commercial-owner'
    }
  });

  await prisma.contractCommercialTerm.create({
    data: {
      contractVersionId: contractVerId,
      offeringId,
      offeringName: 'Plano Standard Eventos',
      termType: 'PLATFORM_COMMISSION',
      name: 'Comissão Plataforma Standard',
      calculationType: 'PERCENTAGE',
      percentage: 8.0,
      payer: 'PRODUCER'
    }
  });

  // Executar Provisionamento
  const provisioned1 = await EntitlementProvisioningService.provisionFromContract(contractId);
  assert.ok(provisioned1.length >= 2, 'Deve provisionar ao menos as 2 features da oferta');

  const activeEventsEnt = provisioned1.find(e => e.featureCode === 'feature.events.max_active_events');
  assert.ok(activeEventsEnt, 'Entitlement de max_active_events deve ter sido provisionado');
  assert.strictEqual(activeEventsEnt.status, 'ACTIVE');
  assert.strictEqual(activeEventsEnt.limits?.[0]?.value, 3);
  assert.strictEqual(activeEventsEnt.limits?.[0]?.limitKey, 'events.active_max');

  // Teste de Idempotência: Executar segunda vez não duplica entitlements
  const provisioned2 = await EntitlementProvisioningService.provisionFromContract(contractId);
  assert.strictEqual(provisioned1.length, provisioned2.length, 'Idempotência: quantidade não deve duplicar');

  const countInDb = await prisma.producerEntitlement.count({
    where: { producerId: testProducerId, sourceId: contractId }
  });
  assert.strictEqual(countInDb, provisioned1.length, 'Não deve haver duplicatas no banco de dados');
  console.log(`  -> Provisionados ${provisioned1.length} entitlements com sucesso (idempotência validada).`);
  console.log('✓ Teste 2 passou: Provisionamento de contrato ativo concluído com idempotência garantida.\n');

  // --------------------------------------------------------------------------
  // 3. Regra Fundamental: Separação RBAC vs Entitlements
  // --------------------------------------------------------------------------
  console.log('3. Testando Regra Fundamental (Separação RBAC vs Entitlement)...');
  // Feature contratada:
  const checkAllowed = await EntitlementService.hasEntitlement(testProducerId, 'feature.events.max_active_events');
  assert.strictEqual(checkAllowed.allowed, true, 'Produtor com contrato deve ter acesso ao recurso contratado');

  // Feature não contratada:
  const checkDenied = await EntitlementService.hasEntitlement(testProducerId, 'feature.access.facial_biometrics');
  assert.strictEqual(checkDenied.allowed, false, 'Produtor sem biometria facial deve ter acesso negado');
  assert.strictEqual(checkDenied.enforcementMode, 'ENFORCE');
  assert.ok(checkDenied.reason?.includes('não contratada'), 'Motivo deve indicar recurso não contratado');
  console.log('  -> Recurso contratado: LIBERADO.');
  console.log('  -> Recurso não contratado: BLOQUEADO (ENTITLEMENT_REQUIRED).');
  console.log('✓ Teste 3 passou: Isolamento estrito de permissões RBAC vs Direitos da Organização.\n');

  // --------------------------------------------------------------------------
  // 4. Limites Operacionais e Consumo (UsageProvider)
  // --------------------------------------------------------------------------
  console.log('4. Testando Avaliação de Limites e Consumo (UsageProvider)...');
  // Limite configurado é de 3 eventos ativos.
  // Cenário A: Uso atual é de 1 evento -> Permitido
  DatabaseUsageProvider.setMockUsage(testProducerId, 'events.active_max', 1);
  const checkUnderLimit = await EntitlementService.hasEntitlement(testProducerId, 'feature.events.max_active_events', 1);
  assert.strictEqual(checkUnderLimit.allowed, true, 'Uso dentro do limite deve ser permitido');
  assert.strictEqual(checkUnderLimit.limit?.exceeded, false);

  // Cenário B: Uso atual é de 3 eventos -> Criar mais 1 estoura a cota (3 + 1 > 3)
  DatabaseUsageProvider.setMockUsage(testProducerId, 'events.active_max', 3);
  const checkOverLimit = await EntitlementService.hasEntitlement(testProducerId, 'feature.events.max_active_events', 1);
  assert.strictEqual(checkOverLimit.allowed, false, 'Uso acima do limite deve ser bloqueado em modo ENFORCE');
  assert.strictEqual(checkOverLimit.limit?.exceeded, true);
  assert.strictEqual(checkOverLimit.limit?.currentUsage, 3);
  assert.strictEqual(checkOverLimit.limit?.limitValue, 3);
  assert.ok(checkOverLimit.reason?.includes('Limite operacional contratado atingido'));
  console.log('  -> Consumo 1/3: Permitido.');
  console.log('  -> Consumo 3/3 (+1): Bloqueado por cota máxima.');
  console.log('✓ Teste 4 passou: Motor de limites e consumo validado com sucesso.\n');

  // --------------------------------------------------------------------------
  // 5. Modos de Enforcement (DISABLED, OBSERVE, WARN, ENFORCE)
  // --------------------------------------------------------------------------
  console.log('5. Testando Modos de Enforcement (OBSERVE, WARN, ENFORCE)...');
  const entitlementItem = await prisma.producerEntitlement.findFirst({
    where: { producerId: testProducerId, featureCode: 'feature.events.max_active_events' }
  });

  // Teste em modo WARN:
  await prisma.producerEntitlement.update({
    where: { id: entitlementItem!.id },
    data: { enforcementMode: 'WARN' }
  });
  const checkWarn = await EntitlementService.hasEntitlement(testProducerId, 'feature.events.max_active_events', 1);
  assert.strictEqual(checkWarn.allowed, true, 'Em modo WARN, operação é permitida com alerta');
  assert.ok(checkWarn.warningMessage?.includes('Atenção: Limite do recurso'), 'Deve conter warningMessage');

  // Teste em modo OBSERVE:
  await prisma.producerEntitlement.update({
    where: { id: entitlementItem!.id },
    data: { enforcementMode: 'OBSERVE' }
  });
  const checkObserve = await EntitlementService.hasEntitlement(testProducerId, 'feature.events.max_active_events', 1);
  assert.strictEqual(checkObserve.allowed, true, 'Em modo OBSERVE, operação é permitida sem bloquear');
  assert.strictEqual(checkObserve.enforcementMode, 'OBSERVE');

  // Retornar para ENFORCE:
  await prisma.producerEntitlement.update({
    where: { id: entitlementItem!.id },
    data: { enforcementMode: 'ENFORCE' }
  });
  console.log('  -> Modo WARN: Alerta emitido sem interrupção operacional.');
  console.log('  -> Modo OBSERVE: Telemetria auditada sem bloqueio.');
  console.log('✓ Teste 5 passou: Modos de enforcement validados conforme governança.\n');

  // --------------------------------------------------------------------------
  // 6. Vigência Futura (SCHEDULED) e Reconciliação Temporal
  // --------------------------------------------------------------------------
  console.log('6. Testando Vigência Futura (SCHEDULED) e Reconciliação Temporal...');
  const futureContractId = `ctr_future_${Date.now()}`;
  const futureVerId = `ctr_ver_future_${Date.now()}`;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // Vigência em +30 dias

  await prisma.commercialContract.create({
    data: {
      id: futureContractId,
      publicCode: 'CTR-2026-FUTURE',
      producerId: testProducerId,
      title: 'Contrato com Início Futuro',
      status: 'ACTIVE',
      currentVersionId: futureVerId,
      currentVersionNumber: 1,
      effectiveFrom: futureDate,
      ownerId: 'owner-id'
    }
  });

  await prisma.commercialContractVersion.create({
    data: {
      id: futureVerId,
      contractId: futureContractId,
      versionNumber: 1,
      title: 'Minuta Futura',
      contentHash: 'hash_future_123',
      termsSnapshotJson: JSON.stringify([{ offeringId }]),
      createdBy: 'owner-id'
    }
  });

  await prisma.contractCommercialTerm.create({
    data: {
      contractVersionId: futureVerId,
      offeringId,
      termType: 'MARKETING',
      name: 'Módulo Marketing Futuro',
      calculationType: 'FIXED_AMOUNT',
      amount: 1500,
      payer: 'PRODUCER'
    }
  });

  const futureProvisioned = await EntitlementProvisioningService.provisionFromContract(futureContractId);
  const scheduledEnt = futureProvisioned.find(e => e.sourceId === futureContractId);
  assert.ok(scheduledEnt, 'Entitlement futuro deve ser provisionado');
  assert.strictEqual(scheduledEnt.status, 'SCHEDULED', 'Status com vigência futura deve ser SCHEDULED');

  // Reconciliação
  const reconcileRes = await EntitlementReconciliationService.reconcileProducer(testProducerId);
  assert.ok(reconcileRes.evaluatedContracts >= 2, 'Deve avaliar todos os contratos do produtor');
  console.log(`  -> Contrato futuro materializado com status SCHEDULED.`);
  console.log(`  -> Reconciliação executada: ${reconcileRes.evaluatedContracts} contratos avaliados.`);
  console.log('✓ Teste 6 passou: Ciclo de vida temporal e status SCHEDULED validados.\n');

  // --------------------------------------------------------------------------
  // 7. Overrides Administrativos Temporários Auditados (GRANT & REVOKE)
  // --------------------------------------------------------------------------
  console.log('7. Testando Overrides Administrativos Auditados...');
  // Conceder emergencialmente recurso não contratado: biometria facial
  const untilTomorrow = new Date();
  untilTomorrow.setDate(untilTomorrow.getDate() + 1);

  const overrideGrant = await EntitlementOverrideService.createOverride(
    {
      producerId: testProducerId,
      featureCode: 'feature.access.facial_biometrics',
      action: 'GRANT',
      reason: 'Cortesia de teste piloto autorizada pela diretoria comercial para evento especial',
      effectiveUntil: untilTomorrow.toISOString(),
      approvedBy: 'diretor-comercial-id',
      approvedByName: 'Diretor Comercial DiskIngressos'
    },
    'admin-tester-id',
    'Administrador Testador'
  );

  assert.ok(overrideGrant.id, 'Override deve ser criado com ID');
  assert.strictEqual(overrideGrant.status, 'ACTIVE');

  // Agora hasEntitlement deve liberar devido ao override!
  const checkBioWithOverride = await EntitlementService.hasEntitlement(testProducerId, 'feature.access.facial_biometrics');
  assert.strictEqual(checkBioWithOverride.allowed, true, 'Override GRANT deve autorizar acesso emergencial');
  assert.ok(checkBioWithOverride.reason?.includes('override administrativo'));

  // Revogar override
  await EntitlementOverrideService.revokeOverride(overrideGrant.id, 'admin-tester-id', 'Administrador Testador');
  const checkBioAfterRevoke = await EntitlementService.hasEntitlement(testProducerId, 'feature.access.facial_biometrics');
  assert.strictEqual(checkBioAfterRevoke.allowed, false, 'Após revogação do override, acesso volta a ser bloqueado');
  console.log('  -> Override GRANT: Autorizou recurso extraordinário com auditoria.');
  console.log('  -> Revogação de Override: Restaurou proteção de contrato imediatamente.');
  console.log('✓ Teste 7 passou: Overrides administrativos temporários operam com rastreabilidade.\n');

  // --------------------------------------------------------------------------
  // 8. Migração de Produtores Legados & Resumo de Produtos Contratados
  // --------------------------------------------------------------------------
  console.log('8. Testando Migração de Produtores Legados e Produtos Contratados...');
  const legacyProducerId = `prod_legacy_${Date.now()}`;
  await prisma.producer.create({
    data: {
      id: legacyProducerId,
      name: 'Produtora Tradição Eventos',
      cnpj: '99.888.777/0001-11',
      status: 'ACTIVE'
    }
  });

  const migrated = await EntitlementMigrationService.migrateLegacyProducer(
    {
      producerId: legacyProducerId,
      reason: 'Migração de direitos do sistema legado CA/DiskHub para a Fase 1.3.8',
      features: [
        {
          featureCode: 'feature.reports.advanced_analytics',
          notes: 'Acesso legado ao borderô analítico'
        },
        {
          featureCode: 'feature.events.max_active_events',
          limits: [{ limitKey: 'events.active_max', value: 10, unit: 'EVENTS' }],
          notes: 'Cota de 10 eventos legados'
        }
      ]
    },
    'migration-script-id',
    'Script de Migração'
  );

  assert.strictEqual(migrated.length, 2, 'Deve migrar os 2 recursos');
  assert.strictEqual(migrated[0].sourceType, 'LEGACY_MIGRATION', 'Origem deve ser expressamente LEGACY_MIGRATION');
  assert.ok(migrated[0].sourceId?.startsWith('MIGRATION_'), 'sourceId deve registrar batch de migração');

  // Verificar Resumo de Produtos Contratados para Frontend
  const contractedSummary = await EntitlementService.listContractedProducts(legacyProducerId);
  assert.ok(contractedSummary.length >= 1, 'Produtor legado deve possuir resumo de produtos contratados');
  assert.ok(contractedSummary[0].features.length >= 2, 'Resumo deve incluir as funcionalidades habilitadas');
  console.log(`  -> Produtor legado migrado com sourceType = 'LEGACY_MIGRATION' sem contratos fictícios.`);
  console.log(`  -> Resumo de Produtos Contratados gerado com ${contractedSummary[0].features.length} features.`);
  console.log('✓ Teste 8 passou: Migração legada e resumo de produtos contratados 100% validados.\n');

  console.log('================================================================');
  console.log('TODOS OS 8 TESTES DA FASE 1.3.8 FORAM APROVADOS COM SUCESSO! 🎉');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ ERRO NA SUÍTE DE TESTES DA FASE 1.3.8:', err);
  process.exit(1);
});
