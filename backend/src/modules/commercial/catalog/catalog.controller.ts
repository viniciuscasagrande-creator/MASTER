import { Request, Response } from 'express';
import { OfferingService } from './offerings/offering.service';
import { OfferingVersionService } from './versions/offering-version.service';
import { OfferingFeatureService } from './features/offering-feature.service';
import { DefaultTermsService } from './terms/default-terms.service';
import { CatalogImpactService } from './impact/catalog-impact.service';
import { CatalogQueryService } from './catalog-query.service';

export class CatalogController {
  public static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await CatalogQueryService.getMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao carregar métricas do catálogo.' });
    }
  }

  public static async listOfferings(req: Request, res: Response): Promise<void> {
    try {
      const { type, categoryId, status, search, activeOnly } = req.query;
      const offerings = await OfferingService.listOfferings({
        type: type as any,
        categoryId: categoryId as string,
        status: status as any,
        search: search as string,
        activeOnly: activeOnly === 'true'
      });
      res.json(offerings);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar ofertas do catálogo.' });
    }
  }

  public static async getOfferingById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offering = await OfferingService.getOfferingById(id);
      if (!offering) {
        res.status(404).json({ error: 'Oferta comercial não encontrada.' });
        return;
      }
      res.json(offering);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao buscar oferta comercial.' });
    }
  }

  public static async createOffering(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'usr_unknown';
      const userName = (req as any).user?.name || 'Usuário Comercial';
      const created = await OfferingService.createOffering(req.body, userId, userName);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao criar oferta comercial.' });
    }
  }

  public static async updateOffering(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await OfferingService.updateOffering(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao atualizar oferta comercial.' });
    }
  }

  public static async discontinueOffering(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = (req as any).user?.id || 'usr_unknown';
      const result = await OfferingService.discontinueOffering(id, req.body, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao descontinuar oferta comercial.' });
    }
  }

  public static async getOfferingImpact(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const impact = await CatalogImpactService.analyzeImpact(id);
      res.json(impact);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao analisar impacto da oferta.' });
    }
  }

  public static async listOfferingVersions(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const versions = await OfferingVersionService.listVersions(id);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar versões da oferta.' });
    }
  }

  public static async createDraftVersion(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = (req as any).user?.id || 'usr_unknown';
      const userName = (req as any).user?.name || 'Usuário Comercial';
      const draft = await OfferingVersionService.createDraftVersion(id, req.body, userId, userName);
      res.status(201).json(draft);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao criar versão em rascunho.' });
    }
  }

  public static async publishVersion(req: Request, res: Response): Promise<void> {
    try {
      const versionId = String(req.params.versionId);
      const userId = (req as any).user?.id || 'usr_unknown';
      const userName = (req as any).user?.name || 'Usuário Comercial';
      const published = await OfferingVersionService.publishVersion(versionId, req.body, userId, userName);
      res.json(published);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao publicar versão da oferta.' });
    }
  }

  public static async listFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const features = await OfferingFeatureService.listFeatures(category as string);
      res.json(features);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar recursos técnicos.' });
    }
  }

  public static async createFeature(req: Request, res: Response): Promise<void> {
    try {
      const created = await OfferingFeatureService.createFeature(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao criar recurso técnico.' });
    }
  }

  public static async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await CatalogQueryService.listPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar planos oficiais.' });
    }
  }

  public static async listPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = await CatalogQueryService.listPackages();
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar pacotes comerciais.' });
    }
  }

  public static async listServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await CatalogQueryService.listServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar serviços comerciais.' });
    }
  }

  public static async listCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CatalogQueryService.listCategoriesWithOfferings();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar categorias do catálogo.' });
    }
  }

  public static async resolveOfferingTerms(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { versionNumber } = req.query;
      const terms = await DefaultTermsService.resolveTerms(
        id,
        versionNumber ? Number(versionNumber) : undefined
      );
      res.json(terms);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao resolver condições padrão da oferta.' });
    }
  }
}
