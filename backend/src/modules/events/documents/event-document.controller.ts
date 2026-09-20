import { Request, Response } from 'express';
import { EventDocumentService } from './event-document.service';

export class EventDocumentController {
  static async listRequirements(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const requirements = await EventDocumentService.listRequirements(eventId);
      res.json(requirements);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar requisitos de documentos' });
    }
  }

  static async createRequirement(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const requirement = await EventDocumentService.createRequirement(eventId, req.body);
      res.status(201).json(requirement);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar requisito de documento' });
    }
  }

  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const updated = await EventDocumentService.uploadDocument(eventId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao registrar anexo de documento' });
    }
  }

  static async updateRequirementStatus(req: Request, res: Response): Promise<void> {
    try {
      const requirementId = req.params.requirementId as string;
      const { status, rejectionReason } = req.body;
      const updated = await EventDocumentService.updateRequirementStatus(requirementId, status, rejectionReason);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao atualizar status do documento' });
    }
  }
}
