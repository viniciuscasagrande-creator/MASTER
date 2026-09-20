import { PermissionString, PermissionAction } from '@shared/types/index';

export interface PermissionDetail {
  slug: PermissionString;
  module: string;
  resource: string;
  action: PermissionAction;
  label: string;
  description: string;
}

export const PERMISSIONS_CATALOG: PermissionDetail[] = [
  // Eventos
  {
    slug: 'eventos.evento.visualizar',
    module: 'eventos',
    resource: 'evento',
    action: 'visualizar',
    label: 'Visualizar Eventos',
    description: 'Permite consultar catálogo de eventos, datas e locais.'
  },
  {
    slug: 'eventos.evento.criar',
    module: 'eventos',
    resource: 'evento',
    action: 'criar',
    label: 'Criar Eventos',
    description: 'Permite cadastrar novo evento na plataforma.'
  },
  {
    slug: 'eventos.evento.editar',
    module: 'eventos',
    resource: 'evento',
    action: 'editar',
    label: 'Editar Eventos',
    description: 'Permite alterar configurações, descrições e detalhes do evento.'
  },
  {
    slug: 'eventos.evento.cancelar',
    module: 'eventos',
    resource: 'evento',
    action: 'cancelar',
    label: 'Cancelar Evento',
    description: 'Permite suspender ou cancelar oficialmente a realização do evento.'
  },
  {
    slug: 'eventos.checkin.operar',
    module: 'eventos',
    resource: 'checkin',
    action: 'administrar',
    label: 'Operar Portaria e Check-in',
    description: 'Permite validar ingressos no leitor óptico/catraca.'
  },
  {
    slug: 'eventos.setores.configurar',
    module: 'eventos',
    resource: 'setores',
    action: 'editar',
    label: 'Configurar Setores e Lotes',
    description: 'Permite definir capacidades, lotes de preços e viradas de lote.'
  },
  {
    slug: 'eventos.cortesias.emitir',
    module: 'eventos',
    resource: 'cortesias',
    action: 'criar',
    label: 'Emitir Cortesias',
    description: 'Permite gerar ingressos de cortesia nominal sem cobrança.'
  },

  // Comercial
  {
    slug: 'comercial.produtores.visualizar',
    module: 'comercial',
    resource: 'produtores',
    action: 'visualizar',
    label: 'Visualizar Produtores',
    description: 'Permite consultar carteira de produtores credenciados.'
  },
  {
    slug: 'comercial.produtores.criar',
    module: 'comercial',
    resource: 'produtores',
    action: 'criar',
    label: 'Cadastrar Produtor',
    description: 'Permite criar ficha cadastral e bancária de novo produtor.'
  },
  {
    slug: 'comercial.produtores.editar',
    module: 'comercial',
    resource: 'produtores',
    action: 'editar',
    label: 'Editar Produtor',
    description: 'Permite alterar taxas, contatos e dados de produtores.'
  },
  {
    slug: 'comercial.propostas.gerenciar',
    module: 'comercial',
    resource: 'propostas',
    action: 'administrar',
    label: 'Gerenciar Propostas e Funil',
    description: 'Permite movimentar oportunidades no pipeline comercial.'
  },
  {
    slug: 'comercial.metas.visualizar',
    module: 'comercial',
    resource: 'metas',
    action: 'visualizar',
    label: 'Visualizar Metas e Comissões',
    description: 'Permite consultar previsões de faturamento e comissões da equipe.'
  },
  {
    slug: 'comercial.gestao_contas.visualizar',
    module: 'comercial',
    resource: 'gestao_contas',
    action: 'visualizar',
    label: 'Visualizar Gestão de Contas',
    description: 'Permite consultar carteira de produtores ativos, contratos e métricas de relacionamento.'
  },
  {
    slug: 'comercial.renovacoes.visualizar',
    module: 'comercial',
    resource: 'renovacoes',
    action: 'visualizar',
    label: 'Visualizar Central de Renovações',
    description: 'Permite consultar contratos em janela de planejamento e histórico de renovações.'
  },
  {
    slug: 'comercial.renovacoes.iniciar',
    module: 'comercial',
    resource: 'renovacoes',
    action: 'criar',
    label: 'Iniciar Negociação de Renovação',
    description: 'Permite abrir ciclo de renovação e gerar oportunidade vinculada no pipeline.'
  },
  {
    slug: 'comercial.renovacoes.atualizar_status',
    module: 'comercial',
    resource: 'renovacoes',
    action: 'editar',
    label: 'Atualizar Status de Renovação',
    description: 'Permite alterar o status operacional do processo de renovação do contrato.'
  },
  {
    slug: 'comercial.renovacoes.decidir',
    module: 'comercial',
    resource: 'renovacoes',
    action: 'aprovar',
    label: 'Registrar Decisão de Renovação',
    description: 'Permite formalizar conclusão (renovado simples/renegociado), não renovação ou cancelamento.'
  },
  {
    slug: 'comercial.movimentacoes.visualizar',
    module: 'comercial',
    resource: 'movimentacoes',
    action: 'visualizar',
    label: 'Visualizar Movimentações Comerciais',
    description: 'Permite consultar oportunidades de expansão, upgrades, downgrades e novos serviços.'
  },
  {
    slug: 'comercial.movimentacoes.criar',
    module: 'comercial',
    resource: 'movimentacoes',
    action: 'criar',
    label: 'Criar Oportunidade de Movimentação',
    description: 'Permite registrar nova oportunidade de movimentação de conta para o produtor.'
  },
  {
    slug: 'comercial.movimentacoes.analisar_impacto',
    module: 'comercial',
    resource: 'movimentacoes',
    action: 'visualizar',
    label: 'Analisar Impacto Comercial',
    description: 'Permite comparar condições vigentes versus propostas sem alterar habilitações ou contratos.'
  },
  {
    slug: 'comercial.contas.historico.visualizar',
    module: 'comercial',
    resource: 'contas',
    action: 'visualizar',
    label: 'Visualizar Linha do Tempo da Conta',
    description: 'Permite inspecionar a cronologia factual unificada da conta comercial do produtor.'
  },

  // Suporte Eventos
  {
    slug: 'suporte.incidentes.visualizar',
    module: 'suporte',
    resource: 'incidentes',
    action: 'visualizar',
    label: 'Visualizar Incidentes de Campo',
    description: 'Permite consultar chamados operacionais e ocorrências nas portarias.'
  },
  {
    slug: 'suporte.incidentes.criar',
    module: 'suporte',
    resource: 'incidentes',
    action: 'criar',
    label: 'Registrar Incidente',
    description: 'Permite abrir chamado de falha de catraca, rede ou acesso.'
  },
  {
    slug: 'suporte.incidentes.resolver',
    module: 'suporte',
    resource: 'incidentes',
    action: 'editar',
    label: 'Resolver Incidente',
    description: 'Permite marcar ocorrência como resolvida no War Room.'
  },
  {
    slug: 'suporte.war_room.acessar',
    module: 'suporte',
    resource: 'war_room',
    action: 'visualizar',
    label: 'Acessar Sala de Operações',
    description: 'Visão executiva em tempo real dos eventos em andamento.'
  },

  // SAC
  {
    slug: 'sac.consulta.acessar',
    module: 'sac',
    resource: 'consulta',
    action: 'visualizar',
    label: 'Acessar Central de Consulta',
    description: 'Permite pesquisar compradores por CPF, nome, pedido ou e-mail.'
  },
  {
    slug: 'sac.pedido.visualizar',
    module: 'sac',
    resource: 'pedido',
    action: 'visualizar',
    label: 'Visualizar Detalhes do Pedido',
    description: 'Permite inspecionar pagamentos, taxas e titulares.'
  },
  {
    slug: 'sac.cliente.visualizar',
    module: 'sac',
    resource: 'cliente',
    action: 'visualizar',
    label: 'Visualizar Perfil do Cliente',
    description: 'Permite ver histórico de compras e status de compras anteriores.'
  },
  {
    slug: 'sac.ticket.criar',
    module: 'sac',
    resource: 'ticket',
    action: 'criar',
    label: 'Abrir Protocolo SAC',
    description: 'Permite registrar chamado via WhatsApp, Chat ou E-mail.'
  },
  {
    slug: 'sac.ticket.encerrar',
    module: 'sac',
    resource: 'ticket',
    action: 'editar',
    label: 'Encerrar Protocolo SAC',
    description: 'Permite finalizar atendimento com nota CSAT.'
  },
  {
    slug: 'sac.voucher.reenviar',
    module: 'sac',
    resource: 'voucher',
    action: 'administrar',
    label: 'Reenviar Voucher / QR Code',
    description: 'Permite disparar reenvio de ingressos para WhatsApp e e-mail do cliente.'
  },

  // Estorno
  {
    slug: 'estorno.solicitacao.visualizar',
    module: 'estorno',
    resource: 'solicitacao',
    action: 'visualizar',
    label: 'Visualizar Solicitações de Estorno',
    description: 'Permite consultar fila de cancelamentos e motivos alegados.'
  },
  {
    slug: 'estorno.solicitacao.criar',
    module: 'estorno',
    resource: 'solicitacao',
    action: 'criar',
    label: 'Abrir Solicitação de Estorno',
    description: 'Permite encaminhar pedido para cancelamento (7 dias ou judicial).'
  },
  {
    slug: 'estorno.solicitacao.aprovar',
    module: 'estorno',
    resource: 'solicitacao',
    action: 'aprovar',
    label: 'Aprovar Estorno (Cascata Reversa)',
    description: 'Permite autorizar estorno com reflexo automático em Ingressos, Financeiro e Contabilidade.'
  },
  {
    slug: 'estorno.solicitacao.executar',
    module: 'estorno',
    resource: 'solicitacao',
    action: 'administrar',
    label: 'Executar Liquidação no Gateway',
    description: 'Permite disparar API Cielo/Rede para devolução no cartão/PIX.'
  },
  {
    slug: 'estorno.chargeback.gerenciar',
    module: 'estorno',
    resource: 'chargeback',
    action: 'administrar',
    label: 'Gerenciar Disputas de Chargeback',
    description: 'Permite anexar comprovantes de acesso contra contestações bancárias.'
  },

  // Financeiro
  {
    slug: 'financeiro.saldo.visualizar',
    module: 'financeiro',
    resource: 'saldo',
    action: 'visualizar',
    label: 'Visualizar Saldos e Vendas',
    description: 'Permite consultar saldos disponíveis, pendentes e a receber.'
  },
  {
    slug: 'financeiro.transferencia.criar',
    module: 'financeiro',
    resource: 'transferencia',
    action: 'criar',
    label: 'Criar Transferência entre Eventos',
    description: 'Permite solicitar remanejamento de saldo entre eventos do mesmo produtor.'
  },
  {
    slug: 'financeiro.transferencia.aprovar',
    module: 'financeiro',
    resource: 'transferencia',
    action: 'aprovar',
    label: 'Aprovar Transferência de Saldo',
    description: 'Permite autorizar transferências internas de recursos.'
  },
  {
    slug: 'financeiro.repasses.visualizar',
    module: 'financeiro',
    resource: 'repasses',
    action: 'visualizar',
    label: 'Visualizar Repasses',
    description: 'Permite consultar cronograma de liquidações aos produtores.'
  },
  {
    slug: 'financeiro.repasses.aprovar',
    module: 'financeiro',
    resource: 'repasses',
    action: 'aprovar',
    label: 'Aprovar Repasse Bancário',
    description: 'Permite liberar lote de pagamentos PIX/TED/CNAB.'
  },
  {
    slug: 'financeiro.pagamento.criar',
    module: 'financeiro',
    resource: 'pagamento',
    action: 'criar',
    label: 'Lançar Pagamento / Despesa',
    description: 'Permite cadastrar conta a pagar ligada à operação do evento.'
  },
  {
    slug: 'financeiro.pagamento.aprovar',
    module: 'financeiro',
    resource: 'pagamento',
    action: 'aprovar',
    label: 'Aprovar Pagamento de Contas',
    description: 'Permite autorizar baixa de títulos a pagar.'
  },
  {
    slug: 'financeiro.conciliacao.executar',
    module: 'financeiro',
    resource: 'conciliacao',
    action: 'administrar',
    label: 'Executar Auto-Conciliação',
    description: 'Permite cruzar extratos de adquirentes com pedidos Core.'
  },
  {
    slug: 'financeiro.relatorio.exportar',
    module: 'financeiro',
    resource: 'relatorio',
    action: 'exportar',
    label: 'Exportar Relatórios Financeiros',
    description: 'Permite download de extratos, DRE gerencial e fluxo de caixa em CSV/Excel.'
  },

  // Contabilidade
  {
    slug: 'contabilidade.diario.visualizar',
    module: 'contabilidade',
    resource: 'diario',
    action: 'visualizar',
    label: 'Visualizar Livro Diário',
    description: 'Permite inspecionar lançamentos a débito e a crédito.'
  },
  {
    slug: 'contabilidade.lancamento.criar',
    module: 'contabilidade',
    resource: 'lancamento',
    action: 'criar',
    label: 'Criar Lançamento Contábil Manual',
    description: 'Permite fazer ajustes ou estornos contábeis específicos.'
  },
  {
    slug: 'contabilidade.dre.visualizar',
    module: 'contabilidade',
    resource: 'dre',
    action: 'visualizar',
    label: 'Visualizar DRE Contábil',
    description: 'Permite ver receitas de taxas, despesas financeiras e resultado líquido.'
  },
  {
    slug: 'contabilidade.balancete.visualizar',
    module: 'contabilidade',
    resource: 'balancete',
    action: 'visualizar',
    label: 'Visualizar Balancete de Verificação',
    description: 'Permite conferir o equilíbrio de contas ativas e passivas.'
  },
  {
    slug: 'contabilidade.fechamento.executar',
    module: 'contabilidade',
    resource: 'fechamento',
    action: 'administrar',
    label: 'Executar Fechamento Mensal',
    description: 'Permite travar a competência fiscal e emitir livros oficiais.'
  },

  // Marketing
  {
    slug: 'marketing.campanha.visualizar',
    module: 'marketing',
    resource: 'campanha',
    action: 'visualizar',
    label: 'Visualizar Campanhas e ROAS',
    description: 'Permite consultar dashboards de Meta, Google, TikTok e Spotify Ads.'
  },
  {
    slug: 'marketing.campanha.criar',
    module: 'marketing',
    resource: 'campanha',
    action: 'criar',
    label: 'Criar Campanha e Links UTM',
    description: 'Permite gerar URLs rastreadas para promotores e anúncios.'
  },
  {
    slug: 'marketing.campanha.publicar',
    module: 'marketing',
    resource: 'campanha',
    action: 'editar',
    label: 'Publicar Anúncios nas Plataformas',
    description: 'Permite sincronizar criativos via APIs de anúncios.'
  },
  {
    slug: 'marketing.pixel.configurar',
    module: 'marketing',
    resource: 'pixel',
    action: 'administrar',
    label: 'Configurar Pixels de Conversão',
    description: 'Permite instalar IDs de Meta Pixel e Google Tag por evento.'
  },

  // Remarketing
  {
    slug: 'remarketing.carrinhos.visualizar',
    module: 'remarketing',
    resource: 'carrinhos',
    action: 'visualizar',
    label: 'Visualizar Carrinhos Abandonados',
    description: 'Permite monitorar abandonos no checkout e valores retidos.'
  },
  {
    slug: 'remarketing.regua.configurar',
    module: 'remarketing',
    resource: 'regua',
    action: 'editar',
    label: 'Configurar Réguas de Automação',
    description: 'Permite ajustar tempos de envio de WhatsApp e e-mail.'
  },
  {
    slug: 'remarketing.mensagem.disparar',
    module: 'remarketing',
    resource: 'mensagem',
    action: 'administrar',
    label: 'Disparar Recuperação Manual',
    description: 'Permite acionar envio direto de link de recuperação para o cliente.'
  },

  // Administração
  {
    slug: 'admin.usuarios.visualizar',
    module: 'admin',
    resource: 'usuarios',
    action: 'visualizar',
    label: 'Visualizar Lista de Usuários',
    description: 'Permite consultar colaboradores e perfis de acesso.'
  },
  {
    slug: 'admin.usuarios.gerenciar',
    module: 'admin',
    resource: 'usuarios',
    action: 'administrar',
    label: 'Criar e Gerenciar Usuários',
    description: 'Permite cadastrar, bloquear e definir permissões granulares de usuários.'
  },
  {
    slug: 'admin.perfis.gerenciar',
    module: 'admin',
    resource: 'perfis',
    action: 'administrar',
    label: 'Gerenciar Perfis de Acesso',
    description: 'Permite criar e customizar papéis de segurança.'
  },
  {
    slug: 'admin.auditoria.visualizar',
    module: 'admin',
    resource: 'auditoria',
    action: 'visualizar',
    label: 'Visualizar Trilha de Auditoria Geral',
    description: 'Permite consultar todos os logs imutáveis e IPs da plataforma.'
  },
  {
    slug: 'admin.configuracoes.editar',
    module: 'admin',
    resource: 'configuracoes',
    action: 'editar',
    label: 'Editar Parâmetros do Core',
    description: 'Permite alterar credenciais de gateways, webhooks e parâmetros globais.'
  }
];
