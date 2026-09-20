import { prisma } from '../../../core/database/prisma';
import { LegacyMigrationDTO, ProducerEntitlementDTO } from '../../../../../shared/types';
import { FeatureRegistry } from '../features/feature-registry';
import { EntitlementProvisioningService } from '../provisioning/entitlement-provisioning.service';

export class EntitlementMigrationService {
  /**
   * Migrates legacy producers into the entitlement system with explicit origin tracking
   */
  public static async migrateLegacyProducer(
    dto: LegacyMigrationDTO,
    actorId: string,
    actorName?: string
  ): Promise<ProducerEntitlementDTO[]> {
    if (!dto.producerId) {
      throw new Error('Identificador do produtor é obrigatório.');
    }
    if (!dto.features || dto.features.length === 0) {
      throw new Error('Ao menos uma funcionalidade técnica deve ser selecionada para a migração.');
    }

    const producer = await prisma.producer.findUnique({
      where: { id: dto.producerId }
    });

    if (!producer) {
      throw new Error(`Produtor ${dto.producerId} não encontrado.`);
    }

    const batchId = `MIGRATION_${Date.now()}`;
    const now = new Date();
    const effectiveUntil = dto.effectiveUntil ? new Date(dto.effectiveUntil) : null;
    const migratedList: any[] = [];

    for (const featItem of dto.features) {
      const featDef = FeatureRegistry.getByCode(featItem.featureCode);
      const featureId = (await prisma.commercialFeature.findUnique({ where: { code: featItem.featureCode } }))?.id || null;

      // Upsert entitlement
      const existing = await prisma.producerEntitlement.findFirst({
        where: {
          producerId: dto.producerId,
          featureCode: featItem.featureCode
        }
      });

      let entitlement: any;

      if (existing) {
        entitlement = await prisma.producerEntitlement.update({
          where: { id: existing.id },
          data: {
            sourceType: 'LEGACY_MIGRATION',
            sourceId: batchId,
            status: 'ACTIVE',
            effectiveFrom: now,
            effectiveUntil,
            notes: featItem.notes || dto.reason || 'Migração legada autorizada',
            version: (existing.version || 1) + 1
          }
        });
      } else {
        entitlement = await prisma.producerEntitlement.create({
          data: {
            producerId: dto.producerId,
            sourceType: 'LEGACY_MIGRATION',
            sourceId: batchId,
            featureCode: featItem.featureCode,
            featureId,
            status: 'ACTIVE',
            effectiveFrom: now,
            effectiveUntil,
            enforcementMode: 'ENFORCE',
            notes: featItem.notes || dto.reason || 'Migração legada autorizada',
            version: 1
          }
        });
      }

      // Provision limits if provided or default
      if (featItem.limits && featItem.limits.length > 0) {
        for (const lim of featItem.limits) {
          const existingLimit = await prisma.producerEntitlementLimit.findFirst({
            where: { entitlementId: entitlement.id, limitKey: lim.limitKey }
          });

          if (existingLimit) {
            await prisma.producerEntitlementLimit.update({
              where: { id: existingLimit.id },
              data: {
                value: lim.value,
                unit: lim.unit || 'UNITS',
                effectiveFrom: now,
                effectiveUntil
              }
            });
          } else {
            await prisma.producerEntitlementLimit.create({
              data: {
                entitlementId: entitlement.id,
                limitKey: lim.limitKey,
                limitType: 'COUNT',
                value: lim.value,
                unit: lim.unit || 'UNITS',
                effectiveFrom: now,
                effectiveUntil
              }
            });
          }
        }
      } else if (featDef?.defaultLimitKey && featDef.defaultLimitValue) {
        const existingLimit = await prisma.producerEntitlementLimit.findFirst({
          where: { entitlementId: entitlement.id, limitKey: featDef.defaultLimitKey }
        });

        if (!existingLimit) {
          await prisma.producerEntitlementLimit.create({
            data: {
              entitlementId: entitlement.id,
              limitKey: featDef.defaultLimitKey,
              limitType: featDef.defaultLimitType || 'COUNT',
              value: featDef.defaultLimitValue,
              unit: featDef.defaultLimitUnit || 'UNITS',
              effectiveFrom: now,
              effectiveUntil
            }
          });
        }
      }

      // Audit Log
      await prisma.entitlementAuditLog.create({
        data: {
          producerId: dto.producerId,
          featureCode: featItem.featureCode,
          eventType: 'PROVISIONED',
          source: 'MIGRATION_JOB',
          detailsJson: JSON.stringify({
            batchId,
            reason: dto.reason,
            notes: featItem.notes
          }),
          actorId,
          actorName
        }
      });

      const hydrated = await prisma.producerEntitlement.findUnique({
        where: { id: entitlement.id },
        include: { limits: true, feature: true }
      });

      migratedList.push(hydrated);
    }

    return migratedList.map(item => EntitlementProvisioningService.mapToDTO(item));
  }
}
