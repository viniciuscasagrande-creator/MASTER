import { Job, JobAttempt, JobCheckpoint, JobDeadLetter, JobStatus, JobPriority, JobQueue, JobModule } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class JobRepository {
  public async create(job: Job): Promise<Job> {
    const record = await prisma.jobModel.create({
      data: {
        id: job.id,
        type: job.type,
        module: job.module,
        producerId: job.producerId || null,
        eventId: job.eventId || null,
        resourceType: job.resourceType || null,
        resourceId: job.resourceId || null,
        status: job.status,
        priority: job.priority,
        queue: job.queue,
        progress: job.progress,
        progressData: job.progressData ? JSON.stringify(job.progressData) : null,
        payloadReference: job.payloadReference || null,
        payload: job.payload ? JSON.stringify(job.payload) : null,
        result: job.result ? JSON.stringify(job.result) : null,
        error: job.error ? JSON.stringify(job.error) : null,
        createdBy: job.createdBy,
        createdByName: job.createdByName,
        createdAt: new Date(job.createdAt),
        scheduledAt: job.scheduledAt ? new Date(job.scheduledAt) : null,
        startedAt: job.startedAt ? new Date(job.startedAt) : null,
        finishedAt: job.finishedAt ? new Date(job.finishedAt) : null,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        correlationId: job.correlationId,
        parentJobId: job.parentJobId || null,
        batchId: job.batchId || null,
        workflowId: job.workflowId || null,
        cancellable: job.cancellable,
        cancelRequested: job.cancelRequested || false,
        pausable: job.pausable || false,
        pauseRequested: job.pauseRequested || false,
        paused: job.paused || false,
        idempotencyKey: job.idempotencyKey || null,
        checkpoint: job.checkpoint ? JSON.stringify(job.checkpoint) : null
      }
    });

    return this.mapToDomain(record);
  }

  public async findById(id: string): Promise<Job | null> {
    const record = await prisma.jobModel.findUnique({
      where: { id }
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async findByIdempotencyKey(key: string): Promise<Job | null> {
    const record = await prisma.jobModel.findFirst({
      where: { idempotencyKey: key }
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async update(id: string, data: Partial<Job>): Promise<Job> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.queue !== undefined) updateData.queue = data.queue;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.progressData !== undefined) updateData.progressData = JSON.stringify(data.progressData);
    if (data.payloadReference !== undefined) updateData.payloadReference = data.payloadReference;
    if (data.payload !== undefined) updateData.payload = JSON.stringify(data.payload);
    if (data.result !== undefined) updateData.result = JSON.stringify(data.result);
    if (data.error !== undefined) updateData.error = data.error ? JSON.stringify(data.error) : null;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt ? new Date(data.startedAt) : null;
    if (data.finishedAt !== undefined) updateData.finishedAt = data.finishedAt ? new Date(data.finishedAt) : null;
    if (data.attempts !== undefined) updateData.attempts = data.attempts;
    if (data.cancellable !== undefined) updateData.cancellable = data.cancellable;
    if (data.cancelRequested !== undefined) updateData.cancelRequested = data.cancelRequested;
    if (data.pausable !== undefined) updateData.pausable = data.pausable;
    if (data.pauseRequested !== undefined) updateData.pauseRequested = data.pauseRequested;
    if (data.paused !== undefined) updateData.paused = data.paused;
    if (data.checkpoint !== undefined) updateData.checkpoint = data.checkpoint ? JSON.stringify(data.checkpoint) : null;

    const record = await prisma.jobModel.update({
      where: { id },
      data: updateData
    });

    return this.mapToDomain(record);
  }

  public async findMany(where?: any, take?: number): Promise<Job[]> {
    const records = await prisma.jobModel.findMany({
      where,
      take
    });
    return records.map((r: any) => this.mapToDomain(r));
  }

  public async count(where?: any): Promise<number> {
    return prisma.jobModel.count({ where });
  }

  // --- Job Attempts ---
  public async createAttempt(attempt: JobAttempt): Promise<JobAttempt> {
    const record = await prisma.jobAttemptModel.create({
      data: {
        id: attempt.id,
        jobId: attempt.jobId,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: new Date(attempt.startedAt),
        finishedAt: attempt.finishedAt ? new Date(attempt.finishedAt) : null,
        error: attempt.error || null,
        workerId: attempt.workerId || null
      }
    });
    return {
      id: record.id,
      jobId: record.jobId,
      attemptNumber: record.attemptNumber,
      status: record.status as any,
      startedAt: record.startedAt.toISOString(),
      finishedAt: record.finishedAt ? record.finishedAt.toISOString() : null,
      error: record.error,
      workerId: record.workerId
    };
  }

  public async findAttempts(jobId: string): Promise<JobAttempt[]> {
    const records = await prisma.jobAttemptModel.findMany({
      where: { jobId }
    });
    return records.map((r: any) => ({
      id: r.id,
      jobId: r.jobId,
      attemptNumber: r.attemptNumber,
      status: r.status as any,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
      error: r.error,
      workerId: r.workerId
    }));
  }

  // --- Checkpoints ---
  public async saveCheckpoint(checkpoint: JobCheckpoint): Promise<void> {
    const existing = await prisma.jobCheckpointModel.findFirst({
      where: { jobId: checkpoint.jobId }
    });

    if (existing) {
      await prisma.jobCheckpointModel.update({
        where: { id: existing.id },
        data: {
          cursor: JSON.stringify(checkpoint.cursor),
          processedCount: checkpoint.processedCount,
          savedAt: new Date(checkpoint.savedAt),
          state: checkpoint.state ? JSON.stringify(checkpoint.state) : null
        }
      });
    } else {
      await prisma.jobCheckpointModel.create({
        data: {
          id: checkpoint.id,
          jobId: checkpoint.jobId,
          cursor: JSON.stringify(checkpoint.cursor),
          processedCount: checkpoint.processedCount,
          savedAt: new Date(checkpoint.savedAt),
          state: checkpoint.state ? JSON.stringify(checkpoint.state) : null
        }
      });
    }
  }

  public async getCheckpoint(jobId: string): Promise<JobCheckpoint | null> {
    const record = await prisma.jobCheckpointModel.findFirst({
      where: { jobId }
    });
    if (!record) return null;
    return {
      id: record.id,
      jobId: record.jobId,
      cursor: typeof record.cursor === 'string' ? JSON.parse(record.cursor) : record.cursor,
      processedCount: record.processedCount,
      savedAt: record.savedAt.toISOString(),
      state: record.state ? (typeof record.state === 'string' ? JSON.parse(record.state) : record.state) : null
    };
  }

  // --- Dead Letter ---
  public async moveToDeadLetter(deadLetter: JobDeadLetter): Promise<JobDeadLetter> {
    const record = await prisma.jobDeadLetterModel.create({
      data: {
        id: deadLetter.id,
        jobId: deadLetter.jobId,
        jobType: deadLetter.jobType,
        module: deadLetter.module,
        originalQueue: deadLetter.originalQueue,
        failureReason: deadLetter.failureReason,
        errorStack: deadLetter.errorStack || null,
        attemptsCount: deadLetter.attemptsCount,
        movedToDeadLetterAt: new Date(deadLetter.movedToDeadLetterAt),
        investigated: false,
        reprocessed: false
      }
    });

    return {
      ...deadLetter,
      id: record.id
    };
  }

  public async findDeadLetters(where?: any): Promise<JobDeadLetter[]> {
    const records = await prisma.jobDeadLetterModel.findMany({ where });
    return records.map((r: any) => ({
      id: r.id,
      jobId: r.jobId,
      jobType: r.jobType,
      module: r.module as JobModule,
      originalQueue: r.originalQueue as JobQueue,
      failureReason: r.failureReason,
      errorStack: r.errorStack,
      attemptsCount: r.attemptsCount,
      movedToDeadLetterAt: r.movedToDeadLetterAt.toISOString(),
      investigated: r.investigated,
      investigatedBy: r.investigatedBy,
      investigatedAt: r.investigatedAt ? r.investigatedAt.toISOString() : null,
      reprocessed: r.reprocessed,
      reprocessedJobId: r.reprocessedJobId,
      reprocessedAt: r.reprocessedAt ? r.reprocessedAt.toISOString() : null
    }));
  }

  public async updateDeadLetter(id: string, data: Partial<JobDeadLetter>): Promise<void> {
    const updateData: any = {};
    if (data.investigated !== undefined) updateData.investigated = data.investigated;
    if (data.investigatedBy !== undefined) updateData.investigatedBy = data.investigatedBy;
    if (data.investigatedAt !== undefined) updateData.investigatedAt = data.investigatedAt ? new Date(data.investigatedAt) : null;
    if (data.reprocessed !== undefined) updateData.reprocessed = data.reprocessed;
    if (data.reprocessedJobId !== undefined) updateData.reprocessedJobId = data.reprocessedJobId;
    if (data.reprocessedAt !== undefined) updateData.reprocessedAt = data.reprocessedAt ? new Date(data.reprocessedAt) : null;

    await prisma.jobDeadLetterModel.update({
      where: { id },
      data: updateData
    });
  }

  private mapToDomain(record: any): Job {
    return {
      id: record.id,
      type: record.type,
      module: record.module as JobModule,
      producerId: record.producerId,
      eventId: record.eventId,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      status: record.status as JobStatus,
      priority: record.priority as JobPriority,
      queue: record.queue as JobQueue,
      progress: record.progress || 0,
      progressData: record.progressData ? (typeof record.progressData === 'string' ? JSON.parse(record.progressData) : record.progressData) : undefined,
      payloadReference: record.payloadReference,
      payload: record.payload ? (typeof record.payload === 'string' ? JSON.parse(record.payload) : record.payload) : undefined,
      result: record.result ? (typeof record.result === 'string' ? JSON.parse(record.result) : record.result) : undefined,
      error: record.error ? (typeof record.error === 'string' ? JSON.parse(record.error) : record.error) : null,
      createdBy: record.createdBy,
      createdByName: record.createdByName,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      scheduledAt: record.scheduledAt ? (record.scheduledAt instanceof Date ? record.scheduledAt.toISOString() : record.scheduledAt) : null,
      startedAt: record.startedAt ? (record.startedAt instanceof Date ? record.startedAt.toISOString() : record.startedAt) : null,
      finishedAt: record.finishedAt ? (record.finishedAt instanceof Date ? record.finishedAt.toISOString() : record.finishedAt) : null,
      attempts: record.attempts || 0,
      maxAttempts: record.maxAttempts || 3,
      correlationId: record.correlationId,
      parentJobId: record.parentJobId,
      batchId: record.batchId,
      workflowId: record.workflowId,
      cancellable: record.cancellable !== undefined ? record.cancellable : true,
      cancelRequested: record.cancelRequested || false,
      pausable: record.pausable || false,
      pauseRequested: record.pauseRequested || false,
      paused: record.paused || false,
      idempotencyKey: record.idempotencyKey,
      checkpoint: record.checkpoint ? (typeof record.checkpoint === 'string' ? JSON.parse(record.checkpoint) : record.checkpoint) : undefined
    };
  }
}
