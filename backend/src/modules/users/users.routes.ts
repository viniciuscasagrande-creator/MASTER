import { Router } from 'express';
import { UsersAdminController } from './users.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

// Apply authenticate to all admin user routes
router.use(authenticate);

// View routes
router.get('/', requirePermission('admin.usuarios.visualizar'), UsersAdminController.listUsers);
router.get('/:id', requirePermission('admin.usuarios.visualizar'), UsersAdminController.getUser);

// Management routes
router.post('/', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.createUser);
router.patch('/:id', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.updateUser);

// Roles assignment
router.post('/:id/roles', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.assignRole);
router.delete('/:id/roles/:roleId', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.removeRole);

// Permissions override
router.post('/:id/permissions', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.setPermissions);

// Scope assignment
router.post('/:id/producers', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.assignProducer);
router.post('/:id/events', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.assignEvent);

// Block / Unblock governance
router.post('/:id/block', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.blockUser);
router.post('/:id/unblock', requirePermission('admin.usuarios.gerenciar'), UsersAdminController.unblockUser);

export default router;
