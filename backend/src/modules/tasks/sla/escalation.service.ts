import { prisma } from '../../../core/database/prisma';
import { DomainEvents } from '../../../events/DomainEvents';

export class EscalationService {
  /**
   * Scan tasks and escalate if SLA breach threshold is reached
   */
  public static async checkAndEscalateTasks(): Promise<Array<{ taskId: string; fromLevel: number; toLevel: number; escalatedTo?: string }>> {
    const now = new Date();
    const activeTasks = await prisma.task.findMany({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    });

    const escalated: Array<{ taskId: string; fromLevel: number; toLevel: number; escalatedTo?: string }> = [];

    for (const task of activeTasks) {
      if (!task.slaDeadline) continue;

      const deadline = new Date(task.slaDeadline);
      if (now <= deadline) continue; // Still within SLA

      // Task is breached: check escalation rules
      const minutesOverdue = Math.floor((now.getTime() - deadline.getTime()) / (60 * 1000));
      const currentLevel = task.escalationLevel || 0;

      // Find escalation rules for module or SLA policy
      const rules = await prisma.escalationRule.findMany({
        where: {
          OR: [
            { slaPolicyId: task.slaPolicyId || undefined },
            { module: task.module }
          ]
        }
      });

      // Find next level rule where triggerMinutesAfterBreach is met
      const nextRule = rules
        .filter((r: any) => r.level > currentLevel && minutesOverdue >= (r.triggerMinutesAfterBreach || 0))
        .sort((a: any, b: any) => a.level - b.level)[0];

      if (nextRule) {
        // Escalate task
        await prisma.task.update({
          where: { id: task.id },
          data: {
            escalationLevel: nextRule.level,
            slaStatus: 'BREACHED'
          }
        });

        // Record EscalationEvent
        await prisma.escalationEvent.create({
          data: {
            taskId: task.id,
            fromLevel: currentLevel,
            toLevel: nextRule.level,
            reason: `SLA excedido em ${minutesOverdue} minutos. Escalonamento automático para nível ${nextRule.level} (${nextRule.escalateToRole}).`
          }
        });

        // Record TaskHistory
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            action: 'ESCALATED',
            details: JSON.stringify({
              fromLevel: currentLevel,
              toLevel: nextRule.level,
              role: nextRule.escalateToRole,
              minutesOverdue
            })
          }
        });

        // Emit domain event for real-time notification
        DomainEvents.dispatch({
          id: `evt_esc_${task.id}_${Date.now()}`,
          type: 'TASK_ESCALATED',
          producerId: task.producerId || undefined,
          eventId: task.eventId || undefined,
          resourceType: 'TASK',
          resourceId: task.id,
          data: {
            taskId: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            fromLevel: currentLevel,
            toLevel: nextRule.level,
            role: nextRule.escalateToRole,
            minutesOverdue
          },
          timestamp: new Date()
        });

        escalated.push({
          taskId: task.id,
          fromLevel: currentLevel,
          toLevel: nextRule.level,
          escalatedTo: nextRule.escalateToRole
        });
      }
    }

    return escalated;
  }

  public static async checkAndEscalateOverdueTasks(): Promise<Array<{ taskId: string; fromLevel: number; toLevel: number; escalatedTo?: string }>> {
    return this.checkAndEscalateTasks();
  }
}
