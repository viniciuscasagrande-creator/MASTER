import { Router } from 'express';
import { EventsRealController } from './events.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { contextMiddleware } from '../context/context.middleware';
import { requirePermission } from '../../core/middleware/requirePermission';
import { requireScope } from '../../core/middleware/requireScope';

const router = Router();

router.use(authenticate);
router.use(contextMiddleware);

// List events with automatic query filtering based on user scope
router.get('/', requirePermission('eventos.evento.visualizar'), EventsRealController.listEvents);

// Get event by ID with strict scope validation (Producer A cannot access Event of Producer B)
router.get(
  '/:eventId',
  requirePermission('eventos.evento.visualizar'),
  requireScope({ eventParam: 'eventId' }),
  EventsRealController.getEvent
);

// Create event with producer scope check
router.post(
  '/',
  requirePermission('eventos.evento.criar'),
  requireScope({ producerParam: 'producerId' }),
  EventsRealController.createEvent
);

export default router;
