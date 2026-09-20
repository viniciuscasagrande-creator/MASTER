import { TicketTypeService } from '../src/modules/events/ticket-types/ticket-type.service';
import { InventoryService } from '../src/modules/events/inventory/inventory.service';
import { InventoryAllocationService } from '../src/modules/events/inventory/inventory-allocation.service';
import { InventoryBlockService } from '../src/modules/events/inventory/inventory-block.service';
import { memoryDb } from '../src/core/database/prisma';

async function runTicketTypesInventoryTests() {
  console.log('\n======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.5: TIPOS DE INGRESSO E INVENTÁRIO VENDÁVEL');
  console.log('======================================================\n');

  memoryDb.seedDefaults();

  // Test 1: Catálogo Base de Tipos de Ingresso
  console.log('1. Testando catálogo base de ingressos...');
  const catalog = await TicketTypeService.listCatalog();
  if (catalog.length < 5) {
    throw new Error(`Esperado no mínimo 5 itens no catálogo, obtido ${catalog.length}`);
  }
  const meia = catalog.find(t => t.code === 'MEIA');
  if (!meia || !meia.halfPriceLawCompliance || !meia.requiresDocument) {
    throw new Error('Tipo Meia-Entrada no catálogo não possui flags de conformidade');
  }
  console.log(`✓ Teste 1 passou! Catálogo carregado com ${catalog.length} itens base.`);

  // Test 2: Tipos de Ingresso do Evento
  console.log('\n2. Testando tipos de ingresso configurados para o evento...');
  const eventTypes = await TicketTypeService.listEventTicketTypes('evt_1001');
  if (eventTypes.length < 3) {
    throw new Error(`Esperado tipos de ingresso para evt_1001, obtido ${eventTypes.length}`);
  }
  console.log(`✓ Teste 2 passou! ${eventTypes.length} modalidades associadas ao evento.`);

  // Test 3: Criação de Tipo de Ingresso Customizado
  console.log('\n3. Testando criação de novo tipo de ingresso...');
  const createdType = await TicketTypeService.createEventTicketType('evt_1001', {
    name: 'Ingresso Estudante + Kit Fan',
    category: 'MEIA',
    halfPriceLawCompliance: true,
    requiresDocument: true,
    minPerOrder: 1,
    maxPerOrder: 2,
    benefits: [{ name: 'Kit Fan Oficial', description: 'Copo + Camiseta + Tirante' }],
    sectionIds: ['esec_1001_pista']
  });

  if (!createdType.id || createdType.benefits?.length !== 1) {
    throw new Error('Falha ao criar tipo de ingresso customizado');
  }
  console.log(`✓ Teste 3 passou! Tipo criado: ${createdType.name} (${createdType.code}) com ${createdType.benefits.length} benefício(s).`);

  // Test 4: Sincronização de Pools e Cálculo Exato de Disponibilidade
  console.log('\n4. Testando pools de inventário vendável...');
  const pools = await InventoryService.listPools('ses_1001_1');
  if (pools.length < 1) {
    throw new Error('Nenhum pool retornado para ses_1001_1');
  }
  const pistaPool = pools.find(p => p.eventSectionId === 'esec_1001_pista');
  if (!pistaPool) throw new Error('Pool da Pista Geral não encontrado');

  const expectedAvail = pistaPool.capacity - (pistaPool.reserved + pistaPool.blocked + pistaPool.held + pistaPool.sold);
  if (pistaPool.available !== expectedAvail) {
    throw new Error(`Cálculo de disponibilidade incorreto. Esperado ${expectedAvail}, obtido ${pistaPool.available}`);
  }
  console.log(`✓ Teste 4 passou! Pool Pista: Capacidade ${pistaPool.capacity}, Vendidos ${pistaPool.sold}, Bloqueados ${pistaPool.blocked}, Disponível ${pistaPool.available}.`);

  // Test 5: Bloqueio Administrativo (Technical / Buffer)
  console.log('\n5. Testando bloqueio administrativo de capacidade...');
  const initialAvail = pistaPool.available;
  const block = await InventoryBlockService.createBlock(pistaPool.id, {
    reason: 'TECHNICAL_HOLD',
    quantity: 50,
    notes: 'Reserva para equipe de filmagem técnica'
  }, 'usr_admin');

  const updatedPools = await InventoryService.listPools('ses_1001_1');
  const updatedPista = updatedPools.find(p => p.id === pistaPool.id)!;
  if (updatedPista.available !== initialAvail - 50) {
    throw new Error(`Disponibilidade deveria ter diminuído em 50. Antes: ${initialAvail}, Agora: ${updatedPista.available}`);
  }
  console.log(`✓ Teste 5 passou! Bloqueio de 50 ingressos criado. Nova disponibilidade: ${updatedPista.available}.`);

  // Test 6: Reserva Atômica (Hold) & Anti-Overselling
  console.log('\n6. Testando reserva temporária (Hold) e anti-overselling...');
  const holdResult = await InventoryService.holdInventory({
    sessionId: 'ses_1001_1',
    eventSectionId: 'esec_1001_pista',
    eventTicketTypeId: 'ett_1001_inteira',
    quantity: 4,
    ttlSeconds: 60
  });

  if (!holdResult.success || !holdResult.holdToken) {
    throw new Error('Falha ao gerar hold de inventário');
  }
  console.log(`✓ Teste 6.1: Hold gerado com sucesso: token=${holdResult.holdToken}, expira em ${holdResult.expiresAt}`);

  // Teste de rejeição por capacidade excedida
  let rejected = false;
  try {
    await InventoryService.holdInventory({
      sessionId: 'ses_1001_1',
      eventSectionId: 'esec_1001_pista',
      eventTicketTypeId: 'ett_1001_inteira',
      quantity: 999999 // quantidade impossível
    });
  } catch (err: any) {
    rejected = true;
    if (err.statusCode !== 409) {
      throw new Error(`Esperado status 409 para over-capacity, obtido ${err.statusCode}`);
    }
  }

  if (!rejected) {
    throw new Error('Anti-overselling falhou: permitiu reservar quantidade acima da capacidade total!');
  }
  console.log('✓ Teste 6.2: Anti-overselling bloqueou com sucesso solicitação que excede o pool (409 Conflict).');

  // Test 7: Liberação de Hold
  console.log('\n7. Testando liberação de reserva temporária...');
  await InventoryService.releaseHold(holdResult.holdToken);
  const poolsAfterRelease = await InventoryService.listPools('ses_1001_1');
  const pistaAfterRelease = poolsAfterRelease.find(p => p.id === pistaPool.id)!;
  console.log(`✓ Teste 7 passou! Hold liberado. Quantidade em hold no pool: ${pistaAfterRelease.held}.`);

  // Test 8: Gerenciamento de Cotas (Allocations)
  console.log('\n8. Testando cotas (hard quotas e porcentagens)...');
  const alloc = await InventoryAllocationService.saveAllocation(pistaPool.id, {
    eventTicketTypeId: createdType.id,
    allocationType: 'FIXED',
    allocationValue: 500
  });

  if (alloc.allocatedQuantity !== 500) {
    throw new Error(`Alocação esperada 500, obtido ${alloc.allocatedQuantity}`);
  }
  console.log(`✓ Teste 8 passou! Cota de ${alloc.allocatedQuantity} ingressos associada ao tipo ${createdType.name}.`);

  // Test 9: Resumo de Inventário (KPIs sem dados falsos)
  console.log('\n9. Testando resumo analítico de inventário do evento...');
  const summary = await InventoryService.getInventorySummary('evt_1001');
  if (summary.totalOperationalCapacity < 25000 || summary.poolsCount < 1) {
    throw new Error(`Métricas incorretas no resumo: ${JSON.stringify(summary)}`);
  }
  console.log(`✓ Teste 9 passou! Resumo real: Operacional=${summary.totalOperationalCapacity}, Reservada=${summary.totalReservedCapacity}, Bloqueada=${summary.totalBlockedCapacity}, Vendida=${summary.totalSoldCapacity}, Disponível=${summary.totalAvailableCommercial}.`);

  console.log('\n======================================================');
  console.log('TODOS OS 9 TESTES DA FASE 1.2.5 FORAM CONCLUÍDOS COM SUCESSO! ✓');
  console.log('======================================================\n');
}

runTicketTypesInventoryTests().catch(err => {
  console.error('\n❌ ERRO NO TESTE:', err);
  process.exit(1);
});
