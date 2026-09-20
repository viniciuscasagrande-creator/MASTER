import { prisma } from '../../core/database/prisma';
import {
  EntitlementCheckResultDTO,
  ProducerEntitlementDTO,
  ContractedProductSummaryDTO,
  EntitlementAuditLogDTO,
  EntitlementEnforcementMode
} from '../../../../shared/types';
import { LimitService } from './limits/limit.service';
import { usageProvider } from './limits/usage-provider';
import { EntitlementProvisioningService } from './provisioning/entitlement-provisioning.service';
import { FeatureRegistry } from './features/feature-registry';

export class EntitlementService {
  /**
   * Primary Evaluation Engine: Resolves if a producer has entitlement and quota for a feature
   */
  public static async hasEntitlement(
    producerId: string,
    featureCode: string,
    requestedAmount = 1
  ): Promise<EntitlementCheckResultDTO> {
    const now = new Date();

    // 1. Check for Active Administrative Overrides (highest precedence)
    const override = await prisma.entitlementOverride.findFirst({
      where: {
        producerId,
        featureCode,
        status: 'ACTIVE'
      }
    });

    if (override) {
      const until = new Date(override.effectiveUntil);
      const from = new Date(override.effectiveFrom);

      if (now >= from && now <= until) {
        if (override.action === 'REVOKE') {
          await this.logAudit({
            producerId,
            featureCode,
            eventType: 'CHECK_DENIED',
            source: 'MIDDLEWARE_ENFORCEMENT',
            detailsJson: JSON.stringify({ reason: 'Revogado por override administrativo', overrideId: override.id })
          });

          return {
            allowed: false,
            featureCode,
            producerId,
            reason: `Acesso ao recurso revogado temporariamente por override administrativo: ${override.reason}`,
            enforcementMode: 'ENFORCE'
          };
        }

        if (override.action === 'GRANT') {
          // Check custom limit on override if defined
          if (override.customLimitKey && override.customLimitValue !== null && override.customLimitValue !== undefined) {
            const currentUsage = await usageProvider.getUsage(producerId, override.customLimitKey);
            if (currentUsage + requestedAmount > override.customLimitValue) {
              return {
                allowed: false,
                featureCode,
                producerId,
                reason: `Limite customizado do override excedido (${currentUsage}/${override.customLimitValue})`,
                enforcementMode: 'ENFORCE',
                limit: {
                  key: override.customLimitKey,
                  limitValue: override.customLimitValue,
                  currentUsage,
                  exceeded: true
                }
              };
            }
          }

          return {
            allowed: true,
            featureCode,
            producerId,
            reason: `Acesso liberado por override administrativo: ${override.reason}`,
            enforcementMode: 'ENFORCE'
          };
        }
      }
    }

    // 2. Query Base Entitlement for this Producer and Feature
    const entitlement = await prisma.producerEntitlement.findFirst({
      where: {
        producerId,
        featureCode
      },
      include: {
        limits: true,
        feature: true
      }
    });

    const enforcementMode: EntitlementEnforcementMode = (entitlement?.enforcementMode as EntitlementEnforcementMode) || 'ENFORCE';

    // If no entitlement exists
    if (!entitlement) {
      return this.handleAccessDenied(
        producerId,
        featureCode,
        'Funcionalidade técnica não contratada pela organização produtora.',
        enforcementMode
      );
    }

    // Check vigência dates
    const effectiveFrom = entitlement.effectiveFrom ? new Date(entitlement.effectiveFrom) : null;
    const effectiveUntil = entitlement.effectiveUntil ? new Date(entitlement.effectiveUntil) : null;

    if (effectiveFrom && effectiveFrom > now) {
      return this.handleAccessDenied(
        producerId,
        featureCode,
        `Contrato assinado, mas o período de vigência desta funcionalidade inicia apenas em ${effectiveFrom.toLocaleDateString('pt-BR')}.`,
        enforcementMode,
        entitlement.id,
        'SCHEDULED'
      );
    }

    if (effectiveUntil && effectiveUntil < now) {
      return this.handleAccessDenied(
        producerId,
        featureCode,
        `Vigência contratual desta funcionalidade expirou em ${effectiveUntil.toLocaleDateString('pt-BR')}.`,
        enforcementMode,
        entitlement.id,
        'EXPIRED'
      );
    }

    if (entitlement.status === 'SUSPENDED') {
      return this.handleAccessDenied(
        producerId,
        featureCode,
        'Habilitação temporariamente suspensa devido a pendências cadastrais, jurídicas ou financeiras.',
        enforcementMode,
        entitlement.id,
        'SUSPENDED'
      );
    }

    if (['EXPIRED', 'TERMINATED'].includes(entitlement.status)) {
      return this.handleAccessDenied(
        producerId,
        featureCode,
        `Funcionalidade com status ${entitlement.status}. Contrato rescindido ou encerrado.`,
        enforcementMode,
        entitlement.id,
        entitlement.status
      );
    }

    // 3. Evaluate limits
    const limitResult = await LimitService.evaluateEntitlementLimits(producerId, entitlement.id, requestedAmount);

    if (limitResult && limitResult.exceeded) {
      if (enforcementMode === 'WARN') {
        const warningMsg = `Atenção: Limite do recurso '${featureCode}' atingido (${limitResult.currentUsage}/${limitResult.limitValue} ${limitResult.unit}).`;
        await this.logAudit({
          producerId,
          featureCode,
          eventType: 'CHECK_WARNING',
          source: 'MIDDLEWARE_ENFORCEMENT',
          detailsJson: JSON.stringify({ warning: warningMsg, limit: limitResult })
        });

        return {
          allowed: true,
          featureCode,
          producerId,
          entitlementId: entitlement.id,
          status: entitlement.status,
          enforcementMode,
          warningMessage: warningMsg,
          limit: {
            key: limitResult.limitKey,
            limitValue: limitResult.limitValue,
            currentUsage: limitResult.currentUsage,
            exceeded: true
          }
        };
      }

      if (enforcementMode === 'OBSERVE') {
        await this.logAudit({
          producerId,
          featureCode,
          eventType: 'LIMIT_EXCEEDED',
          source: 'OBSERVE_TELEMETRY',
          detailsJson: JSON.stringify({ limit: limitResult })
        });

        return {
          allowed: true,
          featureCode,
          producerId,
          entitlementId: entitlement.id,
          status: entitlement.status,
          enforcementMode,
          limit: {
            key: limitResult.limitKey,
            limitValue: limitResult.limitValue,
            currentUsage: limitResult.currentUsage,
            exceeded: true
          }
        };
      }

      // ENFORCE mode
      await this.logAudit({
        producerId,
        featureCode,
        eventType: 'LIMIT_EXCEEDED',
        source: 'MIDDLEWARE_ENFORCEMENT',
        detailsJson: JSON.stringify({ limit: limitResult })
      });

      return {
        allowed: false,
        featureCode,
        producerId,
        entitlementId: entitlement.id,
        status: entitlement.status,
        enforcementMode,
        reason: `Limite operacional contratado atingido: ${limitResult.currentUsage} de ${limitResult.limitValue} ${limitResult.unit}.`,
        limit: {
          key: limitResult.limitKey,
          limitValue: limitResult.limitValue,
          currentUsage: limitResult.currentUsage,
          exceeded: true
        }
      };
    }

    // 4. Access Allowed
    return {
      allowed: true,
      featureCode,
      producerId,
      entitlementId: entitlement.id,
      status: entitlement.status,
      enforcementMode,
      limit: limitResult ? {
        key: limitResult.limitKey,
        limitValue: limitResult.limitValue,
        currentUsage: limitResult.currentUsage,
        exceeded: false
      } : undefined
    };
  }

