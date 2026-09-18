import { Request, Response, NextFunction } from 'express';
import { UserAccount, PermissionString } from '@shared/types/index';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserAccount;
    }
  }
}

// In-memory active sessions / mock users for local development
export const MOCK_USERS_DB: UserAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'Vinicius Casagrande (Admin Master)',
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
      'admin.usuarios.visualizar', 'admin.usuarios.gerenciar', 'admin.perfis.gerenciar', 'admin.auditoria.visualizar', 'admin.configuracoes.editar'
    ],
    lastLoginAt: '2026-09-18T14:30:00Z',
    lastIpAddress: '189.44.120.19',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'usr-fin-maria',
    name: 'Maria Oliveira (Diretora Financeira)',
    email: 'maria.oliveira@diskingressos.com.br',
    status: 'active',
    roleSlug: 'financeiro',
    roleName: 'Financeiro Master',
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
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.aprovar'
    ],
    lastLoginAt: '2026-09-18T15:10:00Z',
    lastIpAddress: '177.102.18.4',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'usr-fin-carlos',
    name: 'Carlos Lima (Financeiro Operacional - Sem Aprovação)',
    email: 'carlos.lima@diskingressos.com.br',
    status: 'active',
    roleSlug: 'financeiro',
    roleName: 'Financeiro Júnior',
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
      'financeiro.relatorio.exportar'
    ],
    lastLoginAt: '2026-09-18T13:40:00Z',
    lastIpAddress: '189.12.80.99',
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'usr-prod-opus',
    name: 'Roberto Viana (Produtor Opus Entretenimento)',
    email: 'roberto@opusentretenimento.com.br',
    status: 'active',
    roleSlug: 'produtor',
    roleName: 'Produtor de Eventos',
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
      'remarketing.carrinhos.visualizar'
    ],
    lastLoginAt: '2026-09-18T11:20:00Z',
    lastIpAddress: '200.180.44.12',
    createdAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 'usr-sac-ana',
    name: 'Ana Paula Santos (Atendente SAC)',
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
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar'
    ],
    lastLoginAt: '2026-09-18T16:00:00Z',
    lastIpAddress: '177.102.18.5',
    createdAt: '2024-03-01T00:00:00Z'
  }
];

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'] || req.headers['x-user-id'];

  if (!authHeader) {
    // Default to admin for dev ease or reject
    req.user = MOCK_USERS_DB[0];
    return next();
  }

  const userId = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : '';
  const foundUser = MOCK_USERS_DB.find(u => u.id === userId || u.email === userId);

  if (foundUser) {
    if (foundUser.status === 'blocked') {
      res.status(403).json({ error: 'Usuário bloqueado. Entre em contato com a administração.' });
      return;
    }
    req.user = foundUser;
    return next();
  }

  // Fallback to Admin Master
  req.user = MOCK_USERS_DB[0];
  next();
};

// ==============================================================================
// RBAC MIDDLEWARE: requirePermission
// ==============================================================================
export const requirePermission = (permission: PermissionString) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    // Administrador Geral bypass
    if (user.roleSlug === 'admin_geral') {
      return next();
    }

    // Check if permission exists in user's granted permissions
    if (!user.permissions.includes(permission)) {
      res.status(403).json({
        error: '403 — Você não possui permissão para realizar esta operação.',
        requiredPermission: permission,
        userRole: user.roleName
      });
      return;
    }

    next();
  };
};

// ==============================================================================
// DATA SCOPE MIDDLEWARE: requireScope
// ==============================================================================
export const requireScope = (options: {
  producerParam?: string;
  eventParam?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    // Administrador Geral or Global Scope bypass
    if (user.roleSlug === 'admin_geral' || user.scope.type === 'GLOBAL') {
      return next();
    }

    // 1. Check Producer Scope
    if (options.producerParam) {
      const requestedProducerId = req.params[options.producerParam] || req.body[options.producerParam] || req.query[options.producerParam];
      if (requestedProducerId && !user.scope.producerIds.includes(String(requestedProducerId))) {
        res.status(403).json({
          error: 'ACESSO NEGADO — Você não possui autorização para consultar dados deste Produtor.',
          authorizedProducers: user.scope.producerIds
        });
        return;
      }
    }

    // 2. Check Event Scope
    if (options.eventParam) {
      const requestedEventId = req.params[options.eventParam] || req.body[options.eventParam] || req.query[options.eventParam];
      if (requestedEventId && user.scope.eventIds.length > 0 && !user.scope.eventIds.includes(String(requestedEventId))) {
        res.status(403).json({
          error: 'ACESSO NEGADO — Você não possui autorização para consultar dados deste Evento.',
          authorizedEvents: user.scope.eventIds
        });
        return;
      }
    }

    next();
  };
};
