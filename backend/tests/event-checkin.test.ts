import { prisma } from '../src/core/database/prisma';
import { TicketTokenService } from '../src/modules/events/checkin/validation/ticket-token.service';
import { AccessDeviceService } from '../src/modules/events/checkin/devices/access-device.service';
import { DeviceSessionService } from '../src/modules/events/checkin/devices/device-session.service';
import { AccessRuleService } from '../src/modules/events/checkin/rules/access-rule.service';
import { AccessValidationService } from '../src/modules/events/checkin/validation/access-validation.service';
import { TicketAccessBlockService } from '../src/modules/events/checkin/exceptions/ticket-access-block.service';
import { AccessExceptionService } from '../src/modules/events/checkin/exceptions/access-exception.service';
import { OfflineBundleService } from '../src/modules/events/checkin/offline/offline-bundle.service';
import { OfflineSyncService } from '../src/modules/events/checkin/offline/offline-sync.service';
import { CheckinSummaryService } from '../src/modules/events/checkin/monitoring/checkin-summary.service';

async function runCheckinTests() {
  console.log('================================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.13: CHECK-IN, ACESSO E DISPOSITIVOS');
  console.log('================================================================\n');

  const eventId = `evt_chk_${Date.now()}`;
  const sessionId = `ses_chk_${Date.now()}`;
  const accessPointId = `ap_chk_${Date.now()}`;

  // Seed Event, Session, AccessPoint
  await prisma.event.create({
    data: {
      id: eventId,
      name: 'Festival de Inverno 2026',
      status: 'IN_PROGRESS',
      producerId: 'prod_test'
    }
  });

  await prisma.eventSession.create({
    data: {
      id: sessionId,
      eventId,
      name: 'Noite de Abertura',
      status: 'CONFIRMED',
      startAt: new Date(Date.now() - 3600 * 1000), // started 1h ago
      endAt: new Date(Date.now() + 5 * 3600 * 1000), // ends in 5h
      capacity: 1000
    }
  });

  await prisma.venueAccessPoint.create({
    data: {
      id: accessPointId,
      name: 'Portão A - Principal',
      code: 'GATE-A',
      venueId: 'ven_1'
    }
  });

  // 1. Device Registration and Management
  console.log('1. Testando registro, heartbeat e gerenciamento de dispositivos...');
  const device = await AccessDeviceService.registerDevice({
    eventId,
    name: 'Coletor Portão A-01',
    type: 'DEDICATED_SCANNER',
    allowedAccessPointIds: [accessPointId],
    allowedSessionIds: [sessionId],
    registeredBy: 'adm_master'
  });

  if (!device.id || device.status !== 'ACTIVE') {
    throw new Error('Dispositivo deveria ser criado como ACTIVE');
  }
  if (!device.apiKeyMasked) {
    throw new Error('API Key mascarada deve ser retornada no registro');
  }

  // Record Heartbeat
  const hbDevice = await AccessDeviceService.recordHeartbeat(device.id, 88, '2.1.0');
  if (hbDevice.batteryLevel !== 88 || hbDevice.appVersion !== '2.1.0') {
    throw new Error('Heartbeat do dispositivo não atualizou dados corretamente');
  }
  console.log('✔ Dispositivo registrado e heartbeat verificado com sucesso.');

  // 2. Operator Device Session
  console.log('2. Testando abertura de turno de operador no dispositivo...');
  const devSession = await DeviceSessionService.startSession({
    deviceId: device.id,
    eventId,
    sessionId,
    accessPointId,
    operatorId: 'user_op_10',
    operatorName: 'Carlos Operador'
  });

  if (!devSession.isActive || devSession.operatorName !== 'Carlos Operador') {
    throw new Error('Sessão do operador deveria estar ativa');
  }
  console.log('✔ Sessão do dispositivo aberta com sucesso.');

  // 3. Access Rules Configuration
  console.log('3. Testando configuração de regras de acesso e reentrada...');
  const ruleNoReentry = await AccessRuleService.createRule({
    eventId,
    sessionId,
    name: 'Regra Pista Sem Reentrada',
    ticketTypeIds: ['tt_pista'],
    allowedAccessPointIds: [accessPointId],
    reentryPolicy: 'NO_REENTRY',
    maxReentries: 0
  });

  if (ruleNoReentry.reentryPolicy !== 'NO_REENTRY') {
    throw new Error('Regra deveria ter política NO_REENTRY');
  }
  console.log('✔ Regra de acesso configurada com sucesso.');

  // 4. Token Generation and Validation
  console.log('4. Testando geração de tokens opacos e validação física...');
  const ticket1 = await prisma.ticket.create({
    data: {
      id: `tkt_chk_1_${Date.now()}`,
      eventId,
      sessionId,
      ticketTypeId: 'tt_pista',
      ticketNumber: 'TKT-001',
      ticketCode: 'TKTC001',
      ticketCodeNormalized: 'TKTC001',
      status: 'PAID',
      customerName: 'Mariana Lima',
      documentNumber: '12345678900'
    }
  });

  const opaqueToken = TicketTokenService.generateOpaqueToken(ticket1.id, eventId);
  const parsed = TicketTokenService.parseTokenOrCode(opaqueToken);
  if (!parsed.isOpaque || parsed.ticketId !== ticket1.id) {
    throw new Error('Token opaco deveria ser parseado e validado com sucesso');
  }

  // First Validation: ALLOW
  const val1 = await AccessValidationService.validate({
    tokenOrCode: opaqueToken,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    operatorName: 'Carlos Operador'
  });

  if (val1.decision !== 'ALLOW' || val1.reasonCode !== 'ACCESS_ALLOWED') {
    throw new Error(`Primeira validação falhou: ${val1.decision} - ${val1.reasonCode}`);
  }
  if (!val1.ticket || val1.ticket.ticketNumber !== 'TKT-001') {
    throw new Error('Detalhes do ingresso não foram preenchidos corretamente na validação');
  }

  // Second Validation of same ticket with NO_REENTRY: DENY
  const val2 = await AccessValidationService.validate({
    tokenOrCode: opaqueToken,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    operatorName: 'Carlos Operador'
  });

  if (val2.decision !== 'DENY' || val2.reasonCode !== 'TICKET_ALREADY_USED') {
    throw new Error(`Segunda validação deveria ter sido DENY / TICKET_ALREADY_USED, recebeu: ${val2.decision} - ${val2.reasonCode}`);
  }
  console.log('✔ Validação inicial e bloqueio por NO_REENTRY validados com sucesso.');

  // 5. Concurrency & Idempotency
  console.log('5. Testando idempotência via validationRequestId...');
  const reqId = `idemp_${Date.now()}`;
  const idemp1 = await AccessValidationService.validate({
    tokenOrCode: opaqueToken,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    validationRequestId: reqId
  });

  const idemp2 = await AccessValidationService.validate({
    tokenOrCode: opaqueToken,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    validationRequestId: reqId
  });

  if (idemp1.validationRequestId !== idemp2.validationRequestId || idemp2.decision !== idemp1.decision) {
    throw new Error('Idempotência falhou: requisições com o mesmo ID deveriam retornar resultado idêntico');
  }
  console.log('✔ Idempotência e integridade de requisições verificadas com sucesso.');

  // 6. Reentry Policy: REENTRY_AFTER_EXIT
  console.log('6. Testando reentrada condicionada a saída prévia (REENTRY_AFTER_EXIT)...');
  await AccessRuleService.createRule({
    eventId,
    sessionId,
    name: 'Regra VIP com Saída Registrada',
    ticketTypeIds: ['tt_vip'],
    allowedAccessPointIds: [accessPointId],
    reentryPolicy: 'REENTRY_AFTER_EXIT'
  });

  const ticketVip = await prisma.ticket.create({
    data: {
      id: `tkt_vip_${Date.now()}`,
      eventId,
      sessionId,
      ticketTypeId: 'tt_vip',
      ticketNumber: 'TKT-VIP-01',
      ticketCode: 'TKTVIP01',
      ticketCodeNormalized: 'TKTVIP01',
      status: 'PAID'
    }
  });

  // Entry 1
  const vipEntry1 = await AccessValidationService.validate({
    tokenOrCode: ticketVip.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10'
  });
  if (vipEntry1.decision !== 'ALLOW') throw new Error('Entrada 1 VIP deveria ser ALLOW');

  // Direct Reentry without exit -> DENY
  const vipReentryDenied = await AccessValidationService.validate({
    tokenOrCode: ticketVip.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10'
  });
  if (vipReentryDenied.decision !== 'DENY' || vipReentryDenied.reasonCode !== 'REENTRY_NOT_ALLOWED') {
    throw new Error('Reentrada VIP sem saída prévia deveria ser DENY / REENTRY_NOT_ALLOWED');
  }

  // Record Exit
  const vipExit = await AccessValidationService.validate({
    tokenOrCode: ticketVip.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    movementType: 'EXIT'
  });
  if (vipExit.decision !== 'ALLOW' || vipExit.reasonCode !== 'EXIT_RECORDED') {
    throw new Error('Registro de saída VIP deveria ser ALLOW / EXIT_RECORDED');
  }

  // Reentry after exit -> ALLOW
  const vipReentryAllowed = await AccessValidationService.validate({
    tokenOrCode: ticketVip.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10',
    movementType: 'REENTRY'
  });
  if (vipReentryAllowed.decision !== 'ALLOW') {
    throw new Error('Reentrada VIP após saída registrada deveria ser ALLOW');
  }
  console.log('✔ Política de reentrada após saída validada com sucesso.');

  // 7. Ticket Access Blocking
  console.log('7. Testando bloqueio administrativo de ingresso...');
  const ticketBlock = await prisma.ticket.create({
    data: {
      id: `tkt_blk_${Date.now()}`,
      eventId,
      sessionId,
      ticketTypeId: 'tt_pista',
      ticketNumber: 'TKT-FRAUD',
      ticketCode: 'TKTFRAUD',
      ticketCodeNormalized: 'TKTFRAUD',
      status: 'PAID'
    }
  });

  await TicketAccessBlockService.blockTicket({
    ticketId: ticketBlock.id,
    ticketNumber: 'TKT-FRAUD',
    eventId,
    reason: 'Suspeita de contestação de pagamento (Chargeback)',
    blockedBy: 'adm_1',
    blockedByName: 'Administrador'
  });

  const blockVal = await AccessValidationService.validate({
    tokenOrCode: ticketBlock.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10'
  });
  if (blockVal.decision !== 'DENY' || blockVal.reasonCode !== 'TICKET_BLOCKED') {
    throw new Error('Ingresso com bloqueio ativo deveria ser recusado como TICKET_BLOCKED');
  }

  // Unblock
  await TicketAccessBlockService.unblockTicket({
    ticketId: ticketBlock.id,
    unblockReason: 'Documentação apresentada na bilheteria física',
    unblockedBy: 'adm_1'
  });

  const unblockVal = await AccessValidationService.validate({
    tokenOrCode: ticketBlock.ticketCode,
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10'
  });
  if (unblockVal.decision !== 'ALLOW') {
    throw new Error('Ingresso desbloqueado deveria ter acesso liberado');
  }
  console.log('✔ Bloqueio e desbloqueio administrativo de ingressos validados com sucesso.');

  // 8. Device Revocation
  console.log('8. Testando revogação imediata de dispositivo...');
  await AccessDeviceService.revokeDevice(device.id, 'Dispositivo extraviado na portaria', 'adm_1');

  const revokedVal = await AccessValidationService.validate({
    tokenOrCode: 'QUALQUER_CODIGO',
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id,
    operatorId: 'user_op_10'
  });
  if (revokedVal.decision !== 'DENY' || revokedVal.reasonCode !== 'DEVICE_REVOKED') {
    throw new Error('Dispositivo revogado deve ter todas as tentativas de validação negadas');
  }

  // Re-authorize device for subsequent tests
  await AccessDeviceService.authorizeDevice(device.id, 'adm_1');
  await DeviceSessionService.startSession({
    deviceId: device.id,
    eventId,
    sessionId,
    accessPointId,
    operatorId: 'user_op_10',
    operatorName: 'Carlos Operador'
  });
  console.log('✔ Revogação e reativação de scanner validadas com sucesso.');

  // 9. Offline Bundle Generation and Sync
  console.log('9. Testando geração de pacote offline e sincronização com conflito...');
  const offlineTicket = await prisma.ticket.create({
    data: {
      id: `tkt_off_${Date.now()}`,
      eventId,
      sessionId,
      ticketTypeId: 'tt_pista',
      ticketNumber: 'TKT-OFFLINE-01',
      ticketCode: 'TKTOFF01',
      ticketCodeNormalized: 'TKTOFF01',
      status: 'PAID'
    }
  });

  const bundle = await OfflineBundleService.generateBundle({
    eventId,
    sessionId,
    accessPointId,
    deviceId: device.id
  });

  if (!bundle.bundleId || bundle.tickets.length === 0) {
    throw new Error('Pacote offline deveria conter ingressos da sessão');
  }

  // Simulate offline checkin on scanner
  const syncResult1 = await OfflineSyncService.processOfflineBatch({
    batchId: `batch_${Date.now()}`,
    deviceId: device.id,
    eventId,
    sessionId,
    operatorId: 'user_op_10',
    items: [
      {
        validationRequestId: `off_req_${Date.now()}`,
        tokenOrCode: offlineTicket.ticketCode,
        movementType: 'ENTRY',
        accessPointId,
        localTimestamp: new Date().toISOString(),
        offlineDecision: 'ALLOW',
        offlineReasonCode: 'OFFLINE_SYNC_ACCEPTED'
      }
    ]
  });

  if (syncResult1.acceptedCount !== 1 || syncResult1.conflictsCount !== 0) {
    throw new Error('Lote offline legítimo deveria ser aceito com 0 conflitos');
  }

  // Simulate second offline sync with SAME ticket (Duplicate offline entry conflict!)
  const syncResult2 = await OfflineSyncService.processOfflineBatch({
    batchId: `batch_conflict_${Date.now()}`,
    deviceId: device.id,
    eventId,
    sessionId,
    operatorId: 'user_op_10',
    items: [
      {
        validationRequestId: `off_req_dup_${Date.now()}`,
        tokenOrCode: offlineTicket.ticketCode,
        movementType: 'ENTRY',
        accessPointId,
        localTimestamp: new Date().toISOString(),
        offlineDecision: 'ALLOW',
        offlineReasonCode: 'OFFLINE_SYNC_ACCEPTED'
      }
    ]
  });

  if (syncResult2.conflictsCount !== 1 || syncResult2.conflicts[0].conflictType !== 'CONFLICT_DUPLICATE_OFFLINE') {
    throw new Error('Sincronização duplicada deveria gerar conflito CONFLICT_DUPLICATE_OFFLINE');
  }

  // Resolve conflict
  const resolved = await OfflineSyncService.resolveConflict(
    syncResult2.conflicts[0].id,
    'supervisor_ana',
    'Conferido documento no portão: participante entrou apenas uma vez, leitor duplicou acidentalmente.'
  );
  if (!resolved.resolved) throw new Error('Conflito deveria constar como resolvido');
  console.log('✔ Pacote offline, conciliação e detecção de CONFLICT_DUPLICATE_OFFLINE validados com sucesso.');

  // 10. Realtime Checkin Summary KPIs
  console.log('10. Testando consolidação de resumo e KPIs de check-in em tempo real...');
  const summary = await CheckinSummaryService.getSummary(eventId, sessionId);

  if (summary.totalTicketsSold <= 0) throw new Error('totalTicketsSold deveria ser maior que zero');
  if (summary.totalCheckedIn <= 0) throw new Error('totalCheckedIn deveria ser maior que zero');
  if (summary.validationsTotal <= 0) throw new Error('validationsTotal deveria registrar leituras');
  if (summary.devicesOnlineCount < 1) throw new Error('devicesOnlineCount deveria contabilizar o dispositivo online');

  console.log(`✔ Resumo consolidado: ${summary.totalCheckedIn}/${summary.totalTicketsSold} ingressos (${summary.checkInPercentage}%), ${summary.validationsTotal} validações.`);

  console.log('\n================================================================');
  console.log('TODOS OS TESTES DA FASE 1.2.13 FORAM CONCLUÍDOS COM SUCESSO!');
  console.log('================================================================\n');
}

runCheckinTests().catch(err => {
  console.error('FALHA NOS TESTES DA FASE 1.2.13:', err);
  process.exit(1);
});
