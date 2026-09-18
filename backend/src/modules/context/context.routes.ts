import { Router } from 'express';
import { ContextController } from './context.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { contextMiddleware } from './context.middleware';

const router = Router();

router.use(authenticate);
router.use(contextMiddleware);

// Get current operational context and available options
router.get('/', ContextController.getContext);

// Change active context
router.put('/producer/:producerId', ContextController.setProducer);
router.put('/event/:eventId', ContextController.setEvent);

// Clear active filters
router.delete('/event', ContextController.clearEvent);
router.delete('/producer', ContextController.clearProducer);

export default router;
