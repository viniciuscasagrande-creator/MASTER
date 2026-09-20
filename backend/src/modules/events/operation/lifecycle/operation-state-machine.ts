import { OperationStatus } from '@shared/types/index';

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface TransitionContext {
  isReadinessBlocked?: boolean;
  hasCriticalIncidents?: boolean;
  override?: boolean;
  overrideReason?: string;
}

export class OperationStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<OperationStatus, OperationStatus[]> = {
    PREPARATION: ['READY', 'OPENING'],
    READY: ['OPENING', 'PREPARATION'],
    OPENING: ['ACTIVE', 'CLOSING'],
    ACTIVE: ['CLOSING', 'CLOSED'],
    CLOSING: ['CLOSED', 'ACTIVE'],
    CLOSED: [] // Terminal state
  };

  public static canTransition(from: OperationStatus, to: OperationStatus): boolean {
    const targets = this.ALLOWED_TRANSITIONS[from];
    return targets ? targets.includes(to) : false;
  }

  public static validateTransition(
    from: OperationStatus,
    to: OperationStatus,
    context?: TransitionContext
  ): TransitionValidationResult {
    if (!this.canTransition(from, to)) {
      return {
        allowed: false,
        reason: `Transição operacional inválida de ${from} para ${to}.`
      };
    }

    // Guard: To move to READY or OPENING, readiness checklist must not be BLOCKED unless overridden
    if ((to === 'READY' || to === 'OPENING') && context?.isReadinessBlocked) {
      if (!context.override) {
        return {
          allowed: false,
          reason: 'A operação possui pendências impeditivas (BLOCKED). É necessária aprovação de exceção / override.'
        };
      }
      if (!context.overrideReason || context.overrideReason.trim().length < 5) {
        return {
          allowed: false,
          reason: 'Justificativa obrigatória para override de pendências impeditivas na abertura.'
        };
      }
    }

    // Guard: To move to CLOSED, cannot have unresolved CRITICAL incidents unless overridden
    if (to === 'CLOSED' && context?.hasCriticalIncidents) {
      if (!context.override) {
        return {
          allowed: false,
          reason: 'Existem incidentes críticos não resolvidos. O encerramento da operação está bloqueado.'
        };
      }
      if (!context.overrideReason || context.overrideReason.trim().length < 5) {
        return {
          allowed: false,
          reason: 'Justificativa obrigatória para encerramento com incidentes críticos pendentes.'
        };
      }
    }

    return { allowed: true };
  }
}
