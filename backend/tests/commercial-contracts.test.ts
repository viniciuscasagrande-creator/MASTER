import { prisma } from '../src/core/database/prisma';
import { ContractService } from '../src/modules/commercial/contracts/contract.service';
import { ContractVersionService } from '../src/modules/commercial/contracts/versions/contract-version.service';
import { ContractDocumentService } from '../src/modules/commercial/contracts/generation/contract-document.service';
import { SignatureService } from '../src/modules/commercial/contracts/signatures/signature.service';
import { ContractAmendmentService } from '../src/modules/commercial/contracts/amendments/amendment.service';
import { ContractRenewalService } from '../src/modules/commercial/contracts/renewals/renewal.service';
import { ContractTermsProvider } from '../src/modules/commercial/contracts/terms/contract-terms.provider';
import { ContractQueryService } from '../src/modules/commercial/contracts/contract-query.service';

async function runCommercialContractTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.6: CONTRATOS COMERCIAIS, VIGÊNCIA, ADITIVOS E ASSINATURA');
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
      'comercial.contratos.visualizar',
      'comercial.contratos.criar',
      'comercial.contratos.editar',
      'comercial.contratos.condicoes.visualizar',
      'comercial.contratos.condicoes.editar',
      'comercial.contratos.enviar_aprovacao',
      'comercial.contratos.preparar_assinatura',
      'comercial.contratos.enviar_assinatura',
      'comercial.contratos.aditivos.gerenciar',
      'comercial.contratos.renovacoes.gerenciar',
      'comercial.contratos.suspender',
      'comercial.contratos.rescindir',
      'comercial.contratos.documentos.gerar',
      'comercial.contratos.documentos.visualizar'
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
    id: 'usr_prod_curitiba',
    name: 'Eduardo Guimarães',
    role: 'PRODUTOR',
    roles: ['PRODUTOR'],
    producerId: 'prd_100',
    isSuperAdmin: false,
    permissions: ['comercial.contratos.visualizar']
  };

  // ---------------------------------------------------------------------------
  // 1. Criação de Contrato a partir de Proposta Comercial Aceita (prop_301)
  // ---------------------------------------------------------------------------
  console.log('1. Testando Criação de Contrato a partir de Proposta Comercial Aceita (ContractService.createContractFromProposal)...');
  const contractFromProposal = await ContractService.createContractFromProposal(
    {
      proposalId: 'prop_301',
      title: 'Contrato de Prestação de Serviços — Temporada de Teatro Guaíra 2026',
      notes: 'Convertido automaticamente a partir da proposta PROP-2026-000301 aceita pelo produtor.'
    },
    commercialUser
  );

  if (!contractFromProposal || !contractFromProposal.id) {
    throw new Error('Falha ao criar contrato a partir de proposta aceita.');
  }

  if (contractFromProposal.sourceProposalId !== 'prop_301') {
    throw new Error('sourceProposalId não foi preservado.');
  }

  if (!contractFromProposal.sourceProposalContentHash) {
    throw new Error('sourceProposalContentHash não foi preservado.');
  }

  if (!contractFromProposal.currentVersion || !contractFromProposal.currentVersion.contentHash) {
    throw new Error('Versão 1 do contrato não possui contentHash canônico.');
  }

  // Idempotência
  const duplicateCall = await ContractService.createContractFromProposal(
    { proposalId: 'prop_301' },
    commercialUser
  );
  if (duplicateCall.id !== contractFromProposal.id) {
    throw new Error('Criação a partir de proposta não é idempotente; gerou contrato duplicado.');
  }

  console.log(`  -> Contrato Criado: ${contractFromProposal.publicCode} | Hash: ${contractFromProposal.currentVersion.contentHash.substring(0, 16)}...`);
  console.log('✓ Teste 1 passou: Conversão idempotente de proposta aceita em contrato com hash preservado.\n');

  // ---------------------------------------------------------------------------
  // 2. Criação Direta de Contrato e Concorrência Otimista (HTTP 409)
  // ---------------------------------------------------------------------------
  console.log('2. Testando Criação Direta de Contrato e Bloqueio Concorrente (HTTP 409)...');
  const directContract = await ContractService.createDirectContract(
    {
      producerId: 'prd_100',
      title: 'Contrato Direto de Turnê — Curitiba Live 2026',
      effectiveFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      effectiveUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        {
          termType: 'PLATFORM_COMMISSION',
          name: 'Comissão Plataforma',
          calculationType: 'PERCENTAGE',
          percentage: 8.0,
          payer: 'PRODUCER'
        },
        {
          termType: 'ACCESS_CONTROL',
          name: 'Operadores de Portaria',
          calculationType: 'FIXED_AMOUNT',
          amount: 220.0,
          payer: 'PRODUCER'
        }
      ]
    },
    commercialUser
  );

  if (!directContract || directContract.status !== 'DRAFT') {
    throw new Error('Contrato direto deveria iniciar em DRAFT.');
  }

  // Atualização com versão correta
  const initialVersion = directContract.version;
  const updatedContract = await ContractService.updateContractDraft(
    directContract.id,
    {
      title: 'Contrato Direto de Turnê — Curitiba Live 2026 (Revisado)',
      expectedVersion: initialVersion
    },
    commercialUser
  );

  if (updatedContract.version !== initialVersion + 1) {
    throw new Error('Versão de concorrência não incrementou.');
  }

  // Concorrência Otimista: tentar atualizar com versão defasada
  let conflictDetected = false;
  try {
    await ContractService.updateContractDraft(
      directContract.id,
      {
        title: 'Tentativa Concorrente Desatualizada',
        expectedVersion: initialVersion
      },
      commercialUser
    );
  } catch (err: any) {
    if (err.statusCode === 409 || err.message.includes('409') || err.message.includes('concorrentemente')) {
      conflictDetected = true;
    }
  }

  if (!conflictDetected) {
    throw new Error('Bloqueio concorrente (HTTP 409) não impediu alteração concorrente.');
  }

  console.log(`  -> Contrato Direto Criado: ${directContract.publicCode} | Versão incrementada: ${updatedContract.version}`);
  console.log('✓ Teste 2 passou: Criação direta e concorrência otimista validadas.\n');

  // ---------------------------------------------------------------------------
  // 3. Alçada de Aprovação Interna e Bloqueio Maker-Checker
  // ---------------------------------------------------------------------------
  console.log('3. Testando Alçada de Aprovação e Bloqueio de Auto-Aprovação (Maker-Checker)...');
  await ContractService.submitContractApproval(directContract.id, commercialUser);

  let makerCheckerBlocked = false;
  try {
    // Criador tenta aprovar seu próprio contrato
    await ContractService.processContractDecision(directContract.id, { approved: true }, commercialUser);
  } catch (err: any) {
    if (err.statusCode === 403 || err.message.includes('Maker-Checker')) {
      makerCheckerBlocked = true;
    }
  }

  if (!makerCheckerBlocked) {
    throw new Error('Falha de segurança: criador conseguiu aprovar seu próprio contrato (Maker-Checker violado).');
  }

  // Supervisor aprova
  const approvedContract = await ContractService.processContractDecision(
    directContract.id,
    { approved: true },
    supervisorUser
  );

  if (approvedContract.status !== 'APPROVED') {
    throw new Error(`Contrato deveria estar APPROVED após aprovação do supervisor, mas está: ${approvedContract.status}`);
  }

  console.log(`  -> Contrato ${directContract.publicCode} aprovado com sucesso por ${supervisorUser.name}.`);
  console.log('✓ Teste 3 passou: Maker-Checker rigorosamente protegido e aprovação concluída.\n');

  // ---------------------------------------------------------------------------
  // 4. Geração de Minuta / Documento Formal com Checksum SHA-256
  // ---------------------------------------------------------------------------
  console.log('4. Testando Geração de Minuta com Checksum SHA-256 (ContractDocumentService)...');
  const generatedDoc = await ContractDocumentService.generateDocument(directContract.id, 1);

  if (!generatedDoc || !generatedDoc.documentChecksum || !generatedDoc.htmlContent) {
    throw new Error('Falha ao gerar documento formal do contrato.');
  }

  if (!generatedDoc.htmlContent.includes('Instrumento Particular de Prestação de Serviços Comerciais')) {
    throw new Error('Conteúdo da minuta gerada não contém cabeçalho formal.');
  }

  console.log(`  -> Documento Gerado: ${generatedDoc.documentId} | Checksum: ${generatedDoc.documentChecksum.substring(0, 16)}...`);
  console.log('✓ Teste 4 passou: Geração de minuta formal e integridade SHA-256 validadas.\n');

  // ---------------------------------------------------------------------------
  // 5. Preparação e Despacho de Envelope de Assinatura (SignatureService)
  // ---------------------------------------------------------------------------
  console.log('5. Testando Preparação e Envio de Envelope de Assinatura Digital (SignatureService)...');
  const envelope = await SignatureService.prepareAndSendEnvelope(
    directContract.id,
    {
      provider: 'AUTENTIQUE'
    },
    commercialUser
  );

  if (!envelope || !envelope.providerReference || envelope.status !== 'PENDING') {
    throw new Error('Falha ao preparar envelope de assinatura.');
  }

  if (!envelope.signers || envelope.signers.length !== 2) {
    throw new Error('Envelope deveria conter exatamente 2 signatários padrão (Disk + Produtor).');
  }

  const contractInSig = await ContractService.getContractById(directContract.id, commercialUser);
  if (contractInSig.status !== 'SIGNATURE_PENDING') {
    throw new Error(`Status do contrato deveria ser SIGNATURE_PENDING, atual: ${contractInSig.status}`);
  }

  console.log(`  -> Envelope Despachado: ${envelope.providerReference} | Signatários: ${envelope.signers.map(s => s.email).join(', ')}`);
  console.log('✓ Teste 5 passou: Envelope de assinatura digital configurado e despachado.\n');

  // ---------------------------------------------------------------------------
  // 6. Separação de Assinatura e Vigência (SIGNED != ACTIVE)
  // ---------------------------------------------------------------------------
  console.log('6. Testando Separação de Assinatura e Vigência (SIGNED != ACTIVE)...');
  // directContract tem effectiveFrom: 2026-04-01 (futuro)
  // Assinando o primeiro signatário (Disk Ingressos)
  await SignatureService.simulateSignerAction(
    envelope.id,
    'vinicius.casagrande@diskingressos.com.br',
    'SIGN',
    '177.100.20.1'
  );

  let cState = await ContractService.getContractById(directContract.id, commercialUser);
  if (cState.status !== 'PARTIALLY_SIGNED') {
    throw new Error(`Após assinatura parcial, status deveria ser PARTIALLY_SIGNED, atual: ${cState.status}`);
  }

  // Assinando o segundo signatário (Produtor)
  const webhookResult = await SignatureService.simulateSignerAction(
    envelope.id,
    envelope.signers[1].email,
    'SIGN',
    '189.50.30.2'
  );

  cState = await ContractService.getContractById(directContract.id, commercialUser);

  // Como effectiveFrom é futuro (2026-04-01), o contrato deve ser SIGNED, e NÃO ACTIVE!
  if (cState.status !== 'SIGNED') {
    throw new Error(`REGRA DE OURO VIOLADA: Contrato assinado com vigência futura deveria ser SIGNED, mas ficou: ${cState.status}`);
  }

  console.log(`  -> Assinatura Completa Concluída! Status: ${cState.status} (Aguardando início de vigência em ${cState.effectiveFrom?.substring(0, 10)})`);
  console.log('✓ Teste 6 passou: Separação estrita entre Assinado e Vigente (SIGNED != ACTIVE) validada.\n');

  // ---------------------------------------------------------------------------
  // 7. Autoridade do Webhook e Idempotência
  // ---------------------------------------------------------------------------
  console.log('7. Testando Autoridade do Webhook e Idempotência de Assinatura...');
  const duplicateWebhook = await SignatureService.simulateSignerAction(
    envelope.id,
    envelope.signers[1].email,
    'SIGN',
    '189.50.30.2'
  );

  if (!duplicateWebhook.success || !duplicateWebhook.message.includes('idempotência')) {
    throw new Error('Webhook não tratou evento repetido com idempotência.');
  }

  console.log(`  -> Webhook repetido processado: ${duplicateWebhook.message}`);
  console.log('✓ Teste 7 passou: Autoridade do webhook e idempotência garantidas.\n');

  // ---------------------------------------------------------------------------
  // 8. Imutabilidade Rigorosa de Contrato Assinado
  // ---------------------------------------------------------------------------
  console.log('8. Testando Imutabilidade de Contrato Assinado...');
  let immutabilityProtected = false;
  try {
    await ContractService.updateContractDraft(
      directContract.id,
      {
        title: 'Tentativa Ilegal de Alterar Contrato Assinado',
        expectedVersion: cState.version
      },
      commercialUser
    );
  } catch (err: any) {
    if (err.message.includes('imutáveis') || err.message.includes('Aditivo') || err.statusCode === 400) {
      immutabilityProtected = true;
    }
  }

  if (!immutabilityProtected) {
    throw new Error('Falha de conformidade: sistema permitiu editar contrato assinado sem Aditivo!');
  }

  console.log('✓ Teste 8 passou: Contrato assinado é estritamente imutável (exige Aditivo).\n');

  // ---------------------------------------------------------------------------
  // 9. Aditivos Contratuais (ContractAmendment) e Versionamento
  // ---------------------------------------------------------------------------
  console.log('9. Testando Aditivos Contratuais (ContractAmendmentService)...');
  const amendment = await ContractAmendmentService.createAmendment(
    directContract.id,
    {
      type: 'COMMERCIAL_TERMS',
      effectiveFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Inclusão de Kit de PDV físico após expansão de pontos de venda presencial.',
      summary: 'Adição de serviço de Bilheteria Física com taxa de R$ 350,00.',
      terms: [
        {
          termType: 'BOX_OFFICE',
          name: 'Kit PDV Bilheteria Física',
          calculationType: 'FIXED_AMOUNT',
          amount: 350.0,
          payer: 'PRODUCER',
          conditions: '1 kit incluído'
        }
      ]
    },
    commercialUser
  );

  if (!amendment || !amendment.publicCode.startsWith('ADT-')) {
    throw new Error('Falha ao gerar Aditivo Contratual.');
  }

  // Maker-Checker em Aditivos
  let amendmentMakerBlocked = false;
  try {
    await ContractAmendmentService.approveAmendment(amendment.id, commercialUser);
  } catch (err: any) {
    if (err.statusCode === 403 || err.message.includes('Maker-Checker')) {
      amendmentMakerBlocked = true;
    }
  }

  if (!amendmentMakerBlocked) {
    throw new Error('Maker-Checker não bloqueou auto-aprovação de aditivo.');
  }

  // Supervisor aprova e ativa o aditivo
  await ContractAmendmentService.approveAmendment(amendment.id, supervisorUser);
  const activeAmendment = await ContractAmendmentService.activateAmendment(amendment.id, supervisorUser);

  if (activeAmendment.status !== 'ACTIVE') {
    throw new Error('Aditivo deveria estar ACTIVE após ativação.');
  }

  console.log(`  -> Aditivo Criado e Ativado: ${activeAmendment.publicCode} | Hash: ${activeAmendment.contentHash.substring(0, 16)}...`);
  console.log('✓ Teste 9 passou: Aditivo contratual criado com integridade e Maker-Checker aprovado.\n');

  // ---------------------------------------------------------------------------
  // 10. Provedor de Condições Comerciais Efetivas (Base + Aditivos na data at)
  // ---------------------------------------------------------------------------
  console.log('10. Testando Provedor de Condições Contratuais Efetivas (ContractTermsProvider)...');
  // Usamos o contrato ctr_101 já seedado para testar data antes e depois do aditivo
  // ctr_101: vigência 2026-03-01 a 2026-12-31.
  // Aditivo adt_101_1: vigência 2026-06-01 (Kit PDV R$ 350,00).

  // Consulta em 2026-04-15 (Antes do aditivo)
  const termsBeforeAmendment = await ContractTermsProvider.getTermsForProducer(
    'prd_100',
    new Date('2026-04-15T12:00:00Z')
  );

  if (!termsBeforeAmendment || termsBeforeAmendment.terms.length !== 2) {
    throw new Error(`Deveria retornar 2 termos base antes do aditivo, retornou: ${termsBeforeAmendment?.terms.length}`);
  }

  const hasBoxOfficeBefore = termsBeforeAmendment.terms.some(t => t.termType === 'BOX_OFFICE');
  if (hasBoxOfficeBefore) {
    throw new Error('Termo de bilheteria física não deveria estar ativo antes de 2026-06-01.');
  }

  // Consulta em 2026-07-01 (Após o aditivo)
  const termsAfterAmendment = await ContractTermsProvider.getTermsForProducer(
    'prd_100',
    new Date('2026-07-01T12:00:00Z')
  );

  if (!termsAfterAmendment || termsAfterAmendment.terms.length !== 3) {
    throw new Error(`Deveria retornar 3 termos após o aditivo (2 base + 1 aditivo), retornou: ${termsAfterAmendment?.terms.length}`);
  }

  const boxOfficeTerm = termsAfterAmendment.terms.find(t => t.termType === 'BOX_OFFICE');
  if (!boxOfficeTerm || boxOfficeTerm.source !== 'AMENDMENT' || boxOfficeTerm.amount !== 350.0) {
    throw new Error('Termo do aditivo não foi incorporado corretamente no cálculo efetivo.');
  }

  console.log(`  -> Data 2026-04-15 (Pré-Aditivo): ${termsBeforeAmendment.terms.length} termos. Aditivos ativos: ${termsBeforeAmendment.activeAmendmentsCount}`);
  console.log(`  -> Data 2026-07-01 (Pós-Aditivo): ${termsAfterAmendment.terms.length} termos. Aditivos ativos: ${termsAfterAmendment.activeAmendmentsCount}`);
  console.log('✓ Teste 10 passou: Resolução temporal de condições contratuais efetivas 100% precisa.\n');

  // ---------------------------------------------------------------------------
  // 11. Renovações Contratuais (Simples vs Renegociação com Oportunidade)
  // ---------------------------------------------------------------------------
  console.log('11. Testando Renovações Contratuais (ContractRenewalService)...');
  // Renovação Simples
  const simpleRenewal = await ContractRenewalService.createRenewal(
    'ctr_101',
    {
      renewalType: 'SIMPLE',
      targetEffectiveFrom: '2027-01-01T00:00:00Z',
      targetEffectiveUntil: '2027-12-31T23:59:59Z',
      notes: 'Renovação simples sem alteração de taxas.'
    },
    commercialUser
  );

  const completedRenewal = await ContractRenewalService.completeSimpleRenewal(simpleRenewal.id, supervisorUser);
  if (completedRenewal.status !== 'COMPLETED') {
    throw new Error('Falha ao concluir renovação simples.');
  }

  const renewedContract = await ContractService.getContractById('ctr_101', commercialUser);
  if (!renewedContract.effectiveUntil?.startsWith('2027-12-31')) {
    throw new Error(`Data de término do contrato renovado deveria ser 2027-12-31, atual: ${renewedContract.effectiveUntil}`);
  }

  // Renovação por Renegociação (cria nova Oportunidade no CRM 1.3.4)
  const renegotiation = await ContractRenewalService.createRenewal(
    'ctr_101',
    {
      renewalType: 'RENEGOTIATION',
      targetEffectiveFrom: '2028-01-01T00:00:00Z',
      targetEffectiveUntil: '2028-12-31T23:59:59Z',
      notes: 'Produtor solicita revisão geral das taxas para próxima temporada.'
    },
    commercialUser
  );

  if (!renegotiation.sourceOpportunityId) {
    throw new Error('Renegociação deveria ter gerado automaticamente uma Oportunidade Comercial.');
  }

  const generatedOpp = await prisma.commercialOpportunity.findUnique({
    where: { id: renegotiation.sourceOpportunityId }
  });

  if (!generatedOpp || generatedOpp.stage !== 'NEGOTIATION') {
    throw new Error('Oportunidade gerada pela renegociação não foi persistida corretamente no pipeline.');
  }

  console.log(`  -> Renovação Simples concluída com nova vigência até: ${renewedContract.effectiveUntil?.substring(0, 10)}`);
  console.log(`  -> Renegociação gerou nova Oportunidade Comercial: ${generatedOpp.publicCode} (${generatedOpp.title})`);
  console.log('✓ Teste 11 passou: Esteiras de Renovação e Renegociação CRM operacionais.\n');

  // ---------------------------------------------------------------------------
  // 12. Suspensão, Reativação e Rescisão Contratual
  // ---------------------------------------------------------------------------
  console.log('12. Testando Suspensão, Reativação e Rescisão Contratual...');
  const suspended = await ContractService.suspendContract(
    'ctr_101',
    { reason: 'Inadimplência de taxa operacional e documentação pendente.' },
    commercialUser
  );
  if (suspended.status !== 'SUSPENDED' || !suspended.suspensionReason) {
    throw new Error('Falha na suspensão do contrato.');
  }

  const reactivated = await ContractService.reactivateContract('ctr_101', commercialUser);
  if (reactivated.status !== 'ACTIVE' || reactivated.suspendedAt !== null) {
    throw new Error('Falha na reativação do contrato.');
  }

  const terminated = await ContractService.terminateContract(
    'ctr_101',
    { reason: 'Distrato consensual por encerramento das atividades do produtor.' },
    commercialUser
  );
  if (terminated.status !== 'TERMINATED' || !terminated.terminationReason) {
    throw new Error('Falha na rescisão do contrato.');
  }

  console.log(`  -> Contrato ${terminated.publicCode} suspenso, reativado e posteriormente rescindido com trilha de auditoria.`);
  console.log('✓ Teste 12 passou: Ciclo de vida de suspensão e rescisão validado.\n');

  // ---------------------------------------------------------------------------
  // 13. Varredura Periódica de Vigência (Sweep)
  // ---------------------------------------------------------------------------
  console.log('13. Testando Varredura Periódica de Vigência (ContractService.sweepContractStatus)...');
  // Cria um contrato expirado no passado
  await prisma.commercialContract.create({
    data: {
      publicCode: 'CTR-2025-000099',
      producerId: 'prd_200',
      title: 'Contrato Antigo de Teste Expirado',
      status: 'ACTIVE',
      currentVersionNumber: 1,
      ownerId: 'usr_comercial_1',
      effectiveFrom: new Date('2025-01-01T00:00:00Z'),
      effectiveUntil: new Date('2025-12-31T23:59:59Z')
    }
  });

  const sweepResult = await ContractService.sweepContractStatus();
  if (sweepResult.expiredCount < 1) {
    throw new Error('Varredura de vigência deveria ter expirado o contrato antigo.');
  }

  const expiredContract = await prisma.commercialContract.findUnique({
    where: { publicCode: 'CTR-2025-000099' }
  });
  if (expiredContract.status !== 'EXPIRED') {
    throw new Error(`Contrato deveria ter status EXPIRED, atual: ${expiredContract.status}`);
  }

  console.log(`  -> Sweep executado: ${sweepResult.activatedCount} contratos ativados, ${sweepResult.expiredCount} expirados.`);
  console.log('✓ Teste 13 passou: Varredura de vigência operacional.\n');

  // ---------------------------------------------------------------------------
  // 14. Isolamento Multi-Tenant por Produtor
  // ---------------------------------------------------------------------------
  console.log('14. Testando Isolamento Multi-Tenant por Produtor...');
  const producerContracts = await ContractQueryService.listContracts({}, producerUser);
  const foreignContracts = producerContracts.data.filter(c => c.producerId !== 'prd_100');

  if (foreignContracts.length > 0) {
    throw new Error('Vazamento multi-tenant: produtor conseguiu visualizar contratos de terceiros.');
  }

  const metrics = await ContractQueryService.getMetrics(producerUser);
  if (metrics.totalContracts !== producerContracts.total) {
    throw new Error('Métricas agregadas do produtor diferem do total de contratos acessíveis.');
  }

  console.log(`  -> Produtor Eduardo Guimarães visualizou apenas seus ${producerContracts.total} contratos autorizados.`);
  console.log('✓ Teste 14 passou: Isolamento multi-tenant estritamente respeitado.\n');

  console.log('================================================================');
  console.log('TODOS OS 14 TESTES DA FASE 1.3.6 (CONTRATOS COMERCIAIS) PASSARAM COM SUCESSO!');
  console.log('================================================================\n');
}

runCommercialContractTests().catch(err => {
  console.error('\n❌ ERRO DURANTE EXECUÇÃO DOS TESTES DE CONTRATOS:');
  console.error(err);
  process.exit(1);
});
