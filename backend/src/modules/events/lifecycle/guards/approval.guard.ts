import { ITransitionGuard, GuardResult } from './transition-guard.interface';
import { prisma } from '../../../../core/database/prisma';

export class ApprovalGuard implements ITransitionGuard {
  public readonly name = 'APPROVAL_RESOLVED';

  async evaluate(eventId: string): Promise<GuardResult> {
    // Check if there is an approval request for EVENT_PUBLICATION
    const approvalRequests = await (prisma as any).approvalRequest?.findMany?.({
      where: {
        eventId,
        operation: 'EVENT_PUBLICATION'
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    }) || (prisma as any).approvalRequests?.filter(
      (r: any) => r.eventId === eventId && r.operation === 'EVENT_PUBLICATION'
    ) || [];

    const latest = Array.isArray(approvalRequests) ? approvalRequests[0] : null;

    if (!latest) {
      // If no explicit approval request was opened, check if the event requires formal approval
      // Default to requiring an approval request if status is APPROVAL_PENDING
      return {
        passed: false,
        code: 'APPROVAL_NOT_FOUND',
        message: 'Nenhuma solicitação de aprovação executiva (EVENT_PUBLICATION) foi encontrada para este evento.'
      };
    }

    if (latest.status === 'APPROVED') {
      return {
        passed: true,
        details: { approvalRequestId: latest.id, approvedAt: latest.updatedAt || latest.createdAt }
      };
    }

    return {
      passed: false,
      code: 'APPROVAL_PENDING_OR_REJECTED',
      message: `Aprovação executiva pendente ou não concedida. Status atual da solicitação: ${latest.status}.`,
      details: { approvalRequestId: latest.id, status: latest.status }
    };
  }
}
