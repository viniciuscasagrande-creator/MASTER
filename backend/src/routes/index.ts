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

const router = Router();

// Primary v1 endpoints
router.use('/auth', authRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/roles', rolesRoutes);
router.use('/events', eventsRoutes);
router.use('/finance', financeRoutes);
router.use('/orders', ordersRoutes);
router.use('/audit', auditRoutes);
router.use('/marketing', marketingRoutes);
router.use('/accounting', accountingRoutes);

export default router;
