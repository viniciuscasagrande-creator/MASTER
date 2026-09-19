import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// List user notifications
router.get('/', NotificationController.listNotifications);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Notification preferences
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', NotificationController.updatePreference);

// Batch operations
router.patch('/read-all', NotificationController.markAllAsRead);

// Single notification operations
router.get('/:id', NotificationController.getNotificationById);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/:id/archive', NotificationController.archiveNotification);

// Admin Routes
router.get(
  '/admin/rules',
  requirePermission('admin.usuarios.visualizar'),
  NotificationController.listRules
);

router.post(
  '/admin/rules',
  requirePermission('admin.usuarios.gerenciar'),
  NotificationController.createRule
);

router.get(
  '/admin/deliveries',
  requirePermission('admin.usuarios.visualizar'),
  NotificationController.listDeliveries
);

export default router;
