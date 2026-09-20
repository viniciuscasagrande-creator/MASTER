import { EventDashboardService } from '../src/modules/events/dashboard/event-dashboard.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.11: DASHBOARD EXECUTIVO E OPERACIONAL');
  console.log('======================================================\n');

  const eventId = 'evt_1001';

  // 1. Consolidação Global do Dashboard (Visão Executiva Completa com RBAC Admin)
  console.log('1. Testando consolidação de métricas reais para visão executiva (Admin)...');
  const dashboardAdmin = await EventDashboardService.getEventDashboard(eventId, {
    viewType: 'EXECUTIVE',
    userPermissions: ['*'],
    userId: 'usr_admin'
  });

  if (!dashboardAdmin || !dashboardAdmin.kpis) {
    throw new Error('Falha ao obter dashboard executivo');
  }

  if (dashboardAdmin.kpis.totalCommercialCapacity <= 0) {
    throw new Error('Capacidade total do evento deveria ser maior que zero');
  }

  if (!dashboardAdmin.financeSummary || !dashboardAdmin.financeSummary.authorized) {
    throw new Error('Admin com permissão * deveria ter acesso ao financeSummary');
  }
  console.log(`✓ Teste 1 passou! Dashboard consolidado com sucesso: Capacidade = ${dashboardAdmin.kpis.totalCommercialCapacity}, Ingressos Vendidos = ${dashboardAdmin.kpis.ticketsSoldCount}, Ocupação = ${dashboardAdmin.kpis.occupancyPercentage}%, Vendas Brutas = ${dashboardAdmin.kpis.grossSalesFormatted}.\n`);

  // 2. Invariante: Zero Métricas Falsas (Calculadas a partir do Banco de Dados)
  console.log('2. Testando integridade e correspondência matemática das métricas reais...');
  const actualTickets = await (prisma as any).ticket.findMany({ where: { eventId } });
  const validTicketsCount = actualTickets.filter((t: any) => t.status === 'VALID' || t.status === 'USED').length;

  if (dashboardAdmin.kpis.ticketsSoldCount !== validTicketsCount) {
    throw new Error(`Contagem de ingressos divergente: esperado ${validTicketsCount}, obteve ${dashboardAdmin.kpis.ticketsSoldCount}`);
  }
  console.log(`✓ Teste 2 passou! Invariante Zero Métricas Falsas respeitado: ${validTicketsCount} ingressos conferidos diretamente no banco.\n`);

  // 3. Sensibilidade a Contexto e Sessão Selecionada
  console.log('3. Testando filtro de sessão específica (Sensibilidade ao Contexto Operacional)...');
  const sessions = await prisma.eventSession.findMany({ where: { eventId } });
  if (sessions.length > 0) {
    const sessionToFilter = sessions[0];
    const dashboardSession = await EventDashboardService.getEventDashboard(eventId, {
      sessionId: sessionToFilter.id,
      viewType: 'OPERATIONAL',
      userPermissions: ['*']
    });

    if (dashboardSession.selectedSessionId !== sessionToFilter.id) {
      throw new Error('selectedSessionId não corresponde à sessão filtrada');
    }
    console.log(`✓ Teste 3 passou! Filtro por sessão ${sessionToFilter.name} aplicado com sucesso.\n`);
  }

  // 4. Widget-Level RBAC: Mascaramento e Omissão Financeira para Operadores sem Permissão
  console.log('4. Testando Widget-Level RBAC (Bloqueio e mascaramento de dados financeiros)...');
  const dashboardOperator = await EventDashboardService.getEventDashboard(eventId, {
    viewType: 'OPERATIONAL',
    userPermissions: ['eventos.operacao', 'eventos.checkin'], // Sem financeiro.visualizar
    userId: 'usr_porteiro'
  });

  if (dashboardOperator.financeSummary !== null) {
    throw new Error('financeSummary DEVE ser nulo para usuários sem permissão financeira');
  }

  if (dashboardOperator.kpis.grossSalesInCents !== 0) {
    throw new Error('grossSalesInCents deve ser zerado para usuários sem permissão financeira');
  }

  if (!dashboardOperator.kpis.grossSalesFormatted.includes('••••••')) {
    throw new Error('grossSalesFormatted deve ser mascarado com bullets (••••••)');
  }
  console.log('✓ Teste 4 passou! Widget-Level RBAC funcionando perfeitamente: dados financeiros completamente omitidos/mascarados no backend.\n');

  // 5. Agregação e Priorização de Alertas Operacionais
  console.log('5. Testando agregação de alertas operacionais e executivos...');
  if (!Array.isArray(dashboardAdmin.alerts)) {
    throw new Error('Alertas deveriam ser uma lista agregada');
  }
  console.log(`✓ Teste 5 passou! ${dashboardAdmin.alerts.length} alertas agregados pelo EventAlertAggregator.`);
  if (dashboardAdmin.alerts.length > 0) {
    console.log(`  - Alerta prioritário: [${dashboardAdmin.alerts[0].severity}] ${dashboardAdmin.alerts[0].title}`);
  }
  console.log('');

  // 6. Integridade de Dados em Tempo Real (Freshness)
  console.log('6. Testando integridade do freshness e tempo real...');
  if (!dashboardAdmin.freshness || !dashboardAdmin.freshness.isRealtimeConnected) {
    throw new Error('Indicador de tempo real inválido');
  }
  console.log(`✓ Teste 6 passou! Freshness: Conectado = ${dashboardAdmin.freshness.isRealtimeConnected}, Timestamp = ${dashboardAdmin.freshness.generatedAt}.\n`);

  console.log('======================================================');
  console.log('TODOS OS 6 TESTES DA FASE 1.2.11 PASSARAM COM SUCESSO!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Erro nos testes da Fase 1.2.11:', err);
  process.exit(1);
});
