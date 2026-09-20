import { prisma } from '../../../../core/database/prisma';
import { CommercialCatalogProvider } from '../../catalog/commercial-catalog.provider';
import { ContractEffectiveTermsService } from '../../contracts/terms/effective-terms.service';
import { EntitlementService } from '../../../entitlements/entitlement.service';
import { CommercialChangeImpactDTO, CommercialMovementType } from '../../../../../../shared/types';

export class CommercialChangeImpactService {
  private static catalogProvider = new CommercialCatalogProvider();

  /**
   * Simula e compara o impacto comercial e técnico de uma movimentação (Upgrade, Downgrade, Expansão, Renovação)
   * REGRA FUNDAMENTAL: Este serviço é 100% consultivo. Ele NÃO altera contratos, NÃO altera habilitações e NÃO altera faturamento.
   */
  public static async simulateChangeImpact(params: {
    producerId: string;
    movementType: CommercialMovementType;
    originContractId?: string;
    currentOfferingId?: string;
    proposedOfferingId: string;
  }): Promise<CommercialChangeImpactDTO> {
    const producer = await prisma.producer.findUnique({
      where: { id: params.producerId }
    });

    if (!producer) {
      const err: any = new Error(`Produtor ${params.producerId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Resolve o estado pretendido (Proposed Offering)
    const proposedSnapshot = await this.catalogProvider.getOfferingSnapshot(params.proposedOfferingId);
    if (!proposedSnapshot) {
      const err: any = new Error(`Oferta pretendida ${params.proposedOfferingId} não encontrada no catálogo.`);
      err.statusCode = 404;
      throw err;
    }

    const proposedOffering: {
      id: string;
      name: string;
      code: string;
      type: string;
      terms: Array<{ type: string; value: number; payer: string }>;
      features: Array<{ key: string; name: string; category: string; limits?: any }>;
    } = {
      id: proposedSnapshot.offering.id,
      name: proposedSnapshot.offering.name,
      code: proposedSnapshot.offering.code,
      type: String(proposedSnapshot.offering.type),
      terms: (proposedSnapshot.defaultTerms || []).map(t => ({
        type: String(t.termType),
        value: t.percentage || t.amount || 0,
        payer: String(t.payer)
      })),
      features: (proposedSnapshot.features || []).map(f => {
        let limits: any = null;
        if (f.limitValue !== null && f.limitValue !== undefined) {
          limits = { [f.limitUnit || 'quantity']: f.limitValue };
        } else if (f.configurationJson) {
          try { limits = JSON.parse(f.configurationJson); } catch { limits = null; }
        }
        return {
          key: f.featureCode || f.featureId,
          name: f.featureName || f.featureCode || 'Recurso',
          category: f.featureCategory || 'GERAL',
          limits
        };
      })
    };

    // 2. Resolve o estado atual (Current Offering / Contracted Terms / Entitlements)
    let currentOffering: CommercialChangeImpactDTO['currentOffering'] = null;

    if (params.currentOfferingId) {
      const currentSnapshot = await this.catalogProvider.getOfferingSnapshot(params.currentOfferingId);
      if (currentSnapshot) {
        currentOffering = {
          id: currentSnapshot.offering.id,
          name: currentSnapshot.offering.name,
          code: currentSnapshot.offering.code,
          type: String(currentSnapshot.offering.type),
          terms: (currentSnapshot.defaultTerms || []).map(t => ({
            type: String(t.termType),
            value: t.percentage || t.amount || 0,
            payer: String(t.payer)
          })),
          features: (currentSnapshot.features || []).map(f => {
            let limits: any = null;
            if (f.limitValue !== null && f.limitValue !== undefined) {
              limits = { [f.limitUnit || 'quantity']: f.limitValue };
            } else if (f.configurationJson) {
              try { limits = JSON.parse(f.configurationJson); } catch { limits = null; }
            }
            return {
              key: f.featureCode || f.featureId,
              name: f.featureName || f.featureCode || 'Recurso',
              category: f.featureCategory || 'GERAL',
              limits
            };
          })
        };
      }
    }

    // Se não tiver snapshot explícito pelo ID de oferta, busca os termos contratuais efetivos vigentes
    if (!currentOffering) {
      const effectiveTerms = await ContractEffectiveTermsService.getEffectiveTerms(params.producerId);
      const entitlements = await EntitlementService.listProducerEntitlements(params.producerId);

      const effectiveTermsList = (effectiveTerms?.terms || []).map(t => ({
        type: String(t.termType),
        value: t.percentage || t.amount || 0,
        payer: String(t.payer)
      }));

      const featureList = entitlements.map(e => ({
        key: e.featureCode,
        name: e.featureName || e.featureCode,
        category: e.featureCategory || 'GERAL',
        limits: (e.limits || []).reduce((acc: any, l: any) => {
          acc[l.limitKey] = l.value;
          return acc;
        }, {})
      }));

      if (effectiveTermsList.length > 0 || featureList.length > 0) {
        currentOffering = {
          id: effectiveTerms?.contractId || 'current_contract',
          name: 'Contrato Vigente',
          code: 'CONTRACT_EFFECTIVE',
          type: 'PLAN',
          terms: effectiveTermsList,
          features: featureList
        };
      }
    }

    // 3. Diferença entre Features (Adicionadas, Removidas, Mantidas)
    const currentFeatureKeys = new Set((currentOffering?.features || []).map(f => f.key));
    const proposedFeatureKeys = new Set(proposedOffering.features.map(f => f.key));

    const featuresAdded: Array<{ key: string; name: string; category: string }> = proposedOffering.features
      .filter(f => !currentFeatureKeys.has(f.key))
      .map(f => ({ key: f.key, name: f.name, category: f.category }));

    const featuresRemoved: Array<{ key: string; name: string; category: string }> = (currentOffering?.features || [])
      .filter(f => !proposedFeatureKeys.has(f.key))
      .map(f => ({ key: f.key, name: f.name, category: f.category }));

    const featuresMaintained: Array<{ key: string; name: string; category: string }> = proposedOffering.features
      .filter(f => currentFeatureKeys.has(f.key))
      .map(f => ({ key: f.key, name: f.name, category: f.category }));

    // 4. Comparativo de Limites Operacionais
    const limitChanges: CommercialChangeImpactDTO['impactAnalysis']['limitChanges'] = [];
    const operationalRisks: string[] = [];

    for (const proposedFeature of proposedOffering.features) {
      const currentFeature = (currentOffering?.features || []).find(f => f.key === proposedFeature.key);
      const proposedLimits = proposedFeature.limits || {};
      const currentLimits = currentFeature?.limits || {};

      const allLimitKeys = new Set([...Object.keys(currentLimits), ...Object.keys(proposedLimits)]);

      for (const limitKey of allLimitKeys) {
        const curVal = currentLimits[limitKey] !== undefined ? Number(currentLimits[limitKey]) : null;
        const propVal = proposedLimits[limitKey] !== undefined ? Number(proposedLimits[limitKey]) : null;
        const difference = (curVal !== null && propVal !== null) ? (propVal - curVal) : null;

        if (curVal !== propVal) {
          limitChanges.push({
            featureKey: proposedFeature.key,
            featureName: proposedFeature.name,
            limitKey,
            currentValue: curVal,
            proposedValue: propVal,
            difference
          });

          if (difference !== null && difference < 0) {
            operationalRisks.push(
              `Redução de capacidade: O limite '${limitKey}' na funcionalidade '${proposedFeature.name}' será reduzido de ${curVal} para ${propVal}.`
            );
          }
        }
      }
    }

    // Alertas de perda de funcionalidades (Downgrades)
    if (featuresRemoved.length > 0) {
      for (const removed of featuresRemoved) {
        operationalRisks.push(
          `Revogação de recurso: A funcionalidade '${removed.name}' (${removed.key}) NÃO faz parte da nova oferta pretendida e será desativada caso o contrato seja formalizado.`
        );
      }
    }

    // Comparativo de Termos Financeiros
    const termComparison = {
      currentTerms: currentOffering?.terms || [],
      proposedTerms: proposedOffering.terms,
      notes: currentOffering
        ? 'Comparação entre os termos contratuais efetivos vigentes e a tabela pretendida.'
        : 'Primeira contratação ou sem condições comerciais prévias cadastradas.'
    };

    return {
      producerId: params.producerId,
      producerName: producer.name,
      originContractId: params.originContractId || null,
      movementType: params.movementType,
      currentOffering,
      proposedOffering,
      impactAnalysis: {
        featuresAdded,
        featuresRemoved,
        featuresMaintained,
        limitChanges,
        termComparison,
        operationalRisks,
        // INVARIANTE ARQUITETURAL ABSOLUTO:
        entitlementWillChangeImmediately: false
      }
    };
  }
}
