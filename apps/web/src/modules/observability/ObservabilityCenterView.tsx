import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ShieldCheck,
  Clock,
  Radio,
  AlertTriangle,
  Zap,
  Layers,
  Cpu,
  ShieldAlert,
  HeartPulse,
  Search,
  RefreshCw,
  Hash,
  Download,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Building,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { ErrorBoundary } from './components/ErrorBoundary';

// View Tabs
import { OverviewTab } from './views/OverviewTab';
import { AuditTab } from './views/AuditTab';
import { TracesTab } from './views/TracesTab';
import { EventsTab } from './views/EventsTab';
import { ErrorsTab } from './views/ErrorsTab';
import { PerformanceTab } from './views/PerformanceTab';
import { QueuesWorkersTab } from './views/QueuesWorkersTab';
import { IntegrationsTab } from './views/IntegrationsTab';
import { SecurityTab } from './views/SecurityTab';
import { SystemHealthTab } from './views/SystemHealthTab';

import {
  ObservabilityTab,
  AuditLogRecord,
  OperationTraceRecord,
  BusinessEventRecord,
  OutboxEventRecord,
  InboxWebhookRecord,
  ErrorGroupRecord,
  ComponentHealthRecord,
  SystemAlertRecord,
  ObservabilityOverviewStats,
  SlowRouteMetric,
  SlowQueryMetric,
  QueueMonitorItem,
  WorkerMonitorItem,
  IntegrationStatusItem,
  SecurityEventItem,
  LiveEventHealthItem
} from './observability.types';

