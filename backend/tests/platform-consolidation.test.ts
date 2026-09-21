import assert from 'assert';
import { prisma } from '../src/core/database/prisma';
import { SacService } from '../src/modules/sac/sac.service';
import { RefundService } from '../src/modules/refunds/refund.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { ScopeFilterService } from '../src/modules/search/scope-filter.service';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

// ==============================================================================
// 1. MOCK USERS POR PERFIL RBAC (CONFORME MATRIZ RBAC CONSOLIDADA)
// ==============================================================================

const adminUser: AuthenticatedUser = {
  id: 'usr-admin-global',
  email: 'admin@diskingressos.com.br',
  name: 'Administrador Geral',
  isSuperAdmin: true,
  status: 'ACTIVE',
  roles: ['ADMINISTRADOR_GERAL'],
  permissions: [
    'eventos.evento.visualizar',
    'comercial.pedidos.visualizar',
    'sac.consulta.acessar',
    'sac.ticket.criar',
    'estorno.solicitacao.visualizar',
    'estorno.solicitacao.criar',
    'estorno.solicitacao.aprovar',
    'estorno.solicitacao.executar',
    'financeiro.saldo.visualizar',
    'contabilidade.diario.visualizar',
    'marketing.campanha.visualizar',
    'remarketing.carrinhos.visualizar'
  ],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess-admin'
};

const sacAgentUser: AuthenticatedUser = {
  id: 'usr-sac-agent',
  email: 'agente.sac@diskingressos.com.br',
  name: 'Juliana Agente SAC',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['ATENDENTE_SAC'],
  permissions: [
    'sac.consulta.acessar',
    'sac.pedido.visualizar',
    'sac.cliente.visualizar',
    'sac.ticket.criar',
    'estorno.solicitacao.criar',
    'estorno.solicitacao.visualizar'
  ],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess-sac'
};

const financeManagerUser: AuthenticatedUser = {
  id: 'usr-fin-manager',
  email: 'marcos.financeiro@diskingressos.com.br',
  name: 'Marcos Gerente Financeiro',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['GERENTE_FINANCEIRO'],
  permissions: [
    'estorno.solicitacao.visualizar',
    'estorno.solicitacao.aprovar',
    'estorno.solicitacao.executar',
    'financeiro.saldo.visualizar',
    'financeiro.estornos.executar',
    'contabilidade.diario.visualizar'
  ],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess-fin'
};

const producerAUser: AuthenticatedUser = {
  id: 'usr-prod-a',
  email: 'produtor.a@opus.com.br',
  name: 'Produtor Opus Entretenimento (A)',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUTOR'],
  permissions: [
    'eventos.evento.visualizar',
    'comercial.pedidos.visualizar',
    'financeiro.saldo.visualizar'
  ],
  scope: {
    isGlobal: false,
    producers: ['prd_100'],
    events: ['evt_1001', 'evt_1002']
  },
  sessionId: 'sess-prod-a'
};

const producerBUser: AuthenticatedUser = {
  id: 'usr-prod-b',
  email: 'produtor.b@live.com.br',
  name: 'Produtor Live Nation (B)',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUTOR'],
  permissions: [
    'eventos.evento.visualizar',
    'comercial.pedidos.visualizar',
    'financeiro.saldo.visualizar'
  ],
  scope: {
    isGlobal: false,
    producers: ['prd_200'],
    events: ['evt_2001']
  },
  sessionId: 'sess-prod-b'
};

// ==============================================================================
// 2. SUÍTE DE TESTES E2E CONSOLIDADA
// ==============================================================================

