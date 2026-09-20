import { JobBatch, BatchStatus, Job, JobModule, User } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { JobRepository } from '../core/job.repository';
import { QueueService } from '../queue/queue.service';
import { EventBus } from '../../events/event-bus';

export class BatchService {
  private repository: JobRepository;
  private queueService: QueueService;

  constructor(repository?: JobRepository, queueService?: QueueService) {
    this.repository = repository || new JobRepository();
    this.queueService = queueService || QueueService.getInstance();
  }

  public async createBatch(
    name: string,
    module: JobModule,
    childJobItems: Array<{
      type: string;
      payload: any;
      producerId?: string | null;
      eventId?: string | null;
      priority?: any;
      queue?: any;
    }>,
    user: User,
    options?: {
      producerId?: string | null;
      eventId?: string | null;
      correlationId?: string;
    }
  ): Promise<JobBatch> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const correlationId = options?.correlationId || `cor_batch_${Date.now()}`;
    const totalItems = childJobItems.length;

    // 1. Create Parent Batch Record
    const batchRecord = await prisma.jobBatchModel.create({
      data: {
        id: batchId,
        name,
        module,
        producerId: options?.producerId || null,
        eventId: options?.eventId || null,
        status: 'QUEUED',
        totalItems,
        completedItems: 0,
        failedItems: 0,
        pendingItems: totalItems,
        progressPercent: 0,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        startedAt: new Date(),
        correlationId
      }
    });

    // 2. Create Child Jobs
    const createdChildJobs: Job[] = [];
    for (let i = 0; i < childJobItems.length; i++) {
      const item = childJobItems[i];
      const childJob = await this.repository.create({
        id: `job_${batchId}_${i + 1}`,
        type: item.type,
        module,
        producerId: item.producerId || options?.producerId || null,
        eventId: item.eventId || options?.eventId || null,
        status: 'QUEUED',
        priority: item.priority || 'NORMAL',
        queue: item.queue || 'finance',
        progress: 0,
        payload: item.payload,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3,
        correlationId,
        parentJobId: batchId,
        batchId,
        cancellable: true
      });

      createdChildJobs.push(childJob);
      await this.queueService.enqueue(childJob);
    }

    return {
      ...this.mapBatchToDomain(batchRecord),
      childJobs: createdChildJobs
    };
  }

  public async getBatch(id: string): Promise<JobBatch | null> {
    const record = await prisma.jobBatchModel.findUnique({ where: { id } });
    if (!record) return null;

    const childJobs = await this.repository.findMany({ batchId: id });
    return {
      ...this.mapBatchToDomain(record),
      childJobs
    };
  }

  public async listBatches(where?: any): Promise<JobBatch[]> {
    const records = await prisma.jobBatchModel.findMany({ where });
    return records.map((r: any) => this.mapBatchToDomain(r));
  }

  public async updateBatchProgress(batchId: string): Promise<JobBatch | null> {
    const childJobs = await this.repository.findMany({ batchId });
    if (!childJobs || childJobs.length === 0) return null;

    const total = childJobs.length;
    const completed = childJobs.filter(j => j.status === 'COMPLETED').length;
    const failed = childJobs.filter(j => j.status === 'FAILED' || j.status === 'DEAD_LETTER').length;
    const cancelled = childJobs.filter(j => j.status === 'CANCELLED').length;
    const pending = total - (completed + failed + cancelled);

    const progressPercent = total > 0 ? Math.round(((completed + failed + cancelled) / total) * 100) : 0;

    let status: BatchStatus = 'RUNNING';
    let finishedAt: Date | null = null;

    if (pending === 0) {
      finishedAt = new Date();
      if (completed === total) {
        status = 'COMPLETED';
      } else if (failed === total) {
        status = 'FAILED';
      } else if (cancelled === total) {
        status = 'CANCELLED';
      } else {
        // Partially completed (some succeeded, some failed)
        status = 'PARTIALLY_COMPLETED';
      }
    }

    const updated = await prisma.jobBatchModel.update({
      where: { id: batchId },
      data: {
        status,
        completedItems: completed,
        failedItems: failed,
        pendingItems: pending,
        progressPercent,
        finishedAt: finishedAt || undefined
      }
    });

    return {
      ...this.mapBatchToDomain(updated),
      childJobs
    };
  }

  /**
   * Selective Retry: Re-executes ONLY failed child jobs in the batch
   */
  public async retryFailures(batchId: string, user: User): Promise<{ retriedCount: number; batch: JobBatch }> {
    const batch = await this.getBatch(batchId);
    if (!batch) {
      throw new Error('Lote de processamento não encontrado.');
    }

    const failedJobs = (batch.childJobs || []).filter(
      j => j.status === 'FAILED' || j.status === 'DEAD_LETTER'
    );

    if (failedJobs.length === 0) {
      return { retriedCount: 0, batch };
    }

    // Re-enqueue only the failed child jobs
    for (const job of failedJobs) {
      await this.repository.update(job.id, {
        status: 'QUEUED',
        error: null,
        attempts: 0
      });
      await this.queueService.enqueue({
        ...job,
        status: 'QUEUED',
        attempts: 0,
        error: null
      });
    }

    // Update batch status to RUNNING
    const updatedBatchRecord = await prisma.jobBatchModel.update({
      where: { id: batchId },
      data: {
        status: 'RUNNING',
        failedItems: 0,
        pendingItems: failedJobs.length,
        finishedAt: null
      }
    });

    try {
      await EventBus.publish({
        id: `evt_batch_retry_${batchId}_${Date.now()}`,
        type: 'JOB_RETRYING',
        resourceType: 'BATCH',
        resourceId: batchId,
        actorUserId: user.id,
        data: {
          batchId,
          retriedCount: failedJobs.length
        },
        timestamp: new Date()
      });
    } catch {}

    const freshChildJobs = await this.repository.findMany({ batchId });
    return {
      retriedCount: failedJobs.length,
      batch: {
        ...this.mapBatchToDomain(updatedBatchRecord),
        childJobs: freshChildJobs
      }
    };
  }

  public async cancelBatch(batchId: string, user: User): Promise<{ cancelledCount: number }> {
    const childJobs = await this.repository.findMany({ batchId });
    let cancelledCount = 0;

    for (const job of childJobs) {
      if (job.status === 'QUEUED' || job.status === 'RUNNING') {
        await this.repository.update(job.id, {
          status: 'CANCELLED',
          cancelRequested: true,
          finishedAt: new Date().toISOString()
        });
        cancelledCount++;
      }
    }

    await prisma.jobBatchModel.update({
      where: { id: batchId },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date()
      }
    });

    return { cancelledCount };
  }

  private mapBatchToDomain(record: any): JobBatch {
    return {
      id: record.id,
      name: record.name,
      module: record.module as JobModule,
      producerId: record.producerId,
      eventId: record.eventId,
      status: record.status as BatchStatus,
      totalItems: record.totalItems || 0,
      completedItems: record.completedItems || 0,
      failedItems: record.failedItems || 0,
      pendingItems: record.pendingItems || 0,
      progressPercent: record.progressPercent || 0,
      createdBy: record.createdBy,
      createdByName: record.createdByName,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      startedAt: record.startedAt ? (record.startedAt instanceof Date ? record.startedAt.toISOString() : record.startedAt) : null,
      finishedAt: record.finishedAt ? (record.finishedAt instanceof Date ? record.finishedAt.toISOString() : record.finishedAt) : null,
      correlationId: record.correlationId
    };
  }
}
