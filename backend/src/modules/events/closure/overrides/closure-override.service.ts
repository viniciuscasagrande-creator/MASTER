import { prisma } from '../../../../core/database/prisma';
import { ClosureOverrideDTO } from '@shared/types/index';
import { AuditService } from '../../../audit/audit.service';

export class ClosureOverrideService {
  /**
   * Registers an override for a closure check blocker.
   */
  public static async applyOverride(params: {
    scope: 'SESSION' | 'EVENT';
    targetId: string;
    checkCode: string;
    justification: string;
    authorizedBy: string;
    authorizedByName: string;
  }): Promise<ClosureOverrideDTO> {
    if (!params.justification || params.justification.trim().length < 10) {
      throw new Error('A justificativa de override é obrigatória e deve conter ao menos 10 caracteres explicativos.');
    }

    const created = await prisma.closureOverride.create({
      data: {
        scope: params.scope,
        targetId: params.targetId,
        checkCode: params.checkCode,
        justification: params.justification.trim(),
        authorizedBy: params.authorizedBy,
        authorizedByName: params.authorizedByName,
        createdAt: new Date()
      }
    });

    await AuditService.log({
      action: 'CLOSURE_BLOCKER_OVERRIDDEN',
      resource: params.scope === 'SESSION' ? 'event_session' : 'event',
      resourceId: params.targetId,
      userId: params.authorizedBy,
      details: {
        checkCode: params.checkCode,
        justification: params.justification
      }
    });

    return this.mapToDTO(created);
  }

  /**
   * Checks if an override exists for a specific check code and target.
   */
  public static async hasOverride(scope: 'SESSION' | 'EVENT', targetId: string, checkCode: string): Promise<boolean> {
    const override = await prisma.closureOverride.findFirst({
      where: { scope, targetId, checkCode }
    });
    return !!override;
  }

  /**
   * Lists overrides applied to a target.
   */
  public static async listOverrides(scope: 'SESSION' | 'EVENT', targetId: string): Promise<ClosureOverrideDTO[]> {
    const list = await prisma.closureOverride.findMany({
      where: { scope, targetId }
    });
    return list.map((o: any) => this.mapToDTO(o));
  }

  private static mapToDTO(o: any): ClosureOverrideDTO {
    return {
      id: o.id,
      scope: o.scope as 'SESSION' | 'EVENT',
      targetId: o.targetId,
      checkCode: o.checkCode,
      justification: o.justification,
      authorizedBy: o.authorizedBy,
      authorizedByName: o.authorizedByName,
      createdAt: new Date(o.createdAt).toISOString()
    };
  }
}
