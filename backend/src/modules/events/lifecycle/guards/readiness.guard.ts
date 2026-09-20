import { ITransitionGuard, GuardResult } from './transition-guard.interface';
import { EventReadinessService } from '../../readiness/event-readiness.service';
import { ReadinessTarget } from '@shared/types/index';

export class ReadinessGuard implements ITransitionGuard {
  constructor(
    public readonly name: string,
    private readonly target: ReadinessTarget
  ) {}

  async evaluate(eventId: string): Promise<GuardResult> {
    const readiness = await EventReadinessService.evaluateEventReadiness(eventId);
    const targetStatus = readiness.targets[this.target];

    if (targetStatus === 'READY' || targetStatus === 'WARNING') {
      return { passed: true };
    }

    const relevantIssues = readiness.issues.filter(
      i => (i.severity === 'BLOCKING' || i.severity === 'CRITICAL') && (i.target === this.target || i.target === 'PUBLICATION' || i.target === 'REVIEW')
    );

    return {
      passed: false,
      code: `READINESS_${this.target}_BLOCKED`,
      message: `Prontidão operacional para '${this.target}' não foi homologada (${targetStatus}). Existem ${relevantIssues.length} pendências bloqueantes.`,
      details: relevantIssues
    };
  }
}
