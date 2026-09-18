import { Router } from 'express';
import { UsersController } from './users.controller';
import { requirePermission } from '../auth/auth.middleware';

const router = Router();

// List all users
router.get('/', requirePermission('admin.usuarios.visualizar'), UsersController.listUsers);

// Catalogs
router.get('/roles/catalog', UsersController.listRoles);
router.get('/permissions/catalog', UsersController.listPermissions);

// Single user
router.get('/:userId', requirePermission('admin.usuarios.visualizar'), UsersController.getUser);

// Update user permissions, scope, and status
router.put('/:userId/permissions', requirePermission('admin.usuarios.gerenciar'), UsersController.updateUser);

export default router;
