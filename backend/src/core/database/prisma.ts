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
    this.userProducerAccesses = [];
    this.userEventAccesses = [];
    this.sessions = [];
    this.auditLogs = [];
    this.notifications = [];
    this.notificationRecipients = [];
    this.notificationPreferences = [];
    this.notificationRules = [];
    this.outboxRecords = [];

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
      { id: 'p-adm-3', module: 'admin', resource: 'auditoria', action: 'visualizar', code: 'admin.auditoria.visualizar', description: 'Visualizar trilha de auditoria' }
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
    // SAC
    associate('ATENDIMENTO_SAC', 'sac.consulta.acessar');
    associate('ATENDIMENTO_SAC', 'sac.pedido.visualizar');
    // Marketing
    associate('MARKETING', 'marketing.campanha.visualizar');
    associate('MARKETING', 'marketing.campanha.criar');
    // Contabilidade
    associate('CONTABILIDADE', 'contabilidade.dre.visualizar');
    // Produtor
    associate('PRODUTOR', 'eventos.evento.visualizar');
    associate('PRODUTOR', 'eventos.evento.criar');
    associate('PRODUTOR', 'eventos.evento.editar');

    // 4. Produtores Iniciais
    this.producers.push(
      { id: 'prd_100', name: 'Opus Entretenimento', cnpj: '12.345.678/0001-90', status: 'ACTIVE' },
      { id: 'prd_200', name: 'Live Nation Brasil', cnpj: '98.765.432/0001-11', status: 'ACTIVE' }
    );

    // 5. Eventos Iniciais
    this.events.push(
      { id: 'evt_1001', producerId: 'prd_100', title: 'Festival de Inverno Curitiba 2026', venue: 'Pedreira Paulo Leminski', status: 'PUBLISHED' },
      { id: 'evt_1002', producerId: 'prd_100', title: 'Teatro Musical Broadway Curitiba', venue: 'Teatro Positivo', status: 'PUBLISHED' },
      { id: 'evt_2001', producerId: 'prd_200', title: 'Coldplay Experience World Tour', venue: 'Estádio Couto Pereira', status: 'PUBLISHED' }
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
        return this.events.find(e => e.id === args.where?.id) || null;
      },
      findMany: async (args?: any) => {
        let list = [...this.events];
        if (args?.where?.producerId) {
          if (typeof args.where.producerId === 'string') {
            list = list.filter(e => e.producerId === args.where.producerId);
          } else if (args.where.producerId?.in && Array.isArray(args.where.producerId.in)) {
            list = list.filter(e => args.where.producerId.in.includes(e.producerId));
          }
        }
        if (args?.where?.id) {
          if (typeof args.where.id === 'string') {
            list = list.filter(e => e.id === args.where.id);
          } else if (args.where.id?.in && Array.isArray(args.where.id.in)) {
            list = list.filter(e => args.where.id.in.includes(e.id));
          }
        }
        return list;
      },
      create: async (args: any) => {
        const newEvt = { id: args.data.id || `evt_${Date.now()}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
        this.events.push(newEvt);
        return newEvt;
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
          userId: args.data.userId || null,
          userName: args.data.userName || null,
          action: args.data.action,
          resource: args.data.resource,
          producerId: args.data.producerId || null,
          eventId: args.data.eventId || null,
          details: args.data.details || null,
          ipAddress: args.data.ipAddress || null,
          result: args.data.result || 'SUCCESS',
          createdAt: new Date()
        };
        this.auditLogs.unshift(log);
        return log;
      },
      findMany: async (args?: any) => {
        let list = [...this.auditLogs];
        if (args?.where?.userId) list = list.filter(l => l.userId === args.where.userId);
        if (args?.where?.action) list = list.filter(l => l.action === args.where.action);
        return list;
      },
      count: async () => this.auditLogs.length
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
