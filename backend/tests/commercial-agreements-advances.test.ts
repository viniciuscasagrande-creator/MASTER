import { EventAgreementService } from '../src/modules/commercial/agreements/event-agreement.service';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runCommercialAgreementsAdvancesTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.11.1.3: ACORDOS COMERCIAIS, ANTECIPAÇÕES & REEMISSÃO');
  console.log('================================================================\n');

  const testEventId = 'evt-test-commercial-101';
  const mockUser = { id: 'user-admin-1', name: 'Vinicius Casagrande' };

  console.log('1. Testando obtenção de acordo comercial padrão de evento (versão 1 ativa)...');
  const agreement = await EventAgreementService.getAgreement(testEventId);
  assert(agreement !== undefined && agreement !== null, 'Acordo deve ser retornado');
  assert(agreement.eventId === testEventId, 'Event ID deve corresponder');
  assert(agreement.currentVersion === 1, 'Versão inicial deve ser 1');
  assert(agreement.status === 'ativo', 'Status deve ser ativo');
  assert(agreement.activeVersion !== null, 'Versão ativa deve existir');
  assert(agreement.activeVersion?.serviceFeeType === 'percentage', 'Tipo padrão de taxa deve ser percentual');
  assert(agreement.activeVersion?.serviceFeeBps === 1000, 'Taxa padrão deve ser 1000 bps (10.0%)');
  assert(agreement.activeVersion?.serviceFeePaidBy === 'buyer', 'Pagador padrão deve ser o comprador');
  assert(agreement.versions.length === 1, 'Deve ter exatamente 1 versão no histórico');
  assert(agreement.auditLogs.length >= 1, 'Deve ter ao menos 1 log de auditoria');

  console.log('\n2. Testando validação de justificativa obrigatória para auditoria...');
  let errorCaught = false;
  try {
    await EventAgreementService.saveAgreement(
      testEventId,
      { serviceFeeBps: 1200, changeReason: '' },
      mockUser
    );
  } catch (err: any) {
    errorCaught = true;
    assert(err.message.includes('changeReason'), 'Deve exigir justificativa');
  }
  assert(errorCaught, 'Deve falhar se changeReason estiver vazio');

  console.log('\n3. Testando validação de limites de taxa percentual (max 50% / 5000 bps)...');
  errorCaught = false;
  try {
    await EventAgreementService.saveAgreement(
      testEventId,
      { serviceFeeBps: 6000, changeReason: 'Taxa acima de 50%' },
      mockUser
    );
  } catch (err: any) {
    errorCaught = true;
    assert(err.message.includes('0% e 50%'), 'Deve validar teto de 5000 bps');
  }
  assert(errorCaught, 'Deve falhar se a taxa exceder 50%');

  console.log('\n4. Testando atualização de condições gerando versão 2 imutável com auditoria...');
  const { agreement: updatedAgr, newVersion } = await EventAgreementService.saveAgreement(
    testEventId,
    {
      serviceFeeBps: 1250, // 12.5%
      serviceFeePaidBy: 'producer',
      spreadEnabled: true,
      spreadBps: 200, // 2.0%
      advancedEnabled: true,
      advancedRateBps: 250, // 2.5%
      advancedMaxPercent: 70,
      payoutTermsDays: 3,
      payoutModel: 'pos_evento',
      contractNumber: 'CTR-TEST-2026',
      changeReason: 'Negociação de contrato com grande produtor'
    },
    mockUser
  );

  assert(updatedAgr.currentVersion === 2, 'Versão atual deve ser 2');
  assert(newVersion.version === 2, 'Nova versão emitida deve ser a número 2');
  assert(newVersion.status === 'ativa', 'Nova versão deve estar ativa');
  assert(newVersion.serviceFeeBps === 1250, 'Taxa deve ser 1250 bps');
  assert(newVersion.serviceFeePaidBy === 'producer', 'Pagador deve ser o produtor');
  assert(newVersion.spreadEnabled === true, 'Spread deve estar habilitado');
  assert(newVersion.advancedEnabled === true, 'Antecipação deve estar habilitada');
  assert(newVersion.contractNumber === 'CTR-TEST-2026', 'Número do contrato deve persistir');

  const prevVersion = updatedAgr.versions.find(v => v.version === 1);
  assert(prevVersion?.status === 'substituida', 'Versão 1 deve estar marcada como substituída');

  const auditLog = updatedAgr.auditLogs[0];
  assert(auditLog.action === 'update_fee_conditions', 'Ação do log deve ser update_fee_conditions');
  assert(auditLog.actorName === 'Vinicius Casagrande', 'Nome do autor deve ser registrado');
  assert(auditLog.reason === 'Negociação de contrato com grande produtor', 'Motivo deve ser registrado');

  console.log('\n5. Testando solicitação de antecipação (Advanced) e cálculo financeiro...');
  const advance = await EventAgreementService.requestAdvance(
    testEventId,
    10000000, // R$ 100.000,00
    mockUser,
    'Adiantamento para produção de palco'
  );

  assert(advance !== null && advance !== undefined, 'Operação de antecipação deve ser criada');
  assert(advance.code.startsWith('ADV-'), 'Código deve ter prefixo ADV-');
  assert(advance.status === 'solicitada', 'Status inicial deve ser solicitada');
  assert(advance.requestedCents === 10000000, 'Valor solicitado deve ser R$ 100.000,00 em centavos');
  assert(advance.advanceRateBps === 250, 'Taxa deve ser 250 bps (2.5%)');
  assert(advance.costCents === 250000, 'Custo deve ser R$ 2.500,00');
  assert(advance.netTransferredCents === 9750000, 'Valor líquido deve ser R$ 97.500,00');

  const advancesList = await EventAgreementService.listAdvances(testEventId);
  assert(advancesList.length >= 1, 'Deve listar a antecipação criada');
  assert(advancesList[0].id === advance.id, 'ID da antecipação listada deve coincidir');

  console.log('\n6. Testando bloqueio de antecipação que exceda o teto percentual permitido...');
  errorCaught = false;
  try {
    await EventAgreementService.requestAdvance(
      testEventId,
      100000000000, // Valor astronômico
      mockUser,
      'Tentativa de estourar teto'
    );
  } catch (err: any) {
    errorCaught = true;
    assert(err.message.includes('excede o teto permitido'), 'Deve acusar estouro de teto percentual');
  }
  assert(errorCaught, 'Deve rejeitar antecipação acima do limite');

  console.log('\n7. Testando reemissão de credencial de ingresso com revogação do QR anterior...');
  const reissueResult = await EventAgreementService.reissueTicket(
    'item-ticket-888',
    'Cliente perdeu acesso ao voucher impresso',
    mockUser
  );

  assert(reissueResult.success === true, 'Reemissão deve ser bem-sucedida');
  assert(reissueResult.newCredentialQr.startsWith('QR-'), 'Nova credencial deve ter prefixo QR-');
  assert(reissueResult.message.includes('invalidada nas catracas'), 'Mensagem deve confirmar revogação anterior');

  console.log('\n================================================================');
  console.log('TODOS OS TESTES DO COMERCIAL RECUPERADO FORAM CONCLUÍDOS COM SUCESSO! 🎉');
  console.log('================================================================\n');
}

runCommercialAgreementsAdvancesTests().catch(err => {
  console.error('Falha nos testes de acordos comerciais:', err);
  process.exit(1);
});
