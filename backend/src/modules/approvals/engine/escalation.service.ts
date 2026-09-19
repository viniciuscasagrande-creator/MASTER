import { prisma } from '../../../core/database/prisma';
import { auditService } from '../../audit/audit.service';

export class EscalationService {
  /**
   * Scans open approval requests and checks for SLA expiration.
   */
  async checkSlaExpirations(): Promise<{ checked: number; expired: number }> {
    const now = new Date();
    const openRequests = await prisma.approvalRequest.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        rule: true,
        steps: true
      }
    });

    let expiredCount = 0;

    for (const req of openRequests) {
      if (!req.rule || !req.rule.slaHours) continue;

      const createdTime = new Date(req.createdAt).getTime();
      const slaMillis = req.rule.slaHours * 60 * 60 * 1000;
      const expirationTime = createdTime + slaMillis;

      if (now.getTime() > expirationTime) {
        expiredCount++;

        // Escalate to escalation role if defined
        if (req.rule.escalationRoleId) {
          const currentStep = (req.steps || []).find((s: any) => s.status === 'IN_PROGRESS');
          if (currentStep && currentStep.roleId !== req.rule.escalationRoleId) {
            await prisma.approvalStep.update({
              where: { id: currentStep.id },
              data: {
                roleId: req.rule.escalationRoleId,
                note: `Escalonado automaticamente por expiração de SLA (${req.rule.slaHours}h)`
              }
            });

            await prisma.approvalComment.create({
              data: {
                requestId: req.id,
                userId: 'system',
                comment: `⚠️ SLA expirado (${req.rule.slaHours}h). Solicitação escalonada para o perfil superior.`
              }
            });

            await auditService.log({
              userId: 'system',
              action: 'APPROVAL_SLA_ESCALATED',
              resource: 'approval_request',
              resourceId: req.id,
              details: {
                ruleId: req.rule.id,
                slaHours: req.rule.slaHours,
                escalatedToRole: req.rule.escalationRoleId
              }
            });
          }
        }
      }
    }

    return { checked: openRequests.length, expired: expiredCount };
  }
}

export const escalationService = new EscalationService();
