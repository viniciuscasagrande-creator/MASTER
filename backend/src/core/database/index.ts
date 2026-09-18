import { UserAccount, PermissionString, RoleSlug, ScopeType } from '@shared/types/index';
import { ROLES_CATALOG } from '../../roles/rolesCatalog';
import { PERMISSIONS_CATALOG } from '../../permissions/permissionsCatalog';

export interface AuditRecord {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  impactCascade?: string[];
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
}

export interface SecurityLogRecord {
  id: string;
  userId?: string;
  email?: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | '2FA_REQUIRED' | 'ACCESS_DENIED_403' | 'SCOPE_VIOLATION' | 'USER_BLOCKED';
  ipAddress: string;
  details: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  producerId: string;
  eventId: string;
  eventName: string;
  customerId: string;
  customerName: string;
  customerCpf: string;
  grossAmount: number;
  serviceFee: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'refunded';
  paymentMethod: 'pix' | 'credit_card';
  createdAt: string;
}

export interface TransferRecord {
  id: string;
  fromEventId: string;
  toEventId: string;
  producerId: string;
  amount: number;
  reason: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
}

// Global Core Database in Memory
export class Database {
  public users: UserAccount[] = [];
  public producers = [
    { id: 'prod-1', name: 'Opus Entretenimento', cnpj: '12.345.678/0001-90', availableBalance: 842500 },
    { id: 'prod-2', name: 'Live Nation Brasil', cnpj: '98.765.432/0001-11', availableBalance: 1450000 },
    { id: 'prod-3', name: 'CWB Brasil Produções', cnpj: '45.123.890/0001-55', availableBalance: 412000 }
  ];
  public events = [
    { id: 'evt-101', producerId: 'prod-1', title: 'Festival de Inverno Curitiba 2026', venue: 'Pedreira Paulo Leminski', date: '2026-07-18', grossRevenue: 3714500 },
    { id: 'evt-102', producerId: 'prod-2', title: 'Coldplay Experience World Tour', venue: 'Estádio Couto Pereira', date: '2026-09-24', grossRevenue: 8558000 },
    { id: 'evt-103', producerId: 'prod-3', title: 'Stand-Up Comedy Stars: Noite de Gala', venue: 'Teatro Guaíra', date: '2026-04-12', grossRevenue: 276000 }
  ];
  public orders: OrderRecord[] = [
    {
      id: 'ord-87521',
      orderNumber: 'DK-87521',
      producerId: 'prod-1',
      eventId: 'evt-101',
      eventName: 'Festival de Inverno Curitiba 2026',
      customerId: 'cust-1',
      customerName: 'Carolina Mendes',
      customerCpf: '042.889.319-45',
      grossAmount: 340,
      serviceFee: 34,
      totalAmount: 374,
      status: 'paid',
      paymentMethod: 'pix',
      createdAt: '2026-09-18T14:22:00Z'
    },
    {
      id: 'ord-87522',
      orderNumber: 'DK-87522',
      producerId: 'prod-2',
      eventId: 'evt-102',
      eventName: 'Coldplay Experience World Tour',
      customerId: 'cust-2',
      customerName: 'Rodrigo Silveira',
      customerCpf: '812.304.779-88',
      grossAmount: 420,
      serviceFee: 42,
      totalAmount: 462,
      status: 'paid',
      paymentMethod: 'credit_card',
      createdAt: '2026-09-18T15:10:00Z'
    }
  ];
  public transfers: TransferRecord[] = [];
  public auditLogs: AuditRecord[] = [];
  public securityLogs: SecurityLogRecord[] = [];
  public activeSessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    this.users = [
      // 1. Administrador Geral (vê tudo, 2FA ativo)
      {
        id: 'usr-admin-1',
        name: 'Vinicius Casagrande (Admin Master)',
        email: 'admin@diskingressos.com.br',
        status: 'active',
        roleSlug: 'admin_geral',
        roleName: 'Administrador Geral',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: true,
        twoFactorEnforced: true,
        permissions: PERMISSIONS_CATALOG.map(p => p.slug),
        createdAt: '2024-01-01T00:00:00Z'
      },
      // 2. Financeiro com Aprovação (Maria)
      {
        id: 'usr-fin-maria',
        name: 'Maria Oliveira (Diretora Financeira)',
        email: 'maria.financeiro@diskingressos.com.br',
        status: 'active',
        roleSlug: 'financeiro',
        roleName: 'Diretora Financeira',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: true,
        twoFactorEnforced: true,
        permissions: [
          'eventos.evento.visualizar',
          'comercial.produtores.visualizar',
          'financeiro.saldo.visualizar',
          'financeiro.transferencia.criar',
          'financeiro.transferencia.aprovar',
          'financeiro.repasses.visualizar',
          'financeiro.repasses.aprovar',
          'financeiro.pagamento.criar',
          'financeiro.pagamento.aprovar',
          'financeiro.conciliacao.executar',
          'financeiro.relatorio.exportar',
          'estorno.solicitacao.visualizar',
          'estorno.solicitacao.aprovar'
        ],
        createdAt: '2024-02-15T00:00:00Z'
      },
      // 3. Financeiro sem Aprovação (Carlos)
      {
        id: 'usr-fin-carlos',
        name: 'Carlos Lima (Financeiro Operacional)',
        email: 'carlos.financeiro@diskingressos.com.br',
        status: 'active',
        roleSlug: 'financeiro',
        roleName: 'Financeiro Júnior',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        permissions: [
          'eventos.evento.visualizar',
          'financeiro.saldo.visualizar',
          'financeiro.transferencia.criar',
          'financeiro.repasses.visualizar',
          'financeiro.relatorio.exportar'
        ],
        createdAt: '2024-05-10T00:00:00Z'
      },
      // 4. Marketing (não acessa financeiro)
      {
        id: 'usr-mkt-lucas',
        name: 'Lucas Mendes (Growth & Marketing)',
        email: 'lucas.marketing@diskingressos.com.br',
        status: 'active',
        roleSlug: 'marketing',
        roleName: 'Especialista de Marketing',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        permissions: [
          'eventos.evento.visualizar',
          'marketing.campanha.visualizar',
          'marketing.campanha.criar',
          'marketing.campanha.publicar',
          'marketing.pixel.configurar',
          'remarketing.carrinhos.visualizar'
        ],
        createdAt: '2024-04-01T00:00:00Z'
      },
      // 5. SAC (consulta pedido, não altera financeiro)
      {
        id: 'usr-sac-ana',
        name: 'Ana Paula Santos (Atendimento SAC)',
        email: 'ana.sac@diskingressos.com.br',
        status: 'active',
        roleSlug: 'sac',
        roleName: 'Atendente SAC',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        permissions: [
          'eventos.evento.visualizar',
          'sac.consulta.acessar',
          'sac.pedido.visualizar',
          'sac.cliente.visualizar',
          'sac.ticket.criar',
          'sac.ticket.encerrar',
          'sac.voucher.reenviar',
          'estorno.solicitacao.visualizar',
          'estorno.solicitacao.criar'
        ],
        createdAt: '2024-03-01T00:00:00Z'
      },
      // 6. Produtor A (Roberto Viana - Opus Entretenimento - PRODUCER scope prod-1)
      {
        id: 'usr-prod-opus',
        name: 'Roberto Viana (Produtor Opus)',
        email: 'roberto@opus.com.br',
        status: 'active',
        roleSlug: 'produtor',
        roleName: 'Produtor Opus Entretenimento',
        organization: 'Opus Entretenimento',
        isInternalStaff: false,
        scope: {
          type: 'PRODUCER',
          producerIds: ['prod-1'],
          eventIds: ['evt-101']
        },
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        permissions: [
          'eventos.evento.visualizar',
          'eventos.evento.criar',
          'eventos.evento.editar',
          'financeiro.saldo.visualizar',
          'financeiro.repasses.visualizar',
          'financeiro.relatorio.exportar',
          'marketing.campanha.visualizar',
          'marketing.campanha.criar'
        ],
        createdAt: '2024-06-01T00:00:00Z'
      },
      // 7. Usuário Bloqueado (para testes de segurança)
      {
        id: 'usr-blocked-1',
        name: 'Usuário Suspenso Por Segurança',
        email: 'bloqueado@diskingressos.com.br',
        status: 'blocked',
        roleSlug: 'financeiro',
        roleName: 'Operador Suspenso',
        organization: 'DiskIngressos Matriz',
        isInternalStaff: true,
        scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        permissions: [],
        createdAt: '2024-07-01T00:00:00Z'
      }
    ];
  }

  public logAudit(record: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
    const newRecord: AuditRecord = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...record
    };
    this.auditLogs.unshift(newRecord);
    return newRecord;
  }

  public logSecurity(record: Omit<SecurityLogRecord, 'id' | 'timestamp'>): SecurityLogRecord {
    const newRecord: SecurityLogRecord = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...record
    };
    this.securityLogs.unshift(newRecord);
    return newRecord;
  }

  public getUserById(id: string): UserAccount | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public reset(): void {
    this.transfers = [];
    this.auditLogs = [];
    this.securityLogs = [];
    this.activeSessions.clear();
    this.seed();
  }
}

export const db = new Database();
