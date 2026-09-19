import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { NotFoundError, ForbiddenError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';
import { SecurityService } from '../security/security.service';
import { EventBus } from '../../events/event-bus';

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

      await EventBus.publish({
        id: `evt_trf_${transfer.id}`,
        type: 'FINANCE_TRANSFER_CREATED',
        producerId: String(producerId),
        eventId: fromEventId,
        resourceType: 'TRANSFER',
        resourceId: transfer.id,
        actorUserId: req.user?.id,
        data: transfer,
        timestamp: new Date()
      }).catch(err => console.error('[EventBus publish error]:', err));

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

      // High-Value Step-Up Reauthentication Rule (> R$ 50.000)
      if (transfer.amount > 50000) {
        const stepUpToken = req.headers['x-step-up-token'];
        if (!stepUpToken || typeof stepUpToken !== 'string' || !SecurityService.verifyStepUpToken(req.user!.id, stepUpToken)) {
          res.status(403).json({
            error: 'OPERAÇÃO DE ALTO VALOR (> R$ 50.000) — Reautenticação de segurança (Step-Up) obrigatória.',
            code: 'STEP_UP_REQUIRED',
            statusCode: 403,
            requiresStepUp: true,
            threshold: 50000,
            amount: transfer.amount
          });
          return;
        }
      }

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

      await EventBus.publish({
        id: `evt_trf_appr_${transfer.id}`,
        type: 'FINANCE_TRANSFER_APPROVED',
        producerId: transfer.producerId,
        eventId: transfer.fromEventId,
        resourceType: 'TRANSFER',
        resourceId: transfer.id,
        actorUserId: req.user?.id,
        data: transfer,
        timestamp: new Date()
      }).catch(err => console.error('[EventBus publish error]:', err));

      res.status(200).json({ success: true, message: 'Transferência aprovada com sucesso.', transfer });
    } catch (err) {
      next(err);
    }
  }
}
