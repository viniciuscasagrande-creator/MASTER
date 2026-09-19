import { prisma } from '../../../core/database/prisma';
import { TaskPriority, UserAvailabilityStatus } from '@shared/types/index';

export class WorkloadService {
  /**
   * Weights for task priorities
   */
  private static PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
    CRITICAL: 4,
    HIGH: 2,
    NORMAL: 1,
    LOW: 0.5
  };

  /**
   * Calculate current workload score for a user
   */
  public static async calculateUserWorkload(userId: string): Promise<number> {
    const activeTasks = await prisma.task.findMany({
      where: {
        assignedUserId: userId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'WAITING'] }
      }
    });

    let score = 0;
    for (const task of activeTasks) {
      const p = (task.priority as TaskPriority) || 'NORMAL';
      score += this.PRIORITY_WEIGHTS[p] || 1;
    }

    // Update UserAvailability cached score
    await prisma.userAvailability.upsert({
      where: { userId },
      update: { currentWorkloadScore: score },
      create: {
        userId,
        status: 'AVAILABLE',
        currentWorkloadScore: score
      }
    });

    return score;
  }

  /**
   * Check if user is available to receive new automated tasks
   */
  public static async isUserAvailable(userId: string): Promise<boolean> {
    const avail = await prisma.userAvailability.findUnique({
      where: { userId }
    });

    if (!avail) return true; // Default available if no status set
    return avail.status === 'AVAILABLE';
  }

  /**
   * Get user availability
   */
  public static async getUserAvailability(userId: string): Promise<any> {
    const avail = await prisma.userAvailability.findUnique({ where: { userId } });
    const score = await this.calculateUserWorkload(userId);
    return avail || { userId, status: 'AVAILABLE', currentWorkloadScore: score };
  }

  /**
   * Set user availability status
   */
  public static async setAvailability(userId: string, status: UserAvailabilityStatus): Promise<any> {
    return prisma.userAvailability.upsert({
      where: { userId },
      update: { status },
      create: {
        userId,
        status,
        currentWorkloadScore: 0
      }
    });
  }

  /**
   * Update user availability status
   */
  public static async updateAvailability(userId: string, status: UserAvailabilityStatus, _reason?: string): Promise<any> {
    return this.setAvailability(userId, status);
  }
}
