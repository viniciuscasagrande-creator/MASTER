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
  // Locais e Estruturas Físicas (Fase 1.2.3)
  | 'eventos.locais.visualizar'
  | 'eventos.locais.criar'
  | 'eventos.locais.editar'
  | 'eventos.locais.arquivar'
  | 'eventos.locais.estrutura.visualizar'
  | 'eventos.locais.estrutura.editar'
  | 'eventos.mapas.visualizar'
  | 'eventos.mapas.criar'
  | 'eventos.mapas.editar'
  | 'eventos.mapas.versionar'
  | 'eventos.assentos.visualizar'
  | 'eventos.assentos.editar'
  | 'eventos.acessos.visualizar'
  | 'eventos.acessos.editar'
  | 'eventos.evento.local.editar'
  | 'eventos.evento.estrutura.editar'
  // Datas, Sessões e Capacidade (Fase 1.2.4)
  | 'eventos.sessao.visualizar'
  | 'eventos.sessao.gerenciar'
  | 'eventos.sessoes.visualizar'
  | 'eventos.sessoes.criar'
  | 'eventos.sessoes.editar'
  | 'eventos.sessoes.duplicar'
  | 'eventos.sessoes.cancelar'
  | 'eventos.sessoes.capacidade.visualizar'
  | 'eventos.sessoes.capacidade.editar'
  | 'eventos.sessoes.reservas.visualizar'
  | 'eventos.sessoes.reservas.editar'
  | 'eventos.sessoes.recorrencia.criar'
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
  // Canais, Cortesias e Equipe (Fase 1.2.7)
  | 'eventos.canais.visualizar'
  | 'eventos.canais.editar'
  | 'eventos.canais.alocacao.editar'
  | 'eventos.cortesias.visualizar'
  | 'eventos.cortesias.solicitar'
  | 'eventos.cortesias.cancelar'
  | 'eventos.cortesias.cota.editar'
  | 'eventos.equipe.visualizar'
  | 'eventos.equipe.editar'
  | 'eventos.equipe.escala.editar'
  | 'eventos.equipe.responsabilidade.editar'
  // Preparação, Documentos e Pendências (Fase 1.2.8)
  | 'eventos.preparacao.visualizar'
  | 'eventos.preparacao.recalcular'
  | 'eventos.documentos.visualizar'
  | 'eventos.documentos.enviar'
  | 'eventos.documentos.versionar'
  | 'eventos.documentos.requisitos.visualizar'
  | 'eventos.documentos.requisitos.editar'
  | 'eventos.pendencias.visualizar'
  | 'eventos.pendencias.criar'
  // Revisão, Aprovação e Publicação (Fase 1.2.9)
  | 'eventos.evento.revisao.visualizar'
  | 'eventos.evento.revisao.solicitar'
  | 'eventos.evento.publicacao.visualizar'
  | 'eventos.evento.publicacao.solicitar'
  | 'eventos.evento.publicacao.agendar'
  | 'eventos.evento.publicacao.cancelar_agendamento'
  | 'eventos.evento.vendas.pausar'
  | 'eventos.evento.vendas.retomar'
  | 'eventos.evento.preview.visualizar'
  | 'eventos.lifecycle.review'
  | 'eventos.lifecycle.solicitar_aprovacao'
  | 'eventos.lifecycle.aprovar'
  | 'eventos.lifecycle.publicar'
  | 'eventos.lifecycle.pausar_vendas'
  | 'eventos.lifecycle.alterar_status'
  | 'eventos.lifecycle.operacao'
  | 'eventos.lifecycle.encerrar'
  | 'eventos.lifecycle.cancelar'
  | 'eventos.lifecycle.arquivar'
  // Alterações Controladas & Impacto (Fase 1.2.10)
  | 'eventos.alteracoes.visualizar'
  | 'eventos.alteracoes.solicitar'
  | 'eventos.alteracoes.analisar_impacto'
  | 'eventos.alteracoes.cancelar'
  | 'eventos.alteracoes.executar'
  | 'eventos.alteracoes.agendar'
  | 'eventos.alteracoes.emergencial.solicitar'
  // Dashboard Executivo & Operacional (Fase 1.2.11)
  | 'eventos.dashboard.visualizar'
  | 'eventos.dashboard.comercial.visualizar'
  | 'eventos.dashboard.operacao.visualizar'
  | 'eventos.dashboard.marketing.visualizar'
  | 'eventos.dashboard.financeiro.visualizar'
  | 'eventos.dashboard.alertas.visualizar'
  // Central de Operação do Evento em Tempo Real (Fase 1.2.12)
  | 'eventos.operacao.iniciar'
  | 'eventos.operacao.encerrar'
  | 'eventos.operacao.areas.visualizar'
  | 'eventos.operacao.acessos.visualizar'
  | 'eventos.operacao.acessos.operar'
  | 'eventos.operacao.equipe.visualizar'
  | 'eventos.operacao.equipe.gerenciar'
  | 'eventos.operacao.incidentes.visualizar'
  | 'eventos.operacao.incidentes.criar'
  | 'eventos.operacao.comunicados.enviar'
  | 'eventos.operacao.comandos.executar'
  | 'eventos.operacao.handoff.realizar'
  // Check-in + Controle de Acesso + Dispositivos (Fase 1.2.13)
  | 'eventos.checkin.validar'
  | 'eventos.checkin.reverter'
  | 'eventos.checkin.manual'
  | 'eventos.checkin.excecao.solicitar'
  | 'eventos.checkin.excecao.aprovar'
  | 'eventos.checkin.bloqueio.gerenciar'
  | 'eventos.checkin.dispositivos.visualizar'
  | 'eventos.checkin.dispositivos.vincular'
  | 'eventos.checkin.dispositivos.autorizar'
  | 'eventos.checkin.dispositivos.revogar'
  | 'eventos.checkin.regras.gerenciar'
  | 'eventos.checkin.offline.sincronizar'
  | 'eventos.checkin.relatorios.visualizar'
  // Encerramento + Cancelamento + Pós-Evento + Arquivamento (Fase 1.2.14)
  | 'eventos.encerramento.sessao.encerrar'
  | 'eventos.encerramento.evento.encerrar'
  | 'eventos.encerramento.override.aplicar'
  | 'eventos.cancelamento.solicitar'
  | 'eventos.cancelamento.avaliar_impacto'
  | 'eventos.cancelamento.executar'
  | 'eventos.cancelamento.sessao.executar'
  | 'eventos.pos_evento.visualizar'
  | 'eventos.pos_evento.relatorio.exportar'
  | 'eventos.arquivamento.arquivar'
  | 'eventos.arquivamento.visualizar'
  // Comercial — Fases 1.3.1 e 1.3.2
  | 'comercial.dashboard.visualizar'
  | 'comercial.pedidos.visualizar'
  | 'comercial.pedidos.detalhes'
  | 'comercial.pedidos.exportar'
  | 'comercial.clientes.resumo.visualizar'
  | 'comercial.clientes.dados_sensiveis'
  | 'comercial.vendas.visualizar'
  | 'comercial.vendas.valores.visualizar'
  | 'comercial.vendas.performance.visualizar'
  | 'comercial.vendas.exportar'
  | 'comercial.alertas.visualizar'
  | 'comercial.produtores.visualizar'
  | 'comercial.produtores.criar'
  | 'comercial.produtores.editar'
  | 'comercial.produtores.detalhes'
  | 'comercial.carteira.visualizar'
  | 'comercial.carteira.atribuir'
  | 'comercial.prospeccoes.visualizar'
  | 'comercial.prospeccoes.criar'
  | 'comercial.prospeccoes.editar'
  | 'comercial.prospeccoes.converter'
  | 'comercial.oportunidades.visualizar'
  | 'comercial.oportunidades.criar'
  | 'comercial.oportunidades.editar'
  | 'comercial.oportunidades.mover'
  | 'comercial.oportunidades.ganhar'
  | 'comercial.oportunidades.encerrar'
  | 'comercial.pipeline.visualizar'
  | 'comercial.pipeline.configurar'
  | 'comercial.oportunidades.documentos.visualizar'
  | 'comercial.oportunidades.documentos.adicionar'
  | 'comercial.atividades.visualizar'
  | 'comercial.atividades.registrar'
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
  venueId?: string | null;
  doorsOpenAt?: string | null;
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
  | 'SUPPORT'
  | 'BOX_OFFICE_LEAD'
  | 'ACCESS_COORDINATOR'
  | 'CREDENTIALING_LEAD'
  | 'PRODUCTION_COORDINATOR'
  | 'TECHNICAL_LEAD'
  | 'FINANCIAL_LEAD'
  | 'SECURITY_LEAD'
  | 'OTHER';

