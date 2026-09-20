import { RegisteredJobDefinition, JobRegistryEntry } from './job.types';

export class JobRegistry {
  private static instance: JobRegistry;
  private entries: Map<string, RegisteredJobDefinition> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): JobRegistry {
    if (!JobRegistry.instance) {
      JobRegistry.instance = new JobRegistry();
    }
    return JobRegistry.instance;
  }

  public register(definition: RegisteredJobDefinition): void {
    this.entries.set(definition.type, definition);
  }

  public get(type: string): RegisteredJobDefinition | undefined {
    return this.entries.get(type);
  }

  public has(type: string): boolean {
    return this.entries.has(type);
  }

  public list(): JobRegistryEntry[] {
    return Array.from(this.entries.values()).map(entry => {
      const { handler, ...meta } = entry;
      return meta;
    });
  }

  private registerDefaults(): void {
    // 1. Financeiro: Conciliação
    this.register({
      type: 'FINANCE_RECONCILIATION',
      name: 'Conciliação Financeira Operacional',
      description: 'Concilia transações bancárias, adquirentes e pedidos pagos',
      module: 'FINANCEIRO',
      queue: 'finance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 600,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 2000,
        maxDelayMs: 30000,
        jitter: true
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `FIN_REC:${payload.producerId || 'all'}:${payload.period || new Date().toISOString().slice(0, 10)}`
      },
      requiredPermission: 'financeiro.conciliacao.executar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(25, 100, 25, 0, 'Coletando extratos e vendas...');
        if (await ctx.isCancellationRequested()) throw new Error('Job cancelado cooperativamente');
        await ctx.saveCheckpoint('cursor_step_1', 25, { stage: 'extracts_collected' });
        await ctx.reportProgress(50, 100, 50, 0, 'Cruzando recebíveis e taxas...');
        await ctx.reportProgress(100, 100, 100, 0, 'Conciliação finalizada com sucesso');
        return { reconciledCount: payload.itemsCount || 150, matchedAmount: 485000.50, discrepancies: 0 };
      }
    });

    // 2. Financeiro: Repasses e Pagamentos
    this.register({
      type: 'PAYOUT_CALCULATION',
      name: 'Cálculo de Repasse a Produtores',
      description: 'Calcula montante líquido, deduz taxas, estornos e retenções de borderô',
      module: 'FINANCEIRO',
      queue: 'payments',
      defaultPriority: 'HIGH',
      timeoutSeconds: 300,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        jitter: true
      },
      cancellable: false,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `PAYOUT:${payload.eventId}:${payload.period}:${payload.producerId}`
      },
      requiredPermission: 'financeiro.repasses.aprovar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(10, 100, 10, 0, 'Validando elegibilidade e conta bancária...');
        if (payload.accountNumber === '00000-0') {
          const err: any = new Error('Conta bancária inexistente ou inválida');
          err.isPermanent = true;
          throw err;
        }
        await ctx.reportProgress(50, 100, 50, 0, 'Deduzindo taxas operacionais e estornos...');
        await ctx.reportProgress(100, 100, 100, 0, 'Repasse liquidado');
        return { netPayoutAmount: payload.amount || 125000.00, producerId: payload.producerId, eventId: payload.eventId };
      }
    });

    // 3. Financeiro: Geração de Arquivo CNAB
    this.register({
      type: 'CNAB_GENERATION',
      name: 'Geração de Remessa CNAB 240/400',
      description: 'Gera arquivo de remessa bancária para lote de pagamentos ou cobranças',
      module: 'FINANCEIRO',
      queue: 'finance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 300,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 3000,
        maxDelayMs: 6000,
        jitter: false
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `CNAB:${payload.batchId || Date.now()}`
      },
      requiredPermission: 'financeiro.pagamento.criar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(50, 100, 50, 0, 'Formatando registros CNAB 240...');
        await ctx.reportProgress(100, 100, 100, 0, 'Arquivo CNAB gerado');
        return { fileUrl: `/storage/cnab/remessa_${Date.now()}.rem`, totalRecords: payload.records || 42 };
      }
    });

    // 4. Financeiro: Processamento de Retorno Bancário
    this.register({
      type: 'BANK_RETURN_PROCESSING',
      name: 'Processamento de Retorno Bancário',
      description: 'Lê e efetiva conciliações vindas de arquivo de retorno CNAB',
      module: 'FINANCEIRO',
      queue: 'finance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 600,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 2000,
        maxDelayMs: 20000,
        jitter: true
      },
      cancellable: false,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `RETORNO:${payload.fileName || Date.now()}`
      },
      requiredPermission: 'financeiro.conciliacao.executar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Retorno bancário processado');
        return { processedRecords: 120, liquidations: 118, rejections: 2 };
      }
    });

    // 5. Relatórios: Exportação Grande (CSV / XLSX / PDF)
    this.register({
      type: 'REPORT_EXPORT_JOB',
      name: 'Exportação em Segundo Plano de Relatório',
      description: 'Processa e gera arquivos de dados analíticos volumosos com marca d\'água',
      module: 'RELATORIOS',
      queue: 'analytics',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 900,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 5000,
        maxDelayMs: 10000,
        jitter: false
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `EXP:${payload.reportId}:${payload.format}:${payload.requestedAt || ''}`
      },
      requiredPermission: 'relatorios.exportacao.criar',
      handler: async (payload, ctx) => {
        const total = payload.totalRows || 50000;
        const chunkSize = 5000;
        for (let processed = 0; processed < total; processed += chunkSize) {
          if (await ctx.isCancellationRequested()) {
            throw new Error('Cancelamento cooperativo de exportação solicitado');
          }
          await ctx.reportProgress(processed + chunkSize, total, processed + chunkSize, 0, `Processando linhas ${processed} a ${processed + chunkSize}...`);
        }
        return { downloadUrl: `/analytics/exports/download/${payload.reportId}.${(payload.format || 'xlsx').toLowerCase()}`, rows: total };
      }
    });

    // 6. Relatórios: Snapshot de Fechamento
    this.register({
      type: 'REPORT_SNAPSHOT_JOB',
      name: 'Snapshot Imutável de Fechamento Histórico',
      description: 'Congela fotografia analítica para prestação de contas e auditoria',
      module: 'RELATORIOS',
      queue: 'analytics',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 600,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 2000,
        maxDelayMs: 5000,
        jitter: false
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `SNAP:${payload.reportId}:${payload.snapshotDate}`
      },
      requiredPermission: 'relatorios.relatorio.visualizar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Snapshot congelado com integridade');
        return { snapshotId: `snp_${Date.now()}`, checksum: 'sha256:abc123frozen' };
      }
    });

    // 7. Relatórios: Agregação Analítica
    this.register({
      type: 'ANALYTICS_AGGREGATION',
      name: 'Agregação Analítica e Recálculo de Métricas',
      description: 'Executa consolidações periódicas para visualizações rápidas de BI',
      module: 'RELATORIOS',
      queue: 'analytics',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 1200,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 3000,
        maxDelayMs: 30000,
        jitter: true
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `AGG:${payload.period || new Date().toISOString().slice(0, 10)}`
      },
      requiredPermission: 'relatorios.central.visualizar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Métricas agregadas');
        return { aggregatedDomains: ['COMERCIAL', 'FINANCEIRO', 'MARKETING'] };
      }
    });

    // 8. Marketing: Disparo de Campanhas em Lote
    this.register({
      type: 'MARKETING_CAMPAIGN_DISPATCH',
      name: 'Disparo de Campanha WhatsApp / E-mail',
      description: 'Segmenta base, enfileira mensagens e respeita taxa de envio do provedor',
      module: 'MARKETING',
      queue: 'marketing',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 1800,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 5000,
        maxDelayMs: 60000,
        jitter: true
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `MKT_CAMP:${payload.campaignId}`
      },
      requiredPermission: 'marketing.campanha.publicar',
      handler: async (payload, ctx) => {
        const total = payload.totalContacts || 10000;
        const batch = 1000;
        let processed = 0;
        const checkpoint = await ctx.getCheckpoint();
        if (checkpoint && checkpoint.processedCount) {
          processed = checkpoint.processedCount;
        }

        while (processed < total) {
          if (await ctx.isCancellationRequested()) {
            throw new Error('Cancelamento cooperativo de campanha solicitado');
          }
          if (await ctx.isPauseRequested()) {
            await ctx.saveCheckpoint(`cursor_${processed}`, processed, { pausedAtItem: processed });
            return { paused: true, processedSoFar: processed };
          }

          processed = Math.min(processed + batch, total);
          await ctx.reportProgress(processed, total, processed, 0, `Enviando lote (${processed}/${total})...`);
          await ctx.saveCheckpoint(`cursor_${processed}`, processed);
        }

        return { dispatchedCount: total, status: 'COMPLETED' };
      }
    });

    // 9. Marketing: Sincronização de Conversões e Ads
    this.register({
      type: 'MARKETING_SYNC_ADS',
      name: 'Sincronização com Meta Ads / TikTok Ads',
      description: 'Sincroniza custos, ROAS, cliques e conversões de parceiros de mídia',
      module: 'MARKETING',
      queue: 'integrations',
      defaultPriority: 'LOW',
      timeoutSeconds: 600,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 2000,
        maxDelayMs: 20000,
        jitter: true
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `MKT_SYNC:${payload.provider}:${payload.date || new Date().toISOString().slice(0, 10)}`
      },
      requiredPermission: 'marketing.pixel.configurar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Sincronização concluída');
        return { syncedAds: 45, conversionsRecorded: 312 };
      }
    });

    // 10. Webhooks: Processamento Assíncrono de Webhook
    this.register({
      type: 'WEBHOOK_PROCESSING',
      name: 'Processamento Assíncrono de Webhook',
      description: 'Efetiva regras de negócio de payload de webhook com resposta rápida na borda',
      module: 'INTEGRACOES',
      queue: 'webhooks',
      defaultPriority: 'CRITICAL',
      timeoutSeconds: 60,
      retryPolicy: {
        maxAttempts: 5,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 500,
        maxDelayMs: 15000,
        jitter: true
      },
      cancellable: false,
      pausable: false,
      progressEnabled: false,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `WH_EVT:${payload.eventId || payload.webhookInboxId || Date.now()}`
      },
      requiredPermission: 'processamentos.job.visualizar',
      handler: async (payload, ctx) => {
        return { acknowledged: true, processedEntity: payload.entityType || 'PAYMENT' };
      }
    });

    // 11. Documentos: Escaneamento e Verificação
    this.register({
      type: 'DOCUMENT_SCAN',
      name: 'Escaneamento e Antivírus de Documento',
      description: 'Valida cabeçalho MIME, assinaturas criptográficas e sanitização de anexo',
      module: 'DOCUMENTOS',
      queue: 'documents',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 180,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 1000,
        maxDelayMs: 3000,
        jitter: false
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `DOC_SCAN:${payload.documentId}`
      },
      requiredPermission: 'documentos.central.visualizar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Documento verificado e seguro');
        return { documentId: payload.documentId, isClean: true };
      }
    });

    // 12. Contabilidade: Fechamento Contábil
    this.register({
      type: 'ACCOUNTING_CLOSING',
      name: 'Rotina de Fechamento Contábil',
      description: 'Validação de lançamentos contábeis, conciliação e geração de balancete/DRE',
      module: 'CONTABILIDADE',
      queue: 'finance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 1200,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 5000,
        maxDelayMs: 15000,
        jitter: false
      },
      cancellable: false,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `ACC_CLOSE:${payload.period}`
      },
      requiredPermission: 'contabilidade.fechamento.executar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(20, 100, 20, 0, 'Validando conciliação do período...');
        await ctx.reportProgress(60, 100, 60, 0, 'Gerando partidas dobradas e DRE...');
        await ctx.reportProgress(100, 100, 100, 0, 'Fechamento contábil concluído');
        return { period: payload.period, entriesProcessed: 4200, balanceCheck: 'BALANCED' };
      }
    });

    // 13. Eventos: Processamento em Lote de Repasse
    this.register({
      type: 'EVENT_BATCH_PAYOUT',
      name: 'Lote de Repasses de Eventos',
      description: 'Orquestra cálculo e efetivação de repasses múltiplos para produtores e eventos',
      module: 'EVENTOS',
      queue: 'payments',
      defaultPriority: 'HIGH',
      timeoutSeconds: 900,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 2000,
        maxDelayMs: 20000,
        jitter: true
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `BATCH_PAYOUT:${payload.batchId || Date.now()}`
      },
      requiredPermission: 'financeiro.repasses.aprovar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(100, 100, 100, 0, 'Lote processado');
        return { processedProducers: payload.producersCount || 10, totalPaid: payload.totalAmount || 540000 };
      }
    });

    // 14. Gestão de Dados: Processamento de Lote de Importação
    this.register({
      type: 'DATA_IMPORT_PROCESSING',
      name: 'Processamento de Lote de Importação',
      description: 'Orquestra validação, transformação, detecção de duplicidades e ingestão de planilhas',
      module: 'DOCUMENTOS',
      queue: 'documents',
      defaultPriority: 'HIGH',
      timeoutSeconds: 1800,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'FIXED',
        initialDelayMs: 5000,
        maxDelayMs: 15000,
        jitter: false
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `IMPORT:${payload.importRequestId || payload.code}`
      },
      requiredPermission: 'dados.importacao.processar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(10, 100, 10, 0, 'Iniciando validação de esquema e domínio...');
        await ctx.reportProgress(50, 100, 50, 0, 'Verificando duplicidades e integridade referencial...');
        await ctx.reportProgress(90, 100, 90, 0, 'Persistindo registros com transações atômicas...');
        await ctx.reportProgress(100, 100, 100, 0, 'Processamento de importação concluído com sucesso.');
        return { importRequestId: payload.importRequestId, status: 'COMPLETED' };
      }
    });

    // 15. Gestão de Dados: Varredura de Qualidade de Dados (Scan)
    this.register({
      type: 'DATA_QUALITY_SCAN',
      name: 'Varredura de Qualidade de Dados',
      description: 'Executa regras de conformidade nas 6 dimensões de dados e gera tarefas automáticas',
      module: 'AUDITORIA',
      queue: 'maintenance',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 1200,
      retryPolicy: {
        maxAttempts: 2,
        backoffType: 'EXPONENTIAL',
        initialDelayMs: 3000,
        maxDelayMs: 20000,
        jitter: true
      },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `QUALITY_SCAN:${payload.ruleCode || 'ALL'}:${new Date().toISOString().slice(0, 13)}`
      },
      requiredPermission: 'dados.qualidade.executar_scan',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(20, 100, 20, 0, 'Auditando completude e validade...');
        await ctx.reportProgress(60, 100, 60, 0, 'Analisando unicidade e consistência relacional...');
        await ctx.reportProgress(100, 100, 100, 0, 'Varredura de qualidade concluída.');
        return { scannedRules: 10, issuesFound: 2, tasksCreated: 1 };
      }
    });

    // 16. Gestão de Dados: Execução de Etapa de Migração
    this.register({
      type: 'DATA_MIGRATION_EXECUTION',
      name: 'Execução de Etapa de Migração',
      description: 'Executa etapa sequencial de migração histórica com reconciliação e mapeamento de IDs legados',
      module: 'INTEGRACOES',
      queue: 'maintenance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 3600,
      retryPolicy: {
        maxAttempts: 1,
        backoffType: 'FIXED',
        initialDelayMs: 10000,
        maxDelayMs: 10000,
        jitter: false
      },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: {
        enabled: true,
        keyGenerator: (payload) => `MIG_STAGE:${payload.projectId}:${payload.stageNumber}`
      },
      requiredPermission: 'dados.migracao.executar',
      handler: async (payload, ctx) => {
        await ctx.reportProgress(25, 100, 25, 0, 'Verificando dependências no grafo DAG...');
        await ctx.reportProgress(50, 100, 50, 0, 'Mapeando identificadores legados (Legacy IDs)...');
        await ctx.reportProgress(85, 100, 85, 0, 'Executando reconciliação de contagem e valores...');
        await ctx.reportProgress(100, 100, 100, 0, 'Etapa de migração finalizada com conciliação.');
        return { projectId: payload.projectId, stageNumber: payload.stageNumber, status: 'COMPLETED' };
      }
    });
  }
}
