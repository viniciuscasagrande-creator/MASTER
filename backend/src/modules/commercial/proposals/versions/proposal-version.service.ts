import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import { CommercialProposalVersionDTO } from '../../../../../../shared/types';
import { CommercialTermsValidator } from '../terms/commercial-terms.validator';

export class ProposalVersionService {
  /**
   * Calcula o contentHash SHA-256 canônico e determinístico dos termos, escopo e vigência da versão.
   * Mudança em qualquer taxa, centavo, evento ou data altera irrevogavelmente o hash.
   */
  public static computeContentHash(data: {
    title: string;
    validUntil: string | Date;
    commercialModel: string;
    terms: Array<{
      termType: string;
      calculationType: string;
      percentage?: number | null;
      amount?: number | null;
      payer: string;
      conditions?: string | null;
      splitProducerPercentage?: number | null;
      splitBuyerPercentage?: number | null;
    }>;
    events?: Array<{
      estimatedEventName: string;
      estimatedDate?: string | Date | null;
      estimatedVenue?: string | null;
      estimatedTickets?: number | null;
      estimatedGrossRevenue?: number | null;
    }>;
  }): string {
    const validUntilIso = data.validUntil instanceof Date
      ? data.validUntil.toISOString().split('T')[0]
      : new Date(data.validUntil).toISOString().split('T')[0];

    // Ordenação canônica dos termos para evitar discrepâncias de ordem no JSON
    const canonicalTerms = [...(data.terms || [])]
      .map(t => ({
        termType: t.termType,
        calculationType: t.calculationType,
        percentage: t.percentage !== undefined && t.percentage !== null ? Number(t.percentage).toFixed(2) : null,
        amount: t.amount !== undefined && t.amount !== null ? Number(t.amount).toFixed(2) : null,
        payer: t.payer,
        conditions: t.conditions ? t.conditions.trim() : null,
        splitProducerPercentage: t.splitProducerPercentage !== undefined && t.splitProducerPercentage !== null ? Number(t.splitProducerPercentage).toFixed(2) : null,
        splitBuyerPercentage: t.splitBuyerPercentage !== undefined && t.splitBuyerPercentage !== null ? Number(t.splitBuyerPercentage).toFixed(2) : null
      }))
      .sort((a, b) => a.termType.localeCompare(b.termType) || (a.calculationType || '').localeCompare(b.calculationType || ''));

    const canonicalEvents = [...(data.events || [])]
      .map(e => ({
        estimatedEventName: (e.estimatedEventName || '').trim(),
        estimatedDate: e.estimatedDate ? new Date(e.estimatedDate).toISOString().split('T')[0] : null,
        estimatedVenue: (e.estimatedVenue || '').trim(),
        estimatedTickets: e.estimatedTickets ? Number(e.estimatedTickets) : null,
        estimatedGrossRevenue: e.estimatedGrossRevenue ? Number(e.estimatedGrossRevenue).toFixed(2) : null
      }))
      .sort((a, b) => a.estimatedEventName.localeCompare(b.estimatedEventName));

    const canonicalObject = {
      title: data.title.trim(),
      validUntil: validUntilIso,
      commercialModel: data.commercialModel || 'STANDARD',
      terms: canonicalTerms,
      events: canonicalEvents
    };

    const canonicalString = JSON.stringify(canonicalObject);
    return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  }

