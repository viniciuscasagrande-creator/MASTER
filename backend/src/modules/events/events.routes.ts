import { Router } from 'express';
import { EventController } from './event.controller';
import { EventDraftController } from './creation/event-draft.controller';
import { EventWizardController } from './wizard/event-wizard.controller';
import { EventCategoryController } from './categories/event-category.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { contextMiddleware } from '../context/context.middleware';
import { requirePermission } from '../../core/middleware/requirePermission';

import { EventVenueController } from './event-venue/event-venue.controller';
import eventSessionRoutes from './sessions/event-session.routes';
import eventTicketTypeRoutes from './ticket-types/ticket-type.routes';
import eventInventoryRoutes from './inventory/inventory.routes';
import eventBatchRoutes from './batches/ticket-batch.routes';
import eventPricingRoutes from './pricing/pricing.routes';
import eventSalesRuleRoutes from './sales-rules/sales-rule.routes';
import eventSalesChannelRoutes from './sales-channels/sales-channel.routes';
import eventComplimentaryRoutes from './complimentary/complimentary.routes';
import eventTeamRoutes from './team/event-team.routes';
import eventDocumentRoutes from './documents/event-document.routes';
import eventTaskRoutes from './tasks/event-task.routes';
import eventReadinessRoutes from './readiness/event-readiness.routes';
import eventLifecycleRoutes from './lifecycle/event-lifecycle.routes';
import eventChangeRoutes from './changes/event-change.routes';
import eventDashboardRoutes from './dashboard/event-dashboard.routes';

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

// 5.1 Vínculo Evento-Local e Estrutura Operacional (Fase 1.2.3)
router.post('/:eventId/venues', requirePermission('eventos.locais.vincular'), EventVenueController.linkVenue);
router.get('/:eventId/venues', requirePermission('eventos.locais.visualizar'), EventVenueController.getEventVenues);
router.delete('/:eventId/venues/:venueId', requirePermission('eventos.locais.vincular'), EventVenueController.unlinkVenue);
router.get('/:eventId/sections', requirePermission('eventos.locais.visualizar'), EventVenueController.listEventSections);
router.put('/:eventId/sections/:id', requirePermission('eventos.locais.editar'), EventVenueController.updateEventSection);

// 5.2 Datas, Sessões e Capacidade (Fase 1.2.4)
router.use('/:eventId/sessions', eventSessionRoutes);

// 5.3 Setores e Tipos de Ingresso (Fase 1.2.5)
router.use('/:eventId/ticket-types', eventTicketTypeRoutes);

// 5.4 Inventário Vendável & Cotas (Fase 1.2.5)
router.use('/:eventId/inventory', eventInventoryRoutes);

// 5.5 Lotes Comerciais (Fase 1.2.6)
router.use('/:eventId/batches', eventBatchRoutes);

// 5.6 Preços & Taxas (Fase 1.2.6)
router.use('/:eventId/pricing', eventPricingRoutes);

// 5.7 Regras de Venda (Fase 1.2.6)
router.use('/:eventId/sales-rules', eventSalesRuleRoutes);

// 5.8 Canais de Venda e Distribuição (Fase 1.2.7)
router.use('/:eventId/sales-channels', eventSalesChannelRoutes);

// 5.9 Cortesias e Convites (Fase 1.2.7)
router.use('/:eventId/complimentary', eventComplimentaryRoutes);

// 5.10 Equipe do Evento e Escala (Fase 1.2.7)
router.use('/:eventId/team', eventTeamRoutes);

// 5.11 Documentos e Conformidade Legal (Fase 1.2.8)
router.use('/:eventId/documents', eventDocumentRoutes);

// 5.12 Pendências e Tarefas Operacionais (Fase 1.2.8)
router.use('/:eventId/tasks', eventTaskRoutes);

// 5.13 Central de Preparação & Readiness Engine (Fase 1.2.8)
router.use('/:eventId/readiness', eventReadinessRoutes);

// 5.14 Ciclo de Vida, Revisão e Publicação (Fase 1.2.9)
router.use('/:eventId', eventLifecycleRoutes);

// 5.15 Alterações Críticas e Análise de Impacto (Fase 1.2.10)
router.use('/:eventId/changes', eventChangeRoutes);

// 5.16 Dashboard Executivo e Operacional (Fase 1.2.11)
router.use('/:eventId/dashboard', eventDashboardRoutes);

// 6. Listagem com busca, filtros e paginação
router.get('/', requirePermission('eventos.evento.visualizar'), EventController.listEvents);

// 7. Detalhes de um Evento (por ID ou publicCode)
router.get('/:eventId', requirePermission('eventos.evento.visualizar'), EventController.getEvent);

// 8. Criação de Evento
router.post('/', requirePermission('eventos.evento.criar'), EventController.createEvent);

// 9. Seleção de Contexto Operacional
router.put('/:eventId/context', requirePermission('eventos.evento.visualizar'), EventController.selectEventContext);

export default router;

