import { FinanceService } from '../src/modules/finance/finance.service';
import { SecurityService } from '../src/modules/security/security.service';

async function runComprehensiveFinanceTests() {
  console.log('========================================================================');
  console.log('FASE 1.3.11.1.4.4: SUITE DE TESTES INTEGRADOS DO MÓDULO FINANCEIRO (DISK)');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FALHA: ${testName} ${details ? `(${details})` : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    } else {
      passedTests++;
      console.log(`  ✓ ${testName} ${details ? `[${details}]` : ''}`);
    }
  }

  // -----------------------------------------------------------------------------
  // TESTE 1: Resumo Factual do Produtor
  // -----------------------------------------------------------------------------
  console.log('--- TESTE 1: Resumo Executivo e Saldos Factuais ---');
  const summary = await FinanceService.getProducerSummary({ producerId: 'prd_100' });
  assert(summary.grossSales > 0, 'Vendas brutas devem ser factualmente maiores que zero', `R$ ${summary.grossSales}`);
  assert(summary.availableBalance > 0, 'Saldo disponível deve ser estritamente positivo', `R$ ${summary.availableBalance}`);
  assert(summary.diskFeeRetained > 0, 'Taxa da plataforma retida calculada', `R$ ${summary.diskFeeRetained}`);

  // -----------------------------------------------------------------------------
  // TESTE 2: Saldos Segregados por Evento
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 2: Segregação de Saldos por Evento ---');
  const initialBalances = await FinanceService.getEventBalances('prd_100');
  assert(initialBalances.length >= 2, 'Deve haver pelo menos dois eventos com movimentação');
  const evOrigem = initialBalances[0];
  const evDestino = initialBalances[1];
  console.log(`  Origem: ${evOrigem.eventTitle} (Disp: R$ ${evOrigem.availableBalance})`);
  console.log(`  Destino: ${evDestino.eventTitle} (Disp: R$ ${evDestino.availableBalance})`);

  // -----------------------------------------------------------------------------
  // TESTE 3: Regra SafeSaff — Transferência Direta entre Eventos
  // Caso de Teste Exato: Evento X transfere R$ 500 para Evento Y
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 3: Transferência Direta entre Eventos (Fluxo SafeSaff) ---');
  const balanceBeforeOrigin = evOrigem.availableBalance;
  const balanceBeforeDest = evDestino.availableBalance;
  const transferAmount = 500.00;

  const transfer = await FinanceService.createTransfer({
    producerId: 'prd_100',
    fromEventId: evOrigem.eventId,
    toEventId: evDestino.eventId,
    amount: transferAmount,
    reason: 'Adiantamento emergencial de custos técnicos de som e iluminação'
  }, 'Vinicius Gestor');

  assert(transfer.status === 'COMPLETED', 'Transferência <= R$ 50.000 deve ser concluída imediatamente', transfer.status);
  assert(transfer.amount === 500.00, 'Valor transferido confere com solicitação', `R$ ${transfer.amount}`);
  assert(transfer.fromEventId === evOrigem.eventId, 'Evento de origem registrado corretamente');
  assert(transfer.toEventId === evDestino.eventId, 'Evento de destino registrado corretamente');

  // Verificar reflexo nos saldos dos eventos
  const balancesAfterTransfer = await FinanceService.getEventBalances('prd_100');
  const originAfter = balancesAfterTransfer.find(e => e.eventId === evOrigem.eventId)!;
  const destAfter = balancesAfterTransfer.find(e => e.eventId === evDestino.eventId)!;

  assert(
    Math.abs(originAfter.availableBalance - (balanceBeforeOrigin - transferAmount)) < 0.01,
    'Saldo do evento de origem deduzido corretamente (- R$ 500)',
    `Antes: ${balanceBeforeOrigin} -> Depois: ${originAfter.availableBalance}`
  );
  assert(
    Math.abs(destAfter.availableBalance - (balanceBeforeDest + transferAmount)) < 0.01,
    'Saldo do evento de destino creditado corretamente (+ R$ 500)',
    `Antes: ${balanceBeforeDest} -> Depois: ${destAfter.availableBalance}`
  );
  assert(originAfter.transfersOut === transferAmount, 'Controle de saídas do evento atualizado');
  assert(destAfter.transfersIn === transferAmount, 'Controle de entradas do evento atualizado');

  // -----------------------------------------------------------------------------
  // TESTE 4: Reversão Compensatória de Transferência (Preservação de Histórico)
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 4: Reversão de Transferência com Compensação Contábil ---');
  const reversal = await FinanceService.revertTransfer({
    transferId: transfer.id,
    reason: 'Cancelamento de necessidade operacional pelo produtor'
  }, 'Auditor Financeiro');

  assert(reversal.status === 'REVERTED', 'Status da transferência original atualizado para REVERTED');
  assert(Boolean(reversal.reversalTransferId), 'Transferência compensatória reversa gerada', reversal.reversalTransferId);

  // Verificar restauração exata dos saldos
  const balancesAfterReversal = await FinanceService.getEventBalances('prd_100');
  const originRestored = balancesAfterReversal.find(e => e.eventId === evOrigem.eventId)!;
  const destRestored = balancesAfterReversal.find(e => e.eventId === evDestino.eventId)!;

  assert(
    Math.abs(originRestored.availableBalance - balanceBeforeOrigin) < 0.01,
    'Saldo de origem restaurado integralmente após compensação',
    `Atual: ${originRestored.availableBalance} == Inicial: ${balanceBeforeOrigin}`
  );
  assert(
    Math.abs(destRestored.availableBalance - balanceBeforeDest) < 0.01,
    'Saldo de destino restaurado integralmente após compensação',
    `Atual: ${destRestored.availableBalance} == Inicial: ${balanceBeforeDest}`
  );

  // -----------------------------------------------------------------------------
  // TESTE 5: Maker-Checker e Alçadas para Valores Altos (> R$ 50.000)
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 5: Alçada de Segurança Maker-Checker (> R$ 50.000) ---');
  const highAmount = 60000.00;
  if (originRestored.availableBalance >= highAmount) {
    const highTransfer = await FinanceService.createTransfer({
      producerId: 'prd_100',
      fromEventId: evOrigem.eventId,
      toEventId: evDestino.eventId,
      amount: highAmount,
      reason: 'Remanejamento de alto vulto para atração internacional'
    }, 'Vinicius Operador');

    assert(highTransfer.status === 'PENDING_APPROVAL', 'Transferência > R$ 50.000 entra em PENDING_APPROVAL', highTransfer.status);

    // Violação de segregação de funções: Solicitante não pode aprovar
    try {
      await FinanceService.approveTransfer(highTransfer.id, 'Vinicius Operador');
      assert(false, 'Deveria bloquear auto-aprovação');
    } catch (err: any) {
      assert(err.statusCode === 403, 'Bloqueio de auto-aprovação cumprido (Segregação de Funções)', err.message);
    }

    // Aprovação formal com Step-Up de Diretoria
    const approverUserId = 'usr_dir_01';
    const stepUpToken = SecurityService.issueStepUpToken(approverUserId, 5);
    const approvedTransfer = await FinanceService.approveTransfer(
      highTransfer.id,
      'Maria Oliveira (Diretora)',
      stepUpToken,
      approverUserId
    );
    assert(approvedTransfer.status === 'COMPLETED', 'Transferência aprovada com sucesso com token Step-Up');
  }

  // -----------------------------------------------------------------------------
  // TESTE 6: Bloqueio de Transferência Inválida (Origem == Destino / Saldo Insuficiente)
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 6: Validações de Borda (Saldo Insuficiente e Origem == Destino) ---');
  try {
    await FinanceService.createTransfer({
      producerId: 'prd_100',
      fromEventId: evOrigem.eventId,
      toEventId: evOrigem.eventId,
      amount: 100,
      reason: 'Origem igual destino'
    }, 'Operador');
    assert(false, 'Deveria barrar transferência para o mesmo evento');
  } catch (err: any) {
    assert(err.statusCode === 400, 'Barrada transferência com evento de origem igual ao destino');
  }

  try {
    await FinanceService.createTransfer({
      producerId: 'prd_100',
      fromEventId: evOrigem.eventId,
      toEventId: evDestino.eventId,
      amount: 999999999,
      reason: 'Valor absurdo'
    }, 'Operador');
    assert(false, 'Deveria barrar transferência com valor superior ao saldo disponível');
  } catch (err: any) {
    assert(err.statusCode === 400, 'Barrada transferência com saldo insuficiente');
  }

  // -----------------------------------------------------------------------------
  // TESTE 7: Gestão de Contas a Pagar e Contas a Receber
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 7: Contas a Pagar & Receber ---');
  const receivables = await FinanceService.listReceivables({ producerId: 'prd_100' });
  assert(receivables.length > 0, 'Recebíveis de cartão/PIX listados corretamente', `${receivables.length} recebíveis`);

  const newPayable = await FinanceService.createPayable({
    producerId: 'prd_100',
    eventId: evOrigem.eventId,
    beneficiary: 'Locadora de Som Master',
    category: 'Infraestrutura',
    costCenter: 'Produção',
    amount: 12500.00,
    dueDate: '2026-10-05',
    paymentMethod: 'BOLETO'
  }, 'Gestor Operacional');

  assert(newPayable.status === 'A_PAGAR', 'Nova conta a pagar criada com status A_PAGAR');

  const paidPayable = await FinanceService.payPayable(newPayable.id, 'Operador Financeiro', 'AUTH-BRADESCO-998822');
  assert(paidPayable.status === 'PAGO', 'Conta a pagar baixada com sucesso com código de autenticação bancária');

  // -----------------------------------------------------------------------------
  // TESTE 8: Tesouraria, Fluxo de Caixa e DRE Gerencial
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 8: Tesouraria, Fluxo de Caixa & DRE Gerencial ---');
  const bankAccounts = await FinanceService.listBankAccounts('prd_100');
  assert(bankAccounts.length > 0, 'Contas bancárias homologadas listadas');
  assert(bankAccounts.some(b => b.isDefault), 'Existe conta padrão configurada');

  const cashFlow = await FinanceService.getCashFlow({ producerId: 'prd_100' });
  assert(cashFlow.length > 0, 'Fluxo de caixa consolidado gerado com sucesso');
  assert(cashFlow[0].finalBalance > 0, 'Saldo acumulado positivo no período');

  const dre = await FinanceService.getManagementDRE({ producerId: 'prd_100' });
  assert(dre.grossTicketRevenue > 0, 'Receita bruta de ingressos no DRE');
  assert(dre.netTicketRevenue === Number((dre.grossTicketRevenue - dre.ticketingServiceFees).toFixed(2)), 'Cálculo de receita líquida consistente');
  assert(dre.netOperationalResult > 0, 'Resultado operacional líquido apurado com sucesso');

  // -----------------------------------------------------------------------------
  // TESTE 9: Extrato Analítico da Conta Corrente
  // -----------------------------------------------------------------------------
  console.log('\n--- TESTE 9: Extrato Analítico de Lançamentos ---');
  const statement = await FinanceService.getAccountStatement({ producerId: 'prd_100' });
  assert(statement.length > 0, 'Extrato contém lançamentos cronológicos');
  assert(statement.some(t => t.type === 'TRANSFER_IN' || t.type === 'TRANSFER_OUT' || t.type === 'SALE'), 'Extrato reflete lançamentos de venda e transferências');

  console.log('\n========================================================================');
  console.log(`✅ SUCESSO TOTAL: ${passedTests}/${totalTests} TESTES EXECUTADOS COM 100% DE ÊXITO`);
  console.log('========================================================================\n');
}

runComprehensiveFinanceTests().catch((err) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES FINANCEIROS:', err);
  process.exit(1);
});
