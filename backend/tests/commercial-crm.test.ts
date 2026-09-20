import { CommercialAccountService } from '../src/modules/commercial/producers/commercial-account.service';
import { PortfolioService } from '../src/modules/commercial/portfolio/portfolio.service';
import { CommercialProducerQueryService } from '../src/modules/commercial/producers/commercial-producer-query.service';
import { CommercialLeadService } from '../src/modules/commercial/leads/commercial-lead.service';
import { LeadConversionService } from '../src/modules/commercial/leads/lead-conversion.service';
import { CommercialActivityService } from '../src/modules/commercial/activities/commercial-activity.service';
import { CommercialPipelineService } from '../src/modules/commercial/pipeline/commercial-pipeline.service';
import { OpportunityService } from '../src/modules/commercial/opportunities/opportunity.service';
import { OpportunityTransitionService } from '../src/modules/commercial/opportunities/transition/opportunity-transition.service';
import { OpportunityClosingService } from '../src/modules/commercial/opportunities/closing/opportunity-closing.service';
import { OpportunityMetricsService } from '../src/modules/commercial/opportunities/metrics/opportunity-metrics.service';
import { OpportunityQueryService } from '../src/modules/commercial/opportunities/opportunity-query.service';
import { prisma } from '../src/core/database/prisma';

