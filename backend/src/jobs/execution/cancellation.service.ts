import { Job } from '@shared/types/index';
import { JobRepository } from '../core/job.repository';
import { EventBus } from '../../events/event-bus';

export class CancellationService {
  private repository: JobRepository;

  constructor(repository: JobRepository) {
    this.repository = repository;
  }

  public async requestCancellation(jobId: string, actorUserId: string): Promise<{ success: boolean; message: string }> {
    const job = await this.repository.findById(jobId);
    if (!job) {
      return { success: false, message: 'Processamento não encontrado.' };
    }

    if (!job.cancellable) {
      return {
        success: false,
        message: 'Este tipo de processamento não permite cancelamento de acordo com a política de integridade.'
      };
    }

    if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
      return {
        success: false,
        message: `Processamento já se encontra finalizado (${job.status}).`
      };
    }

    if (job.status === 'QUEUED' || job.status === 'SCHEDULED' || job.status === 'CREATED') {
      // Immediate cancellation if not yet running
      await this.repository.update(job.id, {
        status: 'CANCELLED',
        finishedAt: new Date().toISOString(),
        cancelRequested: true
      });

      try {
        await EventBus.publish({
          id: `evt_cancel_${job.id}_${Date.now()}`,
          type: 'JOB_CANCELLED',
          resourceType: 'JOB',
          resourceId: job.id,
          producerId: job.producerId || undefined,
          eventId: job.eventId || undefined,
          actorUserId,
          data: { jobId: job.id, immediate: true },
          timestamp: new Date()
        });
      } catch {}

      return { success: true, message: 'Processamento cancelado com sucesso.' };
    }

    // If RUNNING: Cooperative cancellation
    await this.repository.update(job.id, {
      cancelRequested: true
    });

    return {
      success: true,
      message: 'Solicitação de cancelamento cooperativo enviada ao worker em execução.'
    };
  }

  public async finalizeCancellation(jobId: string): Promise<void> {
    const job = await this.repository.findById(jobId);
    if (!job) return;

    await this.repository.update(jobId, {
      status: 'CANCELLED',
      finishedAt: new Date().toISOString()
    });

    try {
      await EventBus.publish({
        id: `evt_cancel_done_${jobId}_${Date.now()}`,
        type: 'JOB_CANCELLED',
        resourceType: 'JOB',
        resourceId: jobId,
        producerId: job.producerId || undefined,
        eventId: job.eventId || undefined,
        actorUserId: job.createdBy,
        data: { jobId, cooperative: true },
        timestamp: new Date()
      });
    } catch {}
  }
}
