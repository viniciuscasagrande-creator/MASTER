import { prisma } from '../src/core/database/prisma';
import { EventDraftService } from '../src/modules/events/creation/event-draft.service';
import { EventWizardService } from '../src/modules/events/wizard/event-wizard.service';
import { EventCategoryService } from '../src/modules/events/categories/event-category.service';
import { EventWizardValidationService } from '../src/modules/events/wizard/event-wizard-validation.service';
import { EventConcurrencyError, EventInvalidStatusError } from '../src/modules/events/errors/event.errors';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

// Mock test users
const adminUser: AuthenticatedUser = {
  id: 'usr_admin_test',
  name: 'Admin Teste',
  email: 'admin@diskingressos.com.br',
  isSuperAdmin: true,
  status: 'ACTIVE',
  roles: ['ADMINISTRADOR_GERAL'],
  permissions: ['*'],
  scope: { isGlobal: true, producers: [], events: [] },
  sessionId: 'sess_1'
};

const opusUser: AuthenticatedUser = {
  id: 'usr_opus_test',
  name: 'Opus Operações',
  email: 'operacoes@opus.com.br',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUCER_ADMIN'],
  permissions: ['eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar', 'eventos.evento.rascunho.descartar'],
  scope: { isGlobal: false, producers: ['prd_100'], events: [] },
  sessionId: 'sess_2'
};

const intruderUser: AuthenticatedUser = {
  id: 'usr_intruder_test',
  name: 'Intruder',
  email: 'hacker@other.com',
  isSuperAdmin: false,
  status: 'ACTIVE',
  roles: ['PRODUCER_ADMIN'],
  permissions: ['eventos.evento.criar'],
  scope: { isGlobal: false, producers: ['prd_999'], events: [] },
  sessionId: 'sess_3'
};

