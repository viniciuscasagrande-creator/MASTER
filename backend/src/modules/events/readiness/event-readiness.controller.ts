import { Request, Response } from 'express';
import { EventReadinessService } from './event-readiness.service';

export class EventReadinessController {
  static async evaluateReadiness(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const evaluation = await EventReadinessService.evaluateEventReadiness(eventId);
      res.json(evaluation);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao avaliar prontidão do evento' });
    }
  }
}
