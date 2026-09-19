import { prisma } from '../../../core/database/prisma';
import { WorkloadService } from './workload.service';

export class TeamRouterService {
  /**
   * Route task to best eligible team member using workload and availability
   */
  public static async routeToTeamMember(teamId: string, strategy: 'WORKLOAD' | 'ROUND_ROBIN' = 'WORKLOAD'): Promise<string | null> {
    const members = await prisma.teamMember.findMany({
      where: { teamId }
    });

    if (members.length === 0) return null;

    // Filter available members
    const eligibleUserIds: string[] = [];
    for (const m of members) {
      const available = await WorkloadService.isUserAvailable(m.userId);
      if (available) {
        eligibleUserIds.push(m.userId);
      }
    }

    if (eligibleUserIds.length === 0) {
      // Fallback to all team members if none explicitly available
      eligibleUserIds.push(...members.map((m: any) => m.userId));
    }

    if (strategy === 'ROUND_ROBIN') {
      // Find member with earliest lastAssignedAt
      const availabilities = await prisma.userAvailability.findMany({
        where: { userId: { in: eligibleUserIds } }
      });

      const sorted = eligibleUserIds.sort((a, b) => {
        const uA = availabilities.find((x: any) => x.userId === a);
        const uB = availabilities.find((x: any) => x.userId === b);
        const tA = uA?.lastAssignedAt ? new Date(uA.lastAssignedAt).getTime() : 0;
        const tB = uB?.lastAssignedAt ? new Date(uB.lastAssignedAt).getTime() : 0;
        return tA - tB;
      });

      const selectedId = sorted[0];
      await prisma.userAvailability.upsert({
        where: { userId: selectedId },
        update: { lastAssignedAt: new Date() },
        create: { userId: selectedId, status: 'AVAILABLE', lastAssignedAt: new Date() }
      });
      return selectedId;
    }

    // Default: Lowest Workload Strategy
    let lowestScore = Infinity;
    let selectedUserId = eligibleUserIds[0];

    for (const userId of eligibleUserIds) {
      const score = await WorkloadService.calculateUserWorkload(userId);
      if (score < lowestScore) {
        lowestScore = score;
        selectedUserId = userId;
      }
    }

    // Update lastAssignedAt
    await prisma.userAvailability.upsert({
      where: { userId: selectedUserId },
      update: { lastAssignedAt: new Date() },
      create: { userId: selectedUserId, status: 'AVAILABLE', lastAssignedAt: new Date() }
    });

    return selectedUserId;
  }
}
