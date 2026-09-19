import { prisma } from '../../core/database/prisma';

export interface GroupingResult {
  isAggregated: boolean;
  notificationId?: string;
}

export class GroupingService {
  private static WINDOW_MS = 5 * 60 * 1000; // 5 minute anti-noise window

  /**
   * Check if event should be grouped under an existing active notification
   */
  public static async checkGrouping(
    groupKey: string | undefined,
    newEventTitle: string,
    eventData: any
  ): Promise<GroupingResult> {
    if (!groupKey) {
      return { isAggregated: false };
    }

    const recentNotifications = await prisma.notification.findMany({
      where: { groupKey }
    });

    const now = new Date();
    const candidate = recentNotifications.find((n: any) => {
      const createdAt = new Date(n.createdAt);
      return (now.getTime() - createdAt.getTime()) < this.WINDOW_MS;
    });

    if (candidate) {
      // Aggregate into existing candidate notification
      let meta: any = {};
      try {
        meta = candidate.metadata ? JSON.parse(candidate.metadata) : {};
      } catch {
        meta = {};
      }

      const occurrences = (meta.occurrences || 1) + 1;
      const totalAmount = (meta.totalAmount || 0) + (Number(eventData?.amount) || 0);

      meta.occurrences = occurrences;
      meta.totalAmount = totalAmount;

      let updatedTitle = candidate.title;
      let updatedDesc = candidate.description;

      if (groupKey.startsWith('sales:')) {
        updatedTitle = `${occurrences} novas vendas registradas`;
        updatedDesc = `${occurrences} ingressos vendidos recentemente, totalizando R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      } else {
        updatedDesc = `${candidate.description} (Ocorrências acumuladas: ${occurrences})`;
      }

      await prisma.notification.update({
        where: { id: candidate.id },
        data: {
          title: updatedTitle,
          description: updatedDesc,
          metadata: JSON.stringify(meta)
        }
      });

      return {
        isAggregated: true,
        notificationId: candidate.id
      };
    }

    return { isAggregated: false };
  }
}
