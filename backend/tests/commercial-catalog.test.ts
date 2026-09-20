import { describe, it } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/core/database/prisma';
import { OfferingService } from '../src/modules/commercial/catalog/offerings/offering.service';
import { OfferingVersionService } from '../src/modules/commercial/catalog/versions/offering-version.service';
import { OfferingCompositionService } from '../src/modules/commercial/catalog/composition/offering-composition.service';
import { OfferingFeatureService } from '../src/modules/commercial/catalog/features/offering-feature.service';
import { DefaultTermsService } from '../src/modules/commercial/catalog/terms/default-terms.service';
import { DefaultTermsResolver } from '../src/modules/commercial/catalog/terms/default-terms.resolver';
import { CatalogImpactService } from '../src/modules/commercial/catalog/impact/catalog-impact.service';
import { commercialCatalogProvider } from '../src/modules/commercial/catalog/commercial-catalog.provider';
import { CatalogQueryService } from '../src/modules/commercial/catalog/catalog-query.service';
import { ProposalService } from '../src/modules/commercial/proposals/proposal.service';

console.log('================================================================');
console.log('TESTES FASE 1.3.7: CATÁLOGO COMERCIAL, PLANOS, PACOTES E CONDIÇÕES');
console.log('================================================================\n');

async function runTests() {
  let createdPlanId = '';
  let createdPackageId = '';
  let createdServiceId = '';
  let version1Id = '';
  let version2Id = '';

  // --------------------------------------------------------------------------
  // 1. Fonte Única da Verdade do Catálogo (Single Source of Truth)
  // --------------------------------------------------------------------------
  console.log('1. Testando Fonte Única da Verdade do Catálogo (Single Source of Truth)...');
  const metrics = await CatalogQueryService.getMetrics();
  assert.ok(metrics.totalOfferings > 0, 'O catálogo deve possuir ofertas carregadas');
  assert.ok(metrics.plansCount > 0, 'Deve possuir planos cadastrados');
  assert.ok(metrics.packagesCount > 0, 'Deve possuir pacotes cadastrados');
  assert.ok(metrics.servicesCount > 0, 'Deve possuir serviços cadastrados');

  // Verifica se todos os itens estão na mesma coleção commercialOfferings
  const allOfferings = await prisma.commercialOffering.findMany();
  const typesFound = new Set(allOfferings.map((o: any) => o.type));
  assert.ok(typesFound.has('PLAN'), 'Coleção única deve conter planos');
  assert.ok(typesFound.has('PACKAGE'), 'Coleção única deve conter pacotes');
  assert.ok(typesFound.has('SERVICE'), 'Coleção única deve conter serviços');
  console.log(`  -> Catálogo unificado: ${metrics.totalOfferings} ofertas (${metrics.plansCount} planos, ${metrics.packagesCount} pacotes, ${metrics.servicesCount} serviços).`);
  console.log('✓ Teste 1 passou: Fonte única de catálogo validada sem duplicação de tabelas.\n');

  // --------------------------------------------------------------------------
  // 2. Criação de Oferta Comercial com Código Público e Versão 1 Automática
  // --------------------------------------------------------------------------
  console.log('2. Testando Criação de Oferta Comercial com Código Público e Versão 1...');
  const newPlan = await OfferingService.createOffering(
    {
      categoryId: 'cat_platform',
      name: 'Plano Festival Mega Gold',
      code: 'PLAN_FESTIVAL_GOLD',
      type: 'PLAN',
      description: 'Plano para festivais com mais de 20.000 pessoas',
      defaultPricingModel: 'PERCENTAGE',
      defaultPercentage: 5.5,
      defaultPayer: 'PRODUCER',
      defaultTerms: [
        {
          termType: 'PLATFORM_COMMISSION',
          calculationType: 'PERCENTAGE',
          percentage: 5.5,
          minimumAmount: 10000,
          payer: 'PRODUCER',
          negotiable: true
        }
      ]
    },
    'usr_comercial_admin',
    'Diretoria Comercial'
  );

  assert.ok(newPlan.id, 'Deve gerar ID para a oferta');
  assert.match(newPlan.publicCode, /^OFR-\d{4}-\d{6}$/, 'Código público deve seguir formato OFR-YYYY-XXXXXX');
  assert.strictEqual(newPlan.currentVersionNumber, 1, 'Versão inicial deve ser 1');
  assert.ok(newPlan.currentVersionId, 'Deve possuir currentVersionId');
  assert.strictEqual(newPlan.status, 'ACTIVE', 'Status inicial deve ser ACTIVE');

  createdPlanId = newPlan.id;
  version1Id = newPlan.currentVersionId!;

  // Valida que a versão 1 foi criada com contentHash SHA-256
  const v1 = await OfferingVersionService.getVersionById(version1Id);
  assert.ok(v1, 'Versão 1 deve existir');
  assert.strictEqual(v1!.versionNumber, 1);
  assert.strictEqual(v1!.status, 'ACTIVE');
  assert.ok(v1!.contentHash.length === 64, 'contentHash deve ser SHA-256 (64 hex chars)');
  console.log(`  -> Oferta criada: ${newPlan.publicCode} (${newPlan.name}) | Versão: v${newPlan.currentVersionNumber} | Hash: ${v1!.contentHash.substring(0, 16)}...`);
  console.log('✓ Teste 2 passou: Criação oficial com hash de integridade aprovada.\n');

  // --------------------------------------------------------------------------
  // 3. Versionamento Imutável: Rascunho (v2) e Publicação com Transição Segura
  // --------------------------------------------------------------------------
  console.log('3. Testando Versionamento Imutável (Criação de DRAFT v2 e Publicação)...');
  const draftV2 = await OfferingVersionService.createDraftVersion(
    createdPlanId,
    {
      nameSnapshot: 'Plano Festival Mega Gold 2027',
      descriptionSnapshot: 'Condições atualizadas para festivais com suporte presencial',
      changeSummary: 'Ajuste de comissão mínima para 12.000 e inclusão de cláusula técnica',
      defaultTerms: [
        {
          termType: 'PLATFORM_COMMISSION',
          calculationType: 'PERCENTAGE',
          percentage: 5.2,
          minimumAmount: 12000,
          payer: 'PRODUCER',
          negotiable: true
        }
      ]
    },
    'usr_comercial_admin',
    'Diretoria Comercial'
  );

  assert.strictEqual(draftV2.versionNumber, 2, 'Versão do rascunho deve ser 2');
  assert.strictEqual(draftV2.status, 'DRAFT', 'Nova versão inicia em DRAFT');
  assert.notStrictEqual(draftV2.contentHash, v1!.contentHash, 'Hash da v2 deve ser diferente da v1');

  // A oferta raiz ainda deve apontar para a versão 1 enquanto v2 estiver em DRAFT
  const checkOfferingBeforePublish = await OfferingService.getOfferingById(createdPlanId);
  assert.strictEqual(checkOfferingBeforePublish!.currentVersionNumber, 1, 'Oferta ativa deve permanecer em v1');
  assert.strictEqual(checkOfferingBeforePublish!.currentVersionId, version1Id);

  // Publica a versão 2
  const publishedV2 = await OfferingVersionService.publishVersion(
    draftV2.id,
    {
      changeSummary: 'Versão 2 homologada pela diretoria comercial'
    },
    'usr_comercial_admin',
    'Diretoria Comercial'
  );

  assert.strictEqual(publishedV2.status, 'ACTIVE', 'Versão publicada deve ficar ACTIVE');
  version2Id = publishedV2.id;

  // A oferta raiz agora deve apontar para a versão 2
  const checkOfferingAfterPublish = await OfferingService.getOfferingById(createdPlanId);
  assert.strictEqual(checkOfferingAfterPublish!.currentVersionNumber, 2, 'Oferta ativa agora deve ser v2');
  assert.strictEqual(checkOfferingAfterPublish!.currentVersionId, version2Id);
  assert.strictEqual(checkOfferingAfterPublish!.name, 'Plano Festival Mega Gold 2027');
  console.log(`  -> Versão 2 publicada: ${publishedV2.versionNumber} | Hash: ${publishedV2.contentHash.substring(0, 16)}... | Oferta atualizada para v2.`);
  console.log('✓ Teste 3 passou: Ciclo de vida de versionamento imutável aprovado.\n');

  // --------------------------------------------------------------------------
  // 4. Composições de Pacotes e Prevenção Rigorosa de Ciclos (DFS)
  // --------------------------------------------------------------------------
  console.log('4. Testando Composições de Pacotes e Detecção de Ciclo Recursivo (DFS)...');
  // Cria pacote P1
  const pkg1 = await OfferingService.createOffering(
    {
      categoryId: 'cat_access',
      name: 'Pacote Portaria VIP 2026',
      code: 'PKG_ACCESS_VIP',
      type: 'PACKAGE',
      defaultPricingModel: 'FIXED_AMOUNT',
      defaultAmount: 400.0,
      compositions: [
        { childOfferingId: 'off_acc_device', quantity: 2, required: true },
        { childOfferingId: 'off_acc_op', quantity: 2, required: true }
      ]
    },
    'usr_comercial_admin',
    'Diretoria Comercial'
  );
  createdPackageId = pkg1.id;

  // Cria pacote P2 que inclui P1
  const pkg2 = await OfferingService.createOffering(
    {
      categoryId: 'cat_platform',
      name: 'Pacote Festival Infra Total',
      code: 'PKG_FESTIVAL_INFRA',
      type: 'PACKAGE',
      defaultPricingModel: 'FIXED_AMOUNT',
      defaultAmount: 1200.0,
      compositions: [
        { childOfferingId: pkg1.id, quantity: 1, required: true }
      ]
    },
    'usr_comercial_admin',
    'Diretoria Comercial'
  );

  // Agora tenta fazer P1 incluir P2 -> Deve falhar com erro de ciclo detectado!
  let cycleDetected = false;
  try {
    await OfferingCompositionService.setCompositions(pkg1.id, pkg1.currentVersionId!, [
      { childOfferingId: pkg2.id, quantity: 1, required: true }
    ]);
  } catch (err: any) {
    cycleDetected = true;
    assert.match(err.message, /Ciclo detectado/i, 'Mensagem deve indicar detecção de ciclo');
  }
  assert.ok(cycleDetected, 'Tentativa de criar inclusão circular P1 -> P2 -> P1 deve lançar erro');

  // Tenta fazer P1 incluir a si mesmo -> Deve falhar
  let selfCycleDetected = false;
  try {
    await OfferingCompositionService.setCompositions(pkg1.id, pkg1.currentVersionId!, [
      { childOfferingId: pkg1.id, quantity: 1, required: true }
    ]);
  } catch (err: any) {
    selfCycleDetected = true;
    assert.match(err.message, /não pode incluir a si próprio/i);
  }
  assert.ok(selfCycleDetected, 'Auto-inclusão deve ser bloqueada');
  console.log('  -> Ciclo P1 -> P2 -> P1 e auto-inclusão P1 -> P1 devidamente rejeitados por DFS.');
  console.log('✓ Teste 4 passou: Composições hierárquicas e detecção de ciclos validadas.\n');

  // --------------------------------------------------------------------------
  // 5. Recursos Técnicos (Features do Catálogo Desacopladas de RBAC)
  // --------------------------------------------------------------------------
  console.log('5. Testando Recursos Técnicos Desacoplados de RBAC...');
  const newFeature = await OfferingFeatureService.createFeature({
    code: 'feature.bi.predictive_curve',
    name: 'Curva Preditiva de Vendas com IA',
    description: 'Algoritmo de projeção de esgotamento de lotes',
    category: 'REPORTS'
  });

  assert.ok(newFeature.id);
  assert.strictEqual(newFeature.code, 'feature.bi.predictive_curve');

  // Associa o recurso à versão 2 do plano criado
  const assigned = await OfferingFeatureService.assignFeaturesToVersion(version2Id, [
    { featureId: newFeature.id, included: true, limitValue: 10, limitUnit: 'projections_day' },
    { featureId: 'feat_split_auto', included: true }
  ]);

  assert.strictEqual(assigned.length, 2);
  const featList = await OfferingFeatureService.listFeaturesByVersion(version2Id);
  assert.strictEqual(featList.length, 2);
  assert.ok(featList.some(f => f.featureCode === 'feature.bi.predictive_curve'));
  console.log(`  -> Recurso técnico cadastrado e vinculado: ${newFeature.name} (${newFeature.code}).`);
  console.log('✓ Teste 5 passou: Features técnicas do produto catalogadas sem sobrepor RBAC de usuários.\n');

  // --------------------------------------------------------------------------
  // 6. Resolução de Condições Padrão e Decoupled CommercialCatalogProvider
  // --------------------------------------------------------------------------
  console.log('6. Testando Resolução de Condições Padrão e CommercialCatalogProvider...');
  // Resolução da versão 1
  const termsV1 = await commercialCatalogProvider.resolveEffectiveTerms(createdPlanId, 1);
  assert.strictEqual(termsV1.length, 1);
  assert.strictEqual(termsV1[0].percentage, 5.5);
  assert.strictEqual(termsV1[0].minimumAmount, 10000);

  // Resolução da versão 2 (corrente)
  const termsV2 = await commercialCatalogProvider.resolveEffectiveTerms(createdPlanId, 2);
  assert.strictEqual(termsV2.length, 1);
  assert.strictEqual(termsV2[0].percentage, 5.2);
  assert.strictEqual(termsV2[0].minimumAmount, 12000);

  // Snapshot completo da oferta via provider
  const snapshot = await commercialCatalogProvider.getOfferingSnapshot(createdPlanId, 2);
  assert.ok(snapshot, 'Snapshot deve ser retornado');
  assert.strictEqual(snapshot!.offering.id, createdPlanId);
  assert.strictEqual(snapshot!.version.versionNumber, 2);
  assert.strictEqual(snapshot!.defaultTerms.length, 1);
  assert.strictEqual(snapshot!.features.length, 2);
  console.log(`  -> Provider resolveu V1 (5.5%) e V2 (5.2%) com snapshot desacoplado completo.`);
  console.log('✓ Teste 6 passou: CommercialCatalogProvider e DefaultTermsResolver operacionais.\n');

  // --------------------------------------------------------------------------
  // 7. Isolamento por Snapshot em Propostas e Contratos Existentes
  // --------------------------------------------------------------------------
  console.log('7. Testando Preservação de Histórico e Isolamento por Snapshot...');
  // Cria proposta associada à oferta V1
  const prop = await ProposalService.createProposal(
    {
      producerId: 'prd_100',
      title: 'Proposta com Snapshot do Plano Gold',
      validUntil: new Date(Date.now() + 10 * 86400000).toISOString(),
      terms: [
        {
          offeringId: createdPlanId,
          termType: 'PLATFORM_COMMISSION',
          name: 'Comissão Negociada Gold v1',
          calculationType: 'PERCENTAGE',
          percentage: 5.5,
          minimumAmount: 10000,
          payer: 'PRODUCER'
        }
      ]
    },
    'usr_comercial_1',
    'Mariana Souza'
  );

  const initialVersion = prop.currentVersion!;
  assert.ok(initialVersion, 'Proposta deve ter versão');
  const termInProposal = initialVersion.terms?.find(t => t.offeringId === createdPlanId);
  assert.strictEqual(termInProposal?.percentage, 5.5);

  // Mesmo que o plano oficial agora esteja na v2 com 5.2%, a proposta permanece em 5.5%
  const reloadedProp = await ProposalService.getProposalById(prop.id);
  const reloadedTerm = reloadedProp?.currentVersion?.terms?.find(t => t.offeringId === createdPlanId);
  assert.strictEqual(reloadedTerm?.percentage, 5.5, 'Termo na proposta não pode sofrer mutação após nova versão do catálogo');
  console.log(`  -> Proposta PROP-${prop.publicCode} manteve taxa congelada de 5.5% (imune à v2).`);
  console.log('✓ Teste 7 passou: Imutabilidade de propostas e contratos assegurada por snapshots.\n');

  // --------------------------------------------------------------------------
  // 8. Análise de Impacto Comercial e Contratual
  // --------------------------------------------------------------------------
  console.log('8. Testando Análise de Impacto Comercial (CatalogImpactService)...');
  const impact = await CatalogImpactService.analyzeImpact(createdPlanId);
  assert.strictEqual(impact.offeringId, createdPlanId);
  assert.ok(impact.draftProposalsCount >= 1, 'Deve detectar a proposta em rascunho recém-criada');
  assert.ok(impact.warningMessage, 'Deve retornar mensagem de advertência explicativa');
  console.log(`  -> Impacto detectado: ${impact.draftProposalsCount} propostas em negociação, ${impact.parentPackagesCount} pacotes pai.`);
  console.log(`  -> Advertência: "${impact.warningMessage}".`);
  console.log('✓ Teste 8 passou: Análise de impacto precisa e transparente.\n');

  // --------------------------------------------------------------------------
  // 9. Descontinuação Segura sem Deleção ou Perda de Dados
  // --------------------------------------------------------------------------
  console.log('9. Testando Descontinuação Segura de Oferta do Catálogo...');
  const discontinued = await OfferingService.discontinueOffering(
    createdPlanId,
    { reason: 'Substituído por novo modelo comercial 2028' },
    'usr_comercial_admin'
  );

  assert.strictEqual(discontinued.status, 'DISCONTINUED', 'Status deve ser DISCONTINUED');
  assert.strictEqual(discontinued.active, false, 'Oferta descontinuada deve estar inativa');

  // Verifica que a proposta criada anteriormente NÃO foi deletada nem corrompida
  const proposalAfterDiscontinue = await ProposalService.getProposalById(prop.id);
  assert.ok(proposalAfterDiscontinue, 'Proposta deve continuar existindo');
  assert.strictEqual(proposalAfterDiscontinue!.currentVersion?.terms?.[0]?.percentage, 5.5);

  // Lista de ativas do catálogo não deve mais trazer a oferta descontinuada
  const activeOfferings = await OfferingService.listOfferings({ activeOnly: true });
  assert.ok(!activeOfferings.some(o => o.id === createdPlanId), 'Oferta descontinuada não aparece em ofertas ativas');
  console.log('  -> Oferta descontinuada com integridade: propostas e contratos preservados, novas vendas impedidas.');
  console.log('✓ Teste 9 passou: Descontinuação sem perda de dados homologada.\n');

  // --------------------------------------------------------------------------
  // 10. Agregações e Métricas do Catálogo
  // --------------------------------------------------------------------------
  console.log('10. Testando Agregações e Consultas Especializadas...');
  const activePlans = await CatalogQueryService.listPlans();
  const activePackages = await CatalogQueryService.listPackages();
  const activeServices = await CatalogQueryService.listServices();
  const categories = await CatalogQueryService.listCategoriesWithOfferings();

  assert.ok(activePlans.length > 0, 'Deve listar planos ativos');
  assert.ok(activePackages.length > 0, 'Deve listar pacotes ativos');
  assert.ok(activeServices.length > 0, 'Deve listar serviços ativos');
  assert.ok(categories.length > 0, 'Deve listar categorias com ofertas agrupadas');

  const finalMetrics = await CatalogQueryService.getMetrics();
  assert.ok(finalMetrics.discontinuedCount >= 1, 'Métricas devem contabilizar oferta descontinuada');
  console.log(`  -> Planos: ${activePlans.length} | Pacotes: ${activePackages.length} | Serviços: ${activeServices.length} | Descontinuadas: ${finalMetrics.discontinuedCount}`);
  console.log('✓ Teste 10 passou: Consultas agrupadas e métricas validadas.\n');

  console.log('================================================================');
  console.log('TODOS OS 10 TESTES DA FASE 1.3.7 (CATÁLOGO COMERCIAL) PASSARAM!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Falha nos testes da Fase 1.3.7:', err);
  process.exit(1);
});
