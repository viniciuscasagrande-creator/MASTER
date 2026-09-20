import { JobCheckpoint, Job } from '@shared/types/index';
import { JobRepository } from '../core/job.repository';
import { QueueService } from '../queue/queue.service';

export class CheckpointService {
  private repository: JobRepository;
  private queueService: QueueService;

  constructor(repository: JobRepository, queueService?: QueueService) {
    this.repository = repository;
    this.queueService = queueService || QueueService.getInstance();
  }

  public async saveCheckpoint(
    jobId: string,
    cursor: any,
    processedCount: number,
    state?: any
  ): Promise<JobCheckpoint> {
    const checkpoint: JobCheckpoint = {
      id: `chk_${jobId}_${Date.now()}`,
      jobId,
      cursor,
      processedCount,
      savedAt: new Date().toISOString(),
      state
    };
    await this.repository.saveCheckpoint(checkpoint);
    await this.repository.update(jobId, { checkpoint });
    return checkpoint;
  }

  public async getCheckpoint(jobId: string): Promise<JobCheckpoint | null> {
    return this.repository.getCheckpoint(jobId);
  }

  public async pauseJob(jobId: string, actorUserId: string): Promise<{ success: boolean; message: string }> {
    const job = await this.repository.findById(jobId);
    if (!job) return { success: false, message: 'Processamento não encontrado.' };

    if (!job.pausable) {
      return { success: false, message: 'Este processamento não suporta pausa de acordo com sua política.' };
    }

    if (job.status !== 'RUNNING' && job.status !== 'QUEUED') {
      return { success: false, message: `Não é possível pausar um processamento com status ${job.status}.` };
    }

    if (job.status === 'QUEUED') {
      await this.repository.update(jobId, { status: 'WAITING', paused: true, pauseRequested: true });
      return { success: true, message: 'Processamento na fila foi pausado.' };
    }

    await this.repository.update(jobId, { pauseRequested: true });
    return { success: true, message: 'Solicitação de pausa registrada. O worker salvará o checkpoint na próxima etapa segura.' };
  }

  public async resumeJob(jobId: string, actorUserId: string): Promise<{ success: boolean; message: string }> {
    const job = await this.repository.findById(jobId);
    if (!job) return { success: false, message: 'Processamento não encontrado.' };

    if (!job.paused && job.status !== 'WAITING') {
      return { success: false, message: 'Processamento não se encontra pausado.' };
    }

    await this.repository.update(jobId, {
      status: 'QUEUED',
      paused: false,
      pauseRequested: false
    });

    // Re-enqueue
    await this.queueService.enqueue({
      ...job,
      status: 'QUEUED',
      paused: false,
      pauseRequested: false
    });

    return { success: true, message: 'Processamento retomado a partir do último checkpoint gravado.' };
  }
}
