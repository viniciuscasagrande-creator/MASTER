import { MetricDefinition, MetricDomain, MetricFormat, MetricUpdateFrequency } from '@shared/types/index';

export class MetricRegistry {
  private static instance: MetricRegistry;
  private metrics: Map<string, MetricDefinition> = new Map();
  private versionsHistory: Map<string, MetricDefinition[]> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): MetricRegistry {
    if (!MetricRegistry.instance) {
      MetricRegistry.instance = new MetricRegistry();
    }
    return MetricRegistry.instance;
  }

  private registerDefaults(): void {
    const defaultMetrics: MetricDefinition[] = [
      // --- 1. COMERCIAL ---
      {
        id: 'met-com-01',
        code: 'sales.gross_amount',
        name: 'Vendas Brutas (GMV)',
        description: 'Volume financeiro bruto total de ingressos e produtos faturados antes de descontos ou estornos.',
        domain: 'COMERCIAL',
        format: 'CURRENCY',
        formula: 'SUM(orders.total_amount) WHERE orders.status = "PAID"',
        source: 'Pedidos (Orders / Payments)',
        updateFrequency: 'REAL_TIME',
        responsible: 'Equipe Comercial & Financeiro',
        version: 1,
        requiredPermission: 'relatorios.vendas.visualizar',
        lineage: [
          { step: 'Checkout Cliente', source: 'Web / App / PDV', details: 'Transação iniciada pelo comprador' },
          { step: 'Aprovação de Pagamento', source: 'Gateway / Adquirente', details: 'Confirmação bancária de PIX ou cartão' },
          { step: 'Consolidação de Pedido', source: 'OrderService', details: 'Status atualizado para PAID e emissão de ingressos' }
        ],
        supportedDimensions: ['time', 'producer', 'event', 'session', 'channel', 'payment_method', 'gateway', 'status'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-com-02',
        code: 'sales.net_amount',
        name: 'Vendas Líquidas',
        description: 'Receita líquida auferida após dedução de taxas de processamento, cortesias e estornos concluídos.',
        domain: 'COMERCIAL',
        format: 'CURRENCY',
        formula: 'sales.gross_amount - refunds.executed_amount - finance.fees_amount',
        source: 'Pedidos e Financeiro',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Controladoria & Comercial',
        version: 1,
        requiredPermission: 'relatorios.vendas.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'channel', 'payment_method'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-com-03',
        code: 'orders.paid',
        name: 'Pedidos Pagos',
        description: 'Quantidade total de pedidos que obtiveram liquidação e confirmação de pagamento com sucesso.',
        domain: 'COMERCIAL',
        format: 'NUMBER',
        formula: 'COUNT(orders.id) WHERE orders.status = "PAID"',
        source: 'Pedidos (OrderService)',
        updateFrequency: 'REAL_TIME',
        responsible: 'Operações de Vendas',
        version: 1,
        requiredPermission: 'relatorios.vendas.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'channel', 'payment_method', 'gateway'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-com-04',
        code: 'sales.average_ticket',
        name: 'Ticket Médio',
        description: 'Valor médio gasto por pedido pago na plataforma.',
        domain: 'COMERCIAL',
        format: 'CURRENCY',
        formula: 'sales.gross_amount / orders.paid',
        source: 'Calculado sobre Pedidos Pagos',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Equipe Comercial',
        version: 1,
        requiredPermission: 'relatorios.vendas.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'channel'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-com-05',
        code: 'sales.conversion_rate',
        name: 'Taxa de Conversão de Checkout',
        description: 'Percentual de sessões de checkout que concluíram o pagamento com sucesso.',
        domain: 'COMERCIAL',
        format: 'PERCENTAGE',
        formula: '(orders.paid / orders.created) * 100',
        source: 'Sessões de Checkout & Pedidos',
        updateFrequency: 'PERIODIC',
        responsible: 'Comercial & Produto',
        version: 1,
        requiredPermission: 'relatorios.vendas.visualizar',
        supportedDimensions: ['time', 'channel', 'payment_method'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 2. EVENTOS ---
      {
        id: 'met-evt-01',
        code: 'tickets.sold',
        name: 'Ingressos Vendidos',
        description: 'Quantidade total de ingressos comerciais vendidos e pagos.',
        domain: 'EVENTOS',
        format: 'NUMBER',
        formula: 'COUNT(tickets.id) WHERE tickets.status = "PAID" AND tickets.is_complimentary = FALSE',
        source: 'Ingressos (TicketService)',
        updateFrequency: 'REAL_TIME',
        responsible: 'Bilheteria & Eventos',
        version: 1,
        requiredPermission: 'relatorios.eventos.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'lot', 'sector', 'session'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-evt-02',
        code: 'tickets.issued',
        name: 'Ingressos Emitidos',
        description: 'Total de ingressos gerados e disponíveis (vendas pagas + cortesias emitidas).',
        domain: 'EVENTOS',
        format: 'NUMBER',
        formula: 'COUNT(tickets.id) WHERE tickets.status IN ("PAID", "ISSUED", "COMPLIMENTARY")',
        source: 'Ingressos (TicketService)',
        updateFrequency: 'REAL_TIME',
        responsible: 'Produção & Bilheteria',
        version: 1,
        requiredPermission: 'relatorios.eventos.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'sector', 'lot'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-evt-03',
        code: 'events.occupancy_rate',
        name: 'Taxa de Ocupação',
        description: 'Percentual de ingressos emitidos em relação à capacidade máxima do evento.',
        domain: 'EVENTOS',
        format: 'PERCENTAGE',
        formula: '(tickets.issued / events.capacity) * 100',
        source: 'Eventos & Lotação',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Produção Executiva',
        version: 1,
        requiredPermission: 'relatorios.eventos.visualizar',
        supportedDimensions: ['producer', 'event', 'sector'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-evt-04',
        code: 'checkin.completed',
        name: 'Check-ins Realizados',
        description: 'Total de leituras de catraca / portaria validadas com sucesso.',
        domain: 'EVENTOS',
        format: 'NUMBER',
        formula: 'COUNT(checkin_logs.id) WHERE checkin_logs.result = "SUCCESS"',
        source: 'Portaria & Catracas',
        updateFrequency: 'REAL_TIME',
        responsible: 'Suporte de Eventos & Portaria',
        version: 1,
        requiredPermission: 'relatorios.eventos.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'sector'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-evt-05',
        code: 'checkin.attendance_rate',
        name: 'Taxa de Comparecimento (Show-up)',
        description: 'Percentual de compradores de ingressos que compareceram ao evento físico.',
        domain: 'EVENTOS',
        format: 'PERCENTAGE',
        formula: '(checkin.completed / tickets.issued) * 100',
        source: 'Catracas & Ingressos',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Operações de Campo',
        version: 1,
        requiredPermission: 'relatorios.eventos.visualizar',
        supportedDimensions: ['producer', 'event', 'sector'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 3. FINANCEIRO ---
      {
        id: 'met-fin-01',
        code: 'finance.available_balance',
        name: 'Saldo Disponível para Repasse',
        description: 'Recursos líquidos desembaraçados e prontos para liquidação bancária aos produtores.',
        domain: 'FINANCEIRO',
        format: 'CURRENCY',
        formula: 'SUM(event_balances.liquid_amount) - SUM(event_balances.retained_escrow)',
        source: 'Módulo Financeiro (Ledger / Saldos)',
        updateFrequency: 'REAL_TIME',
        responsible: 'Tesouraria & Finanças',
        version: 1,
        requiredPermission: 'relatorios.financeiro.visualizar',
        isSensitive: true,
        supportedDimensions: ['producer', 'event', 'bank'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-fin-02',
        code: 'finance.event_result',
        name: 'Resultado Operacional por Evento',
        description: 'DRE Sintética do Evento: Receita Bruta - Estornos - Taxas Plataforma - Despesas.',
        domain: 'FINANCEIRO',
        format: 'CURRENCY',
        formula: 'sales.gross_amount - refunds.executed_amount - platform_fees - event_expenses',
        source: 'DRE Financeira por Evento',
        updateFrequency: 'DAILY_CLOSE',
        responsible: 'Controladoria Financeira',
        version: 1,
        requiredPermission: 'relatorios.financeiro.visualizar',
        isSensitive: true,
        supportedDimensions: ['producer', 'event', 'time'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 4. SAC ---
      {
        id: 'met-sac-01',
        code: 'sac.tickets_total',
        name: 'Atendimentos Totais',
        description: 'Quantidade total de chamados abertos por clientes em todos os canais de suporte.',
        domain: 'SAC',
        format: 'NUMBER',
        formula: 'COUNT(sac_tickets.id)',
        source: 'Central de Atendimento SAC',
        updateFrequency: 'REAL_TIME',
        responsible: 'Coordenação de SAC',
        version: 1,
        requiredPermission: 'relatorios.sac.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'channel', 'status', 'user', 'team'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-sac-02',
        code: 'sac.first_response_time',
        name: 'Tempo Médio de Primeira Resposta (FRT)',
        description: 'Tempo médio decorrido em minutos entre o chamado do cliente e a primeira intervenção humana.',
        domain: 'SAC',
        format: 'DURATION',
        formula: 'AVG(first_interaction_at - created_at) em minutos',
        source: 'Métricas de SLA do SAC',
        updateFrequency: 'PERIODIC',
        responsible: 'Gestão de Qualidade SAC',
        version: 1,
        requiredPermission: 'relatorios.sac.visualizar',
        supportedDimensions: ['time', 'channel', 'team'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-sac-03',
        code: 'sac.sla_compliance_rate',
        name: 'Cumprimento de SLA de Atendimento',
        description: 'Percentual de chamados atendidos e resolvidos rigorosamente dentro do prazo pactuado.',
        domain: 'SAC',
        format: 'PERCENTAGE',
        formula: '(tickets_within_sla / tickets_resolved) * 100',
        source: 'Auditoria de SLAs de Suporte',
        updateFrequency: 'DAILY_CLOSE',
        responsible: 'Ouvidoria & SAC',
        version: 1,
        requiredPermission: 'relatorios.sac.visualizar',
        supportedDimensions: ['time', 'channel', 'team'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 5. ESTORNO ---
      {
        id: 'met-est-01',
        code: 'refunds.executed_amount',
        name: 'Valor Total Estornado',
        description: 'Montante financeiro devolvido a consumidores por cancelamento ou chargeback.',
        domain: 'ESTORNO',
        format: 'CURRENCY',
        formula: 'SUM(refunds.amount) WHERE refunds.status = "EXECUTED"',
        source: 'Módulo de Estornos & Adquirentes',
        updateFrequency: 'REAL_TIME',
        responsible: 'Compliance & Estornos',
        version: 1,
        requiredPermission: 'relatorios.financeiro.visualizar',
        supportedDimensions: ['time', 'producer', 'event', 'gateway', 'payment_method'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-est-02',
        code: 'refunds.rate',
        name: 'Taxa de Estorno (Refund Rate)',
        description: 'Percentual do volume financeiro estornado em relação às vendas brutas.',
        domain: 'ESTORNO',
        format: 'PERCENTAGE',
        formula: '(refunds.executed_amount / sales.gross_amount) * 100',
        source: 'Estornos e Vendas',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Gestão de Risco & Antifraude',
        version: 1,
        requiredPermission: 'relatorios.financeiro.visualizar',
        supportedDimensions: ['producer', 'event', 'time'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 6. CONTABILIDADE ---
      {
        id: 'met-ctb-01',
        code: 'accounting.gross_revenue',
        name: 'Receita Operacional Bruta Contábil',
        description: 'Receita reconhecida conforme competência do evento no livro diário oficial.',
        domain: 'CONTABILIDADE',
        format: 'CURRENCY',
        formula: 'SUM(journal_entries.credit) WHERE account_code LIKE "3.1.1.%"',
        source: 'Livro Diário Contábil',
        updateFrequency: 'DAILY_CLOSE',
        responsible: 'Contabilidade Oficial',
        version: 1,
        requiredPermission: 'relatorios.contabilidade.visualizar',
        isSensitive: true,
        supportedDimensions: ['time', 'producer', 'event'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 7. MARKETING ---
      {
        id: 'met-mkt-01',
        code: 'marketing.investment',
        name: 'Investimento em Mídia Paga',
        description: 'Valor total gasto em campanhas publicitárias nas plataformas integradas (Meta, Google, TikTok).',
        domain: 'MARKETING',
        format: 'CURRENCY',
        formula: 'SUM(marketing_campaigns.spend)',
        source: 'Adapters de Mídia (Meta Ads API, TikTok API, Google Ads)',
        updateFrequency: 'PERIODIC',
        responsible: 'Growth & Marketing',
        version: 1,
        requiredPermission: 'relatorios.marketing.visualizar',
        supportedDimensions: ['time', 'channel', 'campaign', 'event'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-mkt-02',
        code: 'marketing.attributed_revenue',
        name: 'Receita Atribuída ao Tráfego Pago',
        description: 'Volume de vendas rastreado e associado a campanhas por UTMs e pixels de conversão.',
        domain: 'MARKETING',
        format: 'CURRENCY',
        formula: 'SUM(orders.amount) WHERE orders.utm_source IS NOT NULL',
        source: 'Atribuição de Mídia e Conversions API',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Tráfego & BI de Marketing',
        version: 1,
        requiredPermission: 'relatorios.marketing.visualizar',
        lineage: [
          { step: 'Clique do Anúncio', source: 'Meta / Google / TikTok', details: 'Parâmetros UTM e FBCLID capturados na URL' },
          { step: 'Conversão no Checkout', source: 'Disk Interno Checkout', details: 'Pedido registrado com atributos de rastreamento' },
          { step: 'Confirmação Server-Side', source: 'Conversions API (CAPI)', details: 'Evento purchase despachado e validado' }
        ],
        supportedDimensions: ['time', 'channel', 'campaign', 'producer', 'event'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'met-mkt-03',
        code: 'marketing.roas',
        name: 'ROAS (Return on Ad Spend)',
        description: 'Múltiplo de retorno financeiro sobre o valor investido em mídia paga.',
        domain: 'MARKETING',
        format: 'NUMBER',
        formula: 'marketing.attributed_revenue / marketing.investment',
        source: 'Cálculo de Atribuição Cross-Platform',
        updateFrequency: 'PERIODIC',
        responsible: 'Gestão de Mídia & Performance',
        version: 1,
        requiredPermission: 'relatorios.marketing.visualizar',
        supportedDimensions: ['time', 'channel', 'campaign', 'producer', 'event'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },

      // --- 8. REMARKETING ---
      {
        id: 'met-rmk-01',
        code: 'remarketing.recovered_revenue',
        name: 'Receita Recuperada de Carrinhos',
        description: 'Volume financeiro reavido através de réguas automáticas de WhatsApp e e-mail.',
        domain: 'REMARKETING',
        format: 'CURRENCY',
        formula: 'SUM(recovered_carts.total_amount) WHERE status = "CONVERTED"',
        source: 'Motor de Remarketing e Automações',
        updateFrequency: 'NEAR_REAL_TIME',
        responsible: 'Growth & CRM',
        version: 1,
        requiredPermission: 'relatorios.marketing.visualizar',
        supportedDimensions: ['time', 'channel', 'producer', 'event'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    for (const metric of defaultMetrics) {
      this.registerMetric(metric);
    }
  }

  public registerMetric(metric: MetricDefinition): void {
    if (this.metrics.has(metric.code)) {
      const existing = this.metrics.get(metric.code)!;
      // Store previous version in history
      const history = this.versionsHistory.get(metric.code) || [];
      history.push(existing);
      this.versionsHistory.set(metric.code, history);
    }

    this.metrics.set(metric.code, metric);
  }

  public getMetric(code: string): MetricDefinition | undefined {
    return this.metrics.get(code);
  }

  public getMetricVersion(code: string, version: number): MetricDefinition | undefined {
    const current = this.metrics.get(code);
    if (current && current.version === version) return current;

    const history = this.versionsHistory.get(code) || [];
    return history.find(v => v.version === version);
  }

  public getAllMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  public getMetricsByDomain(domain: MetricDomain): MetricDefinition[] {
    return Array.from(this.metrics.values()).filter(m => m.domain === domain);
  }
}
