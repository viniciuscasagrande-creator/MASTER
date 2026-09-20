import { EventSessionStatus } from '@shared/types/index';

const ALLOWED_TRANSITIONS: Record<EventSessionStatus, EventSessionStatus[]> = {
  DRAFT: ['CONFIGURED', 'CANCELLED'],
  CONFIGURED: ['SCHEDULED', 'OPEN', 'DRAFT', 'CANCELLED'],
  SCHEDULED: ['OPEN', 'CONFIGURED', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'FINISHED', 'CANCELLED'],
  IN_PROGRESS: ['FINISHED', 'CANCELLED'],
  FINISHED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: []
};

export class EventSessionStateMachine {
  public static canTransition(current: EventSessionStatus, target: EventSessionStatus): boolean {
    if (current === target) return true;
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static validateTransition(current: EventSessionStatus, target: EventSessionStatus): void {
    if (!this.canTransition(current, target)) {
      const allowed = ALLOWED_TRANSITIONS[current] || [];
      const allowedList = allowed.length > 0 ? allowed.join(', ') : 'Nenhum (estado final)';
      throw new Error(
        `Transição de status inválida para a sessão. De "${current}" para "${target}". Transições permitidas: [${allowedList}].`
      );
    }
  }

  public static getAllowedNextStatuses(current: EventSessionStatus): EventSessionStatus[] {
    return ALLOWED_TRANSITIONS[current] || [];
  }
}
