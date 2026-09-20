import { Job, JobQueue } from '@shared/types/index';
import { JobRepository } from '../core/job.repository';
import { JobRegistry } from '../core/job.registry';
import { QueueService } from '../queue/queue.service';
import { DefaultJobContext } from '../core/job-context';
import { RetryService } from '../execution/retry.service';
import { WorkerRegistry } from './worker.registry';
import { EventBus } from '../../events/event-bus';

export class WorkerService {
  public readonly workerId: string;
  public readonly name: string;
  public readonly queues: JobQueue[];
  public readonly concurrency: number;

  private repository: JobRepository;
  private registry: JobRegistry;
  private queueService: QueueService;
  private retryService: RetryService;
  private workerRegistry: WorkerRegistry;
  private isRunning: boolean = false;
  private activeJobs: Set<string> = new Set();

  constructor(
    workerId: string,
    name: string,
    queues: JobQueue[],
    concurrency: number = 5,
    repository?: JobRepository,
    registry?: JobRegistry,
    queueService?: QueueService,
    retryService?: RetryService,
    workerRegistry?: WorkerRegistry
  ) {
    this.workerId = workerId;
    this.name = name;
    this.queues = queues;
    this.concurrency = concurrency;

    this.repository = repository || new JobRepository();
    this.registry = registry || JobRegistry.getInstance();
    this.queueService = queueService || QueueService.getInstance();
    this.retryService = retryService || new RetryService(this.repository);
    this.workerRegistry = workerRegistry || WorkerRegistry.getInstance();
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.workerRegistry.register({
      id: this.workerId,
      name: this.name,
      hostname: 'worker-local',
      queues: this.queues,
      status: 'IDLE',
      concurrency: this.concurrency,
      activeJobsCount: 0,
      lastHeartbeatAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      metrics: {
        totalProcessed: 0,
        totalFailed: 0,
        uptimeSeconds: 0
      }
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.workerRegistry.setStatus(this.workerId, 'OFFLINE');
  }

  public async processOne(): Promise<Job | null> {
    if (this.activeJobs.size >= this.concurrency) {
      return null; // Concurrency limit reached
    }

    const job = await this.queueService.dequeue(this.queues);
    if (!job) return null;

    this.activeJobs.add(job.id);
    this.workerRegistry.incrementActiveJobs(this.workerId);

    try {
      await this.executeJob(job);
      this.workerRegistry.decrementActiveJobs(this.workerId, true);
    } catch (error) {
      this.workerRegistry.decrementActiveJobs(this.workerId, false);
    } finally {
      this.activeJobs.delete(job.id);
      (this.queueService.getProvider() as any)?.markCompleted?.(job.queue, job.id);
    }

    return job;
  }

  public async executeJob(job: Job): Promise<any> {
    const entry = this.registry.get(job.type);
    if (!entry) {
      const err = new Error(`Tipo de Job não registrado no catálogo: ${job.type}`);
      await this.retryService.handleFailure(job, err);
      throw err;
    }

    const attemptNumber = job.attempts + 1;
    const attemptId = `att_${job.id}_${attemptNumber}`;

    // Record attempt
    await this.repository.createAttempt({
      id: attemptId,
      jobId: job.id,
      attemptNumber,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      workerId: this.workerId
    });

    // Mark Job as RUNNING
    const updatedJob = await this.repository.update(job.id, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      attempts: attemptNumber
    });

    try {
      await EventBus.publish({
        id: `evt_job_start_${job.id}_${Date.now()}`,
        type: 'JOB_STARTED',
        resourceType: 'JOB',
        resourceId: job.id,
        producerId: job.producerId || undefined,
        eventId: job.eventId || undefined,
        actorUserId: job.createdBy,
        data: { jobId: job.id, type: job.type, workerId: this.workerId, attemptNumber },
        timestamp: new Date()
      });
    } catch {}

    const ctx = new DefaultJobContext(updatedJob, this.repository);

    try {
      // Execute Handler
      const result = await entry.handler(job.payload, ctx);

      // Check if paused during execution
      if (result && result.paused === true) {
        await this.repository.update(job.id, {
          status: 'WAITING',
          paused: true,
          pauseRequested: false
        });
        return result;
      }

      // Mark COMPLETED
      await this.repository.update(job.id, {
        status: 'COMPLETED',
        progress: 100,
        result,
        finishedAt: new Date().toISOString()
      });

      try {
        await EventBus.publish({
          id: `evt_job_done_${job.id}_${Date.now()}`,
          type: 'JOB_COMPLETED',
          resourceType: 'JOB',
          resourceId: job.id,
          producerId: job.producerId || undefined,
          eventId: job.eventId || undefined,
          actorUserId: job.createdBy,
          data: { jobId: job.id, type: job.type, result },
          timestamp: new Date()
        });
      } catch {}

      return result;
    } catch (error: any) {
      // Check if this was cooperative cancellation
      const freshJob = await this.repository.findById(job.id);
      if (freshJob?.cancelRequested) {
        await this.repository.update(job.id, {
          status: 'CANCELLED',
          finishedAt: new Date().toISOString(),
          error: { message: 'Processamento cancelado cooperativamente pelo usuário' }
        });
        return;
      }

      // Handle Failure & Retry / Dead Letter
      await this.retryService.handleFailure(job, error, entry);
      throw error;
    }
  }

  public getActiveJobsCount(): number {
    return this.activeJobs.size;
  }
}
