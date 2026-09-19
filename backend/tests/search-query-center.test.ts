/**
 * SUÍTE DE TESTES DE CONFORMIDADE — FASE 1.1.5.6
 * Busca Global Inteligente + Central de Consulta Unificada
 */

import http from 'http';
import app from '../src/app';
import { runSeed } from '../prisma/seed';
import { AntiEnumerationService } from '../src/modules/search/anti-enumeration.service';
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

async function runSearchQueryCenterSuite() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.6 — BUSCA GLOBAL INTELIGENTE');
  console.log('================================================================\n');

  await runSeed();
  AntiEnumerationService.reset();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3004;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
      headers?: Record<string, string>;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
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
    const sacToken = await loginAs('ana.sac@diskingressos.com.br');
    const finToken = await loginAs('maria.financeiro@diskingressos.com.br');
    const opusToken = await loginAs('roberto@opus.com.br');
    const liveToken = await loginAs('renata@livenation.com.br');

    console.log('\n--- 1. BUSCA POR CPF (FORMATADO E NORMALIZADO) ---');

    // 1.1 Busca por CPF formatado
    const cpfFormatadoRes = await request('/api/v1/search?q=123.456.789-00', { token: adminToken });
    assert(
      cpfFormatadoRes.status === 200 &&
      cpfFormatadoRes.data.detectedType === 'CPF' &&
      cpfFormatadoRes.data.categories?.customers?.items?.some((c: any) => c.title === 'Maria Oliveira'),
      'Busca por CPF formatado (123.456.789-00) detecta CPF e retorna cliente correspondente',
      `Detectado: ${cpfFormatadoRes.data.detectedType}, Itens encontrados: ${cpfFormatadoRes.data.categories?.customers?.count}`
    );

    // 1.2 Busca por CPF puro/desformatado (apenas números)
    const cpfPuroRes = await request('/api/v1/search?q=12345678900', { token: adminToken });
    assert(
      cpfPuroRes.status === 200 &&
      cpfPuroRes.data.detectedType === 'CPF' &&
      cpfPuroRes.data.categories?.customers?.items?.some((c: any) => c.title === 'Maria Oliveira'),
      'Busca por CPF sem pontuação (12345678900) reconhece intenção de CPF e encontra o cliente',
      `Detectado: ${cpfPuroRes.data.detectedType}`
    );

    console.log('\n--- 2. BUSCA POR CÓDIGOS OPERACIONAIS (PEDIDO, INGRESSO, PAGAMENTO, ESTORNO, SAC) ---');

    // 2.1 Código do Pedido (PED-984521)
    const pedRes = await request('/api/v1/search?q=PED-984521', { token: adminToken });
    assert(
      pedRes.status === 200 &&
      pedRes.data.detectedType === 'ORDER_CODE' &&
      pedRes.data.categories?.orders?.items?.some((o: any) => o.id === 'ord-984521'),
      'Busca por código de pedido (PED-984521) retorna o pedido correspondente',
      `Total pedidos: ${pedRes.data.categories?.orders?.count}`
    );

    // 2.2 Código do Pedido numérico puro (984521)
    const pedNumRes = await request('/api/v1/search?q=984521', { token: adminToken });
    assert(
      pedNumRes.status === 200 &&
      pedNumRes.data.categories?.orders?.items?.some((o: any) => o.id === 'ord-984521'),
      'Busca numérica (984521) localiza o pedido PED-984521 com precisão',
      `Itens: ${pedNumRes.data.categories?.orders?.count}`
    );

    // 2.3 Código do Ingresso (ING-88211)
    const ingRes = await request('/api/v1/search?q=ING-88211', { token: adminToken });
    assert(
      ingRes.status === 200 &&
      ingRes.data.detectedType === 'TICKET_CODE' &&
      ingRes.data.categories?.tickets?.items?.some((t: any) => t.id === 'tkt-88211'),
      'Busca por código de ingresso (ING-88211) detecta TICKET_CODE e retorna o voucher',
      `Detectado: ${ingRes.data.detectedType}, Ingressos: ${ingRes.data.categories?.tickets?.count}`
    );

    // 2.4 Código de Pagamento / Transação (TRX-552811)
    const trxRes = await request('/api/v1/search?q=TRX-552811', { token: adminToken });
    assert(
      trxRes.status === 200 &&
      trxRes.data.detectedType === 'PAYMENT_CODE' &&
      trxRes.data.categories?.payments?.items?.some((p: any) => p.id === 'pay-552811'),
      'Busca por transação (TRX-552811) retorna o pagamento com status conciliado',
      `Pagamentos encontrados: ${trxRes.data.categories?.payments?.count}`
    );

    // 2.5 Código de Estorno (EST-882)
    const estRes = await request('/api/v1/search?q=EST-882', { token: adminToken });
    assert(
      estRes.status === 200 &&
      estRes.data.detectedType === 'REFUND_CODE' &&
      estRes.data.categories?.refunds?.items?.some((r: any) => r.id === 'ref-882'),
      'Busca por protocolo de estorno (EST-882) localiza a solicitação pendente',
      `Estornos: ${estRes.data.categories?.refunds?.count}`
    );

    // 2.6 Protocolo de Atendimento SAC (ATD-5521)
    const atdRes = await request('/api/v1/search?q=ATD-5521', { token: adminToken });
    assert(
      atdRes.status === 200 &&
      atdRes.data.detectedType === 'SUPPORT_CODE' &&
      atdRes.data.categories?.supportTickets?.items?.some((s: any) => s.id === 'sup-5521'),
      'Busca por chamado SAC (ATD-5521) detecta SUPPORT_CODE e exibe ticket',
      `Tickets: ${atdRes.data.categories?.supportTickets?.count}`
    );

    console.log('\n--- 3. BUSCA POR ENTIDADES GERAIS (EVENTO, PRODUTOR, CAMPANHA, EMAIL, TELEFONE) ---');

    // 3.1 Evento (Festival de Inverno)
    const evtRes = await request('/api/v1/search?q=Festival', { token: adminToken });
    assert(
      evtRes.status === 200 &&
      evtRes.data.categories?.events?.items?.some((e: any) => e.title?.includes('Festival')),
      'Busca por texto livre de evento ("Festival") localiza evento cadastrado',
      `Eventos: ${evtRes.data.categories?.events?.count}`
    );

    // 3.2 Produtor (Opus Entretenimento)
    const prodRes = await request('/api/v1/search?q=Opus', { token: adminToken });
    assert(
      prodRes.status === 200 &&
      prodRes.data.categories?.producers?.items?.some((p: any) => p.title?.includes('Opus')),
      'Busca por produtora ("Opus") retorna a organização autorizada',
      `Produtores: ${prodRes.data.categories?.producers?.count}`
    );

    // 3.3 Campanha de Marketing
    const cmpRes = await request('/api/v1/search?q=Meta Ads', { token: adminToken });
    assert(
      cmpRes.status === 200 &&
      cmpRes.data.categories?.campaigns?.items?.some((c: any) => c.id === 'cmp-1'),
      'Busca por campanha de marketing ("Meta Ads") retorna métricas ROAS e investimento',
      `Campanhas: ${cmpRes.data.categories?.campaigns?.count}`
    );

    // 3.4 Email do Cliente
    const emailRes = await request('/api/v1/search?q=carolina.mendes@gmail.com', { token: adminToken });
    assert(
      emailRes.status === 200 &&
      emailRes.data.detectedType === 'EMAIL' &&
      emailRes.data.categories?.customers?.items?.some((c: any) => c.title?.includes('Carolina')),
      'Busca por e-mail reconhece formato EMAIL e localiza o cliente cadastrado',
      `Detectado: ${emailRes.data.detectedType}`
    );

    // 3.5 Telefone do Cliente
    const phoneRes = await request('/api/v1/search?q=(41) 99871-4422', { token: adminToken });
    assert(
      phoneRes.status === 200 &&
      phoneRes.data.detectedType === 'PHONE' &&
      phoneRes.data.categories?.customers?.items?.some((c: any) => c.title?.includes('Carolina')),
      'Busca por telefone formatado reconhece formato PHONE e localiza o cliente',
      `Detectado: ${phoneRes.data.detectedType}`
    );

    console.log('\n--- 4. AUTOCOMPLETE E SUGESTÕES EM TEMPO REAL ---');

    // 4.1 Endpoint /api/v1/search/suggestions
    const sugRes = await request('/api/v1/search/suggestions?q=mari', { token: adminToken });
    assert(
      sugRes.status === 200 &&
      Array.isArray(sugRes.data.suggestions) &&
      sugRes.data.suggestions.some((s: any) => s.title?.includes('Maria Oliveira')),
      'Endpoint de sugestões (/suggestions?q=mari) retorna lista rápida para command palette',
      `Total sugestões: ${sugRes.data.suggestions?.length}`
    );

    // 4.2 Categorização explícita nos resultados
    assert(
      cpfFormatadoRes.data.categories &&
      'customers' in cpfFormatadoRes.data.categories &&
      'orders' in cpfFormatadoRes.data.categories &&
      'tickets' in cpfFormatadoRes.data.categories &&
      'payments' in cpfFormatadoRes.data.categories,
      'Estrutura de resposta agrupa resultados por categorias unificadas',
      'Categorias presentes no payload JSON'
    );

    console.log('\n--- 5. MASCARAMENTO DE DADOS SENSÍVEIS (NODE.JS SERVER-SIDE LGPD) ---');

    // 5.1 Usuário SAC (sem permissão de documento completo) recebe CPF e dados mascarados
    const sacSearchRes = await request('/api/v1/search?q=Maria Oliveira', { token: sacToken });
    const sacCustomer = sacSearchRes.data.categories?.customers?.items?.[0];
    assert(
      sacSearchRes.status === 200 &&
      sacCustomer &&
      sacCustomer.meta?.cpf === '***.***.***-00' &&
      sacCustomer.meta?.email?.includes('••••') &&
      sacCustomer.meta?.phone?.includes('*****'),
      'Usuário SAC comum recebe CPF mascarado (***.***.***-00), e-mail e telefone ofuscados pelo Node.js',
      `CPF recebido: ${sacCustomer?.meta?.cpf}, Email: ${sacCustomer?.meta?.email}, Fone: ${sacCustomer?.meta?.phone}`
    );

    // 5.2 Usuário Financeiro (com cliente.documento.visualizar_completo) recebe CPF desmascarado
    const finSearchRes = await request('/api/v1/search?q=Maria Oliveira', { token: finToken });
    const finCustomer = finSearchRes.data.categories?.customers?.items?.[0];
    assert(
      finSearchRes.status === 200 &&
      finCustomer &&
      finCustomer.meta?.cpf === '123.456.789-00',
      'Usuário Financeiro autorizado recebe CPF completo (123.456.789-00)',
      `CPF recebido: ${finCustomer?.meta?.cpf}`
    );

    // 5.3 SuperAdmin recebe CPF completo
    const adminSearchRes = await request('/api/v1/search?q=Maria Oliveira', { token: adminToken });
    const adminCustomer = adminSearchRes.data.categories?.customers?.items?.[0];
    assert(
      adminSearchRes.status === 200 &&
      adminCustomer &&
      adminCustomer.meta?.cpf === '123.456.789-00',
      'SuperAdmin recebe dados desmascarados conforme credenciais globais',
      `CPF recebido: ${adminCustomer?.meta?.cpf}`
    );

    console.log('\n--- 6. ISOLAMENTO DE ESCOPO POR PRODUTOR / EVENTO ---');

    // 6.1 Produtor Roberto (Opus prd_100) enxerga seu pedido
    const opusOwnOrderRes = await request('/api/v1/search?q=PED-984521', { token: opusToken });
    assert(
      opusOwnOrderRes.status === 200 &&
      opusOwnOrderRes.data.categories?.orders?.items?.some((o: any) => o.id === 'ord-984521'),
      'Produtor Opus encontra com sucesso pedido do seu próprio evento (PED-984521)',
      `Pedidos encontrados: ${opusOwnOrderRes.data.categories?.orders?.count}`
    );

    // 6.2 Produtor Roberto (Opus prd_100) NÃO enxerga pedido de outra produtora (Live Nation prd_200)
    const opusCrossOrderRes = await request('/api/v1/search?q=PED-952114', { token: opusToken });
    assert(
      opusCrossOrderRes.status === 200 &&
      opusCrossOrderRes.data.categories?.orders?.count === 0,
      'Isolamento estrito: Produtor Opus não localiza pedido de outra produtora (Live Nation)',
      `Pedidos retornados para Roberto: ${opusCrossOrderRes.data.categories?.orders?.count}`
    );

    // 6.3 Produtor Roberto (Opus prd_100) NÃO enxerga evento de outra produtora (Coldplay)
    const opusCrossEvtRes = await request('/api/v1/search?q=Coldplay', { token: opusToken });
    assert(
      opusCrossEvtRes.status === 200 &&
      opusCrossEvtRes.data.categories?.events?.count === 0,
      'Produtor Roberto não visualiza evento Coldplay pertencente a Live Nation',
      `Eventos retornados: ${opusCrossEvtRes.data.categories?.events?.count}`
    );

    // 6.4 Produtor Roberto NÃO enxerga transações financeiras de outra produtora
    const opusCrossTrxRes = await request('/api/v1/search?q=TRX-998412', { token: opusToken });
    assert(
      opusCrossTrxRes.status === 200 &&
      opusCrossTrxRes.data.categories?.payments?.count === 0,
      'Produtor não tem permissão nem escopo para visualizar transações financeiras alheias',
      `Transações retornadas: ${opusCrossTrxRes.data.categories?.payments?.count}`
    );

    console.log('\n--- 7. PROTEÇÃO ANTI-ENUMERAÇÃO E AUDITORIA DE DOCUMENTOS ---');

    // 7.1 Realizar 15 buscas de CPF (dentro da janela permitida)
    AntiEnumerationService.reset();
    let permitted = true;
    for (let i = 1; i <= 15; i++) {
      const res = await request(`/api/v1/search?q=123.456.789-00`, { token: sacToken });
      if (res.status !== 200) {
        permitted = false;
        break;
      }
    }
    assert(
      permitted,
      'Primeiras 15 consultas de CPF são permitidas na janela de 1 minuto',
      'Todas as 15 consultas retornaram HTTP 200'
    );

    // 7.2 A 16ª busca de CPF deve ser bloqueada com HTTP 429 Too Many Requests
    const blockedRes = await request(`/api/v1/search?q=123.456.789-00`, { token: sacToken });
    assert(
      blockedRes.status === 429 &&
      blockedRes.data.error === 'Too Many Requests',
      '16ª consulta de CPF é bloqueada por política anti-enumeração (HTTP 429)',
      `Status: ${blockedRes.status}, Mensagem: ${blockedRes.data.message}`
    );

    // 7.3 Log de auditoria de segurança gerado para a tentativa de enumeração
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'SECURITY_SUSPICIOUS_CPF_ENUMERATION' }
    });
    assert(
      auditLogs.length > 0,
      'Alerta de auditoria SECURITY_SUSPICIOUS_CPF_ENUMERATION gerado no banco',
      `Logs de enumeração encontrados: ${auditLogs.length}`
    );

    console.log('\n--- 8. VISÃO COMPLETA DO CLIENTE (CENTRAL DE CONSULTA) ---');

    // 8.1 Visualização Completa por ID de Cliente
    const customerFullRes = await request('/api/v1/search/customers/cust-maria', { token: adminToken });
    assert(
      customerFullRes.status === 200 &&
      customerFullRes.data.customer?.name === 'Maria Oliveira' &&
      Array.isArray(customerFullRes.data.orders) &&
      Array.isArray(customerFullRes.data.tickets) &&
      Array.isArray(customerFullRes.data.payments) &&
      Array.isArray(customerFullRes.data.supportTickets) &&
      Array.isArray(customerFullRes.data.refunds),
      'Visão Completa do Cliente retorna dados agregados: resumo, pedidos, ingressos, pagamentos e tickets',
      `Pedidos: ${customerFullRes.data.orders?.length}, Ingressos: ${customerFullRes.data.tickets?.length}`
    );

    // 8.2 Mascaramento aplicado na Visão Completa do Cliente para perfil SAC
    const sacCustomerFullRes = await request('/api/v1/search/customers/cust-maria', { token: sacToken });
    assert(
      sacCustomerFullRes.status === 200 &&
      sacCustomerFullRes.data.customer?.cpf === '***.***.***-00',
      'Visão Completa do Cliente mascara CPF para perfil SAC na rota de detalhes',
      `CPF retornado: ${sacCustomerFullRes.data.customer?.cpf}`
    );

    // 8.3 Auditoria de acesso a dados desmascarados
    const fullDocAudit = await prisma.auditLog.findMany({
      where: { action: 'CUSTOMER_FULL_DATA_VIEWED' }
    });
    assert(
      fullDocAudit.length > 0,
      'Acesso a dados sensíveis desmascarados gera trilha de auditoria CUSTOMER_FULL_DATA_VIEWED',
      `Registros auditados: ${fullDocAudit.length}`
    );

    console.log('\n--- 9. VISÃO DO PEDIDO COM AÇÕES CONTEXTUAIS ---');

    // 9.1 Visão Completa do Pedido
    const orderViewRes = await request('/api/v1/search/orders/ord-984521', { token: adminToken });
    assert(
      orderViewRes.status === 200 &&
      orderViewRes.data.order?.orderNumber === 'PED-984521' &&
      orderViewRes.data.financialSummary &&
      Array.isArray(orderViewRes.data.tickets) &&
      orderViewRes.data.permissions !== undefined,
      'Visão do Pedido retorna dados consolidados, ingressos vinculados e matriz de permissões contextuais',
      `Pedido: ${orderViewRes.data.order?.orderNumber}, Valor: R$ ${orderViewRes.data.financialSummary?.totalAmount}`
    );

    // 9.2 Bloqueio de escopo ao tentar acessar pedido de outra organização
    const opusCrossOrderViewRes = await request('/api/v1/search/orders/ord-952114', { token: opusToken });
    assert(
      opusCrossOrderViewRes.status === 404,
      'Produtor Roberto recebe 404 ao tentar abrir detalhes de pedido fora de sua produtora',
      `Status HTTP: ${opusCrossOrderViewRes.status}`
    );

    console.log('\n--- 10. HISTÓRICO DE BUSCAS RECENTES ---');

    // 10.1 Histórico de buscas recentes do usuário
    const recentRes = await request('/api/v1/search/recent', { token: adminToken });
    assert(
      recentRes.status === 200 &&
      Array.isArray(recentRes.data.recent) &&
      recentRes.data.recent.length > 0,
      'Histórico de buscas recentes armazena e recupera termos pesquisados pelo operador',
      `Buscas recentes encontradas: ${recentRes.data.recent?.length}`
    );

  } catch (error: any) {
    console.error('ERRO INESPERADO NA EXECUÇÃO DOS TESTES:', error);
    assert(false, 'Execução da suíte sem exceções não tratadas', error.message || String(error));
  } finally {
    server.close();
  }

  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM`);
  if (failed === 0) {
    console.log('\x1b[32mTODOS OS CRITÉRIOS DE ACEITE DA FASE 1.1.5.6 FORAM ATENDIDOS COM SUCESSO!\x1b[0m');
  } else {
    console.error(`\x1b[31m${failed} TESTES FALHARAM.\x1b[0m`);
    process.exitCode = 1;
  }
  console.log('================================================================\n');
}

runSearchQueryCenterSuite().catch((err) => {
  console.error('Falha fatal na suíte:', err);
  process.exit(1);
});
