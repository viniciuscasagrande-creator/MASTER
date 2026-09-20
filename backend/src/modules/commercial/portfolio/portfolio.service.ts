import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import {
  CommercialPortfolioAssignmentDTO,
  CommercialPortfolioSummaryDTO,
  CommercialPortfolioRole
} from '../../../../../shared/types';

export class PortfolioService {
  /**
   * Atribui um produtor à carteira comercial de um operador / gerente
   */
  public static async assignProducerToPortfolio(
    input: {
      producerId: string;
      userId: string;
      userName: string;
      userEmail: string;
      role: CommercialPortfolioRole;
    },
    assignedBy: any
  ): Promise<CommercialPortfolioAssignmentDTO> {
    const producer = await prisma.producer.findUnique({ where: { id: input.producerId } });
    if (!producer) throw new Error(`Produtor ${input.producerId} não encontrado.`);

    // Se a atribuição for PRIMARY, desativa anteriores com papel PRIMARY para manter titularidade única
    if (input.role === 'PRIMARY') {
      const existingPrimary = await prisma.commercialPortfolioAssignment.findMany({
        where: { producerId: input.producerId, role: 'PRIMARY', active: true }
      });
      for (const ex of existingPrimary) {
        await prisma.commercialPortfolioAssignment.update({
          where: { id: ex.id },
          data: { active: false }
        });
      }

      // Atualiza também o owner no CommercialAccount
      const acc = await prisma.commercialAccount.findUnique({ where: { producerId: input.producerId } });
      if (acc) {
        await prisma.commercialAccount.update({
          where: { producerId: input.producerId },
          data: {
            commercialOwnerId: input.userId,
            commercialOwnerName: input.userName
          }
        });
      }
    }

    const created = await prisma.commercialPortfolioAssignment.create({
      data: {
        producerId: input.producerId,
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        role: input.role,
        assignedBy: assignedBy.id,
        active: true
      }
    });

    await AuditService.log({
      action: 'PORTFOLIO_ASSIGNED',
      resource: `producer:${input.producerId}:portfolio:${created.id}`,
      userId: assignedBy.id,
      details: {
        targetUserId: input.userId,
        role: input.role,
        producerName: producer.name
      }
    });

    return {
      id: created.id,
      producerId: created.producerId,
      userId: created.userId,
      userName: created.userName,
      userEmail: created.userEmail,
      role: created.role as CommercialPortfolioRole,
      assignedAt: new Date(created.assignedAt).toISOString(),
      assignedBy: created.assignedBy,
      active: created.active
    };
  }

  /**
   * Remove atribuição de carteira
   */
  public static async removeProducerFromPortfolio(assignmentId: string, user: any): Promise<void> {
    const assignment = await prisma.commercialPortfolioAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new Error('Atribuição de carteira não encontrada.');

    await prisma.commercialPortfolioAssignment.update({
      where: { id: assignmentId },
      data: { active: false }
    });

    await AuditService.log({
      action: 'PORTFOLIO_UNASSIGNED',
      resource: `producer:${assignment.producerId}:portfolio:${assignmentId}`,
      userId: user.id,
      details: { unassignedUser: assignment.userId, role: assignment.role }
    });
  }

  /**
   * Lista atribuições ativas de um produtor
   */
  public static async listAssignmentsForProducer(producerId: string): Promise<CommercialPortfolioAssignmentDTO[]> {
    const list = await prisma.commercialPortfolioAssignment.findMany({
      where: { producerId, active: true }
    });

    return list.map((a: any) => ({
      id: a.id,
      producerId: a.producerId,
      userId: a.userId,
      userName: a.userName,
      userEmail: a.userEmail,
      role: a.role as CommercialPortfolioRole,
      assignedAt: new Date(a.assignedAt).toISOString(),
      assignedBy: a.assignedBy,
      active: a.active
    }));
  }

  /**
   * Retorna os produtores atribuídos a um operador comercial
   */
  public static async getPortfolioByOwner(ownerId: string): Promise<CommercialPortfolioAssignmentDTO[]> {
    const list = await prisma.commercialPortfolioAssignment.findMany({
      where: { userId: ownerId, active: true }
    });

    return list.map((a: any) => ({
      id: a.id,
      producerId: a.producerId,
      userId: a.userId,
      userName: a.userName,
      userEmail: a.userEmail,
      role: a.role as CommercialPortfolioRole,
      assignedAt: new Date(a.assignedAt).toISOString(),
      assignedBy: a.assignedBy,
      active: a.active
    }));
  }

  /**
   * Resumo quantitativo e objetivo da carteira de um operador (Minha Carteira)
   * Sem scores fictícios, apenas dados reais de produtores, eventos ativos, oportunidades e ações
   */
  public static async getMyPortfolioSummary(ownerId: string, ownerName?: string): Promise<CommercialPortfolioSummaryDTO> {
    const assignments = await prisma.commercialPortfolioAssignment.findMany({
      where: { userId: ownerId, active: true }
    });

    const producerIds = assignments.map((a: any) => a.producerId);

    // Contas comerciais dos produtores atribuídos
    const accounts = await prisma.commercialAccount.findMany({
      where: {
        producerId: { in: producerIds }
      }
    });

    // Eventos ativos
    const events = await prisma.event.findMany({
      where: {
        producerId: { in: producerIds }
      }
    });
    const activeEventsCount = events.filter((e: any) => e.status === 'ON_SALE' || e.status === 'IN_PROGRESS' || e.status === 'CONFIGURING').length;

    // Oportunidades abertas
    const opportunities = await prisma.commercialOpportunity.findMany({
      where: {
        OR: [
          { producerId: { in: producerIds } },
          { ownerId }
        ]
      }
    });
    const openOpportunitiesCount = opportunities.filter((o: any) => o.status === 'OPEN').length;

    // Pendências e Ações
    const now = new Date();
    let pendingActionsCount = 0;
    let overdueActionsCount = 0;

    for (const acc of accounts) {
      if (acc.nextActionAt) {
        pendingActionsCount++;
        if (new Date(acc.nextActionAt) < now) {
          overdueActionsCount++;
        }
      }
    }

    for (const opp of opportunities) {
      if (opp.status === 'OPEN' && opp.nextActionAt) {
        pendingActionsCount++;
        if (new Date(opp.nextActionAt) < now) {
          overdueActionsCount++;
        }
      }
    }

    return {
      ownerId,
      ownerName: ownerName || (assignments[0]?.userName || 'Operador Comercial'),
      producersCount: producerIds.length,
      activeEventsCount,
      openOpportunitiesCount,
      pendingActionsCount,
      overdueActionsCount
    };
  }
}
