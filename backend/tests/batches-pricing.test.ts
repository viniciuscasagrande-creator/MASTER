import { TicketBatchService } from '../src/modules/events/batches/ticket-batch.service';
import { BatchStateMachine } from '../src/modules/events/batches/lifecycle/batch-state-machine';
import { BatchActivationService } from '../src/modules/events/batches/activation/batch-activation.service';
import { PriceCalculationService } from '../src/modules/events/pricing/price-calculation.service';
import { PricingMatrixService } from '../src/modules/events/pricing/pricing-matrix.service';
import { SalesRuleService } from '../src/modules/events/sales-rules/sales-rule.service';
import { memoryDb, prisma } from '../src/core/database/prisma';

async function runBatchesPricingTests() {
  console.log('\n======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.6: LOTES, PREÇOS, TAXAS E REGRAS');
  console.log('======================================================\n');

  memoryDb.seedDefaults();

  // Test 1: Listagem de Lotes do Evento
  console.log('1. Testando listagem e fases de lotes...');
  const batches = await TicketBatchService.listBatches('evt_1001');
  if (batches.length < 3) {
    throw new Error(`Esperado no mínimo 3 lotes iniciais, obtido ${batches.length}`);
  }
  const activeBatch = batches.find(b => b.status === 'ACTIVE');
  if (!activeBatch || activeBatch.code !== 'LOTE_2') {
    throw new Error('Lote ativo inicial esperado: LOTE_2');
  }
  console.log(`✓ Teste 1 passou! ${batches.length} lotes encontrados. Lote ativo: ${activeBatch.name} (${activeBatch.code}).`);

  // Test 2: Validações da Máquina de Estados (Batch Lifecycle)
  console.log('\n2. Testando máquina de estados do ciclo de vida dos lotes...');
  // Transição válida: ACTIVE -> PAUSED -> ACTIVE
  await TicketBatchService.transitionStatus(activeBatch.id, 'PAUSED');
  let reloaded = await TicketBatchService.getBatch(activeBatch.id);
  if (reloaded?.status !== 'PAUSED') {
    throw new Error('Falha ao pausar lote ativo');
  }

  await TicketBatchService.transitionStatus(activeBatch.id, 'ACTIVE');
  reloaded = await TicketBatchService.getBatch(activeBatch.id);
  if (reloaded?.status !== 'ACTIVE') {
    throw new Error('Falha ao reativar lote pausado');
  }

  // Transição inválida: SOLD_OUT -> ACTIVE
  const soldOutBatch = batches.find(b => b.status === 'SOLD_OUT')!;
  let threw = false;
  try {
    await TicketBatchService.transitionStatus(soldOutBatch.id, 'ACTIVE');
  } catch (err: any) {
    threw = true;
    if (err.statusCode !== 400) {
      throw new Error(`Esperado status 400 para transição proibida, obtido ${err.statusCode}`);
    }
  }

  if (!threw) {
    throw new Error('Máquina de estados falhou: permitiu transição proibida de SOLD_OUT para ACTIVE');
  }
  console.log('✓ Teste 2 passou! Transições válidas executadas e transições proibidas barradas com sucesso.');

  // Test 3: Criação de Novo Lote
  console.log('\n3. Testando criação de novo lote comercial...');
  const newBatch = await TicketBatchService.createBatch('evt_1001', {
    name: 'Lote VIP Última Chance',
    activationType: 'MANUAL',
    totalQuantityLimit: 1000
  });

  if (!newBatch.id || newBatch.status !== 'DRAFT') {
    throw new Error('Falha ao criar novo lote');
  }
  console.log(`✓ Teste 3 passou! Lote criado: ${newBatch.name} (Fase ${newBatch.phase}, Status ${newBatch.status}).`);

  // Test 4: Cálculo Financeiro e Arredondamento sem Floating-Point Leaks
  console.log('\n4. Testando PriceCalculationService e divisão de taxas (Split/Buyer/Producer)...');
  // Exemplo: Ingresso R$ 100,00 (10000 cents) com:
  // - 10% taxa de conveniência paga pelo comprador -> R$ 10,00 (1000 cents)
  // - 5% taxa de processamento retida do produtor -> R$ 5,00 (500 cents)
  const calcResult = PriceCalculationService.calculate(
    10000,
    10000,
    [
      { name: 'Taxa de Conveniência', type: 'PERCENTAGE', value: 10, payer: 'BUYER' },
      { name: 'Taxa de Processamento', type: 'PERCENTAGE', value: 5, payer: 'PRODUCER' }
    ],
    2 // 2 ingressos
  );

  // Subtotal = 2 * 10000 = 20000 cents (R$ 200,00)
  // Taxa Comprador = 10% de 20000 = 2000 cents (R$ 20,00)
  // Total Comprador = 22000 cents (R$ 220,00)
  // Taxa Produtor = 5% de 20000 = 1000 cents (R$ 10,00)
  // Líquido Produtor = 20000 - 1000 = 19000 cents (R$ 190,00)
  if (calcResult.subtotalInCents !== 20000) {
    throw new Error(`Subtotal incorreto: esperado 20000, obtido ${calcResult.subtotalInCents}`);
  }
  if (calcResult.buyerTotalInCents !== 22000) {
    throw new Error(`Total comprador incorreto: esperado 22000, obtido ${calcResult.buyerTotalInCents}`);
  }
  if (calcResult.producerNetInCents !== 19000) {
    throw new Error(`Líquido produtor incorreto: esperado 19000, obtido ${calcResult.producerNetInCents}`);
  }
  console.log(`✓ Teste 4 passou! Comprador paga R$ 220,00 (ingressos R$ 200,00 + R$ 20,00 taxa). Produtor recebe líquido R$ 190,00.`);

  // Test 5: Matriz de Preços (Sectors x TicketTypes)
  console.log('\n5. Testando geração da Matriz de Preços do lote...');
  const matrix = await PricingMatrixService.getMatrix('evt_1001', activeBatch.id);
  if (matrix.sections.length < 1 || matrix.ticketTypes.length < 1) {
    throw new Error('Matriz de preços sem setores ou tipos de ingresso');
  }

  const pistaInteiraKey = 'esec_1001_pista_ett_1001_inteira';
  const cell = matrix.cells[pistaInteiraKey];
  if (!cell || cell.basePriceInCents !== 18000) {
    throw new Error(`Célula Pista-Inteira incorreta: ${JSON.stringify(cell)}`);
  }
  console.log(`✓ Teste 5 passou! Matriz gerada com ${matrix.sections.length} setores e ${matrix.ticketTypes.length} modalidades. Célula Pista x Inteira: R$ ${(cell.basePriceInCents / 100).toFixed(2)}.`);

  // Test 6: Edição em Massa com Simulação (DryRun Preview) e Aplicação Real
  console.log('\n6. Testando edição em massa com preview e aplicação...');
  // 6.1 Simulação com dryRun: true (+15%)
  const previewResult = await PricingMatrixService.bulkUpdate('evt_1001', {
    batchId: activeBatch.id,
    operation: 'INCREASE_PERCENTAGE',
    value: 15,
    roundingPolicy: 'ROUND_UP_INT',
    dryRun: true
  });

  const previewPista = previewResult.preview.find(p => p.sectionId === 'esec_1001_pista' && p.ticketTypeId === 'ett_1001_inteira');
  if (!previewPista) throw new Error('Prévia da Pista Inteira ausente no resultado');

  // Preço antigo: 18000 cents. +15% = 20700 cents (R$ 207,00). ROUND_UP_INT mantém real cheio: 20700
  if (previewPista.newPriceInCents !== 20700) {
    throw new Error(`Prévia com cálculo incorreto: esperado 20700, obtido ${previewPista.newPriceInCents}`);
  }

  // Verifica que no banco o valor antigo permanece intacto
  const matrixBefore = await PricingMatrixService.getMatrix('evt_1001', activeBatch.id);
  if (matrixBefore.cells[pistaInteiraKey].basePriceInCents !== 18000) {
    throw new Error('DryRun alterou dados do banco de dados inadvertidamente!');
  }
  console.log('✓ Teste 6.1 passou! DryRun gerou preview com cálculo exato sem persistir no banco.');

  // 6.2 Aplicação real (dryRun: false)
  await PricingMatrixService.bulkUpdate('evt_1001', {
    batchId: activeBatch.id,
    operation: 'INCREASE_PERCENTAGE',
    value: 15,
    roundingPolicy: 'ROUND_UP_INT',
    dryRun: false
  });

  const matrixAfter = await PricingMatrixService.getMatrix('evt_1001', activeBatch.id);
  if (matrixAfter.cells[pistaInteiraKey].basePriceInCents !== 20700) {
    throw new Error(`Valor persistido incorreto: esperado 20700, obtido ${matrixAfter.cells[pistaInteiraKey].basePriceInCents}`);
  }
  console.log(`✓ Teste 6.2 passou! Preços atualizados no banco com sucesso: R$ ${(matrixAfter.cells[pistaInteiraKey].basePriceInCents / 100).toFixed(2)}.`);

  // Test 7: Cópia de Configurações de Preços entre Lotes
  console.log('\n7. Testando cópia de preços entre lotes...');
  const copiedCount = await PricingMatrixService.copyFromBatch(activeBatch.id, newBatch.id);
  if (copiedCount < 1) {
    throw new Error('Nenhum preço copiado para o novo lote');
  }

  const newBatchMatrix = await PricingMatrixService.getMatrix('evt_1001', newBatch.id);
  if (newBatchMatrix.cells[pistaInteiraKey].basePriceInCents !== 20700) {
    throw new Error('Preço não copiado corretamente para o novo lote');
  }
  console.log(`✓ Teste 7 passou! ${copiedCount} configurações de preço copiadas do Lote 2 para o Lote VIP.`);

  // Test 8: Regras de Venda (Limites por CPF, Pedido, Horário)
  console.log('\n8. Testando regras comerciais de venda...');
  const rules = await SalesRuleService.listRules('evt_1001');
  if (rules.length < 2) {
    throw new Error(`Esperado regras comerciais para evt_1001, obtido ${rules.length}`);
  }
  const maxCpfRule = rules.find(r => r.type === 'MAX_PER_CUSTOMER');
  if (!maxCpfRule || maxCpfRule.ruleConfig.maxPerCustomer !== 4) {
    throw new Error('Regra MAX_PER_CUSTOMER com configuração incorreta');
  }
  console.log(`✓ Teste 8 passou! ${rules.length} regras ativas: limite de ${maxCpfRule.ruleConfig.maxPerCustomer} ingressos por CPF e conformidade legal de meia.`);

  console.log('\n======================================================');
  console.log('TODOS OS 8 TESTES DA FASE 1.2.6 FORAM CONCLUÍDOS COM SUCESSO! ✓');
  console.log('======================================================\n');
}

runBatchesPricingTests().catch(err => {
  console.error('\n❌ ERRO NO TESTE:', err);
  process.exit(1);
});
