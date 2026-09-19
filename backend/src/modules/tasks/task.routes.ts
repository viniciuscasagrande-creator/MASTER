import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { TaskController } from './task.controller';
import { TaskAdminController } from './task-admin.controller';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// ----------------------------------------------------
// Operational & Summary endpoints
// ----------------------------------------------------
router.get('/summary', requirePermission('tarefas.central.visualizar'), TaskController.getSummary);
router.get('/my-inbox', requirePermission('tarefas.central.visualizar'), TaskController.getMyInbox);
router.get('/team-inbox/:teamId', requirePermission('tarefas.central.visualizar'), TaskController.getTeamInbox);

// Availability
router.get('/availability/me', TaskController.getMyAvailability);
router.patch('/availability/me', TaskController.updateMyAvailability);

// ----------------------------------------------------
// Admin Management (Workflows, Teams, SLA)
// ----------------------------------------------------
router.get('/admin/workflows', requirePermission('tarefas.workflow.visualizar'), TaskAdminController.listWorkflows);
router.post('/admin/workflows', requirePermission('tarefas.workflow.criar'), TaskAdminController.createWorkflow);
router.post('/admin/workflows/:id/versions', requirePermission('tarefas.workflow.editar'), TaskAdminController.createWorkflowVersion);

router.get('/admin/teams', requirePermission('tarefas.equipe.visualizar'), TaskAdminController.listTeams);
router.post('/admin/teams', requirePermission('tarefas.equipe.gerenciar'), TaskAdminController.createTeam);
router.post('/admin/teams/:teamId/members', requirePermission('tarefas.equipe.gerenciar'), TaskAdminController.addTeamMember);

router.get('/admin/sla-policies', requirePermission('tarefas.sla.visualizar'), TaskAdminController.listSlaPolicies);
router.post('/admin/sla-policies', requirePermission('tarefas.sla.configurar'), TaskAdminController.createSlaPolicy);

// ----------------------------------------------------
// Core Task CRUD & Operations
// ----------------------------------------------------
router.get('/', requirePermission('tarefas.central.visualizar'), TaskController.listTasks);
router.post('/', requirePermission('tarefas.tarefa.criar'), TaskController.createTask);
router.get('/:id', requirePermission('tarefas.central.visualizar'), TaskController.getById);

router.post('/:id/start', requirePermission('tarefas.central.visualizar'), TaskController.startTask);
router.post('/:id/claim', requirePermission('tarefas.tarefa.assumir'), TaskController.claimTask);
router.post('/:id/assign', requirePermission('tarefas.tarefa.reatribuir'), TaskController.assignTask);
router.post('/:id/reassign', requirePermission('tarefas.tarefa.reatribuir'), TaskController.reassignTask);
router.post('/:id/wait', requirePermission('tarefas.central.visualizar'), TaskController.waitTask);
router.post('/:id/resume', requirePermission('tarefas.central.visualizar'), TaskController.resumeTask);
router.post('/:id/complete', requirePermission('tarefas.tarefa.concluir'), TaskController.completeTask);
router.post('/:id/cancel', requirePermission('tarefas.tarefa.cancelar'), TaskController.cancelTask);
router.post('/:id/reopen', requirePermission('tarefas.tarefa.reabrir'), TaskController.reopenTask);

// Comments and checklist
router.post('/:id/comments', requirePermission('tarefas.central.visualizar'), TaskController.addComment);
router.patch('/:id/checklist/:itemId', requirePermission('tarefas.central.visualizar'), TaskController.updateChecklistItem);

export { router as taskRoutes };
