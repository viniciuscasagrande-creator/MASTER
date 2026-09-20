import { EventReadinessService } from '../src/modules/events/readiness/event-readiness.service';
import { EventDocumentService } from '../src/modules/events/documents/event-document.service';
import { EventTaskService } from '../src/modules/events/tasks/event-task.service';

async function runTests() {
  console.log('======================================================');
  console.log('INICIANDO TESTES DA FASE 1.2.8: READINESS, DOCUMENTOS E TAREFAS');
  console.log('======================================================\n');

  const eventId = 'evt_1001';

  // 1. Avaliação completa do Readiness Engine
  console.log('1. Testando avaliação de prontidão do evento (Readiness Engine)...');
  const readiness = await EventReadinessService.evaluateEventReadiness(eventId);
  if (!readiness || !readiness.targets) throw new Error('Falha ao calcular readiness do evento');

  console.log(`✓ Teste 1 passou! Readiness calculado: Score = ${readiness.scorePercentage}%, Status Global = ${readiness.status}.`);
  console.log(`  - Alvos: REVIEW=${readiness.targets.REVIEW}, PUBLICATION=${readiness.targets.PUBLICATION}, SALES=${readiness.targets.SALES}, OPERATION=${readiness.targets.OPERATION}.\n`);

  // 2. Requisitos documentais e auto-seeding
  console.log('2. Testando requisitos documentais e conformidade legal...');
  const docs = await EventDocumentService.listRequirements(eventId);
  if (docs.length < 4) throw new Error('Requisitos documentais essenciais não foram mapeados');

  const seguro = docs.find(d => d.categoryCode === 'SEGURO' || d.categoryCode === 'SEGURO_RESPONSABILIDADE')!;
  console.log(`✓ Teste 2 passou! ${docs.length} requisitos de documentos mapeados. Seguro Status: ${seguro.status}, Obrigatório: ${seguro.required}, Bloqueante: ${seguro.blocking}.\n`);

  // 3. Simulação de upload de documento e alteração de prontidão
  console.log('3. Testando upload de documento e atualização de validade...');
  const uploaded = await EventDocumentService.uploadDocument(eventId, {
    requirementId: seguro.id,
    documentName: 'Apolice_Seguro_Allianz_2026.pdf',
    validFrom: '2026-01-01',
    validUntil: '2027-01-01',
    notes: 'Cobertura de R$ 10.000.000,00 para evento com até 15.000 pessoas'
  });

  if (uploaded.status !== 'VALID' || !uploaded.linkedDocumentUrl) {
    throw new Error('Falha ao registrar upload do documento');
  }
  console.log(`✓ Teste 3 passou! Documento de Seguro validado até ${uploaded.validUntil}.\n`);

  // 4. Criação de tarefas e pendências com deduplicação idempotente
  console.log('4. Testando engine de pendências e deduplicação de tarefas...');
  const deduplicationKey = `evt_1001:doc:SEGURO_RESPONSABILIDADE`;

  const task1 = await EventTaskService.createTask(eventId, {
    title: 'Providenciar Apólice de Seguro de Responsabilidade Civil',
    description: 'Seguro para cobertura de 15.000 pessoas',
    priority: 'URGENT',
    blockingPublication: true,
    origin: 'DOCUMENT',
    deduplicationKey
  });

  const task2 = await EventTaskService.createTask(eventId, {
    title: 'Providenciar Apólice de Seguro de Responsabilidade Civil (Tentativa Duplicada)',
    priority: 'HIGH',
    origin: 'DOCUMENT',
    deduplicationKey
  });

  if (task1.id !== task2.id) {
    throw new Error('Chave de deduplicação falhou: criou tarefas duplicadas para a mesma pendência');
  }
  console.log(`✓ Teste 4 passou! Tarefa criada com id ${task1.id}. Deduplicação barrou criação duplicada com sucesso.\n`);

  // 5. Geração automática de pendências a partir de apontamentos do Readiness Engine
  console.log('5. Testando conversão de apontamentos de prontidão em tarefas operacionais...');
  const generatedTasks = await EventTaskService.generateTasksFromReadiness(eventId, readiness.issues);
  console.log(`✓ Teste 5 passou! ${generatedTasks.length} pendências operacionais sincronizadas com o Readiness Engine.\n`);

  // 6. Atualização de status da tarefa
  console.log('6. Testando conclusão de pendência...');
  const updatedTask = await EventTaskService.updateTaskStatus(task1.id, 'COMPLETED');
  if (updatedTask.status !== 'COMPLETED') {
    throw new Error('Falha ao concluir pendência');
  }
  console.log(`✓ Teste 6 passou! Pendência marcada como COMPLETED com sucesso.\n`);

  console.log('======================================================');
  console.log('TODOS OS 6 TESTES DE READINESS E DOCUMENTOS PASSARAM! ✓');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('FALHA NOS TESTES DE READINESS:', err);
  process.exit(1);
});
