import { Router } from 'express';
import { ObservabilityController } from './observability.controller';

export const createObservabilityRoutes = (controller?: ObservabilityController): Router => {
  const router = Router();
  const ctrl = controller || new ObservabilityController();

  // 1. Auditoria
  router.get('/audit', ctrl.getAuditLogs);
  router.get('/audit/logs', ctrl.getAuditLogs);
  router.get('/audit/export', ctrl.exportAudit);
  router.post('/audit/export', ctrl.exportAudit);
  router.get('/audit/resource/:resourceType/:resourceId', ctrl.getAuditByResource);
  router.get('/audit/user/:userId', ctrl.getAuditByUser);
  router.get('/audit/:id', ctrl.getAuditById);

  // 2. Rastreabilidade & Traces
  router.get('/operations/traces', ctrl.getTraces);
  router.get('/operations/traces/:correlationId', ctrl.getTraceByCorrelationId);
  router.get('/operations/resource/:resourceType/:resourceId/timeline', ctrl.getTimelineByResource);

  // 3. Observabilidade, Métricas, Erros e Saúde
  router.get('/observability/overview', ctrl.getOverview);
  router.get('/observability/health', ctrl.getHealth);
  router.get('/observability/events', ctrl.getBusinessEvents);
  router.get('/observability/outbox', ctrl.getOutboxEvents);
  router.get('/observability/inbox', ctrl.getInboxWebhooks);
  router.get('/observability/errors', ctrl.getErrors);
  router.get('/observability/errors/:id', ctrl.getErrorById);
  router.post('/observability/errors/:id/resolve', ctrl.resolveErrorGroup);
  router.get('/observability/performance', ctrl.getPerformance);
  router.get('/observability/queues', ctrl.getQueues);
  router.get('/observability/workers', ctrl.getWorkers);
  router.get('/observability/integrations', ctrl.getIntegrations);
  router.get('/observability/alerts', ctrl.getAlerts);
  router.post('/observability/alerts/:id/resolve', ctrl.resolveAlert);

  return router;
};

export const observabilityRoutes = createObservabilityRoutes();
