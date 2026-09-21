import { Router } from 'express';
import { SacController } from './sac.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Central de Consulta & Métricas
router.get(
  '/metrics',
  requireAnyPermission(['sac.consulta.acessar', 'sac.pedido.visualizar']),
  SacController.getMetrics
);

router.get(
  '/query',
  requireAnyPermission(['sac.consulta.acessar', 'sac.cliente.visualizar', 'sac.pedido.visualizar']),
  SacController.queryCentral
);

// Atendimentos & Protocolos
router.get(
  '/tickets',
  requireAnyPermission(['sac.consulta.acessar', 'sac.cliente.visualizar']),
  SacController.listTickets
);

router.get(
  '/tickets/:id',
  requireAnyPermission(['sac.consulta.acessar', 'sac.cliente.visualizar']),
  SacController.getTicketById
);

router.post(
  '/tickets',
  requireAnyPermission(['sac.ticket.criar', 'sac.consulta.acessar']),
  SacController.createTicket
);

router.post(
  '/tickets/:id/messages',
  requireAnyPermission(['sac.ticket.criar', 'sac.consulta.acessar']),
  SacController.addMessage
);

router.patch(
  '/tickets/:id/status',
  requireAnyPermission(['sac.ticket.encerrar', 'sac.consulta.acessar']),
  SacController.updateStatus
);

// Handoff de Estorno (SAC solicita, Estorno processa)
router.post(
  '/refund-requests',
  requireAnyPermission(['estorno.solicitacao.criar', 'sac.consulta.acessar']),
  SacController.createRefundRequest
);

export default router;
