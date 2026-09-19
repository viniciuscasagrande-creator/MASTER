import { Request, Response } from 'express';
import { FeatureFlagService } from '../../core/configuration/features/feature-flag.service';
import { AuthenticatedUser } from '../../core/middleware/authenticate';

export class FeatureFlagController {
  public static async listFlags(req: Request, res: Response): Promise<void> {
    const flags = await FeatureFlagService.listFlags();
    res.json(flags);
  }

  public static async upsertFlag(req: Request, res: Response): Promise<void> {
    const flag = await FeatureFlagService.upsertFlag(req.body);
    res.json(flag);
  }

  public static async triggerKillSwitch(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const key = req.params.key as string;
    const { reason } = req.body;

    const result = await FeatureFlagService.triggerKillSwitch(key, reason, user);
    res.json(result);
  }

  public static async resetKillSwitch(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const key = req.params.key as string;
    const { reason } = req.body;

    const result = await FeatureFlagService.resetKillSwitch(key, reason || 'Reset de emergência concluído', user);
    res.json(result);
  }
}
