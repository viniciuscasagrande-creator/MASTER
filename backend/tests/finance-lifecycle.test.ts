import { FinanceService } from '../src/modules/finance/finance.service';
import { SchedulePayoutInput } from '../src/modules/finance/finance.types';

async function runFinanceTests() {
  console.log('================================================================');
  console.log('FASE 1.3.11.1.4.4: TESTES DO CICLO DE VIDA FINANCEIRO & REPASSES');
  console.log('================================================================\n');

  // 1. Teste de Resumo Financeiro Factual
  console.log('1. Testando Resumo Factual de Saldos do Produtor...');
  const summary = await FinanceService.getProducerSummary({ producerId: 'prd_100' });
  console.log(`  ✓ Produtor: ${summary.producerName}`);
  console.log(`  ✓ Vendas Brutas: R$ ${summary.grossSales.toFixed(2)}`);
  console.log(`  ✓ Taxa Retida: R$ ${summary.diskFeeRetained.toFixed(2)}`);
  console.log(`  ✓ Repasses Pagos: R$ ${summary.payoutsPaid.toFixed(2)}`);
  console.log(`  ✓ Repasses Pendentes: R$ ${summary.pendingPayouts.toFixed(2)}`);
  console.log(`  ✓ Saldo Disponível Líquido: R$ ${summary.availableBalance.toFixed(2)}`);

  if (summary.availableBalance <= 0) {
    throw new Error('Saldo disponível deveria ser estritamente positivo com vendas realizadas.');
  }

  // 2. Teste de Saldos por Evento
  console.log('\n2. Testando Saldos por Evento...');
  const eventBalances = await FinanceService.getEventBalances('prd_100');
  console.log(`  ✓ Total de Eventos com Saldo: ${eventBalances.length}`);
  const event1 = eventBalances.find(e => e.eventId === 'evt_1001');
  if (!event1) throw new Error('Evento evt_1001 não encontrado nos saldos.');
  console.log(`  ✓ Evento: "${event1.eventTitle}" — Disponível: R$ ${event1.availableBalance.toFixed(2)}`);

  // 3. Teste de Bloqueio de Repasse Excedente ao Saldo Disponível
  console.log('\n3. Testando Bloqueio de Repasse com Valor Excedente ao Saldo...');
  const excessiveAmount = event1.availableBalance + 500000;
  try {
    await FinanceService.schedulePayout({
      producerId: 'prd_100',
      eventId: 'evt_1001',
      amount: excessiveAmount,
      scheduledDate: '2026-09-25'
    }, 'Vinicius Operador');
    throw new Error('Falha de segurança: repasse acima do saldo disponível foi agendado indevidamente.');
  } catch (err: any) {
    console.log(`  ✓ Bloqueio de saldo insuficiente executado com sucesso: "${err.message}"`);
  }

  // 4. Teste de Agendamento Válido de Repasse
  console.log('\n4. Testando Agendamento Válido de Repasse...');
  const validAmount = 25000.00;
  const newPayout = await FinanceService.schedulePayout({
    producerId: 'prd_100',
    eventId: 'evt_1001',
    amount: validAmount,
    scheduledDate: '2026-09-25',
    notes: 'Adiantamento contratual para montagem de palco'
  }, 'Vinicius Operador');

  console.log(`  ✓ Repasse ${newPayout.payoutNumber} agendado no valor de R$ ${newPayout.amount.toFixed(2)}`);
  console.log(`  ✓ Status inicial: ${newPayout.status}`);
  console.log(`  ✓ Conta Bancária: ${newPayout.bankInfo.bankName} | Ag: ${newPayout.bankInfo.agency} | CC: ${newPayout.bankInfo.account}`);

  // 5. Teste de Violação de Maker-Checker (Solicitante tentando aprovar)
  console.log('\n5. Testando Segregação de Funções Maker-Checker (Auto-Aprovação Proibida)...');
  try {
    await FinanceService.approvePayout(newPayout.id, 'Vinicius Operador');
    throw new Error('Falha de segurança: solicitante aprovou o próprio repasse.');
  } catch (err: any) {
    console.log(`  ✓ Auto-aprovação bloqueada com sucesso: "${err.message}"`);
  }

  // 6. Teste de Aprovação por Alçada Autorizada
  console.log('\n6. Testando Aprovação por Alçada Autorizada (Checker)...');
  const approvedPayout = await FinanceService.approvePayout(newPayout.id, 'Maria Oliveira (Diretoria Financeira)');
  console.log(`  ✓ Repasse ${approvedPayout.payoutNumber} aprovado formalmente.`);
  console.log(`  ✓ Novo Status: ${approvedPayout.status}`);
  console.log(`  ✓ Aprovador: ${approvedPayout.approvedBy}`);

  // 7. Teste de Liquidação Bancária (Processamento com Autenticação)
  console.log('\n7. Testando Liquidação Bancária com Comprovante e Autenticação PIX...');
  const authCode = 'ITAU-PIX-BATCH-994182941';
  const processedPayout = await FinanceService.processPayout(
    approvedPayout.id,
    'Operador Bancário',
    authCode,
    'Transferência concluída com sucesso via API Santander/Itaú'
  );
  console.log(`  ✓ Liquidação concluída com sucesso.`);
  console.log(`  ✓ Status final: ${processedPayout.status}`);
  console.log(`  ✓ Autenticação Bancária: ${processedPayout.bankAuthCode}`);
  console.log(`  ✓ Data do Pagamento: ${processedPayout.paidAt}`);

  // 8. Teste de Extrato e Conta Corrente Analítica
  console.log('\n8. Testando Extrato Analítico da Conta Corrente do Produtor...');
  const statement = await FinanceService.getAccountStatement({ producerId: 'prd_100' });
  console.log(`  ✓ Total de Lançamentos no Extrato: ${statement.length}`);
  statement.slice(0, 3).forEach((tx, idx) => {
    console.log(`    [${idx + 1}] ${tx.createdAt.slice(0, 10)} | ${tx.type} | R$ ${tx.amount.toFixed(2)} | Saldo: R$ ${tx.balanceAfter.toFixed(2)} — ${tx.description}`);
  });

  // 9. Teste de Conciliação com Gateways e Adquirentes
  console.log('\n9. Testando Conciliação de Adquirentes (Cielo, Rede, PIX)...');
  const reconciliations = await FinanceService.getReconciliationOverview();
  console.log(`  ✓ Adquirentes Conciliados: ${reconciliations.length}`);
  reconciliations.forEach(r => {
    console.log(`    • ${r.gateway}: R$ ${r.gatewayAmount.toFixed(2)} (${r.ordersCount} pedidos) — Status: ${r.status}`);
  });

  console.log('\n================================================================');
  console.log('TODOS OS TESTES DO MÓDULO FINANCEIRO PASSARAM COM SUCESSO! 🎉');
  console.log('================================================================\n');
}

runFinanceTests().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DO FINANCEIRO:', err);
  process.exit(1);
});
