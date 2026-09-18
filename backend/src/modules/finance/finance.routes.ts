import { Router } from 'express';
import { FinanceRealController } from './finance.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission, requireAnyPermission } from '../../core/middleware/requirePermission';
import { requireScope } from '../../core/middleware/requireScope';

const router = Router();

router.use(authenticate);

// Balance consultation (scoped to producer)
router.get(
  '/producers/:producerId/balance',
  requirePermission('financeiro.saldo.visualizar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceRealController.getBalance
);

// List transfers
router.get(
  '/transfers',
  requireAnyPermission(['financeiro.saldo.visualizar', 'financeiro.repasses.visualizar']),
  FinanceRealController.listTransfers
);

// Create transfer (requires permission + producer scope)
router.post(
  '/transfers',
  requirePermission('financeiro.transferencia.criar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceRealController.createTransfer
);

// Approve transfer (strictly requires financeiro.transferencia.aprovar)
router.put(
  '/transfers/:id/approve',
  requirePermission('financeiro.transferencia.aprovar'),
  FinanceRealController.approveTransfer
);

export default router;
