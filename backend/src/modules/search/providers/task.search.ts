import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class TaskSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if ((scope.allowedEntities as any).tasks === false) {
      return [];
    }

    const allTasks = await prisma.task.findMany({});
    const norm = query.normalized.toLowerCase();
    const isTaskCode = query.detectedType === 'TASK_CODE';

    const matches = allTasks.filter((task: any) => {
      // Scope filter: producer and event isolation
      if (!ScopeFilterService.matchesScope(task, scope)) {
        return false;
      }

      if (isTaskCode && query.extractedCode) {
        return task.taskNumber?.toLowerCase() === query.extractedCode.toLowerCase();
      }

      const numberMatch = task.taskNumber?.toLowerCase().includes(norm);
      const titleMatch = task.title?.toLowerCase().includes(norm);
      const descMatch = task.description?.toLowerCase().includes(norm);
      const moduleMatch = task.module?.toLowerCase().includes(norm);
      const assigneeMatch = task.assignedUserName?.toLowerCase().includes(norm);

      return numberMatch || titleMatch || descMatch || moduleMatch || assigneeMatch;
    });

    return matches.map((task: any) => {
      const priorityLabel = task.priority === 'CRITICAL' ? 'Crítica' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'NORMAL' ? 'Normal' : 'Baixa';
      const badgeVariant: 'danger' | 'warning' | 'default' | 'info' =
        task.priority === 'CRITICAL'
          ? 'danger'
          : task.priority === 'HIGH'
          ? 'warning'
          : task.status === 'COMPLETED'
          ? 'info'
          : 'default';

      return {
        id: task.id,
        entityType: 'TASK',
        title: `${task.taskNumber}: ${task.title}`,
        subtitle: `${task.module} • ${priorityLabel} • Status: ${task.status} • Resp: ${task.assignedUserName || 'Não atribuído'}`,
        status: task.status,
        badge: priorityLabel,
        badgeVariant,
        producerId: task.producerId,
        eventId: task.eventId,
        meta: {
          taskNumber: task.taskNumber,
          title: task.title,
          module: task.module,
          priority: task.priority,
          status: task.status,
          slaStatus: task.slaStatus,
          assignedUserName: task.assignedUserName,
          dueAt: task.dueAt
        },
        actionUrl: `/tasks/${task.id}`
      };
    });
  }
}
