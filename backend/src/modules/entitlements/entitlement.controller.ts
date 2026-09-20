import { Request, Response, NextFunction } from 'express';
import { EntitlementService } from './entitlement.service';
import { EntitlementReconciliationService } from './reconciliation/entitlement-reconciliation.service';
import { EntitlementOverrideService } from './overrides/entitlement-override.service';
import { EntitlementMigrationService } from './migration/entitlement-migration.service';
import { FeatureRegistry } from './features/feature-registry';

export class EntitlementController {
  public static async check(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producerId = String(req.params.producerId);
      const featureCode = String(req.params.featureCode);
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 1;
      const result = await EntitlementService.hasEntitlement(producerId, featureCode, count);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async listProducerEntitlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producerId = String(req.params.producerId);
      const data = await EntitlementService.listProducerEntitlements(producerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async listContractedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producerId = String(req.params.producerId);
      const data = await EntitlementService.listContractedProducts(producerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async reconcileProducer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producerId = String(req.params.producerId);
      const result = await EntitlementReconciliationService.reconcileProducer(producerId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async reconcileAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EntitlementReconciliationService.reconcileAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || 'admin-system';
      const actorName = (req as any).user?.name || 'Administrador Comercial';
      const data = await EntitlementOverrideService.createOverride(req.body, actorId, actorName);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async listOverrides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, status } = req.query;
      const data = await EntitlementOverrideService.listOverrides(
        producerId ? String(producerId) : undefined,
        status ? String(status) : undefined
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async revokeOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overrideId = String(req.params.overrideId);
      const actorId = (req as any).user?.id || 'admin-system';
      const actorName = (req as any).user?.name || 'Administrador Comercial';
      const data = await EntitlementOverrideService.revokeOverride(overrideId, actorId, actorName);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async migrateLegacy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || 'admin-system';
      const actorName = (req as any).user?.name || 'Administrador Comercial';
      const data = await EntitlementMigrationService.migrateLegacyProducer(req.body, actorId, actorName);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producerId = String(req.params.producerId);
      const data = await EntitlementService.listAuditLogs(producerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async listFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = FeatureRegistry.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
