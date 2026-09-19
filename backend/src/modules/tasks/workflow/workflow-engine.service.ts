import { prisma } from '../../../core/database/prisma';
import { WorkflowRuleService } from './workflow-rule.service';
import { TeamRouterService } from '../assignment/team-router.service';
import { DutyRouterService } from '../assignment/duty-router.service';
import { SlaPolicyService } from '../sla/sla-policy.service';
import { DomainEvents } from '../../../events/DomainEvents';
import { TaskModule, TaskPriority } from '@shared/types/index';

export class WorkflowEngineService {
  /**
   * Process incoming system event against active workflows and rules
   */
  public static async processEvent(
    triggerEvent: string,
    payload: any,
    context?: { producerId?: string; eventId?: string; resourceType?: string; resourceId?: string }
  ): Promise<any[]> {
    const workflows = await prisma.workflow.findMany({
      where: {
        triggerEvent,
        isActive: true
      },
      include: { rules: true }
    });

    const createdTasks: any[] = [];

    for (const wf of workflows) {
      const rules = wf.rules || [];
      for (const rule of rules) {
        let conditionJson = {};
        let actionJson = {};

        try {
          conditionJson = typeof rule.conditionJson === 'string' ? JSON.parse(rule.conditionJson) : rule.conditionJson;
          actionJson = typeof rule.actionJson === 'string' ? JSON.parse(rule.actionJson) : rule.actionJson;
        } catch {
          continue;
        }

        const matches = WorkflowRuleService.evaluateCondition(conditionJson, payload);
        if (!matches) continue;

        // Execute Rule Actions
        if ((actionJson as any).createTasks && Array.isArray((actionJson as any).createTasks)) {
          for (const taskSpec of (actionJson as any).createTasks) {
            // 1. Resolve template if specified
            let template: any = null;
            if (taskSpec.templateCode) {
              template = await prisma.taskTemplate.findUnique({
                where: { code: taskSpec.templateCode }
              });
            }

            // 2. Resolve team
            let targetTeam: any = null;
            const teamCode = taskSpec.targetTeamCode || template?.targetTeamCode;
            if (teamCode) {
              targetTeam = await prisma.team.findUnique({ where: { code: teamCode } });
            } else if (rule.targetTeamId) {
              targetTeam = await prisma.team.findUnique({ where: { id: rule.targetTeamId } });
            }

            // 3. Resolve duty schedule or team router
            let assignedUserId: string | null = null;
            if (context?.eventId || targetTeam?.id) {
              assignedUserId = await DutyRouterService.findOnDutyUser({
                teamId: targetTeam?.id,
                eventId: context?.eventId,
                producerId: context?.producerId
              });
            }

            if (!assignedUserId && targetTeam?.id) {
              assignedUserId = await TeamRouterService.routeToTeamMember(targetTeam.id, 'WORKLOAD');
            }

            let assignedUserName: string | null = null;
            if (assignedUserId) {
              const u = await prisma.user.findUnique({ where: { id: assignedUserId } });
              assignedUserName = u?.name || null;
            }

            // 4. Resolve SLA
            const priority: TaskPriority = taskSpec.priority || template?.priority || rule.priority || 'NORMAL';
            const module: TaskModule = (wf.module as TaskModule) || 'GERAL';
            const slaMinutes = taskSpec.slaMinutes || template?.defaultEstimatedMinutes || rule.slaMinutes || 120;

            const slaPolicy = await SlaPolicyService.findPolicy(module, priority);
            const now = new Date();
            const dueAt = SlaPolicyService.calculateDeadline(now, slaMinutes);

            // 5. Build checklist from template
            let checklistItems: any[] = [];
            if (taskSpec.checklist && Array.isArray(taskSpec.checklist)) {
              checklistItems = taskSpec.checklist;
            } else if (template?.checklistTemplate) {
              try {
                checklistItems = JSON.parse(template.checklistTemplate);
              } catch {
                checklistItems = [];
              }
            }

            // 6. Create Task in database
            const created = await prisma.task.create({
              data: {
                title: taskSpec.title || template?.title || 'Tarefa Automática',
                description: taskSpec.description || template?.description || `Gerada pelo workflow: ${wf.name}`,
                module,
                type: taskSpec.templateCode || wf.triggerEvent,
                priority,
                status: assignedUserId ? 'ASSIGNED' : 'OPEN',
                assignedUserId,
                assignedUserName,
                assignedTeamId: targetTeam?.id || null,
                assignedTeamName: targetTeam?.name || null,
                producerId: context?.producerId || null,
                eventId: context?.eventId || null,
                resourceType: context?.resourceType || null,
                resourceId: context?.resourceId || null,
                workflowId: wf.id,
                workflowRuleId: rule.id,
                templateId: template?.id || null,
                slaPolicyId: slaPolicy?.id || null,
                dueAt,
                slaStartedAt: now,
                slaDeadline: dueAt,
                slaStatus: 'WITHIN_SLA',
                estimatedMinutes: slaMinutes,
                createdBy: 'SYSTEM_WORKFLOW_ENGINE',
                creatorName: 'Motor Central de Workflows'
              }
            });

            // Populate checklist items if present
            if (checklistItems.length > 0) {
              for (let i = 0; i < checklistItems.length; i++) {
                const item = checklistItems[i];
                await prisma.taskChecklistItem.create({
                  data: {
                    taskId: created.id,
                    text: item.text,
                    isRequired: item.isRequired === true,
                    isCompleted: false,
                    orderIndex: i + 1
                  }
                });
              }
            }

            // Record initial history
            await prisma.taskHistory.create({
              data: {
                taskId: created.id,
                action: 'CREATED',
                details: JSON.stringify({
                  workflowId: wf.id,
                  workflowName: wf.name,
                  triggerEvent,
                  assignedUserId,
                  assignedTeamId: targetTeam?.id
                })
              }
            });

            // Emit event
            DomainEvents.dispatch({
              id: `evt_tsk_create_${created.id}_${Date.now()}`,
              type: 'TASK_CREATED',
              producerId: context?.producerId || undefined,
              eventId: context?.eventId || undefined,
              resourceType: 'TASK',
              resourceId: created.id,
              data: {
                taskId: created.id,
                taskNumber: created.taskNumber,
                title: created.title,
                module: created.module,
                priority: created.priority,
                assignedUserId,
                assignedTeamId: targetTeam?.id
              },
              timestamp: new Date()
            });

            createdTasks.push(created);
          }
        }
      }
    }

    return createdTasks;
  }
}
