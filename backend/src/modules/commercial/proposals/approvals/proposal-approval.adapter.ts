import { prisma } from '../../../../core/database/prisma';
import { ApprovalEngineService } from '../../../approvals/engine/approval-engine.service';
import { AuditService } from '../../../audit/audit.service';

export class ProposalApprovalAdapter {
  /**
   * Submete uma versão específica da proposta comercial para alçada de aprovação interna
   */
  public static async submitForApproval(
    proposalId: string,
    versionNumber: number,
    justification: string | undefined,
    user: any,
    expectedVersion?: number
  ): Promise<any> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (expectedVersion !== undefined && proposal.version !== expectedVersion) {
      const err: any = new Error('Conflito de versão (HTTP 409): a proposta foi atualizada concorrentemente.');
      err.statusCode = 409;
      throw err;
    }

    const version = await prisma.commercialProposalVersion.findUnique({
      where: {
        proposalId_versionNumber: {
          proposalId,
          versionNumber: Number(versionNumber)
        }
      },
      include: { terms: true, events: true }
    });

    if (!version) {
      throw new Error(`Versão V${versionNumber} da proposta não encontrada.`);
    }

    if (version.status === 'APPROVED' || version.status === 'SENT' || version.status === 'ACCEPTED') {
      throw new Error(`A versão V${versionNumber} já se encontra no status ${version.status} e não pode ser reenviada para aprovação.`);
    }

    // Cria solicitação no motor central de aprovação (ApprovalEngineService)
    const requester = {
      id: user.id,
      name: user.name || user.email,
      roles: user.roles || (user.role ? [user.role] : ['COMERCIAL'])
    };

    let approvalReq: any = null;
    try {
      approvalReq = await ApprovalEngineService.createRequest(requester, {
        operation: 'COMMERCIAL_PROPOSAL',
        title: `Aprovação de Proposta Comercial: ${proposal.publicCode} (V${version.versionNumber})`,
        description: justification || `Submissão de condições comerciais da proposta ${proposal.publicCode} para aprovação interna.`,
        producerId: proposal.producerId,
        eventId: version.events && version.events[0] ? version.events[0].eventId : null,
        payload: {
          proposalId: proposal.id,
          publicCode: proposal.publicCode,
          proposalVersionId: version.id,
          versionNumber: version.versionNumber,
          contentHash: version.contentHash,
          terms: version.terms,
          events: version.events
        }
      });
    } catch (err: any) {
      // Se não houver regra configurada no ambiente, cria registro direto
      const requestCode = `APR-${Math.floor(1000 + Math.random() * 9000)}`;
      approvalReq = await prisma.approvalRequest.create({
        data: {
          requestCode,
          operation: 'COMMERCIAL_PROPOSAL',
          title: `Aprovação de Proposta Comercial: ${proposal.publicCode} (V${version.versionNumber})`,
          description: justification || null,
          resourceType: 'COMMERCIAL_PROPOSAL_VERSION',
          resourceId: version.id,
          producerId: proposal.producerId,
          requesterId: user.id,
          requesterName: user.name || 'Comercial',
          requesterRole: 'COMERCIAL',
          ruleId: 'rule_commercial_proposal',
          ruleVersion: 1,
          policySnapshot: JSON.stringify({ operation: 'COMMERCIAL_PROPOSAL', approvalsRequired: 1 }),
          status: 'PENDING',
          approvalsCount: 0,
          approvalsRequired: 1,
          currentStep: 1
        }
      });
    }

