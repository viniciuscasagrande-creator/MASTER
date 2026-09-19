import { prisma } from '../../core/database/prisma';
import { AuditLogRecord, AuditDiffField, LogActionParams, AuditFilterParams } from './audit.types';
import { AuditSanitizerService } from './audit-sanitizer.service';
import crypto from 'crypto';

export class AuditRepository {
  /**
   * Registra uma ação na trilha de auditoria protegida
   */
  public async create(params: LogActionParams): Promise<AuditLogRecord> {
    const sanitizedBefore = params.beforeData !== undefined ? AuditSanitizerService.sanitize(params.beforeData) : null;
    const sanitizedAfter = params.afterData !== undefined ? AuditSanitizerService.sanitize(params.afterData) : null;

    let ipHash: string | null = null;
    if (params.ipAddress) {
      ipHash = crypto.createHash('sha256').update(params.ipAddress).digest('hex').substring(0, 16);
    }

    const created = await prisma.auditLog.create({
      data: {
        correlationId: params.correlationId || null,
        requestId: params.requestId || null,
        sessionId: params.sessionId || null,
        userId: params.userId || null,
        userName: params.userName || null,
        module: params.module,
        action: params.action,
        resource: params.resource || params.resourceType || 'SYSTEM',
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        producerId: params.producerId || null,
        eventId: params.eventId || null,
        beforeData: sanitizedBefore ? (typeof sanitizedBefore === 'object' ? JSON.stringify(sanitizedBefore) : sanitizedBefore) : null,
        afterData: sanitizedAfter ? (typeof sanitizedAfter === 'object' ? JSON.stringify(sanitizedAfter) : sanitizedAfter) : null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
        ipHash: ipHash,
        userAgent: params.userAgent || null,
        result: params.result || 'SUCCESS'
      }
    });

    return this.mapToRecord(created);
  }

  /**
   * Busca registros com suporte a filtros e isolamento de escopo
   */
  public async findMany(filters: AuditFilterParams): Promise<{ items: AuditLogRecord[]; total: number }> {
    const where: any = {};

    if (filters.correlationId) where.correlationId = filters.correlationId;
    if (filters.requestId) where.requestId = filters.requestId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.producerId) where.producerId = filters.producerId;
    if (filters.eventId) where.eventId = filters.eventId;
    if (filters.result) where.result = filters.result;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    let records: any[] = await prisma.auditLog.findMany({
      where,
      take: filters.limit || 50
    });

    if (filters.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(r =>
        (r.action && r.action.toLowerCase().includes(q)) ||
        (r.resource && r.resource.toLowerCase().includes(q)) ||
        (r.module && r.module.toLowerCase().includes(q)) ||
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.correlationId && r.correlationId.toLowerCase().includes(q)) ||
        (r.details && r.details.toLowerCase().includes(q))
      );
    }

    const total = await prisma.auditLog.count ? await prisma.auditLog.count({ where }) : records.length;

    return {
      items: records.map(r => this.mapToRecord(r)),
      total
    };
  }

  /**
   * Busca registro de auditoria por ID
   */
  public async findById(id: string): Promise<AuditLogRecord | null> {
    const record = await prisma.auditLog.findUnique({
      where: { id }
    });
    return record ? this.mapToRecord(record) : null;
  }

  /**
   * Extrai apenas os campos que sofreram alteração entre Before e After
   */
  public extractDiff(beforeData: any, afterData: any): AuditDiffField[] {
    if (!beforeData && !afterData) return [];

    const beforeObj = typeof beforeData === 'string' ? this.tryParseJson(beforeData) : (beforeData || {});
    const afterObj = typeof afterData === 'string' ? this.tryParseJson(afterData) : (afterData || {});

    const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    const diffs: AuditDiffField[] = [];

    for (const key of allKeys) {
      const oldVal = beforeObj[key];
      const newVal = afterObj[key];

      const oldJson = JSON.stringify(oldVal);
      const newJson = JSON.stringify(newVal);

      if (oldJson !== newJson) {
        diffs.push({
          field: key,
          oldValue: oldVal !== undefined ? oldVal : null,
          newValue: newVal !== undefined ? newVal : null
        });
      }
    }

    return diffs;
  }

  private tryParseJson(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return { raw: data };
    }
  }

  private mapToRecord(r: any): AuditLogRecord {
    return {
      id: r.id,
      correlationId: r.correlationId || null,
      requestId: r.requestId || null,
      sessionId: r.sessionId || null,
      userId: r.userId || null,
      userName: r.userName || null,
      module: r.module || 'SYSTEM',
      action: r.action,
      resourceType: r.resourceType || r.resource || null,
      resourceId: r.resourceId || null,
      producerId: r.producerId || null,
      eventId: r.eventId || null,
      beforeData: typeof r.beforeData === 'string' ? this.tryParseJson(r.beforeData) : (r.beforeData || null),
      afterData: typeof r.afterData === 'string' ? this.tryParseJson(r.afterData) : (r.afterData || null),
      result: r.result || 'SUCCESS',
      ipHash: r.ipHash || null,
      ipAddress: r.ipAddress || null,
      userAgent: r.userAgent || null,
      details: r.details || null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt || new Date().toISOString())
    };
  }
}
