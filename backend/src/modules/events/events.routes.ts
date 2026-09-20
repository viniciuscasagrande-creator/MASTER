import { Router } from 'express';
import { EventController } from './event.controller';
import { EventDraftController } from './creation/event-draft.controller';
import { EventWizardController } from './wizard/event-wizard.controller';
import { EventCategoryController } from './categories/event-category.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { contextMiddleware } from '../context/context.middleware';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);
router.use(contextMiddleware);

// 1. Resumo e KPIs de Eventos (respeitando o mesmo escopo)
router.get('/summary', requirePermission('eventos.evento.visualizar'), EventController.getEventSummary);

// 2. Criação Antecipada de Rascunho (Fase 1.2.2)
router.post('/drafts', requirePermission('eventos.evento.criar'), EventDraftController.createDraft);

// 3. Verificação de Disponibilidade de Slug (Fase 1.2.2)
router.get('/slug-availability', requirePermission('eventos.evento.visualizar'), EventDraftController.checkSlugAvailability);

// 3.1 Categorias de Eventos (Fase 1.2.2)
router.get('/categories', requirePermission('eventos.evento.visualizar'), EventCategoryController.listCategories);
router.get('/categories/hierarchy', requirePermission('eventos.evento.visualizar'), EventCategoryController.listCategories);

// 4. Wizard de Configuração do Evento (Fase 1.2.2)
router.get('/:eventId/wizard', requirePermission('eventos.evento.visualizar'), EventWizardController.getWizard);
router.put('/:eventId/wizard/step', requirePermission('eventos.evento.editar'), EventWizardController.updateStep);
router.post('/:eventId/wizard/validate', requirePermission('eventos.evento.visualizar'), EventWizardController.validateWizard);

// 5. Autosave e Edição de Rascunho (Fase 1.2.2)
router.patch('/:eventId/draft', requirePermission('eventos.evento.editar'), EventDraftController.patchDraft);
router.delete('/:eventId/draft', requirePermission('eventos.evento.rascunho.descartar'), EventDraftController.discardDraft);

// 6. Listagem com busca, filtros e paginação
router.get('/', requirePermission('eventos.evento.visualizar'), EventController.listEvents);

// 7. Detalhes de um Evento (por ID ou publicCode)
router.get('/:eventId', requirePermission('eventos.evento.visualizar'), EventController.getEvent);

// 8. Criação de Evento
router.post('/', requirePermission('eventos.evento.criar'), EventController.createEvent);

// 9. Seleção de Contexto Operacional
router.put('/:eventId/context', requirePermission('eventos.evento.visualizar'), EventController.selectEventContext);

export default router;
