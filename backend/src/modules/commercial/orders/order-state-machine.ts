import { OrderStatus } from '@shared/types/index';
import { ValidationError } from '../../../core/errors/AppError';

export class OrderStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['PROCESSING', 'CONFIRMED', 'EXPIRED', 'CANCELLED'],
    PROCESSING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['CANCELLED'],
    CANCELLED: [],
    EXPIRED: []
  };

  /**
   * Checks if status transition is valid
   */
  public static canTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
    if (currentStatus === nextStatus) return true;
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Validates transition or throws descriptive ValidationError
   */
  public static validateTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
    if (currentStatus === nextStatus) return;

    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new ValidationError(
        `Transição de status inválida: não é permitido alterar de '${currentStatus}' para '${nextStatus}'.`,
        {
          currentStatus,
          requestedStatus: nextStatus,
          allowedTransitions: allowed
        }
      );
    }
  }

  /**
   * Returns list of reachable states from current state
   */
  public static getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
