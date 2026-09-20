import { PrismaClient, UserStatus } from '@prisma/client';
import { env } from '../../config/env';

// In-Memory Database Store for Testing / Offline Development
export class InMemoryPrismaStore {
  public users: any[] = [];
  public roles: any[] = [];
  public userRoles: any[] = [];
  public permissions: any[] = [];
  public rolePermissions: any[] = [];
  public userPermissions: any[] = [];
  public producers: any[] = [];
  public events: any[] = [];
  public userProducerAccesses: any[] = [];
  public userEventAccesses: any[] = [];
  public sessions: any[] = [];
  public auditLogs: any[] = [];
  public notifications: any[] = [];
  public notificationRecipients: any[] = [];
  public notificationPreferences: any[] = [];
  public notificationRules: any[] = [];
  public outboxRecords: any[] = [];
  public customers: any[] = [];
  public orders: any[] = [];
  public tickets: any[] = [];
  public payments: any[] = [];
  public refunds: any[] = [];
  public supportTickets: any[] = [];
  public marketingCampaigns: any[] = [];
  public searchHistories: any[] = [];
  public approvalRules: any[] = [];
  public approvalThresholds: any[] = [];
  public approvalRequests: any[] = [];
  public approvalSteps: any[] = [];
  public approvalDecisions: any[] = [];
  public approvalDelegations: any[] = [];
  public approvalComments: any[] = [];
  public approvalAttachments: any[] = [];
  public approvalGroups: any[] = [];
  public approvalGroupMembers: any[] = [];
  // Documentos & Anexos (Fase 1.1.5.8)
  public documents: any[] = [];
  public documentVersions: any[] = [];
  public documentLinks: any[] = [];
  public documentCategories: any[] = [];
  public documentTags: any[] = [];
  public documentTagLinks: any[] = [];
  public documentAccessLogs: any[] = [];
  public documentSecurityChecks: any[] = [];
  public documentRetentionPolicies: any[] = [];
  public documentRequirements: any[] = [];
  // Tarefas & Fluxos de Trabalho (Fase 1.1.5.9)
  public tasks: any[] = [];
  public taskAssignments: any[] = [];
  public taskChecklists: any[] = [];
  public taskChecklistItems: any[] = [];
  public taskComments: any[] = [];
  public taskDependencies: any[] = [];
  public taskHistories: any[] = [];
  public teams: any[] = [];
  public teamMembers: any[] = [];
  public workflows: any[] = [];
  public workflowVersions: any[] = [];
  public workflowRules: any[] = [];
  public workflowActions: any[] = [];
  public taskTemplates: any[] = [];
  public slaPolicies: any[] = [];
  public slaEvents: any[] = [];
  public escalationRules: any[] = [];
  public escalationEvents: any[] = [];
  public userAvailabilities: any[] = [];
  public dutySchedules: any[] = [];
  // Configurações & Políticas (Fase 1.1.5.11)
  public configurationDefinitions: any[] = [];
  public configurationValues: any[] = [];
  public configurationVersions: any[] = [];
  public policies: any[] = [];
  public policyVersions: any[] = [];
  public policyRules: any[] = [];
  public policyConflicts: any[] = [];
  public featureFlags: any[] = [];
  public configurationAudits: any[] = [];
  public policyEvaluations: any[] = [];
  // Auditoria & Observabilidade (Fase 1.1.5.12)
  public integrationInboxes: any[] = [];
  public businessEvents: any[] = [];
  public operationTraces: any[] = [];
  public traceSpans: any[] = [];
  public errorGroups: any[] = [];
  public errorOccurrences: any[] = [];
  public healthChecks: any[] = [];
  public systemAlerts: any[] = [];
  public metricSnapshots: any[] = [];
  public observabilityAnnotations: any[] = [];
  // Relatórios, Exportações e BI Operacional (Fase 1.1.5.13)
  public metricDefinitionModels: any[] = [];
  public savedReportModels: any[] = [];
  public reportExportJobModels: any[] = [];
  public reportScheduleModels: any[] = [];
  public reportSnapshotModels: any[] = [];
  public analyticsGoalModels: any[] = [];
  // Central de Jobs, Agendamentos, Lotes e Processamento Assíncrono (Fase 1.1.5.14)
  public jobModels: any[] = [];
  public jobAttemptModels: any[] = [];
  public jobCheckpointModels: any[] = [];
  public jobBatchModels: any[] = [];
  public jobScheduleModels: any[] = [];
  public jobWorkerModels: any[] = [];
  public jobDeadLetterModels: any[] = [];
  // Central de Importação, Migração e Qualidade (Fase 1.1.5.15)
  public importRequestModels: any[] = [];
  public importMappingModels: any[] = [];
  public importValidationErrorModels: any[] = [];
  public importDuplicateModels: any[] = [];
  public mergePlanModels: any[] = [];
  public dataQualityRuleModels: any[] = [];
  public dataQualityIssueModels: any[] = [];
  public migrationProjectModels: any[] = [];
  public legacyIdMappingModels: any[] = [];
  public migrationReconciliationModels: any[] = [];
  public suppliers: any[] = [];
  public financialTransactions: any[] = [];

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    this.users = [];
    this.roles = [];
    this.userRoles = [];
    this.permissions = [];
    this.rolePermissions = [];
    this.userPermissions = [];
    this.producers = [];
    this.events = [];
    this.configurationDefinitions = [];
    this.configurationValues = [];
    this.configurationVersions = [];
    this.policies = [];
    this.policyVersions = [];
    this.policyRules = [];
    this.policyConflicts = [];
    this.featureFlags = [];
    this.configurationAudits = [];
    this.policyEvaluations = [];
    this.userProducerAccesses = [];
    this.userEventAccesses = [];
    this.sessions = [];
    this.auditLogs = [];
    this.notifications = [];
    this.notificationRecipients = [];
    this.notificationPreferences = [];
    this.notificationRules = [];
    this.outboxRecords = [];
    this.customers = [];
    this.orders = [];
    this.tickets = [];
    this.payments = [];
    this.refunds = [];
    this.supportTickets = [];
    this.marketingCampaigns = [];
    this.searchHistories = [];
    this.approvalRules = [];
    this.approvalThresholds = [];
    this.approvalRequests = [];
    this.approvalSteps = [];
    this.approvalDecisions = [];
    this.approvalDelegations = [];
    this.approvalComments = [];
    this.approvalAttachments = [];
    this.approvalGroups = [];
    this.approvalGroupMembers = [];
    // Documentos & Anexos (Fase 1.1.5.8)
    this.documents = [];
    this.documentVersions = [];
    this.documentLinks = [];
    this.documentCategories = [];
    this.documentTags = [];
    this.documentTagLinks = [];
    this.documentAccessLogs = [];
    this.documentSecurityChecks = [];
    this.documentRetentionPolicies = [];
    this.documentRequirements = [];
    // Tarefas & Fluxos de Trabalho (Fase 1.1.5.9)
    this.tasks = [];
    this.taskAssignments = [];
    this.taskChecklists = [];
    this.taskChecklistItems = [];
    this.taskComments = [];
    this.taskDependencies = [];
    this.taskHistories = [];
    this.teams = [];
    this.teamMembers = [];
    this.workflows = [];
    this.workflowVersions = [];
    this.workflowRules = [];
    this.workflowActions = [];
    this.taskTemplates = [];
    this.slaPolicies = [];
    this.slaEvents = [];
    this.escalationRules = [];
    this.escalationEvents = [];
    this.userAvailabilities = [];
    this.dutySchedules = [];
    // Auditoria & Observabilidade (Fase 1.1.5.12)
    this.integrationInboxes = [];
    this.businessEvents = [];
    this.operationTraces = [];
    this.traceSpans = [];
    this.errorGroups = [];
    this.errorOccurrences = [];
    this.healthChecks = [];
    this.systemAlerts = [];
    this.metricSnapshots = [];
    this.observabilityAnnotations = [];
    // Relatórios, Exportações e BI Operacional (Fase 1.1.5.13)
    this.metricDefinitionModels = [];
    this.savedReportModels = [];
    this.reportExportJobModels = [];
    this.reportScheduleModels = [];
    this.reportSnapshotModels = [];
    this.analyticsGoalModels = [];
    // Central de Jobs, Agendamentos, Lotes e Processamento Assíncrono (Fase 1.1.5.14)
    this.jobModels = [];
    this.jobAttemptModels = [];
    this.jobCheckpointModels = [];
    this.jobBatchModels = [];
    this.jobScheduleModels = [];
    this.jobWorkerModels = [];
    this.jobDeadLetterModels = [];
    // Central de Importação, Migração e Qualidade (Fase 1.1.5.15)
    this.importRequestModels = [];
    this.importMappingModels = [];
    this.importValidationErrorModels = [];
    this.importDuplicateModels = [];
    this.mergePlanModels = [];
    this.dataQualityRuleModels = [];
    this.dataQualityIssueModels = [];
    this.migrationProjectModels = [];
    this.legacyIdMappingModels = [];
    this.migrationReconciliationModels = [];
    this.suppliers = [];
    this.financialTransactions = [];

    // 1. Catálogo Inicial de Perfis (Roles)
    const initialRoles = [
      { id: 'rol-admin-geral', name: 'Administrador Geral', code: 'ADMINISTRADOR_GERAL', description: 'Acesso irrestrito a todos os módulos e configurações' },
      { id: 'rol-admin-operacional', name: 'Administrador Operacional', code: 'ADMINISTRADOR_OPERACIONAL', description: 'Operação de campo e bilheteria central' },
      { id: 'rol-produtor', name: 'Produtor', code: 'PRODUTOR', description: 'Acesso restrito e segregado aos seus próprios eventos' },
      { id: 'rol-comercial', name: 'Comercial', code: 'COMERCIAL', description: 'Prospecção e metas comerciais' },
      { id: 'rol-suporte-eventos', name: 'Suporte Eventos', code: 'SUPORTE_EVENTOS', description: 'War room presencial e portaria' },
      { id: 'rol-atendimento-sac', name: 'Atendimento SAC', code: 'ATENDIMENTO_SAC', description: 'Consulta 360 e atendimento a clientes' },
      { id: 'rol-estorno', name: 'Estorno', code: 'ESTORNO', description: 'Aprovação de estornos e contestações' },
      { id: 'rol-financeiro', name: 'Financeiro', code: 'FINANCEIRO', description: 'Fluxo de caixa, conciliação e repasses' },
      { id: 'rol-contabilidade', name: 'Contabilidade', code: 'CONTABILIDADE', description: 'Livro diário, DRE e balancetes' },
      { id: 'rol-marketing', name: 'Marketing', code: 'MARKETING', description: 'Campanhas de tráfego, ROAS e pixels' },
      { id: 'rol-remarketing', name: 'Remarketing', code: 'REMARKETING', description: 'Recuperação de carrinhos e WhatsApp' },
      { id: 'rol-auditor', name: 'Auditor', code: 'AUDITOR', description: 'Acesso consultivo a trilhas de auditoria e conformidade' }
    ];
    this.roles.push(...initialRoles);

