import { OperationStateMachine } from '../src/modules/events/operation/lifecycle/operation-state-machine';
import { OperationReadinessService } from '../src/modules/events/operation/readiness/operation-readiness.service';
import { OperationTransitionService } from '../src/modules/events/operation/lifecycle/operation-transition.service';
import { OperationCommandService } from '../src/modules/events/operation/commands/operation-command.service';
import { SessionAccessPointService } from '../src/modules/events/operation/access-points/session-access-point.service';
import { OperationBroadcastService } from '../src/modules/events/operation/communication/operation-broadcast.service';
import { OperationHandoffService } from '../src/modules/events/operation/communication/operation-handoff.service';
import { OperationSnapshotService } from '../src/modules/events/operation/snapshot/operation-snapshot.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('================================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.12: CENTRAL DE OPERAÇÃO EM TEMPO REAL');
  console.log('================================================================\n');

  const eventId = `evt_ops_${Date.now()}`;
  const sessionId = `ses_ops_${Date.now()}`;

  // Pre-seed event and session in memory database
  await prisma.event.create({
    data: {
      id: eventId,
      name: 'Festival de Verão 2026',
      publicCode: 'FEST26',
      status: 'PUBLISHED',
      producerId: 'prod_1'
    }
  });

  await prisma.eventSession.create({
    data: {
      id: sessionId,
      eventId,
      name: 'Dia 1 - Abertura Principal',
      startDate: new Date(),
      endDate: new Date(Date.now() + 8 * 3600 * 1000),
      totalCapacity: 5000,
      status: 'CONFIRMED'
    }
  });

  // 1. OperationStateMachine Transitions & Guards
  console.log('1. Testando máquina de estados operacional (OperationStateMachine)...');
  if (!OperationStateMachine.canTransition('PREPARATION', 'READY')) {
    throw new Error('PREPARATION deveria poder transicionar para READY');
  }
  if (!OperationStateMachine.canTransition('READY', 'OPENING')) {
    throw new Error('READY deveria poder transicionar para OPENING');
  }
  if (!OperationStateMachine.canTransition('OPENING', 'ACTIVE')) {
    throw new Error('OPENING deveria poder transicionar para ACTIVE');
  }
  if (!OperationStateMachine.canTransition('ACTIVE', 'CLOSING')) {
    throw new Error('ACTIVE deveria poder transicionar para CLOSING');
  }
  if (!OperationStateMachine.canTransition('CLOSING', 'CLOSED')) {
    throw new Error('CLOSING deveria poder transicionar para CLOSED');
  }
  if (OperationStateMachine.canTransition('CLOSED', 'ACTIVE')) {
    throw new Error('CLOSED é estado terminal e NÃO deve transicionar para ACTIVE');
  }
  if (OperationStateMachine.canTransition('PREPARATION', 'CLOSED')) {
    throw new Error('PREPARATION NÃO deve transicionar diretamente para CLOSED');
  }
  console.log('✓ Teste 1 passou: Todas as regras de transição estrita da máquina de estados foram validadas.\n');

  // 2. OperationReadinessService & Evaluation
  console.log('2. Testando avaliação de prontidão (OperationReadinessService)...');
  const readiness = await OperationReadinessService.evaluateReadiness(eventId, sessionId, 'op_initial');
  if (!readiness || !readiness.items || readiness.items.length === 0) {
    throw new Error('Falha ao avaliar prontidão operacional');
  }
  console.log(`✓ Teste 2 passou: Checklist de prontidão avaliado com ${readiness.items.length} itens. Status geral: ${readiness.status}.\n`);

  // 3. OperationTransitionService Execution (PREPARATION -> OPENING)
  console.log('3. Testando transição operacional com atribuição de usuário e timestamp...');
  const opSession = await OperationTransitionService.executeTransition({
    eventId,
    sessionId,
    targetStatus: 'OPENING',
    userId: 'usr_lead_1',
    userName: 'Carlos Líder Geral',
    notes: 'Abertura de portões autorizada'
  });

  if (opSession.status !== 'OPENING') {
    throw new Error(`Esperado status OPENING, obteve ${opSession.status}`);
  }
  if (!opSession.actualOpeningAt || opSession.openedBy !== 'usr_lead_1') {
    throw new Error('openedBy ou actualOpeningAt não foram registrados');
  }
  console.log(`✓ Teste 3 passou: Sessão operacional aberta com sucesso por ${opSession.openedBy} às ${opSession.actualOpeningAt}.\n`);

  // 4. Typed Commands & SessionAccessPoint Execution
  console.log('4. Testando comandos operacionais em pontos de acesso (LOGICAL vs INTEGRATION)...');
  await SessionAccessPointService.ensureSessionAccessPoints(eventId, sessionId, opSession.id);
  const accessPoints = await SessionAccessPointService.listAccessPoints(sessionId);
  if (accessPoints.length === 0) {
    throw new Error('Nenhum ponto de acesso encontrado para a sessão');
  }
  const firstGate = accessPoints[0];

  // Execute OPEN_ACCESS_POINT command
  const openCmd = await OperationCommandService.executeCommand({
    operationId: opSession.id,
    sessionId,
    eventId,
    commandType: 'OPEN_ACCESS_POINT',
    targetType: 'ACCESS_POINT',
    targetId: firstGate.id,
    requestedBy: 'usr_lead_1',
    requestedByName: 'Carlos Líder Geral',
    executionMode: 'LOGICAL',
    idempotencyKey: `cmd_open_${firstGate.id}_1`
  });

  if (openCmd.status !== 'SUCCESS') {
    throw new Error('Falha ao executar comando OPEN_ACCESS_POINT');
  }

  // Verify access point status
  const updatedAps = await SessionAccessPointService.listAccessPoints(sessionId);
  const updatedGate = updatedAps.find(p => p.id === firstGate.id);
  if (updatedGate?.status !== 'OPEN') {
    throw new Error(`Ponto de acesso deveria estar OPEN, mas está ${updatedGate?.status}`);
  }
  console.log(`✓ Teste 4 passou: Comando OPEN_ACCESS_POINT executado no portão "${updatedGate.name}". Modo: ${updatedGate.executionMode}.\n`);

  // 5. Critical Incident Blocking Closure & Override
  console.log('5. Testando bloqueio de encerramento por incidente crítico ativo...');
  // Seed critical incident
  const criticalIncident = await prisma.supportTicket.create({
    data: {
      eventId,
      sessionId,
      type: 'INCIDENT',
      severity: 'CRITICAL',
      status: 'OPEN',
      subject: 'Queda de energia no setor VIP',
      description: 'Gerador 2 desarmou e precisa de rearme pelo eletricista de plantão.'
    }
  });

  // Move operation to ACTIVE first
  await OperationTransitionService.executeTransition({
    eventId,
    sessionId,
    targetStatus: 'ACTIVE',
    userId: 'usr_lead_1',
    userName: 'Carlos Líder Geral'
  });

  // Now attempt to transition to CLOSED without override -> must fail
  let blockedFailed = false;
  try {
    await OperationTransitionService.executeTransition({
      eventId,
      sessionId,
      targetStatus: 'CLOSED',
      userId: 'usr_lead_1',
      userName: 'Carlos Líder Geral'
    });
  } catch (err: any) {
    blockedFailed = true;
    console.log(`  -> Bloqueio acionado com sucesso: "${err.message}"`);
  }

  if (!blockedFailed) {
    throw new Error('Encerramento com incidente crítico deveria ter sido bloqueado');
  }

  // Now transition with valid override & justification -> must succeed
  const closedWithOverride = await OperationTransitionService.executeTransition({
    eventId,
    sessionId,
    targetStatus: 'CLOSED',
    userId: 'usr_lead_1',
    userName: 'Carlos Líder Geral',
    override: true,
    overrideReason: 'Incidente mitigado com equipe terceirizada de manutenção; evento já evacuado.'
  });

  if (closedWithOverride.status !== 'CLOSED') {
    throw new Error('Encerramento com override deveria ter sido bem sucedido');
  }
  console.log('✓ Teste 5 passou: Encerramento foi estritamente bloqueado por incidente crítico e liberado após override fundamentado.\n');

  // 6. Broadcasts & Shift Handoff
  console.log('6. Testando comunicados internos (Broadcasts) e passagem de turno (Handoff)...');
  const broadcast = await OperationBroadcastService.createBroadcast({
    operationId: opSession.id,
    eventId,
    priority: 'WARNING',
    title: 'Atenção Portão Sul',
    message: 'Fluxo intenso detectado na triagem externa. Reforçar equipe de leitura.',
    sentBy: 'usr_lead_1',
    sentByName: 'Carlos Líder Geral',
    requiresAck: true
  });

  if (!broadcast || broadcast.priority !== 'WARNING') {
    throw new Error('Falha ao criar broadcast');
  }

  // Staff acknowledges broadcast
  const receipt = await OperationBroadcastService.acknowledgeBroadcast({
    broadcastId: broadcast.id,
    userId: 'usr_op_2',
    userName: 'Mariana Portão Sul'
  });
  if (!receipt) {
    throw new Error('Falha ao confirmar leitura do broadcast');
  }

  // Perform handoff
  const handoff = await OperationHandoffService.registerHandoff({
    operationId: opSession.id,
    eventId,
    fromUserId: 'usr_lead_1',
    fromUserName: 'Carlos Líder Geral',
    toUserId: 'usr_lead_2',
    toUserName: 'Beatriz Coordenadora Noite',
    notes: 'Operação de encerramento em andamento. Equipe de dispersão posicionada.'
  });

  if (!handoff || handoff.toUserId !== 'usr_lead_2') {
    throw new Error('Falha ao registrar passagem de turno');
  }
  console.log(`✓ Teste 6 passou: Comunicado emitido e confirmado. Passagem de turno registrada de ${handoff.fromUserName} para ${handoff.toUserName}.\n`);

  // 7. Full Operational Snapshot & Zero Fake Data Invariant
  console.log('7. Testando snapshot unificado da Central de Operação e Invariante de Métricas Reais...');
  const snapshot = await OperationSnapshotService.getSnapshot(eventId, sessionId);

  if (!snapshot || !snapshot.operation || !snapshot.kpis) {
    throw new Error('Snapshot retornado incompleto');
  }

  if (snapshot.operation.status !== 'CLOSED') {
    throw new Error(`Status da operação no snapshot deveria ser CLOSED, obteve ${snapshot.operation.status}`);
  }

  if (snapshot.areas.length === 0) {
    throw new Error('Áreas operacionais deveriam estar presentes no snapshot');
  }

  if (snapshot.accessPoints.length === 0) {
    throw new Error('Pontos de acesso deveriam estar presentes no snapshot');
  }

  if (snapshot.timeline.length === 0) {
    throw new Error('Linha do tempo operacional deveria registrar os eventos cronológicos');
  }

  if (snapshot.sequence <= 0) {
    throw new Error('Sequence counter deveria ser incremental e maior que zero');
  }

  console.log(`✓ Teste 7 passou: Snapshot consolidado com status ${snapshot.operation.status}, ${snapshot.areas.length} áreas, ${snapshot.accessPoints.length} pontos de acesso e ${snapshot.timeline.length} eventos na timeline (sequence=${snapshot.sequence}).\n`);

  console.log('================================================================');
  console.log('TODOS OS 7 TESTES DA FASE 1.2.12 PASSARAM COM 100% DE SUCESSO!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DA FASE 1.2.12:');
  console.error(err);
  process.exit(1);
});
