// ==============================================================================
// DISK INTERNO - SHARED TYPES & PERMISSION TAXONOMY (v1.1.5)
// ==============================================================================

export type RoleSlug = 
  | 'admin_geral'
  | 'admin_operacional'
  | 'produtor'
  | 'financeiro'
  | 'contabilidade'
  | 'marketing'
  | 'remarketing'
  | 'comercial'
  | 'sac'
  | 'suporte_eventos'
  | 'estorno'
  | 'auditor'
  | 'personalizado';

export type ScopeType = 'GLOBAL' | 'PRODUCER' | 'EVENT';

export interface UserScope {
  type: ScopeType;
  producerIds: string[]; // empty means all if type === 'GLOBAL'
  eventIds: string[];    // empty means all if type === 'GLOBAL' or all producer events
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
  roles?: any[];
  permissions?: any[];
  scope?: {
    type?: ScopeType;
    isGlobal?: boolean;
    producerId?: string | null;
    eventId?: string | null;
    producerIds?: string[];
    eventIds?: string[];
    producers?: string[];
    events?: string[];
  };
}

export type PermissionAction = 'visualizar' | 'criar' | 'editar' | 'aprovar' | 'cancelar' | 'estornar' | 'transferir' | 'exportar' | 'administrar';

// Granular Permission String format: "module.resource.action"
export type PermissionString =
  // Eventos (Fase 1.2)
  | 'eventos.central.visualizar'
  | 'eventos.evento.visualizar'
  | 'eventos.evento.criar'
  | 'eventos.evento.editar'
  | 'eventos.evento.cancelar'
  | 'eventos.evento.historico.visualizar'
  | 'eventos.evento.publicar'
  | 'eventos.evento.pausar_vendas'
  | 'eventos.evento.encerrar'
  | 'eventos.evento.arquivar'
  | 'eventos.evento.identidade.editar'
  | 'eventos.evento.responsaveis.visualizar'
  | 'eventos.evento.responsaveis.editar'
  | 'eventos.evento.rascunho.descartar'
  | 'eventos.local.visualizar'
  | 'eventos.local.gerenciar'
  | 'eventos.sessao.visualizar'
  | 'eventos.sessao.gerenciar'
  | 'eventos.setor.visualizar'
  | 'eventos.setor.gerenciar'
  | 'eventos.ingresso.visualizar'
  | 'eventos.ingresso.gerenciar'
  | 'eventos.lote.visualizar'
  | 'eventos.lote.gerenciar'
  | 'eventos.cortesia.visualizar'
  | 'eventos.cortesia.emitir'
  | 'eventos.cortesias.emitir'
  | 'eventos.checkin.visualizar'
  | 'eventos.checkin.operar'
  | 'eventos.setores.configurar'
  | 'eventos.operacao.visualizar'
  // Comercial

  | 'comercial.produtores.visualizar'
  | 'comercial.produtores.criar'
  | 'comercial.produtores.editar'
  | 'comercial.propostas.gerenciar'
  | 'comercial.metas.visualizar'
  // Suporte Eventos
  | 'suporte.incidentes.visualizar'
  | 'suporte.incidentes.criar'
  | 'suporte.incidentes.resolver'
  | 'suporte.war_room.acessar'
  // SAC
  | 'sac.consulta.acessar'
  | 'sac.pedido.visualizar'
  | 'sac.cliente.visualizar'
  | 'sac.ticket.criar'
  | 'sac.ticket.encerrar'
  | 'sac.voucher.reenviar'
  // Estorno
  | 'estorno.solicitacao.visualizar'
  | 'estorno.solicitacao.criar'
  | 'estorno.solicitacao.aprovar'
  | 'estorno.solicitacao.executar'
  | 'estorno.chargeback.gerenciar'
  // Financeiro
  | 'financeiro.saldo.visualizar'
  | 'financeiro.transferencia.criar'
  | 'financeiro.transferencia.aprovar'
  | 'financeiro.repasses.visualizar'
  | 'financeiro.repasses.aprovar'
  | 'financeiro.pagamento.criar'
  | 'financeiro.pagamento.aprovar'
  | 'financeiro.conciliacao.executar'
  | 'financeiro.relatorio.exportar'
  // Contabilidade
  | 'contabilidade.diario.visualizar'
  | 'contabilidade.lancamento.criar'
  | 'contabilidade.dre.visualizar'
  | 'contabilidade.balancete.visualizar'
  | 'contabilidade.fechamento.executar'
  // Marketing
  | 'marketing.campanha.visualizar'
  | 'marketing.campanha.criar'
  | 'marketing.campanha.publicar'
  | 'marketing.pixel.configurar'
  // Remarketing
  | 'remarketing.carrinhos.visualizar'
  | 'remarketing.regua.configurar'
  | 'remarketing.mensagem.disparar'
  // Administração
  | 'admin.usuarios.visualizar'
  | 'admin.usuarios.gerenciar'
  | 'admin.perfis.gerenciar'
  | 'admin.auditoria.visualizar'
  | 'admin.configuracoes.editar'
  // Aprovações
  | 'aprovacoes.caixa.visualizar'
  | 'aprovacoes.solicitacao.visualizar'
  | 'aprovacoes.solicitacao.criar'
  | 'aprovacoes.solicitacao.aprovar'
  | 'aprovacoes.solicitacao.rejeitar'
  | 'aprovacoes.solicitacao.cancelar'
  | 'aprovacoes.regra.visualizar'
  | 'aprovacoes.regra.criar'
  | 'aprovacoes.regra.editar'
  | 'aprovacoes.alcada.visualizar'
  | 'aprovacoes.alcada.editar'
  | 'aprovacoes.delegacao.criar'
  | 'aprovacoes.historico.visualizar'
  // Documentos & Anexos (Fase 1.1.5.8)
  | 'documentos.central.visualizar'
  | 'documentos.arquivo.visualizar'
  | 'documentos.arquivo.enviar'
  | 'documentos.arquivo.baixar'
  | 'documentos.versao.criar'
  | 'documentos.versao.visualizar'
  | 'documentos.arquivo.arquivar'
  | 'documentos.arquivo.excluir'
  | 'documentos.categoria.visualizar'
  | 'documentos.categoria.editar'
  | 'documentos.auditoria.visualizar'
  // Tarefas & Fluxos de Trabalho (Fase 1.1.5.9)
  | 'tarefas.central.visualizar'
  | 'tarefas.tarefa.visualizar'
  | 'tarefas.tarefa.criar'
  | 'tarefas.tarefa.editar'
  | 'tarefas.tarefa.assumir'
  | 'tarefas.tarefa.reatribuir'
  | 'tarefas.tarefa.concluir'
  | 'tarefas.tarefa.cancelar'
  | 'tarefas.tarefa.reabrir'
  | 'tarefas.equipe.visualizar'
  | 'tarefas.equipe.gerenciar'
  | 'tarefas.workflow.visualizar'
  | 'tarefas.workflow.criar'
  | 'tarefas.workflow.editar'
  | 'tarefas.workflow.gerenciar'
  | 'tarefas.sla.visualizar'
  | 'tarefas.sla.configurar'
  | 'tarefas.dashboard.visualizar'
  // Configurações & Políticas (Fase 1.1.5.11)
  | 'configuracoes.central.visualizar'
  | 'configuracoes.parametro.visualizar'
  | 'configuracoes.parametro.editar'
  | 'configuracoes.politica.visualizar'
  | 'configuracoes.politica.criar'
  | 'configuracoes.politica.editar'
  | 'configuracoes.politica.ativar'
  | 'configuracoes.simulador.utilizar'
  | 'configuracoes.versao.visualizar'
  | 'configuracoes.rollback.executar'
  | 'configuracoes.feature_flag.visualizar'
  | 'configuracoes.feature_flag.editar'
  | 'configuracoes.historico.visualizar'
  // Auditoria & Observabilidade (Fase 1.1.5.12)
  | 'auditoria.central.visualizar'
  | 'auditoria.registro.visualizar'
  | 'auditoria.detalhe.visualizar'
  | 'auditoria.exportacao.criar'
  | 'observabilidade.dashboard.visualizar'
  | 'observabilidade.trace.visualizar'
  | 'observabilidade.erro.visualizar'
  | 'observabilidade.erro.detalhe_tecnico'
  | 'observabilidade.performance.visualizar'
  | 'observabilidade.fila.visualizar'
  | 'observabilidade.worker.visualizar'
  | 'observabilidade.integracao.visualizar'
  | 'observabilidade.seguranca.visualizar'
  | 'observabilidade.saude.visualizar'
  // Relatórios, Exportações e BI Operacional (Fase 1.1.5.13)
  | 'relatorios.central.visualizar'
  | 'relatorios.relatorio.visualizar'
  | 'relatorios.relatorio.criar'
  | 'relatorios.relatorio.editar'
  | 'relatorios.relatorio.excluir'
  | 'relatorios.relatorio.compartilhar'
  | 'relatorios.exportacao.criar'
  | 'relatorios.exportacao.baixar'
  | 'relatorios.agendamento.criar'
  | 'relatorios.agendamento.editar'
  | 'relatorios.agendamento.excluir'
  | 'relatorios.indicador.visualizar'
  | 'relatorios.dashboard.personalizar'
  | 'relatorios.dados_sensiveis.visualizar'
  | 'relatorios.administracao.gerenciar'
  | 'relatorios.vendas.visualizar'
  | 'relatorios.financeiro.visualizar'
  | 'relatorios.contabilidade.visualizar'
  | 'relatorios.marketing.visualizar'
  | 'relatorios.sac.visualizar'
  | 'relatorios.eventos.visualizar'
  // Processamentos, Jobs & Orquestração (Fase 1.1.5.14)
  | 'processamentos.central.visualizar'
  | 'processamentos.job.visualizar'
  | 'processamentos.job.cancelar'
  | 'processamentos.job.pausar'
  | 'processamentos.job.retomar'
  | 'processamentos.job.reprocessar'
  | 'processamentos.lote.visualizar'
  | 'processamentos.lote.executar'
  | 'processamentos.lote.cancelar'
  | 'processamentos.agendamento.visualizar'
  | 'processamentos.agendamento.criar'
  | 'processamentos.agendamento.editar'
  | 'processamentos.agendamento.desativar'
  | 'processamentos.fila.visualizar'
  | 'processamentos.worker.visualizar'
  | 'processamentos.dead_letter.visualizar'
  | 'processamentos.dead_letter.reprocessar'
  // Dados, Importações, Migração e Qualidade (Fase 1.1.5.15)
  | 'dados.central.visualizar'
  | 'dados.importacao.visualizar'
  | 'dados.importacao.criar'
  | 'dados.importacao.executar'
  | 'dados.importacao.cancelar'
  | 'dados.importacao.reprocessar'
  | 'dados.mapeamento.visualizar'
  | 'dados.mapeamento.criar'
  | 'dados.mapeamento.editar'
  | 'dados.modelo.visualizar'
  | 'dados.modelo.baixar'
  | 'dados.qualidade.visualizar'
  | 'dados.qualidade.gerenciar'
  | 'dados.duplicidade.visualizar'
  | 'dados.duplicidade.resolver'
  | 'dados.migracao.visualizar'
  | 'dados.migracao.criar'
  | 'dados.migracao.executar'
  | 'dados.rollback.executar'
  | 'dados.historico.visualizar';

