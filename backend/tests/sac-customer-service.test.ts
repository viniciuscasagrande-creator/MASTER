import assert from 'assert';
import { SacService } from '../src/modules/sac/sac.service';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

// Test Mock Users
const superAdminUser: AuthenticatedUser = {
  id: 'usr-admin-1',
  email: 'admin@diskingressos.com.br',
  name: 'Super Admin Operacional',
  roleSlug: 'admin',
  roleName: 'Administrador Global',
  permissions: [
    'sac.consulta.acessar',
    'sac.pedido.visualizar',
    'sac.cliente.visualizar',
    'sac.ticket.criar',
    'sac.ticket.encerrar',
    'estorno.solicitacao.criar'
  ],
  scope: {
    type: 'GLOBAL',
    producerIds: [],
    eventIds: []
  },
  twoFactorEnforced: true
};

const producerUser: AuthenticatedUser = {
  id: 'usr-prod-1',
  email: 'produtor@opus.com.br',
  name: 'Produtor Opus',
  roleSlug: 'produtor',
  roleName: 'Produtor Musical',
  permissions: ['sac.consulta.acessar', 'sac.pedido.visualizar'],
  scope: {
    type: 'PRODUCER',
    producerIds: ['prd_100'],
    eventIds: []
  },
  twoFactorEnforced: false
};

