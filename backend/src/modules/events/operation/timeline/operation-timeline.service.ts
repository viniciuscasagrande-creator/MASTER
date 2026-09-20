import { OperationTimelineEventDTO } from '@shared/types/index';

interface StoredTimelineEvent extends OperationTimelineEventDTO {
  operationId: string;
}

export class OperationTimelineService {
  private static events: StoredTimelineEvent[] = [];
  private static sequenceCounters: Record<string, number> = {};

  public static getNextSequence(operationId: string): number {
    if (!this.sequenceCounters[operationId]) {
      this.sequenceCounters[operationId] = 0;
    }
    this.sequenceCounters[operationId] += 1;
    return this.sequenceCounters[operationId];
  }

  public static getLatestSequence(operationId: string): number {
    return this.sequenceCounters[operationId] || 0;
  }

  public static addEvent(params: {
    operationId: string;
    category: 'COMMAND' | 'INCIDENT' | 'CHECKIN' | 'ACCESS' | 'SYSTEM' | 'BROADCAST';
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    title: string;
    description: string;
    actorName?: string;
    metadata?: Record<string, any>;
  }): OperationTimelineEventDTO {
    const sequence = this.getNextSequence(params.operationId);
    const event: StoredTimelineEvent = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      operationId: params.operationId,
      sequence,
      timestamp: new Date().toISOString(),
      category: params.category,
      severity: params.severity,
      title: params.title,
      description: params.description,
      actorName: params.actorName,
      metadata: params.metadata
    };

    this.events.unshift(event); // most recent first
    return { ...event };
  }

  public static getTimeline(operationId: string, limit = 50, afterSequence?: number): OperationTimelineEventDTO[] {
    let list = this.events.filter(e => e.operationId === operationId);
    if (afterSequence !== undefined) {
      list = list.filter(e => e.sequence > afterSequence);
    }
    return list.slice(0, limit).map(e => ({
      id: e.id,
      sequence: e.sequence,
      timestamp: e.timestamp,
      category: e.category,
      severity: e.severity,
      title: e.title,
      description: e.description,
      actorName: e.actorName,
      metadata: e.metadata
    }));
  }

  public static clearAll(): void {
    this.events = [];
    this.sequenceCounters = {};
  }
}
