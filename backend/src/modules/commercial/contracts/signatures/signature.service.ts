import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import { AutentiqueSignatureProvider } from './providers/autentique.provider';
import { ISignatureProvider, SignatureSignerInput } from './signature-provider';
import { ContractDocumentService } from '../generation/contract-document.service';
import { AuditService } from '../../../audit/audit.service';
import { PrepareSignatureDTO, SignatureEnvelopeDTO } from '../../../../../../shared/types';

export class SignatureService {
  private static provider: ISignatureProvider = new AutentiqueSignatureProvider();

  public static setProvider(customProvider: ISignatureProvider) {
    this.provider = customProvider;
  }

  /**
   * Prepara os signatários, gera o documento se necessário e despacha o envelope para assinatura
   */
  public static async prepareAndSendEnvelope(
    contractId: string,
    input: PrepareSignatureDTO,
    user: any
  ): Promise<SignatureEnvelopeDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: contractId },
      include: {
        producer: true,
        parties: true,
        versions: true
      }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${contractId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    if (contract.status === 'ACTIVE' || contract.status === 'SIGNED') {
      const err: any = new Error(`Contrato ${contract.publicCode} já foi assinado e encontra-se ${contract.status}. Mudanças exigem Aditivo.`);
      err.statusCode = 400;
      throw err;
    }

    // Identifica versão atual
    const currentVersion = (contract.versions || []).find((v: any) => v.versionNumber === contract.currentVersionNumber);
    if (!currentVersion) {
      const err: any = new Error(`Versão atual (${contract.currentVersionNumber}) do contrato não foi encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    // Se o documento formal ainda não tem checksum, gera o documento formal
    let documentChecksum = currentVersion.documentChecksum;
    if (!documentChecksum) {
      const generated = await ContractDocumentService.generateDocument(contractId, contract.currentVersionNumber);
      documentChecksum = generated.documentChecksum;
    }

    // Signatários padrão: Representante DiskIngressos + Representante do Produtor
    const signersInput: SignatureSignerInput[] = [];

    if (input.signers && input.signers.length > 0) {
      input.signers.forEach((s, idx) => {
        signersInput.push({
          name: s.name,
          email: s.email,
          document: s.document || null,
          role: s.role || null,
          partyType: s.partyType,
          signingOrder: s.signingOrder || idx + 1
        });
      });
    } else {
      // Pega das partes cadastradas ou usa os defaults corporativos
      const diskParty = (contract.parties || []).find((p: any) => p.partyType === 'DISK_INGRESSOS');
      const producerParty = (contract.parties || []).find((p: any) => p.partyType === 'PRODUCER');

      signersInput.push({
        name: diskParty?.representativeName || 'Vinicius Casagrande',
        email: diskParty?.representativeEmail || 'vinicius.casagrande@diskingressos.com.br',
        document: diskParty?.representativeCpf || '123.456.789-00',
        role: diskParty?.representativeRole || 'Diretor Geral',
        partyType: 'DISK_INGRESSOS',
        signingOrder: 1
      });

      signersInput.push({
        name: producerParty?.representativeName || contract.producer?.name || 'Representante do Produtor',
        email: producerParty?.representativeEmail || contract.producer?.email || 'contato@produtor.com.br',
        document: producerParty?.representativeCpf || null,
        role: producerParty?.representativeRole || 'Representante Legal',
        partyType: 'PRODUCER',
        signingOrder: 2
      });
    }

    // Criação no Provedor de Assinatura
    const providerResult = await this.provider.createEnvelope({
      contractId: contract.id,
      contractPublicCode: contract.publicCode,
      title: contract.title,
      documentChecksum: documentChecksum!,
      signers: signersInput
    });

    // Salva SignatureEnvelope
    const envelope = await prisma.signatureEnvelope.create({
      data: {
        contractId: contract.id,
        contractVersionId: currentVersion.id,
        provider: input.provider || 'AUTENTIQUE',
        providerReference: providerResult.providerReference,
        status: 'PENDING',
        documentChecksum: documentChecksum!,
        sentAt: new Date()
      }
    });

    // Salva SignatureSigners
    const signersData = signersInput.map(s => {
      const match = providerResult.signers.find(ps => ps.email.toLowerCase() === s.email.toLowerCase());
      return {
        envelopeId: envelope.id,
        partyType: s.partyType,
        name: s.name,
        email: s.email,
        document: s.document,
        role: s.role,
        signingOrder: s.signingOrder,
        status: 'PENDING',
        providerSignerId: match?.providerSignerId || null,
        signatureUrl: match?.signatureUrl || null
      };
    });

    await prisma.signatureSigner.createMany({
      data: signersData
    });

    // Atualiza status do contrato para SIGNATURE_PENDING
    await prisma.commercialContract.update({
      where: { id: contract.id },
      data: {
        status: 'SIGNATURE_PENDING'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_ENVELOPE_ENVIADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        publicCode: contract.publicCode,
        envelopeId: envelope.id,
        providerReference: providerResult.providerReference,
        signersCount: signersData.length
      }
    });

    const fullEnvelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelope.id },
      include: { signers: true }
    });

    return {
      ...fullEnvelope,
      createdAt: fullEnvelope.createdAt.toISOString(),
      updatedAt: fullEnvelope.updatedAt.toISOString(),
      sentAt: fullEnvelope.sentAt ? fullEnvelope.sentAt.toISOString() : null,
      completedAt: fullEnvelope.completedAt ? fullEnvelope.completedAt.toISOString() : null,
      cancelledAt: fullEnvelope.cancelledAt ? fullEnvelope.cancelledAt.toISOString() : null,
      signers: (fullEnvelope.signers || []).map((s: any) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        signedAt: s.signedAt ? s.signedAt.toISOString() : null
      }))
    };
  }

  /**
   * Processamento de Webhook da Autoridade de Assinatura com Garantia de Idempotência
   */
  public static async processWebhook(
    body: any,
    headers: Record<string, any>,
    rawBody: string
  ): Promise<{ success: boolean; message: string; contractId?: string; contractStatus?: string }> {
    const isValid = this.provider.verifyWebhookSignature(headers, rawBody);
    if (!isValid) {
      const err: any = new Error('Assinatura do webhook inválida ou rejeitada.');
      err.statusCode = 401;
      throw err;
    }

    const payload = this.provider.parseWebhookPayload(body);
    if (!payload.providerReference) {
      return { success: false, message: 'Provider reference ausente no payload.' };
    }

    const envelope = await prisma.signatureEnvelope.findFirst({
      where: { providerReference: payload.providerReference },
      include: {
        contract: true,
        signers: true
      }
    });

    if (!envelope) {
      return { success: false, message: `Envelope com referência ${payload.providerReference} não localizado.` };
    }

    const contract = envelope.contract;

    // IDEMPOTÊNCIA: Se o envelope já foi concluído, não reprocessar
    if (envelope.status === 'COMPLETED') {
      return {
        success: true,
        message: 'Evento já processado anteriormente (idempotência garantida).',
        contractId: contract.id,
        contractStatus: contract.status
      };
    }

    // Se o evento é de assinatura de um signatário
    if (payload.signerEmail) {
      const signer = (envelope.signers || []).find((s: any) => s.email.toLowerCase() === payload.signerEmail!.toLowerCase());
      if (signer) {
        // Se já estava assinado, não faz nada
        if (signer.status !== 'SIGNED') {
          await prisma.signatureSigner.update({
            where: { id: signer.id },
            data: {
              status: 'SIGNED',
              signedAt: new Date(payload.signedAt || new Date()),
              evidenceIp: payload.evidenceIp || null
            }
          });
        }
      }
    }

    // Recarrega signatários para checar se todos assinaram
    const signers = await prisma.signatureSigner.findMany({
      where: { envelopeId: envelope.id }
    });

    const allSigned = signers.length > 0 && signers.every((s: any) => s.status === 'SIGNED');
    const anySigned = signers.some((s: any) => s.status === 'SIGNED');

    let updatedContractStatus = contract.status;

    if (payload.event === 'DOCUMENT_REJECTED') {
      await prisma.signatureEnvelope.update({
        where: { id: envelope.id },
        data: {
          status: 'REJECTED',
          cancelledAt: new Date()
        }
      });

      updatedContractStatus = 'IN_REVIEW';
      await prisma.commercialContract.update({
        where: { id: contract.id },
        data: { status: 'IN_REVIEW' }
      });
    } else if (allSigned || payload.event === 'ENVELOPE_COMPLETED') {
      const now = new Date();
      await prisma.signatureEnvelope.update({
        where: { id: envelope.id },
        data: {
          status: 'COMPLETED',
          completedAt: now
        }
      });

      // Atualiza a versão do contrato com evidências
      if (envelope.contractVersionId) {
        await prisma.commercialContractVersion.update({
          where: { id: envelope.contractVersionId },
          data: {
            signedDocumentId: payload.signedDocumentUrl || `doc_signed_${envelope.id}`,
            signedDocumentChecksum: payload.signedDocumentChecksum || envelope.documentChecksum,
            signedAt: now,
            status: 'SIGNED'
          }
        });
      }

      // REGRA DE OURO: SEPARAÇÃO DE ASSINATURA E VIGÊNCIA (SIGNED != ACTIVE)
      // Se effectiveFrom <= now, ativa imediatamente; caso contrário, status fica SIGNED aguardando início da vigência.
      const isEffectiveNow = !contract.effectiveFrom || new Date(contract.effectiveFrom).getTime() <= now.getTime();

      if (isEffectiveNow) {
        updatedContractStatus = 'ACTIVE';
        await prisma.commercialContract.update({
          where: { id: contract.id },
          data: {
            status: 'ACTIVE',
            signedAt: now,
            activatedAt: now
          }
        });
      } else {
        updatedContractStatus = 'SIGNED';
        await prisma.commercialContract.update({
          where: { id: contract.id },
          data: {
            status: 'SIGNED',
            signedAt: now
          }
        });
      }

      await AuditService.log({
        userId: 'system_webhook',
        userName: 'Webhook Autentique',
        action: 'CONTRATO_ASSINADO_COMPLETO',
        resource: 'CONTRATO_COMERCIAL',
        resourceId: contract.id,
        producerId: contract.producerId,
        details: {
          publicCode: contract.publicCode,
          allSigned: true,
          newStatus: updatedContractStatus,
          effectiveFrom: contract.effectiveFrom
        }
      });
    } else if (anySigned) {
      updatedContractStatus = 'PARTIALLY_SIGNED';
      await prisma.commercialContract.update({
        where: { id: contract.id },
        data: { status: 'PARTIALLY_SIGNED' }
      });
    }

    return {
      success: true,
      message: 'Webhook processado com sucesso.',
      contractId: contract.id,
      contractStatus: updatedContractStatus
    };
  }

  /**
   * Simulação de ação de signatário para testes e demonstração
   */
  public static async simulateSignerAction(
    envelopeId: string,
    signerEmail: string,
    action: 'SIGN' | 'REJECT',
    evidenceIp = '189.40.22.15'
  ) {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId }
    });

    if (!envelope) throw new Error(`Envelope ${envelopeId} não encontrado.`);

    return this.processWebhook(
      {
        event: action === 'SIGN' ? 'DOCUMENT_SIGNED' : 'DOCUMENT_REJECTED',
        providerReference: envelope.providerReference,
        signerEmail,
        signedAt: new Date().toISOString(),
        evidenceIp
      },
      { 'x-autentique-signature': 'test-valid-signature' },
      'test-raw-body'
    );
  }
}