  private static async handleAccessDenied(
    producerId: string,
    featureCode: string,
    reason: string,
    enforcementMode: EntitlementEnforcementMode,
    entitlementId?: string,
    status?: any
  ): Promise<EntitlementCheckResultDTO> {
    if (enforcementMode === 'DISABLED' || enforcementMode === 'OBSERVE') {
      await this.logAudit({
        producerId,
        featureCode,
        eventType: 'CHECK_WARNING',
        source: 'OBSERVE_MODE',
        detailsJson: JSON.stringify({ mode: enforcementMode, reason })
      });

      return {
        allowed: true,
        featureCode,
        producerId,
        entitlementId,
        status,
        enforcementMode,
        reason: `(Modo ${enforcementMode}) Acesso permitido para observação. Causa teórica: ${reason}`
      };
    }

    if (enforcementMode === 'WARN') {
      return {
        allowed: true,
        featureCode,
        producerId,
        entitlementId,
        status,
        enforcementMode,
        warningMessage: `Aviso comercial: ${reason}`
      };
    }

    // Strict ENFORCE
    await this.logAudit({
      producerId,
      featureCode,
      eventType: 'CHECK_DENIED',
      source: 'MIDDLEWARE_ENFORCEMENT',
      detailsJson: JSON.stringify({ reason })
    });

    return {
      allowed: false,
      featureCode,
      producerId,
      entitlementId,
      status,
      enforcementMode: 'ENFORCE',
      reason
    };
  }

