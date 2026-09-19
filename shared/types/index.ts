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
  | 'aprovacoes.historico.visualizar';

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