export interface EventResponsibilityDTO {
  id: string;
  eventId: string;
  responsibilityType: EventResponsibilityType;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  memberId?: string;
  memberName?: string;
  title?: string;
  scope?: 'EVENT' | 'SESSION' | 'SECTION' | 'ACCESS_POINT' | 'SALES_POINT';
  scopeId?: string | null;
  scopeName?: string | null;
  active?: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
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

// ==============================================================================
// FASE 1.2.3 — CENTRAL DE LOCAIS, MAPAS E ESTRUTURA FÍSICA
// ==============================================================================

export type VenueType =
  | 'ARENA'
  | 'STADIUM'
  | 'THEATER'
  | 'CONCERT_HALL'
  | 'CONVENTION_CENTER'
  | 'CLUB'
  | 'BAR_RESTAURANT'
  | 'OPEN_AIR'
  | 'RACETRACK'
  | 'GYMNASIUM'
  | 'OTHER';

export type VenueScope = 'GLOBAL' | 'PRODUCER';
export type VenueStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT';

export interface VenueDTO {
  id: string;
  publicCode: string;
  name: string;
  type: VenueType;
  scope: VenueScope;
  producerId?: string | null;
  producerName?: string | null;
  status: VenueStatus;
  postalCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city: string;
  state: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  sectionsCount?: number;
  mapsCount?: number;
  eventsCount?: number;
  accessPointsCount?: number;
  sections?: VenueSectionDTO[];
  maps?: VenueMapDTO[];
  accessPoints?: VenueAccessPointDTO[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSummaryDTO {
  total: number;
  active: number;
  withMaps: number;
  citiesCount: number;
  totalPhysicalCapacity?: number;
}

export interface CreateVenueInput {
  name: string;
  type: VenueType;
  scope?: VenueScope;
  producerId?: string | null;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  documentUrl?: string;
}

export interface UpdateVenueInput extends Partial<CreateVenueInput> {
  status?: VenueStatus;
  version?: number;
}

export interface ListVenuesFilter {
  search?: string;
  city?: string;
  state?: string;
  type?: VenueType | 'ALL';
  status?: VenueStatus | 'ALL';
  scope?: VenueScope | 'ALL';
  producerId?: string;
  limit?: number;
  page?: number;
  cursor?: string;
}

export type VenueSectionType =
  | 'GENERAL_ADMISSION'
  | 'SEATED'
  | 'TABLE'
  | 'BOX'
  | 'VIP'
  | 'TECHNICAL'
  | 'ACCESS_ONLY';

export interface VenueSectionDTO {
  id: string;
  venueId: string;
  name: string;
  code: string;
  type: VenueSectionType;
  capacity: number;
  parentSectionId?: string | null;
  parentSectionName?: string | null;
  description?: string | null;
  color?: string | null;
  active: boolean;
  sortOrder: number;
  rowsCount?: number;
  seatsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenueSectionInput {
  name: string;
  code?: string;
  type: VenueSectionType;
  capacity: number;
  description?: string;
  color?: string;
  parentSectionId?: string | null;
  active?: boolean;
  sortOrder?: number;
}

export interface VenueMapDTO {
  id: string;
  venueId: string;
  name: string;
  description?: string | null;
  activeVersionId?: string | null;
  activeVersionNumber?: number | null;
  status: 'ACTIVE' | 'ARCHIVED';
  versionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueMapVersionDTO {
  id: string;
  mapId: string;
  versionNumber: number;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  backgroundDocumentId?: string | null;
  svgData?: string | null;
  scale?: number;
  width?: number;
  height?: number;
  elementsCount: number;
  totalCapacity: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type VenueMapElementType =
  | 'SECTION'
  | 'ROW'
  | 'SEAT'
  | 'TABLE'
  | 'STAGE'
  | 'ENTRANCE'
  | 'EXIT'
  | 'TEXT'
  | 'SHAPE'
  | 'RESTROOM'
  | 'BAR'
  | 'OBSTACLE';

export interface VenueMapElementDTO {
  id: string;
  mapVersionId: string;
  type: VenueMapElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  geometry?: any;
  linkedSectionId?: string | null;
  label?: string | null;
  metadata?: any;
  sortOrder: number;
}

export interface VenueRowDTO {
  id: string;
  sectionId: string;
  mapVersionId: string;
  code: string;
  name: string;
  sortOrder: number;
  seatsCount?: number;
}

export interface VenueSeatDTO {
  id: string;
  rowId?: string | null;
  rowCode?: string | null;
  sectionId: string;
  sectionName?: string | null;
  mapVersionId: string;
  code: string;
  label: string;
  x?: number;
  y?: number;
  seatType: 'STANDARD' | 'VIP' | 'BOX' | 'TABLE_SEAT';
  accessible: boolean;
  companionSeat: boolean;
  restrictedView: boolean;
  active: boolean;
}

export type VenueAccessPointType =
  | 'MAIN_ENTRANCE'
  | 'GATE'
  | 'VIP_GATE'
  | 'CREDENTIALS'
  | 'STAFF'
  | 'EMERGENCY_EXIT';

export interface VenueAccessPointDTO {
  id: string;
  venueId: string;
  name: string;
  code: string;
  type: VenueAccessPointType;
  active: boolean;
  createdAt: string;
}

export interface EventVenueDTO {
  id: string;
  eventId: string;
  venueId: string;
  venueName: string;
  venueType: VenueType;
  venueCity: string;
  venueState: string;
  venueMapId?: string | null;
  venueMapName?: string | null;
  venueMapVersionId?: string | null;
  venueMapVersionNumber?: number | null;
  configurationSnapshot?: any;
  createdAt: string;
}

export interface EventSectionDTO {
  id: string;
  eventId: string;
  venueSectionId: string;
  physicalName: string;
  physicalCode: string;
  physicalType: VenueSectionType;
  physicalCapacity: number;
  name: string; // Event-specific name (e.g., "Arquibancada Ouro")
  capacity: number; // Operational capacity for this event
  technicalReservation: number;
  enabled: boolean;
  configuration?: any;
}

// ==============================================================================
// FASE 1.2.4 — DATAS, SESSÕES E CAPACIDADE OPERACIONAL
// ==============================================================================

export type EventSessionStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'SCHEDULED'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface EventSessionDTO {
  id: string;
  eventId: string;
  publicCode: string;
  name?: string | null;
  doorsOpenAt?: string | null;
  startAt: string;
  endAt?: string | null;
  timezone: string;
  venueId?: string | null;
  venueName?: string | null;
  venueMapVersionId?: string | null;
  venueMapName?: string | null;
  status: EventSessionStatus;
  capacity: number;
  reservedCapacity: number;
  isPrimary: boolean;
  recurrenceGroupId?: string | null;
  sessionSections?: SessionSectionDTO[];
  reservations?: SessionCapacityReservationDTO[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventSessionInput {
  name?: string;
  doorsOpenAt?: string;
  startAt: string;
  endAt?: string;
  timezone?: string;
  venueId?: string;
  venueMapVersionId?: string;
  status?: EventSessionStatus;
  capacity?: number;
  isPrimary?: boolean;
}

export interface UpdateEventSessionInput extends Partial<CreateEventSessionInput> {
  status?: EventSessionStatus;
  version?: number;
}

export interface DuplicateEventSessionInput {
  startAt: string;
  doorsOpenAt?: string;
  endAt?: string;
  name?: string;
  copyCapacity?: boolean;
  replicateSections?: boolean;
}

export interface SessionSectionDTO {
  id: string;
  sessionId: string;
  eventSectionId: string;
  name: string;
  enabled: boolean;
  physicalCapacity: number;
  eventCapacity: number;
  capacity: number; // Session-specific capacity
  reservedCapacity: number;
  configuration?: any;
}

export type SessionReservationType =
  | 'PRODUCTION'
  | 'SECURITY'
  | 'SPONSOR'
  | 'ARTIST'
  | 'ACCESSIBILITY'
  | 'TECHNICAL'
  | 'OTHER';

export interface SessionCapacityReservationDTO {
  id: string;
  sessionId: string;
  sectionId?: string | null;
  sectionName?: string | null;
  type: SessionReservationType;
  quantity: number;
  reason?: string | null;
  createdAt: string;
}

export interface SessionConflictDTO {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'VENUE_TIME_CONFLICT' | 'SECTION_OVERCAPACITY' | 'SETUP_TEARDOWN_OVERLAP';
    severity: 'BLOCKING' | 'WARNING';
    message: string;
    conflictingSessionId?: string;
    conflictingSessionName?: string;
  }>;
}

export interface BulkSessionsPreviewInput {
  pattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_DATES';
  startDate: string;
  endDate?: string;
  occurrencesCount?: number;
  interval?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  doorsOpenTime?: string;
  startTime?: string;
  endTime?: string;
  times?: Array<{
    doorsOpenTime?: string; // "16:30"
    startTime: string;      // "18:00"
    endTime?: string;       // "23:00"
  }>;
  venueId?: string;
  venueMapVersionId?: string;
  capacity?: number;
  namePrefix?: string;
  customDates?: string[];
}

export interface BulkSessionsPreviewResult {
  totalCount: number;
  hasConflicts?: boolean;
  sessions: Array<{
    index?: number;
    name?: string;
    date: string;
    doorsOpenAt?: string;
    startAt: string;
    endAt?: string;
    hasConflict?: boolean;
    conflictMessage?: string;
    conflicts?: any[];
  }>;
}

// ==============================================================================
// FASE 1.2.5 — SETORES + TIPOS DE INGRESSO + INVENTÁRIO VENDÁVEL
// ==============================================================================

export type TicketTypeCategory =
  | 'INTEIRA'
  | 'MEIA'
  | 'SOCIAL'
  | 'VIP'
  | 'CORTESIA'
  | 'COMBO'
  | 'PROMOTIONAL'
  | 'OTHER';

export interface TicketTypeDTO {
  id: string;
  code: string;
  name: string;
  category: TicketTypeCategory;
  defaultDescription?: string | null;
  halfPriceLawCompliance: boolean;
  requiresDocument: boolean;
  documentType?: string | null;
  requiresCode: boolean;
  requiresBenefit: boolean;
  benefitDescription?: string | null;
  isSystem: boolean;
  active: boolean;
}

export interface EventTicketTypeBenefitDTO {
  id: string;
  eventTicketTypeId: string;
  name: string;
  description?: string | null;
}

export interface EventTicketTypeDTO {
  id: string;
  eventId: string;
  ticketTypeId?: string | null;
  name: string;
  code: string;
  category: TicketTypeCategory;
  description?: string | null;
  halfPriceLawCompliance: boolean;
  requiresDocument: boolean;
  documentType?: string | null;
  requiresCode: boolean;
  requiresBenefit: boolean;
  benefitDescription?: string | null;
  active: boolean;
  sortOrder: number;
  minPerOrder: number;
  maxPerOrder: number;
  sections?: Array<{ eventSectionId: string; sectionName?: string }>;
  sessions?: Array<{ sessionId: string; sessionName?: string }>;
  benefits?: EventTicketTypeBenefitDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTicketTypeInput {
  ticketTypeId?: string;
  name: string;
  code?: string;
  category: TicketTypeCategory;
  description?: string;
  halfPriceLawCompliance?: boolean;
  requiresDocument?: boolean;
  documentType?: string;
  requiresCode?: boolean;
  requiresBenefit?: boolean;
  benefitDescription?: string;
  minPerOrder?: number;
  maxPerOrder?: number;
  sectionIds?: string[];
  sessionIds?: string[];
  benefits?: Array<{ name: string; description?: string }>;
}

export interface UpdateEventTicketTypeInput extends Partial<CreateEventTicketTypeInput> {
  active?: boolean;
}

export interface InventoryPoolDTO {
  id: string;
  sessionId: string;
  eventSectionId: string;
  sessionName?: string;
  sectionName?: string;
  capacity: number;
  reserved: number;
  blocked: number;
  held: number;
  sold: number;
  available: number; // capacity - reserved - blocked - held - sold
  allocations?: InventoryAllocationDTO[];
  blocks?: InventoryBlockDTO[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryAllocationType = 'UNLIMITED' | 'FIXED' | 'PERCENTAGE';

export interface InventoryAllocationDTO {
  id: string;
  inventoryPoolId: string;
  eventTicketTypeId: string;
  ticketTypeName?: string;
  ticketTypeCategory?: TicketTypeCategory;
  allocationType: InventoryAllocationType;
  allocationValue: number;
  allocatedQuantity: number;
  soldQuantity: number;
  heldQuantity: number;
  availableQuantity: number;
}

export interface SaveInventoryAllocationInput {
  eventTicketTypeId: string;
  allocationType: InventoryAllocationType;
  allocationValue: number;
}

export type InventoryBlockReason =
  | 'TECHNICAL_HOLD'
  | 'SPONSOR_HOLD'
  | 'SECURITY_BUFFER'
  | 'PRODUCER_HOLD'
  | 'GOVERNMENT_HOLD'
  | 'OTHER';

export interface InventoryBlockDTO {
  id: string;
  inventoryPoolId: string;
  reason: InventoryBlockReason;
  quantity: number;
  notes?: string | null;
  active: boolean;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface CreateInventoryBlockInput {
  reason: InventoryBlockReason;
  quantity: number;
  notes?: string;
}

export type SeatInventoryStatus = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'SOLD' | 'BLOCKED';

export interface SeatInventoryDTO {
  id: string;
  inventoryPoolId: string;
  venueSeatId?: string | null;
  seatCode: string;
  rowCode?: string | null;
  status: SeatInventoryStatus;
  heldUntil?: string | null;
  orderId?: string | null;
  ticketTypeId?: string | null;
  version: number;
}

export interface InventoryHoldInput {
  sessionId: string;
  eventSectionId: string;
  eventTicketTypeId: string;
  quantity: number;
  ttlSeconds?: number;
  seatIds?: string[];
}

export interface InventoryHoldResult {
  success: boolean;
  holdToken: string;
  expiresAt: string;
  heldQuantity: number;
  seatIds?: string[];
}

export interface InventorySummaryDTO {
  totalPhysicalCapacity: number;
  totalOperationalCapacity: number;
  totalReservedCapacity: number;
  totalBlockedCapacity: number;
  totalHeldCapacity: number;
  totalSoldCapacity: number;
  totalAvailableCommercial: number;
  sectionsCount: number;
  ticketTypesCount: number;
  poolsCount: number;
}

// ==============================================================================
// FASE 1.2.6 — LOTES + PREÇOS + TAXAS + REGRAS DE VENDA
// ==============================================================================

export type TicketBatchStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SOLD_OUT'
  | 'ENDED'
  | 'ARCHIVED';

export type BatchActivationType =
  | 'MANUAL'
  | 'DATE_TIME'
  | 'PREVIOUS_BATCH_SOLD_OUT'
  | 'PREVIOUS_BATCH_QUANTITY';

export interface TicketBatchDTO {
  id: string;
  eventId: string;
  name: string;
  code: string;
  phase: number;
  status: TicketBatchStatus;
  activationType: BatchActivationType;
  activationDate?: string | null;
  deactivationDate?: string | null;
  previousBatchId?: string | null;
  previousBatchName?: string | null;
  triggerQuantity?: number | null;
  totalQuantityLimit?: number | null;
  soldCount: number;
  heldCount: number;
  pricesCount?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketBatchInput {
  name: string;
  code?: string;
  phase?: number;
  activationType: BatchActivationType;
  activationDate?: string;
  deactivationDate?: string;
  previousBatchId?: string;
  triggerQuantity?: number;
  totalQuantityLimit?: number;
}

export interface UpdateTicketBatchInput extends Partial<CreateTicketBatchInput> {
  status?: TicketBatchStatus;
}

export type FeePayer = 'BUYER' | 'PRODUCER' | 'SPLIT';
export type FeeCalculationType = 'PERCENTAGE' | 'FIXED';

export interface FeeComponentDTO {
  id?: string;
  name: string;
  type: FeeCalculationType;
  value: number; // e.g., 10 for 10%, or 500 for R$ 5,00
  payer: FeePayer;
  producerSharePercentage?: number; // When SPLIT, producer pays X%, buyer pays (100-X)%
  minFeeInCents?: number;
  maxFeeInCents?: number;
  taxDeductible?: boolean;
}

export interface PriceConfigurationDTO {
  id: string;
  ticketBatchId: string;
  eventSectionId: string;
  eventTicketTypeId: string;
  basePriceInCents: number;
  salePriceInCents: number;
  minPriceInCents?: number | null;
  maxPriceInCents?: number | null;
  active: boolean;
  sectionName?: string;
  ticketTypeName?: string;
  batchName?: string;
  feeComponents?: FeeComponentDTO[];
  calculatedBuyerFeeInCents?: number;
  calculatedBuyerTotalInCents?: number;
  calculatedProducerNetInCents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavePriceConfigurationInput {
  ticketBatchId: string;
  eventSectionId: string;
  eventTicketTypeId: string;
  basePriceInCents: number;
  salePriceInCents?: number;
  active?: boolean;
  feeComponents?: FeeComponentDTO[];
}

export interface PriceSimulationInput {
  basePriceInCents: number;
  salePriceInCents?: number;
  feeComponents?: FeeComponentDTO[];
  discountInCents?: number;
  quantity?: number;
}

export interface PriceSimulationResult {
  basePriceInCents: number;
  salePriceInCents: number;
  quantity: number;
  subtotalInCents: number;
  discountInCents: number;
  buyerFeeInCents: number;
  producerFeeInCents: number;
  buyerTotalInCents: number;
  producerNetInCents: number;
  feeBreakdown: Array<{
    name: string;
    payer: 'BUYER' | 'PRODUCER';
    amountInCents: number;
    percentageApplied?: number;
  }>;
}

export interface PricingMatrixCellDTO {
  sectionId: string;
  ticketTypeId: string;
  priceConfigId?: string;
  basePriceInCents: number;
  salePriceInCents: number;
  buyerTotalInCents: number;
  producerNetInCents: number;
  active: boolean;
  feeComponents?: FeeComponentDTO[];
}

export interface PricingMatrixDTO {
  batchId: string;
  batchName: string;
  sections: Array<{ id: string; name: string; capacity: number }>;
  ticketTypes: Array<{ id: string; name: string; category: TicketTypeCategory }>;
  cells: Record<string, PricingMatrixCellDTO>; // `${sectionId}_${ticketTypeId}`
}

export interface BulkPricingUpdateInput {
  batchId: string;
  targetSectionIds?: string[];
  targetTicketTypeIds?: string[];
  operation: 'SET_VALUE' | 'INCREASE_PERCENTAGE' | 'DECREASE_PERCENTAGE' | 'INCREASE_FIXED' | 'DECREASE_FIXED';
  value: number; // e.g. 15000 (R$ 150), 10 (10%), 2000 (R$ 20)
  roundingPolicy?: 'NONE' | 'ROUND_UP_INT' | 'ROUND_NEAREST_TEN' | 'ROUND_CENTS_99';
  dryRun?: boolean;
}

export interface BulkPricingUpdateResult {
  updatedCount: number;
  preview: Array<{
    sectionId: string;
    sectionName: string;
    ticketTypeId: string;
    ticketTypeName: string;
    oldPriceInCents: number;
    newPriceInCents: number;
    oldBuyerTotalInCents: number;
    newBuyerTotalInCents: number;
  }>;
}

export type SalesRuleType =
  | 'MAX_PER_ORDER'
  | 'MIN_PER_ORDER'
  | 'MAX_PER_CUSTOMER'
  | 'SALES_WINDOW'
  | 'REQUIRES_CODE'
  | 'REQUIRES_DOCUMENT'
  | 'HALF_PRICE_LIMIT';

export type SalesRuleScope = 'EVENT' | 'SESSION' | 'BATCH' | 'TICKET_TYPE';

export interface SalesRuleDTO {
  id: string;
  eventId: string;
  type: SalesRuleType;
  scope: SalesRuleScope;
  scopeId?: string | null;
  scopeName?: string | null;
  name: string;
  description?: string | null;
  ruleConfig: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesRuleInput {
  type: SalesRuleType;
  scope: SalesRuleScope;
  scopeId?: string;
  name: string;
  description?: string;
  ruleConfig: Record<string, any>;
  active?: boolean;
}

export interface UpdateSalesRuleInput extends Partial<CreateSalesRuleInput> {}

// ==========================================
// FASE 1.2.7 — CANAIS DE VENDA, CORTESIAS & EQUIPE DO EVENTO
// ==========================================

// --- CANAIS DE VENDA ---
export type SalesChannelType =
  | 'ONLINE'
  | 'BOX_OFFICE'
  | 'POS'
  | 'INTERNAL'
  | 'PARTNER'
  | 'AFFILIATE'
  | 'INVITATION'
  | 'API';

export interface SalesChannelDTO {
  id: string;
  code: string;
  name: string;
  type: SalesChannelType;
  scope: 'GLOBAL' | 'PRODUCER';
  producerId?: string | null;
  active: boolean;
  configuration?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelAllocationDTO {
  id: string;
  eventSalesChannelId: string;
  inventoryPoolId: string;
  poolSectionName?: string;
  quantityLimit: number;
  quantityConsumed: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSalesChannelDTO {
  id: string;
  eventId: string;
  salesChannelId: string;
  salesChannel?: SalesChannelDTO;
  enabled: boolean;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  configuration?: Record<string, any>;
  sessionIds?: string[];
  sectionIds?: string[];
  ticketTypeIds?: string[];
  batchIds?: string[];
  allocations?: ChannelAllocationDTO[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureEventSalesChannelInput {
  salesChannelId: string;
  enabled?: boolean;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  configuration?: Record<string, any>;
  sessionIds?: string[];
  sectionIds?: string[];
  ticketTypeIds?: string[];
  batchIds?: string[];
}

export interface SaveChannelAllocationInput {
  inventoryPoolId: string;
  quantityLimit: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface SalesPointDTO {
  id: string;
  producerId?: string | null;
  name: string;
  type: 'BOX_OFFICE' | 'STORE' | 'PARTNER_POS';
  venueId?: string | null;
  venueName?: string | null;
  address?: string | null;
  active: boolean;
  terminalsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesPointInput {
  producerId?: string;
  name: string;
  type: 'BOX_OFFICE' | 'STORE' | 'PARTNER_POS';
  venueId?: string;
  address?: string;
  active?: boolean;
}

export interface SalesTerminalDTO {
  id: string;
  salesPointId: string;
  name: string;
  code: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPartnerDTO {
  id: string;
  producerId?: string | null;
  name: string;
  document: string;
  type: 'AGENCY' | 'PROMOTER' | 'POS_PARTNER' | 'SPONSOR' | 'COMPANY';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- CORTESIAS ---
export interface ComplimentaryCategoryDTO {
  id: string;
  eventId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface ComplimentaryQuotaDTO {
  id: string;
  eventId: string;
  sessionId?: string | null;
  sectionId?: string | null;
  quantityLimit: number;
  quantityUsed: number;
  quantityReserved: number;
  policyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ComplimentaryRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ISSUING'
  | 'ISSUED'
  | 'PARTIALLY_ISSUED'
  | 'CANCELLED';

export interface ComplimentaryGuestDTO {
  id: string;
  requestId: string;
  name: string;
  email?: string | null;
  document?: string | null;
  phone?: string | null;
  notes?: string | null;
  ticketId?: string | null;
  issued: boolean;
  issuedAt?: string | null;
}

export interface ComplimentaryRequestDTO {
  id: string;
  code: string;
  eventId: string;
  sessionId: string;
  sessionName?: string;
  sectionId: string;
  sectionName?: string;
  categoryId: string;
  categoryName?: string;
  quantity: number;
  quantityIssued: number;
  reason: string;
  requesterId: string;
  requesterName: string;
  status: ComplimentaryRequestStatus;
  approvalRequestId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  guests?: ComplimentaryGuestDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplimentaryRequestInput {
  sessionId: string;
  sectionId: string;
  categoryId: string;
  quantity: number;
  reason: string;
  guests?: {
    name: string;
    email?: string;
    document?: string;
    phone?: string;
    notes?: string;
  }[];
}

export interface AddComplimentaryGuestsInput {
  guests: {
    name: string;
    email?: string;
    document?: string;
    phone?: string;
    notes?: string;
  }[];
}

// --- EQUIPE DO EVENTO ---
export interface EventTeamDTO {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  leaderMemberId?: string | null;
  leaderName?: string | null;
  memberCount?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTeamInput {
  name: string;
  description?: string;
  leaderMemberId?: string;
  active?: boolean;
}

export interface EventTeamMemberDTO {
  id: string;
  eventId: string;
  userId?: string | null;
  externalPersonId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  roleName: string;
  teamId?: string | null;
  teamName?: string | null;
  active: boolean;
  emergencyContact?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTeamMemberInput {
  userId?: string;
  externalPersonId?: string;
  name: string;
  email: string;
  phone?: string;
  roleName: string;
  teamId?: string;
  active?: boolean;
  emergencyContact?: string;
}

export interface CreateEventResponsibilityInput {
  memberId: string;
  responsibilityType: EventResponsibilityType;
  title: string;
  scope: 'EVENT' | 'SESSION' | 'SECTION' | 'ACCESS_POINT' | 'SALES_POINT';
  scopeId?: string;
  notes?: string;
  active?: boolean;
}

export interface EventTeamShiftDTO {
  id: string;
  eventId: string;
  teamId: string;
  teamName?: string;
  sessionId?: string | null;
  sessionName?: string | null;
  name: string;
  startAt: string;
  endAt: string;
  active: boolean;
  assignedMemberIds?: string[];
  assignedMembers?: EventTeamMemberDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTeamShiftInput {
  teamId: string;
  sessionId?: string;
  name: string;
  startAt: string;
  endAt: string;
  assignedMemberIds?: string[];
  active?: boolean;
}

export interface ShiftConflictDTO {
  memberId: string;
  memberName: string;
  shiftA: { id: string; name: string; teamName: string; startAt: string; endAt: string };
  shiftB: { id: string; name: string; teamName: string; startAt: string; endAt: string };
  message: string;
}

// ==========================================
// FASE 1.2.8 — DOCUMENTOS, PENDÊNCIAS & READINESS DO EVENTO
// ==========================================

export type ReadinessTarget =
  | 'REVIEW'
  | 'PUBLICATION'
  | 'SALES'
  | 'OPERATION'
  | 'CLOSURE';

export type ReadinessStatus =
  | 'READY'
  | 'WARNING'
  | 'BLOCKED'
  | 'NOT_APPLICABLE'
  | 'PENDING';

export type ReadinessSeverity =
  | 'INFO'
  | 'WARNING'
  | 'BLOCKING'
  | 'CRITICAL';

export interface ReadinessIssueDTO {
  code: string;
  category: 'INFO' | 'VENUE' | 'SESSIONS' | 'CAPACITY' | 'INVENTORY' | 'PRICING' | 'CHANNELS' | 'DOCUMENTS' | 'TEAM' | 'COMPLIANCE';
  categoryLabel: string;
  status: ReadinessStatus;
  severity: ReadinessSeverity;
  title: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  actionCode?: string;
  actionLabel?: string;
  actionRoute?: string;
  target: ReadinessTarget;
  detectedAt: string;
  sessionId?: string;
  sessionName?: string;
  sectionId?: string;
  sectionName?: string;
}

export interface EventReadinessDTO {
  eventId: string;
  status: ReadinessStatus;
  scorePercentage: number;
  targets: Record<ReadinessTarget, ReadinessStatus>;
  summary: {
    totalChecks: number;
    readyCount: number;
    warningCount: number;
    blockingCount: number;
    pendingCount: number;
    criticalCount: number;
  };
  categories: {
    category: string;
    label: string;
    status: ReadinessStatus;
    issuesCount: number;
  }[];
  issues: ReadinessIssueDTO[];
  evaluatedAt: string;
}

export type EventDocumentRequirementStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VALID'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXPIRING';

export interface EventDocumentRequirementDTO {
  id: string;
  eventId: string;
  categoryCode: string;
  categoryName: string;
  required: boolean;
  blocking: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  status: EventDocumentRequirementStatus;
  linkedDocumentId?: string | null;
  linkedDocumentName?: string | null;
  linkedDocumentUrl?: string | null;
  fileSize?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequirementInput {
  categoryCode: string;
  categoryName: string;
  required?: boolean;
  blocking?: boolean;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
}

export interface UploadEventDocumentInput {
  requirementId: string;
  documentName: string;
  fileSize?: string;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
}

export interface EventTaskDTO {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigneeName?: string;
  assigneeRole?: string;
  dueDate?: string | null;
  blockingPublication: boolean;
  origin: 'READINESS' | 'DOCUMENT' | 'OPERATION' | 'TEAM' | 'FINANCE';
  issueCode?: string;
  deduplicationKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTaskInput {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeName?: string;
  assigneeRole?: string;
  dueDate?: string;
  blockingPublication?: boolean;
  origin?: 'READINESS' | 'DOCUMENT' | 'OPERATION' | 'TEAM' | 'FINANCE';
  issueCode?: string;
  deduplicationKey?: string;
}

// ==========================================
// FASE 1.2.9: STATE MACHINE, REVISÃO & PUBLICAÇÃO
// ==========================================

export interface EventTransitionInput {
  targetStatus: EventStatus;
  reason?: string;
  notes?: string;
}

export interface AvailableTransitionDTO {
  targetStatus: EventStatus;
  label: string;
  allowed: boolean;
  blockReasons?: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}

export interface EventAvailableTransitionsResponse {
  currentStatus: EventStatus;
  currentStatusLabel: string;
  transitions: AvailableTransitionDTO[];
}

export interface EventReviewSnapshotDTO {
  id: string;
  eventId: string;
  eventVersion: number;
  configurationHash: string;
  submittedBy: string;
  submittedByName?: string;
  submittedAt: string;
  status: 'VALID' | 'INVALIDATED' | 'SUPERSEDED';
  invalidatedReason?: string | null;
  summaryData: {
    eventName: string;
    sessionsCount: number;
    sectionsCount: number;
    batchesCount: number;
    channelsCount: number;
    readinessScore: number;
    totalCapacity: number;
  };
}

export type EventPublicationMode = 'IMMEDIATE' | 'SCHEDULED';

export interface EventPublicationScheduleDTO {
  id: string;
  eventId: string;
  scheduledAt: string;
  timezone: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'BLOCKED';
  createdBy: string;
  createdAt: string;
  executedAt?: string | null;
  failureReason?: string | null;
}

export interface PublishEventInput {
  mode: EventPublicationMode;
  scheduledAt?: string;
  timezone?: string;
  openSalesImmediately?: boolean;
}

export interface PauseSalesInput {
  reason: string;
  channelIds?: string[];
}

export interface EventPreviewTokenDTO {
  token: string;
  previewUrl: string;
  expiresAt: string;
  eventId: string;
}

// ==========================================
// FASE 1.2.10: ALTERAÇÕES CONTROLADAS & IMPACTO
// ==========================================

export type EventChangeType =
  | 'EVENT_DATE'
  | 'EVENT_VENUE'
  | 'SESSION_DATE'
  | 'SESSION_STATUS'
  | 'SECTION_CAPACITY'
  | 'SECTION_NAME'
  | 'PRICE_ADJUSTMENT'
  | 'FEE_ADJUSTMENT'
  | 'BATCH_PRICE'
  | 'BATCH_QUANTITY'
  | 'BATCH_DATES'
  | 'SALES_CHANNEL'
  | 'CHANNEL_STATUS'
  | 'VISIBILITY'
  | 'STRUCTURE_MAP'
  | 'EVENT_INFO'
  | 'POLICY_UPDATE'
  | 'COMPLIMENTARY_QUOTA'
  | 'INTERNAL_NOTE';

export type EventChangeClassification =
  | 'NON_CRITICAL'
  | 'REVIEW_INVALIDATING'
  | 'PUBLICATION_CRITICAL'
  | 'POST_SALES_CRITICAL';

export type EventChangeRequestStatus =
  | 'DRAFT'
  | 'ANALYZING'
  | 'READY_FOR_SUBMISSION'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'STALE'
  | 'SCHEDULED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export interface EventChangePayload {
  field: string;
  fieldName: string;
  before: any;
  after: any;
  beforeFormatted?: string;
  afterFormatted?: string;
}

export interface EventChangeImpactDTO {
  requestId: string;
  calculatedAt: string;
  dataVersion: string;
  snapshotHash: string;
  isStale: boolean;
  affectedCustomers: number;
  affectedOrders: number;
  affectedTickets: number;
  financialAmount: number; // centavos
  checkedInTickets: number;
  affectedInventory: {
    poolId?: string;
    sectionName?: string;
    capacityBefore: number;
    capacityAfter: number;
    difference: number;
    committed: number;
    deficit: number;
    isDeficit: boolean;
  };
  affectedTeamMembers: number;
  affectedAccessPoints: number;
  warnings: string[];
  blockers: string[];
  requiresApproval: boolean;
  recommendedApprovers: string[];
}

export interface EventChangeRequestDTO {
  id: string;
  publicCode: string; // ALT-XXXXXX
  eventId: string;
  sessionId?: string | null;
  sessionName?: string | null;
  resourceType: string;
  resourceId: string;
  changeType: EventChangeType;
  classification: EventChangeClassification;
  status: EventChangeRequestStatus;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  reason: string;
  businessJustification?: string | null;
  changePayload: EventChangePayload;
  impact?: EventChangeImpactDTO | null;
  approvalRequestId?: string | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  rejectionReason?: string | null;
  scheduledExecutionAt?: string | null;
  executedAt?: string | null;
  executedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventChangeRequestInput {
  sessionId?: string;
  resourceType: string;
  resourceId: string;
  changeType: EventChangeType;
  reason: string;
  businessJustification?: string;
  changePayload: EventChangePayload;
}

// ==========================================
// FASE 1.2.11: DASHBOARD EXECUTIVO & OPERACIONAL
// ==========================================

export type DashboardViewType = 'EXECUTIVE' | 'COMMERCIAL' | 'OPERATIONAL';

export interface EventDashboardKPIs {
  grossSalesInCents: number;
  grossSalesFormatted: string;
  paidOrdersCount: number;
  ticketsSoldCount: number;
  occupancyPercentage: number;
  totalCommercialCapacity: number;
  totalCommittedTickets: number;
  totalAvailableTickets: number;
}

export interface SectionOccupancyDTO {
  sectionId: string;
  sectionName: string;
  capacity: number;
  sold: number;
  complimentary: number;
  available: number;
  occupancyPercentage: number;
}

export interface SessionDashboardItemDTO {
  sessionId: string;
  name: string;
  startAt: string;
  status: string;
  ticketsSold: number;
  capacity: number;
  occupancyPercentage: number;
}

export interface BatchDashboardItemDTO {
  batchId: string;
  batchName: string;
  phase: number;
  status: string;
  ticketsSold: number;
  totalCapacity: number;
  percentageUsed: number;
  lowStockAlert: boolean;
}

export interface ChannelDashboardItemDTO {
  channelId: string;
  channelName: string;
  channelType: string;
  ticketsIssued: number;
  percentageOfTotal: number;
}

export interface DashboardAlertDTO {
  id: string;
  source: 'READINESS' | 'INVENTORY' | 'DOCUMENT' | 'TASK' | 'CHANGES' | 'CHECKIN';
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  actionLabel?: string;
  actionCode?: string;
  actionRoute?: string;
  detectedAt: string;
  isDismissible: boolean;
}

export interface DataFreshnessDTO {
  generatedAt: string;
  salesFreshnessSeconds: number;
  inventoryFreshnessSeconds: number;
  isRealtimeConnected: boolean;
}

export interface EventDashboardDTO {
  eventId: string;
  eventName: string;
  eventStatus: EventStatus;
  publicCode: string;
  venueName?: string;
  cityName?: string;
  selectedSessionId?: string | null;
  viewType: DashboardViewType;
  kpis: EventDashboardKPIs;
  sections: SectionOccupancyDTO[];
  sessions: SessionDashboardItemDTO[];
  nextSession?: SessionDashboardItemDTO | null;
  batches: BatchDashboardItemDTO[];
  channels: ChannelDashboardItemDTO[];
  readinessSummary: {
    status: ReadinessStatus;
    scorePercentage: number;
    blockingCount: number;
    warningCount: number;
  };
  tasksSummary: {
    openTasksCount: number;
    criticalTasksCount: number;
  };
  changesSummary: {
    pendingApprovalCount: number;
    readyForExecutionCount: number;
  };
  checkinSummary?: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'CLOSED';
    validatedCount: number;
    percentageCheckedIn: number;
  } | null;
  financeSummary?: {
    grossAmountInCents: number;
    feeAmountInCents: number;
    authorized: boolean;
  } | null;
  alerts: DashboardAlertDTO[];
  freshness: DataFreshnessDTO;
}

// ==============================================================================
// FASE 1.2.12: CENTRAL DE OPERAÇÃO DO EVENTO EM TEMPO REAL
// ==============================================================================

export type OperationStatus = 'PREPARATION' | 'READY' | 'OPENING' | 'ACTIVE' | 'CLOSING' | 'CLOSED';

export type OperationReadinessStatus = 'READY' | 'WARNING' | 'BLOCKED';

export interface OperationReadinessItemDTO {
  code: string;
  label: string;
  category: 'SESSION' | 'TEAM' | 'ACCESS' | 'DEVICES' | 'DOCS' | 'TASKS' | 'CHECKIN' | 'INFRA';
  status: OperationReadinessStatus;
  message: string;
  details?: string;
  isOverridable: boolean;
  isOverridden?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
}

export interface OperationReadinessDTO {
  status: OperationReadinessStatus;
  canOpen: boolean;
  items: OperationReadinessItemDTO[];
  blockingCount: number;
  warningCount: number;
  lastCheckedAt: string;
}

export interface EventOperationSessionDTO {
  id: string;
  eventId: string;
  sessionId: string;
  sessionName?: string;
  sessionDate?: string;
  venueName?: string;
  status: OperationStatus;
  plannedOpeningAt: string;
  actualOpeningAt?: string | null;
  startedAt?: string | null;
  closingStartedAt?: string | null;
  closedAt?: string | null;
  openedBy?: string | null;
  closedBy?: string | null;
  version: number;
  sequence: number;
  notes?: string | null;
}

export type OperationAreaCode =
  | 'ACESSOS'
  | 'CHECKIN'
  | 'BILHETERIA'
  | 'SEGURANCA'
  | 'SUPORTE'
  | 'PRODUCAO'
  | 'ATENDIMENTO'
  | 'CREDENCIAMENTO';

export interface OperationAreaDTO {
  id: string;
  eventId: string;
  sessionId?: string | null;
  areaCode: string;
  name: string;
  description?: string;
  leadUserId?: string | null;
  leadUserName?: string | null;
  active: boolean;
  staffPresentCount: number;
  staffTotalCount: number;
  openIncidentsCount: number;
}

export type OperationShiftStatus = 'SCHEDULED' | 'PRESENT' | 'LATE' | 'ABSENT' | 'FINISHED';

export interface OperationShiftDTO {
  id: string;
  operationId: string;
  memberId: string;
  memberName: string;
  areaId: string;
  areaCode: string;
  startsAt: string;
  endsAt: string;
  role: string;
  status: OperationShiftStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  notes?: string | null;
}

export interface SessionAccessPointDTO {
  id: string;
  operationId: string;
  sessionId: string;
  accessPointId: string;
  name: string;
  type: 'ENTRY' | 'EXIT' | 'EMERGENCY' | 'VIP';
  status: 'OPEN' | 'CLOSED' | 'PAUSED';
  executionMode: 'LOGICAL' | 'INTEGRATION';
  openedAt?: string | null;
  closedAt?: string | null;
  validatedCount: number;
  rejectedCount: number;
  lastActivityAt?: string | null;
}

export type OperationCommandType =
  | 'OPEN_OPERATION'
  | 'START_CLOSING'
  | 'CLOSE_OPERATION'
  | 'OPEN_ACCESS_POINT'
  | 'CLOSE_ACCESS_POINT'
  | 'PAUSE_ACCESS_POINT'
  | 'RESUME_ACCESS_POINT'
  | 'START_CHECKIN'
  | 'PAUSE_CHECKIN'
  | 'RESUME_CHECKIN'
  | 'ACKNOWLEDGE_ALERT'
  | 'OVERRIDE_BLOCKER';

export interface OperationCommandDTO {
  id: string;
  operationId: string;
  sessionId: string;
  commandType: OperationCommandType;
  targetType: string;
  targetId?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  executionMode: 'LOGICAL' | 'INTEGRATION';
  executedAt: string;
  idempotencyKey?: string | null;
  reason?: string | null;
  payload?: any;
}

export interface OperationTimelineEventDTO {
  id: string;
  sequence: number;
  timestamp: string;
  category: 'COMMAND' | 'INCIDENT' | 'CHECKIN' | 'ACCESS' | 'SYSTEM' | 'BROADCAST';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  description: string;
  actorName?: string;
  metadata?: Record<string, any>;
}

export interface OperationBroadcastDTO {
  id: string;
  operationId: string;
  targetAreaId?: string | null;
  targetAreaName?: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  sentBy: string;
  sentByName: string;
  sentAt: string;
  requiresAck: boolean;
  acknowledgementsCount: number;
}

export interface OperationHandoffDTO {
  id: string;
  operationId: string;
  areaId?: string | null;
  areaName?: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  notes: string;
  openIncidentsCount: number;
  openTasksCount: number;
  createdAt: string;
}

export interface DeviceHealthDTO {
  id: string;
  name: string;
  type: 'POS' | 'TURNSTILE' | 'SCANNER' | 'PRINTER';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'SYNC_PENDING' | 'DISABLED';
  areaCode: string;
  batteryLevel?: number;
  lastPingAt: string;
}

export interface OperationKPIs {
  attendeesCheckedIn: number;
  expectedAttendees: number;
  checkInPercentage: number;
  checkInSpeedPerMinute: number;
  openAccessPointsCount: number;
  totalAccessPointsCount: number;
  staffPresentCount: number;
  staffTotalCount: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  activeAlertsCount: number;
  devicesOnlineCount: number;
  devicesTotalCount: number;
}

export interface OperationSnapshotDTO {
  operation: EventOperationSessionDTO;
  readiness: OperationReadinessDTO;
  kpis: OperationKPIs;
  areas: OperationAreaDTO[];
  accessPoints: SessionAccessPointDTO[];
  teamShifts: OperationShiftDTO[];
  activeIncidents: any[];
  activeAlerts: any[];
  openTasks: any[];
  recentBroadcasts: OperationBroadcastDTO[];
  recentHandoffs: OperationHandoffDTO[];
  devicesHealth: DeviceHealthDTO[];
  timeline: OperationTimelineEventDTO[];
  sequence: number;
  generatedAt: string;
  isRealtimeConnected: boolean;
}

// ============================================================================
// FASE 1.2.13 — CHECK-IN + CONTROLE DE ACESSO + DISPOSITIVOS
// ============================================================================

export type AccessValidationDecision = 'ALLOW' | 'DENY' | 'REVIEW';

export type AccessReasonCode =
  | 'ACCESS_ALLOWED'
  | 'TICKET_NOT_FOUND'
  | 'TICKET_INVALID_STATUS'
  | 'TICKET_WRONG_EVENT'
  | 'TICKET_WRONG_SESSION'
  | 'TICKET_WRONG_ACCESS_POINT'
  | 'TICKET_WRONG_SECTOR'
  | 'TICKET_ENTRY_WINDOW_NOT_OPEN'
  | 'TICKET_ENTRY_WINDOW_CLOSED'
  | 'TICKET_ALREADY_USED'
  | 'REENTRY_NOT_ALLOWED'
  | 'REENTRY_LIMIT_EXCEEDED'
  | 'EXIT_RECORDED'
  | 'TICKET_BLOCKED'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_REVOKED'
  | 'DEVICE_UNAUTHORIZED_POINT'
  | 'DEVICE_SESSION_EXPIRED'
  | 'ACCESS_RULE_RESTRICTION'
  | 'EXCEPTION_PENDING_SUPERVISOR'
  | 'EXCEPTION_APPROVED'
  | 'OFFLINE_SYNC_ACCEPTED'
  | 'CONFLICT_DUPLICATE_OFFLINE';

export type AccessMovementType = 'ENTRY' | 'REENTRY' | 'EXIT' | 'MANUAL_ENTRY';

export type ReentryPolicyType = 'NO_REENTRY' | 'REENTRY_ALLOWED' | 'REENTRY_AFTER_EXIT' | 'LIMITED_REENTRY';

export type AccessDeviceType = 'MOBILE_APP' | 'DEDICATED_SCANNER' | 'TURNSTILE' | 'DESKTOP_POS' | 'TOTEM';

export type AccessDeviceStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'REVOKED' | 'MAINTENANCE';

export interface AccessValidationRequestDTO {
  tokenOrCode: string;
  eventId: string;
  sessionId: string;
  accessPointId: string;
  deviceId: string;
  operatorId: string;
  operatorName?: string;
  movementType?: AccessMovementType;
  offlineTimestamp?: string;
  validationRequestId?: string;
  overrideJustification?: string;
}

export interface AccessValidationResultDTO {
  id: string;
  decision: AccessValidationDecision;
  reasonCode: AccessReasonCode;
  message: string;
  timestamp: string;
  validationRequestId: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    ticketType: string;
    sectorName?: string;
    seatInfo?: string;
    attendeeName?: string;
    documentNumberMasked?: string;
  };
  session?: {
    id: string;
    name: string;
  };
  accessPoint?: {
    id: string;
    name: string;
    code: string;
  };
  movementType: AccessMovementType;
  entriesCount: number;
  maxEntriesAllowed: number;
  requiresSupervisorReview?: boolean;
  offlineProcessed?: boolean;
}

export interface AccessDeviceDTO {
  id: string;
  eventId: string;
  name: string;
  deviceCode: string;
  type: AccessDeviceType;
  status: AccessDeviceStatus;
  apiKeyMasked?: string;
  batteryLevel?: number;
  appVersion?: string;
  allowedAccessPointIds: string[];
  allowedSessionIds: string[];
  currentSessionId?: string;
  lastHeartbeatAt?: string;
  lastSyncAt?: string;
  registeredBy: string;
  revokedAt?: string;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSessionDTO {
  id: string;
  deviceId: string;
  eventId: string;
  sessionId: string;
  accessPointId: string;
  operatorId: string;
  operatorName: string;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
  validationsCount: number;
  allowsCount: number;
  deniesCount: number;
}

export interface AccessRuleDTO {
  id: string;
  eventId: string;
  sessionId?: string;
  name: string;
  ticketTypeIds: string[];
  allowedAccessPointIds: string[];
  allowedSectionIds: string[];
  reentryPolicy: ReentryPolicyType;
  maxReentries: number;
  windowStartsBeforeMinutes: number;
  windowEndsAfterMinutes: number;
  active: boolean;
}

export interface OfflineValidationBundleDTO {
  bundleId: string;
  eventId: string;
  sessionId: string;
  accessPointId: string;
  deviceId: string;
  generatedAt: string;
  validUntil: string;
  ticketsSummary: {
    totalTickets: number;
  };
  tickets: Array<{
    id: string;
    tokenHash: string;
    ticketNumber: string;
    ticketTypeId: string;
    ticketTypeName: string;
    sectionName?: string;
    attendeeName?: string;
    reentryPolicy: ReentryPolicyType;
    maxEntries: number;
    currentEntries: number;
    status: string;
    isBlocked: boolean;
  }>;
  rules: AccessRuleDTO[];
}

export interface OfflineSyncBatchItemDTO {
  validationRequestId: string;
  tokenOrCode: string;
  movementType: AccessMovementType;
  accessPointId: string;
  localTimestamp: string;
  offlineDecision: AccessValidationDecision;
  offlineReasonCode: AccessReasonCode;
}

export interface OfflineSyncBatchDTO {
  batchId: string;
  deviceId: string;
  eventId: string;
  sessionId: string;
  operatorId: string;
  items: OfflineSyncBatchItemDTO[];
}

export interface OfflineConflictDTO {
  id: string;
  batchId: string;
  ticketId: string;
  ticketNumber: string;
  conflictType: 'CONFLICT_DUPLICATE_OFFLINE' | 'STATUS_CHANGED_ONLINE' | 'DEVICE_REVOKED_OFFLINE';
  serverMovementAt?: string;
  offlineMovementAt: string;
  deviceId: string;
  operatorId: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface TicketAccessBlockDTO {
  id: string;
  ticketId: string;
  ticketNumber: string;
  eventId: string;
  reason: string;
  blockedBy: string;
  blockedByName: string;
  blockedAt: string;
  active: boolean;
  unblockedBy?: string;
  unblockedAt?: string;
  unblockReason?: string;
}

export interface AccessExceptionRequestDTO {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  eventId: string;
  sessionId: string;
  accessPointId: string;
  deviceId: string;
  operatorId: string;
  operatorName: string;
  reason: string;
  requestedMovement: AccessMovementType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisorId?: string;
  supervisorName?: string;
  decidedAt?: string;
  decisionNotes?: string;
  createdAt: string;
}

export interface CheckinSummaryDTO {
  eventId: string;
  sessionId?: string;
  totalTicketsSold: number;
  totalCheckedIn: number;
  checkInPercentage: number;
  totalExits: number;
  totalInsideVenue: number;
  validationsTotal: number;
  validationsAllowed: number;
  validationsDenied: number;
  validationsReview: number;
  recentValidations: AccessValidationResultDTO[];
  byAccessPoint: Array<{
    accessPointId: string;
    accessPointName: string;
    code: string;
    totalAllowed: number;
    totalDenied: number;
  }>;
  byTicketType: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    sold: number;
    checkedIn: number;
    percentage: number;
  }>;
  conflictsCount: number;
  devicesOnlineCount: number;
  generatedAt: string;
}

// ============================================================================
// FASE 1.2.14 — ENCERRAMENTO + CANCELAMENTO + PÓS-EVENTO + ARQUIVAMENTO
// ============================================================================

export type ClosureCheckCategory =
  | 'OPERATION'
  | 'CHECKIN'
  | 'DEVICES'
  | 'OFFLINE_SYNC'
  | 'INCIDENTS'
  | 'TASKS'
  | 'ACCESS_POINTS'
  | 'FINANCIAL_READINESS';

export type ClosureCheckStatus = 'PASSED' | 'WARNING' | 'BLOCKER';

export interface ClosureCheckItemDTO {
  code: string;
  category: ClosureCheckCategory;
  title: string;
  description: string;
  status: ClosureCheckStatus;
  blocking: boolean;
  metrics?: Record<string, any>;
  resolutionAdvice?: string;
}

export interface SessionClosureReadinessDTO {
  sessionId: string;
  sessionName: string;
  canClose: boolean;
  hasBlockers: boolean;
  checks: ClosureCheckItemDTO[];
  summary: {
    passedCount: number;
    warningCount: number;
    blockerCount: number;
  };
  evaluatedAt: string;
}

export interface EventClosureReadinessDTO {
  eventId: string;
  eventName: string;
  canClose: boolean;
  allSessionsClosed: boolean;
  sessionsSummary: Array<{
    sessionId: string;
    sessionName: string;
    status: string;
    isClosed: boolean;
  }>;
  checks: ClosureCheckItemDTO[];
  blockers: string[];
  evaluatedAt: string;
}

export interface ClosureOverrideDTO {
  id: string;
  scope: 'SESSION' | 'EVENT';
  targetId: string;
  checkCode: string;
  justification: string;
  authorizedBy: string;
  authorizedByName: string;
  createdAt: string;
}

export interface SessionClosureRecordDTO {
  id: string;
  sessionId: string;
  sessionName: string;
  eventId: string;
  closedBy: string;
  closedByName: string;
  closedAt: string;
  hadBlockerOverrides: boolean;
  overridesCount: number;
  finalCheckinCount: number;
  finalCapacityUsed: number;
  notes?: string;
}

export interface EventClosureRecordDTO {
  id: string;
  eventId: string;
  eventName: string;
  closedBy: string;
  closedByName: string;
  closedAt: string;
  statusBefore: string;
  statusAfter: string;
  hadBlockerOverrides: boolean;
  overridesCount: number;
  notes?: string;
}

export interface EventClosureSnapshotDTO {
  id: string;
  eventId: string;
  closedAt: string;
  sessionsCount: number;
  totalTicketsSold: number;
  totalCheckedIn: number;
  checkInRate: number;
  totalOrdersCount: number;
  totalGrossRevenue: number;
  incidentsSummary: {
    total: number;
    resolved: number;
    unresolved: number;
  };
  tasksSummary: {
    total: number;
    completed: number;
    uncompleted: number;
  };
  devicesSummary: {
    totalDevices: number;
    offlineBatchesSynced: number;
    conflictsRecorded: number;
  };
  closureRecords: SessionClosureRecordDTO[];
}

export interface CancellationImpactSnapshotDTO {
  eventId: string;
  sessionId?: string;
  isPartialSessionCancellation: boolean;
  totalSessionsAffected: number;
  totalTicketsIssued: number;
  totalTicketsSold: number;
  totalTicketsCheckedIn: number;
  totalOrdersCount: number;
  grossRevenueToRefund: number;
  customersAffectedCount: number;
  activeAccessPointsCount: number;
  activeStaffAllocatedCount: number;
  activeSalesChannelsCount: number;
  activeMarketingCampaignsCount: number;
  calculatedAt: string;
}

export interface EventCancellationRequestDTO {
  id: string;
  eventId: string;
  sessionId?: string;
  isPartialSession: boolean;
  reason: string;
  cancellationCategory: 'FORCE_MAJEURE' | 'ORGANIZER_DECISION' | 'WEATHER' | 'SECURITY' | 'LEGAL' | 'OTHER';
  impactSnapshot: CancellationImpactSnapshotDTO;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  approvalRequestId?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'REJECTED';
  executedBy?: string;
  executedByName?: string;
  executedAt?: string;
  refundPolicyNotes: string;
  notifyCustomers: boolean;
}

export interface EventOperationalReportDTO {
  eventId: string;
  eventName: string;
  eventStatus: string;
  period: {
    startAt?: string;
    endAt?: string;
    closedAt?: string;
  };
  venue: {
    name?: string;
    city?: string;
    state?: string;
  };
  operationalKPIs: {
    totalCapacity: number;
    totalTicketsSold: number;
    totalTicketsCheckedIn: number;
    attendancePercentage: number;
    peakCheckinHour?: string;
    peakValidationsPerMinute: number;
    totalIncidents: number;
    criticalIncidents: number;
    totalHandoffs: number;
    devicesUsedCount: number;
    conflictsResolvedCount: number;
  };
  sessions: Array<{
    sessionId: string;
    sessionName: string;
    status: string;
    capacity: number;
    sold: number;
    checkedIn: number;
    closedAt?: string;
  }>;
  incidentsByType: Record<string, number>;
  generatedAt: string;
}

export interface EventArchiveRecordDTO {
  id: string;
  eventId: string;
  eventName: string;
  statusBeforeArchive: string;
  archivedBy: string;
  archivedByName: string;
  archivedAt: string;
  justification: string;
  closureSnapshotId?: string;
  cancellationRequestId?: string;
  readOnlyEnforced: boolean;
}

// ============================================================================
// FASE 1.3.1 & 1.3.2 — COMERCIAL: PEDIDOS, VENDAS & PERFORMANCE
// ============================================================================

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface OrderBuyerSnapshotDTO {
  id?: string;
  orderId: string;
  customerId?: string;
  name: string;
  document?: string;
  documentMasked: string;
  email?: string;
  emailMasked: string;
  phone?: string;
  phoneMasked?: string;
  createdAt: string;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  eventId: string;
  sessionId?: string;
  sessionName?: string;
  eventSectionId?: string;
  sectionName?: string;
  eventTicketTypeId: string;
  ticketTypeName: string;
  ticketBatchId?: string;
  batchName?: string;
  quantity: number;
  unitBaseAmount: number;
  unitDiscountAmount: number;
  unitFeeAmount: number;
  unitFinalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  feeAmount: number;
  totalAmount: number;
  priceSnapshotId?: string;
  createdAt: string;
}

export interface OrderTimelineEventDTO {
  id: string;
  orderId: string;
  eventType: string;
  description: string;
  actorName?: string;
  actorType: 'USER' | 'SYSTEM' | 'GATEWAY' | 'SUPERVISOR';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  publicCode: string;
  producerId: string;
  eventId?: string;
  eventName?: string;
  status: OrderStatus;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  feeAmount: number;
  totalAmount: number;
  salesChannelId?: string;
  salesChannelName?: string;
  buyerCustomerId?: string;
  buyerSnapshot?: OrderBuyerSnapshotDTO;
  itemsCount: number;
  totalTicketsCount: number;
  items?: OrderItemDTO[];
  timeline?: OrderTimelineEventDTO[];
  version: number;
  expiresAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialDashboardDTO {
  context: {
    producerId?: string;
    eventId?: string;
    sessionId?: string;
  };
  period: {
    from?: string;
    to?: string;
    label: string;
  };
  summary: {
    ordersCount: number;
    ticketsSold: number;
    grossSales: number | null; // null if user lacks comercial.vendas.valores.visualizar
    averageOrderValue: number | null;
    commercialOccupancyPercentage: number;
  };
  trend: Array<{
    date: string;
    label: string;
    orders: number;
    tickets: number;
    grossSales: number | null;
  }>;
  ordersByStatus: Array<{
    status: OrderStatus;
    label: string;
    count: number;
    percentage: number;
  }>;
  salesByEvent: Array<{
    eventId: string;
    eventName: string;
    ordersCount: number;
    ticketsSold: number;
    grossSales: number | null;
    occupancyPercentage: number;
  }>;
  salesByChannel: Array<{
    channelId: string;
    channelName: string;
    ordersCount: number;
    ticketsSold: number;
    grossSales: number | null;
    sharePercentage: number;
  }>;
  recentOrders: OrderDTO[];
  opportunities: CommercialOpportunitySummaryDTO | null;
  freshness: {
    lastUpdatedAt: string;
    source: string;
  };
}

export interface CommercialPerformanceDTO {
  context: {
    producerId?: string;
    eventId?: string;
    sessionId?: string;
  };
  period: {
    from?: string;
    to?: string;
    label: string;
  };
  summary: {
    grossSales: number | null;
    ordersCount: number;
    ticketsSold: number;
    averageOrderValue: number | null;
    commercialOccupancyPercentage: number;
  };
  velocity: {
    salesPerHour: number;
    todayCount: number;
    last24hCount: number;
    last7dDailyAverage: number;
  };
  events: Array<{
    eventId: string;
    eventName: string;
    status: string;
    ordersCount: number;
    ticketsSold: number;
    capacity: number;
    occupancyPercentage: number;
    grossSales: number | null;
  }>;
  sessions: Array<{
    sessionId: string;
    sessionName: string;
    status: string;
    date: string;
    ordersCount: number;
    ticketsSold: number;
    capacity: number;
    occupancyPercentage: number;
    grossSales: number | null;
  }>;
  sections: Array<{
    sectionId: string;
    sectionName: string;
    capacity: number;
    sold: number;
    available: number;
    reserved: number;
    blocked: number;
    occupancyPercentage: number;
    grossSales: number | null;
  }>;
  ticketTypes: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    sold: number;
    grossSales: number | null;
  }>;
  batches: Array<{
    batchId: string;
    batchName: string;
    status: string;
    sold: number;
    capacity: number;
    price: number | null;
    grossSales: number | null;
  }>;
  channels: Array<{
    channelId: string;
    channelName: string;
    ordersCount: number;
    ticketsSold: number;
    grossSales: number | null;
  }>;
  alerts: CommercialAlertDTO[];
  opportunities: CommercialOpportunitySummaryDTO | null;
  freshness: {
    lastUpdatedAt: string;
  };
}

export interface CommercialAlertDTO {
  id: string;
  code: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  targetType: 'EVENT' | 'SESSION' | 'BATCH' | 'ORDER';
  targetId: string;
  createdAt: string;
}

export interface CommercialOpportunitySummaryDTO {
  abandonedCarts: number | null;
  potentialValue: number | null;
  recoveredCarts: number | null;
  recoveredRevenue: number | null;
  recoveryRate: number | null;
  lastUpdatedAt: string | null;
}

// ============================================================================
// FASE 1.3.3 — CENTRAL DE PRODUTORES + CARTEIRA + CRM B2B
// ============================================================================

export type CommercialStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface CommercialAccountDTO {
  id: string;
  producerId: string;
  commercialStatus: CommercialStatus;
  commercialOwnerId?: string;
  commercialOwnerName?: string;
  origin?: string;
  segmentId?: string;
  commercialClassification?: string;
  firstContactAt?: string;
  lastContactAt?: string;
  nextActionAt?: string;
  nextActionDescription?: string;
  notesSummary?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CommercialPortfolioRole = 'PRIMARY' | 'SUPPORT' | 'MANAGER';

export interface CommercialPortfolioAssignmentDTO {
  id: string;
  producerId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: CommercialPortfolioRole;
  isPrimary?: boolean;
  validFrom?: string;
  validUntil?: string;
  assignedAt?: string;
  assignedBy?: string;
  active?: boolean;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface ProducerContactDTO {
  id: string;
  producerId: string;
  name: string;
  roleName?: string;
  roleTitle?: string;
  email?: string;
  phone?: string;
  area?: string;
  isPrimary: boolean;
  canNegotiate?: boolean;
  notes?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CommercialLeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATING' | 'CONVERTED' | 'DISQUALIFIED' | 'LOST';

export interface CommercialLeadDTO {
  id: string;
  companyName: string;
  tradeName?: string;
  document?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  segmentId?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  email?: string;
  phone?: string;
  source?: string;
  origin?: string;
  ownerId?: string;
  ownerName?: string;
  status: CommercialLeadStatus;
  notes?: string;
  convertedAt?: string;
  convertedBy?: string;
  convertedProducerId?: string;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export type CommercialActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP' | 'VISIT' | 'NOTE' | 'FOLLOW_UP';

export interface CommercialActivityDTO {
  id: string;
  producerId?: string;
  leadId?: string;
  opportunityId?: string;
  type: CommercialActivityType;
  subject: string;
  description?: string;
  occurredAt: string;
  createdBy: string;
  createdByName?: string;
  nextActionAt?: string;
  nextActionDescription?: string;
  taskId?: string;
  createdAt: string;
}

export interface ProducerCommercialSummaryDTO {
  producer: {
    id: string;
    name: string;
    cnpj: string;
    email?: string;
    phone?: string;
    status: string;
  };
  commercialAccount: CommercialAccountDTO | null;
  portfolio: CommercialPortfolioAssignmentDTO[];
  contacts: ProducerContactDTO[];
  eventsCount: number;
  activeEventsCount: number;
  openOpportunitiesCount: number;
  pendingTasksCount: number;
  lastContactAt?: string;
  nextActionAt?: string;
  nextActionDescription?: string;
}

export interface CommercialPortfolioSummaryDTO {
  ownerId: string;
  ownerName: string;
  producersCount: number;
  activeEventsCount: number;
  openOpportunitiesCount: number;
  pendingActionsCount: number;
  overdueActionsCount: number;
}

// ============================================================================
// FASE 1.3.4 — OPORTUNIDADES + PIPELINE COMERCIAL + NEGOCIAÇÕES
// ============================================================================

export interface CommercialPipelineDTO {
  id: string;
  name: string;
  active: boolean;
  isDefault: boolean;
  version: number;
  stages: CommercialPipelineStageDTO[];
  createdAt: string;
  updatedAt: string;
}

export type PipelineStageType = 'OPEN' | 'WON' | 'CLOSED';

export interface CommercialPipelineStageDTO {
  id: string;
  pipelineId: string;
  name: string;
  code: string;
  position: number;
  stageType: PipelineStageType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CommercialOpportunityStatus = 'OPEN' | 'WON' | 'CLOSED';

export interface CommercialOpportunityDTO {
  id: string;
  publicCode: string;
  producerId?: string;
  producerName?: string;
  leadId?: string;
  leadCompanyName?: string;
  pipelineId: string;
  stageId: string;
  stageName?: string;
  stageCode?: string;
  stagePosition?: number;
  title: string;
  description?: string;
  typeId?: string;
  ownerId: string;
  ownerName?: string;
  estimatedValue?: number | null;
  expectedDecisionAt?: string;
  status: CommercialOpportunityStatus;
  wonAt?: string;
  wonBy?: string;
  closedAt?: string;
  closedBy?: string;
  closeReasonId?: string;
  closeReasonName?: string;
  closeNotes?: string;
  timeInCurrentStageDays?: number;
  lastActivityAt?: string;
  nextActionAt?: string;
  nextActionDescription?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityStageHistoryDTO {
  id: string;
  opportunityId: string;
  fromStageId?: string;
  fromStageName?: string;
  toStageId: string;
  toStageName?: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  reason?: string;
  durationSeconds?: number;
}

export interface OpportunityCloseReasonDTO {
  id: string;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export interface CommercialOpportunityMetricsDTO {
  totalOpen: number;
  inNegotiation: number;
  withoutNextAction: number;
  overdueActions: number;
  wonInPeriod: number;
  closedInPeriod: number;
  averageStageDurationDays: Record<string, number>;
  averageCycleDurationDays: number;
}





