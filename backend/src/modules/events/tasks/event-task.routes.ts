import { Router } from 'express';
import { EventTaskController } from './event-task.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('eventos.pendencias.visualizar'), EventTaskController.listTasks);
router.post('/', requirePermission('eventos.pendencias.gerenciar'), EventTaskController.createTask);
router.patch('/:taskId/status', requirePermission('eventos.pendencias.gerenciar'), EventTaskController.updateTaskStatus);
router.post('/generate-from-readiness', requirePermission('eventos.pendencias.gerenciar'), EventTaskController.generateTasksFromReadiness);

export default router;
