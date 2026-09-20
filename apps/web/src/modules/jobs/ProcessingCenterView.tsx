import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  RefreshCw,
  Plus,
  Play,
  Pause,
  XCircle,
  Building,
  RotateCcw,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import {
  Job,
  JobBatch,
  JobSchedule,
  JobWorker,
  JobDeadLetter,
  JobQueueMetrics,
  ProcessingCenterStats,
  ProcessingTab,
  JobQueue,
  JobModule,
  JobPriority,
  JobRegistryEntry
} from './jobs.types';

// Sub Views
import { OverviewTab } from './views/OverviewTab';
import { RunningJobsTab } from './views/RunningJobsTab';
import { QueuedJobsTab } from './views/QueuedJobsTab';
import { SchedulesTab } from './views/SchedulesTab';
import { BatchesTab } from './views/BatchesTab';
import { CompletedJobsTab } from './views/CompletedJobsTab';
import { DeadLetterTab } from './views/DeadLetterTab';
import { QueuesTab } from './views/QueuesTab';
import { WorkersTab } from './views/WorkersTab';

// Modals
import { JobDetailsModal } from './components/JobDetailsModal';
import { NewScheduleModal } from './components/NewScheduleModal';
import { NewBatchModal } from './components/NewBatchModal';
import { Button } from '../../shared/components/Button';

