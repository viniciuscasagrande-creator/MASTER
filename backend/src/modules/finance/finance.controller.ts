import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../core/errors/AppError';

// In-memory transfers store for Phase 1.1.5.1 demonstration
const transfersDB: any[] = [];

export class FinanceRealController {
  public static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId } = req.params;
      const producer = await prisma.producer.findUnique({
        where: { id: String(producerId) }
      });

      if (!producer) throw new NotFoundError('Produtor não encontrado.');

      res.status(200).json({
        producerId: producer.id,
        producerName: producer.name,
        availableBalance: 842500,
        currency: 'BRL',
        consultedBy: req.user?.name
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ total: transfersDB.length, transfers: transfersDB });
    } catch (err) {
      next(err);
    }
  }

  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromEventId, toEventId, producerId, amount, reason } = req.body;

      const transfer = {
        id: `trf_${Date.now()}`,
        fromEventId,
        toEventId,
        producerId,
        amount: Number(amount),
        reason: reason || 'Transferência inter-eventos',
        status: 'PENDING_APPROVAL',
        requestedBy: req.user?.name,
        createdAt: new Date().toISOString()
      };

      transfersDB.push(transfer);

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'CREATE_TRANSFER',
        resource: `TRANSFER:${transfer.id}`,
        producerId,
        eventId: fromEventId,
        details: `Solicitação de transferência de R$ ${amount} criada entre eventos ${fromEventId} e ${toEventId}.`,
        result: 'SUCCESS'
      });

      res.status(201).json({ success: true, transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async approveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transfer = transfersDB.find(t => t.id === String(id));

      if (!transfer) throw new NotFoundError('Transferência não encontrada.');

      transfer.status = 'APPROVED';
      transfer.approvedBy = req.user?.name;
      transfer.approvedAt = new Date().toISOString();

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'APPROVE_TRANSFER',
        resource: `TRANSFER:${transfer.id}`,
        producerId: transfer.producerId,
        eventId: transfer.fromEventId,
        details: `Transferência ${transfer.id} no valor de R$ ${transfer.amount} aprovada por ${req.user?.name}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: 'Transferência aprovada com sucesso.', transfer });
    } catch (err) {
      next(err);
    }
  }
}
