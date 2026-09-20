import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { CreateContractAmendmentDTO, ContractAmendmentDTO } from '../../../../../../shared/types';

export class ContractAmendmentService {
  /**
   * Cria um termo aditivo ao contrato (obrigatório para alterações após formalização da minuta)
   */
  public static async createAmendment(
    contractId: string,
    input: CreateContractAmendmentDTO,
    user: any
  ): Promise<ContractAmendmentDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: contractId },
      include: { amendments: true }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${contractId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    if (contract.status === 'TERMINATED' || contract.status === 'CANCELLED') {
      const err: any = new Error(`Não é permitido criar aditivo para contrato com status ${contract.status}.`);
      err.statusCode = 400;
      throw err;
    }

    const currentAmendments = contract.amendments || [];
    const nextAmendmentNumber = currentAmendments.length + 1;
    const publicCode = `${contract.publicCode.replace('CTR-', 'ADT-')}-${String(nextAmendmentNumber).padStart(2, '0')}`;

    // Canonical Content Hash do Aditivo
    const terms = input.terms || [];
    const canonicalTerms = terms.map(t => ({
      termType: t.termType,
      name: (t.name || '').trim(),
      calculationType: t.calculationType,
      percentage: t.percentage !== undefined && t.percentage !== null ? Number(t.percentage).toFixed(2) : null,
      amount: t.amount !== undefined && t.amount !== null ? Number(t.amount).toFixed(2) : null,
      payer: t.payer,
      conditions: t.conditions ? t.conditions.trim() : null
    })).sort((a, b) => a.termType.localeCompare(b.termType) || a.name.localeCompare(b.name));

    const canonicalString = JSON.stringify({
      contractPublicCode: contract.publicCode,
      amendmentNumber: nextAmendmentNumber,
      effectiveFrom: new Date(input.effectiveFrom).toISOString().split('T')[0],
      reason: input.reason.trim(),
      terms: canonicalTerms
    });

    const contentHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

    const amendment = await prisma.contractAmendment.create({
      data: {
        publicCode,
        contractId: contract.id,
        amendmentNumber: nextAmendmentNumber,
        type: input.type,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
        reason: input.reason,
        summary: input.summary,
        contentHash,
        termsSnapshotJson: JSON.stringify(terms),
        createdBy: user.id,
        createdByName: user.name
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_ADITIVO_CRIADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        amendmentId: amendment.id,
        publicCode: amendment.publicCode,
        type: amendment.type,
        effectiveFrom: input.effectiveFrom
      }
    });

    return {
      ...amendment,
      createdAt: amendment.createdAt.toISOString(),
      updatedAt: amendment.updatedAt.toISOString(),
      effectiveFrom: amendment.effectiveFrom.toISOString(),
      approvedAt: amendment.approvedAt ? amendment.approvedAt.toISOString() : null,
      signedAt: amendment.signedAt ? amendment.signedAt.toISOString() : null
    };
  }

  /**
   * Aprovação de Aditivo Contratual (com validação Maker-Checker)
   */
  public static async approveAmendment(amendmentId: string, user: any): Promise<ContractAmendmentDTO> {
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id: amendmentId }
    });

    if (!amendment) {
      const err: any = new Error(`Aditivo ${amendmentId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // Maker-Checker
    if (amendment.createdBy === user.id && !user.isSuperAdmin) {
      const err: any = new Error('Princípio de Maker-Checker: o criador do aditivo não pode aprová-lo.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.contractAmendment.update({
      where: { id: amendmentId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: user.id,
        approvedByName: user.name
      }
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      effectiveFrom: updated.effectiveFrom.toISOString(),
      approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
      signedAt: updated.signedAt ? updated.signedAt.toISOString() : null
    };
  }

  /**
   * Ativação de Aditivo Contratual
   */
  public static async activateAmendment(amendmentId: string, user: any): Promise<ContractAmendmentDTO> {
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id: amendmentId }
    });

    if (!amendment) {
      const err: any = new Error(`Aditivo ${amendmentId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.contractAmendment.update({
      where: { id: amendmentId },
      data: {
        status: 'ACTIVE'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_ADITIVO_ATIVADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: amendment.contractId,
      details: {
        amendmentId: amendment.id,
        publicCode: amendment.publicCode
      }
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      effectiveFrom: updated.effectiveFrom.toISOString(),
      approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
      signedAt: updated.signedAt ? updated.signedAt.toISOString() : null
    };
  }
}