export type DocumentStatus =
  | 'PROCESSING'
  | 'AVAILABLE'
  | 'REJECTED'
  | 'QUARANTINED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'DELETED';

export type DocumentResourceType =
  | 'PRODUCER'
  | 'EVENT'
  | 'ORDER'
  | 'TICKET'
  | 'PAYMENT'
  | 'TRANSFER'
  | 'REFUND'
  | 'SUPPORT_TICKET'
  | 'SUPPLIER'
  | 'CONTRACT'
  | 'CAMPAIGN'
  | 'APPROVAL_REQUEST'
  | 'TASK';

export interface DocumentCategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  retentionDays?: number;
  isSensitive: boolean;
  allowedMimeTypes?: string;
  maxSizeBytes?: number;
  createdAt: string;
}

export interface DocumentVersionItem {
  id: string;
  documentId: string;
  version: number;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  checksumAlgorithm: string;
  checksum: string;
  changeReason?: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  createdAt: string;
}

export interface DocumentLinkItem {
  id: string;
  documentId: string;
  resourceType: DocumentResourceType;
  resourceId: string;
  producerId?: string;
  eventId?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  organizationId?: string;
  producerId?: string;
  eventId?: string;
  title: string;
  description?: string;
  categoryId: string;
  category?: DocumentCategoryItem;
  status: DocumentStatus;
  isConfidential: boolean;
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
  creatorName?: string;
  currentVersionId?: string;
  currentVersion?: DocumentVersionItem;
  versions?: DocumentVersionItem[];
  links?: DocumentLinkItem[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'blocked';
  roleSlug: RoleSlug;
  roleName: string;
  organization: string; // e.g. "DiskIngressos Matriz" or "Opus Entretenimento"
  isInternalStaff: boolean; // true for DiskIngressos staff, false for external Producers
  scope: UserScope;
  twoFactorEnabled: boolean;
  twoFactorEnforced: boolean;
  permissions: PermissionString[]; // Effective permissions (Role defaults + custom overrides)
  lastLoginAt?: string;
  lastIpAddress?: string;
  createdAt: string;
}

export interface RoleDefinition {
  slug: RoleSlug;
  name: string;
  description: string;
  isSystem: boolean;
  defaultScopeType: ScopeType;
  defaultPermissions: PermissionString[];
  requiresTwoFactor: boolean;
}

// ============================================================================
// FASE 1.1.5.9 — MOTOR CENTRAL DE TAREFAS, PENDÊNCIAS E FLUXOS DE TRABALHO
// ============================================================================

export type TaskStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type TaskModule =
  | 'FINANCEIRO'
  | 'SAC'
  | 'EVENTOS'
  | 'ESTORNO'
  | 'CONTABILIDADE'
  | 'MARKETING'
  | 'COMERCIAL'
  | 'OPERACOES'
  | 'SEGURANCA'
  | 'GERAL';

export type TaskWaitingReason =
  | 'CLIENTE'
  | 'PRODUTOR'
  | 'FORNECEDOR'
  | 'BANCO'
  | 'GATEWAY'
  | 'OUTRO_DEPARTAMENTO';

export type SlaStatus =
  | 'WITHIN_SLA'
  | 'NEARING_BREACH'
  | 'BREACHED'
  | 'PAUSED';

export type UserAvailabilityStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'AWAY'
  | 'VACATION'
  | 'INACTIVE';

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  text: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedByUserId?: string;
  completedAt?: string;
  orderIndex: number;
}

