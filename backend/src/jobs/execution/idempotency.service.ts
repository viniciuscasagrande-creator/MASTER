import { JobRepository } from '../core/job.repository';
import { Job } from '@shared/types/index';

export class IdempotencyService {
  private repository: JobRepository;
  private activeLocks: Map<string, { jobId: string; acquiredAt: number }> = new Map();
  private readonly lockTtlMs: number = 300000; // 5 minutes lock TTL

  constructor(repository: JobRepository) {
    this.repository = repository;
  }

  public async checkIdempotency(key: string): Promise<{ isDuplicate: boolean; existingJob?: Job | null }> {
    if (!key) return { isDuplicate: false };

    // 1. Check active in-memory locks
    const active = this.activeLocks.get(key);
    if (active && Date.now() - active.acquiredAt < this.lockTtlMs) {
      const existing = await this.repository.findById(active.jobId);
      return { isDuplicate: true, existingJob: existing };
    }

    // 2. Check repository database for jobs with this key
    const existing = await this.repository.findByIdempotencyKey(key);
    if (existing && existing.status !== 'FAILED' && existing.status !== 'CANCELLED') {
      return { isDuplicate: true, existingJob: existing };
    }

    return { isDuplicate: false };
  }

  public acquireLock(key: string, jobId: string): boolean {
    if (!key) return true;
    const active = this.activeLocks.get(key);
    if (active && Date.now() - active.acquiredAt < this.lockTtlMs) {
      return false; // Lock already held
    }
    this.activeLocks.set(key, { jobId, acquiredAt: Date.now() });
    return true;
  }

  public releaseLock(key: string): void {
    if (key) {
      this.activeLocks.delete(key);
    }
  }
}
