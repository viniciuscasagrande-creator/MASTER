import { Request, Response } from 'express';
import { db, TransferRecord } from '../core/database/index';

export class FinanceController {
  public static getBalance(req: Request, res: Response): void {
    const { producerId } = req.params;
    const producer = db.producers.find(p => p.id === String(producerId));

    if (!producer) {
      res.status(404).json({ error: 'Produtor não encontrado.' });
      return;
    }

    res.json({
      producerId: producer.id,
      name: producer.name,
      availableBalance: producer.availableBalance,
      currency: 'BRL',
      consultedBy: req.user?.name
    });
  }

  public static listTransfers(req: Request, res: Response): void {
    const user = req.user;
    let transfers = db.transfers;

    if (user && user.roleSlug !== 'admin_geral' && user.scope.type === 'PRODUCER') {
      transfers = db.transfers.filter(t => user.scope.producerIds.includes(t.producerId));
    }

    res.json({
      total: transfers.length,
      transfers
    });
  }

  public static createTransfer(req: Request, res: Response): void {
    const { fromEventId, toEventId, producerId, amount, reason } = req.body;

    if (!fromEventId || !toEventId || !producerId || !amount) {
      res.status(400).json({ error: 'Campos obrigatórios: fromEventId, toEventId, producerId, amount.' });
      return;
    }

    const newTransfer: TransferRecord = {
      id: `trf-${Date.now()}`,
      fromEventId,
      toEventId,
      producerId,
      amount: Number(amount),
      reason: reason || 'Transferência inter-eventos solicitada',
      status: 'pending_approval',
      requestedBy: req.user?.name || 'Sistema',
      createdAt: new Date().toISOString()
    };

    db.transfers.push(newTransfer);

    db.logAudit({
      userId: req.user?.id || 'sys-user',
      userName: req.user?.name || 'Operador Financeiro',
      action: 'CREATE_TRANSFER',
      module: 'FINANCEIRO',
      entityType: 'TRANSFER',
      entityId: newTransfer.id,
      details: `Solicitação de transferência de R$ ${amount} criada entre eventos ${fromEventId} e ${toEventId} (Produtor: ${producerId}).`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      message: 'Transferência solicitada e aguardando aprovação financeira.',
      transfer: newTransfer
    });
  }

  public static approveTransfer(req: Request, res: Response): void {
    const { transferId } = req.params;
    const transfer = db.transfers.find(t => t.id === String(transferId));

    if (!transfer) {
      res.status(404).json({ error: 'Transferência não encontrada.' });
      return;
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user?.name;

    const audit = db.logAudit({
      userId: req.user?.id || 'sys-user',
      userName: req.user?.name || 'Diretor Financeiro',
      action: 'APPROVE_TRANSFER',
      module: 'FINANCEIRO',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      details: `Transferência ${transfer.id} no valor de R$ ${transfer.amount} aprovada.`,
      ipAddress: req.ip || '127.0.0.1',
      impactCascade: ['BALANCE_DEDUCTED_FROM_EVENT', 'BALANCE_CREDITED_TO_EVENT', 'LEDGER_ENTRY_RECORDED'],
      result: 'SUCCESS'
    });

    res.json({
      success: true,
      message: `Transferência ${transfer.id} aprovada com sucesso.`,
      transfer,
      auditId: audit.id
    });
  }
}
