export class DistributedLockService {
  private static instance: DistributedLockService;
  private locks: Map<string, { owner: string; acquiredAt: number; ttlMs: number }> = new Map();

  public static getInstance(): DistributedLockService {
    if (!DistributedLockService.instance) {
      DistributedLockService.instance = new DistributedLockService();
    }
    return DistributedLockService.instance;
  }

  public async acquireLock(
    resourceKey: string,
    ownerId: string,
    ttlMs: number = 30000
  ): Promise<boolean> {
    const existing = this.locks.get(resourceKey);
    const now = Date.now();

    if (existing) {
      if (now - existing.acquiredAt < existing.ttlMs) {
        // Lock currently held and not expired
        return false;
      }
    }

    this.locks.set(resourceKey, {
      owner: ownerId,
      acquiredAt: now,
      ttlMs
    });
    return true;
  }

  public async releaseLock(resourceKey: string, ownerId: string): Promise<boolean> {
    const existing = this.locks.get(resourceKey);
    if (!existing) return true;

    if (existing.owner === ownerId) {
      this.locks.delete(resourceKey);
      return true;
    }
    return false;
  }

  public isLocked(resourceKey: string): boolean {
    const existing = this.locks.get(resourceKey);
    if (!existing) return false;
    return Date.now() - existing.acquiredAt < existing.ttlMs;
  }
}
