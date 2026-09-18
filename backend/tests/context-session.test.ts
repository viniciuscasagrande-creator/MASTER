/**
 * SUÍTE DE TESTES DE CONFORMIDADE — FASE 1.1.5.3
 * Contexto de Sessão + Seletor Global Produtor/Evento + Dashboard Dinâmico por Perfil
 */

import app from '../src/app';
import { runSeed } from '../prisma/seed';
import http from 'http';

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

async function runContextSuite() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.3 — DISK CONTEXT & SELETOR');
  console.log('================================================================\n');

  await runSeed();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
      producerHeader?: string;
      eventHeader?: string;
    }
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    if (options.producerHeader) headers['X-Producer-Id'] = options.producerHeader;
    if (options.eventHeader) headers['X-Event-Id'] = options.eventHeader;

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
    const opusToken = await loginAs('roberto@opus.com.br');
    const liveToken = await loginAs('renata@livenation.com.br');

    // 1. ADMIN enxerga todos os produtores
    const adminContext = await request('/api/v1/context', { token: adminToken });
    assert(
      adminContext.status === 200 && adminContext.data.availableProducers.length >= 2,
      'Administrador Geral enxerga todos os produtores da plataforma',
      `Produtores disponíveis: ${adminContext.data.availableProducers?.length}`
    );

    // 2. ADMIN seleciona produtor via Context API
    const selectProd = await request('/api/v1/context/producer/prd_100', {
      method: 'PUT',
      token: adminToken
    });
    assert(
      selectProd.status === 200 && selectProd.data.producer.id === 'prd_100',
      'Administrador seleciona produtor (Opus) no contexto operacional',
      `Produtor Selecionado: ${selectProd.data.producer?.name}`
    );

    // 3. Eventos disponíveis são filtrados pelo produtor ativo
    const eventsFiltered = await request('/api/v1/context', {
      token: adminToken,
      producerHeader: 'prd_100'
    });
    const allBelongToPrd100 = eventsFiltered.data.availableEvents.every((e: any) => e.producerId === 'prd_100');
    assert(
      eventsFiltered.status === 200 && allBelongToPrd100 && eventsFiltered.data.availableEvents.length > 0,
      'Eventos disponíveis são estritamente filtrados pelo produtor ativo',
      `Total de eventos filtrados para Opus: ${eventsFiltered.data.availableEvents.length}`
    );

    // 4. ADMIN seleciona evento via Context API
    const selectEvent = await request('/api/v1/context/event/evt_1001', {
      method: 'PUT',
      token: adminToken
    });
    assert(
      selectEvent.status === 200 && selectEvent.data.event.id === 'evt_1001',
      'Administrador seleciona evento (Festival de Inverno 2026) no contexto',
      `Evento Selecionado: ${selectEvent.data.event?.title}`
    );

    // 5. PRODUTOR OPUS não enxerga outros produtores concorrentes
    const opusContext = await request('/api/v1/context', { token: opusToken });
    const onlyOpus = opusContext.data.availableProducers.every((p: any) => p.id === 'prd_100');
    assert(
      opusContext.status === 200 && onlyOpus && opusContext.data.availableProducers.length === 1,
      'Produtor Opus não enxerga outros produtores (apenas sua própria organização)',
      `Produtores visíveis: ${opusContext.data.availableProducers.map((p: any) => p.name).join(', ')}`
    );

    // 6. Manipulação de Header: Produtor Opus tenta forçar X-Producer-Id de concorrente
    const hackProducer = await request('/api/v1/events', {
      token: opusToken,
      producerHeader: 'prd_200'
    });
    assert(
      hackProducer.status === 403 && hackProducer.data.code === 'CONTEXT_ACCESS_DENIED',
      'Tentativa de forçar X-Producer-Id concorrente é bloqueada pelo Node com 403 CONTEXT_ACCESS_DENIED',
      `Status: ${hackProducer.status}, Code: ${hackProducer.data.code}`
    );

    // 7. Manipulação de Header: Produtor Opus tenta forçar X-Event-Id de concorrente
    const hackEvent = await request('/api/v1/events', {
      token: opusToken,
      eventHeader: 'evt_2001'
    });
    assert(
      hackEvent.status === 403 && hackEvent.data.code === 'CONTEXT_ACCESS_DENIED',
      'Tentativa de forçar X-Event-Id concorrente é bloqueada pelo Node com 403 CONTEXT_ACCESS_DENIED',
      `Status: ${hackEvent.status}, Code: ${hackEvent.data.code}`
    );

    // 8. Auto-lock para produtor de organização única
    assert(
      opusContext.data.context.isLockedToSingleProducer === true,
      'Usuário de organização única é auto-bloqueado no contexto sem seletor de produtor',
      `isLockedToSingleProducer: ${opusContext.data.context.isLockedToSingleProducer}`
    );

    // 9. Limpar contexto restaura visão completa de eventos
    const clearEvt = await request('/api/v1/context/event', {
      method: 'DELETE',
      token: adminToken
    });
    assert(
      clearEvt.status === 200 && clearEvt.data.success === true,
      'Limpar filtro de evento via DELETE restaura visão ampla',
      `Resposta: ${clearEvt.data.message}`
    );

    // 10. Dashboard Dinâmico determinado pelo perfil (Financeiro -> finance)
    const finContext = await request('/api/v1/context', { token: mariaToken });
    assert(
      finContext.status === 200 && finContext.data.context.defaultDashboard === 'finance',
      'Dashboard padrão é determinado automaticamente pelo perfil (Financeiro -> finance)',
      `Default Dashboard: ${finContext.data.context.defaultDashboard}`
    );

  } catch (err) {
    console.error('\x1b[31mErro fatal na execução dos testes de contexto:\x1b[0m', err);
  } finally {
    server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log('   RELATÓRIO FINAL DE CONFORMIDADE — FASE 1.1.5.3');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal de Critérios de Contexto Homologados: ${passedCount} / ${totalCount}`);
  if (passedCount === 10) {
    console.log('\x1b[32m\n★ 100% DOS CRITÉRIOS DE CONTEXTO E SELEÇÃO FORAM ATENDIDOS COM SUCESSO! ★\x1b[0m\n');
  } else {
    console.log('\x1b[31m\nATENÇÃO: Nem todos os testes de contexto passaram.\x1b[0m\n');
    process.exitCode = 1;
  }
}

runContextSuite();
