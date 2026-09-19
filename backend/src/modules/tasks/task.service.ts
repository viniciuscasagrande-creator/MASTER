import { prisma } from '../../core/database/prisma';
import { AppError } from '../../core/errors/AppError';
import { AuthenticatedUser } from '../../core/middleware/authenticate';
import { DomainEvents } from '../../events/DomainEvents';
import { SlaService } from './sla/sla.service';
import { SlaPolicyService } from './sla/sla-policy.service';
import { AssignmentService } from './assignment/assignment.service';
import { TeamRouterService } from './assignment/team-router.service';
import { DutyRouterService } from './assignment/duty-router.service';
import { ApprovalEngineService } from '../approvals/engine/approval-engine.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
  ReassignTaskInput,
  WaitTaskInput,
  CompleteTaskInput,
  CancelTaskInput,
  ReopenTaskInput,
  AddCommentInput,
  UpdateChecklistItemInput,
  ListTasksQuery,
  TaskSummaryResponse
} from './task.types';
import { TaskStatus, TaskPriority, TaskModule, TaskWaitingReason } from '@shared/types/index';

export class TaskService {
  /**
   * Validate scope access: Producers can only see/modify their own tasks
   */
  public static validateTaskScope(task: any, user: AuthenticatedUser): void {
    if (!task) return;
    const isProducer = user.roles?.includes('PRODUTOR') || (user as any).role === 'PRODUTOR';
    const userProducerId = (user as any).producerId || user.scope?.producers?.[0] || null;
    if (isProducer && userProducerId) {
      if (task.producerId && task.producerId !== userProducerId) {
        throw new AppError('Acesso negado: tarefa pertence a outro produtor.', 403);
      }
    }
    // Event scope check if user is restricted to specific event
    const userEventId = (user as any).eventId || user.scope?.events?.[0] || null;
    if (userEventId && task.eventId && task.eventId !== userEventId) {
      throw new AppError('Acesso negado: tarefa pertence a outro evento.', 403);
    }
  }

