import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { ProposalVersionService } from './versions/proposal-version.service';
import { CommercialTermsValidator } from './terms/commercial-terms.validator';
import { CommercialProposalDTO, CreateProposalDTO, UpdateProposalDTO } from '../../../../../shared/types';

export class ProposalService {
  /**
   * Gera código público sequencial único e auditável: PROP-YYYY-XXXXXX
   */
  public static async generatePublicCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.commercialProposal.count();
    const sequence = String(count + 101).padStart(6, '0');
    return `PROP-${year}-${sequence}`;
  }

  /**
   * Cria uma nova proposta comercial com sua Versão 1 inicial
   */
  public static async createProposal(input: CreateProposalDTO, user: any): Promise<CommercialProposalDTO> {
    if (!input.title || input.title.trim() === '') {
      throw new Error('Título da proposta é obrigatório.');
    }

    if (!input.producerId) {
      throw new Error('Produtor é obrigatório para emissão de proposta comercial B2B.');
    }

    if (!input.validUntil) {
      throw new Error('Data de validade da proposta é obrigatória.');
    }

    const validUntil = new Date(input.validUntil);
    if (isNaN(validUntil.getTime())) {
      throw new Error('Data de validade inválida.');
    }

    // Valida termos comerciais
    const validation = CommercialTermsValidator.validateTerms(input.terms);
    if (!validation.valid) {
      throw new Error(`Condições comerciais inválidas: ${validation.errors.join('; ')}`);
    }

    // Verifica se produtor existe
    const producer = await prisma.producer.findUnique({
      where: { id: input.producerId }
    });
    if (!producer) {
      throw new Error('Produtor selecionado não foi encontrado no sistema.');
    }

    const publicCode = await this.generatePublicCode();
    const commercialModel = input.commercialModel || 'STANDARD';

    // 1. Cria a entidade raiz da Proposta
    const initialProposalStatus = validation.requiresApproval ? 'APPROVAL_PENDING' : 'DRAFT';

    const proposal = await prisma.commercialProposal.create({
      data: {
        publicCode,
        producerId: input.producerId,
        opportunityId: input.opportunityId || null,
        title: input.title.trim(),
        description: input.description || null,
        status: initialProposalStatus,
        currentVersionNumber: 1,
        ownerId: user.id,
        ownerName: user.name || user.email || 'Comercial',
        validUntil,
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
        version: 1
      }
    });

    // 2. Calcula o contentHash canônico
    const contentHash = ProposalVersionService.computeContentHash({
      title: proposal.title,
      validUntil,
      commercialModel,
      terms: input.terms,
      events: input.events
    });

    const snapshotPayload = {
      versionNumber: 1,
      title: proposal.title,
      validUntil: validUntil.toISOString(),
      commercialModel,
      changeSummary: 'Versão inicial da proposta comercial.',
      terms: input.terms,
      events: input.events || []
    };

    // 3. Cria a Versão 1 inicial
    const initialVersion = await prisma.commercialProposalVersion.create({
      data: {
        proposalId: proposal.id,
        versionNumber: 1,
        status: initialProposalStatus,
        contentHash,
        title: `${proposal.title} (V1)`,
        summary: 'Versão inicial formalizada da proposta.',
        validUntil,
        commercialModel,
        snapshotJson: JSON.stringify(snapshotPayload),
        approvalStatus: validation.requiresApproval ? 'PENDING' : 'NOT_REQUIRED',
        changeSummary: 'Versão inicial',
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 4. Cria os termos comerciais da Versão 1
    let sortOrder = 1;
    for (const term of input.terms) {
      await prisma.proposalCommercialTerm.create({
        data: {
          proposalVersionId: initialVersion.id,
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

    // 5. Cria referências de eventos
    if (input.events && input.events.length > 0) {
      for (const evt of input.events) {
        await prisma.proposalEventReference.create({
          data: {
            proposalVersionId: initialVersion.id,
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

    // Atualiza a proposta raiz com o ponteiro para a versão criada
    await prisma.commercialProposal.update({
      where: { id: proposal.id },
      data: { currentVersionId: initialVersion.id }
    });

    // Registra auditoria
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_COMMERCIAL_PROPOSAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Proposta ${proposal.publicCode} criada com sucesso para o produtor ${producer.name}.`
    });

    // Registra atividade no CRM se vinculada a oportunidade
    if (proposal.opportunityId) {
      await prisma.commercialActivity.create({
        data: {
          producerId: proposal.producerId,
          opportunityId: proposal.opportunityId,
          type: 'NOTE',
          subject: `Proposta Comercial Elaborada: ${proposal.publicCode}`,
          description: `Elaborada proposta formal ${proposal.publicCode} com validade até ${validUntil.toLocaleDateString('pt-BR')}.`,
          occurredAt: new Date(),
          createdBy: user.id,
          createdByName: user.name || 'Comercial'
        }
      });
    }

    return this.getProposalById(proposal.id);
  }

  /**
   * Atualiza uma proposta em status Rascunho (DRAFT) com concorrência otimista
   */
  public static async updateDraftProposal(
    proposalId: string,
    input: UpdateProposalDTO,
    user: any
  ): Promise<CommercialProposalDTO> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId },
      include: { versions: true }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (input.expectedVersion !== undefined && proposal.version !== input.expectedVersion) {
      const err: any = new Error('Conflito de concorrência (HTTP 409): a proposta foi modificada simultaneamente.');
      err.statusCode = 409;
      throw err;
    }

    // Somente propostas em DRAFT ou IN_REVIEW podem ter a versão corrente alterada diretamente.
    // Propostas já aprovadas ou enviadas exigem criação de nova versão imutável (V2+).
    if (proposal.status !== 'DRAFT' && proposal.status !== 'IN_REVIEW') {
      throw new Error(`A proposta está no status ${proposal.status}. Propostas aprovadas, enviadas ou aceitas são imutáveis e exigem a criação de uma Nova Versão.`);
    }

    const currentVersion = (proposal.versions || []).find(
      (v: any) => v.id === proposal.currentVersionId || v.versionNumber === proposal.currentVersionNumber
    );

    if (!currentVersion) {
      throw new Error('Versão corrente da proposta não foi encontrada.');
    }

    const validUntil = input.validUntil ? new Date(input.validUntil) : proposal.validUntil;
    const title = input.title ? input.title.trim() : proposal.title;
    const commercialModel = input.commercialModel || currentVersion.commercialModel || 'STANDARD';

    // Se novos termos foram informados, valida e recria
    if (input.terms) {
      const validation = CommercialTermsValidator.validateTerms(input.terms);
      if (!validation.valid) {
        throw new Error(`Condições inválidas: ${validation.errors.join('; ')}`);
      }

      await prisma.proposalCommercialTerm.deleteMany({
        where: { proposalVersionId: currentVersion.id }
      });

      let sortOrder = 1;
      for (const term of input.terms) {
        await prisma.proposalCommercialTerm.create({
          data: {
            proposalVersionId: currentVersion.id,
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
    }

    if (input.events) {
      await prisma.proposalEventReference.deleteMany({
        where: { proposalVersionId: currentVersion.id }
      });

      for (const evt of input.events) {
        await prisma.proposalEventReference.create({
          data: {
            proposalVersionId: currentVersion.id,
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

    // Recalcula o hash da versão com os novos termos
    const updatedTerms = await prisma.proposalCommercialTerm.findMany({
      where: { proposalVersionId: currentVersion.id }
    });
    const updatedEvents = await prisma.proposalEventReference.findMany({
      where: { proposalVersionId: currentVersion.id }
    });

    const newContentHash = ProposalVersionService.computeContentHash({
      title,
      validUntil,
      commercialModel,
      terms: updatedTerms,
      events: updatedEvents
    });

    // Atualiza a versão
    await prisma.commercialProposalVersion.update({
      where: { id: currentVersion.id },
      data: {
        title: `${title} (V${currentVersion.versionNumber})`,
        validUntil,
        commercialModel,
        contentHash: newContentHash,
        documentId: null, // Invalida documento renderizado anterior
        documentChecksum: null,
        updatedAt: new Date()
      }
    });

    // Atualiza a proposta raiz incrementando a versão de concorrência
    await prisma.commercialProposal.update({
      where: { id: proposalId, version: proposal.version },
      data: {
        title,
        description: input.description !== undefined ? input.description : proposal.description,
        validUntil,
        notes: input.notes !== undefined ? input.notes : proposal.notes,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : proposal.internalNotes
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_COMMERCIAL_PROPOSAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Rascunho da proposta ${proposal.publicCode} atualizado com novo contentHash.`
    });

    return this.getProposalById(proposalId);
  }

  /**
   * Cancela a proposta comercial
   */
  public static async cancelProposal(proposalId: string, reason: string, user: any): Promise<void> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (proposal.status === 'ACCEPTED') {
      throw new Error('Proposta já aceita não pode ser cancelada diretamente.');
    }

    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: { status: 'CANCELLED' }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CANCEL_COMMERCIAL_PROPOSAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Proposta ${proposal.publicCode} cancelada. Motivo: ${reason}`
    });
  }

  /**
   * Varredura idempotente para expirar propostas cuja data de validade foi ultrapassada
   */
  public static async sweepExpiredProposals(): Promise<number> {
    const now = new Date();
    const activeProposals = await prisma.commercialProposal.findMany({
      where: {
        status: { in: ['DRAFT', 'IN_REVIEW', 'APPROVAL_PENDING', 'APPROVED', 'SENT', 'VIEWED'] }
      }
    });

    let expiredCount = 0;
    for (const prop of activeProposals) {
      if (prop.validUntil && new Date(prop.validUntil) < now) {
        await prisma.commercialProposal.update({
          where: { id: prop.id },
          data: { status: 'EXPIRED' }
        });

        if (prop.currentVersionId) {
          await prisma.commercialProposalVersion.update({
            where: { id: prop.currentVersionId },
            data: { status: 'EXPIRED' }
          }).catch(() => null);
        }

        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Retorna a proposta formatada por ID com versões, termos, aceite e entrega
   */
  public static async getProposalById(id: string): Promise<CommercialProposalDTO> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id },
      include: {
        producer: true,
        versions: true,
        acceptances: true,
        deliveries: true
      }
    });

    if (!proposal) {
      throw new Error('Proposta não encontrada.');
    }

    // Carrega detalhes de oportunidade se vinculada
    let oppPublicCode: string | null = null;
    let oppTitle: string | null = null;
    if (proposal.opportunityId) {
      const opp = await prisma.commercialOpportunity.findUnique({
        where: { id: proposal.opportunityId }
      });
      if (opp) {
        oppPublicCode = opp.publicCode;
        oppTitle = opp.title;
      }
    }

    const versionsWithDetails = await Promise.all(
      (proposal.versions || []).map(async (v: any) => {
        const terms = await prisma.proposalCommercialTerm.findMany({
          where: { proposalVersionId: v.id }
        });
        const events = await prisma.proposalEventReference.findMany({
          where: { proposalVersionId: v.id }
        });

        return {
          id: v.id,
          proposalId: v.proposalId,
          versionNumber: v.versionNumber,
          status: v.status,
          contentHash: v.contentHash,
          title: v.title,
          summary: v.summary,
          validUntil: v.validUntil ? new Date(v.validUntil).toISOString() : '',
          commercialModel: v.commercialModel,
          snapshotJson: v.snapshotJson,
          approvalRequestId: v.approvalRequestId,
          approvalStatus: v.approvalStatus,
          approvedAt: v.approvedAt ? new Date(v.approvedAt).toISOString() : null,
          approvedBy: v.approvedBy,
          approvedByName: v.approvedByName,
          rejectionReason: v.rejectionReason,
          documentId: v.documentId,
          documentChecksum: v.documentChecksum,
          changeSummary: v.changeSummary,
          createdBy: v.createdBy,
          createdByName: v.createdByName,
          createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
          terms: terms.map((t: any) => ({
            id: t.id,
            proposalVersionId: t.proposalVersionId,
            offeringId: t.offeringId,
            termType: t.termType,
            name: t.name,
            calculationType: t.calculationType,
            percentage: t.percentage,
            amount: t.amount,
            minimumAmount: t.minimumAmount,
            payer: t.payer,
            splitProducerPercentage: t.splitProducerPercentage,
            splitBuyerPercentage: t.splitBuyerPercentage,
            conditions: t.conditions,
            sortOrder: t.sortOrder,
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
          })),
          events: events.map((e: any) => ({
            id: e.id,
            proposalVersionId: e.proposalVersionId,
            eventId: e.eventId,
            estimatedEventName: e.estimatedEventName,
            estimatedDate: e.estimatedDate ? new Date(e.estimatedDate).toISOString() : null,
            estimatedVenue: e.estimatedVenue,
            estimatedTickets: e.estimatedTickets,
            estimatedGrossRevenue: e.estimatedGrossRevenue,
            createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString()
          }))
        };
      })
    );

    const isExpired = proposal.validUntil ? new Date(proposal.validUntil) < new Date() && !['ACCEPTED', 'DECLINED', 'CANCELLED'].includes(proposal.status) : false;

    const currentVersion = versionsWithDetails.find(
      (v: any) => v.id === proposal.currentVersionId || v.versionNumber === proposal.currentVersionNumber
    ) || versionsWithDetails[versionsWithDetails.length - 1] || null;

    return {
      id: proposal.id,
      publicCode: proposal.publicCode,
      producerId: proposal.producerId,
      producerName: proposal.producer?.name || 'Produtor',
      opportunityId: proposal.opportunityId,
      opportunityPublicCode: oppPublicCode,
      opportunityTitle: oppTitle,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      currentVersionNumber: proposal.currentVersionNumber,
      currentVersionId: proposal.currentVersionId,
      currentVersion,
      ownerId: proposal.ownerId,
      ownerName: proposal.ownerName,
      validUntil: proposal.validUntil ? new Date(proposal.validUntil).toISOString() : '',
      isExpired,
      notes: proposal.notes,
      internalNotes: proposal.internalNotes,
      version: proposal.version || 1,
      versions: versionsWithDetails,
      acceptances: (proposal.acceptances || []).map((a: any) => ({
        id: a.id,
        proposalId: a.proposalId,
        proposalVersionId: a.proposalVersionId,
        method: a.method,
        acceptedAt: a.acceptedAt ? new Date(a.acceptedAt).toISOString() : new Date().toISOString(),
        acceptedByContactId: a.acceptedByContactId,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
        contactDocument: a.contactDocument,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        evidenceDocumentId: a.evidenceDocumentId,
        notes: a.notes,
        registeredBy: a.registeredBy,
        registeredByName: a.registeredByName,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString()
      })),
      deliveries: (proposal.deliveries || []).map((d: any) => ({
        id: d.id,
        proposalId: d.proposalId,
        proposalVersionId: d.proposalVersionId,
        channel: d.channel,
        recipientName: d.recipientName,
        recipientEmail: d.recipientEmail,
        recipientPhone: d.recipientPhone,
        sentAt: d.sentAt ? new Date(d.sentAt).toISOString() : new Date().toISOString(),
        sentBy: d.sentBy,
        sentByName: d.sentByName,
        status: d.status,
        messageBody: d.messageBody,
        trackingId: d.trackingId,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
      })),
      createdAt: proposal.createdAt ? new Date(proposal.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: proposal.updatedAt ? new Date(proposal.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
