import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import rolesRoutes from '../modules/roles/roles.routes';
import eventsRoutes from '../modules/events/events.routes';
import financeRoutes from '../modules/finance/finance.routes';
import ordersRoutes from '../modules/orders/orders.routes';
import auditRoutes from '../modules/audit/audit.routes';
import marketingRoutes from '../modules/marketing/marketing.routes';
import accountingRoutes from '../modules/accounting/accounting.routes';
import contextRoutes from '../modules/context/context.routes';
import adminDashboardRoutes from '../modules/admin/admin.dashboard.routes';
import sessionsRoutes from '../modules/sessions/sessions.routes';
import securityRoutes from '../modules/security/security.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import searchRoutes from '../modules/search/search.routes';
import approvalRoutes from '../modules/approvals/approval.routes';
import { approvalRulesAdminRouter, approvalThresholdsAdminRouter } from '../modules/approvals/approval-admin.routes';
import documentRoutes, { resourceDocumentsRouter } from '../modules/documents/document.routes';
import { taskRoutes } from '../modules/tasks/task.routes';
import { configurationRoutes } from '../modules/configuration/configuration.routes';
import { observabilityRoutes } from '../modules/observability/observability.routes';
import { analyticsRoutes, reportRoutes } from '../modules/analytics/analytics.routes';
import {
  createJobsRoutes,
  createJobBatchesRoutes,
  createJobSchedulesRoutes,
  createAdminProcessingRoutes
} from '../modules/jobs/jobs.routes';

const router = Router();

// Primary v1 endpoints
router.use('/', observabilityRoutes);
router.use('/auth', authRoutes);
router.use('/context', contextRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/security', securityRoutes);
router.use('/approvals', approvalRoutes);
router.use('/documents', documentRoutes);
router.use('/resources', resourceDocumentsRouter);
router.use('/tasks', taskRoutes);
router.use('/admin/tasks', taskRoutes);
router.use('/configurations', configurationRoutes);
router.use('/admin/configurations', configurationRoutes);
router.use('/admin', adminDashboardRoutes);
router.use('/admin/notifications', notificationRoutes);
router.use('/admin/security', securityRoutes);
router.use('/admin/sessions', sessionsRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/roles', rolesRoutes);
router.use('/admin/approval-rules', approvalRulesAdminRouter);
router.use('/admin/approval-thresholds', approvalThresholdsAdminRouter);
router.use('/events', eventsRoutes);
router.use('/finance', financeRoutes);
router.use('/orders', ordersRoutes);
router.use('/audit', auditRoutes);
router.use('/marketing', marketingRoutes);
router.use('/accounting', accountingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/jobs', createJobsRoutes());
router.use('/job-batches', createJobBatchesRoutes());
router.use('/job-schedules', createJobSchedulesRoutes());
router.use('/admin/processing', createAdminProcessingRoutes());

export default router;