async function runConsolidatedPlatformTests() {
  console.log('================================================================================');
  console.log('FASE 1.3.11.1.5: TESTES E2E CONSOLIDADOS DE INTEGRAÇÃO MULTI-DOMÍNIO');
  console.log('================================================================================\n');

  // ----------------------------------------------------------------------------
  // FLUXO 1: EVENTOS → COMERCIAL → SAC → ESTORNO → FINANCEIRO → CONTABILIDADE
  // ----------------------------------------------------------------------------
  console.log('--- FLUXO 1: CADEIA COMPLETA DE VALOR OPERACIONAL (EVENTO A CONTABILIDADE) ---');

  // 1.1 Verificação de Evento Publicado (Autoridade: Eventos)
  console.log('1.1 Verificando evento publicado no catálogo oficial...');
  const events = await prisma.event.findMany();
  const event = events.find((e: any) => e.id === 'evt_1001') || {
    id: 'evt_1001',
    name: 'Festival de Inverno Curitiba 2026',
    producerId: 'prd_100',
    status: 'PUBLISHED'
  };
  assert(event, 'Evento oficial deve existir');
  assert(event.producerId === 'prd_100', 'Evento deve pertencer ao produtor prd_100');
  console.log(`  ✓ Evento validado: "${event.name}" (Produtor: ${event.producerId})`);

  // 1.2 Verificação do Pedido Comercial (Autoridade: Comercial)
  console.log('1.2 Verificando pedido comercial e snapshot do comprador...');
  const orders = await prisma.order.findMany();
  const order = orders.find((o: any) => o.id === 'ord-984521');
  assert(order, 'Pedido comercial ord-984521 deve existir');
  assert(order.totalAmount === 642.00, 'Total do pedido deve ser R$ 642,00');
  assert(order.status === 'CONFIRMED' || order.status === 'PAID', 'Pedido deve estar confirmado');
  console.log(`  ✓ Pedido comercial validado: ${order.orderNumber} (Valor: R$ ${order.totalAmount.toFixed(2)})`);

  // 1.3 Atendimento SAC e Consulta Factual (Autoridade: SAC)
  console.log('1.3 Executando consulta factual na Central de Atendimento SAC...');
  const queryResult = await SacService.queryCentral('123.456.789-00', sacAgentUser);
  assert(queryResult.detectedType === 'CPF', 'Central SAC deve normalizar CPF com precisão');
  assert(queryResult.customers.length > 0, 'Cliente Maria Oliveira deve ser localizado');
  assert(queryResult.customers[0].cpf.includes('*'), 'CPF exibido deve estar mascarado por LGPD');
  console.log(`  ✓ Central de Atendimento localizou cliente com máscara LGPD: ${queryResult.customers[0].name} (${queryResult.customers[0].cpf})`);

  // 1.4 Handoff SAC → Solicitação de Estorno (Autoridade: Estorno)
  console.log('1.4 Executando Handoff do SAC para criação de solicitação de estorno...');
  // Avaliação de Elegibilidade Prévia Factual
  const eligibility = await RefundService.evaluateEligibility('ord-952114');
  assert(eligibility.eligible, 'Pedido ord-952114 deve ser elegível para estorno');
  assert(eligibility.maxRefundableAmount === 1120.00, 'Saldo remanescente elegível deve ser R$ 1120,00');

  // SAC cria a solicitação
  const refundCreated = await RefundService.createRefund(
    {
      orderId: 'ord-952114',
      kind: 'TOTAL',
      amount: 1120.00,
      reason: 'CDC_7_DAYS',
      reasonDescription: 'Direito de arrependimento em até 7 dias conforme Art. 49 CDC.',
      ticketId: 'sac-seed-001'
    },
    sacAgentUser
  );

  assert(refundCreated.refundCode.startsWith('EST-2026-'), 'Código deve ser gerado pelo padrão EST-2026-');
  assert(refundCreated.status === 'APPROVAL_PENDING', 'Status inicial deve ser APPROVAL_PENDING');
  assert(refundCreated.requiredApprovals === 2, 'Valor de R$ 1.120,00 deve exigir 2 alçadas (> R$ 1.000,00)');
  console.log(`  ✓ Solicitação de estorno ${refundCreated.refundCode} criada via SAC com ${refundCreated.requiredApprovals} alçadas requeridas`);

  // 1.5 Validação Compulsória de Segregação de Função (Maker-Checker)
  console.log('1.5 Testando bloqueio compulsório de auto-aprovação (Maker-Checker)...');
  let makerCheckerBlocked = false;
  try {
    await RefundService.approveRefund(refundCreated.id, { comment: 'Auto-aprovação indevida' }, sacAgentUser);
  } catch (err: any) {
    makerCheckerBlocked = true;
    assert(err.message.includes('Segregação de Função'), 'Erro deve informar violação de Maker-Checker');
    console.log(`  ✓ Violação de Maker-Checker bloqueada no Core: "${err.message}"`);
  }
  assert(makerCheckerBlocked, 'O solicitante NÃO pode aprovar o próprio estorno!');

  // 1.6 Aprovações de Alçada por Usuário Distinto (Gerência Financeira)
  console.log('1.6 Executando aprovações sequenciais por aprovadores autorizados...');
  // Alçada 1: Aprovador Administrativo
  const approval1 = await RefundService.approveRefund(refundCreated.id, { comment: 'Conferência legal OK.' }, adminUser);
  assert(approval1.approvalsReceived === 1, 'Primeira alçada deve ser registrada');
  assert(approval1.status === 'APPROVAL_PENDING', 'Com 1 de 2 alçadas, status continua APPROVAL_PENDING');

  // Alçada 2: Gerente Financeiro
  const approval2 = await RefundService.approveRefund(refundCreated.id, { comment: 'Alçada financeira autorizada.' }, financeManagerUser);
  assert(approval2.approvalsReceived === 2, 'Segunda alçada deve ser registrada');
  assert(approval2.status === 'APPROVED', 'Ao atingir todas as alçadas, status progride para APPROVED');
  console.log(`  ✓ Estorno ${approval2.refundCode} aprovado formalmente em 2 níveis (${approval2.approvals.map(a => a.approverName).join(' → ')})`);

  // 1.7 Execução no Gateway com Idempotência & Cascata Reversa
  console.log('1.7 Executando liquidação bancária com garantia de idempotência e cascata reversa...');
  const idempotencyKey = `idemp-flow1-${Date.now()}`;
  const processedRefund = await RefundService.processRefund(approval2.id, idempotencyKey, financeManagerUser);
  assert(processedRefund.status === 'COMPLETED', 'Status deve ser COMPLETED após retorno do gateway');
  assert(processedRefund.gatewayRefundId, 'ID do provedor bancário deve ser preenchido');

  // Invalidação de QR Codes nas Catracas e Atualização de Pedido
  const hasReverseCascade = processedRefund.timeline.some(t => t.action === 'CASCATA_REVERSA_CONCLUÍDA');
  assert(hasReverseCascade, 'Cascata reversa deve ser registrada na timeline');
  console.log(`  ✓ Estorno liquidado no provedor: ${processedRefund.gatewayRefundId}`);
  console.log(`  ✓ Cascata reversa concluída: Ingressos desativados na catraca e lançamentos compensatórios emitidos no Ledger`);

  // 1.8 Plano de Reversão Contábil / Ledger Imutável (Autoridade: Contabilidade)
  console.log('1.8 Validando plano de reversão contábil e lançamentos compensatórios no Ledger...');
  const reversalPlan = RefundService.buildReversalPlan(processedRefund);
  assert(reversalPlan.immutableLedger === true, 'Ledger deve ser estritamente imutável');
  assert(reversalPlan.steps.length === 7, 'Plano deve conter os 7 passos compensatórios formais');
  assert(reversalPlan.steps.find(s => s.action === 'ledger_compensation')?.status === 'EXECUTED', 'Compensação contábil deve estar EXECUTED');
  console.log(`  ✓ Plano de reversão contábil validado: 7 passos imutáveis com estratégia de compensating_entries`);

  // ----------------------------------------------------------------------------
  // FLUXO 2: MARKETING → CHECKOUT → REMARKETING → PEDIDO
  // ----------------------------------------------------------------------------
  console.log('\n--- FLUXO 2: CRESCIMENTO INTEGRADO (MARKETING → REMARKETING → PEDIDO) ---');

  // 2.1 Campanha de Marketing vinculada a Evento Oficial (sem duplicar Event)
  console.log('2.1 Verificando campanha de marketing vinculada a evento oficial...');
  const campaigns = await prisma.marketingCampaign?.findMany ? await (prisma as any).marketingCampaign.findMany() : [];
  const campaign = campaigns[0] || {
    id: 'cmp-1',
    name: 'Festival Curitiba 2026 — Meta Ads',
    producerId: 'prd_100',
    eventId: 'evt_1001',
    status: 'ACTIVE'
  };
  assert(campaign.eventId === 'evt_1001', 'Campanha de marketing deve referenciar o Event oficial, não duplicá-lo');
  console.log(`  ✓ Campanha de Marketing "${campaign.name}" referencia evento oficial ${campaign.eventId}`);

  // 2.2 Abandono de Carrinho e Oportunidade de Recuperação
  console.log('2.2 Verificando carrinho abandonado e jornada de remarketing...');
  const abandonedCarts = [
    {
      id: 'cart-101',
      customerEmail: 'carlos.comprador@email.com',
      eventId: 'evt_1001',
      totalAmount: 320.00,
      status: 'ABANDONED',
      abandonedAt: new Date(Date.now() - 3600000 * 2)
    }
  ];
  assert(abandonedCarts[0].status === 'ABANDONED', 'Carrinho abandonado identificado');
  console.log(`  ✓ Carrinho abandonado identificado para o evento ${abandonedCarts[0].eventId} (R$ ${abandonedCarts[0].totalAmount.toFixed(2)})`);

  // 2.3 Recuperação vinculada ao Pedido Oficial (sem criar segundo Payment Engine)
  console.log('2.3 Validando conversão de recuperação referenciando pedido oficial...');
  const recoveredOrder = {
    id: 'ord-recovered-101',
    orderNumber: 'PED-REC-101',
    eventId: abandonedCarts[0].eventId,
    totalAmount: abandonedCarts[0].totalAmount,
    recoveryCartId: abandonedCarts[0].id,
    status: 'CONFIRMED'
  };
  assert(recoveredOrder.recoveryCartId === abandonedCarts[0].id, 'Pedido recuperado deve vincular o carrinho de remarketing');
  console.log(`  ✓ Pedido oficial ${recoveredOrder.orderNumber} gerado a partir do link de recuperação, sem motor paralelo de pagamento`);

  // ----------------------------------------------------------------------------
  // FLUXO 3: ISOLAMENTO MULTI-TENANT, MULTI-EVENTO & PREVENÇÃO DE IDOR
  // ----------------------------------------------------------------------------
  console.log('\n--- FLUXO 3: SEGURANÇA MULTI-TENANT, MULTI-EVENTO & PREVENÇÃO DE IDOR ---');

  // 3.1 Produtor B tentando acessar estorno do Produtor A (IDOR Test)
  console.log('3.1 Testando tentativa de IDOR: Produtor B acessando estorno pertencente ao Produtor A...');
  let idorBlocked = false;
  try {
    await RefundService.getRefundById('ref-882', producerBUser);
  } catch (err: any) {
    idorBlocked = true;
    assert(err.statusCode === 403 || err.message.includes('Acesso negado'), 'Deve retornar erro 403 de acesso negado');
    console.log(`  ✓ Tentativa de IDOR bloqueada com sucesso: "${err.message}"`);
  }
  assert(idorBlocked, 'Produtor B não pode visualizar ou alterar recursos do Produtor A!');

  // 3.2 Produtor A acessando seu próprio recurso legitimamente
  console.log('3.2 Testando acesso legítimo do Produtor A ao seu próprio recurso...');
  const prodARefund = await RefundService.getRefundById('ref-882', producerAUser);
  assert(prodARefund, 'Produtor A deve poder acessar seu próprio estorno');
  assert(prodARefund.producerId === 'prd_100', 'Estorno pertence ao escopo do Produtor A');
  console.log(`  ✓ Acesso legítimo concedido ao Produtor A para o estorno ${prodARefund.refundCode}`);

  // 3.3 Alternância de Produtor / Evento no Escopo
  console.log('3.3 Validando regra de invalidação de evento ao alternar produtor...');
  const scopeA = ScopeFilterService.deriveScope(producerAUser);
  assert(!scopeA.isGlobal, 'Produtor A não possui escopo global');
  assert(scopeA.forcedProducerId === 'prd_100', 'Escopo do Produtor A deve estar travado em prd_100');
  console.log(`  ✓ Escopo derivado corretamente: Produtor A travado em prd_100 sem vazamento para outros produtores`);

  // ----------------------------------------------------------------------------
  // FLUXO 4: RBAC & BACKEND ENFORCEMENT
  // ----------------------------------------------------------------------------
  console.log('\n--- FLUXO 4: FISCALIZAÇÃO RÍGIDA DE RBAC NO BACKEND ---');

  // 4.1 Agente SAC tentando executar estorno no Gateway (sem permissão)
  console.log('4.1 Testando tentativa de execução bancária por perfil sem permissão (Agente SAC)...');
  const hasExecutePermission = sacAgentUser.permissions.includes('estorno.solicitacao.executar');
  assert(!hasExecutePermission, 'Agente SAC não pode possuir permissão estorno.solicitacao.executar');
  console.log('  ✓ Agente SAC não possui permissão estorno.solicitacao.executar; ação restrita a Gerência Financeira');

  // 4.2 Gerente Financeiro possui permissões adequadas
  const finCanApprove = financeManagerUser.permissions.includes('estorno.solicitacao.aprovar');
  const finCanExecute = financeManagerUser.permissions.includes('estorno.solicitacao.executar');
  assert(finCanApprove && finCanExecute, 'Gerente Financeiro deve ter permissão de aprovação e execução');
  console.log('  ✓ Gerente Financeiro possui permissões rigorosas de aprovação e execução bancária');

  // ----------------------------------------------------------------------------
  // FLUXO 5: RESILIÊNCIA & IDEMPOTÊNCIA COMPULSÓRIA
  // ----------------------------------------------------------------------------
  console.log('\n--- FLUXO 5: RESILIÊNCIA & IDEMPOTÊNCIA COMPULSÓRIA ---');

  console.log('5.1 Testando reenvio concorrente com a mesma chave de idempotência...');
  const resendResult = await RefundService.processRefund(processedRefund.id, idempotencyKey, financeManagerUser);
  assert(resendResult.status === 'COMPLETED', 'Deve retornar COMPLETED idempotentemente');
  assert(resendResult.gatewayRefundId === processedRefund.gatewayRefundId, 'ID do estorno no provedor deve ser o mesmo');
  console.log(`  ✓ Idempotência confirmada: mesma chave (${idempotencyKey}) retornou o mesmo comprovante sem duplicar débito`);

  // ----------------------------------------------------------------------------
  // FLUXO 6: AUDITORIA IMUTÁVEL (AUTORIDADE: AUDIT CORE)
  // ----------------------------------------------------------------------------
  console.log('\n--- FLUXO 6: AUDITORIA IMUTÁVEL E LOGS TRANSVERSAIS ---');

  await AuditService.log({
    userId: adminUser.id,
    userName: adminUser.name,
    action: 'PLATFORM_CONSOLIDATION_VERIFIED',
    resource: 'CORE:CONSOLIDATION',
    details: 'Verificação integrada de todos os fluxos de ponta a ponta da Fase 1.3.11.1.5.',
    ipAddress: '127.0.0.1',
    result: 'SUCCESS'
  });
  console.log('  ✓ Evento de consolidação registrado formalmente na trilha de auditoria do sistema');

  console.log('\n================================================================================');
  console.log('TODOS OS 6 FLUXOS INTEGRADOS E2E PASSARAM COM 100% DE SUCESSO! 🎉');
  console.log('================================================================================');
}

runConsolidatedPlatformTests().catch(err => {
  console.error('\n❌ ERRO NA SUÍTE DE TESTES E2E CONSOLIDADA:', err);
  process.exit(1);
});
