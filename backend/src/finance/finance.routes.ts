import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { requirePermission, requireScope } from '../auth/auth.middleware';

const router = Router();

// Consult balance of a producer (must have permission + producer scope)
router.get(
  '/producers/:producerId/balance',
  requirePermission('financeiro.saldo.visualizar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceController.getBalance
);

// List transfers
router.get(
  '/transfers',
  requirePermission('financeiro.saldo.visualizar'),
  FinanceController.listTransfers
);

// Create transfer (requires financeiro.transferencia.criar + scope check)
router.post(
  '/transfers',
  requirePermission('financeiro.transferencia.criar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceController.createTransfer
);

// Approve transfer (requires financeiro.transferencia.aprovar - Carlos fails, Maria passes)
router.put(
  '/transfers/:transferId/approve',
  requirePermission('financeiro.transferencia.aprovar'),
  FinanceController.approveTransfer
);

export default router;
