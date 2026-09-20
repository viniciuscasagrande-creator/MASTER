import crypto from 'crypto';
import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { ContractVersionService } from './versions/contract-version.service';
import { ContractDocumentService } from './generation/contract-document.service';
import { CommercialTermsValidator } from '../proposals/terms/commercial-terms.validator';
import {
  CommercialContractDTO,
  CreateContractFromProposalDTO,
  CreateContractDTO,
  UpdateContractDTO,
  SuspendContractDTO,
  TerminateContractDTO
} from '../../../../../shared/types';

export class ContractService {
  /**
   * Obtém detalhes de um contrato por ID
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

    if (user?.producerId && !user.isSuperAdmin && contract.producerId !== user.producerId) {
      const err: any = new Error('Acesso negado: você não tem permissão para visualizar contratos de outro produtor.');
      err.statusCode = 403;
      throw err;
    }

    return this.formatContract(contract);
  }

  /**
   * Transforma uma Proposta Comercial ACEITA (Fase 1.3.5) em Contrato Comercial Formal (Fase 1.3.6)
   * Idempotente: se já existir contrato derivado desta proposta, retorna o contrato existente.
   */
  public static async createContractFromProposal(
    input: CreateContractFromProposalDTO,
    user: any
  ): Promise<CommercialContractDTO> {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: input.proposalId },
      include: {
        producer: true,
        versions: {
          include: { terms: true }
        }
      }
    });

    if (!proposal) {
      const err: any = new Error(`Proposta Comercial ${input.proposalId} não encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    if (proposal.status !== 'ACCEPTED') {
      const err: any = new Error(
        `Apenas propostas com aceite comercial registrado (ACCEPTED) podem ser convertidas em contrato. Status atual: ${proposal.status}.`
      );
      err.statusCode = 400;
      throw err;
    }

    // IDEMPOTÊNCIA: Verifica se já existe contrato derivado desta proposta
    const existingContract = await prisma.commercialContract.findFirst({
      where: { sourceProposalId: proposal.id },
      include: {
        producer: true,
        versions: { include: { terms: true } },
        parties: true,
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    if (existingContract) {
      return this.formatContract(existingContract);
    }

    // Pega a versão aceita (ou a versão atual se marcada)
    const acceptedVersion = (proposal.versions || []).find(
      (v: any) => v.versionNumber === proposal.currentVersionNumber
    ) || proposal.versions?.[0];

    if (!acceptedVersion) {
      const err: any = new Error(`Nenhuma versão com condições comerciais encontrada na proposta ${proposal.publicCode}.`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const count = (await prisma.commercialContract.count()) + 101;
    const publicCode = `CTR-${now.getFullYear()}-${String(count).padStart(6, '0')}`;

    // Vigência padrão: a partir da data informada ou do aceite
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : now;
    const effectiveUntil = input.effectiveUntil
      ? new Date(input.effectiveUntil)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano de vigência padrão

    // Criação do Contrato Comercial Base
    const contract = await prisma.commercialContract.create({
      data: {
        publicCode,
        producerId: proposal.producerId,
        sourceOpportunityId: proposal.opportunityId || null,
        sourceProposalId: proposal.id,
        sourceProposalVersionId: acceptedVersion.id,
        sourceProposalContentHash: acceptedVersion.contentHash,
        title: input.title || `Contrato de Prestação de Serviços Comerciais — ${proposal.title.replace('Proposta Comercial — ', '')}`,
        description: input.description || proposal.description || 'Instrumento particular de prestação de serviços de bilheteria e comercialização de ingressos.',
        status: 'DRAFT',
        currentVersionNumber: 1,
        ownerId: user.id,
        ownerName: user.name,
        effectiveFrom,
        effectiveUntil,
        notes: input.notes || proposal.notes || null,
        internalNotes: input.internalNotes || proposal.internalNotes || null,
        version: 1
      }
    });

    // Partes padrão do Contrato
    const diskParty = {
      contractId: contract.id,
      partyType: 'DISK_INGRESSOS',
      legalName: 'Disk Ingressos Serviços de Informática Ltda.',
      tradeName: 'Disk Ingressos',
      document: '05.123.456/0001-78',
      stateRegistration: '10293847-5',
      address: 'Rua Marechal Deodoro, 500 - Centro, Curitiba - PR',
      representativeName: 'Vinicius Casagrande',
      representativeRole: 'Diretor Geral',
      representativeCpf: '123.456.789-00',
      representativeEmail: 'vinicius.casagrande@diskingressos.com.br',
      representativePhone: '(41) 3315-0808'
    };

    const producerParty = {
      contractId: contract.id,
      partyType: 'PRODUCER',
      legalName: proposal.producer?.corporateName || proposal.producer?.name || 'Produtor Contratante Ltda.',
      tradeName: proposal.producer?.name || 'Produtor',
      document: proposal.producer?.document || '00.000.000/0001-00',
      stateRegistration: proposal.producer?.stateRegistration || null,
      address: proposal.producer?.address || 'Endereço Comercial Cadastrado',
      representativeName: proposal.producer?.representativeName || proposal.producer?.name || 'Representante Legal do Produtor',
      representativeRole: 'Representante Legal',
      representativeCpf: proposal.producer?.representativeCpf || '000.000.000-00',
      representativeEmail: proposal.producer?.email || 'contato@produtor.com.br',
      representativePhone: proposal.producer?.phone || null
    };

    await prisma.contractParty.createMany({
      data: [diskParty, producerParty]
    });

    // Mapeamento e Cópia dos Termos Comerciais da Proposta Aceita
    const proposalTerms = acceptedVersion.terms || [];
    const contractTermsData = proposalTerms.map((pt: any, idx: number) => ({
      offeringId: pt.offeringId || null,
      offeringName: pt.name || null,
      termType: pt.termType,
      name: pt.name,
      calculationType: pt.calculationType,
      percentage: pt.percentage !== null && pt.percentage !== undefined ? Number(pt.percentage) : null,
      amount: pt.amount !== null && pt.amount !== undefined ? Number(pt.amount) : null,
      minimumAmount: pt.minimumAmount !== null && pt.minimumAmount !== undefined ? Number(pt.minimumAmount) : null,
      payer: pt.payer,
      splitProducerPercentage: pt.splitProducerPercentage !== null && pt.splitProducerPercentage !== undefined ? Number(pt.splitProducerPercentage) : null,
      splitBuyerPercentage: pt.splitBuyerPercentage !== null && pt.splitBuyerPercentage !== undefined ? Number(pt.splitBuyerPercentage) : null,
      conditions: pt.conditions || null,
      sortOrder: pt.sortOrder || idx + 1
    }));

    // Canonical Content Hash da Versão 1 do Contrato
    const contentHash = ContractVersionService.computeContentHash({
      title: contract.title,
      effectiveFrom,
      effectiveUntil,
      terms: contractTermsData,
      parties: [diskParty, producerParty]
    });

    // Versão 1 do Contrato
    const contractVersion = await prisma.commercialContractVersion.create({
      data: {
        contractId: contract.id,
        versionNumber: 1,
        status: 'DRAFT',
        contentHash,
        title: `${contract.title} (V1)`,
        summary: acceptedVersion.summary || 'Minuta inicial convertida a partir da proposta aprovada.',
        effectiveFrom,
        effectiveUntil,
        termsSnapshotJson: JSON.stringify(contractTermsData),
        partiesSnapshotJson: JSON.stringify([diskParty, producerParty]),
        approvalStatus: 'NOT_REQUIRED',
        changeSummary: `Versão 1 gerada automaticamente a partir da Proposta ${proposal.publicCode} (V${acceptedVersion.versionNumber}).`,
        createdBy: user.id,
        createdByName: user.name
      }
    });

    // Persistência dos Termos Comerciais da Versão
    const termsWithVersion = contractTermsData.map(t => ({
      contractVersionId: contractVersion.id,
      ...t
    }));
    await prisma.contractCommercialTerm.createMany({
      data: termsWithVersion
    });

    // Vincula a versão atual no contrato
    await prisma.commercialContract.update({
      where: { id: contract.id },
      data: { currentVersionId: contractVersion.id }
    });

    // Pré-gera a minuta do documento formal
    await ContractDocumentService.generateDocument(contract.id, 1);

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_CRIADO_DE_PROPOSTA',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        publicCode: contract.publicCode,
        sourceProposalId: proposal.id,
        sourceProposalCode: proposal.publicCode,
        sourceProposalHash: acceptedVersion.contentHash,
        contractVersionHash: contentHash
      }
    });

    const fullContract = await prisma.commercialContract.findUnique({
      where: { id: contract.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(fullContract);
  }

  /**
   * Criação direta de contrato comercial (sem proposta prévia)
   */
  public static async createDirectContract(input: CreateContractDTO, user: any): Promise<CommercialContractDTO> {
    const producer = await prisma.producer.findUnique({
      where: { id: input.producerId }
    });

    if (!producer) {
      const err: any = new Error(`Produtor ${input.producerId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // Validação de termos comerciais
    const validation = CommercialTermsValidator.validateTerms(input.terms);
    if (!validation.valid) {
      const err: any = new Error(`Termos comerciais inválidos: ${validation.errors.join(' ')}`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const count = (await prisma.commercialContract.count()) + 101;
    const publicCode = `CTR-${now.getFullYear()}-${String(count).padStart(6, '0')}`;
    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveUntil = new Date(input.effectiveUntil);

    const contract = await prisma.commercialContract.create({
      data: {
        publicCode,
        producerId: producer.id,
        sourceOpportunityId: input.sourceOpportunityId || null,
        title: input.title,
        description: input.description || null,
        status: 'DRAFT',
        currentVersionNumber: 1,
        ownerId: user.id,
        ownerName: user.name,
        effectiveFrom,
        effectiveUntil,
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
        version: 1
      }
    });

    // Partes
    const diskParty = {
      contractId: contract.id,
      partyType: 'DISK_INGRESSOS',
      legalName: 'Disk Ingressos Serviços de Informática Ltda.',
      tradeName: 'Disk Ingressos',
      document: '05.123.456/0001-78',
      representativeName: 'Vinicius Casagrande',
      representativeRole: 'Diretor Geral',
      representativeCpf: '123.456.789-00',
      representativeEmail: 'vinicius.casagrande@diskingressos.com.br'
    };

    const producerParty = (input.parties && input.parties.find(p => p.partyType === 'PRODUCER')) || {
      contractId: contract.id,
      partyType: 'PRODUCER',
      legalName: producer.corporateName || producer.name,
      document: producer.document || '00.000.000/0001-00',
      representativeName: producer.representativeName || producer.name,
      representativeRole: 'Representante Legal',
      representativeCpf: producer.representativeCpf || '000.000.000-00',
      representativeEmail: producer.email || 'contato@produtor.com.br'
    };

    await prisma.contractParty.createMany({
      data: [diskParty, producerParty]
    });

    const contentHash = ContractVersionService.computeContentHash({
      title: contract.title,
      effectiveFrom,
      effectiveUntil,
      terms: input.terms,
      parties: [diskParty, producerParty]
    });

    const version = await prisma.commercialContractVersion.create({
      data: {
        contractId: contract.id,
        versionNumber: 1,
        status: 'DRAFT',
        contentHash,
        title: `${contract.title} (V1)`,
        effectiveFrom,
        effectiveUntil,
        termsSnapshotJson: JSON.stringify(input.terms),
        partiesSnapshotJson: JSON.stringify([diskParty, producerParty]),
        approvalStatus: validation.requiresApproval ? 'PENDING' : 'NOT_REQUIRED',
        changeSummary: 'Minuta direta criada no painel comercial.',
        createdBy: user.id,
        createdByName: user.name
      }
    });

    const termsWithVersion = input.terms.map((t, idx) => ({
      contractVersionId: version.id,
      offeringId: t.offeringId || null,
      termType: t.termType,
      name: t.name,
      calculationType: t.calculationType,
      percentage: t.percentage !== null && t.percentage !== undefined ? Number(t.percentage) : null,
      amount: t.amount !== null && t.amount !== undefined ? Number(t.amount) : null,
      minimumAmount: t.minimumAmount !== null && t.minimumAmount !== undefined ? Number(t.minimumAmount) : null,
      payer: t.payer,
      splitProducerPercentage: t.splitProducerPercentage !== null && t.splitProducerPercentage !== undefined ? Number(t.splitProducerPercentage) : null,
      splitBuyerPercentage: t.splitBuyerPercentage !== null && t.splitBuyerPercentage !== undefined ? Number(t.splitBuyerPercentage) : null,
      conditions: t.conditions || null,
      sortOrder: idx + 1
    }));

    await prisma.contractCommercialTerm.createMany({
      data: termsWithVersion
    });

    await prisma.commercialContract.update({
      where: { id: contract.id },
      data: { currentVersionId: version.id }
    });

    await ContractDocumentService.generateDocument(contract.id, 1);

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_CRIADO_DIRETO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        publicCode: contract.publicCode,
        requiresApproval: validation.requiresApproval
      }
    });

    const full = await prisma.commercialContract.findUnique({
      where: { id: contract.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(full);
  }

  /**
   * Atualiza rascunho de contrato (com bloqueio otimista concorrente)
   * REGRA DE IMUTABILIDADE: Não permite editar se o contrato já estiver assinado ou ativo!
   */
  public static async updateContractDraft(
    id: string,
    input: UpdateContractDTO,
    user: any
  ): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${id} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      const err: any = new Error(
        `Contratos formalizados/assinados (${contract.status}) são rigorosamente imutáveis. Qualquer modificação de taxas ou vigência exige um Termo Aditivo Contratual (ContractAmendment).`
      );
      err.statusCode = 400;
      throw err;
    }

    const updated = await prisma.commercialContract.update({
      where: {
        id,
        version: input.expectedVersion
      },
      data: {
        title: input.title !== undefined ? input.title : contract.title,
        description: input.description !== undefined ? input.description : contract.description,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : contract.effectiveFrom,
        effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : contract.effectiveUntil,
        notes: input.notes !== undefined ? input.notes : contract.notes,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : contract.internalNotes
      }
    });

    const full = await prisma.commercialContract.findUnique({
      where: { id: updated.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(full);
  }

  /**
   * Submete a minuta do contrato para alçada de aprovação interna
   */
  public static async submitContractApproval(id: string, user: any): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${id} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    await prisma.commercialContract.update({
      where: { id },
      data: { status: 'APPROVAL_PENDING' }
    });

    const currentVersion = (contract.versions || []).find((v: any) => v.versionNumber === contract.currentVersionNumber);
    if (currentVersion) {
      await prisma.commercialContractVersion.update({
        where: { id: currentVersion.id },
        data: { approvalStatus: 'PENDING' }
      });
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_SUBMETIDO_APROVACAO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: { publicCode: contract.publicCode }
    });

    const full = await prisma.commercialContract.findUnique({
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

    return this.formatContract(full);
  }

  /**
   * Processa decisão de aprovação interna do contrato (com garantia Maker-Checker)
   */
  public static async processContractDecision(
    id: string,
    input: { approved: boolean; rejectionReason?: string },
    user: any
  ): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${id} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // MAKER-CHECKER: o criador/dono do contrato não pode aprovar seu próprio contrato
    if (contract.ownerId === user.id && !user.isSuperAdmin) {
      const err: any = new Error('Princípio de Maker-Checker: o criador do contrato não tem alçada para aprovar sua própria minuta.');
      err.statusCode = 403;
      throw err;
    }

    const currentVersion = (contract.versions || []).find((v: any) => v.versionNumber === contract.currentVersionNumber);

    if (input.approved) {
      await prisma.commercialContract.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      if (currentVersion) {
        await prisma.commercialContractVersion.update({
          where: { id: currentVersion.id },
          data: {
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: user.id,
            approvedByName: user.name
          }
        });
      }
    } else {
      await prisma.commercialContract.update({
        where: { id },
        data: {
          status: 'DRAFT',
          notes: input.rejectionReason ? `Minuta reprovada: ${input.rejectionReason}` : contract.notes
        }
      });

      if (currentVersion) {
        await prisma.commercialContractVersion.update({
          where: { id: currentVersion.id },
          data: {
            approvalStatus: 'REJECTED',
            rejectionReason: input.rejectionReason || 'Reprovado pela alçada comercial.'
          }
        });
      }
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: input.approved ? 'CONTRATO_APROVADO' : 'CONTRATO_REPROVADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        publicCode: contract.publicCode,
        approved: input.approved,
        reason: input.rejectionReason
      }
    });

    const full = await prisma.commercialContract.findUnique({
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

    return this.formatContract(full);
  }

  /**
   * Suspende contrato comercial ativo
   */
  public static async suspendContract(
    id: string,
    input: SuspendContractDTO,
    user: any
  ): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({ where: { id } });
    if (!contract) throw new Error(`Contrato ${id} não encontrado.`);

    const updated = await prisma.commercialContract.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: input.reason
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_SUSPENSO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: { reason: input.reason }
    });

    const full = await prisma.commercialContract.findUnique({
      where: { id: updated.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(full);
  }

  /**
   * Reativa contrato comercial suspenso
   */
  public static async reactivateContract(id: string, user: any): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({ where: { id } });
    if (!contract) throw new Error(`Contrato ${id} não encontrado.`);

    const now = new Date();
    const isEffective = !contract.effectiveFrom || new Date(contract.effectiveFrom).getTime() <= now.getTime();
    const newStatus = isEffective ? 'ACTIVE' : 'SIGNED';

    const updated = await prisma.commercialContract.update({
      where: { id },
      data: {
        status: newStatus,
        suspendedAt: null,
        suspensionReason: null
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_REATIVADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: { newStatus }
    });

    const full = await prisma.commercialContract.findUnique({
      where: { id: updated.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(full);
  }

  /**
   * Rescinde contrato comercial (encerramento formal)
   */
  public static async terminateContract(
    id: string,
    input: TerminateContractDTO,
    user: any
  ): Promise<CommercialContractDTO> {
    const contract = await prisma.commercialContract.findUnique({ where: { id } });
    if (!contract) throw new Error(`Contrato ${id} não encontrado.`);

    const updated = await prisma.commercialContract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminatedAt: new Date(),
        terminationReason: input.reason
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RESCINDIDO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: { reason: input.reason }
    });

    const full = await prisma.commercialContract.findUnique({
      where: { id: updated.id },
      include: {
        producer: true,
        parties: true,
        versions: { include: { terms: true } },
        amendments: true,
        renewals: true,
        envelopes: { include: { signers: true } }
      }
    });

    return this.formatContract(full);
  }

  /**
   * Varredura periódica de vigência (ativa contratos assinados com vigência iniciada e expira contratos findados)
   */
  public static async sweepContractStatus(): Promise<{ activatedCount: number; expiredCount: number }> {
    const now = new Date();
    const nowTime = now.getTime();

    const allContracts = await prisma.commercialContract.findMany();
    let activatedCount = 0;
    let expiredCount = 0;

    for (const c of allContracts) {
      // Ativação de contratos com status SIGNED cuja data de vigência chegou
      if (c.status === 'SIGNED' && c.effectiveFrom) {
        if (new Date(c.effectiveFrom).getTime() <= nowTime) {
          await prisma.commercialContract.update({
            where: { id: c.id },
            data: {
              status: 'ACTIVE',
              activatedAt: now
            }
          });
          activatedCount++;
        }
      }

      // Expiração de contratos ACTIVE cujo término passou
      if (c.status === 'ACTIVE' && c.effectiveUntil) {
        if (new Date(c.effectiveUntil).getTime() < nowTime) {
          await prisma.commercialContract.update({
            where: { id: c.id },
            data: { status: 'EXPIRED' }
          });
          expiredCount++;
        }
      }
    }

    return { activatedCount, expiredCount };
  }

  /**
   * Formatação padronizada de DTO de contrato
   */
  public static formatContract(contract: any): CommercialContractDTO {
    const currentVersion = (contract.versions || []).find(
      (v: any) => v.versionNumber === contract.currentVersionNumber
    ) || contract.versions?.[0] || null;

    return {
      id: contract.id,
      publicCode: contract.publicCode,
      producerId: contract.producerId,
      producerName: contract.producer?.name || null,
      sourceOpportunityId: contract.sourceOpportunityId || null,
      sourceProposalId: contract.sourceProposalId || null,
      sourceProposalVersionId: contract.sourceProposalVersionId || null,
      sourceProposalContentHash: contract.sourceProposalContentHash || null,
      title: contract.title,
      description: contract.description || null,
      status: contract.status,
      currentVersionNumber: contract.currentVersionNumber,
      currentVersionId: contract.currentVersionId || null,
      currentVersion: currentVersion ? {
        ...currentVersion,
        createdAt: currentVersion.createdAt instanceof Date ? currentVersion.createdAt.toISOString() : currentVersion.createdAt,
        updatedAt: currentVersion.updatedAt instanceof Date ? currentVersion.updatedAt.toISOString() : currentVersion.updatedAt,
        effectiveFrom: currentVersion.effectiveFrom ? (currentVersion.effectiveFrom instanceof Date ? currentVersion.effectiveFrom.toISOString() : currentVersion.effectiveFrom) : null,
        effectiveUntil: currentVersion.effectiveUntil ? (currentVersion.effectiveUntil instanceof Date ? currentVersion.effectiveUntil.toISOString() : currentVersion.effectiveUntil) : null,
        approvedAt: currentVersion.approvedAt ? (currentVersion.approvedAt instanceof Date ? currentVersion.approvedAt.toISOString() : currentVersion.approvedAt) : null,
        signedAt: currentVersion.signedAt ? (currentVersion.signedAt instanceof Date ? currentVersion.signedAt.toISOString() : currentVersion.signedAt) : null,
        terms: (currentVersion.terms || []).map((t: any) => ({
          ...t,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt
        }))
      } : null,
      ownerId: contract.ownerId,
      ownerName: contract.ownerName || null,
      effectiveFrom: contract.effectiveFrom ? (contract.effectiveFrom instanceof Date ? contract.effectiveFrom.toISOString() : contract.effectiveFrom) : null,
      effectiveUntil: contract.effectiveUntil ? (contract.effectiveUntil instanceof Date ? contract.effectiveUntil.toISOString() : contract.effectiveUntil) : null,
      signedAt: contract.signedAt ? (contract.signedAt instanceof Date ? contract.signedAt.toISOString() : contract.signedAt) : null,
      activatedAt: contract.activatedAt ? (contract.activatedAt instanceof Date ? contract.activatedAt.toISOString() : contract.activatedAt) : null,
      suspendedAt: contract.suspendedAt ? (contract.suspendedAt instanceof Date ? contract.suspendedAt.toISOString() : contract.suspendedAt) : null,
      suspensionReason: contract.suspensionReason || null,
      terminatedAt: contract.terminatedAt ? (contract.terminatedAt instanceof Date ? contract.terminatedAt.toISOString() : contract.terminatedAt) : null,
      terminationReason: contract.terminationReason || null,
      notes: contract.notes || null,
      internalNotes: contract.internalNotes || null,
      version: contract.version || 1,
      createdAt: contract.createdAt instanceof Date ? contract.createdAt.toISOString() : contract.createdAt,
      updatedAt: contract.updatedAt instanceof Date ? contract.updatedAt.toISOString() : contract.updatedAt,
      parties: (contract.parties || []).map((p: any) => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt
      })),
      versions: (contract.versions || []).map((v: any) => ({
        ...v,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
        updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : v.updatedAt,
        effectiveFrom: v.effectiveFrom ? (v.effectiveFrom instanceof Date ? v.effectiveFrom.toISOString() : v.effectiveFrom) : null,
        effectiveUntil: v.effectiveUntil ? (v.effectiveUntil instanceof Date ? v.effectiveUntil.toISOString() : v.effectiveUntil) : null,
        approvedAt: v.approvedAt ? (v.approvedAt instanceof Date ? v.approvedAt.toISOString() : v.approvedAt) : null,
        signedAt: v.signedAt ? (v.signedAt instanceof Date ? v.signedAt.toISOString() : v.signedAt) : null,
        terms: (v.terms || []).map((t: any) => ({
          ...t,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt
        }))
      })),
      amendments: (contract.amendments || []).map((a: any) => ({
        ...a,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
        effectiveFrom: a.effectiveFrom instanceof Date ? a.effectiveFrom.toISOString() : a.effectiveFrom,
        approvedAt: a.approvedAt ? (a.approvedAt instanceof Date ? a.approvedAt.toISOString() : a.approvedAt) : null,
        signedAt: a.signedAt ? (a.signedAt instanceof Date ? a.signedAt.toISOString() : a.signedAt) : null
      })),
      renewals: (contract.renewals || []).map((r: any) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        completedAt: r.completedAt ? (r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt) : null,
        targetEffectiveFrom: r.targetEffectiveFrom ? (r.targetEffectiveFrom instanceof Date ? r.targetEffectiveFrom.toISOString() : r.targetEffectiveFrom) : null,
        targetEffectiveUntil: r.targetEffectiveUntil ? (r.targetEffectiveUntil instanceof Date ? r.targetEffectiveUntil.toISOString() : r.targetEffectiveUntil) : null
      })),
      envelopes: (contract.envelopes || []).map((e: any) => ({
        ...e,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
        sentAt: e.sentAt ? (e.sentAt instanceof Date ? e.sentAt.toISOString() : e.sentAt) : null,
        completedAt: e.completedAt ? (e.completedAt instanceof Date ? e.completedAt.toISOString() : e.completedAt) : null,
        cancelledAt: e.cancelledAt ? (e.cancelledAt instanceof Date ? e.cancelledAt.toISOString() : e.cancelledAt) : null,
        signers: (e.signers || []).map((s: any) => ({
          ...s,
          createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
          signedAt: s.signedAt ? (s.signedAt instanceof Date ? s.signedAt.toISOString() : s.signedAt) : null
        }))
      }))
    };
  }
}