async function runWizardTests() {
  console.log('\n=== INICIANDO BATERIA DE TESTES: FASE 1.2.2 — CADASTRO E WIZARD INTELIGENTE ===\n');

  // Test 1: Criação Antecipada de Rascunho com Código Público e Wizard State
  console.log('Test 1: Criação antecipada de rascunho com código imutável e estado do wizard...');
  const draftResult = await EventDraftService.createDraft(opusUser, {
    name: 'Festival de Inverno 2026',
    producerId: 'prd_100'
  });

  const createdEvent = draftResult.event;
  const wizardState = draftResult.wizardState;

  if (createdEvent.status !== 'DRAFT') {
    throw new Error(`Esperado status DRAFT, recebido ${createdEvent.status}`);
  }
  if (!createdEvent.publicCode.startsWith('EVT-2026-')) {
    throw new Error(`Código público inválido: ${createdEvent.publicCode}`);
  }
  if (wizardState.currentStep !== 1) {
    throw new Error(`Estado do wizard inicial deve ser etapa 1, recebido: ${wizardState.currentStep}`);
  }
  console.log(`✓ Test 1 passou! Rascunho criado com código ${createdEvent.publicCode}, versão 1.`);

  // Test 2: Bloqueio de criação para produtor não autorizado (Multi-tenant)
  console.log('\nTest 2: Bloqueio multi-tenant ao tentar criar rascunho para produtor não autorizado...');
  let multiTenantBlocked = false;
  try {
    await EventDraftService.createDraft(intruderUser, {
      name: 'Tentativa Invasiva',
      producerId: 'prd_100' // Intruder não tem acesso a prd_100
    });
  } catch (err: any) {
    multiTenantBlocked = true;
  }
  if (!multiTenantBlocked) {
    throw new Error('Falha de segurança: usuário conseguiu criar rascunho em produtor alheio!');
  }
  console.log('✓ Test 2 passou! Tentativa de violação de tenant bloqueada.');

  // Test 3: Autosave com versionamento otimista
  console.log('\nTest 3: Autosave de dados parciais com incremento de versão otimista...');
  const patchResult = await EventDraftService.patchDraft(opusUser, createdEvent.id, {
    version: 1,
    name: 'Festival de Inverno Curitiba 2026',
    format: 'IN_PERSON',
    ageRating: '16',
    venue: 'Teatro Positivo',
    city: 'Curitiba',
    state: 'PR',
    address: 'Rua Prof. Pedro Viriato Parigot de Souza, 5300',
    estimatedCapacity: 2400
  });

  if (patchResult.version !== 2) {
    throw new Error(`Esperado versão 2 após patch, recebido: ${patchResult.version}`);
  }
  if (patchResult.event.name !== 'Festival de Inverno Curitiba 2026') {
    throw new Error('Nome do evento não foi atualizado corretamente no autosave');
  }
  console.log(`✓ Test 3 passou! Autosave aplicado com sucesso. Nova versão: ${patchResult.version}`);

  // Test 4: Conflito de Concorrência Otimista (409 Conflict)
  console.log('\nTest 4: Detecção de conflito de concorrência com versão desatualizada...');
  let concurrencyDetected = false;
  try {
    // Enviando version: 1 quando o banco já está na versão 2
    await EventDraftService.patchDraft(opusUser, createdEvent.id, {
      version: 1,
      name: 'Nome Conflitante por Outra Aba'
    });
  } catch (err: any) {
    if (err instanceof EventConcurrencyError) {
      concurrencyDetected = true;
    }
  }
  if (!concurrencyDetected) {
    throw new Error('Falha de concorrência: patch com versão defasada não foi rejeitado!');
  }
  console.log('✓ Test 4 passou! Conflito 409 detectado com sucesso ao tentar sobrescrever versão defasada.');

  // Test 5: Verificação de Disponibilidade de Slug
  console.log('\nTest 5: Verificação de slug e geração de sugestão para duplicidades...');
  // Verificando slug do evento existente 'coldplay-experience-world-tour'
  const unavailableSlugCheck = await EventDraftService.checkSlugAvailability('coldplay-experience-world-tour');
  if (unavailableSlugCheck.available) {
    throw new Error('Slug existente deveria ser reportado como indisponível');
  }
  if (!unavailableSlugCheck.suggestedSlug) {
    throw new Error('Deveria ter gerado sugestão de slug alternativo');
  }

  const availableSlugCheck = await EventDraftService.checkSlugAvailability('evento-inedito-2026');
  if (!availableSlugCheck.available) {
    throw new Error('Slug inédito deveria ser reportado como disponível');
  }
  console.log(`✓ Test 5 passou! Slug duplicado rejeitado e sugestão gerada: "${unavailableSlugCheck.suggestedSlug}".`);

  // Test 6: Hierarquia de Categorias
  console.log('\nTest 6: Carregamento da hierarquia de categorias e subcategorias...');
  const categories = await EventCategoryService.getCategoriesHierarchy();
  if (categories.length === 0) {
    throw new Error('Nenhuma categoria raiz encontrada');
  }
  const musicaCategory = categories.find((c) => c.slug === 'musica');
  if (!musicaCategory || !musicaCategory.subcategories || musicaCategory.subcategories.length === 0) {
    throw new Error('Categoria Música deveria possuir subcategorias cadastradas');
  }
  console.log(`✓ Test 6 passou! ${categories.length} categorias raízes carregadas. Música possui ${musicaCategory.subcategories.length} subcategorias.`);

  // Test 7: Navegação de etapas do Wizard e Validação de Prontidão
  console.log('\nTest 7: Navegação de etapas e validação de bloqueios vs avisos...');
  await EventWizardService.updateStepState(createdEvent.id, {
    currentStep: 2,
    completedSteps: [1],
    stepStatuses: { STEP_INFORMATION: 'VALID' }
  }, opusUser.id);

  const wizardData = await EventWizardService.getWizardData(createdEvent.id);
  if (wizardData.wizardState.currentStep !== 2) {
    throw new Error(`Etapa atual deveria ser 2, recebido: ${wizardData.wizardState.currentStep}`);
  }

  // Validação: evento ainda não tem datas cadastradas, então deve ter issue bloqueante na etapa de datas
  const validation = wizardData.validation;
  const datesStepValidation = validation.steps.find((s) => s.stepId === 'STEP_DATES');
  if (!datesStepValidation || datesStepValidation.status !== 'ERROR') {
    throw new Error(`Etapa de Datas deveria ter status ERROR, recebido: ${datesStepValidation?.status}`);
  }
  if (validation.valid) {
    throw new Error('Evento com pendências bloqueantes não pode estar válido para publicação');
  }
  console.log(`✓ Test 7 passou! Validação detectou ${validation.blockingIssues} bloqueios e ${validation.warnings} avisos. Publicação bloqueada.`);

  // Test 8: Descarte Seguro de Rascunho (Soft Delete)
  console.log('\nTest 8: Descarte de rascunho com marcação soft-delete e bloqueio de não-rascunho...');
  const discardResult = await EventDraftService.discardDraft(opusUser, createdEvent.id);
  if (!discardResult.success) {
    throw new Error('Erro ao descartar rascunho');
  }

  const discardedEvent = await prisma.event.findUnique({ where: { id: createdEvent.id } });
  if (discardedEvent && !discardedEvent.deletedAt) {
    throw new Error('Evento descartado deveria ter deletedAt preenchido');
  }

  // Tentativa de descartar evento publicado/ativo deve falhar
  let nonDraftBlocked = false;
  try {
    await EventDraftService.discardDraft(opusUser, 'evt_1001'); // evt_1001 é ON_SALE
  } catch (err: any) {
    if (err instanceof EventInvalidStatusError) {
      nonDraftBlocked = true;
    }
  }
  if (!nonDraftBlocked) {
    throw new Error('Falha: evento ON_SALE não pode ser descartado via discardDraft');
  }
  console.log('✓ Test 8 passou! Rascunho descartado com segurança e proteção de eventos em venda ativa.');

  console.log('\n======================================================');
  console.log('TODOS OS 8 TESTES DA FASE 1.2.2 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runWizardTests().catch((err) => {
  console.error('\n❌ Falha nos testes da Fase 1.2.2:', err);
  process.exit(1);
});
