import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { ProposalAcceptanceDTO, ProposalAcceptanceMethod } from '../../../../../../shared/types';

export class ProposalAcceptanceService {
  /**
   * Registra o aceite comercial formal do produtor.
   * IMPORTANTE: Proposta não é contrato. Aceite comercial NÃO cria repasse, recebível ou evento automaticamente.
   */
  public static async registerAcceptance(
    proposalId: string,
    versionNumber: number,
    input: {
      method: ProposalAcceptanceMethod;
      acceptedAt?: string;
      contactName: string;
      contactEmail?: string;
      contactDocument?: string;
      evidenceDocumentId?: string;
      notes?: string;
      expectedVersion?: number;
    },
    user: any
  ): Promise<ProposalAcceptanceDTO> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (input.expectedVersion !== undefined && proposal.version !== input.expectedVersion) {
      const err: any = new Error('Conflito de versão concorrente (HTTP 409): a proposta foi atualizada por outro usuário.');
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

    if (!input.contactName || input.contactName.trim() === '') {
      throw new Error('Nome do contato responsável pelo aceite é obrigatório.');
    }

    const acceptedAt = input.acceptedAt ? new Date(input.acceptedAt) : new Date();

    // Cria registro formal de aceite
    const acceptance = await prisma.proposalAcceptance.create({
      data: {
        proposalId,
        proposalVersionId: version.id,
        method: input.method || 'EMAIL_CONFIRMATION',
        acceptedAt,
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail || null,
        contactDocument: input.contactDocument || null,
        evidenceDocumentId: input.evidenceDocumentId || null,
        notes: input.notes || null,
        registeredBy: user.id,
        registeredByName: user.name || 'Comercial'
      }
    });

    // Atualiza status da versão e da proposta para ACCEPTED
    await prisma.commercialProposalVersion.update({
      where: { id: version.id },
      data: { status: 'ACCEPTED' }
    });

    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' }
    });

    // Registra atividade comercial no CRM
    await prisma.commercialActivity.create({
      data: {
        producerId: proposal.producerId,
        opportunityId: proposal.opportunityId || null,
        type: 'MEETING',
        subject: `Aceite Comercial Registrado: ${proposal.publicCode} (V${version.versionNumber})`,
        description: `Aceite formal recebido de ${input.contactName} via ${input.method}. Proposta aceita e pronta para elaboração de minuta contratual (Fase 1.3.6).`,
        occurredAt: acceptedAt,
        createdBy: user.id,
        createdByName: user.name || 'Comercial'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REGISTER_PROPOSAL_ACCEPTANCE',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Aceite comercial da proposta ${proposal.publicCode} V${version.versionNumber} registrado com método ${input.method} por ${input.contactName}`
    });

    return {
      id: acceptance.id,
      proposalId: acceptance.proposalId,
      proposalVersionId: acceptance.proposalVersionId,
      method: acceptance.method as ProposalAcceptanceMethod,
      acceptedAt: acceptance.acceptedAt.toISOString(),
      acceptedByContactId: acceptance.acceptedByContactId,
      contactName: acceptance.contactName,
      contactEmail: acceptance.contactEmail,
      contactDocument: acceptance.contactDocument,
      ipAddress: acceptance.ipAddress,
      userAgent: acceptance.userAgent,
      evidenceDocumentId: acceptance.evidenceDocumentId,
      notes: acceptance.notes,
      registeredBy: acceptance.registeredBy,
      registeredByName: acceptance.registeredByName,
      createdAt: acceptance.createdAt.toISOString()
    };
  }

  /**
   * Registra a recusa / declínio da proposta pelo produtor.
   * Não encerra a oportunidade automaticamente; permite renegociação e nova versão.
   */
  public static async declineProposal(
    proposalId: string,
    versionNumber: number,
    input: {
      reason: string;
      notes?: string;
      expectedVersion?: number;
    },
    user: any
  ): Promise<any> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      throw new Error('Proposta comercial não encontrada.');
    }

    if (input.expectedVersion !== undefined && proposal.version !== input.expectedVersion) {
      const err: any = new Error('Conflito de versão concorrente (HTTP 409): a proposta foi atualizada por outro usuário.');
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

    if (!input.reason || input.reason.trim() === '') {
      throw new Error('Motivo da recusa é obrigatório.');
    }

    // Atualiza status da versão e proposta para DECLINED
    await prisma.commercialProposalVersion.update({
      where: { id: version.id },
      data: {
        status: 'DECLINED',
        rejectionReason: input.reason.trim()
      }
    });

    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: { status: 'DECLINED' }
    });

    // Registra atividade no CRM
    await prisma.commercialActivity.create({
      data: {
        producerId: proposal.producerId,
        opportunityId: proposal.opportunityId || null,
        type: 'NOTE',
        subject: `Proposta Recusada pelo Produtor: ${proposal.publicCode} (V${version.versionNumber})`,
        description: `Motivo da recusa: ${input.reason}. Notas: ${input.notes || 'Sem observações adicionais'}. Oportunidade permanece disponível para nova rodada de negociação.`,
        occurredAt: new Date(),
        createdBy: user.id,
        createdByName: user.name || 'Comercial'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DECLINE_COMMERCIAL_PROPOSAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Proposta ${proposal.publicCode} V${version.versionNumber} recusada pelo produtor: ${input.reason}`
    });

    return {
      proposalId,
      versionNumber: version.versionNumber,
      status: 'DECLINED',
      reason: input.reason
    };
  }
}
