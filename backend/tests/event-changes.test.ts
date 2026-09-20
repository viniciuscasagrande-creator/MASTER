import { EventChangeClassificationService } from '../src/modules/events/changes/event-change-classification.service';
import { EventChangeImpactService } from '../src/modules/events/changes/event-change-impact.service';
import { EventChangeService } from '../src/modules/events/changes/event-change.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.10: ALTERAÇÕES CRÍTICAS E IMPACTO');
  console.log('======================================================\n');

  const eventId = 'evt_1001';
  const adminUser = { id: 'usr_admin', name: 'Administrador DiskIngressos', permissions: ['*'] };

  // 1. Classificação de Severidade de Mudança
  console.log('1. Testando motor de classificação de alterações...');
  const classDraft = EventChangeClassificationService.classify('SECTION_CAPACITY', 'DRAFT');
  if (classDraft !== 'NON_CRITICAL') {
    throw new Error(`Deveria ser NON_CRITICAL em DRAFT, obteve ${classDraft}`);
  }

  const classReview = EventChangeClassificationService.classify('SECTION_CAPACITY', 'REVIEW');
  if (classReview !== 'REVIEW_INVALIDATING') {
    throw new Error(`Deveria ser REVIEW_INVALIDATING em REVIEW, obteve ${classReview}`);
  }

  const classOnSale = EventChangeClassificationService.classify('EVENT_DATE', 'ON_SALE');
  if (classOnSale !== 'POST_SALES_CRITICAL') {
    throw new Error(`Deveria ser POST_SALES_CRITICAL em ON_SALE, obteve ${classOnSale}`);
  }
  console.log('✓ Teste 1 passou! Classificação de severidade validada para todos os estados.\n');

  // 2. Análise de Impacto com Dados Reais do Banco de Dados
  console.log('2. Testando análise de impacto calculada a partir de pedidos e ingressos reais...');
  const impact = await EventChangeImpactService.evaluateImpact(
    eventId,
    'EVENT_DATE',
    'EVENT',
    eventId,
    { field: 'sessionDate', before: '2026-10-15', after: '2026-10-20' }
  );

  if (impact.financialAmount < 0 || impact.affectedCustomers < 0) {
    throw new Error('Métricas de impacto inválidas');
  }
  console.log(`✓ Teste 2 passou! Análise de impacto concluída: Ingressos afetados = ${impact.affectedTickets}, Pedidos = ${impact.affectedOrders}, Montante = R$ ${(impact.financialAmount / 100).toFixed(2)}.\n`);

  // 3. Regra Bloqueante de Déficit de Capacidade
  console.log('3. Testando detecção e bloqueio obrigatório de déficit de capacidade...');
  const sections = await prisma.eventSection.findMany({ where: { eventId } });
  const section = sections.find(s => s.name?.toLowerCase().includes('pista')) || sections[0];

  await (prisma as any).ticket.create({
    data: {
      id: `tkt_sec_${Date.now()}`,
      ticketCode: `SEC-${Date.now()}`,
      eventId,
      sectorName: section.name,
      sectionId: section.id,
      status: 'VALID',
      customerName: 'Comprador Setor'
    }
  });

  const deficitImpact = await EventChangeImpactService.evaluateImpact(
    eventId,
    'SECTION_CAPACITY',
    'SECTION',
    section.id,
    { field: 'capacity', before: section.capacity, after: 0 } // Reduz para zero
  );

  if (!deficitImpact.affectedInventory.isDeficit || deficitImpact.blockers.length === 0) {
    throw new Error('Redução drástica de capacidade deveria disparar déficit e bloqueadores');
  }
  console.log(`✓ Teste 3 passou! Déficit detectado com sucesso: ${deficitImpact.affectedInventory.deficit} lugares em déficit. Bloqueador: "${deficitImpact.blockers[0]}".\n`);

  // 4. Criação de Solicitação de Alteração (ALT-XXXXXX)
  console.log('4. Testando criação de solicitação de alteração controlada...');
  const changeReq = await EventChangeService.createChangeRequest(
    eventId,
    {
      resourceType: 'SECTION',
      resourceId: section.id,
      changeType: 'SECTION_CAPACITY',
      reason: 'Ampliação de segurança e expansão do setor',
      businessJustification: 'Adequação técnica autorizada pelo Corpo de Bombeiros',
      changePayload: {
        field: 'capacity',
        fieldName: 'Capacidade do Setor',
        before: section.capacity,
        after: section.capacity + 200
      }
    },
    adminUser
  );

  if (!changeReq.publicCode.startsWith('ALT-') || !changeReq.impact) {
    throw new Error('Falha ao gerar solicitação com código público ou impacto');
  }
  console.log(`✓ Teste 4 passou! Solicitação ${changeReq.publicCode} criada com status ${changeReq.status}.\n`);

  // 5. Detecção de Análise de Impacto STALE (Obsoleta após novas vendas)
  console.log('5. Testando detecção de impacto obsoleto (STALE) por movimentação no banco...');
  // Simula uma nova emissão de ingresso enquanto a solicitação está pendente
  await (prisma as any).ticket.create({
    data: {
      id: `tkt_stale_${Date.now()}`,
      ticketCode: `STALE-${Date.now()}`,
      eventId,
      sectorName: section.name,
      sectionId: section.id,
      status: 'VALID',
      customerName: 'Comprador Novo em Tempo Real'
    }
  });

  const staleCheck = await EventChangeImpactService.checkIsStale(eventId, changeReq.impact, null, {
    changeType: changeReq.changeType,
    resourceType: changeReq.resourceType,
    resourceId: changeReq.resourceId
  });
  if (!staleCheck.isStale) {
    throw new Error('A análise de impacto deveria ter sido detectada como STALE');
  }
  console.log('✓ Teste 5 passou! STALE detectado: hash divergiu após novas vendas em tempo real.\n');

  // 6. Recálculo de Impacto
  console.log('6. Testando recálculo do impacto...');
  const recalculated = await EventChangeService.recalculateImpact(changeReq.id, adminUser);
  if (recalculated.impact?.snapshotHash === changeReq.impact.snapshotHash) {
    throw new Error('Hash do impacto deveria ter sido atualizado após recálculo');
  }
  console.log('✓ Teste 6 passou! Impacto recalculado com sucesso e sincronizado.\n');

  // 7. Ciclo de Aprovação e Execução Transacional
  console.log('7. Testando esteira de submissão, aprovação e execução...');
  const submitted = await EventChangeService.submitForApproval(changeReq.id, adminUser);
  if (submitted.status !== 'APPROVAL_PENDING') {
    throw new Error('Status deveria ser APPROVAL_PENDING após submissão');
  }

  const approved = await EventChangeService.approve(changeReq.id, adminUser);
  if (approved.status !== 'APPROVED') {
    throw new Error('Status deveria ser APPROVED após aprovação');
  }

  const executed = await EventChangeService.execute(changeReq.id, adminUser);
  if (executed.status !== 'EXECUTED' || !executed.executedAt) {
    throw new Error('Status deveria ser EXECUTED com data de execução');
  }

  // Verifica se o modelo de domínio do setor foi efetivamente atualizado
  const updatedSection = await prisma.eventSection.findUnique({ where: { id: section.id } });
  if (updatedSection?.capacity !== section.capacity + 200) {
    throw new Error('A capacidade do setor não foi atualizada no banco');
  }
  console.log(`✓ Teste 7 passou! Alteração executada com sucesso. Nova capacidade do setor: ${updatedSection?.capacity}.\n`);

  console.log('======================================================');
  console.log('TODOS OS 7 TESTES DA FASE 1.2.10 PASSARAM COM SUCESSO!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Erro nos testes da Fase 1.2.10:', err);
  process.exit(1);
});
