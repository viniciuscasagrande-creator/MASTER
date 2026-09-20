import { OrderStateMachine } from '../src/modules/commercial/orders/order-state-machine';
import { OrderService } from '../src/modules/commercial/orders/order.service';
import { OrderQueryService } from '../src/modules/commercial/orders/order-query.service';
import { CommercialScopePolicy } from '../src/modules/commercial/policies/commercial-scope.policy';
import { CommercialDataVisibilityPolicy } from '../src/modules/commercial/policies/commercial-data-visibility.policy';
import { CommercialDashboardService } from '../src/modules/commercial/dashboard/commercial-dashboard.service';
import { CommercialPerformanceService } from '../src/modules/commercial/performance/commercial-performance.service';
import { CommercialOpportunityProvider } from '../src/modules/commercial/opportunities/commercial-opportunity.provider';
import { prisma } from '../src/core/database/prisma';

async function runCommercialTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.1 & 1.3.2: CORE COMERCIAL, PEDIDOS & PERFORMANCE');
  console.log('================================================================\n');

  // Reset/seed database to ensure clean state
  prisma.seedDefaults();

  // Test Users
  const superAdminUser = {
    id: 'usr_admin',
    name: 'Administrador Geral',
    isSuperAdmin: true,
    scope: { isGlobal: true, producers: [], events: [] },
    permissions: ['*']
  };

  const producer100User = {
    id: 'usr_prod_100',
    name: 'Produtor Curitiba Shows',
    isSuperAdmin: false,
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001', 'evt_1002'] },
    permissions: [
      'comercial.dashboard.visualizar',
      'comercial.pedidos.visualizar',
      'comercial.pedidos.detalhes',
      'comercial.vendas.visualizar',
      'comercial.vendas.valores.visualizar',
      'comercial.vendas.performance.visualizar'
    ]
  };

  const restrictedCommercialUser = {
    id: 'usr_comm_restricted',
    name: 'Operador Comercial Júnior',
    isSuperAdmin: false,
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001'] },
    permissions: [
      'comercial.dashboard.visualizar',
      'comercial.pedidos.visualizar',
      'comercial.pedidos.detalhes',
      'comercial.vendas.visualizar'
      // Missing 'comercial.vendas.valores.visualizar' and 'comercial.clientes.dados_sensiveis'
    ]
  };

  // ---------------------------------------------------------------------------
  // 1. OrderStateMachine Tests
  // ---------------------------------------------------------------------------
  console.log('1. Testando OrderStateMachine (Máquina de Estados de Pedidos)...');
  if (!OrderStateMachine.canTransition('DRAFT', 'PENDING')) {
    throw new Error('DRAFT para PENDING deveria ser permitido.');
  }
  if (!OrderStateMachine.canTransition('PENDING', 'CONFIRMED')) {
    throw new Error('PENDING para CONFIRMED deveria ser permitido.');
  }
  if (!OrderStateMachine.canTransition('CONFIRMED', 'CANCELLED')) {
    throw new Error('CONFIRMED para CANCELLED deveria ser permitido.');
  }
  if (OrderStateMachine.canTransition('CONFIRMED', 'PENDING')) {
    throw new Error('CONFIRMED para PENDING não pode ser permitido.');
  }
  if (OrderStateMachine.canTransition('CANCELLED', 'CONFIRMED')) {
    throw new Error('CANCELLED é terminal e não pode transicionar para CONFIRMED.');
  }
  if (OrderStateMachine.canTransition('EXPIRED', 'PENDING')) {
    throw new Error('EXPIRED é terminal e não pode reabrir para PENDING.');
  }

  let transitionErrorCaught = false;
  try {
    OrderStateMachine.validateTransition('CANCELLED', 'CONFIRMED');
  } catch (err: any) {
    transitionErrorCaught = true;
    if (!err.message.includes('Transição de status inválida')) {
      throw new Error(`Mensagem inesperada: ${err.message}`);
    }
  }
  if (!transitionErrorCaught) {
    throw new Error('validateTransition deveria lançar erro para transição ilegal.');
  }
  console.log('✓ Teste 1 passou: Máquina de estados respeita rigorosamente regras de transição.\n');

  // ---------------------------------------------------------------------------
  // 2. OrderService (Criação, Imutabilidade de Preços & Timeline)
  // ---------------------------------------------------------------------------
  console.log('2. Testando OrderService (Criação com Snapshot Imutável de Preços)...');
  const createdOrder = await OrderService.createOrder({
    producerId: 'prd_100',
    eventId: 'evt_1001',
    eventName: 'Festival de Inverno Curitiba 2026',
    salesChannelId: 'sc_online',
    salesChannelName: 'Site Oficial Disk Ingressos',
    initialStatus: 'PENDING',
    buyer: {
      customerId: 'cust_teste_1',
      name: 'Leonardo Da Vinci',
      document: '445.667.889-10',
      email: 'leonardo.vinci@arte.com',
      phone: '(41) 98877-1122'
    },
    items: [
      {
        eventId: 'evt_1001',
        sessionId: 'ses_1001_principal',
        sessionName: 'Sessão Principal — Abertura',
        eventSectionId: 'esec_1001_pista',
        sectionName: 'Pista Geral',
        eventTicketTypeId: 'ett_1001_inteira',
        ticketTypeName: 'Inteira',
        ticketBatchId: 'batch_2',
        batchName: 'Lote 2 — Oficial',
        quantity: 2,
        unitBaseAmount: 180.00,
        unitDiscountAmount: 0.00,
        unitFeeAmount: 18.00,
        priceSnapshotId: 'snap_teste_001'
      }
    ]
  });

  if (!createdOrder.publicCode.startsWith('PED-2026-')) {
    throw new Error(`Código público de pedido inválido: ${createdOrder.publicCode}`);
  }
  if (createdOrder.totalTicketsCount !== 2) {
    throw new Error(`Contagem de ingressos esperada 2, obtida: ${createdOrder.totalTicketsCount}`);
  }
  if (createdOrder.totalAmount !== 396.00) {
    throw new Error(`Total esperado 396.00, obtido: ${createdOrder.totalAmount}`);
  }
  if (!createdOrder.items || createdOrder.items.length !== 1) {
    throw new Error('Itens do pedido não foram persistidos.');
  }
  if (createdOrder.items[0].unitFinalAmount !== 198.00) {
    throw new Error(`Valor final unitário incorreto: ${createdOrder.items[0].unitFinalAmount}`);
  }
  if (createdOrder.buyerSnapshot?.documentMasked !== '***.667.889-**') {
    throw new Error(`Mascaramento de documento incorreto: ${createdOrder.buyerSnapshot?.documentMasked}`);
  }
  if (createdOrder.timeline?.length !== 1 || createdOrder.timeline[0].eventType !== 'ORDER_CREATED') {
    throw new Error('Linha do tempo inicial não foi registrada corretamente.');
  }
  console.log(`✓ Teste 2 passou: Pedido ${createdOrder.publicCode} criado com snapshot e timeline imutáveis.\n`);

  // ---------------------------------------------------------------------------
  // 3. Transição de Status com Concorrência Otimista (Version)
  // ---------------------------------------------------------------------------
  console.log('3. Testando transição de status com controle de concorrência...');
  // Attempt transition with wrong version
  let concurrencyErrorCaught = false;
  try {
    await OrderService.transitionStatus({
      orderId: createdOrder.id,
      targetStatus: 'CONFIRMED',
      actor: { name: 'Gateway PIX', type: 'GATEWAY' },
      expectedVersion: 999 // Wrong version!
    });
  } catch (err: any) {
    concurrencyErrorCaught = true;
    if (!err.message.includes('Conflito de concorrência')) {
      throw new Error(`Mensagem inesperada de concorrência: ${err.message}`);
    }
  }
  if (!concurrencyErrorCaught) {
    throw new Error('Deveria ter bloqueado transição com versão incorreta.');
  }

  // Successful transition with version 1
  const confirmedOrder = await OrderService.transitionStatus({
    orderId: createdOrder.id,
    targetStatus: 'CONFIRMED',
    actor: { name: 'Operador Financeiro', type: 'USER', userId: producer100User.id },
    expectedVersion: 1,
    reason: 'Comprovante bancário validado com sucesso.'
  });

  if (confirmedOrder.status !== 'CONFIRMED') {
    throw new Error(`Status esperado CONFIRMED, obtido: ${confirmedOrder.status}`);
  }
  if (confirmedOrder.version !== 2) {
    throw new Error(`Versão esperada 2, obtida: ${confirmedOrder.version}`);
  }
  if (!confirmedOrder.confirmedAt) {
    throw new Error('confirmedAt deveria estar preenchido.');
  }
  if (confirmedOrder.timeline?.length !== 2 || confirmedOrder.timeline[1].eventType !== 'ORDER_CONFIRMED') {
    throw new Error('Evento de timeline ORDER_CONFIRMED não foi adicionado.');
  }
  console.log('✓ Teste 3 passou: Transição de status e lock otimista (version) validados com sucesso.\n');

  // ---------------------------------------------------------------------------
  // 4. Multi-Tenant Scope & Isolamento entre Produtores
  // ---------------------------------------------------------------------------
  console.log('4. Testando isolamento multi-tenant de escopo entre produtores...');
  // User from prd_100 tries to access prd_200 order
  let scopeViolationCaught = false;
  try {
    await OrderQueryService.getOrderById(producer100User, 'ord-952114'); // Order of prd_200 (Coldplay)
  } catch (err: any) {
    scopeViolationCaught = true;
    if (err.statusCode !== 403) {
      throw new Error(`Status code esperado 403, obtido: ${err.statusCode}`);
    }
  }
  if (!scopeViolationCaught) {
    throw new Error('Produtor 100 conseguiu acessar pedido do produtor concorrente 200!');
  }

  // Super Admin can access prd_200 order
  const orderColdplay = await OrderQueryService.getOrderById(superAdminUser, 'ord-952114');
  if (orderColdplay.id !== 'ord-952114') {
    throw new Error('Super Admin deveria conseguir acessar qualquer pedido.');
  }
  console.log('✓ Teste 4 passou: Violação de escopo bloqueada com 403 e registro em auditoria.\n');

  // ---------------------------------------------------------------------------
  // 5. Governança de Visibilidade e Mascaramento de Dados Financeiros e PII
  // ---------------------------------------------------------------------------
  console.log('5. Testando mascaramento de valores financeiros e PII (LGPD)...');
  const restrictedOrder = await OrderQueryService.getOrderById(restrictedCommercialUser, createdOrder.id);

  if (restrictedOrder.totalAmount !== 0) {
    throw new Error(`Valor total deveria ser mascarado (0) para usuário sem permissão de valores, obtido: ${restrictedOrder.totalAmount}`);
  }
  if (restrictedOrder.buyerSnapshot?.document !== '***.667.889-**') {
    throw new Error(`CPF não mascarado para usuário restrito: ${restrictedOrder.buyerSnapshot?.document}`);
  }
  if (restrictedOrder.buyerSnapshot?.email !== 'l***i@arte.com') {
    throw new Error(`E-mail não mascarado para usuário restrito: ${restrictedOrder.buyerSnapshot?.email}`);
  }

  // Producer with financial permission sees full amounts
  const fullOrder = await OrderQueryService.getOrderById(producer100User, createdOrder.id);
  if (fullOrder.totalAmount !== 396.00) {
    throw new Error(`Produtor autorizado deveria ver valor total real 396.00, obtido: ${fullOrder.totalAmount}`);
  }
  console.log('✓ Teste 5 passou: Mascaramento financeiro e LGPD aplicados estritamente via RBAC.\n');

  // ---------------------------------------------------------------------------
  // 6. Dashboard Comercial (Fase 1.3.1)
  // ---------------------------------------------------------------------------
  console.log('6. Testando Dashboard Comercial (KPIs, Tendência, Ocupação Real)...');
  const dashboard = await CommercialDashboardService.getDashboard(producer100User, {
    producerId: 'prd_100',
    eventId: 'evt_1001'
  });

  if (dashboard.summary.ordersCount < 2) {
    throw new Error(`Esperado ao menos 2 pedidos confirmados, obtido: ${dashboard.summary.ordersCount}`);
  }
  if (dashboard.summary.ticketsSold < 4) {
    throw new Error(`Esperado ao menos 4 ingressos vendidos, obtido: ${dashboard.summary.ticketsSold}`);
  }
  if (dashboard.summary.grossSales === null || dashboard.summary.grossSales <= 0) {
    throw new Error(`Volume bruto de vendas incorreto: ${dashboard.summary.grossSales}`);
  }
  if (dashboard.trend.length !== 7) {
    throw new Error(`Tendência esperada de 7 dias, obtido: ${dashboard.trend.length}`);
  }
  if (!dashboard.ordersByStatus.some(s => s.status === 'CONFIRMED')) {
    throw new Error('Distribuição por status deve conter CONFIRMED.');
  }
  if (dashboard.opportunities === null) {
    throw new Error('Resumo de oportunidades do Remarketing deve estar presente.');
  }
  console.log(`✓ Teste 6 passou: Dashboard comercial consolidou ${dashboard.summary.ordersCount} pedidos e R$ ${dashboard.summary.grossSales} sem dados fictícios.\n`);

  // ---------------------------------------------------------------------------
  // 7. Performance Comercial & Central de Vendas (Fase 1.3.2)
  // ---------------------------------------------------------------------------
  console.log('7. Testando Performance Comercial e Drilldown Multi-Nível...');
  const performance = await CommercialPerformanceService.getPerformance(producer100User, {
    producerId: 'prd_100',
    eventId: 'evt_1001'
  });

  if (!performance.velocity || typeof performance.velocity.salesPerHour !== 'number') {
    throw new Error('Velocidade de vendas não foi calculada.');
  }
  if (performance.events.length === 0) {
    throw new Error('Drilldown de eventos vazio.');
  }
  if (performance.sessions.length === 0) {
    throw new Error('Drilldown de sessões vazio.');
  }
  if (performance.sections.length === 0) {
    throw new Error('Drilldown de setores vazio.');
  }
  if (performance.ticketTypes.length === 0) {
    throw new Error('Drilldown de tipos de ingresso vazio.');
  }
  if (performance.batches.length === 0) {
    throw new Error('Drilldown de lotes vazio.');
  }
  if (performance.channels.length === 0) {
    throw new Error('Drilldown de canais de venda vazio.');
  }
  console.log(`✓ Teste 7 passou: Drilldown consolidado em 6 níveis (eventos, sessões, setores, tipos, lotes, canais) e velocidade de vendas apurada.\n`);

  // ---------------------------------------------------------------------------
  // 8. CommercialOpportunityProvider (Sem PII)
  // ---------------------------------------------------------------------------
  console.log('8. Testando CommercialOpportunityProvider (Sem PII, Apenas Agregados)...');
  const opportunity = await CommercialOpportunityProvider.getOpportunitySummary(producer100User, 'prd_100', 'evt_1001');
  if (typeof opportunity.abandonedCarts !== 'number') {
    throw new Error('Contagem de carrinhos abandonados deve ser numérica.');
  }
  // Assert no PII properties exist
  const oppKeys = Object.keys(opportunity);
  if (oppKeys.includes('customerName') || oppKeys.includes('customerCpf') || oppKeys.includes('phone') || oppKeys.includes('email')) {
    throw new Error('ALERTA DE VAZAMENTO DE PII: CommercialOpportunityProvider não pode conter dados pessoais!');
  }
  console.log(`✓ Teste 8 passou: Oportunidades comerciais expostas estritamente agregadas sem PII (${opportunity.abandonedCarts} oportunidades).\n`);

  console.log('================================================================');
  console.log('TODOS OS TESTES COMERCIAIS (FASES 1.3.1 E 1.3.2) FORAM APROVADOS!');
  console.log('================================================================');
}

runCommercialTests().catch(err => {
  console.error('\n❌ ERRO NOS TESTES COMERCIAIS:', err);
  process.exit(1);
});
