import { Router } from 'express';
import { ComplimentaryController } from './complimentary.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Categorias
router.get('/categories', requirePermission('eventos.cortesias.visualizar'), ComplimentaryController.listCategories);
router.post('/categories', requirePermission('eventos.cortesias.gerenciar'), ComplimentaryController.createCategory);

// Cotas
router.get('/quotas', requirePermission('eventos.cortesias.visualizar'), ComplimentaryController.getQuotas);
router.post('/quotas', requirePermission('eventos.cortesias.gerenciar'), ComplimentaryController.setQuota);

// Solicitações
router.get('/requests', requirePermission('eventos.cortesias.visualizar'), ComplimentaryController.listRequests);
router.post('/requests', requirePermission('eventos.cortesias.solicitar'), ComplimentaryController.createRequest);
router.post('/requests/:requestId/guests', requirePermission('eventos.cortesias.solicitar'), ComplimentaryController.addGuests);
router.post('/requests/:requestId/approve', requirePermission('eventos.cortesias.aprovar'), ComplimentaryController.approveRequest);
router.post('/requests/:requestId/reject', requirePermission('eventos.cortesias.aprovar'), ComplimentaryController.rejectRequest);
router.post('/requests/:requestId/issue', requirePermission('eventos.cortesias.emitir'), ComplimentaryController.issueTickets);
router.post('/requests/:requestId/cancel', requirePermission('eventos.cortesias.gerenciar'), ComplimentaryController.cancelRequest);

export default router;
