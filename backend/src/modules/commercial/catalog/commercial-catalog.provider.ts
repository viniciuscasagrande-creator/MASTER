import {
  CommercialOfferingDTO,
  CommercialOfferingVersionDTO,
  CommercialDefaultTermDTO,
  OfferingFeatureDTO,
  CommercialOfferingCompositionDTO,
  CommercialOfferingType
} from '../../../../../shared/types';
import { OfferingService } from './offerings/offering.service';
import { OfferingVersionService } from './versions/offering-version.service';
import { DefaultTermsResolver } from './terms/default-terms.resolver';
import { OfferingFeatureService } from './features/offering-feature.service';
import { OfferingCompositionService } from './composition/offering-composition.service';
import { CatalogQueryService } from './catalog-query.service';

export interface ICommercialCatalogProvider {
  /**
   * Resolve as condições comerciais padrão ativas para uma oferta
   */
  resolveEffectiveTerms(offeringId: string, versionNumber?: number): Promise<CommercialDefaultTermDTO[]>;

  /**
   * Obtém um snapshot completo e imutável de uma oferta comercial para anexar a propostas e contratos
   */
  getOfferingSnapshot(offeringId: string, versionNumber?: number): Promise<{
    offering: CommercialOfferingDTO;
    version: CommercialOfferingVersionDTO;
    defaultTerms: CommercialDefaultTermDTO[];
    features: OfferingFeatureDTO[];
    compositions: CommercialOfferingCompositionDTO[];
  } | null>;

  /**
   * Lista recursos técnicos vinculados a uma oferta
   */
  getOfferingFeatures(offeringId: string, versionNumber?: number): Promise<OfferingFeatureDTO[]>;

  /**
   * Lista ofertas ativas por tipo
   */
  listActiveOfferings(type?: CommercialOfferingType): Promise<CommercialOfferingDTO[]>;

  /**
   * Lista planos oficiais ativos
   */
  listActivePlans(): Promise<CommercialOfferingDTO[]>;

  /**
   * Lista pacotes comerciais ativos
   */
  listActivePackages(): Promise<CommercialOfferingDTO[]>;

  /**
   * Lista serviços individuais ativos
   */
  listActiveServices(): Promise<CommercialOfferingDTO[]>;
}

export class CommercialCatalogProvider implements ICommercialCatalogProvider {
  public async resolveEffectiveTerms(
    offeringId: string,
    versionNumber?: number
  ): Promise<CommercialDefaultTermDTO[]> {
    return DefaultTermsResolver.resolveTerms(offeringId, versionNumber);
  }

  public async getOfferingSnapshot(
    offeringId: string,
    versionNumber?: number
  ): Promise<{
    offering: CommercialOfferingDTO;
    version: CommercialOfferingVersionDTO;
    defaultTerms: CommercialDefaultTermDTO[];
    features: OfferingFeatureDTO[];
    compositions: CommercialOfferingCompositionDTO[];
  } | null> {
    const offering = await OfferingService.getOfferingById(offeringId);
    if (!offering) return null;

    let version: CommercialOfferingVersionDTO | null = null;
    if (versionNumber) {
      const versions = await OfferingVersionService.listVersions(offeringId);
      version = versions.find(v => v.versionNumber === versionNumber) || null;
    } else if (offering.currentVersionId) {
      version = await OfferingVersionService.getVersionById(offering.currentVersionId);
    }

    if (!version && offering.currentVersion) {
      version = offering.currentVersion;
    }

    if (!version) return null;

    const defaultTerms = await DefaultTermsResolver.resolveTerms(offeringId, version.versionNumber);
    const features = await OfferingFeatureService.listFeaturesByVersion(version.id);
    const compositions = await OfferingCompositionService.listCompositions(offeringId, version.id);

    return {
      offering,
      version,
      defaultTerms,
      features,
      compositions
    };
  }

  public async getOfferingFeatures(
    offeringId: string,
    versionNumber?: number
  ): Promise<OfferingFeatureDTO[]> {
    const offering = await OfferingService.getOfferingById(offeringId);
    if (!offering) return [];

    const versionId = offering.currentVersionId;
    if (!versionId) return [];

    return OfferingFeatureService.listFeaturesByVersion(versionId);
  }

  public async listActiveOfferings(type?: CommercialOfferingType): Promise<CommercialOfferingDTO[]> {
    return OfferingService.listOfferings({ type, activeOnly: true });
  }

  public async listActivePlans(): Promise<CommercialOfferingDTO[]> {
    return CatalogQueryService.listPlans();
  }

  public async listActivePackages(): Promise<CommercialOfferingDTO[]> {
    return CatalogQueryService.listPackages();
  }

  public async listActiveServices(): Promise<CommercialOfferingDTO[]> {
    return CatalogQueryService.listServices();
  }
}

// Singleton exportado para injeção / consumo nos módulos
export const commercialCatalogProvider = new CommercialCatalogProvider();
