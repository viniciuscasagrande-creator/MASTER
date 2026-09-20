import { ITransitionGuard, GuardResult } from './transition-guard.interface';
import { EventReviewService } from '../../review/event-review.service';

export class SnapshotIntegrityGuard implements ITransitionGuard {
  public readonly name = 'SNAPSHOT_INTEGRITY';

  async evaluate(eventId: string): Promise<GuardResult> {
    const integrity = await EventReviewService.validateSnapshotIntegrity(eventId);

    if (integrity.valid) {
      return {
        passed: true,
        details: {
          snapshotId: integrity.snapshot?.id,
          version: integrity.snapshot?.eventVersion,
          hash: integrity.snapshotHash
        }
      };
    }

    return {
      passed: false,
      code: 'SNAPSHOT_INTEGRITY_VIOLATION',
      message: integrity.reason || 'Falha de integridade do snapshot de revisão.',
      details: {
        currentHash: integrity.currentHash,
        snapshotHash: integrity.snapshotHash,
        snapshotStatus: integrity.snapshot?.status
      }
    };
  }
}

export class ReviewSnapshotExistsGuard implements ITransitionGuard {
  public readonly name = 'REVIEW_SNAPSHOT_EXISTS';

  async evaluate(eventId: string): Promise<GuardResult> {
    const latest = await EventReviewService.getLatestSnapshot(eventId);

    if (!latest || latest.status !== 'VALID') {
      return {
        passed: false,
        code: 'REVIEW_SNAPSHOT_REQUIRED',
        message: 'É necessário gerar e congelar um snapshot de revisão antes de solicitar aprovação.'
      };
    }

    return { passed: true, details: { snapshotId: latest.id } };
  }
}
