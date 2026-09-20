import { prisma } from '../../../core/database/prisma';
import { CreateEntitlementOverrideDTO, EntitlementOverrideDTO } from '../../../../../shared/types';
import { FeatureRegistry } from '../features/feature-registry';

export class EntitlementOverrideService {
  /**
   * Creates an audited temporary administrative override
   */
  public static async createOverride(
    dto: CreateEntitlementOverrideDTO,
    actorId: string,
    actorName?: string
  ): Promise<EntitlementOverrideDTO> {
    if (!dto.producerId) {
      throw new Error('Identificador do produtor é obrigatório.');
    }
    if (!dto.featureCode) {
      throw new Error('Código do recurso (featureCode) é obrigatório.');
    }
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new Error('Justificativa detalhada é obrigatória (mínimo de 10 caracteres).');
    }
    if (!dto.effectiveUntil) {
      throw new Error('Data limite de vigência do override é obrigatória.');
    }

    const until = new Date(dto.effectiveUntil);
    const now = new Date();
    if (until <= now) {
      throw new Error('A data de vigência final do override deve ser futura.');
    }

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : now;

    // Check if another ACTIVE override exists for the same producer + feature
    const existing = await prisma.entitlementOverride.findFirst({
      where: {
        producerId: dto.producerId,
        featureCode: dto.featureCode,
        status: 'ACTIVE'
      }
    });

    if (existing) {
      // Deactivate previous override
      await prisma.entitlementOverride.update({
        where: { id: existing.id },
        data: { status: 'REVOKED' }
      });
    }

    const override = await prisma.entitlementOverride.create({
      data: {
        producerId: dto.producerId,
        featureCode: dto.featureCode,
        action: dto.action,
        customLimitKey: dto.customLimitKey || null,
        customLimitValue: dto.customLimitValue !== undefined ? dto.customLimitValue : null,
        reason: dto.reason,
        status: 'ACTIVE',
        effectiveFrom,
        effectiveUntil: until,
        approvedBy: dto.approvedBy,
        approvedByName: dto.approvedByName || 'Diretoria / Gestão Comercial',
        createdBy: actorId,
        createdByName: actorName || 'Administrador'
      }
    });

    // Audit log
    await prisma.entitlementAuditLog.create({
      data: {
        producerId: dto.producerId,
        featureCode: dto.featureCode,
        eventType: 'OVERRIDE_APPLIED',
        source: 'MANUAL_OVERRIDE',
        detailsJson: JSON.stringify({
          overrideId: override.id,
          action: dto.action,
          reason: dto.reason,
          effectiveUntil: until.toISOString()
        }),
        actorId,
        actorName
      }
    });

    return this.mapToDTO(override);
  }

  public static async listOverrides(producerId?: string, status?: string): Promise<EntitlementOverrideDTO[]> {
    const where: any = {};
    if (producerId) where.producerId = producerId;
    if (status) where.status = status;

    const list = await prisma.entitlementOverride.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return list.map(item => this.mapToDTO(item));
  }

  public static async revokeOverride(
    overrideId: string,
    actorId: string,
    actorName?: string
  ): Promise<EntitlementOverrideDTO> {
    const override = await prisma.entitlementOverride.findUnique({
      where: { id: overrideId }
    });

    if (!override) {
      throw new Error(`Override ${overrideId} não encontrado.`);
    }

    const updated = await prisma.entitlementOverride.update({
      where: { id: overrideId },
      data: { status: 'REVOKED' }
    });

    await prisma.entitlementAuditLog.create({
      data: {
        producerId: override.producerId,
        featureCode: override.featureCode,
        eventType: 'STATUS_CHANGED',
        source: 'MANUAL_OVERRIDE',
        detailsJson: JSON.stringify({
          overrideId,
          action: 'REVOKED',
          reason: 'Revogação manual antecipada'
        }),
        actorId,
        actorName
      }
    });

    return this.mapToDTO(updated);
  }

  public static mapToDTO(item: any): EntitlementOverrideDTO {
    const feat = FeatureRegistry.getByCode(item.featureCode);
    return {
      id: item.id,
      producerId: item.producerId,
      featureCode: item.featureCode,
      featureName: feat?.name || item.featureCode,
      action: item.action,
      customLimitKey: item.customLimitKey,
      customLimitValue: item.customLimitValue,
      reason: item.reason,
      status: item.status,
      effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom).toISOString() : new Date().toISOString(),
      effectiveUntil: new Date(item.effectiveUntil).toISOString(),
      approvedBy: item.approvedBy,
      approvedByName: item.approvedByName,
      createdBy: item.createdBy,
      createdByName: item.createdByName,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
