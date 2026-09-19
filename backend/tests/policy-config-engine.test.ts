import { prisma } from '../src/core/database/prisma';
import { runSeed } from '../prisma/seed';
import { ConfigurationService } from '../src/core/configuration/configuration.service';
import { ConfigurationRegistry } from '../src/core/configuration/configuration.registry';
import { ConfigurationCacheService } from '../src/core/configuration/configuration-cache.service';
import { EffectiveConfigService } from '../src/core/configuration/effective-config.service';
import { PolicyEngineService } from '../src/core/configuration/policies/policy-engine.service';
import { PolicyEvaluatorService } from '../src/core/configuration/policies/policy-evaluator.service';
import { ConditionEvaluatorService } from '../src/core/configuration/policies/condition-evaluator.service';
import { PolicyConflictService } from '../src/core/configuration/policies/policy-conflict.service';
import { PolicySimulatorService } from '../src/core/configuration/policies/policy-simulator.service';
import { VersionService } from '../src/core/configuration/versions/version.service';
import { RollbackService } from '../src/core/configuration/versions/rollback.service';
import { FeatureFlagService } from '../src/core/configuration/features/feature-flag.service';
import { SearchService } from '../src/modules/search/search.service';
import { DomainEvents } from '../src/events/DomainEvents';
import { AuthenticatedUser } from '../src/core/middleware/authenticate';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (detail) console.error(`     Detalhe: ${detail}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.11 — MOTOR DE REGRAS E POLÍTICAS');
  console.log('================================================================\n');

  // Inicializa banco de dados e sementes
  await runSeed();

  // Usuários de Teste com Perfis e Escopos
  const userAdmin: AuthenticatedUser = {
    id: 'usr_superadmin',
    name: 'Vinicius Casagrande (Admin Geral)',
    email: 'admin@diskingressos.com.br',
    roles: ['ADMINISTRADOR_GERAL'],
    permissions: [
      'configuracoes.central.visualizar',
      'configuracoes.parametro.visualizar',
      'configuracoes.parametro.editar',
      'configuracoes.politica.visualizar',
      'configuracoes.politica.criar',
      'configuracoes.politica.editar',
      'configuracoes.politica.ativar',
      'configuracoes.politica.rollback',
      'configuracoes.simulador.executar',
      'configuracoes.features.visualizar',
      'configuracoes.features.gerenciar',
      'configuracoes.auditoria.visualizar',
      'busca.global.utilizar'
    ],
    isSuperAdmin: true,
    status: 'ACTIVE',
    sessionId: 'sess_admin',
    scope: { isGlobal: true, producers: [], events: [] }
  };

  const userProdutorA: AuthenticatedUser = {
    id: 'usr_prod_opus',
    name: 'Roberto Opus (Produtor Opus)',
    email: 'roberto@opus.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'configuracoes.central.visualizar',
      'configuracoes.parametro.visualizar',
      'configuracoes.parametro.editar',
      'configuracoes.politica.visualizar',
      'configuracoes.simulador.executar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_opus',
    scope: { isGlobal: false, producers: ['prd_100'], events: ['evt_200'] }
  };

  const userProdutorB: AuthenticatedUser = {
    id: 'usr_prod_t4f',
    name: 'Luciana T4F (Produtor T4F)',
    email: 'luciana@t4f.com.br',
    roles: ['PRODUTOR'],
    permissions: [
      'configuracoes.central.visualizar',
      'configuracoes.parametro.visualizar',
      'configuracoes.parametro.editar',
      'configuracoes.politica.visualizar'
    ],
    isSuperAdmin: false,
    status: 'ACTIVE',
    sessionId: 'sess_t4f',
    scope: { isGlobal: false, producers: ['prd_200'], events: [] }
  };

  // Coleta de eventos de domínio emitidos durante os testes
  const emittedEvents: Array<{ event: string; payload: any }> = [];
  const eventNames = [
    'CONFIGURATION_UPDATED',
    'CONFIGURATION_OVERRIDE_CREATED',
    'CONFIGURATION_OVERRIDE_REMOVED',
    'POLICY_CREATED',
    'POLICY_ACTIVATED',
    'POLICY_SCHEDULED',
    'POLICY_SUPERSEDED',
    'POLICY_ROLLED_BACK',
    'POLICY_CONFLICT_DETECTED',
    'FEATURE_FLAG_UPDATED',
    'KILL_SWITCH_TRIGGERED',
    'KILL_SWITCH_RESET'
  ];

  for (const ev of eventNames) {
    DomainEvents.subscribe(ev, (payload) => {
      emittedEvents.push({ event: ev, payload });
    });
  }

  // ============================================================================
  // GRUPO 1: RESOLUÇÃO E HERANÇA HIERÁRQUICA DE CONFIGURAÇÕES (Critérios 1 a 5)
  // ============================================================================
  console.log('\n--- [1/8] Resolução e Herança Hierárquica de Configurações ---');

  // Critério 1: Resolução de configuração Global persistida no banco e fallback para defaultValue do Registry
  const resGlobal = await ConfigurationService.getEffective('finance.transfer.minimum_balance');
  const resFallback = await ConfigurationService.getEffective('task.auto_assignment.strategy');
  assert(
    resGlobal.value === 5000 && resGlobal.source === 'GLOBAL' &&
    resFallback.value === 'WORKLOAD' && resFallback.source === 'DEFAULT',
    'Critério 1: Resolução de configuração Global persistida no banco e fallback para defaultValue do Registry',
    `Global: ${resGlobal.value} (${resGlobal.source}), Fallback: ${resFallback.value} (${resFallback.source})`
  );

  // Critério 2: Override de configuração no escopo Produtor sobrepondo o valor Global
  await ConfigurationService.setOverride(
    'finance.transfer.minimum_balance',
    {
      scopeType: 'PRODUCER',
      producerId: 'prd_100',
      value: 12000,
      changeReason: 'Reserva maior exigida para Produtora Opus'
    },
    userAdmin
  );

  const resProducer = await ConfigurationService.getEffective('finance.transfer.minimum_balance', {
    producerId: 'prd_100'
  });
  assert(
    resProducer.value === 12000 && resProducer.source === 'PRODUCER' && resProducer.sourceId === 'prd_100',
    'Critério 2: Override de configuração no escopo Produtor sobrepondo o valor Global',
    `Esperado 12000 PRODUCER, obtido: ${resProducer.value} (${resProducer.source})`
  );

  // Critério 3: Override de configuração no escopo Evento sobrepondo Produtor e Global
  await ConfigurationService.setOverride(
    'finance.transfer.minimum_balance',
    {
      scopeType: 'EVENT',
      producerId: 'prd_100',
      eventId: 'evt_200',
      value: 25000,
      changeReason: 'Festival de grande porte exige retenção de 25k'
    },
    userAdmin
  );

  const resEvent = await ConfigurationService.getEffective('finance.transfer.minimum_balance', {
    producerId: 'prd_100',
    eventId: 'evt_200'
  });
  assert(
    resEvent.value === 25000 && resEvent.source === 'EVENT' && resEvent.sourceId === 'evt_200',
    'Critério 3: Override de configuração no escopo Evento sobrepondo Produtor e Global',
    `Esperado 25000 EVENT, obtido: ${resEvent.value} (${resEvent.source})`
  );

  // Critério 4: Herança de Escopo Completa (EVENT -> PRODUCER -> GLOBAL -> DEFAULT)
  const resUnchangedEvent = await ConfigurationService.getEffective('finance.transfer.minimum_balance', {
    producerId: 'prd_100',
    eventId: 'evt_999' // Evento sem override, deve herdar de prd_100
  });
  const resOtherProducer = await ConfigurationService.getEffective('finance.transfer.minimum_balance', {
    producerId: 'prd_200' // Produtor sem override, deve herdar de GLOBAL
  });
  const resPureDefault = await ConfigurationService.getEffective('task.auto_assignment.strategy', {
    producerId: 'prd_200',
    eventId: 'evt_999' // Sem override em nenhum nível, cai em DEFAULT
  });

  assert(
    resUnchangedEvent.value === 12000 &&
    resUnchangedEvent.source === 'PRODUCER' &&
    resOtherProducer.value === 5000 &&
    resOtherProducer.source === 'GLOBAL' &&
    resPureDefault.value === 'WORKLOAD' &&
    resPureDefault.source === 'DEFAULT',
    'Critério 4: Herança de Escopo Completa (EVENT -> PRODUCER -> GLOBAL -> DEFAULT) com rastreio exato',
    `resUnchangedEvent: ${resUnchangedEvent.value} (${resUnchangedEvent.source}), resOtherProducer: ${resOtherProducer.value} (${resOtherProducer.source}), resPureDefault: ${resPureDefault.value} (${resPureDefault.source})`
  );

  // Critério 5: Explicação textual humana gerada na resolução da configuração efetiva
  assert(
    typeof resEvent.explanation === 'string' &&
    resEvent.explanation.toLowerCase().includes('definido especificamente para o evento'),
    'Critério 5: Explicação textual humana gerada na resolução da configuração efetiva',
    `Explicação: ${resEvent.explanation}`
  );

  // ============================================================================
  // GRUPO 2: TIPAGEM FORTE E VALIDAÇÕES DO REGISTRY (Critérios 6 a 13)
  // ============================================================================
  console.log('\n--- [2/8] Tipagem Forte e Validações do Registry ---');

  // Critério 6: Validação de tipo BOOLEAN (aceita boolean/string truthy e rejeita formato inválido)
  let boolValid = false;
  let boolInvalidCaught = false;
  try {
    const v1 = ConfigurationRegistry.validateValue('finance.transfer.enabled', 'true');
    const v2 = ConfigurationRegistry.validateValue('finance.transfer.enabled', false);
    boolValid = v1 === true && v2 === false;
  } catch (e) {
    boolValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('finance.transfer.enabled', 'not_a_bool');
  } catch (e: any) {
    boolInvalidCaught = e.message.includes('booleano');
  }
  assert(boolValid && boolInvalidCaught, 'Critério 6: Validação de tipo BOOLEAN (aceita truthy/falsy e rejeita texto aleatório)');

  // Critério 7: Validação de tipo INTEGER com limites mínimos e máximos (min/max bounds)
  let intValid = false;
  let intOutOfBoundCaught = false;
  try {
    const v = ConfigurationRegistry.validateValue('refund.max_days_allowed', 15);
    intValid = v === 15;
  } catch (e) {
    intValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('refund.max_days_allowed', 120); // max é 90
  } catch (e: any) {
    intOutOfBoundCaught = e.message.includes('maior que 90');
  }
  assert(intValid && intOutOfBoundCaught, 'Critério 7: Validação de tipo INTEGER com limites mínimos e máximos (min/max bounds)');

  // Critério 8: Validação de tipo CURRENCY / DECIMAL garantindo número não nulo
  let currencyValid = false;
  let currencyNegativeCaught = false;
  try {
    const v = ConfigurationRegistry.validateValue('finance.transfer.minimum_balance', 7500.50);
    currencyValid = v === 7500.50;
  } catch (e) {
    currencyValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('finance.transfer.minimum_balance', -100);
  } catch (e: any) {
    currencyNegativeCaught = e.message.includes('menor que 0');
  }
  assert(currencyValid && currencyNegativeCaught, 'Critério 8: Validação de tipo CURRENCY / DECIMAL garantindo número e limite mínimo');

  // Critério 9: Validação de tipo PERCENTAGE garantindo valores entre 0% e 100%
  // Registra temporariamente uma chave do tipo PERCENTAGE se não existir
  ConfigurationRegistry.register({
    key: 'test.tax.percentage',
    domain: 'FINANCE',
    name: 'Taxa de Teste',
    type: 'PERCENTAGE',
    defaultValue: 10,
    sensitivity: 'INTERNAL',
    allowedScopes: ['GLOBAL'],
    requiresApproval: false
  });
  let percValid = false;
  let percInvalidCaught = false;
  try {
    const p = ConfigurationRegistry.validateValue('test.tax.percentage', 45);
    percValid = p === 45;
  } catch (e) {
    percValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('test.tax.percentage', 150);
  } catch (e: any) {
    percInvalidCaught = e.message.includes('entre 0% e 100%');
  }
  assert(percValid && percInvalidCaught, 'Critério 9: Validação de tipo PERCENTAGE garantindo limites 0% a 100%');

  // Critério 10: Validação de tipo DURATION garantindo número não-negativo e bounds
  ConfigurationRegistry.register({
    key: 'test.sla.duration',
    domain: 'SAC',
    name: 'SLA Duração Teste',
    type: 'DURATION',
    unit: 'HOURS',
    defaultValue: 24,
    validationSchema: { min: 1, max: 72 },
    sensitivity: 'INTERNAL',
    allowedScopes: ['GLOBAL'],
    requiresApproval: false
  });
  let durValid = false;
  let durExceededCaught = false;
  try {
    const d = ConfigurationRegistry.validateValue('test.sla.duration', 48);
    durValid = d === 48;
  } catch (e) {
    durValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('test.sla.duration', 100);
  } catch (e: any) {
    durExceededCaught = e.message.includes('Duração máxima');
  }
  assert(durValid && durExceededCaught, 'Critério 10: Validação de tipo DURATION garantindo número não-negativo e bounds');

  // Critério 11: Validação de tipo ENUM aceitando apenas valores permitidos da lista
  let enumValid = false;
  let enumInvalidCaught = false;
  try {
    const ev = ConfigurationRegistry.validateValue('document.storage.provider', 'S3');
    enumValid = ev === 'S3';
  } catch (e) {
    enumValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('document.storage.provider', 'DROPBOX_INVALID');
  } catch (e: any) {
    enumInvalidCaught = e.message.includes('não permitido');
  }
  assert(enumValid && enumInvalidCaught, 'Critério 11: Validação de tipo ENUM aceitando apenas valores permitidos da lista');

  // Critério 12: Validação de tipo STRING com trim e rejeição de tipos incompatíveis
  ConfigurationRegistry.register({
    key: 'test.system.title',
    domain: 'SECURITY',
    name: 'Título do Sistema',
    type: 'STRING',
    defaultValue: 'Disk Interno',
    sensitivity: 'PUBLIC',
    allowedScopes: ['GLOBAL'],
    requiresApproval: false
  });
  let strValid = false;
  let strInvalidCaught = false;
  try {
    const s = ConfigurationRegistry.validateValue('test.system.title', '  Portal Central  ');
    strValid = s === 'Portal Central';
  } catch (e) {
    strValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('test.system.title', { obj: true });
  } catch (e: any) {
    strInvalidCaught = e.message.includes('Esperado texto');
  }
  assert(strValid && strInvalidCaught, 'Critério 12: Validação de tipo STRING com trim automático e validação de tipo');

  // Critério 13: Validação de tipo JSON_SCHEMA validando parse de string JSON
  ConfigurationRegistry.register({
    key: 'test.webhook.schema',
    domain: 'INTEGRATIONS',
    name: 'Schema do Webhook',
    type: 'JSON_SCHEMA',
    defaultValue: {},
    sensitivity: 'INTERNAL',
    allowedScopes: ['GLOBAL'],
    requiresApproval: false
  });
  let jsonValid = false;
  let jsonInvalidCaught = false;
  try {
    const j = ConfigurationRegistry.validateValue('test.webhook.schema', '{"endpoint": "https://api.com"}');
    jsonValid = j.endpoint === 'https://api.com';
  } catch (e) {
    jsonValid = false;
  }
  try {
    ConfigurationRegistry.validateValue('test.webhook.schema', 'invalid-json-string{');
  } catch (e: any) {
    jsonInvalidCaught = e.message.includes('JSON inválido');
  }
  assert(jsonValid && jsonInvalidCaught, 'Critério 13: Validação de tipo JSON_SCHEMA validando integridade do formato JSON');

  // ============================================================================
  // GRUPO 3: AVALIADOR DECLARATIVO DE CONDIÇÕES (Critérios 14 a 19)
  // ============================================================================
  console.log('\n--- [3/8] Avaliador Declarativo de Condições (Operators) ---');

  // Critério 14: Avaliação declarativa: EQUAL e NOT_EQUAL
  const eqPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'category', operator: 'EQUAL', value: 'VIP' },
    { category: 'VIP' }
  );
  const neqPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'category', operator: 'NOT_EQUAL', value: 'NORMAL' },
    { category: 'VIP' }
  );
  assert(eqPass && neqPass, 'Critério 14: Avaliação declarativa de condição: operador EQUAL e NOT_EQUAL');

  // Critério 15: Avaliação declarativa: GREATER_THAN e GREATER_OR_EQUAL
  const gtPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'amount', operator: 'GREATER_THAN', value: 1000 },
    { amount: 1500 }
  );
  const gtePass = ConditionEvaluatorService.evaluateCondition(
    { field: 'amount', operator: 'GREATER_OR_EQUAL', value: 1000 },
    { amount: 1000 }
  );
  assert(gtPass && gtePass, 'Critério 15: Avaliação declarativa de condição: operadores GREATER_THAN e GREATER_OR_EQUAL');

  // Critério 16: Avaliação declarativa: LESS_THAN e LESS_OR_EQUAL
  const ltPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'daysRemaining', operator: 'LESS_THAN', value: 5 },
    { daysRemaining: 3 }
  );
  const ltePass = ConditionEvaluatorService.evaluateCondition(
    { field: 'daysRemaining', operator: 'LESS_OR_EQUAL', value: 5 },
    { daysRemaining: 5 }
  );
  assert(ltPass && ltePass, 'Critério 16: Avaliação declarativa de condição: operadores LESS_THAN e LESS_OR_EQUAL');

  // Critério 17: Avaliação declarativa: CONTAINS
  const containsPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'description', operator: 'CONTAINS', value: 'Urgente' },
    { description: 'Estorno Urgente de Ingresso' }
  );
  assert(containsPass, 'Critério 17: Avaliação declarativa de condição: operador CONTAINS');

  // Critério 18: Avaliação declarativa: IN e NOT_IN
  const inPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'paymentMethod', operator: 'IN', value: ['PIX', 'CREDIT_CARD'] },
    { paymentMethod: 'PIX' }
  );
  const notInPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'paymentMethod', operator: 'NOT_IN', value: ['BOLETO', 'CASH'] },
    { paymentMethod: 'PIX' }
  );
  assert(inPass && notInPass, 'Critério 18: Avaliação declarativa de condição: operadores IN e NOT_IN');

  // Critério 19: Avaliação declarativa: BETWEEN
  const betweenPass = ConditionEvaluatorService.evaluateCondition(
    { field: 'amount', operator: 'BETWEEN', value: [1000, 5000] },
    { amount: 3500 }
  );
  const betweenFail = ConditionEvaluatorService.evaluateCondition(
    { field: 'amount', operator: 'BETWEEN', value: [1000, 5000] },
    { amount: 7500 }
  );
  assert(betweenPass && !betweenFail, 'Critério 19: Avaliação declarativa de condição: operador BETWEEN');

  // ============================================================================
  // GRUPO 4: PRIORIDADE E DESEMPATE DETERMINÍSTICO (Critérios 20 a 22)
  // ============================================================================
  console.log('\n--- [4/8] Prioridade e Desempate Determinístico ---');

  const testRules: any[] = [
    {
      id: 'rule_low',
      name: 'Regra Baixa Prioridade',
      priority: 10,
      orderIndex: 1,
      conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100 }]),
      actionJson: JSON.stringify({ decision: true, label: 'LOW' }),
      isActive: true
    },
    {
      id: 'rule_high',
      name: 'Regra Alta Prioridade',
      priority: 90,
      orderIndex: 2,
      conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100 }]),
      actionJson: JSON.stringify({ decision: true, label: 'HIGH' }),
      isActive: true
    }
  ];

  // Critério 20: Prioridade determinística: regra com maior prioridade numérica é avaliada primeiro
  const evalPriorities = PolicyEvaluatorService.evaluate(testRules, { amount: 500 });
  assert(
    evalPriorities.matchedRule?.id === 'rule_high',
    'Critério 20: Prioridade determinística: regra com maior prioridade numérica (90 > 10) é avaliada primeiro',
    `Regra correspondida: ${evalPriorities.matchedRule?.name}`
  );

  // Critério 21: Desempate determinístico por especificidade (número de condições) em regras com mesma prioridade
  const rulesTiedPriority: any[] = [
    {
      id: 'rule_generic',
      name: 'Regra Genérica (1 condição)',
      priority: 50,
      orderIndex: 1,
      conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100 }]),
      actionJson: JSON.stringify({ decision: true, label: 'GENERIC' }),
      isActive: true
    },
    {
      id: 'rule_specific',
      name: 'Regra Específica (2 condições)',
      priority: 50,
      orderIndex: 2,
      conditionJson: JSON.stringify([
        { field: 'amount', operator: 'GREATER_THAN', value: 100 },
        { field: 'channel', operator: 'EQUAL', value: 'WEB' }
      ]),
      actionJson: JSON.stringify({ decision: true, label: 'SPECIFIC' }),
      isActive: true
    }
  ];
  const evalSpecificity = PolicyEvaluatorService.evaluate(rulesTiedPriority, { amount: 500, channel: 'WEB' });
  assert(
    evalSpecificity.matchedRule?.id === 'rule_specific',
    'Critério 21: Desempate determinístico por especificidade (2 condições vencem 1 condição)',
    `Regra correspondida: ${evalSpecificity.matchedRule?.name}`
  );

  // Critério 22: Desempate final determinístico por orderIndex
  const rulesTiedOrderIndex: any[] = [
    {
      id: 'rule_order_2',
      name: 'Regra Ordem 2',
      priority: 50,
      orderIndex: 2,
      conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100 }]),
      actionJson: JSON.stringify({ decision: true, label: 'ORDER_2' }),
      isActive: true
    },
    {
      id: 'rule_order_1',
      name: 'Regra Ordem 1',
      priority: 50,
      orderIndex: 1,
      conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100 }]),
      actionJson: JSON.stringify({ decision: true, label: 'ORDER_1' }),
      isActive: true
    }
  ];
  const evalOrder = PolicyEvaluatorService.evaluate(rulesTiedOrderIndex, { amount: 500 });
  assert(
    evalOrder.matchedRule?.id === 'rule_order_1',
    'Critério 22: Desempate final determinístico por menor orderIndex (1 vence 2)',
    `Regra correspondida: ${evalOrder.matchedRule?.name}`
  );

  // ============================================================================
  // GRUPO 5: CICLO DE VIDA, VERSIONAMENTO, DIFF E ROLLBACK (Critérios 23 a 29)
  // ============================================================================
  console.log('\n--- [5/8] Ciclo de Vida, Versionamento, Diff e Rollback ---');

  // Critério 23: Ciclo de vida de política: criação em status DRAFT com versionamento inicial v1
  const newPolicyDraft = await PolicyEngineService.createPolicy(
    {
      code: 'POL-SAC-SLA',
      name: 'Política de SLA para Atendimento SAC',
      domain: 'SAC',
      scopeType: 'GLOBAL',
      description: 'Define limites de atendimento para tickets de suporte',
      priority: 100,
      rules: [
        {
          name: 'Atendimento VIP',
          priority: 80,
          conditions: [{ field: 'customerTier', operator: 'EQUAL', value: 'VIP' }],
          action: { decision: true, slaMinutes: 30 }
        },
        {
          name: 'Atendimento Padrão',
          priority: 50,
          conditions: [{ field: 'customerTier', operator: 'EQUAL', value: 'STANDARD' }],
          action: { decision: true, slaMinutes: 240 }
        }
      ]
    },
    userAdmin
  );

  assert(
    newPolicyDraft.status === 'DRAFT' && newPolicyDraft.currentVersion === 1,
    'Critério 23: Ciclo de vida de política: criação em status DRAFT com versionamento inicial v1',
    `Status: ${newPolicyDraft.status}, Versão: ${newPolicyDraft.currentVersion}`
  );

  // Critério 24: Ativação de política: transição para ACTIVE e marcação da política anterior no mesmo escopo como SUPERSEDED
  // Criamos uma política antiga ativa para testar o SUPERSEDED
  const oldPolicy = await PolicyEngineService.createPolicy(
    {
      code: 'POL-SAC-LEGACY',
      name: 'Política de SLA Legada',
      domain: 'SAC',
      scopeType: 'GLOBAL',
      priority: 90,
      rules: [{ name: 'Regra Legada', priority: 10, conditions: [], action: { decision: true } }]
    },
    userAdmin
  );
  await PolicyEngineService.activatePolicy(oldPolicy.id, userAdmin);

  // Ativamos a nova política POL-SAC-SLA
  const activatedPolicy = await PolicyEngineService.activatePolicy(newPolicyDraft.id, userAdmin);
  const oldPolicyAfter = await prisma.policy.findUnique({ where: { id: oldPolicy.id } });

  assert(
    activatedPolicy.status === 'ACTIVE' && oldPolicyAfter?.status === 'SUPERSEDED',
    'Critério 24: Ativação de política: transição para ACTIVE e marcação da anterior como SUPERSEDED',
    `Nova: ${activatedPolicy.status}, Antiga: ${oldPolicyAfter?.status}`
  );

  // Critério 25: Emissão do evento de domínio POLICY_ACTIVATED e POLICY_SUPERSEDED
  const hasPolicyActivatedEvent = emittedEvents.some(
    e => e.event === 'POLICY_ACTIVATED' && e.payload?.resourceId === activatedPolicy.id
  );
  const hasPolicySupersededEvent = emittedEvents.some(
    e => e.event === 'POLICY_SUPERSEDED' && e.payload?.resourceId === oldPolicy.id
  );
  assert(
    hasPolicyActivatedEvent && hasPolicySupersededEvent,
    'Critério 25: Emissão do evento de domínio POLICY_ACTIVATED e POLICY_SUPERSEDED'
  );

  // Critério 26: Agendamento de vigência (SCHEDULED) com datas futuras válidas
  const futureStart = new Date(Date.now() + 86400000 * 7); // Daqui a 7 dias
  const futureEnd = new Date(Date.now() + 86400000 * 30);  // Daqui a 30 dias
  const schedPolicy = await PolicyEngineService.createPolicy(
    {
      code: 'POL-BLACK-FRIDAY',
      name: 'Política Especial Black Friday',
      domain: 'FINANCE',
      scopeType: 'GLOBAL',
      priority: 150,
      rules: [{ name: 'Regra BF', priority: 10, conditions: [], action: { decision: true } }]
    },
    userAdmin
  );
  const scheduledResult = await PolicyEngineService.schedulePolicy(
    schedPolicy.id,
    futureStart,
    futureEnd,
    userAdmin
  );
  assert(
    scheduledResult.status === 'SCHEDULED' &&
    new Date(scheduledResult.effectiveFrom).getTime() === futureStart.getTime(),
    'Critério 26: Agendamento de vigência (SCHEDULED) com datas futuras válidas (effectiveFrom/effectiveUntil)',
    `Status: ${scheduledResult.status}`
  );

  // Critério 27: Comparação e diff entre versões (VersionService.compareVersions: ADDED, MODIFIED, REMOVED)
  // Cria v2 de POL-SAC-SLA com alteração na regra VIP e adição de regra Express
  await VersionService.createNewVersion(
    activatedPolicy.id,
    [
      {
        name: 'Atendimento VIP',
        priority: 95, // MODIFIED
        conditions: [{ field: 'customerTier', operator: 'EQUAL', value: 'VIP' }],
        action: { decision: true, slaMinutes: 15 } // Alterado de 30 para 15
      },
      // 'Atendimento Padrão' foi REMOVED
      {
        name: 'Atendimento Express', // ADDED
        priority: 70,
        conditions: [{ field: 'channel', operator: 'EQUAL', value: 'CHAT' }],
        action: { decision: true, slaMinutes: 45 }
      }
    ],
    'Ajuste nos SLAs para suporte online',
    userAdmin
  );

  const diffResult = await VersionService.compareVersions(activatedPolicy.id, 1, 2);
  const hasModified = diffResult.diffs.some(d => d.ruleName === 'Atendimento VIP' && d.changeType === 'MODIFIED');
  const hasRemoved = diffResult.diffs.some(d => d.ruleName === 'Atendimento Padrão' && d.changeType === 'REMOVED');
  const hasAdded = diffResult.diffs.some(d => d.ruleName === 'Atendimento Express' && d.changeType === 'ADDED');

  assert(
    hasModified && hasRemoved && hasAdded,
    'Critério 27: Comparação e diff entre versões (MODIFIED, REMOVED, ADDED identificados com precisão)',
    `Diffs: ${JSON.stringify(diffResult.diffs.map(d => `${d.ruleName}: ${d.changeType}`))}`
  );

  // Critério 28: Rollback seguro e auditável: cria nova versão v(n+1) a partir da versão alvo sem apagar histórico
  const rollbackResult = await RollbackService.rollbackPolicy(
    activatedPolicy.id,
    1, // Rollback para v1
    'Revertendo para SLAs anteriores por instabilidade no chat',
    userAdmin
  );

  const policyAfterRollback = await prisma.policy.findUnique({
    where: { id: activatedPolicy.id },
    include: { versions: true }
  });

  assert(
    policyAfterRollback?.currentVersion === 3 &&
    policyAfterRollback.versions.length === 3,
    'Critério 28: Rollback seguro e auditável: cria v3 com regras de v1 sem apagar v2',
    `Versão atual: ${policyAfterRollback?.currentVersion}, Total versões: ${policyAfterRollback?.versions.length}`
  );

  // Critério 29: Emissão de evento POLICY_ROLLED_BACK e registro de auditoria completo
  const hasRollbackEvent = emittedEvents.some(
    e => e.event === 'POLICY_ROLLED_BACK' && e.payload?.resourceId === activatedPolicy.id
  );
  const rollbackAudit = await prisma.configurationAudit.findFirst({
    where: { entityId: activatedPolicy.id, action: 'ROLLBACK' }
  });

  assert(
    hasRollbackEvent && rollbackAudit !== null,
    'Critério 29: Emissão de evento POLICY_ROLLED_BACK e registro de auditoria completo'
  );

  // ============================================================================
  // GRUPO 6: CONFLITOS, TAREFAS AUTOMÁTICAS E APROVAÇÃO (Critérios 30 a 33)
  // ============================================================================
  console.log('\n--- [6/8] Conflitos, Tarefas Automáticas e Simulador ---');

  // Critério 30: Detecção de conflitos de políticas em vigências e prioridades ambíguas
  // Cria duas políticas no mesmo domínio, escopo e prioridade idêntica
  const polConflictA = await PolicyEngineService.createPolicy(
    {
      code: 'POL-CONF-A',
      name: 'Política Conflito A',
      domain: 'FINANCE',
      scopeType: 'GLOBAL',
      priority: 88,
      rules: [{ name: 'Regra A', priority: 50, conditions: [], action: { decision: true } }]
    },
    userAdmin
  );
  await PolicyEngineService.activatePolicy(polConflictA.id, userAdmin);

  const polConflictB = await PolicyEngineService.createPolicy(
    {
      code: 'POL-CONF-B',
      name: 'Política Conflito B',
      domain: 'FINANCE',
      scopeType: 'GLOBAL',
      priority: 88, // Mesma prioridade
      rules: [{ name: 'Regra B', priority: 50, conditions: [], action: { decision: true } }]
    },
    userAdmin
  );
  // Não supersedemos propositalmente para forçar estado conflitante no detector
  await prisma.policy.update({
    where: { id: polConflictB.id },
    data: { status: 'ACTIVE' }
  });

  const conflicts = await PolicyConflictService.detectConflicts('FINANCE');
  const foundConflict = conflicts.find(
    c => (c.policyAId === polConflictA.id && c.policyBId === polConflictB.id) ||
         (c.policyAId === polConflictB.id && c.policyBId === polConflictA.id)
  );

  assert(
    foundConflict !== undefined && foundConflict.conflictType === 'AMBIGUOUS_PRIORITY',
    'Critério 30: Detecção de conflitos de políticas (PolicyConflictService) em vigências e prioridades ambíguas'
  );

  // Critério 31: Emissão do evento POLICY_CONFLICT_DETECTED e criação automática de tarefa operacional para Administracao
  const hasConflictEvent = emittedEvents.some(
    e => e.event === 'POLICY_CONFLICT_DETECTED'
  );
  const tasksCreated = await prisma.task.findMany({
    where: { title: { contains: 'Revisar conflito de políticas' } }
  });

  assert(
    hasConflictEvent && tasksCreated.length > 0,
    'Critério 31: Emissão de POLICY_CONFLICT_DETECTED e criação automática de tarefa operacional via TaskService'
  );

  // Critério 32: Integração com ApprovalEngine: alteração de configuração crítica bloqueia e gera ApprovalRequest
  const overrideReq = await ConfigurationService.setOverride(
    'finance.transfer.approval.threshold',
    {
      scopeType: 'GLOBAL',
      value: 150000,
      changeReason: 'Aumento do teto para transferências diretas'
    },
    userAdmin
  );

  assert(
    overrideReq.pendingApproval === true && typeof overrideReq.approvalRequestId === 'string',
    'Critério 32: Integração com ApprovalEngine: alteração de configuração sensível bloqueia e gera ApprovalRequest',
    `Pending: ${overrideReq.pendingApproval}, RequestId: ${overrideReq.approvalRequestId}`
  );

  // Critério 33: Simulador de Políticas (PolicySimulatorService.simulate): execução em modo dry-run sem persistir snapshot real
  const simulateCountBefore = await prisma.policyEvaluation.count({ where: { isSimulated: false } });
  const simResult = await PolicySimulatorService.simulate({
    domain: 'FINANCE',
    operation: 'TRANSFER_REQUEST',
    context: { producerId: 'prd_100', eventId: 'evt_200' },
    input: { amount: 60000 }
  });
  const simulateCountAfter = await prisma.policyEvaluation.count({ where: { isSimulated: false } });

  assert(
    simulateCountBefore === simulateCountAfter &&
    simResult.decision !== undefined &&
    simResult.trace.length > 0,
    'Critério 33: Simulador de Políticas (PolicySimulatorService.simulate): execução em modo dry-run com rastreamento detalhado',
    `Trace steps: ${simResult.trace.length}, Snapshot counts: ${simulateCountBefore} === ${simulateCountAfter}`
  );

  // ============================================================================
  // GRUPO 7: FEATURE FLAGS E EMERGENCY KILL SWITCH (Critérios 34 a 37)
  // ============================================================================
  console.log('\n--- [7/8] Feature Flags e Emergency Kill Switch ---');

  // Critério 34: Feature Flag: avaliação condicional por percentual de rollout determinístico
  // Criamos flag com 50% rollout
  await prisma.featureFlag.create({
    data: {
      key: 'feature.rollout.test',
      name: 'Flag Rollout 50%',
      isEnabled: true,
      rolloutPercentage: 50,
      isKillSwitch: false
    }
  });

  const resUser1 = await FeatureFlagService.isEnabled('feature.rollout.test', { user: { id: 'usr_abc_1' } });
  const resUser1Repeat = await FeatureFlagService.isEnabled('feature.rollout.test', { user: { id: 'usr_abc_1' } });
  assert(
    resUser1 === resUser1Repeat,
    'Critério 34: Feature Flag: avaliação condicional determinística por percentual de rollout (mesmo usuário obtém sempre mesmo resultado)',
    `User1: ${resUser1} === ${resUser1Repeat}`
  );

  // Critério 35: Feature Flag: avaliação restrita por whitelist de produtor e roles
  await prisma.featureFlag.create({
    data: {
      key: 'feature.whitelist.test',
      name: 'Flag Whitelist Produtores',
      isEnabled: true,
      rolloutPercentage: 100,
      isKillSwitch: false,
      allowedProducers: JSON.stringify(['prd_100']),
      allowedRoles: JSON.stringify(['ADMINISTRADOR_GERAL'])
    }
  });

  const allowedUser = await FeatureFlagService.isEnabled('feature.whitelist.test', {
    user: userAdmin,
    producerId: 'prd_100'
  });
  const blockedUser = await FeatureFlagService.isEnabled('feature.whitelist.test', {
    user: userProdutorB,
    producerId: 'prd_200' // Produtor não está na whitelist
  });

  assert(
    allowedUser === true && blockedUser === false,
    'Critério 35: Feature Flag: avaliação restrita por whitelist de produtor e perfis (roles)'
  );

  // Critério 36: Emergency Kill Switch: acionamento imediato bloqueia operação, registra motivo e emite KILL_SWITCH_TRIGGERED
  const killSwitchResult = await FeatureFlagService.triggerKillSwitch(
    'killswitch.automatic_transfers',
    'Detectada anomalia na liquidação bancária de transferências',
    userAdmin
  );
  const isKillSwitchActive = await FeatureFlagService.isEnabled('killswitch.automatic_transfers');
  const hasKillSwitchTriggeredEvent = emittedEvents.some(
    e => e.event === 'KILL_SWITCH_TRIGGERED' && (e.payload?.resourceId === killSwitchResult.id || e.payload?.data?.key === 'killswitch.automatic_transfers')
  );

  assert(
    killSwitchResult.isEnabled === true && isKillSwitchActive === true && hasKillSwitchTriggeredEvent,
    'Critério 36: Emergency Kill Switch: acionamento imediato bloqueia operação e emite KILL_SWITCH_TRIGGERED'
  );

  // Critério 37: Emergency Kill Switch: redefinição (reset) restaura operação e emite KILL_SWITCH_RESET
  const resetResult = await FeatureFlagService.resetKillSwitch(
    'killswitch.automatic_transfers',
    'Auditoria de liquidação concluída com sucesso',
    userAdmin
  );
  const isKillSwitchReset = await FeatureFlagService.isEnabled('killswitch.automatic_transfers');
  const hasKillSwitchResetEvent = emittedEvents.some(
    e => e.event === 'KILL_SWITCH_RESET' && (e.payload?.resourceId === resetResult.id || e.payload?.data?.key === 'killswitch.automatic_transfers')
  );

  assert(
    resetResult.isEnabled === false && isKillSwitchReset === false && hasKillSwitchResetEvent,
    'Critério 37: Emergency Kill Switch: redefinição (reset) restaura operação e emite KILL_SWITCH_RESET'
  );

  // ============================================================================
  // GRUPO 8: CACHE, SNAPSHOTS, RBAC E BUSCA GLOBAL (Critérios 38 a 40)
  // ============================================================================
  console.log('\n--- [8/8] Cache, Snapshots, RBAC e Busca Global ---');

  // Critério 38: Cache de configurações com hit de memória e invalidação automática em setOverride / removeOverride
  ConfigurationCacheService.clear();
  const cacheKey = 'finance.transfer.minimum_balance';
  const firstResolve = await ConfigurationService.getEffective(cacheKey, { producerId: 'prd_100' });
  const cachedHit = ConfigurationCacheService.get(cacheKey, 'PRODUCER', 'prd_100');

  assert(
    cachedHit !== null && cachedHit.value === firstResolve.value,
    'Critério 38.1: Cache de configurações em memória armazena resolução com sucesso'
  );

  // Invalidação no setOverride
  await ConfigurationService.setOverride(
    cacheKey,
    {
      scopeType: 'PRODUCER',
      producerId: 'prd_100',
      value: 18000,
      changeReason: 'Atualizando limite com invalidação de cache'
    },
    userAdmin
  );
  const cacheAfterSet = ConfigurationCacheService.get(cacheKey, 'PRODUCER', 'prd_100');

  assert(
    cacheAfterSet === null,
    'Critério 38: Cache invalidado automaticamente em setOverride / removeOverride',
    `Cache após set: ${cacheAfterSet}`
  );

  // Critério 39: Snapshot imutável de avaliação registrado na tabela PolicyEvaluation para cada resolução real
  const evalDecision = await PolicyEngineService.resolve({
    operation: 'TRANSFER_REQUEST',
    domain: 'FINANCE',
    context: { producerId: 'prd_100', user: userAdmin },
    input: { amount: 75000 }
  });

  const snapshotRecord = await prisma.policyEvaluation.findUnique({
    where: { id: evalDecision.evaluationId }
  });

  assert(
    snapshotRecord !== null &&
    snapshotRecord.operation === 'TRANSFER_REQUEST' &&
    snapshotRecord.isSimulated === false &&
    snapshotRecord.evaluatedByUserId === userAdmin.id,
    'Critério 39: Snapshot imutável de avaliação registrado na tabela PolicyEvaluation para cada resolução',
    `SnapshotId: ${snapshotRecord?.id}, Operação: ${snapshotRecord?.operation}`
  );

  // Critério 40: Isolamento de escopo por RBAC e Busca Global de políticas por código POL-...
  // 40.1 RBAC Scope Isolation: Produtor A tentando configurar escopo do Produtor B é barrado com 403
  let rbacProducerBlocked = false;
  try {
    ConfigurationService.validateScopeAccess('PRODUCER', 'prd_200', undefined, userProdutorA);
  } catch (err: any) {
    rbacProducerBlocked = err.statusCode === 403;
  }

  // 40.2 RBAC Scope Isolation: Produtor A tentando configurar escopo GLOBAL é barrado com 403
  let rbacGlobalBlocked = false;
  try {
    ConfigurationService.validateScopeAccess('GLOBAL', undefined, undefined, userProdutorA);
  } catch (err: any) {
    rbacGlobalBlocked = err.statusCode === 403;
  }

  // 40.3 Busca Global: Pesquisa por código POL-... encontra a política
  const searchByCode = await SearchService.search('POL-FIN-TRANSFER', userAdmin);
  const foundPolicyByCode = searchByCode.categories.policies?.items.some(
    p => (p as any).code === 'POL-FIN-TRANSFER' || p.title.includes('POL-FIN-TRANSFER')
  );

  assert(
    rbacProducerBlocked && rbacGlobalBlocked && foundPolicyByCode,
    'Critério 40: Isolamento de escopo por RBAC (HTTP 403 em acessos indevidos) e Busca Global de políticas por código POL-...',
    `Blocked B: ${rbacProducerBlocked}, Blocked Global: ${rbacGlobalBlocked}, Found POL: ${foundPolicyByCode}`
  );

  // ============================================================================
  // RELATÓRIO FINAL
  // ============================================================================
  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM`);
  if (passedTests === totalTests) {
    console.log('TODOS OS 40 CRITÉRIOS DE ACEITE DA FASE 1.1.5.11 FORAM ATENDIDOS COM SUCESSO!');
  } else {
    console.error(`ALERTA: ${totalTests - passedTests} testes falharam.`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
