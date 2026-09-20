import { TicketBatchStatus } from '@shared/types/index';

export class BatchStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<TicketBatchStatus, TicketBatchStatus[]> = {
    DRAFT: ['SCHEDULED', 'ACTIVE', 'ARCHIVED'],
    SCHEDULED: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
    ACTIVE: ['PAUSED', 'SOLD_OUT', 'ENDED'],
    PAUSED: ['ACTIVE', 'ENDED', 'ARCHIVED'],
    SOLD_OUT: ['ARCHIVED'],
    ENDED: ['ARCHIVED'],
    ARCHIVED: []
  };

  /**
   * Verifica se a transição de estado solicitada é permitida
   */
  static canTransition(from: TicketBatchStatus, to: TicketBatchStatus): boolean {
    if (from === to) return true;
    const allowed = this.ALLOWED_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  /**
   * Valida a transição e lança erro caso seja inválida
   */
  static validateTransition(from: TicketBatchStatus, to: TicketBatchStatus): void {
    if (!this.canTransition(from, to)) {
      const err: any = new Error(
        `Transição de status inválida para o lote: de '${from}' para '${to}'. Estados permitidos: [${(this.ALLOWED_TRANSITIONS[from] || []).join(', ')}]`
      );
      err.statusCode = 400;
      throw err;
    }
  }
}
