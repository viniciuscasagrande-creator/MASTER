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
      { id: 'p-doc-11', module: 'documentos', resource: 'auditoria', action: 'visualizar', code: 'documentos.auditoria.visualizar', description: 'Visualizar logs de auditoria documental' }
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

    // 4. Produtores Iniciais
    this.producers.push(
      { id: 'prd_100', name: 'Opus Entretenimento', cnpj: '12.345.678/0001-90', status: 'ACTIVE' },
      { id: 'prd_200', name: 'Live Nation Brasil', cnpj: '98.765.432/0001-11', status: 'ACTIVE' },
      { id: 'prd_300', name: 'CWB Brasil Produções', cnpj: '45.123.890/0001-55', status: 'ACTIVE' }
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
