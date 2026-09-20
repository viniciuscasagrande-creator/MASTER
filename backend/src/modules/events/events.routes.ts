import { Router } from 'express';
import { EventController } from './event.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { contextMiddleware } from '../context/context.middleware';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);
router.use(contextMiddleware);

// 1. Resumo e KPIs de Eventos (respeitando o mesmo escopo)
router.get('/summary', requirePermission('eventos.evento.visualizar'), EventController.getEventSummary);

// 2. Listagem com busca, filtros e paginação
router.get('/', requirePermission('eventos.evento.visualizar'), EventController.listEvents);

// 3. Detalhes de um Evento (por ID ou publicCode)
router.get('/:eventId', requirePermission('eventos.evento.visualizar'), EventController.getEvent);

// 4. Criação de Evento (Rascunho)
router.post('/', requirePermission('eventos.evento.criar'), EventController.createEvent);

// 5. Seleção de Contexto Operacional
router.put('/:eventId/context', requirePermission('eventos.evento.visualizar'), EventController.selectEventContext);

export default router;
