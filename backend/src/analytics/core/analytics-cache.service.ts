import crypto from 'crypto';
import { AnalyticsQuery, AnalyticsResult } from '@shared/types/index';

export class AnalyticsCacheService {
  private cache: Map<string, { result: AnalyticsResult; expiresAt: number; domainTags: string[] }> = new Map();
  private hitCount: number = 0;
  private missCount: number = 0;
  private defaultTtlMs: number = 5 * 60 * 1000; // 5 minutos padrão

  public generateCacheKey(query: AnalyticsQuery, userContext?: { roleSlug?: string; scopeType?: string }): string {
    const raw = JSON.stringify({
      metrics: query.metrics.slice().sort(),
      dimensions: query.dimensions ? query.dimensions.slice().sort() : [],
      filters: query.filters || [],
      period: query.period,
      producerId: query.producerId || 'all',
      eventId: query.eventId || 'all',
      limit: query.limit || 100,
      offset: query.offset || 0,
      role: userContext?.roleSlug || 'default'
    });

    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get(key: string): AnalyticsResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return {
      ...entry.result,
      cached: true
    };
  }

  public set(key: string, result: AnalyticsResult, domainTags: string[] = ['all'], ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    this.cache.set(key, {
      result,
      expiresAt,
      domainTags
    });
  }

  // Invalidate cache by event type (Section 1.1.5.13.57)
  public invalidateOnEvent(eventType: string): number {
    let invalidatedCount = 0;
    const now = Date.now();

    // Map business events to affected analytical domains
    const domainMap: Record<string, string[]> = {
      'ORDER_PAID': ['COMERCIAL', 'EVENTOS', 'FINANCEIRO'],
      'ORDER_CREATED': ['COMERCIAL'],
      'PAYMENT_CONFIRMED': ['COMERCIAL', 'FINANCEIRO'],
      'REFUND_COMPLETED': ['ESTORNO', 'FINANCEIRO', 'COMERCIAL'],
      'TRANSFER_EXECUTED': ['FINANCEIRO', 'CONTABILIDADE'],
      'CHECKIN_VALIDATED': ['EVENTOS'],
      'MARKETING_CAMPAIGN_SYNCED': ['MARKETING', 'REMARKETING']
    };

    const targetDomains = domainMap[eventType] || ['all'];

    for (const [key, val] of this.cache.entries()) {
      const hasIntersection = val.domainTags.some(d => targetDomains.includes(d) || d === 'all');
      if (hasIntersection) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  public clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  public getStats(): { hits: number; misses: number; hitRatio: number; size: number } {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRatio: total > 0 ? (this.hitCount / total) * 100 : 0,
      size: this.cache.size
    };
  }
}
