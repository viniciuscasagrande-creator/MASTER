import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

export const createAnalyticsRoutes = (controller?: AnalyticsController): Router => {
  const router = Router();
  const ctrl = controller || new AnalyticsController();

  // 1. Query Execution & Metadata
  router.post('/query', ctrl.executeQuery);
  router.get('/metrics', ctrl.getMetricsCatalog);
  router.get('/metrics/:code', ctrl.getMetricDetails);
  router.get('/metrics/:code/explain', ctrl.explainMetric);
  router.get('/dimensions', ctrl.getDimensionsCatalog);
  router.post('/cache/invalidate', ctrl.invalidateCache);
  router.get('/cache/stats', ctrl.getCacheStats);

  // 2. Dashboards & Widgets
  router.get('/dashboards/executive', ctrl.getExecutiveDashboard);
  router.get('/dashboards/producer/:producerId', ctrl.getProducerDashboard);
  router.get('/dashboards/domain/:domain', ctrl.getDomainDashboard);
  router.get('/dashboards/widgets', ctrl.getAllWidgets);

  // 3. Goals (Realizado x Meta)
  router.get('/goals', ctrl.listGoals);
  router.post('/goals', ctrl.createGoal);
  router.put('/goals/:id/progress', ctrl.updateGoalProgress);
  router.delete('/goals/:id', ctrl.deleteGoal);

  // 4. Exports Center
  router.post('/export', ctrl.requestExport);
  router.get('/exports', ctrl.listExports);
  router.get('/exports/:id', ctrl.getExportById);
  router.get('/exports/:id/download', ctrl.downloadExport);

  // 5. Schedules
  router.get('/schedules', ctrl.listSchedules);
  router.post('/schedules', ctrl.createSchedule);
  router.put('/schedules/:id', ctrl.updateSchedule);
  router.delete('/schedules/:id', ctrl.deleteSchedule);
  router.post('/schedules/:id/run', ctrl.runScheduleNow);

  return router;
};

export const createReportRoutes = (controller?: AnalyticsController): Router => {
  const router = Router();
  const ctrl = controller || new AnalyticsController();

  // Reports CRUD & Execution
  router.get('/', ctrl.listReports);
  router.post('/', ctrl.createReport);
  router.get('/:id', ctrl.getReportById);
  router.put('/:id', ctrl.updateReport);
  router.delete('/:id', ctrl.deleteReport);
  router.post('/:id/duplicate', ctrl.duplicateReport);
  router.post('/:id/share', ctrl.shareReport);
  router.post('/:id/execute', ctrl.executeReport);

  // Snapshots
  router.get('/:reportId/snapshots', ctrl.listSnapshots);
  router.post('/:reportId/snapshots', ctrl.createSnapshot);
  router.get('/snapshots/:snapshotId', ctrl.getSnapshotById);

  return router;
};

export const analyticsRoutes = createAnalyticsRoutes();
export const reportRoutes = createReportRoutes();
export default analyticsRoutes;
