import { Router } from 'express';
import { EventsController } from './events.controller';
import { requirePermission, requireScope } from '../auth/auth.middleware';

const router = Router();

// List events (scoped automatically in controller)
router.get('/', requirePermission('eventos.evento.visualizar'), EventsController.listEvents);

// Get event by ID (enforces scope check: Producer A cannot fetch Event B)
router.get(
  '/:eventId',
  requirePermission('eventos.evento.visualizar'),
  requireScope({ eventParam: 'eventId' }),
  EventsController.getEventById
);

// Create event (enforces producer scope check: Producer cannot create for another producer)
router.post(
  '/',
  requirePermission('eventos.evento.criar'),
  requireScope({ producerParam: 'producerId' }),
  EventsController.createEvent
);

export default router;
