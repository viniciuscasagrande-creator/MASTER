import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { requireAnyPermission } from '../auth/auth.middleware';

const router = Router();

// Allow SAC, Event operators, or Admin to list and view orders (with strict scope verification inside controller)
router.get(
  '/',
  requireAnyPermission(['sac.pedido.visualizar', 'eventos.evento.visualizar', 'sac.consulta.acessar']),
  OrdersController.listOrders
);

router.get(
  '/:orderId',
  requireAnyPermission(['sac.pedido.visualizar', 'eventos.evento.visualizar', 'sac.consulta.acessar']),
  OrdersController.getOrderById
);

export default router;
