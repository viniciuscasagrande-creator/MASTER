import { Job, JobProgressData } from '@shared/types/index';
import { JobHandlerContext } from './job.types';
import { JobRepository } from './job.repository';
import { EventBus } from '../../events/event-bus';

export class DefaultJobContext implements JobHandlerContext {
  private repository: JobRepository;
  public job: Job;
  public correlationId: string;

  constructor(job: Job, repository: JobRepository) {
    this.job = job;
    this.repository = repository;
    this.correlationId = job.correlationId;
  }

  public async reportProgress(
    processed: number,
    total: number,
    success: number = processed,
    failed: number = 0,
    currentStep?: string
  ): Promise<void> {
    const percentage = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
    const progressData: JobProgressData = {
      processedItems: processed,
      totalItems: total,
      successItems: success,
      failedItems: failed,
      percentage,
      currentStep
    };

    this.job.progress = percentage;
    this.job.progressData = progressData;

    await this.repository.update(this.job.id, {
      progress: percentage,
      progressData
    });

    // Emit event to EventBus with Outbox pattern
    try {
      await EventBus.publish({
        id: `evt_progress_${this.job.id}_${Date.now()}`,
        type: 'JOB_PROGRESS_UPDATED',
        resourceType: 'JOB',
        resourceId: this.job.id,
        producerId: this.job.producerId || undefined,
        eventId: this.job.eventId || undefined,
        actorUserId: this.job.createdBy,
        data: {
          jobId: this.job.id,
          type: this.job.type,
          progress: percentage,
          progressData,
          correlationId: this.correlationId
        },
        timestamp: new Date()
      });
    } catch {
      // Non-blocking telemetry
    }
  }

  public async saveCheckpoint(cursor: any, processedCount: number, state?: any): Promise<void> {
    const checkpoint = {
      id: `chk_${this.job.id}_${Date.now()}`,
      jobId: this.job.id,
      cursor,
      processedCount,
      savedAt: new Date().toISOString(),
      state
    };
    await this.repository.saveCheckpoint(checkpoint);
    await this.repository.update(this.job.id, { checkpoint });
    this.job.checkpoint = checkpoint;
  }

  public async getCheckpoint(): Promise<any> {
    const cp = await this.repository.getCheckpoint(this.job.id);
    return cp || null;
  }

  public async isCancellationRequested(): Promise<boolean> {
    const freshJob = await this.repository.findById(this.job.id);
    if (freshJob) {
      this.job.cancelRequested = freshJob.cancelRequested;
      return freshJob.cancelRequested === true;
    }
    return false;
  }

  public async isPauseRequested(): Promise<boolean> {
    const freshJob = await this.repository.findById(this.job.id);
    if (freshJob) {
      this.job.pauseRequested = freshJob.pauseRequested;
      return freshJob.pauseRequested === true;
    }
    return false;
  }
}
