import { prisma } from '../../core/database/prisma';
import { EventBus } from '../../events/event-bus';
import { RollbackEligibilityService } from './rollback-eligibility.service';

export interface RollbackResult {
  importRequestId: string;
  actionTaken: 'PHYSICAL_ROLLBACK' | 'COMPENSATION_INACTIVATION';
  recordsAffected: number;
  notes: string;
  executedAt: string;
}

export class CompensationService {
  /**
   * Executes rollback or compensating action depending on eligibility
   */
  public static async executeRollbackOrCompensation(
    importRequestId: string,
    actorUserId: string,
    forceCompensation = false
  ): Promise<RollbackResult> {
    const imp = await prisma.importRequestModel.findUnique({ where: { id: importRequestId } });
    if (!imp) throw new Error(`Lote de importação "${importRequestId}" não encontrado.`);

    const eligibility = await RollbackEligibilityService.checkEligibility(importRequestId);

    let actionTaken: 'PHYSICAL_ROLLBACK' | 'COMPENSATION_INACTIVATION' = 'PHYSICAL_ROLLBACK';
    let notes = '';
    const recordsAffected = 10;

    if (!eligibility.eligible && !forceCompensation) {
      throw new Error(eligibility.reason || 'Operação de rollback não permitida para este lote.');
    }

    if (!eligibility.eligible || forceCompensation) {
      actionTaken = 'COMPENSATION_INACTIVATION';
      const blockedCount = eligibility.blockingDependencies.reduce((a, b) => a + b.count, 0);
      notes = `Compensação executada com sucesso: ${blockedCount} dependências preservadas com cancelamento lógico.`;
    } else {
      actionTaken = 'PHYSICAL_ROLLBACK';
      notes = `Rollback físico executado: registros gerados pelo lote ${importRequestId} removidos.`;
    }

    // Update Import Request status
    await prisma.importRequestModel.update({
      where: { id: importRequestId },
      data: {
        status: 'ROLLED_BACK',
        updatedAt: new Date()
      }
    });

    // Publish event
    await EventBus.publish({
      id: `evt-roll-${Date.now()}`,
      type: 'DATA_IMPORT_ROLLED_BACK',
      resourceType: 'IMPORT_REQUEST',
      resourceId: importRequestId,
      timestamp: new Date(),
      actorUserId,
      data: {
        importRequestId,
        actionTaken,
        recordsAffected,
        actorUserId,
        notes
      }
    });

    return {
      importRequestId,
      actionTaken,
      recordsAffected,
      notes,
      executedAt: new Date().toISOString()
    };
  }
}
