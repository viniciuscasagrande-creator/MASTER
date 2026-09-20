import { MigrationReconciliation } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export interface ReconciliationInput {
  migrationId: string;
  entityType: string;
  sourceCount: number;
  sourceSum?: number;
  targetEntityRecords: any[];
  sumFieldName?: string;
}

export class ReconciliationService {
  /**
   * Reconciles a migration stage source metadata against persisted internal records
   */
  public static async reconcile(input: ReconciliationInput): Promise<MigrationReconciliation> {
    const destCount = input.targetEntityRecords.length;
    const countMatched = destCount === input.sourceCount;

    let destSum: number | undefined = undefined;
    let sumMatched: boolean | undefined = undefined;

    if (input.sumFieldName && input.sourceSum !== undefined) {
      destSum = input.targetEntityRecords.reduce((acc, curr) => {
        const val = Number(curr[input.sumFieldName!]) || 0;
        return acc + val;
      }, 0);
      sumMatched = destSum !== undefined ? Math.abs(destSum - input.sourceSum) < 0.01 : false;
    }

    const divergentIds: string[] = [];
    if (!countMatched) {
      divergentIds.push(`count_mismatch:expected_${input.sourceCount}_got_${destCount}`);
    }

    const saved = await prisma.migrationReconciliationModel.create({
      data: {
        migrationProjectId: input.migrationId,
        entityType: input.entityType,
        sourceCount: input.sourceCount,
        targetCount: destCount,
        countDifference: destCount - input.sourceCount,
        sourceSum: input.sourceSum || null,
        targetSum: destSum || null,
        sumDifference: (destSum && input.sourceSum !== undefined) ? (destSum - input.sourceSum) : null,
        statusCounts: JSON.stringify({ matched: countMatched }),
        status: countMatched && (sumMatched !== false) ? 'BALANCED' : 'DISCREPANCY',
        details: countMatched ? 'Reconciliação exata' : 'Divergência de contagem',
        reconciledAt: new Date()
      }
    });

    return {
      id: saved.id,
      migrationId: saved.migrationProjectId,
      entityType: saved.entityType,
      sourceCount: saved.sourceCount,
      destCount: saved.targetCount,
      countMatched,
      sourceSum: saved.sourceSum !== null ? saved.sourceSum : undefined,
      destSum: saved.targetSum !== null ? saved.targetSum : undefined,
      sumMatched,
      divergentIds,
      reconciledAt: saved.reconciledAt.toISOString ? saved.reconciledAt.toISOString() : saved.reconciledAt
    };
  }

  /**
   * List reconciliations for a migration project
   */
  public static async getReconciliations(migrationId: string): Promise<MigrationReconciliation[]> {
    const list = await prisma.migrationReconciliationModel.findMany({
      where: { migrationProjectId: migrationId }
    });

    return list.map(r => {
      const countMatched = r.countDifference === 0;
      const sumMatched = r.sumDifference === null || Math.abs(r.sumDifference) < 0.01;
      return {
        id: r.id,
        migrationId: r.migrationProjectId,
        entityType: r.entityType,
        sourceCount: r.sourceCount,
        destCount: r.targetCount,
        countMatched,
        sourceSum: r.sourceSum !== null ? r.sourceSum : undefined,
        destSum: r.targetSum !== null ? r.targetSum : undefined,
        sumMatched,
        divergentIds: countMatched ? [] : [`count_diff_${r.countDifference}`],
        reconciledAt: r.reconciledAt.toISOString ? r.reconciledAt.toISOString() : r.reconciledAt
      };
    });
  }
}
