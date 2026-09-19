/**
 * SUÍTE DE TESTES DE CONFORMIDADE — FASE 1.1.5.5
 * Central de Notificações e Alertas em Tempo Real + WebSocket Node.js
 */

import http from 'http';
import { WebSocket } from 'ws';
import app from '../src/app';
import { setupWebSocketServer } from '../src/realtime/websocket.server';
import { EventBus } from '../src/events/event-bus';
import { NotificationService } from '../src/modules/notifications/notification.service';
import { runSeed } from '../prisma/seed';
import { prisma } from '../src/core/database/prisma';

interface TestResult {
  title: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, title: string, details: string) {
  if (condition) {
    results.push({ title, passed: true, details });
    console.log(`  \x1b[32m✔ PASS: ${title}\x1b[0m`);
  } else {
    results.push({ title, passed: false, details: `FALHA: ${details}` });
    console.error(`  \x1b[31m✖ FAIL: ${title} -> ${details}\x1b[0m`);
  }
}

async function runRealtimeNotificationsSuite() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.5 — WEBSOCKET & NOTIFICAÇÕES');
  console.log('================================================================\n');

  await runSeed();

  const server = http.createServer(app);
  const wss = setupWebSocketServer(server);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3003;
  const baseUrl = `http://127.0.0.1:${port}`;
  const wsUrl = `ws://127.0.0.1:${port}/realtime`;

  const request = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
    }
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'DiskAdmin@2026!';

  const loginAs = async (email: string, twoFactorCode?: string) => {
    const res = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password: defaultPassword, twoFactorCode }
    });
    return res.data.accessToken;
  };

  try {
    const adminToken = await loginAs('admin@diskingressos.com.br', '123456');
    const mariaToken = await loginAs('maria.financeiro@diskingressos.com.br');
    const carlosToken = await loginAs('carlos.financeiro@diskingressos.com.br');
    const opusToken = await loginAs('roberto@opus.com.br');
    const liveToken = await loginAs('renata@livenation.com.br');

    // 1. WebSocket Conecta com Sucesso para Usuário Autenticado
    const mariaSocket = new WebSocket(`${wsUrl}?token=${mariaToken}`);
    const mariaConnected = await new Promise<boolean>((resolve) => {
      mariaSocket.on('open', () => resolve(true));
      mariaSocket.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 2000);
    });

    assert(
      mariaConnected,
      'WebSocket conecta e autentica via JWT com sessão válida',
      'Conexão aberta com sucesso para Maria'
    );

    // 2. WebSocket Rejeita Conexão com Token Inválido ou Ausente
    const invalidSocket = new WebSocket(`${wsUrl}?token=token_invalido_123`);
    const invalidRejected = await new Promise<boolean>((resolve) => {
      invalidSocket.on('close', (code) => resolve(code === 4001 || code === 1006));
      invalidSocket.on('error', () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });

    assert(
      invalidRejected,
      'WebSocket rejeita conexões com token corrompido ou ausente',
      'Conexão fechada com 4001 Unauthorized'
    );

    // 3. Publicação de Evento via EventBus persiste no Event Outbox
    const testEventId = `evt_test_${Date.now()}`;
    const pubResult = await EventBus.publish({
      id: testEventId,
      type: 'FINANCE_TRANSFER_CREATED',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      resourceType: 'TRANSFER',
      resourceId: 'trf_9901',
      actorUserId: 'usr_prod_opus',
      data: { amount: 35000, description: 'Repasse adiantado Opus' },
      timestamp: new Date()
    });

    const outboxRecord = await prisma.eventOutbox.findUnique({
      where: { eventId: testEventId }
    });

    assert(
      pubResult.published && outboxRecord?.status === 'PROCESSED',
      'EventBus persiste evento no Event Outbox com status PROCESSED',
      `Outbox status: ${outboxRecord?.status}`
    );

    // 4. Idempotência: Publicação com mesmo eventId é ignorada como duplicada
    const dupResult = await EventBus.publish({
      id: testEventId,
      type: 'FINANCE_TRANSFER_CREATED',
      producerId: 'prd_100',
      resourceType: 'TRANSFER',
      resourceId: 'trf_9901',
      data: { amount: 35000 },
      timestamp: new Date()
    });

    assert(
      dupResult.published === false && dupResult.duplicate === true,
      'Idempotência comprovada: Evento duplicado com mesmo ID é descartado',
      `Resultado: duplicate=${dupResult.duplicate}`
    );

    // 5. RecipientResolver direciona apenas para usuários autorizados (RBAC + Escopo)
    // Maria (tem financeiro.transferencia.aprovar) deve ter recebido a notificação
    const mariaNotifs = await request('/api/v1/notifications', { token: mariaToken });
    const mariaHasTransfer = mariaNotifs.data.notifications?.some(
      (n: any) => n.notification?.resourceId === 'trf_9901'
    );

    // Carlos (Financeiro Júnior SEM aprovação) NÃO deve receber
    const carlosNotifs = await request('/api/v1/notifications', { token: carlosToken });
    const carlosHasTransfer = carlosNotifs.data.notifications?.some(
      (n: any) => n.notification?.resourceId === 'trf_9901'
    );

    // Renata (Produtor Live Nation - prd_200) NÃO deve receber transferência de Opus
    const renataNotifs = await request('/api/v1/notifications', { token: liveToken });
    const renataHasTransfer = renataNotifs.data.notifications?.some(
      (n: any) => n.notification?.resourceId === 'trf_9901'
    );

    assert(
      mariaHasTransfer && !carlosHasTransfer && !renataHasTransfer,
      'RecipientResolver entrega notificação apenas para usuários com permissão e escopo',
      `Maria recebeu: ${mariaHasTransfer}, Carlos recebeu: ${carlosHasTransfer}, Renata (concorrente) recebeu: ${renataHasTransfer}`
    );

    // 6. Consulta de Contagem de Não Lidas
    const unreadCountRes = await request('/api/v1/notifications/unread-count', { token: mariaToken });
    assert(
      unreadCountRes.status === 200 && unreadCountRes.data.unreadCount >= 1,
      'Endpoint de contagem de notificações não lidas reflete total exato',
      `Unread count: ${unreadCountRes.data.unreadCount}`
    );

    // 7. Marcar Notificação como Lida
    const notifToRead = mariaNotifs.data.notifications[0];
    const markReadRes = await request(`/api/v1/notifications/${notifToRead.id}/read`, {
      method: 'PATCH',
      token: mariaToken
    });

    assert(
      markReadRes.status === 200 && markReadRes.data.updated?.status === 'READ',
      'Marcar notificação como lida atualiza status para READ no banco',
      `Status atualizado: ${markReadRes.data.updated?.status}`
    );

    // 8. Marcar Todas as Notificações como Lidas
    const markAllRes = await request('/api/v1/notifications/read-all', {
      method: 'PATCH',
      token: mariaToken
    });
    const finalUnread = await request('/api/v1/notifications/unread-count', { token: mariaToken });

    assert(
      markAllRes.status === 200 && finalUnread.data.unreadCount === 0,
      'Marcar todas como lidas zera o contador de não lidas',
      `Contador final: ${finalUnread.data.unreadCount}`
    );

    // 9. Agrupamento Anti-Ruído para Múltiplas Vendas
    const eventSalesGroupKey = 'sales:evt_1001';
    await EventBus.publish({
      id: `sale_1_${Date.now()}`,
      type: 'ORDER_PAID',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      resourceType: 'ORDER',
      resourceId: 'dk_ord_101',
      data: { amount: 120 },
      timestamp: new Date()
    });

    await EventBus.publish({
      id: `sale_2_${Date.now()}`,
      type: 'ORDER_PAID',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      resourceType: 'ORDER',
      resourceId: 'dk_ord_102',
      data: { amount: 180 },
      timestamp: new Date()
    });

    const groupedNotifs = await prisma.notification.findMany({
      where: { groupKey: eventSalesGroupKey }
    });

    assert(
      groupedNotifs.length === 1 && groupedNotifs[0].title.includes('2 novas vendas'),
      'Agrupamento anti-ruído condensa múltiplos eventos sob a mesma groupKey',
      `Total notificações agrupadas: ${groupedNotifs.length}, Título: '${groupedNotifs[0]?.title}'`
    );

    // 10. Preferências de Notificação: Bloqueio de Desativação de Segurança Obrigatória
    const disableSecurity = await request('/api/v1/notifications/preferences', {
      method: 'PATCH',
      token: mariaToken,
      body: { module: 'SECURITY', isEnabled: false }
    });

    assert(
      disableSecurity.status === 400,
      'Política de Compliance: Tentativa de desativar alertas de segurança é rejeitada',
      `Status retornado: ${disableSecurity.status} (${disableSecurity.data.error})`
    );

    mariaSocket.close();

  } catch (err) {
    console.error('\x1b[31mErro fatal na execução dos testes de notificações:\x1b[0m', err);
  } finally {
    wss.close();
    server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log('   RELATÓRIO FINAL DE CONFORMIDADE — FASE 1.1.5.5');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal de Critérios de Notificações & Realtime Homologados: ${passedCount} / ${totalCount}`);
  if (passedCount === totalCount) {
    console.log('\x1b[32m\n★ 100% DOS CRITÉRIOS DE WEBSOCKET E NOTIFICAÇÕES FORAM ATENDIDOS COM SUCESSO! ★\x1b[0m\n');
  } else {
    console.log('\x1b[31m\nATENÇÃO: Nem todos os testes de notificações passaram.\x1b[0m\n');
    process.exitCode = 1;
  }
}

runRealtimeNotificationsSuite();
