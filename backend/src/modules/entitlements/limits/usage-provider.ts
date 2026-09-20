import { prisma } from '../../../core/database/prisma';

export interface IUsageProvider {
  getUsage(producerId: string, limitKey: string): Promise<number>;
}

export class DatabaseUsageProvider implements IUsageProvider {
  private static mockUsages: Map<string, number> = new Map();

  /**
   * For testing or manual overrides of telemetry counters
   */
  public static setMockUsage(producerId: string, limitKey: string, value: number): void {
    const key = `${producerId}:${limitKey}`;
    this.mockUsages.set(key, value);
  }

  public static clearMockUsages(): void {
    this.mockUsages.clear();
  }

  public async getUsage(producerId: string, limitKey: string): Promise<number> {
    const overrideKey = `${producerId}:${limitKey}`;
    if (DatabaseUsageProvider.mockUsages.has(overrideKey)) {
      return DatabaseUsageProvider.mockUsages.get(overrideKey)!;
    }

    switch (limitKey) {
      case 'events.active_max':
        return this.countActiveEvents(producerId);

      case 'devices.offline_max':
        return this.countOfflineDevices(producerId);

      case 'boxoffice.terminals_max':
        return this.countPosTerminals(producerId);

      case 'tickets.monthly_quota':
        return this.countMonthlyTickets(producerId);

      case 'marketing.emails_monthly_max':
        return this.countMonthlyEmails(producerId);

      default:
        // By default, if no specialized calculator exists, assume 0
        return 0;
    }
  }

  private async countActiveEvents(producerId: string): Promise<number> {
    try {
      if (prisma.event && typeof prisma.event.count === 'function') {
        return await prisma.event.count({
          where: {
            producerId,
            status: { notIn: ['CANCELLED', 'FINISHED', 'ARCHIVED'] }
          }
        });
      }
    } catch {
      // Fallback if event collection does not support notIn
    }
    return 0;
  }

  private async countOfflineDevices(_producerId: string): Promise<number> {
    // In future phases, query AccessControlDevice table
    return 0;
  }

  private async countPosTerminals(_producerId: string): Promise<number> {
    // In future phases, query PosTerminal table
    return 0;
  }

  private async countMonthlyTickets(_producerId: string): Promise<number> {
    // In future phases, query TicketSale aggregated by current month
    return 0;
  }

  private async countMonthlyEmails(_producerId: string): Promise<number> {
    // In future phases, query MarketingCampaignLogs aggregated by current month
    return 0;
  }
}

// Global default instance
export const usageProvider = new DatabaseUsageProvider();
