import { Job, JobRegistryEntry, JobDeadLetter } from '@shared/types/index';
import { JobRepository } from '../core/job.repository';
import { EventBus } from '../../events/event-bus';

export class RetryService {
  private repository: JobRepository;

  constructor(repository: JobRepository) {
    this.repository = repository;
  }

  public isPermanentError(error: any): boolean {
    if (!error) return false;
    if (error.isPermanent === true) return true;

    const message = (error.message || String(error)).toLowerCase();
    const permanentKeywords = [
      'inexistente',
      'inválid',
      'invalid',
      'cpf',
      'cnpj',
      'conta bancária',
      'bancaria',
      'não encontrad',
      'not found',
      'revogad',
      'revoked',
      'sem permissão',
      'unauthorized',
      'forbidden',
      'schema inválido',
      'permanent'
    ];

    return permanentKeywords.some(keyword => message.includes(keyword));
  }

  public calculateBackoffDelayMs(
    attempt: number,
    policy: JobRegistryEntry['retryPolicy']
  ): number {
    let delay = policy.initialDelayMs;
    if (policy.backoffType === 'EXPONENTIAL') {
      delay = policy.initialDelayMs * Math.pow(2, attempt - 1);
    }
    delay = Math.min(delay, policy.maxDelayMs);

    if (policy.jitter) {
      // Add random jitter between 0 and 20%
      const jitterFactor = 1 + (Math.random() * 0.2);
      delay = Math.round(delay * jitterFactor);
    }

    return delay;
  }

  public shouldRetry(job: Job, error: any, maxAttempts: number): boolean {
    if (this.isPermanentError(error)) {
      return false; // Permanent errors should never be retried indefinitely
    }
    return job.attempts < maxAttempts;
  }

  public async handleFailure(
    job: Job,
    error: any,
    entry?: JobRegistryEntry
  ): Promise<{ action: 'RETRY' | 'DEAD_LETTER'; delayMs?: number; deadLetter?: JobDeadLetter }> {
    const isPermanent = this.isPermanentError(error);
    const maxAttempts = entry?.retryPolicy.maxAttempts || job.maxAttempts || 3;

    if (!isPermanent && job.attempts < maxAttempts) {
      // Eligible for retry
      const delayMs = entry
        ? this.calculateBackoffDelayMs(job.attempts, entry.retryPolicy)
        : 2000;

      await this.repository.update(job.id, {
        status: 'RETRYING',
        error: {
          message: error.message || String(error),
          code: error.code,
          stack: error.stack,
          isPermanent: false
        }
      });

      try {
        await EventBus.publish({
          id: `evt_retry_${job.id}_${Date.now()}`,
          type: 'JOB_RETRYING',
          resourceType: 'JOB',
          resourceId: job.id,
          producerId: job.producerId || undefined,
          eventId: job.eventId || undefined,
          actorUserId: job.createdBy,
          data: {
            jobId: job.id,
            attempts: job.attempts,
            maxAttempts,
            delayMs,
            reason: error.message || String(error)
          },
          timestamp: new Date()
        });
      } catch {}

      return { action: 'RETRY', delayMs };
    }

    // Exhausted retries OR permanent error -> Send to Dead Letter
    const failureReason = isPermanent
      ? `Erro permanente detectado: ${error.message || String(error)}`
      : `Limite de ${maxAttempts} tentativas excedido. Último erro: ${error.message || String(error)}`;

    const deadLetter: JobDeadLetter = {
      id: `dl_${job.id}_${Date.now()}`,
      jobId: job.id,
      jobType: job.type,
      module: job.module,
      originalQueue: job.queue,
      failureReason,
      errorStack: error.stack || null,
      attemptsCount: job.attempts,
      movedToDeadLetterAt: new Date().toISOString(),
      investigated: false,
      reprocessed: false,
      job
    };

    await this.repository.moveToDeadLetter(deadLetter);

    await this.repository.update(job.id, {
      status: 'DEAD_LETTER',
      finishedAt: new Date().toISOString(),
      error: {
        message: failureReason,
        code: error.code || (isPermanent ? 'PERMANENT_ERROR' : 'MAX_ATTEMPTS_EXCEEDED'),
        stack: error.stack,
        isPermanent
      }
    });

    try {
      await EventBus.publish({
        id: `evt_dead_letter_${job.id}_${Date.now()}`,
        type: 'JOB_DEAD_LETTER',
        resourceType: 'JOB',
        resourceId: job.id,
        producerId: job.producerId || undefined,
        eventId: job.eventId || undefined,
        actorUserId: job.createdBy,
        data: {
          jobId: job.id,
          type: job.type,
          failureReason,
          attempts: job.attempts
        },
        timestamp: new Date()
      });
    } catch {}

    return { action: 'DEAD_LETTER', deadLetter };
  }
}
