import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { UserAccount, PermissionString, RoleSlug } from '@shared/types/index';

// Initial preconfigured demo users representing the full spectrum of profiles and scopes
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'Vinicius Casagrande',
    email: 'vinicius.casagrande@diskingressos.com.br',
    status: 'active',
    roleSlug: 'admin_geral',
    roleName: 'Administrador Geral',
    organization: 'DiskIngressos Matriz',
    isInternalStaff: true,
    scope: {
      type: 'GLOBAL',
      producerIds: [],
      eventIds: []
    },
    twoFactorEnabled: true,
    twoFactorEnforced: true,
    permissions: [
      'eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar', 'eventos.evento.cancelar', 'eventos.checkin.operar', 'eventos.setores.configurar', 'eventos.cortesias.emitir',
      'comercial.produtores.visualizar', 'comercial.produtores.criar', 'comercial.produtores.editar', 'comercial.propostas.gerenciar', 'comercial.metas.visualizar',
      'suporte.incidentes.visualizar', 'suporte.incidentes.criar', 'suporte.incidentes.resolver', 'suporte.war_room.acessar',
      'sac.consulta.acessar', 'sac.pedido.visualizar', 'sac.cliente.visualizar', 'sac.ticket.criar', 'sac.ticket.encerrar', 'sac.voucher.reenviar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar', 'estorno.solicitacao.aprovar', 'estorno.solicitacao.executar', 'estorno.chargeback.gerenciar',
      'financeiro.saldo.visualizar', 'financeiro.transferencia.criar', 'financeiro.transferencia.aprovar', 'financeiro.repasses.visualizar', 'financeiro.repasses.aprovar', 'financeiro.pagamento.criar', 'financeiro.pagamento.aprovar', 'financeiro.conciliacao.executar', 'financeiro.relatorio.exportar',
      'contabilidade.diario.visualizar', 'contabilidade.lancamento.criar', 'contabilidade.dre.visualizar', 'contabilidade.balancete.visualizar', 'contabilidade.fechamento.executar',
      'marketing.campanha.visualizar', 'marketing.campanha.criar', 'marketing.campanha.publicar', 'marketing.pixel.configurar',
      'remarketing.carrinhos.visualizar', 'remarketing.regua.configurar', 'remarketing.mensagem.disparar',
      'admin.usuarios.visualizar', 'admin.usuarios.gerenciar', 'admin.perfis.gerenciar', 'admin.auditoria.visualizar', 'admin.configuracoes.editar',
      'documentos.central.visualizar', 'documentos.arquivo.visualizar', 'documentos.arquivo.enviar', 'documentos.arquivo.baixar',
      'documentos.versao.criar', 'documentos.versao.visualizar', 'documentos.arquivo.arquivar', 'documentos.arquivo.excluir',
      'documentos.categoria.visualizar', 'documentos.categoria.editar', 'documentos.auditoria.visualizar'
    ],
    lastLoginAt: '2026-09-18T14:30:00Z',
    lastIpAddress: '189.44.120.19',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'usr-fin-maria',
    name: 'Maria Oliveira',
    email: 'maria.oliveira@diskingressos.com.br',
    status: 'active',
    roleSlug: 'financeiro',
    roleName: 'Diretora Financeira (Com Aprovação)',
    organization: 'DiskIngressos Matriz',
    isInternalStaff: true,
    scope: {
      type: 'GLOBAL',
      producerIds: [],
      eventIds: []
    },
    twoFactorEnabled: true,
    twoFactorEnforced: true,
    permissions: [
      'eventos.evento.visualizar',
      'comercial.produtores.visualizar',
      'financeiro.saldo.visualizar', 'financeiro.transferencia.criar', 'financeiro.transferencia.aprovar',
      'financeiro.repasses.visualizar', 'financeiro.repasses.aprovar', 'financeiro.pagamento.criar',
      'financeiro.pagamento.aprovar', 'financeiro.conciliacao.executar', 'financeiro.relatorio.exportar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.aprovar',
      'contabilidade.diario.visualizar', 'contabilidade.dre.visualizar',
      'documentos.central.visualizar', 'documentos.arquivo.visualizar', 'documentos.arquivo.enviar', 'documentos.arquivo.baixar', 'documentos.versao.criar',
      'relatorios.central.visualizar', 'relatorios.relatorio.visualizar', 'relatorios.relatorio.criar', 'relatorios.exportacao.criar', 'relatorios.financeiro.visualizar'
    ],
    lastLoginAt: '2026-09-18T15:10:00Z',
    lastIpAddress: '177.102.18.4',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'usr-fin-carlos',
    name: 'Carlos Lima',
    email: 'carlos.lima@diskingressos.com.br',
    status: 'active',
    roleSlug: 'financeiro',
    roleName: 'Financeiro Júnior (Sem Aprovação)',
    organization: 'DiskIngressos Matriz',
    isInternalStaff: true,
    scope: {
      type: 'GLOBAL',
      producerIds: [],
      eventIds: []
    },
    twoFactorEnabled: false,
    twoFactorEnforced: false,
    // Carlos does NOT have approval permissions (demonstrating granular divergence)
    permissions: [
      'eventos.evento.visualizar',
      'financeiro.saldo.visualizar',
      'financeiro.repasses.visualizar',
      'financeiro.relatorio.exportar',
      'documentos.central.visualizar',
      'documentos.arquivo.visualizar',
      'documentos.arquivo.baixar'
    ],
    lastLoginAt: '2026-09-18T13:40:00Z',
    lastIpAddress: '189.12.80.99',
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'usr-prod-opus',
    name: 'Roberto Viana',
    email: 'roberto@opusentretenimento.com.br',
    status: 'active',
    roleSlug: 'produtor',
    roleName: 'Produtor Opus Entretenimento',
    organization: 'Opus Entretenimento',
    isInternalStaff: false,
    // Strictly scoped to Producer prod-1
    scope: {
      type: 'PRODUCER',
      producerIds: ['prod-1'],
      eventIds: ['evt-101']
    },
    twoFactorEnabled: false,
    twoFactorEnforced: false,
    permissions: [
      'eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar', 'eventos.setores.configurar',
      'financeiro.saldo.visualizar', 'financeiro.repasses.visualizar', 'financeiro.relatorio.exportar',
      'marketing.campanha.visualizar', 'marketing.campanha.criar', 'marketing.pixel.configurar',
      'remarketing.carrinhos.visualizar',
      'documentos.central.visualizar', 'documentos.arquivo.visualizar', 'documentos.arquivo.enviar', 'documentos.arquivo.baixar',
      'relatorios.central.visualizar', 'relatorios.relatorio.visualizar', 'relatorios.vendas.visualizar', 'relatorios.eventos.visualizar'
    ],
    lastLoginAt: '2026-09-18T11:20:00Z',
    lastIpAddress: '200.180.44.12',
    createdAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 'usr-sac-ana',
    name: 'Ana Paula Santos',
    email: 'ana.santos@diskingressos.com.br',
    status: 'active',
    roleSlug: 'sac',
    roleName: 'Atendente SAC',
    organization: 'DiskIngressos Matriz',
    isInternalStaff: true,
    scope: {
      type: 'GLOBAL',
      producerIds: [],
      eventIds: []
    },
    twoFactorEnabled: false,
    twoFactorEnforced: false,
    permissions: [
      'eventos.evento.visualizar',
      'sac.consulta.acessar', 'sac.pedido.visualizar', 'sac.cliente.visualizar', 'sac.ticket.criar', 'sac.ticket.encerrar', 'sac.voucher.reenviar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar',
      'documentos.central.visualizar', 'documentos.arquivo.visualizar', 'documentos.arquivo.enviar', 'documentos.arquivo.baixar'
    ],
    lastLoginAt: '2026-09-18T16:00:00Z',
    lastIpAddress: '177.102.18.5',
    createdAt: '2024-03-01T00:00:00Z'
  }
];

