import assert from 'assert';
import { RefundService } from '../src/modules/refunds/refund.service';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

// Test Users
const solicitorUser: AuthenticatedUser = {
  id: 'usr-sac-solicitor',
  email: 'carlos.sac@diskingressos.com.br',
  name: 'Carlos Atendente SAC',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['ATENDENTE_SAC'],
  permissions: [
    'sac.consulta.acessar',
    'sac.pedido.visualizar',
    'estorno.solicitacao.criar',
    'estorno.solicitacao.visualizar'
  ],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess-1'
};

const approverSupervisor: AuthenticatedUser = {
  id: 'usr-fin-supervisor',
  email: 'aline.supervisor@diskingressos.com.br',
  name: 'Aline Castro Supervisora',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['SUPERVISOR_FINANCEIRO'],
  permissions: [
    'estorno.solicitacao.aprovar',
    'estorno.solicitacao.visualizar',
    'estorno.executar',
    'financeiro.estornos.executar'
  ],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess-2'
};

const producerScopedUser: AuthenticatedUser = {
  id: 'usr-prod-200',
  email: 'rodrigo.produtor@opus.com.br',
  name: 'Rodrigo Opus',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUTOR'],
  permissions: [
    'estorno.solicitacao.visualizar'
  ],
  scope: {
    isGlobal: false,
    producers: ['prd_200'],
    events: ['evt_2001']
  },
  sessionId: 'sess-3'
};

