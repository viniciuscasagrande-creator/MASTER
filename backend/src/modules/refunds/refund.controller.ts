import { Request, Response, NextFunction } from 'express';
import { RefundService } from './refund.service';
import { AuthenticatedUser } from '../../core/middleware/authenticate';

export class RefundController {
  /**
   * GET /refunds/metrics
   */
  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const metrics = await RefundService.getMetrics(user);
      res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /refunds
   */
  public static async listRefunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const { status, producerId, eventId, search } = req.query;

      const refunds = await RefundService.listRefunds(user, {
        status: status ? String(status) : undefined,
        producerId: producerId ? String(producerId) : undefined,
        eventId: eventId ? String(eventId) : undefined,
        search: search ? String(search) : undefined
      });

      res.status(200).json({
        success: true,
        total: refunds.length,
        refunds
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /refunds/eligibility/:orderId
   */
  public static async checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const amount = req.query.amount ? Number(req.query.amount) : undefined;
      const ticketIds = req.query.ticketIds
        ? Array.isArray(req.query.ticketIds)
          ? (req.query.ticketIds as string[])
          : [String(req.query.ticketIds)]
        : undefined;

      const eligibility = await RefundService.evaluateEligibility(orderId, amount, ticketIds);
      res.status(200).json({ success: true, eligibility });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /refunds/:id
   */
  public static async getRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);

      const refund = await RefundService.getRefundById(id, user);
      const reversalPlan = RefundService.buildReversalPlan(refund);

      res.status(200).json({
        success: true,
        refund,
        reversalPlan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds
   */
  public static async createRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const newRefund = await RefundService.createRefund(req.body, user);
      res.status(201).json({ success: true, refund: newRefund });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/review
   */
  public static async reviewRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const updated = await RefundService.reviewRefund(id, req.body, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/approve
   */
  public static async approveRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const updated = await RefundService.approveRefund(id, req.body, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/reject
   */
  public static async rejectRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const updated = await RefundService.rejectRefund(id, req.body, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/process
   */
  public static async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const { idempotencyKey } = req.body || {};
      const updated = await RefundService.processRefund(id, idempotencyKey, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/retry
   */
  public static async retryRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const updated = await RefundService.retryRefund(id, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /refunds/:id/cancel
   */
  public static async cancelRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = String(req.params.id);
      const { reason } = req.body || {};
      const updated = await RefundService.cancelRefund(id, reason, user);
      res.status(200).json({ success: true, refund: updated });
    } catch (err) {
      next(err);
    }
  }
}
