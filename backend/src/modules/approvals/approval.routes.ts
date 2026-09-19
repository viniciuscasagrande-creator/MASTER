import { Router } from 'express';
import { ApprovalController } from './approval.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission, requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Inbox, My Requests, History and Details
router.get('/inbox', requireAnyPermission(['aprovacoes.caixa.visualizar', 'aprovacoes.solicitacao.aprovar']), ApprovalController.getInbox);
router.get('/my-requests', requirePermission('aprovacoes.solicitacao.visualizar'), ApprovalController.getMyRequests);
router.get('/history', requirePermission('aprovacoes.historico.visualizar'), ApprovalController.getHistory);
router.get('/delegations', requirePermission('aprovacoes.delegacao.criar'), ApprovalController.listDelegations);
router.get('/:id', requirePermission('aprovacoes.solicitacao.visualizar'), ApprovalController.getDetails);

// Actions
router.post('/', requirePermission('aprovacoes.solicitacao.criar'), ApprovalController.createRequest);
router.post('/:id/approve', requirePermission('aprovacoes.solicitacao.aprovar'), ApprovalController.approve);
router.post('/:id/reject', requirePermission('aprovacoes.solicitacao.rejeitar'), ApprovalController.reject);
router.post('/:id/request-changes', requirePermission('aprovacoes.solicitacao.aprovar'), ApprovalController.requestChanges);
router.post('/:id/cancel', requirePermission('aprovacoes.solicitacao.cancelar'), ApprovalController.cancel);
router.post('/:id/execute', requireAnyPermission(['aprovacoes.solicitacao.aprovar', 'financeiro.transferir', 'estorno.aprovar']), ApprovalController.execute);
router.post('/:id/comments', ApprovalController.addComment);
router.post('/:id/attachments', ApprovalController.addAttachment);

// Delegations
router.post('/delegations', requirePermission('aprovacoes.delegacao.criar'), ApprovalController.createDelegation);
router.delete('/delegations/:id', requirePermission('aprovacoes.delegacao.criar'), ApprovalController.revokeDelegation);

export default router;
