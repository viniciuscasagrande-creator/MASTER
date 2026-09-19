import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { WorkloadService } from './assignment/workload.service';

export class TaskController {
  public static async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const query = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        dueToday: req.query.dueToday === 'true',
        isOverdue: req.query.isOverdue === 'true'
      };
      const result = await TaskService.listTasks(query as any, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getMyInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const result = await TaskService.getMyInbox(user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getTeamInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const teamId = req.params.teamId as string;
      const result = await TaskService.getTeamInbox(teamId, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const result = await TaskService.getSummaryMetrics(user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.getById(id, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const result = await TaskService.createTask(req.body, user);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async startTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.startTask(id, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async claimTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.claimTask(id, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async assignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.assignTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async reassignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.reassignTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async waitTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.waitTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async resumeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.resumeTask(id, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.completeTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.cancelTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async reopenTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.reopenTask(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const result = await TaskService.addComment(id, req.body, user);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const result = await TaskService.updateChecklistItem(id, itemId, req.body, user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getMyAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const result = await WorkloadService.getUserAvailability(user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMyAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { status, reason } = req.body;
      const result = await WorkloadService.updateAvailability(user.id, status, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
