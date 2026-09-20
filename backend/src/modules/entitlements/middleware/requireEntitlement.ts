import { Request, Response, NextFunction } from 'express';
import { EntitlementService } from '../entitlement.service';

export interface RequireEntitlementOptions {
  count?: number;
  extractProducerId?: (req: Request) => string | undefined;
}

export function requireEntitlement(featureCode: string, options?: RequireEntitlementOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let producerId: string | undefined;

      if (options?.extractProducerId) {
        producerId = options.extractProducerId(req);
      }

      if (!producerId) {
        producerId = (req.params.producerId as string) ||
                     (req.headers['x-producer-id'] as string) ||
                     (req as any).user?.producerId ||
                     (req as any).producerId ||
                     (req.body?.producerId as string) ||
                     (req.query?.producerId as string);
      }

      // If no producer context can be determined, allow or pass to controller
      if (!producerId) {
        return next();
      }

      const count = options?.count || 1;
      const result = await EntitlementService.hasEntitlement(producerId, featureCode, count);

      if (!result.allowed) {
        res.status(403).json({
          success: false,
          error: 'ENTITLEMENT_REQUIRED',
          featureCode: result.featureCode,
          producerId: result.producerId,
          reason: result.reason || 'Funcionalidade não habilitada contratualmente para esta organização.',
          limit: result.limit
        });
        return;
      }

      if (result.warningMessage) {
        res.setHeader('X-Entitlement-Warning', encodeURIComponent(result.warningMessage));
      }

      (req as any).entitlementResult = result;
      next();
    } catch (err: any) {
      next(err);
    }
  };
}
