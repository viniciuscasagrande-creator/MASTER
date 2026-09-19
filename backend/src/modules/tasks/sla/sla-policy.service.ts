import { prisma } from '../../../core/database/prisma';
import { TaskPriority, TaskModule, TaskWaitingReason } from '@shared/types/index';

export class SlaPolicyService {
  /**
   * Find matching SLA policy for module and priority
   */
  public static async findPolicy(module: TaskModule, priority: TaskPriority): Promise<any | null> {
    const policy = await prisma.slaPolicy.findFirst({
      where: { module, priority }
    });
    if (policy) return policy;

    // Fallback: search by priority only
    const fallbackPriority = await prisma.slaPolicy.findFirst({
      where: { priority }
    });
    return fallbackPriority || null;
  }

  /**
   * Calculate SLA deadline from duration minutes
   */
  public static calculateDeadline(startDate: Date, durationMinutes: number): Date {
    return new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  }

  /**
   * Check if pausing is allowed for a given waiting reason under policy
   */
  public static isPauseAllowed(policy: any | null, reason: TaskWaitingReason): boolean {
    if (!policy) return true; // Default permissive if no strict policy configured
    if (!policy.allowPause) return false;

    let allowedReasons: string[] = [];
    if (typeof policy.allowedPauseReasons === 'string') {
      try {
        allowedReasons = JSON.parse(policy.allowedPauseReasons);
      } catch {
        allowedReasons = [];
      }
    } else if (Array.isArray(policy.allowedPauseReasons)) {
      allowedReasons = policy.allowedPauseReasons;
    }

    return allowedReasons.includes(reason);
  }
}
