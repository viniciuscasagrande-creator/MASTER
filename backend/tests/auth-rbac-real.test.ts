/**
 * SUÍTE DE TESTES OBRIGATÓRIOS — FASE 1.1.5.1
 * Core Node.js Real: Autenticação + RBAC + Escopo Produtor/Evento
 * 
 * Validação rigorosa de todos os fluxos:
 * 1. Login válido
 * 2. Senha inválida -> 401
 * 3. Usuário bloqueado -> 403
 * 4. Token inválido -> 401
 * 5. Token expirado -> 401
 * 6. Refresh válido
 * 7. Logout invalida sessão
 * 8. ADMIN acessa Financeiro
 * 9. FINANCEIRO acessa Financeiro, NÃO administra usuários (403)
 * 10. MARKETING acessa Marketing, NÃO acessa Contabilidade (403)
 * 11. SAC consulta pedido (200), NÃO aprova transferência (403)
 * 12. PRODUTOR A acessa Evento A (200), NÃO acessa Evento B (403)
 * 13. PRODUTOR B acessa Evento B (200), NÃO acessa Evento A (403)
 * 14. SEM PERMISSÃO: chamada direta da API -> 403
 * 15. SUPER ADMIN: todos os módulos, todos os produtores, todos os eventos (bypass)
 */

import app from '../src/app';
import { runSeed } from '../prisma/seed';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail: string) {
  if (condition) {
    results.push({ name, passed: true, message: detail });
    console.log(`  \x1b[32m✔ PASS: ${name}\x1b[0m`);
  } else {
    results.push({ name, passed: false, message: `FALHA: ${detail}` });
    console.error(`  \x1b[31m✖ FAIL: ${name} -> ${detail}\x1b[0m`);
  }
}

