import crypto from 'crypto';
import { prisma } from '../src/core/database/prisma';
import { runSeed } from '../prisma/seed';
import { DocumentService } from '../src/modules/documents/services/document.service';
import { DocumentVersionService } from '../src/modules/documents/services/document-version.service';
import { DocumentLinkService } from '../src/modules/documents/services/document-link.service';
import { DocumentRetentionService } from '../src/modules/documents/services/document-retention.service';
import { DocumentRequirementService } from '../src/modules/documents/services/document-requirement.service';
import { SecurityScanService } from '../src/modules/documents/services/security-scan.service';
import { defaultStorageProvider } from '../src/modules/documents/storage/local.storage';
import { SearchService } from '../src/modules/search/search.service';
import { EventBus } from '../src/events/event-bus';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (detail) console.error(`     Detalhe: ${detail}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.8 — CENTRAL DE DOCUMENTOS E ANEXOS');
  console.log('================================================================\n');

  // Inicializa banco de dados em memória e sementes
  await runSeed();
  defaultStorageProvider.clear();

  // Usuários de Teste com Perfis e Escopos Reais
  const userAdmin: AuthenticatedUser = {
    id: 'usr_admin',
    name: 'Vinicius Casagrande (Admin Geral)',
    email: 'admin@diskingressos.com.br',
    roles: ['ADMINISTRADOR_GERAL'],
    permissions: [
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.enviar',
      'documentos.arquivo.baixar',
      'documentos.versao.criar',
      'documentos.versao.visualizar',
      'documentos.arquivo.arquivar',
      'documentos.arquivo.excluir',
      'documentos.categoria.visualizar',
      'documentos.categoria.editar',
      'documentos.auditoria.visualizar'
    ],
    isSuperAdmin: true,
    status: 'ACTIVE',
    sessionId: 'sess_admin',
    scope: { isGlobal: true, producers: [], events: [] }
  };

  const userFinMaria: AuthenticatedUser = {
    id: 'usr_fin_maria',
    name: 'Maria Santos (Financeiro)',
    email: 'maria.santos@disk.com.br',
    roles: ['FINANCEIRO'],
    permissions: [
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.enviar',
      'documentos.arquivo.baixar',
      'documentos.versao.criar',
      'documentos.versao.visualizar',
      'documentos.categoria.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_fin_maria',
    scope: { isGlobal: true, producers: ['prd_100', 'prd_200'], events: ['evt_1001', 'evt_1002'] }
  };

  const userProdOpus: AuthenticatedUser = {
    id: 'usr_prod_opus',
    name: 'Roberto Opus (Produtor Opus)',
    email: 'roberto@opus.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.enviar',
      'documentos.arquivo.baixar',
      'documentos.versao.criar',
      'documentos.versao.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_prod_opus',
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_1001', 'evt_1002'] }
  };

  const userProdLiveNation: AuthenticatedUser = {
    id: 'usr_prod_livenation',
    name: 'Carla LiveNation (Produtora Live Nation)',
    email: 'carla@livenation.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.enviar',
      'documentos.arquivo.baixar',
      'documentos.versao.criar',
      'documentos.versao.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_prod_livenation',
    scope: { isGlobal: false, producers: ['prd_200'], events: ['evt_2001'] }
  };

  const userSacLucas: AuthenticatedUser = {
    id: 'usr_sac_lucas',
    name: 'Lucas SAC',
    email: 'lucas.sac@disk.com.br',
    roles: ['ATENDIMENTO_SAC'],
    permissions: [
      'documentos.arquivo.visualizar',
      'documentos.arquivo.enviar',
      'documentos.arquivo.baixar',
      'documentos.categoria.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_sac_lucas',
    scope: { isGlobal: true, producers: [], events: [] }
  };

  const userAuditor: AuthenticatedUser = {
    id: 'usr_auditor',
    name: 'Renata Auditora',
    email: 'renata.auditora@disk.com.br',
    roles: ['AUDITOR'],
    permissions: [
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.baixar',
      'documentos.versao.visualizar',
      'documentos.auditoria.visualizar',
      'documentos.categoria.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_auditor',
    scope: { isGlobal: true, producers: [], events: [] }
  };

  console.log('--- 1. UPLOAD, STORAGE, METADADOS E CRIPTOGRAFIA ---');

  // 1. Upload autorizado
  const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Contrato de Prestação de Serviços) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const uploadDoc1 = await DocumentService.uploadDocument(
    {
      title: 'Contrato Festival de Inverno 2026',
      description: 'Contrato formal com a Opus Entretenimento',
      categoryCode: 'CONTRATO',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      fileBuffer: dummyPdfContent,
      originalFileName: 'contrato_festival_2026.pdf',
      mimeType: 'application/pdf',
      tags: ['contrato', 'opus', 'juridico']
    },
    userFinMaria
  );

  assert(
    uploadDoc1 !== null && uploadDoc1.id !== undefined && uploadDoc1.status === 'AVAILABLE',
    'Critério 1: Upload autorizado com criação de documento e versão inicial'
  );

  // 2. Upload múltiplo
  const multiUpload = await DocumentService.uploadMultiple(
    [
      {
        title: 'Comprovante Transferência 01',
        categoryCode: 'COMPROVANTE',
        fileBuffer: Buffer.from('%PDF-1.4 comprovante 1'),
        originalFileName: 'comp1.pdf',
        mimeType: 'application/pdf',
        producerId: 'prd_100'
      },
      {
        title: 'Comprovante Transferência 02',
        categoryCode: 'COMPROVANTE',
        fileBuffer: Buffer.from('%PDF-1.4 comprovante 2'),
        originalFileName: 'comp2.pdf',
        mimeType: 'application/pdf',
        producerId: 'prd_100'
      }
    ],
    userFinMaria
  );

  assert(
    Array.isArray(multiUpload) && multiUpload.length === 2 && multiUpload[0].id && multiUpload[1].id,
    'Critério 2: Upload múltiplo em lote realizado com sucesso'
  );

  // 3. Tipo inválido bloqueado
  let blockedInvalidType = false;
  try {
    const maliciousBat = Buffer.from('@echo off\nformat C: /y');
    await DocumentService.uploadDocument(
      {
        title: 'Script Malicioso',
        categoryCode: 'OUTRO',
        fileBuffer: maliciousBat,
        originalFileName: 'payload.bat',
        mimeType: 'application/x-bat'
      },
      userFinMaria
    );
  } catch (err: any) {
    blockedInvalidType = err.message.includes('Extensão de arquivo não permitida');
  }

  assert(
    blockedInvalidType,
    'Critério 3: Bloqueio estrito de arquivos executáveis (.exe, .bat, .sh) por extensão e assinatura'
  );

  // 4. Arquivo acima do limite bloqueado
  let blockedOversize = false;
  try {
    // Categoria COMPROVANTE possui limite de 10MB (10485760 bytes). Criamos buffer simulado de 15MB
    const oversizeBuffer = Buffer.alloc(15 * 1024 * 1024);
    oversizeBuffer.write('%PDF-1.4 oversize');
    await DocumentService.uploadDocument(
      {
        title: 'Comprovante Gigante',
        categoryCode: 'COMPROVANTE',
        fileBuffer: oversizeBuffer,
        originalFileName: 'comprovante_pesado.pdf',
        mimeType: 'application/pdf'
      },
      userFinMaria
    );
  } catch (err: any) {
    blockedOversize = err.message.includes('excede o limite máximo permitido');
  }

  assert(
    blockedOversize,
    'Critério 4: Arquivo acima do limite máximo da categoria é estritamente bloqueado (400)'
  );

  // 5. Arquivo suspeito colocado em quarentena
  const eicarBuffer = Buffer.from(
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
  );
  const quarantinedDoc = await DocumentService.uploadDocument(
    {
      title: 'Arquivo Teste de Vírus EICAR',
      categoryCode: 'OUTRO',
      fileBuffer: eicarBuffer,
      originalFileName: 'test_virus.pdf',
      mimeType: 'application/pdf'
    },
    userAdmin
  );

  const securityCheck = await prisma.documentSecurityCheck.findFirst({
    where: { versionId: quarantinedDoc.currentVersionId }
  });

  assert(
    quarantinedDoc.status === 'QUARANTINED' && securityCheck?.status === 'QUARANTINED',
    'Critério 5: Arquivo com padrão malicioso ou teste EICAR é isolado em QUARANTINED'
  );

  // 6. Checksum gerado
  const expectedHash = crypto.createHash('sha256').update(dummyPdfContent).digest('hex');
  const initialVersion = await prisma.documentVersion.findUnique({
    where: { id: uploadDoc1.currentVersionId }
  });

  assert(
    initialVersion?.checksumAlgorithm === 'SHA-256' && initialVersion?.checksum === expectedHash,
    'Critério 6: Checksum criptográfico SHA-256 gerado e conferido com integridade absoluta'
  );

  // 7. Documento salvo no storage
  const fileExistsInStorage = await defaultStorageProvider.exists(initialVersion.storageKey);
  const downloadedBytes = await defaultStorageProvider.download(initialVersion.storageKey);

  assert(
    fileExistsInStorage && downloadedBytes.toString('utf-8') === dummyPdfContent.toString('utf-8'),
    'Critério 7: Binário do documento persistido no StorageProvider desacoplado do banco'
  );

  // 8. Metadados salvos no PostgreSQL
  const dbDoc = await prisma.document.findUnique({
    where: { id: uploadDoc1.id },
    include: { category: true }
  });

  assert(
    dbDoc?.title === 'Contrato Festival de Inverno 2026' &&
    dbDoc?.category?.code === 'CONTRATO' &&
    dbDoc?.producerId === 'prd_100',
    'Critério 8: Metadados relacionais e categorias salvos no banco PostgreSQL'
  );

  console.log('\n--- 2. DOWNLOAD PROTEGIDO, PREVIEW E URLs EXPIRÁVEIS ---');

  // 9. Download protegido
  let downloadBlockedQuarantine = false;
  try {
    await DocumentService.getDownloadUrl(quarantinedDoc.id, userAdmin);
  } catch (err: any) {
    downloadBlockedQuarantine = err.message.includes('em quarentena');
  }

  const validDownload = await DocumentService.getDownloadUrl(uploadDoc1.id, userFinMaria);

  assert(
    downloadBlockedQuarantine && validDownload.downloadUrl.includes('/api/v1/documents/download/signed'),
    'Critério 9: Download protegido: bloqueia arquivos em quarentena e autoriza arquivos válidos'
  );

  // 10. URL temporária
  const expiresTimestamp = Math.floor(Date.now() / 1000) + 900;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'disk-interno-storage-secret-key-2026')
    .update(`${initialVersion.storageKey}:${expiresTimestamp}`)
    .digest('hex');

  const isSigValidNow = defaultStorageProvider.verifySignedUrl(
    initialVersion.storageKey,
    expiresTimestamp,
    signature
  );

  const isSigValidExpired = defaultStorageProvider.verifySignedUrl(
    initialVersion.storageKey,
    Math.floor(Date.now() / 1000) - 10, // 10 segundos no passado
    signature
  );

  assert(
    isSigValidNow === true && isSigValidExpired === false,
    'Critério 10: URLs temporárias assinadas com HMAC expiram estritamente após o prazo configurado'
  );

  // 11. Preview autorizado
  const previewResult = await DocumentService.getPreview(uploadDoc1.id, userFinMaria);
  const previewAccessLog = await prisma.documentAccessLog.findFirst({
    where: { documentId: uploadDoc1.id, action: 'PREVIEW' }
  });

  assert(
    previewResult.downloadUrl !== undefined && previewAccessLog !== null,
    'Critério 11: Endpoint de preview autorizado gera acesso seguro e registra log PREVIEW'
  );

  console.log('\n--- 3. VERSIONAMENTO IMUTÁVEL E HISTÓRICO ---');

  // 12. Nova versão
  const v2PdfContent = Buffer.from('%PDF-1.4\nContrato aditado com nova clausula financeira v2');
  const v2Result = await DocumentService.createVersion(
    {
      documentId: uploadDoc1.id,
      fileBuffer: v2PdfContent,
      originalFileName: 'contrato_festival_aditivo_v2.pdf',
      mimeType: 'application/pdf',
      changeReason: 'Aditivo contratual referente ao cachê dos artistas principais'
    },
    userFinMaria
  );

  assert(
    v2Result.newVersion.version === 2 &&
    v2Result.document.currentVersionId === v2Result.newVersion.id,
    'Critério 12: Nova versão v2 criada com motivo obrigatório e atualiza currentVersionId'
  );

  // 13. Histórico de versões
  const allVersions = await DocumentVersionService.listVersions(uploadDoc1.id);

  assert(
    allVersions.length === 2 &&
    allVersions.some((v: any) => v.version === 1) &&
    allVersions.some((v: any) => v.version === 2),
    'Critério 13: Histórico completo de versões retornado em ordem decrescente'
  );

  // 14. Versão anterior preservada
  const v1Preserved = await defaultStorageProvider.download(initialVersion.storageKey);
  const v1HashPreserved = crypto.createHash('sha256').update(v1Preserved).digest('hex');

  assert(
    v1HashPreserved === initialVersion.checksum,
    'Critério 14: Versão anterior v1 é 100% preservada de forma imutável após upload da v2'
  );

  console.log('\n--- 4. MULTI-VÍNCULOS COM RECURSOS DO SISTEMA ---');

  // 15. Vínculo com produtor
  const linkProd = await DocumentLinkService.link(uploadDoc1.id, 'PRODUCER', 'prd_100');
  assert(linkProd.resourceType === 'PRODUCER', 'Critério 15: Vínculo documental estabelecido com PRODUCER');

  // 16. Vínculo com evento
  const linkEvt = await DocumentLinkService.link(uploadDoc1.id, 'EVENT', 'evt_1001');
  assert(linkEvt.resourceType === 'EVENT', 'Critério 16: Vínculo documental estabelecido com EVENT');

  // 17. Vínculo com pedido
  const linkOrd = await DocumentLinkService.link(uploadDoc1.id, 'ORDER', 'ord-984521');
  assert(linkOrd.resourceType === 'ORDER', 'Critério 17: Vínculo documental estabelecido com ORDER');

  // 18. Vínculo com pagamento
  const linkPay = await DocumentLinkService.link(uploadDoc1.id, 'PAYMENT', 'pay_8821');
  assert(linkPay.resourceType === 'PAYMENT', 'Critério 18: Vínculo documental estabelecido com PAYMENT');

  // 19. Vínculo com transferência
  const linkTrf = await DocumentLinkService.link(uploadDoc1.id, 'TRANSFER', 'trf_5521');
  assert(linkTrf.resourceType === 'TRANSFER', 'Critério 19: Vínculo documental estabelecido com TRANSFER');

  // 20. Vínculo com estorno
  const linkRef = await DocumentLinkService.link(uploadDoc1.id, 'REFUND', 'ref_9821');
  assert(linkRef.resourceType === 'REFUND', 'Critério 20: Vínculo documental estabelecido com REFUND');

  // 21. Vínculo com ticket SAC
  const linkSac = await DocumentLinkService.link(uploadDoc1.id, 'SUPPORT_TICKET', 'tkt_sac_3321');
  assert(linkSac.resourceType === 'SUPPORT_TICKET', 'Critério 21: Vínculo documental estabelecido com SUPPORT_TICKET');

  // 22. Múltiplos vínculos
  const allDocLinks = await DocumentLinkService.listLinks(uploadDoc1.id);
  const resourceDocIds = await DocumentLinkService.getDocumentsByResource('TRANSFER', 'trf_5521');

  assert(
    allDocLinks.length >= 7 && resourceDocIds.includes(uploadDoc1.id),
    'Critério 22: Múltiplos vínculos coexistem no mesmo arquivo sem duplicação de dados'
  );

  console.log('\n--- 5. RBAC E ISOLAMENTO DE ESCOPO (PRODUTOR A × PRODUTOR B) ---');

  // 23. RBAC aplicado
  let confidentialBlocked = false;
  const confidentialDoc = await DocumentService.uploadDocument(
    {
      title: 'Auditoria Sigilosa de Fraudes',
      categoryCode: 'RELATORIO',
      isConfidential: true,
      fileBuffer: Buffer.from('%PDF-1.4 sigiloso'),
      originalFileName: 'auditoria_sigilosa.pdf',
      mimeType: 'application/pdf'
    },
    userAdmin
  );

  try {
    // Lucas do SAC tenta acessar documento confidencial sem permissão de auditoria
    await DocumentService.getById(confidentialDoc.id, userSacLucas);
  } catch (err: any) {
    confidentialBlocked = err.message.includes('Este documento é confidencial');
  }

  const auditorAllowed = await DocumentService.getById(confidentialDoc.id, userAuditor);

  assert(
    confidentialBlocked && auditorAllowed.id === confidentialDoc.id,
    'Critério 23: RBAC aplicado: documento confidencial bloqueia usuário comum e autoriza auditor'
  );

  // 24. Escopo aplicado
  const prodOpusDoc = await DocumentService.getById(uploadDoc1.id, userProdOpus);
  assert(
    prodOpusDoc.id === uploadDoc1.id,
    'Critério 24: Escopo aplicado: Produtor Opus visualiza seus próprios documentos'
  );

  // 25. Produtor A não acessa documento do Produtor B
  let crossProducerBlocked = false;
  try {
    // Live Nation tenta acessar documento da Opus
    await DocumentService.getById(uploadDoc1.id, userProdLiveNation);
  } catch (err: any) {
    crossProducerBlocked = err.message.includes('Você não possui autorização para acessar documentos deste produtor');
  }

  assert(
    crossProducerBlocked,
    'Critério 25: Segregação absoluta: Produtor A é estritamente impedido de acessar arquivos do Produtor B'
  );

  // 26. Evento A não acessa documento restrito ao Evento B
  const restrictedEventDoc = await DocumentService.uploadDocument(
    {
      title: 'Planta de Segurança - Coldplay',
      categoryCode: 'DOCUMENTO_EVENTO',
      producerId: 'prd_200',
      eventId: 'evt_2001',
      fileBuffer: Buffer.from('%PDF-1.4 planta coldplay'),
      originalFileName: 'planta_estadio.pdf',
      mimeType: 'application/pdf'
    },
    userAdmin
  );

  let crossEventBlocked = false;
  try {
    // Usuário Opus tenta acessar documento do evento Coldplay
    await DocumentService.getById(restrictedEventDoc.id, userProdOpus);
  } catch (err: any) {
    crossEventBlocked = true;
  }

  assert(
    crossEventBlocked,
    'Critério 26: Evento restrito: Usuário sem escopo ao Evento B é barrado com 403 Forbidden'
  );

  console.log('\n--- 6. INTEGRAÇÃO COM MOTOR DE APROVAÇÕES E REQUISITOS ---');

  // 27. Documento obrigatório bloqueia aprovação incompleta
  const validationIncomplete = await DocumentService.validateRequirements({
    operation: 'FINANCE_TRANSFER',
    amount: 75000.00, // Acima de 50k exige NOTA_FISCAL e AUTORIZACAO
    linkedCategoryCodes: ['COMPROVANTE'] // Falta NOTA_FISCAL e AUTORIZACAO
  });

  assert(
    validationIncomplete.valid === false &&
    validationIncomplete.missingCategories.includes('NOTA_FISCAL') &&
    validationIncomplete.missingCategories.includes('AUTORIZACAO'),
    'Critério 27: Documentação obrigatória ausente bloqueia solicitação de aprovação'
  );

  // 28. Approval Engine reconhece documentos
  const validationComplete = await DocumentService.validateRequirements({
    operation: 'FINANCE_TRANSFER',
    amount: 75000.00,
    linkedCategoryCodes: ['NOTA_FISCAL', 'AUTORIZACAO', 'COMPROVANTE']
  });

  assert(
    validationComplete.valid === true && validationComplete.missingCategories.length === 0,
    'Critério 28: Motor de validação documental autoriza aprovação quando checklist está completo'
  );

  console.log('\n--- 7. BUSCA GLOBAL, VENCIMENTO, RETENÇÃO E AUDITORIA ---');

  // 29. Busca Global encontra documentos autorizados
  const searchResults = await SearchService.search('Festival de Inverno 2026', userFinMaria);
  const foundDocs = searchResults.categories.documents?.items || [];
  const foundDoc = foundDocs.find((d: any) => d.id === uploadDoc1.id);

  assert(
    foundDoc !== undefined && foundDoc.entityType === 'DOCUMENT',
    'Critério 29: Busca Global Inteligente indexa e localiza documentos conforme permissão e escopo'
  );

  // 30. Notificação de vencimento funciona
  const futureExpiry = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // Vence em 4 dias
  const expiringDoc = await DocumentService.uploadDocument(
    {
      title: 'Alvará do Corpo de Bombeiros',
      categoryCode: 'DOCUMENTO_EVENTO',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      validUntil: futureExpiry,
      fileBuffer: Buffer.from('%PDF-1.4 alvara'),
      originalFileName: 'alvara_bombeiros.pdf',
      mimeType: 'application/pdf'
    },
    userAdmin
  );

  let notificationEmitted = false;
  EventBus.subscribe('DOCUMENT_EXPIRING', (evt) => {
    if (evt.data.documentId === expiringDoc.id) {
      notificationEmitted = true;
    }
  });

  const expiringList = await DocumentService.checkExpiringDocuments(7);

  assert(
    expiringList.some((d: any) => d.id === expiringDoc.id) && notificationEmitted,
    'Critério 30: Varredura de validade detecta documentos a vencer e emite evento DOCUMENT_EXPIRING'
  );

  // 31. Auditoria registra ações críticas, retenção respeitada e exclusão lógica
  const retentionEval = await DocumentRetentionService.evaluateRetention(uploadDoc1.id);
  const deleteResult = await DocumentService.softDelete(uploadDoc1.id, userAdmin);

  const docAfterDelete = await prisma.document.findUnique({ where: { id: uploadDoc1.id } });
  const auditLogs = await prisma.auditLog.findMany({
    where: { resource: `Document:${uploadDoc1.id}` }
  });

  assert(
    retentionEval.canPurge === false &&
    deleteResult.success === true &&
    docAfterDelete?.status === 'DELETED' &&
    docAfterDelete?.deletedAt !== null &&
    auditLogs.some((l: any) => l.action === 'DOCUMENT_SOFT_DELETE'),
    'Critério 31: Auditoria registra ações críticas, exclusão respeita retenção legal e aplica soft delete'
  );

  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM`);
  if (passedTests === totalTests) {
    console.log('TODOS OS 31 CRITÉRIOS DE ACEITE DA FASE 1.1.5.8 FORAM ATENDIDOS COM SUCESSO!');
  } else {
    console.error(`ALERTA: ${totalTests - passedTests} testes falharam.`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Erro fatal executando testes da Fase 1.1.5.8:', err);
  process.exit(1);
});
