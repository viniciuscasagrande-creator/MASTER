import { EventTeamService } from '../src/modules/events/team/event-team.service';
import { TeamSchedulingService } from '../src/modules/events/team/team-scheduling.service';
import { ResponsibilityService } from '../src/modules/events/team/responsibility.service';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.7: EQUIPE E ESCALAS DO EVENTO');
  console.log('======================================================\n');

  const eventId = 'evt_1001';

  // 1. Listagem de equipes funcionais do evento
  console.log('1. Testando listagem de equipes funcionais...');
  const teams = await EventTeamService.listTeams(eventId);
  if (!teams || teams.length === 0) throw new Error('Nenhuma equipe encontrada para o evento');
  console.log(`✓ Teste 1 passou! ${teams.length} equipes encontradas (${teams.map(t => t.name).join(', ')}).\n`);

  // 2. Cadastro de novos membros na equipe
  console.log('2. Testando cadastro de membros da equipe operacional...');
  const boxOfficeTeam = teams.find(t => t.name.includes('Bilheteria')) || teams[0];
  const newMember = await EventTeamService.addMember(eventId, {
    name: 'Juliana Paes de Oliveira',
    email: 'juliana.bilheteria@diskingressos.com.br',
    phone: '(41) 98765-4321',
    roleName: 'Operadora de Caixa',
    teamId: boxOfficeTeam.id,
    emergencyContact: 'Mãe: (41) 99999-8888'
  });

  if (!newMember.id || newMember.teamId !== boxOfficeTeam.id) {
    throw new Error('Falha no cadastro do membro');
  }
  console.log(`✓ Teste 2 passou! Membro cadastrado: ${newMember.name} (${newMember.roleName}) na equipe ${boxOfficeTeam.name}.\n`);

  // 3. Verificação do desacoplamento arquitetural (Membro NÃO concede RBAC)
  console.log('3. Testando invariante arquitetural: Papel operacional desacoplado de RBAC...');
  // O cadastro do membro armazena metadados operacionais e de contato de emergência,
  // mas o membro operacional não possui papéis ou permissões sistêmicas automáticas.
  if ((newMember as any).permissions || (newMember as any).roles) {
    throw new Error('Invariante violada: Papel operacional não pode conceder RBAC automaticamente!');
  }
  console.log('✓ Teste 3 passou! Invariante confirmada: papéis de equipe não conferem credenciais ou privilégios sistêmicos.\n');

  // 4. Criação de turnos de trabalho
  console.log('4. Testando criação de turnos e escalas...');
  const shift1 = await TeamSchedulingService.createShift(eventId, {
    teamId: boxOfficeTeam.id,
    sessionId: 'ses_1001_1',
    name: 'Turno Abertura e Venda Presencial',
    startAt: '2026-11-14T14:00:00.000Z',
    endAt: '2026-11-14T19:00:00.000Z',
    assignedMemberIds: [newMember.id]
  });

  if (!shift1.id || shift1.name !== 'Turno Abertura e Venda Presencial') {
    throw new Error('Falha ao criar turno 1');
  }
  console.log(`✓ Teste 4 passou! Turno criado com sucesso (${shift1.name}), membro alocado: ${newMember.name}.\n`);

  // 5. Criação de segundo turno conflitante no mesmo horário
  console.log('5. Testando detecção de conflitos de horário entre turnos...');
  const accessTeam = teams.find(t => t.name.includes('Acesso') || t.id !== boxOfficeTeam.id) || teams[0];
  const shift2 = await TeamSchedulingService.createShift(eventId, {
    teamId: accessTeam.id,
    sessionId: 'ses_1001_1',
    name: 'Turno Monitoria de Catracas',
    startAt: '2026-11-14T16:00:00.000Z', // Sobrepõe com o Turno 1 (14:00 às 19:00)
    endAt: '2026-11-14T21:00:00.000Z'
  });

  // Tenta alocar a mesma operadora no turno sobreposto
  const assignmentResult = await TeamSchedulingService.assignMembersToShift(eventId, shift2.id, [newMember.id]);

  if (assignmentResult.conflicts.length === 0 || assignmentResult.assignedCount > 0) {
    throw new Error('Falha na detecção de conflito: sistema permitiu alocar membro no mesmo horário em dois turnos diferentes!');
  }

  const conflict = assignmentResult.conflicts[0];
  console.log(`✓ Teste 5 passou! Conflito detectado com sucesso: "${conflict.message}".\n`);

  // 6. Atribuição de Responsabilidades Operacionais
  console.log('6. Testando formalização de responsabilidades operacionais...');
  const resp = await ResponsibilityService.assignResponsibility(eventId, {
    memberId: newMember.id,
    responsibilityType: 'BOX_OFFICE_LEAD',
    title: 'Supervisora Geral de Fechamento de Caixa',
    scope: 'SESSION',
    scopeId: 'ses_1001_1',
    notes: 'Responsável pela conferência diária da sangria e conciliação de maquininhas'
  });

  if (!resp.id || resp.responsibilityType !== 'BOX_OFFICE_LEAD') {
    throw new Error('Falha ao atribuir responsabilidade operacional');
  }

  const list = await ResponsibilityService.listResponsibilities(eventId);
  const found = list.find(r => r.id === resp.id);
  if (!found || found.memberName !== newMember.name) {
    throw new Error('Responsabilidade não listada corretamente');
  }
  console.log(`✓ Teste 6 passou! Responsabilidade "${resp.title}" vinculada ao membro ${newMember.name}.\n`);

  console.log('======================================================');
  console.log('TODOS OS 6 TESTES DE EQUIPE E ESCALAS PASSARAM! ✓');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('FALHA NOS TESTES DE EQUIPE:', err);
  process.exit(1);
});
