import { prisma } from '../../../core/database/prisma';
import { AppError } from '../../../core/errors/AppError';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { DomainEvents } from '../../../events/DomainEvents';

export class AssignmentService {
  /**
   * Claim task with concurrency protection (double-claiming prevention returning 409)
   */
  public static async claimTask(taskId: string, user: AuthenticatedUser): Promise<any> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new AppError('Não é possível assumir uma tarefa concluída ou cancelada.', 400);
    }

    // Atomic race-condition check: if already claimed by someone else
    if (task.assignedUserId && task.assignedUserId !== user.id) {
      throw new AppError('Esta tarefa já foi assumida por outro usuário.', 409);
    }

    const previousUserId = task.assignedUserId;
    const previousStatus = task.status;
    const newStatus = previousStatus === 'OPEN' ? 'IN_PROGRESS' : task.status;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedUserId: user.id,
        assignedUserName: user.name,
        status: newStatus,
        startedAt: task.startedAt || new Date()
      }
    });

    // Record Assignment
    await prisma.taskAssignment.create({
      data: {
        taskId,
        fromUserId: previousUserId || null,
        toUserId: user.id,
        assignmentType: 'CLAIMED',
        reason: 'Tarefa assumida pelo operador',
        assignedByUserId: user.id
      }
    });

    // Record History
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'CLAIMED',
        details: JSON.stringify({ previousStatus, newStatus })
      }
    });

    // Emit event
    DomainEvents.dispatch({
      id: `evt_claim_${taskId}_${Date.now()}`,
      type: 'TASK_CLAIMED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: { taskId, taskNumber: task.taskNumber, userId: user.id, userName: user.name },
      timestamp: new Date()
    });

    return updated;
  }

  /**
   * Reassign task with mandatory reason
   */
  public static async reassignTask(
    taskId: string,
    params: { toUserId?: string; toTeamId?: string; reason: string; comment?: string },
    user: AuthenticatedUser
  ): Promise<any> {
    if (!params.reason || !params.reason.trim()) {
      throw new AppError('O motivo da reatribuição é obrigatório.', 400);
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Tarefa não encontrada.', 404);

    let toUserName: string | null = null;
    let toTeamName: string | null = null;

    if (params.toUserId) {
      const targetUser = await prisma.user.findUnique({ where: { id: params.toUserId } });
      if (!targetUser) throw new AppError('Usuário de destino não encontrado.', 404);
      toUserName = targetUser.name;
    }

    if (params.toTeamId) {
      const targetTeam = await prisma.team.findUnique({ where: { id: params.toTeamId } });
      if (!targetTeam) throw new AppError('Equipe de destino não encontrada.', 404);
      toTeamName = targetTeam.name;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedUserId: params.toUserId || task.assignedUserId,
        assignedUserName: toUserName || task.assignedUserName,
        assignedTeamId: params.toTeamId || task.assignedTeamId,
        assignedTeamName: toTeamName || task.assignedTeamName,
        status: task.status === 'OPEN' && params.toUserId ? 'ASSIGNED' : task.status
      }
    });

    // Record Assignment
    await prisma.taskAssignment.create({
      data: {
        taskId,
        fromUserId: task.assignedUserId,
        toUserId: params.toUserId || task.assignedUserId,
        fromTeamId: task.assignedTeamId,
        toTeamId: params.toTeamId || task.assignedTeamId,
        assignmentType: 'MANUAL',
        reason: params.reason,
        comment: params.comment,
        assignedByUserId: user.id
      }
    });

    // Record History
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        userName: user.name,
        action: 'REASSIGNED',
        details: JSON.stringify({
          fromUser: task.assignedUserName,
          toUser: toUserName,
          fromTeam: task.assignedTeamName,
          toTeam: toTeamName,
          reason: params.reason,
          comment: params.comment
        })
      }
    });

    // Emit event
    DomainEvents.dispatch({
      id: `evt_reassign_${taskId}_${Date.now()}`,
      type: 'TASK_ASSIGNED',
      producerId: task.producerId || undefined,
      eventId: task.eventId || undefined,
      resourceType: 'TASK',
      resourceId: taskId,
      actorUserId: user.id,
      data: {
        taskId,
        taskNumber: task.taskNumber,
        toUserId: params.toUserId,
        toUserName,
        reason: params.reason
      },
      timestamp: new Date()
    });

    return updated;
  }
}
