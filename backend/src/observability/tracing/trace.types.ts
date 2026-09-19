import { OperationTraceRecord, TraceSpanRecord, TraceStatus, SpanStatus } from '../../../../shared/types/index';

export type { OperationTraceRecord, TraceSpanRecord, TraceStatus, SpanStatus };

export interface RequestContextData {
  correlationId: string;
  requestId: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
  producerId?: string;
  eventId?: string;
  module?: string;
  operation?: string;
  startTime: number;
}

export interface StartTraceParams {
  correlationId?: string;
  operationName: string;
  rootResourceType?: string;
  rootResourceId?: string;
  userId?: string;
  userName?: string;
  producerId?: string;
  eventId?: string;
  policyKey?: string;
  policyVersion?: number;
  policyDecision?: any;
  policyExplanation?: string;
  approvalRequestId?: string;
  taskId?: string;
}

export interface StartSpanParams {
  correlationId: string;
  spanId?: string;
  parentSpanId?: string;
  serviceName: string;
  operation: string;
  metadata?: Record<string, any>;
}

export interface EndSpanParams {
  spanId: string;
  status: SpanStatus;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}
