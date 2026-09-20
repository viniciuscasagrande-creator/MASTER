import { MergePlan } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class MergePlanService {
  /**
   * Previews and builds a MergePlan analyzing all relational dependencies before consolidation.
   */
  public static async createPlan(
    entityType: string,
    primaryId: string,
    duplicateId: string
  ): Promise<MergePlan> {
    if (primaryId === duplicateId) {
      throw new Error('Não é possível criar plano de mesclagem para o mesmo identificador.');
    }

    let primaryData: any = {};
    let duplicateData: any = {};
    const reassignedRelations: { relationName: string; count: number }[] = [];

    if (entityType.toUpperCase() === 'CUSTOMERS' || entityType.toUpperCase() === 'CUSTOMER') {
      primaryData = await prisma.customer.findUnique({ where: { id: primaryId } }) || {};
      duplicateData = await prisma.customer.findUnique({ where: { id: duplicateId } }) || {};

      // Count orders
      const ordersCount = await prisma.order.count({ where: { customerId: duplicateId } });
      reassignedRelations.push({ relationName: 'Pedidos (Orders)', count: ordersCount });

      // Count tickets
      const ticketsCount = await prisma.ticket.count({ where: { customerId: duplicateId } });
      reassignedRelations.push({ relationName: 'Ingressos (Tickets)', count: ticketsCount });

      // Count support tickets
      const supportCount = await prisma.supportTicket.count({ where: { customerId: duplicateId } });
      reassignedRelations.push({ relationName: 'Atendimentos SAC', count: supportCount });

      // Count refunds
      const refundsCount = await prisma.refund.count({ where: { customerId: duplicateId } });
      reassignedRelations.push({ relationName: 'Solicitações de Estorno', count: refundsCount });
    }

    const totalReassigned = reassignedRelations.reduce((acc, r) => acc + r.count, 0);
    // Requires Approval Engine if more than 5 critical relations are reassigned
    const requiresApproval = totalReassigned >= 5;

    const mergedData = {
      ...duplicateData,
      ...primaryData,
      id: primaryId,
      updatedAt: new Date().toISOString()
    };

    const planId = `mp_${Date.now()}`;
    const plan: MergePlan = {
      id: planId,
      entityType,
      primaryId,
      duplicateId,
      primaryData,
      duplicateData,
      mergedData,
      reassignedRelations,
      requiresApproval,
      status: requiresApproval ? 'WAITING_APPROVAL' : 'DRAFT',
      createdAt: new Date().toISOString()
    };

    await prisma.mergePlanModel.create({
      data: {
        id: plan.id,
        entityType: plan.entityType,
        primaryId: plan.primaryId,
        duplicateId: plan.duplicateId,
        primaryData: JSON.stringify(plan.primaryData),
        duplicateData: JSON.stringify(plan.duplicateData),
        mergedData: JSON.stringify(plan.mergedData),
        reassignedRelations: JSON.stringify(plan.reassignedRelations),
        requiresApproval: plan.requiresApproval,
        status: plan.status
      }
    });

    return plan;
  }
}
