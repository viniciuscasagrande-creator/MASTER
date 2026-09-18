/**
 * SUÍTE DE TESTES AUTOMATIZADOS — FASE 1.1.5 RBAC & ESCOPO DE DADOS
 * 
 * Homologação rigorosa dos 10 critérios de aceitação:
 * 1. Administrador Geral vê e administra tudo (bypass global).
 * 2. Financeiro com aprovação (Maria) executa operações financeiras.
 * 3. Financeiro sem aprovação (Carlos) é bloqueado em aprovações (403).
 * 4. Marketing (Lucas) é bloqueado em módulos financeiros (403).
 * 5. SAC (Ana) consulta pedidos, mas é bloqueada em operações financeiras (403).
 * 6. Produtor (Roberto - Opus) acessa seu próprio evento (evt-101 / prod-1).
 * 7. Produtor (Roberto - Opus) é bloqueado ao tentar acessar evento e pedido de outro produtor (evt-102 / prod-2).
 * 8. Requisições sem permissão granular específica retornam 403.
 * 9. Usuário bloqueado (usr-blocked-1) é barrado no login e nas chamadas de API (403).
 * 10. Operações sensíveis e violações registram auditoria e segurança imutáveis.
 */

import app from '../src/app';
import { db } from '../src/core/database/index';
import http from 'http';

