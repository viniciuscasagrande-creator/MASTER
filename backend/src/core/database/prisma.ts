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
  public eventCategoryRecords: any[] = [];
  public eventMediaRecords: any[] = [];
  public eventResponsibilityRecords: any[] = [];
  public eventWizardStateRecords: any[] = [];
  public venueRecords: any[] = [];
  public venueSectionRecords: any[] = [];
  public venueMapRecords: any[] = [];
  public venueMapVersionRecords: any[] = [];
  public venueMapElementRecords: any[] = [];
  public venueRowRecords: any[] = [];
  public venueSeatRecords: any[] = [];
  public venueAccessPointRecords: any[] = [];
  public eventVenueRecords: any[] = [];
  public eventSectionRecords: any[] = [];
  public eventSessionRecords: any[] = [];
  public sessionSectionRecords: any[] = [];
  public sessionCapacityReservationRecords: any[] = [];
  public sessionRecurrenceGroupRecords: any[] = [];
  public ticketTypeRecords: any[] = [];
  public eventTicketTypeRecords: any[] = [];
  public eventTicketTypeSectionRecords: any[] = [];
  public eventTicketTypeSessionRecords: any[] = [];
  public eventTicketTypeBenefitRecords: any[] = [];
  public inventoryPoolRecords: any[] = [];
  public inventoryAllocationRecords: any[] = [];
  public inventoryBlockRecords: any[] = [];
  public seatInventoryRecords: any[] = [];
  public ticketBatchRecords: any[] = [];
  public priceConfigurationRecords: any[] = [];
  public feeComponentRecords: any[] = [];
  public salesRuleRecords: any[] = [];
  // Fase 1.2.7 — Canais de Venda, Cortesias e Equipe
  public salesChannelRecords: any[] = [];
  public eventSalesChannelRecords: any[] = [];
  public eventSalesChannelSessionRecords: any[] = [];
  public eventSalesChannelSectionRecords: any[] = [];
  public eventSalesChannelTicketTypeRecords: any[] = [];
  public channelAllocationRecords: any[] = [];
  public salesPointRecords: any[] = [];
  public salesTerminalRecords: any[] = [];
  public salesPartnerRecords: any[] = [];
  public complimentaryCategoryRecords: any[] = [];
  public complimentaryQuotaRecords: any[] = [];
  public complimentaryRequestRecords: any[] = [];
  public complimentaryGuestRecords: any[] = [];
  public eventTeamRecords: any[] = [];
  public eventTeamMemberRecords: any[] = [];
  public eventTeamShiftRecords: any[] = [];
  public eventShiftAssignmentRecords: any[] = [];
  // Fase 1.2.8 — Documentos, Pendências e Readiness
  public eventDocumentRequirementRecords: any[] = [];
  public readinessCheckDefinitionRecords: any[] = [];
  public readinessSnapshotRecords: any[] = [];
  public eventTaskRecords: any[] = [];
  // Fase 1.2.9 — State Machine, Revisão e Publicação
  public eventReviewSnapshotRecords: any[] = [];
  public eventPublicationScheduleRecords: any[] = [];
  // Fase 1.2.10 — Alterações Controladas e Impacto
  public eventChangeRequestRecords: any[] = [];
  // Fase 1.2.11 — Dashboard Executivo e Operacional
  public eventDashboardSnapshotRecords: any[] = [];
  // Fase 1.2.12 — Central de Operação do Evento em Tempo Real
  public eventOperationSessionRecords: any[] = [];
  public eventOperationAreaRecords: any[] = [];
  public operationShiftRecords: any[] = [];
  public sessionAccessPointRecords: any[] = [];
  public operationCommandRecords: any[] = [];
  public operationBroadcastRecords: any[] = [];
  public operationBroadcastReceiptRecords: any[] = [];
  public operationHandoffRecords: any[] = [];
  // Fase 1.2.13 — Check-in + Controle de Acesso + Dispositivos
  public accessDeviceRecords: any[] = [];
  public deviceSessionRecords: any[] = [];
  public accessRuleRecords: any[] = [];
  public accessValidationRecords: any[] = [];
  public accessEntryRecords: any[] = [];
  public ticketAccessBlockRecords: any[] = [];
  public accessExceptionRequestRecords: any[] = [];
  public offlineValidationBundleRecords: any[] = [];
  public offlineSyncBatchRecords: any[] = [];
  public offlineConflictRecords: any[] = [];
  // Fase 1.2.14 — Encerramento + Cancelamento + Pós-Evento + Arquivamento
  public sessionClosureRecords: any[] = [];
  public eventClosureRecords: any[] = [];
  public eventClosureSnapshotRecords: any[] = [];
  public closureOverrideRecords: any[] = [];
  public eventCancellationRequestRecords: any[] = [];
  public cancellationImpactSnapshotRecords: any[] = [];
  public eventArchiveRecords: any[] = [];
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
  public orderItems: any[] = [];
  public orderBuyerSnapshots: any[] = [];
  public orderTimelineEvents: any[] = [];
  // Fase 1.3.3 & 1.3.4 — CRM B2B & Oportunidades
  public commercialAccounts: any[] = [];
  public commercialPortfolioAssignments: any[] = [];
  public producerContacts: any[] = [];
  public commercialLeads: any[] = [];
  public commercialActivities: any[] = [];
  public commercialPipelines: any[] = [];
  public commercialPipelineStages: any[] = [];
  public commercialOpportunities: any[] = [];
  public opportunityStageHistories: any[] = [];
  public opportunityCloseReasons: any[] = [];
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
    this.eventCategoryRecords = [];
    this.eventMediaRecords = [];
    this.eventResponsibilityRecords = [];
    this.eventWizardStateRecords = [];
    this.venueRecords = [];
    this.venueSectionRecords = [];
    this.venueMapRecords = [];
    this.venueMapVersionRecords = [];
    this.venueMapElementRecords = [];
    this.venueRowRecords = [];
    this.venueSeatRecords = [];
    this.venueAccessPointRecords = [];
    this.eventVenueRecords = [];
    this.eventSectionRecords = [];
    this.eventSessionRecords = [];
    this.sessionSectionRecords = [];
    this.sessionCapacityReservationRecords = [];
    this.sessionRecurrenceGroupRecords = [];
    this.ticketTypeRecords = [];
    this.eventTicketTypeRecords = [];
    this.eventTicketTypeSectionRecords = [];
    this.eventTicketTypeSessionRecords = [];
    this.eventTicketTypeBenefitRecords = [];
    this.inventoryPoolRecords = [];
    this.inventoryAllocationRecords = [];
    this.inventoryBlockRecords = [];
    this.seatInventoryRecords = [];
    this.ticketBatchRecords = [];
    this.priceConfigurationRecords = [];
    this.feeComponentRecords = [];
    this.salesRuleRecords = [];
    this.salesChannelRecords = [];
    this.eventSalesChannelRecords = [];
    this.eventSalesChannelSessionRecords = [];
    this.eventSalesChannelSectionRecords = [];
    this.eventSalesChannelTicketTypeRecords = [];
    this.channelAllocationRecords = [];
    this.salesPointRecords = [];
    this.salesTerminalRecords = [];
    this.salesPartnerRecords = [];
    this.complimentaryCategoryRecords = [];
    this.complimentaryQuotaRecords = [];
    this.complimentaryRequestRecords = [];
    this.complimentaryGuestRecords = [];
    this.eventTeamRecords = [];
    this.eventTeamMemberRecords = [];
    this.eventTeamShiftRecords = [];
    this.eventShiftAssignmentRecords = [];
    this.eventDocumentRequirementRecords = [];
    this.readinessCheckDefinitionRecords = [];
    this.readinessSnapshotRecords = [];
    this.eventTaskRecords = [];
    this.eventReviewSnapshotRecords = [];
    this.eventPublicationScheduleRecords = [];
    this.eventChangeRequestRecords = [];
    this.eventDashboardSnapshotRecords = [];
    this.eventOperationSessionRecords = [];
    this.eventOperationAreaRecords = [];
    this.operationShiftRecords = [];
    this.sessionAccessPointRecords = [];
    this.operationCommandRecords = [];
    this.operationBroadcastRecords = [];
    this.operationBroadcastReceiptRecords = [];
    this.operationHandoffRecords = [];
    this.accessDeviceRecords = [];
    this.deviceSessionRecords = [];
    this.accessRuleRecords = [];
    this.accessValidationRecords = [];
    this.accessEntryRecords = [];
    this.ticketAccessBlockRecords = [];
    this.accessExceptionRequestRecords = [];
    this.offlineValidationBundleRecords = [];
    this.offlineSyncBatchRecords = [];
    this.offlineConflictRecords = [];
    this.sessionClosureRecords = [];
    this.eventClosureRecords = [];
    this.eventClosureSnapshotRecords = [];
    this.closureOverrideRecords = [];
    this.eventCancellationRequestRecords = [];
    this.cancellationImpactSnapshotRecords = [];
    this.eventArchiveRecords = [];
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
    this.orderItems = [];
    this.orderBuyerSnapshots = [];
    this.orderTimelineEvents = [];
    // Fase 1.3.3 & 1.3.4
    this.commercialAccounts = [];
    this.commercialPortfolioAssignments = [];
    this.producerContacts = [];
    this.commercialLeads = [];
    this.commercialActivities = [];
    this.commercialPipelines = [];
    this.commercialPipelineStages = [];
    this.commercialOpportunities = [];
    this.opportunityStageHistories = [];
    this.opportunityCloseReasons = [];
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
      { id: 'p-evt-4', module: 'eventos', resource: 'evento', action: 'identidade.editar', code: 'eventos.evento.identidade.editar', description: 'Editar identidade visual e mídias do evento' },
      { id: 'p-evt-5', module: 'eventos', resource: 'evento', action: 'responsaveis.visualizar', code: 'eventos.evento.responsaveis.visualizar', description: 'Visualizar responsáveis pelo evento' },
      { id: 'p-evt-6', module: 'eventos', resource: 'evento', action: 'responsaveis.editar', code: 'eventos.evento.responsaveis.editar', description: 'Editar responsáveis pelo evento' },
      { id: 'p-evt-7', module: 'eventos', resource: 'evento', action: 'rascunho.descartar', code: 'eventos.evento.rascunho.descartar', description: 'Descartar rascunho de evento' },
      // Check-in + Controle de Acesso + Dispositivos (Fase 1.2.13)
      { id: 'p-chk-1', module: 'eventos', resource: 'checkin', action: 'validar', code: 'eventos.checkin.validar', description: 'Validar check-in de ingressos' },
      { id: 'p-chk-2', module: 'eventos', resource: 'checkin', action: 'reverter', code: 'eventos.checkin.reverter', description: 'Reverter check-in de ingressos' },
      { id: 'p-chk-3', module: 'eventos', resource: 'checkin', action: 'manual', code: 'eventos.checkin.manual', description: 'Realizar entrada manual em contingência' },
      { id: 'p-chk-4', module: 'eventos', resource: 'checkin', action: 'excecao.solicitar', code: 'eventos.checkin.excecao.solicitar', description: 'Solicitar liberação de exceção de acesso' },
      { id: 'p-chk-5', module: 'eventos', resource: 'checkin', action: 'excecao.aprovar', code: 'eventos.checkin.excecao.aprovar', description: 'Aprovar exceção de acesso como supervisor' },
      { id: 'p-chk-6', module: 'eventos', resource: 'checkin', action: 'bloqueio.gerenciar', code: 'eventos.checkin.bloqueio.gerenciar', description: 'Bloquear e desbloquear acesso de ingressos' },
      { id: 'p-chk-7', module: 'eventos', resource: 'checkin', action: 'dispositivos.visualizar', code: 'eventos.checkin.dispositivos.visualizar', description: 'Visualizar scanners e dispositivos de acesso' },
      { id: 'p-chk-8', module: 'eventos', resource: 'checkin', action: 'dispositivos.vincular', code: 'eventos.checkin.dispositivos.vincular', description: 'Vincular dispositivo a operador e ponto de acesso' },
      { id: 'p-chk-9', module: 'eventos', resource: 'checkin', action: 'dispositivos.autorizar', code: 'eventos.checkin.dispositivos.autorizar', description: 'Autorizar novos dispositivos de scanner' },
      { id: 'p-chk-10', module: 'eventos', resource: 'checkin', action: 'dispositivos.revogar', code: 'eventos.checkin.dispositivos.revogar', description: 'Revogar dispositivo imediatamente' },
      { id: 'p-chk-11', module: 'eventos', resource: 'checkin', action: 'regras.gerenciar', code: 'eventos.checkin.regras.gerenciar', description: 'Gerenciar regras de acesso e reentrada' },
      { id: 'p-chk-12', module: 'eventos', resource: 'checkin', action: 'offline.sincronizar', code: 'eventos.checkin.offline.sincronizar', description: 'Sincronizar lotes validados offline' },
      { id: 'p-chk-13', module: 'eventos', resource: 'checkin', action: 'relatorios.visualizar', code: 'eventos.checkin.relatorios.visualizar', description: 'Visualizar relatórios de check-in e conciliação' },
      // Encerramento + Cancelamento + Pós-Evento + Arquivamento (Fase 1.2.14)
      { id: 'p-cls-1', module: 'eventos', resource: 'encerramento', action: 'sessao.encerrar', code: 'eventos.encerramento.sessao.encerrar', description: 'Encerrar sessão de evento' },
      { id: 'p-cls-2', module: 'eventos', resource: 'encerramento', action: 'evento.encerrar', code: 'eventos.encerramento.evento.encerrar', description: 'Encerrar evento após fechamento de todas as sessões' },
      { id: 'p-cls-3', module: 'eventos', resource: 'encerramento', action: 'override.aplicar', code: 'eventos.encerramento.override.aplicar', description: 'Aplicar justificativa de override em bloqueador de encerramento' },
      { id: 'p-cls-4', module: 'eventos', resource: 'cancelamento', action: 'solicitar', code: 'eventos.cancelamento.solicitar', description: 'Solicitar cancelamento de evento ou sessão' },
      { id: 'p-cls-5', module: 'eventos', resource: 'cancelamento', action: 'avaliar_impacto', code: 'eventos.cancelamento.avaliar_impacto', description: 'Calcular impacto sistêmico do cancelamento' },
      { id: 'p-cls-6', module: 'eventos', resource: 'cancelamento', action: 'executar', code: 'eventos.cancelamento.executar', description: 'Executar cancelamento do evento' },
      { id: 'p-cls-7', module: 'eventos', resource: 'cancelamento', action: 'sessao.executar', code: 'eventos.cancelamento.sessao.executar', description: 'Executar cancelamento parcial de sessão' },
      { id: 'p-cls-8', module: 'eventos', resource: 'pos_evento', action: 'visualizar', code: 'eventos.pos_evento.visualizar', description: 'Visualizar painel pós-evento operacional' },
      { id: 'p-cls-9', module: 'eventos', resource: 'pos_evento', action: 'relatorio.exportar', code: 'eventos.pos_evento.relatorio.exportar', description: 'Exportar relatório operacional consolidado de pós-evento' },
      { id: 'p-cls-10', module: 'eventos', resource: 'arquivamento', action: 'arquivar', code: 'eventos.arquivamento.arquivar', description: 'Arquivar evento encerrado ou cancelado' },
      { id: 'p-cls-11', module: 'eventos', resource: 'arquivamento', action: 'visualizar', code: 'eventos.arquivamento.visualizar', description: 'Visualizar acervo de eventos arquivados' },
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
      // Comercial (Fases 1.3.1 a 1.3.4)
      { id: 'p-com-1', module: 'comercial', resource: 'dashboard', action: 'visualizar', code: 'comercial.dashboard.visualizar', description: 'Visualizar Dashboard Comercial' },
      { id: 'p-com-2', module: 'comercial', resource: 'pedidos', action: 'visualizar', code: 'comercial.pedidos.visualizar', description: 'Visualizar pedidos comerciais' },
      { id: 'p-com-3', module: 'comercial', resource: 'pedidos', action: 'detalhes', code: 'comercial.pedidos.detalhes', description: 'Visualizar detalhes de pedidos' },
      { id: 'p-com-4', module: 'comercial', resource: 'pedidos', action: 'exportar', code: 'comercial.pedidos.exportar', description: 'Exportar pedidos comerciais' },
      { id: 'p-com-5', module: 'comercial', resource: 'clientes', action: 'resumo.visualizar', code: 'comercial.clientes.resumo.visualizar', description: 'Visualizar resumo do comprador do pedido' },
      { id: 'p-com-6', module: 'comercial', resource: 'clientes', action: 'dados_sensiveis', code: 'comercial.clientes.dados_sensiveis', description: 'Visualizar dados sensíveis do comprador' },
      { id: 'p-com-7', module: 'comercial', resource: 'vendas', action: 'visualizar', code: 'comercial.vendas.visualizar', description: 'Visualizar central de vendas' },
      { id: 'p-com-8', module: 'comercial', resource: 'vendas', action: 'valores.visualizar', code: 'comercial.vendas.valores.visualizar', description: 'Visualizar valores financeiros de vendas' },
      { id: 'p-com-9', module: 'comercial', resource: 'vendas', action: 'performance.visualizar', code: 'comercial.vendas.performance.visualizar', description: 'Visualizar performance comercial dos eventos' },
      { id: 'p-com-10', module: 'comercial', resource: 'vendas', action: 'exportar', code: 'comercial.vendas.exportar', description: 'Exportar relatórios de vendas comerciais' },
      { id: 'p-com-11', module: 'comercial', resource: 'alertas', action: 'visualizar', code: 'comercial.alertas.visualizar', description: 'Visualizar alertas comerciais' },
      { id: 'p-com-12', module: 'comercial', resource: 'produtores', action: 'visualizar', code: 'comercial.produtores.visualizar', description: 'Visualizar central de produtores' },
      { id: 'p-com-13', module: 'comercial', resource: 'produtores', action: 'criar', code: 'comercial.produtores.criar', description: 'Criar cadastro comercial de produtor' },
      { id: 'p-com-14', module: 'comercial', resource: 'produtores', action: 'editar', code: 'comercial.produtores.editar', description: 'Editar informações comerciais do produtor' },
      { id: 'p-com-15', module: 'comercial', resource: 'produtores', action: 'detalhes', code: 'comercial.produtores.detalhes', description: 'Visualizar detalhes e visão comercial do produtor' },
      { id: 'p-com-16', module: 'comercial', resource: 'carteira', action: 'visualizar', code: 'comercial.carteira.visualizar', description: 'Visualizar carteira comercial' },
      { id: 'p-com-17', module: 'comercial', resource: 'carteira', action: 'atribuir', code: 'comercial.carteira.atribuir', description: 'Atribuir produtores à carteira de operadores' },
      { id: 'p-com-18', module: 'comercial', resource: 'prospeccoes', action: 'visualizar', code: 'comercial.prospeccoes.visualizar', description: 'Visualizar prospecções comerciais / leads' },
      { id: 'p-com-19', module: 'comercial', resource: 'prospeccoes', action: 'criar', code: 'comercial.prospeccoes.criar', description: 'Criar prospecção comercial' },
      { id: 'p-com-20', module: 'comercial', resource: 'prospeccoes', action: 'editar', code: 'comercial.prospeccoes.editar', description: 'Editar prospecção comercial' },
      { id: 'p-com-21', module: 'comercial', resource: 'prospeccoes', action: 'converter', code: 'comercial.prospeccoes.converter', description: 'Converter lead em produtor formal' },
      { id: 'p-com-22', module: 'comercial', resource: 'oportunidades', action: 'visualizar', code: 'comercial.oportunidades.visualizar', description: 'Visualizar oportunidades e negociações' },
      { id: 'p-com-23', module: 'comercial', resource: 'oportunidades', action: 'criar', code: 'comercial.oportunidades.criar', description: 'Criar oportunidade comercial' },
      { id: 'p-com-24', module: 'comercial', resource: 'oportunidades', action: 'editar', code: 'comercial.oportunidades.editar', description: 'Editar oportunidade comercial' },
      { id: 'p-com-25', module: 'comercial', resource: 'oportunidades', action: 'mover', code: 'comercial.oportunidades.mover', description: 'Transicionar estágio de oportunidade' },
      { id: 'p-com-26', module: 'comercial', resource: 'oportunidades', action: 'ganhar', code: 'comercial.oportunidades.ganhar', description: 'Marcar oportunidade como ganha' },
      { id: 'p-com-27', module: 'comercial', resource: 'oportunidades', action: 'encerrar', code: 'comercial.oportunidades.encerrar', description: 'Encerrar/perder oportunidade comercial' },
      { id: 'p-com-28', module: 'comercial', resource: 'pipeline', action: 'visualizar', code: 'comercial.pipeline.visualizar', description: 'Visualizar pipeline / kanban comercial' },
      { id: 'p-com-29', module: 'comercial', resource: 'pipeline', action: 'configurar', code: 'comercial.pipeline.configurar', description: 'Configurar pipelines e estágios' },
      { id: 'p-com-30', module: 'comercial', resource: 'atividades', action: 'visualizar', code: 'comercial.atividades.visualizar', description: 'Visualizar atividades comerciais' },
      { id: 'p-com-31', module: 'comercial', resource: 'atividades', action: 'registrar', code: 'comercial.atividades.registrar', description: 'Registrar reuniões, ligações e contatos comerciais' }
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
    associate('PRODUTOR', 'eventos.evento.identidade.editar');
    associate('PRODUTOR', 'eventos.evento.responsaveis.visualizar');
    associate('PRODUTOR', 'eventos.evento.responsaveis.editar');
    associate('PRODUTOR', 'eventos.evento.rascunho.descartar');
    associate('PRODUTOR', 'busca.global.utilizar');
    associate('PRODUTOR', 'busca.evento.visualizar');
    associate('PRODUTOR', 'busca.ingresso.visualizar');
    associate('PRODUTOR', 'busca.pedido.visualizar');
    associate('PRODUTOR', 'aprovacoes.caixa.visualizar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.visualizar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.criar');
    associate('PRODUTOR', 'aprovacoes.solicitacao.cancelar');

    // Check-in, Controle de Acesso, Encerramento e Cancelamento (Fases 1.2.13 e 1.2.14)
    this.permissions.filter(p => p.code.startsWith('eventos.checkin.') || p.code.startsWith('eventos.encerramento.') || p.code.startsWith('eventos.cancelamento.') || p.code.startsWith('eventos.pos_evento.') || p.code.startsWith('eventos.arquivamento.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
      associate('PRODUTOR', p.code);
      associate('SUPORTE_EVENTOS', p.code);
    });

    // Comercial (Fases 1.3.1 e 1.3.2)
    this.permissions.filter(p => p.code.startsWith('comercial.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
      associate('PRODUTOR', p.code);
      associate('COMERCIAL', p.code);
    });

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

    // Comercial (Fases 1.3.1 a 1.3.4)
    this.permissions.filter(p => p.code.startsWith('comercial.')).forEach(p => {
      associate('ADMINISTRADOR_GERAL', p.code);
      associate('COMERCIAL', p.code);
    });
    associate('COMERCIAL', 'busca.global.utilizar');
    associate('COMERCIAL', 'busca.evento.visualizar');
    associate('COMERCIAL', 'busca.produtor.visualizar');

    // 4. Produtores Iniciais
    this.producers.push(
      { id: 'prd_100', name: 'Opus Entretenimento', cnpj: '12.345.678/0001-90', status: 'ACTIVE' },
      { id: 'prd_200', name: 'Live Nation Brasil', cnpj: '98.765.432/0001-11', status: 'ACTIVE' },
      { id: 'prd_300', name: 'CWB Brasil Produções', cnpj: '45.123.890/0001-55', status: 'ACTIVE' }
    );

    // 4.1 Categorias de Eventos (Fase 1.2.2)
    this.eventCategoryRecords.push(
      { id: 'cat-musica', name: 'Música', slug: 'musica', parentId: null, active: true, sortOrder: 1 },
      { id: 'cat-musica-show', name: 'Show', slug: 'show', parentId: 'cat-musica', active: true, sortOrder: 1 },
      { id: 'cat-musica-festival', name: 'Festival', slug: 'festival', parentId: 'cat-musica', active: true, sortOrder: 2 },
      { id: 'cat-musica-concerto', name: 'Concerto', slug: 'concerto', parentId: 'cat-musica', active: true, sortOrder: 3 },
      { id: 'cat-esportes', name: 'Esportes', slug: 'esportes', parentId: null, active: true, sortOrder: 2 },
      { id: 'cat-esportes-futebol', name: 'Futebol', slug: 'futebol', parentId: 'cat-esportes', active: true, sortOrder: 1 },
      { id: 'cat-esportes-corrida', name: 'Corrida', slug: 'corrida', parentId: 'cat-esportes', active: true, sortOrder: 2 },
      { id: 'cat-esportes-outros', name: 'Outros Esportes', slug: 'outros-esportes', parentId: 'cat-esportes', active: true, sortOrder: 3 },
      { id: 'cat-teatro', name: 'Teatro e Cultura', slug: 'teatro-e-cultura', parentId: null, active: true, sortOrder: 3 },
      { id: 'cat-teatro-peca', name: 'Peça Teatral', slug: 'peca-teatral', parentId: 'cat-teatro', active: true, sortOrder: 1 },
      { id: 'cat-teatro-musical', name: 'Musical', slug: 'musical', parentId: 'cat-teatro', active: true, sortOrder: 2 },
      { id: 'cat-teatro-danca', name: 'Dança', slug: 'danca', parentId: 'cat-teatro', active: true, sortOrder: 3 },
      { id: 'cat-congressos', name: 'Congressos e Palestras', slug: 'congressos-e-palestras', parentId: null, active: true, sortOrder: 4 },
      { id: 'cat-congressos-conf', name: 'Conferência', slug: 'conferencia', parentId: 'cat-congressos', active: true, sortOrder: 1 },
      { id: 'cat-congressos-seminario', name: 'Seminário', slug: 'seminario', parentId: 'cat-congressos', active: true, sortOrder: 2 },
      { id: 'cat-congressos-feira', name: 'Feira de Negócios', slug: 'feira-de-negocios', parentId: 'cat-congressos', active: true, sortOrder: 3 },
      { id: 'cat-festas', name: 'Festas e Baladas', slug: 'festas-e-baladas', parentId: null, active: true, sortOrder: 5 },
      { id: 'cat-gastronomia', name: 'Gastronomia', slug: 'gastronomia', parentId: null, active: true, sortOrder: 6 },
      { id: 'cat-comedia', name: 'Comédia e Stand-up', slug: 'comedia-e-stand-up', parentId: null, active: true, sortOrder: 7 }
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

    // 5.1 Locais e Estruturas Físicas (Fase 1.2.3)
    this.venueRecords.push(
      {
        id: 'ven_arena_curitiba',
        publicCode: 'VEN-2026-000001',
        name: 'Arena Disk Curitiba',
        type: 'ARENA',
        scope: 'GLOBAL',
        status: 'ACTIVE',
        postalCode: '80000-000',
        street: 'Av. das Américas',
        number: '1000',
        district: 'Tarumã',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        capacity: 22500,
        phone: '(41) 3333-1000',
        email: 'operacoes@arenadisk.com.br',
        version: 1,
        createdAt: new Date('2026-01-10T10:00:00Z'),
        updatedAt: new Date('2026-09-18T10:00:00Z')
      },
      {
        id: 'ven_teatro_positivo',
        publicCode: 'VEN-2026-000002',
        name: 'Teatro Positivo',
        type: 'THEATER',
        scope: 'GLOBAL',
        status: 'ACTIVE',
        postalCode: '81280-330',
        street: 'Rua Prof. Pedro Viriato Parigot de Souza',
        number: '5300',
        district: 'Campo Comprido',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        capacity: 2400,
        phone: '(41) 3317-3000',
        email: 'eventos@teatropositivo.com.br',
        version: 1,
        createdAt: new Date('2026-01-15T11:00:00Z'),
        updatedAt: new Date('2026-09-18T11:00:00Z')
      },
      {
        id: 'ven_pedreira',
        publicCode: 'VEN-2026-000003',
        name: 'Pedreira Paulo Leminski',
        type: 'OPEN_AIR',
        scope: 'GLOBAL',
        status: 'ACTIVE',
        postalCode: '82130-010',
        street: 'Rua João Gava',
        number: '970',
        district: 'Abranches',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        capacity: 25000,
        phone: '(41) 3354-2000',
        version: 1,
        createdAt: new Date('2026-01-20T09:00:00Z'),
        updatedAt: new Date('2026-09-18T09:00:00Z')
      },
      {
        id: 'ven_couto_pereira',
        publicCode: 'VEN-2026-000004',
        name: 'Estádio Couto Pereira',
        type: 'STADIUM',
        scope: 'GLOBAL',
        status: 'ACTIVE',
        postalCode: '80060-000',
        street: 'Rua Ubaldino do Amaral',
        number: '37',
        district: 'Alto da Glória',
        city: 'Curitiba',
        state: 'PR',
        country: 'BR',
        capacity: 45000,
        version: 1,
        createdAt: new Date('2026-02-01T14:00:00Z'),
        updatedAt: new Date('2026-09-18T14:00:00Z')
      }
    );

    // Seções / Estruturas da Arena Disk Curitiba
    this.venueSectionRecords.push(
      { id: 'vsec_pista', venueId: 'ven_arena_curitiba', name: 'Pista', code: 'PISTA', type: 'GENERAL_ADMISSION', capacity: 8000, active: true, sortOrder: 1, createdAt: new Date() },
      { id: 'vsec_pista_premium', venueId: 'ven_arena_curitiba', name: 'Pista Premium', code: 'PREMIUM', type: 'VIP', capacity: 4000, active: true, sortOrder: 2, createdAt: new Date() },
      { id: 'vsec_camarote', venueId: 'ven_arena_curitiba', name: 'Camarote', code: 'CAMAROTE', type: 'BOX', capacity: 1500, active: true, sortOrder: 3, createdAt: new Date() },
      { id: 'vsec_arq_inf', venueId: 'ven_arena_curitiba', name: 'Arquibancada Inferior', code: 'ARQ_INF', type: 'SEATED', capacity: 5000, active: true, sortOrder: 4, createdAt: new Date() },
      { id: 'vsec_arq_sup', venueId: 'ven_arena_curitiba', name: 'Arquibancada Superior', code: 'ARQ_SUP', type: 'SEATED', capacity: 4000, active: true, sortOrder: 5, createdAt: new Date() },
      { id: 'vsec_vip', venueId: 'ven_arena_curitiba', name: 'Área VIP', code: 'VIP', type: 'VIP', capacity: 500, active: true, sortOrder: 6, createdAt: new Date() },
      { id: 'vsec_tecnica', venueId: 'ven_arena_curitiba', name: 'Área Técnica', code: 'TEC', type: 'TECHNICAL', capacity: 200, active: true, sortOrder: 7, createdAt: new Date() }
    );

    // Mapas da Arena Disk Curitiba
    this.venueMapRecords.push(
      { id: 'vmap_frontal', venueId: 'ven_arena_curitiba', name: 'Show Frontal', activeVersionId: 'vmapv_frontal_3', status: 'ACTIVE', createdAt: new Date() },
      { id: 'vmap_central', venueId: 'ven_arena_curitiba', name: 'Palco Central', activeVersionId: 'vmapv_central_1', status: 'ACTIVE', createdAt: new Date() }
    );

    this.venueMapVersionRecords.push(
      { id: 'vmapv_frontal_3', mapId: 'vmap_frontal', versionNumber: 3, name: 'Versão Oficial 2026', status: 'ACTIVE', totalCapacity: 22500, version: 1, createdAt: new Date() },
      { id: 'vmapv_central_1', mapId: 'vmap_central', versionNumber: 1, name: 'Versão 360 Graus', status: 'ACTIVE', totalCapacity: 24000, version: 1, createdAt: new Date() }
    );

    // Acessos da Arena
    this.venueAccessPointRecords.push(
      { id: 'vpt_1', venueId: 'ven_arena_curitiba', name: 'Portão A - Pista', code: 'PT_A', type: 'GATE', active: true, createdAt: new Date() },
      { id: 'vpt_2', venueId: 'ven_arena_curitiba', name: 'Portão B - Arquibancadas', code: 'PT_B', type: 'GATE', active: true, createdAt: new Date() },
      { id: 'vpt_3', venueId: 'ven_arena_curitiba', name: 'Portão VIP - Pista Premium e Camarotes', code: 'PT_VIP', type: 'VIP_GATE', active: true, createdAt: new Date() },
      { id: 'vpt_4', venueId: 'ven_arena_curitiba', name: 'Entrada Principal e Bilheteria', code: 'PT_MAIN', type: 'MAIN_ENTRANCE', active: true, createdAt: new Date() }
    );

    // 5.2 Sessões Operacionais Iniciais (Fase 1.2.4)
    this.eventSessionRecords.push(
      {
        id: 'ses_1001_1',
        eventId: 'evt_1001',
        publicCode: 'SES-2026-001001',
        name: 'Sessão Principal - 19 Outubro',
        doorsOpenAt: new Date('2026-10-19T16:30:00-03:00'),
        startAt: new Date('2026-10-19T18:00:00-03:00'),
        endAt: new Date('2026-10-20T04:00:00-03:00'),
        timezone: 'America/Sao_Paulo',
        venueId: 'ven_pedreira',
        status: 'OPEN',
        capacity: 25000,
        reservedCapacity: 500,
        isPrimary: true,
        version: 1,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-09-18T14:20:00Z')
      },
      {
        id: 'ses_1002_1',
        eventId: 'evt_1002',
        publicCode: 'SES-2026-001002',
        name: 'Temporada Estreia - Quinta',
        doorsOpenAt: new Date('2026-10-22T19:00:00-03:00'),
        startAt: new Date('2026-10-22T20:00:00-03:00'),
        endAt: new Date('2026-10-22T22:30:00-03:00'),
        timezone: 'America/Sao_Paulo',
        venueId: 'ven_teatro_positivo',
        status: 'CONFIGURED',
        capacity: 2400,
        reservedCapacity: 50,
        isPrimary: true,
        version: 1,
        createdAt: new Date('2026-02-01T11:00:00Z'),
        updatedAt: new Date('2026-09-18T16:45:00Z')
      },
      {
        id: 'ses_2001_1',
        eventId: 'evt_2001',
        publicCode: 'SES-2026-002001',
        name: 'Noite Única - Show Mundial',
        doorsOpenAt: new Date('2026-11-15T17:00:00-03:00'),
        startAt: new Date('2026-11-15T21:00:00-03:00'),
        endAt: new Date('2026-11-16T00:30:00-03:00'),
        timezone: 'America/Sao_Paulo',
        venueId: 'ven_couto_pereira',
        status: 'OPEN',
        capacity: 45000,
        reservedCapacity: 1000,
        isPrimary: true,
        version: 1,
        createdAt: new Date('2026-03-10T09:30:00Z'),
        updatedAt: new Date('2026-09-19T11:15:00Z')
      }
    );

    // 5.3 Catálogo de Tipos de Ingresso Base (Fase 1.2.5)
    this.ticketTypeRecords.push(
      { id: 'tt_inteira', code: 'INTEIRA', name: 'Inteira', category: 'INTEIRA', defaultDescription: 'Ingresso padrão sem desconto', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_meia', code: 'MEIA', name: 'Meia-Entrada', category: 'MEIA', defaultDescription: 'Benefício da meia-entrada legal (estudantes, idosos, PCD, professores conforme lei)', halfPriceLawCompliance: true, requiresDocument: true, documentType: 'STUDENT_OR_OFFICIAL_ID', requiresCode: false, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_social', code: 'SOCIAL', name: 'Ingresso Social / Solidário', category: 'SOCIAL', defaultDescription: 'Ingresso com desconto mediante doação de 1kg de alimento na portaria', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: true, benefitDescription: '1kg de alimento não perecível entregue na entrada', isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_vip', code: 'VIP', name: 'VIP / Área Exclusiva', category: 'VIP', defaultDescription: 'Acesso diferenciado a áreas VIPs, open bar ou áreas de visibilidade privilegiada', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_promocional', code: 'PROMOTIONAL', name: 'Promocional / Cupom', category: 'PROMOTIONAL', defaultDescription: 'Acesso liberado mediante código de cupom ou promoção específica', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: true, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_cortesia', code: 'CORTESIA', name: 'Cortesia / Patrocinador', category: 'CORTESIA', defaultDescription: 'Ingresso gratuito reservado para staff, imprensa e patrocinadores', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() },
      { id: 'tt_combo', code: 'COMBO', name: 'Passaporte Multi-Sessão / Combo', category: 'COMBO', defaultDescription: 'Ingresso válido para mais de uma sessão ou múltiplos dias', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, isSystem: true, active: true, createdAt: new Date() }
    );

    // 5.4 Setores Operacionais do Evento evt_1001 (Festival Curitiba 2026)
    this.eventSectionRecords.push(
      { id: 'esec_1001_pista', eventId: 'evt_1001', venueSectionId: 'vsec_pista', name: 'Pista Geral', capacity: 15000, technicalReservation: 300, enabled: true, createdAt: new Date() },
      { id: 'esec_1001_premium', eventId: 'evt_1001', venueSectionId: 'vsec_pista_premium', name: 'Pista Premium VIP', capacity: 7000, technicalReservation: 150, enabled: true, createdAt: new Date() },
      { id: 'esec_1001_camarote', eventId: 'evt_1001', venueSectionId: 'vsec_camarote', name: 'Camarote Open Bar', capacity: 3000, technicalReservation: 50, enabled: true, createdAt: new Date() }
    );

    // 5.5 Setores da Sessão Principal ses_1001_1
    this.sessionSectionRecords.push(
      { id: 'ssec_1001_1_pista', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_pista', enabled: true, capacity: 15000, reservedCapacity: 300, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ssec_1001_1_premium', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_premium', enabled: true, capacity: 7000, reservedCapacity: 150, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ssec_1001_1_camarote', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_camarote', enabled: true, capacity: 3000, reservedCapacity: 50, createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.6 Tipos de Ingresso Configurados para evt_1001
    this.eventTicketTypeRecords.push(
      { id: 'ett_1001_inteira', eventId: 'evt_1001', ticketTypeId: 'tt_inteira', name: 'Inteira', code: 'INTEIRA', category: 'INTEIRA', description: 'Ingresso padrão sem desconto', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, active: true, sortOrder: 1, minPerOrder: 1, maxPerOrder: 6, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ett_1001_meia', eventId: 'evt_1001', ticketTypeId: 'tt_meia', name: 'Meia-Entrada', code: 'MEIA', category: 'MEIA', description: 'Benefício da meia-entrada legal', halfPriceLawCompliance: true, requiresDocument: true, documentType: 'STUDENT_OR_OFFICIAL_ID', requiresCode: false, requiresBenefit: false, active: true, sortOrder: 2, minPerOrder: 1, maxPerOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ett_1001_social', eventId: 'evt_1001', ticketTypeId: 'tt_social', name: 'Ingresso Social', code: 'SOCIAL', category: 'SOCIAL', description: 'Desconto com doação de 1kg de alimento', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: true, benefitDescription: '1kg de alimento não perecível entregue na portaria', active: true, sortOrder: 3, minPerOrder: 1, maxPerOrder: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ett_1001_vip', eventId: 'evt_1001', ticketTypeId: 'tt_vip', name: 'VIP Lounge Experience', code: 'VIP_EXP', category: 'VIP', description: 'Acesso VIP completo', halfPriceLawCompliance: false, requiresDocument: false, requiresCode: false, requiresBenefit: false, active: true, sortOrder: 4, minPerOrder: 1, maxPerOrder: 4, createdAt: new Date(), updatedAt: new Date() }
    );

    // Vínculos Setor-Ingresso
    this.eventTicketTypeSectionRecords.push(
      { id: 'etts_1', eventTicketTypeId: 'ett_1001_inteira', eventSectionId: 'esec_1001_pista' },
      { id: 'etts_2', eventTicketTypeId: 'ett_1001_meia', eventSectionId: 'esec_1001_pista' },
      { id: 'etts_3', eventTicketTypeId: 'ett_1001_social', eventSectionId: 'esec_1001_pista' },
      { id: 'etts_4', eventTicketTypeId: 'ett_1001_inteira', eventSectionId: 'esec_1001_premium' },
      { id: 'etts_5', eventTicketTypeId: 'ett_1001_meia', eventSectionId: 'esec_1001_premium' },
      { id: 'etts_6', eventTicketTypeId: 'ett_1001_vip', eventSectionId: 'esec_1001_camarote' }
    );

    // 5.7 Pools de Inventário Vendável (Fase 1.2.5)
    this.inventoryPoolRecords.push(
      { id: 'pool_pista', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_pista', capacity: 15000, reserved: 300, blocked: 200, held: 50, sold: 4200, version: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pool_premium', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_premium', capacity: 7000, reserved: 150, blocked: 100, held: 20, sold: 1800, version: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pool_camarote', sessionId: 'ses_1001_1', eventSectionId: 'esec_1001_camarote', capacity: 3000, reserved: 50, blocked: 50, held: 10, sold: 850, version: 1, createdAt: new Date(), updatedAt: new Date() }
    );

    // Alocações / Cotas
    this.inventoryAllocationRecords.push(
      { id: 'ia_1', inventoryPoolId: 'pool_pista', eventTicketTypeId: 'ett_1001_meia', allocationType: 'PERCENTAGE', allocationValue: 40, allocatedQuantity: 6000, soldQuantity: 1800, heldQuantity: 20, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ia_2', inventoryPoolId: 'pool_pista', eventTicketTypeId: 'ett_1001_social', allocationType: 'FIXED', allocationValue: 2000, allocatedQuantity: 2000, soldQuantity: 800, heldQuantity: 10, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ia_3', inventoryPoolId: 'pool_pista', eventTicketTypeId: 'ett_1001_inteira', allocationType: 'UNLIMITED', allocationValue: 0, allocatedQuantity: 15000, soldQuantity: 1600, heldQuantity: 20, createdAt: new Date(), updatedAt: new Date() }
    );

    // Bloqueios de Inventário
    this.inventoryBlockRecords.push(
      { id: 'ib_1', inventoryPoolId: 'pool_pista', reason: 'SECURITY_BUFFER', quantity: 200, notes: 'Reserva operacional de corredor de emergência exigida pelos Bombeiros', active: true, createdByUserId: 'usr_admin', createdAt: new Date(), updatedAt: new Date() },
      { id: 'ib_2', inventoryPoolId: 'pool_premium', reason: 'TECHNICAL_HOLD', quantity: 100, notes: 'Área técnica da torre de som frontal (House Mix)', active: true, createdByUserId: 'usr_admin', createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.8 Lotes Comerciais (Fase 1.2.6)
    this.ticketBatchRecords.push(
      { id: 'batch_1', eventId: 'evt_1001', name: 'Lote 1 — Promocional', code: 'LOTE_1', phase: 1, status: 'SOLD_OUT', activationType: 'MANUAL', totalQuantityLimit: 2000, soldCount: 2000, heldCount: 0, version: 1, createdAt: new Date('2026-02-01T10:00:00Z'), updatedAt: new Date() },
      { id: 'batch_2', eventId: 'evt_1001', name: 'Lote 2 — Oficial', code: 'LOTE_2', phase: 2, status: 'ACTIVE', activationType: 'PREVIOUS_BATCH_SOLD_OUT', previousBatchId: 'batch_1', totalQuantityLimit: 6000, soldCount: 4850, heldCount: 80, version: 1, createdAt: new Date('2026-02-15T10:00:00Z'), updatedAt: new Date() },
      { id: 'batch_3', eventId: 'evt_1001', name: 'Lote 3 — Final', code: 'LOTE_3', phase: 3, status: 'SCHEDULED', activationType: 'PREVIOUS_BATCH_SOLD_OUT', previousBatchId: 'batch_2', totalQuantityLimit: 8000, soldCount: 0, heldCount: 0, version: 1, createdAt: new Date('2026-03-01T10:00:00Z'), updatedAt: new Date() }
    );

    // 5.9 Configurações de Preços e Taxas (Fase 1.2.6)
    this.priceConfigurationRecords.push(
      { id: 'pc_1', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_pista', eventTicketTypeId: 'ett_1001_inteira', basePriceInCents: 18000, salePriceInCents: 18000, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pc_2', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_pista', eventTicketTypeId: 'ett_1001_meia', basePriceInCents: 9000, salePriceInCents: 9000, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pc_3', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_pista', eventTicketTypeId: 'ett_1001_social', basePriceInCents: 11000, salePriceInCents: 11000, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pc_4', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_premium', eventTicketTypeId: 'ett_1001_inteira', basePriceInCents: 34000, salePriceInCents: 34000, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pc_5', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_premium', eventTicketTypeId: 'ett_1001_meia', basePriceInCents: 17000, salePriceInCents: 17000, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'pc_6', ticketBatchId: 'batch_2', eventSectionId: 'esec_1001_camarote', eventTicketTypeId: 'ett_1001_vip', basePriceInCents: 55000, salePriceInCents: 55000, active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    // Taxa de conveniência padrão 10% paga pelo comprador
    ['pc_1', 'pc_2', 'pc_3', 'pc_4', 'pc_5', 'pc_6'].forEach((pcId, idx) => {
      this.feeComponentRecords.push({
        id: `fee_${idx + 1}`,
        priceConfigurationId: pcId,
        name: 'Taxa de Conveniência (10%)',
        type: 'PERCENTAGE',
        value: 10,
        payer: 'BUYER',
        taxDeductible: false,
        createdAt: new Date()
      });
    });

    // 5.10 Regras de Venda (Fase 1.2.6)
    this.salesRuleRecords.push(
      { id: 'sr_1', eventId: 'evt_1001', type: 'MAX_PER_ORDER', scope: 'EVENT', name: 'Limite Máximo por Pedido', description: 'Máximo de 6 ingressos por transação', ruleConfig: JSON.stringify({ maxPerOrder: 6 }), active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sr_2', eventId: 'evt_1001', type: 'MAX_PER_CUSTOMER', scope: 'EVENT', name: 'Limite por CPF', description: 'Máximo de 4 ingressos por comprador (CPF)', ruleConfig: JSON.stringify({ maxPerCustomer: 4 }), active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sr_3', eventId: 'evt_1001', type: 'HALF_PRICE_LIMIT', scope: 'EVENT', name: 'Cota de Meia-Entrada 40%', description: 'Conformidade com a Lei Federal nº 12.933/2013', ruleConfig: JSON.stringify({ maxPercentage: 40 }), active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.11 Canais de Venda (Fase 1.2.7)
    this.salesChannelRecords.push(
      { id: 'sc_online', code: 'SITE_ONLINE', name: 'Site DiskIngressos', type: 'ONLINE', scope: 'GLOBAL', active: true, configuration: JSON.stringify({ isDefault: true }), createdAt: new Date(), updatedAt: new Date() },
      { id: 'sc_boxoffice', code: 'BILHETERIA', name: 'Bilheteria Presencial', type: 'BOX_OFFICE', scope: 'GLOBAL', active: true, configuration: JSON.stringify({ requiresOperator: true }), createdAt: new Date(), updatedAt: new Date() },
      { id: 'sc_pos', code: 'PDV_OFICIAL', name: 'PDV Curitiba (Shoppings)', type: 'POS', scope: 'GLOBAL', active: true, configuration: JSON.stringify({}), createdAt: new Date(), updatedAt: new Date() },
      { id: 'sc_internal', code: 'VENDA_INTERNA', name: 'Venda Interna / SAC', type: 'INTERNAL', scope: 'GLOBAL', active: true, configuration: JSON.stringify({ requiresAuditReason: true }), createdAt: new Date(), updatedAt: new Date() },
      { id: 'sc_partner', code: 'PARCEIROS', name: 'Rede de Parceiros', type: 'PARTNER', scope: 'GLOBAL', active: false, configuration: JSON.stringify({}), createdAt: new Date(), updatedAt: new Date() },
      { id: 'sc_affiliate', code: 'AFILIADOS', name: 'Programa de Afiliados', type: 'AFFILIATE', scope: 'GLOBAL', active: false, configuration: JSON.stringify({}), createdAt: new Date(), updatedAt: new Date() }
    );

    this.eventSalesChannelRecords.push(
      { id: 'esc_1', eventId: 'evt_1001', salesChannelId: 'sc_online', enabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'esc_2', eventId: 'evt_1001', salesChannelId: 'sc_boxoffice', enabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'esc_3', eventId: 'evt_1001', salesChannelId: 'sc_pos', enabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'esc_4', eventId: 'evt_1001', salesChannelId: 'sc_internal', enabled: true, createdAt: new Date(), updatedAt: new Date() }
    );

    this.channelAllocationRecords.push(
      { id: 'ca_1', eventSalesChannelId: 'esc_2', inventoryPoolId: 'pool_pista', quantityLimit: 500, quantityConsumed: 40, createdAt: new Date(), updatedAt: new Date() }
    );

    this.salesPointRecords.push(
      { id: 'sp_1', name: 'Bilheteria Central Arena', type: 'BOX_OFFICE', venueId: 'ven_arena_curitiba', address: 'Rua Engenheiros Rebouças, 123', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sp_2', name: 'Loja DiskIngressos Shopping Mueller', type: 'STORE', address: 'Av. Cândido de Abreu, 127', active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    this.salesTerminalRecords.push(
      { id: 'st_1', salesPointId: 'sp_1', name: 'Caixa 01 - Principal', code: 'CX_01', status: 'ONLINE', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'st_2', salesPointId: 'sp_1', name: 'Caixa 02 - Portão B', code: 'CX_02', status: 'ONLINE', active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    this.salesPartnerRecords.push(
      { id: 'spart_1', name: 'Agência Curitiba Live', document: '12.345.678/0001-90', type: 'AGENCY', status: 'ACTIVE', email: 'contato@curitibalive.com.br', createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.12 Cortesias (Fase 1.2.7)
    this.complimentaryCategoryRecords.push(
      { id: 'cc_1', code: 'ARTISTA', name: 'Convidados do Artista', description: 'Cotas diretas do camarim e banda', active: true, createdAt: new Date() },
      { id: 'cc_2', code: 'PRODUCAO', name: 'Produção e Staff', description: 'Equipe executiva e técnica', active: true, createdAt: new Date() },
      { id: 'cc_3', code: 'PATROCINADOR', name: 'Cotas de Patrocinador', description: 'Contratos corporativos de marca', active: true, createdAt: new Date() },
      { id: 'cc_4', code: 'IMPRENSA', name: 'Imprensa e Mídia', description: 'Jornalistas e fotógrafos credenciados', active: true, createdAt: new Date() },
      { id: 'cc_5', code: 'RELACIONAMENTO', name: 'Relacionamento Comercial', description: 'Parceiros e autoridades convidadas', active: true, createdAt: new Date() }
    );

    this.complimentaryQuotaRecords.push(
      { id: 'cq_1', eventId: 'evt_1001', sectionId: 'esec_1001_pista', quantityLimit: 300, quantityUsed: 120, quantityReserved: 30, createdAt: new Date(), updatedAt: new Date() },
      { id: 'cq_2', eventId: 'evt_1001', sectionId: 'esec_1001_premium', quantityLimit: 200, quantityUsed: 63, quantityReserved: 12, createdAt: new Date(), updatedAt: new Date() }
    );

    this.complimentaryRequestRecords.push(
      {
        id: 'cr_1',
        code: 'SOL-002843',
        eventId: 'evt_1001',
        sessionId: 'ses_1001_principal',
        sectionId: 'esec_1001_premium',
        categoryId: 'cc_1',
        quantity: 20,
        quantityIssued: 0,
        reason: 'Convidados VIP da banda principal',
        requesterId: 'usr_producer_1',
        requesterName: 'Carlos Silva (Produção)',
        status: 'APPROVAL_PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cr_2',
        code: 'SOL-002840',
        eventId: 'evt_1001',
        sessionId: 'ses_1001_principal',
        sectionId: 'esec_1001_pista',
        categoryId: 'cc_4',
        quantity: 15,
        quantityIssued: 15,
        reason: 'Equipe de cobertura Gazeta do Povo e RPC TV',
        requesterId: 'usr_producer_1',
        requesterName: 'Mariana Costa (Imprensa)',
        status: 'ISSUED',
        approvedBy: 'Diretoria DiskIngressos',
        approvedAt: new Date(),
        createdAt: new Date('2026-03-01T14:32:00Z'),
        updatedAt: new Date()
      }
    );

    this.complimentaryGuestRecords.push(
      { id: 'cg_1', requestId: 'cr_1', name: 'Lucas Ferreira', email: 'lucas@artist.com', document: '123.456.789-00', issued: false, createdAt: new Date() },
      { id: 'cg_2', requestId: 'cr_1', name: 'Beatriz Almeida', email: 'beatriz@artist.com', document: '234.567.890-11', issued: false, createdAt: new Date() }
    );

    // 5.13 Equipe do Evento (Fase 1.2.7)
    this.eventTeamRecords.push(
      { id: 'team_prod', eventId: 'evt_1001', name: 'Produção Geral', description: 'Coordenação técnica e operacional de palco', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'team_box', eventId: 'evt_1001', name: 'Bilheteria & Atendimento', description: 'Operação de guichês presenciais e suporte', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'team_cred', eventId: 'evt_1001', name: 'Credenciamento & Convidados', description: 'Entrega de credenciais VIP/Imprensa', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'team_access', eventId: 'evt_1001', name: 'Controle de Acesso & Portões', description: 'Catracas e controle de fluxo', active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    this.eventTeamMemberRecords.push(
      { id: 'tm_1', eventId: 'evt_1001', name: 'Carlos Silva', email: 'carlos.producao@diskingressos.com.br', phone: '(41) 99881-1234', roleName: 'Coordenador Geral de Produção', teamId: 'team_prod', active: true, emergencyContact: '(41) 99999-0001', createdAt: new Date(), updatedAt: new Date() },
      { id: 'tm_2', eventId: 'evt_1001', name: 'Ana Souza', email: 'ana.bilheteria@diskingressos.com.br', phone: '(41) 98772-2345', roleName: 'Supervisora de Bilheteria', teamId: 'team_box', active: true, emergencyContact: '(41) 99999-0002', createdAt: new Date(), updatedAt: new Date() },
      { id: 'tm_3', eventId: 'evt_1001', name: 'Roberto Lima', email: 'roberto.acesso@diskingressos.com.br', phone: '(41) 99663-3456', roleName: 'Coordenador de Acesso', teamId: 'team_access', active: true, emergencyContact: '(41) 99999-0003', createdAt: new Date(), updatedAt: new Date() },
      { id: 'tm_4', eventId: 'evt_1001', name: 'Juliana Mendes', email: 'juliana.cred@diskingressos.com.br', phone: '(41) 99554-4567', roleName: 'Líder de Credenciamento', teamId: 'team_cred', active: true, emergencyContact: '(41) 99999-0004', createdAt: new Date(), updatedAt: new Date() }
    );

    this.eventTeamShiftRecords.push(
      { id: 'shift_1', eventId: 'evt_1001', teamId: 'team_prod', sessionId: 'ses_1001_principal', name: 'Turno 1 — Alinhamento & Passagem de Som', startAt: new Date('2026-10-19T10:00:00Z'), endAt: new Date('2026-10-19T18:00:00Z'), active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'shift_2', eventId: 'evt_1001', teamId: 'team_box', sessionId: 'ses_1001_principal', name: 'Turno 2 — Operação de Bilheteria', startAt: new Date('2026-10-19T14:00:00Z'), endAt: new Date('2026-10-19T22:00:00Z'), active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'shift_3', eventId: 'evt_1001', teamId: 'team_access', sessionId: 'ses_1001_principal', name: 'Turno 3 — Portões & Entrada de Público', startAt: new Date('2026-10-19T16:00:00Z'), endAt: new Date('2026-10-20T01:00:00Z'), active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    this.eventShiftAssignmentRecords.push(
      { id: 'sa_1', shiftId: 'shift_1', memberId: 'tm_1', createdAt: new Date() },
      { id: 'sa_2', shiftId: 'shift_2', memberId: 'tm_2', createdAt: new Date() },
      { id: 'sa_3', shiftId: 'shift_3', memberId: 'tm_3', createdAt: new Date() }
    );

    // Responsabilidades Estruturadas
    this.eventResponsibilityRecords.push(
      { id: 'resp_1', eventId: 'evt_1001', memberId: 'tm_2', responsibilityType: 'BOX_OFFICE_LEAD', title: 'Responsável pela Bilheteria', scope: 'EVENT', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'resp_2', eventId: 'evt_1001', memberId: 'tm_3', responsibilityType: 'ACCESS_COORDINATOR', title: 'Responsável pela Abertura dos Portões', scope: 'EVENT', active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'resp_3', eventId: 'evt_1001', memberId: 'tm_1', responsibilityType: 'PRODUCTION_COORDINATOR', title: 'Responsável Técnico e Produção', scope: 'EVENT', active: true, createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.14 Documentos e Requisitos (Fase 1.2.8)
    this.eventDocumentRequirementRecords.push(
      { id: 'edr_1', eventId: 'evt_1001', categoryCode: 'CONTRATO_LOCAL', categoryName: 'Contrato de Locação da Arena', required: true, blocking: true, status: 'VALID', linkedDocumentName: 'contrato_locacao_arena_disk_2026.pdf', validUntil: new Date('2026-12-31T23:59:59Z'), fileSize: '2.4 MB', createdAt: new Date(), updatedAt: new Date() },
      { id: 'edr_2', eventId: 'evt_1001', categoryCode: 'ALVARA', categoryName: 'Alvará Municipal de Funcionamento', required: true, blocking: true, status: 'EXPIRING', linkedDocumentName: 'alvara_prefeitura_curitiba_v1.pdf', validUntil: new Date('2026-10-05T23:59:59Z'), fileSize: '1.1 MB', notes: 'Alvará provisório vence antes da data final do evento. Requer renovação.', createdAt: new Date(), updatedAt: new Date() },
      { id: 'edr_3', eventId: 'evt_1001', categoryCode: 'BOMBEIROS', categoryName: 'Laudo de Vistoria dos Bombeiros (AVCB)', required: true, blocking: true, status: 'VALID', linkedDocumentName: 'avcb_bombeiros_pr_2026.pdf', validUntil: new Date('2026-11-20T23:59:59Z'), fileSize: '3.8 MB', createdAt: new Date(), updatedAt: new Date() },
      { id: 'edr_4', eventId: 'evt_1001', categoryCode: 'SEGURO', categoryName: 'Apólice de Seguro de Responsabilidade Civil', required: true, blocking: true, status: 'MISSING', notes: 'Apólice obrigatória para eventos acima de 5.000 pessoas.', createdAt: new Date(), updatedAt: new Date() }
    );

    // 5.15 Tarefas e Pendências do Evento (Fase 1.2.8)
    this.eventTaskRecords.push(
      {
        id: 'tsk_1',
        eventId: 'evt_1001',
        title: 'Enviar Apólice de Seguro de Responsabilidade Civil',
        description: 'Bloqueador de publicação: evento acima de 5.000 pessoas necessita de apólice de seguro com cobertura para público.',
        priority: 'HIGH',
        status: 'OPEN',
        assigneeName: 'Carlos Silva',
        assigneeRole: 'Coordenador Geral de Produção',
        dueDate: '2026-09-25T18:00:00Z',
        blockingPublication: true,
        origin: 'DOCUMENT',
        issueCode: 'MISSING_MANDATORY_DOC_SEGURO',
        deduplicationKey: 'evt_1001:doc:SEGURO',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tsk_2',
        eventId: 'evt_1001',
        title: 'Renovar Alvará de Funcionamento com a Prefeitura',
        description: 'O alvará anexado vence em 05/10/2026, antes da data de realização do festival (19/10/2026).',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assigneeName: 'Carlos Silva',
        assigneeRole: 'Coordenador Geral de Produção',
        dueDate: '2026-09-30T18:00:00Z',
        blockingPublication: false,
        origin: 'DOCUMENT',
        issueCode: 'EXPIRING_DOC_ALVARA',
        deduplicationKey: 'evt_1001:doc:ALVARA',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );
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

    // 8. Base de Pedidos Comerciais (Fases 1.1.5.6, 1.3.1 & 1.3.2)
    this.orders.push(
      {
        id: 'ord-984521',
        publicCode: 'PED-2026-984521',
        orderNumber: 'PED-984521',
        orderNumberNormalized: '984521',
        producerId: 'prd_100',
        eventId: 'evt_1001',
        eventName: 'Festival de Inverno Curitiba 2026',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 1,
        totalTicketsCount: 2,
        subtotalAmount: 600.00,
        discountAmount: 0.00,
        feeAmount: 42.00,
        totalAmount: 642.00,
        currency: 'BRL',
        status: 'CONFIRMED',
        salesChannelId: 'sc_online',
        salesChannelName: 'Site Oficial Disk Ingressos',
        version: 1,
        confirmedAt: new Date('2026-09-18T14:32:00Z'),
        createdAt: new Date('2026-09-18T14:30:00Z'),
        updatedAt: new Date('2026-09-18T14:32:00Z')
      },
      {
        id: 'ord-952114',
        publicCode: 'PED-2026-952114',
        orderNumber: 'PED-952114',
        orderNumberNormalized: '952114',
        producerId: 'prd_200',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 2,
        totalTicketsCount: 4,
        subtotalAmount: 1040.00,
        discountAmount: 0.00,
        feeAmount: 80.00,
        totalAmount: 1120.00,
        currency: 'BRL',
        status: 'CONFIRMED',
        salesChannelId: 'sc_online',
        salesChannelName: 'Site Oficial Disk Ingressos',
        version: 1,
        confirmedAt: new Date('2026-07-12T10:15:00Z'),
        createdAt: new Date('2026-07-12T10:10:00Z'),
        updatedAt: new Date('2026-07-12T10:15:00Z')
      },
      {
        id: 'ord-921885',
        publicCode: 'PED-2026-921885',
        orderNumber: 'PED-921885',
        orderNumberNormalized: '921885',
        producerId: 'prd_100',
        eventId: 'evt_1002',
        eventName: 'Teatro Musical Broadway Curitiba',
        customerId: 'cust-maria',
        customerName: 'Maria Oliveira',
        customerCpf: '123.456.789-00',
        itemsCount: 1,
        totalTicketsCount: 1,
        subtotalAmount: 250.00,
        discountAmount: 0.00,
        feeAmount: 30.00,
        totalAmount: 280.00,
        currency: 'BRL',
        status: 'CANCELLED',
        salesChannelId: 'sc_boxoffice',
        salesChannelName: 'Bilheteria Teatro Positivo',
        version: 2,
        cancelledAt: new Date('2026-05-20T16:00:00Z'),
        createdAt: new Date('2026-05-20T15:45:00Z'),
        updatedAt: new Date('2026-05-20T16:00:00Z')
      },
      {
        id: 'ord-rodrigo',
        publicCode: 'PED-2026-098422',
        orderNumber: 'DK-98422',
        orderNumberNormalized: '98422',
        producerId: 'prd_200',
        eventId: 'evt_2001',
        eventName: 'Coldplay Experience World Tour',
        customerId: 'cust-2',
        customerName: 'Rodrigo Silveira Ramos',
        customerCpf: '812.304.779-88',
        itemsCount: 1,
        totalTicketsCount: 1,
        subtotalAmount: 420.00,
        discountAmount: 0.00,
        feeAmount: 42.00,
        totalAmount: 462.00,
        currency: 'BRL',
        status: 'CONFIRMED',
        salesChannelId: 'sc_online',
        salesChannelName: 'Site Oficial Disk Ingressos',
        version: 1,
        confirmedAt: new Date('2026-09-18T15:10:40Z'),
        createdAt: new Date('2026-09-18T15:05:00Z'),
        updatedAt: new Date('2026-09-18T15:10:40Z')
      },
      {
        id: 'ord-pending-101',
        publicCode: 'PED-2026-101901',
        orderNumber: 'PED-101901',
        orderNumberNormalized: '101901',
        producerId: 'prd_100',
        eventId: 'evt_1001',
        eventName: 'Festival de Inverno Curitiba 2026',
        customerId: 'cust-carlos',
        customerName: 'Carlos Eduardo Nogueira',
        customerCpf: '334.556.778-90',
        itemsCount: 1,
        totalTicketsCount: 2,
        subtotalAmount: 360.00,
        discountAmount: 0.00,
        feeAmount: 36.00,
        totalAmount: 396.00,
        currency: 'BRL',
        status: 'PENDING',
        salesChannelId: 'sc_online',
        salesChannelName: 'Site Oficial Disk Ingressos',
        version: 1,
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        updatedAt: new Date(Date.now() - 25 * 60 * 1000)
      }
    );

    // 8.1 Itens de Pedidos Comerciais (Imutabilidade de Preços)
    this.orderItems.push(
      {
        id: 'oit-984521-1',
        orderId: 'ord-984521',
        eventId: 'evt_1001',
        sessionId: 'ses_1001_principal',
        sessionName: 'Sessão Principal — Abertura',
        eventSectionId: 'esec_1001_pista',
        sectionName: 'Pista Geral',
        eventTicketTypeId: 'ett_1001_inteira',
        ticketTypeName: 'Inteira',
        ticketBatchId: 'batch_1',
        batchName: 'Lote 1 — Promocional',
        quantity: 2,
        unitBaseAmount: 300.00,
        unitDiscountAmount: 0.00,
        unitFeeAmount: 21.00,
        unitFinalAmount: 321.00,
        subtotalAmount: 600.00,
        discountAmount: 0.00,
        feeAmount: 42.00,
        totalAmount: 642.00,
        priceSnapshotId: 'snap_1001_p1',
        createdAt: new Date('2026-09-18T14:30:00Z')
      },
      {
        id: 'oit-952114-1',
        orderId: 'ord-952114',
        eventId: 'evt_2001',
        sessionId: 'ses_2001_principal',
        sessionName: 'Sessão Única',
        eventSectionId: 'esec_2001_pista',
        sectionName: 'Pista Comum',
        eventTicketTypeId: 'ett_2001_inteira',
        ticketTypeName: 'Inteira',
        ticketBatchId: 'batch_coldplay_1',
        batchName: 'Lote Geral',
        quantity: 4,
        unitBaseAmount: 260.00,
        unitDiscountAmount: 0.00,
        unitFeeAmount: 20.00,
        unitFinalAmount: 280.00,
        subtotalAmount: 1040.00,
        discountAmount: 0.00,
        feeAmount: 80.00,
        totalAmount: 1120.00,
        priceSnapshotId: 'snap_2001_p1',
        createdAt: new Date('2026-07-12T10:10:00Z')
      },
      {
        id: 'oit-rodrigo-1',
        orderId: 'ord-rodrigo',
        eventId: 'evt_2001',
        sessionId: 'ses_2001_principal',
        sessionName: 'Sessão Única',
        eventSectionId: 'esec_2001_premium',
        sectionName: 'Pista Premium VIP',
        eventTicketTypeId: 'ett_2001_premium',
        ticketTypeName: 'Premium VIP',
        ticketBatchId: 'batch_coldplay_2',
        batchName: 'Lote 2',
        quantity: 1,
        unitBaseAmount: 420.00,
        unitDiscountAmount: 0.00,
        unitFeeAmount: 42.00,
        unitFinalAmount: 462.00,
        subtotalAmount: 420.00,
        discountAmount: 0.00,
        feeAmount: 42.00,
        totalAmount: 462.00,
        priceSnapshotId: 'snap_2001_p2',
        createdAt: new Date('2026-09-18T15:05:00Z')
      },
      {
        id: 'oit-pending-1',
        orderId: 'ord-pending-101',
        eventId: 'evt_1001',
        sessionId: 'ses_1001_principal',
        sessionName: 'Sessão Principal — Abertura',
        eventSectionId: 'esec_1001_pista',
        sectionName: 'Pista Geral',
        eventTicketTypeId: 'ett_1001_social',
        ticketTypeName: 'Ingresso Social',
        ticketBatchId: 'batch_2',
        batchName: 'Lote 2 — Oficial',
        quantity: 2,
        unitBaseAmount: 180.00,
        unitDiscountAmount: 0.00,
        unitFeeAmount: 18.00,
        unitFinalAmount: 198.00,
        subtotalAmount: 360.00,
        discountAmount: 0.00,
        feeAmount: 36.00,
        totalAmount: 396.00,
        priceSnapshotId: 'snap_1001_p2',
        createdAt: new Date(Date.now() - 25 * 60 * 1000)
      }
    );

    // 8.2 Snapshots do Comprador (LGPD)
    this.orderBuyerSnapshots.push(
      {
        id: 'obs-984521',
        orderId: 'ord-984521',
        customerId: 'cust-maria',
        name: 'Maria Oliveira',
        document: '123.456.789-00',
        documentMasked: '***.456.789-**',
        email: 'maria.oliveira@email.com',
        emailMasked: 'm***a@email.com',
        phone: '(41) 98877-6655',
        phoneMasked: '(41) *****-6655',
        createdAt: new Date('2026-09-18T14:30:00Z')
      },
      {
        id: 'obs-952114',
        orderId: 'ord-952114',
        customerId: 'cust-maria',
        name: 'Maria Oliveira',
        document: '123.456.789-00',
        documentMasked: '***.456.789-**',
        email: 'maria.oliveira@email.com',
        emailMasked: 'm***a@email.com',
        phone: '(41) 98877-6655',
        phoneMasked: '(41) *****-6655',
        createdAt: new Date('2026-07-12T10:10:00Z')
      },
      {
        id: 'obs-rodrigo',
        orderId: 'ord-rodrigo',
        customerId: 'cust-2',
        name: 'Rodrigo Silveira Ramos',
        document: '812.304.779-88',
        documentMasked: '***.304.779-**',
        email: 'rodrigo.silveira@email.com',
        emailMasked: 'r***a@email.com',
        phone: '(41) 99123-4567',
        phoneMasked: '(41) *****-4567',
        createdAt: new Date('2026-09-18T15:05:00Z')
      },
      {
        id: 'obs-pending-1',
        orderId: 'ord-pending-101',
        customerId: 'cust-carlos',
        name: 'Carlos Eduardo Nogueira',
        document: '334.556.778-90',
        documentMasked: '***.556.778-**',
        email: 'carlos.nogueira@email.com',
        emailMasked: 'c***a@email.com',
        phone: '(41) 99888-7711',
        phoneMasked: '(41) *****-7711',
        createdAt: new Date(Date.now() - 25 * 60 * 1000)
      }
    );

    // 8.3 Linha do Tempo dos Pedidos
    this.orderTimelineEvents.push(
      {
        id: 'ote-984521-1',
        orderId: 'ord-984521',
        eventType: 'ORDER_CREATED',
        description: 'Pedido gerado através do checkout web.',
        actorName: 'Checkout Web',
        actorType: 'SYSTEM',
        createdAt: new Date('2026-09-18T14:30:00Z')
      },
      {
        id: 'ote-984521-2',
        orderId: 'ord-984521',
        eventType: 'ORDER_CONFIRMED',
        description: 'Pagamento PIX confirmado instantaneamente.',
        actorName: 'Gateway Pagamentos',
        actorType: 'GATEWAY',
        createdAt: new Date('2026-09-18T14:32:00Z')
      },
      {
        id: 'ote-rodrigo-1',
        orderId: 'ord-rodrigo',
        eventType: 'ORDER_CREATED',
        description: 'Pedido gerado pelo aplicativo móvel.',
        actorName: 'App Disk',
        actorType: 'SYSTEM',
        createdAt: new Date('2026-09-18T15:05:00Z')
      },
      {
        id: 'ote-rodrigo-2',
        orderId: 'ord-rodrigo',
        eventType: 'ORDER_CONFIRMED',
        description: 'Pagamento aprovado.',
        actorName: 'Gateway Pagamentos',
        actorType: 'GATEWAY',
        createdAt: new Date('2026-09-18T15:10:40Z')
      },
      {
        id: 'ote-pending-1',
        orderId: 'ord-pending-101',
        eventType: 'ORDER_CREATED',
        description: 'Aguardando pagamento via PIX.',
        actorName: 'Checkout Web',
        actorType: 'SYSTEM',
        createdAt: new Date(Date.now() - 25 * 60 * 1000)
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

    // =========================================================================
    // Fases 1.3.3 & 1.3.4 — Central de Produtores, Carteira, CRM B2B & Pipeline
    // =========================================================================

    // 1. Pipeline Comercial Padrão
    this.commercialPipelines.push({
      id: 'pip_main',
      name: 'Pipeline Comercial Principal',
      active: true,
      isDefault: true,
      version: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z')
    });

    // 2. Estágios do Pipeline
    this.commercialPipelineStages.push(
      {
        id: 'stage_id',
        pipelineId: 'pip_main',
        name: 'Identificação',
        code: 'IDENTIFIED',
        position: 1,
        stageType: 'OPEN',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_qual',
        pipelineId: 'pip_main',
        name: 'Qualificação',
        code: 'QUALIFYING',
        position: 2,
        stageType: 'OPEN',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_neg',
        pipelineId: 'pip_main',
        name: 'Negociação',
        code: 'NEGOTIATING',
        position: 3,
        stageType: 'OPEN',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_prop',
        pipelineId: 'pip_main',
        name: 'Proposta Comercial',
        code: 'PROPOSAL',
        position: 4,
        stageType: 'OPEN',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_dec',
        pipelineId: 'pip_main',
        name: 'Decisão / Fechamento',
        code: 'DECISION',
        position: 5,
        stageType: 'OPEN',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_won',
        pipelineId: 'pip_main',
        name: 'Ganho',
        code: 'WON',
        position: 6,
        stageType: 'WON',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      },
      {
        id: 'stage_lost',
        pipelineId: 'pip_main',
        name: 'Perdido / Encerrado',
        code: 'CLOSED',
        position: 7,
        stageType: 'CLOSED',
        active: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      }
    );

    // 3. Motivos de Encerramento (Catálogo Objetivo)
    this.opportunityCloseReasons.push(
      { id: 'clr_1', code: 'DESISTENCIA', name: 'Produtor desistiu do projeto/evento', active: true, sortOrder: 1 },
      { id: 'clr_2', code: 'CONCORRENTE', name: 'Optou por outra tiqueteira / concorrente', active: true, sortOrder: 2 },
      { id: 'clr_3', code: 'COMERCIAL', name: 'Sem acordo comercial de taxa ou comissão', active: true, sortOrder: 3 },
      { id: 'clr_4', code: 'ADIADO', name: 'Evento adiado indefinidamente', active: true, sortOrder: 4 },
      { id: 'clr_5', code: 'SEM_RETORNO', name: 'Sem retorno nas tentativas de contato', active: true, sortOrder: 5 },
      { id: 'clr_6', code: 'TECNICO', name: 'Incompatibilidade técnica ou estrutural', active: true, sortOrder: 6 },
      { id: 'clr_7', code: 'OUTRO', name: 'Outro motivo (especificado em notas)', active: true, sortOrder: 7 }
    );

    // 4. Contas Comerciais dos Produtores (Extensão B2B sobre a entidade Producer)
    this.commercialAccounts.push(
      {
        id: 'cacc_100',
        producerId: 'prd_100',
        commercialStatus: 'ACTIVE',
        commercialOwnerId: 'usr_comercial_1',
        commercialOwnerName: 'Mariana Souza',
        segmentId: 'FESTIVAIS_SHOWS',
        commercialClassification: 'KEY_ACCOUNT',
        firstContactAt: new Date('2026-01-10T10:00:00Z'),
        lastContactAt: new Date('2026-09-18T14:00:00Z'),
        nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Alinhamento da grade de atrações para o Verão 2027',
        notesSummary: 'Produtor parceiro estratégico de festivais e grandes turnês em Curitiba.',
        version: 1,
        createdAt: new Date('2026-01-10T10:00:00Z'),
        updatedAt: new Date('2026-09-18T14:00:00Z')
      },
      {
        id: 'cacc_200',
        producerId: 'prd_200',
        commercialStatus: 'ACTIVE',
        commercialOwnerId: 'usr_comercial_1',
        commercialOwnerName: 'Mariana Souza',
        segmentId: 'ARENAS_ESTADIOS',
        commercialClassification: 'STRATEGIC',
        firstContactAt: new Date('2026-02-15T11:30:00Z'),
        lastContactAt: new Date('2026-09-19T10:00:00Z'),
        nextActionAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Follow-up de proposta comercial da turnê 2027',
        notesSummary: 'Conta corporativa internacional de megaespetáculos em estádios.',
        version: 1,
        createdAt: new Date('2026-02-15T11:30:00Z'),
        updatedAt: new Date('2026-09-19T10:00:00Z')
      },
      {
        id: 'cacc_300',
        producerId: 'prd_300',
        commercialStatus: 'PROSPECT',
        commercialOwnerId: 'usr_comercial_2',
        commercialOwnerName: 'Carlos Lima',
        segmentId: 'TEATRO_CULTURA',
        commercialClassification: 'STANDARD',
        firstContactAt: new Date('2026-04-01T09:00:00Z'),
        lastContactAt: new Date('2026-09-10T16:00:00Z'),
        nextActionAt: null,
        nextActionDescription: null,
        notesSummary: 'Produtora cultural local com foco em teatro e musicais.',
        version: 1,
        createdAt: new Date('2026-04-01T09:00:00Z'),
        updatedAt: new Date('2026-09-10T16:00:00Z')
      }
    );

    // 5. Atribuições de Carteira Comercial
    this.commercialPortfolioAssignments.push(
      {
        id: 'cpa_100_1',
        producerId: 'prd_100',
        userId: 'usr_comercial_1',
        userName: 'Mariana Souza',
        userEmail: 'mariana.souza@diskingressos.com.br',
        role: 'PRIMARY',
        assignedAt: new Date('2026-01-10T10:00:00Z'),
        assignedBy: 'usr_admin',
        active: true
      },
      {
        id: 'cpa_200_1',
        producerId: 'prd_200',
        userId: 'usr_comercial_1',
        userName: 'Mariana Souza',
        userEmail: 'mariana.souza@diskingressos.com.br',
        role: 'PRIMARY',
        assignedAt: new Date('2026-02-15T11:30:00Z'),
        assignedBy: 'usr_admin',
        active: true
      },
      {
        id: 'cpa_300_1',
        producerId: 'prd_300',
        userId: 'usr_comercial_2',
        userName: 'Carlos Lima',
        userEmail: 'carlos.lima@diskingressos.com.br',
        role: 'PRIMARY',
        assignedAt: new Date('2026-04-01T09:00:00Z'),
        assignedBy: 'usr_admin',
        active: true
      }
    );

    // 6. Contatos Comerciais do Produtor (Interlocutores B2B)
    this.producerContacts.push(
      {
        id: 'pcon_100_1',
        producerId: 'prd_100',
        name: 'Roberto Viana',
        roleTitle: 'Diretor de Produção e Novos Negócios',
        email: 'roberto.viana@opus.com.br',
        phone: '(41) 98877-6655',
        isPrimary: true,
        canNegotiate: true,
        notes: 'Decisor comercial direto para eventos na Região Sul.',
        active: true,
        createdAt: new Date('2026-01-10T10:00:00Z'),
        updatedAt: new Date('2026-01-10T10:00:00Z')
      },
      {
        id: 'pcon_100_2',
        producerId: 'prd_100',
        name: 'Luciana Freitas',
        roleTitle: 'Gerente Financeira de Turnês',
        email: 'luciana.freitas@opus.com.br',
        phone: '(41) 99123-4567',
        isPrimary: false,
        canNegotiate: false,
        notes: 'Contato para alinhamento de taxas e prazos de repasse.',
        active: true,
        createdAt: new Date('2026-01-15T14:00:00Z'),
        updatedAt: new Date('2026-01-15T14:00:00Z')
      },
      {
        id: 'pcon_200_1',
        producerId: 'prd_200',
        name: 'Fernando Guimarães',
        roleTitle: 'Head de Parcerias e Ticketing',
        email: 'fernando.g@livenation.com.br',
        phone: '(11) 97654-3210',
        isPrimary: true,
        canNegotiate: true,
        notes: 'Responsável pela contratação de tiqueteiras nos grandes estádios.',
        active: true,
        createdAt: new Date('2026-02-15T11:30:00Z'),
        updatedAt: new Date('2026-02-15T11:30:00Z')
      }
    );

    // 7. Prospecções Comerciais / Leads B2B
    this.commercialLeads.push(
      {
        id: 'lead_1',
        companyName: 'Mega Entretenimento Brasil Ltda',
        tradeName: 'Mega Entretenimento',
        cnpj: '33.444.555/0001-66',
        city: 'Florianópolis',
        state: 'SC',
        segmentId: 'FESTIVAIS_SHOWS',
        contactName: 'Guilherme Toledo',
        contactEmail: 'guilherme@megaentretenimento.com.br',
        contactPhone: '(48) 99888-7711',
        origin: 'INDIRECTION',
        ownerId: 'usr_comercial_1',
        ownerName: 'Mariana Souza',
        status: 'QUALIFIED',
        convertedProducerId: null,
        convertedAt: null,
        convertedBy: null,
        notes: 'Produtor em prospecção para festival eletrônico de réveillon 2027.',
        createdAt: new Date('2026-08-01T10:00:00Z'),
        updatedAt: new Date('2026-09-15T16:00:00Z')
      }
    );

    // 8. Oportunidades Comerciais (Negociações)
    this.commercialOpportunities.push(
      {
        id: 'opc_101',
        publicCode: 'OPC-2026-000101',
        producerId: 'prd_100',
        leadId: null,
        pipelineId: 'pip_main',
        stageId: 'stage_neg',
        title: 'Festival de Inverno Curitiba 2027 — Renovação Exclusiva',
        description: 'Renovação do contrato de bilheteria oficial para a edição 2027 com exclusividade física e digital.',
        typeId: 'RENEWAL',
        ownerId: 'usr_comercial_1',
        ownerName: 'Mariana Souza',
        estimatedValue: 240000.00,
        expectedDecisionAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        wonAt: null,
        wonBy: null,
        closedAt: null,
        closedBy: null,
        closeReasonId: null,
        closeNotes: null,
        nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Enviar minuta revisada de aditivo contratual',
        version: 1,
        createdAt: new Date('2026-09-01T10:00:00Z'),
        updatedAt: new Date('2026-09-18T14:00:00Z')
      },
      {
        id: 'opc_201',
        publicCode: 'OPC-2026-000201',
        producerId: 'prd_200',
        leadId: null,
        pipelineId: 'pip_main',
        stageId: 'stage_prop',
        title: 'Turnê Internacional Pop 2027 — Couto Pereira',
        description: 'Negociação da operação de bilheteria para 2 apresentações em estádio.',
        typeId: 'NEW_EVENT',
        ownerId: 'usr_comercial_1',
        ownerName: 'Mariana Souza',
        estimatedValue: 500000.00,
        expectedDecisionAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        wonAt: null,
        wonBy: null,
        closedAt: null,
        closedBy: null,
        closeReasonId: null,
        closeNotes: null,
        nextActionAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Apresentar proposta de contingência offline para portarias',
        version: 1,
        createdAt: new Date('2026-09-05T14:30:00Z'),
        updatedAt: new Date('2026-09-19T10:00:00Z')
      }
    );

    // 9. Histórico de Estágios de Oportunidades
    this.opportunityStageHistories.push(
      {
        id: 'osh_101_1',
        opportunityId: 'opc_101',
        fromStageId: 'stage_id',
        toStageId: 'stage_qual',
        changedBy: 'usr_comercial_1',
        changedByName: 'Mariana Souza',
        changedAt: new Date('2026-09-05T10:00:00Z'),
        reason: 'Produtor confirmou intenção de renovação antecipada.',
        durationSeconds: 345600
      },
      {
        id: 'osh_101_2',
        opportunityId: 'opc_101',
        fromStageId: 'stage_qual',
        toStageId: 'stage_neg',
        changedBy: 'usr_comercial_1',
        changedByName: 'Mariana Souza',
        changedAt: new Date('2026-09-12T14:00:00Z'),
        reason: 'Apresentada tabela de taxas diferenciadas para antecipação.',
        durationSeconds: 619200
      }
    );

    // 10. Atividades Comerciais (Histórico Real)
    this.commercialActivities.push(
      {
        id: 'act_101_1',
        producerId: 'prd_100',
        leadId: null,
        opportunityId: 'opc_101',
        type: 'MEETING',
        subject: 'Reunião de Alinhamento 2027 — Opus Entretenimento',
        description: 'Reunião presencial na sede da Opus para revisar o desempenho do festival atual e alinhar termo aditivo.',
        occurredAt: new Date('2026-09-18T14:00:00Z'),
        createdBy: 'usr_comercial_1',
        createdByName: 'Mariana Souza',
        nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Enviar minuta revisada de aditivo contratual',
        taskId: null,
        createdAt: new Date('2026-09-18T15:00:00Z')
      },
      {
        id: 'act_200_1',
        producerId: 'prd_200',
        leadId: null,
        opportunityId: 'opc_201',
        type: 'VIDEO_CALL',
        subject: 'Apresentação Comercial — Turnê Pop 2027',
        description: 'Videoconferência com head de parcerias para demonstração da infraestrutura de controle de acesso da Disk.',
        occurredAt: new Date('2026-09-19T10:00:00Z'),
        createdBy: 'usr_comercial_1',
        createdByName: 'Mariana Souza',
        nextActionAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        nextActionDescription: 'Apresentar proposta de contingência offline para portarias',
        taskId: null,
        createdAt: new Date('2026-09-19T11:00:00Z')
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
        let evt: any = null;
        if (args.where.id) evt = this.events.find(e => e.id === args.where.id && !e.deletedAt) || null;
        if (!evt && args.where.publicCode) evt = this.events.find(e => e.publicCode === args.where.publicCode && !e.deletedAt) || null;
        if (!evt && args.where.slug) evt = this.events.find(e => e.slug === args.where.slug && !e.deletedAt) || null;
        if (evt && args.include) return this.hydrateEvent(evt, args.include);
        return evt ? { ...evt } : null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.event.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.events].filter(e => !e.deletedAt);

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
            if (where.id?.not && item.id === where.id.not) return false;
          }

          if (where.publicCode) {
            if (typeof where.publicCode === 'string' && item.publicCode !== where.publicCode) return false;
            if (where.publicCode?.in && Array.isArray(where.publicCode.in) && !where.publicCode.in.includes(item.publicCode)) return false;
          }

          if (where.slug) {
            if (typeof where.slug === 'string' && item.slug !== where.slug) return false;
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
        const result = list.slice(skip, skip + take);
        if (args?.include) {
          return result.map(e => this.hydrateEvent(e, args.include));
        }
        return result;
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
          version: 1,
          currency: 'BRL',
          locale: 'pt-BR',
          visibility: 'PRIVATE',
          allowSearchIndexing: false,
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

        // Optimistic concurrency control (409 Conflict)
        if (args.where?.version !== undefined && existing.version !== undefined && existing.version !== args.where.version) {
          const conflictError: any = new Error('Este evento foi atualizado por outro usuário. Há uma versão mais recente disponível.');
          conflictError.code = 'P2025_CONFLICT';
          conflictError.status = 409;
          throw conflictError;
        }

        const newVersion = (existing.version || 1) + 1;
        const updated = {
          ...existing,
          ...args.data,
          name: args.data.name !== undefined ? args.data.name : existing.name,
          title: args.data.name !== undefined ? args.data.name : (args.data.title || existing.title),
          version: newVersion,
          updatedAt: new Date()
        };
        this.events[index] = updated;
        return updated;
      },
      delete: async (args: any) => {
        const index = this.events.findIndex(e => e.id === args.where?.id);
        if (index !== -1) {
          return this.events.splice(index, 1)[0];
        }
        return null;
      }
    };
  }

  public get eventCategory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventCategoryRecords];
        if (args?.where?.active !== undefined) {
          list = list.filter(c => c.active === args.where.active);
        }
        if (args?.where?.parentId !== undefined) {
          list = list.filter(c => c.parentId === args.where.parentId);
        }
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        if (args.where.id) return this.eventCategoryRecords.find(c => c.id === args.where.id) || null;
        if (args.where.slug) return this.eventCategoryRecords.find(c => c.slug === args.where.slug) || null;
        return null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.eventCategory.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      }
    };
  }

  public get eventMedia() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventMediaRecords];
        if (args?.where?.eventId) {
          list = list.filter(m => m.eventId === args.where.eventId);
        }
        if (args?.where?.type) {
          list = list.filter(m => m.type === args.where.type);
        }
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          createdAt: new Date()
        };
        this.eventMediaRecords.push(record);
        return record;
      },
      delete: async (args: any) => {
        const idx = this.eventMediaRecords.findIndex(m => m.id === args.where?.id);
        if (idx !== -1) {
          return this.eventMediaRecords.splice(idx, 1)[0];
        }
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.eventMediaRecords.length;
        if (args?.where?.eventId) {
          this.eventMediaRecords = this.eventMediaRecords.filter(m => m.eventId !== args.where.eventId);
        }
        return { count: initial - this.eventMediaRecords.length };
      }
    };
  }

  public get eventWizardState() {
    return {
      findUnique: async (args: any) => {
        if (!args?.where?.eventId) return null;
        return this.eventWizardStateRecords.find(w => w.eventId === args.where.eventId) || null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `wiz_${Date.now()}`,
          ...args.data,
          updatedAt: new Date()
        };
        this.eventWizardStateRecords.push(record);
        return record;
      },
      update: async (args: any) => {
        const idx = this.eventWizardStateRecords.findIndex(w => w.eventId === args.where?.eventId || w.id === args.where?.id);
        if (idx === -1) throw new Error('Estado do wizard não encontrado');
        const updated = {
          ...this.eventWizardStateRecords[idx],
          ...args.data,
          updatedAt: new Date()
        };
        this.eventWizardStateRecords[idx] = updated;
        return updated;
      },
      upsert: async (args: any) => {
        const existing = await this.eventWizardState.findUnique({ where: args.where });
        if (existing) {
          return this.eventWizardState.update({ where: args.where, data: args.update });
        } else {
          return this.eventWizardState.create({ data: { ...args.create, eventId: args.where.eventId } });
        }
      }
    };
  }

  public get venue() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueRecords];
        if (args?.where) {
          const w = args.where;
          if (w.status) list = list.filter(v => v.status === w.status);
          if (w.type) list = list.filter(v => v.type === w.type);
          if (w.scope) list = list.filter(v => v.scope === w.scope);
          if (w.producerId !== undefined) {
            if (w.producerId === null) {
              list = list.filter(v => !v.producerId);
            } else {
              list = list.filter(v => v.producerId === w.producerId || v.scope === 'GLOBAL');
            }
          }
          if (w.city) list = list.filter(v => v.city.toLowerCase() === w.city.toLowerCase());
          if (w.state) list = list.filter(v => v.state.toLowerCase() === w.state.toLowerCase());
          if (w.id && typeof w.id === 'string') list = list.filter(v => v.id === w.id);
          if (w.id && Array.isArray(w.id.in)) list = list.filter(v => w.id.in.includes(v.id));
        }
        if (args?.include) {
          list = list.map(v => this.hydrateVenue(v, args.include));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let v: any = null;
        if (args.where.id) v = this.venueRecords.find(x => x.id === args.where.id) || null;
        if (!v && args.where.publicCode) v = this.venueRecords.find(x => x.publicCode === args.where.publicCode) || null;
        if (v && args.include) return this.hydrateVenue(v, args.include);
        return v ? { ...v } : null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.venue.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const rand = Math.floor(100000 + Math.random() * 900000);
        const year = new Date().getFullYear();
        const record = {
          id: args.data.id || `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          publicCode: args.data.publicCode || `VEN-${year}-${rand}`,
          scope: args.data.scope || 'GLOBAL',
          status: args.data.status || 'ACTIVE',
          version: args.data.version || 1,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.venueRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.venueRecords.findIndex(v => v.id === args.where?.id);
        if (idx === -1) throw new Error('Local não encontrado');
        const updated = {
          ...this.venueRecords[idx],
          ...args.data,
          version: (this.venueRecords[idx].version || 1) + 1,
          updatedAt: new Date()
        };
        this.venueRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueRecords.findIndex(v => v.id === args.where?.id);
        if (idx !== -1) return this.venueRecords.splice(idx, 1)[0];
        return null;
      },
      count: async (args?: any) => {
        const matches = await this.venue.findMany(args);
        return matches.length;
      }
    };
  }

  public get venueSection() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueSectionRecords];
        if (args?.where) {
          const w = args.where;
          if (w.venueId) list = list.filter(s => s.venueId === w.venueId);
          if (w.active !== undefined) list = list.filter(s => s.active === w.active);
          if (w.id && typeof w.id === 'string') list = list.filter(s => s.id === w.id);
          if (w.id && Array.isArray(w.id.in)) list = list.filter(s => w.id.in.includes(s.id));
        }
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const s = this.venueSectionRecords.find(x => x.id === args.where.id);
        return s ? { ...s } : null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.venueSection.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vsec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          sortOrder: 0,
          ...args.data,
          createdAt: new Date()
        };
        this.venueSectionRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        const count = args.data.length;
        for (const item of args.data) {
          await this.venueSection.create({ data: item });
        }
        return { count };
      },
      update: async (args: any) => {
        const idx = this.venueSectionRecords.findIndex(s => s.id === args.where?.id);
        if (idx === -1) throw new Error('Setor físico não encontrado');
        const updated = {
          ...this.venueSectionRecords[idx],
          ...args.data
        };
        this.venueSectionRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueSectionRecords.findIndex(s => s.id === args.where?.id);
        if (idx !== -1) return this.venueSectionRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.venueSectionRecords.length;
        if (args?.where?.venueId) {
          this.venueSectionRecords = this.venueSectionRecords.filter(s => s.venueId !== args.where.venueId);
        }
        return { count: initial - this.venueSectionRecords.length };
      }
    };
  }

  public get venueMap() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueMapRecords];
        if (args?.where?.venueId) list = list.filter(m => m.venueId === args.where.venueId);
        if (args?.where?.status) list = list.filter(m => m.status === args.where.status);
        if (args?.include?.versions) {
          list = list.map(m => ({
            ...m,
            versions: this.venueMapVersionRecords.filter(v => v.mapId === m.id)
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const m = this.venueMapRecords.find(x => x.id === args.where.id);
        if (!m) return null;
        const copy = { ...m };
        if (args?.include?.versions) {
          copy.versions = this.venueMapVersionRecords.filter(v => v.mapId === m.id);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.venueMap.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vmap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'ACTIVE',
          ...args.data,
          createdAt: new Date()
        };
        this.venueMapRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.venueMapRecords.findIndex(m => m.id === args.where?.id);
        if (idx === -1) throw new Error('Mapa não encontrado');
        const updated = { ...this.venueMapRecords[idx], ...args.data };
        this.venueMapRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueMapRecords.findIndex(m => m.id === args.where?.id);
        if (idx !== -1) return this.venueMapRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  public get venueMapVersion() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueMapVersionRecords];
        if (args?.where?.mapId) list = list.filter(v => v.mapId === args.where.mapId);
        if (args?.where?.status) list = list.filter(v => v.status === args.where.status);
        if (args?.include) {
          list = list.map(v => this.hydrateVenueMapVersion(v, args.include));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const v = this.venueMapVersionRecords.find(x => x.id === args.where.id);
        if (!v) return null;
        return args?.include ? this.hydrateVenueMapVersion(v, args.include) : { ...v };
      },
      findFirst: async (args?: any) => {
        const matches = await this.venueMapVersion.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vmapv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          versionNumber: args.data.versionNumber || 1,
          status: 'DRAFT',
          totalCapacity: args.data.totalCapacity || 0,
          version: 1,
          ...args.data,
          createdAt: new Date()
        };
        this.venueMapVersionRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.venueMapVersionRecords.findIndex(v => v.id === args.where?.id);
        if (idx === -1) throw new Error('Versão de mapa não encontrada');
        const updated = {
          ...this.venueMapVersionRecords[idx],
          ...args.data,
          version: (this.venueMapVersionRecords[idx].version || 1) + 1
        };
        this.venueMapVersionRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueMapVersionRecords.findIndex(v => v.id === args.where?.id);
        if (idx !== -1) return this.venueMapVersionRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  public get venueMapElement() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueMapElementRecords];
        if (args?.where?.mapVersionId) list = list.filter(e => e.mapVersionId === args.where.mapVersionId);
        if (args?.where?.linkedSectionId) list = list.filter(e => e.linkedSectionId === args.where.linkedSectionId);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const e = this.venueMapElementRecords.find(x => x.id === args.where.id);
        return e ? { ...e } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vme_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sortOrder: 0,
          ...args.data,
          createdAt: new Date()
        };
        this.venueMapElementRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.venueMapElement.create({ data: item });
        }
        return { count: args.data.length };
      },
      update: async (args: any) => {
        const idx = this.venueMapElementRecords.findIndex(e => e.id === args.where?.id);
        if (idx === -1) throw new Error('Elemento não encontrado');
        const updated = { ...this.venueMapElementRecords[idx], ...args.data };
        this.venueMapElementRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueMapElementRecords.findIndex(e => e.id === args.where?.id);
        if (idx !== -1) return this.venueMapElementRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.venueMapElementRecords.length;
        if (args?.where?.mapVersionId) {
          this.venueMapElementRecords = this.venueMapElementRecords.filter(e => e.mapVersionId !== args.where.mapVersionId);
        }
        return { count: initial - this.venueMapElementRecords.length };
      }
    };
  }

  public get venueRow() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueRowRecords];
        if (args?.where?.mapVersionId) list = list.filter(r => r.mapVersionId === args.where.mapVersionId);
        if (args?.where?.sectionId) list = list.filter(r => r.sectionId === args.where.sectionId);
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        if (args?.include?.seats) {
          list = list.map(r => ({
            ...r,
            seats: this.venueSeatRecords.filter(s => s.rowId === r.id)
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const r = this.venueRowRecords.find(x => x.id === args.where.id);
        if (!r) return null;
        const copy = { ...r };
        if (args?.include?.seats) {
          copy.seats = this.venueSeatRecords.filter(s => s.rowId === r.id);
        }
        return copy;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vrow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sortOrder: 0,
          ...args.data,
          createdAt: new Date()
        };
        this.venueRowRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.venueRowRecords.findIndex(r => r.id === args.where?.id);
        if (idx === -1) throw new Error('Fileira não encontrada');
        const updated = { ...this.venueRowRecords[idx], ...args.data };
        this.venueRowRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueRowRecords.findIndex(r => r.id === args.where?.id);
        if (idx !== -1) return this.venueRowRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.venueRowRecords.length;
        if (args?.where?.mapVersionId) {
          this.venueRowRecords = this.venueRowRecords.filter(r => r.mapVersionId !== args.where.mapVersionId);
        }
        return { count: initial - this.venueRowRecords.length };
      }
    };
  }

  public get venueSeat() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueSeatRecords];
        if (args?.where?.mapVersionId) list = list.filter(s => s.mapVersionId === args.where.mapVersionId);
        if (args?.where?.sectionId) list = list.filter(s => s.sectionId === args.where.sectionId);
        if (args?.where?.rowId) list = list.filter(s => s.rowId === args.where.rowId);
        if (args?.where?.active !== undefined) list = list.filter(s => s.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const s = this.venueSeatRecords.find(x => x.id === args.where.id);
        return s ? { ...s } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          accessible: false,
          companionSeat: false,
          restrictedView: false,
          seatType: 'STANDARD',
          ...args.data,
          createdAt: new Date()
        };
        this.venueSeatRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.venueSeat.create({ data: item });
        }
        return { count: args.data.length };
      },
      update: async (args: any) => {
        const idx = this.venueSeatRecords.findIndex(s => s.id === args.where?.id);
        if (idx === -1) throw new Error('Assento não encontrado');
        const updated = { ...this.venueSeatRecords[idx], ...args.data };
        this.venueSeatRecords[idx] = updated;
        return { ...updated };
      },
      updateMany: async (args: any) => {
        let count = 0;
        for (let i = 0; i < this.venueSeatRecords.length; i++) {
          const s = this.venueSeatRecords[i];
          let matches = true;
          if (args?.where?.mapVersionId && s.mapVersionId !== args.where.mapVersionId) matches = false;
          if (args?.where?.sectionId && s.sectionId !== args.where.sectionId) matches = false;
          if (args?.where?.rowId && s.rowId !== args.where.rowId) matches = false;
          if (args?.where?.id && Array.isArray(args.where.id.in) && !args.where.id.in.includes(s.id)) matches = false;
          if (matches) {
            this.venueSeatRecords[i] = { ...s, ...args.data };
            count++;
          }
        }
        return { count };
      },
      delete: async (args: any) => {
        const idx = this.venueSeatRecords.findIndex(s => s.id === args.where?.id);
        if (idx !== -1) return this.venueSeatRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.venueSeatRecords.length;
        if (args?.where?.mapVersionId) {
          this.venueSeatRecords = this.venueSeatRecords.filter(s => s.mapVersionId !== args.where.mapVersionId);
        }
        return { count: initial - this.venueSeatRecords.length };
      },
      count: async (args?: any) => {
        const list = await this.venueSeat.findMany(args);
        return list.length;
      }
    };
  }

  public get venueAccessPoint() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.venueAccessPointRecords];
        if (args?.where?.venueId) list = list.filter(p => p.venueId === args.where.venueId);
        if (args?.where?.active !== undefined) list = list.filter(p => p.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const p = this.venueAccessPointRecords.find(x => x.id === args.where.id);
        return p ? { ...p } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `vpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date()
        };
        this.venueAccessPointRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.venueAccessPointRecords.findIndex(p => p.id === args.where?.id);
        if (idx === -1) throw new Error('Ponto de acesso não encontrado');
        const updated = { ...this.venueAccessPointRecords[idx], ...args.data };
        this.venueAccessPointRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.venueAccessPointRecords.findIndex(p => p.id === args.where?.id);
        if (idx !== -1) return this.venueAccessPointRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.venueAccessPointRecords.length;
        if (args?.where?.venueId) {
          this.venueAccessPointRecords = this.venueAccessPointRecords.filter(p => p.venueId !== args.where.venueId);
        }
        return { count: initial - this.venueAccessPointRecords.length };
      }
    };
  }

  public get eventVenue() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventVenueRecords];
        if (args?.where?.eventId) list = list.filter(ev => ev.eventId === args.where.eventId);
        if (args?.where?.venueId) list = list.filter(ev => ev.venueId === args.where.venueId);
        if (args?.include) {
          list = list.map(ev => ({
            ...ev,
            venue: args.include.venue ? this.venueRecords.find(v => v.id === ev.venueId) : undefined,
            mapVersion: args.include.mapVersion ? this.venueMapVersionRecords.find(mv => mv.id === ev.venueMapVersionId) : undefined
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        let ev: any = null;
        if (args?.where?.id) ev = this.eventVenueRecords.find(x => x.id === args.where.id);
        if (!ev && args?.where?.eventId_venueId) {
          ev = this.eventVenueRecords.find(x => x.eventId === args.where.eventId_venueId.eventId && x.venueId === args.where.eventId_venueId.venueId);
        }
        if (!ev) return null;
        const copy = { ...ev };
        if (args?.include?.venue) copy.venue = this.venueRecords.find(v => v.id === ev.venueId);
        if (args?.include?.mapVersion) copy.mapVersion = this.venueMapVersionRecords.find(mv => mv.id === ev.venueMapVersionId);
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.eventVenue.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          createdAt: new Date()
        };
        this.eventVenueRecords.push(record);
        return { ...record };
      },
      delete: async (args: any) => {
        const idx = this.eventVenueRecords.findIndex(ev => ev.id === args.where?.id);
        if (idx !== -1) return this.eventVenueRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.eventVenueRecords.length;
        if (args?.where?.eventId) {
          this.eventVenueRecords = this.eventVenueRecords.filter(ev => ev.eventId !== args.where.eventId);
        }
        return { count: initial - this.eventVenueRecords.length };
      }
    };
  }

  public get eventSection() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSectionRecords];
        if (args?.where?.eventId) list = list.filter(es => es.eventId === args.where.eventId);
        if (args?.where?.venueSectionId) list = list.filter(es => es.venueSectionId === args.where.venueSectionId);
        if (args?.where?.enabled !== undefined) list = list.filter(es => es.enabled === args.where.enabled);
        if (args?.include?.venueSection) {
          list = list.map(es => ({
            ...es,
            venueSection: this.venueSectionRecords.find(vs => vs.id === es.venueSectionId)
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        let es: any = null;
        if (args?.where?.id) es = this.eventSectionRecords.find(x => x.id === args.where.id);
        if (!es && args?.where?.eventId_venueSectionId) {
          es = this.eventSectionRecords.find(x => x.eventId === args.where.eventId_venueSectionId.eventId && x.venueSectionId === args.where.eventId_venueSectionId.venueSectionId);
        }
        if (!es) return null;
        const copy = { ...es };
        if (args?.include?.venueSection) {
          copy.venueSection = this.venueSectionRecords.find(vs => vs.id === es.venueSectionId);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.eventSection.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `esec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          enabled: true,
          technicalReservation: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventSectionRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventSectionRecords.findIndex(es => es.id === args.where?.id);
        if (idx === -1) throw new Error('Setor do evento não encontrado');
        const updated = {
          ...this.eventSectionRecords[idx],
          ...args.data,
          updatedAt: new Date()
        };
        this.eventSectionRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.eventSectionRecords.findIndex(es => es.id === args.where?.id);
        if (idx !== -1) return this.eventSectionRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.eventSectionRecords.length;
        if (args?.where?.eventId) {
          this.eventSectionRecords = this.eventSectionRecords.filter(es => es.eventId !== args.where.eventId);
        }
        return { count: initial - this.eventSectionRecords.length };
      }
    };
  }

  public get eventSession() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSessionRecords];
        if (args?.where) {
          const w = args.where;
          if (w.eventId) list = list.filter(s => s.eventId === w.eventId);
          if (w.venueId) list = list.filter(s => s.venueId === w.venueId);
          if (w.status) list = list.filter(s => s.status === w.status);
          if (w.isPrimary !== undefined) list = list.filter(s => s.isPrimary === w.isPrimary);
          if (w.recurrenceGroupId) list = list.filter(s => s.recurrenceGroupId === w.recurrenceGroupId);
          if (w.id && typeof w.id === 'string') list = list.filter(s => s.id === w.id);
          if (w.id && Array.isArray(w.id.in)) list = list.filter(s => w.id.in.includes(s.id));
          if (w.startAt && w.startAt.gte) {
            list = list.filter(s => new Date(s.startAt) >= new Date(w.startAt.gte));
          }
          if (w.startAt && w.startAt.lte) {
            list = list.filter(s => new Date(s.startAt) <= new Date(w.startAt.lte));
          }
        }
        list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        if (args?.include) {
          list = list.map(s => this.hydrateEventSession(s, args.include));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let s: any = null;
        if (args.where.id) s = this.eventSessionRecords.find(x => x.id === args.where.id);
        if (!s && args.where.publicCode) s = this.eventSessionRecords.find(x => x.publicCode === args.where.publicCode);
        if (!s) return null;
        return args?.include ? this.hydrateEventSession(s, args.include) : { ...s };
      },
      findFirst: async (args?: any) => {
        const matches = await this.eventSession.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const rand = Math.floor(100000 + Math.random() * 900000);
        const year = new Date().getFullYear();
        const record = {
          id: args.data.id || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          publicCode: args.data.publicCode || `SES-${year}-${rand}`,
          timezone: 'America/Sao_Paulo',
          status: 'CONFIGURED',
          reservedCapacity: 0,
          isPrimary: false,
          version: 1,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventSessionRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.eventSession.create({ data: item });
        }
        return { count: args.data.length };
      },
      update: async (args: any) => {
        const idx = this.eventSessionRecords.findIndex(s => s.id === args.where?.id);
        if (idx === -1) throw new Error('Sessão não encontrada');
        const updated = {
          ...this.eventSessionRecords[idx],
          ...args.data,
          version: (this.eventSessionRecords[idx].version || 1) + 1,
          updatedAt: new Date()
        };
        this.eventSessionRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.eventSessionRecords.findIndex(s => s.id === args.where?.id);
        if (idx !== -1) return this.eventSessionRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.eventSessionRecords.length;
        if (args?.where?.eventId) {
          this.eventSessionRecords = this.eventSessionRecords.filter(s => s.eventId !== args.where.eventId);
        }
        return { count: initial - this.eventSessionRecords.length };
      },
      count: async (args?: any) => {
        const list = await this.eventSession.findMany(args);
        return list.length;
      }
    };
  }

  public get sessionSection() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.sessionSectionRecords];
        if (args?.where?.sessionId) list = list.filter(ss => ss.sessionId === args.where.sessionId);
        if (args?.where?.eventSectionId) list = list.filter(ss => ss.eventSectionId === args.where.eventSectionId);
        if (args?.where?.enabled !== undefined) list = list.filter(ss => ss.enabled === args.where.enabled);
        if (args?.include?.eventSection) {
          list = list.map(ss => ({
            ...ss,
            eventSection: this.eventSectionRecords.find(es => es.id === ss.eventSectionId)
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        let ss: any = null;
        if (args?.where?.id) ss = this.sessionSectionRecords.find(x => x.id === args.where.id);
        if (!ss && args?.where?.sessionId_eventSectionId) {
          ss = this.sessionSectionRecords.find(x => x.sessionId === args.where.sessionId_eventSectionId.sessionId && x.eventSectionId === args.where.sessionId_eventSectionId.eventSectionId);
        }
        if (!ss) return null;
        const copy = { ...ss };
        if (args?.include?.eventSection) {
          copy.eventSection = this.eventSectionRecords.find(es => es.id === ss.eventSectionId);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.sessionSection.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ssec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          enabled: true,
          reservedCapacity: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.sessionSectionRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.sessionSection.create({ data: item });
        }
        return { count: args.data.length };
      },
      update: async (args: any) => {
        const idx = this.sessionSectionRecords.findIndex(ss => ss.id === args.where?.id);
        if (idx === -1) throw new Error('Setor de sessão não encontrado');
        const updated = {
          ...this.sessionSectionRecords[idx],
          ...args.data,
          updatedAt: new Date()
        };
        this.sessionSectionRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.sessionSectionRecords.findIndex(ss => ss.id === args.where?.id);
        if (idx !== -1) return this.sessionSectionRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.sessionSectionRecords.length;
        if (args?.where?.sessionId) {
          this.sessionSectionRecords = this.sessionSectionRecords.filter(ss => ss.sessionId !== args.where.sessionId);
        }
        return { count: initial - this.sessionSectionRecords.length };
      }
    };
  }

  public get sessionCapacityReservation() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.sessionCapacityReservationRecords];
        if (args?.where?.sessionId) list = list.filter(r => r.sessionId === args.where.sessionId);
        if (args?.where?.sectionId) list = list.filter(r => r.sectionId === args.where.sectionId);
        if (args?.where?.type) list = list.filter(r => r.type === args.where.type);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const r = this.sessionCapacityReservationRecords.find(x => x.id === args.where.id);
        return r ? { ...r } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `scres_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          createdAt: new Date()
        };
        this.sessionCapacityReservationRecords.push(record);
        return { ...record };
      },
      delete: async (args: any) => {
        const idx = this.sessionCapacityReservationRecords.findIndex(r => r.id === args.where?.id);
        if (idx !== -1) return this.sessionCapacityReservationRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.sessionCapacityReservationRecords.length;
        if (args?.where?.sessionId) {
          this.sessionCapacityReservationRecords = this.sessionCapacityReservationRecords.filter(r => r.sessionId !== args.where.sessionId);
        }
        return { count: initial - this.sessionCapacityReservationRecords.length };
      }
    };
  }

  public get sessionRecurrenceGroup() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.sessionRecurrenceGroupRecords];
        if (args?.where?.eventId) list = list.filter(rg => rg.eventId === args.where.eventId);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const rg = this.sessionRecurrenceGroupRecords.find(x => x.id === args.where.id);
        return rg ? { ...rg } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `srg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          createdAt: new Date()
        };
        this.sessionRecurrenceGroupRecords.push(record);
        return { ...record };
      },
      delete: async (args: any) => {
        const idx = this.sessionRecurrenceGroupRecords.findIndex(rg => rg.id === args.where?.id);
        if (idx !== -1) return this.sessionRecurrenceGroupRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  // ==============================================================================
  // 5.3 DELEGATES FASE 1.2.5 & 1.2.6 (INGRESSOS, INVENTÁRIO, LOTES, PREÇOS, REGRAS)
  // ==============================================================================

  public get ticketType() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.ticketTypeRecords];
        if (args?.where?.category) list = list.filter(t => t.category === args.where.category);
        if (args?.where?.active !== undefined) list = list.filter(t => t.active === args.where.active);
        if (args?.where?.code) list = list.filter(t => t.code === args.where.code);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let t: any = null;
        if (args.where.id) t = this.ticketTypeRecords.find(x => x.id === args.where.id);
        if (!t && args.where.code) t = this.ticketTypeRecords.find(x => x.code === args.where.code);
        return t ? { ...t } : null;
      },
      findFirst: async (args?: any) => {
        const matches = await this.ticketType.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `tt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          isSystem: false,
          halfPriceLawCompliance: false,
          requiresDocument: false,
          requiresCode: false,
          requiresBenefit: false,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.ticketTypeRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.ticketTypeRecords.findIndex(t => t.id === args.where?.id);
        if (idx === -1) throw new Error('Tipo de ingresso não encontrado');
        const updated = { ...this.ticketTypeRecords[idx], ...args.data, updatedAt: new Date() };
        this.ticketTypeRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.ticketTypeRecords.findIndex(t => t.id === args.where?.id);
        if (idx !== -1) return this.ticketTypeRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  public get eventTicketType() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTicketTypeRecords];
        if (args?.where?.eventId) list = list.filter(ett => ett.eventId === args.where.eventId);
        if (args?.where?.active !== undefined) list = list.filter(ett => ett.active === args.where.active);
        if (args?.where?.category) list = list.filter(ett => ett.category === args.where.category);
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (args?.include) {
          list = list.map(ett => {
            const copy: any = { ...ett };
            if (args.include.sections) {
              const sections = this.eventTicketTypeSectionRecords
                .filter(s => s.eventTicketTypeId === ett.id)
                .map(s => {
                  const es = this.eventSectionRecords.find(x => x.id === s.eventSectionId);
                  return {
                    ...s,
                    eventSection: es ? { ...es } : undefined
                  };
                });
              copy.sections = sections;
            }
            if (args.include.sessions) {
              const sessions = this.eventTicketTypeSessionRecords
                .filter(s => s.eventTicketTypeId === ett.id)
                .map(s => {
                  const ses = this.eventSessionRecords.find(x => x.id === s.sessionId);
                  return {
                    ...s,
                    session: ses ? { ...ses } : undefined
                  };
                });
              copy.sessions = sessions;
            }
            if (args.include.benefits) {
              copy.benefits = this.eventTicketTypeBenefitRecords.filter(b => b.eventTicketTypeId === ett.id);
            }
            if (args.include.allocations) {
              copy.allocations = this.inventoryAllocationRecords.filter(a => a.eventTicketTypeId === ett.id);
            }
            return copy;
          });
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let ett: any = null;
        if (args.where.id) ett = this.eventTicketTypeRecords.find(x => x.id === args.where.id);
        if (!ett && args.where.eventId_code) {
          ett = this.eventTicketTypeRecords.find(x => x.eventId === args.where.eventId_code.eventId && x.code === args.where.eventId_code.code);
        }
        if (!ett) return null;
        const copy: any = { ...ett };
        if (args?.include?.sections) {
          copy.sections = this.eventTicketTypeSectionRecords
            .filter(s => s.eventTicketTypeId === ett.id)
            .map(s => ({
              ...s,
              eventSection: this.eventSectionRecords.find(x => x.id === s.eventSectionId)
            }));
        }
        if (args?.include?.sessions) {
          copy.sessions = this.eventTicketTypeSessionRecords
            .filter(s => s.eventTicketTypeId === ett.id)
            .map(s => ({
              ...s,
              session: this.eventSessionRecords.find(x => x.id === s.sessionId)
            }));
        }
        if (args?.include?.benefits) {
          copy.benefits = this.eventTicketTypeBenefitRecords.filter(b => b.eventTicketTypeId === ett.id);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.eventTicketType.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ett_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          sortOrder: 0,
          minPerOrder: 1,
          maxPerOrder: 6,
          halfPriceLawCompliance: false,
          requiresDocument: false,
          requiresCode: false,
          requiresBenefit: false,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventTicketTypeRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventTicketTypeRecords.findIndex(ett => ett.id === args.where?.id);
        if (idx === -1) throw new Error('Tipo de ingresso do evento não encontrado');
        const updated = { ...this.eventTicketTypeRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventTicketTypeRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.eventTicketTypeRecords.findIndex(ett => ett.id === args.where?.id);
        if (idx !== -1) {
          const deleted = this.eventTicketTypeRecords.splice(idx, 1)[0];
          this.eventTicketTypeSectionRecords = this.eventTicketTypeSectionRecords.filter(s => s.eventTicketTypeId !== deleted.id);
          this.eventTicketTypeSessionRecords = this.eventTicketTypeSessionRecords.filter(s => s.eventTicketTypeId !== deleted.id);
          this.eventTicketTypeBenefitRecords = this.eventTicketTypeBenefitRecords.filter(b => b.eventTicketTypeId !== deleted.id);
          return deleted;
        }
        return null;
      },
      count: async (args?: any) => {
        const matches = await this.eventTicketType.findMany(args);
        return matches.length;
      }
    };
  }

  public get eventTicketTypeSection() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTicketTypeSectionRecords];
        if (args?.where?.eventTicketTypeId) list = list.filter(s => s.eventTicketTypeId === args.where.eventTicketTypeId);
        if (args?.where?.eventSectionId) list = list.filter(s => s.eventSectionId === args.where.eventSectionId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `etts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data
        };
        this.eventTicketTypeSectionRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.eventTicketTypeSection.create({ data: item });
        }
        return { count: args.data.length };
      },
      deleteMany: async (args: any) => {
        const initial = this.eventTicketTypeSectionRecords.length;
        if (args?.where?.eventTicketTypeId) {
          this.eventTicketTypeSectionRecords = this.eventTicketTypeSectionRecords.filter(s => s.eventTicketTypeId !== args.where.eventTicketTypeId);
        }
        if (args?.where?.eventSectionId) {
          this.eventTicketTypeSectionRecords = this.eventTicketTypeSectionRecords.filter(s => s.eventSectionId !== args.where.eventSectionId);
        }
        return { count: initial - this.eventTicketTypeSectionRecords.length };
      }
    };
  }

  public get eventTicketTypeSession() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTicketTypeSessionRecords];
        if (args?.where?.eventTicketTypeId) list = list.filter(s => s.eventTicketTypeId === args.where.eventTicketTypeId);
        if (args?.where?.sessionId) list = list.filter(s => s.sessionId === args.where.sessionId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ettses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data
        };
        this.eventTicketTypeSessionRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.eventTicketTypeSession.create({ data: item });
        }
        return { count: args.data.length };
      },
      deleteMany: async (args: any) => {
        const initial = this.eventTicketTypeSessionRecords.length;
        if (args?.where?.eventTicketTypeId) {
          this.eventTicketTypeSessionRecords = this.eventTicketTypeSessionRecords.filter(s => s.eventTicketTypeId !== args.where.eventTicketTypeId);
        }
        if (args?.where?.sessionId) {
          this.eventTicketTypeSessionRecords = this.eventTicketTypeSessionRecords.filter(s => s.sessionId !== args.where.sessionId);
        }
        return { count: initial - this.eventTicketTypeSessionRecords.length };
      }
    };
  }

  public get eventTicketTypeBenefit() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTicketTypeBenefitRecords];
        if (args?.where?.eventTicketTypeId) list = list.filter(b => b.eventTicketTypeId === args.where.eventTicketTypeId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ettb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...args.data,
          createdAt: new Date()
        };
        this.eventTicketTypeBenefitRecords.push(record);
        return { ...record };
      },
      deleteMany: async (args: any) => {
        const initial = this.eventTicketTypeBenefitRecords.length;
        if (args?.where?.eventTicketTypeId) {
          this.eventTicketTypeBenefitRecords = this.eventTicketTypeBenefitRecords.filter(b => b.eventTicketTypeId !== args.where.eventTicketTypeId);
        }
        return { count: initial - this.eventTicketTypeBenefitRecords.length };
      }
    };
  }

  public get inventoryPool() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.inventoryPoolRecords];
        if (args?.where?.sessionId) {
          if (typeof args.where.sessionId === 'string') {
            list = list.filter(p => p.sessionId === args.where.sessionId);
          } else if (args.where.sessionId.in && Array.isArray(args.where.sessionId.in)) {
            list = list.filter(p => args.where.sessionId.in.includes(p.sessionId));
          }
        }
        if (args?.where?.eventSectionId) list = list.filter(p => p.eventSectionId === args.where.eventSectionId);
        if (args?.include) {
          list = list.map(p => {
            const copy: any = { ...p };
            if (args.include.allocations) {
              copy.allocations = this.inventoryAllocationRecords
                .filter(a => a.inventoryPoolId === p.id)
                .map(a => ({
                  ...a,
                  eventTicketType: this.eventTicketTypeRecords.find(x => x.id === a.eventTicketTypeId)
                }));
            }
            if (args.include.blocks) {
              copy.blocks = this.inventoryBlockRecords.filter(b => b.inventoryPoolId === p.id && b.active !== false);
            }
            if (args.include.session) {
              copy.session = this.eventSessionRecords.find(s => s.id === p.sessionId);
            }
            if (args.include.eventSection) {
              copy.eventSection = this.eventSectionRecords.find(es => es.id === p.eventSectionId);
            }
            return copy;
          });
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let p: any = null;
        if (args.where.id) p = this.inventoryPoolRecords.find(x => x.id === args.where.id);
        if (!p && args.where.sessionId_eventSectionId) {
          p = this.inventoryPoolRecords.find(x => x.sessionId === args.where.sessionId_eventSectionId.sessionId && x.eventSectionId === args.where.sessionId_eventSectionId.eventSectionId);
        }
        if (!p) return null;
        const copy: any = { ...p };
        if (args?.include?.allocations) {
          copy.allocations = this.inventoryAllocationRecords
            .filter(a => a.inventoryPoolId === p.id)
            .map(a => ({
              ...a,
              eventTicketType: this.eventTicketTypeRecords.find(x => x.id === a.eventTicketTypeId)
            }));
        }
        if (args?.include?.blocks) {
          copy.blocks = this.inventoryBlockRecords.filter(b => b.inventoryPoolId === p.id && b.active !== false);
        }
        if (args?.include?.session) {
          copy.session = this.eventSessionRecords.find(s => s.id === p.sessionId);
        }
        if (args?.include?.eventSection) {
          copy.eventSection = this.eventSectionRecords.find(es => es.id === p.eventSectionId);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.inventoryPool.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `pool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          reserved: 0,
          blocked: 0,
          held: 0,
          sold: 0,
          version: 1,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.inventoryPoolRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.inventoryPoolRecords.findIndex(p => p.id === args.where?.id);
        if (idx === -1) throw new Error('Pool de inventário não encontrado');
        const current = this.inventoryPoolRecords[idx];
        const updated = {
          ...current,
          ...args.data,
          version: (current.version || 1) + 1,
          updatedAt: new Date()
        };
        this.inventoryPoolRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.inventoryPoolRecords.findIndex(p => p.id === args.where?.id);
        if (idx !== -1) return this.inventoryPoolRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.inventoryPoolRecords.length;
        if (args?.where?.sessionId) {
          this.inventoryPoolRecords = this.inventoryPoolRecords.filter(p => p.sessionId !== args.where.sessionId);
        }
        return { count: initial - this.inventoryPoolRecords.length };
      }
    };
  }

  public get inventoryAllocation() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.inventoryAllocationRecords];
        if (args?.where?.inventoryPoolId) list = list.filter(a => a.inventoryPoolId === args.where.inventoryPoolId);
        if (args?.where?.eventTicketTypeId) list = list.filter(a => a.eventTicketTypeId === args.where.eventTicketTypeId);
        if (args?.include?.eventTicketType) {
          list = list.map(a => ({
            ...a,
            eventTicketType: this.eventTicketTypeRecords.find(x => x.id === a.eventTicketTypeId)
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let a: any = null;
        if (args.where.id) a = this.inventoryAllocationRecords.find(x => x.id === args.where.id);
        if (!a && args.where.inventoryPoolId_eventTicketTypeId) {
          a = this.inventoryAllocationRecords.find(x => x.inventoryPoolId === args.where.inventoryPoolId_eventTicketTypeId.inventoryPoolId && x.eventTicketTypeId === args.where.inventoryPoolId_eventTicketTypeId.eventTicketTypeId);
        }
        return a ? { ...a } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ia_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          soldQuantity: 0,
          heldQuantity: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.inventoryAllocationRecords.push(record);
        return { ...record };
      },
      upsert: async (args: any) => {
        const existing = await this.inventoryAllocation.findUnique({ where: args.where });
        if (existing) {
          return this.inventoryAllocation.update({ where: { id: existing.id }, data: args.update });
        } else {
          return this.inventoryAllocation.create({ data: { ...args.create, ...(args.where.inventoryPoolId_eventTicketTypeId || {}) } });
        }
      },
      update: async (args: any) => {
        let idx = -1;
        if (args.where?.id) idx = this.inventoryAllocationRecords.findIndex(a => a.id === args.where.id);
        if (idx === -1 && args.where?.inventoryPoolId_eventTicketTypeId) {
          idx = this.inventoryAllocationRecords.findIndex(a => a.inventoryPoolId === args.where.inventoryPoolId_eventTicketTypeId.inventoryPoolId && a.eventTicketTypeId === args.where.inventoryPoolId_eventTicketTypeId.eventTicketTypeId);
        }
        if (idx === -1) throw new Error('Alocação de inventário não encontrada');
        const updated = { ...this.inventoryAllocationRecords[idx], ...args.data, updatedAt: new Date() };
        this.inventoryAllocationRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.inventoryAllocationRecords.findIndex(a => a.id === args.where?.id);
        if (idx !== -1) return this.inventoryAllocationRecords.splice(idx, 1)[0];
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.inventoryAllocationRecords.length;
        if (args?.where?.inventoryPoolId) {
          this.inventoryAllocationRecords = this.inventoryAllocationRecords.filter(a => a.inventoryPoolId !== args.where.inventoryPoolId);
        }
        return { count: initial - this.inventoryAllocationRecords.length };
      }
    };
  }

  public get inventoryBlock() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.inventoryBlockRecords];
        if (args?.where?.inventoryPoolId) list = list.filter(b => b.inventoryPoolId === args.where.inventoryPoolId);
        if (args?.where?.active !== undefined) list = list.filter(b => b.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const b = this.inventoryBlockRecords.find(x => x.id === args.where.id);
        return b ? { ...b } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ib_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.inventoryBlockRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.inventoryBlockRecords.findIndex(b => b.id === args.where?.id);
        if (idx === -1) throw new Error('Bloqueio não encontrado');
        const updated = { ...this.inventoryBlockRecords[idx], ...args.data, updatedAt: new Date() };
        this.inventoryBlockRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.inventoryBlockRecords.findIndex(b => b.id === args.where?.id);
        if (idx !== -1) return this.inventoryBlockRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  public get seatInventory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.seatInventoryRecords];
        if (args?.where?.inventoryPoolId) list = list.filter(s => s.inventoryPoolId === args.where.inventoryPoolId);
        if (args?.where?.status) list = list.filter(s => s.status === args.where.status);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let s: any = null;
        if (args.where.id) s = this.seatInventoryRecords.find(x => x.id === args.where.id);
        if (!s && args.where.inventoryPoolId_seatCode) {
          s = this.seatInventoryRecords.find(x => x.inventoryPoolId === args.where.inventoryPoolId_seatCode.inventoryPoolId && x.seatCode === args.where.inventoryPoolId_seatCode.seatCode);
        }
        return s ? { ...s } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `si_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'AVAILABLE',
          version: 1,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.seatInventoryRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        for (const item of args.data) {
          await this.seatInventory.create({ data: item });
        }
        return { count: args.data.length };
      },
      update: async (args: any) => {
        const idx = this.seatInventoryRecords.findIndex(s => s.id === args.where?.id);
        if (idx === -1) throw new Error('Assento de inventário não encontrado');
        const updated = {
          ...this.seatInventoryRecords[idx],
          ...args.data,
          version: (this.seatInventoryRecords[idx].version || 1) + 1,
          updatedAt: new Date()
        };
        this.seatInventoryRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get ticketBatch() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.ticketBatchRecords];
        if (args?.where?.eventId) list = list.filter(b => b.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(b => b.status === args.where.status);
        list.sort((a, b) => (a.phase || 0) - (b.phase || 0));

        if (args?.include?.priceConfigurations) {
          list = list.map(b => ({
            ...b,
            priceConfigurations: this.priceConfigurationRecords
              .filter(pc => pc.ticketBatchId === b.id)
              .map(pc => ({
                ...pc,
                feeComponents: this.feeComponentRecords.filter(fc => fc.priceConfigurationId === pc.id)
              }))
          }));
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let b: any = null;
        if (args.where.id) b = this.ticketBatchRecords.find(x => x.id === args.where.id);
        if (!b && args.where.eventId_code) {
          b = this.ticketBatchRecords.find(x => x.eventId === args.where.eventId_code.eventId && x.code === args.where.eventId_code.code);
        }
        if (!b) return null;
        const copy: any = { ...b };
        if (args?.include?.priceConfigurations) {
          copy.priceConfigurations = this.priceConfigurationRecords
            .filter(pc => pc.ticketBatchId === b.id)
            .map(pc => ({
              ...pc,
              feeComponents: this.feeComponentRecords.filter(fc => fc.priceConfigurationId === pc.id)
            }));
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.ticketBatch.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'DRAFT',
          activationType: 'MANUAL',
          phase: 1,
          soldCount: 0,
          heldCount: 0,
          version: 1,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.ticketBatchRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.ticketBatchRecords.findIndex(b => b.id === args.where?.id);
        if (idx === -1) throw new Error('Lote não encontrado');
        const current = this.ticketBatchRecords[idx];
        const updated = {
          ...current,
          ...args.data,
          version: (current.version || 1) + 1,
          updatedAt: new Date()
        };
        this.ticketBatchRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.ticketBatchRecords.findIndex(b => b.id === args.where?.id);
        if (idx !== -1) {
          const deleted = this.ticketBatchRecords.splice(idx, 1)[0];
          this.priceConfigurationRecords = this.priceConfigurationRecords.filter(pc => pc.ticketBatchId !== deleted.id);
          return deleted;
        }
        return null;
      },
      count: async (args?: any) => {
        const matches = await this.ticketBatch.findMany(args);
        return matches.length;
      }
    };
  }

  public get priceConfiguration() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.priceConfigurationRecords];
        if (args?.where?.ticketBatchId) list = list.filter(pc => pc.ticketBatchId === args.where.ticketBatchId);
        if (args?.where?.eventSectionId) list = list.filter(pc => pc.eventSectionId === args.where.eventSectionId);
        if (args?.where?.eventTicketTypeId) list = list.filter(pc => pc.eventTicketTypeId === args.where.eventTicketTypeId);
        if (args?.where?.active !== undefined) list = list.filter(pc => pc.active === args.where.active);

        if (args?.include) {
          list = list.map(pc => {
            const copy: any = { ...pc };
            if (args.include.feeComponents) {
              copy.feeComponents = this.feeComponentRecords.filter(fc => fc.priceConfigurationId === pc.id);
            }
            if (args.include.eventSection) {
              copy.eventSection = this.eventSectionRecords.find(es => es.id === pc.eventSectionId);
            }
            if (args.include.eventTicketType) {
              copy.eventTicketType = this.eventTicketTypeRecords.find(ett => ett.id === pc.eventTicketTypeId);
            }
            if (args.include.ticketBatch) {
              copy.ticketBatch = this.ticketBatchRecords.find(tb => tb.id === pc.ticketBatchId);
            }
            return copy;
          });
        }
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where) return null;
        let pc: any = null;
        if (args.where.id) pc = this.priceConfigurationRecords.find(x => x.id === args.where.id);
        if (!pc && args.where.ticketBatchId_eventSectionId_eventTicketTypeId) {
          const w = args.where.ticketBatchId_eventSectionId_eventTicketTypeId;
          pc = this.priceConfigurationRecords.find(x => x.ticketBatchId === w.ticketBatchId && x.eventSectionId === w.eventSectionId && x.eventTicketTypeId === w.eventTicketTypeId);
        }
        if (!pc) return null;
        const copy: any = { ...pc };
        if (args?.include?.feeComponents) {
          copy.feeComponents = this.feeComponentRecords.filter(fc => fc.priceConfigurationId === pc.id);
        }
        if (args?.include?.eventSection) {
          copy.eventSection = this.eventSectionRecords.find(es => es.id === pc.eventSectionId);
        }
        if (args?.include?.eventTicketType) {
          copy.eventTicketType = this.eventTicketTypeRecords.find(ett => ett.id === pc.eventTicketTypeId);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        const matches = await this.priceConfiguration.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `pc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          salePriceInCents: args.data.basePriceInCents,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.priceConfigurationRecords.push(record);
        return { ...record };
      },
      upsert: async (args: any) => {
        const existing = await this.priceConfiguration.findUnique({ where: args.where });
        if (existing) {
          return this.priceConfiguration.update({ where: { id: existing.id }, data: args.update });
        } else {
          return this.priceConfiguration.create({ data: { ...args.create, ...(args.where.ticketBatchId_eventSectionId_eventTicketTypeId || {}) } });
        }
      },
      update: async (args: any) => {
        let idx = -1;
        if (args.where?.id) idx = this.priceConfigurationRecords.findIndex(pc => pc.id === args.where.id);
        if (idx === -1 && args.where?.ticketBatchId_eventSectionId_eventTicketTypeId) {
          const w = args.where.ticketBatchId_eventSectionId_eventTicketTypeId;
          idx = this.priceConfigurationRecords.findIndex(pc => pc.ticketBatchId === w.ticketBatchId && pc.eventSectionId === w.eventSectionId && pc.eventTicketTypeId === w.eventTicketTypeId);
        }
        if (idx === -1) throw new Error('Configuração de preço não encontrada');
        const updated = { ...this.priceConfigurationRecords[idx], ...args.data, updatedAt: new Date() };
        this.priceConfigurationRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.priceConfigurationRecords.findIndex(pc => pc.id === args.where?.id);
        if (idx !== -1) {
          const deleted = this.priceConfigurationRecords.splice(idx, 1)[0];
          this.feeComponentRecords = this.feeComponentRecords.filter(fc => fc.priceConfigurationId !== deleted.id);
          return deleted;
        }
        return null;
      },
      deleteMany: async (args: any) => {
        const initial = this.priceConfigurationRecords.length;
        if (args?.where?.ticketBatchId) {
          const removed = this.priceConfigurationRecords.filter(pc => pc.ticketBatchId === args.where.ticketBatchId);
          const removedIds = removed.map(r => r.id);
          this.priceConfigurationRecords = this.priceConfigurationRecords.filter(pc => pc.ticketBatchId !== args.where.ticketBatchId);
          this.feeComponentRecords = this.feeComponentRecords.filter(fc => !removedIds.includes(fc.priceConfigurationId));
        }
        return { count: initial - this.priceConfigurationRecords.length };
      }
    };
  }

  public get feeComponent() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.feeComponentRecords];
        if (args?.where?.priceConfigurationId) list = list.filter(fc => fc.priceConfigurationId === args.where.priceConfigurationId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          payer: 'BUYER',
          taxDeductible: false,
          ...args.data,
          createdAt: new Date()
        };
        this.feeComponentRecords.push(record);
        return { ...record };
      },
      deleteMany: async (args: any) => {
        const initial = this.feeComponentRecords.length;
        if (args?.where?.priceConfigurationId) {
          this.feeComponentRecords = this.feeComponentRecords.filter(fc => fc.priceConfigurationId !== args.where.priceConfigurationId);
        }
        return { count: initial - this.feeComponentRecords.length };
      }
    };
  }

  public get salesRule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.salesRuleRecords];
        if (args?.where?.eventId) list = list.filter(r => r.eventId === args.where.eventId);
        if (args?.where?.scope) list = list.filter(r => r.scope === args.where.scope);
        if (args?.where?.scopeId) list = list.filter(r => r.scopeId === args.where.scopeId);
        if (args?.where?.active !== undefined) list = list.filter(r => r.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const r = this.salesRuleRecords.find(x => x.id === args.where.id);
        return r ? { ...r } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `sr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.salesRuleRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.salesRuleRecords.findIndex(r => r.id === args.where?.id);
        if (idx === -1) throw new Error('Regra de venda não encontrada');
        const updated = { ...this.salesRuleRecords[idx], ...args.data, updatedAt: new Date() };
        this.salesRuleRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.salesRuleRecords.findIndex(r => r.id === args.where?.id);
        if (idx !== -1) return this.salesRuleRecords.splice(idx, 1)[0];
        return null;
      }
    };
  }

  // ==========================================
  // GETTERS: CANAIS DE VENDA (FASE 1.2.7)
  // ==========================================

  public get salesChannel() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.salesChannelRecords];
        if (args?.where?.active !== undefined) list = list.filter(c => c.active === args.where.active);
        if (args?.where?.type) list = list.filter(c => c.type === args.where.type);
        return list.map(c => ({ ...c }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id && !args?.where?.code) return null;
        const c = this.salesChannelRecords.find(x => (args.where.id && x.id === args.where.id) || (args.where.code && x.code === args.where.code));
        return c ? { ...c } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.salesChannelRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.salesChannelRecords.findIndex(c => c.id === args.where?.id);
        if (idx === -1) throw new Error('Canal de venda não encontrado');
        const updated = { ...this.salesChannelRecords[idx], ...args.data, updatedAt: new Date() };
        this.salesChannelRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventSalesChannel() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSalesChannelRecords];
        if (args?.where?.eventId) list = list.filter(esc => esc.eventId === args.where.eventId);
        if (args?.where?.salesChannelId) list = list.filter(esc => esc.salesChannelId === args.where.salesChannelId);
        if (args?.where?.enabled !== undefined) list = list.filter(esc => esc.enabled === args.where.enabled);

        return list.map(esc => {
          const copy = { ...esc };
          if (args?.include?.salesChannel) {
            copy.salesChannel = this.salesChannelRecords.find(c => c.id === esc.salesChannelId);
          }
          if (args?.include?.allocations) {
            copy.allocations = this.channelAllocationRecords.filter(ca => ca.eventSalesChannelId === esc.id);
          }
          if (args?.include?.sessions) {
            copy.sessions = this.eventSalesChannelSessionRecords.filter(s => s.eventSalesChannelId === esc.id);
          }
          if (args?.include?.sections) {
            copy.sections = this.eventSalesChannelSectionRecords.filter(s => s.eventSalesChannelId === esc.id);
          }
          if (args?.include?.ticketTypes) {
            copy.ticketTypes = this.eventSalesChannelTicketTypeRecords.filter(t => t.eventSalesChannelId === esc.id);
          }
          return copy;
        });
      },
      findUnique: async (args: any) => {
        let esc: any = null;
        if (args?.where?.id) esc = this.eventSalesChannelRecords.find(x => x.id === args.where.id);
        if (!esc && args?.where?.eventId_salesChannelId) {
          esc = this.eventSalesChannelRecords.find(x => x.eventId === args.where.eventId_salesChannelId.eventId && x.salesChannelId === args.where.eventId_salesChannelId.salesChannelId);
        }
        if (!esc) return null;
        const copy = { ...esc };
        if (args?.include?.salesChannel) {
          copy.salesChannel = this.salesChannelRecords.find(c => c.id === esc.salesChannelId);
        }
        if (args?.include?.allocations) {
          copy.allocations = this.channelAllocationRecords.filter(ca => ca.eventSalesChannelId === esc.id);
        }
        return copy;
      },
      findFirst: async (args: any) => {
        const matches = await this.eventSalesChannel.findMany(args);
        return matches.length > 0 ? matches[0] : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `esc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          enabled: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventSalesChannelRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        let idx = -1;
        if (args.where?.id) idx = this.eventSalesChannelRecords.findIndex(x => x.id === args.where.id);
        if (idx === -1 && args.where?.eventId_salesChannelId) {
          idx = this.eventSalesChannelRecords.findIndex(x => x.eventId === args.where.eventId_salesChannelId.eventId && x.salesChannelId === args.where.eventId_salesChannelId.salesChannelId);
        }
        if (idx === -1) throw new Error('Configuração de canal do evento não encontrada');
        const updated = { ...this.eventSalesChannelRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventSalesChannelRecords[idx] = updated;
        return { ...updated };
      },
      upsert: async (args: any) => {
        let existing: any = null;
        if (args.where?.eventId_salesChannelId) {
          existing = this.eventSalesChannelRecords.find(x => x.eventId === args.where.eventId_salesChannelId.eventId && x.salesChannelId === args.where.eventId_salesChannelId.salesChannelId);
        }
        if (existing) {
          return this.eventSalesChannel.update({ where: { id: existing.id }, data: args.update });
        } else {
          return this.eventSalesChannel.create({ data: { ...args.create, ...(args.where.eventId_salesChannelId || {}) } });
        }
      }
    };
  }

  public get eventSalesChannelSession() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSalesChannelSessionRecords];
        if (args?.where?.eventSalesChannelId) list = list.filter(x => x.eventSalesChannelId === args.where.eventSalesChannelId);
        return list;
      },
      create: async (args: any) => {
        const record = { id: `escs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...args.data };
        this.eventSalesChannelSessionRecords.push(record);
        return record;
      },
      deleteMany: async (args?: any) => {
        const before = this.eventSalesChannelSessionRecords.length;
        if (args?.where?.eventSalesChannelId) {
          this.eventSalesChannelSessionRecords = this.eventSalesChannelSessionRecords.filter(x => x.eventSalesChannelId !== args.where.eventSalesChannelId);
        }
        return { count: before - this.eventSalesChannelSessionRecords.length };
      }
    };
  }

  public get eventSalesChannelSection() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSalesChannelSectionRecords];
        if (args?.where?.eventSalesChannelId) list = list.filter(x => x.eventSalesChannelId === args.where.eventSalesChannelId);
        return list;
      },
      create: async (args: any) => {
        const record = { id: `escsec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...args.data };
        this.eventSalesChannelSectionRecords.push(record);
        return record;
      },
      deleteMany: async (args?: any) => {
        const before = this.eventSalesChannelSectionRecords.length;
        if (args?.where?.eventSalesChannelId) {
          this.eventSalesChannelSectionRecords = this.eventSalesChannelSectionRecords.filter(x => x.eventSalesChannelId !== args.where.eventSalesChannelId);
        }
        return { count: before - this.eventSalesChannelSectionRecords.length };
      }
    };
  }

  public get eventSalesChannelTicketType() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventSalesChannelTicketTypeRecords];
        if (args?.where?.eventSalesChannelId) list = list.filter(x => x.eventSalesChannelId === args.where.eventSalesChannelId);
        return list;
      },
      create: async (args: any) => {
        const record = { id: `esctt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...args.data };
        this.eventSalesChannelTicketTypeRecords.push(record);
        return record;
      },
      deleteMany: async (args?: any) => {
        const before = this.eventSalesChannelTicketTypeRecords.length;
        if (args?.where?.eventSalesChannelId) {
          this.eventSalesChannelTicketTypeRecords = this.eventSalesChannelTicketTypeRecords.filter(x => x.eventSalesChannelId !== args.where.eventSalesChannelId);
        }
        return { count: before - this.eventSalesChannelTicketTypeRecords.length };
      }
    };
  }

  public get channelAllocation() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.channelAllocationRecords];
        if (args?.where?.eventSalesChannelId) list = list.filter(ca => ca.eventSalesChannelId === args.where.eventSalesChannelId);
        if (args?.where?.inventoryPoolId) list = list.filter(ca => ca.inventoryPoolId === args.where.inventoryPoolId);
        return list.map(ca => ({ ...ca }));
      },
      findUnique: async (args: any) => {
        let ca: any = null;
        if (args?.where?.id) ca = this.channelAllocationRecords.find(x => x.id === args.where.id);
        if (!ca && args?.where?.eventSalesChannelId_inventoryPoolId) {
          const w = args.where.eventSalesChannelId_inventoryPoolId;
          ca = this.channelAllocationRecords.find(x => x.eventSalesChannelId === w.eventSalesChannelId && x.inventoryPoolId === w.inventoryPoolId);
        }
        return ca ? { ...ca } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ca_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          quantityConsumed: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.channelAllocationRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        let idx = -1;
        if (args.where?.id) idx = this.channelAllocationRecords.findIndex(x => x.id === args.where.id);
        if (idx === -1 && args.where?.eventSalesChannelId_inventoryPoolId) {
          const w = args.where.eventSalesChannelId_inventoryPoolId;
          idx = this.channelAllocationRecords.findIndex(x => x.eventSalesChannelId === w.eventSalesChannelId && x.inventoryPoolId === w.inventoryPoolId);
        }
        if (idx === -1) throw new Error('Alocação de canal não encontrada');
        const updated = { ...this.channelAllocationRecords[idx], ...args.data, updatedAt: new Date() };
        this.channelAllocationRecords[idx] = updated;
        return { ...updated };
      },
      upsert: async (args: any) => {
        const w = args.where?.eventSalesChannelId_inventoryPoolId;
        let existing: any = null;
        if (w) existing = this.channelAllocationRecords.find(x => x.eventSalesChannelId === w.eventSalesChannelId && x.inventoryPoolId === w.inventoryPoolId);
        if (existing) {
          return this.channelAllocation.update({ where: { id: existing.id }, data: args.update });
        } else {
          return this.channelAllocation.create({ data: { ...args.create, ...(w || {}) } });
        }
      }
    };
  }

  public get salesPoint() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.salesPointRecords];
        if (args?.where?.venueId) list = list.filter(sp => sp.venueId === args.where.venueId);
        if (args?.where?.active !== undefined) list = list.filter(sp => sp.active === args.where.active);
        return list.map(sp => ({
          ...sp,
          terminalsCount: this.salesTerminalRecords.filter(t => t.salesPointId === sp.id).length
        }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const sp = this.salesPointRecords.find(x => x.id === args.where.id);
        return sp ? { ...sp, terminalsCount: this.salesTerminalRecords.filter(t => t.salesPointId === sp.id).length } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.salesPointRecords.push(record);
        return { ...record };
      }
    };
  }

  public get salesTerminal() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.salesTerminalRecords];
        if (args?.where?.salesPointId) list = list.filter(st => st.salesPointId === args.where.salesPointId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'ONLINE',
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.salesTerminalRecords.push(record);
        return { ...record };
      }
    };
  }

  public get salesPartner() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.salesPartnerRecords];
        if (args?.where?.status) list = list.filter(p => p.status === args.where.status);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const p = this.salesPartnerRecords.find(x => x.id === args.where.id);
        return p ? { ...p } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `spart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'ACTIVE',
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.salesPartnerRecords.push(record);
        return { ...record };
      }
    };
  }

  // ==========================================
  // GETTERS: CORTESIAS (FASE 1.2.7)
  // ==========================================

  public get complimentaryCategory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.complimentaryCategoryRecords];
        if (args?.where?.active !== undefined) list = list.filter(c => c.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id && !args?.where?.code) return null;
        const c = this.complimentaryCategoryRecords.find(x => (args.where.id && x.id === args.where.id) || (args.where.code && x.code === args.where.code));
        return c ? { ...c } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `cc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date()
        };
        this.complimentaryCategoryRecords.push(record);
        return { ...record };
      }
    };
  }

  public get complimentaryQuota() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.complimentaryQuotaRecords];
        if (args?.where?.eventId) list = list.filter(q => q.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(q => q.sessionId === args.where.sessionId);
        if (args?.where?.sectionId) list = list.filter(q => q.sectionId === args.where.sectionId);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const q = this.complimentaryQuotaRecords.find(x => x.id === args.where.id);
        return q ? { ...q } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `cq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          quantityUsed: 0,
          quantityReserved: 0,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.complimentaryQuotaRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.complimentaryQuotaRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Cota de cortesia não encontrada');
        const updated = { ...this.complimentaryQuotaRecords[idx], ...args.data, updatedAt: new Date() };
        this.complimentaryQuotaRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get complimentaryRequest() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.complimentaryRequestRecords];
        if (args?.where?.eventId) list = list.filter(r => r.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(r => r.status === args.where.status);
        if (args?.where?.sessionId) list = list.filter(r => r.sessionId === args.where.sessionId);

        return list.map(r => {
          const copy = { ...r };
          if (args?.include?.guests) {
            copy.guests = this.complimentaryGuestRecords.filter(g => g.requestId === r.id);
          }
          return copy;
        });
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id && !args?.where?.code) return null;
        const r = this.complimentaryRequestRecords.find(x => (args.where.id && x.id === args.where.id) || (args.where.code && x.code === args.where.code));
        if (!r) return null;
        const copy = { ...r };
        if (args?.include?.guests) {
          copy.guests = this.complimentaryGuestRecords.filter(g => g.requestId === r.id);
        }
        return copy;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          code: args.data.code || `SOL-${Math.floor(100000 + Math.random() * 900000)}`,
          quantityIssued: 0,
          status: 'SUBMITTED',
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.complimentaryRequestRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.complimentaryRequestRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Solicitação de cortesia não encontrada');
        const updated = { ...this.complimentaryRequestRecords[idx], ...args.data, updatedAt: new Date() };
        this.complimentaryRequestRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get complimentaryGuest() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.complimentaryGuestRecords];
        if (args?.where?.requestId) list = list.filter(g => g.requestId === args.where.requestId);
        return list;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `cg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          issued: false,
          ...args.data,
          createdAt: new Date()
        };
        this.complimentaryGuestRecords.push(record);
        return { ...record };
      },
      createMany: async (args: any) => {
        let count = 0;
        for (const item of (args.data || [])) {
          this.complimentaryGuestRecords.push({
            id: item.id || `cg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            issued: false,
            ...item,
            createdAt: new Date()
          });
          count++;
        }
        return { count };
      },
      update: async (args: any) => {
        const idx = this.complimentaryGuestRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Convidado não encontrado');
        const updated = { ...this.complimentaryGuestRecords[idx], ...args.data };
        this.complimentaryGuestRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  // ==========================================
  // GETTERS: EQUIPE DO EVENTO (FASE 1.2.7)
  // ==========================================

  public get eventTeam() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTeamRecords];
        if (args?.where?.eventId) list = list.filter(t => t.eventId === args.where.eventId);
        if (args?.where?.active !== undefined) list = list.filter(t => t.active === args.where.active);

        return list.map(t => {
          const members = this.eventTeamMemberRecords.filter(m => m.teamId === t.id);
          const leader = members.find(m => m.id === t.leaderMemberId);
          return {
            ...t,
            memberCount: members.length,
            leaderName: leader?.name || null
          };
        });
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const t = this.eventTeamRecords.find(x => x.id === args.where.id);
        return t ? { ...t } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventTeamRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventTeamRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Equipe não encontrada');
        const updated = { ...this.eventTeamRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventTeamRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventTeamMember() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTeamMemberRecords];
        if (args?.where?.eventId) list = list.filter(m => m.eventId === args.where.eventId);
        if (args?.where?.teamId) list = list.filter(m => m.teamId === args.where.teamId);
        if (args?.where?.active !== undefined) list = list.filter(m => m.active === args.where.active);

        return list.map(m => {
          const team = this.eventTeamRecords.find(t => t.id === m.teamId);
          return {
            ...m,
            teamName: team?.name || null
          };
        });
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const m = this.eventTeamMemberRecords.find(x => x.id === args.where.id);
        return m ? { ...m } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventTeamMemberRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventTeamMemberRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Membro de equipe não encontrado');
        const updated = { ...this.eventTeamMemberRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventTeamMemberRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventTeamShift() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTeamShiftRecords];
        if (args?.where?.eventId) list = list.filter(s => s.eventId === args.where.eventId);
        if (args?.where?.teamId) list = list.filter(s => s.teamId === args.where.teamId);
        if (args?.where?.sessionId) list = list.filter(s => s.sessionId === args.where.sessionId);

        return list.map(s => {
          const assignments = this.eventShiftAssignmentRecords.filter(sa => sa.shiftId === s.id);
          const memberIds = assignments.map(sa => sa.memberId);
          const members = this.eventTeamMemberRecords.filter(m => memberIds.includes(m.id));
          const team = this.eventTeamRecords.find(t => t.id === s.teamId);
          const session = this.eventSessionRecords.find(ses => ses.id === s.sessionId);
          return {
            ...s,
            teamName: team?.name || null,
            sessionName: session?.name || null,
            assignedMemberIds: memberIds,
            assignedMembers: members
          };
        });
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const s = this.eventTeamShiftRecords.find(x => x.id === args.where.id);
        return s ? { ...s } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventTeamShiftRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventTeamShiftRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Turno não encontrado');
        const updated = { ...this.eventTeamShiftRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventTeamShiftRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventShiftAssignment() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventShiftAssignmentRecords];
        if (args?.where?.shiftId) list = list.filter(sa => sa.shiftId === args.where.shiftId);
        if (args?.where?.memberId) list = list.filter(sa => sa.memberId === args.where.memberId);
        return list;
      },
      create: async (args: any) => {
        const record = { id: `sa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...args.data, createdAt: new Date() };
        this.eventShiftAssignmentRecords.push(record);
        return record;
      },
      deleteMany: async (args?: any) => {
        const before = this.eventShiftAssignmentRecords.length;
        if (args?.where?.shiftId) {
          this.eventShiftAssignmentRecords = this.eventShiftAssignmentRecords.filter(sa => sa.shiftId !== args.where.shiftId);
        }
        return { count: before - this.eventShiftAssignmentRecords.length };
      }
    };
  }

  public get eventResponsibility() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventResponsibilityRecords];
        if (args?.where?.eventId) list = list.filter(r => r.eventId === args.where.eventId);
        if (args?.where?.responsibilityType) list = list.filter(r => r.responsibilityType === args.where.responsibilityType);
        if (args?.where?.active !== undefined) list = list.filter(r => r.active === args.where.active);
        return list.map(r => ({ ...r }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const r = this.eventResponsibilityRecords.find(x => x.id === args.where.id);
        return r ? { ...r } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventResponsibilityRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventResponsibilityRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Responsabilidade não encontrada');
        const updated = { ...this.eventResponsibilityRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventResponsibilityRecords[idx] = updated;
        return { ...updated };
      },
      deleteMany: async (args: any) => {
        const initial = this.eventResponsibilityRecords.length;
        if (args?.where?.id) {
          this.eventResponsibilityRecords = this.eventResponsibilityRecords.filter(r => r.id !== args.where.id);
        } else if (args?.where?.eventId) {
          this.eventResponsibilityRecords = this.eventResponsibilityRecords.filter(r => r.eventId !== args.where.eventId);
        }
        return { count: initial - this.eventResponsibilityRecords.length };
      }
    };
  }

  // ==========================================
  // GETTERS: DOCUMENTOS & READINESS (FASE 1.2.8)
  // ==========================================

  public get eventDocumentRequirement() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventDocumentRequirementRecords];
        if (args?.where?.eventId) list = list.filter(r => r.eventId === args.where.eventId);
        if (args?.where?.categoryCode) list = list.filter(r => r.categoryCode === args.where.categoryCode);
        if (args?.where?.status) list = list.filter(r => r.status === args.where.status);
        return list.map(r => ({ ...r }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const r = this.eventDocumentRequirementRecords.find(x => x.id === args.where.id);
        return r ? { ...r } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `edr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'MISSING',
          required: true,
          blocking: true,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventDocumentRequirementRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventDocumentRequirementRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Requisito documental não encontrado');
        const updated = { ...this.eventDocumentRequirementRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventDocumentRequirementRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get readinessCheckDefinition() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.readinessCheckDefinitionRecords];
        if (args?.where?.active !== undefined) list = list.filter(c => c.active === args.where.active);
        return list;
      },
      findUnique: async (args: any) => {
        if (!args?.where?.code) return null;
        const c = this.readinessCheckDefinitionRecords.find(x => x.code === args.where.code);
        return c ? { ...c } : null;
      },
      create: async (args: any) => {
        const record = { id: `rcd_${Date.now()}`, active: true, ...args.data, createdAt: new Date() };
        this.readinessCheckDefinitionRecords.push(record);
        return record;
      }
    };
  }

  public get readinessSnapshot() {
    return {
      findUnique: async (args: any) => {
        if (!args?.where?.eventId) return null;
        const s = this.readinessSnapshotRecords.find(x => x.eventId === args.where.eventId);
        return s ? { ...s } : null;
      },
      upsert: async (args: any) => {
        const idx = this.readinessSnapshotRecords.findIndex(x => x.eventId === args.where?.eventId);
        if (idx !== -1) {
          const updated = { ...this.readinessSnapshotRecords[idx], ...args.update, evaluatedAt: new Date() };
          this.readinessSnapshotRecords[idx] = updated;
          return { ...updated };
        } else {
          const record = { id: `rsnap_${Date.now()}`, eventId: args.where.eventId, ...args.create, evaluatedAt: new Date() };
          this.readinessSnapshotRecords.push(record);
          return { ...record };
        }
      }
    };
  }

  public get eventTask() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventTaskRecords];
        if (args?.where?.eventId) list = list.filter(t => t.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(t => t.status === args.where.status);
        if (args?.where?.origin) list = list.filter(t => t.origin === args.where.origin);
        return list.map(t => ({ ...t }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const t = this.eventTaskRecords.find(x => x.id === args.where.id);
        return t ? { ...t } : null;
      },
      findFirst: async (args: any) => {
        let list = [...this.eventTaskRecords];
        if (args?.where?.eventId) list = list.filter(t => t.eventId === args.where.eventId);
        if (args?.where?.deduplicationKey) list = list.filter(t => t.deduplicationKey === args.where.deduplicationKey);
        if (args?.where?.status) list = list.filter(t => t.status === args.where.status);
        return list.length > 0 ? { ...list[0] } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'OPEN',
          priority: 'MEDIUM',
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventTaskRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventTaskRecords.findIndex(t => t.id === args.where?.id);
        if (idx === -1) throw new Error('Tarefa não encontrada');
        const updated = { ...this.eventTaskRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventTaskRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventReviewSnapshot() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventReviewSnapshotRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        if (args?.orderBy?.submittedAt === 'desc') list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        return list.map(x => ({ ...x }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const x = this.eventReviewSnapshotRecords.find(item => item.id === args.where.id);
        return x ? { ...x } : null;
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventReviewSnapshotRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        if (args?.orderBy?.submittedAt === 'desc') list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        return list.length > 0 ? { ...list[0] } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `rsnap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'VALID',
          ...args.data,
          submittedAt: args.data.submittedAt ? new Date(args.data.submittedAt) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.eventReviewSnapshotRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventReviewSnapshotRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Snapshot de revisão não encontrado');
        const updated = { ...this.eventReviewSnapshotRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventReviewSnapshotRecords[idx] = updated;
        return { ...updated };
      },
      updateMany: async (args: any) => {
        let count = 0;
        this.eventReviewSnapshotRecords = this.eventReviewSnapshotRecords.map(x => {
          if ((!args?.where?.eventId || x.eventId === args.where.eventId) &&
              (!args?.where?.status || x.status === args.where.status)) {
            count++;
            return { ...x, ...args.data, updatedAt: new Date() };
          }
          return x;
        });
        return { count };
      }
    };
  }

  public get eventPublicationSchedule() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventPublicationScheduleRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.map(x => ({ ...x }));
      },
      findUnique: async (args: any) => {
        if (!args?.where?.id) return null;
        const x = this.eventPublicationScheduleRecords.find(item => item.id === args.where.id);
        return x ? { ...x } : null;
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventPublicationScheduleRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.length > 0 ? { ...list[0] } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `pub_sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'PENDING',
          timezone: 'America/Sao_Paulo',
          ...args.data,
          scheduledAt: new Date(args.data.scheduledAt),
          createdAt: new Date()
        };
        this.eventPublicationScheduleRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventPublicationScheduleRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Agendamento de publicação não encontrado');
        const updated = { ...this.eventPublicationScheduleRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventPublicationScheduleRecords[idx] = updated;
        return { ...updated };
      },
      delete: async (args: any) => {
        const idx = this.eventPublicationScheduleRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Agendamento de publicação não encontrado');
        const deleted = this.eventPublicationScheduleRecords.splice(idx, 1)[0];
        return { ...deleted };
      }
    };
  }

  public get eventChangeRequest() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventChangeRequestRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        if (args?.where?.classification) list = list.filter(x => x.classification === args.where.classification);
        if (args?.orderBy?.requestedAt === 'desc' || args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt || b.requestedAt).getTime() - new Date(a.createdAt || a.requestedAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      findUnique: async (args: any) => {
        if (args?.where?.id) {
          const x = this.eventChangeRequestRecords.find(item => item.id === args.where.id);
          return x ? { ...x } : null;
        }
        if (args?.where?.publicCode) {
          const x = this.eventChangeRequestRecords.find(item => item.publicCode === args.where.publicCode);
          return x ? { ...x } : null;
        }
        return null;
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventChangeRequestRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.length > 0 ? { ...list[0] } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'DRAFT',
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.eventChangeRequestRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventChangeRequestRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Solicitação de alteração não encontrada');
        const updated = { ...this.eventChangeRequestRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventChangeRequestRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get eventDashboardSnapshot() {
    return {
      findUnique: async (args: any) => {
        const s = this.eventDashboardSnapshotRecords.find(x => x.id === args.where?.id || (x.eventId === args.where?.eventId && (!args.where?.sessionId || x.sessionId === args.where.sessionId)));
        return s ? { ...s } : null;
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventDashboardSnapshotRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        return list.length > 0 ? { ...list[0] } : null;
      },
      upsert: async (args: any) => {
        const idx = this.eventDashboardSnapshotRecords.findIndex(x => x.eventId === args.where?.eventId && (!args.where?.sessionId || x.sessionId === args.where.sessionId));
        if (idx !== -1) {
          const updated = { ...this.eventDashboardSnapshotRecords[idx], ...args.update, generatedAt: new Date() };
          this.eventDashboardSnapshotRecords[idx] = updated;
          return { ...updated };
        } else {
          const record = { id: `dash_snap_${Date.now()}`, ...args.create, generatedAt: new Date() };
          this.eventDashboardSnapshotRecords.push(record);
          return { ...record };
        }
      }
    };
  }

  public get eventOperationSession() {
    return {
      findUnique: async (args: any) => {
        if (args?.where?.id) {
          const x = this.eventOperationSessionRecords.find(item => item.id === args.where.id);
          return x ? { ...x } : null;
        }
        if (args?.where?.eventId_sessionId) {
          const x = this.eventOperationSessionRecords.find(item =>
            item.eventId === args.where.eventId_sessionId.eventId &&
            item.sessionId === args.where.eventId_sessionId.sessionId
          );
          return x ? { ...x } : null;
        }
        return null;
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventOperationSessionRecords];
        if (args?.where?.id) list = list.filter(x => x.id === args.where.id);
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.length > 0 ? { ...list[0] } : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.eventOperationSessionRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `ops_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'PREPARATION',
          version: args.data.version || 1,
          sequence: args.data.sequence || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.eventOperationSessionRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventOperationSessionRecords.findIndex(x =>
          x.id === args.where?.id ||
          (args.where?.eventId_sessionId && x.eventId === args.where.eventId_sessionId.eventId && x.sessionId === args.where.eventId_sessionId.sessionId)
        );
        if (idx === -1) throw new Error('Sessão operacional não encontrada');
        const updated = { ...this.eventOperationSessionRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventOperationSessionRecords[idx] = updated;
        return { ...updated };
      },
      upsert: async (args: any) => {
        const idx = this.eventOperationSessionRecords.findIndex(x =>
          x.id === args.where?.id ||
          (args.where?.eventId_sessionId && x.eventId === args.where.eventId_sessionId.eventId && x.sessionId === args.where.eventId_sessionId.sessionId)
        );
        if (idx !== -1) {
          const updated = { ...this.eventOperationSessionRecords[idx], ...args.update, updatedAt: new Date() };
          this.eventOperationSessionRecords[idx] = updated;
          return { ...updated };
        } else {
          const record = {
            id: args.create.id || `ops_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            status: args.create.status || 'PREPARATION',
            version: args.create.version || 1,
            sequence: args.create.sequence || 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.create
          };
          this.eventOperationSessionRecords.push(record);
          return { ...record };
        }
      }
    };
  }

  public get eventOperationArea() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.eventOperationAreaRecords];
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.sessionId) list = list.filter(x => !x.sessionId || x.sessionId === args.where.sessionId);
        if (args?.where?.active !== undefined) list = list.filter(x => x.active === args.where.active);
        return list.map(x => ({ ...x }));
      },
      findFirst: async (args?: any) => {
        let list = [...this.eventOperationAreaRecords];
        if (args?.where?.id) list = list.filter(x => x.id === args.where.id);
        if (args?.where?.eventId) list = list.filter(x => x.eventId === args.where.eventId);
        if (args?.where?.areaCode) list = list.filter(x => x.areaCode === args.where.areaCode);
        return list.length > 0 ? { ...list[0] } : null;
      },
      findUnique: async (args: any) => {
        const x = this.eventOperationAreaRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `area_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: args.data.active ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.eventOperationAreaRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.eventOperationAreaRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Área operacional não encontrada');
        const updated = { ...this.eventOperationAreaRecords[idx], ...args.data, updatedAt: new Date() };
        this.eventOperationAreaRecords[idx] = updated;
        return { ...updated };
      },
      deleteMany: async (args?: any) => {
        const before = this.eventOperationAreaRecords.length;
        if (args?.where?.eventId) {
          this.eventOperationAreaRecords = this.eventOperationAreaRecords.filter(x => x.eventId !== args.where.eventId);
        }
        return { count: before - this.eventOperationAreaRecords.length };
      }
    };
  }

  public get operationShift() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.operationShiftRecords];
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.memberId) list = list.filter(x => x.memberId === args.where.memberId);
        if (args?.where?.areaId) list = list.filter(x => x.areaId === args.where.areaId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.map(x => ({ ...x }));
      },
      findFirst: async (args?: any) => {
        let list = [...this.operationShiftRecords];
        if (args?.where?.id) list = list.filter(x => x.id === args.where.id);
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.memberId) list = list.filter(x => x.memberId === args.where.memberId);
        return list.length > 0 ? { ...list[0] } : null;
      },
      findUnique: async (args: any) => {
        const x = this.operationShiftRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.operationShiftRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.operationShiftRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Turno operacional não encontrado');
        const updated = { ...this.operationShiftRecords[idx], ...args.data, updatedAt: new Date() };
        this.operationShiftRecords[idx] = updated;
        return { ...updated };
      },
      deleteMany: async (args?: any) => {
        const before = this.operationShiftRecords.length;
        if (args?.where?.operationId) {
          this.operationShiftRecords = this.operationShiftRecords.filter(x => x.operationId !== args.where.operationId);
        }
        return { count: before - this.operationShiftRecords.length };
      }
    };
  }

  public get sessionAccessPoint() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.sessionAccessPointRecords];
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        if (args?.where?.status) list = list.filter(x => x.status === args.where.status);
        return list.map(x => ({ ...x }));
      },
      findFirst: async (args?: any) => {
        let list = [...this.sessionAccessPointRecords];
        if (args?.where?.id) list = list.filter(x => x.id === args.where.id);
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.accessPointId) list = list.filter(x => x.accessPointId === args.where.accessPointId);
        return list.length > 0 ? { ...list[0] } : null;
      },
      findUnique: async (args: any) => {
        const x = this.sessionAccessPointRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `sap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'CLOSED',
          executionMode: args.data.executionMode || 'LOGICAL',
          validatedCount: args.data.validatedCount || 0,
          rejectedCount: args.data.rejectedCount || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.sessionAccessPointRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.sessionAccessPointRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Ponto de acesso da sessão não encontrado');
        const updated = { ...this.sessionAccessPointRecords[idx], ...args.data, updatedAt: new Date() };
        this.sessionAccessPointRecords[idx] = updated;
        return { ...updated };
      },
      deleteMany: async (args?: any) => {
        const before = this.sessionAccessPointRecords.length;
        if (args?.where?.operationId) {
          this.sessionAccessPointRecords = this.sessionAccessPointRecords.filter(x => x.operationId !== args.where.operationId);
        }
        return { count: before - this.sessionAccessPointRecords.length };
      }
    };
  }

  public get operationCommand() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.operationCommandRecords];
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.sessionId) list = list.filter(x => x.sessionId === args.where.sessionId);
        if (args?.where?.commandType) list = list.filter(x => x.commandType === args.where.commandType);
        if (args?.orderBy?.executedAt === 'desc' || args?.orderBy?.requestedAt === 'desc') {
          list.sort((a, b) => new Date(b.executedAt || b.requestedAt).getTime() - new Date(a.executedAt || a.requestedAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      findFirst: async (args?: any) => {
        let list = [...this.operationCommandRecords];
        if (args?.where?.idempotencyKey) list = list.filter(x => x.idempotencyKey === args.where.idempotencyKey);
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        return list.length > 0 ? { ...list[0] } : null;
      },
      findUnique: async (args: any) => {
        const x = this.operationCommandRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'SUCCESS',
          executionMode: args.data.executionMode || 'LOGICAL',
          requestedAt: new Date(),
          executedAt: new Date(),
          ...args.data
        };
        this.operationCommandRecords.push(record);
        return { ...record };
      },
      update: async (args: any) => {
        const idx = this.operationCommandRecords.findIndex(x => x.id === args.where?.id);
        if (idx === -1) throw new Error('Comando operacional não encontrado');
        const updated = { ...this.operationCommandRecords[idx], ...args.data };
        this.operationCommandRecords[idx] = updated;
        return { ...updated };
      }
    };
  }

  public get operationBroadcast() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.operationBroadcastRecords];
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.targetAreaId) list = list.filter(x => !x.targetAreaId || x.targetAreaId === args.where.targetAreaId);
        if (args?.orderBy?.sentAt === 'desc') {
          list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        }
        return list.map(x => ({
          ...x,
          receipts: this.operationBroadcastReceiptRecords.filter(r => r.broadcastId === x.id)
        }));
      },
      findUnique: async (args: any) => {
        const x = this.operationBroadcastRecords.find(item => item.id === args?.where?.id);
        if (!x) return null;
        return {
          ...x,
          receipts: this.operationBroadcastReceiptRecords.filter(r => r.broadcastId === x.id)
        };
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `bcast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          priority: args.data.priority || 'INFO',
          requiresAck: args.data.requiresAck ?? false,
          sentAt: new Date(),
          ...args.data
        };
        this.operationBroadcastRecords.push(record);
        return { ...record, receipts: [] };
      }
    };
  }

  public get operationBroadcastReceipt() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.operationBroadcastReceiptRecords];
        if (args?.where?.broadcastId) list = list.filter(x => x.broadcastId === args.where.broadcastId);
        if (args?.where?.userId) list = list.filter(x => x.userId === args.where.userId);
        return list.map(x => ({ ...x }));
      },
      findUnique: async (args: any) => {
        if (args?.where?.broadcastId_userId) {
          const x = this.operationBroadcastReceiptRecords.find(item =>
            item.broadcastId === args.where.broadcastId_userId.broadcastId &&
            item.userId === args.where.broadcastId_userId.userId
          );
          return x ? { ...x } : null;
        }
        const x = this.operationBroadcastReceiptRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          acknowledgedAt: new Date(),
          ...args.data
        };
        this.operationBroadcastReceiptRecords.push(record);
        return { ...record };
      },
      upsert: async (args: any) => {
        const idx = this.operationBroadcastReceiptRecords.findIndex(item =>
          args.where?.broadcastId_userId &&
          item.broadcastId === args.where.broadcastId_userId.broadcastId &&
          item.userId === args.where.broadcastId_userId.userId
        );
        if (idx !== -1) {
          const updated = { ...this.operationBroadcastReceiptRecords[idx], ...args.update, acknowledgedAt: new Date() };
          this.operationBroadcastReceiptRecords[idx] = updated;
          return { ...updated };
        } else {
          const record = {
            id: args.create.id || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            acknowledgedAt: new Date(),
            ...args.create
          };
          this.operationBroadcastReceiptRecords.push(record);
          return { ...record };
        }
      }
    };
  }

  public get operationHandoff() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.operationHandoffRecords];
        if (args?.where?.operationId) list = list.filter(x => x.operationId === args.where.operationId);
        if (args?.where?.areaId) list = list.filter(x => x.areaId === args.where.areaId);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      findUnique: async (args: any) => {
        const x = this.operationHandoffRecords.find(item => item.id === args?.where?.id);
        return x ? { ...x } : null;
      },
      create: async (args: any) => {
        const record = {
          id: args.data.id || `hnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          openIncidentsCount: args.data.openIncidentsCount || 0,
          openTasksCount: args.data.openTasksCount || 0,
          createdAt: new Date(),
          ...args.data
        };
        this.operationHandoffRecords.push(record);
        return { ...record };
      }
    };
  }

  // ============================================================================
  // FASE 1.2.13 — CHECK-IN, DISPOSITIVOS, REGRAS E OFFLINE
  // ============================================================================

  public get accessDevice() {
    return {
      findUnique: async (args: any) => {
        return this.accessDeviceRecords.find(x => x.id === args.where?.id || (args.where?.deviceCode && x.deviceCode === args.where.deviceCode)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.accessDeviceRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.accessDeviceRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'ACTIVE',
          type: args.data.type || 'MOBILE_APP',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.accessDeviceRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.accessDeviceRecords.findIndex(x => x.id === args.where?.id || (args.where?.deviceCode && x.deviceCode === args.where.deviceCode));
        if (idx >= 0) {
          this.accessDeviceRecords[idx] = {
            ...this.accessDeviceRecords[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return { ...this.accessDeviceRecords[idx] };
        }
        throw new Error('AccessDevice not found');
      },
      count: async (args?: any) => {
        let list = [...this.accessDeviceRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get deviceSession() {
    return {
      findUnique: async (args: any) => {
        return this.deviceSessionRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.deviceSessionRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.deviceSessionRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          startedAt: new Date(),
          isActive: true,
          validationsCount: 0,
          allowsCount: 0,
          deniesCount: 0,
          ...args.data
        };
        this.deviceSessionRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.deviceSessionRecords.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.deviceSessionRecords[idx] = {
            ...this.deviceSessionRecords[idx],
            ...args.data
          };
          return { ...this.deviceSessionRecords[idx] };
        }
        throw new Error('DeviceSession not found');
      },
      updateMany: async (args: any) => {
        let list = [...this.deviceSessionRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        for (const item of list) {
          Object.assign(item, args.data);
        }
        return { count: list.length };
      },
      count: async (args?: any) => {
        let list = [...this.deviceSessionRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get accessRule() {
    return {
      findUnique: async (args: any) => {
        return this.accessRuleRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.accessRuleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.accessRuleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ar_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: args.data.active ?? true,
          reentryPolicy: args.data.reentryPolicy || 'NO_REENTRY',
          maxReentries: args.data.maxReentries || 0,
          windowStartsBeforeMinutes: args.data.windowStartsBeforeMinutes ?? 120,
          windowEndsAfterMinutes: args.data.windowEndsAfterMinutes ?? 60,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.accessRuleRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.accessRuleRecords.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.accessRuleRecords[idx] = {
            ...this.accessRuleRecords[idx],
            ...args.data,
            updatedAt: new Date()
          };
          return { ...this.accessRuleRecords[idx] };
        }
        throw new Error('AccessRule not found');
      },
      count: async (args?: any) => {
        let list = [...this.accessRuleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get accessValidation() {
    return {
      findUnique: async (args: any) => {
        return this.accessValidationRecords.find(x => x.id === args.where?.id || (args.where?.validationRequestId && x.validationRequestId === args.where.validationRequestId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.accessValidationRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.accessValidationRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.take) list = list.slice(0, args.take);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `val_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          isOfflineProcessed: args.data.isOfflineProcessed || false,
          movementType: args.data.movementType || 'ENTRY',
          ...args.data
        };
        this.accessValidationRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.accessValidationRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get accessEntry() {
    return {
      findUnique: async (args: any) => {
        return this.accessEntryRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.accessEntryRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.accessEntryRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.accessEntryRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.accessEntryRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get ticketAccessBlock() {
    return {
      findUnique: async (args: any) => {
        return this.ticketAccessBlockRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.ticketAccessBlockRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.ticketAccessBlockRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          active: true,
          blockedAt: new Date(),
          ...args.data
        };
        this.ticketAccessBlockRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.ticketAccessBlockRecords.findIndex(x => x.id === args.where?.id || (args.where?.ticketId && x.ticketId === args.where.ticketId && x.active));
        if (idx >= 0) {
          this.ticketAccessBlockRecords[idx] = {
            ...this.ticketAccessBlockRecords[idx],
            ...args.data
          };
          return { ...this.ticketAccessBlockRecords[idx] };
        }
        throw new Error('TicketAccessBlock not found');
      },
      count: async (args?: any) => {
        let list = [...this.ticketAccessBlockRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get accessExceptionRequest() {
    return {
      findUnique: async (args: any) => {
        return this.accessExceptionRequestRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.accessExceptionRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.accessExceptionRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `axr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'PENDING',
          requestedMovement: args.data.requestedMovement || 'ENTRY',
          createdAt: new Date(),
          ...args.data
        };
        this.accessExceptionRequestRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.accessExceptionRequestRecords.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.accessExceptionRequestRecords[idx] = {
            ...this.accessExceptionRequestRecords[idx],
            ...args.data
          };
          return { ...this.accessExceptionRequestRecords[idx] };
        }
        throw new Error('AccessExceptionRequest not found');
      },
      count: async (args?: any) => {
        let list = [...this.accessExceptionRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get offlineValidationBundle() {
    return {
      findUnique: async (args: any) => {
        return this.offlineValidationBundleRecords.find(x => x.id === args.where?.id || (args.where?.bundleId && x.bundleId === args.where.bundleId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.offlineValidationBundleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.offlineValidationBundleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `bun_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          bundleId: args.data.bundleId || `bundle_${Date.now()}`,
          createdAt: new Date(),
          ...args.data
        };
        this.offlineValidationBundleRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.offlineValidationBundleRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get offlineSyncBatch() {
    return {
      findUnique: async (args: any) => {
        return this.offlineSyncBatchRecords.find(x => x.id === args.where?.id || (args.where?.batchId && x.batchId === args.where.batchId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.offlineSyncBatchRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.offlineSyncBatchRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `sbat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          batchId: args.data.batchId || `batch_${Date.now()}`,
          syncedAt: new Date(),
          ...args.data
        };
        this.offlineSyncBatchRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.offlineSyncBatchRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get offlineConflict() {
    return {
      findUnique: async (args: any) => {
        return this.offlineConflictRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.offlineConflictRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.offlineConflictRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cnf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          resolved: false,
          createdAt: new Date(),
          ...args.data
        };
        this.offlineConflictRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.offlineConflictRecords.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.offlineConflictRecords[idx] = {
            ...this.offlineConflictRecords[idx],
            ...args.data
          };
          return { ...this.offlineConflictRecords[idx] };
        }
        throw new Error('OfflineConflict not found');
      },
      count: async (args?: any) => {
        let list = [...this.offlineConflictRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  // ============================================================================
  // FASE 1.2.14 — ENCERRAMENTO, CANCELAMENTO E ARQUIVAMENTO
  // ============================================================================

  public get sessionClosureRecord() {
    return {
      findUnique: async (args: any) => {
        return this.sessionClosureRecords.find(x => x.id === args.where?.id || (args.where?.sessionId && x.sessionId === args.where.sessionId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.sessionClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.sessionClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `scls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          closedAt: new Date(),
          hadBlockerOverrides: args.data.hadBlockerOverrides || false,
          overridesCount: args.data.overridesCount || 0,
          ...args.data
        };
        this.sessionClosureRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.sessionClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get eventClosureRecord() {
    return {
      findUnique: async (args: any) => {
        return this.eventClosureRecords.find(x => x.id === args.where?.id || (args.where?.eventId && x.eventId === args.where.eventId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.eventClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.eventClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ecls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          closedAt: new Date(),
          hadBlockerOverrides: args.data.hadBlockerOverrides || false,
          overridesCount: args.data.overridesCount || 0,
          ...args.data
        };
        this.eventClosureRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.eventClosureRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get eventClosureSnapshot() {
    return {
      findUnique: async (args: any) => {
        return this.eventClosureSnapshotRecords.find(x => x.id === args.where?.id || (args.where?.eventId && x.eventId === args.where.eventId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.eventClosureSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.eventClosureSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `esnap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          closedAt: new Date(),
          createdAt: new Date(),
          ...args.data
        };
        this.eventClosureSnapshotRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.eventClosureSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get closureOverride() {
    return {
      findUnique: async (args: any) => {
        return this.closureOverrideRecords.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.closureOverrideRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.closureOverrideRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `ovr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          ...args.data
        };
        this.closureOverrideRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.closureOverrideRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get eventCancellationRequest() {
    return {
      findUnique: async (args: any) => {
        return this.eventCancellationRequestRecords.find(x => x.id === args.where?.id || (args.where?.eventId && x.eventId === args.where.eventId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.eventCancellationRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.eventCancellationRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.requestedAt === 'desc') {
          list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cncr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: args.data.status || 'DRAFT',
          requestedAt: new Date(),
          isPartialSession: args.data.isPartialSession || false,
          notifyCustomers: args.data.notifyCustomers ?? true,
          ...args.data
        };
        this.eventCancellationRequestRecords.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const idx = this.eventCancellationRequestRecords.findIndex(x => x.id === args.where?.id);
        if (idx >= 0) {
          this.eventCancellationRequestRecords[idx] = {
            ...this.eventCancellationRequestRecords[idx],
            ...args.data
          };
          return { ...this.eventCancellationRequestRecords[idx] };
        }
        throw new Error('EventCancellationRequest not found');
      },
      count: async (args?: any) => {
        let list = [...this.eventCancellationRequestRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get cancellationImpactSnapshot() {
    return {
      findUnique: async (args: any) => {
        return this.cancellationImpactSnapshotRecords.find(x => x.id === args.where?.id || (args.where?.eventId && x.eventId === args.where.eventId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.cancellationImpactSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.cancellationImpactSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `cis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          calculatedAt: new Date(),
          ...args.data
        };
        this.cancellationImpactSnapshotRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.cancellationImpactSnapshotRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get eventArchiveRecord() {
    return {
      findUnique: async (args: any) => {
        return this.eventArchiveRecords.find(x => x.id === args.where?.id || (args.where?.eventId && x.eventId === args.where.eventId)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.eventArchiveRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.eventArchiveRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.archivedAt === 'desc') {
          list.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = {
          id: args.data.id || `arc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          archivedAt: new Date(),
          readOnlyEnforced: true,
          ...args.data
        };
        this.eventArchiveRecords.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.eventArchiveRecords];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
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

  // Fase 1.3.3 & 1.3.4 — CRM B2B & Oportunidades
  public get commercialAccount() {
    return {
      findUnique: async (args: any) => {
        return this.commercialAccounts.find(x => x.id === args.where?.id || x.producerId === args.where?.producerId) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.commercialAccounts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialAccounts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cacc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, version: 1, createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.commercialAccounts.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialAccounts.find(x => x.id === args.where?.id || x.producerId === args.where?.producerId);
        if (!item) throw new Error('CommercialAccount not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      },
      upsert: async (args: any) => {
        const item = this.commercialAccounts.find(x => x.id === args.where?.id || x.producerId === args.where?.producerId);
        if (item) {
          Object.assign(item, args.update, { updatedAt: new Date() });
          return { ...item };
        }
        const created = { id: `cacc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, version: 1, createdAt: new Date(), updatedAt: new Date(), ...args.create };
        this.commercialAccounts.push(created);
        return { ...created };
      },
      count: async (args?: any) => {
        let list = [...this.commercialAccounts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get commercialPortfolioAssignment() {
    return {
      findUnique: async (args: any) => {
        return this.commercialPortfolioAssignments.find(x => x.id === args.where?.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.commercialPortfolioAssignments];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialPortfolioAssignments];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cpa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, createdAt: new Date(), ...args.data };
        this.commercialPortfolioAssignments.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialPortfolioAssignments.find(x => x.id === args.where?.id);
        if (!item) throw new Error('CommercialPortfolioAssignment not found');
        Object.assign(item, args.data);
        return { ...item };
      },
      delete: async (args: any) => {
        const idx = this.commercialPortfolioAssignments.findIndex(x => x.id === args.where?.id);
        if (idx !== -1) {
          const removed = this.commercialPortfolioAssignments.splice(idx, 1);
          return removed[0];
        }
        return null;
      }
    };
  }

  public get producerContact() {
    return {
      findUnique: async (args: any) => {
        return this.producerContacts.find(x => x.id === args.where?.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.producerContacts];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `pcon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.producerContacts.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.producerContacts.find(x => x.id === args.where?.id);
        if (!item) throw new Error('ProducerContact not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      },
      delete: async (args: any) => {
        const idx = this.producerContacts.findIndex(x => x.id === args.where?.id);
        if (idx !== -1) {
          const removed = this.producerContacts.splice(idx, 1);
          return removed[0];
        }
        return null;
      }
    };
  }

  public get commercialLead() {
    return {
      findUnique: async (args: any) => {
        return this.commercialLeads.find(x => x.id === args.where?.id || (args.where?.document && x.document === args.where?.document)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.commercialLeads];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialLeads];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, version: 1, status: args.data.status || 'NEW', createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.commercialLeads.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialLeads.find(x => x.id === args.where?.id);
        if (!item) throw new Error('CommercialLead not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.commercialLeads];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get commercialActivity() {
    return {
      findUnique: async (args: any) => {
        return this.commercialActivities.find(x => x.id === args.where?.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialActivities];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(b.occurredAt || b.createdAt).getTime() - new Date(a.occurredAt || a.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, occurredAt: args.data.occurredAt || new Date(), createdAt: new Date(), ...args.data };
        this.commercialActivities.push(item);
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.commercialActivities];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get commercialPipeline() {
    return {
      findUnique: async (args: any) => {
        const p = this.commercialPipelines.find(x => x.id === args.where?.id || (args.where?.isDefault && x.isDefault));
        if (!p) return null;
        const copy = { ...p };
        if (args?.include?.stages) {
          copy.stages = this.commercialPipelineStages
            .filter(s => s.pipelineId === p.id && s.active)
            .sort((a, b) => a.position - b.position);
        }
        return copy;
      },
      findFirst: async (args?: any) => {
        let list = [...this.commercialPipelines];
        if (args?.where) list = this.filterEntities(list, args.where);
        const p = list[0] || null;
        if (!p) return null;
        const copy = { ...p };
        if (args?.include?.stages) {
          copy.stages = this.commercialPipelineStages
            .filter(s => s.pipelineId === p.id && s.active)
            .sort((a, b) => a.position - b.position);
        }
        return copy;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialPipelines];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.map(p => {
          const copy = { ...p };
          if (args?.include?.stages) {
            copy.stages = this.commercialPipelineStages
              .filter(s => s.pipelineId === p.id && s.active)
              .sort((a, b) => a.position - b.position);
          }
          return copy;
        });
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `pip_${Date.now()}`, version: 1, active: true, createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.commercialPipelines.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialPipelines.find(x => x.id === args.where?.id);
        if (!item) throw new Error('CommercialPipeline not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      }
    };
  }

  public get commercialPipelineStage() {
    return {
      findUnique: async (args: any) => {
        return this.commercialPipelineStages.find(x => x.id === args.where?.id || (args.where?.pipelineId && args.where?.code && x.pipelineId === args.where.pipelineId && x.code === args.where.code)) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.commercialPipelineStages];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialPipelineStages];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => a.position - b.position);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `stg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, active: true, createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.commercialPipelineStages.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialPipelineStages.find(x => x.id === args.where?.id);
        if (!item) throw new Error('CommercialPipelineStage not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      }
    };
  }

  public get commercialOpportunity() {
    return {
      findUnique: async (args: any) => {
        const o = this.commercialOpportunities.find(x => x.id === args.where?.id || x.publicCode === args.where?.publicCode);
        return o ? { ...o } : null;
      },
      findFirst: async (args: any) => {
        let list = [...this.commercialOpportunities];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] ? { ...list[0] } : null;
      },
      findMany: async (args?: any) => {
        let list = [...this.commercialOpportunities];
        if (args?.where) list = this.filterEntities(list, args.where);
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map(x => ({ ...x }));
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `opp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, version: 1, status: args.data.status || 'OPEN', createdAt: new Date(), updatedAt: new Date(), ...args.data };
        this.commercialOpportunities.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.commercialOpportunities.find(x => x.id === args.where?.id || x.publicCode === args.where?.publicCode);
        if (!item) throw new Error('CommercialOpportunity not found');
        if (args.where?.version !== undefined && item.version !== args.where.version) {
          throw new Error('Conflito de versão (409)');
        }
        Object.assign(item, args.data, { version: (item.version || 1) + 1, updatedAt: new Date() });
        return { ...item };
      },
      delete: async (args: any) => {
        const idx = this.commercialOpportunities.findIndex(x => x.id === args.where?.id || x.publicCode === args.where?.publicCode);
        if (idx >= 0) return this.commercialOpportunities.splice(idx, 1)[0];
        return null;
      },
      count: async (args?: any) => {
        let list = [...this.commercialOpportunities];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get opportunityStageHistory() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.opportunityStageHistories];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `osh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, changedAt: new Date(), ...args.data };
        this.opportunityStageHistories.push(item);
        return { ...item };
      }
    };
  }

  public get opportunityCloseReason() {
    return {
      findUnique: async (args: any) => {
        return this.opportunityCloseReasons.find(x => x.id === args.where?.id || x.code === args.where?.code) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.opportunityCloseReasons];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `cr_${Date.now()}`, active: true, sortOrder: args.data.sortOrder || 0, ...args.data };
        this.opportunityCloseReasons.push(item);
        return { ...item };
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
        const o = this.orders.find(x => x.id === args.where.id || x.publicCode === args.where.publicCode || x.orderNumber === args.where.orderNumber || x.orderNumberNormalized === args.where.orderNumberNormalized);
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
        const item = {
          id: args.data.id || `ord_${Date.now()}`,
          version: args.data.version || 1,
          status: args.data.status || 'CONFIRMED',
          currency: args.data.currency || 'BRL',
          subtotalAmount: args.data.subtotalAmount || 0,
          discountAmount: args.data.discountAmount || 0,
          feeAmount: args.data.feeAmount || 0,
          totalAmount: args.data.totalAmount || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        this.orders.push(item);
        return { ...item };
      },
      update: async (args: any) => {
        const item = this.orders.find(x => x.id === args.where.id || x.publicCode === args.where.publicCode);
        if (!item) throw new Error('Order not found');
        Object.assign(item, args.data, { updatedAt: new Date() });
        return { ...item };
      },
      count: async (args?: any) => {
        let list = [...this.orders];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get orderItem() {
    return {
      findUnique: async (args: any) => {
        return this.orderItems.find(x => x.id === args.where.id) || null;
      },
      findFirst: async (args: any) => {
        let list = [...this.orderItems];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list[0] || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.orderItems];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `oit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, createdAt: new Date(), ...args.data };
        this.orderItems.push(item);
        return { ...item };
      },
      createMany: async (args: any) => {
        const items = (args.data || []).map((d: any) => ({
          id: d.id || `oit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          ...d
        }));
        this.orderItems.push(...items);
        return { count: items.length };
      },
      count: async (args?: any) => {
        let list = [...this.orderItems];
        if (args?.where) list = this.filterEntities(list, args.where);
        return list.length;
      }
    };
  }

  public get orderBuyerSnapshot() {
    return {
      findUnique: async (args: any) => {
        return this.orderBuyerSnapshots.find(x => x.orderId === args.where?.orderId || x.id === args.where?.id) || null;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `obs_${Date.now()}`, createdAt: new Date(), ...args.data };
        this.orderBuyerSnapshots.push(item);
        return { ...item };
      }
    };
  }

  public get orderTimelineEvent() {
    return {
      findMany: async (args?: any) => {
        let list = [...this.orderTimelineEvents];
        if (args?.where) list = this.filterEntities(list, args.where);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      },
      create: async (args: any) => {
        const item = { id: args.data.id || `ote_${Date.now()}`, createdAt: new Date(), ...args.data };
        this.orderTimelineEvents.push(item);
        return { ...item };
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
      updateMany: async (args: any) => {
        let list = [...this.tickets];
        if (args?.where) list = this.filterEntities(list, args.where);
        for (const item of list) {
          Object.assign(item, args.data);
        }
        return { count: list.length };
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
    if (include?.items) {
      copy.items = this.orderItems.filter(i => i.orderId === order.id);
    }
    if (include?.buyerSnapshot) {
      copy.buyerSnapshot = this.orderBuyerSnapshots.find(s => s.orderId === order.id) || null;
    }
    if (include?.timeline) {
      copy.timeline = this.orderTimelineEvents.filter(t => t.orderId === order.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

  private hydrateEvent(event: any, include?: any): any {
    if (!event) return null;
    const copy = { ...event };
    if (include?.eventVenues) {
      copy.eventVenues = this.eventVenueRecords.filter(ev => ev.eventId === event.id).map(ev => ({
        ...ev,
        venue: include.eventVenues.include?.venue ? this.venueRecords.find(v => v.id === ev.venueId) : undefined
      }));
    }
    if (include?.eventSections) {
      copy.eventSections = this.eventSectionRecords.filter(es => es.eventId === event.id).map(es => ({
        ...es,
        venueSection: include.eventSections.include?.venueSection ? this.venueSectionRecords.find(vs => vs.id === es.venueSectionId) : undefined
      }));
    }
    if (include?.sessions) {
      copy.sessions = this.eventSessionRecords.filter(s => s.eventId === event.id);
    }
    if (include?.category) {
      copy.category = this.eventCategoryRecords.find(c => c.id === event.categoryId);
    }
    if (include?.media) {
      copy.media = this.eventMediaRecords.filter(m => m.eventId === event.id);
    }
    if (include?.responsibilities) {
      copy.responsibilities = this.eventResponsibilityRecords.filter(r => r.eventId === event.id);
    }
    return copy;
  }

  private hydrateVenue(venue: any, include?: any): any {
    if (!venue) return null;
    const copy = { ...venue };
    if (include?.sections) {
      copy.sections = this.venueSectionRecords.filter(s => s.venueId === venue.id);
    }
    if (include?.maps) {
      copy.maps = this.venueMapRecords.filter(m => m.venueId === venue.id).map(m => {
        const mCopy = { ...m };
        if (include.maps.include?.versions) {
          mCopy.versions = this.venueMapVersionRecords.filter(v => v.mapId === m.id);
        }
        return mCopy;
      });
    }
    if (include?.accessPoints) {
      copy.accessPoints = this.venueAccessPointRecords.filter(p => p.venueId === venue.id);
    }
    if (include?.eventVenues) {
      copy.eventVenues = this.eventVenueRecords.filter(ev => ev.venueId === venue.id);
    }
    return copy;
  }

  private hydrateVenueMapVersion(version: any, include?: any): any {
    if (!version) return null;
    const copy = { ...version };
    if (include?.map) {
      copy.map = this.venueMapRecords.find(m => m.id === version.mapId);
    }
    if (include?.elements) {
      copy.elements = this.venueMapElementRecords.filter(e => e.mapVersionId === version.id);
    }
    if (include?.rows) {
      copy.rows = this.venueRowRecords.filter(r => r.mapVersionId === version.id).map(r => {
        const rCopy = { ...r };
        if (include.rows.include?.seats) {
          rCopy.seats = this.venueSeatRecords.filter(s => s.rowId === r.id);
        }
        return rCopy;
      });
    }
    if (include?.seats) {
      copy.seats = this.venueSeatRecords.filter(s => s.mapVersionId === version.id);
    }
    return copy;
  }

  private hydrateEventSession(session: any, include?: any): any {
    if (!session) return null;
    const copy = { ...session };
    if (include?.venue) {
      copy.venue = this.venueRecords.find(v => v.id === session.venueId) || null;
    }
    if (include?.mapVersion) {
      copy.mapVersion = this.venueMapVersionRecords.find(mv => mv.id === session.venueMapVersionId) || null;
    }
    if (include?.sessionSections) {
      copy.sessionSections = this.sessionSectionRecords
        .filter(ss => ss.sessionId === session.id)
        .map(ss => {
          const ssCopy = { ...ss };
          if (include.sessionSections.include?.eventSection) {
            const es = this.eventSectionRecords.find(e => e.id === ss.eventSectionId);
            ssCopy.eventSection = es ? {
              ...es,
              venueSection: this.venueSectionRecords.find(vs => vs.id === es.venueSectionId)
            } : null;
          }
          return ssCopy;
        });
    }
    if (include?.reservations) {
      copy.reservations = this.sessionCapacityReservationRecords.filter(r => r.sessionId === session.id);
    }
    return copy;
  }
}

// Global Memory Store Instance
export const memoryDb = new InMemoryPrismaStore();

// Exported Prisma Client
// Defaults to in-memory store in test / offline mode, or PrismaClient when live PostgreSQL is connected
export const prisma: any = memoryDb;
