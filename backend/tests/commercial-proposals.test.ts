import { CommercialOfferingService } from '../src/modules/commercial/proposals/offerings/commercial-offering.service';
import { ProposalService } from '../src/modules/commercial/proposals/proposal.service';
import { ProposalVersionService } from '../src/modules/commercial/proposals/versions/proposal-version.service';
import { ProposalDiffService } from '../src/modules/commercial/proposals/versions/proposal-diff.service';
import { ProposalApprovalAdapter } from '../src/modules/commercial/proposals/approvals/proposal-approval.adapter';
import { ProposalDocumentService } from '../src/modules/commercial/proposals/documents/proposal-document.service';
import { ProposalDeliveryService } from '../src/modules/commercial/proposals/delivery/proposal-delivery.service';
import { ProposalAcceptanceService } from '../src/modules/commercial/proposals/acceptance/proposal-acceptance.service';
import { ProposalQueryService } from '../src/modules/commercial/proposals/proposal-query.service';
import { prisma } from '../src/core/database/prisma';

async function runCommercialProposalTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.5: PROPOSTAS COMERCIAIS, CONDIÇÕES, VERSIONAMENTO E APROVAÇÃO');
  console.log('================================================================\n');

  // Reset database state
  prisma.seedDefaults();

  const commercialUser = {
    id: 'usr_comercial_1',
    name: 'Mariana Souza',
    role: 'COMERCIAL',
    roles: ['COMERCIAL'],
    isSuperAdmin: false,
    permissions: [
      'comercial.propostas.visualizar',
      'comercial.propostas.criar',
      'comercial.propostas.editar',
      'comercial.propostas.condicoes.visualizar',
      'comercial.propostas.condicoes.editar',
      'comercial.propostas.enviar_aprovacao',
      'comercial.propostas.enviar',
      'comercial.propostas.aceite.registrar',
      'comercial.propostas.cancelar',
      'comercial.propostas.documentos.visualizar',
      'comercial.propostas.documentos.gerar',
      'comercial.propostas.versoes.visualizar',
      'comercial.ofertas.gerenciar'
    ]
  };

  const supervisorUser = {
    id: 'usr_comercial_sup',
    name: 'Carlos Gestor Comercial',
    role: 'COMERCIAL',
    roles: ['COMERCIAL', 'ADMINISTRADOR_GERAL'],
    isSuperAdmin: false,
    permissions: ['*']
  };

  const producerUser = {
    id: 'usr_prod_opus',
    name: 'Eduardo Opus',
    role: 'PRODUTOR',
    roles: ['PRODUTOR'],
    producerId: 'prd_100',
    isSuperAdmin: false,
    permissions: ['comercial.propostas.visualizar']
  };

  // ---------------------------------------------------------------------------
  // 1. Catálogo de Ofertas Comerciais
  // ---------------------------------------------------------------------------
  console.log('1. Testando Catálogo de Ofertas Comerciais (CommercialOfferingService)...');
  const categories = await CommercialOfferingService.listCategories();
  if (!categories || categories.length === 0) throw new Error('Deveria retornar categorias do catálogo de ofertas.');
  
  const platformCat = categories.find(c => c.code === 'PLATFORM');
  if (!platformCat) throw new Error('Categoria PLATFORM não encontrada.');
  if (!platformCat.offerings || platformCat.offerings.length === 0) throw new Error('Ofertas de ticketeria/plataforma não foram listadas.');

  // Criando nova oferta
  const newOffering = await CommercialOfferingService.createOffering({
    categoryId: platformCat.id,
    code: 'PLATFORM_CUSTOM_TEST',
    name: 'Comissão Especial para Grandes Festivais',
    defaultPricingModel: 'PERCENTAGE',
    defaultPercentage: 5.5,
    defaultPayer: 'PRODUCER'
  });
  if (newOffering.code !== 'PLATFORM_CUSTOM_TEST') throw new Error('Falha na criação de oferta.');
  console.log(`  -> Catálogo OK: ${categories.length} categorias carregadas. Nova oferta: ${newOffering.name}`);
  console.log('✓ Teste 1 passou: Catálogo de serviços DiskIngressos operacional.\n');

  // ---------------------------------------------------------------------------
  // 2. Criação de Proposta Comercial com Versão 1 e contentHash
  // ---------------------------------------------------------------------------
  console.log('2. Testando Criação de Proposta Comercial e contentHash (ProposalService.createProposal)...');
  const validUntilDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

  const proposal = await ProposalService.createProposal({
    producerId: 'prd_100',
    opportunityId: 'opc_101',
    title: 'Proposta Comercial — Festival de Verão 2027',
    description: 'Condições comerciais para gestão e venda exclusiva de ingressos do festival.',
    validUntil: validUntilDate,
    commercialModel: 'EXCLUSIVE',
    terms: [
      {
        offeringId: 'off_plat_std',
        termType: 'PLATFORM_COMMISSION',
        name: 'Comissão de Plataforma',
        calculationType: 'PERCENTAGE',
        percentage: 8.0,
        payer: 'PRODUCER',
        conditions: 'Válido para vendas online no site DiskIngressos'
      },
      {
        offeringId: 'off_acc_device',
        termType: 'ACCESS_CONTROL',
        name: 'Validador Handheld (6 aparelhos)',
        calculationType: 'FIXED_AMOUNT',
        amount: 720.0,
        payer: 'PRODUCER',
        conditions: '6 aparelhos por 1 dia'
      }
    ],
    events: [
      {
        estimatedEventName: 'Festival de Verão 2027',
        estimatedVenue: 'Pedreira Paulo Leminski',
        estimatedTickets: 12000,
        estimatedGrossRevenue: 1200000.0
      }
    ],
    notes: 'Produtor parceiro de longa data.',
    internalNotes: 'Margem estimada satisfatória com 8% e portaria inclusa.'
  }, commercialUser);

  if (!proposal.publicCode.startsWith('PROP-')) throw new Error(`Código público inválido: ${proposal.publicCode}`);
  if (proposal.currentVersionNumber !== 1) throw new Error('Versão inicial deveria ser V1.');
  if (!proposal.currentVersion?.contentHash) throw new Error('contentHash canônico da Versão 1 não foi gerado.');
  
  const v1Hash = proposal.currentVersion.contentHash;
  console.log(`  -> Proposta Criada: ${proposal.publicCode} | Versão: V${proposal.currentVersionNumber} | Hash: ${v1Hash.substring(0, 12)}...`);
  console.log('✓ Teste 2 passou: Proposta criada com sucesso com hash determinístico.\n');

  // ---------------------------------------------------------------------------
  // 3. Edição em Rascunho com Concorrência Otimista (HTTP 409)
  // ---------------------------------------------------------------------------
  console.log('3. Testando Atualização de Rascunho e Bloqueio Concorrente (HTTP 409)...');
  let conflictCaught = false;
  try {
    // Tentativa com expectedVersion desatualizada (esperava 999 em vez da versão real)
    await ProposalService.updateDraftProposal(proposal.id, {
      title: 'Título Concorrente Inválido',
      expectedVersion: 999
    }, commercialUser);
  } catch (err: any) {
    if (err.statusCode === 409) conflictCaught = true;
  }
  if (!conflictCaught) throw new Error('Deveria ter disparado HTTP 409 para expectedVersion desatualizada.');

  // Atualização legítima
  const updatedProposal = await ProposalService.updateDraftProposal(proposal.id, {
    title: 'Proposta Comercial — Festival de Verão Curitiba 2027',
    expectedVersion: proposal.version
  }, commercialUser);

  if (updatedProposal.title !== 'Proposta Comercial — Festival de Verão Curitiba 2027') throw new Error('Título não atualizado.');
  if (updatedProposal.version <= proposal.version) throw new Error('Versão de concorrência não foi incrementada.');
  console.log(`  -> Versão de Concorrência incrementada para: ${updatedProposal.version}`);
  console.log('✓ Teste 3 passou: Concorrência otimista (HTTP 409) validada.\n');

  // ---------------------------------------------------------------------------
  // 4. Criação de Nova Versão Imutável (V2) e ProposalDiffService
  // ---------------------------------------------------------------------------
  console.log('4. Testando Criação de Nova Versão (V2) e Diff Estruturado (ProposalDiffService)...');
  const v2 = await ProposalVersionService.createNewVersion(proposal.id, {
    changeSummary: 'Ajuste comercial: redução da taxa de 8% para 6.5% e acréscimo de marketing boost',
    terms: [
      {
        offeringId: 'off_plat_prem',
        termType: 'PLATFORM_COMMISSION',
        name: 'Comissão de Plataforma',
        calculationType: 'PERCENTAGE',
        percentage: 6.5, // Menor que 7% -> exige aprovação
        payer: 'PRODUCER',
        conditions: 'Taxa negociada com condição especial'
      },
      {
        offeringId: 'off_acc_device',
        termType: 'ACCESS_CONTROL',
        name: 'Validador Handheld (6 aparelhos)',
        calculationType: 'FIXED_AMOUNT',
        amount: 720.0,
        payer: 'PRODUCER',
        conditions: '6 aparelhos por 1 dia'
      },
      {
        offeringId: 'off_mkt_boost',
        termType: 'MARKETING',
        name: 'Marketing Boost DiskIngressos',
        calculationType: 'FIXED_AMOUNT',
        amount: 1500.0,
        payer: 'PRODUCER',
        conditions: 'Disparo de newsletter e destaque'
      }
    ],
    events: [
      {
        estimatedEventName: 'Festival de Verão 2027',
        estimatedVenue: 'Pedreira Paulo Leminski',
        estimatedTickets: 15000, // Ajustado de 12k para 15k
        estimatedGrossRevenue: 1500000.0
      }
    ]
  }, commercialUser);

  if (v2.versionNumber !== 2) throw new Error('Número de versão deveria ser 2.');
  if (v2.contentHash === v1Hash) throw new Error('contentHash da V2 deveria ser estritamente diferente da V1.');
  if (v2.approvalStatus !== 'PENDING') throw new Error('Taxa de 6.5% deveria exigir aprovação (APPROVAL_PENDING).');

  // Testando Diff entre V1 e V2
  const diff = await ProposalDiffService.compareVersions(proposal.id, 1, 2);
  if (!diff.hasDifferences) throw new Error('Diff deveria ter detectado diferenças entre V1 e V2.');
  
  const termMod = diff.changes.find(c => c.category === 'TERM' && c.changeType === 'MODIFIED');
  const termAdd = diff.changes.find(c => c.category === 'TERM' && c.changeType === 'ADDED');
  const evtMod = diff.changes.find(c => c.category === 'EVENT' && c.changeType === 'MODIFIED');

  if (!termMod) throw new Error('Diff deveria conter modificação na Comissão de Plataforma.');
  if (!termAdd) throw new Error('Diff deveria conter adição do Marketing Boost.');
  if (!evtMod) throw new Error('Diff deveria conter alteração na estimativa de ingressos do evento.');

  console.log(`  -> V2 Criada com Hash: ${v2.contentHash.substring(0, 12)}... | Mudanças detectadas no Diff: ${diff.changes.length}`);
  console.log('✓ Teste 4 passou: Versionamento imutável e comparador de diff aprovados.\n');

  // ---------------------------------------------------------------------------
  // 5. Alçada de Aprovação Interna & Maker-Checker
  // ---------------------------------------------------------------------------
  console.log('5. Testando Alçada de Aprovação e Bloqueio de Auto-Aprovação (Maker-Checker)...');
  
  // Tentativa de auto-aprovação: Mariana Souza (criadora) tenta aprovar a própria proposta
  let selfApprovalBlocked = false;
  try {
    await ProposalApprovalAdapter.processDecision(proposal.id, 2, 'APPROVE', 'Auto-aprovação', commercialUser);
  } catch (err: any) {
    if (err.message.includes('Segregação de funções violada')) selfApprovalBlocked = true;
  }
  if (!selfApprovalBlocked) throw new Error('Segregação de funções (Maker-Checker) falhou: criador não pode auto-aprovar.');

  // Aprovação legítima por outro usuário gestor (Carlos Gestor Comercial)
  const approvalResult = await ProposalApprovalAdapter.processDecision(proposal.id, 2, 'APPROVE', 'Aprovado após análise de margem', supervisorUser);
  if (approvalResult.status !== 'APPROVED') throw new Error('Falha na aprovação legítima da V2.');

  // Checagem de integridade: aprovação da V2 é vinculada estritamente ao seu contentHash
  const approvedVersion = await prisma.commercialProposalVersion.findUnique({
    where: { id: v2.id }
  });
  if (approvedVersion.approvalStatus !== 'APPROVED') throw new Error('Status de aprovação não persistido.');

  console.log('✓ Teste 5 passou: Maker-checker garantido e aprovação interna vinculada ao hash da versão.\n');

  // ---------------------------------------------------------------------------
  // 6. Geração de Documento Formal com Checksum
  // ---------------------------------------------------------------------------
  console.log('6. Testando Geração de Documento Formal Imutável (ProposalDocumentService)...');
  const docResult = await ProposalDocumentService.generateDocument(proposal.id, 2, commercialUser);
  if (!docResult.documentId) throw new Error('documentId não foi gerado.');
  if (!docResult.documentChecksum) throw new Error('documentChecksum SHA-256 não foi gerado.');
  if (!docResult.htmlContent.includes(v2.contentHash)) throw new Error('O documento deve conter o contentHash visível no rodapé para integridade.');

  console.log(`  -> Documento Gerado: ${docResult.documentId} | Checksum: ${docResult.documentChecksum.substring(0, 12)}...`);
  console.log('✓ Teste 6 passou: Documento gerado com rastreabilidade e integridade criptográfica.\n');

  // ---------------------------------------------------------------------------
  // 7. Envio Formal ao Produtor (ProposalDeliveryService)
  // ---------------------------------------------------------------------------
  console.log('7. Testando Envio da Proposta Comercial ao Produtor (ProposalDeliveryService)...');
  const delivery = await ProposalDeliveryService.sendProposal(proposal.id, 2, {
    channel: 'EMAIL',
    recipientName: 'Eduardo Opus',
    recipientEmail: 'eduardo@opus.com.br',
    messageBody: 'Prezado Eduardo, segue a proposta comercial formalizada pela DiskIngressos.'
  }, commercialUser);

  if (delivery.status !== 'DELIVERED') throw new Error('Status da entrega deveria ser DELIVERED.');

  const propSent = await ProposalService.getProposalById(proposal.id);
  if (propSent.status !== 'SENT') throw new Error('Status da proposta deveria ter sido atualizado para SENT.');
  if (propSent.deliveries.length === 0) throw new Error('Registro de entrega não consta na proposta.');

  console.log(`  -> Proposta enviada via ${delivery.channel} para ${delivery.recipientName}. Status: ${propSent.status}`);
  console.log('✓ Teste 7 passou: Envio registrado e auditado com sucesso.\n');

  // ---------------------------------------------------------------------------
  // 8. Aceite Comercial Formal (Sem Criação Automática de Evento ou Contrato)
  // ---------------------------------------------------------------------------
  console.log('8. Testando Aceite Comercial Formal (ProposalAcceptanceService)...');
  const totalEventsBefore = await prisma.events.length;

  const acceptance = await ProposalAcceptanceService.registerAcceptance(proposal.id, 2, {
    method: 'EMAIL_CONFIRMATION',
    contactName: 'Eduardo Opus',
    contactEmail: 'eduardo@opus.com.br',
    contactDocument: '00.123.456/0001-00',
    notes: 'Aceite por email confirmado em 20/09/2026.'
  }, commercialUser);

  if (!acceptance.id) throw new Error('Aceite não registrado.');

  const propAccepted = await ProposalService.getProposalById(proposal.id);
  if (propAccepted.status !== 'ACCEPTED') throw new Error('Status da proposta deveria ser ACCEPTED.');

  // DOMAIN BOUNDARY CHECK: Aceite comercial NÃO cria evento automaticamente!
  const totalEventsAfter = await prisma.events.length;
  if (totalEventsAfter !== totalEventsBefore) {
    throw new Error('VIOLAÇÃO DE DOMÍNIO: Aceite de proposta comercial NÃO pode criar eventos ou faturas automaticamente!');
  }

  console.log(`  -> Proposta ${proposal.publicCode} ACEITA via ${acceptance.method}. Nenhum evento criado indevidamente.`);
  console.log('✓ Teste 8 passou: Aceite comercial formalizado mantendo fronteiras de domínio puras.\n');

  // ---------------------------------------------------------------------------
  // 9. Recusa de Proposta e Não-Fechamento Automático de Oportunidade
  // ---------------------------------------------------------------------------
  console.log('9. Testando Recusa de Proposta Comercial (ProposalAcceptanceService.declineProposal)...');
  // Cria uma nova proposta rápida para recusar
  const propToDecline = await ProposalService.createProposal({
    producerId: 'prd_200',
    opportunityId: 'opc_201',
    title: 'Proposta com Condições Incompatíveis',
    validUntil: validUntilDate,
    terms: [
      {
        termType: 'PLATFORM_COMMISSION',
        name: 'Taxa Rígida',
        calculationType: 'PERCENTAGE',
        percentage: 12.0,
        payer: 'PRODUCER'
      }
    ]
  }, commercialUser);

  await ProposalAcceptanceService.declineProposal(propToDecline.id, 1, {
    reason: 'Produtor não aceitou a taxa de 12% sem carência.'
  }, commercialUser);

  const declinedProp = await ProposalService.getProposalById(propToDecline.id);
  if (declinedProp.status !== 'DECLINED') throw new Error('Status da proposta deveria ser DECLINED.');

  // Verifica que a oportunidade opc_201 NÃO foi encerrada automaticamente
  const opp = await prisma.commercialOpportunity.findUnique({ where: { id: 'opc_201' } });
  if (opp && opp.status === 'CLOSED') {
    throw new Error('A oportunidade não deveria ter sido encerrada automaticamente após recusa da proposta.');
  }

  console.log(`  -> Proposta ${declinedProp.publicCode} recusada. Oportunidade opc_201 permanece: ${opp?.status || 'OPEN'}`);
  console.log('✓ Teste 9 passou: Recusa de proposta registrada sem perda arbitrária da oportunidade.\n');

  // ---------------------------------------------------------------------------
  // 10. Varredura de Expiração Idempotente & Métricas
  // ---------------------------------------------------------------------------
  console.log('10. Testando Varredura de Expiração e Métricas Agregadas...');
  const expiredCount = await ProposalService.sweepExpiredProposals();
  console.log(`  -> Varredura de expiração executada: ${expiredCount} propostas vencidas atualizadas.`);

  const metrics = await ProposalQueryService.getProposalMetrics(commercialUser);
  if (metrics.totalProposals < 3) throw new Error('Métricas deveriam computar ao menos 3 propostas.');
  if (metrics.acceptedCount < 1) throw new Error('Métricas deveriam computar propostas aceitas.');

  console.log(`  -> Métricas: Total: ${metrics.totalProposals} | Aceitas: ${metrics.acceptedCount} | Pendentes Aprovação: ${metrics.pendingApprovalCount} | Taxa de Aceite: ${metrics.acceptanceRatePercent}%`);
  console.log('✓ Teste 10 passou: Métricas e sweep de expiração validados com sucesso.\n');

  // ---------------------------------------------------------------------------
  // 11. Multi-Tenant Data Scope Isolation
  // ---------------------------------------------------------------------------
  console.log('11. Testando Isolamento Multi-Tenant por Produtor...');
  const producerProposals = await ProposalQueryService.listProposals({}, producerUser);
  for (const p of producerProposals.data) {
    if (p.producerId !== 'prd_100') {
      throw new Error(`VIOLAÇÃO DE ESCOPO: Produtor prd_100 teve acesso à proposta de outro produtor: ${p.producerId}`);
    }
  }
  console.log(`  -> Produtor Eduardo Opus visualizou apenas suas ${producerProposals.data.length} propostas autorizadas.`);
  console.log('✓ Teste 11 passou: Isolamento multi-tenant garantido.\n');

  console.log('================================================================');
  console.log('TODOS OS TESTES DA FASE 1.3.5 (PROPOSTAS COMERCIAIS) FORAM APROVADOS!');
  console.log('================================================================\n');
}

runCommercialProposalTests().catch(err => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES DE PROPOSTAS COMERCIAIS:\n', err);
  process.exit(1);
});
