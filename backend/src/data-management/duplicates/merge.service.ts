import { MergePlan } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { EventBus } from '../../events/event-bus';

export class MergeService {
  /**
   * Safely executes an approved or draft MergePlan, reassigning relations and archiving duplicate.
   */
  public static async executeMerge(planId: string, actorUserId: string): Promise<MergePlan> {
    const raw = await prisma.mergePlanModel.findUnique({ where: { id: planId } });
    if (!raw) throw new Error(`Plano de mesclagem "${planId}" não encontrado.`);

    const plan: MergePlan = {
      id: raw.id,
      entityType: raw.entityType,
      primaryId: raw.primaryId,
      duplicateId: raw.duplicateId,
      primaryData: typeof raw.primaryData === 'string' ? JSON.parse(raw.primaryData) : raw.primaryData,
      duplicateData: typeof raw.duplicateData === 'string' ? JSON.parse(raw.duplicateData) : raw.duplicateData,
      mergedData: typeof raw.mergedData === 'string' ? JSON.parse(raw.mergedData) : raw.mergedData,
      reassignedRelations: typeof raw.reassignedRelations === 'string' ? JSON.parse(raw.reassignedRelations) : raw.reassignedRelations,
      requiresApproval: raw.requiresApproval,
      status: raw.status,
      createdAt: raw.createdAt.toISOString ? raw.createdAt.toISOString() : raw.createdAt
    };

    if (plan.status === 'COMPLETED') {
      return plan;
    }

    if (plan.entityType.toUpperCase() === 'CUSTOMERS' || plan.entityType.toUpperCase() === 'CUSTOMER') {
      // 1. Reassign orders
      const orders = await prisma.order.findMany({ where: { customerId: plan.duplicateId } });
      for (const order of orders) {
        await prisma.order.update({
          where: { id: order.id },
          data: { customerId: plan.primaryId }
        });
      }

      // 2. Reassign tickets
      const tickets = await prisma.ticket.findMany({ where: { customerId: plan.duplicateId } });
      for (const ticket of tickets) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { customerId: plan.primaryId }
        });
      }

      // 3. Reassign support tickets
      const supportTickets = await prisma.supportTicket.findMany({ where: { customerId: plan.duplicateId } });
      for (const st of supportTickets) {
        await prisma.supportTicket.update({
          where: { id: st.id },
          data: { customerId: plan.primaryId }
        });
      }

      // 4. Archive or soft-delete duplicate customer
      const dup = await prisma.customer.findUnique({ where: { id: plan.duplicateId } });
      if (dup) {
        await prisma.customer.update({
          where: { id: plan.duplicateId },
          data: {
            status: 'ARCHIVED',
            cpf: `${dup.cpf}_MERGED_${Date.now()}` // free unique constraint
          }
        });
      }
    }

    // Update Plan
    await prisma.mergePlanModel.update({
      where: { id: plan.id },
      data: { status: 'COMPLETED' }
    });
    plan.status = 'COMPLETED';

    // Emit event
    await EventBus.publish({
      id: `evt_merge_${Date.now()}`,
      type: 'DATA_MERGE_EXECUTED',
      resourceType: plan.entityType,
      resourceId: plan.primaryId,
      actorUserId,
      data: {
        planId: plan.id,
        primaryId: plan.primaryId,
        duplicateId: plan.duplicateId,
        reassignedRelations: plan.reassignedRelations
      },
      timestamp: new Date()
    });

    return plan;
  }
}