  /**
   * Cria uma nova versão formal e imutável para uma proposta existente (ex: V1 -> V2)
   */
  public static async createNewVersion(
    proposalId: string,
    input: {
      changeSummary: string;
      title?: string;
      validUntil?: string;
      commercialModel?: string;
      terms: any[];
      events?: any[];
      expectedVersion?: number;
    },
    user: any
  ): Promise<CommercialProposalVersionDTO> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId },
      include: { versions: true }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (input.expectedVersion !== undefined && proposal.version !== input.expectedVersion) {
      const err: any = new Error('Conflito de versão concorrente (HTTP 409): a proposta foi atualizada por outro usuário.');
      err.statusCode = 409;
      throw err;
    }

    // Validação das condições
    const validation = CommercialTermsValidator.validateTerms(input.terms);
    if (!validation.valid) {
      throw new Error(`Condições comerciais inválidas: ${validation.errors.join('; ')}`);
    }

    // Calcula próximo número de versão
    const nextVersionNumber = (proposal.currentVersionNumber || 1) + 1;
    const title = input.title ? input.title.trim() : proposal.title;
    const validUntil = input.validUntil ? new Date(input.validUntil) : proposal.validUntil;
    const commercialModel = input.commercialModel || 'STANDARD';

    // Marca versões anteriores com status ativo/pendente como SUPERSEDED se não foram aceitas
    for (const v of proposal.versions || []) {
      if (v.status !== 'ACCEPTED' && v.status !== 'SUPERSEDED') {
        await prisma.commercialProposalVersion.update({
          where: { id: v.id },
          data: { status: 'SUPERSEDED' }
        });
      }
    }

    // Calcula contentHash determinístico
    const contentHash = this.computeContentHash({
      title,
      validUntil,
      commercialModel,
      terms: input.terms,
      events: input.events
    });

    const snapshotPayload = {
      versionNumber: nextVersionNumber,
      title,
      validUntil: validUntil.toISOString(),
      commercialModel,
      changeSummary: input.changeSummary,
      terms: input.terms,
      events: input.events || []
    };

    const initialStatus = validation.requiresApproval ? 'APPROVAL_PENDING' : 'DRAFT';
    const approvalStatus = validation.requiresApproval ? 'PENDING' : 'NOT_REQUIRED';

    const newVersion = await prisma.commercialProposalVersion.create({
      data: {
        proposalId,
        versionNumber: nextVersionNumber,
        status: initialStatus,
        contentHash,
        title,
        summary: input.changeSummary,
        validUntil,
        commercialModel,
        snapshotJson: JSON.stringify(snapshotPayload),
        approvalStatus,
        changeSummary: input.changeSummary,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Cria termos comerciais vinculados
    let sortOrder = 1;
    for (const term of input.terms) {
      await prisma.proposalCommercialTerm.create({
        data: {
          proposalVersionId: newVersion.id,
          offeringId: term.offeringId || null,
          termType: term.termType,
          name: term.name,
          calculationType: term.calculationType || 'PERCENTAGE',
          percentage: term.percentage !== undefined && term.percentage !== null ? Number(term.percentage) : null,
          amount: term.amount !== undefined && term.amount !== null ? Number(term.amount) : null,
          minimumAmount: term.minimumAmount !== undefined && term.minimumAmount !== null ? Number(term.minimumAmount) : null,
          payer: term.payer || 'PRODUCER',
          splitProducerPercentage: term.splitProducerPercentage !== undefined && term.splitProducerPercentage !== null ? Number(term.splitProducerPercentage) : null,
          splitBuyerPercentage: term.splitBuyerPercentage !== undefined && term.splitBuyerPercentage !== null ? Number(term.splitBuyerPercentage) : null,
          conditions: term.conditions || null,
          sortOrder: sortOrder++
        }
      });
    }

    // Cria referências de eventos
    if (input.events && input.events.length > 0) {
      for (const evt of input.events) {
        await prisma.proposalEventReference.create({
          data: {
            proposalVersionId: newVersion.id,
            eventId: evt.eventId || null,
            estimatedEventName: evt.estimatedEventName,
            estimatedDate: evt.estimatedDate ? new Date(evt.estimatedDate) : null,
            estimatedVenue: evt.estimatedVenue || null,
            estimatedTickets: evt.estimatedTickets ? Number(evt.estimatedTickets) : null,
            estimatedGrossRevenue: evt.estimatedGrossRevenue ? Number(evt.estimatedGrossRevenue) : null
          }
        });
      }
    }

    // Atualiza a proposta raiz apontando para a nova versão
    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        currentVersionNumber: nextVersionNumber,
        currentVersionId: newVersion.id,
        status: initialStatus,
        validUntil,
        title
      }
    });

    const fullVersion = await prisma.commercialProposalVersion.findUnique({
      where: { id: newVersion.id },
      include: { terms: true, events: true }
    });

    return {
      id: fullVersion.id,
      proposalId: fullVersion.proposalId,
      versionNumber: fullVersion.versionNumber,
      status: fullVersion.status,
      contentHash: fullVersion.contentHash,
      title: fullVersion.title,
      summary: fullVersion.summary,
      validUntil: fullVersion.validUntil ? new Date(fullVersion.validUntil).toISOString() : '',
      commercialModel: fullVersion.commercialModel,
      snapshotJson: fullVersion.snapshotJson,
      approvalRequestId: fullVersion.approvalRequestId,
      approvalStatus: fullVersion.approvalStatus,
      approvedAt: fullVersion.approvedAt ? new Date(fullVersion.approvedAt).toISOString() : null,
      approvedBy: fullVersion.approvedBy,
      approvedByName: fullVersion.approvedByName,
      rejectionReason: fullVersion.rejectionReason,
      documentId: fullVersion.documentId,
      documentChecksum: fullVersion.documentChecksum,
      changeSummary: fullVersion.changeSummary,
      createdBy: fullVersion.createdBy,
      createdByName: fullVersion.createdByName,
      createdAt: fullVersion.createdAt ? new Date(fullVersion.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: fullVersion.updatedAt ? new Date(fullVersion.updatedAt).toISOString() : new Date().toISOString(),
      terms: fullVersion.terms || [],
      events: fullVersion.events || []
    };
  }
}
