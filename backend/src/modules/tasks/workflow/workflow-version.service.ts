import { prisma } from '../../../core/database/prisma';
import { AppError } from '../../../core/errors/AppError';

export class WorkflowVersionService {
  /**
   * Create immutable workflow version snapshot
   */
  public static async createSnapshot(workflowId: string, changeReason: string, userId: string): Promise<any> {
    if (!changeReason || !changeReason.trim()) {
      throw new AppError('O motivo da alteração de versão do workflow é obrigatório.', 400);
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { rules: true }
    });
    if (!workflow) throw new AppError('Workflow não encontrado.', 404);

    const nextVersion = (workflow.currentVersion || 1) + 1;

    // Snapshot of current rules
    const rulesSnapshot = JSON.stringify(workflow.rules || []);

    const versionRecord = await prisma.workflowVersion.create({
      data: {
        workflowId,
        version: nextVersion,
        rulesSnapshot,
        changeReason,
        createdByUserId: userId
      }
    });

    // Update workflow currentVersion
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        currentVersion: nextVersion
      }
    });

    return versionRecord;
  }
}
