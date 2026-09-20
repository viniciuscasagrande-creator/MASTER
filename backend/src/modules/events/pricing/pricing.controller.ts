import { Request, Response } from 'express';
import { PricingMatrixService } from './pricing-matrix.service';
import { PriceCalculationService } from './price-calculation.service';

export class PricingController {
  static async getMatrix(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const batchId = req.query.batchId as string;
      if (!batchId) {
        res.status(400).json({ error: 'batchId é obrigatório' });
        return;
      }
      const matrix = await PricingMatrixService.getMatrix(eventId, batchId);
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar matriz de preços' });
    }
  }

  static async savePriceConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await PricingMatrixService.savePriceConfig(req.body);
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao salvar preço' });
    }
  }

  static async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const result = await PricingMatrixService.bulkUpdate(eventId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro na atualização em massa de preços' });
    }
  }

  static async copyFromBatch(req: Request, res: Response): Promise<void> {
    try {
      const { fromBatchId, toBatchId } = req.body;
      if (!fromBatchId || !toBatchId) {
        res.status(400).json({ error: 'fromBatchId e toBatchId são obrigatórios' });
        return;
      }
      const count = await PricingMatrixService.copyFromBatch(fromBatchId, toBatchId);
      res.json({ success: true, copiedCount: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao copiar preços entre lotes' });
    }
  }

  static async simulatePrice(req: Request, res: Response): Promise<void> {
    try {
      const result = PriceCalculationService.simulate(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao simular preço' });
    }
  }
}
