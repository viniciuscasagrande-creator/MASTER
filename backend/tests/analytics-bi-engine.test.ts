/**
 * Testes Automatizados - Fase 1.1.5.13
 * Motor Central de Relatórios, Exportações e BI Operacional
 */

import { memoryDb } from '../src/core/database/prisma';
import {
  MetricRegistry,
  DimensionRegistry,
  QueryBuilderService,
  AnalyticsCacheService,
  PostgreSQLAnalyticsProvider,
  AnalyticsService,
  AnalyticsAuthorizationService,
  FieldSecurityService,
  ReportRepository,
  ReportSharingService,
  ReportService,
  CsvExporter,
  XlsxExporter,
  PdfExporter,
  ExportService,
  ReportSchedulerService,
  SnapshotService,
  WidgetRegistry,
  DashboardService
} from '../src/analytics/index';
import { AnalyticsQuery, SavedReport } from '@shared/types/index';

async function runTests() {
  console.log('================================================================');
  console.log('   INICIANDO TESTES FASE 1.1.5.13 — RELATÓRIOS & BI OPERACIONAL');
  console.log('================================================================\n');

  memoryDb.seedDefaults();

  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, msg: string) => {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${msg}`);
      throw new Error(`Falha no teste: ${msg}`);
    }
  };

  // Mock Users
  const adminUser = {
    id: 'usr_admin',
    name: 'Carlos Administrador',
    email: 'admin@diskingressos.com.br',
    roleSlug: 'admin_geral',
    isSuperAdmin: true,
    status: 'ACTIVE',
    permissions: ['*'],
    scope: { type: 'GLOBAL' }
  };

  const comercialAnalyst = {
    id: 'usr_comercial',
    name: 'Mariana Vendas',
    email: 'mariana.vendas@diskingressos.com.br',
    roleSlug: 'analista_comercial',
    status: 'ACTIVE',
    permissions: [
      'relatorios.central.visualizar',
      'relatorios.relatorio.criar',
      'relatorios.relatorio.visualizar',
      'relatorios.vendas.visualizar',
      'relatorios.exportacao.solicitar',
      'relatorios.agendamento.criar'
    ],
    scope: { type: 'GLOBAL' }
  };

  const financeAnalyst = {
    id: 'usr_finance',
    name: 'Roberto Finanças',
    email: 'roberto.financas@diskingressos.com.br',
    roleSlug: 'analista_financeiro',
    status: 'ACTIVE',
    permissions: [
      'relatorios.central.visualizar',
      'relatorios.relatorio.criar',
      'relatorios.relatorio.visualizar',
      'relatorios.financeiro.visualizar',
      'relatorios.contabilidade.visualizar',
      'relatorios.exportacao.solicitar',
      'relatorios.agendamento.criar'
    ],
    scope: { type: 'GLOBAL' }
  };

  const producerUser = {
    id: 'usr_produtor_alpha',
    name: 'Produtor Alpha Entretenimento',
    email: 'alpha@produtor.com.br',
    roleSlug: 'produtor',
    status: 'ACTIVE',
    permissions: [
      'relatorios.central.visualizar',
      'relatorios.relatorio.visualizar',
      'relatorios.vendas.visualizar',
      'relatorios.eventos.visualizar'
    ],
    scope: {
      type: 'PRODUCER',
      producerIds: ['prod-alpha-01']
    }
  };

  // ============================================================================
  // BLOCO 1: CATÁLOGO OFICIAL DE MÉTRICAS, VERSIONAMENTO E LINHAGEM
  // ============================================================================
  console.log('\n--- BLOCO 1: Catálogo Oficial de Métricas & Linhagem ---');
  {
    const metricRegistry = MetricRegistry.getInstance();
    const metrics = metricRegistry.getAllMetrics();

    assert(metrics.length >= 20, `Catálogo oficial contém ${metrics.length} métricas registradas (mínimo 20 esperado)`);

    // Validação dos 8 domínios
    const domains = new Set(metrics.map(m => m.domain));
    assert(domains.has('COMERCIAL'), 'Domínio COMERCIAL presente no catálogo');
    assert(domains.has('EVENTOS'), 'Domínio EVENTOS presente no catálogo');
    assert(domains.has('FINANCEIRO'), 'Domínio FINANCEIRO presente no catálogo');
    assert(domains.has('SAC'), 'Domínio SAC presente no catálogo');
    assert(domains.has('ESTORNO'), 'Domínio ESTORNO presente no catálogo');
    assert(domains.has('CONTABILIDADE'), 'Domínio CONTABILIDADE presente no catálogo');
    assert(domains.has('MARKETING'), 'Domínio MARKETING presente no catálogo');
    assert(domains.has('REMARKETING'), 'Domínio REMARKETING presente no catálogo');

    // Validação de versionamento e linhagem (ex: upgrade para v2 com histórico)
    const grossSalesMetric = metricRegistry.getMetric('sales.gross_amount');
    assert(grossSalesMetric !== undefined, 'Métrica sales.gross_amount localizada');
    assert(grossSalesMetric!.version === 1, 'Métrica sales.gross_amount inicia na versão 1');

    metricRegistry.registerMetric({
      ...grossSalesMetric!,
      version: 2,
      formula: 'SUM(orders.total_amount) WHERE orders.status IN ("PAID", "SETTLED")',
      lineage: [
        ...(grossSalesMetric!.lineage || []),
        { step: 'Ajuste de Conciliação', source: 'ReconciliationWorker', details: 'Inclusão de transações liquidadas' }
      ]
    });

    const v2Metric = metricRegistry.getMetric('sales.gross_amount');
    assert(v2Metric!.version === 2, 'Métrica sales.gross_amount evoluída para versão 2');
    const v1Metric = metricRegistry.getMetricVersion('sales.gross_amount', 1);
    assert(v1Metric !== undefined && v1Metric.version === 1, 'Versão histórica v1 preservada no versionamento');
    assert(v2Metric!.lineage !== undefined && v2Metric!.lineage.length > 0, 'Linhagem de cálculo registrada com passos de auditoria');

    // "Como este indicador é calculado?"
    const analyticsService = new AnalyticsService();
    const explanation = analyticsService.explainMetric('sales.gross_amount');
    assert(explanation.calculationExplanation.includes(grossSalesMetric!.name), 'Explicação detalhada de cálculo inclui nome oficial');
    assert(explanation.calculationExplanation.includes(v2Metric!.formula), 'Explicação detalhada inclui fórmula oficial');
  }

  // ============================================================================
  // BLOCO 2: CONSTRUTOR DECLARATIVO DE CONSULTAS & ANTI-SQL INJECTION
  // ============================================================================
  console.log('\n--- BLOCO 2: Construtor Declarativo & Bloqueio Contra SQL Injection ---');
  {
    const builder = new QueryBuilderService();

    // 1. Rejeição de consulta sem métricas
    let emptyQueryError = false;
    try {
      builder.validateAndBuildPlan({
        metrics: [],
        dimensions: ['channel'],
        period: { type: 'THIS_MONTH' }
      });
    } catch (err: any) {
      emptyQueryError = true;
      assert(err.message.includes('Pelo menos uma métrica'), 'Rejeitou consulta sem métricas');
    }
    assert(emptyQueryError, 'Consulta sem métricas disparou exceção');

    // 2. Rejeição de métrica arbitrária não cadastrada no catálogo
    let unknownMetricError = false;
    try {
      builder.validateAndBuildPlan({
        metrics: ['arbitrary_user_score_custom_sql'],
        dimensions: ['channel'],
        period: { type: 'THIS_MONTH' }
      });
    } catch (err: any) {
      unknownMetricError = true;
      assert(err.message.includes('não cadastrada'), 'Rejeitou métrica arbitrária fora do catálogo');
    }
    assert(unknownMetricError, 'Métrica arbitrária não cadastrada disparou exceção');

    // 3. Rejeição de tentativa de SQL Injection em filtros
    let sqlInjectionError = false;
    try {
      builder.validateAndBuildPlan({
        metrics: ['sales.gross_amount'],
        dimensions: ['channel'],
        period: { type: 'THIS_MONTH' },
        filters: [
          {
            field: 'channel',
            operator: 'EQUALS',
            value: "ONLINE'; DROP TABLE users; --"
          }
        ]
      });
    } catch (err: any) {
      sqlInjectionError = true;
      assert(err.message.includes('Tentativa de injeção'), 'QueryBuilder detectou e rejeitou tentativa de SQL Injection');
    }
    assert(sqlInjectionError, 'SQL Injection em filtro foi bloqueado com sucesso');

    // 4. Consulta válida constrói plano de execução com datas corretas
    const validPlan = builder.validateAndBuildPlan({
      metrics: ['sales.gross_amount', 'tickets.sold'],
      dimensions: ['channel'],
      period: { type: 'THIS_MONTH' }
    });
    assert(validPlan.resolvedMetrics.length === 2, 'Plano de execução resolveu 2 métricas com metadados');
    assert(validPlan.dateRange.startDate instanceof Date, 'Data inicial calculada como objeto Date válido');
    assert(validPlan.dateRange.endDate instanceof Date, 'Data final calculada como objeto Date válido');
  }

  // ============================================================================
  // BLOCO 3: RBAC POR DOMÍNIO E ISOLAMENTO DE ESCOPO MULTI-TENANT
  // ============================================================================
  console.log('\n--- BLOCO 3: RBAC e Isolamento de Escopo (Produtor/Evento) ---');
  {
    const analyticsService = new AnalyticsService();

    // 1. Analista Comercial NÃO pode ver métricas financeiras restritas (ex: finance.available_balance)
    let commercialDeniedFinancial = false;
    try {
      await analyticsService.executeQuery(
        {
          metrics: ['finance.available_balance'],
          dimensions: ['gateway'],
          period: { type: 'THIS_MONTH' }
        },
        comercialAnalyst
      );
    } catch (err: any) {
      commercialDeniedFinancial = true;
      assert(err.message.includes('Acesso negado') && err.message.includes('relatorios.financeiro.visualizar'), 'Analista comercial foi impedido de consultar saldo financeiro');
    }
    assert(commercialDeniedFinancial, 'RBAC bloqueou acesso sem a devida permissão de domínio');

    // 2. Analista Financeiro PODE consultar métricas financeiras
    const finResult = await analyticsService.executeQuery(
      {
        metrics: ['finance.available_balance', 'refunds.executed_amount'],
        dimensions: ['gateway'],
        period: { type: 'THIS_MONTH' }
      },
      financeAnalyst
    );
    assert(finResult.metrics.length === 2, 'Analista financeiro executou consulta com sucesso');

    // 3. Produtor tentando forçar consulta em outro produtor é bloqueado
    let producerScopeViolation = false;
    try {
      await analyticsService.executeQuery(
        {
          metrics: ['sales.gross_amount'],
          dimensions: ['channel'],
          period: { type: 'THIS_MONTH' },
          producerId: 'prod-beta-outro-produtor' // Diferente de 'prod-alpha-01'
        },
        producerUser
      );
    } catch (err: any) {
      producerScopeViolation = true;
      assert(err.message.includes('Consulta restrita') || err.message.includes('Acesso negado'), 'Tentativa de quebra de escopo do produtor foi bloqueada');
    }
    assert(producerScopeViolation, 'Escopo multi-tenant do produtor garantido');
  }

  // ============================================================================
  // BLOCO 4: SEGURANÇA EM NÍVEL DE CAMPO (LGPD) & MASCARAMENTO SENSÍVEL
  // ============================================================================
  console.log('\n--- BLOCO 4: Segurança em Nível de Campo (LGPD) & Mascaramento ---');
  {
    const fieldSecurity = new FieldSecurityService();

    // Métrica sensível com linhas contendo PII
    const rawResult = {
      metrics: [{ code: 'sales.gross_amount', name: 'Faturamento', format: 'CURRENCY' as any }],
      dimensions: ['customer'],
      rows: [
        {
          customer: 'João da Silva',
          cpf: '123.456.789-00',
          email: 'joao@email.com',
          phone: '(11) 98888-7777',
          'sales.gross_amount': 250.00
        }
      ],
      summary: {},
      freshness: { status: 'REAL_TIME' as any, updatedAt: new Date().toISOString() },
      cached: false,
      executionTimeMs: 12
    };

    const mockPlan: any = { hasSensitiveData: true, resolvedMetrics: [] };

    // Usuário sem permissão de dados sensíveis tem PII mascarado
    const sanitized = fieldSecurity.sanitizeResult(rawResult, mockPlan, comercialAnalyst);
    assert(sanitized.rows[0].cpf === '*** MASCARADO (LGPD) ***', 'CPF foi mascarado para usuário sem permissão de dados sensíveis');
    assert(sanitized.rows[0].email === '*** MASCARADO (LGPD) ***', 'Email foi mascarado para usuário sem permissão de dados sensíveis');
    assert(sanitized.rows[0].phone === '*** MASCARADO (LGPD) ***', 'Telefone foi mascarado para usuário sem permissão de dados sensíveis');

    // Admin Geral visualiza dados sensíveis em claro
    const unmasked = fieldSecurity.sanitizeResult(rawResult, mockPlan, adminUser);
    assert(unmasked.rows[0].cpf === '123.456.789-00', 'Admin Geral visualiza CPF em claro para fins de auditoria');
  }

  // ============================================================================
  // BLOCO 5: CÁLCULOS ANALÍTICOS, COMPARAÇÃO TEMPORAL E FORMATAÇÃO PT-BR
  // ============================================================================
  console.log('\n--- BLOCO 5: Cálculos Analíticos, Comparação Temporal & pt-BR ---');
  {
    const analyticsService = new AnalyticsService();

    // Consulta com agregação e quebra por canal
    const query: AnalyticsQuery = {
      metrics: ['sales.gross_amount', 'tickets.sold', 'sales.average_ticket'],
      dimensions: ['channel'],
      period: {
        type: 'THIS_MONTH',
        comparison: 'PREVIOUS_PERIOD'
      }
    };

    const result = await analyticsService.executeQuery(query, adminUser);
    assert(result.rows.length > 0, `Resultado gerou ${result.rows.length} linhas agrupadas por canal`);
    assert(result.comparisonRows !== undefined && result.comparisonRows.length > 0, 'Geração de linhas comparativas do período anterior (MoM)');

    // Validação de totais formatados em padrão brasileiro
    const grossSalesHeader = result.metrics.find(m => m.code === 'sales.gross_amount');
    assert(grossSalesHeader !== undefined, 'Cabeçalho de Faturamento Bruto retornado');
    assert(grossSalesHeader!.formattedTotal?.startsWith('R$'), `Total monetário formatado em Real brasileiro: ${grossSalesHeader!.formattedTotal}`);

    const ticketsSoldHeader = result.metrics.find(m => m.code === 'tickets.sold');
    assert(ticketsSoldHeader !== undefined, 'Cabeçalho de Ingressos Vendidos retornado');
    assert(typeof ticketsSoldHeader!.total === 'number', 'Total numérico de ingressos calculado');
  }

  // ============================================================================
  // BLOCO 6: RELATÓRIOS SALVOS & REGRA DE COMPARTILHAMENTO (NUNCA ELEVA PERMISSÃO)
  // ============================================================================
  console.log('\n--- BLOCO 6: Relatórios Salvos & Regra de Compartilhamento Seguro ---');
  {
    const reportService = new ReportService();

    // 1. Analista financeiro cria um relatório com indicadores financeiros
    const financialReport = await reportService.createReport(
      {
        title: 'Demonstrativo de Saldos e Repasses',
        description: 'Visão detalhada de saldo e estornos',
        domain: 'FINANCEIRO',
        queryDefinition: {
          metrics: ['finance.available_balance', 'refunds.executed_amount'],
          dimensions: ['gateway'],
          period: { type: 'THIS_MONTH' }
        },
        chartType: 'TABLE',
        visibility: 'PRIVATE'
      },
      financeAnalyst
    );

    assert(financialReport.id.startsWith('rep_'), 'Relatório financeiro criado com sucesso');

    // 2. Criador compartilha o relatório explicitamente com o analista comercial
    await reportService.shareReport(
      financialReport.id,
      {
        visibility: 'SPECIFIC_USERS',
        sharedWithUserIds: [comercialAnalyst.id]
      },
      financeAnalyst
    );

    // 3. Analista comercial consegue listar o relatório porque foi compartilhado com ele
    const reportsForComercial = await reportService.listReports(comercialAnalyst);
    const hasReportInList = reportsForComercial.some(r => r.id === financialReport.id);
    assert(hasReportInList, 'Relatório compartilhado aparece na lista de relatórios acessíveis do analista comercial');

    // 4. REGRA CRÍTICA: Ao tentar EXECUTAR o relatório, a permissão do analista comercial é checada dinamicamente!
    // Como ele NÃO tem `relatorios.financeiro.visualizar`, a execução DEVE SER NEGADA!
    let shareElevatedPermissionAttempt = false;
    try {
      await reportService.executeReport(financialReport.id, comercialAnalyst);
    } catch (err: any) {
      shareElevatedPermissionAttempt = true;
      assert(err.message.includes('Acesso negado') && err.message.includes('relatorios.financeiro.visualizar'), 'Compartilhamento NÃO concedeu acesso indevido ao analista comercial sem permissão');
    }
    assert(shareElevatedPermissionAttempt, 'Regra estrita de compartilhamento seguro validada com sucesso');

    // 5. Duplicação de relatório
    const duplicated = await reportService.duplicateReport(financialReport.id, financeAnalyst, 'Cópia Demonstrativo');
    assert(duplicated.title === 'Cópia Demonstrativo', 'Relatório duplicado com novo título');
    assert(duplicated.id !== financialReport.id, 'Novo ID gerado na duplicação');
  }

  // ============================================================================
  // BLOCO 7: CENTRAL DE EXPORTAÇÕES AUDITADAS (CSV, XLSX, PDF) & MARCA D'ÁGUA
  // ============================================================================
  console.log('\n--- BLOCO 7: Central de Exportações Auditadas & Marca D\'água ---');
  {
    const analyticsService = new AnalyticsService();
    const exportService = new ExportService();

    const sampleResult = await analyticsService.executeQuery(
      {
        metrics: ['sales.gross_amount', 'tickets.sold'],
        dimensions: ['channel'],
        period: { type: 'THIS_MONTH' }
      },
      adminUser
    );

    // 1. Exportação CSV com delimitador brasileiro (;) e BOM UTF-8
    const csvExport = CsvExporter.exportToCsv(sampleResult, { title: 'Vendas por Canal' });
    assert(csvExport.content.startsWith('\uFEFF'), 'CSV inclui marcador UTF-8 BOM para compatibilidade com Excel');
    assert(csvExport.content.includes(';'), 'CSV utiliza ponto-e-vírgula (;) como delimitador oficial');
    assert(csvExport.mimeType.includes('text/csv'), 'MIME type de CSV correto');

    // 2. Exportação XLSX Estruturada
    const xlsxExport = XlsxExporter.exportToXlsx(sampleResult, {
      title: 'Vendas por Canal',
      watermark: 'Disk Interno | Confidencial'
    });
    assert(xlsxExport.content.includes('xml'), 'XLSX estruturado gerado em XML Spreadsheet 2003 compatível');
    assert(xlsxExport.content.includes('Confidencial'), 'XLSX contém marca d\'água de auditoria');

    // 3. Exportação PDF com Carimbo de Auditoria
    const pdfExport = PdfExporter.exportToPdf(sampleResult, {
      title: 'Relatório Executivo',
      watermark: 'Gerado por Carlos Administrador | 19/09/2026',
      user: adminUser,
      exportId: 'exp_test_99'
    });
    assert(pdfExport.mimeType === 'application/pdf' && pdfExport.content.includes('DISK INGRESSOS'), 'Arquivo PDF gerado com MIME type correto e layout estruturado');
    assert(pdfExport.content.includes('Carlos Administrador'), 'PDF contém dados do operador no carimbo de auditoria');

    // 4. Job de Exportação Direta com persistência e rastreabilidade
    const exportDirect = await exportService.exportDirect(
      {
        reportTitle: 'Relatório Teste Auditoria',
        format: 'CSV',
        result: sampleResult
      },
      adminUser
    );
    assert(exportDirect.jobId !== undefined, 'Exportação direta gerou ID de rastreabilidade auditada');

    const jobRecord = await exportService.getExportJob(exportDirect.jobId);
    assert(jobRecord !== null, 'Registro do job de exportação persistido no banco');
    assert(jobRecord!.status === 'COMPLETED', 'Status da exportação direta marcado como COMPLETED');
    assert(jobRecord!.watermark !== null, 'Marca d\'água auditada persistida');
  }

  // ============================================================================
  // BLOCO 8: AGENDAMENTO DE RELATÓRIOS & RE-VALIDAÇÃO DINÂMICA
  // ============================================================================
  console.log('\n--- BLOCO 8: Agendamento & Re-validação Dinâmica de Permissões ---');
  {
    const reportService = new ReportService();
    const schedulerService = new ReportSchedulerService();

    // Cria relatório comercial
    const salesReport = await reportService.createReport(
      {
        title: 'Fechamento Comercial Semanal',
        domain: 'COMERCIAL',
        queryDefinition: {
          metrics: ['sales.gross_amount', 'orders.paid'],
          dimensions: ['channel'],
          period: { type: 'THIS_MONTH' }
        },
        chartType: 'BAR',
        visibility: 'PRIVATE'
      },
      comercialAnalyst
    );

    // Analista comercial agenda relatório para toda segunda-feira às 08:00
    const schedule = await schedulerService.createSchedule(
      {
        reportId: salesReport.id,
        reportTitle: salesReport.title,
        frequency: 'WEEKLY',
        dayOfWeek: 1,
        timeOfDay: '08:00',
        format: 'XLSX',
        recipients: [
          { type: 'EMAIL', target: 'diretoria@diskingressos.com.br' },
          { type: 'USER', target: comercialAnalyst.id }
        ]
      },
      comercialAnalyst
    );

    assert(schedule.id.startsWith('sch_'), 'Agendamento semanal criado com sucesso');
    assert(schedule.active === true, 'Agendamento está ativo');
    assert(schedule.nextRunAt !== undefined, 'Próxima execução calculada automaticamente');

    // Execução regular com criador ativo
    const execSuccess = await schedulerService.executeSchedule(schedule.id, comercialAnalyst);
    assert(execSuccess.status === 'SUCCESS', 'Execução de agendamento bem-sucedida para criador ativo');

    // SIMULAÇÃO CRÍTICA: Criador foi bloqueado ou demitido da empresa
    const blockedUser = { ...comercialAnalyst, status: 'BLOCKED' };
    const execBlocked = await schedulerService.executeSchedule(schedule.id, blockedUser);
    assert(execBlocked.status === 'FAILED', 'Agendamento detectou usuário bloqueado e impediu execução');
    assert(execBlocked.message?.includes('bloqueado') || execBlocked.message?.includes('revogada'), 'Mensagem de auditoria informa o motivo do bloqueio de segurança');
  }

  // ============================================================================
  // BLOCO 9: SNAPSHOTS ESTÁTICOS VS RELATÓRIOS DINÂMICOS
  // ============================================================================
  console.log('\n--- BLOCO 9: Snapshots Congelados de Fechamento Histórico ---');
  {
    const reportService = new ReportService();
    const snapshotService = new SnapshotService(reportService);

    const baseReport = await reportService.createReport(
      {
        title: 'Fechamento Fiscal Mensal',
        domain: 'CONTABILIDADE',
        queryDefinition: {
          metrics: ['accounting.gross_revenue'],
          dimensions: ['channel'],
          period: { type: 'THIS_MONTH' }
        },
        chartType: 'TABLE',
        visibility: 'PRIVATE'
      },
      financeAnalyst
    );

    // Congela foto do relatório no fechamento mensal
    const snapshot = await snapshotService.createSnapshot(
      {
        reportId: baseReport.id,
        title: 'Snapshot Fechamento Agosto 2026',
        notes: 'Fechamento final auditado por auditoria independente'
      },
      financeAnalyst
    );

    assert(snapshot.id.startsWith('snp_'), 'Snapshot imutável criado');
    assert(snapshot.frozenData !== undefined, 'Dados analíticos congelados salvos no snapshot');

    const retrieved = await snapshotService.getSnapshot(snapshot.id);
    assert(retrieved !== null, 'Snapshot recuperado com integridade');
    assert(retrieved!.notes === 'Fechamento final auditado por auditoria independente', 'Notas de fechamento preservadas');
  }

  // ============================================================================
  // BLOCO 10: CACHE ANALÍTICO & INVALIDAÇÃO ORIENTADA A EVENTOS
  // ============================================================================
  console.log('\n--- BLOCO 10: Cache Analítico & Invalidação Orientada a Eventos ---');
  {
    const analyticsService = new AnalyticsService();

    const query: AnalyticsQuery = {
      metrics: ['sales.gross_amount'],
      dimensions: ['channel'],
      period: { type: 'THIS_MONTH' }
    };

    // 1. Primeira execução: Não deve vir do cache
    const run1 = await analyticsService.executeQuery(query, adminUser);
    assert(run1.cached === false, 'Primeira execução executa cálculo (cached = false)');

    // 2. Segunda execução idêntica: Deve ser servida a partir do cache de alta performance
    const run2 = await analyticsService.executeQuery(query, adminUser);
    assert(run2.cached === true, 'Segunda execução servida instantaneamente do cache analítico (cached = true)');

    // 3. Evento de negócio (ex: ORDER_PAID) invalida o cache do domínio Comercial
    const invalidatedCount = analyticsService.invalidateCache('ORDER_PAID');
    assert(invalidatedCount > 0, `Evento ORDER_PAID invalidou ${invalidatedCount} entrada(s) de cache do domínio Comercial`);

    // 4. Terceira execução após invalidação: Novo cálculo é feito
    const run3 = await analyticsService.executeQuery(query, adminUser);
    assert(run3.cached === false, 'Execução pós-evento recalcula dados frescos sem cache desatualizado');
  }

  // ============================================================================
  // BLOCO 11: METAS OPERACIONAIS (REALIZADO X META) & DASHBOARDS UNIFICADOS
  // ============================================================================
  console.log('\n--- BLOCO 11: Metas Operacionais & Dashboards Unificados ---');
  {
    const dashboardService = new DashboardService();
    const widgetRegistry = WidgetRegistry.getInstance();

    // 1. Catálogo de Widgets Operacionais
    const allWidgets = widgetRegistry.getAllWidgets();
    assert(allWidgets.length >= 8, `Catálogo de widgets contém ${allWidgets.length} componentes analíticos pré-configurados`);

    // 2. Dashboard Executivo Unificado
    const execDash = await dashboardService.getExecutiveDashboard({ type: 'THIS_MONTH' }, adminUser);
    assert(execDash.domain === 'EXECUTIVE', 'Dashboard executivo consolidado com sucesso');
    assert(execDash.widgets.length > 0, 'Widgets carregados para visualização executiva');
    assert(execDash.metricsResult.rows.length > 0, 'Métricas executivas calculadas');

    // 3. Criação de Meta Operacional (Realizado x Meta)
    const goal = await dashboardService.createGoal({
      metricCode: 'sales.gross_amount',
      name: 'Meta de Faturamento Setembro 2026',
      targetValue: 2000000, // R$ 2.000.000,00
      currentValue: 1250000, // R$ 1.250.000,00
      projectionValue: 2100000, // R$ 2.100.000,00
      unit: 'BRL',
      period: '2026-09'
    });

    assert(goal.id.startsWith('goal_'), 'Meta operacional cadastrada');
    assert(goal.progressPercent === 62.5, `Progresso da meta calculado corretamente: ${goal.progressPercent}%`);

    // 4. Atualização de Progresso de Meta
    const updatedGoal = await dashboardService.updateGoalProgress(goal.id, 1600000, 2200000);
    assert(updatedGoal.progressPercent === 80, `Progresso da meta atualizado para: ${updatedGoal.progressPercent}%`);

    // 5. Dashboard por Domínio (ex: Comercial)
    const comDash = await dashboardService.getDomainDashboard('COMERCIAL', { type: 'THIS_MONTH' }, adminUser);
    assert(comDash.domain === 'COMERCIAL', 'Dashboard do domínio Comercial gerado');
    assert(comDash.goals !== undefined && comDash.goals.length > 0, 'Metas operacionais vinculadas ao dashboard');
  }

  console.log('\n================================================================');
  console.log(`   RESULTADO FINAL: ${passed} DE ${total} TESTES PASSARAM COM SUCESSO!`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Erro fatal durante a execução dos testes:', err);
  process.exit(1);
});
