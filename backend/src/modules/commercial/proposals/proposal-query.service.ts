import { prisma } from '../../../core/database/prisma';
import { ProposalService } from './proposal.service';
import { CommercialProposalDTO, CommercialProposalMetricsDTO } from '../../../../../shared/types';

export class ProposalQueryService {
  /**
   * Lista propostas comerciais paginadas com filtros e isolamento de escopo
   */
  public static async listProposals(
    filters: {
      status?: string;
      producerId?: string;
      opportunityId?: string;
      ownerId?: string;
      search?: string;
      page?: number;
      limit?: number;
      pendingApproval?: boolean;
    },
    user: any
  ): Promise<{ data: CommercialProposalDTO[]; total: number; page: number; limit: number }> {
    // Executa sweep idempotente de expirações antes de listar
    await ProposalService.sweepExpiredProposals().catch(() => null);

    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 20)));

    let allProposals = await prisma.commercialProposal.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        producer: true,
        versions: true,
        acceptances: true,
        deliveries: true
      }
    });

    // 1. Isolamento de escopo por produtor (se usuário for produtor)
    const isProducerUser = user.role === 'PRODUTOR' || (user.roles && user.roles.includes('PRODUTOR'));
    if (isProducerUser && user.producerId) {
      allProposals = allProposals.filter((p: any) => p.producerId === user.producerId);
    } else if (filters.producerId) {
      allProposals = allProposals.filter((p: any) => p.producerId === filters.producerId);
    }

    // 2. Filtro por oportunidade
    if (filters.opportunityId) {
      allProposals = allProposals.filter((p: any) => p.opportunityId === filters.opportunityId);
    }

    // 3. Filtro por responsável (minhas propostas)
    if (filters.ownerId) {
      allProposals = allProposals.filter((p: any) => p.ownerId === filters.ownerId);
    }

    // 4. Filtro por status
    if (filters.status) {
      allProposals = allProposals.filter((p: any) => p.status === filters.status);
    }

    // 5. Filtro aguardando aprovação
    if (filters.pendingApproval) {
      allProposals = allProposals.filter((p: any) => p.status === 'APPROVAL_PENDING');
    }

    // 6. Busca textual por código público, título ou nome do produtor
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      allProposals = allProposals.filter((p: any) => {
        const matchCode = (p.publicCode || '').toLowerCase().includes(q);
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchProducer = (p.producer?.name || '').toLowerCase().includes(q);
        return matchCode || matchTitle || matchProducer;
      });
    }

    const total = allProposals.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = allProposals.slice(startIndex, startIndex + limit);

    const hasSensitivePermission = user.isSuperAdmin || (user.permissions && user.permissions.includes('comercial.propostas.condicoes.visualizar'));

    const formattedData: CommercialProposalDTO[] = await Promise.all(
      paginatedItems.map(async (item: any) => {
        const full = await ProposalService.getProposalById(item.id);
        if (!hasSensitivePermission) {
          full.internalNotes = null;
        }
        return full;
      })
    );

    return {
      data: formattedData,
      total,
      page,
      limit
    };
  }

  /**
   * Calcula métricas agregadas de propostas para os KPIs do Comercial B2B
   */
  public static async getProposalMetrics(user: any): Promise<CommercialProposalMetricsDTO> {
    await ProposalService.sweepExpiredProposals().catch(() => null);

    let proposals = await prisma.commercialProposal.findMany({
      include: { versions: true, acceptances: true }
    });

    const isProducerUser = user.role === 'PRODUTOR' || (user.roles && user.roles.includes('PRODUTOR'));
    if (isProducerUser && user.producerId) {
      proposals = proposals.filter((p: any) => p.producerId === user.producerId);
    }

    const totalProposals = proposals.length;
    let draftCount = 0;
    let pendingApprovalCount = 0;
    let sentCount = 0;
    let acceptedCount = 0;
    let declinedCount = 0;
    let expiredCount = 0;

    let totalApprovalTimeMs = 0;
    let approvalTimeCount = 0;

    let totalDecisionTimeMs = 0;
    let decisionTimeCount = 0;

    let activeValueUnderProposal = 0;

    for (const prop of proposals) {
      switch (prop.status) {
        case 'DRAFT':
        case 'IN_REVIEW':
          draftCount++;
          break;
        case 'APPROVAL_PENDING':
          pendingApprovalCount++;
          break;
        case 'SENT':
        case 'VIEWED':
        case 'APPROVED':
        case 'READY_TO_SEND':
          sentCount++;
          break;
        case 'ACCEPTED':
          acceptedCount++;
          break;
        case 'DECLINED':
          declinedCount++;
          break;
        case 'EXPIRED':
          expiredCount++;
          break;
      }

      // Calcula tempos médios se houver versão
      for (const ver of prop.versions || []) {
        if (ver.approvedAt && ver.createdAt) {
          const diff = new Date(ver.approvedAt).getTime() - new Date(ver.createdAt).getTime();
          if (diff > 0) {
            totalApprovalTimeMs += diff;
            approvalTimeCount++;
          }
        }
      }

      // Decisão (Aceite)
      if (prop.acceptances && prop.acceptances.length > 0 && prop.createdAt) {
        const acc = prop.acceptances[0];
        const diff = new Date(acc.acceptedAt).getTime() - new Date(prop.createdAt).getTime();
        if (diff > 0) {
          totalDecisionTimeMs += diff;
          decisionTimeCount++;
        }
      }

      // Estima valor ativo sob proposta a partir dos eventos vinculados à versão ativa
      const activeVer = (prop.versions || []).find((v: any) => v.id === prop.currentVersionId) || (prop.versions || [])[0];
      if (activeVer && ['SENT', 'VIEWED', 'APPROVAL_PENDING', 'APPROVED'].includes(prop.status)) {
        try {
          const snapshot = JSON.parse(activeVer.snapshotJson || '{}');
          if (snapshot.events) {
            for (const e of snapshot.events) {
              if (e.estimatedGrossRevenue) {
                activeValueUnderProposal += Number(e.estimatedGrossRevenue);
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }

    const decisiveTotal = acceptedCount + declinedCount;
    const acceptanceRatePercent = decisiveTotal > 0 ? Number(((acceptedCount / decisiveTotal) * 100).toFixed(1)) : 0;
    const averageApprovalTimeHours = approvalTimeCount > 0 ? Number((totalApprovalTimeMs / (approvalTimeCount * 3600000)).toFixed(1)) : 2.5;
    const averageDecisionTimeDays = decisionTimeCount > 0 ? Number((totalDecisionTimeMs / (decisionTimeCount * 86400000)).toFixed(1)) : 4.0;

    return {
      totalProposals,
      draftCount,
      pendingApprovalCount,
      sentCount,
      acceptedCount,
      declinedCount,
      expiredCount,
      acceptanceRatePercent,
      averageApprovalTimeHours,
      averageDecisionTimeDays,
      activeValueUnderProposal
    };
  }
}
