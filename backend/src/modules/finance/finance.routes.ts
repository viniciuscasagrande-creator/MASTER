import { Router } from 'express';
import { FinanceRealController } from './finance.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission, requireAnyPermission } from '../../core/middleware/requirePermission';
import { requireScope } from '../../core/middleware/requireScope';

const router = Router();

router.use(authenticate);

// 1. Resumo financeiro consolidado e saldos
router.get(
  '/summary',
  requirePermission('financeiro.saldo.visualizar'),
  FinanceRealController.getSummary
);

// 2. Saldos detalhados por evento
router.get(
  '/event-balances',
  requirePermission('financeiro.saldo.visualizar'),
  FinanceRealController.getEventBalances
);

// 3. Extrato analítico de lançamentos
router.get(
  '/statement',
  requirePermission('financeiro.saldo.visualizar'),
  FinanceRealController.getStatement
);

// 4. Repasses programados e histórico
router.get(
  '/payouts',
  requirePermission('financeiro.repasses.visualizar'),
  FinanceRealController.listPayouts
);

// 5. Agendar novo repasse
router.post(
  '/payouts/schedule',
  requireAnyPermission(['financeiro.transferencia.criar', 'financeiro.repasses.aprovar']),
  FinanceRealController.schedulePayout
);

// 6. Aprovar repasse (Maker-Checker)
router.post(
  '/payouts/:id/approve',
  requirePermission('financeiro.repasses.aprovar'),
  FinanceRealController.approvePayout
);

// 7. Processar liquidação bancária
router.post(
  '/payouts/:id/process',
  requirePermission('financeiro.repasses.aprovar'),
  FinanceRealController.processPayout
);

// 8. Rejeitar repasse
router.post(
  '/payouts/:id/reject',
  requirePermission('financeiro.repasses.aprovar'),
  FinanceRealController.rejectPayout
);

// 9. Conciliação com adquirentes e gateways
router.get(
  '/reconciliation',
  requireAnyPermission(['financeiro.conciliacao.executar', 'financeiro.saldo.visualizar']),
  FinanceRealController.getReconciliation
);

// Rotas de Compatibilidade
router.get(
  '/producers/:producerId/balance',
  requirePermission('financeiro.saldo.visualizar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceRealController.getBalance
);

router.get(
  '/transfers',
  requireAnyPermission(['financeiro.saldo.visualizar', 'financeiro.repasses.visualizar']),
  FinanceRealController.listTransfers
);

router.post(
  '/transfers',
  requirePermission('financeiro.transferencia.criar'),
  requireScope({ producerParam: 'producerId' }),
  FinanceRealController.createTransfer
);

router.put(
  '/transfers/:id/approve',
  requirePermission('financeiro.transferencia.aprovar'),
  FinanceRealController.approveTransfer
);

export default router;