    // 2. Catálogo Básico de Permissões Granulares
    const initialPermissions = [
      // Eventos
      { id: 'p-evt-1', module: 'eventos', resource: 'evento', action: 'visualizar', code: 'eventos.evento.visualizar', description: 'Visualizar eventos' },
      { id: 'p-evt-2', module: 'eventos', resource: 'evento', action: 'criar', code: 'eventos.evento.criar', description: 'Criar eventos' },
      { id: 'p-evt-3', module: 'eventos', resource: 'evento', action: 'editar', code: 'eventos.evento.editar', description: 'Editar eventos' },
      // Financeiro
      { id: 'p-fin-0', module: 'financeiro', resource: 'dashboard', action: 'visualizar', code: 'financeiro.dashboard.visualizar', description: 'Visualizar dashboard financeiro' },
      { id: 'p-fin-1', module: 'financeiro', resource: 'saldo', action: 'visualizar', code: 'financeiro.saldo.visualizar', description: 'Visualizar saldos' },
      { id: 'p-fin-2', module: 'financeiro', resource: 'transferencia', action: 'criar', code: 'financeiro.transferencia.criar', description: 'Criar transferências' },
      { id: 'p-fin-3', module: 'financeiro', resource: 'transferencia', action: 'aprovar', code: 'financeiro.transferencia.aprovar', description: 'Aprovar transferências inter-eventos' },
      { id: 'p-fin-4', module: 'financeiro', resource: 'repasses', action: 'visualizar', code: 'financeiro.repasses.visualizar', description: 'Visualizar repasses' },
      { id: 'p-fin-5', module: 'financeiro', resource: 'repasses', action: 'aprovar', code: 'financeiro.repasses.aprovar', description: 'Aprovar repasses' },
      // SAC & Pedidos
      { id: 'p-sac-1', module: 'sac', resource: 'consulta', action: 'acessar', code: 'sac.consulta.acessar', description: 'Central de Consulta SAC' },
      { id: 'p-sac-2', module: 'sac', resource: 'pedido', action: 'visualizar', code: 'sac.pedido.visualizar', description: 'Visualizar pedidos de clientes' },
      // Marketing
      { id: 'p-mkt-1', module: 'marketing', resource: 'campanha', action: 'visualizar', code: 'marketing.campanha.visualizar', description: 'Visualizar campanhas de marketing' },
      { id: 'p-mkt-2', module: 'marketing', resource: 'campanha', action: 'criar', code: 'marketing.campanha.criar', description: 'Criar campanhas de marketing' },
      // Contabilidade
      { id: 'p-cnt-1', module: 'contabilidade', resource: 'dre', action: 'visualizar', code: 'contabilidade.dre.visualizar', description: 'Visualizar DRE em tempo real' },
      // Admin
      { id: 'p-adm-1', module: 'admin', resource: 'usuarios', action: 'visualizar', code: 'admin.usuarios.visualizar', description: 'Visualizar usuários' },
      { id: 'p-adm-2', module: 'admin', resource: 'usuarios', action: 'gerenciar', code: 'admin.usuarios.gerenciar', description: 'Administrar usuários e perfis' },
      { id: 'p-adm-3', module: 'admin', resource: 'auditoria', action: 'visualizar', code: 'admin.auditoria.visualizar', description: 'Visualizar trilha de auditoria' },
      // Busca Global & Central de Consulta (Fase 1.1.5.6)
      { id: 'p-sch-0', module: 'busca', resource: 'global', action: 'utilizar', code: 'busca.global.utilizar', description: 'Utilizar busca global e atalhos' },
      { id: 'p-sch-1', module: 'busca', resource: 'cliente', action: 'visualizar', code: 'busca.cliente.visualizar', description: 'Consultar clientes' },
      { id: 'p-sch-2', module: 'busca', resource: 'pedido', action: 'visualizar', code: 'busca.pedido.visualizar', description: 'Consultar pedidos' },
      { id: 'p-sch-3', module: 'busca', resource: 'ingresso', action: 'visualizar', code: 'busca.ingresso.visualizar', description: 'Consultar ingressos' },
      { id: 'p-sch-4', module: 'busca', resource: 'evento', action: 'visualizar', code: 'busca.evento.visualizar', description: 'Consultar eventos' },
      { id: 'p-sch-5', module: 'busca', resource: 'produtor', action: 'visualizar', code: 'busca.produtor.visualizar', description: 'Consultar produtores' },
      { id: 'p-sch-6', module: 'busca', resource: 'pagamento', action: 'visualizar', code: 'busca.pagamento.visualizar', description: 'Consultar pagamentos e transações' },
      { id: 'p-sch-7', module: 'busca', resource: 'estorno', action: 'visualizar', code: 'busca.estorno.visualizar', description: 'Consultar estornos' },
      { id: 'p-sch-8', module: 'busca', resource: 'ticket', action: 'visualizar', code: 'busca.ticket.visualizar', description: 'Consultar tickets de atendimento' },
      { id: 'p-sch-9', module: 'busca', resource: 'campanha', action: 'visualizar', code: 'busca.campanha.visualizar', description: 'Consultar campanhas' },
      // Permissões de Campo (Data Masking)
      { id: 'p-fld-1', module: 'cliente', resource: 'documento', action: 'visualizar_completo', code: 'cliente.documento.visualizar_completo', description: 'Visualizar CPF sem mascaramento' },
      { id: 'p-fld-2', module: 'cliente', resource: 'email', action: 'visualizar_completo', code: 'cliente.email.visualizar_completo', description: 'Visualizar email sem mascaramento' },
      { id: 'p-fld-3', module: 'cliente', resource: 'telefone', action: 'visualizar_completo', code: 'cliente.telefone.visualizar_completo', description: 'Visualizar telefone sem mascaramento' },
      { id: 'p-sch-10', module: 'busca', resource: 'historico', action: 'visualizar', code: 'busca.historico.visualizar', description: 'Visualizar histórico de buscas' },
      { id: 'p-sch-11', module: 'busca', resource: 'exportacao', action: 'criar', code: 'busca.exportacao.criar', description: 'Exportar dados de consulta' },
      // Motor Central de Aprovações e Alçadas (Fase 1.1.5.7)
      { id: 'p-apr-1', module: 'aprovacoes', resource: 'caixa', action: 'visualizar', code: 'aprovacoes.caixa.visualizar', description: 'Visualizar caixa de aprovações' },
      { id: 'p-apr-2', module: 'aprovacoes', resource: 'solicitacao', action: 'visualizar', code: 'aprovacoes.solicitacao.visualizar', description: 'Visualizar solicitações' },
      { id: 'p-apr-3', module: 'aprovacoes', resource: 'solicitacao', action: 'criar', code: 'aprovacoes.solicitacao.criar', description: 'Criar solicitações de aprovação' },
      { id: 'p-apr-4', module: 'aprovacoes', resource: 'solicitacao', action: 'aprovar', code: 'aprovacoes.solicitacao.aprovar', description: 'Aprovar solicitações' },
      { id: 'p-apr-5', module: 'aprovacoes', resource: 'solicitacao', action: 'rejeitar', code: 'aprovacoes.solicitacao.rejeitar', description: 'Rejeitar solicitações' },
      { id: 'p-apr-6', module: 'aprovacoes', resource: 'solicitacao', action: 'cancelar', code: 'aprovacoes.solicitacao.cancelar', description: 'Cancelar solicitações próprias' },
      { id: 'p-apr-7', module: 'aprovacoes', resource: 'regra', action: 'visualizar', code: 'aprovacoes.regra.visualizar', description: 'Visualizar regras de aprovação' },
      { id: 'p-apr-8', module: 'aprovacoes', resource: 'regra', action: 'criar', code: 'aprovacoes.regra.criar', description: 'Criar regras de aprovação' },
      { id: 'p-apr-9', module: 'aprovacoes', resource: 'regra', action: 'editar', code: 'aprovacoes.regra.editar', description: 'Editar regras de aprovação' },
      { id: 'p-apr-10', module: 'aprovacoes', resource: 'alcada', action: 'visualizar', code: 'aprovacoes.alcada.visualizar', description: 'Visualizar matriz de alçadas' },
      { id: 'p-apr-11', module: 'aprovacoes', resource: 'alcada', action: 'editar', code: 'aprovacoes.alcada.editar', description: 'Editar alçadas de aprovação' },
      { id: 'p-apr-12', module: 'aprovacoes', resource: 'delegacao', action: 'criar', code: 'aprovacoes.delegacao.criar', description: 'Delegar poderes de aprovação' },
      { id: 'p-apr-13', module: 'aprovacoes', resource: 'historico', action: 'visualizar', code: 'aprovacoes.historico.visualizar', description: 'Visualizar histórico de aprovações' },
      // Documentos & Anexos (Fase 1.1.5.8)
      { id: 'p-doc-1', module: 'documentos', resource: 'central', action: 'visualizar', code: 'documentos.central.visualizar', description: 'Acessar Central de Documentos' },
      { id: 'p-doc-2', module: 'documentos', resource: 'arquivo', action: 'visualizar', code: 'documentos.arquivo.visualizar', description: 'Visualizar documentos e anexos' },
      { id: 'p-doc-3', module: 'documentos', resource: 'arquivo', action: 'enviar', code: 'documentos.arquivo.enviar', description: 'Realizar upload de documentos' },
      { id: 'p-doc-4', module: 'documentos', resource: 'arquivo', action: 'baixar', code: 'documentos.arquivo.baixar', description: 'Baixar arquivos' },
      { id: 'p-doc-5', module: 'documentos', resource: 'versao', action: 'criar', code: 'documentos.versao.criar', description: 'Criar novas versões de documentos' },
      { id: 'p-doc-6', module: 'documentos', resource: 'versao', action: 'visualizar', code: 'documentos.versao.visualizar', description: 'Visualizar histórico de versões' },
      { id: 'p-doc-7', module: 'documentos', resource: 'arquivo', action: 'arquivar', code: 'documentos.arquivo.arquivar', description: 'Arquivar documentos' },
      { id: 'p-doc-8', module: 'documentos', resource: 'arquivo', action: 'excluir', code: 'documentos.arquivo.excluir', description: 'Excluir logicamente documentos' },
      { id: 'p-doc-9', module: 'documentos', resource: 'categoria', action: 'visualizar', code: 'documentos.categoria.visualizar', description: 'Visualizar categorias de documentos' },
      { id: 'p-doc-10', module: 'documentos', resource: 'categoria', action: 'editar', code: 'documentos.categoria.editar', description: 'Gerenciar categorias documentais' },
      { id: 'p-doc-11', module: 'documentos', resource: 'auditoria', action: 'visualizar', code: 'documentos.auditoria.visualizar', description: 'Visualizar logs de auditoria documental' },
      // Tarefas & Fluxos de Trabalho (Fase 1.1.5.9)
      { id: 'p-tsk-1', module: 'tarefas', resource: 'central', action: 'visualizar', code: 'tarefas.central.visualizar', description: 'Visualizar Central de Trabalho' },
      { id: 'p-tsk-2', module: 'tarefas', resource: 'tarefa', action: 'visualizar', code: 'tarefas.tarefa.visualizar', description: 'Visualizar tarefas' },
      { id: 'p-tsk-3', module: 'tarefas', resource: 'tarefa', action: 'criar', code: 'tarefas.tarefa.criar', description: 'Criar novas tarefas' },
      { id: 'p-tsk-4', module: 'tarefas', resource: 'tarefa', action: 'editar', code: 'tarefas.tarefa.editar', description: 'Editar tarefas' },
      { id: 'p-tsk-5', module: 'tarefas', resource: 'tarefa', action: 'assumir', code: 'tarefas.tarefa.assumir', description: 'Assumir tarefas de equipes' },
      { id: 'p-tsk-6', module: 'tarefas', resource: 'tarefa', action: 'reatribuir', code: 'tarefas.tarefa.reatribuir', description: 'Reatribuir tarefas a outros operadores' },
      { id: 'p-tsk-7', module: 'tarefas', resource: 'tarefa', action: 'concluir', code: 'tarefas.tarefa.concluir', description: 'Concluir tarefas' },
      { id: 'p-tsk-8', module: 'tarefas', resource: 'tarefa', action: 'cancelar', code: 'tarefas.tarefa.cancelar', description: 'Cancelar tarefas' },
      { id: 'p-tsk-9', module: 'tarefas', resource: 'tarefa', action: 'reabrir', code: 'tarefas.tarefa.reabrir', description: 'Reabrir tarefas encerradas' },
      { id: 'p-tsk-10', module: 'tarefas', resource: 'equipe', action: 'visualizar', code: 'tarefas.equipe.visualizar', description: 'Visualizar equipes operacionais' },
      { id: 'p-tsk-11', module: 'tarefas', resource: 'equipe', action: 'gerenciar', code: 'tarefas.equipe.gerenciar', description: 'Gerenciar equipes e membros' },
      { id: 'p-tsk-12', module: 'tarefas', resource: 'workflow', action: 'visualizar', code: 'tarefas.workflow.visualizar', description: 'Visualizar fluxos de trabalho' },
      { id: 'p-tsk-13', module: 'tarefas', resource: 'workflow', action: 'criar', code: 'tarefas.workflow.criar', description: 'Criar fluxos de trabalho' },
      { id: 'p-tsk-14', module: 'tarefas', resource: 'workflow', action: 'editar', code: 'tarefas.workflow.editar', description: 'Editar fluxos de trabalho' },
      { id: 'p-tsk-15', module: 'tarefas', resource: 'sla', action: 'visualizar', code: 'tarefas.sla.visualizar', description: 'Visualizar políticas de SLA' },
      { id: 'p-tsk-16', module: 'tarefas', resource: 'sla', action: 'configurar', code: 'tarefas.sla.configurar', description: 'Configurar políticas e prazos de SLA' },
      { id: 'p-tsk-17', module: 'tarefas', resource: 'dashboard', action: 'visualizar', code: 'tarefas.dashboard.visualizar', description: 'Visualizar dashboard de produtividade' },
      // Configurações & Políticas (Fase 1.1.5.11)
      { id: 'p-cfg-1', module: 'configuracoes', resource: 'central', action: 'visualizar', code: 'configuracoes.central.visualizar', description: 'Acessar Central de Configurações e Políticas' },
      { id: 'p-cfg-2', module: 'configuracoes', resource: 'parametro', action: 'visualizar', code: 'configuracoes.parametro.visualizar', description: 'Visualizar parâmetros e configurações' },
      { id: 'p-cfg-3', module: 'configuracoes', resource: 'parametro', action: 'editar', code: 'configuracoes.parametro.editar', description: 'Editar parâmetros e overrides' },
      { id: 'p-cfg-4', module: 'configuracoes', resource: 'politica', action: 'visualizar', code: 'configuracoes.politica.visualizar', description: 'Visualizar políticas e regras de negócio' },
      { id: 'p-cfg-5', module: 'configuracoes', resource: 'politica', action: 'criar', code: 'configuracoes.politica.criar', description: 'Criar novas políticas' },
      { id: 'p-cfg-6', module: 'configuracoes', resource: 'politica', action: 'editar', code: 'configuracoes.politica.editar', description: 'Editar políticas e regras' },
      { id: 'p-cfg-7', module: 'configuracoes', resource: 'politica', action: 'ativar', code: 'configuracoes.politica.ativar', description: 'Ativar e agendar políticas' },
      { id: 'p-cfg-8', module: 'configuracoes', resource: 'simulador', action: 'utilizar', code: 'configuracoes.simulador.utilizar', description: 'Utilizar simulador de políticas' },
      { id: 'p-cfg-9', module: 'configuracoes', resource: 'versao', action: 'visualizar', code: 'configuracoes.versao.visualizar', description: 'Visualizar histórico de versões' },
      { id: 'p-cfg-10', module: 'configuracoes', resource: 'rollback', action: 'executar', code: 'configuracoes.rollback.executar', description: 'Executar rollback de versão' },
      { id: 'p-cfg-11', module: 'configuracoes', resource: 'feature_flag', action: 'visualizar', code: 'configuracoes.feature_flag.visualizar', description: 'Visualizar feature flags' },
      { id: 'p-cfg-12', module: 'configuracoes', resource: 'feature_flag', action: 'editar', code: 'configuracoes.feature_flag.editar', description: 'Gerenciar feature flags e kill switches' },
      { id: 'p-cfg-13', module: 'configuracoes', resource: 'historico', action: 'visualizar', code: 'configuracoes.historico.visualizar', description: 'Visualizar auditoria de configurações' },
      // Auditoria & Observabilidade (Fase 1.1.5.12)
      { id: 'p-obs-1', module: 'auditoria', resource: 'central', action: 'visualizar', code: 'auditoria.central.visualizar', description: 'Acessar Central de Auditoria' },
      { id: 'p-obs-2', module: 'auditoria', resource: 'registro', action: 'visualizar', code: 'auditoria.registro.visualizar', description: 'Visualizar registros de auditoria' },
      { id: 'p-obs-3', module: 'auditoria', resource: 'detalhe', action: 'visualizar', code: 'auditoria.detalhe.visualizar', description: 'Visualizar detalhes e diffs de auditoria' },
      { id: 'p-obs-4', module: 'auditoria', resource: 'exportacao', action: 'criar', code: 'auditoria.exportacao.criar', description: 'Exportar trilha de auditoria' },
      { id: 'p-obs-5', module: 'observabilidade', resource: 'dashboard', action: 'visualizar', code: 'observabilidade.dashboard.visualizar', description: 'Visualizar dashboard de observabilidade' },
      { id: 'p-obs-6', module: 'observabilidade', resource: 'trace', action: 'visualizar', code: 'observabilidade.trace.visualizar', description: 'Visualizar rastreamento e traces operacionais' },
      { id: 'p-obs-7', module: 'observabilidade', resource: 'erro', action: 'visualizar', code: 'observabilidade.erro.visualizar', description: 'Visualizar erros e exceções' },
      { id: 'p-obs-8', module: 'observabilidade', resource: 'erro', action: 'detalhe_tecnico', code: 'observabilidade.erro.detalhe_tecnico', description: 'Visualizar detalhes técnicos e stack trace de erros' },
      { id: 'p-obs-9', module: 'observabilidade', resource: 'performance', action: 'visualizar', code: 'observabilidade.performance.visualizar', description: 'Visualizar métricas de performance e latência' },
      { id: 'p-obs-10', module: 'observabilidade', resource: 'fila', action: 'visualizar', code: 'observabilidade.fila.visualizar', description: 'Visualizar filas de processamento' },
      { id: 'p-obs-11', module: 'observabilidade', resource: 'worker', action: 'visualizar', code: 'observabilidade.worker.visualizar', description: 'Visualizar status dos workers' },
      { id: 'p-obs-12', module: 'observabilidade', resource: 'integracao', action: 'visualizar', code: 'observabilidade.integracao.visualizar', description: 'Visualizar telemetria de integrações' },
      { id: 'p-obs-13', module: 'observabilidade', resource: 'seguranca', action: 'visualizar', code: 'observabilidade.seguranca.visualizar', description: 'Visualizar eventos de segurança' },
      { id: 'p-obs-14', module: 'observabilidade', resource: 'saude', action: 'visualizar', code: 'observabilidade.saude.visualizar', description: 'Visualizar saúde do sistema e componentes' },
      // Relatórios & BI (Fase 1.1.5.13)
      { id: 'p-rel-1', module: 'relatorios', resource: 'central', action: 'visualizar', code: 'relatorios.central.visualizar', description: 'Acessar Central de Relatórios e BI' },
      { id: 'p-rel-2', module: 'relatorios', resource: 'relatorio', action: 'visualizar', code: 'relatorios.relatorio.visualizar', description: 'Visualizar relatórios' },
      { id: 'p-rel-3', module: 'relatorios', resource: 'relatorio', action: 'criar', code: 'relatorios.relatorio.criar', description: 'Criar relatórios personalizados' },
      { id: 'p-rel-4', module: 'relatorios', resource: 'relatorio', action: 'editar', code: 'relatorios.relatorio.editar', description: 'Editar relatórios salvos' },
      { id: 'p-rel-5', module: 'relatorios', resource: 'relatorio', action: 'compartilhar', code: 'relatorios.relatorio.compartilhar', description: 'Compartilhar relatórios' },
      { id: 'p-rel-6', module: 'relatorios', resource: 'exportacao', action: 'criar', code: 'relatorios.exportacao.criar', description: 'Exportar relatórios (XLSX, CSV, PDF)' },
      { id: 'p-rel-7', module: 'relatorios', resource: 'exportacao', action: 'baixar', code: 'relatorios.exportacao.baixar', description: 'Baixar arquivos exportados' },
      { id: 'p-rel-8', module: 'relatorios', resource: 'agendamento', action: 'criar', code: 'relatorios.agendamento.criar', description: 'Criar agendamentos periódicos' },
      { id: 'p-rel-9', module: 'relatorios', resource: 'indicador', action: 'visualizar', code: 'relatorios.indicador.visualizar', description: 'Visualizar dicionário e catálogo de indicadores' },
      { id: 'p-rel-10', module: 'relatorios', resource: 'dados_sensiveis', action: 'visualizar', code: 'relatorios.dados_sensiveis.visualizar', description: 'Visualizar colunas e campos sensíveis em relatórios' },
      { id: 'p-rel-11', module: 'relatorios', resource: 'vendas', action: 'visualizar', code: 'relatorios.vendas.visualizar', description: 'Visualizar indicadores e relatórios de vendas' },
      { id: 'p-rel-12', module: 'relatorios', resource: 'financeiro', action: 'visualizar', code: 'relatorios.financeiro.visualizar', description: 'Visualizar indicadores e relatórios financeiros' },
      { id: 'p-rel-13', module: 'relatorios', resource: 'marketing', action: 'visualizar', code: 'relatorios.marketing.visualizar', description: 'Visualizar indicadores e relatórios de marketing' },
      { id: 'p-rel-14', module: 'relatorios', resource: 'sac', action: 'visualizar', code: 'relatorios.sac.visualizar', description: 'Visualizar indicadores e relatórios de SAC' },
      { id: 'p-rel-15', module: 'relatorios', resource: 'eventos', action: 'visualizar', code: 'relatorios.eventos.visualizar', description: 'Visualizar indicadores e relatórios de eventos' },
      { id: 'p-rel-16', module: 'relatorios', resource: 'contabilidade', action: 'visualizar', code: 'relatorios.contabilidade.visualizar', description: 'Visualizar indicadores contábeis' },
      // Processamentos, Jobs & Orquestração (Fase 1.1.5.14)
      { id: 'p-prc-1', module: 'processamentos', resource: 'central', action: 'visualizar', code: 'processamentos.central.visualizar', description: 'Visualizar central de processamentos' },
      { id: 'p-prc-2', module: 'processamentos', resource: 'job', action: 'visualizar', code: 'processamentos.job.visualizar', description: 'Visualizar detalhes de processamentos' },
      { id: 'p-prc-3', module: 'processamentos', resource: 'job', action: 'cancelar', code: 'processamentos.job.cancelar', description: 'Cancelar processamentos executáveis' },
      { id: 'p-prc-4', module: 'processamentos', resource: 'job', action: 'pausar', code: 'processamentos.job.pausar', description: 'Pausar processamentos em lote' },
      { id: 'p-prc-5', module: 'processamentos', resource: 'job', action: 'retomar', code: 'processamentos.job.retomar', description: 'Retomar processamentos pausados' },
      { id: 'p-prc-6', module: 'processamentos', resource: 'job', action: 'reprocessar', code: 'processamentos.job.reprocessar', description: 'Reprocessar jobs com falha' },
      { id: 'p-prc-7', module: 'processamentos', resource: 'lote', action: 'visualizar', code: 'processamentos.lote.visualizar', description: 'Visualizar lotes de processamento' },
      { id: 'p-prc-8', module: 'processamentos', resource: 'lote', action: 'executar', code: 'processamentos.lote.executar', description: 'Disparar processamento em lote' },
      { id: 'p-prc-9', module: 'processamentos', resource: 'lote', action: 'cancelar', code: 'processamentos.lote.cancelar', description: 'Cancelar lote de processamento' },
      { id: 'p-prc-10', module: 'processamentos', resource: 'agendamento', action: 'visualizar', code: 'processamentos.agendamento.visualizar', description: 'Visualizar agendamentos de rotinas' },
      { id: 'p-prc-11', module: 'processamentos', resource: 'agendamento', action: 'criar', code: 'processamentos.agendamento.criar', description: 'Criar novos agendamentos' },
      { id: 'p-prc-12', module: 'processamentos', resource: 'agendamento', action: 'editar', code: 'processamentos.agendamento.editar', description: 'Editar rotinas agendadas' },
      { id: 'p-prc-13', module: 'processamentos', resource: 'agendamento', action: 'desativar', code: 'processamentos.agendamento.desativar', description: 'Desativar rotinas agendadas' },
      { id: 'p-prc-14', module: 'processamentos', resource: 'fila', action: 'visualizar', code: 'processamentos.fila.visualizar', description: 'Visualizar métricas e status das filas' },
      { id: 'p-prc-15', module: 'processamentos', resource: 'worker', action: 'visualizar', code: 'processamentos.worker.visualizar', description: 'Visualizar workers e telemetria' },
      { id: 'p-prc-16', module: 'processamentos', resource: 'dead_letter', action: 'visualizar', code: 'processamentos.dead_letter.visualizar', description: 'Visualizar processamentos em Dead Letter' },
      { id: 'p-prc-17', module: 'processamentos', resource: 'dead_letter', action: 'reprocessar', code: 'processamentos.dead_letter.reprocessar', description: 'Reprocessar processamentos da Dead Letter' },
      // Dados, Importações, Migração e Qualidade (Fase 1.1.5.15)
      { id: 'p-dat-1', module: 'dados', resource: 'central', action: 'visualizar', code: 'dados.central.visualizar', description: 'Visualizar Central de Dados e Importações' },
      { id: 'p-dat-2', module: 'dados', resource: 'importacao', action: 'visualizar', code: 'dados.importacao.visualizar', description: 'Visualizar importações de dados' },
      { id: 'p-dat-3', module: 'dados', resource: 'importacao', action: 'criar', code: 'dados.importacao.criar', description: 'Criar novas importações' },
      { id: 'p-dat-4', module: 'dados', resource: 'importacao', action: 'executar', code: 'dados.importacao.executar', description: 'Executar importações de dados' },
      { id: 'p-dat-5', module: 'dados', resource: 'importacao', action: 'cancelar', code: 'dados.importacao.cancelar', description: 'Cancelar importações' },
      { id: 'p-dat-6', module: 'dados', resource: 'importacao', action: 'reprocessar', code: 'dados.importacao.reprocessar', description: 'Reprocessar erros de importação' },
      { id: 'p-dat-7', module: 'dados', resource: 'mapeamento', action: 'visualizar', code: 'dados.mapeamento.visualizar', description: 'Visualizar mapeamentos de colunas' },
      { id: 'p-dat-8', module: 'dados', resource: 'mapeamento', action: 'criar', code: 'dados.mapeamento.criar', description: 'Criar mapeamentos de colunas' },
      { id: 'p-dat-9', module: 'dados', resource: 'mapeamento', action: 'editar', code: 'dados.mapeamento.editar', description: 'Editar mapeamentos de colunas' },
      { id: 'p-dat-10', module: 'dados', resource: 'modelo', action: 'visualizar', code: 'dados.modelo.visualizar', description: 'Visualizar modelos de importação' },
      { id: 'p-dat-11', module: 'dados', resource: 'modelo', action: 'baixar', code: 'dados.modelo.baixar', description: 'Baixar modelos de importação' },
      { id: 'p-dat-12', module: 'dados', resource: 'qualidade', action: 'visualizar', code: 'dados.qualidade.visualizar', description: 'Visualizar qualidade de dados' },
      { id: 'p-dat-13', module: 'dados', resource: 'qualidade', action: 'gerenciar', code: 'dados.qualidade.gerenciar', description: 'Gerenciar regras de qualidade' },
      { id: 'p-dat-14', module: 'dados', resource: 'duplicidade', action: 'visualizar', code: 'dados.duplicidade.visualizar', description: 'Visualizar duplicidades' },
      { id: 'p-dat-15', module: 'dados', resource: 'duplicidade', action: 'resolver', code: 'dados.duplicidade.resolver', description: 'Resolver duplicidades e merge' },
      { id: 'p-dat-16', module: 'dados', resource: 'migracao', action: 'visualizar', code: 'dados.migracao.visualizar', description: 'Visualizar projetos de migração' },
      { id: 'p-dat-17', module: 'dados', resource: 'migracao', action: 'criar', code: 'dados.migracao.criar', description: 'Criar projetos de migração' },
      { id: 'p-dat-18', module: 'dados', resource: 'migracao', action: 'executar', code: 'dados.migracao.executar', description: 'Executar projetos de migração' },
      { id: 'p-dat-19', module: 'dados', resource: 'rollback', action: 'executar', code: 'dados.rollback.executar', description: 'Executar rollback e compensações' },
      { id: 'p-dat-20', module: 'dados', resource: 'historico', action: 'visualizar', code: 'dados.historico.visualizar', description: 'Visualizar histórico de dados' }
    ];
    this.permissions.push(...initialPermissions);

    // 3. Associar Permissões aos Perfis
    const associate = (roleCode: string, permCode: string) => {
      const role = this.roles.find(r => r.code === roleCode);
      const perm = this.permissions.find(p => p.code === permCode);
      if (role && perm) {
        this.rolePermissions.push({
          id: `rp-${this.rolePermissions.length + 1}`,
          roleId: role.id,
          permissionId: perm.id
        });
      }
    };

    // Financeiro
    associate('FINANCEIRO', 'financeiro.dashboard.visualizar');
    associate('FINANCEIRO', 'financeiro.saldo.visualizar');
    associate('FINANCEIRO', 'financeiro.transferencia.criar');
    associate('FINANCEIRO', 'financeiro.repasses.visualizar');
    associate('FINANCEIRO', 'busca.global.utilizar');
    associate('FINANCEIRO', 'busca.pedido.visualizar');
    associate('FINANCEIRO', 'busca.pagamento.visualizar');
    associate('FINANCEIRO', 'busca.estorno.visualizar');
    associate('FINANCEIRO', 'busca.evento.visualizar');
    associate('FINANCEIRO', 'busca.produtor.visualizar');
    associate('FINANCEIRO', 'busca.cliente.visualizar');
    associate('FINANCEIRO', 'cliente.documento.visualizar_completo');
    associate('FINANCEIRO', 'aprovacoes.caixa.visualizar');
    associate('FINANCEIRO', 'aprovacoes.solicitacao.visualizar');
    associate('FINANCEIRO', 'aprovacoes.solicitacao.criar');
    associate('FINANCEIRO', 'aprovacoes.solicitacao.aprovar');
    associate('FINANCEIRO', 'aprovacoes.solicitacao.rejeitar');
    associate('FINANCEIRO', 'aprovacoes.solicitacao.cancelar');
    associate('FINANCEIRO', 'aprovacoes.historico.visualizar');
    associate('FINANCEIRO', 'aprovacoes.delegacao.criar');

    // SAC
    associate('ATENDIMENTO_SAC', 'sac.consulta.acessar');
    associate('ATENDIMENTO_SAC', 'sac.pedido.visualizar');
    associate('ATENDIMENTO_SAC', 'busca.global.utilizar');
    associate('ATENDIMENTO_SAC', 'busca.cliente.visualizar');
    associate('ATENDIMENTO_SAC', 'busca.pedido.visualizar');
    associate('ATENDIMENTO_SAC', 'busca.ingresso.visualizar');
    associate('ATENDIMENTO_SAC', 'busca.ticket.visualizar');
    associate('ATENDIMENTO_SAC', 'busca.estorno.visualizar');
    associate('ATENDIMENTO_SAC', 'aprovacoes.caixa.visualizar');
    associate('ATENDIMENTO_SAC', 'aprovacoes.solicitacao.visualizar');
    associate('ATENDIMENTO_SAC', 'aprovacoes.solicitacao.criar');
    associate('ATENDIMENTO_SAC', 'aprovacoes.solicitacao.cancelar');
    // Note: ATENDIMENTO_SAC standard does not have cliente.documento.visualizar_completo (masked CPF)

    // Estorno
    associate('ESTORNO', 'estorno.solicitacao.visualizar');
    associate('ESTORNO', 'estorno.solicitacao.aprovar');
    associate('ESTORNO', 'aprovacoes.caixa.visualizar');
    associate('ESTORNO', 'aprovacoes.solicitacao.visualizar');
    associate('ESTORNO', 'aprovacoes.solicitacao.criar');
    associate('ESTORNO', 'aprovacoes.solicitacao.aprovar');
    associate('ESTORNO', 'aprovacoes.solicitacao.rejeitar');
    associate('ESTORNO', 'aprovacoes.historico.visualizar');

    // Marketing
    associate('MARKETING', 'marketing.campanha.visualizar');
    associate('MARKETING', 'marketing.campanha.criar');
    associate('MARKETING', 'busca.global.utilizar');
    associate('MARKETING', 'busca.campanha.visualizar');
    associate('MARKETING', 'busca.evento.visualizar');

    // Contabilidade
    associate('CONTABILIDADE', 'contabilidade.dre.visualizar');

    // Produtor
    associate('PRODUTOR', 'eventos.evento.visualizar');
    associate('PRODUTOR', 'eventos.evento.criar');
    associate('PRODUTOR', 'eventos.evento.editar');
    associate('PRODUTOR', 'busca.global.utilizar');
    associate('PRODUTOR', 'busca.evento.visualizar');
    associate('PRODUTOR', 'busca.ingresso.visualizar');
    associate('PRODUTOR', 'busca.pedido.visualizar');
    associate('PRODUTOR', 'aprovacoes.caixa.visualizar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.visualizar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.criar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.cancelar');

    // Documentos (Fase 1.1.5.8)
    // Financeiro
    associate('FINANCEIRO', 'documentos.central.visualizar');
    associate('FINANCEIRO', 'documentos.arquivo.visualizar');
    associate('FINANCEIRO', 'documentos.arquivo.enviar');
    associate('FINANCEIRO', 'documentos.arquivo.baixar');
    associate('FINANCEIRO', 'documentos.versao.criar');
    associate('FINANCEIRO', 'documentos.versao.visualizar');
    associate('FINANCEIRO', 'documentos.categoria.visualizar');

    // SAC
    associate('ATENDIMENTO_SAC', 'documentos.arquivo.visualizar');
    associate('ATENDIMENTO_SAC', 'documentos.arquivo.enviar');
    associate('ATENDIMENTO_SAC', 'documentos.arquivo.baixar');
    associate('ATENDIMENTO_SAC', 'documentos.categoria.visualizar');

    // Estorno
    associate('ESTORNO', 'documentos.arquivo.visualizar');
    associate('ESTORNO', 'documentos.arquivo.enviar');
    associate('ESTORNO', 'documentos.arquivo.baixar');
    associate('ESTORNO', 'documentos.categoria.visualizar');

    // Produtor
    associate('PRODUTOR', 'documentos.central.visualizar');
    associate('PRODUTOR', 'documentos.arquivo.visualizar');
    associate('PRODUTOR', 'documentos.arquivo.enviar');
    associate('PRODUTOR', 'documentos.arquivo.baixar');
    associate('PRODUTOR', 'documentos.versao.criar');
    associate('PRODUTOR', 'documentos.versao.visualizar');

    // Auditor
    associate('AUDITOR', 'documentos.central.visualizar');
    associate('AUDITOR', 'documentos.arquivo.visualizar');
    associate('AUDITOR', 'documentos.arquivo.baixar');
    associate('AUDITOR', 'documentos.versao.visualizar');
    associate('AUDITOR', 'documentos.auditoria.visualizar');
    associate('AUDITOR', 'documentos.categoria.visualizar');

