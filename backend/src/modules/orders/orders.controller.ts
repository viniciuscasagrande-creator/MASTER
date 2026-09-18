import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

const ordersDB = [
  {
    id: 'ord_101',
    orderNumber: 'DK-10101',
    producerId: 'prd_100',
    eventId: 'evt_1001',
    eventName: 'Festival de Inverno Curitiba 2026',
    customerName: 'Carolina Mendes',
    customerCpf: '042.889.319-45',
    totalAmount: 374,
    status: 'PAID'
  },
  {
    id: 'ord_201',
    orderNumber: 'DK-20202',
    producerId: 'prd_200',
    eventId: 'evt_2001',
    eventName: 'Coldplay Experience World Tour',
    customerName: 'Rodrigo Silveira',
    customerCpf: '812.304.779-88',
    totalAmount: 462,
    status: 'PAID'
  }
];

export class OrdersRealController {
  public static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      let filtered = ordersDB;

      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        filtered = ordersDB.filter(o => user.scope.producers.includes(o.producerId));
      }

      res.status(200).json({ total: filtered.length, orders: filtered });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const order = ordersDB.find(o => o.id === String(id) || o.orderNumber === String(id));
      if (!order) throw new NotFoundError('Pedido não encontrado.');

      // Producer Scope boundary check
      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        if (!user.scope.producers.includes(order.producerId)) {
          await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'SCOPE_VIOLATION_ORDER',
            resource: `ORDER:${order.id}`,
            producerId: order.producerId,
            eventId: order.eventId,
            details: `Acesso negado: Usuário tentou consultar pedido ${order.id} pertencente ao produtor concorrente ${order.producerId}.`,
            ipAddress: req.ip || '127.0.0.1',
            result: 'DENIED'
          });

          res.status(403).json({
            error: 'Acesso não autorizado ao pedido solicitado.',
            statusCode: 403,
            details: {
              requestedOrderId: order.id,
              orderProducerId: order.producerId,
              authorizedProducers: user.scope.producers
            }
          });
          return;
        }
      }

      res.status(200).json({ order, consultedBy: user.name });
    } catch (err) {
      next(err);
    }
  }
}
