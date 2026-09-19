import { prisma } from '../../../core/database/prisma';
import { AppError } from '../../../core/errors/AppError';
import { TaskWaitingReason, SlaStatus } from '@shared/types/index';
import { SlaPolicyService } from './sla-policy.service';
import { DomainEvents } from '../../../events/DomainEvents';

export class SlaService {
  /**
   * Start SLA tracking on a task
   */
  public static async startSla(task: any, durationMinutes?: number): Promise<any> {
    const now = new Date();
    let minutes = durationMinutes || task.estimatedMinutes || 120;

    let policy: any = null;
    if (task.slaPolicyId) {
      policy = await prisma.slaPolicy.findUnique({ where: { id: task.slaPolicyId } });
    } else {
      policy = await SlaPolicyService.findPolicy(task.module, task.priority);
    }

    if (policy) {
      minutes = policy.durationMinutes || minutes;
    }

    const deadline = SlaPolicyService.calculateDeadline(now, minutes);

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        slaPolicyId: policy?.id || task.slaPolicyId,
        slaStartedAt: now,
        slaDeadline: deadline,
        slaStatus: 'WITHIN_SLA'
      }
    });

    await prisma.slaEvent.create({
      data: {
        taskId: task.id,
        eventType: 'STARTED',
        details: JSON.stringify({ durationMinutes: minutes, deadline })
      }
    });

    return updated;
  }

  /**
   * Pause SLA with reason check against policy
   */
  public static async pauseSla(taskId: string, reason: TaskWaitingReason): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);

    let policy: any = null;
    if (task.slaPolicyId) {
      policy = await prisma.slaPolicy.findUnique({ where: { id: task.slaPolicyId } });
    }

    // Strict validation: check if policy permits pausing for this reason
    const allowed = SlaPolicyService.isPauseAllowed(policy, reason);
    if (!allowed) {
      throw new AppError(
        `Pausa de SLA não permitida para o motivo "${reason}" segundo a política configurada para este fluxo.`,
        400
      );
    }

    const now = new Date();
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        slaPausedAt: now,
        slaStatus: 'PAUSED',
        waitingReason: reason
      }
    });

    await prisma.slaEvent.create({
      data: {
        taskId: task.id,
        eventType: 'PAUSED',
        details: JSON.stringify({ reason, pausedAt: now })
      }
    });

    return updated;
  }

  /**
   * Resume paused SLA and extend deadline by paused duration
   */
  public static async resumeSla(taskId: string): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    if (!task.slaPausedAt) return task; // Not paused

    const now = new Date();
    const pausedAt = new Date(task.slaPausedAt);
    const pauseDurationMs = Math.max(0, now.getTime() - pausedAt.getTime());
    const totalPaused = (task.totalPausedDurationMs || 0) + pauseDurationMs;

    // Extend SLA deadline by the paused duration
    let newDeadline = task.slaDeadline ? new Date(task.slaDeadline) : null;
    if (newDeadline) {
      newDeadline = new Date(newDeadline.getTime() + pauseDurationMs);
    }

    const newStatus: SlaStatus = newDeadline && now > newDeadline ? 'BREACHED' : 'WITHIN_SLA';

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        slaPausedAt: null,
        slaResumedAt: now,
        slaDeadline: newDeadline,
        totalPausedDurationMs: totalPaused,
        slaStatus: newStatus,
        waitingReason: null
      }
    });

    await prisma.slaEvent.create({
      data: {
        taskId: task.id,
        eventType: 'RESUMED',
        details: JSON.stringify({
          resumedAt: now,
          extendedByMs: pauseDurationMs,
          newDeadline
        })
      }
    });

    return updated;
  }

  /**
   * Evaluate SLA threshold for active tasks (80% warning, 100% breach)
   */
  public static async evaluateTaskSla(task: any): Promise<SlaStatus> {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return task.slaStatus;
    }
    if (task.slaStatus === 'PAUSED' || task.status === 'WAITING') {
      return 'PAUSED';
    }
    if (!task.slaStartedAt || !task.slaDeadline) {
      return 'WITHIN_SLA';
    }

    const now = new Date();
    const start = new Date(task.slaStartedAt).getTime();
    const deadline = new Date(task.slaDeadline).getTime();
    const totalDuration = deadline - start;

    if (totalDuration <= 0) return 'WITHIN_SLA';

    const elapsed = now.getTime() - start;
    const percent = (elapsed / totalDuration) * 100;

    let newStatus: SlaStatus = 'WITHIN_SLA';
    if (percent >= 100) {
      newStatus = 'BREACHED';
    } else if (percent >= 80) {
      newStatus = 'NEARING_BREACH';
    }

    if (newStatus !== task.slaStatus) {
      await prisma.task.update({
        where: { id: task.id },
        data: { slaStatus: newStatus }
      });

      if (newStatus === 'NEARING_BREACH' || newStatus === 'BREACHED') {
        DomainEvents.dispatch({
          id: `evt_sla_${task.id}_${Date.now()}`,
          type: 'TASK_SLA_WARNING',
          producerId: task.producerId || undefined,
          eventId: task.eventId || undefined,
          resourceType: 'TASK',
          resourceId: task.id,
          data: {
            taskId: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            slaStatus: newStatus,
            percentElapsed: Math.round(percent)
          },
          timestamp: new Date()
        });
      }
    }

    return newStatus;
  }
}
