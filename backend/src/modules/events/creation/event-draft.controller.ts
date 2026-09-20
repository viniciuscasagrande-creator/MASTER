import { Request, Response } from 'express';
import { EventDraftService } from './event-draft.service';
import {
  createDraftSchema,
  patchDraftSchema,
  slugAvailabilityQuerySchema
} from './event-draft.schemas';
import { AppError } from '../../../core/errors/AppError';

export class EventDraftController {
  public static async createDraft(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const parsed = createDraftSchema.parse(req.body);

      const result = await EventDraftService.createDraft(user, parsed);
      res.status(201).json({
        success: true,
        data: result.event,
        wizardState: result.wizardState
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        res.status(400).json({ success: false, error: err.message || 'Erro ao criar rascunho de evento' });
      }
    }
  }

  public static async patchDraft(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const eventId = String(req.params.eventId);
      const parsed = patchDraftSchema.parse(req.body);

      const result = await EventDraftService.patchDraft(user, eventId, parsed);
      res.json({
        success: true,
        data: result.event,
        version: result.version
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else if (err.code === 'P2025_CONFLICT' || err.status === 409) {
        res.status(409).json({ success: false, error: err.message });
      } else {
        res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar rascunho' });
      }
    }
  }

  public static async discardDraft(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const eventId = String(req.params.eventId);

      const result = await EventDraftService.discardDraft(user, eventId);
      res.json(result);
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        res.status(400).json({ success: false, error: err.message || 'Erro ao descartar rascunho' });
      }
    }
  }

  public static async checkSlugAvailability(req: Request, res: Response): Promise<void> {
    try {
      const parsed = slugAvailabilityQuerySchema.parse(req.query);
      const result = await EventDraftService.checkSlugAvailability(parsed.slug, parsed.excludeEventId);
      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao verificar slug'
      });
    }
  }
}
