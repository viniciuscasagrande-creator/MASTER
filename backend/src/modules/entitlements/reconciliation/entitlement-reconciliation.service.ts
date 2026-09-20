import { prisma } from '../../../core/database/prisma';
import { ReconcileEntitlementsResultDTO, EntitlementStatus } from '../../../../../shared/types';
import { EntitlementProvisioningService } from '../provisioning/entitlement-provisioning.service';

export class EntitlementReconciliationService {
  /**
   * Reconciles entitlements for a single producer
   */
  public static async reconcileProducer(producerId: string): Promise<ReconcileEntitlementsResultDTO> {
    const contracts = await prisma.commercialContract.findMany({
      where: { producerId }
    });

    let createdCount = 0;
    let updatedCount = 0;
    let expiredCount = 0;
    let activatedCount = 0;

    const now = new Date();

    for (const contract of contracts) {
      // Re-provision contract to sync features and calculate status
      const beforeCount = await prisma.producerEntitlement.count({
        where: { producerId, sourceId: contract.id }
      });

      await EntitlementProvisioningService.provisionFromContract(contract.id);

      const afterCount = await prisma.producerEntitlement.count({
        where: { producerId, sourceId: contract.id }
      });

      if (afterCount > beforeCount) {
        createdCount += (afterCount - beforeCount);
      } else {
        updatedCount += afterCount;
      }
    }

    // Direct check on existing entitlements for date expiration or scheduled activation
    const entitlements = await prisma.producerEntitlement.findMany({
      where: { producerId }
    });

    for (const ent of entitlements) {
      const from = ent.effectiveFrom ? new Date(ent.effectiveFrom) : null;
      const until = ent.effectiveUntil ? new Date(ent.effectiveUntil) : null;

      let newStatus: EntitlementStatus = ent.status as EntitlementStatus;

      if (until && until < now && ent.status !== 'EXPIRED' && ent.status !== 'TERMINATED') {
        newStatus = 'EXPIRED';
        expiredCount++;
      } else if (from && from <= now && ent.status === 'SCHEDULED') {
        newStatus = 'ACTIVE';
        activatedCount++;
      }

      if (newStatus !== ent.status) {
        await prisma.producerEntitlement.update({
          where: { id: ent.id },
          data: { status: newStatus }
        });

        await prisma.entitlementAuditLog.create({
          data: {
            producerId,
            featureCode: ent.featureCode,
            eventType: 'RECONCILED',
            source: 'RECONCILIATION_JOB',
            detailsJson: JSON.stringify({
              previousStatus: ent.status,
              newStatus,
              reason: 'Vigência temporal alcançada ou expirada'
            }),
            actorName: 'Motor de Reconciliação'
          }
        });
      }
    }

    // Reconcile Overrides
    const overrides = await prisma.entitlementOverride.findMany({
      where: { producerId, status: 'ACTIVE' }
    });

    for (const ovr of overrides) {
      const until = new Date(ovr.effectiveUntil);
      if (until < now) {
        await prisma.entitlementOverride.update({
          where: { id: ovr.id },
          data: { status: 'EXPIRED' }
        });

        await prisma.entitlementAuditLog.create({
          data: {
            producerId,
            featureCode: ovr.featureCode,
            eventType: 'STATUS_CHANGED',
            source: 'RECONCILIATION_JOB',
            detailsJson: JSON.stringify({
              overrideId: ovr.id,
              action: ovr.action,
              status: 'EXPIRED',
              reason: 'Data limite de override temporário expirada'
            }),
            actorName: 'Motor de Reconciliação'
          }
        });
      }
    }

    return {
      producerId,
      evaluatedContracts: contracts.length,
      createdEntitlements: createdCount,
      updatedEntitlements: updatedCount,
      expiredEntitlements: expiredCount,
      activatedEntitlements: activatedCount,
      reconciledAt: now.toISOString()
    };
  }

  /**
   * Globally reconciles all active producers in the system
   */
  public static async reconcileAll(): Promise<ReconcileEntitlementsResultDTO> {
    const producers = await prisma.producer.findMany({
      select: { id: true }
    });

    let totalContracts = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalExpired = 0;
    let totalActivated = 0;

    for (const p of producers) {
      const res = await this.reconcileProducer(p.id);
      totalContracts += res.evaluatedContracts;
      totalCreated += res.createdEntitlements;
      totalUpdated += res.updatedEntitlements;
      totalExpired += res.expiredEntitlements;
      totalActivated += res.activatedEntitlements;
    }

    return {
      evaluatedContracts: totalContracts,
      createdEntitlements: totalCreated,
      updatedEntitlements: totalUpdated,
      expiredEntitlements: totalExpired,
      activatedEntitlements: totalActivated,
      reconciledAt: new Date().toISOString()
    };
  }
}