export interface TaskCommentItem {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface TaskHistoryItem {
  id: string;
  taskId: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: Record<string, any> | string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  taskNumber: string;
  title: string;
  description?: string | null;
  module: TaskModule;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  waitingReason?: TaskWaitingReason | null;
  blockedReason?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  organizationId?: string | null;
  producerId?: string | null;
  producerName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  workflowId?: string | null;
  workflowRuleId?: string | null;
  templateId?: string | null;
  slaPolicyId?: string | null;
  dueAt?: string | null;
  slaStartedAt?: string | null;
  slaPausedAt?: string | null;
  slaResumedAt?: string | null;
  slaDeadline?: string | null;
  slaStatus: SlaStatus;
  totalPausedDurationMs?: number;
  estimatedMinutes?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancelReason?: string | null;
  reopenedAt?: string | null;
  reopenedByUserId?: string | null;
  reopenReason?: string | null;
  escalationLevel: number;
  createdBy: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  checklist?: TaskChecklistItem[];
  comments?: TaskCommentItem[];
  history?: TaskHistoryItem[];
  dependsOnTaskIds?: string[];
  blockingTaskIds?: string[];
}

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: 'LEADER' | 'SUPERVISOR' | 'ANALYST' | 'MEMBER';
  createdAt: string;
}