async function startSuite() {
  console.log('\n================================================================');
  console.log('   INICIANDO SUÍTE FASE 1.1.5.1 — CORE NODE.JS REAL & RBAC');
  console.log('================================================================\n');

  // 1. Seed database
  await runSeed();

  // 2. Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (path: string, options: { method?: string; body?: any; token?: string }) => {
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

  try {
    // --------------------------------------------------------------------------
    // 1. LOGIN VÁLIDO
    // --------------------------------------------------------------------------
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'maria.financeiro@diskingressos.com.br',
        password: defaultPassword
      }
    });

    const mariaToken = loginRes.data.accessToken;
    const mariaRefresh = loginRes.data.refreshToken;

    assert(
      loginRes.status === 200 && Boolean(mariaToken) && Boolean(mariaRefresh),
      'Login válido com credenciais corretas',
      `Status: ${loginRes.status}, AccessToken gerado: ${Boolean(mariaToken)}`
    );

    // --------------------------------------------------------------------------
    // 2. SENHA INVÁLIDA -> 401
    // --------------------------------------------------------------------------
    const invalidPwdRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'maria.financeiro@diskingressos.com.br',
        password: 'senha_completamente_errada_123'
      }
    });

    assert(
      invalidPwdRes.status === 401 && invalidPwdRes.data.error.includes('Credenciais inválidas'),
      'Senha inválida retorna 401 Unauthorized',
      `Status: ${invalidPwdRes.status}, Mensagem: ${invalidPwdRes.data.error}`
    );

    // --------------------------------------------------------------------------
    // 3. USUÁRIO BLOQUEADO -> 403
    // --------------------------------------------------------------------------
    const blockedRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'bloqueado@diskingressos.com.br',
        password: defaultPassword
      }
    });

    assert(
      blockedRes.status === 403 && blockedRes.data.error.includes('ACESSO BLOQUEADO'),
      'Usuário bloqueado retorna 403 Forbidden',
      `Status: ${blockedRes.status}, Mensagem: ${blockedRes.data.error}`
    );

    // --------------------------------------------------------------------------
    // 4. TOKEN INVÁLIDO -> 401
    // --------------------------------------------------------------------------
    const invalidTokenRes = await request('/api/v1/auth/me', {
      token: 'token_falso_ou_malformado_xyz'
    });

    assert(
      invalidTokenRes.status === 401,
      'Token inválido/corrompido retorna 401 Unauthorized',
      `Status: ${invalidTokenRes.status}`
    );

    // --------------------------------------------------------------------------
    // 5. TOKEN EXPIRADO -> 401
    // --------------------------------------------------------------------------
    // Cria um token expirado assinado com a mesma secret
    const expiredToken = jwt.sign(
      { sub: 'usr_fin_maria', email: 'maria.financeiro@diskingressos.com.br', sessionId: 'fake', isSuperAdmin: false },
      env.JWT_SECRET,
      { expiresIn: '-10s' }
    );

    const expiredRes = await request('/api/v1/auth/me', {
      token: expiredToken
    });

    assert(
      expiredRes.status === 401 && expiredRes.data.error.includes('expirado'),
      'Token expirado retorna 401 Unauthorized',
      `Status: ${expiredRes.status}, Erro: ${expiredRes.data.error}`
    );

    // --------------------------------------------------------------------------
    // 6. REFRESH VÁLIDO
    // --------------------------------------------------------------------------
    const refreshRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: mariaRefresh }
    });

    assert(
      refreshRes.status === 200 && Boolean(refreshRes.data.accessToken),
      'Refresh Token válido gera novo Access Token',
      `Status: ${refreshRes.status}, Novo Token: ${Boolean(refreshRes.data.accessToken)}`
    );

    // --------------------------------------------------------------------------
    // 7. LOGOUT INVALIDA SESSÃO
    // --------------------------------------------------------------------------
    const logoutRes = await request('/api/v1/auth/logout', {
      method: 'POST',
      token: mariaToken
    });

    // Chamada subsequente com o mesmo token deve ser rejeitada porque a sessão foi revogada
    const afterLogoutRes = await request('/api/v1/auth/me', {
      token: mariaToken
    });

    assert(
      logoutRes.status === 200 && afterLogoutRes.status === 401 && afterLogoutRes.data.error.includes('revogada'),
      'Logout revoga a sessão no banco e invalida chamadas futuras',
      `Logout: ${logoutRes.status}, Pós-logout: ${afterLogoutRes.status}`
    );

    // Logins para as próximas etapas
    const loginAs = async (email: string, twoFactorCode?: string) => {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password: defaultPassword, twoFactorCode }
      });
      return res.data.accessToken;
    };

    const adminToken = await loginAs('admin@diskingressos.com.br', '123456');
    const mariaToken2 = await loginAs('maria.financeiro@diskingressos.com.br');
    const carlosToken = await loginAs('carlos.financeiro@diskingressos.com.br');
    const lucasToken = await loginAs('lucas.marketing@diskingressos.com.br');
    const anaToken = await loginAs('ana.sac@diskingressos.com.br');
    const opusToken = await loginAs('roberto@opus.com.br');
    const liveToken = await loginAs('renata@livenation.com.br');

    // --------------------------------------------------------------------------
    // 8. ADMIN ACESSA FINANCEIRO
    // --------------------------------------------------------------------------
    const adminFinRes = await request('/api/v1/finance/transfers', { token: adminToken });
    assert(
      adminFinRes.status === 200,
      'ADMIN acessa módulo Financeiro',
      `Status: ${adminFinRes.status}`
    );

    // --------------------------------------------------------------------------
    // 9. FINANCEIRO ACESSA FINANCEIRO, MAS NÃO ADMINISTRA USUÁRIOS
    // --------------------------------------------------------------------------
    const finFinRes = await request('/api/v1/finance/transfers', { token: mariaToken2 });
    const finAdminRes = await request('/api/v1/admin/users', { token: mariaToken2 });

    assert(
      finFinRes.status === 200 && finAdminRes.status === 403,
      'FINANCEIRO acessa Financeiro (200), mas NÃO administra usuários (403)',
      `Financeiro: ${finFinRes.status}, Admin Users: ${finAdminRes.status}`
    );

    // --------------------------------------------------------------------------
    // 10. MARKETING ACESSA MARKETING, MAS NÃO ACESSA CONTABILIDADE
    // --------------------------------------------------------------------------
    const mktRes = await request('/api/v1/marketing/campaigns', { token: lucasToken });
    const mktCntRes = await request('/api/v1/accounting/dre', { token: lucasToken });

    assert(
      mktRes.status === 200 && mktCntRes.status === 403,
      'MARKETING acessa Marketing (200), mas NÃO acessa Contabilidade (403)',
      `Marketing: ${mktRes.status}, Contabilidade DRE: ${mktCntRes.status}`
    );

    // --------------------------------------------------------------------------
    // 11. SAC CONSULTA PEDIDO, MAS NÃO APROVA TRANSFERÊNCIA
    // --------------------------------------------------------------------------
    const sacOrderRes = await request('/api/v1/orders/ord_101', { token: anaToken });
    const sacApproveRes = await request('/api/v1/finance/transfers/trf_fake/approve', {
      method: 'PUT',
      token: anaToken
    });

    assert(
      sacOrderRes.status === 200 && sacApproveRes.status === 403,
      'SAC consulta pedido de cliente (200), mas NÃO aprova transferências (403)',
      `Order: ${sacOrderRes.status}, Approve Transfer: ${sacApproveRes.status}`
    );

    // --------------------------------------------------------------------------
    // 12. PRODUTOR A (OPUS): ACESSA EVENTO A, MAS BLOQUEADO EM EVENTO B
    // --------------------------------------------------------------------------
    const opusEvtARes = await request('/api/v1/events/evt_1001', { token: opusToken });
    const opusEvtBRes = await request('/api/v1/events/evt_2001', { token: opusToken });

    assert(
      opusEvtARes.status === 200 && opusEvtBRes.status === 403,
      'PRODUTOR A (Opus) acessa Evento A (200) e é bloqueado no Evento B (403)',
      `Evento A: ${opusEvtARes.status}, Evento B: ${opusEvtBRes.status}`
    );

    // --------------------------------------------------------------------------
    // 13. PRODUTOR B (LIVE NATION): ACESSA EVENTO B, MAS BLOQUEADO EM EVENTO A
    // --------------------------------------------------------------------------
    const liveEvtBRes = await request('/api/v1/events/evt_2001', { token: liveToken });
    const liveEvtARRes = await request('/api/v1/events/evt_1001', { token: liveToken });

    assert(
      liveEvtBRes.status === 200 && liveEvtARRes.status === 403,
      'PRODUTOR B (Live Nation) acessa Evento B (200) e é bloqueado no Evento A (403)',
      `Evento B: ${liveEvtBRes.status}, Evento A: ${liveEvtARRes.status}`
    );

    // --------------------------------------------------------------------------
    // 14. SEM PERMISSÃO: CHAMADA DIRETA DA API -> 403
    // --------------------------------------------------------------------------
    // Carlos (Financeiro sem aprovação) tenta aprovar uma transferência
    const carlosApproveRes = await request('/api/v1/finance/transfers/trf_100/approve', {
      method: 'PUT',
      token: carlosToken
    });

    assert(
      carlosApproveRes.status === 403 && carlosApproveRes.data.error.includes('Você não possui permissão'),
      'Chamada direta da API sem permissão granular específica retorna 403',
      `Status: ${carlosApproveRes.status}, Mensagem: ${carlosApproveRes.data.error}`
    );

    // --------------------------------------------------------------------------
    // 15. SUPER ADMIN: TODOS OS MÓDULOS, PRODUTORES E EVENTOS (BYPASS)
    // --------------------------------------------------------------------------
    const superEvtA = await request('/api/v1/events/evt_1001', { token: adminToken });
    const superEvtB = await request('/api/v1/events/evt_2001', { token: adminToken });
    const superOrderA = await request('/api/v1/orders/ord_101', { token: adminToken });
    const superOrderB = await request('/api/v1/orders/ord_201', { token: adminToken });
    const superUsers = await request('/api/v1/admin/users', { token: adminToken });

    assert(
      superEvtA.status === 200 &&
      superEvtB.status === 200 &&
      superOrderA.status === 200 &&
      superOrderB.status === 200 &&
      superUsers.status === 200,
      'SUPER ADMIN possui acesso irrestrito universal (módulos, produtores e eventos)',
      `EvtA: ${superEvtA.status}, EvtB: ${superEvtB.status}, OrderA: ${superOrderA.status}, OrderB: ${superOrderB.status}, Users: ${superUsers.status}`
    );

  } catch (err) {
    console.error('\x1b[31mErro fatal na execução dos testes:\x1b[0m', err);
  } finally {
    server.close();
  }

  // Summary report
  console.log('\n================================================================');
  console.log('   RELATÓRIO DE HOMOLOGAÇÃO FASE 1.1.5.1');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal de Casos Homologados: ${passedCount} / ${totalCount}`);
  if (passedCount === 15) {
    console.log('\x1b[32m\n★ 100% DOS CRITÉRIOS DA FASE 1.1.5.1 HOMOLOGADOS COM SUCESSO! ★\x1b[0m\n');
  } else {
    console.log('\x1b[31m\nATENÇÃO: Nem todos os testes passaram.\x1b[0m\n');
    process.exitCode = 1;
  }
}

startSuite();
