/**
 * SUÍTE DE TESTES DE CONFORMIDADE — FASE 1.1.5.4
 * Central de Segurança & Operações: Step-Up Reauthentication, Bloqueio de IP, Telemetria
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

async function runSecuritySuite() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.4 — SEGURANÇA & STEP-UP');
  console.log('================================================================\n');

  await runSeed();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
      stepUpToken?: string;
    }
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    if (options.stepUpToken) headers['X-Step-Up-Token'] = options.stepUpToken;

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

    // 1. Criar transferência de alto valor (> R$ 50.000)
    const createHighValueTransfer = await request('/api/v1/finance/transfers', {
      method: 'POST',
      token: mariaToken,
      body: {
        producerId: 'prd_100',
        fromEventId: 'evt_1001',
        toEventId: 'evt_1002',
        amount: 75000,
        reason: 'Realocação de saldo orçamentário'
      }
    });
    const transferId = createHighValueTransfer.data.transfer?.id;
    assert(
      createHighValueTransfer.status === 201 && !!transferId,
      'Criação de transferência de alto valor (R$ 75.000)',
      `ID da Transferência: ${transferId}`
    );

    // 2. Tentar aprovar transferência de alto valor SEM Step-Up token -> Bloqueado com 403 STEP_UP_REQUIRED
    const tryApproveWithoutStepUp = await request(`/api/v1/finance/transfers/${transferId}/approve`, {
      method: 'PUT',
      token: mariaToken
    });
    assert(
      tryApproveWithoutStepUp.status === 403 && tryApproveWithoutStepUp.data.code === 'STEP_UP_REQUIRED',
      'Aprovação de transferência > R$ 50.000 sem Step-Up é bloqueada com 403 STEP_UP_REQUIRED',
      `Status: ${tryApproveWithoutStepUp.status}, Code: ${tryApproveWithoutStepUp.data.code}`
    );

    // 3. Executar Step-Up Reauthentication com senha correta
    const stepUpResponse = await request('/api/v1/security/step-up', {
      method: 'POST',
      token: mariaToken,
      body: { password: defaultPassword }
    });
    const stepUpToken = stepUpResponse.data.stepUpToken;
    assert(
      stepUpResponse.status === 200 && !!stepUpToken,
      'Reautenticação Step-Up gera token temporário válido',
      `Step-Up Token: ${stepUpToken ? stepUpToken.slice(0, 15) + '...' : 'undefined'}`
    );

    // 4. Aprovar transferência de alto valor COM o Step-Up token -> Sucesso
    const approveWithStepUp = await request(`/api/v1/finance/transfers/${transferId}/approve`, {
      method: 'PUT',
      token: mariaToken,
      stepUpToken
    });
    assert(
      approveWithStepUp.status === 200 && approveWithStepUp.data.transfer?.status === 'APPROVED',
      'Aprovação de transferência de alto valor concluída com sucesso após Step-Up',
      `Status: ${approveWithStepUp.data.transfer?.status}`
    );

    // 5. Consultar métricas de segurança (Security Overview)
    const secOverview = await request('/api/v1/security/overview', { token: adminToken });
    assert(
      secOverview.status === 200 && secOverview.data.totalSecurityEvents >= 1,
      'Painel de telemetria de segurança lista eventos registrados',
      `Total de eventos de segurança: ${secOverview.data.totalSecurityEvents}`
    );

    // 6. Bloqueio manual de IP hostil
    const blockRes = await request('/api/v1/security/block-ip', {
      method: 'POST',
      token: adminToken,
      body: { ip: '198.51.100.44', reason: 'Ataque de força bruta detectado' }
    });
    assert(
      blockRes.status === 200 && blockRes.data.success === true,
      'Administrador Geral bloqueia IP hostil com sucesso',
      `Resposta: ${blockRes.data.message}`
    );

  } catch (err) {
    console.error('\x1b[31mErro fatal na execução dos testes de segurança:\x1b[0m', err);
  } finally {
    server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log('   RELATÓRIO FINAL DE CONFORMIDADE — FASE 1.1.5.4');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal de Critérios de Segurança Homologados: ${passedCount} / ${totalCount}`);
  if (passedCount === totalCount) {
    console.log('\x1b[32m\n★ 100% DOS CRITÉRIOS DE SEGURANÇA E STEP-UP FORAM ATENDIDOS COM SUCESSO! ★\x1b[0m\n');
  } else {
    console.log('\x1b[31m\nATENÇÃO: Nem todos os testes de segurança passaram.\x1b[0m\n');
    process.exitCode = 1;
  }
}

runSecuritySuite();
