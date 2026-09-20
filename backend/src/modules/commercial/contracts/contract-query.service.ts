import { prisma } from '../../../core/database/prisma';
import { ContractService } from './contract.service';
import { CommercialContractDTO, CommercialContractMetricsDTO } from '../../../../../shared/types';

export class ContractQueryService {
  /**
   * Listagem de contratos com paginação, filtros e isolamento multi-tenant
   */
  public static async listContracts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      producerId?: string;
    },
    user: any
  ): Promise<{ data: CommercialContractDTO[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));

    const where: any = {};

    // ISOLAMENTO MULTI-TENANT: Produtor só acessa contratos onde é a parte contratante
    if (user?.producerId && !user.isSuperAdmin) {
      where.producerId = user.producerId;
    } else if (params.producerId) {
      where.producerId = params.producerId;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    const all = await prisma.commercialContract.findMany({
      where,
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let filtered = all;

    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase();
      filtered = all.filter((c: any) =>
        c.publicCode.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.producer?.name && c.producer.name.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated.map((c: any) => ContractService.formatContract(c)),
      total,
      page,
      limit
    };
  }

  /**
   * Obtém detalhes de um contrato por ID ou publicCode com validação multi-tenant
   */
  public static async getContractById(id: string, user: any): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${id} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // Validação Multi-tenant
    if (user?.producerId && !user.isSuperAdmin && contract.producerId !== user.producerId) {
      const err: any = new Error('Acesso negado: você não tem permissão para visualizar contratos de outro produtor.');
      err.statusCode = 403;
      throw err;
    }

    return ContractService.formatContract(contract);
  }

  /**
   * Métricas executivas da carteira de contratos comerciais
   */
  public static async getMetrics(user: any): Promise<CommercialContractMetricsDTO> {
    const where: any = {};
    if (user?.producerId && !user.isSuperAdmin) {
      where.producerId = user.producerId;
    }

    const contracts = await prisma.commercialContract.findMany({
      where,
      include: {
        amendments: true,
        renewals: true
      }
    });

    let draftCount = 0;
    let signaturePendingCount = 0;
    let signedCount = 0;
    let activeCount = 0;
    let expiredCount = 0;
    let suspendedCount = 0;
    let terminatedCount = 0;
    let activeAmendmentsCount = 0;
    let pendingRenewalsCount = 0;

    for (const c of contracts) {
      if (c.status === 'DRAFT' || c.status === 'IN_REVIEW' || c.status === 'APPROVAL_PENDING' || c.status === 'APPROVED') {
        draftCount++;
      } else if (c.status === 'SIGNATURE_PENDING' || c.status === 'PARTIALLY_SIGNED') {
        signaturePendingCount++;
      } else if (c.status === 'SIGNED') {
        signedCount++;
      } else if (c.status === 'ACTIVE') {
        activeCount++;
      } else if (c.status === 'EXPIRED') {
        expiredCount++;
      } else if (c.status === 'SUSPENDED') {
        suspendedCount++;
      } else if (c.status === 'TERMINATED' || c.status === 'CANCELLED') {
        terminatedCount++;
      }

      if (c.amendments) {
        activeAmendmentsCount += c.amendments.filter((a: any) => a.status === 'ACTIVE').length;
      }
      if (c.renewals) {
        pendingRenewalsCount += c.renewals.filter((r: any) => r.status === 'IN_NEGOTIATION' || r.status === 'PENDING_APPROVAL').length;
      }
    }

    return {
      totalContracts: contracts.length,
      draftCount,
      signaturePendingCount,
      signedCount,
      activeCount,
      expiredCount,
      suspendedCount,
      terminatedCount,
      activeAmendmentsCount,
      pendingRenewalsCount
    };
  }
}
