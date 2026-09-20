import { EventStateMachine } from '../src/modules/events/lifecycle/event-state-machine';
import { EventTransitionService } from '../src/modules/events/lifecycle/event-transition.service';
import { EventReviewService } from '../src/modules/events/review/event-review.service';
import { EventPublicationService } from '../src/modules/events/publication/event-publication.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.9: STATE MACHINE, REVISÃO E PUBLICAÇÃO');
  console.log('======================================================\n');

  const eventId = 'evt_1001';
  const adminUser = { id: 'usr_admin', name: 'Administrador DiskIngressos', permissions: ['*'] };

  // 1. Validação estrutural da State Machine
  console.log('1. Testando regras estruturais da State Machine...');
  if (!EventStateMachine.isTransitionAllowed('DRAFT', 'CONFIGURING')) {
    throw new Error('DRAFT para CONFIGURING deveria ser permitido');
  }
  if (!EventStateMachine.isTransitionAllowed('CONFIGURING', 'REVIEW')) {
    throw new Error('CONFIGURING para REVIEW deveria ser permitido');
  }
  if (!EventStateMachine.isTransitionAllowed('REVIEW', 'APPROVAL_PENDING')) {
    throw new Error('REVIEW para APPROVAL_PENDING deveria ser permitido');
  }
  if (EventStateMachine.isTransitionAllowed('DRAFT', 'ON_SALE')) {
    throw new Error('DRAFT direto para ON_SALE NÃO PODE ser permitido');
  }
  if (EventStateMachine.isTransitionAllowed('CONFIGURING', 'ON_SALE')) {
    throw new Error('CONFIGURING direto para ON_SALE NÃO PODE ser permitido');
  }
  console.log('✓ Teste 1 passou! Regras estruturais da State Machine validadas com sucesso.\n');

  // 2. Snapshot de Revisão e Cálculo de Hash Criptográfico
  console.log('2. Testando criação de snapshot imutável e hash canônico...');
  const snapshot = await EventReviewService.createSnapshot(eventId, adminUser);
  if (!snapshot || !snapshot.configurationHash || snapshot.status !== 'VALID') {
    throw new Error('Falha ao gerar snapshot imutável de revisão');
  }
  if (snapshot.summaryData.sectionsCount <= 0) {
    throw new Error('Resumo do snapshot deveria conter contagem de setores');
  }
  console.log(`✓ Teste 2 passou! Snapshot v${snapshot.eventVersion} criado com hash: ${snapshot.configurationHash.substring(0, 16)}...`);
  console.log(`  - Setores: ${snapshot.summaryData.sectionsCount}, Capacidade: ${snapshot.summaryData.totalCapacity}\n`);

  // 3. Verificação de Integridade do Snapshot
  console.log('3. Testando validação de integridade do snapshot congelado...');
  const integrity = await EventReviewService.validateSnapshotIntegrity(eventId);
  if (!integrity.valid || integrity.currentHash !== snapshot.configurationHash) {
    throw new Error('Integridade do snapshot falhou mesmo sem alterações na configuração');
  }
  console.log('✓ Teste 3 passou! Integridade do snapshot congelado confirmada.\n');

  // 4. Invalidação automática após mutação não autorizada
  console.log('4. Testando invalidação controlada de snapshot...');
  await EventReviewService.invalidateSnapshot(eventId, 'Alteração estrutural detectada pelo sistema');
  const latestSnap = await EventReviewService.getLatestSnapshot(eventId);
  if (!latestSnap || latestSnap.status !== 'INVALIDATED') {
    throw new Error('Snapshot deveria estar com status INVALIDATED');
  }
  console.log(`✓ Teste 4 passou! Snapshot marcado como ${latestSnap.status}: ${latestSnap.invalidatedReason}\n`);

  // Regenera snapshot válido para continuar fluxo
  await EventReviewService.createSnapshot(eventId, adminUser);

  // 5. Transições Disponíveis e Guard Conditions
  console.log('5. Testando consulta de transições disponíveis e avaliação de guard conditions...');
  const available = await EventTransitionService.getAvailableTransitions(eventId, adminUser.permissions);
  if (!available || !available.currentStatus || !Array.isArray(available.transitions)) {
    throw new Error('Falha ao obter transições disponíveis');
  }
  console.log(`✓ Teste 5 passou! Status atual: ${available.currentStatus}. Transições possíveis: ${available.transitions.length}.\n`);

  // 6. Token Assinado e Criptográfico de Preview Público
  console.log('6. Testando geração e validação de token temporário de preview...');
  const preview = EventPublicationService.generatePreviewToken(eventId, adminUser);
  if (!preview.token || !preview.previewUrl.includes(eventId)) {
    throw new Error('Token de preview inválido');
  }

  const verification = EventPublicationService.verifyPreviewToken(preview.token);
  if (!verification.valid || verification.eventId !== eventId) {
    throw new Error('Falha na validação do token de preview assinado');
  }

  // Token inválido / adulterado
  const tamperedToken = preview.token + 'bad_sig';
  const badVerification = EventPublicationService.verifyPreviewToken(tamperedToken);
  if (badVerification.valid) {
    throw new Error('Token adulterado deveria ser rejeitado');
  }
  console.log('✓ Teste 6 passou! Token HMAC-SHA256 gerado e autenticado com sucesso.\n');

  // 7. Teste de Bloqueio por Guardas de Segurança
  console.log('7. Testando bloqueio automático de transição quando requisitos de vendas não são atendidos...');
  await prisma.event.update({ where: { id: eventId }, data: { status: 'ON_SALE' } });

  const pauseResult = await EventPublicationService.pauseSales(
    eventId,
    { reason: 'Manutenção programada da bilheteria' },
    adminUser
  );
  if (pauseResult.event.status !== 'SALES_PAUSED') {
    throw new Error('Evento deveria estar no status SALES_PAUSED');
  }

  // Tentativa de retomar sem canal ativo deve ser bloqueada pelas Guardas
  let blockedCaught = false;
  try {
    await EventPublicationService.resumeSales(eventId, adminUser);
  } catch (err: any) {
    if (err.code === 'TRANSITION_BLOCKED') {
      blockedCaught = true;
    }
  }

  if (!blockedCaught) {
    throw new Error('A transição deveria ter sido bloqueada pelas guardas de segurança');
  }
  console.log('✓ Teste 7 passou! Tentativa prematura bloqueada com sucesso pelas Guard Conditions.\n');

  // 8. Habilitação de Requisitos e Retomada Autorizada
  console.log('8. Testando transição autorizada após cumprimento dos requisitos operacionais...');
  // Habilita canal e preço para satisfazer guardas
  await (prisma as any).eventSalesChannel.create({
    data: {
      id: `esc_test_${Date.now()}`,
      eventId,
      channelId: 'chn_site_01',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  await (prisma as any).priceConfiguration.create({
    data: {
      id: `price_test_${Date.now()}`,
      eventId,
      batchId: 'batch_1001',
      faceValue: 120.00,
      customerFeeValue: 12.00,
      finalCustomerPrice: 132.00
    }
  });

  await prisma.eventVenue.create({
    data: {
      id: `ev_test_${Date.now()}`,
      eventId,
      venueId: 'ven_101',
      name: 'Arena Principal Disk Ingressos'
    }
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { capacity: 25000 }
  });

  const allSessions = await prisma.eventSession.findMany({ where: { eventId } });
  for (const s of allSessions) {
    await prisma.eventSession.update({
      where: { id: s.id },
      data: { totalCapacity: 25000 }
    });
  }

  const { EventDocumentService } = await import('../src/modules/events/documents/event-document.service');
  const docs = await EventDocumentService.listRequirements(eventId);
  for (const doc of docs) {
    if (doc.blocking && doc.status !== 'VALID') {
      await EventDocumentService.uploadDocument(eventId, {
        requirementId: doc.id,
        documentName: `${doc.name}.pdf`,
        validFrom: '2026-01-01',
        validUntil: '2027-01-01'
      });
    }
  }

  const sessions = await prisma.eventSession.findMany({ where: { eventId } });
  if (sessions.length > 0) {
    await (prisma as any).inventoryPool.create({
      data: {
        id: `pool_test_${Date.now()}`,
        eventId,
        sessionId: sessions[0].id,
        capacity: 5000,
        available: 5000,
        sold: 0,
        reserved: 0,
        blocked: 0,
        held: 0
      }
    });
  }

  const { EventReadinessService } = await import('../src/modules/events/readiness/event-readiness.service');
  const checkReadiness = await EventReadinessService.evaluateEventReadiness(eventId);
  const remainingBlockers = checkReadiness.issues.filter(i => i.severity === 'BLOCKING' || i.severity === 'CRITICAL');
  console.log('  -> Pendências bloqueantes restantes:', remainingBlockers.map(b => `${b.code}: ${b.title}`));

  const resumeResult = await EventPublicationService.resumeSales(eventId, adminUser);
  if (resumeResult.event.status !== 'ON_SALE') {
    throw new Error('Evento deveria ter transitado para ON_SALE');
  }
  console.log('✓ Teste 8 passou! Retomada de vendas homologada e executada com sucesso após atender todos os requisitos.\n');

  console.log('======================================================');
  console.log('TODOS OS 8 TESTES DA FASE 1.2.9 PASSARAM COM SUCESSO!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Erro nos testes da Fase 1.2.9:', err);
  process.exit(1);
});