interface ProcessingCenterViewProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const ProcessingCenterView: React.FC<ProcessingCenterViewProps> = ({
  initialSubItem,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { isGlobalScope, activeProducer, activeEvent } = useDiskContext();

  const mapSubItemToTab = (subItem?: string): ProcessingTab => {
    switch (subItem) {
      case 'jobs-running': return 'running';
      case 'jobs-queued': return 'queued';
      case 'jobs-schedules': return 'schedules';
      case 'jobs-batches': return 'batches';
      case 'jobs-completed': return 'completed';
      case 'jobs-dead-letter': return 'dead_letter';
      case 'jobs-queues': return 'queues';
      case 'jobs-workers': return 'workers';
      case 'jobs-overview':
      default: return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState<ProcessingTab>(mapSubItemToTab(initialSubItem));

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(mapSubItemToTab(initialSubItem));
    }
  }, [initialSubItem]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Modals State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);

  // Registered Job Catalog
  const registeredJobsCatalog: JobRegistryEntry[] = [
    {
      type: 'FINANCE_RECONCILIATION',
      name: 'Conciliação Financeira Diária',
      description: 'Auditoria de transações de cartão e Pix contra adquirentes',
      module: 'FINANCEIRO',
      queue: 'critical',
      defaultPriority: 'CRITICAL',
      timeoutSeconds: 300,
      retryPolicy: { maxAttempts: 3, backoffType: 'EXPONENTIAL', initialDelayMs: 2000, maxDelayMs: 30000, jitter: true },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: { enabled: true },
      requiredPermission: 'financeiro.conciliacao.executar'
    },
    {
      type: 'PAYOUT_CALCULATION',
      name: 'Cálculo de Repasses e Splits',
      description: 'Cálculo consolidado de saldos e transferências líquidas para organizadores',
      module: 'FINANCEIRO',
      queue: 'finance',
      defaultPriority: 'HIGH',
      timeoutSeconds: 300,
      retryPolicy: { maxAttempts: 3, backoffType: 'EXPONENTIAL', initialDelayMs: 2000, maxDelayMs: 30000, jitter: true },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: { enabled: true },
      requiredPermission: 'financeiro.repasses.aprovar'
    },
    {
      type: 'MARKETING_CAMPAIGN_DISPATCH',
      name: 'Disparo de WhatsApp e E-mail Abandonados',
      description: 'Comunicação automática para recuperação de carrinhos e promoções',
      module: 'MARKETING',
      queue: 'marketing',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 600,
      retryPolicy: { maxAttempts: 3, backoffType: 'EXPONENTIAL', initialDelayMs: 5000, maxDelayMs: 60000, jitter: true },
      cancellable: true,
      pausable: true,
      progressEnabled: true,
      idempotencyPolicy: { enabled: true },
      requiredPermission: 'marketing.campanha.criar'
    },
    {
      type: 'CNAB_GENERATION',
      name: 'Geração de Arquivo CNAB 240 / Itaú',
      description: 'Remessa bancária para liquidação de repasses aos produtores',
      module: 'FINANCEIRO',
      queue: 'critical',
      defaultPriority: 'HIGH',
      timeoutSeconds: 180,
      retryPolicy: { maxAttempts: 3, backoffType: 'FIXED', initialDelayMs: 2000, maxDelayMs: 10000, jitter: false },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: { enabled: true },
      requiredPermission: 'financeiro.repasses.aprovar'
    },
    {
      type: 'REPORT_EXPORT_JOB',
      name: 'Exportação de DRE e Vendas',
      description: 'Geração assíncrona de relatórios analíticos em CSV e PDF',
      module: 'RELATORIOS',
      queue: 'analytics',
      defaultPriority: 'NORMAL',
      timeoutSeconds: 180,
      retryPolicy: { maxAttempts: 2, backoffType: 'FIXED', initialDelayMs: 1000, maxDelayMs: 5000, jitter: false },
      cancellable: true,
      pausable: false,
      progressEnabled: true,
      idempotencyPolicy: { enabled: false },
      requiredPermission: 'relatorios.exportacao.criar'
    }
  ];

  // Initial Mock Jobs
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 'job_rec_8831',
      type: 'FINANCE_RECONCILIATION',
      module: 'FINANCEIRO',
      queue: 'critical',
      priority: 'CRITICAL',
      status: 'RUNNING',
      progress: 64,
      progressData: {
        percentage: 64,
        processedItems: 1280,
        totalItems: 2000,
        successItems: 1280,
        failedItems: 0,
        currentStep: 'Validando recebíveis Cielo lote #892'
      },
      payload: { date: '2026-09-19', gateways: ['CIELO', 'REDE', 'PIX_CENTRAL'] },
      result: null,
      error: null,
      producerId: null,
      eventId: null,
      createdBy: 'usr_sys_01',
      createdByName: 'Sistema Automático',
      attempts: 1,
      maxAttempts: 3,
      cancellable: true,
      pausable: true,
      correlationId: 'corr_rec_8831',
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
    },
    {
      id: 'job_payout_9012',
      type: 'PAYOUT_CALCULATION',
      module: 'FINANCEIRO',
      queue: 'finance',
      priority: 'HIGH',
      status: 'RUNNING',
      progress: 42,
      progressData: {
        percentage: 42,
        processedItems: 42,
        totalItems: 100,
        successItems: 42,
        failedItems: 0,
        currentStep: 'Calculando taxa de conveniência e split de comissões'
      },
      payload: { producerId: 'prod_001', cycle: '2026-09-A' },
      result: null,
      error: null,
      producerId: 'prod_001',
      eventId: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 1,
      maxAttempts: 3,
      cancellable: true,
      pausable: true,
      correlationId: 'corr_payout_9012',
      createdAt: new Date(Date.now() - 1000 * 90).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60).toISOString()
    },
    {
      id: 'job_mkt_4102',
      type: 'MARKETING_CAMPAIGN_DISPATCH',
      module: 'MARKETING',
      queue: 'marketing',
      priority: 'NORMAL',
      status: 'RUNNING',
      progress: 88,
      progressData: {
        percentage: 88,
        processedItems: 475,
        totalItems: 540,
        successItems: 475,
        failedItems: 0,
        currentStep: 'Enviando lote #5 via WhatsApp Business API'
      },
      payload: { campaignId: 'cmp_spring_fest', targetUsers: 540 },
      result: null,
      error: null,
      producerId: 'prod_001',
      eventId: 'evt_001',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 1,
      maxAttempts: 3,
      cancellable: true,
      pausable: true,
      correlationId: 'corr_mkt_4102',
      createdAt: new Date(Date.now() - 1000 * 180).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 150).toISOString()
    },
    {
      id: 'job_cnab_7721',
      type: 'CNAB_GENERATION',
      module: 'FINANCEIRO',
      queue: 'critical',
      priority: 'HIGH',
      status: 'QUEUED',
      progress: 0,
      progressData: {
        percentage: 0,
        processedItems: 0,
        totalItems: 310,
        successItems: 0,
        failedItems: 0,
        currentStep: 'Aguardando worker disponível'
      },
      payload: { bankCode: '341', layout: '240', paymentsCount: 310 },
      result: null,
      error: null,
      producerId: null,
      eventId: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 0,
      maxAttempts: 3,
      cancellable: true,
      pausable: false,
      correlationId: 'corr_cnab_7721',
      createdAt: new Date(Date.now() - 1000 * 45).toISOString()
    },
    {
      id: 'job_rep_1943',
      type: 'REPORT_EXPORT_JOB',
      module: 'RELATORIOS',
      queue: 'analytics',
      priority: 'NORMAL',
      status: 'QUEUED',
      progress: 0,
      progressData: {
        percentage: 0,
        processedItems: 0,
        totalItems: 1,
        successItems: 0,
        failedItems: 0,
        currentStep: 'Na fila de relatórios'
      },
      payload: { format: 'XLSX', period: '2026-08', producerId: 'prod_001' },
      result: null,
      error: null,
      producerId: 'prod_001',
      eventId: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 0,
      maxAttempts: 2,
      cancellable: true,
      pausable: false,
      correlationId: 'corr_rep_1943',
      createdAt: new Date(Date.now() - 1000 * 120).toISOString()
    },
    {
      id: 'job_agg_0099',
      type: 'ANALYTICS_AGGREGATION',
      module: 'RELATORIOS',
      queue: 'analytics',
      priority: 'NORMAL',
      status: 'COMPLETED',
      progress: 100,
      progressData: {
        percentage: 100,
        processedItems: 48902,
        totalItems: 48902,
        successItems: 48902,
        failedItems: 0,
        currentStep: 'Finalizado com sucesso'
      },
      payload: { date: '2026-09-18' },
      result: { aggregatedRecords: 48902, executionTimeMs: 1420 },
      error: null,
      producerId: null,
      eventId: null,
      createdBy: 'usr_sys_01',
      createdByName: 'Scheduler de Rotinas',
      attempts: 1,
      maxAttempts: 3,
      cancellable: false,
      pausable: false,
      correlationId: 'corr_agg_0099',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    {
      id: 'job_scan_8820',
      type: 'DOCUMENT_SCAN',
      module: 'DOCUMENTOS',
      queue: 'documents',
      priority: 'LOW',
      status: 'COMPLETED',
      progress: 100,
      progressData: {
        percentage: 100,
        processedItems: 1,
        totalItems: 1,
        successItems: 1,
        failedItems: 0,
        currentStep: 'OCR validado'
      },
      payload: { documentId: 'doc_cnpj_9981' },
      result: { ocrExtracted: true, fraudRiskScore: 0.02 },
      error: null,
      producerId: 'prod_001',
      eventId: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 1,
      maxAttempts: 3,
      cancellable: false,
      pausable: false,
      correlationId: 'corr_scan_8820',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 58).toISOString()
    }
  ]);

  // Initial Mock Schedules
  const [schedules, setSchedules] = useState<JobSchedule[]>([
    {
      id: 'sch_rec_daily',
      name: 'Conciliação Noturna de Cartões e Pix',
      jobType: 'FINANCE_RECONCILIATION',
      module: 'FINANCEIRO',
      frequency: 'DAILY',
      cronExpression: '0 3 * * *',
      timezone: 'America/Sao_Paulo',
      payload: { autoResolveDivergences: false },
      priority: 'CRITICAL',
      queue: 'critical',
      misfirePolicy: 'EXECUTE_IMMEDIATELY',
      active: true,
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      producerId: null,
      eventId: null,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      lastRunStatus: 'SUCCESS',
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'sch_payout_weekly',
      name: 'Fechamento Semanal de Repasses de Bilheteria',
      jobType: 'PAYOUT_CALCULATION',
      module: 'FINANCEIRO',
      frequency: 'WEEKLY',
      cronExpression: '0 6 * * 1',
      timezone: 'America/Sao_Paulo',
      payload: { minBalanceThreshold: 500 },
      priority: 'HIGH',
      queue: 'finance',
      misfirePolicy: 'EXECUTE_IMMEDIATELY',
      active: true,
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      producerId: null,
      eventId: null,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      lastRunStatus: 'SUCCESS',
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'sch_mkt_sync',
      name: 'Sincronização de Públicos e Conversões Meta Ads',
      jobType: 'MARKETING_SYNC_ADS',
      module: 'MARKETING',
      frequency: 'HOURLY',
      cronExpression: '0 * * * *',
      timezone: 'America/Sao_Paulo',
      payload: { pixelId: 'px_meta_master_01' },
      priority: 'NORMAL',
      queue: 'integrations',
      misfirePolicy: 'SKIP_MISSED',
      active: true,
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      producerId: 'prod_001',
      eventId: 'evt_001',
      lastRunAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      lastRunStatus: 'SUCCESS',
      nextRunAt: new Date(Date.now() + 1000 * 60 * 35).toISOString(),
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:00:00Z'
    }
  ]);

  // Initial Mock Batches
  const [batches, setBatches] = useState<JobBatch[]>([
    {
      id: 'batch_pay_701',
      name: 'Repasse em Massa Festival Primavera - 480 Produtores',
      module: 'FINANCEIRO',
      totalItems: 480,
      completedItems: 472,
      failedItems: 8,
      pendingItems: 0,
      progressPercent: 98,
      status: 'PARTIALLY_COMPLETED',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      producerId: 'prod_001',
      eventId: 'evt_001',
      correlationId: 'corr_batch_pay_701',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      childJobs: []
    },
    {
      id: 'batch_inv_992',
      name: 'Emissão Lote de Ingressos Cortesia Corporativa (VIP)',
      module: 'EVENTOS',
      totalItems: 150,
      completedItems: 150,
      failedItems: 0,
      pendingItems: 0,
      progressPercent: 100,
      status: 'COMPLETED',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      producerId: 'prod_001',
      eventId: 'evt_001',
      correlationId: 'corr_batch_inv_992',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      childJobs: []
    }
  ]);

  // Initial Mock Dead Letters
  const [deadLetters, setDeadLetters] = useState<JobDeadLetter[]>([
    {
      id: 'dl_9041',
      jobId: 'job_payout_err_551',
      jobType: 'PAYOUT_CALCULATION',
      module: 'FINANCEIRO',
      originalQueue: 'critical',
      failureReason: 'Chave Pix ou Conta Bancária Inválida: Banco 260 Agência 0001 Conta 999999-9 inexistente no DICT',
      errorStack: 'PermanentValidationError: Destination bank rejected transfer code DICT_NOT_FOUND',
      attemptsCount: 3,
      movedToDeadLetterAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      investigated: false,
      reprocessed: false
    },
    {
      id: 'dl_8812',
      jobId: 'job_wh_timeout_102',
      jobType: 'WEBHOOK_PROCESSING',
      module: 'INTEGRACOES',
      originalQueue: 'integrations',
      failureReason: 'Endpoint do parceiro ERP retornou HTTP 500 com timeout persistente após 3 retentativas com jitter.',
      errorStack: 'MaxRetriesExceeded: Gateway timeout from https://api.erp-parceiro.com.br/webhook',
      attemptsCount: 3,
      movedToDeadLetterAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      investigated: true,
      investigatedBy: 'Operador Financeiro',
      investigatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      reprocessed: false
    }
  ]);

  // Initial Mock Queues
  const [queues, setQueues] = useState<JobQueueMetrics[]>([
    {
      name: 'critical',
      displayName: 'Crítica / Payouts & Estornos',
      depth: 1,
      runningCount: 1,
      processingRatePerMinute: 84,
      oldestJobAgeSeconds: 45,
      activeWorkers: 4,
      status: 'HEALTHY'
    },
    {
      name: 'finance',
      displayName: 'Financeiro & Saldos',
      depth: 0,
      runningCount: 1,
      processingRatePerMinute: 195,
      oldestJobAgeSeconds: 0,
      activeWorkers: 6,
      status: 'HEALTHY'
    },
    {
      name: 'payments',
      displayName: 'Pagamentos / Pix & Gateway',
      depth: 3,
      runningCount: 0,
      processingRatePerMinute: 62,
      oldestJobAgeSeconds: 12,
      activeWorkers: 3,
      status: 'HEALTHY'
    },
    {
      name: 'marketing',
      displayName: 'Marketing & Remarketing',
      depth: 12,
      runningCount: 1,
      processingRatePerMinute: 110,
      oldestJobAgeSeconds: 180,
      activeWorkers: 2,
      status: 'HEALTHY'
    },
    {
      name: 'communications',
      displayName: 'Comunicações & Disparos',
      depth: 0,
      runningCount: 0,
      processingRatePerMinute: 45,
      oldestJobAgeSeconds: 0,
      activeWorkers: 2,
      status: 'HEALTHY'
    },
    {
      name: 'analytics',
      displayName: 'Exportação de Relatórios & BI',
      depth: 1,
      runningCount: 0,
      processingRatePerMinute: 18,
      oldestJobAgeSeconds: 120,
      activeWorkers: 2,
      status: 'HEALTHY'
    },
    {
      name: 'integrations',
      displayName: 'Integrações & ERP Externo',
      depth: 0,
      runningCount: 0,
      processingRatePerMinute: 76,
      oldestJobAgeSeconds: 0,
      activeWorkers: 2,
      status: 'HEALTHY'
    },
    {
      name: 'webhooks',
      displayName: 'Webhooks de Parceiros',
      depth: 2,
      runningCount: 0,
      processingRatePerMinute: 0,
      oldestJobAgeSeconds: 7200,
      activeWorkers: 1,
      status: 'WARNING'
    },
    {
      name: 'documents',
      displayName: 'Auditoria & OCR de Documentos',
      depth: 0,
      runningCount: 0,
      processingRatePerMinute: 30,
      oldestJobAgeSeconds: 0,
      activeWorkers: 1,
      status: 'HEALTHY'
    },
    {
      name: 'maintenance',
      displayName: 'Manutenção & Limpeza Noturna',
      depth: 0,
      runningCount: 0,
      processingRatePerMinute: 5,
      oldestJobAgeSeconds: 0,
      activeWorkers: 1,
      status: 'HEALTHY'
    }
  ]);

  // Initial Mock Workers
  const [workers, setWorkers] = useState<JobWorker[]>([
    {
      id: 'wrk_01',
      name: 'worker-prod-01',
      hostname: 'node-us-east-1a.internal',
      queues: ['critical', 'finance', 'payments'],
      status: 'ACTIVE',
      concurrency: 10,
      activeJobsCount: 1,
      lastHeartbeatAt: new Date(Date.now() - 2000).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      metrics: {
        totalProcessed: 14280,
        totalFailed: 12,
        uptimeSeconds: 172800,
        cpuUsagePercent: 18,
        memoryUsageMb: 245
      }
    },
    {
      id: 'wrk_02',
      name: 'worker-prod-02',
      hostname: 'node-us-east-1b.internal',
      queues: ['critical', 'finance', 'integrations'],
      status: 'ACTIVE',
      concurrency: 10,
      activeJobsCount: 1,
      lastHeartbeatAt: new Date(Date.now() - 1000).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      metrics: {
        totalProcessed: 16120,
        totalFailed: 9,
        uptimeSeconds: 172800,
        cpuUsagePercent: 24,
        memoryUsageMb: 312
      }
    },
    {
      id: 'wrk_03',
      name: 'worker-batch-01',
      hostname: 'node-us-east-1c.internal',
      queues: ['marketing', 'communications', 'analytics'],
      status: 'ACTIVE',
      concurrency: 15,
      activeJobsCount: 1,
      lastHeartbeatAt: new Date(Date.now() - 3000).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      metrics: {
        totalProcessed: 9840,
        totalFailed: 4,
        uptimeSeconds: 86400,
        cpuUsagePercent: 35,
        memoryUsageMb: 420
      }
    },
    {
      id: 'wrk_04',
      name: 'worker-reports-01',
      hostname: 'node-us-east-1d.internal',
      queues: ['analytics', 'integrations', 'documents', 'maintenance'],
      status: 'ACTIVE',
      concurrency: 8,
      activeJobsCount: 0,
      lastHeartbeatAt: new Date(Date.now() - 1000).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      metrics: {
        totalProcessed: 3204,
        totalFailed: 1,
        uptimeSeconds: 43200,
        cpuUsagePercent: 8,
        memoryUsageMb: 190
      }
    }
  ]);

  // Overall Stats
  const stats: ProcessingCenterStats = {
    runningCount: jobs.filter(j => j.status === 'RUNNING').length,
    queuedCount: jobs.filter(j => j.status === 'QUEUED').length,
    scheduledCount: schedules.filter(s => s.active).length,
    completedTodayCount: 2841,
    failedCount: 9,
    deadLetterCount: deadLetters.filter(d => !d.reprocessed).length,
    health: {
      workers: 'HEALTHY',
      queues: deadLetters.length > 5 ? 'WARNING' : 'HEALTHY',
      redis: 'HEALTHY',
      database: 'HEALTHY',
      integrations: 'HEALTHY'
    },
    p95DurationSeconds: 4.2,
    p99DurationSeconds: 12.8,
    avgDurationSeconds: 1.4
  };

  // Scope Filtering
  const filteredJobs = jobs.filter(j => {
    if (isGlobalScope) return true;
    if (activeProducer && j.producerId && j.producerId !== activeProducer.id) return false;
    if (activeEvent && j.eventId && j.eventId !== activeEvent.id) return false;
    return true;
  });

  const filteredBatches = batches.filter(b => {
    if (isGlobalScope) return true;
    if (activeProducer && b.producerId && b.producerId !== activeProducer.id) return false;
    if (activeEvent && b.eventId && b.eventId !== activeEvent.id) return false;
    return true;
  });

  const filteredSchedules = schedules.filter(s => {
    if (isGlobalScope) return true;
    if (activeProducer && s.producerId && s.producerId !== activeProducer.id) return false;
    if (activeEvent && s.eventId && s.eventId !== activeEvent.id) return false;
    return true;
  });

  // Action Handlers
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handlePauseJob = (job: Job) => {
    setJobs(prev =>
      prev.map(j => (j.id === job.id ? { ...j, paused: true, pauseRequested: true } : j))
    );
    showToast(`Job ${job.id} pausado cooperativamente com checkpoint salvo.`);
  };

  const handleResumeJob = (job: Job) => {
    setJobs(prev =>
      prev.map(j => (j.id === job.id ? { ...j, paused: false, pauseRequested: false } : j))
    );
    showToast(`Job ${job.id} retomado do último checkpoint.`);
  };

  const handleCancelJob = (job: Job) => {
    setJobs(prev =>
      prev.map(j => (j.id === job.id ? { ...j, status: 'CANCELLED' as const } : j))
    );
    showToast(`Job ${job.id} cancelado com sucesso.`);
  };

  const handleToggleSchedule = (schedule: JobSchedule) => {
    const updated = !schedule.active;
    setSchedules(prev =>
      prev.map(s => (s.id === schedule.id ? { ...s, active: updated } : s))
    );
    showToast(
      updated
        ? `Agendamento "${schedule.name}" ativado com sucesso.`
        : `Agendamento "${schedule.name}" pausado.`
    );
  };

  const handleRunScheduleNow = (schedule: JobSchedule) => {
    const newJob: Job = {
      id: `job_sch_${Date.now()}`,
      type: schedule.jobType,
      module: schedule.module,
      queue: schedule.queue,
      priority: schedule.priority,
      status: 'QUEUED',
      progress: 0,
      progressData: { percentage: 0, processedItems: 0, totalItems: 1, successItems: 0, failedItems: 0, currentStep: 'Iniciando agendamento sob demanda' },
      payload: schedule.payload,
      result: null,
      error: null,
      producerId: schedule.producerId,
      eventId: schedule.eventId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 0,
      maxAttempts: 3,
      cancellable: true,
      pausable: true,
      correlationId: `corr_manual_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setJobs(prev => [newJob, ...prev]);
    showToast(`Job disparado imediatamente para a fila ${schedule.queue}!`);
  };

  const handleDeleteSchedule = (schedule: JobSchedule) => {
    setSchedules(prev => prev.filter(s => s.id !== schedule.id));
    showToast(`Agendamento "${schedule.name}" removido.`);
  };

  const handleRetryBatchFailures = (batch: JobBatch) => {
    setBatches(prev =>
      prev.map(b =>
        b.id === batch.id
          ? {
              ...b,
              status: 'RUNNING',
              failedItems: 0
            }
          : b
      )
    );
    showToast(`Reprocessando ${batch.failedItems} itens que haviam falhado no lote "${batch.name}".`);
  };

  const handleCancelBatch = (batch: JobBatch) => {
    setBatches(prev =>
      prev.map(b =>
        b.id === batch.id
          ? {
              ...b,
              status: 'CANCELLED',
              pendingItems: 0
            }
          : b
      )
    );
    showToast(`Lote "${batch.name}" cancelado.`);
  };

  const handleInvestigateDeadLetter = (dl: JobDeadLetter) => {
    setDeadLetters(prev =>
      prev.map(d =>
        d.id === dl.id
          ? {
              ...d,
              investigated: true,
              investigatedBy: currentUser.name,
              investigatedAt: new Date().toISOString()
            }
          : d
      )
    );
    showToast(`Dead Letter ${dl.id} marcado como analisado por ${currentUser.name}.`);
  };

  const handleReprocessDeadLetter = (dl: JobDeadLetter) => {
    const reprocessedJobId = `job_retry_${Date.now()}`;
    const newJob: Job = {
      id: reprocessedJobId,
      type: dl.jobType,
      module: dl.module,
      queue: dl.originalQueue,
      priority: 'HIGH',
      status: 'QUEUED',
      progress: 0,
      progressData: { percentage: 0, processedItems: 0, totalItems: 1, successItems: 0, failedItems: 0, currentStep: 'Reprocessado após auditoria' },
      payload: {},
      result: null,
      error: null,
      producerId: null,
      eventId: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      attempts: 0,
      maxAttempts: 3,
      cancellable: true,
      pausable: true,
      correlationId: `corr_reprocess_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setJobs(prev => [newJob, ...prev]);
    setDeadLetters(prev =>
      prev.map(d =>
        d.id === dl.id
          ? {
              ...d,
              reprocessed: true,
              reprocessedJobId,
              reprocessedAt: new Date().toISOString()
            }
          : d
      )
    );
    showToast(`Job re-enfileirado com sucesso como ${reprocessedJobId}!`);
  };

  const handleCreateScheduleSubmit = (data: any) => {
    const newSch: JobSchedule = {
      id: `sch_${Date.now()}`,
      name: data.name,
      description: data.description,
      jobType: data.jobType,
      module: data.module,
      queue: data.queue,
      priority: data.priority,
      frequency: data.frequency,
      cronExpression: data.cronExpression,
      timeOfDay: data.timeOfDay,
      timezone: data.timezone,
      misfirePolicy: data.misfirePolicy,
      payload: data.payload,
      active: true,
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      producerId: activeProducer?.id || null,
      eventId: activeEvent?.id || null,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSchedules(prev => [newSch, ...prev]);
    setIsNewScheduleModalOpen(false);
    showToast(`Agendamento "${data.name}" criado com sucesso!`);
    setActiveTab('schedules');
  };

  const handleCreateBatchSubmit = (data: {
    name: string;
    module: JobModule;
    itemsCount: number;
    jobType: string;
    priority: JobPriority;
  }) => {
    const newBatch: JobBatch = {
      id: `batch_${Date.now()}`,
      name: data.name,
      module: data.module,
      totalItems: data.itemsCount,
      completedItems: 0,
      failedItems: 0,
      pendingItems: data.itemsCount,
      progressPercent: 0,
      status: 'QUEUED',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      producerId: activeProducer?.id || null,
      eventId: activeEvent?.id || null,
      correlationId: `corr_batch_${Date.now()}`,
      createdAt: new Date().toISOString(),
      childJobs: []
    };

    setBatches(prev => [newBatch, ...prev]);
    setIsNewBatchModalOpen(false);
    showToast(`Lote "${data.name}" com ${data.itemsCount} operações enfileirado!`);
    setActiveTab('batches');
  };

  const handleRestartWorker = (workerId: string) => {
    showToast(`Sinal de recarga limpa (graceful restart) enviado para o worker ${workerId}.`);
  };

  const handleFilterQueue = (queue: JobQueue) => {
    setActiveTab('queued');
  };

  return (
    <div className="min-h-full space-y-6 p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-400">
              FASE 1.1.5.14
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs font-medium text-slate-400">Orquestração & Processamento em Lote</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Central de Jobs & Processamento Assíncrono
          </h1>
          <p className="text-xs text-slate-400">
            Workers distribuídos, filas de concorrência, rotinas agendadas com timezone, idempotência e recuperação Dead Letter.
          </p>
        </div>

        {/* Current Scope Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs">
          <Building className="h-4 w-4 text-orange-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Escopo Operacional</div>
            <div className="font-semibold text-white">
              {isGlobalScope ? 'Global (Disk Ingressos)' : activeProducer?.name || 'Produtor Específico'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Visão Geral', icon: <Layers className="h-4 w-4" /> },
          { id: 'running', label: 'Em Execução', icon: <Activity className="h-4 w-4 text-orange-400" />, count: stats.runningCount },
          { id: 'queued', label: 'Na Fila', icon: <Clock className="h-4 w-4 text-cyan-400" />, count: stats.queuedCount },
          { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="h-4 w-4 text-purple-400" />, count: filteredSchedules.length },
          { id: 'batches', label: 'Lotes Operacionais', icon: <Layers className="h-4 w-4 text-blue-400" />, count: filteredBatches.length },
          { id: 'completed', label: 'Histórico & Concluídos', icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
          { id: 'dead_letter', label: 'Dead Letter', icon: <AlertTriangle className="h-4 w-4 text-rose-400" />, count: stats.deadLetterCount, highlight: stats.deadLetterCount > 0 },
          { id: 'queues', label: 'Filas Lógicas', icon: <Server className="h-4 w-4 text-indigo-400" />, count: queues.length },
          { id: 'workers', label: 'Cluster de Workers', icon: <Cpu className="h-4 w-4 text-amber-400" />, count: workers.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as ProcessingTab);
              if (onNavigate) {
                onNavigate('jobs', `jobs-${tab.id.replace('_', '-')}`);
              }
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            } ${tab.highlight ? 'ring-1 ring-rose-500/50' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.highlight
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            runningJobs={filteredJobs.filter(j => j.status === 'RUNNING')}
            recentBatches={filteredBatches}
            onOpenNewBatch={() => setIsNewBatchModalOpen(true)}
            onOpenNewSchedule={() => setIsNewScheduleModalOpen(true)}
            onSelectJob={handleSelectJob}
          />
        )}

        {activeTab === 'running' && (
          <RunningJobsTab
            jobs={filteredJobs}
            onSelectJob={handleSelectJob}
            onPauseJob={handlePauseJob}
            onCancelJob={handleCancelJob}
          />
        )}

        {activeTab === 'queued' && (
          <QueuedJobsTab
            jobs={filteredJobs}
            onSelectJob={handleSelectJob}
            onCancelJob={handleCancelJob}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesTab
            schedules={filteredSchedules}
            onOpenNewSchedule={() => setIsNewScheduleModalOpen(true)}
            onRunNow={handleRunScheduleNow}
            onToggleActive={handleToggleSchedule}
            onDelete={handleDeleteSchedule}
          />
        )}

        {activeTab === 'batches' && (
          <BatchesTab
            batches={filteredBatches}
            onOpenNewBatch={() => setIsNewBatchModalOpen(true)}
            onRetryFailures={handleRetryBatchFailures}
            onCancelBatch={handleCancelBatch}
          />
        )}

        {activeTab === 'completed' && (
          <CompletedJobsTab
            jobs={filteredJobs}
            onSelectJob={handleSelectJob}
          />
        )}

        {activeTab === 'dead_letter' && (
          <DeadLetterTab
            deadLetters={deadLetters}
            onInvestigate={handleInvestigateDeadLetter}
            onReprocess={handleReprocessDeadLetter}
            onViewJob={jobId => {
              const job = jobs.find(j => j.id === jobId);
              if (job) handleSelectJob(job);
            }}
          />
        )}

        {activeTab === 'queues' && (
          <QueuesTab
            metrics={queues}
            onRefresh={() => showToast('Métricas de filas atualizadas!')}
            onFilterQueue={handleFilterQueue}
          />
        )}

        {activeTab === 'workers' && (
          <WorkersTab
            workers={workers}
            onRefresh={() => showToast('Status do cluster de workers atualizado!')}
            onRestartWorker={handleRestartWorker}
          />
        )}
      </div>

      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          job={selectedJob}
          onPause={handlePauseJob}
          onResume={handleResumeJob}
          onCancel={handleCancelJob}
        />
      )}

      <NewScheduleModal
        isOpen={isNewScheduleModalOpen}
        onClose={() => setIsNewScheduleModalOpen(false)}
        registeredJobs={registeredJobsCatalog}
        onSave={handleCreateScheduleSubmit}
      />

      <NewBatchModal
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        onSubmit={handleCreateBatchSubmit}
      />
    </div>
  );
};
