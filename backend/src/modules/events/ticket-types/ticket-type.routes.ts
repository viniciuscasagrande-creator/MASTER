import { Router } from 'express';
import { TicketTypeController } from './ticket-type.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Catalog base
router.get('/catalog', requirePermission('eventos.ingresso.visualizar'), TicketTypeController.listCatalog);

// Event ticket types
router.get('/', requirePermission('eventos.ingresso.visualizar'), TicketTypeController.listEventTicketTypes);
router.post('/', requirePermission('eventos.ingresso.gerenciar'), TicketTypeController.createEventTicketType);
router.get('/:id', requirePermission('eventos.ingresso.visualizar'), TicketTypeController.getEventTicketType);
router.put('/:id', requirePermission('eventos.ingresso.gerenciar'), TicketTypeController.updateEventTicketType);
router.delete('/:id', requirePermission('eventos.ingresso.gerenciar'), TicketTypeController.deleteEventTicketType);

export default router;
