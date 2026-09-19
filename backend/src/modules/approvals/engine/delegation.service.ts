import { prisma } from '../../../core/database/prisma';
import { CreateDelegationDto } from '../approval.types';

export class DelegationService {
  /**
   * Creates a time-bounded approval delegation.
   */
  async createDelegation(delegatorId: string, dto: CreateDelegationDto): Promise<any> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new Error('A data final da delegação deve ser posterior à data inicial.');
    }

    if (dto.delegatedToId === delegatorId) {
      throw new Error('Não é possível delegar aprovações para si mesmo.');
    }

    const delegation = await prisma.approvalDelegation.create({
      data: {
        delegatorId,
        delegatedToId: dto.delegatedToId,
        operation: dto.operation || null,
        producerId: dto.producerId || null,
        startDate,
        endDate,
        isActive: true,
        reason: dto.reason || 'Delegação temporária de alçada'
      }
    });

    return delegation;
  }

  /**
   * Revokes or cancels an active delegation.
   */
  async revokeDelegation(userId: string, delegationId: string): Promise<any> {
    const delegation = await prisma.approvalDelegation.findUnique({
      where: { id: delegationId }
    });

    if (!delegation) {
      throw new Error('Delegação não encontrada.');
    }

    if (delegation.delegatorId !== userId) {
      throw new Error('Você só pode revogar suas próprias delegações.');
    }

    return prisma.approvalDelegation.update({
      where: { id: delegationId },
      data: { isActive: false }
    });
  }

  /**
   * Finds all active delegators that currently delegate their power to the given user.
   */
  async getActiveDelegatorsForUser(
    userId: string,
    operation?: string,
    producerId?: string | null
  ): Promise<string[]> {
    const now = new Date();
    const delegations = await prisma.approvalDelegation.findMany({
      where: {
        delegatedToId: userId,
        isActive: true
      }
    });

    return delegations
      .filter((d: any) => {
        const startOk = new Date(d.startDate) <= now;
        const endOk = new Date(d.endDate) >= now;
        if (!startOk || !endOk) return false;

        if (d.operation && operation && d.operation !== operation) return false;
        if (d.producerId && producerId && d.producerId !== producerId) return false;

        return true;
      })
      .map((d: any) => d.delegatorId);
  }

  /**
   * Verifies if user B can act on behalf of user A.
   */
  async canActOnBehalf(
    actingUserId: string,
    targetUserId: string,
    operation?: string,
    producerId?: string | null
  ): Promise<boolean> {
    if (actingUserId === targetUserId) return true;

    const activeDelegators = await this.getActiveDelegatorsForUser(actingUserId, operation, producerId);
    return activeDelegators.includes(targetUserId);
  }

  /**
   * List delegations where user is delegator or delegate.
   */
  async listUserDelegations(userId: string): Promise<any[]> {
    return prisma.approvalDelegation.findMany({
      where: {
        OR: [
          { delegatorId: userId },
          { delegatedToId: userId }
        ]
      }
    });
  }
}

export const delegationService = new DelegationService();