interface AuthContextType {
  currentUser: UserAccount;
  users: UserAccount[];
  isAuthenticated: boolean;
  login: (email: string, password?: string, code2FA?: string) => { success: boolean; requires2FA?: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  updateUserPermissions: (userId: string, permissions: PermissionString[], scope?: UserAccount['scope'], status?: UserAccount['status']) => void;
  hasPermission: (permission: PermissionString, target?: { producerId?: string; eventId?: string }) => boolean;
  canAccessModule: (moduleId: string) => boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const switchUser = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
    }
  }, [users]);

  const login = useCallback((email: string, password?: string, code2FA?: string) => {
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!target) {
      return { success: false, error: 'Usuário não encontrado.' };
    }
    if (target.status === 'blocked') {
      return { success: false, error: 'Usuário bloqueado. Contate o Administrador.' };
    }
    if (target.twoFactorEnforced && !code2FA) {
      return { success: false, requires2FA: true };
    }
    if (code2FA && code2FA !== '123456' && code2FA.length !== 6) {
      return { success: false, error: 'Código 2FA inválido. Tente 123456 para teste.' };
    }

    setCurrentUser(target);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setShowLoginModal(true);
  }, []);

  const updateUserPermissions = useCallback((
    userId: string,
    permissions: PermissionString[],
    scope?: UserAccount['scope'],
    status?: UserAccount['status']
  ) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          permissions,
          scope: scope || u.scope,
          status: status || u.status
        };
        if (currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));
  }, [currentUser]);

  // ============================================================================
  // RBAC & DATA SCOPE FORMULA:
  // ACESSO = USUARIO + PERFIL + PERMISSAO + ORGANIZACAO + PRODUTOR + EVENTO
  // ============================================================================
  const hasPermission = useCallback((
    permission: PermissionString,
    target?: { producerId?: string; eventId?: string }
  ): boolean => {
    if (!isAuthenticated) return false;
    if (currentUser.status === 'blocked') return false;

    // 1. Administrador Geral possesses full access
    if (currentUser.roleSlug === 'admin_geral') {
      return true;
    }

    // 2. Check Granular Action Permission
    if (!currentUser.permissions.includes(permission)) {
      return false;
    }

    // 3. Check Producer Scope
    if (target?.producerId && currentUser.scope.type === 'PRODUCER') {
      if (!currentUser.scope.producerIds.includes(target.producerId)) {
        return false; // ACESSO NEGADO: Produtor não autorizado
      }
    }

    // 4. Check Event Scope
    if (target?.eventId && currentUser.scope.type === 'EVENT') {
      if (currentUser.scope.eventIds.length > 0 && !currentUser.scope.eventIds.includes(target.eventId)) {
        return false; // ACESSO NEGADO: Evento não autorizado
      }
    }

    return true;
  }, [isAuthenticated, currentUser]);

  // Determine whether a top-level module should be rendered in the sidebar & router
  const canAccessModule = useCallback((moduleId: string): boolean => {
    if (!isAuthenticated) return false;
    if (currentUser.roleSlug === 'admin_geral') return true;

    switch (moduleId) {
      case 'overview':
      case 'notifications':
        return true;
      case 'events':
        return currentUser.permissions.some(p => p.startsWith('eventos.'));
      case 'commercial':
        return currentUser.permissions.some(p => p.startsWith('comercial.'));
      case 'event-support':
        return currentUser.permissions.some(p => p.startsWith('suporte.'));
      case 'sac':
        return currentUser.permissions.some(p => p.startsWith('sac.'));
      case 'refunds':
        return currentUser.permissions.some(p => p.startsWith('estorno.'));
      case 'finance':
        return currentUser.permissions.some(p => p.startsWith('financeiro.'));
      case 'accounting':
        return currentUser.permissions.some(p => p.startsWith('contabilidade.'));
      case 'marketing':
        return currentUser.permissions.some(p => p.startsWith('marketing.'));
      case 'remarketing':
        return currentUser.permissions.some(p => p.startsWith('remarketing.'));
      case 'approvals':
        return currentUser.permissions.some(p => p.startsWith('aprovacoes.'));
      case 'documents':
        return currentUser.permissions.some(p => p.startsWith('documentos.'));
      case 'tasks':
        return currentUser.permissions.some(p => p.startsWith('tarefas.'));
      case 'configurations':
        return currentUser.permissions.some(p => p.startsWith('configuracoes.'));
      case 'observability':
        return currentUser.permissions.some(p => p.startsWith('observabilidade.') || p.startsWith('auditoria.'));
      case 'analytics':
      case 'reports':
        return currentUser.permissions.some(p => p.startsWith('relatorios.'));
      case 'admin':
        return currentUser.permissions.some(p => p.startsWith('admin.usuarios') || p.startsWith('admin.perfis'));
      case 'settings':
        return currentUser.permissions.includes('admin.configuracoes.editar');
      default:
        return false;
    }
  }, [isAuthenticated, currentUser]);

  const value = useMemo(() => ({
    currentUser,
    users,
    isAuthenticated,
    login,
    logout,
    switchUser,
    updateUserPermissions,
    hasPermission,
    canAccessModule,
    showLoginModal,
    setShowLoginModal
  }), [
    currentUser,
    users,
    isAuthenticated,
    login,
    logout,
    switchUser,
    updateUserPermissions,
    hasPermission,
    canAccessModule,
    showLoginModal,
    setShowLoginModal
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
