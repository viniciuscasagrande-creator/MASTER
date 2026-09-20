import { Job } from '@shared/types/index';
import { JobRepository } from '../core/job.repository';
import { JobRegistry } from '../core/job.registry';
import { RetryService } from '../execution/retry.service';
import { QueueService } from '../queue/queue.service';
import { EventBus } from '../../events/event-bus';

export class RecoveryService {
  private repository: JobRepository;
  private registry: JobRegistry;
  private retryService: RetryService;
  private queueService: QueueService;

  constructor(
    repository: JobRepository,
    registry?: JobRegistry,
    retryService?: RetryService,
    queueService?: QueueService
  ) {
    this.repository = repository;
    this.registry = registry || JobRegistry.getInstance();
    this.retryService = retryService || new RetryService(repository);
    this.queueService = queueService || QueueService.getInstance();
  }

  public async detectStalledJobs(): Promise<Job[]> {
    const runningJobs = await this.repository.findMany({ status: 'RUNNING' });
    const stalled: Job[] = [];
    const now = Date.now();

    for (const job of runningJobs) {
      if (!job.startedAt) continue;
      const started = new Date(job.startedAt).getTime();
      const entry = this.registry.get(job.type);
      const timeoutMs = (entry ? entry.timeoutSeconds : 600) * 1000;

      // Allow 20% grace period before declaring stalled
      if (now - started > timeoutMs * 1.2) {
        stalled.push(job);
      }
    }

    return stalled;
  }

  public async recoverStalledJob(jobId: string): Promise<{ recovered: boolean; action: 'RETRY' | 'DEAD_LETTER' }> {
    const job = await this.repository.findById(jobId);
    if (!job || job.status !== 'RUNNING') {
      return { recovered: false, action: 'DEAD_LETTER' };
    }

    const entry = this.registry.get(job.type);
    const error = new Error(`Job travado detectado por timeout de execução (${job.type})`);

    const result = await this.retryService.handleFailure(job, error, entry);

    if (result.action === 'RETRY') {
      await this.queueService.enqueue({
        ...job,
        status: 'QUEUED',
        attempts: job.attempts + 1
      });
      return { recovered: true, action: 'RETRY' };
    }

    return { recovered: true, action: 'DEAD_LETTER' };
  }

  public async recoverDeadWorkerJobs(workerId: string): Promise<number> {
    const runningJobs = await this.repository.findMany({ status: 'RUNNING' });
    let recoveredCount = 0;

    for (const job of runningJobs) {
      const attempts = await this.repository.findAttempts(job.id);
      const lastAttempt = attempts[attempts.length - 1];
      if (lastAttempt && lastAttempt.workerId === workerId) {
        await this.recoverStalledJob(job.id);
        recoveredCount++;
      }
    }

    return recoveredCount;
  }
}
