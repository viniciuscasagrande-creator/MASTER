import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { ProposalDeliveryDTO, ProposalDeliveryChannel } from '../../../../../../shared/types';

export class ProposalDeliveryService {
  /**
   * Registra o envio formal da proposta para o produtor
   */
  public static async sendProposal(
    proposalId: string,
    versionNumber: number,
    input: {
      channel: ProposalDeliveryChannel;
      recipientName: string;
      recipientEmail?: string;
      recipientPhone?: string;
      messageBody?: string;
      expectedVersion?: number;
    },
    user: any
  ): Promise<ProposalDeliveryDTO> {
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

    // Regra estrita: Só pode enviar se já estiver Aprovada ou se não necessitava aprovação
    const allowedStatuses = ['APPROVED', 'READY_TO_SEND', 'DRAFT'];
    if (version.approvalStatus === 'PENDING') {
      throw new Error('Bloqueio: Esta versão da proposta está aguardando aprovação interna da alçada e não pode ser enviada ao produtor.');
    }

    if (version.approvalStatus === 'REJECTED' || version.status === 'REJECTED_INTERNAL') {
      throw new Error('Bloqueio: Esta versão da proposta foi reprovada internamente e não pode ser enviada.');
    }

    if (!input.recipientName || input.recipientName.trim() === '') {
      throw new Error('Nome do destinatário no produtor é obrigatório.');
    }

    const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Cria registro de envio
    const delivery = await prisma.proposalDelivery.create({
      data: {
        proposalId,
        proposalVersionId: version.id,
        channel: input.channel || 'EMAIL',
        recipientName: input.recipientName.trim(),
        recipientEmail: input.recipientEmail || null,
        recipientPhone: input.recipientPhone || null,
        messageBody: input.messageBody || null,
        sentAt: new Date(),
        sentBy: user.id,
        sentByName: user.name || 'Comercial',
        status: 'DELIVERED',
        trackingId
      }
    });

    // Atualiza status da versão e proposta para SENT
    await prisma.commercialProposalVersion.update({
      where: { id: version.id },
      data: { status: 'SENT' }
    });

    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: { status: 'SENT' }
    });

    // Registra atividade comercial no CRM
    await prisma.commercialActivity.create({
      data: {
        producerId: proposal.producerId,
        opportunityId: proposal.opportunityId || null,
        type: input.channel === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL',
        subject: `Envio de Proposta Comercial: ${proposal.publicCode} (V${version.versionNumber})`,
        description: `Proposta enviada via ${input.channel} para ${input.recipientName} (${input.recipientEmail || input.recipientPhone || 'contato'}).`,
        occurredAt: new Date(),
        createdBy: user.id,
        createdByName: user.name || 'Comercial'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'SEND_COMMERCIAL_PROPOSAL',
      resource: 'PROPOSTA_COMERCIAL',
      resourceId: proposal.id,
      producerId: proposal.producerId,
      details: `Proposta ${proposal.publicCode} V${version.versionNumber} enviada para ${input.recipientName} via ${input.channel}`
    });

    return {
      id: delivery.id,
      proposalId: delivery.proposalId,
      proposalVersionId: delivery.proposalVersionId,
      channel: delivery.channel,
      recipientName: delivery.recipientName,
      recipientEmail: delivery.recipientEmail,
      recipientPhone: delivery.recipientPhone,
      sentAt: delivery.sentAt.toISOString(),
      sentBy: delivery.sentBy,
      sentByName: delivery.sentByName,
      status: delivery.status,
      messageBody: delivery.messageBody,
      trackingId: delivery.trackingId,
      createdAt: delivery.createdAt.toISOString()
    };
  }
}