export interface TeamItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  leaderUserId?: string;
  isActive: boolean;
  members?: TeamMemberItem[];
  memberCount?: number;
  openTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRuleItem {
  id: string;
  workflowId: string;
  version: number;
  name?: string;
  conditionJson: any;
  actionJson: any;
  priority: TaskPriority;
  slaMinutes: number;
  targetTeamId?: string;
  orderIndex: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  module: TaskModule;
  triggerEvent: string;
  isActive: boolean;
  currentVersion: number;
  rules?: WorkflowRuleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SlaPolicyItem {
  id: string;
  name: string;
  module: TaskModule;
  priority: TaskPriority;
  durationMinutes: number;
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  allowPause: boolean;
  allowedPauseReasons: string[];
  createdAt: string;
}

// ==========================================
// 12. CONFIGURAÇÕES & POLÍTICAS (FASE 1.1.5.11)
// ==========================================

export type ConfigValueType =
  | 'BOOLEAN'
  | 'INTEGER'
  | 'DECIMAL'
  | 'STRING'
  | 'ENUM'
  | 'DATE'
  | 'DATETIME'
  | 'DURATION'
  | 'PERCENTAGE'
  | 'CURRENCY'
  | 'JSON_SCHEMA'
  | 'REFERENCE';

export type ConfigSensitivity = 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'SECRET_REFERENCE';

export type ConfigScopeType = 'GLOBAL' | 'PRODUCER' | 'EVENT';

export type PolicyStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type RuleOperator =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'GREATER_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_OR_EQUAL'
  | 'CONTAINS'
  | 'IN'
  | 'NOT_IN'
  | 'BETWEEN';

export type PolicyConflictStatus = 'DETECTED' | 'REVIEWED' | 'RESOLVED' | 'IGNORED';

export interface ConfigurationDefinitionItem {
  id: string;
  key: string;
  domain: string;
  name: string;
  description?: string | null;
  type: ConfigValueType;
  unit?: string | null;
  defaultValue: any;
  allowedValues?: any[] | null;
  validationSchema?: any;
  sensitivity: ConfigSensitivity;
  allowedScopes: ConfigScopeType[];
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationValueItem {
  id: string;
  definitionId: string;
  key?: string;
  scopeType: ConfigScopeType;
  producerId?: string | null;
  producerName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  value: any;
  version: number;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  updatedByUserId?: string | null;
  updatedByUserName?: string | null;
  changeReason?: string | null;
  approvalRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveConfigResult<T = any> {
  key: string;
  value: T;
  type: ConfigValueType;
  unit?: string | null;
  source: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT';
  sourceId?: string | null;
  sourceName?: string | null;
  policyVersion?: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  explanation: string;
}

export interface PolicyRuleCondition {
  field: string;
  operator: RuleOperator;
  value: any;
}

export interface PolicyRuleAction {
  decision: boolean;
  approvalsRequired?: number;
  requiredDocuments?: string[];
  stepUpRequired?: boolean;
  allowExecution?: boolean;
  slaMinutes?: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PolicyRuleItem {
  id: string;
  policyId: string;
  version: number;
  name: string;
  description?: string | null;
  priority: number;
  conditions: PolicyRuleCondition[];
  action: PolicyRuleAction;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface PolicyVersionItem {
  id: string;
  policyId: string;
  versionNumber: number;
  status: PolicyStatus;
  rulesSnapshot: PolicyRuleItem[];
  changeReason: string;
  createdBy: string;
  creatorName?: string | null;
  approvedBy?: string | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  createdAt: string;
}

export interface PolicyItem {
  id: string;
  code: string;
  name: string;
  domain: string;
  description?: string | null;
  scopeType: ConfigScopeType;
  producerId?: string | null;
  producerName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  status: PolicyStatus;
  currentVersion: number;
  priority: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  requiresApproval: boolean;
  createdBy: string;
  creatorName?: string | null;
  rules?: PolicyRuleItem[];
  versions?: PolicyVersionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PolicyConflictItem {
  id: string;
  policyAId: string;
  policyAName?: string;
  policyBId: string;
  policyBName?: string;
  domain: string;
  conflictType: 'OVERLAPPING_CONDITIONS' | 'AMBIGUOUS_PRIORITY' | 'CONFLICTING_ACTIONS';
  description: string;
  status: PolicyConflictStatus;
  detectedAt: string;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolutionNotes?: string | null;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  rolloutPercentage: number;
  allowedRoles?: string[];
  allowedProducers?: string[];
  allowedEvents?: string[];
  isKillSwitch: boolean;
  killSwitchTriggeredAt?: string | null;
  killSwitchTriggeredBy?: string | null;
  killSwitchReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PolicySimulateInput {
  domain: string;
  operation: string;
  producerId?: string | null;
  eventId?: string | null;
  input: Record<string, any>;
}

export interface PolicySimulateTraceStep {
  level: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT';
  targetName?: string;
  policyFound: boolean;
  policyCode?: string;
  version?: number;
  ruleMatched?: string;
  decision?: any;
  notes: string;
}

export interface PolicySimulateResult {
  decision: boolean;
  effectivePolicy?: {
    id: string;
    code: string;
    name: string;
    version: number;
    ruleId?: string;
    ruleName?: string;
  } | null;
  scope: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT';
  requirements: {
    approvalsRequired: number;
    stepUpRequired: boolean;
    requiredDocuments: string[];
    slaMinutes?: number;
  };
  explanation: string;
  trace: PolicySimulateTraceStep[];
}

export interface ConfigAuditItem {
  id: string;
  entityType: 'CONFIGURATION' | 'POLICY' | 'FEATURE_FLAG' | 'KILL_SWITCH';
  entityId: string;
  entityKey?: string | null;
  action: string;
  scopeType: ConfigScopeType;
  producerId?: string | null;
  eventId?: string | null;
  previousValue?: any;
  newValue?: any;
  changeReason?: string | null;
  userId: string;
  userName?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ============================================================================
// 15. AUDITORIA, OBSERVABILIDADE E RASTREABILIDADE OPERACIONAL (FASE 1.1.5.12)
// ============================================================================

export type ObservabilitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ObservabilityStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';
export type TraceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type SpanStatus = 'SUCCESS' | 'ERROR' | 'WARNING';
export type ErrorGroupStatus = 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
export type SystemAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface AuditLogRecord {
  id: string;
  correlationId?: string | null;
  requestId?: string | null;
  userId?: string | null;
  userName?: string | null;
  sessionId?: string | null;
  module: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  producerId?: string | null;
  eventId?: string | null;
  beforeData?: any;
  afterData?: any;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  ipHash?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface AuditDiffField {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface BusinessEventRecord {
  id: string;
  eventType: string;
  correlationId: string;
  requestId?: string | null;
  sourceService: string;
  producerId?: string | null;
  eventId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  payload: any;
  consumers: Array<{
    service: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processedAt?: string | null;
    error?: string | null;
  }>;
  createdAt: string;
}

export interface TraceSpanRecord {
  id: string;
  traceId: string;
  correlationId: string;
  spanId: string;
  parentSpanId?: string | null;
  serviceName: string;
  operation: string;
  status: SpanStatus;
  startedAt: string;
  endedAt?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, any>;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface OperationTraceRecord {
  id: string;
  correlationId: string;
  operationName: string;
  rootResourceType?: string | null;
  rootResourceId?: string | null;
  userId?: string | null;
  userName?: string | null;
  producerId?: string | null;
  eventId?: string | null;
  status: TraceStatus;
  startedAt: string;
  endedAt?: string | null;
  durationMs?: number | null;
  policyKey?: string | null;
  policyVersion?: number | null;
  policyDecision?: any;
  policyExplanation?: string | null;
  approvalRequestId?: string | null;
  taskId?: string | null;
  errorMessage?: string | null;
  spans?: TraceSpanRecord[];
}

export interface ErrorOccurrenceRecord {
  id: string;
  errorGroupId: string;
  correlationId?: string | null;
  requestId?: string | null;
  userId?: string | null;
  producerId?: string | null;
  eventId?: string | null;
  errorMessage: string;
  userFriendlyMessage: string;
  stackTrace?: string | null;
  contextData?: Record<string, any>;
  createdAt: string;
}

export interface ErrorGroupRecord {
  id: string;
  fingerprint: string;
  errorCode: string;
  title: string;
  service: string;
  operation: string;
  severity: ObservabilitySeverity;
  status: ErrorGroupStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrencesCount: number;
  affectedEventsCount: number;
  affectedUsersCount: number;
  relatedTaskId?: string | null;
  occurrences?: ErrorOccurrenceRecord[];
}

export interface ComponentHealthRecord {
  id: string;
  component: 'API' | 'POSTGRESQL' | 'REDIS' | 'WORKERS' | 'WEBSOCKET' | 'QUEUES' | 'INTEGRATIONS';
  status: ObservabilityStatus;
  latencyMs?: number | null;
  message?: string | null;
  metadata?: Record<string, any>;
  checkedAt: string;
}

export interface SystemAlertRecord {
  id: string;
  alertCode: string;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  component: string;
  occurrencesCount: number;
  deduplicationKey: string;
  status: SystemAlertStatus;
  firstTriggeredAt: string;
  lastTriggeredAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  thresholdRule?: string | null;
}

export interface MetricSnapshotRecord {
  id: string;
  metricName: string;
  value: number;
  unit?: string | null;
  labels?: Record<string, string>;
  timestamp: string;
}

export interface OutboxEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  correlationId?: string | null;
  producerId?: string | null;
  eventIdRef?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  actorUserId?: string | null;
  payload: any;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  retryCount: number;
  errorMessage?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface InboxWebhookRecord {
  id: string;
  source: string;
  externalEventId: string;
  eventType: string;
  correlationId?: string | null;
  signatureValid: boolean;
  isIdempotent: boolean;
  payload: any;
  status: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  errorMessage?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface ModuleHealthStatus {
  module: string;
  name: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  latencyP95: number;
  errorRate: number;
  activeJobs: number;
  lastIncident?: string | null;
}

export interface ObservabilityOverviewStats {
  systemStatus: ObservabilityStatus;
  requestsTotal15m: number;
  successRate: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  pendingJobs: number;
  failedJobs: number;
  activeAlerts: number;
  unresolvedErrors: number;
  componentHealth: ComponentHealthRecord[];
  modulesHealth: ModuleHealthStatus[];
}

export interface AuditExportParams {
  startDate?: string;
  endDate?: string;
  module?: string;
  userId?: string;
  producerId?: string;
  eventId?: string;
  action?: string;
  result?: string;
  format: 'JSON' | 'CSV';
}

// ============================================================================
// 16. MOTOR CENTRAL DE RELATÓRIOS, EXPORTAÇÕES E BI OPERACIONAL (FASE 1.1.5.13)
// ============================================================================

export type MetricDomain =
  | 'COMERCIAL'
  | 'FINANCEIRO'
  | 'EVENTOS'
  | 'SAC'
  | 'ESTORNO'
  | 'CONTABILIDADE'
  | 'MARKETING'
  | 'REMARKETING';

export type MetricFormat =
  | 'CURRENCY'
  | 'NUMBER'
  | 'PERCENTAGE'
  | 'DURATION'
  | 'RATING';

export type MetricUpdateFrequency =
  | 'REAL_TIME'
  | 'NEAR_REAL_TIME'
  | 'PERIODIC'
  | 'DAILY_CLOSE'
  | 'SNAPSHOT';

export type PeriodType =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type ComparisonType =
  | 'NONE'
  | 'PREVIOUS_PERIOD'
  | 'SAME_PERIOD_LAST_YEAR'
  | 'GOAL';

export type ChartType =
  | 'TABLE'
  | 'LINE'
  | 'BAR'
  | 'AREA'
  | 'DONUT'
  | 'KPI';

export type ReportVisibility =
  | 'PRIVATE'
  | 'TEAM'
  | 'ROLE'
  | 'PRODUCER'
  | 'SPECIFIC_USERS';

export type ExportFormat =
  | 'XLSX'
  | 'CSV'
  | 'PDF';

export type ExportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

export type ScheduleFrequency =
  | 'ONCE'
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CRON';

export type FilterOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'IN'
  | 'NOT_IN'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'BETWEEN';

export interface MetricLineageStep {
  step: string;
  source: string;
  details: string;
}

export interface MetricDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  domain: MetricDomain;
  format: MetricFormat;
  formula: string;
  source: string;
  updateFrequency: MetricUpdateFrequency;
  responsible: string;
  version: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  requiredPermission?: PermissionString | null;
  isSensitive?: boolean;
  lineage?: MetricLineageStep[];
  supportedDimensions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DimensionDefinition {
  id: string;
  code: string;
  name: string;
  type: 'STRING' | 'DATE' | 'ENUM' | 'ENTITY';
  description?: string;
  options?: string[];
}

export interface FilterDefinition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface AnalyticsPeriod {
  type: PeriodType;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  comparison?: ComparisonType;
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters?: FilterDefinition[];
  period: AnalyticsPeriod;
  producerId?: string;
  eventId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AnalyticsResultMetricHeader {
  code: string;
  name: string;
  format: MetricFormat;
  total?: number;
  formattedTotal?: string;
}

export interface AnalyticsFreshness {
  status: 'REAL_TIME' | 'UP_TO_DATE' | 'DELAYED' | 'UNAVAILABLE';
  updatedAt: string;
  message?: string;
}

export interface AnalyticsResult {
  metrics: AnalyticsResultMetricHeader[];
  dimensions: string[];
  rows: Array<Record<string, any>>;
  comparisonRows?: Array<Record<string, any>>;
  summary: Record<string, any>;
  freshness: AnalyticsFreshness;
  cached: boolean;
  executionTimeMs: number;
}

export interface SavedReport {
  id: string;
  title: string;
  description?: string | null;
  domain: MetricDomain;
  queryDefinition: AnalyticsQuery;
  chartType: ChartType;
  visibility: ReportVisibility;
  sharedWithUserIds?: string[];
  sharedWithRoleCodes?: string[];
  creatorUserId: string;
  creatorUserName: string;
  producerId?: string | null;
  eventId?: string | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExportJob {
  id: string;
  reportId?: string | null;
  reportTitle: string;
  format: ExportFormat;
  status: ExportJobStatus;
  userId: string;
  userName: string;
  recordCount: number;
  fileSizeBytes?: number | null;
  downloadUrl?: string | null;
  documentId?: string | null;
  expiresAt: string;
  errorMessage?: string | null;
  watermark?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ReportScheduleRecipient {
  type: 'USER' | 'EMAIL' | 'ROLE';
  target: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  reportTitle: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  timeOfDay: string;
  format: ExportFormat;
  recipients: ReportScheduleRecipient[];
  active: boolean;
  creatorUserId: string;
  lastRunAt?: string | null;
  lastRunStatus?: 'SUCCESS' | 'FAILED' | null;
  nextRunAt: string;
  createdAt: string;
}

export interface ReportSnapshot {
  id: string;
  reportId: string;
  title: string;
  snapshotDate: string;
  frozenData: any;
  creatorUserId: string;
  creatorUserName: string;
  notes?: string | null;
  createdAt: string;
}

export interface AnalyticsGoal {
  id: string;
  metricCode: string;
  name: string;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  projectionValue?: number;
  unit: string;
  period: string;
  producerId?: string | null;
  eventId?: string | null;
  channel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  code: string;
  name: string;
  category: MetricDomain;
  metricCodes: string[];
  chartType: ChartType;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'FULL';
  requiredPermission?: string | null;
}

// ============================================================================
// FASE 1.1.5.14: CENTRAL DE JOBS, AGENDAMENTOS, LOTES E PROCESSAMENTO ASSÍNCRONO
// ============================================================================

export type JobStatus =
  | 'CREATED'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DEAD_LETTER';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type JobQueue =
  | 'critical'
  | 'finance'
  | 'payments'
  | 'integrations'
  | 'webhooks'
  | 'documents'
  | 'analytics'
  | 'marketing'
  | 'communications'
  | 'maintenance';

export type JobModule =
  | 'FINANCEIRO'
  | 'CONTABILIDADE'
  | 'MARKETING'
  | 'SAC'
  | 'EVENTOS'
  | 'RELATORIOS'
  | 'DOCUMENTOS'
  | 'INTEGRACOES'
  | 'CONFIGURACOES'
  | 'AUDITORIA';

export interface JobProgressData {
  processedItems: number;
  totalItems: number;
  successItems: number;
  failedItems: number;
  percentage: number;
  currentStep?: string;
  estimatedTimeRemainingSeconds?: number;
}

export interface JobAttempt {
  id: string;
  jobId: string;
  attemptNumber: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  workerId?: string | null;
}

export interface JobCheckpoint {
  id: string;
  jobId: string;
  cursor: any;
  processedCount: number;
  savedAt: string;
  state?: any;
}

export interface Job {
  id: string;
  type: string;
  module: JobModule;
  producerId?: string | null;
  eventId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  status: JobStatus;
  priority: JobPriority;
  queue: JobQueue;
  progress: number; // 0 to 100
  progressData?: JobProgressData;
  payloadReference?: string | null;
  payload?: any;
  result?: any;
  error?: {
    message: string;
    code?: string;
    stack?: string;
    isPermanent?: boolean;
  } | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  attempts: number;
  maxAttempts: number;
  correlationId: string;
  parentJobId?: string | null;
  batchId?: string | null;
  workflowId?: string | null;
  cancellable: boolean;
  cancelRequested?: boolean;
  pausable?: boolean;
  pauseRequested?: boolean;
  paused?: boolean;
  idempotencyKey?: string | null;
  checkpoint?: any;
}

export type BatchStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface JobBatch {
  id: string;
  name: string;
  module: JobModule;
  producerId?: string | null;
  eventId?: string | null;
  status: BatchStatus;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  pendingItems: number;
  progressPercent: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  correlationId: string;
  childJobs?: Job[];
}

export type MisfirePolicy =
  | 'EXECUTE_IMMEDIATELY'
  | 'SKIP_MISSED'
  | 'RESCHEDULE'
  | 'CUSTOM';

export interface JobSchedule {
  id: string;
  name: string;
  description?: string | null;
  jobType: string;
  module: JobModule;
  queue: JobQueue;
  priority: JobPriority;
  frequency: ScheduleFrequency;
  cronExpression?: string | null;
  timeOfDay?: string | null; // e.g. "02:00"
  dayOfWeek?: number | null; // 0-6
  dayOfMonth?: number | null; // 1-31
  timezone: string; // e.g. "America/Sao_Paulo"
  misfirePolicy: MisfirePolicy;
  payload?: any;
  producerId?: string | null;
  eventId?: string | null;
  creatorUserId: string;
  creatorUserName: string;
  active: boolean;
  lastRunAt?: string | null;
  lastRunStatus?: 'SUCCESS' | 'FAILED' | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkerStatus = 'ACTIVE' | 'IDLE' | 'STALLED' | 'OFFLINE';

export interface JobWorker {
  id: string;
  name: string;
  hostname: string;
  queues: JobQueue[];
  status: WorkerStatus;
  concurrency: number;
  activeJobsCount: number;
  lastHeartbeatAt: string;
  startedAt: string;
  metrics: {
    totalProcessed: number;
    totalFailed: number;
    uptimeSeconds: number;
    cpuUsagePercent?: number;
    memoryUsageMb?: number;
  };
}

export interface JobDeadLetter {
  id: string;
  jobId: string;
  jobType: string;
  module: JobModule;
  originalQueue: JobQueue;
  failureReason: string;
  errorStack?: string | null;
  attemptsCount: number;
  movedToDeadLetterAt: string;
  investigated: boolean;
  investigatedBy?: string | null;
  investigatedAt?: string | null;
  reprocessed: boolean;
  reprocessedJobId?: string | null;
  reprocessedAt?: string | null;
  job?: Job;
}

export interface JobQueueMetrics {
  name: JobQueue;
  displayName: string;
  depth: number;
  runningCount: number;
  processingRatePerMinute: number;
  oldestJobAgeSeconds: number;
  activeWorkers: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ProcessingCenterStats {
  runningCount: number;
  queuedCount: number;
  scheduledCount: number;
  completedTodayCount: number;
  failedCount: number;
  deadLetterCount: number;
  health: {
    workers: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    queues: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    redis: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    database: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    integrations: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  };
  p95DurationSeconds: number;
  p99DurationSeconds: number;
  avgDurationSeconds: number;
}

export interface JobRegistryEntry {
  type: string;
  name: string;
  description: string;
  module: JobModule;
  queue: JobQueue;
  defaultPriority: JobPriority;
  timeoutSeconds: number;
  retryPolicy: {
    maxAttempts: number;
    backoffType: 'FIXED' | 'EXPONENTIAL';
    initialDelayMs: number;
    maxDelayMs: number;
    jitter: boolean;
  };
  cancellable: boolean;
  pausable: boolean;
  progressEnabled: boolean;
  idempotencyPolicy: {
    enabled: boolean;
    keyGenerator?: (payload: any) => string;
  };
  requiredPermission: string;
}

// ============================================================================
// FASE 1.1.5.15: CENTRAL DE IMPORTAÇÃO, VALIDAÇÃO, MIGRAÇÃO E QUALIDADE
// ============================================================================

export type ImportType =
  | 'CUSTOMERS'
  | 'EVENT_PARTICIPANTS'
  | 'SUPPLIERS'
  | 'ACCOUNTS_PAYABLE'
  | 'ACCOUNTS_RECEIVABLE'
  | 'FINANCIAL_TRANSACTIONS'
  | 'MARKETING_CONTACTS'
  | 'LEGACY_ORDERS';

export type ImportStatus =
  | 'DRAFT'
  | 'MAPPING'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'WAITING_APPROVAL'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'ROLLED_BACK';

export type ImportSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKING';

export type DuplicateStrategy =
  | 'IGNORE'
  | 'UPDATE'
  | 'CREATE_NEW'
  | 'MANUAL_DECISION'
  | 'BLOCK';

export type AtomicityPolicy =
  | 'ALL_OR_NOTHING'
  | 'PARTIAL'
  | 'CHUNK_ATOMIC';

export type TransformationType =
  | 'TRIM'
  | 'NORMALIZE_PHONE'
  | 'NORMALIZE_DOCUMENT'
  | 'PARSE_DATE'
  | 'PARSE_CURRENCY'
  | 'UPPERCASE'
  | 'LOWERCASE'
  | 'DEFAULT_VALUE'
  | 'CONCAT'
  | 'MAP_ENUM';

export interface ImportColumnDefinition {
  name: string;
  label: string;
  required: boolean;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'CURRENCY' | 'PHONE' | 'DOCUMENT' | 'EMAIL' | 'BOOLEAN' | 'ENUM';
  description?: string;
  example?: string;
  aliases?: string[];
  isProtected?: boolean;
  isSensitive?: boolean;
  allowedValues?: string[];
}

export interface ImportDefinition {
  type: ImportType;
  name: string;
  description: string;
  module: JobModule;
  requiredPermission: PermissionString;
  allowedScopes: ScopeType[];
  columns: ImportColumnDefinition[];
  protectedFields: string[];
  defaultDuplicateStrategy: DuplicateStrategy;
  allowedDuplicateStrategies: DuplicateStrategy[];
  atomicityPolicy: AtomicityPolicy;
  requiresApprovalThreshold?: number;
  templateVersion: number;
}

export interface ImportMappingField {
  fileColumn: string;
  targetColumn: string;
  transformation?: TransformationType;
  transformationArg?: string;
  defaultValue?: any;
}

export interface ImportMapping {
  id: string;
  name: string;
  importType: ImportType;
  partnerName?: string | null;
  producerId?: string | null;
  fields: ImportMappingField[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportValidationError {
  id: string;
  importId: string;
  rowNumber: number;
  columnName: string;
  cellValue?: any;
  severity: ImportSeverity;
  ruleCode: string;
  message: string;
  suggestedFix?: string;
}

export interface ImportDuplicate {
  id: string;
  importId: string;
  rowNumber: number;
  matchField: string;
  matchValue: string;
  existingEntityId: string;
  existingData: Record<string, any>;
  incomingData: Record<string, any>;
  strategy: DuplicateStrategy;
  resolved: boolean;
  resolvedAction?: DuplicateStrategy;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface MergePlan {
  id: string;
  entityType: string;
  primaryId: string;
  duplicateId: string;
  primaryData: Record<string, any>;
  duplicateData: Record<string, any>;
  mergedData: Record<string, any>;
  reassignedRelations: { relationName: string; count: number }[];
  requiresApproval: boolean;
  approvalId?: string | null;
  status: 'DRAFT' | 'WAITING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  createdCount: number;
  updatedCount: number;
  ignoredCount: number;
  failedCount: number;
}

export interface ImportRequest {
  id: string;
  code: string;
  importType: ImportType;
  producerId?: string | null;
  eventId?: string | null;
  documentId: string;
  fileName: string;
  fileSize: number;
  fileFormat: 'CSV' | 'XLSX';
  fileChecksum: string;
  mappingId?: string | null;
  mapping?: ImportMapping;
  status: ImportStatus;
  duplicateStrategy: DuplicateStrategy;
  atomicityPolicy: AtomicityPolicy;
  templateVersion: number;
  summary: ImportSummary;
  jobId?: string | null;
  batchId?: string | null;
  approvalId?: string | null;
  beforeSnapshot?: any;
  errorMessage?: string | null;
  creatorUserId: string;
  creatorUserName: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ImportTemplate {
  id: string;
  name: string;
  importType: ImportType;
  description: string;
  version: number;
  fileName: string;
  format: 'CSV' | 'XLSX';
  columns: ImportColumnDefinition[];
  downloadUrl: string;
  updatedAt: string;
}

export type DataQualityDimension =
  | 'COMPLETENESS'
  | 'VALIDITY'
  | 'UNIQUENESS'
  | 'CONSISTENCY'
  | 'TIMELINESS'
  | 'REFERENTIAL_INTEGRITY';

export interface DataQualityRule {
  id: string;
  code: string;
  name: string;
  description: string;
  entity: string;
  field?: string;
  dimension: DataQualityDimension;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  condition: string;
  recommendedAction: string;
  active: boolean;
}

export interface DataQualityIssue {
  id: string;
  ruleId: string;
  ruleCode: string;
  entity: string;
  entityId: string;
  field?: string;
  dimension: DataQualityDimension;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  suggestedAction: string;
  taskId?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
  detectedAt: string;
  resolvedAt?: string | null;
}

export interface DataQualityStats {
  totalRecordsAudited: number;
  totalIssues: number;
  issuesByDimension: Record<DataQualityDimension, number>;
  issuesBySeverity: Record<string, number>;
  domainHealth: Record<string, 'HEALTHY' | 'WARNING' | 'CRITICAL'>;
}

export interface MigrationStage {
  stageNumber: number;
  entityType: string;
  dependsOn: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalRecords: number;
  migratedRecords: number;
  divergentRecords: number;
  jobId?: string | null;
}

export interface MigrationProject {
  id: string;
  name: string;
  sourceSystem: string;
  description?: string | null;
  status: 'PLANNING' | 'STAGING' | 'VALIDATING' | 'EXECUTING' | 'RECONCILING' | 'COMPLETED' | 'FAILED';
  stages: MigrationStage[];
  createdAt: string;
  updatedAt: string;
}

export interface LegacyIdMapping {
  id: string;
  migrationId: string;
  sourceSystem: string;
  entityType: string;
  legacyId: string;
  newId: string;
  createdAt: string;
}

export interface MigrationReconciliation {
  id: string;
  migrationId: string;
  entityType: string;
  sourceCount: number;
  destCount: number;
  countMatched: boolean;
  sourceSum?: number;
  destSum?: number;
  sumMatched?: boolean;
  divergentIds: string[];
  reconciledAt: string;
}

export interface RollbackEligibility {
  importId: string;
  eligible: boolean;
  reason?: string;
  blockingDependencies: { relation: string; count: number }[];
  compensatingActionRecommended?: string;
}

// ==========================================
// FASE 1.2 — MÓDULO EVENTOS
// ==========================================

export type EventStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'REVIEW'
  | 'APPROVAL_PENDING'
  | 'SCHEDULED'
  | 'ON_SALE'
  | 'SALES_PAUSED'
  | 'SOLD_OUT'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface EventListItemDTO {
  id: string;
  publicCode: string;
  producerId: string;
  producerName?: string;
  name: string;
  title?: string;
  slug?: string | null;
  status: EventStatus;
  startAt?: string | null;
  endAt?: string | null;
  timezone: string;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  capacity?: number | null;
  soldTickets?: number;
  occupancyPercentage?: number | null;
  coverDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDetailDTO extends EventListItemDTO {
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string;
  subcategoryId?: string | null;
  subcategoryName?: string;
  format?: EventFormat;
  ageRating?: string | null;
  ageRatingDescription?: string | null;
  onlinePlatform?: string | null;
  onlineUrl?: string | null;
  onlineInstructions?: string | null;
  hasMultipleSessions?: boolean;
  currency?: string;
  locale?: string;
  visibility?: EventVisibility;
  allowSearchIndexing?: boolean;
  publicOrganizerName?: string | null;
  operationalContact?: string | null;
  operationalEmail?: string | null;
  internalResponsibleUserId?: string | null;
  internalResponsibleUserName?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
  estimatedCapacity?: number | null;
  version?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  readinessScore?: number;
  pendingItemsCount?: number;
  wizardState?: EventWizardStateDTO | null;
  media?: EventMediaDTO[];
  responsibilities?: EventResponsibilityDTO[];
}

export type EventFormat = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type EventVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
export type EventAgeRating = 'Livre' | '10 anos' | '12 anos' | '14 anos' | '16 anos' | '18 anos';

export interface EventCategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  active: boolean;
  sortOrder: number;
  subcategories?: EventCategoryDTO[];
}

export interface EventMediaDTO {
  id: string;
  eventId: string;
  documentId: string;
  type: 'MAIN' | 'COVER' | 'SHARE' | 'GALLERY';
  sortOrder: number;
  caption?: string | null;
  url?: string;
  createdAt: string;
}

export type EventResponsibilityType =
  | 'PRIMARY'
  | 'OPERATIONS'
  | 'COMMERCIAL'
  | 'FINANCE'
  | 'MARKETING'
  | 'SUPPORT';

export interface EventResponsibilityDTO {
  id: string;
  eventId: string;
  responsibilityType: EventResponsibilityType;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type EventWizardStepId =
  | 'STEP_INFORMATION'
  | 'STEP_ORGANIZATION'
  | 'STEP_LOCATION'
  | 'STEP_DATES'
  | 'STEP_MEDIA'
  | 'STEP_SETTINGS'
  | 'STEP_RESPONSIBILITIES'
  | 'STEP_REVIEW';

export type StepValidationStatus = 'COMPLETED' | 'IN_PROGRESS' | 'WARNING' | 'ERROR' | 'PENDING';

export interface StepIssue {
  stepId: EventWizardStepId;
  field?: string;
  message: string;
  severity: 'BLOCKING' | 'WARNING';
}

export interface StepValidationDetail {
  stepId: EventWizardStepId;
  stepNumber: number;
  title: string;
  status: StepValidationStatus;
  issues: StepIssue[];
}

export interface EventWizardValidationResult {
  valid: boolean;
  blockingIssues: number;
  warnings: number;
  steps: StepValidationDetail[];
}

export interface EventWizardStateDTO {
  id: string;
  eventId: string;
  currentStep: number;
  completedSteps: number[];
  lastVisitedStep: number;
  stepStatuses: Record<string, StepValidationStatus>;
  updatedAt: string;
}

export interface CreateEventDraftInput {
  producerId?: string;
  name?: string;
  categoryId?: string;
  format?: EventFormat;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  venue?: string;
  city?: string;
  state?: string;
}

export interface PatchEventDraftInput {
  version: number;
  // Step 1: Info
  name?: string;
  slug?: string;
  categoryId?: string;
  subcategoryId?: string;
  format?: EventFormat;
  ageRating?: string;
  ageRatingDescription?: string;
  description?: string;
  // Step 2: Org
  publicOrganizerName?: string;
  operationalContact?: string;
  operationalEmail?: string;
  internalResponsibleUserId?: string;
  // Step 3: Local
  venue?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  estimatedCapacity?: number;
  onlinePlatform?: string;
  onlineUrl?: string;
  onlineInstructions?: string;
  // Step 4: Datas
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string;
  hasMultipleSessions?: boolean;
  // Step 5: Visual
  coverDocumentId?: string | null;
  // Step 6: Configs
  currency?: string;
  locale?: string;
  visibility?: EventVisibility;
  allowSearchIndexing?: boolean;
}

export interface EventSummaryDTO {
  total: number;
  onSale: number;
  upcoming: number;
  configuring: number;
  inProgress?: number;
  draft?: number;
}

export interface ListEventsFilter {
  search?: string;
  status?: EventStatus | 'ALL';
  producerId?: string;
  city?: string;
  state?: string;
  from?: string | Date;
  to?: string | Date;
  period?: 'all' | 'today' | 'next7days' | 'next30days' | 'thisMonth' | 'upcoming' | 'past' | 'custom';
  cursor?: string;
  limit?: number;
  sortBy?: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' | 'created_recent' | 'updated_recent';
}


