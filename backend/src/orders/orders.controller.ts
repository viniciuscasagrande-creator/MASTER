import { Request, Response } from 'express';
import { db } from '../core/database/index';

export class OrdersController {
  public static listOrders(req: Request, res: Response): void {
    const user = req.user;

    let orders = db.orders;

    if (user && user.roleSlug !== 'admin_geral' && user.scope.type === 'PRODUCER') {
      orders = db.orders.filter(o => user.scope.producerIds.includes(o.producerId));
    }

    res.json({
      total: orders.length,
      orders
    });
  }

  public static getOrderById(req: Request, res: Response): void {
    const { orderId } = req.params;
    const user = req.user;

    const order = db.orders.find(o => o.id === String(orderId) || o.orderNumber === String(orderId));
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    // Scope check: if user is scoped to a producer, prevent cross-producer order leakage
    if (user && user.roleSlug !== 'admin_geral' && user.scope.type === 'PRODUCER') {
      if (!user.scope.producerIds.includes(order.producerId)) {
        db.logSecurity({
          userId: user.id,
          email: user.email,
          eventType: 'SCOPE_VIOLATION',
          ipAddress: req.ip || '127.0.0.1',
          details: `Tentativa de consulta a pedido de outro produtor: Pedido ${order.id} do Produtor ${order.producerId}. Usuário pertence ao Produtor ${JSON.stringify(user.scope.producerIds)}`
        });

        res.status(403).json({
          error: 'ACESSO NEGADO — Você não possui autorização para consultar pedidos deste produtor.',
          statusCode: 403,
          details: {
            requestedOrderId: order.id,
            orderProducerId: order.producerId,
            userAuthorizedProducers: user.scope.producerIds
          },
          timestamp: new Date().toISOString(),
          path: req.originalUrl
        });
        return;
      }
    }

    res.json({
      order,
      consultedBy: req.user?.name,
      role: req.user?.roleName
    });
  }
}