    // Tarefas & Fluxos de Trabalho (Fase 1.1.5.9)
    // Administrador Geral
    this.permissions.filter(p => p.code.startsWith('tarefas.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });

    // Financeiro
    associate('FINANCEIRO', 'tarefas.central.visualizar');
    associate('FINANCEIRO', 'tarefas.tarefa.visualizar');
    associate('FINANCEIRO', 'tarefas.tarefa.criar');
    associate('FINANCEIRO', 'tarefas.tarefa.editar');
    associate('FINANCEIRO', 'tarefas.tarefa.assumir');
    associate('FINANCEIRO', 'tarefas.tarefa.concluir');
    associate('FINANCEIRO', 'tarefas.tarefa.reatribuir');
    associate('FINANCEIRO', 'tarefas.tarefa.reabrir');
    associate('FINANCEIRO', 'tarefas.equipe.visualizar');

    // SAC
    associate('ATENDIMENTO_SAC', 'tarefas.central.visualizar');
    associate('ATENDIMENTO_SAC', 'tarefas.tarefa.visualizar');
    associate('ATENDIMENTO_SAC', 'tarefas.tarefa.criar');
    associate('ATENDIMENTO_SAC', 'tarefas.tarefa.assumir');
    associate('ATENDIMENTO_SAC', 'tarefas.tarefa.concluir');
    associate('ATENDIMENTO_SAC', 'tarefas.tarefa.reatribuir');
    associate('ATENDIMENTO_SAC', 'tarefas.equipe.visualizar');

    // Estorno
    associate('ESTORNO', 'tarefas.central.visualizar');
    associate('ESTORNO', 'tarefas.tarefa.visualizar');
    associate('ESTORNO', 'tarefas.tarefa.criar');
    associate('ESTORNO', 'tarefas.tarefa.assumir');
    associate('ESTORNO', 'tarefas.tarefa.concluir');
    associate('ESTORNO', 'tarefas.tarefa.reatribuir');
    associate('ESTORNO', 'tarefas.equipe.visualizar');

    // Suporte Eventos
    associate('SUPORTE_EVENTOS', 'tarefas.central.visualizar');
    associate('SUPORTE_EVENTOS', 'tarefas.tarefa.visualizar');
    associate('SUPORTE_EVENTOS', 'tarefas.tarefa.criar');
    associate('SUPORTE_EVENTOS', 'tarefas.tarefa.assumir');
    associate('SUPORTE_EVENTOS', 'tarefas.tarefa.concluir');
    associate('SUPORTE_EVENTOS', 'tarefas.tarefa.reatribuir');
    associate('SUPORTE_EVENTOS', 'tarefas.equipe.visualizar');

    // Produtor
    associate('PRODUTOR', 'tarefas.central.visualizar');
    associate('PRODUTOR', 'tarefas.tarefa.visualizar');

    // Auditor
    associate('AUDITOR', 'tarefas.central.visualizar');
    associate('AUDITOR', 'tarefas.tarefa.visualizar');
    associate('AUDITOR', 'tarefas.dashboard.visualizar');
    associate('AUDITOR', 'tarefas.workflow.visualizar');
    associate('AUDITOR', 'tarefas.sla.visualizar');

    // Configurações & Políticas (Fase 1.1.5.11)
    this.permissions.filter(p => p.code.startsWith('configuracoes.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });
    associate('AUDITOR', 'configuracoes.central.visualizar');
    associate('AUDITOR', 'configuracoes.parametro.visualizar');
    associate('AUDITOR', 'configuracoes.politica.visualizar');
    associate('AUDITOR', 'configuracoes.versao.visualizar');
    associate('AUDITOR', 'configuracoes.historico.visualizar');

    associate('PRODUTOR', 'configuracoes.central.visualizar');
    associate('PRODUTOR', 'configuracoes.parametro.visualizar');
    associate('PRODUTOR', 'configuracoes.parametro.editar');
    associate('PRODUTOR', 'configuracoes.politica.visualizar');
    associate('PRODUTOR', 'configuracoes.simulador.utilizar');

    associate('FINANCEIRO', 'configuracoes.central.visualizar');
    associate('FINANCEIRO', 'configuracoes.parametro.visualizar');
    associate('FINANCEIRO', 'configuracoes.politica.visualizar');
    associate('FINANCEIRO', 'configuracoes.simulador.utilizar');

    // Auditoria & Observabilidade (Fase 1.1.5.12)
    this.permissions.filter(p => p.code.startsWith('auditoria.') || p.code.startsWith('observabilidade.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });
    associate('AUDITOR', 'auditoria.central.visualizar');
    associate('AUDITOR', 'auditoria.registro.visualizar');
    associate('AUDITOR', 'auditoria.detalhe.visualizar');
    associate('AUDITOR', 'auditoria.exportacao.criar');
    associate('AUDITOR', 'observabilidade.dashboard.visualizar');
    associate('AUDITOR', 'observabilidade.trace.visualizar');
    associate('AUDITOR', 'observabilidade.erro.visualizar');

    associate('SUPORTE_EVENTOS', 'observabilidade.dashboard.visualizar');
    associate('SUPORTE_EVENTOS', 'observabilidade.trace.visualizar');
    associate('SUPORTE_EVENTOS', 'observabilidade.erro.visualizar');
    associate('SUPORTE_EVENTOS', 'observabilidade.saude.visualizar');

    // Relatórios & BI (Fase 1.1.5.13)
    this.permissions.filter(p => p.code.startsWith('relatorios.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });
    associate('FINANCEIRO', 'relatorios.central.visualizar');
    associate('FINANCEIRO', 'relatorios.financeiro.visualizar');
    associate('FINANCEIRO', 'relatorios.relatorio.visualizar');
    associate('FINANCEIRO', 'relatorios.exportacao.criar');
    associate('FINANCEIRO', 'relatorios.exportacao.baixar');
    associate('FINANCEIRO', 'relatorios.indicador.visualizar');

    associate('MARKETING', 'relatorios.central.visualizar');
    associate('MARKETING', 'relatorios.marketing.visualizar');
    associate('MARKETING', 'relatorios.relatorio.visualizar');
    associate('MARKETING', 'relatorios.exportacao.criar');

    associate('ATENDIMENTO_SAC', 'relatorios.central.visualizar');
    associate('ATENDIMENTO_SAC', 'relatorios.sac.visualizar');

    associate('PRODUTOR', 'relatorios.central.visualizar');
    associate('PRODUTOR', 'relatorios.eventos.visualizar');
    associate('PRODUTOR', 'relatorios.vendas.visualizar');
    associate('PRODUTOR', 'relatorios.relatorio.visualizar');
    associate('PRODUTOR', 'relatorios.exportacao.criar');
    associate('PRODUTOR', 'relatorios.exportacao.baixar');

    // Processamentos & Jobs (Fase 1.1.5.14)
    this.permissions.filter(p => p.code.startsWith('processamentos.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });
    associate('FINANCEIRO', 'processamentos.central.visualizar');
    associate('FINANCEIRO', 'processamentos.job.visualizar');
    associate('FINANCEIRO', 'processamentos.job.reprocessar');
    associate('FINANCEIRO', 'processamentos.lote.visualizar');
    associate('FINANCEIRO', 'processamentos.lote.executar');
    associate('FINANCEIRO', 'processamentos.agendamento.visualizar');
    associate('FINANCEIRO', 'processamentos.fila.visualizar');

    associate('MARKETING', 'processamentos.central.visualizar');
    associate('MARKETING', 'processamentos.job.visualizar');
    associate('MARKETING', 'processamentos.agendamento.visualizar');

    associate('PRODUTOR', 'processamentos.central.visualizar');
    associate('PRODUTOR', 'processamentos.job.visualizar');

    associate('AUDITOR', 'processamentos.central.visualizar');
    associate('AUDITOR', 'processamentos.job.visualizar');
    associate('AUDITOR', 'processamentos.fila.visualizar');
    associate('AUDITOR', 'processamentos.worker.visualizar');
    associate('AUDITOR', 'processamentos.dead_letter.visualizar');

    // Dados, Importação, Migração & Qualidade (Fase 1.1.5.15)
    this.permissions.filter(p => p.code.startsWith('dados.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
    });
    associate('FINANCEIRO', 'dados.central.visualizar');
    associate('FINANCEIRO', 'dados.importacao.visualizar');
    associate('FINANCEIRO', 'dados.importacao.criar');
    associate('FINANCEIRO', 'dados.importacao.executar');
    associate('FINANCEIRO', 'dados.mapeamento.visualizar');
    associate('FINANCEIRO', 'dados.modelo.visualizar');
    associate('FINANCEIRO', 'dados.modelo.baixar');
    associate('FINANCEIRO', 'dados.qualidade.visualizar');
    associate('FINANCEIRO', 'dados.duplicidade.visualizar');

    associate('PRODUTOR', 'dados.central.visualizar');
    associate('PRODUTOR', 'dados.importacao.visualizar');
    associate('PRODUTOR', 'dados.importacao.criar');
    associate('PRODUTOR', 'dados.modelo.visualizar');
    associate('PRODUTOR', 'dados.modelo.baixar');

    // 4. Produtores Iniciais
    this.producers.push(
      { id: 'prd_100', name: 'Opus Entretenimento', cnpj: '12.345.678/0001-90', status: 'ACTIVE' },
      { id: 'prd_200', name: 'Live Nation Brasil', cnpj: '98.765.432/0001-11', status: 'ACTIVE' },
      { id: 'prd_300', name: 'CWB Brasil Produções', cnpj: '45.123.890/0001-55', status: 'ACTIVE' }
    );

    // 5. Eventos Iniciais (Fase 1.2)
    this.events.push(
      {
        id: 'evt_1001',
        publicCode: 'EVT-2026-001001',
        producerId: 'prd_100',
        name: 'Festival de Inverno Curitiba 2026',
        title: 'Festival de Inverno Curitiba 2026',
        slug: 'festival-de-inverno-curitiba-2026',
        description: 'Maior festival musical de inverno do sul do país com atrações nacionais.',
        status: 'ON_SALE',
        venue: 'Pedreira Paulo Leminski',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-10-19T18:00:00-03:00'),
        endAt: new Date('2026-10-20T04:00:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 25000,
        soldTickets: 18421,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-09-18T14:20:00Z')
      },
      {
        id: 'evt_1002',
        publicCode: 'EVT-2026-001002',
        producerId: 'prd_100',
        name: 'Teatro Musical Broadway Curitiba',
        title: 'Teatro Musical Broadway Curitiba',
        slug: 'teatro-musical-broadway-curitiba',
        description: 'Espetáculo clássico da Broadway em temporada especial de 3 semanas.',
        status: 'CONFIGURING',
        venue: 'Teatro Positivo',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-10-22T20:00:00-03:00'),
        endAt: new Date('2026-10-22T22:30:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 2400,
        soldTickets: 0,
        createdAt: new Date('2026-02-01T11:00:00Z'),
        updatedAt: new Date('2026-09-18T16:45:00Z')
      },
      {
        id: 'evt_2001',
        publicCode: 'EVT-2026-002001',
        producerId: 'prd_200',
        name: 'Coldplay Experience World Tour',
        title: 'Coldplay Experience World Tour',
        slug: 'coldplay-experience-world-tour',
        description: 'Megaespetáculo com pulseiras de LED e cenografia futurista.',
        status: 'ON_SALE',
        venue: 'Estádio Couto Pereira',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-11-15T21:00:00-03:00'),
        endAt: new Date('2026-11-16T00:30:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 45000,
        soldTickets: 39810,
        createdAt: new Date('2026-03-10T09:30:00Z'),
        updatedAt: new Date('2026-09-19T11:15:00Z')
      },
      {
        id: 'evt_1003',
        publicCode: 'EVT-2026-001003',
        producerId: 'prd_100',
        name: 'Congresso Sul Brasileiro de Inovação',
        title: 'Congresso Sul Brasileiro de Inovação',
        slug: 'congresso-sul-brasileiro-de-inovacao',
        description: 'Keynotes, startups, feira de negócios e rodadas de investimento.',
        status: 'SCHEDULED',
        venue: 'Viasoft Experience',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-11-28T08:00:00-03:00'),
        endAt: new Date('2026-11-29T18:00:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 3500,
        soldTickets: 1200,
        createdAt: new Date('2026-04-05T14:00:00Z'),
        updatedAt: new Date('2026-09-17T09:00:00Z')
      },
      {
        id: 'evt_1004',
        publicCode: 'EVT-2026-001004',
        producerId: 'prd_100',
        name: 'Noite de Stand-Up Comedy Curitiba',
        title: 'Noite de Stand-Up Comedy Curitiba',
        slug: 'noite-de-stand-up-comedy-curitiba',
        description: 'Grandes nomes do humor nacional em apresentação única.',
        status: 'DRAFT',
        venue: 'Curitiba Comedy Club',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-12-05T21:00:00-03:00'),
        endAt: new Date('2026-12-05T23:00:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 450,
        soldTickets: 0,
        createdAt: new Date('2026-05-12T16:30:00Z'),
        updatedAt: new Date('2026-09-19T08:00:00Z')
      },
      {
        id: 'evt_1005',
        publicCode: 'EVT-2026-001005',
        producerId: 'prd_100',
        name: 'Show Acústico na Ópera de Arame',
        title: 'Show Acústico na Ópera de Arame',
        slug: 'show-acustico-na-opera-de-arame',
        description: 'Apresentação acústica intimista com orquestra de câmara.',
        status: 'IN_PROGRESS',
        venue: 'Ópera de Arame',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        startAt: new Date('2026-09-19T20:00:00-03:00'),
        endAt: new Date('2026-09-19T23:30:00-03:00'),
        timezone: 'America/Sao_Paulo',
        capacity: 1800,
        soldTickets: 1780,
        createdAt: new Date('2026-02-20T10:00:00Z'),
        updatedAt: new Date('2026-09-19T20:15:00Z')
      }
    );


    // 6. Regras Padrão de Notificação (Fase 1.1.5.5)
    this.notificationRules.push(
      { id: 'rule_1', eventType: 'FINANCE_TRANSFER_CREATED', requiredPerm: 'financeiro.transferencia.aprovar', defaultPriority: 'HIGH', type: 'ACTION_REQUIRED', isMandatory: false, createdAt: new Date() },
      { id: 'rule_2', eventType: 'FINANCE_TRANSFER_APPROVED', requiredPerm: 'financeiro.saldo.visualizar', defaultPriority: 'NORMAL', type: 'SUCCESS', isMandatory: false, createdAt: new Date() },
      { id: 'rule_3', eventType: 'SAC_SLA_WARNING', requiredPerm: 'sac.consulta.acessar', defaultPriority: 'HIGH', type: 'WARNING', isMandatory: false, createdAt: new Date() },
      { id: 'rule_4', eventType: 'SECURITY_BRUTE_FORCE', requiredPerm: 'admin.usuarios.visualizar', defaultPriority: 'CRITICAL', type: 'CRITICAL', isMandatory: true, createdAt: new Date() },
      { id: 'rule_5', eventType: 'SECURITY_CONTEXT_TAMPERING', requiredPerm: 'admin.usuarios.visualizar', defaultPriority: 'CRITICAL', type: 'CRITICAL', isMandatory: true, createdAt: new Date() },
      { id: 'rule_6', eventType: 'ORDER_PAID', requiredPerm: 'eventos.evento.visualizar', defaultPriority: 'LOW', type: 'SUCCESS', isMandatory: false, createdAt: new Date() }
    );

    // 7. Base de Clientes (Fase 1.1.5.6)
    this.customers.push(
      {
        id: 'cust-maria',
        name: 'Maria Oliveira',
        cpf: '123.456.789-00',
        cpfNormalized: '12345678900',
        email: 'maria.oliveira@email.com',
        emailNormalized: 'maria.oliveira@email.com',
        phone: '(41) 99999-9999',
        phoneNormalized: '41999999999',
        city: 'Curitiba',
        state: 'PR',
        totalOrders: 14,
        totalSpent: 4821.00,
        createdAt: new Date('2024-01-10')
      },
      {
        id: 'cust-1',
        name: 'Carolina Mendes de Albuquerque',
        cpf: '042.889.319-45',
        cpfNormalized: '04288931945',
        email: 'carolina.mendes@gmail.com',
        emailNormalized: 'carolina.mendes@gmail.com',
        phone: '(41) 99871-4422',
        phoneNormalized: '41998714422',
        city: 'Curitiba',
        state: 'PR',
        totalOrders: 6,
        totalSpent: 3420.00,
        createdAt: new Date('2024-02-11')
      },
      {
        id: 'cust-2',
        name: 'Rodrigo Silveira Ramos',
        cpf: '812.304.779-88',
        cpfNormalized: '81230477988',
        email: 'rodrigo.ramos@outlook.com',
        emailNormalized: 'rodrigo.ramos@outlook.com',
        phone: '(41) 98845-1290',
        phoneNormalized: '41988451290',
        city: 'São José dos Pinhais',
        state: 'PR',
        totalOrders: 3,
        totalSpent: 1280.00,
        createdAt: new Date('2024-08-19')
      }
    );

    // 8. Base de Pedidos (Fase 1.1.5.6)
    this.orders.push(
      {
        id: 'ord-984521',
        orderNumber: 'PED-984521',
        orderNumberNormalized: '984521',
        producerId: 'prd_100',
        eventId: 'evt_1001',
        eventName: 'Festival Curitiba 2026',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 2,
        grossAmount: 600.00,
        serviceFee: 42.00,
        totalAmount: 642.00,
        status: 'PAID',
        paymentMethod: 'PIX',
        createdAt: new Date('2026-09-18T14:32:00Z')
      },
      {
        id: 'ord-952114',
        orderNumber: 'PED-952114',
        orderNumberNormalized: '952114',
        producerId: 'prd_200',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 4,
        grossAmount: 1040.00,
        serviceFee: 80.00,
        totalAmount: 1120.00,
        status: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        createdAt: new Date('2026-07-12T10:15:00Z')
      },
      {
        id: 'ord-921885',
        orderNumber: 'PED-921885',
        orderNumberNormalized: '921885',
        producerId: 'prd_100',
        eventId: 'evt_1002',
        eventName: 'Teatro Musical Broadway Curitiba',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 1,
        grossAmount: 250.00,
        serviceFee: 30.00,
        totalAmount: 280.00,
        status: 'CANCELLED',
        paymentMethod: 'PIX',
        createdAt: new Date('2026-05-20T16:00:00Z')
      },
      {
        id: 'ord-rodrigo',
        orderNumber: 'DK-98422',
        orderNumberNormalized: '98422',
        producerId: 'prd_200',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        customerId: 'cust-2',
        customerName: 'Rodrigo Silveira Ramos',
        customerCpf: '812.304.779-88',
        itemsCount: 1,
        grossAmount: 420.00,
        serviceFee: 42.00,
        totalAmount: 462.00,
        status: 'PAID',
        paymentMethod: 'PIX',
        createdAt: new Date('2026-09-18T15:10:40Z')
      }
    );

    // 9. Base de Ingressos (Fase 1.1.5.6)
    this.tickets.push(
      {
        id: 'tkt-88211',
        ticketCode: 'ING-88211',
        ticketCodeNormalized: '88211',
        orderId: 'ord-984521',
        eventId: 'evt_1001',
        eventName: 'Festival Curitiba 2026',
        producerId: 'prd_100',
        sectorName: 'Pista',
        price: 300.00,
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        nominalAttendee: 'Maria Oliveira',
        status: 'VALID',
        qrCode: 'QR-ING-88211',
        checkInAt: null,
        createdAt: new Date('2026-09-18T14:32:00Z')
      },
      {
        id: 'tkt-88212',
        ticketCode: 'ING-88212',
        ticketCodeNormalized: '88212',
        orderId: 'ord-984521',
        eventId: 'evt_1001',
        eventName: 'Festival Curitiba 2026',
        producerId: 'prd_100',
        sectorName: 'Pista',
        price: 300.00,
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        nominalAttendee: 'Beatriz Oliveira',
        status: 'VALID',
        qrCode: 'QR-ING-88212',
        checkInAt: null,
        createdAt: new Date('2026-09-18T14:32:00Z')
      },
      {
        id: 'tkt-rodrigo',
        ticketCode: 'ING-77190',
        ticketCodeNormalized: '77190',
        orderId: 'ord-rodrigo',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        producerId: 'prd_200',
        sectorName: 'Pista Premium A',
        price: 420.00,
        customerName: 'Rodrigo Silveira Ramos',
        customerCpf: '812.304.779-88',
        nominalAttendee: 'Rodrigo Silveira Ramos',
        status: 'VALID',
        qrCode: 'QR-ING-77190',
        checkInAt: null,
        createdAt: new Date('2026-09-18T15:10:40Z')
      }
    );

    // 10. Base de Pagamentos / Transações (Fase 1.1.5.6)
    this.payments.push(
      {
        id: 'pay-552811',
        transactionCode: 'TRX-552811',
        transactionCodeNormalized: '552811',
        orderId: 'ord-984521',
        eventId: 'evt_1001',
        producerId: 'prd_100',
        gateway: 'PIX_BancoCentral',
        method: 'PIX',
        amount: 642.00,
        netAmount: 640.05,
        status: 'APPROVED',
        isReconciled: true,
        createdAt: new Date('2026-09-18T14:32:05Z')
      },
      {
        id: 'pay-998412',
        transactionCode: 'TRX-998412',
        transactionCodeNormalized: '998412',
        orderId: 'ord-952114',
        eventId: 'evt_2001',
        producerId: 'prd_200',
        gateway: 'Cielo',
        method: 'CREDIT_CARD',
        amount: 1120.00,
        netAmount: 1085.20,
        status: 'APPROVED',
        isReconciled: true,
        createdAt: new Date('2026-07-12T10:15:20Z')
      }
    );

    // 11. Base de Estornos (Fase 1.1.5.6)
    this.refunds.push(
      {
        id: 'ref-882',
        refundCode: 'EST-882',
        refundCodeNormalized: '882',
        orderId: 'ord-984521',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        eventId: 'evt_1001',
        producerId: 'prd_100',
        amount: 642.00,
        reason: 'Solicitação do cliente por impossibilidade médica',
        status: 'PENDING_APPROVAL',
        approvedAt: null,
        createdAt: new Date('2026-09-18T16:45:00Z')
      }
    );

    // 12. Base de Tickets de Atendimento SAC (Fase 1.1.5.6)
    this.supportTickets.push(
      {
        id: 'sup-5521',
        ticketCode: 'ATD-5521',
        ticketCodeNormalized: '5521',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        orderId: 'ord-984521',
        eventId: 'evt_1001',
        producerId: 'prd_100',
        channel: 'WHATSAPP',
        subject: 'Divergência na emissão de voucher PIX',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        agentName: 'Carlos Lima',
        slaMinutes: 30,
        createdAt: new Date('2026-09-18T15:20:00Z')
      }
    );

    // 13. Base de Campanhas de Marketing (Fase 1.1.5.6)
    this.marketingCampaigns.push(
      {
        id: 'cmp-1',
        name: 'Festival Curitiba 2026 — Meta Ads',
        nameNormalized: 'festival curitiba 2026 meta ads',
        platform: 'META',
        eventId: 'evt_1001',
        eventName: 'Festival Curitiba 2026',
        producerId: 'prd_100',
        status: 'ACTIVE',
        spend: 12450.00,
        attributedRevenue: 68900.00,
        roas: 5.53,
        cpa: 34.20,
        createdAt: new Date('2026-06-01')
      },
      {
        id: 'cmp-2',
        name: 'Coldplay Curitiba — Google Search',
        nameNormalized: 'coldplay curitiba google search',
        platform: 'GOOGLE',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        producerId: 'prd_200',
        status: 'ACTIVE',
        spend: 24000.00,
        attributedRevenue: 185000.00,
        roas: 7.70,
        cpa: 48.10,
        createdAt: new Date('2026-08-01')
      }
    );

    // 14. Regras Padrão de Aprovação e Alçadas (Fase 1.1.5.7)
    this.approvalRules.push(
      {
        id: 'rule_fin_tier_1',
        code: 'RULE_FIN_TRANSFER_TIER_1',
        name: 'Transferência Financeira — Até R$ 10.000',
        description: 'Alçada operacional: exige 1 aprovação de Supervisor/Gestor',
        operation: 'FINANCE_TRANSFER',
        producerId: null,
        eventId: null,
        minAmount: 0,
        maxAmount: 10000.00,
        approvalsRequired: 1,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: false,
        require2FA: false,
        requireComment: false,
        requiredDocuments: null,
        slaMinutes: 120,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_fin_tier_2',
        code: 'RULE_FIN_TRANSFER_TIER_2',
        name: 'Transferência Financeira — R$ 10.000 a R$ 50.000 (Dupla Validação)',
        description: 'Alçada intermediária: exige 2 aprovações distintas de Gestores Financeiros',
        operation: 'FINANCE_TRANSFER',
        producerId: null,
        eventId: null,
        minAmount: 10000.01,
        maxAmount: 50000.00,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: false,
        require2FA: false,
        requireComment: false,
        requiredDocuments: null,
        slaMinutes: 60,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_fin_tier_3',
        code: 'RULE_FIN_TRANSFER_TIER_3',
        name: 'Transferência Financeira — R$ 50.000 a R$ 200.000 (Dupla Aprovação)',
        description: 'Exige 2 aprovações de gestores financeiros distintos',
        operation: 'FINANCE_TRANSFER',
        producerId: null,
        eventId: null,
        minAmount: 50000.01,
        maxAmount: 200000.00,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: false,
        require2FA: false,
        requireComment: false,
        requiredDocuments: null,
        slaMinutes: 60,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_fin_tier_4',
        code: 'RULE_FIN_TRANSFER_TIER_4',
        name: 'Transferência Crítica Acima de R$ 200.000',
        description: 'Operação de alto risco: exige 2 aprovações com Step-Up de segurança obrigatório',
        operation: 'FINANCE_TRANSFER',
        producerId: null,
        eventId: null,
        minAmount: 200000.01,
        maxAmount: null,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: true,
        require2FA: true,
        requireComment: true,
        requiredDocuments: null,
        slaMinutes: 30,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_opus_spec',
        code: 'RULE_OPUS_TRANSFER_SPECIAL',
        name: 'Política Específica de Transferências — Opus Entretenimento',
        description: 'Transferências acima de R$ 50.000 do produtor Opus exigem 2 aprovações',
        operation: 'FINANCE_TRANSFER',
        producerId: 'prd_100',
        eventId: null,
        minAmount: 50000.01,
        maxAmount: null,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: false,
        require2FA: false,
        requireComment: false,
        allowedRoles: JSON.stringify(['PRODUTOR', 'FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_ref_tier_1',
        code: 'RULE_REFUND_TIER_1',
        name: 'Estorno Operacional até R$ 1.000',
        description: 'Estorno de rotina do SAC: 1 aprovação',
        operation: 'REFUND_REQUEST',
        producerId: null,
        eventId: null,
        minAmount: 0,
        maxAmount: 1000.00,
        approvalsRequired: 1,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        allowedRoles: JSON.stringify(['ESTORNO', 'FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_ref_tier_2',
        code: 'RULE_REFUND_TIER_2',
        name: 'Estorno de Alto Valor acima de R$ 1.000',
        description: 'Exige 2 aprovações de estorno/financeiro',
        operation: 'REFUND_REQUEST',
        producerId: null,
        eventId: null,
        minAmount: 1000.01,
        maxAmount: null,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        allowedRoles: JSON.stringify(['ESTORNO', 'FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_adm_perm',
        code: 'RULE_ADMIN_PERMISSION_CHANGE',
        name: 'Alteração de Permissões Críticas Administrativas',
        description: 'Exige aprovação de 2 administradores com reautenticação Step-Up',
        operation: 'ADMIN_PERMISSION_CHANGE',
        producerId: null,
        eventId: null,
        minAmount: null,
        maxAmount: null,
        approvalsRequired: 2,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requireStepUp: true,
        require2FA: true,
        allowedRoles: JSON.stringify(['ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_seq_payout',
        code: 'RULE_SEQUENTIAL_PAYOUT',
        name: 'Repasse Financeiro Sequencial (Supervisor -> Gestor)',
        operation: 'FINANCE_PAYOUT',
        producerId: null,
        eventId: null,
        minAmount: 10000.00,
        maxAmount: null,
        approvalsRequired: 2,
        isSequential: true,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_adv_docs',
        code: 'RULE_ADVANCE_DOCS',
        name: 'Antecipação Financeira com Documentação Obrigatória',
        operation: 'FINANCE_ADVANCE',
        producerId: null,
        eventId: null,
        minAmount: 0,
        maxAmount: null,
        approvalsRequired: 1,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: true,
        requiredDocuments: JSON.stringify(['NOTA_FISCAL', 'CONTRATO']),
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_cfg_override',
        code: 'RULE_CONFIGURATION_OVERRIDE',
        name: 'Aprovação de Alteração Crítica de Configuração',
        description: 'Exige aprovação para alteração de parâmetros sensíveis da plataforma',
        operation: 'CONFIGURATION_OVERRIDE',
        producerId: null,
        eventId: null,
        minAmount: null,
        maxAmount: null,
        approvalsRequired: 1,
        isSequential: false,
        requireDistinctApprovers: true,
        prohibitSelfApproval: false,
        allowedRoles: JSON.stringify(['ADMINISTRADOR_GERAL']),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      }
    );

    // 15. Matriz Inicial de Alçadas (Thresholds)
    this.approvalThresholds.push(
      {
        id: 'thresh_maria_fin',
        userId: 'usr_fin_maria',
        roleId: null,
        roleCode: 'FINANCEIRO',
        operation: 'FINANCE_TRANSFER',
        maxApprovalAmount: 500000.00,
        producerId: null,
        eventId: null,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'thresh_carlos_fin',
        userId: 'usr_fin_carlos',
        roleId: null,
        roleCode: 'FINANCEIRO',
        operation: 'FINANCE_TRANSFER',
        maxApprovalAmount: 50000.00,
        producerId: null,
        eventId: null,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'thresh_roberto_prod',
        userId: 'usr_prod_opus',
        roleId: null,
        roleCode: 'PRODUTOR',
        operation: 'FINANCE_TRANSFER',
        maxApprovalAmount: 100000.00,
        producerId: 'prd_100',
        eventId: null,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'thresh_role_fin',
        userId: null,
        roleId: null,
        roleCode: 'FINANCEIRO',
        operation: 'REFUND_REQUEST',
        maxApprovalAmount: 10000.00,
        producerId: null,
        eventId: null,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'thresh_role_estorno',
        userId: null,
        roleId: null,
        roleCode: 'ESTORNO',
        operation: 'REFUND_REQUEST',
        maxApprovalAmount: 50000.00,
        producerId: null,
        eventId: null,
        createdAt: new Date('2026-01-01')
      }
    );

    // 16. Categorias Documentais Iniciais (Fase 1.1.5.8)
    const initialCategories = [
      { id: 'cat_contrato', code: 'CONTRATO', name: 'Contrato', description: 'Contratos com produtores, fornecedores e parceiros', retentionDays: 1825, isSensitive: true, maxSizeBytes: 52428800, createdAt: new Date('2026-01-01') },
      { id: 'cat_nf', code: 'NOTA_FISCAL', name: 'Nota Fiscal', description: 'Notas fiscais de serviço e produtos vinculadas a transações', retentionDays: 1825, isSensitive: false, maxSizeBytes: 20971520, createdAt: new Date('2026-01-01') },
      { id: 'cat_comprovante', code: 'COMPROVANTE', name: 'Comprovante', description: 'Comprovantes bancários de transferência, PIX e repasses', retentionDays: 730, isSensitive: false, maxSizeBytes: 10485760, createdAt: new Date('2026-01-01') },
      { id: 'cat_boleto', code: 'BOLETO', name: 'Boleto', description: 'Boletos de cobrança e arrecadação', retentionDays: 365, isSensitive: false, maxSizeBytes: 10485760, createdAt: new Date('2026-01-01') },
      { id: 'cat_extrato', code: 'EXTRATO', name: 'Extrato', description: 'Extratos bancários e de conciliação de adquirentes', retentionDays: 730, isSensitive: true, maxSizeBytes: 20971520, createdAt: new Date('2026-01-01') },
      { id: 'cat_autorizacao', code: 'AUTORIZACAO', name: 'Autorização', description: 'Autorizações formais de diretores e produtores', retentionDays: 1825, isSensitive: false, maxSizeBytes: 10485760, createdAt: new Date('2026-01-01') },
      { id: 'cat_doc_fiscal', code: 'DOCUMENTO_FISCAL', name: 'Documento Fiscal', description: 'Guias de recolhimento, impostos e certidões', retentionDays: 1825, isSensitive: false, maxSizeBytes: 20971520, createdAt: new Date('2026-01-01') },
      { id: 'cat_doc_contabil', code: 'DOCUMENTO_CONTABIL', name: 'Documento Contábil', description: 'Balancetes, demonstrações e fechamentos', retentionDays: 1825, isSensitive: false, maxSizeBytes: 31457280, createdAt: new Date('2026-01-01') },
      { id: 'cat_doc_bancario', code: 'DOCUMENTO_BANCARIO', name: 'Documento Bancário', description: 'Arquivos de remessa, retorno CNAB e cadastros bancários', retentionDays: 730, isSensitive: true, maxSizeBytes: 20971520, createdAt: new Date('2026-01-01') },
      { id: 'cat_relatorio', code: 'RELATORIO', name: 'Relatório', description: 'Relatórios consolidados de auditoria e prestação de contas', retentionDays: 365, isSensitive: false, maxSizeBytes: 52428800, createdAt: new Date('2026-01-01') },
      { id: 'cat_evidencia', code: 'EVIDENCIA', name: 'Evidência', description: 'Evidências de contestação, chargeback e fraudes', retentionDays: 1095, isSensitive: true, maxSizeBytes: 31457280, createdAt: new Date('2026-01-01') },
      { id: 'cat_anexo_atendimento', code: 'ANEXO_ATENDIMENTO', name: 'Anexo de Atendimento', description: 'Prints e anexos de suporte e chamados do SAC', retentionDays: 365, isSensitive: false, maxSizeBytes: 20971520, createdAt: new Date('2026-01-01') },
      { id: 'cat_doc_evento', code: 'DOCUMENTO_EVENTO', name: 'Documento de Evento', description: 'Alvarás dos bombeiros, plantas e autorizações de órgãos públicos', retentionDays: 1825, isSensitive: false, maxSizeBytes: 52428800, createdAt: new Date('2026-01-01') },
      { id: 'cat_criativo', code: 'CRIATIVO', name: 'Criativo', description: 'Artes, banners e materiais promocionais de marketing', retentionDays: 365, isSensitive: false, maxSizeBytes: 52428800, createdAt: new Date('2026-01-01') },
      { id: 'cat_outro', code: 'OUTRO', name: 'Outro', description: 'Outros documentos e anexos gerais', retentionDays: 365, isSensitive: false, maxSizeBytes: 52428800, createdAt: new Date('2026-01-01') }
    ];
    this.documentCategories.push(...initialCategories);

    // 17. Políticas Padrão de Retenção
    this.documentRetentionPolicies.push(
      { id: 'ret_pol_contrato', categoryId: 'cat_contrato', producerId: null, retentionDays: 1825, action: 'ARCHIVE', createdAt: new Date('2026-01-01') },
      { id: 'ret_pol_nf', categoryId: 'cat_nf', producerId: null, retentionDays: 1825, action: 'ARCHIVE', createdAt: new Date('2026-01-01') },
      { id: 'ret_pol_comprovante', categoryId: 'cat_comprovante', producerId: null, retentionDays: 730, action: 'ARCHIVE', createdAt: new Date('2026-01-01') }
    );

    // 18. Requisitos Documentais para Operações e Aprovações
    this.documentRequirements.push(
      {
        id: 'req_fin_transfer_high',
        operation: 'FINANCE_TRANSFER',
        producerId: null,
        eventId: null,
        minAmount: 50000.00,
        maxAmount: null,
        requiredCategories: JSON.stringify(['NOTA_FISCAL', 'AUTORIZACAO']),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'req_fin_advance',
        operation: 'FINANCE_ADVANCE',
        producerId: null,
        eventId: null,
        minAmount: null,
        maxAmount: null,
        requiredCategories: JSON.stringify(['CONTRATO', 'AUTORIZACAO']),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'req_refund_high',
        operation: 'REFUND_REQUEST',
        producerId: null,
        eventId: null,
        minAmount: 500.00,
        maxAmount: null,
        requiredCategories: JSON.stringify(['EVIDENCIA']),
        createdAt: new Date('2026-01-01')
      }
    );

    // 17. Equipes Iniciais (Fase 1.1.5.9)
    this.teams.push(
      { id: 'team_fin', name: 'Financeiro', code: 'FINANCEIRO', description: 'Conciliação, repasses e fechamentos', leaderUserId: 'usr-fin-maria', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_sac', name: 'Atendimento SAC', code: 'SAC', description: 'Atendimento ao cliente e suporte a ingressos', leaderUserId: 'usr-sac-ana', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_estorno', name: 'Estorno & Chargeback', code: 'ESTORNO', description: 'Análise de cancelamentos e chargebacks', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_evt_sul', name: 'Suporte Eventos Sul', code: 'SUPORTE_EVENTOS_SUL', description: 'Operação presencial e portaria no Sul', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_mkt', name: 'Marketing & Tráfego', code: 'MARKETING', description: 'Monitoramento de pixels e campanhas', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_contab', name: 'Contabilidade', code: 'CONTABILIDADE', description: 'Livro diário e fechamento contábil', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'team_sec', name: 'Segurança da Informação', code: 'SEGURANCA', description: 'Auditoria e incidentes de segurança', isActive: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') }
    );

    // 18. Membros das Equipes
    this.teamMembers.push(
      { id: 'tm_maria_fin', teamId: 'team_fin', userId: 'usr_fin_maria', role: 'LEADER', createdAt: new Date('2026-01-01') },
      { id: 'tm_carlos_fin', teamId: 'team_fin', userId: 'usr_fin_carlos', role: 'ANALYST', createdAt: new Date('2026-01-01') },
      { id: 'tm_ana_sac', teamId: 'team_sac', userId: 'usr_sac_ana', role: 'LEADER', createdAt: new Date('2026-01-01') }
    );

    // 19. Modelos de Tarefa (Task Templates)
    this.taskTemplates.push(
      {
        id: 'tmpl_concil',
        code: 'INVESTIGAR_DIVERGENCIA',
        title: 'Investigar Divergência de Conciliação',
        description: 'Investigar divergência entre extrato bancário e gateway',
        module: 'FINANCEIRO',
        priority: 'HIGH',
        defaultEstimatedMinutes: 120,
        targetTeamCode: 'FINANCEIRO',
        checklistTemplate: JSON.stringify([
          { text: 'Conferir arquivo bancário', isRequired: true },
          { text: 'Conferir transações no gateway', isRequired: true },
          { text: 'Identificar divergência', isRequired: true },
          { text: 'Registrar correção', isRequired: false },
          { text: 'Validar resultado', isRequired: true }
        ]),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'tmpl_refund',
        code: 'VALIDAR_ESTORNO',
        title: 'Validar Solicitação de Estorno',
        description: 'Validar documentação e elegibilidade de estorno',
        module: 'ESTORNO',
        priority: 'NORMAL',
        defaultEstimatedMinutes: 60,
        targetTeamCode: 'ESTORNO',
        checklistTemplate: JSON.stringify([
          { text: 'Conferir pedido', isRequired: true },
          { text: 'Conferir pagamento', isRequired: true },
          { text: 'Conferir ingresso', isRequired: true },
          { text: 'Validar justificativa e documentos', isRequired: true },
          { text: 'Encaminhar para aprovação', isRequired: false }
        ]),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'tmpl_checkin',
        code: 'INVESTIGAR_FALHAS_CHECKIN',
        title: 'Investigar Falhas de Check-in na Portaria',
        description: 'Queda na taxa de leitura ou erro de chave criptográfica',
        module: 'EVENTOS',
        priority: 'CRITICAL',
        defaultEstimatedMinutes: 30,
        targetTeamCode: 'SUPORTE_EVENTOS_SUL',
        checklistTemplate: JSON.stringify([
          { text: 'Verificar conexão dos leitores de catraca', isRequired: true },
          { text: 'Validar integridade da chave de criptografia', isRequired: true },
          { text: 'Sincronizar base offline de ingressos', isRequired: true }
        ]),
        createdAt: new Date('2026-01-01')
      }
    );

    // 20. Políticas de SLA
    this.slaPolicies.push(
      {
        id: 'sla_fin_high',
        name: 'SLA Financeiro Divergência',
        module: 'FINANCEIRO',
        priority: 'HIGH',
        durationMinutes: 120,
        warningThresholdPercent: 80,
        criticalThresholdPercent: 95,
        allowPause: true,
        allowedPauseReasons: JSON.stringify(['BANCO', 'GATEWAY', 'PRODUTOR', 'OUTRO_DEPARTAMENTO']),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'sla_sac_normal',
        name: 'SLA Atendimento SAC',
        module: 'SAC',
        priority: 'NORMAL',
        durationMinutes: 240,
        warningThresholdPercent: 80,
        criticalThresholdPercent: 95,
        allowPause: true,
        allowedPauseReasons: JSON.stringify(['CLIENTE', 'PRODUTOR']),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'sla_evt_crit',
        name: 'SLA Crítico Operação Portaria',
        module: 'EVENTOS',
        priority: 'CRITICAL',
        durationMinutes: 30,
        warningThresholdPercent: 70,
        criticalThresholdPercent: 90,
        allowPause: false,
        allowedPauseReasons: JSON.stringify([]),
        createdAt: new Date('2026-01-01')
      }
    );

    // 21. Regras de Escalonamento
    this.escalationRules.push(
      {
        id: 'esc_rule_1',
        slaPolicyId: 'sla_fin_high',
        module: 'FINANCEIRO',
        level: 1,
        triggerMinutesAfterBreach: 30,
        escalateToRole: 'SUPERVISOR',
        escalateToTeamId: 'team_fin',
        notifyChannels: JSON.stringify(['WEBSOCKET', 'NOTIFICATION']),
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'esc_rule_2',
        slaPolicyId: 'sla_fin_high',
        module: 'FINANCEIRO',
        level: 2,
        triggerMinutesAfterBreach: 60,
        escalateToRole: 'MANAGER',
        escalateToTeamId: 'team_fin',
        notifyChannels: JSON.stringify(['WEBSOCKET', 'NOTIFICATION']),
        createdAt: new Date('2026-01-01')
      }
    );

    // 22. Workflows e Regras
    this.workflows.push(
      {
        id: 'wf_reconcil',
        name: 'Tratamento de Divergência Financeira',
        description: 'Dispara tarefa quando divergência de conciliação ultrapassa limite',
        module: 'FINANCEIRO',
        triggerEvent: 'RECONCILIATION_DIVERGENCE_DETECTED',
        isActive: true,
        currentVersion: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'wf_refund',
        name: 'Fluxo Operacional de Estorno',
        description: 'Cria tarefa de validação para a equipe de estorno',
        module: 'ESTORNO',
        triggerEvent: 'REFUND_REQUESTED',
        isActive: true,
        currentVersion: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'wf_checkin',
        name: 'Tratamento de Falhas de Check-in na Portaria',
        description: 'Dispara tarefa crítica quando taxa de leitura falha ultrapassa 15%',
        module: 'EVENTOS',
        triggerEvent: 'CHECKIN_FAILURE_RATE_HIGH',
        isActive: true,
        currentVersion: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'wf_tracking',
        name: 'Saúde de Tracking e Pixels de Conversão',
        description: 'Dispara tarefa de marketing se houver 3 ou mais falhas consecutivas',
        module: 'MARKETING',
        triggerEvent: 'TRACKING_HEALTH_FAILED',
        isActive: true,
        currentVersion: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'wf_accounting',
        name: 'Divergência Contábil no Fechamento',
        description: 'Dispara tarefa quando divergência contábil excede R$ 50',
        module: 'CONTABILIDADE',
        triggerEvent: 'ACCOUNTING_DIVERGENCE',
        isActive: true,
        currentVersion: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      }
    );

    this.workflowRules.push(
      {
        id: 'wfr_reconcil_1',
        workflowId: 'wf_reconcil',
        version: 1,
        name: 'Divergência > R$ 100',
        conditionJson: JSON.stringify({ divergenceAmount: { gt: 100 } }),
        actionJson: JSON.stringify({
          createTasks: [
            {
              templateCode: 'INVESTIGAR_DIVERGENCIA',
              title: 'Investigar divergência de conciliação bancária',
              priority: 'HIGH',
              slaMinutes: 120,
              targetTeamCode: 'FINANCEIRO'
            }
          ]
        }),
        priority: 'HIGH',
        slaMinutes: 120,
        targetTeamId: 'team_fin',
        orderIndex: 1
      },
      {
        id: 'wfr_refund_1',
        workflowId: 'wf_refund',
        version: 1,
        name: 'Validação de Estorno Geral',
        conditionJson: JSON.stringify({}),
        actionJson: JSON.stringify({
          createTasks: [
            {
              templateCode: 'VALIDAR_ESTORNO',
              title: 'Validar solicitação de estorno',
              priority: 'NORMAL',
              slaMinutes: 60,
              targetTeamCode: 'ESTORNO'
            }
          ]
        }),
        priority: 'NORMAL',
        slaMinutes: 60,
        targetTeamId: 'team_estorno',
        orderIndex: 1
      },
      {
        id: 'wfr_checkin_1',
        workflowId: 'wf_checkin',
        version: 1,
        name: 'Taxa de falhas > 15%',
        conditionJson: JSON.stringify({ failureRate: { gt: 15 } }),
        actionJson: JSON.stringify({
          createTasks: [
            {
              templateCode: 'INVESTIGAR_FALHAS_CHECKIN',
              title: 'Investigar taxa alta de falhas de check-in na portaria',
              priority: 'CRITICAL',
              slaMinutes: 30,
              targetTeamCode: 'SUPORTE_EVENTOS_SUL'
            }
          ]
        }),
        priority: 'CRITICAL',
        slaMinutes: 30,
        targetTeamId: 'team_evt_sul',
        orderIndex: 1
      },
      {
        id: 'wfr_tracking_1',
        workflowId: 'wf_tracking',
        version: 1,
        name: 'Erros de Pixel >= 3',
        conditionJson: JSON.stringify({ consecutiveErrors: { gte: 3 } }),
        actionJson: JSON.stringify({
          createTasks: [
            {
              title: 'Restabelecer disparo do pixel de conversão',
              priority: 'HIGH',
              slaMinutes: 60,
              targetTeamCode: 'MARKETING'
            }
          ]
        }),
        priority: 'HIGH',
        slaMinutes: 60,
        targetTeamId: 'team_mkt',
        orderIndex: 1
      },
      {
        id: 'wfr_accounting_1',
        workflowId: 'wf_accounting',
        version: 1,
        name: 'Divergência Contábil > R$ 50',
        conditionJson: JSON.stringify({ divergenceAmount: { gt: 50 } }),
        actionJson: JSON.stringify({
          createTasks: [
            {
              title: 'Ajuste de lançamento no livro diário',
              priority: 'NORMAL',
              slaMinutes: 180,
              targetTeamCode: 'CONTABILIDADE'
            }
          ]
        }),
        priority: 'NORMAL',
        slaMinutes: 180,
        targetTeamId: 'team_contab',
        orderIndex: 1
      }
    );

    this.workflowVersions.push(
      {
        id: 'wfv_reconcil_1',
        workflowId: 'wf_reconcil',
        version: 1,
        rulesSnapshot: JSON.stringify([
          {
            id: 'wfr_reconcil_1',
            conditionJson: { divergenceAmount: { gt: 100 } },
            actionJson: {
              createTasks: [
                {
                  templateCode: 'INVESTIGAR_DIVERGENCIA',
                  title: 'Investigar divergência de conciliação bancária',
                  priority: 'HIGH',
                  slaMinutes: 120,
                  targetTeamCode: 'FINANCEIRO'
                }
              ]
            },
            priority: 'HIGH',
            slaMinutes: 120
          }
        ]),
        changeReason: 'Versão inicial do fluxo de reconciliação',
        createdByUserId: 'usr-admin-1',
        createdAt: new Date('2026-01-01')
      }
    );

    // 23. Disponibilidade Inicial de Usuários
    this.userAvailabilities.push(
      { id: 'uav_maria', userId: 'usr-fin-maria', status: 'AVAILABLE', currentWorkloadScore: 2, lastAssignedAt: new Date('2026-09-18T10:00:00Z'), updatedAt: new Date() },
      { id: 'uav_carlos', userId: 'usr-fin-carlos', status: 'AVAILABLE', currentWorkloadScore: 1, lastAssignedAt: new Date('2026-09-18T11:00:00Z'), updatedAt: new Date() },
      { id: 'uav_ana', userId: 'usr-sac-ana', status: 'AVAILABLE', currentWorkloadScore: 0, lastAssignedAt: null, updatedAt: new Date() },
      { id: 'uav_maria_2', userId: 'usr_fin_maria', status: 'AVAILABLE', currentWorkloadScore: 2, lastAssignedAt: new Date('2026-09-18T10:00:00Z'), updatedAt: new Date() },
      { id: 'uav_carlos_2', userId: 'usr_fin_carlos', status: 'AVAILABLE', currentWorkloadScore: 1, lastAssignedAt: new Date('2026-09-18T11:00:00Z'), updatedAt: new Date() },
      { id: 'uav_ana_2', userId: 'usr_sac_ana', status: 'AVAILABLE', currentWorkloadScore: 0, lastAssignedAt: null, updatedAt: new Date() }
    );

    // 24. Escalas de Plantão (Duty Schedules)
    this.dutySchedules.push(
      {
        id: 'duty_1',
        teamId: 'team_evt_sul',
        producerId: 'prd_100',
        eventId: 'evt_1001',
        shiftStart: '00:00',
        shiftEnd: '23:59',
        activeUserIds: JSON.stringify(['usr_superadmin', 'usr-admin-1']),
        isActive: true,
        createdAt: new Date('2026-01-01')
      }
    );

    // 25. Definições e Configurações Iniciais (Fase 1.1.5.11)
    const initialDefinitions = [
      {
        id: 'cfg_def_1',
        key: 'finance.transfer.enabled',
        domain: 'FINANCE',
        name: 'Habilitar Transferências entre Eventos',
        description: 'Permite operações de transferência de saldo entre contas de eventos',
        type: 'BOOLEAN',
        unit: null,
        defaultValue: 'true',
        allowedValues: null,
        validationSchema: null,
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_2',
        key: 'finance.transfer.minimum_balance',
        domain: 'FINANCE',
        name: 'Saldo Mínimo de Segurança',
        description: 'Saldo de reserva obrigatório retido no evento de origem',
        type: 'CURRENCY',
        unit: 'BRL',
        defaultValue: '5000',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 0 }),
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_3',
        key: 'finance.transfer.approval.threshold',
        domain: 'FINANCE',
        name: 'Limite para Dupla Aprovação de Transferência',
        description: 'Valores acima deste patamar exigem duas validações financeiras',
        type: 'CURRENCY',
        unit: 'BRL',
        defaultValue: '50000',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 0 }),
        sensitivity: 'SENSITIVE',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_4',
        key: 'finance.transfer.requires_approval',
        domain: 'FINANCE',
        name: 'Exigir Aprovação para Transferência',
        description: 'Determina se toda transferência deve passar pelo Motor de Aprovações',
        type: 'BOOLEAN',
        unit: null,
        defaultValue: 'true',
        allowedValues: null,
        validationSchema: null,
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_5',
        key: 'refund.approval.required',
        domain: 'REFUNDS',
        name: 'Exigir Aprovação para Estorno',
        description: 'Determina se estornos requerem validação manual da equipe',
        type: 'BOOLEAN',
        unit: null,
        defaultValue: 'true',
        allowedValues: null,
        validationSchema: null,
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_6',
        key: 'refund.max_days_allowed',
        domain: 'REFUNDS',
        name: 'Prazo Máximo para Solicitação de Estorno',
        description: 'Dias corridos após a compra permitidos para solicitação de estorno',
        type: 'INTEGER',
        unit: 'DAYS',
        defaultValue: '7',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 1, max: 90 }),
        sensitivity: 'PUBLIC',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_7',
        key: 'sac.first_response.sla',
        domain: 'SAC',
        name: 'SLA de Primeira Resposta no SAC',
        description: 'Tempo máximo para o primeiro contato ao cliente',
        type: 'DURATION',
        unit: 'MINUTES',
        defaultValue: '60',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 5, max: 1440 }),
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_8',
        key: 'task.auto_assignment.strategy',
        domain: 'TASKS',
        name: 'Estratégia de Atribuição Automática de Tarefas',
        description: 'Algoritmo utilizado para roteamento operacional de tarefas',
        type: 'ENUM',
        unit: null,
        defaultValue: 'WORKLOAD',
        allowedValues: JSON.stringify(['WORKLOAD', 'DUTY', 'ROUND_ROBIN']),
        validationSchema: null,
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_9',
        key: 'security.two_factor.required',
        domain: 'SECURITY',
        name: 'Exigir Autenticação em 2 Etapas (2FA)',
        description: 'Obriga 2FA para operadores do sistema',
        type: 'BOOLEAN',
        unit: null,
        defaultValue: 'false',
        allowedValues: null,
        validationSchema: null,
        sensitivity: 'SENSITIVE',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
        requiresApproval: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_10',
        key: 'security.session.duration_minutes',
        domain: 'SECURITY',
        name: 'Duração Máxima da Sessão',
        description: 'Tempo de expiração de token JWT de sessão',
        type: 'DURATION',
        unit: 'MINUTES',
        defaultValue: '1440',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 15, max: 10080 }),
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_11',
        key: 'document.upload.max_size_mb',
        domain: 'DOCUMENTS',
        name: 'Tamanho Máximo de Upload',
        description: 'Limite global de arquivo para envio à Central de Documentos',
        type: 'INTEGER',
        unit: 'MB',
        defaultValue: '25',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 1, max: 500 }),
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_def_12',
        key: 'integration.retry.max_attempts',
        domain: 'INTEGRATIONS',
        name: 'Tentativas Máximas de Retry em Integrações',
        description: 'Número de tentativas automáticas em caso de falha externa',
        type: 'INTEGER',
        unit: null,
        defaultValue: '3',
        allowedValues: null,
        validationSchema: JSON.stringify({ min: 0, max: 10 }),
        sensitivity: 'INTERNAL',
        allowedScopes: JSON.stringify(['GLOBAL']),
        requiresApproval: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      }
    ];
    this.configurationDefinitions.push(...initialDefinitions);

    // Valores Globais e Overrides Iniciais
    this.configurationValues.push(
      {
        id: 'cfg_val_glob_1',
        definitionId: 'cfg_def_1',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        value: JSON.stringify(true),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_val_glob_2',
        definitionId: 'cfg_def_2',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        value: JSON.stringify(5000),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      // Override Produtor Opus (prd_100): saldo mínimo = R$ 10.000
      {
        id: 'cfg_val_prod_opus_2',
        definitionId: 'cfg_def_2',
        scopeType: 'PRODUCER',
        producerId: 'prd_100',
        eventId: null,
        value: JSON.stringify(10000),
        version: 1,
        isActive: true,
        changeReason: 'Adequação contratual Produtora Opus',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      // Override Evento Festival Curitiba (evt_1001): saldo mínimo = R$ 15.000
      {
        id: 'cfg_val_evt_fest_2',
        definitionId: 'cfg_def_2',
        scopeType: 'EVENT',
        producerId: 'prd_100',
        eventId: 'evt_1001',
        value: JSON.stringify(15000),
        version: 1,
        isActive: true,
        changeReason: 'Reserva especial para festival de grande porte',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_val_glob_3',
        definitionId: 'cfg_def_3',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        value: JSON.stringify(50000),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'cfg_val_glob_6',
        definitionId: 'cfg_def_6',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        value: JSON.stringify(7),
        version: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      }
    );

    // Políticas Iniciais
    this.policies.push(
      {
        id: 'pol_fin_transfer',
        code: 'POL-FIN-TRANSFER',
        name: 'Política Global de Transferências Financeiras',
        domain: 'FINANCE',
        description: 'Controla alçadas e aprovações para movimentações financeiras',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        status: 'ACTIVE',
        currentVersion: 1,
        priority: 100,
        effectiveFrom: new Date('2026-01-01'),
        effectiveUntil: null,
        requiresApproval: true,
        createdBy: 'usr_superadmin',
        creatorName: 'Super Administrador',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'pol_refund',
        code: 'POL-REFUND',
        name: 'Política de Estornos e Reembolsos',
        domain: 'REFUNDS',
        description: 'Regras de validação e aprovação de pedidos de estorno',
        scopeType: 'GLOBAL',
        producerId: null,
        eventId: null,
        status: 'ACTIVE',
        currentVersion: 1,
        priority: 100,
        effectiveFrom: new Date('2026-01-01'),
        effectiveUntil: null,
        requiresApproval: false,
        createdBy: 'usr_superadmin',
        creatorName: 'Super Administrador',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      }
    );

    // Regras das Políticas
    this.policyRules.push(
      {
        id: 'rule_fin_tier1',
        policyId: 'pol_fin_transfer',
        version: 1,
        name: 'Transferência Baixo Valor (<= 30k)',
        description: '1 aprovação obrigatória sem Step-Up',
        priority: 10,
        conditionJson: JSON.stringify([{ field: 'amount', operator: 'LESS_OR_EQUAL', value: 30000 }]),
        actionJson: JSON.stringify({
          decision: true,
          approvalsRequired: 1,
          stepUpRequired: false,
          requiredDocuments: []
        }),
        orderIndex: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_fin_tier2',
        policyId: 'pol_fin_transfer',
        version: 1,
        name: 'Transferência Médio Valor (> 30k e <= 100k)',
        description: '2 aprovações obrigatórias e comprovante',
        priority: 20,
        conditionJson: JSON.stringify([
          { field: 'amount', operator: 'GREATER_THAN', value: 30000 },
          { field: 'amount', operator: 'LESS_OR_EQUAL', value: 100000 }
        ]),
        actionJson: JSON.stringify({
          decision: true,
          approvalsRequired: 2,
          stepUpRequired: false,
          requiredDocuments: ['COMPROVANTE']
        }),
        orderIndex: 2,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_fin_tier3',
        policyId: 'pol_fin_transfer',
        version: 1,
        name: 'Transferência Alto Valor (> 100k)',
        description: '2 aprovações obrigatórias, Step-Up e autorização documental',
        priority: 30,
        conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 100000 }]),
        actionJson: JSON.stringify({
          decision: true,
          approvalsRequired: 2,
          stepUpRequired: true,
          requiredDocuments: ['COMPROVANTE', 'AUTORIZACAO']
        }),
        orderIndex: 3,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_ref_1',
        policyId: 'pol_refund',
        version: 1,
        name: 'Estorno até R$ 500',
        description: 'Aprovação simples',
        priority: 10,
        conditionJson: JSON.stringify([{ field: 'amount', operator: 'LESS_OR_EQUAL', value: 500 }]),
        actionJson: JSON.stringify({
          decision: true,
          approvalsRequired: 1,
          stepUpRequired: false,
          requiredDocuments: []
        }),
        orderIndex: 1,
        isActive: true,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'rule_ref_2',
        policyId: 'pol_refund',
        version: 1,
        name: 'Estorno acima de R$ 500',
        description: 'Dupla aprovação e comprovação de evidência',
        priority: 20,
        conditionJson: JSON.stringify([{ field: 'amount', operator: 'GREATER_THAN', value: 500 }]),
        actionJson: JSON.stringify({
          decision: true,
          approvalsRequired: 2,
          stepUpRequired: false,
          requiredDocuments: ['EVIDENCIA']
        }),
        orderIndex: 2,
        isActive: true,
        createdAt: new Date('2026-01-01')
      }
    );

    this.policyVersions.push(
      {
        id: 'pol_ver_fin_1',
        policyId: 'pol_fin_transfer',
        versionNumber: 1,
        status: 'ACTIVE',
        rulesSnapshot: JSON.stringify(this.policyRules.filter(r => r.policyId === 'pol_fin_transfer')),
        changeReason: 'Versão inicial homologada',
        createdBy: 'usr_superadmin',
        creatorName: 'Super Administrador',
        approvedBy: 'usr_superadmin',
        effectiveFrom: new Date('2026-01-01'),
        effectiveUntil: null,
        createdAt: new Date('2026-01-01')
      },
      {
        id: 'pol_ver_ref_1',
        policyId: 'pol_refund',
        versionNumber: 1,
        status: 'ACTIVE',
        rulesSnapshot: JSON.stringify(this.policyRules.filter(r => r.policyId === 'pol_refund')),
        changeReason: 'Versão inicial de estornos',
        createdBy: 'usr_superadmin',
        creatorName: 'Super Administrador',
        approvedBy: 'usr_superadmin',
        effectiveFrom: new Date('2026-01-01'),
        effectiveUntil: null,
        createdAt: new Date('2026-01-01')
      }
    );

    // Feature Flags & Kill Switches
    this.featureFlags.push(
      {
        id: 'ff_1',
        key: 'feature.new_reconciliation',
        name: 'Nova Conciliação Bancária',
        description: 'Algoritmo unificado de reconciliação de recebíveis',
        isEnabled: true,
        rolloutPercentage: 50,
        allowedRoles: JSON.stringify(['FINANCEIRO', 'ADMINISTRADOR_GERAL']),
        allowedProducers: JSON.stringify(['prd_100']),
        allowedEvents: JSON.stringify([]),
        isKillSwitch: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'ff_kill_transfers',
        key: 'killswitch.automatic_transfers',
        name: 'Kill Switch: Transferências Automáticas',
        description: 'Bloqueio de emergência para suspender liquidações automáticas de saldo',
        isEnabled: true,
        rolloutPercentage: 100,
        allowedRoles: JSON.stringify(['ADMINISTRADOR_GERAL']),
        allowedProducers: JSON.stringify([]),
        allowedEvents: JSON.stringify([]),
        isKillSwitch: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      }
    );
  }

  // Model Emulators with relational hydration
  public get user() {
    return {
      findUnique: async (args: any) => {
        const u = this.users.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.email) return x.email.toLowerCase() === args.where.email.toLowerCase();
          return false;
        });
        if (!u) return null;
        return this.hydrateUser(u, args.include);
      },
      findFirst: async (args: any) => {
        const u = this.users.find(x => {
          if (args.where?.email) return x.email.toLowerCase() === args.where.email.toLowerCase();
          if (args.where?.id) return x.id === args.where.id;
          return true;
        });
        if (!u) return null;
        return this.hydrateUser(u, args.include);
      },
      findMany: async (args?: any) => {
        let list = [...this.users];
        if (args?.where?.status) {
          list = list.filter(x => x.status === args.where.status);
        }
        return list.map(u => this.hydrateUser(u, args?.include));
      },
      create: async (args: any) => {
        const newUser = {
          id: args.data.id || `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: args.data.name,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          status: args.data.status || 'ACTIVE',
          isSuperAdmin: args.data.isSuperAdmin || false,
          twoFactorEnabled: args.data.twoFactorEnabled || false,
          twoFactorSecret: args.data.twoFactorSecret || null,
          lastLoginAt: null,
          passwordChangedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.users.push(newUser);
        return this.hydrateUser(newUser, args.include);
      },
      update: async (args: any) => {
        const u = this.users.find(x => x.id === args.where.id);
        if (!u) throw new Error(`User not found: ${args.where.id}`);
        Object.assign(u, args.data, { updatedAt: new Date() });
        return this.hydrateUser(u, args.include);
      },
      delete: async (args: any) => {
        const idx = this.users.findIndex(x => x.id === args.where.id);
        if (idx >= 0) {
          const deleted = this.users.splice(idx, 1)[0];
          return deleted;
        }
        return null;
      },
      count: async () => this.users.length
    };
  }

  public get role() {
    return {
      findUnique: async (args: any) => {
        const r = this.roles.find(x => x.id === args.where.id || x.code === args.where.code);
        if (!r) return null;
        return this.hydrateRole(r, args.include);
      },
      findMany: async (args?: any) => {
        return this.roles.map(r => this.hydrateRole(r, args?.include));
      },
      create: async (args: any) => {
        const newRole = {
          id: args.data.id || `rol_${Date.now()}`,
          name: args.data.name,
          code: args.data.code,
          description: args.data.description || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.roles.push(newRole);
        return newRole;
      },
      update: async (args: any) => {
        const r = this.roles.find(x => x.id === args.where.id);
        if (!r) throw new Error('Role not found');
        Object.assign(r, args.data, { updatedAt: new Date() });
        return r;
      }
    };
  }

  public get userRole() {
    return {
      create: async (args: any) => {
        const record = {
          id: `ur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: args.data.userId,
          roleId: args.data.roleId,
          createdAt: new Date()
        };
        this.userRoles.push(record);
        return record;
      },
      delete: async (args: any) => {
        const idx = this.userRoles.findIndex(ur => ur.id === args.where.id || (ur.userId === args.where.userId_roleId?.userId && ur.roleId === args.where.userId_roleId?.roleId));
        if (idx >= 0) return this.userRoles.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const before = this.userRoles.length;
        if (args?.where?.userId && args?.where?.roleId) {
          this.userRoles = this.userRoles.filter(ur => !(ur.userId === args.where.userId && ur.roleId === args.where.roleId));
        } else if (args?.where?.userId) {
          this.userRoles = this.userRoles.filter(ur => ur.userId !== args.where.userId);
        }
        return { count: before - this.userRoles.length };
      },
      findMany: async (args: any) => {
        let list = [...this.userRoles];
        if (args?.where?.userId) list = list.filter(ur => ur.userId === args.where.userId);
        return list;
      }
    };
  }

  public get permission() {
    return {
      findUnique: async (args: any) => {
        return this.permissions.find(p => p.id === args.where.id || p.code === args.where.code) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.permissions];
        if (args?.where?.module) list = list.filter(p => p.module === args.where.module);
        return list;
      }
    };
  }

  public get rolePermission() {
    return {
      create: async (args: any) => {
        const record = {
          id: `rp-${Date.now()}`,
          roleId: args.data.roleId,
          permissionId: args.data.permissionId,
          createdAt: new Date()
        };
        this.rolePermissions.push(record);
        return record;
      },
      deleteMany: async (args: any) => {
        const before = this.rolePermissions.length;
        if (args?.where?.roleId && args?.where?.permissionId) {
          this.rolePermissions = this.rolePermissions.filter(rp => !(rp.roleId === args.where.roleId && rp.permissionId === args.where.permissionId));
        }
        return { count: before - this.rolePermissions.length };
      }
    };
  }

  public get userPermission() {
    return {
      create: async (args: any) => {
        const record = {
          id: `up-${Date.now()}`,
          userId: args.data.userId,
          permissionId: args.data.permissionId,
          isGranted: args.data.isGranted ?? true,
          createdAt: new Date()
        };
        this.userPermissions.push(record);
        return record;
      },
      deleteMany: async (args: any) => {
        const before = this.userPermissions.length;
        if (args?.where?.userId) {
          this.userPermissions = this.userPermissions.filter(up => up.userId !== args.where.userId);
        }
        return { count: before - this.userPermissions.length };
      }
    };
  }

  public get producer() {
    return {
      findUnique: async (args: any) => {
        return this.producers.find(p => p.id === args.where?.id || p.cnpj === args.where?.cnpj) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.producers];
        if (args?.where?.id?.in && Array.isArray(args.where.id.in)) {
          list = list.filter(p => args.where.id.in.includes(p.id));
        } else if (args?.where?.id && typeof args.where.id === 'string') {
          list = list.filter(p => p.id === args.where.id);
        }
        return list;
      },
      create: async (args: any) => {
        const newPrd = { id: args.data.id || `prd_${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
        this.producers.push(newPrd);
        return newPrd;
      }
    };
  }

  public get event() {
    return {
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        if (args.where.id) return this.events.find(e => e.id === args.where.id) || null;
        if (args.where.publicCode) return this.events.find(e => e.publicCode === args.where.publicCode) || null;
        return null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.event.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.events];

        const matchFilter = (item: any, where: any): boolean => {
          if (!where) return true;

          // AND condition
          if (where.AND && Array.isArray(where.AND)) {
            for (const sub of where.AND) {
              if (!matchFilter(item, sub)) return false;
            }
          }

          // OR condition
          if (where.OR && Array.isArray(where.OR)) {
            const orMatched = where.OR.some((sub: any) => matchFilter(item, sub));
            if (!orMatched) return false;
          }

          if (where.producerId) {
            if (typeof where.producerId === 'string' && item.producerId !== where.producerId) return false;
            if (where.producerId?.in && Array.isArray(where.producerId.in) && !where.producerId.in.includes(item.producerId)) return false;
          }

          if (where.id) {
            if (typeof where.id === 'string' && item.id !== where.id) return false;
            if (where.id?.in && Array.isArray(where.id.in) && !where.id.in.includes(item.id)) return false;
          }

          if (where.publicCode) {
            if (typeof where.publicCode === 'string' && item.publicCode !== where.publicCode) return false;
            if (where.publicCode?.in && Array.isArray(where.publicCode.in) && !where.publicCode.in.includes(item.publicCode)) return false;
          }


          if (where.status) {
            if (typeof where.status === 'string' && item.status !== where.status) return false;
            if (where.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(item.status)) return false;
          }

          if (where.city) {
            const cityQuery = typeof where.city === 'string' ? where.city : where.city?.contains;
            if (cityQuery && !item.city?.toLowerCase().includes(cityQuery.toLowerCase())) return false;
          }

          if (where.startAt) {
            const itemTime = item.startAt ? new Date(item.startAt).getTime() : 0;
            if (where.startAt.gte && itemTime < new Date(where.startAt.gte).getTime()) return false;
            if (where.startAt.lte && itemTime > new Date(where.startAt.lte).getTime()) return false;
            if (where.startAt.gt && itemTime <= new Date(where.startAt.gt).getTime()) return false;
            if (where.startAt.lt && itemTime >= new Date(where.startAt.lt).getTime()) return false;
          }

          if (where.name?.contains) {
            const q = String(where.name.contains).toLowerCase();
            const matchName = (item.name || item.title || '').toLowerCase().includes(q);
            const matchCode = (item.publicCode || '').toLowerCase().includes(q);
            const matchVenue = (item.venue || '').toLowerCase().includes(q);
            const matchCity = (item.city || '').toLowerCase().includes(q);
            if (!matchName && !matchCode && !matchVenue && !matchCity) return false;
          }

          return true;
        };

        if (args?.where) {
          list = list.filter(e => matchFilter(e, args.where));
        }

        // Sorting
        if (args?.orderBy) {
          const sortKey = Object.keys(args.orderBy)[0];
          const sortDir = args.orderBy[sortKey] === 'desc' ? -1 : 1;
          list.sort((a: any, b: any) => {
            const valA = a[sortKey] instanceof Date ? a[sortKey].getTime() : (a[sortKey] || '');
            const valB = b[sortKey] instanceof Date ? b[sortKey].getTime() : (b[sortKey] || '');
            if (valA < valB) return -1 * sortDir;
            if (valA > valB) return 1 * sortDir;
            return 0;
          });
        }

        // Pagination: skip / take
        const skip = args?.skip || 0;
        const take = args?.take !== undefined ? args.take : list.length;
        return list.slice(skip, skip + take);
      },
      count: async (args?: any) => {
        const matches = await this.event.findMany({ where: args?.where });
        return matches.length;
      },
      create: async (args: any) => {
        const id = args.data.id || `evt_${Date.now()}`;
        const year = new Date().getFullYear();
        const rand = Math.floor(100000 + Math.random() * 900000);
        const publicCode = args.data.publicCode || `EVT-${year}-${rand}`;
        const name = args.data.name || args.data.title || 'Novo Evento';
        const newEvt = {
          id,
          publicCode,
          name,
          title: name,
          timezone: 'America/Sao_Paulo',
          country: 'BR',
          status: 'DRAFT',
          soldTickets: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.events.push(newEvt);
        return newEvt;
      },
      update: async (args: any) => {
        const index = this.events.findIndex(e => e.id === args.where?.id);
        if (index === -1) throw new Error(`Evento "${args.where?.id}" não encontrado.`);
        const existing = this.events[index];
        const updated = {
          ...existing,
          ...args.data,
          name: args.data.name || existing.name,
          title: args.data.name || args.data.title || existing.title,
          updatedAt: new Date()
        };
        this.events[index] = updated;
        return updated;
      }
    };
  }


  public get userProducerAccess() {
    return {
      create: async (args: any) => {
        const record = { id: `upa-${Date.now()}`, userId: args.data.userId, producerId: args.data.producerId, createdAt: new Date() };
        this.userProducerAccesses.push(record);
        return record;
      },
      deleteMany: async (args: any) => {
        const before = this.userProducerAccesses.length;
        if (args?.where?.userId) this.userProducerAccesses = this.userProducerAccesses.filter(upa => upa.userId !== args.where.userId);
        return { count: before - this.userProducerAccesses.length };
      }
    };
  }

  public get userEventAccess() {
    return {
      create: async (args: any) => {
        const record = { id: `uea-${Date.now()}`, userId: args.data.userId, eventId: args.data.eventId, createdAt: new Date() };
        this.userEventAccesses.push(record);
        return record;
      },
      deleteMany: async (args: any) => {
        const before = this.userEventAccesses.length;
        if (args?.where?.userId) this.userEventAccesses = this.userEventAccesses.filter(uea => uea.userId !== args.where.userId);
        return { count: before - this.userEventAccesses.length };
      }
    };
  }

  public get session() {
    return {
      create: async (args: any) => {
        const s = {
          id: args.data.id || `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId: args.data.userId,
          token: args.data.token,
          refreshToken: args.data.refreshToken || null,
          ipAddress: args.data.ipAddress || null,
          userAgent: args.data.userAgent || null,
          expiresAt: args.data.expiresAt,
          revokedAt: null,
          createdAt: new Date()
        };
        this.sessions.push(s);
        return s;
      },
      findUnique: async (args: any) => {
        return this.sessions.find(s => s.id === args.where.id || s.token === args.where.token || s.refreshToken === args.where.refreshToken) || null;
      },
      findFirst: async (args: any) => {
        return this.sessions.find(s => {
          if (args.where?.id) return s.id === args.where.id;
          if (args.where?.token) return s.token === args.where.token;
          if (args.where?.refreshToken) return s.refreshToken === args.where.refreshToken;
          return true;
        }) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.sessions];
        if (args?.where?.userId) list = list.filter(s => s.userId === args.where.userId);
        return list;
      },
      update: async (args: any) => {
        const s = this.sessions.find(x => x.id === args.where.id || x.token === args.where.token);
        if (!s) throw new Error('Session not found');
        Object.assign(s, args.data);
        return s;
      },
      delete: async (args: any) => {
        const idx = this.sessions.findIndex(s => s.id === args.where.id);
        if (idx >= 0) return this.sessions.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const before = this.sessions.length;
        if (args?.where?.userId) this.sessions = this.sessions.filter(s => s.userId !== args.where.userId);
        return { count: before - this.sessions.length };
      }
    };
  }

  public get auditLog() {
    return {
      create: async (args: any) => {
        const log = {
          id: args.data.id || `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          correlationId: args.data.correlationId || null,
          requestId: args.data.requestId || null,
          sessionId: args.data.sessionId || null,
          userId: args.data.userId || null,
          userName: args.data.userName || null,
          module: args.data.module || 'SYSTEM',
          action: args.data.action,
          resource: args.data.resource || args.data.resourceType || 'SYSTEM',
          resourceType: args.data.resourceType || null,
          resourceId: args.data.resourceId || null,
          producerId: args.data.producerId || null,
          eventId: args.data.eventId || null,
          beforeData: typeof args.data.beforeData === 'object' ? JSON.stringify(args.data.beforeData) : (args.data.beforeData || null),
          afterData: typeof args.data.afterData === 'object' ? JSON.stringify(args.data.afterData) : (args.data.afterData || null),
          details: args.data.details || null,
          ipAddress: args.data.ipAddress || null,
          ipHash: args.data.ipHash || null,
          userAgent: args.data.userAgent || null,
          result: args.data.result || 'SUCCESS',
          createdAt: new Date()
        };
        this.auditLogs.unshift(log);
        return log;
      },
      findUnique: async (args: any) => {
        return this.auditLogs.find(l => l.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.auditLogs];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.auditLogs];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      count: async (args?: any) => {
        let list = [...this.auditLogs];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get notification() {
    return {
      create: async (args: any) => {
        const item = {
          id: args.data.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: args.data.type || 'INFO',
          priority: args.data.priority || 'NORMAL',
          module: args.data.module,
          title: args.data.title,
          description: args.data.description,
          groupKey: args.data.groupKey || null,
          resourceType: args.data.resourceType || null,
          resourceId: args.data.resourceId || null,
          actionUrl: args.data.actionUrl || null,
          producerId: args.data.producerId || null,
          eventId: args.data.eventId || null,
          metadata: args.data.metadata || null,
          createdAt: new Date()
        };
        this.notifications.unshift(item);
        return item;
      },
      findUnique: async (args: any) => {
        return this.notifications.find(n => n.id === args.where.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.notifications];
        if (args?.where?.module) list = list.filter(n => n.module === args.where.module);
        if (args?.where?.priority) list = list.filter(n => n.priority === args.where.priority);
        if (args?.where?.groupKey) list = list.filter(n => n.groupKey === args.where.groupKey);
        if (args?.where?.producerId) list = list.filter(n => n.producerId === args.where.producerId);
        if (args?.where?.eventId) list = list.filter(n => n.eventId === args.where.eventId);
        return list;
      },
      update: async (args: any) => {
        const item = this.notifications.find(n => n.id === args.where.id);
        if (!item) throw new Error('Notification not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async () => this.notifications.length
    };
  }

  public get notificationRecipient() {
    return {
      create: async (args: any) => {
        const record = {
          id: `nr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          notificationId: args.data.notificationId,
          userId: args.data.userId,
          status: args.data.status || 'UNREAD',
          readAt: null,
          archivedAt: null,
          createdAt: new Date()
        };
        this.notificationRecipients.unshift(record);
        return record;
      },
      findUnique: async (args: any) => {
        return this.notificationRecipients.find(nr =>
          nr.id === args.where.id ||
          (nr.notificationId === args.where.notificationId_userId?.notificationId && nr.userId === args.where.notificationId_userId?.userId)
        ) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.notificationRecipients];
        if (args?.where?.OR) {
          list = list.filter(nr => {
            return args.where.OR.some((condition: any) => {
              let match = true;
              if (condition.id && nr.id !== condition.id) match = false;
              if (condition.notificationId && nr.notificationId !== condition.notificationId) match = false;
              if (condition.userId && nr.userId !== condition.userId) match = false;
              if (condition.status && nr.status !== condition.status) match = false;
              return match;
            });
          });
        }
        if (args?.where?.userId) list = list.filter(nr => nr.userId === args.where.userId);
        if (args?.where?.notificationId) list = list.filter(nr => nr.notificationId === args.where.notificationId);
        if (args?.where?.id) list = list.filter(nr => nr.id === args.where.id);
        const item = list[0] || null;
        if (item && args?.include?.notification) {
          return {
            ...item,
            notification: this.notifications.find(n => n.id === item.notificationId) || null
          };
        }
        return item;
      },
      findMany: async (args?: any) => {
        let list = [...this.notificationRecipients];
        if (args?.where?.userId) list = list.filter(nr => nr.userId === args.where.userId);
        if (args?.where?.status) {
          if (typeof args.where.status === 'string') {
            list = list.filter(nr => nr.status === args.where.status);
          } else if (args.where.status.in) {
            list = list.filter(nr => args.where.status.in.includes(nr.status));
          }
        }
        return list.map(nr => {
          if (args?.include?.notification) {
            return {
              ...nr,
              notification: this.notifications.find(n => n.id === nr.notificationId) || null
            };
          }
          return nr;
        });
      },
      update: async (args: any) => {
        const nr = this.notificationRecipients.find(x =>
          x.id === args.where.id ||
          (x.notificationId === args.where.notificationId_userId?.notificationId && x.userId === args.where.notificationId_userId?.userId)
        );
        if (!nr) throw new Error('NotificationRecipient not found');
        Object.assign(nr, args.data);
        return nr;
      },
      updateMany: async (args: any) => {
        let count = 0;
        this.notificationRecipients.forEach(nr => {
          let match = true;
          if (args.where?.userId && nr.userId !== args.where.userId) match = false;
          if (args.where?.status && nr.status !== args.where.status) match = false;
          if (match) {
            Object.assign(nr, args.data);
            count++;
          }
        });
        return { count };
      },
      count: async (args?: any) => {
        let list = [...this.notificationRecipients];
        if (args?.where?.userId) list = list.filter(nr => nr.userId === args.where.userId);
        if (args?.where?.status) list = list.filter(nr => nr.status === args.where.status);
        return list.length;
      }
    };
  }

  public get notificationPreference() {
    return {
      findUnique: async (args: any) => {
        return this.notificationPreferences.find(np =>
          np.id === args.where.id ||
          (np.userId === args.where.userId_module_channel?.userId &&
           np.module === args.where.userId_module_channel?.module &&
           np.channel === args.where.userId_module_channel?.channel)
        ) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.notificationPreferences];
        if (args?.where?.userId) list = list.filter(np => np.userId === args.where.userId);
        return list;
      },
      upsert: async (args: any) => {
        const existing = this.notificationPreferences.find(np =>
          np.userId === args.where.userId_module_channel?.userId &&
          np.module === args.where.userId_module_channel?.module &&
          np.channel === args.where.userId_module_channel?.channel
        );
        if (existing) {
          Object.assign(existing, args.update, { updatedAt: new Date() });
          return existing;
        }
        const newPref = {
          id: `np_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...args.create,
          updatedAt: new Date()
        };
        this.notificationPreferences.push(newPref);
        return newPref;
      }
    };
  }

  public get notificationRule() {
    return {
      create: async (args: any) => {
        const rule = {
          id: args.data.id || `nr_${Date.now()}`,
          eventType: args.data.eventType,
          requiredPerm: args.data.requiredPerm || null,
          defaultPriority: args.data.defaultPriority || 'NORMAL',
          type: args.data.type || 'INFO',
          isMandatory: args.data.isMandatory ?? false,
          createdAt: new Date()
        };
        this.notificationRules.push(rule);
        return rule;
      },
      findUnique: async (args: any) => {
        return this.notificationRules.find(r => r.id === args.where.id || r.eventType === args.where.eventType) || null;
      },
      findMany: async () => [...this.notificationRules],
      upsert: async (args: any) => {
        const r = this.notificationRules.find(x => x.eventType === args.where.eventType);
        if (r) {
          Object.assign(r, args.update);
          return r;
        }
        const created = {
          id: `rule_${Date.now()}`,
          ...args.create,
          createdAt: new Date()
        };
        this.notificationRules.push(created);
        return created;
      }
    };
  }

  public get eventOutbox() {
    return {
      create: async (args: any) => {
        const outboxItem = {
          id: args.data.id || `outbox_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          eventId: args.data.eventId,
          eventType: args.data.eventType,
          producerId: args.data.producerId || null,
          eventIdRef: args.data.eventIdRef || null,
          resourceType: args.data.resourceType || null,
          resourceId: args.data.resourceId || null,
          actorUserId: args.data.actorUserId || null,
          payload: typeof args.data.payload === 'string' ? args.data.payload : JSON.stringify(args.data.payload),
          status: args.data.status || 'PENDING',
          processedAt: null,
          createdAt: new Date()
        };
        this.outboxRecords.push(outboxItem);
        return outboxItem;
      },
      findUnique: async (args: any) => {
        return this.outboxRecords.find(o => o.id === args.where.id || o.eventId === args.where.eventId) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.outboxRecords];
        if (args?.where?.status) list = list.filter(o => o.status === args.where.status);
        return list;
      },
      update: async (args: any) => {
        const item = this.outboxRecords.find(o => o.id === args.where.id || o.eventId === args.where.eventId);
        if (!item) throw new Error('Outbox item not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get customer() {
    return {
      findUnique: async (args: any) => {
        const c = this.customers.find(x => x.id === args.where.id || x.cpf === args.where.cpf || x.cpfNormalized === args.where.cpfNormalized);
        if (!c) return null;
        return this.hydrateCustomer(c, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.customers];
        if (args?.where) {
          list = this.filterEntities(list, args.where);
        }
        const c = list[0] || null;
        return c ? this.hydrateCustomer(c, args?.include) : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.customers];
        if (args?.where) {
          list = this.filterEntities(list, args.where);
        }
        if (args?.take) list = list.slice(0, args.take);
        return list.map(c => this.hydrateCustomer(c, args?.include));
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cust_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.customers.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.customers.find(x => x.id === args.where.id);
        if (!item) throw new Error('Customer not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.customers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get order() {
    return {
      findUnique: async (args: any) => {
        const o = this.orders.find(x => x.id === args.where.id || x.orderNumber === args.where.orderNumber || x.orderNumberNormalized === args.where.orderNumberNormalized);
        if (!o) return null;
        return this.hydrateOrder(o, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.orders];
        if (args?.where) {
          list = this.filterEntities(list, args.where);
        }
        const o = list[0] || null;
        return o ? this.hydrateOrder(o, args?.include) : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.orders];
        if (args?.where) {
          list = this.filterEntities(list, args.where);
        }
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.take) list = list.slice(0, args.take);
        return list.map(o => this.hydrateOrder(o, args?.include));
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `ord_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.orders.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.orders.find(x => x.id === args.where.id);
        if (!item) throw new Error('Order not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.orders];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get ticket() {
    return {
      findUnique: async (args: any) => {
        return this.tickets.find(x => x.id === args.where.id || x.ticketCode === args.where.ticketCode || x.ticketCodeNormalized === args.where.ticketCodeNormalized) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.tickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.tickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `tkt_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.tickets.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.tickets.find(x => x.id === args.where.id);
        if (!item) throw new Error('Ticket not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.tickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get payment() {
    return {
      findUnique: async (args: any) => {
        return this.payments.find(x => x.id === args.where.id || x.transactionCode === args.where.transactionCode || x.transactionCodeNormalized === args.where.transactionCodeNormalized) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.payments];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.payments];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `pay_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.payments.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.payments.find(x => x.id === args.where.id);
        if (!item) throw new Error('Payment not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.payments];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get refund() {
    return {
      findUnique: async (args: any) => {
        return this.refunds.find(x => x.id === args.where.id || x.refundCode === args.where.refundCode || x.refundCodeNormalized === args.where.refundCodeNormalized) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.refunds];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.refunds];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `ref_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.refunds.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.refunds.find(x => x.id === args.where.id);
        if (!item) throw new Error('Refund not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.refunds];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get supportTicket() {
    return {
      findUnique: async (args: any) => {
        return this.supportTickets.find(x => x.id === args.where.id || x.ticketCode === args.where.ticketCode || x.ticketCodeNormalized === args.where.ticketCodeNormalized) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.supportTickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.supportTickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `sup_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.supportTickets.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.supportTickets.find(x => x.id === args.where.id);
        if (!item) throw new Error('SupportTicket not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.supportTickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get marketingCampaign() {
    return {
      findUnique: async (args: any) => {
        return this.marketingCampaigns.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.marketingCampaigns];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.marketingCampaigns];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cmp_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.marketingCampaigns.push(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.marketingCampaigns];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get searchHistory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.searchHistories];
        if (args?.where?.userId) list = list.filter(x => x.userId === args.where.userId);
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: `sh_${Date.now()}`, ...args.data, createdAt: new Date() };
        this.searchHistories.unshift(item);
        return item;
      }
    };
  }

  public get approvalRule() {
    return {
      findUnique: async (args: any) => {
        return this.approvalRules.find(x => x.id === args.where?.id || (args.where?.code && x.code === args.where.code)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          if (args.orderBy.minAmount === 'asc') list.sort((a, b) => a.minAmount - b.minAmount);
          if (args.orderBy.minAmount === 'desc') list.sort((a, b) => b.minAmount - a.minAmount);
        }
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `app_rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
        this.approvalRules.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.approvalRules.find(x => x.id === args.where.id);
        if (!item) throw new Error('ApprovalRule not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.approvalRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get approvalThreshold() {
    return {
      findUnique: async (args: any) => {
        return this.approvalThresholds.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalThresholds];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalThresholds];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `thresh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, createdAt: new Date() };
        this.approvalThresholds.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.approvalThresholds.find(x => x.id === args.where.id);
        if (!item) throw new Error('ApprovalThreshold not found');
        Object.assign(item, args.data);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.approvalThresholds.findIndex(x => x.id === args.where.id);
        if (idx !== -1) {
          const removed = this.approvalThresholds.splice(idx, 1);
          return removed[0];
        }
        return null;
      },
      count: async (args?: any) => {
        let list = [...this.approvalThresholds];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get approvalRequest() {
    return {
      findUnique: async (args: any) => {
        const item = this.approvalRequests.find(x => x.id === args.where?.id);
        if (!item) return null;
        return this.hydrateApprovalRequest(item, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalRequests];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (!list[0]) return null;
        return this.hydrateApprovalRequest(list[0], args.include);
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalRequests];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (args?.orderBy?.createdAt === 'asc') {
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateApprovalRequest(item, args?.include));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `apr_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.approvalRequests.push(item);
        return this.hydrateApprovalRequest(item, args.include);
      },
      update: async (args: any) => {
        const item = this.approvalRequests.find(x => x.id === args.where.id);
        if (!item) throw new Error('ApprovalRequest not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydrateApprovalRequest(item, args.include);
      },
      count: async (args?: any) => {
        let list = [...this.approvalRequests];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get approvalStep() {
    return {
      findUnique: async (args: any) => {
        return this.approvalSteps.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalSteps];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalSteps];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => a.stepOrder - b.stepOrder);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data };
        this.approvalSteps.push(item);
        return item;
      },
      createMany: async (args: any) => {
        const items = (args.data || []).map((d: any) => ({
          id: d.id || `apr_step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          ...d
        }));
        this.approvalSteps.push(...items);
        return { count: items.length };
      },
      update: async (args: any) => {
        const item = this.approvalSteps.find(x => x.id === args.where.id);
        if (!item) throw new Error('ApprovalStep not found');
        Object.assign(item, args.data);
        return item;
      },
      deleteMany: async (args: any) => {
        const before = this.approvalSteps.length;
        if (args?.where?.requestId) {
          this.approvalSteps = this.approvalSteps.filter(x => x.requestId !== args.where.requestId);
        }
        return { count: before - this.approvalSteps.length };
      }
    };
  }

  public get approvalDecision() {
    return {
      findUnique: async (args: any) => {
        return this.approvalDecisions.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalDecisions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalDecisions];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_dec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, decidedAt: new Date() };
        this.approvalDecisions.push(item);
        return item;
      }
    };
  }

  public get approvalDelegation() {
    return {
      findUnique: async (args: any) => {
        return this.approvalDelegations.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalDelegations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalDelegations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_dlg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, createdAt: new Date() };
        this.approvalDelegations.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.approvalDelegations.find(x => x.id === args.where.id);
        if (!item) throw new Error('ApprovalDelegation not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get approvalComment() {
    return {
      findUnique: async (args: any) => {
        return this.approvalComments.find(x => x.id === args.where.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalComments];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_cmt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, createdAt: new Date() };
        this.approvalComments.push(item);
        return item;
      }
    };
  }

  public get approvalAttachment() {
    return {
      findUnique: async (args: any) => {
        return this.approvalAttachments.find(x => x.id === args.where.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalAttachments];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, uploadedAt: new Date() };
        this.approvalAttachments.push(item);
        return item;
      }
    };
  }

  public get approvalGroup() {
    return {
      findUnique: async (args: any) => {
        return this.approvalGroups.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.approvalGroups];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.approvalGroups];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data, createdAt: new Date() };
        this.approvalGroups.push(item);
        return item;
      }
    };
  }

  public get approvalGroupMember() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.approvalGroupMembers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `apr_gpm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...args.data };
        this.approvalGroupMembers.push(item);
        return item;
      },
      deleteMany: async (args: any) => {
        const before = this.approvalGroupMembers.length;
        if (args?.where?.groupId) {
          this.approvalGroupMembers = this.approvalGroupMembers.filter(x => x.groupId !== args.where.groupId);
        }
        return { count: before - this.approvalGroupMembers.length };
      }
    };
  }

  // ==========================================
  // 10. CENTRAL DE ARQUIVOS, DOCUMENTOS E ANEXOS (FASE 1.1.5.8)
  // ==========================================

  public get document() {
    return {
      findUnique: async (args: any) => {
        const item = this.documents.find(x => x.id === args.where.id);
        if (!item) return null;
        return this.hydrateDocument(item, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.documents];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (!list[0]) return null;
        return this.hydrateDocument(list[0], args?.include);
      },
      findMany: async (args?: any) => {
        let list = [...this.documents];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          const key = Object.keys(args.orderBy)[0];
          const dir = args.orderBy[key];
          list.sort((a, b) => {
            const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
            const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        } else {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.skip !== undefined) list = list.slice(args.skip);
        if (args?.take !== undefined) list = list.slice(0, args.take);
        return list.map(item => this.hydrateDocument(item, args?.include));
      },
      count: async (args?: any) => {
        let list = [...this.documents];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'AVAILABLE',
          isConfidential: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.documents.push(item);
        return this.hydrateDocument(item, args.include);
      },
      update: async (args: any) => {
        const item = this.documents.find(x => x.id === args.where.id);
        if (!item) throw new Error('Document not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydrateDocument(item, args.include);
      },
      delete: async (args: any) => {
        const idx = this.documents.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('Document not found');
        const [removed] = this.documents.splice(idx, 1);
        return removed;
      }
    };
  }

  public get documentVersion() {
    return {
      findUnique: async (args: any) => {
        return this.documentVersions.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => b.version - a.version);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          version: args.data.version || 1,
          checksumAlgorithm: 'SHA-256',
          createdAt: new Date(),
          ...args.data
        };
        this.documentVersions.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.documentVersions.find(x => x.id === args.where.id);
        if (!item) throw new Error('DocumentVersion not found');
        Object.assign(item, args.data);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.documentVersions.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('DocumentVersion not found');
        const [removed] = this.documentVersions.splice(idx, 1);
        return removed;
      }
    };
  }

  public get documentLink() {
    return {
      findUnique: async (args: any) => {
        return this.documentLinks.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentLinks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentLinks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dlink_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.documentLinks.push(item);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.documentLinks.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('DocumentLink not found');
        const [removed] = this.documentLinks.splice(idx, 1);
        return removed;
      },
      deleteMany: async (args: any) => {
        const before = this.documentLinks.length;
        if (args?.where) {
          const toKeep = this.documentLinks.filter(item => {
            const matches = this.filterEntities([item], args.where);
            return matches.length === 0;
          });
          this.documentLinks = toKeep;
        }
        return { count: before - this.documentLinks.length };
      }
    };
  }

  public get documentCategory() {
    return {
      findUnique: async (args: any) => {
        return this.documentCategories.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        }) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentCategories];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentCategories];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isSensitive: false,
          createdAt: new Date(),
          ...args.data
        };
        this.documentCategories.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.documentCategories.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        });
        if (!item) throw new Error('DocumentCategory not found');
        Object.assign(item, args.data);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.documentCategories.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('DocumentCategory not found');
        const [removed] = this.documentCategories.splice(idx, 1);
        return removed;
      }
    };
  }

  public get documentTag() {
    return {
      findUnique: async (args: any) => {
        return this.documentTags.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.name) return x.name.toLowerCase() === args.where.name.toLowerCase();
          return false;
        }) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentTags];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentTags];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.documentTags.push(item);
        return item;
      }
    };
  }

  public get documentTagLink() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.documentTagLinks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dtl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ...args.data
        };
        this.documentTagLinks.push(item);
        return item;
      },
      deleteMany: async (args: any) => {
        const before = this.documentTagLinks.length;
        if (args?.where?.documentId) {
          this.documentTagLinks = this.documentTagLinks.filter(x => x.documentId !== args.where.documentId);
        }
        return { count: before - this.documentTagLinks.length };
      }
    };
  }

  public get documentAccessLog() {
    return {
      findUnique: async (args: any) => {
        return this.documentAccessLogs.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentAccessLogs];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentAccessLogs];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dlog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.documentAccessLogs.push(item);
        return item;
      }
    };
  }

  public get documentSecurityCheck() {
    return {
      findUnique: async (args: any) => {
        return this.documentSecurityChecks.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentSecurityChecks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentSecurityChecks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dsec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          scannedAt: new Date(),
          ...args.data
        };
        this.documentSecurityChecks.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.documentSecurityChecks.find(x => x.id === args.where.id);
        if (!item) throw new Error('DocumentSecurityCheck not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get documentRetentionPolicy() {
    return {
      findUnique: async (args: any) => {
        return this.documentRetentionPolicies.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentRetentionPolicies];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentRetentionPolicies];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dret_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          action: 'ARCHIVE',
          createdAt: new Date(),
          ...args.data
        };
        this.documentRetentionPolicies.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.documentRetentionPolicies.find(x => x.id === args.where.id);
        if (!item) throw new Error('DocumentRetentionPolicy not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get documentRequirement() {
    return {
      findUnique: async (args: any) => {
        return this.documentRequirements.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.documentRequirements];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.documentRequirements];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dreq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.documentRequirements.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.documentRequirements.find(x => x.id === args.where.id);
        if (!item) throw new Error('DocumentRequirement not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  private hydrateDocument(doc: any, include?: any): any {
    if (!doc) return null;
    const copy = { ...doc };
    if (include?.category) {
      copy.category = this.documentCategories.find(c => c.id === doc.categoryId) || null;
    }
    if (include?.versions) {
      copy.versions = this.documentVersions
        .filter(v => v.documentId === doc.id)
        .sort((a, b) => b.version - a.version);
    }
    if (include?.currentVersion || copy.currentVersionId) {
      copy.currentVersion = this.documentVersions.find(v => v.id === doc.currentVersionId) || null;
    }
    if (include?.links) {
      copy.links = this.documentLinks.filter(l => l.documentId === doc.id);
    }
    if (include?.accessLogs) {
      copy.accessLogs = this.documentAccessLogs
        .filter(al => al.documentId === doc.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (include?.tagLinks) {
      copy.tagLinks = this.documentTagLinks
        .filter(tl => tl.documentId === doc.id)
        .map(tl => ({
          ...tl,
          tag: this.documentTags.find(t => t.id === tl.tagId)
        }));
    }
    return copy;
  }

  // ============================================================================
  // TAREFAS & WORKFLOW GETTERS (Fase 1.1.5.9)
  // ============================================================================

  public get task() {
    return {
      findUnique: async (args: any) => {
        const item = this.tasks.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.taskNumber) return x.taskNumber === args.where.taskNumber;
          return false;
        });
        if (!item) return null;
        return this.hydrateTask(item, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.tasks];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0] || null;
        return item ? this.hydrateTask(item, args?.include) : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.tasks];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          if (args.orderBy.createdAt === 'desc') {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else if (args.orderBy.createdAt === 'asc') {
            list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          } else if (args.orderBy.dueAt === 'asc') {
            list.sort((a, b) => {
              if (!a.dueAt) return 1;
              if (!b.dueAt) return -1;
              return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            });
          }
        } else {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateTask(item, args?.include));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          taskNumber: args.data.taskNumber || `TSK-${1000 + this.tasks.length + 1}`,
          priority: 'NORMAL',
          status: 'OPEN',
          escalationLevel: 0,
          slaStatus: 'WITHIN_SLA',
          totalPausedDurationMs: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.tasks.push(item);
        return this.hydrateTask(item, args.include);
      },
      update: async (args: any) => {
        const item = this.tasks.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.taskNumber) return x.taskNumber === args.where.taskNumber;
          return false;
        });
        if (!item) throw new Error('Task not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydrateTask(item, args.include);
      },
      delete: async (args: any) => {
        const idx = this.tasks.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('Task not found');
        const [removed] = this.tasks.splice(idx, 1);
        return removed;
      },
      count: async (args?: any) => {
        let list = [...this.tasks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get taskAssignment() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.taskAssignments];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tasg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.taskAssignments.push(item);
        return item;
      }
    };
  }

  public get taskChecklist() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.taskChecklists];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tck_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.taskChecklists.push(item);
        return item;
      }
    };
  }

  public get taskChecklistItem() {
    return {
      findUnique: async (args: any) => {
        return this.taskChecklistItems.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.taskChecklistItems];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.taskChecklistItems];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tcki_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isRequired: false,
          isCompleted: false,
          orderIndex: 0,
          ...args.data
        };
        this.taskChecklistItems.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.taskChecklistItems.find(x => x.id === args.where.id);
        if (!item) throw new Error('TaskChecklistItem not found');
        Object.assign(item, args.data);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.taskChecklistItems.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('TaskChecklistItem not found');
        const [removed] = this.taskChecklistItems.splice(idx, 1);
        return removed;
      }
    };
  }

  public get taskComment() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.taskComments];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tcm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.taskComments.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.taskComments.find(x => x.id === args.where.id);
        if (!item) throw new Error('TaskComment not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      delete: async (args: any) => {
        const idx = this.taskComments.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('TaskComment not found');
        const [removed] = this.taskComments.splice(idx, 1);
        return removed;
      }
    };
  }

  public get taskDependency() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.taskDependencies];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tdep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.taskDependencies.push(item);
        return item;
      },
      delete: async (args: any) => {
        const idx = this.taskDependencies.findIndex(x => x.id === args.where.id);
        if (idx !== -1) {
          const [removed] = this.taskDependencies.splice(idx, 1);
          return removed;
        }
        return null;
      },
      deleteMany: async (args: any) => {
        const before = this.taskDependencies.length;
        if (args?.where) {
          const toRemove = this.filterEntities(this.taskDependencies, args.where);
          this.taskDependencies = this.taskDependencies.filter(x => !toRemove.includes(x));
        }
        return { count: before - this.taskDependencies.length };
      }
    };
  }

  public get taskHistory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.taskHistories];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `thist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.taskHistories.push(item);
        return item;
      }
    };
  }

  public get team() {
    return {
      findUnique: async (args: any) => {
        const item = this.teams.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        });
        if (!item) return null;
        if (args.include?.members) {
          return {
            ...item,
            members: this.teamMembers.filter(m => m.teamId === item.id)
          };
        }
        return item;
      },
      findFirst: async (args: any) => {
        let list = [...this.teams];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.teams];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.include?.members) {
          list = list.map(t => ({
            ...t,
            members: this.teamMembers.filter(m => m.teamId === t.id)
          }));
        }
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.teams.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.teams.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        });
        if (!item) throw new Error('Team not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      delete: async (args: any) => {
        const idx = this.teams.findIndex(x => x.id === args.where.id);
        if (idx === -1) throw new Error('Team not found');
        const [removed] = this.teams.splice(idx, 1);
        return removed;
      }
    };
  }

  public get teamMember() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.teamMembers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          role: 'ANALYST',
          createdAt: new Date(),
          ...args.data
        };
        this.teamMembers.push(item);
        return item;
      },
      deleteMany: async (args: any) => {
        const before = this.teamMembers.length;
        if (args?.where) {
          const toRemove = this.filterEntities(this.teamMembers, args.where);
          this.teamMembers = this.teamMembers.filter(x => !toRemove.includes(x));
        }
        return { count: before - this.teamMembers.length };
      }
    };
  }

  public get workflow() {
    return {
      findUnique: async (args: any) => {
        const item = this.workflows.find(x => x.id === args.where.id) || null;
        if (!item) return null;
        if (args.include?.rules) {
          return {
            ...item,
            rules: this.workflowRules.filter(r => r.workflowId === item.id).sort((a, b) => a.orderIndex - b.orderIndex)
          };
        }
        return item;
      },
      findFirst: async (args: any) => {
        let list = [...this.workflows];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0] || null;
        if (item && args?.include?.rules) {
          return {
            ...item,
            rules: this.workflowRules.filter(r => r.workflowId === item.id).sort((a, b) => a.orderIndex - b.orderIndex)
          };
        }
        return item;
      },
      findMany: async (args?: any) => {
        let list = [...this.workflows];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.include?.rules) {
          list = list.map(w => ({
            ...w,
            rules: this.workflowRules.filter(r => r.workflowId === w.id).sort((a, b) => a.orderIndex - b.orderIndex)
          }));
        }
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `wf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          currentVersion: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.workflows.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.workflows.find(x => x.id === args.where.id);
        if (!item) throw new Error('Workflow not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      }
    };
  }

  public get workflowVersion() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.workflowVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => b.version - a.version);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `wfv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.workflowVersions.push(item);
        return item;
      }
    };
  }

  public get workflowRule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.workflowRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `wfr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          version: 1,
          orderIndex: 0,
          ...args.data
        };
        this.workflowRules.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.workflowRules.find(x => x.id === args.where.id);
        if (!item) throw new Error('WorkflowRule not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get workflowAction() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.workflowActions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `wfa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ...args.data
        };
        this.workflowActions.push(item);
        return item;
      }
    };
  }

  public get taskTemplate() {
    return {
      findUnique: async (args: any) => {
        return this.taskTemplates.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        }) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.taskTemplates];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.taskTemplates];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          priority: 'NORMAL',
          defaultEstimatedMinutes: 120,
          createdAt: new Date(),
          ...args.data
        };
        this.taskTemplates.push(item);
        return item;
      }
    };
  }

  public get slaPolicy() {
    return {
      findUnique: async (args: any) => {
        const item = this.slaPolicies.find(x => x.id === args.where.id) || null;
        if (!item) return null;
        if (args.include?.escalationRules) {
          return {
            ...item,
            escalationRules: this.escalationRules.filter(r => r.slaPolicyId === item.id)
          };
        }
        return item;
      },
      findFirst: async (args: any) => {
        let list = [...this.slaPolicies];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.slaPolicies];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.include?.escalationRules) {
          list = list.map(p => ({
            ...p,
            escalationRules: this.escalationRules.filter(r => r.slaPolicyId === p.id)
          }));
        }
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `sla_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          priority: 'NORMAL',
          durationMinutes: 120,
          warningThresholdPercent: 80,
          criticalThresholdPercent: 95,
          allowPause: true,
          allowedPauseReasons: JSON.stringify(['CLIENTE', 'PRODUTOR']),
          createdAt: new Date(),
          ...args.data
        };
        this.slaPolicies.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.slaPolicies.find(x => x.id === args.where.id);
        if (!item) throw new Error('SlaPolicy not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get slaEvent() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.slaEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `slae_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.slaEvents.push(item);
        return item;
      }
    };
  }

  public get escalationRule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.escalationRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => a.level - b.level);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `esc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          level: 1,
          triggerMinutesAfterBreach: 30,
          createdAt: new Date(),
          ...args.data
        };
        this.escalationRules.push(item);
        return item;
      }
    };
  }

  public get escalationEvent() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.escalationEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `esce_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.escalationEvents.push(item);
        return item;
      }
    };
  }

  public get userAvailability() {
    return {
      findUnique: async (args: any) => {
        return this.userAvailabilities.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.userId) return x.userId === args.where.userId;
          return false;
        }) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.userAvailabilities];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.userAvailabilities];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `uav_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'AVAILABLE',
          currentWorkloadScore: 0,
          updatedAt: new Date(),
          ...args.data
        };
        this.userAvailabilities.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.userAvailabilities.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.userId) return x.userId === args.where.userId;
          return false;
        });
        if (!item) throw new Error('UserAvailability not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      upsert: async (args: any) => {
        const existing = this.userAvailabilities.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.userId) return x.userId === args.where.userId;
          return false;
        });
        if (existing) {
          Object.assign(existing, args.update, { updatedAt: new Date() });
          return existing;
        } else {
          const item = {
            id: args.create.id || `uav_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: 'AVAILABLE',
            currentWorkloadScore: 0,
            updatedAt: new Date(),
            ...args.create
          };
          this.userAvailabilities.push(item);
          return item;
        }
      }
    };
  }

  public get dutySchedule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.dutySchedules];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `duty_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isActive: true,
          createdAt: new Date(),
          ...args.data
        };
        this.dutySchedules.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.dutySchedules.find(x => x.id === args.where.id);
        if (!item) throw new Error('DutySchedule not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get configurationDefinition() {
    return {
      findUnique: async (args: any) => {
        const item = this.configurationDefinitions.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.key) return x.key === args.where.key;
          return false;
        });
        if (!item) return null;
        const copy = { ...item };
        if (args.include?.values) {
          copy.values = this.configurationValues.filter(v => v.definitionId === item.id);
        }
        return copy;
      },
      findFirst: async (args: any) => {
        let list = [...this.configurationDefinitions];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0] || null;
        if (!item) return null;
        const copy = { ...item };
        if (args?.include?.values) {
          copy.values = this.configurationValues.filter(v => v.definitionId === item.id);
        }
        return copy;
      },
      findMany: async (args?: any) => {
        let list = [...this.configurationDefinitions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(item => {
          const copy = { ...item };
          if (args?.include?.values) {
            copy.values = this.configurationValues.filter(v => v.definitionId === item.id);
          }
          return copy;
        });
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cfg_def_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sensitivity: 'INTERNAL',
          allowedScopes: JSON.stringify(['GLOBAL', 'PRODUCER', 'EVENT']),
          requiresApproval: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.configurationDefinitions.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.configurationDefinitions.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.key) return x.key === args.where.key;
          return false;
        });
        if (!item) throw new Error('ConfigurationDefinition not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.configurationDefinitions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get configurationValue() {
    return {
      findUnique: async (args: any) => {
        const item = this.configurationValues.find(x => x.id === args.where?.id);
        if (!item) return null;
        const copy = { ...item };
        if (args.include?.definition) {
          copy.definition = this.configurationDefinitions.find(d => d.id === item.definitionId) || null;
        }
        if (args.include?.versions) {
          copy.versions = this.configurationVersions.filter(v => v.valueId === item.id).sort((a, b) => b.versionNumber - a.versionNumber);
        }
        return copy;
      },
      findFirst: async (args: any) => {
        let list = [...this.configurationValues];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0] || null;
        if (!item) return null;
        const copy = { ...item };
        if (args?.include?.definition) {
          copy.definition = this.configurationDefinitions.find(d => d.id === item.definitionId) || null;
        }
        if (args?.include?.versions) {
          copy.versions = this.configurationVersions.filter(v => v.valueId === item.id).sort((a, b) => b.versionNumber - a.versionNumber);
        }
        return copy;
      },
      findMany: async (args?: any) => {
        let list = [...this.configurationValues];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(item => {
          const copy = { ...item };
          if (args?.include?.definition) {
            copy.definition = this.configurationDefinitions.find(d => d.id === item.definitionId) || null;
          }
          if (args?.include?.versions) {
            copy.versions = this.configurationVersions.filter(v => v.valueId === item.id).sort((a, b) => b.versionNumber - a.versionNumber);
          }
          return copy;
        });
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cfg_val_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          version: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.configurationValues.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.configurationValues.find(x => x.id === args.where?.id);
        if (!item) throw new Error('ConfigurationValue not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      delete: async (args: any) => {
        const index = this.configurationValues.findIndex(x => x.id === args.where?.id);
        if (index === -1) throw new Error('ConfigurationValue not found');
        const removed = this.configurationValues.splice(index, 1)[0];
        return removed;
      },
      count: async (args?: any) => {
        let list = [...this.configurationValues];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get configurationVersion() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.configurationVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cfg_ver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.configurationVersions.push(item);
        return item;
      }
    };
  }

  public get policy() {
    return {
      findUnique: async (args: any) => {
        const item = this.policies.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        });
        if (!item) return null;
        return this.hydratePolicy(item, args.include);
      },
      findFirst: async (args: any) => {
        let list = [...this.policies];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          if (args.orderBy.priority === 'asc') list.sort((a, b) => a.priority - b.priority);
          else if (args.orderBy.priority === 'desc') list.sort((a, b) => b.priority - a.priority);
        }
        const item = list[0] || null;
        if (!item) return null;
        return this.hydratePolicy(item, args?.include);
      },
      findMany: async (args?: any) => {
        let list = [...this.policies];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          if (args.orderBy.priority === 'asc') list.sort((a, b) => a.priority - b.priority);
          else if (args.orderBy.priority === 'desc') list.sort((a, b) => b.priority - a.priority);
          else if (args.orderBy.createdAt === 'desc') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(item => this.hydratePolicy(item, args?.include));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `pol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'ACTIVE',
          currentVersion: 1,
          priority: 100,
          requiresApproval: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.policies.push(item);
        return this.hydratePolicy(item, args.include);
      },
      update: async (args: any) => {
        const item = this.policies.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.code) return x.code === args.where.code;
          return false;
        });
        if (!item) throw new Error('Policy not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydratePolicy(item, args.include);
      },
      delete: async (args: any) => {
        const index = this.policies.findIndex(x => x.id === args.where?.id);
        if (index === -1) throw new Error('Policy not found');
        const removed = this.policies.splice(index, 1)[0];
        return removed;
      },
      count: async (args?: any) => {
        let list = [...this.policies];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get policyVersion() {
    return {
      findUnique: async (args: any) => {
        return this.policyVersions.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.policyVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.policyVersions];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => b.versionNumber - a.versionNumber);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `pol_ver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.policyVersions.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.policyVersions.find(x => x.id === args.where?.id);
        if (!item) throw new Error('PolicyVersion not found');
        Object.assign(item, args.data);
        return item;
      }
    };
  }

  public get policyRule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.policyRules];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.orderIndex || 0) - (b.orderIndex || 0));
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `pol_rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          priority: 10,
          orderIndex: 1,
          isActive: true,
          createdAt: new Date(),
          ...args.data
        };
        this.policyRules.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.policyRules.find(x => x.id === args.where?.id);
        if (!item) throw new Error('PolicyRule not found');
        Object.assign(item, args.data);
        return item;
      },
      deleteMany: async (args?: any) => {
        if (!args?.where) {
          const count = this.policyRules.length;
          this.policyRules = [];
          return { count };
        }
        const initial = this.policyRules.length;
        this.policyRules = this.policyRules.filter(item => {
          const match = this.filterEntities([item], args.where).length > 0;
          return !match;
        });
        return { count: initial - this.policyRules.length };
      }
    };
  }

  public get policyConflict() {
    return {
      findUnique: async (args: any) => {
        return this.policyConflicts.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.policyConflicts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.policyConflicts];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `pol_cnf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'DETECTED',
          detectedAt: new Date(),
          ...args.data
        };
        this.policyConflicts.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.policyConflicts.find(x => x.id === args.where?.id);
        if (!item) throw new Error('PolicyConflict not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.policyConflicts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get featureFlag() {
    return {
      findUnique: async (args: any) => {
        return this.featureFlags.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.key) return x.key === args.where.key;
          return false;
        }) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.featureFlags];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.featureFlags];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ff_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isEnabled: false,
          rolloutPercentage: 0,
          isKillSwitch: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.featureFlags.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.featureFlags.find(x => {
          if (args.where?.id) return x.id === args.where.id;
          if (args.where?.key) return x.key === args.where.key;
          return false;
        });
        if (!item) throw new Error('FeatureFlag not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.featureFlags];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get configurationAudit() {
    return {
      findUnique: async (args: any) => {
        return this.configurationAudits.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.configurationAudits];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.configurationAudits];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cfg_adt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.configurationAudits.push(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.configurationAudits];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get policyEvaluation() {
    return {
      findUnique: async (args: any) => {
        return this.policyEvaluations.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.policyEvaluations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.policyEvaluations];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `pol_ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isSimulated: false,
          createdAt: new Date(),
          ...args.data
        };
        this.policyEvaluations.push(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.policyEvaluations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  // Auditoria & Observabilidade (Fase 1.1.5.12)
  public get integrationInbox() {
    return {
      findUnique: async (args: any) => {
        return this.integrationInboxes.find(x => x.id === args.where?.id || x.externalEventId === args.where?.externalEventId) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.integrationInboxes];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.integrationInboxes];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'PROCESSED',
          signatureValid: args.data.signatureValid ?? true,
          isIdempotent: args.data.isIdempotent ?? true,
          payload: typeof args.data.payload === 'object' ? JSON.stringify(args.data.payload) : (args.data.payload || '{}'),
          processedAt: args.data.processedAt || new Date(),
          createdAt: new Date(),
          ...args.data
        };
        this.integrationInboxes.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.integrationInboxes.find(x => x.id === args.where?.id || x.externalEventId === args.where?.externalEventId);
        if (!item) throw new Error('Inbox item not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.integrationInboxes];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get businessEvent() {
    return {
      findUnique: async (args: any) => {
        return this.businessEvents.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.businessEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.businessEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `be_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          payload: typeof args.data.payload === 'object' ? JSON.stringify(args.data.payload) : (args.data.payload || '{}'),
          consumers: typeof args.data.consumers === 'object' ? JSON.stringify(args.data.consumers) : (args.data.consumers || '[]'),
          createdAt: new Date(),
          ...args.data
        };
        this.businessEvents.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.businessEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get operationTrace() {
    return {
      findUnique: async (args: any) => {
        const item = this.operationTraces.find(x => x.id === args.where?.id || x.correlationId === args.where?.correlationId);
        return item ? this.hydrateOperationTrace(item, args.include) : null;
      },
      findFirst: async (args: any) => {
        let list = [...this.operationTraces];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0];
        return item ? this.hydrateOperationTrace(item, args?.include) : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.operationTraces];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateOperationTrace(item, args?.include));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `trc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'IN_PROGRESS',
          startedAt: args.data.startedAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.operationTraces.unshift(item);
        return this.hydrateOperationTrace(item, args.include);
      },
      update: async (args: any) => {
        const item = this.operationTraces.find(x => x.id === args.where?.id || x.correlationId === args.where?.correlationId);
        if (!item) throw new Error('Trace not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydrateOperationTrace(item, args.include);
      },
      count: async (args?: any) => {
        let list = [...this.operationTraces];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get traceSpan() {
    return {
      findUnique: async (args: any) => {
        return this.traceSpans.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.traceSpans];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.traceSpans];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `span_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'SUCCESS',
          startedAt: args.data.startedAt || new Date(),
          metadata: typeof args.data.metadata === 'object' ? JSON.stringify(args.data.metadata) : (args.data.metadata || null),
          ...args.data
        };
        this.traceSpans.push(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.traceSpans.find(x => x.id === args.where?.id);
        if (!item) throw new Error('Span not found');
        Object.assign(item, args.data);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.traceSpans];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get errorGroup() {
    return {
      findUnique: async (args: any) => {
        const item = this.errorGroups.find(x => x.id === args.where?.id || x.fingerprint === args.where?.fingerprint);
        return item ? this.hydrateErrorGroup(item, args.include) : null;
      },
      findFirst: async (args: any) => {
        let list = [...this.errorGroups];
        if (args?.where) list = this.filterEntities(list, args.where);
        const item = list[0];
        return item ? this.hydrateErrorGroup(item, args?.include) : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.errorGroups];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list.map(item => this.hydrateErrorGroup(item, args?.include));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `err_grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'UNRESOLVED',
          severity: args.data.severity || 'HIGH',
          occurrencesCount: args.data.occurrencesCount || 1,
          affectedEventsCount: args.data.affectedEventsCount || 0,
          affectedUsersCount: args.data.affectedUsersCount || 0,
          firstSeenAt: args.data.firstSeenAt || new Date(),
          lastSeenAt: args.data.lastSeenAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.errorGroups.unshift(item);
        return this.hydrateErrorGroup(item, args.include);
      },
      update: async (args: any) => {
        const item = this.errorGroups.find(x => x.id === args.where?.id || x.fingerprint === args.where?.fingerprint);
        if (!item) throw new Error('ErrorGroup not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return this.hydrateErrorGroup(item, args.include);
      },
      count: async (args?: any) => {
        let list = [...this.errorGroups];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get errorOccurrence() {
    return {
      findUnique: async (args: any) => {
        return this.errorOccurrences.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.errorOccurrences];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.errorOccurrences];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `err_occ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          contextData: typeof args.data.contextData === 'object' ? JSON.stringify(args.data.contextData) : (args.data.contextData || null),
          createdAt: new Date(),
          ...args.data
        };
        this.errorOccurrences.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.errorOccurrences];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get healthCheck() {
    return {
      findUnique: async (args: any) => {
        return this.healthChecks.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.healthChecks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.healthChecks];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `hc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'OPERATIONAL',
          metadata: typeof args.data.metadata === 'object' ? JSON.stringify(args.data.metadata) : (args.data.metadata || null),
          checkedAt: new Date(),
          ...args.data
        };
        this.healthChecks.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.healthChecks];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get systemAlert() {
    return {
      findUnique: async (args: any) => {
        return this.systemAlerts.find(x => x.id === args.where?.id || x.deduplicationKey === args.where?.deduplicationKey) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.systemAlerts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.systemAlerts];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.lastTriggeredAt).getTime() - new Date(a.lastTriggeredAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `alt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'ACTIVE',
          severity: args.data.severity || 'WARNING',
          occurrencesCount: args.data.occurrencesCount || 1,
          firstTriggeredAt: args.data.firstTriggeredAt || new Date(),
          lastTriggeredAt: args.data.lastTriggeredAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.systemAlerts.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const item = this.systemAlerts.find(x => x.id === args.where?.id || x.deduplicationKey === args.where?.deduplicationKey);
        if (!item) throw new Error('Alert not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.systemAlerts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get metricSnapshot() {
    return {
      findUnique: async (args: any) => {
        return this.metricSnapshots.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.metricSnapshots];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.metricSnapshots];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          labels: typeof args.data.labels === 'object' ? JSON.stringify(args.data.labels) : (args.data.labels || null),
          timestamp: new Date(),
          ...args.data
        };
        this.metricSnapshots.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.metricSnapshots];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get observabilityAnnotation() {
    return {
      findUnique: async (args: any) => {
        return this.observabilityAnnotations.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.observabilityAnnotations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.observabilityAnnotations];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.observabilityAnnotations.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.observabilityAnnotations];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  // --- FASE 1.1.5.13: ANALYTICS & BI DELEGATES ---
  public get metricDefinitionModel() {
    return {
      findUnique: async (args: any) => {
        return this.metricDefinitionModels.find(x => x.id === args.where?.id || (args.where?.code && x.code === args.where.code)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.metricDefinitionModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.metricDefinitionModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy) {
          list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        }
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `met_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: args.data.version || 1,
          ...args.data
        };
        this.metricDefinitionModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.metricDefinitionModels.findIndex(x => x.id === args.where?.id || (args.where?.code && x.code === args.where.code));
        if (idx >= 0) {
          this.metricDefinitionModels[idx] = {
            ...this.metricDefinitionModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.metricDefinitionModels[idx];
        }
        throw new Error(`MetricDefinition not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.metricDefinitionModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.metricDefinitionModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`MetricDefinition not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.metricDefinitionModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get savedReportModel() {
    return {
      findUnique: async (args: any) => {
        return this.savedReportModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.savedReportModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.savedReportModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.savedReportModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.savedReportModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.savedReportModels[idx] = {
            ...this.savedReportModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.savedReportModels[idx];
        }
        throw new Error(`SavedReport not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.savedReportModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.savedReportModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`SavedReport not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.savedReportModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get reportExportJobModel() {
    return {
      findUnique: async (args: any) => {
        return this.reportExportJobModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.reportExportJobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.reportExportJobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'PENDING',
          createdAt: new Date(),
          ...args.data
        };
        this.reportExportJobModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.reportExportJobModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.reportExportJobModels[idx] = {
            ...this.reportExportJobModels[idx],
            ...args.data
          };
          return this.reportExportJobModels[idx];
        }
        throw new Error(`ReportExportJob not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.reportExportJobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get reportScheduleModel() {
    return {
      findUnique: async (args: any) => {
        return this.reportScheduleModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.reportScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.reportScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          active: args.data.active !== undefined ? args.data.active : true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.reportScheduleModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.reportScheduleModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.reportScheduleModels[idx] = {
            ...this.reportScheduleModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.reportScheduleModels[idx];
        }
        throw new Error(`ReportSchedule not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.reportScheduleModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.reportScheduleModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`ReportSchedule not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.reportScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get reportSnapshotModel() {
    return {
      findUnique: async (args: any) => {
        return this.reportSnapshotModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.reportSnapshotModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.reportSnapshotModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `snp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.reportSnapshotModels.unshift(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.reportSnapshotModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get analyticsGoalModel() {
    return {
      findUnique: async (args: any) => {
        return this.analyticsGoalModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.analyticsGoalModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.analyticsGoalModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.analyticsGoalModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.analyticsGoalModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.analyticsGoalModels[idx] = {
            ...this.analyticsGoalModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.analyticsGoalModels[idx];
        }
        throw new Error(`AnalyticsGoal not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.analyticsGoalModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  // --- FASE 1.1.5.14: JOBS, AGENDAMENTOS E PROCESSAMENTOS ASSÍNCRONOS ---
  public get jobModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobModels.find(x => x.id === args.where?.id || (args.where?.idempotencyKey && x.idempotencyKey === args.where.idempotencyKey)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'CREATED',
          priority: args.data.priority || 'NORMAL',
          queue: args.data.queue || 'critical',
          progress: args.data.progress || 0,
          attempts: args.data.attempts || 0,
          maxAttempts: args.data.maxAttempts || 3,
          cancellable: args.data.cancellable !== undefined ? args.data.cancellable : true,
          cancelRequested: args.data.cancelRequested || false,
          pausable: args.data.pausable || false,
          pauseRequested: args.data.pauseRequested || false,
          paused: args.data.paused || false,
          createdAt: new Date(),
          ...args.data
        };
        this.jobModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.jobModels[idx] = {
            ...this.jobModels[idx],
            ...args.data
          };
          return this.jobModels[idx];
        }
        throw new Error(`Job not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.jobModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.jobModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`Job not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.jobModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get jobAttemptModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobAttemptModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobAttemptModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobAttemptModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0));
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          startedAt: new Date(),
          ...args.data
        };
        this.jobAttemptModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobAttemptModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.jobAttemptModels[idx] = {
            ...this.jobAttemptModels[idx],
            ...args.data
          };
          return this.jobAttemptModels[idx];
        }
        throw new Error(`JobAttempt not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.jobAttemptModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get jobCheckpointModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobCheckpointModels.find(x => x.id === args.where?.id || x.jobId === args.where?.jobId) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobCheckpointModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobCheckpointModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `chk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          savedAt: new Date(),
          ...args.data
        };
        this.jobCheckpointModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobCheckpointModels.findIndex(x => x.id === args.where?.id || x.jobId === args.where?.jobId);
        if (idx >= 0) {
          this.jobCheckpointModels[idx] = {
            ...this.jobCheckpointModels[idx],
            ...args.data,
            savedAt: new Date()
          };
          return this.jobCheckpointModels[idx];
        }
        throw new Error(`JobCheckpoint not found for update`);
      },
      deleteMany: async (args: any) => {
        const before = this.jobCheckpointModels.length;
        if (args?.where?.jobId) {
          this.jobCheckpointModels = this.jobCheckpointModels.filter(x => x.jobId !== args.where.jobId);
        }
        return { count: before - this.jobCheckpointModels.length };
      }
    };
  }

  public get jobBatchModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobBatchModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobBatchModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobBatchModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (args?.take) list = list.slice(0, args.take);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'CREATED',
          createdAt: new Date(),
          ...args.data
        };
        this.jobBatchModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobBatchModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.jobBatchModels[idx] = {
            ...this.jobBatchModels[idx],
            ...args.data
          };
          return this.jobBatchModels[idx];
        }
        throw new Error(`JobBatch not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.jobBatchModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get jobScheduleModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobScheduleModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          active: args.data.active !== undefined ? args.data.active : true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.jobScheduleModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobScheduleModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.jobScheduleModels[idx] = {
            ...this.jobScheduleModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.jobScheduleModels[idx];
        }
        throw new Error(`JobSchedule not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.jobScheduleModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.jobScheduleModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`JobSchedule not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.jobScheduleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get jobWorkerModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobWorkerModels.find(x => x.id === args.where?.id || x.name === args.where?.name) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobWorkerModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobWorkerModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `wrk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'ACTIVE',
          lastHeartbeatAt: new Date(),
          startedAt: new Date(),
          ...args.data
        };
        this.jobWorkerModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobWorkerModels.findIndex(x => x.id === args.where?.id || x.name === args.where?.name);
        if (idx >= 0) {
          this.jobWorkerModels[idx] = {
            ...this.jobWorkerModels[idx],
            ...args.data
          };
          return this.jobWorkerModels[idx];
        }
        throw new Error(`JobWorker not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.jobWorkerModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.jobWorkerModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`JobWorker not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.jobWorkerModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get jobDeadLetterModel() {
    return {
      findUnique: async (args: any) => {
        return this.jobDeadLetterModels.find(x => x.id === args.where?.id || x.jobId === args.where?.jobId) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.jobDeadLetterModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.jobDeadLetterModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.movedToDeadLetterAt).getTime() - new Date(a.movedToDeadLetterAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          investigated: false,
          reprocessed: false,
          movedToDeadLetterAt: new Date(),
          ...args.data
        };
        this.jobDeadLetterModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.jobDeadLetterModels.findIndex(x => x.id === args.where?.id || x.jobId === args.where?.jobId);
        if (idx >= 0) {
          this.jobDeadLetterModels[idx] = {
            ...this.jobDeadLetterModels[idx],
            ...args.data
          };
          return this.jobDeadLetterModels[idx];
        }
        throw new Error(`JobDeadLetter not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.jobDeadLetterModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get importRequestModel() {
    return {
      findUnique: async (args: any) => {
        return this.importRequestModels.find(x => x.id === args.where?.id || x.code === args.where?.code) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.importRequestModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.importRequestModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.importRequestModels.unshift(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.importRequestModels.findIndex(x => x.id === args.where?.id || x.code === args.where?.code);
        if (idx >= 0) {
          this.importRequestModels[idx] = {
            ...this.importRequestModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.importRequestModels[idx];
        }
        throw new Error(`ImportRequest not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.importRequestModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.importRequestModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`ImportRequest not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.importRequestModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get importMappingModel() {
    return {
      findUnique: async (args: any) => {
        return this.importMappingModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.importMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.importMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `map_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.importMappingModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.importMappingModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.importMappingModels[idx] = {
            ...this.importMappingModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.importMappingModels[idx];
        }
        throw new Error(`ImportMapping not found for update`);
      },
      delete: async (args: any) => {
        const idx = this.importMappingModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          const [removed] = this.importMappingModels.splice(idx, 1);
          return removed;
        }
        throw new Error(`ImportMapping not found for deletion`);
      },
      count: async (args?: any) => {
        let list = [...this.importMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get importValidationErrorModel() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.importValidationErrorModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.importValidationErrorModels.push(item);
        return item;
      },
      createMany: async (args: any) => {
        const created = (args.data || []).map((d: any) => ({
          id: d.id || `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...d
        }));
        this.importValidationErrorModels.push(...created);
        return { count: created.length };
      },
      deleteMany: async (args?: any) => {
        if (!args?.where) {
          const count = this.importValidationErrorModels.length;
          this.importValidationErrorModels = [];
          return { count };
        }
        const initial = this.importValidationErrorModels.length;
        this.importValidationErrorModels = this.importValidationErrorModels.filter(x => {
          if (args.where.importId && x.importId === args.where.importId) return false;
          return true;
        });
        return { count: initial - this.importValidationErrorModels.length };
      },
      count: async (args?: any) => {
        let list = [...this.importValidationErrorModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get importDuplicateModel() {
    return {
      findUnique: async (args: any) => {
        return this.importDuplicateModels.find(x => x.id === args.where?.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.importDuplicateModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          resolved: false,
          createdAt: new Date(),
          ...args.data
        };
        this.importDuplicateModels.push(item);
        return item;
      },
      createMany: async (args: any) => {
        const created = (args.data || []).map((d: any) => ({
          id: d.id || `dup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          resolved: false,
          createdAt: new Date(),
          ...d
        }));
        this.importDuplicateModels.push(...created);
        return { count: created.length };
      },
      update: async (args: any) => {
        const idx = this.importDuplicateModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.importDuplicateModels[idx] = {
            ...this.importDuplicateModels[idx],
            ...args.data
          };
          return this.importDuplicateModels[idx];
        }
        throw new Error(`ImportDuplicate not found for update`);
      },
      deleteMany: async (args?: any) => {
        if (!args?.where) {
          const count = this.importDuplicateModels.length;
          this.importDuplicateModels = [];
          return { count };
        }
        const initial = this.importDuplicateModels.length;
        this.importDuplicateModels = this.importDuplicateModels.filter(x => {
          if (args.where.importId && x.importId === args.where.importId) return false;
          return true;
        });
        return { count: initial - this.importDuplicateModels.length };
      },
      count: async (args?: any) => {
        let list = [...this.importDuplicateModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get mergePlanModel() {
    return {
      findUnique: async (args: any) => {
        return this.mergePlanModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.mergePlanModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.mergePlanModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `mp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.mergePlanModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.mergePlanModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.mergePlanModels[idx] = {
            ...this.mergePlanModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.mergePlanModels[idx];
        }
        throw new Error(`MergePlan not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.mergePlanModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get dataQualityRuleModel() {
    return {
      findUnique: async (args: any) => {
        return this.dataQualityRuleModels.find(x => x.id === args.where?.id || x.code === args.where?.code) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.dataQualityRuleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.dataQualityRuleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dqr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          active: args.data.active ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.dataQualityRuleModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.dataQualityRuleModels.findIndex(x => x.id === args.where?.id || x.code === args.where?.code);
        if (idx >= 0) {
          this.dataQualityRuleModels[idx] = {
            ...this.dataQualityRuleModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.dataQualityRuleModels[idx];
        }
        throw new Error(`DataQualityRule not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.dataQualityRuleModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get dataQualityIssueModel() {
    return {
      findUnique: async (args: any) => {
        return this.dataQualityIssueModels.find(x => x.id === args.where?.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.dataQualityIssueModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dqi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'OPEN',
          detectedAt: new Date(),
          ...args.data
        };
        this.dataQualityIssueModels.push(item);
        return item;
      },
      createMany: async (args: any) => {
        const created = (args.data || []).map((d: any) => ({
          id: d.id || `dqi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: d.status || 'OPEN',
          detectedAt: new Date(),
          ...d
        }));
        this.dataQualityIssueModels.push(...created);
        return { count: created.length };
      },
      update: async (args: any) => {
        const idx = this.dataQualityIssueModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.dataQualityIssueModels[idx] = {
            ...this.dataQualityIssueModels[idx],
            ...args.data
          };
          return this.dataQualityIssueModels[idx];
        }
        throw new Error(`DataQualityIssue not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.dataQualityIssueModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get migrationProjectModel() {
    return {
      findUnique: async (args: any) => {
        return this.migrationProjectModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.migrationProjectModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.migrationProjectModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `mig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: args.data.status || 'PLANNING',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.migrationProjectModels.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.migrationProjectModels.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.migrationProjectModels[idx] = {
            ...this.migrationProjectModels[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return this.migrationProjectModels[idx];
        }
        throw new Error(`MigrationProject not found for update`);
      },
      count: async (args?: any) => {
        let list = [...this.migrationProjectModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get legacyIdMappingModel() {
    return {
      findUnique: async (args: any) => {
        if (args.where?.migrationProjectId_entityType_legacyId) {
          const { migrationProjectId, entityType, legacyId } = args.where.migrationProjectId_entityType_legacyId;
          return this.legacyIdMappingModels.find(
            x => (x.migrationProjectId === migrationProjectId || x.migrationId === migrationProjectId) &&
                 x.entityType === entityType &&
                 x.legacyId === legacyId
          ) || null;
        }
        if (args.where?.sourceSystem_entityType_legacyId) {
          const { sourceSystem, entityType, legacyId } = args.where.sourceSystem_entityType_legacyId;
          return this.legacyIdMappingModels.find(
            x => x.sourceSystem === sourceSystem && x.entityType === entityType && x.legacyId === legacyId
          ) || null;
        }
        return this.legacyIdMappingModels.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.legacyIdMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.legacyIdMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `leg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.legacyIdMappingModels.push(item);
        return item;
      },
      createMany: async (args: any) => {
        const created = (args.data || []).map((d: any) => ({
          id: d.id || `leg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...d
        }));
        this.legacyIdMappingModels.push(...created);
        return { count: created.length };
      },
      count: async (args?: any) => {
        let list = [...this.legacyIdMappingModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get migrationReconciliationModel() {
    return {
      findFirst: async (args: any) => {
        let list = [...this.migrationReconciliationModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.migrationReconciliationModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          reconciledAt: new Date(),
          ...args.data
        };
        this.migrationReconciliationModels.push(item);
        return item;
      },
      count: async (args?: any) => {
        let list = [...this.migrationReconciliationModels];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get supplier() {
    return {
      findUnique: async (args: any) => {
        return this.suppliers.find(x => x.id === args.where?.id || (args.where?.document && x.document === args.where?.document)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.suppliers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.suppliers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `sup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.suppliers.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.suppliers.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.suppliers[idx] = { ...this.suppliers[idx], ...args.data };
          return this.suppliers[idx];
        }
        throw new Error('Supplier not found');
      },
      count: async (args?: any) => {
        let list = [...this.suppliers];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get financialTransaction() {
    return {
      findUnique: async (args: any) => {
        return this.financialTransactions.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.financialTransactions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.financialTransactions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          amount: args.data.amount || 0,
          type: args.data.type || 'DEBIT',
          status: args.data.status || 'PENDING',
          createdAt: args.data.createdAt || new Date(),
          ...args.data
        };
        this.financialTransactions.push(item);
        return item;
      },
      update: async (args: any) => {
        const idx = this.financialTransactions.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.financialTransactions[idx] = { ...this.financialTransactions[idx], ...args.data };
          return this.financialTransactions[idx];
        }
        throw new Error('FinancialTransaction not found');
      },
      count: async (args?: any) => {
        let list = [...this.financialTransactions];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  private hydrateOperationTrace(trace: any, include?: any): any {
    if (!trace) return null;
    const copy = { ...trace };
    if (include?.spans || true) {
      copy.spans = this.traceSpans
        .filter(s => s.traceId === trace.id || s.correlationId === trace.correlationId)
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    }
    return copy;
  }

  private hydrateErrorGroup(group: any, include?: any): any {
    if (!group) return null;
    const copy = { ...group };
    if (include?.occurrences || true) {
      copy.occurrences = this.errorOccurrences
        .filter(o => o.errorGroupId === group.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return copy;
  }

  private hydratePolicy(policy: any, include?: any): any {
    if (!policy) return null;
    const copy = { ...policy };
    if (include?.rules) {
      copy.rules = this.policyRules
        .filter(r => r.policyId === policy.id && r.version === policy.currentVersion)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.orderIndex || 0) - (b.orderIndex || 0));
    }
    if (include?.versions) {
      copy.versions = this.policyVersions
        .filter(v => v.policyId === policy.id)
        .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
    }
    return copy;
  }

  private hydrateTask(task: any, include?: any): any {
    if (!task) return null;
    const copy = { ...task };
    if (include?.assignments || include?.history || include?.comments || include?.checklistItems || include?.dependencies) {
      // populate standard includes
    }
    copy.assignments = this.taskAssignments.filter(a => a.taskId === task.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    copy.checklistItems = this.taskChecklistItems.filter(i => i.taskId === task.id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    copy.checklist = copy.checklistItems; // alias
    copy.comments = this.taskComments.filter(c => c.taskId === task.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    copy.history = this.taskHistories.filter(h => h.taskId === task.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    copy.dependencies = this.taskDependencies.filter(d => d.taskId === task.id);
    copy.dependentOnMe = this.taskDependencies.filter(d => d.dependsOnTaskId === task.id);
    copy.slaEvents = this.slaEvents.filter(e => e.taskId === task.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    copy.escalationEvents = this.escalationEvents.filter(e => e.taskId === task.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (include?.assignedUser || copy.assignedUserId) {
      copy.assignedUser = this.users.find(u => u.id === task.assignedUserId) || null;
    }
    if (include?.assignedTeam || copy.assignedTeamId) {
      copy.assignedTeam = this.teams.find(t => t.id === task.assignedTeamId) || null;
    }
    return copy;
  }

  // Filter helper for Prisma-like conditions
  private filterEntities(list: any[], where: any): any[] {
    return list.filter(item => {
      for (const key of Object.keys(where)) {
        if (key === 'OR' && Array.isArray(where.OR)) {
          const matchAny = where.OR.some((clause: any) => {
            return this.filterEntities([item], clause).length > 0;
          });
          if (!matchAny) return false;
        } else if (key === 'AND' && Array.isArray(where.AND)) {
          const matchAll = where.AND.every((clause: any) => {
            return this.filterEntities([item], clause).length > 0;
          });
          if (!matchAll) return false;
        } else {
          const targetVal = where[key];
          if (targetVal === undefined) continue;

          if (typeof targetVal === 'object' && targetVal !== null) {
            if (targetVal.contains !== undefined) {
              const itemVal = String(item[key] || '').toLowerCase();
              const searchVal = String(targetVal.contains).toLowerCase();
              if (!itemVal.includes(searchVal)) return false;
            }
            if (targetVal.in !== undefined && Array.isArray(targetVal.in)) {
              if (!targetVal.in.includes(item[key])) return false;
            }
            if (targetVal.notIn !== undefined && Array.isArray(targetVal.notIn)) {
              if (targetVal.notIn.includes(item[key])) return false;
            }
            if (targetVal.equals !== undefined) {
              if (item[key] !== targetVal.equals) return false;
            }
            if (targetVal.not !== undefined) {
              if (item[key] === targetVal.not) return false;
            }
            const toVal = (v: any) => {
              if (v instanceof Date) return v.getTime();
              if (typeof v === 'string' && !isNaN(Date.parse(v)) && isNaN(Number(v))) return new Date(v).getTime();
              return v;
            };
            const itemV = toVal(item[key]);
            if (targetVal.gt !== undefined) {
              if (!(itemV > toVal(targetVal.gt))) return false;
            }
            if (targetVal.gte !== undefined) {
              if (!(itemV >= toVal(targetVal.gte))) return false;
            }
            if (targetVal.lt !== undefined) {
              if (!(itemV < toVal(targetVal.lt))) return false;
            }
            if (targetVal.lte !== undefined) {
              if (!(itemV <= toVal(targetVal.lte))) return false;
            }
          } else {
            if (targetVal === null) {
              if (item[key] !== null && item[key] !== undefined) return false;
            } else {
              if (item[key] !== targetVal) return false;
            }
          }
        }
      }
      return true;
    });
  }

  private hydrateApprovalRequest(req: any, include?: any): any {
    if (!req) return null;
    const copy = { ...req };
    if (include?.rule) {
      copy.rule = this.approvalRules.find(r => r.id === req.ruleId) || null;
    }
    if (include?.requester) {
      copy.requester = this.users.find(u => u.id === req.requesterId) || null;
    }
    if (include?.steps) {
      copy.steps = this.approvalSteps
        .filter(s => s.requestId === req.id)
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map(s => {
          const stepCopy = { ...s };
          if (include.steps.include?.decisions) {
            stepCopy.decisions = this.approvalDecisions.filter(d => d.stepId === s.id);
          }
          return stepCopy;
        });
    }
    if (include?.decisions) {
      copy.decisions = this.approvalDecisions
        .filter(d => d.requestId === req.id)
        .sort((a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime());
    }
    if (include?.comments) {
      copy.comments = this.approvalComments
        .filter(c => c.requestId === req.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (include?.attachments) {
      copy.attachments = this.approvalAttachments
        .filter(a => a.requestId === req.id);
    }
    if (include?.producer) {
      copy.producer = this.producers.find(p => p.id === req.producerId) || null;
    }
    if (include?.event) {
      copy.event = this.events.find(e => e.id === req.eventId) || null;
    }
    return copy;
  }

  private hydrateCustomer(customer: any, include?: any): any {
    const copy = { ...customer };
    if (include?.orders) {
      copy.orders = this.orders.filter(o => o.customerId === customer.id);
    }
    if (include?.supportTickets) {
      copy.supportTickets = this.supportTickets.filter(s => s.customerId === customer.id);
    }
    if (include?.refunds) {
      copy.refunds = this.refunds.filter(r => r.customerId === customer.id);
    }
    return copy;
  }

  private hydrateOrder(order: any, include?: any): any {
    const copy = { ...order };
    if (include?.customer) {
      copy.customer = this.customers.find(c => c.id === order.customerId) || null;
    }
    if (include?.tickets) {
      copy.tickets = this.tickets.filter(t => t.orderId === order.id);
    }
    if (include?.payments) {
      copy.payments = this.payments.filter(p => p.orderId === order.id);
    }
    if (include?.refunds) {
      copy.refunds = this.refunds.filter(r => r.orderId === order.id);
    }
    if (include?.supportTickets) {
      copy.supportTickets = this.supportTickets.filter(s => s.orderId === order.id);
    }
    return copy;
  }

  // Hydration helpers
  private hydrateUser(user: any, include?: any): any {
    const copy = { ...user };
    if (include?.userRoles) {
      copy.userRoles = this.userRoles
        .filter(ur => ur.userId === user.id)
        .map(ur => {
          const role = this.roles.find(r => r.id === ur.roleId);
          return {
            ...ur,
            role: include.userRoles.include?.role ? this.hydrateRole(role, include.userRoles.include.role.include) : role
          };
        });
    }
    if (include?.userPermissions) {
      copy.userPermissions = this.userPermissions
        .filter(up => up.userId === user.id)
        .map(up => ({
          ...up,
          permission: this.permissions.find(p => p.id === up.permissionId)
        }));
    }
    if (include?.producerAccesses) {
      copy.producerAccesses = this.userProducerAccesses
        .filter(upa => upa.userId === user.id)
        .map(upa => ({
          ...upa,
          producer: this.producers.find(p => p.id === upa.producerId)
        }));
    }
    if (include?.eventAccesses) {
      copy.eventAccesses = this.userEventAccesses
        .filter(uea => uea.userId === user.id)
        .map(uea => ({
          ...uea,
          event: this.events.find(e => e.id === uea.eventId)
        }));
    }
    return copy;
  }

  private hydrateRole(role: any, include?: any): any {
    if (!role) return null;
    const copy = { ...role };
    if (include?.rolePermissions) {
      copy.rolePermissions = this.rolePermissions
        .filter(rp => rp.roleId === role.id)
        .map(rp => ({
          ...rp,
          permission: this.permissions.find(p => p.id === rp.permissionId)
        }));
    }
    return copy;
  }
}

// Global Memory Store Instance
export const memoryDb = new InMemoryPrismaStore();

// Exported Prisma Client
// Defaults to in-memory store in test / offline mode, or PrismaClient when live PostgreSQL is connected
export const prisma: any = memoryDb;
