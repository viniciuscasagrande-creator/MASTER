import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { WorkflowVersionService } from './workflow/workflow-version.service';

export class TaskAdminController {
  // WORKFLOWS
  public static async listWorkflows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflows = await prisma.workflow.findMany({
        include: { rules: true, versions: true }
      });
      res.json({ success: true, data: workflows });
    } catch (err) {
      next(err);
    }
  }

  public static async createWorkflow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { name, description, module, triggerEvent, rules } = req.body;
      const wf = await prisma.workflow.create({
        data: {
          name,
          description,
          module,
          triggerEvent,
          isActive: true,
          currentVersion: 1
        }
      });

      if (rules && Array.isArray(rules)) {
        for (let i = 0; i < rules.length; i++) {
          const r = rules[i];
          await prisma.workflowRule.create({
            data: {
              workflowId: wf.id,
              version: 1,
              name: r.name || `Regra ${i + 1}`,
              conditionJson: typeof r.conditionJson === 'string' ? r.conditionJson : JSON.stringify(r.conditionJson || {}),
              actionJson: typeof r.actionJson === 'string' ? r.actionJson : JSON.stringify(r.actionJson || {}),
              priority: r.priority || 'NORMAL',
              slaMinutes: r.slaMinutes || 120,
              targetTeamId: r.targetTeamId || null,
              orderIndex: i + 1
            }
          });
        }
      }

      // Snapshot initial version
      await WorkflowVersionService.createSnapshot(wf.id, 'Versão inicial', user.id);

      const created = await prisma.workflow.findUnique({
        where: { id: wf.id },
        include: { rules: true, versions: true }
      });
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  public static async createWorkflowVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const { changeReason } = req.body;
      const result = await WorkflowVersionService.createSnapshot(id, changeReason, user.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // TEAMS
  public static async listTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teams = await prisma.team.findMany({
        include: { members: true }
      });
      res.json({ success: true, data: teams });
    } catch (err) {
      next(err);
    }
  }

  public static async createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, description, leaderUserId } = req.body;
      const team = await prisma.team.create({
        data: {
          name,
          code: (code || name).toUpperCase().replace(/\s+/g, '_'),
          description,
          leaderUserId
        }
      });
      res.status(201).json({ success: true, data: team });
    } catch (err) {
      next(err);
    }
  }

  public static async addTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { userId, role } = req.body;
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          userId,
          role: role || 'MEMBER'
        }
      });
      res.status(201).json({ success: true, data: member });
    } catch (err) {
      next(err);
    }
  }

  // SLA POLICIES
  public static async listSlaPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await prisma.slaPolicy.findMany({
        include: { escalationRules: true }
      });
      res.json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  public static async createSlaPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        module,
        priority,
        durationMinutes,
        warningThresholdPercent,
        criticalThresholdPercent,
        allowPause,
        allowedPauseReasons
      } = req.body;

      const policy = await prisma.slaPolicy.create({
        data: {
          name,
          module,
          priority: priority || 'NORMAL',
          durationMinutes: durationMinutes || 120,
          warningThresholdPercent: warningThresholdPercent || 80,
          criticalThresholdPercent: criticalThresholdPercent || 95,
          allowPause: allowPause !== false,
          allowedPauseReasons: Array.isArray(allowedPauseReasons)
            ? JSON.stringify(allowedPauseReasons)
            : allowedPauseReasons || JSON.stringify(['CLIENTE', 'PRODUTOR'])
        }
      });
      res.status(201).json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }
}
