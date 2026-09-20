import { ComplimentaryService } from '../src/modules/events/complimentary/complimentary.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.7: CORTESIAS & CONVITES');
  console.log('======================================================\n');

  const eventId = 'evt_1001';
  const sessionId = 'ses_1001_1';
  const sectionId = 'esec_1001_pista';

  // 1. Categorias de cortesia
  console.log('1. Testando categorias de cortesia...');
  const categories = await ComplimentaryService.listCategories();
  if (categories.length === 0) throw new Error('Nenhuma categoria de cortesia encontrada');
  console.log(`✓ Teste 1 passou! ${categories.length} categorias encontradas (${categories.map(c => c.name).join(', ')}).\n`);

  // 2. Cotas de cortesia
  console.log('2. Testando definição e consulta de cotas de cortesia...');
  const quota = await ComplimentaryService.setQuota(eventId, {
    sessionId,
    sectionId,
    quantityLimit: 50
  });

  if (quota.quantityLimit !== 50) throw new Error('Falha ao definir cota');
  console.log(`✓ Teste 2 passou! Cota de 50 cortesias definida para a sessão ${sessionId}.\n`);

  // 3. Solicitação de cortesia com convidados e reserva na cota
  console.log('3. Testando criação de solicitação de cortesia com convidados...');
  const cat = categories[0];
  const request = await ComplimentaryService.createRequest(
    eventId,
    {
      sessionId,
      sectionId,
      categoryId: cat.id,
      quantity: 2,
      reason: 'Convite Especial para Diretores do Patrocinador Master',
      guests: [
        { name: 'Carlos Eduardo Silva', email: 'carlos@patrocinador.com.br', document: '111.222.333-44' },
        { name: 'Mariana Costa', email: 'mariana@patrocinador.com.br', document: '222.333.444-55' }
      ]
    },
    'usr_prod_1',
    'Produtor Responsável'
  );

  if (request.status !== 'SUBMITTED' || request.guests?.length !== 2) {
    throw new Error('Falha na criação da solicitação de cortesia');
  }

  // Verifica reserva na cota
  const quotasAfter = await ComplimentaryService.getQuotas(eventId);
  const q = quotasAfter.find(x => x.sessionId === sessionId && x.sectionId === sectionId)!;
  if (q.quantityReserved < 2) {
    throw new Error('Cota não reservou a quantidade solicitada');
  }
  console.log(`✓ Teste 3 passou! Solicitação ${request.code} criada com 2 convidados. Cota reservada: ${q.quantityReserved}.\n`);

  // 4. Bloqueio por estouro de cota
  console.log('4. Testando bloqueio contra solicitação que ultrapassa cota permitida...');
  let quotaOverflowCaught = false;
  try {
    await ComplimentaryService.createRequest(
      eventId,
      {
        sessionId,
        sectionId,
        categoryId: cat.id,
        quantity: 999, // Excede cota de 50
        reason: 'Solicitação acima do limite permitido'
      },
      'usr_prod_1',
      'Produtor Responsável'
    );
  } catch (err: any) {
    quotaOverflowCaught = true;
    if (!err.message.includes('Cota de cortesias excedida')) {
      throw new Error(`Erro inesperado: ${err.message}`);
    }
  }

  if (!quotaOverflowCaught) throw new Error('Sistema permitiu estourar cota de cortesias!');
  console.log('✓ Teste 4 passou! Sistema bloqueou com sucesso solicitação excedente de cota.\n');

  // 5. Fluxo de Aprovação
  console.log('5. Testando aprovação da solicitação de cortesia...');
  const approved = await ComplimentaryService.approveRequest(request.id, 'usr_dir_1', 'Diretoria Disk Ingressos');
  if (approved.status !== 'APPROVED' || !approved.approvedBy) {
    throw new Error('Falha na aprovação da cortesia');
  }
  console.log(`✓ Teste 5 passou! Solicitação aprovada por "${approved.approvedBy}".\n`);

  // 6. Emissão de Ingressos consumindo do Pool Oficial de Inventário
  console.log('6. Testando emissão real de ingressos cortesia e consumo do Pool...');
  const poolBefore = await prisma.inventoryPool.findUnique({
    where: {
      sessionId_eventSectionId: {
        sessionId,
        eventSectionId: sectionId
      }
    }
  });
  const soldBefore = poolBefore?.sold || 0;

  const issued = await ComplimentaryService.issueTickets(request.id);
  if (issued.status !== 'ISSUED' || issued.quantityIssued !== 2) {
    throw new Error('Falha na emissão dos ingressos cortesia');
  }

  const poolAfter = await prisma.inventoryPool.findUnique({
    where: {
      sessionId_eventSectionId: {
        sessionId,
        eventSectionId: sectionId
      }
    }
  });

  if (poolAfter?.sold !== soldBefore + 2) {
    throw new Error('Inventário oficial não contabilizou o consumo de ingressos cortesia');
  }

  const allGuestsIssued = issued.guests?.every(g => g.issued && g.ticketId);
  if (!allGuestsIssued) {
    throw new Error('Convidados não foram marcados como emitidos com número de ingresso');
  }
  console.log(`✓ Teste 6 passou! 2 ingressos emitidos consumindo diretamente do Pool (sold: ${soldBefore} -> ${poolAfter?.sold}).\n`);

  // 7. Cancelamento e Estorno de Ingressos
  console.log('7. Testando cancelamento com estorno no Pool de Inventário...');
  const cancelled = await ComplimentaryService.cancelRequest(request.id, 'Desistência do patrocinador');
  if (cancelled.status !== 'CANCELLED') throw new Error('Falha no cancelamento');

  const poolRestored = await prisma.inventoryPool.findUnique({
    where: {
      sessionId_eventSectionId: {
        sessionId,
        eventSectionId: sectionId
      }
    }
  });

  if (poolRestored?.sold !== soldBefore) {
    throw new Error('Estorno no pool de inventário não ocorreu após cancelamento');
  }
  console.log(`✓ Teste 7 passou! Cancelamento realizado e pool estornado com sucesso (sold: ${poolRestored?.sold}).\n`);

  console.log('======================================================');
  console.log('TODOS OS 7 TESTES DE CORTESIAS PASSARAM! ✓');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('FALHA NOS TESTES DE CORTESIAS:', err);
  process.exit(1);
});
