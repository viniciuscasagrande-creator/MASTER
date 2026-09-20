import { VenueService } from '../src/modules/events/venues/venue.service';
import { VenueSectionService } from '../src/modules/events/venue-sections/venue-section.service';
import { VenueMapService } from '../src/modules/events/venue-maps/venue-map.service';
import { EventVenueService } from '../src/modules/events/event-venue/event-venue.service';
import { memoryDb } from '../src/core/database/prisma';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

const mockSuperAdmin: AuthenticatedUser = {
  id: 'usr_admin_test',
  name: 'Admin Master',
  email: 'admin@diskingressos.com.br',
  isSuperAdmin: true,
  status: 'ACTIVE',
  roles: ['ADMINISTRADOR_GERAL'],
  permissions: ['*'],
  scope: { isGlobal: true, producers: [], events: [] },
  sessionId: 'ses_test_1'
};

async function runVenuesMapsTests() {
  console.log('\n======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.3: LOCAIS, MAPAS E ESTRUTURA FÍSICA');
  console.log('======================================================\n');

  memoryDb.seedDefaults();

  // Test 1: Listagem e KPIs de Locais
  console.log('1. Testando listagem e KPIs de resumo...');
  const listRes = await VenueService.listVenues({}, mockSuperAdmin);
  if (listRes.venues.length < 4) {
    throw new Error(`Esperado pelo menos 4 locais, obtido ${listRes.venues.length}`);
  }
  const arena = listRes.venues.find(v => v.id === 'ven_arena_curitiba');
  if (!arena || arena.city !== 'Curitiba') {
    throw new Error('Arena Disk Curitiba não encontrada corretamente');
  }

  const summary = await VenueService.getVenueSummary(mockSuperAdmin);
  if (summary.total < 4 || summary.active < 4 || summary.withMaps < 1 || !summary.totalPhysicalCapacity) {
    throw new Error(`KPIs de resumo incorretos: ${JSON.stringify(summary)}`);
  }
  console.log(`✓ Teste 1 passou! ${listRes.venues.length} locais encontrados, capacidade total física: ${summary.totalPhysicalCapacity}.`);

  // Test 2: Criação de novo local com código público
  console.log('\n2. Testando criação de novo local...');
  const venue = await VenueService.createVenue(
    {
      name: 'Teatro Guaíra',
      type: 'THEATER',
      city: 'Curitiba',
      state: 'PR',
      capacity: 2167,
      street: 'Rua XV de Novembro',
      number: '971'
    },
    mockSuperAdmin
  );
  if (!venue.publicCode.startsWith('VEN-')) {
    throw new Error(`Código público inválido: ${venue.publicCode}`);
  }
  console.log(`✓ Teste 2 passou! Local '${venue.name}' criado com código '${venue.publicCode}'.`);

  // Test 3: Setores físicos do local
  console.log('\n3. Testando criação e edição de setores físicos...');
  const initialSections = await VenueSectionService.listSections('ven_arena_curitiba', mockSuperAdmin);
  if (initialSections.length < 5) {
    throw new Error(`Esperado setores na arena, obtido ${initialSections.length}`);
  }

  const newSection = await VenueSectionService.createSection(
    'ven_arena_curitiba',
    {
      name: 'Mezanino Lateral',
      code: 'MEZ_LAT',
      type: 'SEATED',
      capacity: 350
    },
    mockSuperAdmin
  );
  if (newSection.code !== 'MEZ_LAT') {
    throw new Error(`Código do setor incorreto: ${newSection.code}`);
  }

  const updatedSec = await VenueSectionService.updateSection(newSection.id, { capacity: 420 }, mockSuperAdmin);
  if (updatedSec.capacity !== 420) {
    throw new Error(`Falha ao atualizar capacidade do setor`);
  }

  await VenueSectionService.deleteSection(newSection.id, mockSuperAdmin);
  const afterDelete = await VenueSectionService.listSections('ven_arena_curitiba', mockSuperAdmin);
  if (afterDelete.find(s => s.id === newSection.id)) {
    throw new Error('Falha ao remover setor físico');
  }
  console.log('✓ Teste 3 passou! Setor físico criado, atualizado para 420 lugares e removido com sucesso.');

  // Test 4: Mapas, versões, layout e atualização em lote de assentos
  console.log('\n4. Testando mapas, versões, layout e assentos...');
  const { map, version } = await VenueMapService.createMap(
    'ven_arena_curitiba',
    { name: 'Mapa Festival de Verão' },
    mockSuperAdmin
  );
  if (!map.id || version.versionNumber !== 1 || version.status !== 'DRAFT') {
    throw new Error('Falha na criação de mapa e versão inicial');
  }

  const savedVersion = await VenueMapService.saveMapLayout(
    version.id,
    {
      elements: [
        { type: 'STAGE', coordinates: '{"x": 100, "y": 50, "width": 200, "height": 80}', label: 'Palco Principal' }
      ],
      rows: [
        { id: 'row_a', sectionId: 'vsec_pista_premium', code: 'A', name: 'Fileira A' }
      ],
      seats: [
        { id: 'seat_a1', rowId: 'row_a', sectionId: 'vsec_pista_premium', code: 'A1', label: '1', accessible: false, companionSeat: false, restrictedView: false, active: true },
        { id: 'seat_a2', rowId: 'row_a', sectionId: 'vsec_pista_premium', code: 'A2', label: '2', accessible: true, companionSeat: false, restrictedView: false, active: true }
      ],
      totalCapacity: 2
    },
    mockSuperAdmin
  );
  if (savedVersion.totalCapacity !== 2) {
    throw new Error('Falha ao salvar layout e calcular capacidade de assentos');
  }

  const bulkRes = await VenueMapService.bulkUpdateSeats(
    version.id,
    ['seat_a1'],
    { seatType: 'VIP' },
    mockSuperAdmin
  );
  if (bulkRes.updatedCount !== 1) {
    throw new Error('Falha na atualização em lote de assentos');
  }

  const published = await VenueMapService.publishMapVersion(version.id, mockSuperAdmin);
  if (published.status !== 'ACTIVE') {
    throw new Error('Falha ao publicar versão do mapa');
  }

  const duplicated = await VenueMapService.duplicateMapVersion(version.id, mockSuperAdmin);
  if (duplicated.versionNumber !== 2 || duplicated.status !== 'DRAFT') {
    throw new Error('Falha ao duplicar versão do mapa');
  }
  console.log(`✓ Teste 4 passou! Mapa, layout, assentos VIP, publicação (V1) e duplicação (V2) testados.`);

  // Test 5: Vínculo do Local com o Evento e Isolamento de Capacidade Operacional
  console.log('\n5. Testando vínculo de Local com Evento e EventSections...');
  const eventVenue = await EventVenueService.linkVenueToEvent(
    'evt_1001',
    'ven_arena_curitiba',
    'vmap_frontal',
    'vmapv_frontal_3',
    mockSuperAdmin
  );
  if (!eventVenue || !eventVenue.configurationSnapshot) {
    throw new Error('Falha ao vincular local ao evento com snapshot');
  }

  const eventSections = await EventVenueService.listEventSections('evt_1001');
  const premium = eventSections.find(s => s.name === 'Pista Premium');
  if (!premium) {
    throw new Error('Setor Pista Premium não gerado no evento');
  }

  // Capacidade operacional válida (<= física)
  const updatedEvtSec = await EventVenueService.updateEventSection(
    premium.id,
    { capacity: 3800, technicalReservation: 150 },
    mockSuperAdmin
  );
  if (updatedEvtSec.capacity !== 3800 || updatedEvtSec.technicalReservation !== 150) {
    throw new Error('Falha ao configurar setor operacional do evento');
  }

  // Rejeição de capacidade operacional > física
  let overcapacityBlocked = false;
  try {
    await EventVenueService.updateEventSection(premium.id, { capacity: 999999 }, mockSuperAdmin);
  } catch (err: any) {
    if (err.message.includes('não pode exceder')) {
      overcapacityBlocked = true;
    }
  }
  if (!overcapacityBlocked) {
    throw new Error('Falha: Deveria ter bloqueado capacidade superior à física do local');
  }
  console.log('✓ Teste 5 passou! Local vinculado com snapshot e restrição de capacidade operacional validada.');

  console.log('\n======================================================');
  console.log('TODOS OS 5 TESTES DA FASE 1.2.3 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runVenuesMapsTests().catch((err) => {
  console.error('\n❌ Falha nos testes da Fase 1.2.3:', err);
  process.exit(1);
});
