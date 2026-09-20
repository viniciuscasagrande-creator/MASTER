import { prisma } from '../../../core/database/prisma';
import {
  EventTaskDTO,
  CreateEventTaskInput,
  ReadinessIssueDTO
} from '@shared/types/index';

export class EventTaskService {
  /**
   * Lista pendências operacionais e documentais do evento
   */
  static async listTasks(eventId: string, status?: string): Promise<EventTaskDTO[]> {
    const list = await prisma.eventTask.findMany({
      where: {
        eventId,
        status: status ? status : undefined
      }
    });

    return list.map((t: any) => ({
      id: t.id,
      eventId: t.eventId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      assigneeName: t.assigneeName,
      assigneeRole: t.assigneeRole,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      blockingPublication: t.blockingPublication,
      origin: t.origin,
      issueCode: t.issueCode,
      deduplicationKey: t.deduplicationKey,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Criação de pendência com chave de deduplicação idempotente
   */
  static async createTask(eventId: string, input: CreateEventTaskInput): Promise<EventTaskDTO> {
    if (input.deduplicationKey) {
      const existing = await prisma.eventTask.findFirst({
        where: {
          eventId,
          deduplicationKey: input.deduplicationKey
        }
      });

      if (existing && (existing.status === 'OPEN' || existing.status === 'IN_PROGRESS')) {
        return {
          id: existing.id,
          eventId: existing.eventId,
          title: existing.title,
          description: existing.description,
          priority: existing.priority,
          status: existing.status,
          assigneeName: existing.assigneeName,
          assigneeRole: existing.assigneeRole,
          dueDate: existing.dueDate ? new Date(existing.dueDate).toISOString() : null,
          blockingPublication: existing.blockingPublication,
          origin: existing.origin,
          issueCode: existing.issueCode,
          deduplicationKey: existing.deduplicationKey,
          createdAt: existing.createdAt ? new Date(existing.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: existing.updatedAt ? new Date(existing.updatedAt).toISOString() : new Date().toISOString()
        };
      }
    }

    const created = await prisma.eventTask.create({
      data: {
        eventId,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'MEDIUM',
        status: 'OPEN',
        assigneeName: input.assigneeName || null,
        assigneeRole: input.assigneeRole || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        blockingPublication: input.blockingPublication !== undefined ? input.blockingPublication : false,
        origin: input.origin || 'OPERATION',
        issueCode: input.issueCode || null,
        deduplicationKey: input.deduplicationKey || null
      }
    });

    return {
      id: created.id,
      eventId: created.eventId,
      title: created.title,
      description: created.description,
      priority: created.priority,
      status: created.status,
      assigneeName: created.assigneeName,
      assigneeRole: created.assigneeRole,
      dueDate: created.dueDate ? new Date(created.dueDate).toISOString() : null,
      blockingPublication: created.blockingPublication,
      origin: created.origin,
      issueCode: created.issueCode,
      deduplicationKey: created.deduplicationKey,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Converte apontamentos do Readiness Engine diretamente em pendências rastreáveis
   */
  static async generateTasksFromReadiness(eventId: string, issues: ReadinessIssueDTO[]): Promise<EventTaskDTO[]> {
    const createdTasks: EventTaskDTO[] = [];

    for (const issue of issues) {
      if (issue.severity === 'BLOCKING' || issue.severity === 'CRITICAL' || issue.severity === 'WARNING') {
        const deduplicationKey = `${eventId}:${issue.category}:${issue.code}`;
        const priority = issue.severity === 'CRITICAL' ? 'URGENT' : issue.severity === 'BLOCKING' ? 'HIGH' : 'MEDIUM';

        const task = await this.createTask(eventId, {
          title: issue.title,
          description: `${issue.description} (Alvo: ${issue.target})`,
          priority,
          blockingPublication: issue.severity === 'CRITICAL' || issue.severity === 'BLOCKING',
          origin: issue.category === 'DOCUMENTS' ? 'DOCUMENT' : 'READINESS',
          issueCode: issue.code,
          deduplicationKey
        });

        createdTasks.push(task);
      }
    }

    return createdTasks;
  }

  static async updateTaskStatus(
    taskId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ): Promise<EventTaskDTO> {
    const updated = await prisma.eventTask.update({
      where: { id: taskId },
      data: { status }
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      status: updated.status,
      assigneeName: updated.assigneeName,
      assigneeRole: updated.assigneeRole,
      dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString() : null,
      blockingPublication: updated.blockingPublication,
      origin: updated.origin,
      issueCode: updated.issueCode,
      deduplicationKey: updated.deduplicationKey,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
