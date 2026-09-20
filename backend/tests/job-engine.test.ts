import { JobService } from '../src/jobs/core/job.service';
import { JobRegistry } from '../src/jobs/core/job.registry';
import { QueueService } from '../src/jobs/queue/queue.service';
import { InMemoryQueueProvider } from '../src/jobs/queue/queue.provider';
import { WorkerService } from '../src/jobs/workers/worker.service';
import { BatchService } from '../src/jobs/batches/batch.service';
import { DependencyService } from '../src/jobs/orchestration/dependency.service';
import { JobOrchestrator } from '../src/jobs/orchestration/orchestrator.service';
import { SchedulerService } from '../src/jobs/scheduler/scheduler.service';
import { DistributedLockService } from '../src/jobs/scheduler/distributed-lock.service';
import { EventBus } from '../src/events/event-bus';
import { prisma } from '../src/core/database/prisma';
import { User, JobPriority, JobQueue } from '@shared/types/index';

// Test runner helpers
let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.14 — CENTRAL DE JOBS & LOTES    ');
  console.log('================================================================\n');

  // Test Users
  const adminUser: User = {
    id: 'usr-admin-01',
    name: 'Administrador Geral',
    role: 'ADMINISTRADOR_GERAL',
    permissions: ['*'],
    scope: { type: 'GLOBAL', isGlobal: true }
  };

  const financeUser: User = {
    id: 'usr-fin-01',
    name: 'Analista Financeiro',
    role: 'FINANCEIRO',
    permissions: [
      'processamentos.central.visualizar',
      'processamentos.job.visualizar',
      'processamentos.job.reprocessar',
      'processamentos.lote.visualizar',
      'processamentos.lote.executar',
      'processamentos.agendamento.visualizar',
      'processamentos.fila.visualizar',
      'financeiro.conciliacao.executar',
      'financeiro.repasses.aprovar',
      'financeiro.pagamento.criar'
    ],
    scope: { type: 'GLOBAL', isGlobal: true }
  };

  const producerAUser: User = {
    id: 'usr-prod-a',
    name: 'Produtor Opus',
    role: 'PRODUTOR',
    permissions: [
      'processamentos.central.visualizar',
      'processamentos.job.visualizar',
      'relatorios.relatorio.visualizar',
      'relatorios.exportacao.criar'
    ],
    scope: { type: 'PRODUCER', isGlobal: false, producerId: 'prd_100' }
  };

  const producerBUser: User = {
    id: 'usr-prod-b',
    name: 'Produtor Live Nation',
    role: 'PRODUTOR',
    permissions: [
      'processamentos.central.visualizar',
      'processamentos.job.visualizar'
    ],
    scope: { type: 'PRODUCER', isGlobal: false, producerId: 'prd_200' }
  };

  const marketingUser: User = {
    id: 'usr-mkt-01',
    name: 'Especialista Marketing',
    role: 'MARKETING',
    permissions: [
      'processamentos.central.visualizar',
      'processamentos.job.visualizar',
      'marketing.campanha.publicar',
      'marketing.pixel.configurar'
    ],
    scope: { type: 'GLOBAL', isGlobal: true }
  };

  // Seed Users into DB for Scheduler & RBAC verification
  await prisma.user.create({
    data: {
      id: adminUser.id,
      name: adminUser.name,
      email: 'admin@disk.com',
      status: 'ACTIVE'
    }
  });

  const blockedUser: User = {
    id: 'usr-blocked-01',
    name: 'Operador Desligado',
    role: 'FINANCEIRO',
    permissions: ['processamentos.agendamento.criar'],
    scope: { type: 'GLOBAL', isGlobal: true }
  };

  await prisma.user.create({
    data: {
      id: blockedUser.id,
      name: blockedUser.name,
      email: 'desligado@disk.com',
      status: 'BLOCKED'
    }
  });

  const jobService = JobService.getInstance();
  const queueService = jobService.queueService;
  const registry = jobService.registry;
  const batchService = new BatchService(jobService.repository, queueService);
  const orchestrator = new JobOrchestrator();
  const scheduler = jobService.schedulerService;

  // -------------------------------------------------------------
  // BLOCO 1: Job Registry & Isolamento Contra Jobs Arbitrários
  // -------------------------------------------------------------
  console.log('--- BLOCO 1: Job Registry & Bloqueio Contra Jobs Arbitrários ---');
  const catalog = registry.list();
  assert(catalog.length >= 12, `Catálogo oficial de jobs contém ${catalog.length} tipos registrados (mínimo 12 esperado)`);
  assert(registry.has('FINANCE_RECONCILIATION'), 'Job FINANCE_RECONCILIATION cadastrado no catálogo');
  assert(registry.has('PAYOUT_CALCULATION'), 'Job PAYOUT_CALCULATION cadastrado no catálogo');
  assert(registry.has('CNAB_GENERATION'), 'Job CNAB_GENERATION cadastrado no catálogo');
  assert(registry.has('REPORT_EXPORT_JOB'), 'Job REPORT_EXPORT_JOB cadastrado no catálogo');
  assert(registry.has('MARKETING_CAMPAIGN_DISPATCH'), 'Job MARKETING_CAMPAIGN_DISPATCH cadastrado no catálogo');
  assert(registry.has('WEBHOOK_PROCESSING'), 'Job WEBHOOK_PROCESSING cadastrado no catálogo');

  let arbitraryError = false;
  try {
    await jobService.createJob({
      type: 'ARBITRARY_DROP_DATABASE_JOB',
      payload: {}
    }, adminUser);
  } catch (err: any) {
    arbitraryError = true;
    assert(err.message.includes('não cadastrado no catálogo oficial'), 'Job arbitrário não catalogado foi rejeitado');
  }
  assert(arbitraryError, 'Bloqueio contra injeção de jobs arbitrários validado');

  // -------------------------------------------------------------
  // BLOCO 2: Filas Lógicas, Prioridade & Isolamento de Críticos
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 2: Filas Lógicas, Prioridade & Isolamento de Críticos ---');
  await queueService.clear();

  // Enfileirar jobs de diferentes prioridades
  const lowJob = await jobService.createJob({
    type: 'MARKETING_SYNC_ADS',
    priority: 'LOW',
    queue: 'integrations',
    payload: { provider: 'Meta' }
  }, marketingUser);

  const normalJob = await jobService.createJob({
    type: 'REPORT_EXPORT_JOB',
    priority: 'NORMAL',
    queue: 'analytics',
    payload: { reportId: 'rep_123', totalRows: 500 }
  }, adminUser);

  const criticalJob = await jobService.createJob({
    type: 'WEBHOOK_PROCESSING',
    priority: 'CRITICAL',
    queue: 'critical',
    payload: { eventId: 'wh_evt_999' }
  }, adminUser);

  const highJob = await jobService.createJob({
    type: 'FINANCE_RECONCILIATION',
    priority: 'HIGH',
    queue: 'finance',
    payload: { period: '2026-09' }
  }, financeUser);

  // Dequeue with critical queue allowed
  const firstDequeued = await queueService.dequeue(['critical', 'finance', 'analytics', 'integrations']);
  assert(firstDequeued?.id === criticalJob.id, 'Fila crítica e prioridade CRITICAL atendida com máxima precedência');

  const secondDequeued = await queueService.dequeue(['critical', 'finance', 'analytics', 'integrations']);
  assert(secondDequeued?.id === highJob.id, 'Fila financeira com prioridade HIGH atendida antes de NORMAL e LOW');

  const queueMetrics = await queueService.getMetrics();
  assert(queueMetrics.length === 10, '10 filas lógicas monitoradas com métricas de profundidade e throughput');
  const criticalMetric = queueMetrics.find(q => q.name === 'critical');
  assert(criticalMetric?.displayName === 'Crítica', 'Fila Crítica mapeada com nome amigável');

  // -------------------------------------------------------------
  // BLOCO 3: RBAC & Segregação Multi-Tenant (Produtor/Evento)
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 3: RBAC & Segregação Multi-Tenant ---');
  let rbacBlocked = false;
  try {
    // Marketing user trying to create finance payout job
    await jobService.createJob({
      type: 'PAYOUT_CALCULATION',
      payload: { eventId: 'evt_1001', producerId: 'prd_100' }
    }, marketingUser);
  } catch (err: any) {
    rbacBlocked = true;
    assert(err.message.includes('permissão requerida'), 'RBAC barrou usuário sem a permissão requerida do job');
  }
  assert(rbacBlocked, 'Garantia de RBAC validada no Job Engine');

  // Scope: Produtor Opus cria job para si mesmo
  const prodAJob = await jobService.createJob({
    type: 'REPORT_EXPORT_JOB',
    producerId: 'prd_100',
    payload: { reportId: 'rep_opus_1', totalRows: 100 }
  }, producerAUser);
  assert(prodAJob.producerId === 'prd_100', 'Job do Produtor Opus criado com escopo correto');

  // Scope: Produtor Opus tenta criar job para Produtor Live Nation (prd_200)
  let scopeBreach = false;
  try {
    await jobService.createJob({
      type: 'REPORT_EXPORT_JOB',
      producerId: 'prd_200',
      payload: { reportId: 'rep_live_1' }
    }, producerAUser);
  } catch (err: any) {
    scopeBreach = true;
    assert(err.message.includes('Violação de escopo'), 'Tentativa de quebra de escopo entre produtores foi bloqueada');
  }
  assert(scopeBreach, 'Isolamento de tenant entre produtores validado');

  // Scope: Produtor Live Nation tenta buscar job do Produtor Opus por ID
  const accessedAcrossTenant = await jobService.getJob(prodAJob.id, producerBUser);
  assert(accessedAcrossTenant === null, 'Produtor B não consegue descobrir ou acessar job do Produtor A');

  // -------------------------------------------------------------
  // BLOCO 4: Idempotência & Bloqueio Contra Execução Duplicada
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 4: Idempotência & Chave Única Transacional ---');
  const payoutPayload = {
    eventId: 'evt_1001',
    period: '2026-09',
    producerId: 'prd_100',
    amount: 150000
  };

  const payoutJob1 = await jobService.createJob({
    type: 'PAYOUT_CALCULATION',
    producerId: 'prd_100',
    eventId: 'evt_1001',
    payload: payoutPayload
  }, financeUser);

  assert(payoutJob1.idempotencyKey === 'PAYOUT:evt_1001:2026-09:prd_100', 'Chave de idempotência gerada conforme regra de negócio');

  // Submeter exatamente a mesma solicitação
  const payoutJob2 = await jobService.createJob({
    type: 'PAYOUT_CALCULATION',
    producerId: 'prd_100',
    eventId: 'evt_1001',
    payload: payoutPayload
  }, financeUser);

  assert(payoutJob2.id === payoutJob1.id, 'Idempotência evitou duplicação: mesmo job retornado');
  assert(payoutJob2.status !== 'FAILED', 'Transação segura contra pagamentos duplicados');

  // -------------------------------------------------------------
  // BLOCO 5: Execução Real, Progresso, Checkpoints & Streaming
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 5: Execução Real, Progresso & Checkpoints ---');
  const worker1 = new WorkerService('wrk-test-01', 'Worker Teste 01', ['marketing', 'analytics', 'finance'], 5);
  await worker1.start();

  const campaignJob = await jobService.createJob({
    type: 'MARKETING_CAMPAIGN_DISPATCH',
    payload: { campaignId: 'camp_natal_2026', totalContacts: 5000 }
  }, marketingUser);

  let progressEventFired = false;
  EventBus.subscribe('JOB_PROGRESS_UPDATED', (evt) => {
    if (evt.data.jobId === campaignJob.id) {
      progressEventFired = true;
    }
  });

  const workerResult = await worker1.executeJob(campaignJob);
  assert(workerResult.dispatchedCount === 5000, 'Worker processou todos os contatos do job');

  const finalJobState = await jobService.repository.findById(campaignJob.id);
  assert(finalJobState?.status === 'COMPLETED', 'Job marcado como COMPLETED ao concluir execução');
  assert(finalJobState?.progress === 100, 'Progresso final registrado como 100%');
  assert(progressEventFired, 'Evento de progresso real emitido para o Event Bus');

  // Checkpoint salvo durante a execução
  const lastCp = await jobService.checkpointService.getCheckpoint(campaignJob.id);
  assert(lastCp !== null, 'Checkpoint de processamento gravado no banco');
  assert(lastCp?.processedCount === 5000, 'Cursor de checkpoint gravou o total de itens');

  // -------------------------------------------------------------
  // BLOCO 6: Erros Temporários vs Permanentes & Dead Letter
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 6: Erros Temporários vs Permanentes & Dead Letter ---');
  // 1. Erro Permanente: Conta bancária inexistente
  const permanentFailJob = await jobService.createJob({
    type: 'PAYOUT_CALCULATION',
    producerId: 'prd_100',
    eventId: 'evt_1002',
    payload: {
      eventId: 'evt_1002',
      period: '2026-09',
      producerId: 'prd_100',
      accountNumber: '00000-0', // triggers permanent error
      amount: 50000
    }
  }, financeUser);

  let permanentFailed = false;
  try {
    await worker1.executeJob(permanentFailJob);
  } catch {
    permanentFailed = true;
  }
  assert(permanentFailed, 'Worker detectou falha no processamento');

  const permanentJobState = await jobService.repository.findById(permanentFailJob.id);
  assert(permanentJobState?.status === 'DEAD_LETTER', 'Erro permanente foi enviado imediatamente para DEAD_LETTER sem retentativa inútil');

  const deadLetters = await jobService.listDeadLetters(adminUser);
  const dlRecord = deadLetters.find(d => d.jobId === permanentFailJob.id);
  assert(dlRecord !== undefined, 'Registro de Dead Letter criado para intervenção operacional');
  assert(dlRecord?.failureReason.includes('permanente'), 'Motivo da falha permanente registrado');

  // Investigar e reprocessar Dead Letter
  await jobService.investigateDeadLetter(dlRecord!.id, adminUser);
  const reprocessedRes = await jobService.reprocessDeadLetter(dlRecord!.id, adminUser);
  assert(reprocessedRes.success, 'Dead Letter reprocessada com sucesso após investigação');
  assert(reprocessedRes.newJobId !== undefined, 'Novo Job gerado no reprocessamento');

  // -------------------------------------------------------------
  // BLOCO 7: Cancelamento Cooperativo & Pausa/Retomada
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 7: Cancelamento Cooperativo & Pausa/Retomada ---');
  const pausableJob = await jobService.createJob({
    type: 'MARKETING_CAMPAIGN_DISPATCH',
    payload: { campaignId: 'camp_pausavel', totalContacts: 10000 }
  }, marketingUser);

  // Solicitar pausa
  await jobService.pauseJob(pausableJob.id, marketingUser);
  const jobAfterPauseReq = await jobService.repository.findById(pausableJob.id);
  assert(jobAfterPauseReq?.pauseRequested === true, 'Flag pauseRequested registrada com sucesso');

  // Retomada
  await jobService.repository.update(pausableJob.id, { paused: true, status: 'WAITING' });
  const resumeRes = await jobService.resumeJob(pausableJob.id, marketingUser);
  assert(resumeRes.success, 'Job pausado retomado com sucesso');

  // Cancelamento
  const cancelJob = await jobService.createJob({
    type: 'REPORT_EXPORT_JOB',
    payload: { reportId: 'rep_cancel', totalRows: 10000 }
  }, adminUser);

  const cancelRes = await jobService.cancelJob(cancelJob.id, adminUser);
  assert(cancelRes.success, 'Cancelamento de relatório em fila concluído com sucesso');
  const canceledJobState = await jobService.repository.findById(cancelJob.id);
  assert(canceledJobState?.status === 'CANCELLED', 'Status atualizado para CANCELLED');

  // -------------------------------------------------------------
  // BLOCO 8: Processamento em Lote (Batch) & Retry Seletivo
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 8: Processamento em Lote (Batch) & Retry Seletivo ---');
  const batch = await batchService.createBatch(
    'Repasse Lote Festival Curitiba',
    'FINANCEIRO',
    [
      { type: 'PAYOUT_CALCULATION', payload: { eventId: 'evt_1', producerId: 'prd_1', amount: 10000 } },
      { type: 'PAYOUT_CALCULATION', payload: { eventId: 'evt_2', producerId: 'prd_2', amount: 20000 } },
      { type: 'PAYOUT_CALCULATION', payload: { eventId: 'evt_3', producerId: 'prd_3', amount: 30000 } },
      { type: 'PAYOUT_CALCULATION', payload: { eventId: 'evt_4', producerId: 'prd_4', amount: 40000 } }
    ],
    financeUser,
    { producerId: 'prd_100' }
  );

  assert(batch.totalItems === 4, 'Batch criado com 4 child jobs');
  assert(batch.childJobs?.length === 4, '4 child jobs persistidos com parentJobId vinculado');

  // Simular conclusão de 3 e falha de 1
  const child1 = batch.childJobs![0];
  const child2 = batch.childJobs![1];
  const child3 = batch.childJobs![2];
  const child4 = batch.childJobs![3];

  await jobService.repository.update(child1.id, { status: 'COMPLETED' });
  await jobService.repository.update(child2.id, { status: 'COMPLETED' });
  await jobService.repository.update(child3.id, { status: 'COMPLETED' });
  await jobService.repository.update(child4.id, { status: 'FAILED', error: { message: 'Timeout temporário' } });

  const updatedBatch = await batchService.updateBatchProgress(batch.id);
  assert(updatedBatch?.status === 'PARTIALLY_COMPLETED', 'Batch com 3 sucessos e 1 falha classificado como PARTIALLY_COMPLETED');
  assert(updatedBatch?.completedItems === 3, '3 itens completados');
  assert(updatedBatch?.failedItems === 1, '1 item falhado');

  // Retry Seletivo: re-executar APENAS as falhas
  const retryResult = await batchService.retryFailures(batch.id, financeUser);
  assert(retryResult.retriedCount === 1, 'Retry seletivo re-enfileirou SOMENTE o 1 child job que havia falhado');
  assert(retryResult.batch.status === 'RUNNING', 'Status do batch retornado para RUNNING');

  // -------------------------------------------------------------
  // BLOCO 9: Orquestração de DAG & Detecção de Ciclos
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 9: Orquestração de DAG & Detecção de Ciclos ---');
  const depService = new DependencyService();

  // Teste de detecção de ciclos
  const cyclicNodes = [
    { id: 'A', name: 'Passo A', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['C'] },
    { id: 'B', name: 'Passo B', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['A'] },
    { id: 'C', name: 'Passo C', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['B'] }
  ];

  const cycleResult = depService.detectCycle(cyclicNodes);
  assert(cycleResult.hasCycle === true, 'Detector de ciclos identificou dependência circular (A -> B -> C -> A)');

  // Teste de DAG Válido com estágios paralelos
  const validDagNodes = [
    { id: 'import', name: '1. Importar Extrato', jobType: 'BANK_RETURN_PROCESSING', dependsOn: [] },
    { id: 'taxas', name: '2. Atualizar Taxas', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['import'] },
    { id: 'vendas', name: '3. Atualizar Vendas', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['import'] },
    { id: 'conciliar', name: '4. Conciliação Geral', jobType: 'FINANCE_RECONCILIATION', dependsOn: ['taxas', 'vendas'] }
  ];

  const stages = depService.computeExecutionStages(validDagNodes);
  assert(stages.length === 3, 'DAG dividido em 3 estágios lógicos de execução');
  assert(stages[0].length === 1 && stages[0][0].id === 'import', 'Estágio 0 contém nó inicial');
  assert(stages[1].length === 2, 'Estágio 1 executa "taxas" e "vendas" em paralelo');
  assert(stages[2].length === 1 && stages[2][0].id === 'conciliar', 'Estágio 2 aguarda finalização dos anteriores');

  // -------------------------------------------------------------
  // BLOCO 10: Agendamento, Fuso Horário & Lock Distribuído
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 10: Agendamento, Fuso Horário & Lock Distribuído ---');
  const schedule = await scheduler.createSchedule({
    name: 'Fechamento Diário Financeiro',
    jobType: 'FINANCE_RECONCILIATION',
    module: 'FINANCEIRO',
    queue: 'finance',
    priority: 'HIGH',
    frequency: 'DAILY',
    timeOfDay: '02:00',
    timezone: 'America/Sao_Paulo',
    misfirePolicy: 'EXECUTE_IMMEDIATELY',
    payload: { period: 'daily_closing' }
  }, adminUser);

  assert(schedule.timezone === 'America/Sao_Paulo', 'Fuso horário America/Sao_Paulo configurado');
  assert(schedule.frequency === 'DAILY', 'Frequência diária registrada');
  assert(schedule.active === true, 'Agendamento ativo');

  // Teste de Lock Distribuído: 2 nós tentando disparar simultaneamente
  const lockService = DistributedLockService.getInstance();
  const lockKey = `lock:schedule:${schedule.id}`;
  const lock1 = await lockService.acquireLock(lockKey, 'node-A', 30000);
  assert(lock1 === true, 'Nó A obteve o distributed lock com sucesso');

  const lock2 = await lockService.acquireLock(lockKey, 'node-B', 30000);
  assert(lock2 === false, 'Nó B foi impedido de disparar pelo distributed lock');

  await lockService.releaseLock(lockKey, 'node-A');
  assert(!lockService.isLocked(lockKey), 'Distributed lock liberado');

  // Teste de Re-validação Dinâmica de Permissão do Criador
  const scheduleRun = await scheduler.executeSchedule(schedule.id, 'node-A');
  assert(scheduleRun.success === true, 'Agendamento disparado com sucesso para criador ativo');

  const blockedSchedule = await scheduler.createSchedule({
    name: 'Rotina de Usuário Desligado',
    jobType: 'FINANCE_RECONCILIATION',
    module: 'FINANCEIRO',
    queue: 'finance',
    priority: 'HIGH',
    frequency: 'DAILY',
    timeOfDay: '03:00'
  }, blockedUser);

  const blockedRun = await scheduler.executeSchedule(blockedSchedule.id, 'node-A');
  assert(blockedRun.success === false, 'Agendamento bloqueou execução de rotina criada por usuário inativo');
  assert(blockedRun.message.includes('bloqueada'), 'Auditoria registrou o motivo do bloqueio do agendamento');

  // -------------------------------------------------------------
  // BLOCO 11: Monitoramento, Saúde, Heartbeat & Telemetria
  // -------------------------------------------------------------
  console.log('\n--- BLOCO 11: Monitoramento, Saúde & Telemetria ---');
  const stats = await jobService.getProcessingStats(adminUser);
  assert(stats.runningCount >= 0, 'Contagem de jobs em execução disponível');
  assert(stats.completedTodayCount > 0, 'Total de concluídos hoje contabilizado');
  assert(stats.health.workers === 'HEALTHY', 'Saúde dos workers monitorada como HEALTHY');
  assert(stats.health.queues === 'HEALTHY', 'Saúde das filas monitorada como HEALTHY');
  assert(stats.p95DurationSeconds > 0, 'Latência analítica P95 calculada');

  console.log('================================================================');
  console.log(`   RESULTADO FINAL: ${passedTests} DE ${totalTests} TESTES PASSARAM COM SUCESSO!`);
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Falha fatal na execução da suíte:', err);
  process.exit(1);
});
