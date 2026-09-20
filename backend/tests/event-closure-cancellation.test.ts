import { prisma } from '../src/core/database/prisma';
import { ClosureCheckRegistry } from '../src/modules/events/closure/checks/closure-check.registry';
import { ClosureOverrideService } from '../src/modules/events/closure/overrides/closure-override.service';
import { SessionClosureService } from '../src/modules/events/closure/session-closure.service';
import { EventClosureService } from '../src/modules/events/closure/event-closure.service';
import { PostEventService } from '../src/modules/events/closure/post-event/post-event.service';
import { CancellationImpactService } from '../src/modules/events/cancellation/cancellation-impact.service';
import { EventCancellationService } from '../src/modules/events/cancellation/event-cancellation.service';
import { SessionCancellationService } from '../src/modules/events/cancellation/session-cancellation.service';
import { EventArchiveService } from '../src/modules/events/archive/event-archive.service';
import { ArchiveWritePolicy } from '../src/modules/events/archive/archive-write-policy';

async function runClosureCancellationTests() {
  console.log('================================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.14: ENCERRAMENTO, CANCELAMENTO E ARQUIVAMENTO');
  console.log('================================================================\n');

  const eventId = `evt_cls_${Date.now()}`;
  const session1Id = `ses_cls_1_${Date.now()}`;
  const session2Id = `ses_cls_2_${Date.now()}`;

  // Seed Event with 2 sessions
  await prisma.event.create({
    data: {
      id: eventId,
      name: 'Turnê Brasil 2026 - São Paulo',
      status: 'IN_PROGRESS',
      producerId: 'prod_opus',
      venue: 'Allianz Parque',
      city: 'São Paulo',
      state: 'SP'
    }
  });

  await prisma.eventSession.create({
    data: {
      id: session1Id,
      eventId,
      name: 'Sessão 1 - Sábado',
      status: 'CONFIRMED',
      capacity: 2000
    }
  });

  await prisma.eventSession.create({
    data: {
      id: session2Id,
      eventId,
      name: 'Sessão 2 - Domingo',
      status: 'CONFIRMED',
      capacity: 2500
    }
  });

  // Seed Tickets, Orders and Access Entries
  const order1 = await prisma.order.create({
    data: {
      id: `ord_cls_1_${Date.now()}`,
      eventId,
      customerId: 'cust_ana',
      totalAmount: 400.0,
      status: 'PAID'
    }
  });

  const tkt1 = await prisma.ticket.create({
    data: {
      id: `tkt_s1_${Date.now()}`,
      eventId,
      sessionId: session1Id,
      orderId: order1.id,
      ticketNumber: 'TKT-S1-01',
      status: 'PAID'
    }
  });

  await prisma.accessEntry.create({
    data: {
      id: `ent_s1_${Date.now()}`,
      ticketId: tkt1.id,
      eventId,
      sessionId: session1Id,
      accessPointId: 'GATE-1',
      deviceId: 'DEV-1',
      operatorId: 'op_1',
      movementType: 'ENTRY',
      validationId: 'val_1'
    }
  });

  // 1. Session Closure Readiness & Blockers Detection
  console.log('1. Testando detecção de bloqueadores de encerramento da sessão...');
  // Create an active device session to trigger a blocker
  const devSession = await prisma.deviceSession.create({
    data: {
      deviceId: 'DEV-1',
      eventId,
      sessionId: session1Id,
      accessPointId: 'GATE-1',
      operatorId: 'op_1',
      operatorName: 'Operador Catraca',
      isActive: true
    }
  });

  const readiness1 = await SessionClosureService.getReadiness(eventId, session1Id);
  if (readiness1.canClose) {
    throw new Error('Sessão com coletor ativo NÃO deveria poder ser encerrada sem override');
  }
  const deviceBlocker = readiness1.checks.find(c => c.code === 'CHECKIN_ACTIVE_SESSIONS');
  if (!deviceBlocker || !deviceBlocker.blocking) {
    throw new Error('Deveria identificar CHECKIN_ACTIVE_SESSIONS como bloqueador');
  }
  console.log('✔ Bloqueador de turno aberto detectado com sucesso.');

  // 2. Closure Override Application
  console.log('2. Testando aplicação de override justificado em bloqueador...');
  const override = await ClosureOverrideService.applyOverride({
    scope: 'SESSION',
    targetId: session1Id,
    checkCode: 'CHECKIN_ACTIVE_SESSIONS',
    justification: 'Operador esqueceu coletor ligado no término do evento. Catraca física trancada.',
    authorizedBy: 'sup_marcos',
    authorizedByName: 'Marcos Supervisor'
  });

  if (!override.id || override.checkCode !== 'CHECKIN_ACTIVE_SESSIONS') {
    throw new Error('Override não foi registrado corretamente');
  }

  const readinessAfterOverride = await SessionClosureService.getReadiness(eventId, session1Id);
  if (!readinessAfterOverride.canClose) {
    throw new Error('Após aplicação do override, a sessão deveria poder ser encerrada');
  }
  console.log('✔ Override justificado aplicado e sessão liberada para encerramento.');

  // 3. Close Session 1
  console.log('3. Testando encerramento formal da Sessão 1...');
  const closedSession1 = await SessionClosureService.closeSession({
    eventId,
    sessionId: session1Id,
    closedBy: 'sup_marcos',
    closedByName: 'Marcos Supervisor',
    notes: 'Sessão concluída com 100% de ocupação'
  });

  if (!closedSession1.hadBlockerOverrides || closedSession1.finalCheckinCount !== 1) {
    throw new Error('Registro de encerramento da sessão contém dados divergentes');
  }

  const session1Db = await prisma.eventSession.findUnique({ where: { id: session1Id } });
  if (session1Db.status !== 'CLOSED') {
    throw new Error('Status da sessão 1 no banco deveria ser CLOSED');
  }
  console.log('✔ Sessão 1 encerrada formalmente com SessionClosureRecord.');

  // 4. Event Closure Readiness (Blocked because Session 2 is still open)
  console.log('4. Testando prontidão do evento com sessão pendente...');
  const eventReadinessBlocked = await EventClosureService.getReadiness(eventId);
  if (eventReadinessBlocked.canClose || eventReadinessBlocked.allSessionsClosed) {
    throw new Error('Evento com sessão 2 ainda aberta NÃO deve poder ser encerrado');
  }
  console.log('✔ Encerramento geral do evento impedido corretamente enquanto houver sessões abertas.');

  // Close Session 2 directly
  await SessionClosureService.closeSession({
    eventId,
    sessionId: session2Id,
    closedBy: 'sup_marcos',
    closedByName: 'Marcos Supervisor'
  });

  // Now Event readiness should be passed
  const eventReadinessReady = await EventClosureService.getReadiness(eventId);
  if (!eventReadinessReady.canClose || !eventReadinessReady.allSessionsClosed) {
    throw new Error('Evento com todas as sessões fechadas deveria estar apto para encerramento');
  }
  console.log('✔ Todas as sessões fechadas e evento liberado para encerramento.');

  // 5. Close Event Formally -> FINISHED
  console.log('5. Testando encerramento do evento e geração do snapshot...');
  const closureResult = await EventClosureService.closeEvent({
    eventId,
    closedBy: 'dir_roberto',
    closedByName: 'Roberto Diretor de Operações',
    notes: 'Turnê concluída em São Paulo com sucesso absoluto'
  });

  if (closureResult.closureRecord.statusAfter !== 'FINISHED') {
    throw new Error('Status final do encerramento deveria ser FINISHED');
  }
  if (closureResult.snapshot.sessionsCount !== 2) {
    throw new Error('Snapshot deveria conter 2 sessões');
  }

  const eventDb = await prisma.event.findUnique({ where: { id: eventId } });
  if (eventDb.status !== 'FINISHED') {
    throw new Error('Status do evento no banco deveria ser FINISHED');
  }
  console.log('✔ Evento encerrado formalmente com status FINISHED e EventClosureSnapshot.');

  // 6. Post-Event Operational Report
  console.log('6. Testando relatório operacional pós-evento...');
  const postReport = await PostEventService.getReport(eventId);
  if (postReport.operationalKPIs.totalCapacity !== 4500) {
    throw new Error(`Capacidade total consolidada divergente: ${postReport.operationalKPIs.totalCapacity}`);
  }
  if (postReport.sessions.length !== 2) {
    throw new Error('Relatório pós-evento deveria detalhar as 2 sessões');
  }
  console.log(`✔ Relatório pós-evento gerado com sucesso: Capacidade ${postReport.operationalKPIs.totalCapacity}, Status ${postReport.eventStatus}.`);

  // 7. Event Archiving (FINISHED -> ARCHIVED)
  console.log('7. Testando arquivamento de evento encerrado e política de somente leitura...');
  const archiveRecord = await EventArchiveService.archiveEvent({
    eventId,
    justification: 'Borderô final homologado pela contabilidade e repasses liquidados.',
    archivedBy: 'auditor_pedro',
    archivedByName: 'Pedro Auditor'
  });

  if (archiveRecord.statusBeforeArchive !== 'FINISHED' || !archiveRecord.readOnlyEnforced) {
    throw new Error('Registro de arquivamento incorreto');
  }

  const eventArchivedDb = await prisma.event.findUnique({ where: { id: eventId } });
  if (eventArchivedDb.status !== 'ARCHIVED') {
    throw new Error('Status do evento arquivado deveria ser ARCHIVED');
  }

  // Assert read-only enforcement
  let mutationBlocked = false;
  try {
    await ArchiveWritePolicy.assertNotArchived(eventId);
  } catch (err: any) {
    mutationBlocked = true;
  }
  if (!mutationBlocked) {
    throw new Error('ArchiveWritePolicy deveria lançar exceção para evento arquivado');
  }
  console.log('✔ Evento arquivado com sucesso e política de somente leitura rigorosamente aplicada.');

  // 8. Cancellation Impact Analysis and Event Cancellation
  console.log('8. Testando cálculo de impacto e cancelamento formal de evento...');
  const cancelEventId = `evt_cancel_${Date.now()}`;
  const cancelSessionId = `ses_cancel_${Date.now()}`;

  await prisma.event.create({
    data: {
      id: cancelEventId,
      name: 'Show Especial da Primavera',
      status: 'ON_SALE',
      producerId: 'prod_opus'
    }
  });

  await prisma.eventSession.create({
    data: {
      id: cancelSessionId,
      eventId: cancelEventId,
      name: 'Show Único',
      status: 'CONFIRMED'
    }
  });

  const cancelOrder = await prisma.order.create({
    data: {
      id: `ord_cncl_${Date.now()}`,
      eventId: cancelEventId,
      customerId: 'cust_felipe',
      totalAmount: 650.0,
      status: 'PAID'
    }
  });

  await prisma.ticket.create({
    data: {
      id: `tkt_cncl_1_${Date.now()}`,
      eventId: cancelEventId,
      sessionId: cancelSessionId,
      orderId: cancelOrder.id,
      status: 'PAID'
    }
  });

  // Calculate Impact
  const impact = await CancellationImpactService.calculateImpact({ eventId: cancelEventId });
  if (impact.totalTicketsSold !== 1 || impact.grossRevenueToRefund !== 650.0 || impact.customersAffectedCount !== 1) {
    throw new Error('Cálculo de impacto de cancelamento divergente');
  }
  console.log(`✔ Impacto calculado: R$ ${impact.grossRevenueToRefund} a estornar, ${impact.customersAffectedCount} cliente(s) impactado(s).`);

  // Request & Execute Cancellation
  const cancelReq = await EventCancellationService.requestCancellation({
    eventId: cancelEventId,
    reason: 'Impossibilidade de logística aérea decorrente de fortes tempestades',
    cancellationCategory: 'WEATHER',
    refundPolicyNotes: 'Estorno total de ingressos e taxas em até 7 dias úteis.',
    notifyCustomers: true,
    requestedBy: 'adm_opus',
    requestedByName: 'Diretoria Opus',
    immediateExecuteIfPermitted: true
  });

  if (cancelReq.status !== 'EXECUTED') {
    throw new Error('Cancelamento com execução imediata deveria ter status EXECUTED');
  }

  const cancelledEventDb = await prisma.event.findUnique({ where: { id: cancelEventId } });
  if (cancelledEventDb.status !== 'CANCELLED') {
    throw new Error('Status do evento cancelado deveria ser CANCELLED');
  }

  const cancelledTickets = await prisma.ticket.findMany({ where: { eventId: cancelEventId } });
  if (cancelledTickets.some(t => t.status !== 'CANCELLED')) {
    throw new Error('Todos os ingressos do evento cancelado deveriam estar CANCELLED');
  }
  console.log('✔ Cancelamento de evento executado, ingressos invalidados e evento transicionado para CANCELLED.');

  // 9. Partial Session Cancellation
  console.log('9. Testando cancelamento de sessão parcial sem afetar todo o evento...');
  const multiEventId = `evt_multi_${Date.now()}`;
  const sOpen = `ses_multi_1_${Date.now()}`;
  const sToCancel = `ses_multi_2_${Date.now()}`;

  await prisma.event.create({
    data: {
      id: multiEventId,
      name: 'Festival 2 Dias',
      status: 'IN_PROGRESS',
      producerId: 'prod_opus'
    }
  });

  await prisma.eventSession.create({ data: { id: sOpen, eventId: multiEventId, name: 'Dia 1', status: 'CONFIRMED' } });
  await prisma.eventSession.create({ data: { id: sToCancel, eventId: multiEventId, name: 'Dia 2', status: 'CONFIRMED' } });

  const partialResult = await SessionCancellationService.cancelSession({
    eventId: multiEventId,
    sessionId: sToCancel,
    reason: 'Cancelamento apenas do segundo dia por motivo de segurança da estrutura do palco',
    cancellationCategory: 'SECURITY',
    refundPolicyNotes: 'Estorno proporcional do segundo dia',
    cancelledBy: 'sup_seguranca',
    cancelledByName: 'Chefe de Segurança'
  });

  if (!partialResult.isPartialSession || partialResult.status !== 'EXECUTED') {
    throw new Error('Cancelamento parcial da sessão deveria estar EXECUTED');
  }

  const multiEventDb = await prisma.event.findUnique({ where: { id: multiEventId } });
  if (multiEventDb.status === 'CANCELLED') {
    throw new Error('O evento geral NÃO deve ser cancelado quando apenas uma sessão é cancelada');
  }

  const sToCancelDb = await prisma.eventSession.findUnique({ where: { id: sToCancel } });
  if (sToCancelDb.status !== 'CANCELLED') {
    throw new Error('A sessão cancelada deveria estar CANCELLED');
  }
  console.log('✔ Cancelamento parcial da sessão executado preservando a integridade do evento.');

  console.log('\n================================================================');
  console.log('TODOS OS TESTES DA FASE 1.2.14 FORAM CONCLUÍDOS COM SUCESSO!');
  console.log('================================================================\n');
}

runClosureCancellationTests().catch(err => {
  console.error('FALHA NOS TESTES DA FASE 1.2.14:', err);
  process.exit(1);
});
