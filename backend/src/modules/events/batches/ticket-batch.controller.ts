import { Request, Response } from 'express';
import { TicketBatchService } from './ticket-batch.service';

export class TicketBatchController {
  static async listBatches(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const batches = await TicketBatchService.listBatches(eventId);
      res.json(batches);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar lotes' });
    }
  }

  static async getBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const batch = await TicketBatchService.getBatch(id);
      if (!batch) {
        res.status(404).json({ error: 'Lote não encontrado' });
        return;
      }
      res.json(batch);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao buscar lote' });
    }
  }

  static async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const batch = await TicketBatchService.createBatch(eventId, req.body);
      res.status(201).json(batch);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar lote' });
    }
  }

  static async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const batch = await TicketBatchService.updateBatch(id, req.body);
      res.json(batch);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar lote' });
    }
  }

  static async transitionStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: 'Status alvo é obrigatório' });
        return;
      }
      const updated = await TicketBatchService.transitionStatus(id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao alterar status do lote' });
    }
  }

  static async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await TicketBatchService.deleteBatch(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir lote' });
    }
  }
}
