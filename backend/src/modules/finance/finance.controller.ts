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

  // ==============================================================================
  // TRANSFERÊNCIAS ENTRE EVENTOS (Módulo Central SafeSaff)
  // ==============================================================================

  public static async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const transfers = await FinanceService.listTransfers(effectiveProducerId);
      res.status(200).json({ success: true, total: transfers.length, data: transfers });
    } catch (err) {
      next(err);
    }
  }

  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedBy = req.user?.name || req.body.requestedBy || 'Vinicius Casagrande';
      const transfer = await FinanceService.createTransfer(req.body, requestedBy);
      res.status(201).json({ success: true, message: 'Transferência entre eventos solicitada com sucesso.', data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async approveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const approverName = req.user?.name || req.body.approvedBy || 'Maria Oliveira (Diretoria)';
      const stepUpToken = (req.headers['x-step-up-token'] as string) || req.body.stepUpToken;
      const approverId = req.user?.id;

      const transfer = await FinanceService.approveTransfer(id, approverName, stepUpToken, approverId);
      res.status(200).json({ success: true, message: 'Transferência aprovada e liquidada entre os saldos dos eventos.', data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async revertTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const revertedBy = req.user?.name || req.body.revertedBy || 'Auditoria Financeira';
      const { reason } = req.body;

      const transfer = await FinanceService.revertTransfer({ transferId: id, reason }, revertedBy);
      res.status(200).json({ success: true, message: 'Transferência revertida com emissão de compensação e trilha de auditoria.', data: transfer });
    } catch (err) {
      next(err);
    }
  }

  // ==============================================================================
  // CONTAS A RECEBER E CONTAS A PAGAR
  // ==============================================================================

  public static async listReceivables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, status, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const receivables = await FinanceService.listReceivables({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        status: status as string,
        timeRange: (timeRange as any) || 'todos'
      });
      res.status(200).json({ success: true, total: receivables.length, data: receivables });
    } catch (err) {
      next(err);
    }
  }

  public static async listPayables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, status, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const payables = await FinanceService.listPayables({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        status: status as string,
        timeRange: (timeRange as any) || 'todos'
      });
      res.status(200).json({ success: true, total: payables.length, data: payables });
    } catch (err) {
      next(err);
    }
  }

  public static async createPayable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.name || req.body.createdBy || 'Gestor Operacional';
      const payable = await FinanceService.createPayable(req.body, createdBy);
      res.status(201).json({ success: true, message: 'Conta a pagar provisionada com sucesso.', data: payable });
    } catch (err) {
      next(err);
    }
  }

  public static async payPayable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const executedBy = req.user?.name || req.body.executedBy || 'Operador Financeiro';
      const { bankAuth } = req.body;

      const payable = await FinanceService.payPayable(id, executedBy, bankAuth);
      res.status(200).json({ success: true, message: 'Baixa de pagamento realizada.', data: payable });
    } catch (err) {
      next(err);
    }
  }

  // ==============================================================================
  // TESOURARIA & CONTAS BANCÁRIAS
  // ==============================================================================

  public static async listBankAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const accounts = await FinanceService.listBankAccounts(effectiveProducerId);
      res.status(200).json({ success: true, total: accounts.length, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  // ==============================================================================
  // FLUXO DE CAIXA & DRE GERENCIAL
  // ==============================================================================

  public static async getCashFlow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const cashFlow = await FinanceService.getCashFlow({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        timeRange: (timeRange as any) || 'todos'
      });
      res.status(200).json({ success: true, data: cashFlow });
    } catch (err) {
      next(err);
    }
  }

  public static async getManagementDRE(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, eventId, timeRange } = req.query;
      const effectiveProducerId = (producerId as string) || (req.headers['x-producer-id'] as string) || 'prd_100';

      const dre = await FinanceService.getManagementDRE({
        producerId: effectiveProducerId,
        eventId: eventId as string,
        timeRange: (timeRange as any) || 'todos'
      });
      res.status(200).json({ success: true, data: dre });
    } catch (err) {
      next(err);
    }
  }

  // Compatibilidade com rotas legadas
  public static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    return FinanceRealController.getSummary(req, res, next);
  }
}
