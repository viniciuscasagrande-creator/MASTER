import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { InventoryAllocationService } from './inventory-allocation.service';
import { InventoryBlockService } from './inventory-block.service';

export class InventoryController {
  static async listPools(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string;
      const eventSectionId = req.query.eventSectionId as string | undefined;

      if (!sessionId) {
        res.status(400).json({ error: 'Parâmetro sessionId é obrigatório' });
        return;
      }

      const pools = await InventoryService.listPools(sessionId, eventSectionId);
      res.json(pools);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar pools de inventário' });
    }
  }

  static async holdInventory(req: Request, res: Response): Promise<void> {
    try {
      const result = await InventoryService.holdInventory(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao reservar inventário' });
    }
  }

  static async releaseHold(req: Request, res: Response): Promise<void> {
    try {
      const { holdToken } = req.body;
      if (!holdToken) {
        res.status(400).json({ error: 'holdToken é obrigatório' });
        return;
      }
      await InventoryService.releaseHold(holdToken);
      res.json({ success: true, message: 'Hold liberado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao liberar reserva' });
    }
  }

  static async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const sessionId = req.query.sessionId as string | undefined;
      const summary = await InventoryService.getInventorySummary(eventId, sessionId);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao gerar resumo de inventário' });
    }
  }

  static async saveAllocation(req: Request, res: Response): Promise<void> {
    try {
      const poolId = req.params.poolId as string;
      const allocation = await InventoryAllocationService.saveAllocation(poolId, req.body);
      res.json(allocation);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao salvar cota de inventário' });
    }
  }

  static async removeAllocation(req: Request, res: Response): Promise<void> {
    try {
      const poolId = req.params.poolId as string;
      const eventTicketTypeId = req.params.eventTicketTypeId as string;
      await InventoryAllocationService.removeAllocation(poolId, eventTicketTypeId);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao remover cota' });
    }
  }

  static async createBlock(req: Request, res: Response): Promise<void> {
    try {
      const poolId = req.params.poolId as string;
      const userId = (req as any).user?.id;
      const block = await InventoryBlockService.createBlock(poolId, req.body, userId);
      res.status(201).json(block);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao criar bloqueio' });
    }
  }

  static async releaseBlock(req: Request, res: Response): Promise<void> {
    try {
      const blockId = req.params.blockId as string;
      await InventoryBlockService.releaseBlock(blockId);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao liberar bloqueio' });
    }
  }
}
