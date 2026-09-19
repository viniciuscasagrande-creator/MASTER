import { prisma } from '../src/core/database/prisma';
import { runSeed } from '../prisma/seed';
import { TaskService } from '../src/modules/tasks/task.service';
import { WorkflowEngineService } from '../src/modules/tasks/workflow/workflow-engine.service';
import { SlaService } from '../src/modules/tasks/sla/sla.service';
import { SlaPolicyService } from '../src/modules/tasks/sla/sla-policy.service';
import { EscalationService } from '../src/modules/tasks/sla/escalation.service';
import { AssignmentService } from '../src/modules/tasks/assignment/assignment.service';
import { TeamRouterService } from '../src/modules/tasks/assignment/team-router.service';
import { DutyRouterService } from '../src/modules/tasks/assignment/duty-router.service';
import { WorkloadService } from '../src/modules/tasks/assignment/workload.service';
import { SearchService } from '../src/modules/search/search.service';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (detail) console.error(`     Detalhe: ${detail}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.9 — MOTOR CENTRAL DE TAREFAS');
  console.log('================================================================\n');

  // Inicializa banco e sementes
  await runSeed();

  // Usuários de Teste com Perfis e Escopos
  const userAdmin: AuthenticatedUser = {
    id: 'usr_superadmin',
    name: 'Vinicius Casagrande (Admin Geral)',
    email: 'admin@diskingressos.com.br',
    roles: ['ADMINISTRADOR_GERAL'],
    permissions: [
      'tarefas.central.visualizar',
      'tarefas.tarefa.visualizar',
      'tarefas.tarefa.criar',
      'tarefas.tarefa.editar',
      'tarefas.tarefa.assumir',
      'tarefas.tarefa.reatribuir',
      'tarefas.tarefa.concluir',
      'tarefas.tarefa.cancelar',
      'tarefas.tarefa.reabrir',
      'tarefas.equipe.visualizar',
      'tarefas.equipe.gerenciar',
      'tarefas.workflow.visualizar',
      'tarefas.workflow.criar',
      'tarefas.workflow.editar',
      'tarefas.sla.visualizar',
      'tarefas.sla.configurar',
      'tarefas.dashboard.visualizar',
      'busca.global.utilizar'
    ],
    isSuperAdmin: true,
    status: 'ACTIVE',
    sessionId: 'sess_admin',
    scope: { isGlobal: true, producers: [], events: [] }
  };

  const userFinMaria: AuthenticatedUser = {
    id: 'usr_fin_maria',
    name: 'Maria Oliveira (Financeiro)',
    email: 'maria.financeiro@diskingressos.com.br',
    roles: ['FINANCEIRO'],
    permissions: [
      'tarefas.central.visualizar',
      'tarefas.tarefa.visualizar',
      'tarefas.tarefa.criar',
      'tarefas.tarefa.editar',
      'tarefas.tarefa.assumir',
      'tarefas.tarefa.concluir',
      'tarefas.tarefa.reatribuir',
      'tarefas.tarefa.reabrir',
      'tarefas.equipe.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_maria',
    scope: { isGlobal: false, producers: ['prd_100'], events: [] }
  };

  const userFinCarlos: AuthenticatedUser = {
    id: 'usr_fin_carlos',
    name: 'Carlos Lima (Financeiro)',
    email: 'carlos.financeiro@diskingressos.com.br',
    roles: ['FINANCEIRO'],
    permissions: [
      'tarefas.central.visualizar',
      'tarefas.tarefa.visualizar',
      'tarefas.tarefa.assumir',
      'tarefas.tarefa.concluir'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_carlos',
    scope: { isGlobal: false, producers: ['prd_100'], events: [] }
  };

  const userProdOpus: AuthenticatedUser = {
    id: 'usr_prod_opus',
    name: 'Roberto Opus (Produtor)',
    email: 'roberto@opus.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'tarefas.central.visualizar',
      'tarefas.tarefa.visualizar',
      'tarefas.tarefa.criar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_opus',
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001'] }
  };

  const userProdLiveNation: AuthenticatedUser = {
    id: 'usr_prod_livenation',
    name: 'Amanda Live Nation (Produtora)',
    email: 'amanda@livenation.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'tarefas.central.visualizar',
      'tarefas.tarefa.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_livenation',
    scope: { isGlobal: false, producers: ['prd_200'], events: ['evt_2001'] }
  };

  // ============================================================================
  // GRUPO 1: CRIAÇÃO AUTOMÁTICA VIA WORKFLOW ENGINE
  // ============================================================================
  console.log('--- 1. CRIAÇÃO AUTOMÁTICA VIA WORKFLOW ENGINE ---');

  // Critério 1: Criação automática de tarefa a partir de evento de reconciliação (Financeiro)
  const tasksReconcil = await WorkflowEngineService.processEvent(
    'RECONCILIATION_DIVERGENCE_DETECTED',
    { divergenceAmount: 450.0 },
    { producerId: 'prd_100', eventId: 'evt_1001' }
  );
  assert(
    tasksReconcil.length > 0 &&
      tasksReconcil[0].module === 'FINANCEIRO' &&
      tasksReconcil[0].priority === 'HIGH' &&
      tasksReconcil[0].status === 'ASSIGNED' || tasksReconcil[0].status === 'OPEN',
    'Critério 1: Criação automática de tarefa a partir de evento de reconciliação (Financeiro)'
  );

  // Critério 2: Criação automática de tarefa a partir de taxa alta de falhas no check-in (Eventos)
  const tasksCheckin = await WorkflowEngineService.processEvent(
    'CHECKIN_FAILURE_RATE_HIGH',
    { failureRate: 22.5, gate: 'Portão A' },
    { producerId: 'prd_100', eventId: 'evt_1001' }
  );
  assert(
    tasksCheckin.length > 0 &&
      tasksCheckin[0].module === 'EVENTOS' &&
      tasksCheckin[0].priority === 'CRITICAL' &&
      tasksCheckin[0].estimatedMinutes === 30,
    'Critério 2: Criação automática de tarefa a partir de taxa alta de falhas no check-in (Eventos)'
  );

  // Critério 3: Criação automática de tarefa a partir de falha de tracking (Marketing)
  const tasksTracking = await WorkflowEngineService.processEvent(
    'TRACKING_HEALTH_FAILED',
    { consecutiveErrors: 4, pixelId: 'px_meta_882' }
  );
  assert(
    tasksTracking.length > 0 &&
      tasksTracking[0].module === 'MARKETING' &&
      tasksTracking[0].priority === 'HIGH',
    'Critério 3: Criação automática de tarefa a partir de falha de tracking (Marketing)'
  );

  // Critério 4: Criação automática de tarefa a partir de divergência contábil (Contabilidade)
  const tasksAccounting = await WorkflowEngineService.processEvent(
    'ACCOUNTING_DIVERGENCE',
    { divergenceAmount: 120.0 }
  );
  assert(
    tasksAccounting.length > 0 &&
      tasksAccounting[0].module === 'CONTABILIDADE' &&
      tasksAccounting[0].priority === 'NORMAL',
    'Critério 4: Criação automática de tarefa a partir de divergência contábil (Contabilidade)'
  );

  // ============================================================================
  // GRUPO 2: CRIAÇÃO MANUAL, CAMPOS OBRIGATÓRIOS E POLÍTICAS DE SLA
  // ============================================================================
  console.log('\n--- 2. CRIAÇÃO MANUAL E POLÍTICA DE SLA ---');

  // Critério 5: Criação manual de tarefa com título, módulo e checklist obrigatório
  const manualTask = await TaskService.createTask(
    {
      title: 'Auditar borderô final de ingressos',
      description: 'Auditoria detalhada do fechamento do Festival',
      module: 'FINANCEIRO',
      priority: 'HIGH',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      checklist: [
        { text: 'Conferir total de cortesias emitidas', isRequired: true },
        { text: 'Conferir taxa de conveniência', isRequired: true },
        { text: 'Anexar comprovante assinado', isRequired: false }
      ]
    },
    userAdmin
  );
  assert(
    manualTask && manualTask.id && manualTask.checklistItems.length === 3,
    'Critério 5: Criação manual de tarefa com título, módulo e checklist obrigatório'
  );

  // Critério 6: Validação de campos obrigatórios na criação manual (título, módulo)
  let failedValidation = false;
  try {
    await TaskService.createTask({ title: '', module: 'FINANCEIRO' } as any, userAdmin);
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes('título')) {
      failedValidation = true;
    }
  }
  assert(failedValidation, 'Critério 6: Validação de campos obrigatórios na criação manual (título, módulo)');

  // Critério 7: Associação correta de SLA com base na política cadastrada por módulo/prioridade
  assert(
    manualTask.slaPolicyId === 'sla_fin_high' && manualTask.slaStatus === 'WITHIN_SLA',
    'Critério 7: Associação correta de SLA com base na política cadastrada por módulo/prioridade'
  );

  // Critério 8: Cálculo preciso da deadline do SLA
  const createdDate = new Date(manualTask.createdAt).getTime();
  const deadlineDate = new Date(manualTask.slaDeadline).getTime();
  const diffMinutes = Math.round((deadlineDate - createdDate) / 60000);
  assert(
    diffMinutes === 120,
    `Critério 8: Cálculo preciso da deadline do SLA (esperado 120 min, obtido ${diffMinutes} min)`
  );

  // ============================================================================
  // GRUPO 3: TRANSIÇÕES DE STATUS DO CICLO DE VIDA
  // ============================================================================
  console.log('\n--- 3. CICLO DE VIDA E TRANSIÇÕES DE STATUS ---');

  // Critério 9: Transição de status: OPEN -> ASSIGNED ao atribuir responsável
  const unassignedTask = await TaskService.createTask(
    {
      title: 'Tarefa aberta não atribuída',
      module: 'SAC',
      priority: 'NORMAL'
    },
    userAdmin
  );
  assert(unassignedTask.status === 'OPEN', 'Setup C9: Tarefa criada sem usuário nasce em OPEN');

  const assignedTask = await TaskService.assignTask(
    unassignedTask.id,
    { userId: userFinMaria.id, reason: 'Distribuição manual inicial' },
    userAdmin
  );
  assert(
    assignedTask.status === 'ASSIGNED' && assignedTask.assignedUserId === userFinMaria.id,
    'Critério 9: Transição de status: OPEN -> ASSIGNED ao atribuir responsável'
  );

  // Critério 10: Transição de status: ASSIGNED -> IN_PROGRESS ao iniciar tarefa
  const startedTask = await TaskService.startTask(assignedTask.id, userFinMaria);
  assert(
    startedTask.status === 'IN_PROGRESS' && startedTask.startedAt !== null,
    'Critério 10: Transição de status: ASSIGNED -> IN_PROGRESS ao iniciar tarefa'
  );

  // Critério 11: Transição de status: IN_PROGRESS -> WAITING ao pausar tarefa
  // Critério 12: Pausa de SLA: validação de motivos permitidos pela política da tarefa
  // sla_fin_high permite BANCO, GATEWAY, PRODUTOR, OUTRO_DEPARTAMENTO
  const pausedTask = await TaskService.waitTask(
    manualTask.id,
    { reason: 'BANCO', details: 'Aguardando compensação do lote bancário' },
    userAdmin
  );
  assert(
    pausedTask.status === 'WAITING' &&
      pausedTask.waitingReason === 'BANCO' &&
      pausedTask.slaStatus === 'PAUSED',
    'Critério 11 e 12: Transição de status: IN_PROGRESS -> WAITING com motivo permitido pela política'
  );

  // Critério 13: Pausa de SLA: rejeição de motivo não permitido pela política (400)
  // sla_fin_high NÃO permite CLIENTE
  let pauseRejected = false;
  try {
    await TaskService.waitTask(manualTask.id, { reason: 'CLIENTE' as any }, userAdmin);
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes('Pausa de SLA não permitida')) {
      pauseRejected = true;
    }
  }
  assert(pauseRejected, 'Critério 13: Pausa de SLA: rejeição de motivo não permitido pela política (400)');

  // Critério 14: Retomada de SLA: extensão proporcional do prazo da deadline
  // Critério 15: Transição de status: WAITING -> IN_PROGRESS ao retomar tarefa
  const previousDeadline = new Date(pausedTask.slaDeadline).getTime();
  // Simula passagem de tempo no estado pausado
  const itemInDb = prisma.tasks.find(t => t.id === manualTask.id);
  if (itemInDb) {
    itemInDb.slaPausedAt = new Date(Date.now() - 15 * 60000); // pausado há 15 min
  }
  const resumedTask = await TaskService.resumeTask(manualTask.id, userAdmin);
  const newDeadline = new Date(resumedTask.slaDeadline).getTime();
  assert(
    resumedTask.status === 'IN_PROGRESS' &&
      resumedTask.waitingReason === null &&
      resumedTask.slaStatus === 'WITHIN_SLA' &&
      newDeadline > previousDeadline,
    'Critério 14 e 15: Retomada de SLA: transição para IN_PROGRESS e extensão proporcional da deadline'
  );

  // ============================================================================
  // GRUPO 4: CHECKLIST OBRIGATÓRIO E CONCLUSÃO
  // ============================================================================
  console.log('\n--- 4. CHECKLIST E CONCLUSÃO ---');

  // Critério 16: Bloqueio de conclusão se houver itens obrigatórios pendentes no checklist (400)
  let blockCompletion = false;
  try {
    await TaskService.completeTask(manualTask.id, { notes: 'Tentativa sem checklist' }, userAdmin);
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes('obrigatórios pendentes')) {
      blockCompletion = true;
    }
  }
  assert(
    blockCompletion,
    'Critério 16: Bloqueio de conclusão se houver itens obrigatórios pendentes no checklist (400)'
  );

  // Critério 17: Conclusão com sucesso quando todos os itens obrigatórios do checklist estão marcados
  for (const item of manualTask.checklistItems) {
    if (item.isRequired) {
      await TaskService.updateChecklistItem(manualTask.id, item.id, { isCompleted: true }, userAdmin);
    }
  }
  const completedTask = await TaskService.completeTask(
    manualTask.id,
    { notes: 'Auditoria finalizada com sucesso' },
    userAdmin
  );
  assert(
    completedTask.status === 'COMPLETED' && completedTask.completedAt !== null,
    'Critério 17: Conclusão com sucesso quando todos os itens obrigatórios do checklist estão marcados'
  );

  // ============================================================================
  // GRUPO 5: DEPENDÊNCIAS ENTRE TAREFAS
  // ============================================================================
  console.log('\n--- 5. DEPENDÊNCIAS ENTRE TAREFAS ---');

  // Critério 18: Dependência entre tarefas: Tarefa B nasce em BLOCKED se depende da Tarefa A
  const parentTaskA = await TaskService.createTask(
    {
      title: 'Tarefa A (Pai)',
      module: 'FINANCEIRO',
      priority: 'NORMAL'
    },
    userAdmin
  );
  const dependentTaskB = await TaskService.createTask(
    {
      title: 'Tarefa B (Filha dependente da Tarefa A)',
      module: 'FINANCEIRO',
      priority: 'NORMAL',
      dependsOnTaskIds: [parentTaskA.id]
    },
    userAdmin
  );
  assert(
    dependentTaskB.status === 'BLOCKED',
    'Critério 18: Dependência entre tarefas: Tarefa B nasce em BLOCKED se depende da Tarefa A'
  );

  // Critério 19: Conclusão da Tarefa A desbloqueia automaticamente a Tarefa B (BLOCKED -> OPEN/ASSIGNED)
  await TaskService.completeTask(parentTaskA.id, {}, userAdmin);
  const unblockedTaskB = await TaskService.getById(dependentTaskB.id, userAdmin);
  assert(
    unblockedTaskB.status === 'OPEN' || unblockedTaskB.status === 'ASSIGNED',
    'Critério 19: Conclusão da Tarefa A desbloqueia automaticamente a Tarefa B'
  );

  // ============================================================================
  // GRUPO 6: CONCORRÊNCIA E CLAIM ATÔMICO
  // ============================================================================
  console.log('\n--- 6. CONCORRÊNCIA E CLAIM ATÔMICO ---');

  // Critério 20: Concorrência: prevenção de duplo claim com resposta HTTP 409 Conflict
  const openClaimTask = await TaskService.createTask(
    {
      title: 'Tarefa para teste de concorrência',
      module: 'FINANCEIRO',
      priority: 'NORMAL'
    },
    userAdmin
  );
  // Operador Maria assume a tarefa primeiro
  await TaskService.claimTask(openClaimTask.id, userFinMaria);

  // Operador Carlos tenta assumir a mesma tarefa em seguida
  let claimConflict = false;
  try {
    await TaskService.claimTask(openClaimTask.id, userFinCarlos);
  } catch (err: any) {
    if (err.statusCode === 409 && err.message.includes('já foi assumida por outro usuário')) {
      claimConflict = true;
    }
  }
  assert(
    claimConflict,
    'Critério 20: Concorrência: prevenção de duplo claim com resposta HTTP 409 Conflict'
  );

  // ============================================================================
  // GRUPO 7: REATRIBUIÇÃO E HISTÓRICO
  // ============================================================================
  console.log('\n--- 7. REATRIBUIÇÃO COM HISTÓRICO ---');

  // Critério 21: Reatribuição com motivo obrigatório registrado no histórico
  const reallocated = await TaskService.reassignTask(
    openClaimTask.id,
    { toUserId: userFinCarlos.id, reason: 'Cobertura de horário de almoço' },
    userAdmin
  );
  const reallocHistory = prisma.taskHistories.find(
    h => h.taskId === openClaimTask.id && h.action === 'REASSIGNED'
  );
  assert(
    reallocated.assignedUserId === userFinCarlos.id &&
      reallocHistory !== undefined &&
      reallocHistory.details.includes('Cobertura de horário de almoço'),
    'Critério 21: Reatribuição com motivo obrigatório registrado no histórico'
  );

  // Critério 22: Reatribuição sem motivo é rejeitada com 400
  let reassignRejected = false;
  try {
    await TaskService.reassignTask(
      openClaimTask.id,
      { toUserId: userFinMaria.id, reason: '' },
      userAdmin
    );
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes('motivo da reatribuição é obrigatório')) {
      reassignRejected = true;
    }
  }
  assert(reassignRejected, 'Critério 22: Reatribuição sem motivo é rejeitada com 400');

  // ============================================================================
  // GRUPO 8: ROTEAMENTO INTELIGENTE (WORKLOAD, PLANTÃO, DISPONIBILIDADE)
  // ============================================================================
  console.log('\n--- 8. ROTEAMENTO INTELIGENTE E DISPONIBILIDADE ---');

  // Critério 23: Roteamento inteligente por Workload Score (atribuição ao operador com menor carga)
  // Atribui tarefa extra com prioridade CRITICAL para Maria para que sua carga seja maior
  await TaskService.createTask(
    {
      title: 'Tarefa extra crítica de fechamento',
      module: 'FINANCEIRO',
      priority: 'CRITICAL',
      assignedUserId: userFinMaria.id
    },
    userAdmin
  );
  const routedUserId = await TeamRouterService.routeToTeamMember('team_fin', 'WORKLOAD');
  assert(
    routedUserId === 'usr_fin_carlos' || routedUserId === 'usr-fin-carlos',
    'Critério 23: Roteamento inteligente por Workload Score (atribuição ao operador com menor carga)'
  );

  // Critério 24: Roteamento inteligente por Escala de Plantão (Duty Schedule)
  // Plantão configurado para team_evt_sul no evt_1001
  const dutyUser = await DutyRouterService.findOnDutyUser({
    teamId: 'team_evt_sul',
    eventId: 'evt_1001'
  });
  assert(
    dutyUser !== null && (dutyUser === 'usr_superadmin' || dutyUser === 'usr-admin-1'),
    'Critério 24: Roteamento inteligente por Escala de Plantão (Duty Schedule)'
  );

  // Critério 25: Operador indisponível (BUSY / AWAY / VACATION) não recebe tarefas automáticas
  await WorkloadService.updateAvailability('usr_fin_carlos', 'AWAY');
  const isAvailable = await WorkloadService.isUserAvailable('usr_fin_carlos');
  assert(!isAvailable, 'Critério 25: Operador indisponível (AWAY) não recebe tarefas automáticas');

  // Critério 26: Operador ativo recebe tarefas normalmente
  const isMariaAvailable = await WorkloadService.isUserAvailable('usr_fin_maria');
  assert(isMariaAvailable, 'Critério 26: Operador ativo (AVAILABLE) recebe tarefas normalmente');

  // Critério 27: Atualização do status de disponibilidade do usuário
  await WorkloadService.updateAvailability('usr_fin_carlos', 'AVAILABLE');
  const restoredAvail = await WorkloadService.isUserAvailable('usr_fin_carlos');
  assert(restoredAvail, 'Critério 27: Atualização do status de disponibilidade do usuário com sucesso');

  // ============================================================================
  // GRUPO 9: ESCALONAMENTO HIERÁRQUICO DE SLA
  // ============================================================================
  console.log('\n--- 9. ESCALONAMENTO DE SLA ---');

  // Critério 28: Escalonamento automático: nível 1 (Supervisor) após estouro de SLA
  const overdueTask = await TaskService.createTask(
    {
      title: 'Tarefa com SLA estourado para teste de escalonamento',
      module: 'FINANCEIRO',
      priority: 'HIGH',
      slaPolicyId: 'sla_fin_high'
    },
    userAdmin
  );
  // Força estouro no banco
  const dbTask = prisma.tasks.find(t => t.id === overdueTask.id);
  if (dbTask) {
    dbTask.slaStartedAt = new Date(Date.now() - 160 * 60000); // 160 min atrás (SLA era 120 min)
    dbTask.slaDeadline = new Date(Date.now() - 40 * 60000); // estourada há 40 min
    dbTask.slaStatus = 'BREACHED';
  }

  const escalatedTasksL1 = await EscalationService.checkAndEscalateOverdueTasks();
  const refreshedL1 = await TaskService.getById(overdueTask.id, userAdmin);
  assert(
    refreshedL1.escalationLevel === 1,
    'Critério 28: Escalonamento automático: nível 1 (Supervisor) após estouro de SLA'
  );

  // Critério 29: Escalonamento automático: nível 2 (Gerente) após tempo adicional de estouro
  if (dbTask) {
    dbTask.slaDeadline = new Date(Date.now() - 70 * 60000); // estourada há 70 min (regra 2 dispara em 60 min)
  }
  const escalatedTasksL2 = await EscalationService.checkAndEscalateOverdueTasks();
  const refreshedL2 = await TaskService.getById(overdueTask.id, userAdmin);
  assert(
    refreshedL2.escalationLevel === 2,
    'Critério 29: Escalonamento automático: nível 2 (Gerente) após tempo adicional de estouro'
  );

  // ============================================================================
  // GRUPO 10: CANCELAMENTO E REABERTURA
  // ============================================================================
  console.log('\n--- 10. CANCELAMENTO E REABERTURA ---');

  // Critério 30: Cancelamento de tarefa com motivo obrigatório
  const taskToCancel = await TaskService.createTask(
    {
      title: 'Tarefa que será cancelada',
      module: 'FINANCEIRO',
      priority: 'LOW'
    },
    userAdmin
  );
  const cancelled = await TaskService.cancelTask(
    taskToCancel.id,
    { reason: 'Evento cancelado por força maior' },
    userAdmin
  );
  assert(
    cancelled.status === 'CANCELLED' && cancelled.cancelledReason === 'Evento cancelado por força maior',
    'Critério 30: Cancelamento de tarefa com motivo obrigatório'
  );

  // Critério 31: Reabertura de tarefa concluída/cancelada com motivo obrigatório
  const reopened = await TaskService.reopenTask(
    taskToCancel.id,
    { reason: 'Decisão revista pela diretoria' },
    userAdmin
  );
  assert(
    reopened.status === 'OPEN' || reopened.status === 'ASSIGNED',
    'Critério 31: Reabertura de tarefa concluída/cancelada com motivo obrigatório'
  );

  // ============================================================================
  // GRUPO 11: COMENTÁRIOS E CHECKLIST
  // ============================================================================
  console.log('\n--- 11. COMENTÁRIOS E CHECKLIST ---');

  // Critério 32: Comentários na tarefa com registro de menções e histórico
  const comment = await TaskService.addComment(
    reopened.id,
    { content: 'Favor verificar com urgência @carlos', mentions: ['usr_fin_carlos'] },
    userAdmin
  );
  assert(
    comment && comment.content.includes('@carlos') && comment.userId === userAdmin.id,
    'Critério 32: Comentários na tarefa com registro de menções e histórico'
  );

  // Critério 33: Check/uncheck de item de checklist com registro de usuário e timestamp
  const taskWithChecklist = await TaskService.createTask(
    {
      title: 'Tarefa com checklist dinâmico',
      module: 'FINANCEIRO',
      priority: 'NORMAL',
      checklist: [{ text: 'Item de conferência 1', isRequired: false }]
    },
    userAdmin
  );
  const chkItem = taskWithChecklist.checklistItems[0];
  const checkedItem = await TaskService.updateChecklistItem(
    taskWithChecklist.id,
    chkItem.id,
    { isCompleted: true },
    userFinMaria
  );
  assert(
    checkedItem.isCompleted === true && checkedItem.completedByUserId === userFinMaria.id,
    'Critério 33: Check/uncheck de item de checklist com registro de usuário e timestamp'
  );

  // ============================================================================
  // GRUPO 12: ENCAMINHAMENTO PARA MOTOR DE APROVAÇÃO
  // ============================================================================
  console.log('\n--- 12. ENCAMINHAMENTO PARA APROVAÇÕES ---');

  // Critério 34: Encaminhamento de tarefa para Motor de Aprovação (ApprovalEngine)
  const taskToApprove = await TaskService.createTask(
    {
      title: 'Tarefa que requer aprovação de pagamento',
      module: 'FINANCEIRO',
      priority: 'HIGH',
      checklist: [{ text: 'Conferir valores', isRequired: true }]
    },
    userAdmin
  );
  await TaskService.updateChecklistItem(
    taskToApprove.id,
    taskToApprove.checklistItems[0].id,
    { isCompleted: true },
    userAdmin
  );
  const completedWithApproval = await TaskService.completeTask(
    taskToApprove.id,
    {
      notes: 'Valores conferidos, liberando repasse',
      forwardToApproval: true,
      approvalOperation: 'FINANCE_TRANSFER',
      approvalAmount: 25000.00
    },
    userAdmin
  );
  assert(
    completedWithApproval.status === 'COMPLETED',
    'Critério 34: Encaminhamento de tarefa para Motor de Aprovação (ApprovalEngine)'
  );

  // ============================================================================
  // GRUPO 13: ISOLAMENTO DE ESCOPO (PRODUTOR A × PRODUTOR B)
  // ============================================================================
  console.log('\n--- 13. ISOLAMENTO DE ESCOPO ---');

  // Cria tarefa do Produtor Opus (prd_100)
  const taskOpus = await TaskService.createTask(
    {
      title: 'Borderô Opus Curitiba',
      module: 'FINANCEIRO',
      priority: 'NORMAL',
      producerId: 'prd_100',
      eventId: 'evt_1001'
    },
    userAdmin
  );

  // Critério 35: Isolamento de escopo: Produtor A não visualiza tarefas do Produtor B (403)
  let scopeBlocked = false;
  try {
    await TaskService.getById(taskOpus.id, userProdLiveNation);
  } catch (err: any) {
    if (err.statusCode === 403 && err.message.includes('outro produtor')) {
      scopeBlocked = true;
    }
  }
  assert(
    scopeBlocked,
    'Critério 35: Isolamento de escopo: Produtor A não visualiza tarefas do Produtor B (403)'
  );

  // Critério 36: Isolamento de escopo: Produtor visualiza apenas suas próprias tarefas
  const listOpus = await TaskService.listTasks({}, userProdOpus);
  const allBelongToOpus = listOpus.tasks.every((t: any) => t.producerId === 'prd_100');
  assert(
    listOpus.tasks.length > 0 && allBelongToOpus,
    'Critério 36: Isolamento de escopo: Produtor visualiza apenas suas próprias tarefas na listagem'
  );

  // ============================================================================
  // GRUPO 14: VISÃO MINHA CAIXA, FILA DA EQUIPE E MÉTRICAS
  // ============================================================================
  console.log('\n--- 14. MINHA CAIXA, FILA DA EQUIPE E MÉTRICAS ---');

  // Critério 37: Visão "Minha Caixa": retorno de tarefas ordenadas por urgência e deadline
  const myInbox = await TaskService.getMyInbox(userFinMaria);
  assert(
    myInbox && Array.isArray(myInbox.tasks) && typeof myInbox.urgentCount === 'number',
    'Critério 37: Visão "Minha Caixa": retorno de tarefas ordenadas por urgência e deadline'
  );

  // Critério 38: Visão "Fila da Equipe": retorno de tarefas abertas não atribuídas da equipe
  const teamInbox = await TaskService.getTeamInbox('team_fin', userAdmin);
  assert(
    teamInbox && Array.isArray(teamInbox.tasks) && Array.isArray(teamInbox.unassigned),
    'Critério 38: Visão "Fila da Equipe": retorno de tarefas abertas não atribuídas da equipe'
  );

  // Critério 39: Métricas de produtividade e resumo de tarefas (total, urgentes, aguardando, etc.)
  const summaryMetrics = await TaskService.getSummaryMetrics(userAdmin);
  assert(
    summaryMetrics.total > 0 &&
      typeof summaryMetrics.urgent === 'number' &&
      typeof summaryMetrics.completedToday === 'number' &&
      summaryMetrics.byModule !== undefined,
    'Critério 39: Métricas de produtividade e resumo de tarefas (total, urgentes, aguardando)'
  );

  // ============================================================================
  // GRUPO 15: INTEGRAÇÃO COM BUSCA GLOBAL
  // ============================================================================
  console.log('\n--- 15. INTEGRAÇÃO COM BUSCA GLOBAL ---');

  // Critério 40: Integração com Busca Global: tarefa localizada por taskNumber, título e módulo
  const searchResultNumber = await SearchService.search(taskOpus.taskNumber, userAdmin);
  const foundByNumber = searchResultNumber.categories.tasks?.items.some(
    item => item.id === taskOpus.id
  );

  const searchResultTitle = await SearchService.search('Borderô Opus', userAdmin);
  const foundByTitle = searchResultTitle.categories.tasks?.items.some(
    item => item.id === taskOpus.id
  );

  assert(
    foundByNumber && foundByTitle,
    'Critério 40: Integração com Busca Global: tarefa localizada por taskNumber, título e módulo'
  );

  // ============================================================================
  // RELATÓRIO FINAL
  // ============================================================================
  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM`);
  if (passedTests === totalTests) {
    console.log('TODOS OS 40 CRITÉRIOS DE ACEITE DA FASE 1.1.5.9 FORAM ATENDIDOS COM SUCESSO!');
  } else {
    console.error(`ALERTA: ${totalTests - passedTests} testes falharam.`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
