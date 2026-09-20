import { SalesChannelService } from '../src/modules/events/sales-channels/sales-channel.service';
import { prisma } from '../src/core/database/prisma';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.7: CANAIS DE VENDA');
  console.log('======================================================\n');

  const eventId = 'evt_1001';

  // 1. Listagem de canais disponíveis no sistema
  console.log('1. Testando listagem de canais disponíveis globalmente...');
  const available = await SalesChannelService.listAvailableChannels();
  if (!available || available.length < 3) {
    throw new Error(`Esperado ao menos 3 canais globais, encontrado: ${available?.length}`);
  }
  console.log(`✓ Teste 1 passou! ${available.length} canais disponíveis encontrados (${available.map(c => c.name).join(', ')}).\n`);

  // 2. Canais configurados para o evento
  console.log('2. Testando canais vinculados ao evento...');
  const eventChannels = await SalesChannelService.getEventChannels(eventId);
  if (!eventChannels || eventChannels.length === 0) {
    throw new Error('Nenhum canal configurado para o evento');
  }
  const activeChannels = eventChannels.filter(c => c.enabled);
  console.log(`✓ Teste 2 passou! ${eventChannels.length} canais mapeados, ${activeChannels.length} ativos para o evento.\n`);

  // 3. Configuração de escopo de canal (sessões, setores, modalidades)
  console.log('3. Testando configuração e escopo de canal no evento...');
  const webChannel = available[0];
  const configured = await SalesChannelService.configureChannel(eventId, {
    salesChannelId: webChannel.id,
    enabled: true,
    configuration: { maxTicketsPerTransaction: 6, allowBoleto: true },
    sessionIds: ['ses_1001_1'],
    sectionIds: ['sec_pista_1001', 'sec_camarote_1001'],
    ticketTypeIds: ['ett_pista_inteira', 'ett_pista_meia']
  });

  if (!configured.enabled || configured.sessionIds?.length !== 1 || configured.sectionIds?.length !== 2) {
    throw new Error('Falha na configuração de escopo do canal');
  }
  console.log(`✓ Teste 3 passou! Canal Web configurado com restrição a 1 sessão e 2 setores.\n`);

  // 4. Alocação de cota de canal com restrição ao InventoryPool
  console.log('4. Testando alocação de cota de canal sobre pool oficial...');
  const pools = await prisma.inventoryPool.findMany();
  const targetPool = pools[0];
  if (!targetPool) throw new Error('Nenhum pool de inventário encontrado');

  const allocation = await SalesChannelService.setChannelAllocation(eventId, configured.id, {
    inventoryPoolId: targetPool.id,
    quantityLimit: 5000
  });

  if (allocation.quantityLimit !== 5000 || allocation.inventoryPoolId !== targetPool.id) {
    throw new Error('Falha ao definir alocação de canal');
  }
  console.log(`✓ Teste 4 passou! Alocação de 5.000 ingressos vinculada ao canal no pool oficial.\n`);

  // 5. Invariante: Alocação não pode exceder capacidade física/operacional do pool
  console.log('5. Testando barreira contra criação de estoque paralelo ou acima do pool...');
  let errorCaught = false;
  try {
    await SalesChannelService.setChannelAllocation(eventId, configured.id, {
      inventoryPoolId: targetPool.id,
      quantityLimit: 999999 // Excede capacidade física da Arena (15.000)
    });
  } catch (err: any) {
    errorCaught = true;
    if (!err.message.includes('não pode exceder a capacidade total')) {
      throw new Error(`Mensagem de erro inesperada: ${err.message}`);
    }
  }

  if (!errorCaught) {
    throw new Error('Falha de integridade: sistema permitiu alocar mais ingressos do que a capacidade do pool!');
  }
  console.log('✓ Teste 5 passou! Sistema barrou com sucesso tentativa de alocação além da capacidade do pool (Anti-overselling).\n');

  // 6. Pontos de venda físicos e parceiros comerciais
  console.log('6. Testando PDVs e parceiros comerciais...');
  const posList = await SalesChannelService.listSalesPoints();
  const partners = await SalesChannelService.listSalesPartners();
  console.log(`✓ Teste 6 passou! ${posList.length} pontos de venda físicos e ${partners.length} parceiros/promoters ativos.\n`);

  console.log('======================================================');
  console.log('TODOS OS 6 TESTES DE CANAIS DE VENDA PASSARAM! ✓');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('FALHA NOS TESTES DE CANAIS:', err);
  process.exit(1);
});
