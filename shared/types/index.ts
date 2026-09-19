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

export type PermissionAction = 'visualizar' | 'criar' | 'editar' | 'aprovar' | 'cancelar' | 'estornar' | 'transferir' | 'exportar' | 'administrar';

// Granular Permission String format: "module.resource.action"
export type PermissionString =
  // Eventos
  | 'eventos.evento.visualizar'
  | 'eventos.evento.criar'
  | 'eventos.evento.editar'
  | 'eventos.evento.cancelar'
  | 'eventos.checkin.operar'
  | 'eventos.setores.configurar'
  | 'eventos.cortesias.emitir'
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
  | 'tarefas.dashboard.visualizar';

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

