import { EventSessionService } from '../src/modules/events/sessions/event-session.service';
import { SessionCapacityService } from '../src/modules/events/sessions/capacity/session-capacity.service';
import { SessionConflictService } from '../src/modules/events/sessions/conflicts/session-conflict.service';
import { SessionRecurrenceService } from '../src/modules/events/sessions/recurrence/session-recurrence.service';
import { EventVenueService } from '../src/modules/events/event-venue/event-venue.service';
import { memoryDb } from '../src/core/database/prisma';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

const mockUser: AuthenticatedUser = {
  id: 'usr_producer_1',
  name: 'Produtor Master',
  email: 'produtor@live.com.br',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUTOR'],
  permissions: ['*'],
  scope: { isGlobal: false, producers: ['prd_live'], events: ['evt_1001'] },
  sessionId: 'ses_test_3'
};

async function runSessionsCapacityTests() {
  console.log('\n======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.4: DATAS, SESSÕES E CAPACIDADE OPERACIONAL');
  console.log('======================================================\n');

  memoryDb.seedDefaults();

  // Test 1: Listagem e Resumo de Sessões
  console.log('1. Testando listagem e resumo analítico de sessões...');
  const sessions = await EventSessionService.listSessions('evt_1001');
  if (sessions.length < 1) {
    throw new Error(`Esperado pelo menos 1 sessão inicial, obtido ${sessions.length}`);
  }
  const primary = sessions.find(s => s.isPrimary);
  if (!primary || primary.publicCode !== 'SES-2026-001001') {
    throw new Error('Sessão primária inicial não encontrada');
  }

  const summary = await EventSessionService.getSessionSummary('evt_1001');
  if (summary.totalSessions < 1 || summary.totalCapacity < 25000 || summary.totalReservedCapacity < 500) {
    throw new Error(`Resumo de capacidade incorreto: ${JSON.stringify(summary)}`);
  }
  console.log(`✓ Teste 1 passou! Sessão primária identificada. Capacidade: ${summary.totalCapacity}, Reservada: ${summary.totalReservedCapacity}, Disponível: ${summary.availableCapacity}.`);

  // Test 2: Criação de sessão e replicação de setores do evento
  console.log('\n2. Testando criação de sessão e herança de setores operacionais...');
  await EventVenueService.linkVenueToEvent('evt_1001', 'ven_arena_curitiba');

  const session = await EventSessionService.createSession(
    'evt_1001',
    {
      name: 'Sessão Extra - Domingo',
      startAt: '2026-11-20T20:00:00Z',
      doorsOpenAt: '2026-11-20T18:00:00Z',
      endAt: '2026-11-20T23:30:00Z',
      venueId: 'ven_arena_curitiba',
      capacity: 15000,
      isPrimary: false
    },
    mockUser
  );

  if (!session.publicCode.startsWith('SES-') || session.capacity !== 15000) {
    throw new Error('Falha na criação da sessão');
  }
  if (!session.sessionSections || session.sessionSections.length === 0) {
    throw new Error('Setores da sessão não foram gerados a partir do evento');
  }
  console.log(`✓ Teste 2 passou! Sessão '${session.name}' criada com ${session.sessionSections.length} setores operacionais.`);

  // Test 3: Validação da máquina de estados
  console.log('\n3. Testando máquina de estados e validações de transição...');
  const testSession = await EventSessionService.getSessionById('ses_1002_1');
  if (testSession.status !== 'CONFIGURED') {
    throw new Error(`Status inesperado: ${testSession.status}`);
  }

  // CONFIGURED -> SCHEDULED
  const scheduled = await EventSessionService.changeSessionStatus(
    testSession.id,
    'SCHEDULED',
    mockUser,
    'Abertura confirmada'
  );
  if (scheduled.status !== 'SCHEDULED') throw new Error('Falha ao transicionar para SCHEDULED');

  // SCHEDULED -> OPEN
  const opened = await EventSessionService.changeSessionStatus(
    testSession.id,
    'OPEN',
    mockUser,
    'Vendas abertas'
  );
  if (opened.status !== 'OPEN') throw new Error('Falha ao transicionar para OPEN');

  // OPEN -> DRAFT (Proibido)
  let illegalTransitionBlocked = false;
  try {
    await EventSessionService.changeSessionStatus(testSession.id, 'DRAFT', mockUser);
  } catch (err: any) {
    if (err.message.includes('Transição de status inválida')) {
      illegalTransitionBlocked = true;
    }
  }
  if (!illegalTransitionBlocked) {
    throw new Error('Falha: Deveria ter bloqueado transição ilegal OPEN -> DRAFT');
  }
  console.log('✓ Teste 3 passou! Ciclo de vida da sessão validado e transições ilegais bloqueadas.');

  // Test 4: Reservas técnicas de capacidade
  console.log('\n4. Testando reservas técnicas de capacidade...');
  const targetSession = await EventSessionService.getSessionById('ses_1001_1');
  const baseReserved = targetSession.reservedCapacity;

  const reservation = await SessionCapacityService.addReservation(
    targetSession.id,
    {
      type: 'SPONSOR',
      quantity: 200,
      reason: 'Cota de Patrocinador Master'
    },
    mockUser
  );
  if (reservation.quantity !== 200) {
    throw new Error('Falha ao criar reserva técnica');
  }

  const updatedSession = await EventSessionService.getSessionById(targetSession.id);
  if (updatedSession.reservedCapacity !== baseReserved + 200) {
    throw new Error('Capacidade reservada não atualizada na sessão');
  }

  // Tentar estourar capacidade total
  let overReservationBlocked = false;
  try {
    await SessionCapacityService.addReservation(
      targetSession.id,
      { type: 'PRODUCTION', quantity: 999999 },
      mockUser
    );
  } catch (err: any) {
    if (err.message.includes('excederia a capacidade total')) {
      overReservationBlocked = true;
    }
  }
  if (!overReservationBlocked) {
    throw new Error('Falha: Deveria ter bloqueado reserva excedente à capacidade');
  }

  await SessionCapacityService.removeReservation(reservation.id, mockUser);
  const finalSession = await EventSessionService.getSessionById(targetSession.id);
  if (finalSession.reservedCapacity !== baseReserved) {
    throw new Error('Falha ao restaurar capacidade reservada após remoção');
  }
  console.log('✓ Teste 4 passou! Reservas técnicas com impacto na capacidade e limites validadas.');

  // Test 5: Detecção de conflitos de horário
  console.log('\n5. Testando detecção de conflitos de local e agenda...');
  const conflict = await SessionConflictService.detectConflicts(
    'ven_pedreira',
    new Date('2026-10-19T19:00:00-03:00'),
    new Date('2026-10-19T23:00:00-03:00'),
    new Date('2026-10-19T17:00:00-03:00')
  );
  if (!conflict.hasConflicts || conflict.conflicts.length === 0) {
    throw new Error('Falha: Deveria ter detectado sobreposição de horário na Pedreira');
  }

  const noConflict = await SessionConflictService.detectConflicts(
    'ven_pedreira',
    new Date('2026-12-25T18:00:00-03:00'),
    new Date('2026-12-25T22:00:00-03:00')
  );
  if (noConflict.hasConflicts) {
    throw new Error('Falha: Não deveria reportar conflito em data livre');
  }
  console.log('✓ Teste 5 passou! Conflitos temporais e de portões detectados com sucesso.');

  // Test 6: Pré-visualização de recorrência e criação em lote
  console.log('\n6. Testando pré-visualização de recorrência e criação em lote...');
  const preview = await SessionRecurrenceService.previewRecurrence({
    pattern: 'DAILY',
    startDate: '2026-12-01',
    occurrencesCount: 3,
    interval: 1,
    startTime: '20:00',
    doorsOpenTime: '19:00',
    endTime: '22:30',
    venueId: 'ven_teatro_positivo'
  });
  if (preview.totalCount !== 3 || preview.sessions[0].date !== '2026-12-01') {
    throw new Error('Falha no preview de sessões recorrentes');
  }

  const createdSessions = await SessionRecurrenceService.createBulkSessions(
    'evt_1001',
    {
      pattern: 'DAILY',
      startDate: '2026-12-01',
      occurrencesCount: 3,
      interval: 1,
      startTime: '20:00',
      doorsOpenTime: '19:00',
      endTime: '22:30',
      venueId: 'ven_teatro_positivo',
      capacity: 2400
    },
    mockUser
  );
  if (createdSessions.length !== 3 || !createdSessions[0].recurrenceGroupId) {
    throw new Error('Falha na criação de sessões em lote');
  }
  console.log(`✓ Teste 6 passou! 3 sessões criadas em lote vinculadas ao grupo de recorrência.`);

  console.log('\n======================================================');
  console.log('TODOS OS 6 TESTES DA FASE 1.2.4 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runSessionsCapacityTests().catch((err) => {
  console.error('\n❌ Falha nos testes da Fase 1.2.4:', err);
  process.exit(1);
});
