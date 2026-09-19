import { prisma } from '../../core/database/prisma';
import { TraceContext } from './trace-context';
import {
  OperationTraceRecord,
  TraceSpanRecord,
  StartTraceParams,
  StartSpanParams,
  EndSpanParams,
  TraceStatus,
  SpanStatus
} from './trace.types';

export class TracingService {
  /**
   * Inicia o rastreamento de uma operação completa
   */
  public async startTrace(params: StartTraceParams): Promise<OperationTraceRecord> {
    const correlationId = params.correlationId || TraceContext.getCorrelationId();

    // Verifica se o trace já existe para esse correlationId (idempotência)
    const existing = await prisma.operationTrace.findUnique({
      where: { correlationId }
    });
    if (existing) {
      return this.mapToTraceRecord(existing);
    }

    const trace = await prisma.operationTrace.create({
      data: {
        correlationId,
        operationName: params.operationName,
        rootResourceType: params.rootResourceType || null,
        rootResourceId: params.rootResourceId || null,
        userId: params.userId || null,
        userName: params.userName || null,
        producerId: params.producerId || null,
        eventId: params.eventId || null,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        policyKey: params.policyKey || null,
        policyVersion: params.policyVersion || null,
        policyDecision: params.policyDecision ? JSON.stringify(params.policyDecision) : null,
        policyExplanation: params.policyExplanation || null,
        approvalRequestId: params.approvalRequestId || null,
        taskId: params.taskId || null
      }
    });

    return this.mapToTraceRecord(trace);
  }

  /**
   * Finaliza o rastreamento de uma operação completa calculando a duração total
   */
  public async endTrace(
    correlationId: string,
    status: TraceStatus = 'COMPLETED',
    errorMessage?: string
  ): Promise<OperationTraceRecord> {
    const trace = await prisma.operationTrace.findUnique({
      where: { correlationId }
    });
    if (!trace) {
      throw new Error(`Trace com correlationId ${correlationId} não encontrado.`);
    }

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - new Date(trace.startedAt).getTime();

    const updated = await prisma.operationTrace.update({
      where: { correlationId },
      data: {
        status,
        endedAt,
        durationMs,
        errorMessage: errorMessage || null
      }
    });

    return this.mapToTraceRecord(updated);
  }

