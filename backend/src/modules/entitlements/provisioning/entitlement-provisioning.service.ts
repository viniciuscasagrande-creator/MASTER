import { prisma } from '../../../core/database/prisma';
import { ProducerEntitlementDTO, EntitlementStatus } from '../../../../../shared/types';
import { FeatureRegistry } from '../features/feature-registry';

export class EntitlementProvisioningService {
  /**
   * Idempotently provisions or updates entitlements from a commercial contract
   */
  public static async provisionFromContract(contractId: string): Promise<ProducerEntitlementDTO[]> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: contractId },
      include: {
        versions: true
      }
    });

    if (!contract) {
      throw new Error(`Contrato ${contractId} não encontrado.`);
    }

    // Determine current version
    const version = contract.versions?.find((v: any) => v.id === contract.currentVersionId) ||
                    contract.versions?.[0];

    if (!version) {
      return [];
    }

    // Load terms of this contract version
    const terms = await prisma.contractCommercialTerm.findMany({
      where: { contractVersionId: version.id }
    });

    const now = new Date();
    const effectiveFrom = contract.effectiveFrom ? new Date(contract.effectiveFrom) : (version.effectiveFrom ? new Date(version.effectiveFrom) : now);
    const effectiveUntil = contract.effectiveUntil ? new Date(contract.effectiveUntil) : (version.effectiveUntil ? new Date(version.effectiveUntil) : null);

    // Calculate status based on contract status and vigência dates
    let targetStatus: EntitlementStatus = 'ACTIVE';

    if (['TERMINATED', 'CANCELLED'].includes(contract.status)) {
      targetStatus = 'TERMINATED';
    } else if (contract.status === 'SUSPENDED') {
      targetStatus = 'SUSPENDED';
    } else if (contract.status === 'EXPIRED' || (effectiveUntil && effectiveUntil < now)) {
      targetStatus = 'EXPIRED';
    } else if (effectiveFrom > now || !['ACTIVE', 'SIGNED'].includes(contract.status)) {
      targetStatus = 'SCHEDULED';
    }

    const provisionedList: any[] = [];

    // Find all offeringIds from terms
    const offeringIds = new Set<string>();
    for (const t of terms) {
      if (t.offeringId) {
        offeringIds.add(t.offeringId);
      }
    }

    // If terms do not reference offeringId explicitly, check if termsSnapshotJson contains offerings
    if (offeringIds.size === 0 && version.termsSnapshotJson) {
      try {
        const snap = JSON.parse(version.termsSnapshotJson);
        if (Array.isArray(snap)) {
          for (const item of snap) {
            if (item.offeringId) offeringIds.add(item.offeringId);
          }
        }
      } catch {
        // ignore snapshot parse errors
      }
    }

    // For each offering, collect features (including child offerings from packages)
    const featuresToProvision = new Map<string, {
      feature: any;
      offeringId: string;
      offeringVersionId: string;
      offeringName: string;
      limitValue?: number | null;
      limitUnit?: string | null;
      configJson?: string | null;
    }>();

    for (const offeringId of offeringIds) {
      await this.collectOfferingFeatures(offeringId, new Set<string>(), featuresToProvision);
    }

    // Materialize into ProducerEntitlement
    for (const [featCode, featInfo] of featuresToProvision.entries()) {
      const existing = await prisma.producerEntitlement.findFirst({
        where: {
          producerId: contract.producerId,
          featureCode: featCode,
          sourceId: contract.id
        }
      });

      let entitlement: any;

      if (existing) {
        entitlement = await prisma.producerEntitlement.update({
          where: { id: existing.id },
          data: {
            status: targetStatus,
            effectiveFrom,
            effectiveUntil,
            offeringId: featInfo.offeringId,
            offeringVersionId: featInfo.offeringVersionId,
            configurationJson: featInfo.configJson || existing.configurationJson,
            version: (existing.version || 1) + 1
          },
          include: { limits: true }
        });
      } else {
        entitlement = await prisma.producerEntitlement.create({
          data: {
            producerId: contract.producerId,
            sourceType: 'CONTRACT',
            sourceId: contract.id,
            offeringId: featInfo.offeringId,
            offeringVersionId: featInfo.offeringVersionId,
            featureCode: featCode,
            featureId: featInfo.feature.id,
            status: targetStatus,
            effectiveFrom,
            effectiveUntil,
            enforcementMode: 'ENFORCE',
            configurationJson: featInfo.configJson,
            version: 1
          }
        });
      }

      // Provision or update limits
      const canonical = FeatureRegistry.getByCode(featCode);
      const limitKey = canonical?.defaultLimitKey || `${featCode}.limit`;
      const limitType = canonical?.defaultLimitType || (featInfo.limitValue !== undefined && featInfo.limitValue !== null ? 'COUNT' : 'BOOLEAN_FLAG');
      const limitVal = featInfo.limitValue !== undefined && featInfo.limitValue !== null ? featInfo.limitValue : (canonical?.defaultLimitValue ?? 1);
      const limitUnit = featInfo.limitUnit || canonical?.defaultLimitUnit || 'UNITS';

      // Check existing limit
      const existingLimits = await prisma.producerEntitlementLimit.findMany({
        where: { entitlementId: entitlement.id }
      });

      if (existingLimits.length === 0) {
        await prisma.producerEntitlementLimit.create({
          data: {
            entitlementId: entitlement.id,
            limitKey,
            limitType,
            value: limitVal,
            unit: limitUnit,
            effectiveFrom,
            effectiveUntil
          }
        });
      } else {
        await prisma.producerEntitlementLimit.update({
          where: { id: existingLimits[0].id },
          data: {
            value: limitVal,
            unit: limitUnit,
            effectiveFrom,
            effectiveUntil
          }
        });
      }

      // Log audit
      await prisma.entitlementAuditLog.create({
        data: {
          producerId: contract.producerId,
          featureCode: featCode,
          eventType: existing ? 'STATUS_CHANGED' : 'PROVISIONED',
          source: 'CONTRACT_ACTIVATION',
          detailsJson: JSON.stringify({
            contractId: contract.id,
            contractCode: contract.publicCode,
            status: targetStatus,
            offeringId: featInfo.offeringId
          }),
          actorName: contract.ownerName || 'Sistema Comercial'
        }
      });

      const hydrated = await prisma.producerEntitlement.findUnique({
        where: { id: entitlement.id },
        include: { limits: true, feature: true }
      });

      provisionedList.push(hydrated);
    }

    return provisionedList.map(item => this.mapToDTO(item));
  }

  /**
   * Recursively traverses offering compositions to collect features without cycles
   */
  private static async collectOfferingFeatures(
    offeringId: string,
    visited: Set<string>,
    results: Map<string, any>
  ): Promise<void> {
    if (visited.has(offeringId)) return;
    visited.add(offeringId);

    const offering = await prisma.commercialOffering.findUnique({
      where: { id: offeringId },
      include: {
        versions: true,
        compositionsAsParent: true
      }
    });

    if (!offering) return;

    // Locate active or current version
    const version = offering.versions?.find((v: any) => v.id === offering.currentVersionId) ||
                    offering.versions?.[0];

    if (version) {
      const ofs = await prisma.offeringFeature.findMany({
        where: { offeringVersionId: version.id, included: true },
        include: { feature: true }
      });

      for (const of of ofs) {
        const featCode = of.feature?.code || of.featureCode;
        if (featCode && !results.has(featCode)) {
          results.set(featCode, {
            feature: of.feature || { id: of.featureId, code: featCode, name: of.featureName || featCode },
            offeringId: offering.id,
            offeringVersionId: version.id,
            offeringName: offering.name,
            limitValue: of.limitValue,
            limitUnit: of.limitUnit,
            configJson: of.configurationJson
          });
        }
      }
    }

    // Traverse compositions if offering is PACKAGE
    const compositions = await prisma.commercialOfferingComposition.findMany({
      where: { parentOfferingId: offeringId }
    });

    for (const comp of compositions) {
      if (comp.childOfferingId) {
        await this.collectOfferingFeatures(comp.childOfferingId, visited, results);
      }
    }
  }

  public static mapToDTO(item: any): ProducerEntitlementDTO {
    return {
      id: item.id,
      producerId: item.producerId,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      offeringId: item.offeringId,
      offeringVersionId: item.offeringVersionId,
      featureCode: item.featureCode,
      featureId: item.featureId,
      featureName: item.feature?.name || FeatureRegistry.getByCode(item.featureCode)?.name || item.featureCode,
      featureCategory: item.feature?.category || FeatureRegistry.getByCode(item.featureCode)?.category || 'PLATFORM',
      status: item.status,
      effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom).toISOString() : null,
      effectiveUntil: item.effectiveUntil ? new Date(item.effectiveUntil).toISOString() : null,
      enforcementMode: item.enforcementMode || 'ENFORCE',
      configurationJson: item.configurationJson,
      notes: item.notes,
      version: item.version || 1,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
      limits: item.limits?.map((l: any) => ({
        id: l.id,
        entitlementId: l.entitlementId,
        limitKey: l.limitKey,
        limitType: l.limitType,
        value: l.value,
        unit: l.unit,
        effectiveFrom: l.effectiveFrom ? new Date(l.effectiveFrom).toISOString() : null,
        effectiveUntil: l.effectiveUntil ? new Date(l.effectiveUntil).toISOString() : null,
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString()
      })) || []
    };
  }
}
