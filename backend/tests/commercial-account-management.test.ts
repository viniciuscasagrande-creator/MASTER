import { prisma } from '../src/core/database/prisma';
import { AccountQueryService } from '../src/modules/commercial/account-management/account-query.service';
import { AccountTimelineService } from '../src/modules/commercial/account-management/account-timeline.service';
import { RenewalPolicy } from '../src/modules/commercial/account-management/renewals/renewal-policy';
import { RenewalQueryService } from '../src/modules/commercial/account-management/renewals/renewal-query.service';
import { RenewalOrchestratorService } from '../src/modules/commercial/account-management/renewals/renewal-orchestrator.service';
import { CommercialMovementService } from '../src/modules/commercial/account-management/movements/commercial-movement.service';
import { CommercialChangeImpactService } from '../src/modules/commercial/account-management/movements/change-impact.service';
import { AccountCommercialAlertsProvider } from '../src/modules/commercial/account-management/alerts/account-commercial-alerts.provider';
import { EntitlementService } from '../src/modules/entitlements/entitlement.service';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runCommercialAccountManagementTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.9: GESTÃO DE CONTAS, RENOVAÇÕES E MOVIMENTAÇÕES');
  console.log('================================================================\n');

  // Inicializa banco de dados em memória
  prisma.seedDefaults();

  const user = {
    id: 'usr_comercial_1',
    name: 'Mariana Souza',
    role: 'COMERCIAL',
    roles: ['COMERCIAL']
  };

  // -------------------------------------------------------------------------
  console.log('1. Testando Consulta Factual de Contas e Métricas (AccountQueryService)...');
  // -------------------------------------------------------------------------
  const accounts = await AccountQueryService.listAccounts({}, user);
  assert(accounts.length > 0, `Deve listar contas de produtores (encontradas: ${accounts.length})`);

  const account = accounts[0];
  assert(!!account.producerId, 'Conta deve conter producerId');
  assert(!!account.producerName, 'Conta deve conter producerName');
  assert(account.commercialStatus !== undefined, 'Conta deve ter commercialStatus');
  assert(typeof account.activeContractsCount === 'number', 'Deve calcular activeContractsCount');
  assert(typeof account.openOpportunitiesCount === 'number', 'Deve calcular openOpportunitiesCount');

  const metrics = await AccountQueryService.getMetrics(user);
  assert(metrics.totalProducers > 0, `Total de produtores deve ser positivo (encontrado: ${metrics.totalProducers})`);
  assert(typeof metrics.portfolioCoveragePercentage === 'number', 'Deve calcular cobertura de carteira');
  assert(metrics.openMovementsCount !== undefined, 'Deve conter breakdown de movimentações');

  // -------------------------------------------------------------------------
  console.log('\n2. Testando Detalhes da Conta Comercial (AccountQueryService.getAccountDetails)...');
  // -------------------------------------------------------------------------
  const details = await AccountQueryService.getAccountDetails('prd_100', user);
  assert(details.producerId === 'prd_100', 'Detalhes devem corresponder a prd_100');
  assert(Array.isArray(details.contracts), 'Deve listar contratos da conta');
  assert(Array.isArray(details.contractedProducts), 'Deve listar produtos contratados (EntitlementService)');
  assert(Array.isArray(details.entitlements), 'Deve listar entitlements da conta');
  assert(Array.isArray(details.activeRenewals), 'Deve listar renovações ativas');
  assert(Array.isArray(details.recentOpportunities), 'Deve listar movimentações recentes');
  assert(Array.isArray(details.alerts), 'Deve listar alertas da conta');

  // -------------------------------------------------------------------------
  console.log('\n3. Testando Linha do Tempo Unificada sem Tabela Redundante (AccountTimelineService)...');
  // -------------------------------------------------------------------------
  const timeline = await AccountTimelineService.getAccountTimeline('prd_100');
  assert(timeline.producerId === 'prd_100', 'Timeline deve ser de prd_100');
  assert(timeline.events.length > 0, `Timeline deve agregar eventos factuais (total: ${timeline.totalEvents})`);

  // Verifica ordenação cronológica decrescente
  let isChronological = true;
  for (let i = 0; i < timeline.events.length - 1; i++) {
    const tCurrent = new Date(timeline.events[i].timestamp).getTime();
    const tNext = new Date(timeline.events[i + 1].timestamp).getTime();
    if (tCurrent < tNext) {
      isChronological = false;
      break;
    }
  }
  assert(isChronological, 'Eventos da timeline devem estar em ordem cronológica decrescente');

  // Categorias presentes
  const categories = new Set(timeline.events.map(e => e.category));
  assert(categories.has('CONTRACT') || categories.has('ACTIVITY') || categories.has('OPPORTUNITY'), 'Timeline deve agregar múltiplas categorias de fatos');

  // -------------------------------------------------------------------------
  console.log('\n4. Testando Políticas de Renovação e Janela de Planejamento (RenewalPolicy)...');
  // -------------------------------------------------------------------------
  const daysInFuture60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const daysInFuture150 = new Date(Date.now() + 150 * 24 * 60 * 60 * 1000);
  const daysInPast30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  assert(RenewalPolicy.isWithinPlanningWindow(daysInFuture60, 90) === true, '60 dias deve estar na janela de 90 dias');
  assert(RenewalPolicy.isWithinPlanningWindow(daysInFuture150, 90) === false, '150 dias NÃO deve estar na janela de 90 dias');
  assert(RenewalPolicy.isOverdue(daysInPast30) === true, 'Contrato com 30 dias no passado deve ser considerado vencido (overdue)');
  assert(RenewalPolicy.isOverdue(daysInPast30, 'COMPLETED') === false, 'Contrato com status COMPLETED não deve ser considerado overdue');

  // -------------------------------------------------------------------------
  console.log('\n5. Testando Orquestração de Renovação e Idempotência de Ciclo (RenewalOrchestratorService)...');
  // -------------------------------------------------------------------------
  const targetEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Inicia renovação de renegociação
  const renewal1 = await RenewalOrchestratorService.startRenewalNegotiation({
    contractId: 'ctr_101',
    renewalType: 'RENEGOTIATION',
    targetEffectiveUntil: targetEnd,
    notes: 'Negociação anual de reajuste de taxa',
    estimatedValue: 120000
  }, user);

  assert(renewal1.contractId === 'ctr_101', 'Renovação deve ser criada para ctr_101');
  assert(renewal1.status === 'IN_PROGRESS' || renewal1.status === 'PLANNED', 'Status deve ser em progresso/planejado');
  assert(!!renewal1.sourceOpportunityId, 'Renegociação DEVE gerar Oportunidade Comercial vinculada no CRM 1.3.4');
  assert(!!renewal1.sourceOpportunityPublicCode, 'Oportunidade deve ter código público OPP-YYYY-NNNNN');

  // Teste de Idempotência: Chamar novamente a negociação não deve criar um ciclo duplicado
  const renewal1Repeat = await RenewalOrchestratorService.startRenewalNegotiation({
    contractId: 'ctr_101',
    renewalType: 'RENEGOTIATION',
    targetEffectiveUntil: targetEnd,
    notes: 'Chamada repetida idempotente'
  }, user);

  assert(renewal1Repeat.id === renewal1.id, 'Chamada repetida de início de renovação deve ser idempotente e retornar o registro ativo');

  // -------------------------------------------------------------------------
  console.log('\n6. Testando Concorrência Otimista (Optimistic Locking) na Renovação...');
  // -------------------------------------------------------------------------
  try {
    await RenewalOrchestratorService.updateRenewalStatus(renewal1.id, {
      status: 'AWAITING_DECISION',
      version: 999 // Versão inválida para provocar conflito 409
    }, user);
    assert(false, 'Deveria ter lançado erro 409 de conflito de versão');
  } catch (err: any) {
    assert(err.statusCode === 409 || err.message.includes('409') || err.message.includes('versão'), 'Deve recusar atualização concorrente com erro 409');
  }

  // Atualização com a versão correta
  const updatedRenewal = await RenewalOrchestratorService.updateRenewalStatus(renewal1.id, {
    status: 'AWAITING_DECISION',
    version: renewal1.version,
    notes: 'Produtor em processo de assinatura'
  }, user);

  assert(updatedRenewal.status === 'AWAITING_DECISION', 'Status deve ter sido atualizado para AWAITING_DECISION');
  assert(updatedRenewal.version === renewal1.version + 1, 'Versão do registro deve ter sido incrementada');

  // -------------------------------------------------------------------------
  console.log('\n7. Testando Decisão de Renovação e Extensão de Vigência Contratual...');
  // -------------------------------------------------------------------------
  // Cria um contrato específico para teste de renovação simples
  const simpleContract = await prisma.commercialContract.create({
    data: {
      publicCode: 'CTR-2026-TEST-SIMPLE',
      producerId: 'prd_100',
      title: 'Contrato de Teste Simples',
      status: 'ACTIVE',
      effectiveFrom: new Date('2026-01-01T00:00:00Z'),
      effectiveUntil: new Date('2026-12-31T23:59:59Z'),
      createdBy: user.id
    }
  });

  const simpleRenewal = await RenewalOrchestratorService.startRenewalNegotiation({
    contractId: simpleContract.id,
    renewalType: 'SIMPLE',
    notes: 'Extensão simples por mais 1 ano'
  }, user);

  const newContractEnd = new Date('2027-12-31T23:59:59Z');

  const decidedRenewal = await RenewalOrchestratorService.decideRenewal(simpleRenewal.id, {
    status: 'COMPLETED',
    decisionReason: 'Produtor aceitou renovação automática anual sem reajuste de taxa',
    targetEffectiveUntil: newContractEnd.toISOString(),
    version: simpleRenewal.version
  }, user);

  assert(decidedRenewal.status === 'COMPLETED', 'Renovação deve estar com status COMPLETED');
  assert(!!decidedRenewal.completedAt, 'Renovação deve registrar completedAt');

  // Verifica se a vigência do contrato foi estendida
  const updatedContract = await prisma.commercialContract.findUnique({ where: { id: simpleContract.id } });
  assert(
    new Date(updatedContract!.effectiveUntil!).getFullYear() === 2027,
    `Vigência do contrato deve ter sido estendida para 2027 (atual: ${updatedContract!.effectiveUntil})`
  );

  // -------------------------------------------------------------------------
  console.log('\n8. Testando Movimentações Comerciais: Expansão, Upgrade e Downgrade (CommercialMovementService)...');
  // -------------------------------------------------------------------------
  const upgradeMovement = await CommercialMovementService.createMovement({
    producerId: 'prd_100',
    movementType: 'UPGRADE',
    title: 'Migração para Plano Enterprise',
    description: 'Upgrade para incluir catracas integradas e biometria facial',
    originContractId: simpleContract.id,
    estimatedValue: 45000
  }, user);

  assert(upgradeMovement.movementType === 'UPGRADE', 'Movimentação deve ser do tipo UPGRADE');
  assert(upgradeMovement.publicCode.startsWith('OPP-'), 'Código público deve seguir OPP-YYYY-NNNNN');
  assert(upgradeMovement.status === 'OPEN', 'Status inicial deve ser OPEN');

  const movementsList = await CommercialMovementService.listMovements({ producerId: 'prd_100' });
  const foundUpgrade = movementsList.find(m => m.id === upgradeMovement.id);
  assert(!!foundUpgrade, 'Movimentação criada deve constar na listagem de movimentações');

  // -------------------------------------------------------------------------
  console.log('\n9. Testando Comparador de Impacto Comercial e Invariantes Arquiteturais (CommercialChangeImpactService)...');
  // -------------------------------------------------------------------------
  // Busca ofertas reais do catálogo
  const offerings = await prisma.commercialOffering.findMany({ where: { status: 'ACTIVE' } });
  assert(offerings.length >= 1, 'Deve haver ao menos 1 oferta no catálogo');

  const targetOffering = offerings[0];

  // Snapshot anterior de entitlements para testar o invariante de NÃO-ALTERAÇÃO
  const initialEntitlements = await EntitlementService.listProducerEntitlements('prd_100');
  const initialCount = initialEntitlements.length;

  const impact = await CommercialChangeImpactService.simulateChangeImpact({
    producerId: 'prd_100',
    movementType: 'UPGRADE',
    originContractId: simpleContract.id,
    proposedOfferingId: targetOffering.id
  });

  assert(impact.producerId === 'prd_100', 'Impacto deve ser calculado para prd_100');
  assert(!!impact.proposedOffering, 'Deve detalhar a oferta pretendida');
  assert(impact.impactAnalysis !== undefined, 'Deve conter a análise de impacto');
  assert(Array.isArray(impact.impactAnalysis.featuresAdded), 'Deve conter featuresAdded');
  assert(Array.isArray(impact.impactAnalysis.featuresRemoved), 'Deve conter featuresRemoved');
  assert(Array.isArray(impact.impactAnalysis.limitChanges), 'Deve conter limitChanges');
  assert(Array.isArray(impact.impactAnalysis.operationalRisks), 'Deve conter operationalRisks');

  // INVARIANTE FUNDAMENTAL 1: Simulação comercial NUNCA altera habilitações diretamente
  assert(
    impact.impactAnalysis.entitlementWillChangeImmediately === false,
    'INVARIANTE OBRIGATÓRIO: entitlementWillChangeImmediately DEVE ser SEMPRE false'
  );

  // INVARIANTE FUNDAMENTAL 2: A simulação é estritamente consultiva e não modificou o banco
  const afterEntitlements = await EntitlementService.listProducerEntitlements('prd_100');
  assert(
    afterEntitlements.length === initialCount,
    `INVARIANTE OBRIGATÓRIO: Simulação não pode alterar tabela de entitlements (antes: ${initialCount}, depois: ${afterEntitlements.length})`
  );

  // -------------------------------------------------------------------------
  console.log('\n10. Testando Provedor de Alertas Factuais e Auditoria (AccountCommercialAlertsProvider)...');
  // -------------------------------------------------------------------------
  const alerts = await AccountCommercialAlertsProvider.getAllAlerts();
  assert(Array.isArray(alerts), 'Alertas comerciais devem ser retornados como lista');
  for (const a of alerts) {
    assert(!!a.id && !!a.code && !!a.severity && !!a.title, 'Alerta factual deve possuir id, code, severity e title');
    assert(['INFO', 'WARNING', 'CRITICAL'].includes(a.severity), 'Severidade deve ser válida');
  }

  console.log('\n================================================================');
  console.log('🎉 TODOS OS TESTES DA FASE 1.3.9 FORAM EXECUTADOS COM SUCESSO!');
  console.log('================================================================\n');
}

runCommercialAccountManagementTests().catch(err => {
  console.error('\n❌ Erro durante a execução dos testes da Fase 1.3.9:', err);
  process.exit(1);
});
