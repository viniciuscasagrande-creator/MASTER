import {
  AuditLogRecord,
  AuditDiffField,
  BusinessEventRecord,
  TraceSpanRecord,
  OperationTraceRecord,
  ErrorOccurrenceRecord,
  ErrorGroupRecord,
  ComponentHealthRecord,
  SystemAlertRecord,
  MetricSnapshotRecord,
  OutboxEventRecord,
  InboxWebhookRecord,
  ModuleHealthStatus,
  ObservabilityOverviewStats,
  AuditExportParams,
  ObservabilityStatus,
  ObservabilitySeverity,
  TraceStatus,
  SpanStatus,
  ErrorGroupStatus,
  SystemAlertStatus,
  LogLevel
} from '@shared/types/index';

export type {
  AuditLogRecord,
  AuditDiffField,
  BusinessEventRecord,
  TraceSpanRecord,
  OperationTraceRecord,
  ErrorOccurrenceRecord,
  ErrorGroupRecord,
  ComponentHealthRecord,
  SystemAlertRecord,
  MetricSnapshotRecord,
  OutboxEventRecord,
  InboxWebhookRecord,
  ModuleHealthStatus,
  ObservabilityOverviewStats,
  AuditExportParams,
  ObservabilityStatus,
  ObservabilitySeverity,
  TraceStatus,
  SpanStatus,
  ErrorGroupStatus,
  SystemAlertStatus,
  LogLevel
};

export type ObservabilityTab =
  | 'overview'
  | 'audit'
  | 'traces'
  | 'events'
  | 'errors'
  | 'performance'
  | 'queues'
  | 'integrations'
  | 'security'
  | 'health';

export interface SlowRouteMetric {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  avgDurationMs: number;
  p99DurationMs: number;
  callCount: number;
  errorRate: number;
  lastSlowCall: string;
}

export interface SlowQueryMetric {
  queryPattern: string;
  durationMs: number;
  occurredAt: string;
  database: string;
  rowsAffected?: number;
  recommendation?: string;
}

export interface QueueMonitorItem {
  id: string;
  name: string;
  activeCount: number;
  waitingCount: number;
  delayedCount: number;
  failedCount: number;
  throughputPerMin: number;
  status: 'HEALTHY' | 'DEGRADED' | 'STALLED';
  lastProcessedAt: string;
}

export interface WorkerMonitorItem {
  id: string;
  name: string;
  hostname: string;
  status: 'BUSY' | 'IDLE' | 'PAUSED' | 'OFFLINE';
  cpuUsagePercent: number;
  memoryUsageMb: number;
  activeJob?: string | null;
  processedCount: number;
  uptimeSeconds: number;
}

export interface IntegrationStatusItem {
  id: string;
  name: string;
  category: 'PAYMENT' | 'BANK' | 'MARKETING' | 'MESSAGING' | 'FRAUD';
  provider: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  uptime90d: number;
  latencyAvgMs: number;
  successRate: number;
  lastCheckedAt: string;
  endpoint: string;
}

export interface SecurityEventItem {
  id: string;
  type: 'LOGIN_FAILURE' | 'BLOCKED_ACCOUNT' | '2FA_FAILURE' | 'RATE_LIMIT' | 'ACCESS_DENIED';
  userId?: string | null;
  userEmail?: string | null;
  ipHash: string;
  ipMasked?: string;
  reason: string;
  occurredAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userAgent?: string;
}

export interface LiveEventHealthItem {
  eventId: string;
  eventName: string;
  producerName: string;
  status: 'NORMAL' | 'ALERT' | 'CRITICAL';
  attendeesCheckedIn: number;
  totalCapacity: number;
  checkinsPerMinute: number;
  avgGateLatencyMs: number;
  offlineGatesCount: number;
  openIncidentsCount: number;
  salesPerMinute: number;
  lastUpdated: string;
}