interface ObservabilityCenterViewProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const ObservabilityCenterView: React.FC<ObservabilityCenterViewProps> = ({
  initialSubItem,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { apiFetch, activeProducer, activeEvent } = useDiskContext();

  // Tab mapping
  const resolveTabFromSubItem = (sub?: string): ObservabilityTab => {
    switch (sub) {
      case 'obs-overview':
        return 'overview';
      case 'obs-audit':
        return 'audit';
      case 'obs-traces':
        return 'traces';
      case 'obs-events':
        return 'events';
      case 'obs-errors':
        return 'errors';
      case 'obs-performance':
        return 'performance';
      case 'obs-queues':
        return 'queues';
      case 'obs-integrations':
        return 'integrations';
      case 'obs-security':
        return 'security';
      case 'obs-health':
        return 'health';
      default:
        return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState<ObservabilityTab>(resolveTabFromSubItem(initialSubItem));
  const [quickCorrelationId, setQuickCorrelationId] = useState('');
  const [targetTraceCorrelationId, setTargetTraceCorrelationId] = useState<string | undefined>();
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 15 = 15s, 30 = 30s
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(resolveTabFromSubItem(initialSubItem));
    }
  }, [initialSubItem]);

  // ============================================================================
  // REALISTIC INITIAL & FALLBACK DATASETS
  // ============================================================================
  const [stats, setStats] = useState<ObservabilityOverviewStats>({
    systemStatus: 'OPERATIONAL',
    requestsTotal15m: 14820,
    successRate: 99.82,
    errorRate: 0.18,
    latencyP50: 24,
    latencyP95: 108,
    latencyP99: 312,
    pendingJobs: 42,
    failedJobs: 0,
    activeAlerts: 1,
    unresolvedErrors: 2,
    componentHealth: [
      { id: 'c1', component: 'API', status: 'OPERATIONAL', latencyMs: 12, checkedAt: new Date().toISOString() },
      { id: 'c2', component: 'POSTGRESQL', status: 'OPERATIONAL', latencyMs: 18, checkedAt: new Date().toISOString() },
      { id: 'c3', component: 'REDIS', status: 'OPERATIONAL', latencyMs: 2, checkedAt: new Date().toISOString() },
      { id: 'c4', component: 'QUEUES', status: 'OPERATIONAL', latencyMs: 5, checkedAt: new Date().toISOString() },
      { id: 'c5', component: 'WORKERS', status: 'OPERATIONAL', latencyMs: 4, checkedAt: new Date().toISOString() },
      { id: 'c6', component: 'WEBSOCKET', status: 'OPERATIONAL', latencyMs: 8, checkedAt: new Date().toISOString() },
      { id: 'c7', component: 'INTEGRATIONS', status: 'DEGRADED', latencyMs: 820, message: 'Oscilação detectada no adquirente Cielo', checkedAt: new Date().toISOString() }
    ],
    modulesHealth: [
      { module: 'finance', name: 'Financeiro & Repasses', status: 'NORMAL', latencyP95: 85, errorRate: 0.05, activeJobs: 6 },
      { module: 'events', name: 'Eventos & Bilheteria', status: 'NORMAL', latencyP95: 45, errorRate: 0.02, activeJobs: 14 },
      { module: 'refunds', name: 'Estornos & Chargeback', status: 'NORMAL', latencyP95: 110, errorRate: 0.12, activeJobs: 3 },
      { module: 'tasks', name: 'Tarefas & Workflows', status: 'NORMAL', latencyP95: 35, errorRate: 0.01, activeJobs: 8 },
      { module: 'configuration', name: 'Regras & Políticas', status: 'NORMAL', latencyP95: 12, errorRate: 0.00, activeJobs: 0 }
    ]
  });

  const [alerts, setAlerts] = useState<SystemAlertRecord[]>([
    {
      id: 'alt-001',
      alertCode: 'ALT-GATEWAY-LATENCY',
      title: 'Elevada latência de autorização no Gateway Cielo (P95 > 800ms)',
      severity: 'WARNING',
      component: 'INTEGRATIONS',
      occurrencesCount: 38,
      deduplicationKey: 'INTEGRATIONS:Cielo:Latency',
      status: 'ACTIVE',
      firstTriggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      thresholdRule: 'p95_latency > 500ms durante 5 minutos contínuos'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([
    {
      id: 'aud-001',
      correlationId: 'COR-20260919-482910',
      requestId: 'REQ-1082491',
      userId: 'usr-admin-master',
      userName: 'Administrador Geral',
      module: 'CONFIGURACOES',
      action: 'POLICY_UPDATE',
      resourceType: 'POLICY',
      resourceId: 'POL-TRANSFER-01',
      result: 'SUCCESS',
      ipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      beforeData: { minimumBalance: 5000, approvalCount: 1, active: true },
      afterData: { minimumBalance: 8000, approvalCount: 2, active: true },
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'aud-002',
      correlationId: 'COR-20260919-819203',
      requestId: 'REQ-8829102',
      userId: 'usr-prod-opus',
      userName: 'Roberto Viana (Opus)',
      module: 'FINANCEIRO',
      action: 'TRANSFER_REQUEST',
      resourceType: 'TRANSFER',
      resourceId: 'TRF-90214',
      producerId: 'prod-1',
      eventId: 'evt-101',
      result: 'SUCCESS',
      ipHash: 'b5a2c9b149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a10928f',
      beforeData: null,
      afterData: { amount: 25000, destinationBank: '033 - Santander', pixKey: '12345678000199' },
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    },
    {
      id: 'aud-003',
      correlationId: 'COR-20260919-110293',
      requestId: 'REQ-3991023',
      userId: 'usr-sac-ana',
      userName: 'Ana Paula Santos',
      module: 'ESTORNO',
      action: 'REFUND_APPROVE',
      resourceType: 'REFUND',
      resourceId: 'REF-2026-004',
      result: 'SUCCESS',
      ipHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      beforeData: { status: 'PENDING_ANALYSIS', reason: 'Arrependimento CDC' },
      afterData: { status: 'APPROVED', amount: 350.00, refundMethod: 'PIX_REVERSAL' },
      createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString()
    },
    {
      id: 'aud-004',
      correlationId: 'COR-20260919-772911',
      requestId: 'REQ-4481029',
      userId: 'usr-prod-opus',
      userName: 'Roberto Viana',
      module: 'SEGURANCA',
      action: 'ADMIN_ACCESS_ATTEMPT',
      resourceType: 'MODULE',
      resourceId: 'admin.perfis',
      result: 'DENIED',
      ipHash: 'b5a2c9b149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a10928f',
      beforeData: null,
      afterData: { reason: 'Perfil produtor não possui permissão admin.perfis.visualizar' },
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    }
  ]);

  const [traces, setTraces] = useState<OperationTraceRecord[]>([
    {
      id: 'trc-001',
      correlationId: 'COR-20260919-482910',
      operationName: 'policy.evaluate.transfer_limit',
      rootResourceType: 'TRANSFER',
      rootResourceId: 'TRF-90214',
      userId: 'usr-prod-opus',
      userName: 'Roberto Viana',
      producerId: 'prod-1',
      eventId: 'evt-101',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      durationMs: 46,
      policyKey: 'finance.transfer.approval_threshold',
      policyVersion: 2,
      policyExplanation: 'A transferência de R$ 25.000,00 excedeu a alçada única de R$ 10.000,00 e requer 2 assinaturas da diretoria conforme política ativa do Produtor Opus.',
      approvalRequestId: 'APR-2026-081',
      taskId: 'TSK-20260919-001',
      spans: [
        {
          id: 'sp-1',
          traceId: 'trc-001',
          correlationId: 'COR-20260919-482910',
          spanId: 'sp-101',
          serviceName: 'gateway-api',
          operation: 'POST /api/finance/transfer',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          durationMs: 12
        },
        {
          id: 'sp-2',
          traceId: 'trc-001',
          correlationId: 'COR-20260919-482910',
          spanId: 'sp-102',
          parentSpanId: 'sp-101',
          serviceName: 'policy-engine',
          operation: 'evaluateRules(finance.transfer.approval_threshold)',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 15 * 60 * 1000 + 12).toISOString(),
          durationMs: 14,
          metadata: { policyResult: 'REQUIRES_DOUBLE_APPROVAL', threshold: 10000, transferAmount: 25000 }
        },
        {
          id: 'sp-3',
          traceId: 'trc-001',
          correlationId: 'COR-20260919-482910',
          spanId: 'sp-103',
          parentSpanId: 'sp-101',
          serviceName: 'approval-service',
          operation: 'createApprovalRequest(APR-2026-081)',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 15 * 60 * 1000 + 26).toISOString(),
          durationMs: 11
        },
        {
          id: 'sp-4',
          traceId: 'trc-001',
          correlationId: 'COR-20260919-482910',
          spanId: 'sp-104',
          parentSpanId: 'sp-101',
          serviceName: 'task-service',
          operation: 'createTask(TSK-20260919-001)',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 15 * 60 * 1000 + 37).toISOString(),
          durationMs: 9
        }
      ]
    },
    {
      id: 'trc-002',
      correlationId: 'COR-20260919-918234',
      operationName: 'checkout.pix.process',
      rootResourceType: 'ORDER',
      rootResourceId: 'ORD-98214',
      userId: 'usr-cliente-812',
      userName: 'Carlos Silva',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      durationMs: 88,
      spans: [
        {
          id: 'sp-21',
          traceId: 'trc-002',
          correlationId: 'COR-20260919-918234',
          spanId: 'sp-201',
          serviceName: 'gateway-api',
          operation: 'POST /api/orders/checkout/pix',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          durationMs: 18
        },
        {
          id: 'sp-22',
          traceId: 'trc-002',
          correlationId: 'COR-20260919-918234',
          spanId: 'sp-202',
          parentSpanId: 'sp-201',
          serviceName: 'pix-adapter',
          operation: 'generateDynamicQrCode()',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 25 * 60 * 1000 + 18).toISOString(),
          durationMs: 42
        },
        {
          id: 'sp-23',
          traceId: 'trc-002',
          correlationId: 'COR-20260919-918234',
          spanId: 'sp-203',
          parentSpanId: 'sp-201',
          serviceName: 'outbox-worker',
          operation: 'appendOutbox(order.created)',
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 25 * 60 * 1000 + 60).toISOString(),
          durationMs: 28
        }
      ]
    }
  ]);

  const [businessEvents, setBusinessEvents] = useState<BusinessEventRecord[]>([
    {
      id: 'bev-001',
      eventType: 'order.payment_confirmed',
      correlationId: 'COR-20260919-918234',
      requestId: 'REQ-19284',
      sourceService: 'payment-service',
      payload: { orderId: 'ORD-98214', amount: 320.00, method: 'PIX', installments: 1 },
      consumers: [
        { service: 'tickets-service', status: 'COMPLETED', processedAt: new Date().toISOString() },
        { service: 'marketing-capi', status: 'COMPLETED', processedAt: new Date().toISOString() },
        { service: 'notification-email', status: 'COMPLETED', processedAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    },
    {
      id: 'bev-002',
      eventType: 'policy.rule_triggered',
      correlationId: 'COR-20260919-482910',
      sourceService: 'policy-engine',
      payload: { policyKey: 'finance.transfer.approval_threshold', action: 'BLOCK_AND_REQUEST_APPROVAL' },
      consumers: [
        { service: 'task-service', status: 'COMPLETED', processedAt: new Date().toISOString() },
        { service: 'audit-service', status: 'COMPLETED', processedAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ]);

  const [outboxEvents, setOutboxEvents] = useState<OutboxEventRecord[]>([
    {
      id: 'obx-001',
      eventId: 'evt-obx-1',
      eventType: 'order.payment_confirmed',
      correlationId: 'COR-20260919-918234',
      payload: { orderId: 'ORD-98214', amount: 320.00 },
      status: 'PROCESSED',
      retryCount: 0,
      processedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'obx-002',
      eventId: 'evt-obx-2',
      eventType: 'ticket.qr_generated',
      correlationId: 'COR-20260919-918234',
      payload: { ticketId: 'TCK-88192', eventId: 'evt-101' },
      status: 'PROCESSED',
      retryCount: 0,
      processedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    }
  ]);

  const [inboxWebhooks, setInboxWebhooks] = useState<InboxWebhookRecord[]>([
    {
      id: 'ibx-001',
      source: 'Cielo PIX API',
      externalEventId: 'cielo-pix-982184912',
      eventType: 'pix.payment.received',
      correlationId: 'COR-20260919-918234',
      signatureValid: true,
      isIdempotent: true,
      payload: { txid: 'TX1029384756', endToEndId: 'E0000000020260919001', value: '320.00' },
      status: 'PROCESSED',
      processedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    }
  ]);

  const [errorGroups, setErrorGroups] = useState<ErrorGroupRecord[]>([
    {
      id: 'errgrp-001',
      fingerprint: '3b819f02e88a8d11928374a2b9192834c8d19283a',
      errorCode: 'ERR-PAY-003',
      title: 'Tempo Limite de Comunicação com Provedor PIX',
      service: 'payment-gateway',
      operation: 'authorizeTransaction',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      firstSeenAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      lastSeenAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      occurrencesCount: 14,
      affectedEventsCount: 2,
      affectedUsersCount: 11,
      relatedTaskId: 'TSK-20260919-002',
      occurrences: [
        {
          id: 'occ-1',
          errorGroupId: 'errgrp-001',
          correlationId: 'COR-20260919-991204',
          userId: 'usr-cliente-491',
          errorMessage: 'GatewayTimeoutException: Remote peer closed connection after 5000ms',
          userFriendlyMessage: 'Não foi possível confirmar seu pagamento com a operadora bancária. Por favor, tente novamente.',
          stackTrace: 'Error: GatewayTimeoutException\n  at CieloPixAdapter.authorize (/dist/adapters/cielo.js:142:19)\n  at processTicksAndRejections (node:internal/process/task_queues:95:5)\n  at async PaymentService.charge (/dist/services/payment.js:88:24)',
          createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'errgrp-002',
      fingerprint: '88a19283c77192834b9192834d8192834e8192835',
      errorCode: 'ERR-AUTH-004',
      title: 'Token de Sessão Expirado Durante Submissão de Formulário',
      service: 'auth-service',
      operation: 'validateJwtToken',
      severity: 'LOW',
      status: 'RESOLVED',
      firstSeenAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      lastSeenAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      occurrencesCount: 4,
      affectedEventsCount: 0,
      affectedUsersCount: 4,
      occurrences: []
    }
  ]);

  const [slowestRoutes] = useState<SlowRouteMetric[]>([
    { path: '/api/finance/reconciliation/run', method: 'POST', avgDurationMs: 412, p99DurationMs: 1240, callCount: 38, errorRate: 0.0, lastSlowCall: new Date().toISOString() },
    { path: '/api/orders/checkout/credit-card', method: 'POST', avgDurationMs: 198, p99DurationMs: 840, callCount: 4210, errorRate: 0.14, lastSlowCall: new Date().toISOString() },
    { path: '/api/reports/sales/export-csv', method: 'GET', avgDurationMs: 290, p99DurationMs: 980, callCount: 142, errorRate: 0.0, lastSlowCall: new Date().toISOString() }
  ]);

  const [slowQueries] = useState<SlowQueryMetric[]>([
    {
      queryPattern: 'SELECT * FROM tickets WHERE event_id = $1 AND status = $2 ORDER BY created_at DESC',
      durationMs: 184,
      database: 'disk_production',
      occurredAt: new Date().toISOString(),
      rowsAffected: 1420,
      recommendation: 'Criar índice composto: CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);'
    }
  ]);

  const [queues] = useState<QueueMonitorItem[]>([
    { id: 'q1', name: 'webhook-delivery', activeCount: 8, waitingCount: 12, delayedCount: 0, failedCount: 0, throughputPerMin: 180, status: 'HEALTHY', lastProcessedAt: new Date().toISOString() },
    { id: 'q2', name: 'notifications-email', activeCount: 4, waitingCount: 22, delayedCount: 0, failedCount: 0, throughputPerMin: 90, status: 'HEALTHY', lastProcessedAt: new Date().toISOString() },
    { id: 'q3', name: 'notifications-whatsapp', activeCount: 2, waitingCount: 4, delayedCount: 0, failedCount: 0, throughputPerMin: 60, status: 'HEALTHY', lastProcessedAt: new Date().toISOString() },
    { id: 'q4', name: 'marketing-capi-sync', activeCount: 5, waitingCount: 40, delayedCount: 2, failedCount: 0, throughputPerMin: 220, status: 'HEALTHY', lastProcessedAt: new Date().toISOString() },
    { id: 'q5', name: 'finance-reconciliation', activeCount: 1, waitingCount: 0, delayedCount: 0, failedCount: 0, throughputPerMin: 5, status: 'HEALTHY', lastProcessedAt: new Date().toISOString() }
  ]);

  const [workers] = useState<WorkerMonitorItem[]>([
    { id: 'w1', name: 'Worker Nó A-01', hostname: 'node-worker-br-east-1a', status: 'BUSY', cpuUsagePercent: 34, memoryUsageMb: 240, activeJob: 'webhook-delivery #19204', processedCount: 14200, uptimeSeconds: 148200 },
    { id: 'w2', name: 'Worker Nó A-02', hostname: 'node-worker-br-east-1b', status: 'BUSY', cpuUsagePercent: 42, memoryUsageMb: 310, activeJob: 'marketing-capi-sync #8812', processedCount: 18400, uptimeSeconds: 148200 },
    { id: 'w3', name: 'Worker Nó B-01 (Heavy)', hostname: 'node-worker-br-east-2a', status: 'IDLE', cpuUsagePercent: 12, memoryUsageMb: 180, activeJob: null, processedCount: 4200, uptimeSeconds: 98200 }
  ]);

  const [integrations] = useState<IntegrationStatusItem[]>([
    { id: 'int-1', name: 'Gateway PIX & Cartão', category: 'PAYMENT', provider: 'Cielo Ecommerce 3.0', status: 'DEGRADED', uptime90d: 99.82, latencyAvgMs: 380, successRate: 98.4, lastCheckedAt: new Date().toISOString(), endpoint: 'api.cielo.com.br/v2/sales' },
    { id: 'int-2', name: 'Adquirente Backup', category: 'PAYMENT', provider: 'Pagar.me V5 (Stone)', status: 'OPERATIONAL', uptime90d: 99.98, latencyAvgMs: 140, successRate: 99.9, lastCheckedAt: new Date().toISOString(), endpoint: 'api.pagar.me/core/v5' },
    { id: 'int-3', name: 'Conciliação Bancária', category: 'BANK', provider: 'Banco Itaú API Pix/TED', status: 'OPERATIONAL', uptime90d: 99.92, latencyAvgMs: 190, successRate: 99.8, lastCheckedAt: new Date().toISOString(), endpoint: 'itau.com.br/api/v2/pix' },
    { id: 'int-4', name: 'Meta Conversions API', category: 'MARKETING', provider: 'Meta Ads Graph API v20', status: 'OPERATIONAL', uptime90d: 99.99, latencyAvgMs: 110, successRate: 100.0, lastCheckedAt: new Date().toISOString(), endpoint: 'graph.facebook.com/v20.0' },
    { id: 'int-5', name: 'Disparo WhatsApp', category: 'MESSAGING', provider: 'Z-API Cloud Provider', status: 'OPERATIONAL', uptime90d: 99.88, latencyAvgMs: 85, successRate: 99.7, lastCheckedAt: new Date().toISOString(), endpoint: 'api.z-api.io/instances' }
  ]);

  const [securityEvents] = useState<SecurityEventItem[]>([
    {
      id: 'sec-001',
      type: 'ACCESS_DENIED',
      userId: 'usr-prod-opus',
      userEmail: 'roberto@opusentretenimento.com.br',
      ipHash: 'b5a2c9b149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a10928f',
      reason: 'Violação de permissão: tentativa de acesso ao endpoint restrito admin.perfis',
      occurredAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      severity: 'MEDIUM'
    },
    {
      id: 'sec-002',
      type: 'LOGIN_FAILURE',
      userEmail: 'financeiro.externo@unknown.com',
      ipHash: '7a19284cb9128374829103847291038472910384729103847291038472910384',
      reason: 'Senha incorreta por 3 vezes consecutivas na mesma janela de 10 minutos',
      occurredAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      severity: 'HIGH'
    }
  ]);

  const [liveEvents] = useState<LiveEventHealthItem[]>([
    {
      eventId: 'evt-101',
      eventName: 'Festival de Verão Curitiba 2026',
      producerName: 'Opus Entretenimento',
      status: 'NORMAL',
      attendeesCheckedIn: 18450,
      totalCapacity: 25000,
      checkinsPerMinute: 312,
      avgGateLatencyMs: 24,
      offlineGatesCount: 0,
      openIncidentsCount: 1,
      salesPerMinute: 18,
      lastUpdated: new Date().toISOString()
    },
    {
      eventId: 'evt-102',
      eventName: 'Rock Symphony Live 2026',
      producerName: 'Live Nation Brasil',
      status: 'NORMAL',
      attendeesCheckedIn: 8200,
      totalCapacity: 12000,
      checkinsPerMinute: 145,
      avgGateLatencyMs: 18,
      offlineGatesCount: 0,
      openIncidentsCount: 0,
      salesPerMinute: 6,
      lastUpdated: new Date().toISOString()
    }
  ]);

  // ============================================================================
  // ASYNC DATA FETCHING FROM BACKEND (WITH SEAMLESS FALLBACK)
  // ============================================================================
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Overview metrics
      const ovRes = await apiFetch('/observability/overview').catch(() => null);
      if (ovRes && ovRes.ok) {
        const json = await ovRes.json();
        if (json.success && json.data) setStats(json.data);
      }

      // 2. Audit logs
      const audRes = await apiFetch('/audit/logs?limit=50').catch(() => null);
      if (audRes && audRes.ok) {
        const json = await audRes.json();
        if (json.success && json.data) setAuditLogs(json.data);
      }

      // 3. Traces
      const trcRes = await apiFetch('/operations/traces?limit=30').catch(() => null);
      if (trcRes && trcRes.ok) {
        const json = await trcRes.json();
        if (json.success && json.data) setTraces(json.data);
      }

      // 4. Alerts
      const altRes = await apiFetch('/observability/alerts').catch(() => null);
      if (altRes && altRes.ok) {
        const json = await altRes.json();
        if (json.success && json.data) setAlerts(json.data);
      }

      // 5. Errors
      const errRes = await apiFetch('/observability/errors').catch(() => null);
      if (errRes && errRes.ok) {
        const json = await errRes.json();
        if (json.success && json.data) setErrorGroups(json.data);
      }
    } catch (err) {
      // Fallback kept intact gracefully
      console.warn('Observability API unreachable, using realistic offline mock state.', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchAllData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchAllData]);

  // Actions
  const handleResolveAlert = async (alertId: string) => {
    try {
      await apiFetch(`/observability/alerts/${alertId}/resolve`, { method: 'POST' }).catch(() => null);
    } catch {
      // ignore
    }
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleResolveErrorGroup = async (groupId: string) => {
    try {
      await apiFetch(`/observability/errors/${groupId}/resolve`, { method: 'POST' }).catch(() => null);
    } catch {
      // ignore
    }
    setErrorGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, status: 'RESOLVED' as const } : g))
    );
  };

  const handleExportAudit = async (format: 'CSV' | 'JSON', filters: any) => {
    setIsExporting(true);
    try {
      const res = await apiFetch('/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, ...filters })
      }).catch(() => null);

      if (res && res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_disk_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // Mock fallback export
        const exportContent =
          format === 'JSON'
            ? JSON.stringify(auditLogs, null, 2)
            : 'id,correlationId,userId,userName,module,action,result,createdAt\n' +
              auditLogs
                .map(l => `${l.id},${l.correlationId || ''},${l.userId || ''},"${l.userName || ''}",${l.module},${l.action},${l.result},${l.createdAt}`)
                .join('\n');

        const blob = new Blob([exportContent], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_disk_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterByCorrelationId = (correlationId: string) => {
    setTargetTraceCorrelationId(correlationId);
    setActiveTab('traces');
  };

  const handleQuickCorrelationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCorrelationId.trim()) return;
    setTargetTraceCorrelationId(quickCorrelationId.trim());
    setActiveTab('traces');
  };

  // Tabs definition
  const TABS: Array<{ id: ObservabilityTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Visão Geral & Métricas', icon: <Activity className="h-4 w-4" /> },
    { id: 'audit', label: 'Auditoria de Negócio', icon: <ShieldCheck className="h-4 w-4 text-orange-400" />, badge: auditLogs.length },
    { id: 'traces', label: 'Rastreabilidade & Traces', icon: <Clock className="h-4 w-4 text-cyan-400" />, badge: traces.length },
    { id: 'events', label: 'Eventos & Outbox', icon: <Radio className="h-4 w-4 text-purple-400" /> },
    { id: 'errors', label: 'Central de Falhas', icon: <AlertTriangle className="h-4 w-4 text-rose-400" />, badge: errorGroups.filter(g => g.status !== 'RESOLVED').length },
    { id: 'performance', label: 'Performance & Latência', icon: <Zap className="h-4 w-4 text-emerald-400" /> },
    { id: 'queues', label: 'Filas & Workers', icon: <Layers className="h-4 w-4 text-indigo-400" /> },
    { id: 'integrations', label: 'Integrações Externas', icon: <Cpu className="h-4 w-4 text-cyan-400" /> },
    { id: 'security', label: 'Segurança & Tentativas', icon: <ShieldAlert className="h-4 w-4 text-rose-400" /> },
    { id: 'health', label: 'Saúde & Eventos ao Vivo', icon: <HeartPulse className="h-4 w-4 text-emerald-400" />, badge: alerts.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Correlation Search */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Central de Auditoria, Observabilidade e Rastreabilidade
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Separação estrita dos 4 pilares: <strong className="text-slate-200">Auditoria</strong> (quem fez o quê) · <strong className="text-slate-200">Log Técnico</strong> (registro de software) · <strong className="text-slate-200">Métrica</strong> (comportamento agregado) · <strong className="text-slate-200">Rastreabilidade</strong> (caminho completo da operação).
            </p>
          </div>

          {/* Quick Correlation Search Input */}
          <form onSubmit={handleQuickCorrelationSearch} className="flex items-center gap-2">
            <div className="relative min-w-[260px]">
              <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-500" />
              <input
                type="text"
                placeholder="Rastrear COR-..."
                value={quickCorrelationId}
                onChange={e => setQuickCorrelationId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs font-mono text-cyan-300 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="h-8 text-xs">
              Rastrear
            </Button>
          </form>
        </div>

        {/* Toolbar: Scope & Auto-Refresh */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building className="h-3.5 w-3.5 text-orange-400" />
              <span>Produtor:</span>
              <strong className="text-slate-200">{activeProducer?.name || 'Todos (Global)'}</strong>
            </div>

            {activeEvent && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Evento:</span>
                <strong className="text-slate-200">{activeEvent.name}</strong>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Atualização:</span>
              <select
                value={autoRefreshInterval}
                onChange={e => setAutoRefreshInterval(Number(e.target.value))}
                className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value={0}>Manual</option>
                <option value={15}>A cada 15s</option>
                <option value={30}>A cada 30s</option>
                <option value={60}>A cada 60s</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              isLoading={isLoading}
              className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* 10 Navigation Tabs */}
      <div className="overflow-x-auto border-b border-slate-800">
        <nav className="flex space-x-1 whitespace-nowrap pb-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (onNavigate) {
                    onNavigate('observability', `obs-${tab.id}`);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md shadow-slate-900/50 border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tab Workspace with ErrorBoundary */}
      <ErrorBoundary fallbackTitle="Falha temporária ao carregar a visualização de observabilidade">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            alerts={alerts}
            onNavigateTab={tab => setActiveTab(tab as ObservabilityTab)}
            onResolveAlert={handleResolveAlert}
            onRefresh={fetchAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab
            logs={auditLogs}
            onExport={handleExportAudit}
            onFilterByCorrelationId={handleFilterByCorrelationId}
            isExporting={isExporting}
          />
        )}

        {activeTab === 'traces' && (
          <TracesTab
            traces={traces}
            initialCorrelationId={targetTraceCorrelationId}
            onNavigateToTask={taskId => onNavigate && onNavigate('tasks', 'tasks-all')}
            onNavigateToApproval={appId => onNavigate && onNavigate('approvals', 'approvals-inbox')}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            businessEvents={businessEvents}
            outboxEvents={outboxEvents}
            inboxWebhooks={inboxWebhooks}
            onRefresh={fetchAllData}
            onFilterByCorrelationId={handleFilterByCorrelationId}
          />
        )}

        {activeTab === 'errors' && (
          <ErrorsTab
            errorGroups={errorGroups}
            onResolveGroup={handleResolveErrorGroup}
            onNavigateToTask={taskId => onNavigate && onNavigate('tasks', 'tasks-all')}
            onFilterByCorrelationId={handleFilterByCorrelationId}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceTab
            percentiles={{ p50: stats.latencyP50, p95: stats.latencyP95, p99: stats.latencyP99 }}
            slowestRoutes={slowestRoutes}
            database={{
              activeConnections: 24,
              maxConnections: 100,
              cacheHitRatio: 99.4,
              slowQueries
            }}
            redis={{
              memoryUsedMb: 148,
              maxMemoryMb: 512,
              hitRate: 98.2,
              connectedClients: 36,
              evictedKeys: 0
            }}
            onRefresh={fetchAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'queues' && (
          <QueuesWorkersTab
            queues={queues}
            workers={workers}
            onRefresh={fetchAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsTab
            integrations={integrations}
            onRefresh={fetchAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            events={securityEvents}
            onNavigateToAudit={userId => {
              setActiveTab('audit');
            }}
            onRefresh={fetchAllData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'health' && (
          <SystemHealthTab
            components={stats.componentHealth}
            liveEvents={liveEvents}
            alerts={alerts}
            onRefresh={fetchAllData}
            onResolveAlert={handleResolveAlert}
            isLoading={isLoading}
          />
        )}
      </ErrorBoundary>
    </div>
  );
};