  /**
   * Create a new task (manual or API)
   */
  public static async createTask(input: CreateTaskInput, user: AuthenticatedUser): Promise<any> {
    if (!input.title || !input.title.trim()) {
      throw new AppError('O título da tarefa é obrigatório.', 400);
    }
    if (!input.module) {
      throw new AppError('O módulo da tarefa é obrigatório.', 400);
    }

    // Scope check: producer cannot create tasks for another producer
    const isProducer = user.roles?.includes('PRODUTOR') || (user as any).role === 'PRODUTOR';
    const userProducerId = (user as any).producerId || user.scope?.producers?.[0] || null;
    const userEventId = (user as any).eventId || user.scope?.events?.[0] || null;
    const producerId = isProducer ? userProducerId : (input.producerId || null);
    const eventId = userEventId || input.eventId || null;

    // Resolve template if code provided
    let template: any = null;
    if (input.templateCode) {
      template = await prisma.taskTemplate.findUnique({ where: { code: input.templateCode } });
    }

    // Resolve team
    let targetTeam: any = null;
    if (input.assignedTeamId) {
      targetTeam = await prisma.team.findUnique({ where: { id: input.assignedTeamId } });
    } else if (input.assignedTeamCode || template?.targetTeamCode) {
      const code = input.assignedTeamCode || template.targetTeamCode;
      targetTeam = await prisma.team.findUnique({ where: { code } });
    }

    // Resolve initial assignee
    let assignedUserId = input.assignedUserId || null;
    let assignedUserName: string | null = null;

    if (assignedUserId) {
      const targetUser = await prisma.user.findUnique({ where: { id: assignedUserId } });
      if (!targetUser) throw new AppError('Usuário atribuído não encontrado.', 404);
      assignedUserName = targetUser.name;
    } else if (targetTeam?.id) {
      // Try duty schedule or workload routing
      assignedUserId = await DutyRouterService.findOnDutyUser({
        teamId: targetTeam.id,
        eventId: eventId || undefined,
        producerId: producerId || undefined
      });
      if (!assignedUserId) {
        assignedUserId = await TeamRouterService.routeToTeamMember(targetTeam.id, 'WORKLOAD');
      }
      if (assignedUserId) {
        const u = await prisma.user.findUnique({ where: { id: assignedUserId } });
        assignedUserName = u?.name || null;
      }
    }

    // Resolve priority and SLA
    const priority: TaskPriority = input.priority || template?.priority || 'NORMAL';
    const slaPolicy = await SlaPolicyService.findPolicy(input.module, priority);
    const durationMinutes = input.estimatedMinutes || template?.defaultEstimatedMinutes || slaPolicy?.durationMinutes || 120;
    const now = new Date();
    const calculatedDueAt = SlaPolicyService.calculateDeadline(now, durationMinutes);
    const dueAt = input.dueAt ? new Date(input.dueAt) : calculatedDueAt;

    // Check dependencies to determine initial status
    let initialStatus: TaskStatus = assignedUserId ? 'ASSIGNED' : 'OPEN';
    if (input.dependsOnTaskIds && input.dependsOnTaskIds.length > 0) {
      for (const depId of input.dependsOnTaskIds) {
        const parent = await prisma.task.findUnique({ where: { id: depId } });
        if (!parent || parent.status !== 'COMPLETED') {
          initialStatus = 'BLOCKED';
          break;
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title.trim(),
        description: input.description || template?.description || null,
        module: input.module,
        type: input.type || input.templateCode || 'MANUAL',
        priority,
        status: initialStatus,
        assignedUserId,
        assignedUserName,
        assignedTeamId: targetTeam?.id || null,
        assignedTeamName: targetTeam?.name || null,
        producerId,
        eventId,
        resourceType: input.resourceType || null,
        resourceId: input.resourceId || null,
        workflowId: input.workflowId || null,
        workflowRuleId: input.workflowRuleId || null,
        templateId: template?.id || null,
        slaPolicyId: slaPolicy?.id || null,
        dueAt,
        slaStartedAt: now,
        slaDeadline: dueAt,
        slaStatus: 'WITHIN_SLA',
        estimatedMinutes: durationMinutes,
        createdBy: user.id,
        creatorName: user.name
      }
    });

    // Create checklist items
    let checklistItems: Array<{ text: string; isRequired?: boolean }> = [];
    if (input.checklist && Array.isArray(input.checklist)) {
      checklistItems = input.checklist;
    } else if (template?.checklistTemplate) {
      try {
        checklistItems = JSON.parse(template.checklistTemplate);
      } catch {
        checklistItems = [];
      }
    }

    if (checklistItems.length > 0) {
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        await prisma.taskChecklistItem.create({
          data: {
            taskId: task.id,
            text: item.text,
            isRequired: item.isRequired === true,
            isCompleted: false,
            orderIndex: i + 1
          }
        });
      }
    }

    // Create dependencies
    if (input.dependsOnTaskIds && input.dependsOnTaskIds.length > 0) {
      for (const depId of input.dependsOnTaskIds) {
        await prisma.taskDependency.create({
          data: {
            taskId: task.id,
            dependsOnTaskId: depId
          }
        });
      }
    }

