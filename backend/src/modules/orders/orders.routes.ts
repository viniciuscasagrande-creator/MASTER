import { Router } from 'express';
import { OrdersRealController } from './orders.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Orders query with SAC / Events permission
router.get(
  '/',
  requireAnyPermission(['sac.pedido.visualizar', 'eventos.evento.visualizar', 'sac.consulta.acessar']),
  OrdersRealController.listOrders
);

router.get(
  '/:id',
  requireAnyPermission(['sac.pedido.visualizar', 'eventos.evento.visualizar', 'sac.consulta.acessar']),
  OrdersRealController.getOrder
);

export default router;
