import { Request, Response } from 'express';
import { EventArchiveService } from './event-archive.service';

export class ArchiveController {
  public static async archiveEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { justification } = req.body;
      const record = await EventArchiveService.archiveEvent({
        eventId,
        justification,
        archivedBy: req.user?.id || 'sys_user',
        archivedByName: req.user?.name || 'Administrador'
      });
      res.status(200).json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao arquivar evento.' });
    }
  }

  public static async listArchived(req: Request, res: Response): Promise<void> {
    try {
      const list = await EventArchiveService.listArchived();
      res.status(200).json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar eventos arquivados.' });
    }
  }

  public static async getArchiveRecord(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const record = await EventArchiveService.getByEventId(eventId);
      if (!record) {
        res.status(404).json({ error: 'Registro de arquivamento não encontrado para este evento.' });
        return;
      }
      res.status(200).json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao buscar registro de arquivamento.' });
    }
  }
}
