import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { SchedulePayoutInput } from './finance.types';

export class FinanceRealController {
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || req.headers['x-producer-id'] as string || 'prd_100';

      const summary = await FinanceService.getProducerSummary({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        timeRange: (timeRange as any) || 'todos'
      });

      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  public static async getEventBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId } = req.query;
      const effectiveProducerId = (producerId as string) || req.headers['x-producer-id'] as string || 'prd_100';

      const balances = await FinanceService.getEventBalances(effectiveProducerId);
      res.status(200).json({ success: true, data: balances });
    } catch (err) {
      next(err);
    }
  }

  public static async getStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || req.headers['x-producer-id'] as string || 'prd_100';

      const statement = await FinanceService.getAccountStatement({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        timeRange: (timeRange as any) || 'todos'
      });

      res.status(200).json({ success: true, total: statement.length, data: statement });
    } catch (err) {
      next(err);
    }
  }

  public static async listPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, status } = req.query;
      const effectiveProducerId = (producerId as string) || req.headers['x-producer-id'] as string;

      const payouts = await FinanceService.listPayouts(
        effectiveProducerId,
        eventId as string,
        status as string
      );

      res.status(200).json({ success: true, total: payouts.length, data: payouts });
    } catch (err) {
      next(err);
    }
  }

  public static async schedulePayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: SchedulePayoutInput = req.body;
      const requestedBy = req.user?.name || req.body.requestedBy || 'Vinicius Casagrande';

      const payout = await FinanceService.schedulePayout(input, requestedBy);
      res.status(201).json({ success: true, data: payout });
    } catch (err) {
      next(err);
    }
  }

  public static async approvePayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const approverName = req.user?.name || req.body.approvedBy || 'Maria Oliveira (Diretoria)';
      const stepUpToken = req.headers['x-step-up-token'] as string || req.body.stepUpToken;
      const approverId = req.user?.id;

      const payout = await FinanceService.approvePayout(id, approverName, stepUpToken, approverId);
      res.status(200).json({ success: true, message: 'Repasse aprovado com sucesso.', data: payout });
    } catch (err) {
      next(err);
    }
  }

  public static async processPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const executedBy = req.user?.name || req.body.executedBy || 'Operador Financeiro';
      const { bankAuthCode, notes } = req.body;

      const payout = await FinanceService.processPayout(id, executedBy, bankAuthCode, notes);
      res.status(200).json({ success: true, message: 'Liquidação bancária confirmada.', data: payout });
    } catch (err) {
      next(err);
    }
  }

  public static async rejectPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const rejectedBy = req.user?.name || req.body.rejectedBy || 'Diretoria Financeira';
      const { reason } = req.body;

      const payout = await FinanceService.rejectPayout(id, rejectedBy, reason);
      res.status(200).json({ success: true, message: 'Repasse rejeitado.', data: payout });
    } catch (err) {
      next(err);
    }
  }

  public static async getReconciliation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await FinanceService.getReconciliationOverview();
      res.status(200).json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  // Compatibilidade com rotas legadas
  public static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    return FinanceRealController.getSummary(req, res, next);
  }

  public static async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    return FinanceRealController.listPayouts(req, res, next);
  }

  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    return FinanceRealController.schedulePayout(req, res, next);
  }

  public static async approveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    return FinanceRealController.approvePayout(req, res, next);
  }
}
