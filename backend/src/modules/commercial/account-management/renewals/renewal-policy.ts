import { prisma } from '../../../../core/database/prisma';

export class RenewalPolicy {
  private static DEFAULT_PLANNING_WINDOW_DAYS = 90;

  /**
   * Obtém a janela de antecedência de planejamento em dias (configurada globalmente ou fallback 90 dias)
   */
  public static async getPlanningWindowDays(): Promise<number> {
    try {
      const config = await (prisma as any).configuration?.findUnique({
        where: { key: 'commercial.renewal.planning_window_days' }
      });
      if (config && config.value) {
        const parsed = parseInt(config.value, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return this.DEFAULT_PLANNING_WINDOW_DAYS;
  }

  /**
   * Calcula a quantidade de dias restantes até o vencimento do contrato
   */
  public static getDaysUntilExpiration(expiresAt: Date | string): number {
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se uma data de expiração está dentro da janela de planejamento de renovação
   */
  public static isWithinPlanningWindow(expiresAt: Date | string, windowDays = RenewalPolicy.DEFAULT_PLANNING_WINDOW_DAYS): boolean {
    const days = this.getDaysUntilExpiration(expiresAt);
    return days <= windowDays;
  }

  /**
   * Verifica se um contrato ou renovação está com prazo vencido (overdue)
   */
  public static isOverdue(expiresAt: Date | string, status?: string): boolean {
    if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NOT_RENEWED') {
      return false;
    }
    const days = this.getDaysUntilExpiration(expiresAt);
    return days < 0;
  }
}
