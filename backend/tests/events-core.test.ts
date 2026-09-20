import { EventService } from '../src/modules/events/event.service';
import { EventAccessPolicy } from '../src/modules/events/policies/event-access.policy';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';
import { EventAccessDeniedError, EventNotFoundError } from '../src/modules/events/errors/event.errors';

async function runTests() {
  console.log('=== INICIANDO BATERIA DE TESTES: FASE 1.2.1 — CORE EVENTOS ===\n');

  // MOCK USERS
  const adminUser: AuthenticatedUser = {
    id: 'usr-admin',
    name: 'Administrador Geral',
    email: 'admin@diskingressos.com.br',
    isSuperAdmin: true,
    status: 'ACTIVE',
    roles: ['ADMINISTRADOR_GERAL'],
    permissions: ['eventos.central.visualizar', 'eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar'],
    scope: { isGlobal: true, producers: [], events: [] },
    sessionId: 'sess-1'
  };

  const producerOpusUser: AuthenticatedUser = {
    id: 'usr-opus',
    name: 'Gerente Opus',
    email: 'opus@opusentretenimento.com.br',
    isSuperAdmin: false,
    status: 'ACTIVE',
    roles: ['PRODUTOR'],
    permissions: ['eventos.central.visualizar', 'eventos.evento.visualizar', 'eventos.evento.criar'],
    scope: { isGlobal: false, producers: ['prd_100'], events: [] },
    sessionId: 'sess-2'
  };

  const producerLiveNationUser: AuthenticatedUser = {
    id: 'usr-ln',
    name: 'Gerente Live Nation',
    email: 'ln@livenation.com.br',
    isSuperAdmin: false,
    status: 'ACTIVE',
    roles: ['PRODUTOR'],
    permissions: ['eventos.central.visualizar', 'eventos.evento.visualizar'],
    scope: { isGlobal: false, producers: ['prd_200'], events: [] },
    sessionId: 'sess-3'
  };

  const singleEventUser: AuthenticatedUser = {
    id: 'usr-single',
    name: 'Operador Portaria Inverno',
    email: 'portaria@evento.com.br',
    isSuperAdmin: false,
    status: 'ACTIVE',
    roles: ['SUPORTE_EVENTOS'],
    permissions: ['eventos.central.visualizar', 'eventos.evento.visualizar'],
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001'] },
    sessionId: 'sess-4'
  };

  // TEST 1: Admin lists all events without producer filter
  console.log('Test 1: Admin lista todos os eventos globais...');
  const adminList = await EventService.listEvents(adminUser, {});
  if (adminList.total < 3) {
    throw new Error(`Admin deveria ver todos os eventos. Recebeu total: ${adminList.total}`);
  }
  console.log(`✓ Test 1 passou! Admin encontrou ${adminList.total} eventos.`);

  // TEST 2: Producer Opus only sees their events (prd_100)
  console.log('\nTest 2: Produtor Opus (prd_100) lista apenas seus eventos...');
  const opusList = await EventService.listEvents(producerOpusUser, {});
  const foreignEvents = opusList.items.filter(e => e.producerId !== 'prd_100');
  if (foreignEvents.length > 0) {
    throw new Error('Vazamento de eventos de outro produtor!');
  }
  console.log(`✓ Test 2 passou! Produtor Opus isolado em ${opusList.total} eventos próprios.`);

  // TEST 3: User scoped to single event only sees that event
  console.log('\nTest 3: Usuário com escopo de evento único (evt_1001)...');
  const singleList = await EventService.listEvents(singleEventUser, {});
  if (singleList.total !== 1 || singleList.items[0].id !== 'evt_1001') {
    throw new Error(`Usuário limitado deveria ver apenas evt_1001. Recebeu: ${JSON.stringify(singleList.items.map(e => e.id))}`);
  }
  console.log('✓ Test 3 passou! Usuário restrito apenas ao evento autorizado.');

  // TEST 4: Access control / 403 on foreign event
  console.log('\nTest 4: Bloqueio 403 ao tentar abrir evento de outro produtor...');
  let denied = false;
  try {
    await EventService.getEventById(producerLiveNationUser, 'evt_1001'); // evt_1001 belongs to prd_100
  } catch (err: any) {
    if (err instanceof EventAccessDeniedError || err.statusCode === 403) {
      denied = true;
    }
  }
  if (!denied) {
    throw new Error('Live Nation conseguiu acessar evento da Opus!');
  }
  console.log('✓ Test 4 passou! Tentativa de acesso a evento de terceiro bloqueada com 403.');

  // TEST 5: Summary KPIs respect exact scope
  console.log('\nTest 5: Resumo e KPIs de eventos respeitam escopo...');
  const adminSummary = await EventService.getEventSummary(adminUser);
  const opusSummary = await EventService.getEventSummary(producerOpusUser);

  if (opusSummary.total >= adminSummary.total) {
    throw new Error('Resumo do produtor não pode ter mais ou igual ao total global!');
  }
  if (opusSummary.onSale <= 0) {
    throw new Error('Opus deveria ter eventos em venda no resumo.');
  }
  console.log(`✓ Test 5 passou! Summary Opus: ${opusSummary.total} total, ${opusSummary.onSale} em venda.`);

  // TEST 6: Search & Filtering
  console.log('\nTest 6: Busca textual e filtros por status...');
  const searchResult = await EventService.listEvents(adminUser, { search: 'Coldplay' });
  if (searchResult.total !== 1 || !searchResult.items[0].name.includes('Coldplay')) {
    throw new Error('Busca textual por "Coldplay" falhou!');
  }

  const onSaleFilter = await EventService.listEvents(adminUser, { status: 'ON_SALE' });
  const allOnSale = onSaleFilter.items.every(e => e.status === 'ON_SALE');
  if (!allOnSale || onSaleFilter.total === 0) {
    throw new Error('Filtro por status ON_SALE falhou!');
  }
  console.log(`✓ Test 6 passou! Busca retornou evento correto e filtro ON_SALE retornou ${onSaleFilter.total} eventos.`);

  // TEST 7: Event creation with automatic publicCode
  console.log('\nTest 7: Criação de novo evento em status Rascunho...');
  const newEvent = await EventService.createEvent(producerOpusUser, {
    producerId: 'prd_100',
    name: 'Turnê Acústica MPB Curitiba',
    venue: 'Teatro Guaíra',
    city: 'Curitiba',
    state: 'PR',
    capacity: 2100,
    startAt: new Date('2026-11-20T20:00:00-03:00')
  });

  if (!newEvent.id || !newEvent.publicCode.startsWith('EVT-') || newEvent.status !== 'DRAFT') {
    throw new Error('Criação do evento falhou ou código público não foi gerado!');
  }
  console.log(`✓ Test 7 passou! Evento criado: ${newEvent.name} (${newEvent.publicCode}), status: ${newEvent.status}`);

  // TEST 8: Context selection
  console.log('\nTest 8: Seleção de contexto operacional (selectEventContext)...');
  const selectedContext = await EventService.selectEventContext(producerOpusUser, newEvent.id);
  if (selectedContext.id !== newEvent.id) {
    throw new Error('Seleção de contexto falhou!');
  }
  console.log(`✓ Test 8 passou! Contexto operacional sincronizado para "${selectedContext.name}".`);

  console.log('\n======================================================');
  console.log('TODOS OS 8 TESTES DA FASE 1.2.1 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Falha nos testes de Eventos Core:', err);
  process.exit(1);
});
