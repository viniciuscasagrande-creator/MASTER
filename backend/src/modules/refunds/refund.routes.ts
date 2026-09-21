import { Router } from 'express';
import { RefundController } from './refund.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// 1. Resumo de Métricas Operacionais
router.get(
  '/metrics',
  requireAnyPermission([
    'estorno.solicitacao.visualizar',
    'financeiro.visualizar',
    'sac.consulta.acessar',
    'admin.operacional'
  ]),
  RefundController.getMetrics
);

// 2. Avaliação de Elegibilidade Factual (Pré-abertura)
router.get(
  '/eligibility/:orderId',
  requireAnyPermission([
    'estorno.solicitacao.criar',
    'estorno.solicitacao.visualizar',
    'sac.consulta.acessar',
    'financeiro.visualizar'
  ]),
  RefundController.checkEligibility
);

// 3. Listagem de Solicitações com Filtros e Isolamento de Escopo
router.get(
  '/',
  requireAnyPermission([
    'estorno.solicitacao.visualizar',
    'financeiro.visualizar',
    'sac.consulta.acessar',
    'admin.operacional'
  ]),
  RefundController.listRefunds
);

// 4. Detalhes de Solicitação & Plano de Reversão
router.get(
  '/:id',
  requireAnyPermission([
    'estorno.solicitacao.visualizar',
    'financeiro.visualizar',
    'sac.consulta.acessar'
  ]),
  RefundController.getRefund
);

// 5. Nova Solicitação de Estorno
router.post(
  '/',
  requireAnyPermission([
    'estorno.solicitacao.criar',
    'sac.consulta.acessar',
    'financeiro.visualizar'
  ]),
  RefundController.createRefund
);

// 6. Triagem & Revisão Técnica
router.post(
  '/:id/review',
  requireAnyPermission([
    'estorno.solicitacao.criar',
    'estorno.solicitacao.aprovar',
    'financeiro.visualizar'
  ]),
  RefundController.reviewRefund
);

// 7. Aprovação de Alçada (Maker-Checker)
router.post(
  '/:id/approve',
  requireAnyPermission([
    'estorno.solicitacao.aprovar',
    'financeiro.estornos.executar',
    'admin.operacional'
  ]),
  RefundController.approveRefund
);

// 8. Rejeição Formal de Estorno
router.post(
  '/:id/reject',
  requireAnyPermission([
    'estorno.solicitacao.aprovar',
    'financeiro.estornos.executar',
    'admin.operacional'
  ]),
  RefundController.rejectRefund
);

// 9. Processamento Bancário no Gateway com Idempotência
router.post(
  '/:id/process',
  requireAnyPermission([
    'estorno.executar',
    'financeiro.estornos.executar',
    'admin.operacional'
  ]),
  RefundController.processRefund
);

// 10. Retentativa de Estorno com Falha
router.post(
  '/:id/retry',
  requireAnyPermission([
    'estorno.executar',
    'financeiro.estornos.executar',
    'admin.operacional'
  ]),
  RefundController.retryRefund
);

// 11. Cancelamento da Solicitação
router.post(
  '/:id/cancel',
  requireAnyPermission([
    'estorno.solicitacao.criar',
    'estorno.solicitacao.visualizar'
  ]),
  RefundController.cancelRefund
);

export default router;
