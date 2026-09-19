interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export class ConfigurationCacheService {
  private static cache: Map<string, CacheEntry> = new Map();
  private static hits = 0;
  private static misses = 0;

  private static buildKey(key: string, scopeType?: string, scopeId?: string | null): string {
    return `${key}:${scopeType || 'ALL'}:${scopeId || 'ROOT'}`;
  }

  public static get<T = any>(key: string, scopeType?: string, scopeId?: string | null): T | null {
    const cacheKey = this.buildKey(key, scopeType, scopeId);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  public static set<T = any>(
    key: string,
    scopeType: string | undefined,
    scopeId: string | null | undefined,
    value: T,
    ttlSeconds = 300
  ): void {
    const cacheKey = this.buildKey(key, scopeType, scopeId);
    this.cache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public static invalidate(key?: string, scopeType?: string, scopeId?: string | null): void {
    if (!key) {
      this.cache.clear();
      return;
    }

    if (!scopeType && !scopeId) {
      // Invalidate all entries for this key
      for (const k of this.cache.keys()) {
        if (k.startsWith(`${key}:`)) {
          this.cache.delete(k);
        }
      }
    } else {
      const cacheKey = this.buildKey(key, scopeType, scopeId);
      this.cache.delete(cacheKey);
    }
  }

  public static invalidateAll(): void {
    this.cache.clear();
  }

  public static clear(): void {
    this.cache.clear();
  }

  public static getStats(): { size: number; hits: number; misses: number; ratio: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      ratio: total > 0 ? Number((this.hits / total).toFixed(3)) : 0
    };
  }
}
