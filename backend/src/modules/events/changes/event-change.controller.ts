import { Request, Response } from 'express';
import { EventChangeService } from './event-change.service';

export class EventChangeController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.createChangeRequest(eventId, req.body, user);
      res.status(201).json({
        message: 'Solicitação de alteração criada com sucesso.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { status, classification } = req.query;
      const results = await EventChangeService.listChangeRequests(eventId, {
        status: status as string,
        classification: classification as string
      });
      res.status(200).json({ changeRequests: results });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await EventChangeService.getChangeRequestById(id);
      res.status(200).json({ changeRequest: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async recalculate(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.recalculateImpact(id, user);
      res.status(200).json({
        message: 'Análise de impacto recalculada com sucesso.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async submit(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.submitForApproval(id, user);
      res.status(200).json({
        message: 'Solicitação submetida para aprovação executiva.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.approve(id, user);
      res.status(200).json({
        message: 'Solicitação aprovada com sucesso.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const { reason } = req.body;
      const result = await EventChangeService.reject(id, reason, user);
      res.status(200).json({
        message: 'Solicitação rejeitada.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async execute(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.execute(id, user);
      res.status(200).json({
        message: 'Alteração executada e sincronizada no evento com sucesso.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const result = await EventChangeService.cancel(id, user);
      res.status(200).json({
        message: 'Solicitação de alteração cancelada.',
        changeRequest: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