    // Atualiza versão e proposta para status APPROVAL_PENDING
    await prisma.commercialProposalVersion.update({
      where: { id: version.id },
      data: {
        status: 'APPROVAL_PENDING',
        approvalStatus: 'PENDING',
        approvalRequestId: approvalReq.id,
        rejectionReason: null
      }
    });

    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        status: 'APPROVAL_PENDING'
      }
    });

    // Auditoria
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'SUBMIT_FOR_APPROVAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Proposta ${proposal.publicCode} V${version.versionNumber} submetida para aprovação (Hash: ${version.contentHash.substring(0, 8)}...)`
    });

    return {
      proposalId,
      versionNumber: version.versionNumber,
      status: 'APPROVAL_PENDING',
      approvalRequestId: approvalReq.id,
      contentHash: version.contentHash
    };
  }

  /**
   * Decide sobre aprovação da versão da proposta comercial (Aprovar / Reprovar internamente)
   */
  public static async processDecision(
    proposalId: string,
    versionNumber: number,
    decision: 'APPROVE' | 'REJECT',
    reason: string | undefined,
    user: any,
    expectedVersion?: number
  ): Promise<any> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (expectedVersion !== undefined && proposal.version !== expectedVersion) {
      const err: any = new Error('Conflito de versão (HTTP 409): a proposta foi atualizada concorrentemente.');
      err.statusCode = 409;
      throw err;
    }

    const version = await prisma.commercialProposalVersion.findUnique({
      where: {
        proposalId_versionNumber: {
          proposalId,
          versionNumber: Number(versionNumber)
        }
      }
    });

    if (!version) {
      throw new Error(`Versão V${versionNumber} da proposta não encontrada.`);
    }

    // Validação estrita: Proibição de auto-aprovação (Maker-Checker)
    if (version.createdBy === user.id && !user.isSuperAdmin) {
      throw new Error('Segregação de funções violada: o criador da proposta não pode aprovar suas próprias condições comerciais.');
    }

    if (decision === 'APPROVE') {
      await prisma.commercialProposalVersion.update({
        where: { id: version.id },
        data: {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: user.id,
          approvedByName: user.name || 'Aprovador Comercial',
          rejectionReason: null
        }
      });

      await prisma.commercialProposal.update({
        where: { id: proposalId },
        data: {
          status: 'APPROVED'
        }
      });

      // Se houver aprovação no motor central, atualiza
      if (version.approvalRequestId) {
        await prisma.approvalRequest.update({
          where: { id: version.approvalRequestId },
          data: {
            status: 'APPROVED',
            approvalsCount: 1,
            executedAt: new Date()
          }
        }).catch(() => null);
      }

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'APPROVE_COMMERCIAL_PROPOSAL',
        resource: 'PROPOSTA_COMERCIAL',
        resourceId: proposal.id,
        producerId: proposal.producerId,
        details: `Proposta ${proposal.publicCode} V${version.versionNumber} APROVADA por ${user.name}`
      });

      return {
        proposalId,
        versionNumber: version.versionNumber,
        status: 'APPROVED',
        approvedBy: user.name,
        approvedAt: new Date().toISOString()
      };
    } else {
      // Rejeição interna
      if (!reason || reason.trim() === '') {
        throw new Error('Motivo da reprovação interna é obrigatório.');
      }

      await prisma.commercialProposalVersion.update({
        where: { id: version.id },
        data: {
          status: 'REJECTED_INTERNAL',
          approvalStatus: 'REJECTED',
          rejectionReason: reason.trim()
        }
      });

      await prisma.commercialProposal.update({
        where: { id: proposalId },
        data: {
          status: 'REJECTED_INTERNAL'
        }
      });

      if (version.approvalRequestId) {
        await prisma.approvalRequest.update({
          where: { id: version.approvalRequestId },
          data: {
            status: 'REJECTED'
          }
        }).catch(() => null);
      }

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'REJECT_COMMERCIAL_PROPOSAL',
        resource: 'PROPOSTA_COMERCIAL',
        resourceId: proposal.id,
        producerId: proposal.producerId,
        details: `Proposta ${proposal.publicCode} V${version.versionNumber} REPROVADA internamente: ${reason}`
      });

      return {
        proposalId,
        versionNumber: version.versionNumber,
        status: 'REJECTED_INTERNAL',
        rejectionReason: reason.trim()
      };
    }
  }
}