  /**
   * Lists all entitlements of a producer with real-time usage metrics
   */
  public static async listProducerEntitlements(producerId: string): Promise<ProducerEntitlementDTO[]> {
    const list = await prisma.producerEntitlement.findMany({
      where: { producerId },
      include: { limits: true, feature: true },
      orderBy: { createdAt: 'desc' }
    });

    const dtos: ProducerEntitlementDTO[] = [];

    for (const item of list) {
      const dto = EntitlementProvisioningService.mapToDTO(item);

      // Check if active override exists
      const override = await prisma.entitlementOverride.findFirst({
        where: { producerId, featureCode: item.featureCode, status: 'ACTIVE' }
      });
      dto.hasActiveOverride = !!override;

      // Populate currentUsage in limits
      if (dto.limits && dto.limits.length > 0) {
        for (const lim of dto.limits) {
          lim.currentUsage = await usageProvider.getUsage(producerId, lim.limitKey);
          lim.isExceeded = lim.currentUsage > lim.value;
        }
      }

      // If offeringId, hydrate offeringName
      if (item.offeringId) {
        const off = await prisma.commercialOffering.findUnique({ where: { id: item.offeringId } });
        if (off) dto.offeringName = off.name;
      }

      dtos.push(dto);
    }

    return dtos;
  }

  /**
   * Generates a high-level summary of contracted products for the Producer Profile UI
   */
  public static async listContractedProducts(producerId: string): Promise<ContractedProductSummaryDTO[]> {
    const entitlements = await this.listProducerEntitlements(producerId);

    // Group by sourceId (contractId) or offeringId
    const productMap = new Map<string, ContractedProductSummaryDTO>();

    for (const ent of entitlements) {
      const key = ent.offeringId || ent.sourceId || 'LEGACY';

      let summary = productMap.get(key);
      if (!summary) {
        let offName = ent.offeringName || 'Plano Personalizado / Migração';
        let offType: any = 'PACKAGE';
        let publicCode: string | null = null;
        let contractCode: string | null = null;

        if (ent.offeringId) {
          const offering = await prisma.commercialOffering.findUnique({ where: { id: ent.offeringId } });
          if (offering) {
            offName = offering.name;
            offType = offering.type;
            publicCode = offering.publicCode;
          }
        }

        if (ent.sourceId && ent.sourceType === 'CONTRACT') {
          const contract = await prisma.commercialContract.findUnique({ where: { id: ent.sourceId } });
          if (contract) {
            contractCode = contract.publicCode;
          }
        }

        summary = {
          offeringId: ent.offeringId || key,
          offeringName: offName,
          offeringType: offType,
          publicCode,
          contractId: ent.sourceId || 'MIGRATION',
          contractPublicCode: contractCode,
          status: (ent.status === 'ACTIVE' || ent.status === 'SCHEDULED' || ent.status === 'SUSPENDED') ? ent.status : 'EXPIRED',
          effectiveFrom: ent.effectiveFrom,
          effectiveUntil: ent.effectiveUntil,
          features: []
        };
        productMap.set(key, summary);
      }

      summary.features.push({
        code: ent.featureCode,
        name: ent.featureName || ent.featureCode,
        category: ent.featureCategory || 'PLATFORM',
        status: ent.status,
        limits: (ent.limits || []).map(l => ({
          key: l.limitKey,
          value: l.value,
          unit: l.unit,
          currentUsage: l.currentUsage || 0,
          isExceeded: !!l.isExceeded
        }))
      });
    }

    return Array.from(productMap.values());
  }

  public static async listAuditLogs(producerId: string): Promise<EntitlementAuditLogDTO[]> {
    const list = await prisma.entitlementAuditLog.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' }
    });

    return list.map((item: any) => ({
      id: item.id,
      producerId: item.producerId,
      featureCode: item.featureCode,
      eventType: item.eventType,
      source: item.source,
      detailsJson: item.detailsJson,
      actorId: item.actorId,
      actorName: item.actorName,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  private static async logAudit(data: {
    producerId: string;
    featureCode?: string;
    eventType: string;
    source: string;
    detailsJson?: string;
    actorId?: string;
    actorName?: string;
  }): Promise<void> {
    try {
      await prisma.entitlementAuditLog.create({ data });
    } catch {
      // Best effort audit logging
    }
  }
}
