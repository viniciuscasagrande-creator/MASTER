import { prisma } from '../../database/prisma';
import { AppError } from '../../errors/AppError';
import { AuthenticatedUser } from '../../middleware/authenticate';
import { DomainEvents } from '../../../events/DomainEvents';
import { ConfigurationRepository } from '../configuration.repository';

export class RollbackService {
  /**
   * Performs a rollback by creating a new version v(n+1) containing the rules of the target version.
   * Old versions are never deleted or silently overwritten.
   */
  public static async rollbackPolicy(
    policyId: string,
    targetVersionNumber: number,
    reason: string,
    user: AuthenticatedUser
  ): Promise<any> {
    if (!reason || !reason.trim()) {
      throw new AppError('O motivo do rollback é obrigatório.', 400);
    }

    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError('Política não encontrada.', 404);

    const targetVersion = await prisma.policyVersion.findFirst({
      where: { policyId, versionNumber: targetVersionNumber }
    });

    if (!targetVersion) {
      throw new AppError(`Versão de destino v${targetVersionNumber} não encontrada.`, 404);
    }

    const currentVersion = policy.currentVersion || 1;
    const newVersionNumber = currentVersion + 1;

    // Parse target rules
    const targetRules: any[] = JSON.parse(targetVersion.rulesSnapshot || '[]');

    // Create rules for the new version
    const newRules: any[] = [];
    for (let i = 0; i < targetRules.length; i++) {
      const tr = targetRules[i];
      const r = await prisma.policyRule.create({
        data: {
          policyId,
          version: newVersionNumber,
          name: tr.name,
          description: tr.description || null,
          priority: tr.priority || (i + 1) * 10,
          conditionJson: typeof tr.conditionJson === 'string' ? tr.conditionJson : JSON.stringify(tr.conditions || []),
          actionJson: typeof tr.actionJson === 'string' ? tr.actionJson : JSON.stringify(tr.action || { decision: true }),
          orderIndex: tr.orderIndex || (i + 1),
          isActive: true
        }
      });
      newRules.push(r);
    }

    // Create new version record
    const rollbackVersion = await prisma.policyVersion.create({
      data: {
        policyId,
        versionNumber: newVersionNumber,
        status: policy.status,
        rulesSnapshot: JSON.stringify(newRules),
        changeReason: `Rollback para a versão v${targetVersionNumber}: ${reason}`,
        createdBy: user.id,
        creatorName: user.name
      }
    });

    // Update policy current version
    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        currentVersion: newVersionNumber
      },
      include: { rules: true, versions: true }
    });

    // Log audit
    await ConfigurationRepository.logAudit(
      'POLICY',
      policy.id,
      policy.code,
      'ROLLBACK',
      policy.scopeType,
      policy.producerId,
      policy.eventId,
      { version: currentVersion },
      { version: newVersionNumber, rolledBackTo: targetVersionNumber },
      reason,
      user.id,
      user.name
    );

    // Dispatch event
    DomainEvents.dispatch('POLICY_ROLLED_BACK', {
      resourceType: 'POLICY',
      resourceId: policy.id,
      actorUserId: user.id,
      data: {
        code: policy.code,
        previousVersion: currentVersion,
        newVersion: newVersionNumber,
        targetVersion: targetVersionNumber,
        reason
      }
    });

    return {
      success: true,
      policy: updatedPolicy,
      newVersion: rollbackVersion
    };
  }
}