    // Record History
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId: user.id,
        userName: user.name,
        action: 'CREATED',
        details: JSON.stringify({
          title: task.title,
          module: task.module,
          priority: task.priority,
          assignedUserId,
          assignedTeamId: targetTeam?.id
        })
      }
    });

    // Dispatch event
    DomainEvents.dispatch({
      id: `evt_tsk_create_${task.id}_${Date.now()}`,
      type: 'TASK_CREATED',
      producerId: producerId || undefined,
      eventId: eventId || undefined,
      resourceType: 'TASK',
      resourceId: task.id,
      actorUserId: user.id,
      data: {
        taskId: task.id,
        taskNumber: task.taskNumber,
        title: task.title,
        module: task.module,
        priority: task.priority,
        assignedUserId,
        assignedTeamId: targetTeam?.id
      },
      timestamp: new Date()
    });

    return prisma.task.findUnique({ where: { id: task.id } });
  }

  /**
   * Get task by ID or taskNumber with scope check
   */
  public static async getById(idOrNumber: string, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({
      where: idOrNumber.startsWith('TSK-') ? { taskNumber: idOrNumber } : { id: idOrNumber }
    });
    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }
    this.validateTaskScope(task, user);

    // Refresh SLA status evaluation
    await SlaService.evaluateTaskSla(task);

    return prisma.task.findUnique({ where: { id: task.id } });
  }

  /**
   * List tasks with comprehensive filtering, scope isolation and pagination
   */
  public static async listTasks(query: ListTasksQuery, user: AuthenticatedUser): Promise<any> {
    const isProducer = user.roles?.includes('PRODUTOR') || (user as any).role === 'PRODUTOR';
    const userProducerId = (user as any).producerId || user.scope?.producers?.[0] || null;
    const effectiveProducerId = isProducer ? userProducerId : query.producerId;

    let tasks = await prisma.task.findMany({});

    // Filter by Producer scope
    if (effectiveProducerId) {
      tasks = tasks.filter(t => t.producerId === effectiveProducerId);
    }

    // Filter by Event scope
    const userEventId = (user as any).eventId || user.scope?.events?.[0] || null;
    if (userEventId) {
      tasks = tasks.filter(t => t.eventId === userEventId);
    } else if (query.eventId) {
      tasks = tasks.filter(t => t.eventId === query.eventId);
    }

    // Filter by Search (taskNumber, title, description)
    if (query.search && query.search.trim()) {
      const s = query.search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        (t.taskNumber && t.taskNumber.toLowerCase().includes(s)) ||
        (t.title && t.title.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s))
      );
    }

    // Filter by Status
    if (query.status) {
      if (Array.isArray(query.status)) {
        tasks = tasks.filter(t => query.status!.includes(t.status));
      } else {
        tasks = tasks.filter(t => t.status === query.status);
      }
    }

    // Filter by Priority
    if (query.priority) {
      tasks = tasks.filter(t => t.priority === query.priority);
    }

    // Filter by Module
    if (query.module) {
      tasks = tasks.filter(t => t.module === query.module);
    }

    // Filter by Assigned User
    if (query.assignedUserId) {
      tasks = tasks.filter(t => t.assignedUserId === query.assignedUserId);
    }

    // Filter by Assigned Team
    if (query.assignedTeamId) {
      tasks = tasks.filter(t => t.assignedTeamId === query.assignedTeamId);
    }

    // Filter by Resource
    if (query.resourceType) {
      tasks = tasks.filter(t => t.resourceType === query.resourceType);
    }
    if (query.resourceId) {
      tasks = tasks.filter(t => t.resourceId === query.resourceId);
    }

    // Filter by SLA Status
    if (query.slaStatus) {
      tasks = tasks.filter(t => t.slaStatus === query.slaStatus);
    }

    // Filter dueToday
    if (query.dueToday) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfDay = startOfDay + 86400000;
      tasks = tasks.filter(t => {
        if (!t.dueAt) return false;
        const due = new Date(t.dueAt).getTime();
        return due >= startOfDay && due <= endOfDay && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      });
    }

    // Filter isOverdue
    if (query.isOverdue) {
      const now = new Date().getTime();
      tasks = tasks.filter(t => {
        if (!t.dueAt) return false;
        return new Date(t.dueAt).getTime() < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      });
    }

    // Ordering
    const orderDir = query.orderDirection === 'asc' ? 1 : -1;
    if (query.orderBy === 'dueAt') {
      tasks.sort((a, b) => {
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return (new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()) * orderDir;
      });
    } else if (query.orderBy === 'priority') {
      const pWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      tasks.sort((a, b) => ((pWeights[b.priority] || 0) - (pWeights[a.priority] || 0)) * orderDir);
    } else {
      // Default: createdAt desc
      tasks.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * orderDir);
    }

    const total = tasks.length;
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginated = tasks.slice(skip, skip + limit);

    return {
      tasks: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Get inbox for currently authenticated user
   */
  public static async getMyInbox(user: AuthenticatedUser): Promise<any> {
    let tasks = await prisma.task.findMany({});
    tasks = tasks.filter(t => t.assignedUserId === user.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;

    let urgentCount = 0;
    let dueTodayCount = 0;
    let waitingCount = 0;

    for (const t of tasks) {
      if (t.priority === 'HIGH' || t.priority === 'CRITICAL') urgentCount++;
      if (t.status === 'WAITING') waitingCount++;
      if (t.dueAt) {
        const due = new Date(t.dueAt).getTime();
        if (due >= startOfDay && due <= endOfDay) dueTodayCount++;
      }
    }

    // Sort by priority weight desc, then dueAt asc
    const pWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    tasks.sort((a, b) => {
      const diffP = (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
      if (diffP !== 0) return diffP;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

    return {
      tasks,
      urgentCount,
      dueTodayCount,
      waitingCount,
      total: tasks.length
    };
  }

  /**
   * Get team inbox (unassigned queue for team)
   */
  public static async getTeamInbox(teamId: string, user: AuthenticatedUser): Promise<any> {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new AppError('Equipe não encontrada.', 404);

    let tasks = await prisma.task.findMany({});
    tasks = tasks.filter(t => t.assignedTeamId === teamId && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

    const unassigned = tasks.filter(t => !t.assignedUserId && t.status === 'OPEN');
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const waiting = tasks.filter(t => t.status === 'WAITING');

    return {
      team,
      tasks,
      unassigned,
      inProgress,
      waiting,
      total: tasks.length,
      unassignedCount: unassigned.length
    };
  }

  /**
   * Start task
   */
  public static async startTask(taskId: string, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new AppError('Não é possível iniciar uma tarefa concluída ou cancelada.', 400);
    }
    if (task.status === 'BLOCKED') {
      throw new AppError('Esta tarefa está bloqueada por dependências pendentes.', 400);
    }
    if (task.status === 'WAITING') {
      throw new AppError('Esta tarefa está em espera. Utilize a ação de retomar.', 400);
    }

    const previousStatus = task.status;
    const now = new Date();

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        assignedUserId: task.assignedUserId || user.id,
        assignedUserName: task.assignedUserName || user.name,
        startedAt: task.startedAt || now
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'STARTED',
        details: JSON.stringify({ fromStatus: previousStatus, toStatus: 'IN_PROGRESS' })
      }
    });

    DomainEvents.dispatch({
      id: `evt_start_${taskId}_${Date.now()}`,
      type: 'TASK_UPDATED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, status: 'IN_PROGRESS' },
      timestamp: now
    });

    return updated;
  }

  /**
   * Claim task (atomic lock preventing double claiming)
   */
  public static async claimTask(taskId: string, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    return AssignmentService.claimTask(taskId, user);
  }

  /**
   * Assign task to user/team
   */
  public static async assignTask(taskId: string, input: AssignTaskInput, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    return AssignmentService.reassignTask(
      taskId,
      {
        toUserId: input.userId,
        toTeamId: input.teamId,
        reason: input.reason || 'Atribuição de tarefa',
        comment: input.comment
      },
      user
    );
  }

  /**
   * Reassign task to user/team with mandatory reason
   */
  public static async reassignTask(taskId: string, input: ReassignTaskInput, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    return AssignmentService.reassignTask(taskId, input, user);
  }

  /**
   * Place task in WAITING state and pause SLA if allowed by policy
   */
  public static async waitTask(taskId: string, input: WaitTaskInput, user: AuthenticatedUser): Promise<any> {
    if (!input.reason) {
      throw new AppError('O motivo da espera é obrigatório.', 400);
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new AppError('Não é possível colocar em espera uma tarefa concluída ou cancelada.', 400);
    }

    // Call SlaService.pauseSla which checks if SLA policy allows pausing for this reason
    await SlaService.pauseSla(taskId, input.reason);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'WAITING',
        waitingReason: input.reason,
        waitingDetails: input.details || null
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({
          fromStatus: task.status,
          toStatus: 'WAITING',
          reason: input.reason,
          details: input.details
        })
      }
    });

    DomainEvents.dispatch({
      id: `evt_wait_${taskId}_${Date.now()}`,
      type: 'TASK_UPDATED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, status: 'WAITING', reason: input.reason },
      timestamp: new Date()
    });

    return updated;
  }

  /**
   * Resume paused/waiting task and extend SLA deadline
   */
  public static async resumeTask(taskId: string, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status !== 'WAITING') {
      throw new AppError('A tarefa não está em estado de espera.', 400);
    }

    // Call SlaService.resumeSla which calculates pause duration and extends SLA deadline
    await SlaService.resumeSla(taskId);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        waitingReason: null,
        waitingDetails: null
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'RESUMED',
        details: JSON.stringify({ fromStatus: 'WAITING', toStatus: 'IN_PROGRESS' })
      }
    });

    DomainEvents.dispatch({
      id: `evt_resume_${taskId}_${Date.now()}`,
      type: 'TASK_UPDATED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, status: 'IN_PROGRESS' },
      timestamp: new Date()
    });

    return updated;
  }

  /**
   * Complete task with mandatory checklist enforcement & dependent unblocking
   */
  public static async completeTask(taskId: string, input: CompleteTaskInput, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status === 'COMPLETED') {
      throw new AppError('A tarefa já está concluída.', 400);
    }
    if (task.status === 'CANCELLED') {
      throw new AppError('Não é possível concluir uma tarefa cancelada.', 400);
    }

    // Enforce mandatory checklist items
    const checklist = await prisma.taskChecklistItem.findMany({ where: { taskId } });
    const pendingRequired = checklist.filter(i => i.isRequired && !i.isCompleted);
    if (pendingRequired.length > 0) {
      throw new AppError(
        'Não é possível concluir a tarefa: existem itens obrigatórios pendentes no checklist.',
        400
      );
    }

    // Forward to Approval Engine if requested
    let approvalRequestId: string | null = null;
    if (input.forwardToApproval && input.approvalOperation) {
      try {
        const approvalEngine = new ApprovalEngineService();
        const approval = await approvalEngine.createRequest(user, {
          operation: input.approvalOperation as any,
          title: `Aprovação da tarefa ${task.taskNumber}: ${task.title}`,
          description: input.notes || task.description || undefined,
          amount: input.approvalAmount || 0,
          producerId: task.producerId || undefined,
          eventId: task.eventId || undefined,
          payload: {
            taskId: task.id,
            taskNumber: task.taskNumber,
            resourceType: 'TASK',
            resourceId: task.id,
            notes: input.notes
          }
        });
        approvalRequestId = approval?.id || null;
      } catch (err: any) {
        // If approval configuration not found or fails, log and continue or handle
        console.warn('[TaskService] Forward to approval note:', err.message);
      }
    }

    const now = new Date();
    const finalSlaStatus = task.slaStatus === 'BREACHED' ? 'BREACHED' : 'WITHIN_SLA';

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        completedByUserId: user.id,
        slaStatus: finalSlaStatus
      }
    });

    // Record History
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'COMPLETED',
        details: JSON.stringify({
          notes: input.notes,
          forwardToApproval: input.forwardToApproval,
          approvalRequestId
        })
      }
    });

    // Unblock dependent tasks
    const dependentLinks = await prisma.taskDependency.findMany({ where: { dependsOnTaskId: taskId } });
    for (const link of dependentLinks) {
      const depTaskId = link.taskId;
      const allDeps = await prisma.taskDependency.findMany({ where: { taskId: depTaskId } });
      let allCompleted = true;
      for (const dep of allDeps) {
        const parent = await prisma.task.findUnique({ where: { id: dep.dependsOnTaskId } });
        if (!parent || parent.status !== 'COMPLETED') {
          allCompleted = false;
          break;
        }
      }

      if (allCompleted) {
        const depTask = await prisma.task.findUnique({ where: { id: depTaskId } });
        if (depTask && depTask.status === 'BLOCKED') {
          const nextStatus = depTask.assignedUserId ? 'ASSIGNED' : 'OPEN';
          await prisma.task.update({
            where: { id: depTaskId },
            data: { status: nextStatus }
          });
          await prisma.taskHistory.create({
            data: {
              taskId: depTaskId,
              action: 'UNBLOCKED',
              details: JSON.stringify({ unblockedByTaskId: taskId })
            }
          });
        }
      }
    }

    // Emit event
    DomainEvents.dispatch({
      id: `evt_complete_${taskId}_${Date.now()}`,
      type: 'TASK_COMPLETED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, completedAt: now },
      timestamp: now
    });

    return updated;
  }

  /**
   * Cancel task
   */
  public static async cancelTask(taskId: string, input: CancelTaskInput, user: AuthenticatedUser): Promise<any> {
    if (!input.reason || !input.reason.trim()) {
      throw new AppError('O motivo do cancelamento é obrigatório.', 400);
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status === 'COMPLETED') {
      throw new AppError('Não é possível cancelar uma tarefa já concluída.', 400);
    }

    const now = new Date();
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelledReason: input.reason
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'CANCELLED',
        details: JSON.stringify({ reason: input.reason })
      }
    });

    DomainEvents.dispatch({
      id: `evt_cancel_${taskId}_${Date.now()}`,
      type: 'TASK_CANCELLED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, reason: input.reason },
      timestamp: now
    });

    return updated;
  }

  /**
   * Reopen completed or cancelled task
   */
  public static async reopenTask(taskId: string, input: ReopenTaskInput, user: AuthenticatedUser): Promise<any> {
    if (!input.reason || !input.reason.trim()) {
      throw new AppError('O motivo da reabertura é obrigatório.', 400);
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    if (task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
      throw new AppError('Apenas tarefas concluídas ou canceladas podem ser reabertas.', 400);
    }

    const nextStatus: TaskStatus = task.assignedUserId ? 'ASSIGNED' : 'OPEN';

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: nextStatus,
        completedAt: null,
        completedByUserId: null,
        cancelledAt: null,
        cancelledReason: null,
        slaStatus: 'WITHIN_SLA'
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'REOPENED',
        details: JSON.stringify({ reason: input.reason, previousStatus: task.status })
      }
    });

    DomainEvents.dispatch({
      id: `evt_reopen_${taskId}_${Date.now()}`,
      type: 'TASK_REOPENED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, reason: input.reason },
      timestamp: new Date()
    });

    return updated;
  }

  /**
   * Add comment to task
   */
  public static async addComment(taskId: string, input: AddCommentInput, user: AuthenticatedUser): Promise<any> {
    if (!input.content || !input.content.trim()) {
      throw new AppError('O conteúdo do comentário é obrigatório.', 400);
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        content: input.content.trim(),
        mentions: JSON.stringify(input.mentions || [])
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'COMMENT_ADDED',
        details: input.content.substring(0, 100)
      }
    });

    DomainEvents.dispatch({
      id: `evt_comment_${comment.id}_${Date.now()}`,
      type: 'TASK_COMMENT_CREATED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, commentId: comment.id, authorName: user.name },
      timestamp: new Date()
    });

    return comment;
  }

  /**
   * Update checklist item (check/uncheck)
   */
  public static async updateChecklistItem(
    taskId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
    user: AuthenticatedUser
  ): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);
    this.validateTaskScope(task, user);

    const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
    if (!item || item.taskId !== taskId) {
      throw new AppError('Item do checklist não encontrado.', 404);
    }

    const updated = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: input.isCompleted,
        completedAt: input.isCompleted ? new Date() : null,
        completedByUserId: input.isCompleted ? user.id : null
      }
    });

    return updated;
  }

  /**
   * Summary metrics for task dashboard and headers
   */
  public static async getSummaryMetrics(user: AuthenticatedUser): Promise<TaskSummaryResponse> {
    const isProducer = user.roles?.includes('PRODUTOR') || (user as any).role === 'PRODUTOR';
    const userProducerId = (user as any).producerId || user.scope?.producers?.[0] || null;
    const userEventId = (user as any).eventId || user.scope?.events?.[0] || null;
    let tasks = await prisma.task.findMany({});

    if (isProducer && userProducerId) {
      tasks = tasks.filter(t => t.producerId === userProducerId);
    }
    if (userEventId) {
      tasks = tasks.filter(t => t.eventId === userEventId);
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;

    let urgent = 0;
    let dueToday = 0;
    let waiting = 0;
    let overdue = 0;
    let completedToday = 0;

    const byModule: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const t of tasks) {
      // module
      byModule[t.module] = (byModule[t.module] || 0) + 1;
      // priority
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      // status
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;

      const isClosed = t.status === 'COMPLETED' || t.status === 'CANCELLED';

      if (!isClosed && (t.priority === 'HIGH' || t.priority === 'CRITICAL')) {
        urgent++;
      }
      if (t.status === 'WAITING') {
        waiting++;
      }
      if (t.status === 'COMPLETED' && t.completedAt) {
        const c = new Date(t.completedAt).getTime();
        if (c >= startOfDay && c <= endOfDay) completedToday++;
      }
      if (!isClosed && t.dueAt) {
        const d = new Date(t.dueAt).getTime();
        if (d >= startOfDay && d <= endOfDay) dueToday++;
        if (d < now.getTime()) overdue++;
      }
    }

    return {
      total: tasks.length,
      urgent,
      dueToday,
      waiting,
      overdue,
      completedToday,
      byModule,
      byPriority,
      byStatus
    };
  }
}
