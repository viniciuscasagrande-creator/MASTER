import { Router } from 'express';
import { TicketBatchController } from './ticket-batch.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('eventos.lote.visualizar'), TicketBatchController.listBatches);
router.post('/', requirePermission('eventos.lote.gerenciar'), TicketBatchController.createBatch);
router.get('/:id', requirePermission('eventos.lote.visualizar'), TicketBatchController.getBatch);
router.put('/:id', requirePermission('eventos.lote.gerenciar'), TicketBatchController.updateBatch);
router.patch('/:id/status', requirePermission('eventos.lote.gerenciar'), TicketBatchController.transitionStatus);
router.delete('/:id', requirePermission('eventos.lote.gerenciar'), TicketBatchController.deleteBatch);

export default router;
