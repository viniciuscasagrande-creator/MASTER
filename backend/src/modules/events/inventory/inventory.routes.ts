import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Inventory Summary KPIs
router.get('/summary', requirePermission('eventos.evento.visualizar'), InventoryController.getInventorySummary);

// Inventory Pools
router.get('/pools', requirePermission('eventos.evento.visualizar'), InventoryController.listPools);

// Hold & Release (Transactional reservations)
router.post('/holds', requirePermission('eventos.evento.visualizar'), InventoryController.holdInventory);
router.post('/holds/release', requirePermission('eventos.evento.visualizar'), InventoryController.releaseHold);

// Allocations / Quotas
router.put('/pools/:poolId/allocations', requirePermission('eventos.setor.gerenciar'), InventoryController.saveAllocation);
router.delete('/pools/:poolId/allocations/:eventTicketTypeId', requirePermission('eventos.setor.gerenciar'), InventoryController.removeAllocation);

// Administrative Blocks
router.post('/pools/:poolId/blocks', requirePermission('eventos.setor.gerenciar'), InventoryController.createBlock);
router.delete('/blocks/:blockId', requirePermission('eventos.setor.gerenciar'), InventoryController.releaseBlock);

export default router;
