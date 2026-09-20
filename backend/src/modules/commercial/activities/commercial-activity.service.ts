import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { CommercialActivityDTO, CommercialActivityType } from '../../../../../shared/types';

export class CommercialActivityService {
  /**
   * Registra uma interação comercial realizada (reunião, ligação, email, WhatsApp, visita, nota)
   * e opcionalmente agenda uma Tarefa de Próxima Ação no Core Task Engine.
   */
  public static async registerActivity(
    input: {
      producerId?: string;
      leadId?: string;
      opportunityId?: string;
      type: CommercialActivityType;
      subject: string;
      description?: string;
      occurredAt?: string;
      nextActionAt?: string | null;
      nextActionDescription?: string | null;
      createNextActionTask?: boolean;
    },
    user: any
  ): Promise<CommercialActivityDTO> {
    if (!input.subject || input.subject.trim() === '') {
      throw new Error('Assunto da atividade comercial é obrigatório.');
    }

    if (!input.producerId && !input.leadId && !input.opportunityId) {
      throw new Error('A atividade deve estar vinculada a um Produtor, Prospecção ou Oportunidade.');
    }

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    let createdTaskId: string | null = null;

    // Se houver agendamento de próxima ação e flag createNextActionTask !== false, cria Tarefa real no Task Engine
    if (input.nextActionAt && input.createNextActionTask !== false) {
      try {
        const task = await prisma.task.create({
          data: {
            title: input.nextActionDescription || `Ação comercial: ${input.subject}`,
            description: input.description || `Originado da atividade comercial: ${input.subject}`,
            module: 'COMERCIAL',
            priority: 'HIGH',
            status: 'PENDING',
            dueDate: new Date(input.nextActionAt),
            assignedUserId: user.id,
            producerId: input.producerId || null,
            metadata: JSON.stringify({
              opportunityId: input.opportunityId,
              leadId: input.leadId,
              activitySubject: input.subject
            })
          }
        });
        createdTaskId = task.id;
      } catch (err) {
        console.warn('[CommercialActivity] Não foi possível vincular tarefa ao Task Engine:', err);
      }
    }

    const activity = await prisma.commercialActivity.create({
      data: {
        producerId: input.producerId || null,
        leadId: input.leadId || null,
        opportunityId: input.opportunityId || null,
        type: input.type,
        subject: input.subject.trim(),
        description: input.description || null,
        occurredAt,
        createdBy: user.id,
        createdByName: user.name || 'Operador Comercial',
        nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
        nextActionDescription: input.nextActionDescription || null,
        taskId: createdTaskId
      }
    });

    // Atualiza metadados no CommercialAccount se for produtor
    if (input.producerId) {
      const acc = await prisma.commercialAccount.findUnique({ where: { producerId: input.producerId } });
      if (acc) {
        await prisma.commercialAccount.update({
          where: { producerId: input.producerId },
          data: {
            lastContactAt: occurredAt,
            ...(input.nextActionAt !== undefined && {
              nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
              nextActionDescription: input.nextActionDescription || null
            })
          }
        });
      }
    }

    // Se vinculado a uma oportunidade, atualiza a data de próxima ação da oportunidade
    if (input.opportunityId) {
      const opp = await prisma.commercialOpportunity.findUnique({ where: { id: input.opportunityId } });
      if (opp && input.nextActionAt !== undefined) {
        await prisma.commercialOpportunity.update({
          where: { id: input.opportunityId },
          data: {
            nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
            nextActionDescription: input.nextActionDescription || null
          }
        });
      }
    }

    await AuditService.log({
      action: 'COMMERCIAL_ACTIVITY_REGISTERED',
      resource: `activity:${activity.id}`,
      userId: user.id,
      details: {
        type: activity.type,
        subject: activity.subject,
        producerId: activity.producerId,
        opportunityId: activity.opportunityId,
        taskId: createdTaskId
      }
    });

    return {
      id: activity.id,
      producerId: activity.producerId || undefined,
      leadId: activity.leadId || undefined,
      opportunityId: activity.opportunityId || undefined,
      type: activity.type as CommercialActivityType,
      subject: activity.subject,
      description: activity.description || undefined,
      occurredAt: new Date(activity.occurredAt).toISOString(),
      createdBy: activity.createdBy,
      createdByName: activity.createdByName,
      nextActionAt: activity.nextActionAt ? new Date(activity.nextActionAt).toISOString() : undefined,
      nextActionDescription: activity.nextActionDescription || undefined,
      taskId: activity.taskId || undefined,
      createdAt: new Date(activity.createdAt).toISOString()
    };
  }

  /**
   * Lista atividades registradas com filtros
   */
  public static async listActivities(
    filter: { producerId?: string; leadId?: string; opportunityId?: string },
    user: any
  ): Promise<CommercialActivityDTO[]> {
    let list = await prisma.commercialActivity.findMany();

    if (filter.opportunityId) {
      list = list.filter((a: any) => a.opportunityId === filter.opportunityId);
    } else if (filter.producerId) {
      list = list.filter((a: any) => a.producerId === filter.producerId);
    } else if (filter.leadId) {
      list = list.filter((a: any) => a.leadId === filter.leadId);
    }

    list.sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    return list.map((a: any) => ({
      id: a.id,
      producerId: a.producerId || undefined,
      leadId: a.leadId || undefined,
      opportunityId: a.opportunityId || undefined,
      type: a.type as CommercialActivityType,
      subject: a.subject,
      description: a.description || undefined,
      occurredAt: new Date(a.occurredAt).toISOString(),
      createdBy: a.createdBy,
      createdByName: a.createdByName,
      nextActionAt: a.nextActionAt ? new Date(a.nextActionAt).toISOString() : undefined,
      nextActionDescription: a.nextActionDescription || undefined,
      taskId: a.taskId || undefined,
      createdAt: new Date(a.createdAt).toISOString()
    }));
  }
}
