import { OrderStatus } from '@shared/types/index';

export class SaleQualificationPolicy {
  /**
   * Evaluates if an order status qualifies as a confirmed commercial sale
   */
  public static isConfirmedSale(status: OrderStatus | string): boolean {
    return status === 'CONFIRMED' || status === 'PAID';
  }

  /**
   * Evaluates if an order is in pipeline / in-flight
   */
  public static isPipelineOrder(status: OrderStatus | string): boolean {
    return status === 'PENDING' || status === 'PROCESSING';
  }

  /**
   * Evaluates if an order was voided or terminated without conversion
   */
  public static isVoidedOrder(status: OrderStatus | string): boolean {
    return status === 'CANCELLED' || status === 'EXPIRED';
  }

  /**
   * Standard pt-BR localized labels for each status
   */
  public static getStatusLabel(status: OrderStatus | string): string {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return 'Confirmado';
      case 'PENDING':
        return 'Pendente';
      case 'PROCESSING':
        return 'Em Processamento';
      case 'CANCELLED':
        return 'Cancelado';
      case 'EXPIRED':
        return 'Expirado';
      case 'DRAFT':
        return 'Rascunho';
      default:
        return status;
    }
  }

  /**
   * Standard status badge color mapping
   */
  public static getStatusVariant(status: OrderStatus | string): 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return 'emerald';
      case 'PENDING':
        return 'amber';
      case 'PROCESSING':
        return 'blue';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'rose';
      case 'DRAFT':
      default:
        return 'slate';
    }
  }
}