  /**
   * Inicia um span dentro de uma operação
   */
  public async startSpan(params: StartSpanParams): Promise<TraceSpanRecord> {
    const trace = await prisma.operationTrace.findUnique({
      where: { correlationId: params.correlationId }
    });

    const spanId = params.spanId || `SPAN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const span = await prisma.traceSpan.create({
      data: {
        traceId: trace?.id || params.correlationId,
        correlationId: params.correlationId,
        spanId,
        parentSpanId: params.parentSpanId || null,
        serviceName: params.serviceName,
        operation: params.operation,
        status: 'SUCCESS',
        startedAt: new Date(),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }
    });

    return this.mapToSpanRecord(span);
  }

  /**
   * Finaliza um span registrando status, latência e eventuais erros
   */
  public async endSpan(params: EndSpanParams): Promise<TraceSpanRecord> {
    const span = await prisma.traceSpan.findUnique({
      where: { id: params.spanId }
    }) || await prisma.traceSpan.findFirst({
      where: { spanId: params.spanId }
    });

    if (!span) {
      throw new Error(`Span ${params.spanId} não encontrado.`);
    }

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - new Date(span.startedAt).getTime();

    const updated = await prisma.traceSpan.update({
      where: { id: span.id },
      data: {
        status: params.status,
        endedAt,
        durationMs,
        errorMessage: params.errorMessage || null,
        errorCode: params.errorCode || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : span.metadata
      }
    });

    return this.mapToSpanRecord(updated);
  }

  /**
   * Obtém o trace completo pelo Correlation ID
   */
  public async getTraceByCorrelationId(correlationId: string): Promise<OperationTraceRecord | null> {
    const trace = await prisma.operationTrace.findUnique({
      where: { correlationId },
      include: { spans: true }
    });
    return trace ? this.mapToTraceRecord(trace) : null;
  }

  /**
   * Lista traces com filtros
   */
  public async listTraces(filters?: {
    status?: TraceStatus;
    producerId?: string;
    eventId?: string;
    userId?: string;
    rootResourceType?: string;
    search?: string;
    limit?: number;
  }): Promise<OperationTraceRecord[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.producerId) where.producerId = filters.producerId;
    if (filters?.eventId) where.eventId = filters.eventId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.rootResourceType) where.rootResourceType = filters.rootResourceType;

    let items: any[] = await prisma.operationTrace.findMany({
      where,
      take: filters?.limit || 50,
      include: { spans: true }
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(t =>
        (t.correlationId && t.correlationId.toLowerCase().includes(q)) ||
        (t.operationName && t.operationName.toLowerCase().includes(q)) ||
        (t.rootResourceId && t.rootResourceId.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q))
      );
    }

    return items.map(t => this.mapToTraceRecord(t));
  }

  /**
   * Associa dados de política ao trace da operação ("Por que isso aconteceu?")
   */
  public async linkPolicyToTrace(
    correlationId: string,
    policy: { key: string; version: number; decision: any; explanation?: string }
  ): Promise<void> {
    await prisma.operationTrace.update({
      where: { correlationId },
      data: {
        policyKey: policy.key,
        policyVersion: policy.version,
        policyDecision: JSON.stringify(policy.decision),
        policyExplanation: policy.explanation || null
      }
    });
  }

  /**
   * Associa solicitação de aprovação ao trace
   */
  public async linkApprovalToTrace(correlationId: string, approvalRequestId: string): Promise<void> {
    await prisma.operationTrace.update({
      where: { correlationId },
      data: { approvalRequestId }
    });
  }

  /**
   * Associa tarefa operacional gerada ao trace
   */
  public async linkTaskToTrace(correlationId: string, taskId: string): Promise<void> {
    await prisma.operationTrace.update({
      where: { correlationId },
      data: { taskId }
    });
  }

  /**
   * Busca timeline de uma operação por entidade de recurso
   */
  public async getTimelineByResource(
    resourceType: string,
    resourceId: string
  ): Promise<OperationTraceRecord[]> {
    const items = await prisma.operationTrace.findMany({
      where: {
        rootResourceType: resourceType,
        rootResourceId: resourceId
      },
      include: { spans: true }
    });

    return items.map(t => this.mapToTraceRecord(t));
  }

  private mapToTraceRecord(t: any): OperationTraceRecord {
    let policyDecisionParsed: any = null;
    if (t.policyDecision) {
      try {
        policyDecisionParsed = typeof t.policyDecision === 'string' ? JSON.parse(t.policyDecision) : t.policyDecision;
      } catch {
        policyDecisionParsed = t.policyDecision;
      }
    }

    return {
      id: t.id,
      correlationId: t.correlationId,
      operationName: t.operationName,
      rootResourceType: t.rootResourceType || null,
      rootResourceId: t.rootResourceId || null,
      userId: t.userId || null,
      userName: t.userName || null,
      producerId: t.producerId || null,
      eventId: t.eventId || null,
      status: t.status,
      startedAt: t.startedAt instanceof Date ? t.startedAt.toISOString() : t.startedAt,
      endedAt: t.endedAt ? (t.endedAt instanceof Date ? t.endedAt.toISOString() : t.endedAt) : null,
      durationMs: t.durationMs || null,
      policyKey: t.policyKey || null,
      policyVersion: t.policyVersion || null,
      policyDecision: policyDecisionParsed,
      policyExplanation: t.policyExplanation || null,
      approvalRequestId: t.approvalRequestId || null,
      taskId: t.taskId || null,
      errorMessage: t.errorMessage || null,
      spans: (t.spans || []).map((s: any) => this.mapToSpanRecord(s))
    };
  }

  private mapToSpanRecord(s: any): TraceSpanRecord {
    let meta: any = null;
    if (s.metadata) {
      try {
        meta = typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata;
      } catch {
        meta = s.metadata;
      }
    }

    return {
      id: s.id,
      traceId: s.traceId,
      correlationId: s.correlationId,
      spanId: s.spanId,
      parentSpanId: s.parentSpanId || null,
      serviceName: s.serviceName,
      operation: s.operation,
      status: s.status,
      startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
      endedAt: s.endedAt ? (s.endedAt instanceof Date ? s.endedAt.toISOString() : s.endedAt) : null,
      durationMs: s.durationMs || null,
      metadata: meta,
      errorMessage: s.errorMessage || null,
      errorCode: s.errorCode || null
    };
  }
}
