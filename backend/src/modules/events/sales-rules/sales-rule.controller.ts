import { Request, Response } from 'express';
import { SalesRuleService } from './sales-rule.service';

export class SalesRuleController {
  static async listRules(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const scope = req.query.scope as any;
      const scopeId = req.query.scopeId as string | undefined;
      const rules = await SalesRuleService.listRules(eventId, scope, scopeId);
      res.json(rules);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar regras de venda' });
    }
  }

  static async getRule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const rule = await SalesRuleService.getRule(id);
      if (!rule) {
        res.status(404).json({ error: 'Regra de venda não encontrada' });
        return;
      }
      res.json(rule);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao buscar regra de venda' });
    }
  }

  static async createRule(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const rule = await SalesRuleService.createRule(eventId, req.body);
      res.status(201).json(rule);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar regra de venda' });
    }
  }

  static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const rule = await SalesRuleService.updateRule(id, req.body);
      res.json(rule);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao atualizar regra de venda' });
    }
  }

  static async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await SalesRuleService.deleteRule(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao excluir regra de venda' });
    }
  }
}
