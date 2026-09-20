import { Request, Response } from 'express';
import { EventTaskService } from './event-task.service';

export class EventTaskController {
  static async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const status = req.query.status as string | undefined;
      const tasks = await EventTaskService.listTasks(eventId, status);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar pendências do evento' });
    }
  }

  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const task = await EventTaskService.createTask(eventId, req.body);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar pendência' });
    }
  }

  static async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const { status } = req.body;
      const updated = await EventTaskService.updateTaskStatus(taskId, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao atualizar status da pendência' });
    }
  }

  static async generateTasksFromReadiness(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const { issues } = req.body;
      const tasks = await EventTaskService.generateTasksFromReadiness(eventId, issues || []);
      res.json({ success: true, count: tasks.length, tasks });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao converter pendências de prontidão' });
    }
  }
}