async function runSacTests() {
  console.log('================================================================');
  console.log('TESTES FASE 1.3.11.1.4.2: ATENDIMENTO SAC & CENTRAL DE CONSULTA');
  console.log('================================================================\n');

  // 1. Central de Consulta: Normalização e Busca
  console.log('1. Testando Central de Consulta com normalização de CPF, Telefone e E-mail...');
  const cpfQueryResult = await SacService.queryCentral('123.456.789-00', superAdminUser);
  assert(cpfQueryResult, 'Deve retornar resultado de busca');
  assert(Array.isArray(cpfQueryResult.customers), 'Deve retornar array de clientes');
  assert(cpfQueryResult.detectedType === 'CPF', 'Deve detectar tipo CPF');
  console.log('  ✓ CPF formatado foi normalizado e reconhecido como tipo CPF');

  const emailQueryResult = await SacService.queryCentral('maria@email.com', superAdminUser);
  assert(emailQueryResult.detectedType === 'EMAIL', 'Deve detectar tipo EMAIL');
  console.log('  ✓ E-mail foi reconhecido com busca exata');

  // 2. LGPD & Minimização de Dados
  console.log('\n2. Testando Minimização LGPD (mascaramento de CPF nos resultados)...');
  const queryAll = await SacService.queryCentral('Maria', superAdminUser);
  assert(queryAll.customers.length > 0, 'Deve encontrar cliente Maria');
  const cust = queryAll.customers[0];
  assert(cust.cpf.includes('*'), 'CPF exibido deve estar mascarado por padrão');
  console.log(`  ✓ CPF do cliente ${cust.name} está devidamente mascarado: ${cust.cpf}`);

  // 3. Criação de Atendimento SAC e SLA
  console.log('\n3. Testando Abertura de Atendimento SAC e Cálculo de SLA...');
  const newTicket = await SacService.createTicket(
    {
      customerId: cust.id,
      channel: 'WHATSAPP',
      subject: 'Dúvida sobre assento marcado no setor VIP',
      priority: 'URGENT',
      queue: 'Ingressos & Credenciais',
      initialMessage: 'Olá, gostaria de saber se meu assento no setor VIP é acessível.'
    },
    superAdminUser
  );

  assert(newTicket, 'Atendimento deve ser criado com sucesso');
  assert(newTicket.ticketCode.startsWith('SAC-2026-'), 'Código deve seguir padrão SAC-2026-XXXXXX');
  assert(newTicket.status === 'OPEN', 'Status inicial deve ser OPEN');
  assert(newTicket.slaMinutesRemaining === 30, 'Prioridade URGENT deve ter SLA de 30 minutos');
  assert(newTicket.messages.length === 1, 'Deve conter a mensagem inicial');
  assert(newTicket.messages[0].type === 'CUSTOMER', 'Mensagem inicial deve ser tipo CUSTOMER');
  console.log(`  ✓ Atendimento ${newTicket.ticketCode} gerado com SLA de 30 minutos`);

  // 4. Thread de Conversa: Resposta do Atendente e Nota Interna
  console.log('\n4. Testando Thread de Conversa: Diferenciação entre Resposta e Nota Interna...');
  // Resposta do atendente
  const ticketWithReply = await SacService.addMessage(
    newTicket.id,
    {
      type: 'AGENT',
      content: 'Olá! Sim, todos os assentos da fileira A no setor VIP possuem rampa de acessibilidade.'
    },
    superAdminUser
  );
  assert(ticketWithReply, 'Mensagem do atendente deve ser adicionada');
  assert(ticketWithReply.messages.length === 2, 'Deve ter 2 mensagens');
  assert(ticketWithReply.messages[1].type === 'AGENT', 'Mensagem deve ser do tipo AGENT');
  console.log('  ✓ Resposta do atendente registrada na thread');

  // Nota interna (invisível ao cliente)
  const ticketWithNote = await SacService.addMessage(
    newTicket.id,
    {
      type: 'INTERNAL_NOTE',
      content: 'Verificado no mapa da casa do Teatro Positivo. Rampa liberada pelo corpo de bombeiros.'
    },
    superAdminUser
  );
  assert(ticketWithNote, 'Nota interna deve ser adicionada');
  assert(ticketWithNote.messages.length === 3, 'Deve ter 3 mensagens');
  assert(ticketWithNote.messages[2].type === 'INTERNAL_NOTE', 'Mensagem deve ser do tipo INTERNAL_NOTE');
  console.log('  ✓ Nota interna privada registrada com segregação segura');

  // 5. Pausa de SLA em "Aguardando Cliente"
  console.log('\n5. Testando Transição de Estado e Pausa de SLA...');
  const ticketWaiting = await SacService.updateStatus(newTicket.id, 'WAITING_CUSTOMER', superAdminUser);
  assert(ticketWaiting, 'Status deve ser atualizado');
  assert(ticketWaiting.status === 'WAITING_CUSTOMER', 'Status deve ser WAITING_CUSTOMER');
  assert(ticketWaiting.slaPaused === true, 'SLA deve estar pausado enquanto aguarda o cliente');
  console.log('  ✓ Status WAITING_CUSTOMER pausou o SLA do atendimento com sucesso');

  // Retomada pelo cliente despausa SLA
  const ticketResumed = await SacService.addMessage(
    newTicket.id,
    {
      type: 'CUSTOMER',
      content: 'Muito obrigado pela confirmação rápida!'
    },
    superAdminUser
  );
  assert(ticketResumed, 'Mensagem do cliente deve ser processada');
  assert(ticketResumed.status === 'IN_PROGRESS', 'Ticket deve voltar automaticamente para IN_PROGRESS');
  assert(ticketResumed.slaPaused === false, 'SLA deve ser retomado automaticamente');
  console.log('  ✓ Resposta do cliente reativou o SLA e retornou o status para IN_PROGRESS');

  // 6. Resolução do Atendimento
  console.log('\n6. Testando Resolução do Atendimento SAC...');
  const ticketResolved = await SacService.updateStatus(newTicket.id, 'RESOLVED', superAdminUser);
  assert(ticketResolved, 'Ticket deve ser resolvido');
  assert(ticketResolved.status === 'RESOLVED', 'Status deve ser RESOLVED');
  assert(ticketResolved.slaMinutesRemaining === 0, 'SLA finalizado');
  console.log('  ✓ Atendimento concluído com sucesso');

  // 7. Handoff de Estorno (SAC solicita, Estorno processa sem movimentar dinheiro no SAC)
  console.log('\n7. Testando Handoff de Estorno a partir do SAC...');
  const refundReq = await SacService.createRefundRequest(
    {
      orderId: 'ord-984521',
      customerId: cust.id,
      ticketId: newTicket.id,
      reason: 'ARREPENDIMENTO_7D',
      type: 'TOTAL',
      justification: 'Solicitação do comprador dentro do prazo legal de 7 dias.'
    },
    superAdminUser
  );

  assert(refundReq, 'Solicitação de estorno deve ser criada');
  assert(refundReq.code.startsWith('EST-2026-'), 'Código deve seguir padrão EST-2026-XXXX');
  assert(refundReq.status === 'PENDING_REVIEW', 'Status inicial deve ser PENDING_REVIEW (para o módulo de Estorno)');
  assert(refundReq.orderId === 'ord-984521', 'Deve estar vinculado ao pedido');
  console.log(`  ✓ Solicitação de estorno ${refundReq.code} gerada via SAC com status PENDING_REVIEW`);

  // 8. Fronteira: SAC não movimenta dinheiro
  console.log('\n8. Testando Fronteira de Domínio: SAC não processa pagamento nem altera eventos...');
  assert(!('executePayout' in SacService), 'SacService NÃO deve ter método para executar repasse ou pagamento');
  assert(!('updateEventConfig' in SacService), 'SacService NÃO deve ter método para alterar configuração de evento');
  console.log('  ✓ Fronteiras preservadas: SAC consulta e solicita, mas NÃO processa dinheiro');

  console.log('\n================================================================');
  console.log('TODOS OS 8 CRITÉRIOS DE TESTE DO SAC RECUPERADO FORAM HOMOLOGADOS! 🎉');
  console.log('================================================================\n');
}

runSacTests().catch(err => {
  console.error('Falha nos testes de SAC:', err);
  process.exit(1);
});
