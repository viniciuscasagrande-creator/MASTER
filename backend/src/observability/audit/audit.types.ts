import { AuditLogRecord, AuditDiffField, AuditExportParams } from '../../../../shared/types/index';

export type { AuditLogRecord, AuditDiffField, AuditExportParams };

export interface LogActionParams {
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
  module: string;
  action: string;
  resource?: string;
  resourceType?: string;
  resourceId?: string;
  producerId?: string;
  eventId?: string;
  beforeData?: any;
  afterData?: any;
  result?: 'SUCCESS' | 'DENIED' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface AuditFilterParams {
  correlationId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  producerId?: string;
  eventId?: string;
  result?: 'SUCCESS' | 'DENIED' | 'FAILED';
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  limit?: number;
  offset?: number;
}
