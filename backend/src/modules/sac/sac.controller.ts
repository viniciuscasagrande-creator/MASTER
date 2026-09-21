import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/authenticate';
import { SacService } from './sac.service';

export class SacController {
  public static async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SacService.getMetrics(req.user!);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  public static async listTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        queue: req.query.queue as string,
        channel: req.query.channel as string,
        agentUserId: req.query.agentUserId as string,
        q: req.query.q as string
      };

      const tickets = await SacService.listTickets(filters, req.user!);
      res.status(200).json({
        total: tickets.length,
        tickets
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await SacService.getTicketById(ticketId, req.user!);
      if (!ticket) {
        res.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Atendimento não encontrado ou fora do escopo autorizado.'
        });
        return;
      }
      res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  public static async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, subject, channel, initialMessage } = req.body;
      if (!customerId || !subject || !initialMessage) {
        res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Os campos customerId, subject e initialMessage são obrigatórios.'
        });
        return;
      }

      const ticket = await SacService.createTicket(req.body, req.user!);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  public static async addMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, type } = req.body;
      if (!content || !type) {
        res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Os campos content e type são obrigatórios.'
        });
        return;
      }

      const ticketId = req.params.id as string;
      const ticket = await SacService.addMessage(ticketId, req.body, req.user!);
      if (!ticket) {
        res.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Atendimento não encontrado.'
        });
        return;
      }
      res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'O campo status é obrigatório.'
        });
        return;
      }

      const ticketId = req.params.id as string;
      const ticket = await SacService.updateStatus(ticketId, status, req.user!);
      if (!ticket) {
        res.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Atendimento não encontrado.'
        });
        return;
      }
      res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  public static async createRefundRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, customerId, reason, justification } = req.body;
      if (!orderId || !customerId || !reason || !justification) {
        res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Campos orderId, customerId, reason e justification são obrigatórios.'
        });
        return;
      }

      const refund = await SacService.createRefundRequest(req.body, req.user!);
      res.status(201).json(refund);
    } catch (err: any) {
      res.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: err.message || 'Erro ao abrir solicitação de estorno.'
      });
    }
  }

  public static async queryCentral(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query.q || '');
      const results = await SacService.queryCentral(q, req.user!);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }
}
