import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Roles CRUD
router.get('/', requirePermission('admin.usuarios.visualizar'), RolesController.listRoles);
router.post('/', requirePermission('admin.usuarios.gerenciar'), RolesController.createRole);
router.get('/:id', requirePermission('admin.usuarios.visualizar'), RolesController.getRole);
router.patch('/:id', requirePermission('admin.usuarios.gerenciar'), RolesController.updateRole);

// Permissions
router.get('/catalog/permissions', requirePermission('admin.usuarios.visualizar'), RolesController.listPermissions);
router.post('/:id/permissions', requirePermission('admin.usuarios.gerenciar'), RolesController.assignPermissionToRole);
router.delete('/:id/permissions/:permissionId', requirePermission('admin.usuarios.gerenciar'), RolesController.removePermissionFromRole);

export default router;
