/**
 * Testes Automatizados - Fase 1.1.5.12
 * Central de Auditoria, Observabilidade e Rastreabilidade Operacional Unificada
 */

import { memoryDb } from '../src/core/database/prisma';
import {
  AuditSanitizerService,
  AuditRepository,
  AuditService,
  TraceContext,
  TracingService,
  LoggerService,
  MetricRegistry,
  MetricsService,
  ERROR_CATALOG,
  ErrorClassifierService,
  ErrorGroupingService,
  ErrorService,
  HealthCheckRegistry,
  HealthService,
  defaultTelemetryProvider
} from '../src/observability/index';
import { QueryParserService } from '../src/modules/search/query-parser.service';
import { ObservabilitySearchProvider } from '../src/modules/search/providers/observability.search';

async function runTests() {
  console.log('================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.12 — OBSERVABILIDADE & AUDITORIA');
  console.log('================================================================\n');

  memoryDb.seedDefaults();

  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, msg: string) => {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${msg}`);
      throw new Error(`Falha no teste: ${msg}`);
    }
  };

  // ----------------------------------------------------------------------------
  // BLOCO 1: CORRELATION ID, REQUEST ID E CONTEXTO DE RASTREAMENTO
  // ----------------------------------------------------------------------------
  console.log('--- [1/8] Correlation ID, Request ID e Contexto ---');

  const corId1 = TraceContext.generateCorrelationId();
  assert(/^COR-\d{8}-[A-F0-9]{6}$/.test(corId1), 'Critério 1: Correlation ID gerado no formato padronizado COR-YYYYMMDD-XXXXXX');

  const reqId1 = TraceContext.generateRequestId();
  assert(/^REQ-[A-F0-9]{8}$/.test(reqId1), 'Critério 2: Request ID gerado no formato padronizado REQ-XXXXXXXX');

  let insideContextChecked = false;
  TraceContext.runWithContext({
    correlationId: corId1,
    requestId: reqId1,
    userId: 'usr-admin-1',
    userName: 'Vinicius Casagrande',
    producerId: 'prd_100',
    startTime: Date.now()
  }, () => {
    const ctx = TraceContext.getContext();
    insideContextChecked = (
      ctx?.correlationId === corId1 &&
      ctx?.requestId === reqId1 &&
      ctx?.userId === 'usr-admin-1' &&
      ctx?.producerId === 'prd_100'
    );
  });
  assert(insideContextChecked, 'Critério 3: Contexto assíncrono propagado corretamente via AsyncLocalStorage / TraceContext');

  // ----------------------------------------------------------------------------
  // BLOCO 2: SANITIZAÇÃO CENTRAL E TRILHA DE AUDITORIA IMUTÁVEL
  // ----------------------------------------------------------------------------
  console.log('\n--- [2/8] Sanitização Central e Trilha de Auditoria ---');

  const dirtyPayload = {
    eventName: 'Festival Curitiba 2026',
    password: 'super_secret_password',
    token: 'jwt.bearer.secret_token',
    creditCard: '4111.1111.1111.1234',
    cvv: '123',
    nestedConfig: {
      totpSecret: 'JBSWY3DPEHPK3PXP',
      safeParam: 50000
    }
  };

  const sanitized = AuditSanitizerService.sanitize(dirtyPayload);
  assert(sanitized.eventName === 'Festival Curitiba 2026', 'Critério 4: Campos permitidos mantidos intactos na sanitização');
  assert(sanitized.password === '[REDACTED]' && sanitized.token === '[REDACTED]' && sanitized.creditCard === '[REDACTED]', 'Critério 5: Senhas, tokens e dados de cartão mascarados com [REDACTED]');
  assert(sanitized.nestedConfig.totpSecret === '[REDACTED]' && sanitized.nestedConfig.safeParam === 50000, 'Critério 6: Sanitização recursiva em objetos aninhados');

  const auditRepo = new AuditRepository();
  const auditService = new AuditService(auditRepo);

  const auditEntry = await auditService.logAction({
    correlationId: corId1,
    requestId: reqId1,
    userId: 'usr-admin-1',
    userName: 'Vinicius Casagrande',
    module: 'FINANCE',
    action: 'TRANSFER_APPROVED',
    resourceType: 'TRANSFER',
    resourceId: 'TRF-8821',
    producerId: 'prd_100',
    ipAddress: '189.44.120.19',
    beforeData: { amount: 50000, status: 'PENDING_APPROVAL', password: 'plain_secret' },
    afterData: { amount: 50000, status: 'APPROVED', password: 'plain_secret' },
    result: 'SUCCESS'
  });

  assert(auditEntry.id.startsWith('aud_'), 'Critério 7: Registro de auditoria persistido com ID e timestamps');
  assert(auditEntry.ipHash !== null && auditEntry.ipHash.length > 0, 'Critério 8: Hash de IP gerado para privacidade LGPD');
  assert(auditEntry.beforeData.password === '[REDACTED]', 'Critério 9: Trilha de auditoria armazena apenas dados pré-sanitizados');

  const diffRecord = await auditService.getAuditById(auditEntry.id);
  assert(diffRecord !== null, 'Critério 10: Busca de auditoria por ID retorna registro com sucesso');
  assert(diffRecord?.diffFields.length === 1 && diffRecord.diffFields[0].field === 'status', 'Critério 11: Diff estruturado identifica apenas o campo alterado (status: PENDING_APPROVAL -> APPROVED)');

  // Imutabilidade
  let mutationBlocked = false;
  try {
    await auditService.updateAudit();
  } catch (err: any) {
    mutationBlocked = err.message.includes('IMUTABILIDADE VIOLADA');
  }
  assert(mutationBlocked, 'Critério 12: Tentativa de alteração em registro de auditoria é estritamente bloqueada por imutabilidade');

  let deletionBlocked = false;
  try {
    await auditService.deleteAudit();
  } catch (err: any) {
    deletionBlocked = err.message.includes('IMUTABILIDADE VIOLADA');
  }
  assert(deletionBlocked, 'Critério 13: Tentativa de exclusão em registro de auditoria é estritamente bloqueada por imutabilidade');

  // Isolamento de escopo por RBAC
  const producerOpusUser = {
    id: 'usr-opus',
    roleSlug: 'produtor',
    scope: { type: 'PRODUCER', producerIds: ['prd_100'] }
  };
  const producerLiveNationUser = {
    id: 'usr-livenation',
    roleSlug: 'produtor',
    scope: { type: 'PRODUCER', producerIds: ['prd_200'] }
  };

  const opusLogs = await auditService.getAuditLogs({ producerId: 'prd_100' }, producerOpusUser);
  assert(opusLogs.items.length >= 1, 'Critério 14: Produtor Opus consulta com sucesso auditoria dos seus próprios recursos');

  let scopeLeakBlocked = false;
  try {
    await auditService.getAuditLogs({ producerId: 'prd_100' }, producerLiveNationUser);
  } catch (err: any) {
    scopeLeakBlocked = err.message.includes('Acesso negado');
  }
  assert(scopeLeakBlocked, 'Critério 15: Isolamento de escopo: Produtor B é bloqueado ao tentar consultar auditoria do Produtor A');

  // Exportação auditada
  const exportResult = await auditService.exportAudit({ format: 'CSV', module: 'FINANCE' }, producerOpusUser);
  assert(exportResult.mimeType === 'text/csv' && exportResult.content.includes('TRANSFER_APPROVED'), 'Critério 16: Exportação de auditoria em CSV gerada com sucesso');

  const exportAuditLogs = await auditService.getAuditLogs({ action: 'EXPORT' });
  assert(exportAuditLogs.items.length >= 1, 'Critério 17: Toda ação de exportação de auditoria gera seu próprio registro auditado');

  // ----------------------------------------------------------------------------
  // BLOCO 3: RASTREABILIDADE OPERACIONAL, TRACES E SPANS
  // ----------------------------------------------------------------------------
  console.log('\n--- [3/8] Rastreabilidade Operacional e Spans ---');

  const tracingService = new TracingService();
  const trace = await tracingService.startTrace({
    correlationId: corId1,
    operationName: 'Transferência Bancária #TRF-8821',
    rootResourceType: 'TRANSFER',
    rootResourceId: 'TRF-8821',
    userId: 'usr-admin-1',
    userName: 'Vinicius Casagrande',
    producerId: 'prd_100'
  });

  assert(trace.correlationId === corId1 && trace.status === 'IN_PROGRESS', 'Critério 18: Início de trace operacional registrado com sucesso');

  const span1 = await tracingService.startSpan({
    correlationId: corId1,
    serviceName: 'PolicyEngine',
    operation: 'resolveEffectivePolicy',
    metadata: { rule: 'FINANCE-v7' }
  });

  await tracingService.endSpan({
    spanId: span1.id,
    status: 'SUCCESS'
  });

  const span2 = await tracingService.startSpan({
    correlationId: corId1,
    serviceName: 'BankAdapter',
    operation: 'executePixSPI',
    metadata: { endpoint: '/pix/v2/transfer' }
  });

  await tracingService.endSpan({
    spanId: span2.id,
    status: 'SUCCESS'
  });

  // Associa política e aprovação ao trace
  await tracingService.linkPolicyToTrace(corId1, {
    key: 'finance.transfer.approval.threshold',
    version: 7,
    decision: { approvalsRequired: 2, stepUpRequired: true },
    explanation: 'Operação de valor elevado exige dupla aprovação e 2FA conforme política financeira v7.'
  });

  await tracingService.linkApprovalToTrace(corId1, 'APR-1001');

  const completedTrace = await tracingService.endTrace(corId1, 'COMPLETED');
  assert(completedTrace.status === 'COMPLETED', 'Critério 19: Finalização de trace com status COMPLETED');
  assert(completedTrace.spans !== undefined && completedTrace.spans.length === 2, 'Critério 20: Rastreamento detalhado contém todos os spans vinculados à operação');
  assert(completedTrace.policyKey === 'finance.transfer.approval.threshold', 'Critério 21: Associação de decisão de negócio / Policy Engine gravada no trace');
  assert(completedTrace.approvalRequestId === 'APR-1001', 'Critério 22: Associação com Motor de Aprovações gravada no trace');

  const timeline = await tracingService.getTimelineByResource('TRANSFER', 'TRF-8821');
  assert(timeline.length >= 1 && timeline[0].correlationId === corId1, 'Critério 23: Reconstrução da história e timeline por recurso (TRANSFER #TRF-8821)');

  // ----------------------------------------------------------------------------
  // BLOCO 4: CATÁLOGO DE ERROS, CLASSIFICAÇÃO E AGROUPAMENTO INTELIGENTE
  // ----------------------------------------------------------------------------
  console.log('\n--- [4/8] Catálogo de Erros e Agrupamento Inteligente ---');

  const knownDef = ERROR_CATALOG.INTEGRATION_TIMEOUT;
  assert(knownDef !== undefined && knownDef.httpStatus === 504, 'Critério 24: Catálogo padronizado de erros contém INTEGRATION_TIMEOUT');

  const classified = ErrorClassifierService.classify(new Error('BankAdapter connection timeout after 10000ms'));
  assert(classified.errorCode === 'INTEGRATION_TIMEOUT', 'Critério 25: Classificador identifica erro técnico e mapeia para código de catálogo');
  assert(!classified.userFriendlyMessage.includes('10000ms') && !classified.userFriendlyMessage.includes('stack'), 'Critério 26: Mensagem de erro ao usuário é segura e sem detalhes técnicos internos');

  const errorGroupingService = new ErrorGroupingService();
  const errorService = new ErrorService(errorGroupingService);

  const fp1 = ErrorGroupingService.calculateFingerprint('INTEGRATION_TIMEOUT', 'BankAdapter', 'executeTransfer');
  const fp2 = ErrorGroupingService.calculateFingerprint('INTEGRATION_TIMEOUT', 'BankAdapter', 'executeTransfer');
  assert(fp1 === fp2, 'Critério 27: Fingerprint determinístico idêntico para mesmo erro, serviço e operação');

  // Captura primeira ocorrência
  const errCapture1 = await errorService.captureError(new Error('BankAdapter connection timeout'), {
    service: 'BankAdapter',
    operation: 'executeTransfer',
    correlationId: corId1,
    producerId: 'prd_100'
  });

  assert(errCapture1.group.occurrencesCount === 1, 'Critério 28: Primeira ocorrência cria novo grupo de erros com contador = 1');

  // Captura segunda ocorrência do mesmo erro
  const errCapture2 = await errorService.captureError(new Error('BankAdapter connection timeout 2'), {
    service: 'BankAdapter',
    operation: 'executeTransfer',
    correlationId: corId1,
    producerId: 'prd_100'
  });

  assert(errCapture2.group.id === errCapture1.group.id, 'Critério 29: Erro repetido é agrupado no mesmo grupo existente');
  assert(errCapture2.group.occurrencesCount === 2, 'Critério 30: Contador de ocorrências incrementado com precisão');

  // Proteção de Stack Trace por RBAC
  const regularOperator = { id: 'usr-op', roleSlug: 'atendimento_sac', permissions: ['observabilidade.erro.visualizar'] };
  const techLead = { id: 'usr-lead', roleSlug: 'admin_geral', permissions: ['observabilidade.erro.detalhe_tecnico'] };

  const groupForOperator = await errorService.getErrorGroupById(errCapture1.group.id, regularOperator);
  assert(
    groupForOperator?.occurrences?.[0]?.stackTrace?.includes('ACESSO RESTRITO') === true,
    'Critério 31: Stack trace técnico é mascarado para operadores sem permissão observabilidade.erro.detalhe_tecnico'
  );

  const groupForTechLead = await errorService.getErrorGroupById(errCapture1.group.id, techLead);
  assert(
    groupForTechLead?.occurrences?.[0]?.stackTrace?.includes('ACESSO RESTRITO') === false,
    'Critério 32: Stack trace técnico completo é visível para usuário com permissão autorizada'
  );

  // ----------------------------------------------------------------------------
  // BLOCO 5: LOGS ESTRUTURADOS E TELEMETRIA
  // ----------------------------------------------------------------------------
  console.log('\n--- [5/8] Logs Estruturados e Níveis de Log ---');

  const logger = new LoggerService('test-service', 'WARN');
  const debugIgnored = logger.debug('Isso não deve ser logado pois nível mínimo é WARN');
  assert(debugIgnored === null, 'Critério 33: Níveis de log abaixo do configurado são descartados sem processamento');

  const warnLogged = logger.warn('Alerta de fila em sobrecarga', { queueSize: 85 }, 'QUEUE_OVERLOAD');
  assert(warnLogged !== null && warnLogged.level === 'WARN', 'Critério 34: Log estruturado emitido com level, correlationId e mensagem');

  // Telemetry Provider
  await defaultTelemetryProvider.recordSpan({
    traceId: corId1,
    spanId: 'SPAN-TEST',
    name: 'TelemetryVerification',
    startTime: Date.now(),
    attributes: { service: 'Observability' },
    status: 'OK'
  });
  const exportedSpans = await defaultTelemetryProvider.exportSpans();
  assert(exportedSpans.some(s => s.spanId === 'SPAN-TEST'), 'Critério 35: Provedor de telemetria desacoplado armazena e exporta spans');

  // ----------------------------------------------------------------------------
  // BLOCO 6: MÉTRICAS, PERCENTIS E ANTI-CARDINALIDADE
  // ----------------------------------------------------------------------------
  console.log('\n--- [6/8] Métricas, Percentis e Anti-Cardinalidade ---');

  const metricsService = new MetricsService();
  metricsService.recordHttpRequest('GET', '/api/v1/finance/transfers', 200, 85, 'financeiro');
  metricsService.recordHttpRequest('GET', '/api/v1/finance/transfers', 200, 390, 'financeiro');
  metricsService.recordHttpRequest('GET', '/api/v1/finance/transfers', 500, 920, 'financeiro');

  const percentiles = metricsService.calculatePercentiles([85, 120, 190, 240, 310, 390, 450, 720, 920]);
  assert(percentiles.p50 > 0 && percentiles.p95 >= percentiles.p50 && percentiles.p99 >= percentiles.p95, 'Critério 36: Percentis de latência P50, P95 e P99 calculados ordenadamente');

  let explosiveCardinalityBlocked = false;
  try {
    MetricRegistry.increment('requests_total', 1, {
      method: 'POST',
      userId: 'usr_unique_id_every_time' // Proibido!
    });
  } catch (err: any) {
    explosiveCardinalityBlocked = err.message.includes('Cardinalidade explosiva rejeitada');
  }
  assert(explosiveCardinalityBlocked, 'Critério 37: Prevenção de cardinalidade explosiva rejeita labels de IDs individuais em métricas');

  metricsService.recordSlowQuery('Financeiro', 'Conciliação em Lote', 4821);
  const dbMetrics = metricsService.getDatabaseMetrics();
  assert(dbMetrics.slowQueriesCount >= 1, 'Critério 38: Monitoramento do PostgreSQL detecta e cataloga slow queries');

  // ----------------------------------------------------------------------------
  // BLOCO 7: SAÚDE DO SISTEMA, ALERTAS E DEDUPLICAÇÃO
  // ----------------------------------------------------------------------------
  console.log('\n--- [7/8] Saúde do Sistema, Alertas e Deduplicação ---');

  const healthService = new HealthService();

  // Disparo 1 do alerta de banco
  const alert1 = await healthService.triggerAlert({
    alertCode: 'DATABASE_DEGRADED',
    title: 'PostgreSQL com lentidão no pool',
    severity: 'WARNING',
    component: 'POSTGRESQL',
    deduplicationKey: 'ALERT_POSTGRESQL_POOL_SLOW'
  });
  assert(alert1.isNew === true && alert1.alert.occurrencesCount === 1, 'Critério 39: Primeiro disparo de alerta cria registro ativo');

  // Disparo 2 do mesmo alerta (simulando 100 repetições)
  const alert2 = await healthService.triggerAlert({
    alertCode: 'DATABASE_DEGRADED',
    title: 'PostgreSQL com lentidão no pool',
    severity: 'WARNING',
    component: 'POSTGRESQL',
    deduplicationKey: 'ALERT_POSTGRESQL_POOL_SLOW'
  });
  assert(alert2.isNew === false && alert2.alert.occurrencesCount === 2, 'Critério 40: Deduplicação de alertas: repetições incrementam contador sem duplicar alertas ativos');

  const systemHealth = await healthService.getSystemHealth();
  assert(systemHealth.components.length === 7, 'Critério 41: Monitoramento avalia todos os 7 componentes centrais de infraestrutura');
  assert(systemHealth.activeAlertsCount >= 1, 'Critério 42: Alertas ativos são consolidados na saúde geral do sistema');

  const eventHealth = await healthService.getEventHealth('evt_1001');
  assert(eventHealth.subsystems.length >= 5, 'Critério 43: Saúde de evento ao vivo detalha subsistemas operacionais (Vendas, PIX, Check-in)');

  // ----------------------------------------------------------------------------
  // BLOCO 8: BUSCA GLOBAL POR IDENTIFICADORES TÉCNICOS
  // ----------------------------------------------------------------------------
  console.log('\n--- [8/8] Integração com Busca Global (COR, REQ, ERR) ---');

  const queryCor = QueryParserService.parse(corId1);
  assert(queryCor.detectedType === 'CORRELATION_ID', 'Critério 44: QueryParserService detecta identificador COR-...');

  const queryReq = QueryParserService.parse(reqId1);
  assert(queryReq.detectedType === 'REQUEST_ID', 'Critério 45: QueryParserService detecta identificador REQ-...');

  const queryErr = QueryParserService.parse('ERR-8F72');
  assert(queryErr.detectedType === 'ERROR_CODE', 'Critério 46: QueryParserService detecta identificador ERR-...');

  const searchResults = await ObservabilitySearchProvider.search(queryCor, { type: 'GLOBAL' }, {
    id: 'usr-admin-1',
    roles: ['ADMIN'],
    permissions: ['observabilidade.trace.visualizar']
  } as any);

  assert(searchResults.some(r => r.entityType === 'TRACE' && r.title.includes(corId1)), 'Critério 47: Busca Global localiza trace operacional diretamente pelo Correlation ID');

  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM`);
  console.log('TODOS OS CRITÉRIOS DA FASE 1.1.5.12 FORAM ATENDIDOS COM SUCESSO!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES:', err);
  process.exit(1);
});
