import { prisma } from '../src/core/database/prisma';
import { runSeed } from '../prisma/seed';
import { approvalEngineService } from '../src/modules/approvals/engine/approval-engine.service';
import { ruleResolverService } from '../src/modules/approvals/engine/rule-resolver.service';
import { thresholdService } from '../src/modules/approvals/engine/threshold.service';
import { segregationService } from '../src/modules/approvals/engine/segregation.service';
import { delegationService } from '../src/modules/approvals/engine/delegation.service';
import { escalationService } from '../src/modules/approvals/engine/escalation.service';
import { executionService } from '../src/modules/approvals/engine/execution.service';
import { SecurityService } from '../src/modules/security/security.service';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (detail) console.error(`     Detalhe: ${detail}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.7 — MOTOR CENTRAL DE APROVAÇÕES');
  console.log('================================================================\n');

  // Inicializa banco de dados em memória e sementes
  await runSeed();

  const userSuperAdmin = {
    id: 'usr_superadmin',
    name: 'Vinicius Casagrande (Admin Geral)',
    email: 'admin@diskingressos.com.br',
    roles: ['ADMINISTRADOR_GERAL'],
    isSuperAdmin: true
  };

  const userFinMaria = {
    id: 'usr_fin_maria',
    name: 'Maria Santos',
    email: 'maria.santos@disk.com.br',
    roles: ['FINANCEIRO']
  };

  const userFinCarlos = {
    id: 'usr_fin_carlos',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@disk.com.br',
    roles: ['FINANCEIRO']
  };

  const userEstornoLucas = {
    id: 'usr_est_lucas',
    name: 'Lucas Pereira',
    email: 'lucas.pereira@disk.com.br',
    roles: ['ESTORNO']
  };

  // Seed Lucas com perfil ESTORNO no banco
  const roleEstorno = await prisma.role.findUnique({ where: { code: 'ESTORNO' } });
  if (roleEstorno) {
    await prisma.user.create({
      data: {
        id: 'usr_est_lucas',
        name: 'Lucas Pereira (Estorno)',
        email: 'lucas.pereira@disk.com.br',
        status: 'ACTIVE',
        isSuperAdmin: false
      }
    });
    await prisma.userRole.create({
      data: { userId: 'usr_est_lucas', roleId: roleEstorno.id }
    });
  }

  const userProdRoberto = {
    id: 'usr_prod_opus',
    name: 'Roberto Opus',
    email: 'roberto@opus.com.br',
    roles: ['PRODUTOR'],
    producerAccesses: [{ producerId: 'prd_100' }]
  };

  // Seed user delegations & specific rules for testing if needed
  // -------------------------------------------------------------
  console.log('--- 1. RESOLUÇÃO HIERÁRQUICA DE REGRAS (EVENTO -> PRODUTOR -> GLOBAL) ---');

  // Criar regra específica de evento para o teste 1
  await prisma.approvalRule.create({
    data: {
      id: 'rule_event_specific_test',
      code: 'RULE_EVENT_SPECIFIC_TEST',
      name: 'Regra Específica de Evento',
      operation: 'FINANCE_TRANSFER',
      producerId: 'prd_100',
      eventId: 'evt_rock_rio',
      minAmount: 0,
      maxAmount: 1000000,
      approvalsRequired: 2,
      isSequential: false,
      allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
      isActive: true
    }
  });

  const resEvent = await ruleResolverService.resolveRule('FINANCE_TRANSFER', 5000, 'prd_100', 'evt_rock_rio');
  assert(
    resEvent?.scopeLevel === 'EVENT' && resEvent?.rule.code === 'RULE_EVENT_SPECIFIC_TEST',
    'Critério 1: Resolução por evento (EVENT) tem maior precedência que produtor e global'
  );

  const resProducer = await ruleResolverService.resolveRule('FINANCE_TRANSFER', 75000, 'prd_100', null);
  assert(
    resProducer?.scopeLevel === 'PRODUCER' && resProducer?.rule.code === 'RULE_OPUS_TRANSFER_SPECIAL',
    'Critério 2: Resolução por produtor (PRODUCER) tem precedência sobre regra global'
  );

  const resGlobal = await ruleResolverService.resolveRule('FINANCE_TRANSFER', 5000, 'prd_other', null);
  assert(
    resGlobal?.scopeLevel === 'GLOBAL' && resGlobal?.rule.code === 'RULE_FIN_TRANSFER_TIER_1',
    'Critério 3: Resolução por regra global (GLOBAL) é selecionada na ausência de regras específicas'
  );

  // -------------------------------------------------------------
  console.log('\n--- 2. FAIXAS DE VALOR E NÚMERO DE APROVAÇÕES NECESSÁRIAS ---');

  const simTier1 = await approvalEngineService.simulateRule({
    operation: 'FINANCE_TRANSFER',
    amount: 5000
  });
  assert(
    simTier1.stepsRequired === 1 && simTier1.matchedRule?.code === 'RULE_FIN_TRANSFER_TIER_1',
    'Critério 4: Operação financeira de valor baixo (Tier 1 <= 10.000) requer 1 aprovação'
  );

  const simTier2 = await approvalEngineService.simulateRule({
    operation: 'FINANCE_TRANSFER',
    amount: 25000
  });
  assert(
    simTier2.stepsRequired === 2 && simTier2.matchedRule?.code === 'RULE_FIN_TRANSFER_TIER_2',
    'Critério 5: Operação financeira de valor médio (Tier 2 10.000,01 a 50.000) requer 2 aprovações'
  );

  const simTier3 = await approvalEngineService.simulateRule({
    operation: 'FINANCE_TRANSFER',
    amount: 250000
  });
  assert(
    simTier3.stepsRequired === 2 && simTier3.requireStepUp === true,
    'Critério 6: Operação financeira de alto valor (Tier 3 > 50.000 / >= 200.000) requer 2 aprovações e Step-Up'
  );

  // -------------------------------------------------------------
  console.log('\n--- 3. SEGREGAÇÃO DE FUNÇÕES: MAKER-CHECKER (SOLICITANTE ≠ APROVADOR) ---');

  const reqMakerChecker = await approvalEngineService.createRequest(userFinCarlos, {
    operation: 'FINANCE_TRANSFER',
    title: 'Transferência Fornecedor Som',
    amount: 5000
  });

  let selfApprovalBlocked = false;
  try {
    await approvalEngineService.approveStep(reqMakerChecker.id, userFinCarlos, {});
  } catch (err: any) {
    if (err.code === 'SOLICITANTE_NAO_PODE_APROVAR' || err.statusCode === 403) {
      selfApprovalBlocked = true;
    }
  }
  assert(
    selfApprovalBlocked,
    'Critério 7: Solicitante é estritamente proibido de aprovar a própria solicitação (Maker ≠ Checker)'
  );

  // -------------------------------------------------------------
  console.log('\n--- 4. DUPLA VALIDAÇÃO: CHECKER 1 ≠ CHECKER 2 ---');

  const reqDual = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'FINANCE_TRANSFER',
    title: 'Pagamento Iluminação Palco',
    amount: 20000
  });

  // Maria aprova a primeira etapa
  await approvalEngineService.approveStep(reqDual.id, userFinMaria, { comment: 'Primeira aprovação OK' });

  // Maria tenta aprovar a segunda etapa da mesma solicitação
  let sameApproverBlocked = false;
  try {
    await approvalEngineService.approveStep(reqDual.id, userFinMaria, { comment: 'Segunda aprovação OK' });
  } catch (err: any) {
    if (err.code === 'MESMO_APROVADOR_NAO_PODE_REPETIR' || err.statusCode === 403) {
      sameApproverBlocked = true;
    }
  }
  assert(
    sameApproverBlocked,
    'Critério 8: Dupla Validação: O mesmo usuário não pode realizar a 2ª aprovação (Aprovador 1 ≠ Aprovador 2)'
  );

  // -------------------------------------------------------------
  console.log('\n--- 5. MATRIZ DE ALÇADAS (THRESHOLDS) PESSOAIS E POR PERFIL ---');

  // Carlos tem alçada pessoal de R$ 50.000 em FINANCE_TRANSFER
  // Tenta aprovar solicitação de R$ 80.000
  const reqHighAmount = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'FINANCE_TRANSFER',
    title: 'Cachê Principal Show',
    amount: 80000
  });

  let thresholdBlocked = false;
  try {
    await approvalEngineService.approveStep(reqHighAmount.id, userFinCarlos, {});
  } catch (err: any) {
    if (err.code === 'ALCADA_INSUFICIENTE' || err.statusCode === 403) {
      thresholdBlocked = true;
    }
  }
  assert(
    thresholdBlocked,
    'Critério 9: Usuário com alçada insuficiente tem aprovação barrada (ALCADA_INSUFICIENTE, 403)'
  );

  // Maria tem alçada pessoal de R$ 500.000, consegue aprovar os R$ 80.000
  let mariaApproved = false;
  try {
    await approvalEngineService.approveStep(reqHighAmount.id, userFinMaria, { comment: 'Dentro da alçada de Maria' });
    mariaApproved = true;
  } catch (err) {
    mariaApproved = false;
  }
  assert(
    mariaApproved,
    'Critério 10: Usuário com alçada suficiente aprova com sucesso'
  );

  // Usuário de Estorno (Lucas) herdando alçada de R$ 50.000 do perfil ESTORNO
  const reqRefund = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno Lote Cancelado',
    amount: 500
  });
  let lucasApproved = false;
  try {
    await approvalEngineService.approveStep(reqRefund.id, userEstornoLucas, { comment: 'Estorno verificado' });
    lucasApproved = true;
  } catch (err) {
    lucasApproved = false;
  }
  assert(
    lucasApproved,
    'Critério 11: Usuário sem alçada pessoal herda o limite configurado para o seu perfil'
  );

  // Super Admin possui alçada ilimitada
  const threshAdmin = await thresholdService.validateThreshold(userSuperAdmin.id, 'FINANCE_TRANSFER', 10000000);
  assert(
    threshAdmin.allowed && threshAdmin.maxLimit === Infinity,
    'Critério 12: Super Administrador possui alçada ilimitada por governança universal'
  );

  // -------------------------------------------------------------
  console.log('\n--- 6. REAUTENTICAÇÃO STEP-UP / 2FA PARA OPERAÇÕES CRÍTICAS ---');

  const reqStepUp = await approvalEngineService.createRequest(userFinMaria, {
    operation: 'ADMIN_PERMISSION_CHANGE',
    title: 'Elevação de Privilégios de Segurança'
  });

  let stepUpMissingBlocked = false;
  try {
    await approvalEngineService.approveStep(reqStepUp.id, userSuperAdmin, {});
  } catch (err: any) {
    if (err.code === 'STEP_UP_REQUIRED' || err.statusCode === 403) {
      stepUpMissingBlocked = true;
    }
  }
  assert(
    stepUpMissingBlocked,
    'Critério 13: Operação crítica exige Step-Up; chamada sem token é barrada com 403 STEP_UP_REQUIRED'
  );

  // Com token inválido
  let stepUpInvalidBlocked = false;
  try {
    await approvalEngineService.approveStep(reqStepUp.id, userSuperAdmin, { stepUpToken: 'token_falso_123' });
  } catch (err: any) {
    if (err.code === 'STEP_UP_EXPIRED' || err.statusCode === 403) {
      stepUpInvalidBlocked = true;
    }
  }
  assert(
    stepUpInvalidBlocked,
    'Critério 14: Token de Step-Up inválido ou expirado é rejeitado'
  );

  // Com token válido
  const validStepUpToken = SecurityService.issueStepUpToken(userSuperAdmin.id, 5);
  let stepUpSuccess = false;
  try {
    await approvalEngineService.approveStep(reqStepUp.id, userSuperAdmin, { stepUpToken: validStepUpToken });
    stepUpSuccess = true;
  } catch (err) {
    stepUpSuccess = false;
  }
  assert(
    stepUpSuccess,
    'Critério 15: Token de Step-Up válido autoriza aprovação de etapa crítica com sucesso'
  );

  // -------------------------------------------------------------
  console.log('\n--- 7. IMUTABILIDADE E SNAPSHOT DE POLÍTICAS ---');

  const reqSnapshot = await approvalEngineService.createRequest(userFinCarlos, {
    operation: 'FINANCE_TRANSFER',
    title: 'Teste de Snapshot Imutável',
    amount: 5000
  });
  assert(
    !!reqSnapshot.policySnapshot && reqSnapshot.ruleVersion >= 1,
    'Critério 16: Criação da solicitação captura snapshot imutável da regra (policySnapshot)'
  );

  // Modifica a regra no banco após a criação da solicitação
  await prisma.approvalRule.update({
    where: { id: reqSnapshot.ruleId },
    data: { approvalsRequired: 99 }
  });

  // A solicitação original ainda segue o snapshot original (1 aprovação)
  const reqSnapshotReload = await approvalEngineService.getDetails(reqSnapshot.id, userFinCarlos);
  assert(
    reqSnapshotReload.approvalsRequired === 1,
    'Critério 17: Alterações posteriores na regra não alteram retroativamente solicitações abertas'
  );

  // Restaura a regra padrão para os próximos testes
  await prisma.approvalRule.update({
    where: { id: reqSnapshot.ruleId },
    data: { approvalsRequired: 1 }
  });

  // -------------------------------------------------------------
  console.log('\n--- 8. FLUXO SEQUENCIAL VS PARALELO ---');

  // Sequential payout rule (RULE_SEQUENTIAL_PAYOUT)
  const reqSeq = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'FINANCE_PAYOUT',
    title: 'Repasse Bilheteria Sequencial',
    amount: 15000
  });
  assert(
    reqSeq.steps[0].status === 'IN_PROGRESS' && reqSeq.steps[1].status === 'PENDING',
    'Critério 18: Fluxo sequencial: Etapa 1 inicia IN_PROGRESS e Etapa 2 aguarda como PENDING'
  );

  // Parallel rule (RULE_REFUND_TIER_2)
  const reqPar = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno Paralelo',
    amount: 2500
  });
  assert(
    reqPar.steps[0].status === 'IN_PROGRESS' && reqPar.steps[1].status === 'IN_PROGRESS',
    'Critério 19: Fluxo paralelo: Ambas as etapas iniciam simultaneamente como IN_PROGRESS'
  );

  // -------------------------------------------------------------
  console.log('\n--- 9. REJEIÇÃO, AJUSTES E CANCELAMENTO ---');

  const reqToReject = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno a Rejeitar',
    amount: 500
  });

  let reasonRequiredBlocked = false;
  try {
    await approvalEngineService.rejectRequest(reqToReject.id, userEstornoLucas, { reason: '' });
  } catch (err: any) {
    if (err.code === 'MOTIVO_OBRIGATORIO') reasonRequiredBlocked = true;
  }
  assert(
    reasonRequiredBlocked,
    'Critério 20: Motivo da rejeição é estritamente obrigatório (MOTIVO_OBRIGATORIO)'
  );

  const rejected = await approvalEngineService.rejectRequest(reqToReject.id, userEstornoLucas, {
    reason: 'Comprovante ilegível'
  });
  assert(
    rejected.status === 'REJECTED',
    'Critério 21: Rejeição encerra a solicitação com status REJECTED'
  );

  const reqChanges = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno com Ajuste',
    amount: 300
  });
  const changed = await approvalEngineService.requestChanges(reqChanges.id, userEstornoLucas, {
    comment: 'Favor anexar extrato bancário'
  });
  assert(
    changed.status === 'ACTION_REQUIRED',
    'Critério 22: Pedido de alterações define status ACTION_REQUIRED'
  );

  const reqCancel = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno Desistido',
    amount: 100
  });
  const cancelled = await approvalEngineService.cancelRequest(reqCancel.id, userProdRoberto, 'Desistência do cliente');
  assert(
    cancelled.status === 'CANCELLED',
    'Critério 23: Solicitante pode cancelar sua própria solicitação (status CANCELLED)'
  );

  let unauthCancelBlocked = false;
  const reqCancel2 = await approvalEngineService.createRequest(userProdRoberto, {
    operation: 'REFUND_REQUEST',
    title: 'Estorno Não Autorizado a Cancelar',
    amount: 100
  });
  try {
    await approvalEngineService.cancelRequest(reqCancel2.id, userFinCarlos, 'Tentativa indevida');
  } catch (err: any) {
    if (err.statusCode === 403 || err.code === 'NAO_AUTORIZADO') unauthCancelBlocked = true;
  }
  assert(
    unauthCancelBlocked,
    'Critério 24: Cancelamento por usuário não autorizado é barrado com 403'
  );

  // -------------------------------------------------------------
  console.log('\n--- 10. SEPARAÇÃO ENTRE APROVAÇÃO E EXECUÇÃO + IDEMPOTÊNCIA ---');

  // Cria solicitação e aprova
  const reqToExec = await approvalEngineService.createRequest(userFinCarlos, {
    operation: 'FINANCE_TRANSFER',
    title: 'Transferência para Execução',
    amount: 8000
  });
  await approvalEngineService.approveStep(reqToExec.id, userFinMaria, { comment: 'Aprovado para execução' });

  const execResult1 = await executionService.executeApprovedRequest(reqToExec.id, userFinMaria.id, 'IDEMPOTENCY_KEY_123');
  assert(
    execResult1.success && execResult1.resultData?.transferExecuted === true,
    'Critério 25: Execução desacoplada realiza a operação bancária com sucesso'
  );

  const execResult2 = await executionService.executeApprovedRequest(reqToExec.id, userFinMaria.id, 'IDEMPOTENCY_KEY_123');
  assert(
    execResult2.executionId === execResult1.executionId,
    'Critério 26: Idempotência: Mesma idempotencyKey retorna resultado idêntico sem reexecutar'
  );

  // Falha na execução externa
  const reqFailExec = await approvalEngineService.createRequest(userFinCarlos, {
    operation: 'FINANCE_TRANSFER',
    title: 'Transferência com Falha Externa',
    amount: 7000,
    payload: { simulateExecutionFailure: true }
  });
  await approvalEngineService.approveStep(reqFailExec.id, userFinMaria, { comment: 'Aprovado' });
  const execFailResult = await executionService.executeApprovedRequest(reqFailExec.id, userFinMaria.id, 'KEY_FAIL_01');
  const reloadedReqFail = await approvalEngineService.getDetails(reqFailExec.id, userFinCarlos);

  assert(
    execFailResult.success === false && reloadedReqFail.status === 'APPROVED' && reloadedReqFail.executionStatus === 'FAILED',
    'Critério 27: Falha externa registra FAILED na execução sem corromper o status APPROVED da governança'
  );

  // -------------------------------------------------------------
  console.log('\n--- 11. POLÍTICAS DE DOMÍNIO E DOCUMENTAÇÃO OBRIGATÓRIA ---');

  let missingDocBlocked = false;
  try {
    await approvalEngineService.createRequest(userProdRoberto, {
      operation: 'FINANCE_ADVANCE',
      title: 'Antecipação Sem Contrato',
      amount: 50000
    });
  } catch (err: any) {
    if (err.code === 'POLICY_VALIDATION_ERROR') missingDocBlocked = true;
  }
  assert(
    missingDocBlocked,
    'Critério 28: Política de Antecipação bloqueia criação se documentos obrigatórios não forem anexados'
  );

  // -------------------------------------------------------------
  console.log('\n--- 12. DELEGAÇÃO TEMPORÁRIA DE ALÇADA ---');

  // Carlos delega sua alçada temporariamente para Lucas por 3 dias
  const startDate = new Date(Date.now() - 3600000); // 1 hora atrás
  const endDate = new Date(Date.now() + 3 * 86400000); // 3 dias à frente

  const delegation = await delegationService.createDelegation(userFinCarlos.id, {
    delegatedToId: userEstornoLucas.id,
    startDate,
    endDate,
    operation: 'FINANCE_TRANSFER',
    reason: 'Cobertura de férias'
  });

  const delegatorsForLucas = await delegationService.getActiveDelegatorsForUser(userEstornoLucas.id, 'FINANCE_TRANSFER');
  assert(
    delegatorsForLucas.includes(userFinCarlos.id),
    'Critério 29: Delegação ativa identifica delegante durante o período de vigência'
  );

  // Revoga a delegação
  await delegationService.revokeDelegation(userFinCarlos.id, delegation.id);
  const delegatorsAfterRevoke = await delegationService.getActiveDelegatorsForUser(userEstornoLucas.id, 'FINANCE_TRANSFER');
  assert(
    !delegatorsAfterRevoke.includes(userFinCarlos.id),
    'Critério 30: Delegação revogada/expirada cessa os poderes de aprovação imediatamente'
  );

  // -------------------------------------------------------------
  console.log('\n--- 13. MONITORAMENTO DE SLA E ESCALONAMENTO ---');

  const slaCheck = await escalationService.checkSlaExpirations();
  assert(
    slaCheck !== null && typeof slaCheck.checked === 'number',
    'Critério 31: Serviço de Escalonamento varre solicitações ativas e verifica cumprimento de SLA'
  );

  // -------------------------------------------------------------
  console.log('\n--- 14. SIMULADOR DE REGRAS ---');

  const simResult = await approvalEngineService.simulateRule({
    operation: 'REFUND_REQUEST',
    amount: 500
  });
  assert(
    simResult.matchedRule?.scopeLevel === 'GLOBAL' && simResult.stepsRequired === 1 && simResult.eligibleRoles.includes('ESTORNO'),
    'Critério 32: Simulador de regras retorna escopo, passos e perfis elegíveis com precisão'
  );

  // -------------------------------------------------------------
  console.log('\n--- 15. CAIXA DE ENTRADA (INBOX) E ISOLAMENTO DE ACESSO ---');

  // Cria uma solicitação onde Carlos é o solicitante
  const reqInboxTest = await approvalEngineService.createRequest(userFinCarlos, {
    operation: 'FINANCE_TRANSFER',
    title: 'Transferência Visibilidade Inbox',
    amount: 5000
  });

  const inboxCarlos = await approvalEngineService.getInbox(userFinCarlos);
  const containsOwnRequest = inboxCarlos.some((item: any) => item.id === reqInboxTest.id);

  const inboxMaria = await approvalEngineService.getInbox(userFinMaria);
  const mariaCanSeeRequest = inboxMaria.some((item: any) => item.id === reqInboxTest.id);

  assert(
    !containsOwnRequest && mariaCanSeeRequest,
    'Critério 33: Caixa de Entrada (Inbox) filtra pedidos do próprio solicitante e exibe para aprovador elegível'
  );

  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM`);
  if (passedTests === totalTests) {
    console.log('TODOS OS 33 CRITÉRIOS DE ACEITE DA FASE 1.1.5.7 FORAM ATENDIDOS COM SUCESSO!');
  } else {
    console.error(`ALERTA: ${totalTests - passedTests} TESTES FALHARAM!`);
  }
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Erro catastrófico na execução dos testes:', err);
  process.exit(1);
});
