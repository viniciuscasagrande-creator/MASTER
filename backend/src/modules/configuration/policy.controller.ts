import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma';
import { PolicyEngineService } from '../../core/configuration/policies/policy-engine.service';
import { PolicySimulatorService } from '../../core/configuration/policies/policy-simulator.service';
import { PolicyConflictService } from '../../core/configuration/policies/policy-conflict.service';
import { VersionService } from '../../core/configuration/versions/version.service';
import { RollbackService } from '../../core/configuration/versions/rollback.service';
import { AuthenticatedUser } from '../../core/middleware/authenticate';
import { AppError } from '../../core/errors/AppError';

export class PolicyController {
  public static async listPolicies(req: Request, res: Response): Promise<void> {
    const domain = (req.query.domain as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const producerId = (req.query.producerId as string) || undefined;

    const where: any = {};
    if (domain) where.domain = domain.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (producerId) where.producerId = producerId;

    const policies = await prisma.policy.findMany({
      where,
      include: { rules: true, versions: true },
      orderBy: { priority: 'desc' }
    });

    res.json(policies);
  }

  public static async getPolicyById(req: Request, res: Response): Promise<void> {
    const policy = await prisma.policy.findUnique({
      where: { id: req.params.id },
      include: { rules: true, versions: true }
    });

    if (!policy) throw new AppError('Política não encontrada.', 404);
    res.json(policy);
  }

  public static async createPolicy(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const policy = await PolicyEngineService.createPolicy(req.body, user);
    res.status(201).json(policy);
  }

  public static async activatePolicy(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const policy = await PolicyEngineService.activatePolicy(req.params.id as string, user);
    res.json(policy);
  }

  public static async schedulePolicy(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const { effectiveFrom, effectiveUntil } = req.body;
    const policy = await PolicyEngineService.schedulePolicy(req.params.id as string, effectiveFrom, effectiveUntil, user);
    res.json(policy);
  }

  public static async compareVersions(req: Request, res: Response): Promise<void> {
    const policyId = req.params.id as string;
    const v1 = parseInt(req.query.v1 as string) || 1;
    const v2 = parseInt(req.query.v2 as string) || 2;

    const result = await VersionService.compareVersions(policyId, v1, v2);
    res.json(result);
  }

  public static async createNewVersion(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const policyId = req.params.id as string;
    const { rules, changeReason } = req.body;

    const result = await VersionService.createNewVersion(policyId, rules, changeReason, user);
    res.status(201).json(result);
  }

  public static async rollbackPolicy(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const policyId = req.params.id as string;
    const { targetVersion, reason } = req.body;

    const result = await RollbackService.rollbackPolicy(policyId, Number(targetVersion), reason, user);
    res.json(result);
  }

  public static async simulate(req: Request, res: Response): Promise<void> {
    const result = await PolicySimulatorService.simulate(req.body);
    res.json(result);
  }

  public static async detectConflicts(req: Request, res: Response): Promise<void> {
    const domain = req.body.domain || 'FINANCE';
    const conflicts = await PolicyConflictService.detectConflicts(domain);
    res.json(conflicts);
  }

  public static async listConflicts(req: Request, res: Response): Promise<void> {
    const domain = (req.query.domain as string) || undefined;
    const conflicts = await PolicyConflictService.listConflicts(domain);
    res.json(conflicts);
  }

  public static async resolveConflict(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as AuthenticatedUser;
    const conflictId = req.params.id as string;
    const { resolutionNotes } = req.body;

    const resolved = await PolicyConflictService.resolveConflict(conflictId, resolutionNotes || 'Resolvido pelo operador', user.id);
    res.json(resolved);
  }
}
