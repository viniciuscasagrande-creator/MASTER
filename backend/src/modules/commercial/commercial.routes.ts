import { Router } from 'express';
import { CommercialController } from './commercial.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// 1. Dashboard Executivo Comercial (Fase 1.3.1)
router.get(
  '/dashboard',
  requireAnyPermission(['comercial.dashboard.visualizar', 'eventos.dashboard.comercial.visualizar']),
  CommercialController.getDashboard
);

// 2. Central de Vendas & Performance Comercial por Evento (Fase 1.3.2)
router.get(
  '/performance',
  requireAnyPermission(['comercial.vendas.performance.visualizar', 'comercial.vendas.visualizar']),
  CommercialController.getPerformance
);

// 3. Central de Pedidos (Fase 1.3.1)
router.get(
  '/orders',
  requireAnyPermission(['comercial.pedidos.visualizar']),
  CommercialController.listOrders
);

router.get(
  '/orders/:id',
  requireAnyPermission(['comercial.pedidos.detalhes', 'comercial.pedidos.visualizar']),
  CommercialController.getOrderById
);

router.post(
  '/orders',
  requireAnyPermission(['comercial.pedidos.visualizar', 'admin.sistema.configurar']),
  CommercialController.createOrder
);

router.post(
  '/orders/:id/transition',
  requireAnyPermission(['comercial.pedidos.detalhes', 'admin.sistema.configurar']),
  CommercialController.transitionOrder
);

// 4. Exportações
router.get(
  '/export/orders',
  requireAnyPermission(['comercial.pedidos.exportar']),
  CommercialController.exportOrders
);

router.get(
  '/export/sales',
  requireAnyPermission(['comercial.vendas.exportar']),
  CommercialController.exportSales
);

export default router;