interface TestResult {
  num: number;
  title: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, num: number, title: string, details: string) {
  if (condition) {
    results.push({ num, title, passed: true, details });
    console.log(`  \x1b[32m✔ [CRITÉRIO ${num}] PASS: ${title}\x1b[0m`);
  } else {
    results.push({ num, title, passed: false, details: `FALHA: ${details}` });
    console.error(`  \x1b[31m✖ [CRITÉRIO ${num}] FAIL: ${title} -> ${details}\x1b[0m`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('   INICIANDO HOMOLOGAÇÃO FASE 1.1.5 — SEGURANÇA E RBAC CORE');
  console.log('================================================================\n');

  // Start ephemeral server for testing
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Helper fetch function
  const api = async (path: string, options: { method?: string; body?: any; tokenOrUserId?: string }) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (options.tokenOrUserId) {
      headers['Authorization'] = `Bearer ${options.tokenOrUserId}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  };

  try {
    db.reset();

    // --------------------------------------------------------------------------
    // CRITÉRIO 1: Administrador Geral vê e administra tudo
    // --------------------------------------------------------------------------
    const adminRes = await api('/api/v1/admin/users', { tokenOrUserId: 'usr-admin-1' });
    const adminEventsRes = await api('/api/v1/events', { tokenOrUserId: 'usr-admin-1' });
    assert(
      adminRes.status === 200 && adminRes.data.users.length >= 6 && adminEventsRes.status === 200,
      1,
      'Administrador Geral tem acesso irrestrito ao painel e recursos',
      `Status Users: ${adminRes.status}, Total Users: ${adminRes.data.total}, Status Events: ${adminEventsRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 2: Financeiro Master (Maria) opera financeiro e aprova repasses
    // --------------------------------------------------------------------------
    // Cria uma transferência de teste
    const createTrfRes = await api('/api/v1/finance/transfers', {
      method: 'POST',
      tokenOrUserId: 'usr-fin-maria',
      body: {
        fromEventId: 'evt-101',
        toEventId: 'evt-103',
        producerId: 'prod-1',
        amount: 50000,
        reason: 'Repasse adiantamento festival'
      }
    });
    const transferId = createTrfRes.data.transfer?.id;

    // Maria aprova a transferência
    const approveTrfRes = await api(`/api/v1/finance/transfers/${transferId}/approve`, {
      method: 'PUT',
      tokenOrUserId: 'usr-fin-maria'
    });

    assert(
      createTrfRes.status === 201 && approveTrfRes.status === 200 && approveTrfRes.data.transfer.status === 'approved',
      2,
      'Financeiro Master (Maria) cria e aprova transferências financeiras',
      `Create Status: ${createTrfRes.status}, Approve Status: ${approveTrfRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 3: Financeiro Operacional (Carlos) NÃO PODE aprovar transferências
    // --------------------------------------------------------------------------
    // Carlos tenta aprovar outra transferência
    const trfForCarlos = await api('/api/v1/finance/transfers', {
      method: 'POST',
      tokenOrUserId: 'usr-fin-maria',
      body: {
        fromEventId: 'evt-101',
        toEventId: 'evt-103',
        producerId: 'prod-1',
        amount: 15000,
        reason: 'Teste Carlos sem permissão'
      }
    });
    const trfId2 = trfForCarlos.data.transfer?.id;

    const carlosApproveRes = await api(`/api/v1/finance/transfers/${trfId2}/approve`, {
      method: 'PUT',
      tokenOrUserId: 'usr-fin-carlos'
    });

    assert(
      carlosApproveRes.status === 403 && carlosApproveRes.data.error.includes('403 ACESSO NEGADO'),
      3,
      'Financeiro sem permissão de aprovação (Carlos) é bloqueado com 403',
      `Status retornado: ${carlosApproveRes.status}, Detalhes: ${carlosApproveRes.data.details?.requiredPermission}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 4: Marketing (Lucas) NÃO acessa módulos financeiros
    // --------------------------------------------------------------------------
    const lucasFinanceRes = await api('/api/v1/finance/producers/prod-1/balance', {
      tokenOrUserId: 'usr-mkt-lucas'
    });

    assert(
      lucasFinanceRes.status === 403 && lucasFinanceRes.data.details?.requiredPermission === 'financeiro.saldo.visualizar',
      4,
      'Marketing (Lucas) é bloqueado com 403 ao tentar ver saldo financeiro',
      `Status retornado: ${lucasFinanceRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 5: SAC (Ana) consulta pedidos, mas NÃO acessa financeiro
    // --------------------------------------------------------------------------
    const anaOrderRes = await api('/api/v1/orders/ord-87521', {
      tokenOrUserId: 'usr-sac-ana'
    });

    const anaFinanceRes = await api('/api/v1/finance/transfers', {
      tokenOrUserId: 'usr-sac-ana'
    });

    assert(
      anaOrderRes.status === 200 && anaOrderRes.data.order.id === 'ord-87521' && anaFinanceRes.status === 403,
      5,
      'SAC (Ana) consulta pedidos do cliente (200), mas é bloqueada no Financeiro (403)',
      `Pedido Status: ${anaOrderRes.status}, Financeiro Status: ${anaFinanceRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 6: Produtor Roberto (Opus) acessa seu próprio evento (evt-101)
    // --------------------------------------------------------------------------
    const robertoOwnEventRes = await api('/api/v1/events/evt-101', {
      tokenOrUserId: 'usr-prod-opus'
    });

    assert(
      robertoOwnEventRes.status === 200 && robertoOwnEventRes.data.event.id === 'evt-101',
      6,
      'Produtor Roberto acessa dados do seu próprio evento (evt-101) com sucesso',
      `Status retornado: ${robertoOwnEventRes.status}, Evento: ${robertoOwnEventRes.data.event?.title}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 7: Produtor Roberto é BLOQUEADO ao tentar acessar evento e pedido de outro produtor
    // --------------------------------------------------------------------------
    // Roberto tenta acessar evt-102 (Live Nation - prod-2)
    const robertoForeignEventRes = await api('/api/v1/events/evt-102', {
      tokenOrUserId: 'usr-prod-opus'
    });

    // Roberto tenta acessar pedido ord-87522 (Coldplay - prod-2)
    const robertoForeignOrderRes = await api('/api/v1/orders/ord-87522', {
      tokenOrUserId: 'usr-prod-opus'
    });

    assert(
      robertoForeignEventRes.status === 403 && robertoForeignOrderRes.status === 403,
      7,
      'Isolamento de Escopo: Produtor Opus é bloqueado (403) em evento e pedido do concorrente',
      `Foreign Event: ${robertoForeignEventRes.status} (${robertoForeignEventRes.data.error}), Foreign Order: ${robertoForeignOrderRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 8: Chamada direta de API por usuário sem permissão retorna 403
    // --------------------------------------------------------------------------
    // Lucas (Marketing) tenta chamar diretamente a rota de gerenciar permissões de usuários
    const lucasAdminRes = await api('/api/v1/admin/users/usr-fin-carlos/permissions', {
      method: 'PUT',
      tokenOrUserId: 'usr-mkt-lucas',
      body: { permissions: ['financeiro.saldo.visualizar'] }
    });

    assert(
      lucasAdminRes.status === 403,
      8,
      'Tentativa de escalonamento ou chamada direta de API administrativa retorna 403',
      `Status retornado: ${lucasAdminRes.status}, Required: ${lucasAdminRes.data.details?.requiredPermission}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 9: Usuário bloqueado é rejeitado no login e nas chamadas de API
    // --------------------------------------------------------------------------
    const blockedLoginRes = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'bloqueado@diskingressos.com.br', password: 'mock' }
    });

    const blockedApiRes = await api('/api/v1/events', {
      tokenOrUserId: 'usr-blocked-1'
    });

    assert(
      blockedLoginRes.status === 403 && blockedApiRes.status === 403,
      9,
      'Usuário bloqueado pela administração é barrado no Login e na API com 403',
      `Login Status: ${blockedLoginRes.status}, API Status: ${blockedApiRes.status}`
    );

    // --------------------------------------------------------------------------
    // CRITÉRIO 10: Trilha de auditoria e logs de segurança imutáveis registrados
    // --------------------------------------------------------------------------
    // 1. Admin altera uma permissão
    const permChangeRes = await api('/api/v1/admin/users/usr-fin-carlos/permissions', {
      method: 'PUT',
      tokenOrUserId: 'usr-admin-1',
      body: {
        permissions: ['financeiro.saldo.visualizar', 'financeiro.repasses.visualizar', 'financeiro.transferencia.aprovar']
      }
    });

    // 2. Consulta logs de auditoria e segurança
    const auditRes = await api('/api/v1/audit/logs', { tokenOrUserId: 'usr-admin-1' });
    const securityRes = await api('/api/v1/audit/security', { tokenOrUserId: 'usr-admin-1' });

    const hasPermAudit = auditRes.data.logs.some((l: any) => l.action === 'UPDATE_PERMISSIONS_SCOPE');
    const hasTransferAudit = auditRes.data.logs.some((l: any) => l.action === 'APPROVE_TRANSFER');
    const hasScopeSecurityLog = securityRes.data.logs.some((s: any) => s.eventType === 'SCOPE_VIOLATION');
    const hasBlockedUserLog = securityRes.data.logs.some((s: any) => s.eventType === 'USER_BLOCKED');

    assert(
      permChangeRes.status === 200 && hasPermAudit && hasTransferAudit && hasScopeSecurityLog && hasBlockedUserLog,
      10,
      'Auditoria imutável registra alterações de permissão, repasses e tentativas de violação',
      `Total Audit Logs: ${auditRes.data.total}, Total Security Logs: ${securityRes.data.total}`
    );

  } catch (err: any) {
    console.error('\x1b[31mErro fatal na execução dos testes:\x1b[0m', err);
  } finally {
    server.close();
  }

  // Summary report
  console.log('\n================================================================');
  console.log('   RELATÓRIO FINAL DE CONFORMIDADE — FASE 1.1.5');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\nTotal de Critérios Homologados: ${passedCount} / ${totalCount}`);
  if (passedCount === 10) {
    console.log('\x1b[32m\n★ 100% DOS CRITÉRIOS DE SEGURANÇA E ACESSO FORAM ATENDIDOS COM SUCESSO! ★\x1b[0m\n');
  } else {
    console.log('\x1b[31m\nATENÇÃO: Existem critérios que não passaram.\x1b[0m\n');
    process.exitCode = 1;
  }
}

runTests();
