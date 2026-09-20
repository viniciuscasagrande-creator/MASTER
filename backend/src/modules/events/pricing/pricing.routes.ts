import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/matrix', requirePermission('eventos.precos.visualizar'), PricingController.getMatrix);
router.put('/config', requirePermission('eventos.precos.editar'), PricingController.savePriceConfig);
router.post('/bulk', requirePermission('eventos.precos.editar'), PricingController.bulkUpdate);
router.post('/copy', requirePermission('eventos.precos.editar'), PricingController.copyFromBatch);
router.post('/simulate', requirePermission('eventos.precos.visualizar'), PricingController.simulatePrice);

export default router;
