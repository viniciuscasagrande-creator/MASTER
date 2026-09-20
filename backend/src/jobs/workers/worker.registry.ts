import { JobWorker, JobQueue, WorkerStatus } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class WorkerRegistry {
  private static instance: WorkerRegistry;
  private workers: Map<string, JobWorker> = new Map();

  private constructor() {
    this.registerDefaultWorkers();
  }

  public static getInstance(): WorkerRegistry {
    if (!WorkerRegistry.instance) {
      WorkerRegistry.instance = new WorkerRegistry();
    }
    return WorkerRegistry.instance;
  }

  public register(worker: JobWorker): void {
    this.workers.set(worker.id, worker);
    // Persist or update in database
    prisma.jobWorkerModel.create({
      data: {
        id: worker.id,
        name: worker.name,
        hostname: worker.hostname,
        queues: JSON.stringify(worker.queues),
        status: worker.status,
        concurrency: worker.concurrency,
        activeJobsCount: worker.activeJobsCount,
        lastHeartbeatAt: new Date(worker.lastHeartbeatAt),
        startedAt: new Date(worker.startedAt),
        metrics: JSON.stringify(worker.metrics)
      }
    }).catch(() => {});
  }

  public get(id: string): JobWorker | undefined {
    return this.workers.get(id);
  }

  public list(): JobWorker[] {
    return Array.from(this.workers.values());
  }

  public updateHeartbeat(workerId: string, metrics?: Partial<JobWorker['metrics']>): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.lastHeartbeatAt = new Date().toISOString();
      if (metrics) {
        worker.metrics = { ...worker.metrics, ...metrics };
      }
      prisma.jobWorkerModel.update({
        where: { id: workerId },
        data: {
          lastHeartbeatAt: new Date(),
          metrics: JSON.stringify(worker.metrics)
        }
      }).catch(() => {});
    }
  }

  public setStatus(workerId: string, status: WorkerStatus): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = status;
      prisma.jobWorkerModel.update({
        where: { id: workerId },
        data: { status }
      }).catch(() => {});
    }
  }

  public incrementActiveJobs(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.activeJobsCount++;
      if (worker.status === 'IDLE') worker.status = 'ACTIVE';
    }
  }

  public decrementActiveJobs(workerId: string, success: boolean): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.activeJobsCount = Math.max(0, worker.activeJobsCount - 1);
      if (success) {
        worker.metrics.totalProcessed++;
      } else {
        worker.metrics.totalFailed++;
      }
      if (worker.activeJobsCount === 0) {
        worker.status = 'IDLE';
      }
    }
  }

  private registerDefaultWorkers(): void {
    const defaultWorkers: JobWorker[] = [
      {
        id: 'wrk-core-01',
        name: 'Worker Core 01 (Crítico & Finanças)',
        hostname: 'node-srv-01',
        queues: ['critical', 'finance', 'payments', 'webhooks'],
        status: 'ACTIVE',
        concurrency: 10,
        activeJobsCount: 2,
        lastHeartbeatAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        metrics: {
          totalProcessed: 1420,
          totalFailed: 3,
          uptimeSeconds: 86400,
          cpuUsagePercent: 24,
          memoryUsageMb: 320
        }
      },
      {
        id: 'wrk-core-02',
        name: 'Worker Core 02 (Relatórios & Analytics)',
        hostname: 'node-srv-02',
        queues: ['analytics', 'documents', 'maintenance'],
        status: 'ACTIVE',
        concurrency: 5,
        activeJobsCount: 1,
        lastHeartbeatAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        metrics: {
          totalProcessed: 540,
          totalFailed: 1,
          uptimeSeconds: 72000,
          cpuUsagePercent: 42,
          memoryUsageMb: 610
        }
      },
      {
        id: 'wrk-core-03',
        name: 'Worker Core 03 (Marketing & Comunicações)',
        hostname: 'node-srv-03',
        queues: ['marketing', 'communications', 'integrations'],
        status: 'IDLE',
        concurrency: 20,
        activeJobsCount: 0,
        lastHeartbeatAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        metrics: {
          totalProcessed: 6450,
          totalFailed: 2,
          uptimeSeconds: 64800,
          cpuUsagePercent: 12,
          memoryUsageMb: 240
        }
      }
    ];

    for (const w of defaultWorkers) {
      this.workers.set(w.id, w);
    }
  }
}