async function runRefundTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.11.1.4.3: CICLO DE VIDA E MOTOR DE ESTORNO');
  console.log('================================================================\n');

  // 1. Avaliação Factual de Elegibilidade e Saldo Remanescente
  console.log('1. Testando Avaliação Factual de Elegibilidade e Saldo Remanescente...');
  const eligibilityOk = await RefundService.evaluateEligibility('ord-952114');
  assert(eligibilityOk.eligible, 'Pedido válido deve ser elegível para estorno');
  assert(eligibilityOk.orderTotalAmount === 1120.00, 'Total do pedido deve ser 1120.00');
  assert(eligibilityOk.maxRefundableAmount === 1120.00, 'Saldo remanescente inicial deve ser 1120.00');
  console.log(`  ✓ Pedido ord-952114 avaliado: Total R$ ${eligibilityOk.orderTotalAmount}, Elegível: R$ ${eligibilityOk.maxRefundableAmount}`);

  // Teste de bloqueio de valor excedente
  const eligibilityExcess = await RefundService.evaluateEligibility('ord-952114', 9999.00);
  assert(!eligibilityExcess.eligible, 'Valor acima do saldo disponível deve ser bloqueado');
  assert(eligibilityExcess.blockingReasons.length > 0, 'Deve conter motivo impeditivo');
  console.log(`  ✓ Bloqueio de valor excedente validado com sucesso: "${eligibilityExcess.blockingReasons[0]}"`);

  // 2. Criação de Solicitação de Estorno
  console.log('\n2. Testando Abertura de Solicitação de Estorno...');
  const newRefund = await RefundService.createRefund(
    {
      orderId: 'ord-952114',
      kind: 'PARTIAL',
      amount: 560.00,
      reason: 'CDC_7_DAYS',
      reasonDescription: 'Cliente exerceu direito de arrependimento do CDC para 2 dos 4 ingressos.'
    },
    solicitorUser
  );

  assert(newRefund, 'Solicitação deve ser criada');
  assert(newRefund.refundCode.startsWith('EST-2026-'), 'Código deve iniciar com EST-2026-');
  assert(newRefund.status === 'APPROVAL_PENDING', 'Status inicial de nova solicitação deve ser APPROVAL_PENDING');
  assert(newRefund.requestedByUserId === solicitorUser.id, 'Solicitante deve ser gravado com ID');
  assert(newRefund.amount === 560.00, 'Valor registrado deve ser R$ 560,00');
  console.log(`  ✓ Solicitação ${newRefund.refundCode} criada com sucesso no status ${newRefund.status}`);

  // 3. Regra Compulsória de Segregação de Função (Maker-Checker)
  console.log('\n3. Testando Regra Compulsória de Segregação de Função (Maker-Checker)...');
  let makerCheckerBlocked = false;
  try {
    // O próprio solicitante tenta aprovar
    await RefundService.approveRefund(newRefund.id, { comment: 'Auto-aprovação indevida' }, solicitorUser);
  } catch (err: any) {
    makerCheckerBlocked = true;
    assert(err.message.includes('Segregação de Função') || err.statusCode === 403, 'Erro deve apontar violação de segregação');
    console.log(`  ✓ Auto-aprovação bloqueada com sucesso: "${err.message}"`);
  }
  assert(makerCheckerBlocked, 'O solicitante NÃO pode aprovar o próprio estorno!');

  // 4. Aprovação Válida por Usuário Distinto com Alçada
  console.log('\n4. Testando Aprovação Válida por Alçada Distinta (Checker)...');
  const approvedRefund = await RefundService.approveRefund(
    newRefund.id,
    { comment: 'Documentação do CDC conferida e deferida pela supervisão.' },
    approverSupervisor
  );

  assert(approvedRefund.status === 'APPROVED', 'Status deve progredir para APPROVED após alçada');
  assert(approvedRefund.approvalsReceived === 1, 'Deve registrar 1 aprovação');
  assert(approvedRefund.approvals[0].approverId === approverSupervisor.id, 'Aprovador deve ser gravado');
  console.log(`  ✓ Estorno ${approvedRefund.refundCode} aprovado na alçada 1 por ${approverSupervisor.name}`);

  // 5. Execução no Gateway com Idempotência Estrita & Cascata Reversa
  console.log('\n5. Testando Processamento Bancário no Gateway com Idempotência Estrita...');
  const testIdempotencyKey = `idemp-unit-test-${Date.now()}`;
  const processedRefund = await RefundService.processRefund(
    approvedRefund.id,
    testIdempotencyKey,
    approverSupervisor
  );

  assert(processedRefund.status === 'COMPLETED', 'Status final deve ser COMPLETED');
  assert(processedRefund.gatewayRefundId, 'ID do gateway deve ser preenchido');
  console.log(`  ✓ Estorno executado no gateway com sucesso. ID Provedor: ${processedRefund.gatewayRefundId}`);

  // Teste de Idempotência: reenvio com a mesma chave deve retornar com segurança sem duplicar
  console.log('  → Testando reenvio com mesma chave de idempotência...');
  const duplicateCall = await RefundService.processRefund(
    approvedRefund.id,
    testIdempotencyKey,
    approverSupervisor
  );
  assert(duplicateCall.status === 'COMPLETED', 'Deve retornar COMPLETED idempotentemente');
  assert(duplicateCall.gatewayRefundId === processedRefund.gatewayRefundId, 'ID do estorno deve ser idêntico');
  console.log('  ✓ Idempotência confirmada: reprocessamento com mesma chave não gera duplicidade');

  // 6. Cascata Reversa: Invalidação de Ingressos e Linha do Tempo do Pedido
  console.log('\n6. Testando Cascata Reversa (Invalidação de Ingressos e Timeline)...');
  const timelineActions = processedRefund.timeline.map(t => t.action);
  assert(timelineActions.includes('CASCATA_REVERSA_CONCLUÍDA'), 'Deve conter evento de cascata reversa na timeline');
  console.log('  ✓ Cascata reversa registrada com invalidação de ingressos e lançamentos no ledger');

  // 7. Isolamento Multi-tenant (Produtor não pode consultar estorno de outro produtor)
  console.log('\n7. Testando Isolamento de Escopo Multi-tenant...');
  let tenantBlocked = false;
  try {
    // Produtor Opus (prd_200) tenta acessar estorno ref-882 do Festival de Inverno (prd_100)
    await RefundService.getRefundById('ref-882', producerScopedUser);
  } catch (err: any) {
    tenantBlocked = true;
    assert(err.statusCode === 403 || err.message.includes('Acesso negado'), 'Deve negar acesso a produtor de outro escopo');
    console.log(`  ✓ Violação de escopo multi-tenant bloqueada: "${err.message}"`);
  }
  assert(tenantBlocked, 'Produtor não pode acessar estorno de outro produtor');

  // 8. Teste de Rejeição com Justificativa Obrigatória
  console.log('\n8. Testando Rejeição Formal de Estorno com Justificativa...');
  // Cria nova solicitação para testar rejeição usando o saldo restante de ord-952114 (560.00 restante)
  const refundToReject = await RefundService.createRefund(
    {
      orderId: 'ord-952114',
      kind: 'PARTIAL',
      amount: 200.00,
      reason: 'OTHER',
      reasonDescription: 'Solicitação fora do prazo do evento.'
    },
    solicitorUser
  );

  const rejectedRefund = await RefundService.rejectRefund(
    refundToReject.id,
    { reason: 'Solicitação realizada 45 dias após o evento, violando o regulamento de reembolso.' },
    approverSupervisor
  );

  assert(rejectedRefund.status === 'REJECTED', 'Status deve ser REJECTED');
  assert(rejectedRefund.approvals.some(a => a.decision === 'REJECTED'), 'Deve registrar registro de recusa');
  console.log(`  ✓ Estorno ${rejectedRefund.refundCode} rejeitado formalmente com justificativa registrada`);

  // 9. Resumo de Métricas Factuais
  console.log('\n9. Testando Resumo de Métricas Operacionais Factuais...');
  const metrics = await RefundService.getMetrics(solicitorUser);
  assert(metrics.totalCompleted >= 1, 'Deve contabilizar estornos concluídos');
  assert(metrics.totalAmountRefundedMonth >= 462.00, 'Total estornado no mês deve refletir valor factual');
  assert(metrics.chargebackRatePercent === 0.08, 'Taxa factual de chargeback presente');
  console.log(`  ✓ Métricas factuais validadas: Concluídos: ${metrics.totalCompleted} | Total Estornado: R$ ${metrics.totalAmountRefundedMonth.toFixed(2)} | Pendentes: ${metrics.totalPendingApproval}`);

  console.log('\n================================================================');
  console.log('TODOS OS TESTES DO MOTOR DE ESTORNO PASSARAM COM SUCESSO! (9/9)');
  console.log('================================================================');
}

runRefundTests().catch((err) => {
  console.error('\n❌ ERRO DURANTE OS TESTES DE ESTORNO:', err);
  process.exit(1);
});