async function runCommercialCrmTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.3 & 1.3.4: CENTRAL DE PRODUTORES, CRM B2B & PIPELINE');
  console.log('================================================================\n');

  // Reset/seed database to ensure clean state
  prisma.seedDefaults();

  // Test Users
  const adminUser = {
    id: 'usr_admin',
    name: 'Administrador Geral',
    isSuperAdmin: true,
    scope: { isGlobal: true, producers: [], events: [] },
    permissions: ['*']
  };

  const commercialUser = {
    id: 'usr_comercial_1',
    name: 'Mariana Souza',
    isSuperAdmin: false,
    scope: { isGlobal: true, producers: [], events: [] },
    permissions: [
      'comercial.produtores.visualizar',
      'comercial.produtores.criar',
      'comercial.produtores.editar',
      'comercial.produtores.detalhes',
      'comercial.carteira.visualizar',
      'comercial.carteira.atribuir',
      'comercial.prospeccoes.visualizar',
      'comercial.prospeccoes.criar',
      'comercial.prospeccoes.editar',
      'comercial.prospeccoes.converter',
      'comercial.oportunidades.visualizar',
      'comercial.oportunidades.criar',
      'comercial.oportunidades.editar',
      'comercial.oportunidades.mover',
      'comercial.oportunidades.ganhar',
      'comercial.oportunidades.encerrar',
      'comercial.pipeline.visualizar',
      'comercial.atividades.visualizar',
      'comercial.atividades.registrar'
    ]
  };

  const producerUser = {
    id: 'usr_prod_100',
    name: 'Operador Opus',
    isSuperAdmin: false,
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001'] },
    permissions: ['comercial.produtores.detalhes']
  };

  // ---------------------------------------------------------------------------
  // 1. CommercialAccountService & Contacts Tests
  // ---------------------------------------------------------------------------
  console.log('1. Testando CommercialAccountService (Extensão B2B sobre Produtor)...');
  const account = await CommercialAccountService.getCommercialAccount('prd_100');
  if (!account) throw new Error('Conta comercial de prd_100 deveria existir.');
  if (account.producerId !== 'prd_100') throw new Error('producerId divergente.');
  if (account.commercialClassification !== 'KEY_ACCOUNT') throw new Error('Classificação esperada KEY_ACCOUNT.');

  // Update account
  const updatedAccount = await CommercialAccountService.updateCommercialAccount(
    'prd_100',
    {
      notesSummary: 'Produtor parceiro de longa data com grandes turnês.',
      expectedVersion: account.version
    },
    commercialUser
  );
  if (!updatedAccount.notesSummary?.includes('longa data')) {
    throw new Error('Atualização de notas falhou.');
  }

  // Version conflict test
  let versionConflictCaught = false;
  try {
    await CommercialAccountService.updateCommercialAccount(
      'prd_100',
      { notesSummary: 'Tentativa concorrente', expectedVersion: 999 },
      commercialUser
    );
  } catch (err: any) {
    versionConflictCaught = true;
    if (!err.message.includes('409')) throw new Error(`Mensagem inesperada: ${err.message}`);
  }
  if (!versionConflictCaught) throw new Error('Deveria ter lançado erro 409 para versão divergente.');

  // Contacts management
  const contactsBefore = await CommercialAccountService.listContacts('prd_100');
  const initialContactsCount = contactsBefore.length;

  const newContact = await CommercialAccountService.addContact(
    'prd_100',
    {
      name: 'Juliana Paes',
      roleTitle: 'Coordenadora de Produção Local',
      email: 'juliana.paes@opus.com.br',
      phone: '(41) 98765-4321',
      isPrimary: false,
      canNegotiate: true
    },
    commercialUser
  );
  if (newContact.name !== 'Juliana Paes') throw new Error('Falha ao adicionar contato.');

  const contactsAfter = await CommercialAccountService.listContacts('prd_100');
  if (contactsAfter.length !== initialContactsCount + 1) {
    throw new Error('Contagem de contatos incorreta após adição.');
  }

  console.log('✓ Teste 1 passou: CommercialAccount e Contatos B2B validados com sucesso.\n');

  // ---------------------------------------------------------------------------
  // 2. PortfolioService (Atribuição e Resumo da Carteira)
  // ---------------------------------------------------------------------------
  console.log('2. Testando PortfolioService (Carteira Comercial e Resumo Sem Métricas Falsas)...');
  const portfolioSummary = await PortfolioService.getMyPortfolioSummary('usr_comercial_1', 'Mariana Souza');
  if (portfolioSummary.ownerId !== 'usr_comercial_1') throw new Error('ownerId inválido.');
  if (portfolioSummary.producersCount < 2) throw new Error('Mariana Souza deveria ter ao menos 2 produtores.');
  if (portfolioSummary.activeEventsCount < 1) throw new Error('Deveria haver ao menos 1 evento ativo na carteira.');
  if (portfolioSummary.openOpportunitiesCount < 1) throw new Error('Deveria haver oportunidades abertas na carteira.');

  console.log(`  -> Produtores: ${portfolioSummary.producersCount} | Eventos Ativos: ${portfolioSummary.activeEventsCount} | Oportunidades: ${portfolioSummary.openOpportunitiesCount} | Ações Pendentes: ${portfolioSummary.pendingActionsCount}`);
  console.log('✓ Teste 2 passou: Carteira Comercial consolidada com métricas reais.\n');

  // ---------------------------------------------------------------------------
  // 3. CommercialProducerQueryService (Central de Produtores & Visão Integrada)
  // ---------------------------------------------------------------------------
  console.log('3. Testando CommercialProducerQueryService (Central de Produtores & Visão Comercial)...');
  const producersListing = await CommercialProducerQueryService.listProducers(
    { search: 'Opus' },
    commercialUser
  );
  if (producersListing.total !== 1) throw new Error('Busca por "Opus" deveria retornar exatamente 1 produtor.');
  if (producersListing.data[0].id !== 'prd_100') throw new Error('Produtor incorreto retornado.');

  // Visão Comercial do Produtor (sem termo 360)
  const producerSummary = await CommercialProducerQueryService.getProducerCommercialSummary('prd_100', commercialUser);
  if (producerSummary.producer.id !== 'prd_100') throw new Error('ID divergente no resumo do produtor.');
  if (!producerSummary.commercialAccount) throw new Error('Conta comercial não vinculada.');
  if (producerSummary.contacts.length < 1) throw new Error('Contatos não carregados no resumo.');
  if (producerSummary.eventsCount < 1) throw new Error('Eventos não computados no resumo.');
  if (producerSummary.openOpportunitiesCount < 1) throw new Error('Oportunidades não computadas no resumo.');

  console.log('✓ Teste 3 passou: Central de Produtores e Visão Comercial integradas sem redundância.\n');

  // ---------------------------------------------------------------------------
  // 4. CommercialLeadService & LeadConversionService
  // ---------------------------------------------------------------------------
  console.log('4. Testando Prospecções (Leads) e Conversão Idempotente...');
  // Tentar criar lead com CNPJ duplicado de produtor existente (Opus CNPJ: 12.345.678/0001-90)
  let duplicateCnpjError = false;
  try {
    await CommercialLeadService.createLead(
      {
        companyName: 'Opus Fake Nova',
        cnpj: '12.345.678/0001-90'
      },
      commercialUser
    );
  } catch (err: any) {
    duplicateCnpjError = true;
    if (!err.message.includes('já pertence ao Produtor')) throw new Error(`Mensagem inesperada: ${err.message}`);
  }
  if (!duplicateCnpjError) throw new Error('Deveria ter impedido criação de lead com CNPJ duplicado de produtor existente.');

  // Criar lead válido
  const validLead = await CommercialLeadService.createLead(
    {
      companyName: 'Festival Brasil Sul Ltda',
      tradeName: 'Festival Brasil Sul',
      cnpj: '77.888.999/0001-22',
      contactName: 'Marcos Vinicius',
      contactEmail: 'marcos@festivalsul.com.br',
      contactPhone: '(41) 97766-5544',
      origin: 'OUTBOUND',
      ownerId: 'usr_comercial_1',
      ownerName: 'Mariana Souza',
      notes: 'Festival com potencial de 20.000 ingressos.'
    },
    commercialUser
  );
  if (validLead.status !== 'NEW') throw new Error('Lead recém-criado deve iniciar com status NEW.');

  // Criar oportunidade vinculada ao lead antes da conversão
  const defaultPipeline = await CommercialPipelineService.getDefaultPipeline();
  const initialStage = defaultPipeline.stages[0];
  const leadOpp = await OpportunityService.createOpportunity(
    {
      leadId: validLead.id,
      pipelineId: defaultPipeline.id,
      stageId: initialStage.id,
      title: 'Festival Brasil Sul 2027 — Prospecção',
      estimatedValue: 180000.00
    },
    commercialUser
  );
  if (leadOpp.leadId !== validLead.id) throw new Error('Oportunidade não vinculada ao lead.');

  // Conversão do lead em produtor
  const conversionResult = await LeadConversionService.convertLeadToProducer(validLead.id, commercialUser);
  if (!conversionResult.producerId) throw new Error('Conversão deveria gerar um producerId.');

  // Idempotência da conversão: Chamar novamente não cria outro produtor
  const conversionResult2 = await LeadConversionService.convertLeadToProducer(validLead.id, commercialUser);
  if (conversionResult2.producerId !== conversionResult.producerId) {
    throw new Error('A conversão do lead DEVE ser idempotente!');
  }

  // Verifica se a oportunidade do lead foi migrada para o novo produtor
  const migratedOpp = await prisma.commercialOpportunity.findUnique({ where: { id: leadOpp.id } });
  if (migratedOpp.producerId !== conversionResult.producerId) {
    throw new Error('A oportunidade vinculada ao lead deveria ter sido migrada para o novo produtor.');
  }

  console.log('✓ Teste 4 passou: Ciclo de Lead, prevenção de CNPJ duplicado e conversão idempotente validados.\n');

  // ---------------------------------------------------------------------------
  // 5. CommercialActivityService & Task Engine Integration
  // ---------------------------------------------------------------------------
  console.log('5. Testando CommercialActivityService & Integração com Task Engine...');
  const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const activity = await CommercialActivityService.registerActivity(
    {
      producerId: 'prd_100',
      type: 'MEETING',
      subject: 'Reunião de Fechamento de Lotes 2027',
      description: 'Acordada exclusividade para abertura de vendas na plataforma.',
      occurredAt: new Date().toISOString(),
      nextActionAt: futureDate,
      nextActionDescription: 'Elaborar aditivo e enviar minuta para o jurídico',
      createNextActionTask: true
    },
    commercialUser
  );

  if (!activity.id) throw new Error('Atividade comercial deveria ter id.');
  if (!activity.taskId) throw new Error('Atividade com próxima ação deveria ter gerado Tarefa no Task Engine.');

  // Verifica se a tarefa foi criada no Task Engine com módulo COMERCIAL
  const task = await prisma.task.findUnique({ where: { id: activity.taskId } });
  if (!task) throw new Error('Tarefa correspondente não encontrada no banco.');
  if (task.module !== 'COMERCIAL') throw new Error('Tarefa deve possuir module COMERCIAL.');
  if (task.producerId !== 'prd_100') throw new Error('Tarefa deve estar vinculada ao producerId.');

  // Verifica se o CommercialAccount foi atualizado com a próxima ação
  const updatedAccAfterAct = await CommercialAccountService.getCommercialAccount('prd_100');
  if (!updatedAccAfterAct?.nextActionDescription?.includes('minuta')) {
    throw new Error('Próxima ação não sincronizada com a conta comercial.');
  }

  console.log('✓ Teste 5 passou: Atividades comerciais registradas e integradas com Task Engine.\n');

  // ---------------------------------------------------------------------------
  // 6. OpportunityService, Stage Transitions, Concurrency & Closing
  // ---------------------------------------------------------------------------
  console.log('6. Testando Ciclo de Oportunidades, Transição com Lock Otimista, Ganho e Perda...');
  const newOpp = await OpportunityService.createOpportunity(
    {
      producerId: 'prd_100',
      pipelineId: defaultPipeline.id,
      stageId: defaultPipeline.stages[0].id,
      title: 'Mega Show Acústico 2027',
      estimatedValue: 350000.00
    },
    commercialUser
  );

  if (!newOpp.publicCode.startsWith('OPC-')) {
    throw new Error(`Código público ${newOpp.publicCode} não segue o padrão OPC-YYYY-XXXXXX.`);
  }
  if (newOpp.status !== 'OPEN') throw new Error('Status inicial deve ser OPEN.');

  // Transição de estágio normal (Identificação -> Qualificação)
  const nextStage = defaultPipeline.stages[1];
  const transitionedOpp = await OpportunityTransitionService.transitionStage(
    {
      opportunityId: newOpp.id,
      targetStageId: nextStage.id,
      expectedVersion: newOpp.version,
      reason: 'Reunião preliminar realizada com interesse mútuo.'
    },
    commercialUser
  );
  if (transitionedOpp.stageId !== nextStage.id) throw new Error('Estágio não atualizado.');
  if (transitionedOpp.version !== newOpp.version + 1) throw new Error('Versão deveria ter sido incrementada.');

  // Teste de concorrência (409 Conflict)
  let oppConflictCaught = false;
  try {
    await OpportunityTransitionService.transitionStage(
      {
        opportunityId: newOpp.id,
        targetStageId: defaultPipeline.stages[2].id,
        expectedVersion: newOpp.version, // Versão defasada!
        reason: 'Tentativa concorrente'
      },
      commercialUser
    );
  } catch (err: any) {
    oppConflictCaught = true;
    if (!err.message.includes('409')) throw new Error(`Mensagem inesperada: ${err.message}`);
  }
  if (!oppConflictCaught) throw new Error('Deveria ter disparado 409 para versão concorrente na oportunidade.');

  // Teste de Fechamento com Perda (exige motivo de encerramento)
  let closeWithoutReasonError = false;
  try {
    await OpportunityClosingService.closeOpportunity(
      {
        opportunityId: transitionedOpp.id,
        closeReasonId: '',
        closeNotes: ''
      },
      commercialUser
    );
  } catch (err: any) {
    closeWithoutReasonError = true;
  }
  if (!closeWithoutReasonError) throw new Error('Encerramento deve exigir motivo e notas.');

  // Encerramento com motivo válido
  const closeReasons = await CommercialPipelineService.listCloseReasons();
  const closedOpp = await OpportunityClosingService.closeOpportunity(
    {
      opportunityId: transitionedOpp.id,
      closeReasonId: closeReasons[0].id,
      closeNotes: 'Produtor decidiu pausar a turnê devido a agenda dos artistas.',
      expectedVersion: transitionedOpp.version
    },
    commercialUser
  );
  if (closedOpp.status !== 'CLOSED') throw new Error('Status deveria ser CLOSED.');
  if (!closedOpp.closeReasonName) throw new Error('closeReasonName deve estar preenchido.');

  // Teste de Vitória (WON) em outra oportunidade
  const winOpp = await OpportunityService.createOpportunity(
    {
      producerId: 'prd_200',
      pipelineId: defaultPipeline.id,
      stageId: defaultPipeline.stages[3].id,
      title: 'Turnê Estádios 2027',
      estimatedValue: 800000.00
    },
    commercialUser
  );

  const wonOpp = await OpportunityClosingService.winOpportunity(
    {
      opportunityId: winOpp.id,
      notes: 'Contrato assinado pelas duas diretorias.',
      expectedVersion: winOpp.version
    },
    commercialUser
  );
  if (wonOpp.status !== 'WON') throw new Error('Status da oportunidade deve ser WON.');
  if (!wonOpp.wonAt) throw new Error('wonAt deve ser registrado.');

  console.log('✓ Teste 6 passou: Ciclo de vida, concorrência otimista (409), perda com catálogo e ganho validados.\n');

  // ---------------------------------------------------------------------------
  // 7. OpportunityMetricsService (Métricas Matemáticas Transparentes)
  // ---------------------------------------------------------------------------
  console.log('7. Testando OpportunityMetricsService (Métricas Sem Scores Arbitrários)...');
  const metrics = await OpportunityMetricsService.getOpportunityMetrics(defaultPipeline.id, commercialUser);
  if (metrics.totalOpen < 1) throw new Error('totalOpen deveria ser >= 1.');
  if (metrics.wonInPeriod < 1) throw new Error('wonInPeriod deveria registrar a oportunidade ganha.');
  if (metrics.closedInPeriod < 1) throw new Error('closedInPeriod deveria registrar a oportunidade encerrada.');

  console.log(`  -> Abertas: ${metrics.totalOpen} | Em Negociação: ${metrics.inNegotiation} | Sem Próxima Ação: ${metrics.withoutNextAction} | Ações Vencidas: ${metrics.overdueActions} | Ganhas: ${metrics.wonInPeriod} | Encerradas: ${metrics.closedInPeriod}`);
  console.log('✓ Teste 7 passou: Métricas de negociação comprovadas e transparentes.\n');

  // ---------------------------------------------------------------------------
  // 8. Multi-Tenant Data Scope Isolation
  // ---------------------------------------------------------------------------
  console.log('8. Testando Isolamento Multi-Tenant de Escopo entre Produtores...');
  let scopeViolationCaught = false;
  try {
    // Produtor Opus (prd_100) tentando consultar resumo do Live Nation (prd_200)
    await CommercialProducerQueryService.getProducerCommercialSummary('prd_200', producerUser);
  } catch (err: any) {
    scopeViolationCaught = true;
  }
  if (!scopeViolationCaught) throw new Error('Isolamento de escopo deveria ter bloqueado acesso cruzado.');

  // Produtor Opus consultando seu próprio produtor (permitido)
  const allowedSummary = await CommercialProducerQueryService.getProducerCommercialSummary('prd_100', producerUser);
  if (allowedSummary.producer.id !== 'prd_100') throw new Error('Produtor não conseguiu acessar seu próprio resumo.');

  console.log('✓ Teste 8 passou: Isolamento multi-tenant de dados estritamente assegurado.\n');

  console.log('================================================================');
  console.log('TODOS OS TESTES DE CRM COMERCIAL (FASES 1.3.3 E 1.3.4) FORAM APROVADOS!');
  console.log('================================================================\n');
}

runCommercialCrmTests().catch(err => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES DE CRM COMERCIAL:\n', err);
  process.exit(1);
});
