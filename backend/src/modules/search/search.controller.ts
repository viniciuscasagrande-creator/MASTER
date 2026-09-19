import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { AuthenticatedRequest } from '../../core/middleware/authenticate';

export class SearchController {
  /**
   * GET /api/v1/search
   */
  public static async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query.q || '');
      const scopeParam = req.query.scope ? String(req.query.scope) : undefined;
      const producerIdHeader = (req.headers['x-producer-id'] as string) || (req.query.producerId as string);
      const eventIdHeader = (req.headers['x-event-id'] as string) || (req.query.eventId as string);
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const results = await SearchService.search(q, req.user!, {
        scopeParam,
        producerIdHeader,
        eventIdHeader,
        ipAddress
      });

      res.status(200).json(results);
    } catch (err: any) {
      if (err.message === 'ANTI_ENUMERATION_LIMIT_EXCEEDED') {
        res.status(429).json({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Limite de consultas de CPF/documentos excedido por política de segurança e proteção anti-enumeração.'
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/search/suggestions
   */
  public static async getSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query.q || '');
      const scopeParam = req.query.scope ? String(req.query.scope) : undefined;
      const producerIdHeader = (req.headers['x-producer-id'] as string) || (req.query.producerId as string);
      const eventIdHeader = (req.headers['x-event-id'] as string) || (req.query.eventId as string);

      const suggestions = await SearchService.getSuggestions(q, req.user!, {
        scopeParam,
        producerIdHeader,
        eventIdHeader
      });

      res.status(200).json({ suggestions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/search/customers/:id
   */
  public static async getCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = String(req.params.id);
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const data = await SearchService.getCustomerCompleteView(customerId, req.user!, { ipAddress });
      if (!data) {
        res.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Cliente não encontrado ou fora do escopo autorizado.'
        });
        return;
      }

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/search/orders/:id
   */
  public static async getOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);

      const data = await SearchService.getOrderCompleteView(orderId, req.user!);
      if (!data) {
        res.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Pedido não encontrado ou fora do escopo autorizado.'
        });
        return;
      }

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/search/recent
   */
  public static async getRecent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recent = await SearchService.getRecentSearches(req.user!.id);
      res.status(200).json({ recent });
    } catch (err) {
      next(err);
    }
  }
}
