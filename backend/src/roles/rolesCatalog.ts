import { RoleDefinition } from '@shared/types/index';
import { PERMISSIONS_CATALOG } from '../permissions/permissionsCatalog';

export const ROLES_CATALOG: RoleDefinition[] = [
  {
    slug: 'admin_geral',
    name: 'Administrador Geral',
    description: 'Acesso irrestrito a toda a plataforma Disk Interno, configurações do Core e gestão de acessos.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: true,
    defaultPermissions: PERMISSIONS_CATALOG.map(p => p.slug)
  },
  {
    slug: 'admin_operacional',
    name: 'Administrador Operacional',
    description: 'Gestão operacional de eventos, bilheteria, suporte, SAC e aprovações do dia a dia.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: true,
    defaultPermissions: [
      'eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar', 'eventos.checkin.operar', 'eventos.setores.configurar', 'eventos.cortesias.emitir',
      'comercial.produtores.visualizar', 'comercial.propostas.gerenciar', 'comercial.metas.visualizar',
      'suporte.incidentes.visualizar', 'suporte.incidentes.criar', 'suporte.incidentes.resolver', 'suporte.war_room.acessar',
      'sac.consulta.acessar', 'sac.pedido.visualizar', 'sac.cliente.visualizar', 'sac.ticket.criar', 'sac.ticket.encerrar', 'sac.voucher.reenviar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar', 'estorno.solicitacao.aprovar',
      'financeiro.saldo.visualizar', 'financeiro.repasses.visualizar', 'financeiro.relatorio.exportar',
      'marketing.campanha.visualizar', 'remarketing.carrinhos.visualizar'
    ]
  },
  {
    slug: 'produtor',
    name: 'Produtor de Eventos',
    description: 'Acesso restrito estritamente aos seus próprios eventos, bilheteria, saldos a receber e relatórios de marketing.',
    isSystem: true,
    defaultScopeType: 'PRODUCER',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar', 'eventos.evento.criar', 'eventos.evento.editar', 'eventos.setores.configurar',
      'financeiro.saldo.visualizar', 'financeiro.repasses.visualizar', 'financeiro.relatorio.exportar',
      'marketing.campanha.visualizar', 'marketing.campanha.criar', 'marketing.pixel.configurar',
      'remarketing.carrinhos.visualizar'
    ]
  },
  {
    slug: 'financeiro',
    name: 'Financeiro',
    description: 'Gestão de contas a pagar, contas a receber, saldos por evento, fluxo de caixa e conciliação.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: true,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'comercial.produtores.visualizar',
      'financeiro.saldo.visualizar', 'financeiro.transferencia.criar', 'financeiro.transferencia.aprovar',
      'financeiro.repasses.visualizar', 'financeiro.repasses.aprovar', 'financeiro.pagamento.criar',
      'financeiro.pagamento.aprovar', 'financeiro.conciliacao.executar', 'financeiro.relatorio.exportar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.aprovar',
      'contabilidade.diario.visualizar', 'contabilidade.dre.visualizar'
    ]
  },
  {
    slug: 'contabilidade',
    name: 'Contabilidade',
    description: 'Acompanhamento do diário contábil em partidas dobradas, balancetes, DRE e fechamentos fiscais.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'financeiro.saldo.visualizar', 'financeiro.relatorio.exportar',
      'contabilidade.diario.visualizar', 'contabilidade.lancamento.criar', 'contabilidade.dre.visualizar',
      'contabilidade.balancete.visualizar', 'contabilidade.fechamento.executar'
    ]
  },
  {
    slug: 'marketing',
    name: 'Marketing & Growth',
    description: 'Controle de investimentos em mídia (Meta, Google, TikTok, Spotify), pixels e conversões.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'marketing.campanha.visualizar', 'marketing.campanha.criar', 'marketing.campanha.publicar', 'marketing.pixel.configurar',
      'remarketing.carrinhos.visualizar'
    ]
  },
  {
    slug: 'remarketing',
    name: 'Remarketing & Recuperação',
    description: 'Gestão de carrinhos abandonados e automação de mensagens de recuperação via WhatsApp e E-mail.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'remarketing.carrinhos.visualizar', 'remarketing.regua.configurar', 'remarketing.mensagem.disparar'
    ]
  },
  {
    slug: 'comercial',
    name: 'Comercial & Novos Negócios',
    description: 'Prospecção de novos produtores, pipeline de eventos, propostas e acompanhamento de metas.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'comercial.produtores.visualizar', 'comercial.produtores.criar', 'comercial.produtores.editar',
      'comercial.propostas.gerenciar', 'comercial.metas.visualizar',
      'comercial.gestao_contas.visualizar',
      'comercial.renovacoes.visualizar', 'comercial.renovacoes.iniciar', 'comercial.renovacoes.atualizar_status', 'comercial.renovacoes.decidir',
      'comercial.movimentacoes.visualizar', 'comercial.movimentacoes.criar', 'comercial.movimentacoes.analisar_impacto',
      'comercial.contas.historico.visualizar'
    ]
  },
  {
    slug: 'sac',
    name: 'Atendimento SAC',
    description: 'Central de Consulta 360°, atendimento a compradores, pedidos, reenvio de ingressos e abertura de estornos.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'sac.consulta.acessar', 'sac.pedido.visualizar', 'sac.cliente.visualizar', 'sac.ticket.criar', 'sac.ticket.encerrar', 'sac.voucher.reenviar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar'
    ]
  },
  {
    slug: 'suporte_eventos',
    name: 'Suporte de Eventos & Campo',
    description: 'Operação presencial nos locais de shows, monitoramento de catracas, links e incidentes em tempo real.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: [
      'eventos.evento.visualizar', 'eventos.checkin.operar',
      'suporte.incidentes.visualizar', 'suporte.incidentes.criar', 'suporte.incidentes.resolver', 'suporte.war_room.acessar'
    ]
  },
  {
    slug: 'estorno',
    name: 'Gestor de Estornos & Disputas',
    description: 'Aprovação de cancelamentos, estornos totais/parciais e defesa de chargebacks junto aos adquirentes.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: true,
    defaultPermissions: [
      'eventos.evento.visualizar',
      'sac.pedido.visualizar',
      'estorno.solicitacao.visualizar', 'estorno.solicitacao.criar', 'estorno.solicitacao.aprovar', 'estorno.solicitacao.executar', 'estorno.chargeback.gerenciar',
      'financeiro.saldo.visualizar'
    ]
  },
  {
    slug: 'auditor',
    name: 'Auditor & Compliance',
    description: 'Acesso exclusivamente consultivo a todos os registros, logs de auditoria imutáveis e fluxos fiscais.',
    isSystem: true,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: true,
    defaultPermissions: [
      'eventos.evento.visualizar', 'comercial.produtores.visualizar', 'suporte.incidentes.visualizar',
      'sac.pedido.visualizar', 'estorno.solicitacao.visualizar', 'financeiro.saldo.visualizar',
      'financeiro.repasses.visualizar', 'contabilidade.diario.visualizar', 'contabilidade.dre.visualizar',
      'marketing.campanha.visualizar', 'admin.auditoria.visualizar'
    ]
  },
  {
    slug: 'personalizado',
    name: 'Perfil Personalizado',
    description: 'Permissões e escopo configurados pontualmente pelo Administrador Geral.',
    isSystem: false,
    defaultScopeType: 'GLOBAL',
    requiresTwoFactor: false,
    defaultPermissions: []
  }
];
