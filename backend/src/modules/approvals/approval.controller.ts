import { Request, Response } from 'express';
import { approvalEngineService } from './engine/approval-engine.service';
import { executionService } from './engine/execution.service';
import { delegationService } from './engine/delegation.service';
import { prisma } from '../../core/database/prisma';

export class ApprovalController {
  // 1. Inbox
  static async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const items = await approvalEngineService.getInbox(req.user!);
      res.json({ success: true, count: items.length, data: items });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  // 2. My Requests
  static async getMyRequests(req: Request, res: Response): Promise<void> {
    try {
      const items = await approvalEngineService.getMyRequests(req.user!);
      res.json({ success: true, count: items.length, data: items });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  // 3. History
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const items = await approvalEngineService.getHistory(req.user!);
      res.json({ success: true, count: items.length, data: items });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  // 4. Details
  static async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const item = await approvalEngineService.getDetails(String(req.params.id), req.user!);
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 5. Create Request
  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const created = await approvalEngineService.createRequest(req.user!, req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 6. Approve Step
  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const stepUpToken = (req.headers['x-step-up-token'] as string) || req.body.stepUpToken;

      const result = await approvalEngineService.approveStep(
        String(req.params.id),
        req.user!,
        { ...req.body, stepUpToken },
        clientIp
      );
      res.json({ success: true, message: 'Etapa aprovada com sucesso.', data: result });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 7. Reject Request
  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const result = await approvalEngineService.rejectRequest(String(req.params.id), req.user!, req.body);
      res.json({ success: true, message: 'Solicitação rejeitada.', data: result });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 8. Request Changes
  static async requestChanges(req: Request, res: Response): Promise<void> {
    try {
      const result = await approvalEngineService.requestChanges(String(req.params.id), req.user!, req.body);
      res.json({ success: true, message: 'Ajustes solicitados ao solicitante.', data: result });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 9. Cancel
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const result = await approvalEngineService.cancelRequest(String(req.params.id), req.user!, req.body.reason);
      res.json({ success: true, message: 'Solicitação cancelada com sucesso.', data: result });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message, code: err.code });
    }
  }

  // 10. Execute
  static async execute(req: Request, res: Response): Promise<void> {
    try {
      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
      const result = await executionService.executeApprovedRequest(String(req.params.id), req.user!.id, idempotencyKey);
      res.json({ success: result.success, data: result });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ success: false, error: err.message });
    }
  }

  // 11. Add Comment
  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const comment = await approvalEngineService.addComment(String(req.params.id), req.user!, req.body.comment);
      res.status(201).json({ success: true, data: comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 12. Add Attachment
  static async addAttachment(req: Request, res: Response): Promise<void> {
    try {
      const att = await approvalEngineService.addAttachment(String(req.params.id), req.user!, req.body);
      res.status(201).json({ success: true, data: att });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 13. Admin: List Rules
  static async listRules(req: Request, res: Response): Promise<void> {
    try {
      const where: any = {};
      if (req.query.operation) where.operation = req.query.operation as string;
      if (req.query.producerId !== undefined) {
        where.producerId = req.query.producerId === 'null' ? null : req.query.producerId;
      }
      const rules = await prisma.approvalRule.findMany({ where });
      res.json({ success: true, count: rules.length, data: rules });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 14. Admin: Create Rule
  static async createRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await prisma.approvalRule.create({ data: req.body });
      res.status(201).json({ success: true, data: rule });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 15. Admin: Update Rule
  static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await prisma.approvalRule.update({
        where: { id: String(req.params.id) },
        data: req.body
      });
      res.json({ success: true, data: rule });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 16. Admin: Simulate Rule
  static async simulateRule(req: Request, res: Response): Promise<void> {
    try {
      const simulation = await approvalEngineService.simulateRule(req.body);
      res.json({ success: true, data: simulation });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 17. Admin: List Thresholds
  static async listThresholds(req: Request, res: Response): Promise<void> {
    try {
      const thresholds = await prisma.approvalThreshold.findMany();
      res.json({ success: true, count: thresholds.length, data: thresholds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 18. Admin: Create or Update Threshold
  static async saveThreshold(req: Request, res: Response): Promise<void> {
    try {
      const threshold = await prisma.approvalThreshold.create({ data: req.body });
      res.status(201).json({ success: true, data: threshold });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 19. Delegations: List
  static async listDelegations(req: Request, res: Response): Promise<void> {
    try {
      const delegations = await delegationService.listUserDelegations(req.user!.id);
      res.json({ success: true, count: delegations.length, data: delegations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 20. Delegations: Create
  static async createDelegation(req: Request, res: Response): Promise<void> {
    try {
      const delegation = await delegationService.createDelegation(req.user!.id, req.body);
      res.status(201).json({ success: true, data: delegation });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 21. Delegations: Revoke
  static async revokeDelegation(req: Request, res: Response): Promise<void> {
    try {
      const result = await delegationService.revokeDelegation(req.user!.id, String(req.params.id));
      res.json({ success: true, message: 'Delegação revogada com sucesso.', data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
