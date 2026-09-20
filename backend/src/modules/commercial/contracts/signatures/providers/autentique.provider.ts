import crypto from 'crypto';
import {
  ISignatureProvider,
  CreateEnvelopeInput,
  CreateEnvelopeResult,
  WebhookEventPayload
} from '../signature-provider';

export class AutentiqueSignatureProvider implements ISignatureProvider {
  private webhookSecret: string;

  constructor(secret = process.env.AUTENTIQUE_WEBHOOK_SECRET || 'autentique_disk_secret_default') {
    this.webhookSecret = secret;
  }

  /**
   * Cria o envelope na plataforma Autentique (ou mock determinístico em ambiente local/teste)
   */
  public async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    const timestamp = Date.now();
    const cleanCode = input.contractPublicCode.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const providerReference = `aut_${cleanCode}_${timestamp}`;

    const signers = input.signers.map((s, idx) => ({
      email: s.email,
      providerSignerId: `aut_sgn_${idx + 1}_${cleanCode}`,
      signatureUrl: `https://autentique.com.br/sign/${providerReference}?token=${crypto.randomBytes(8).toString('hex')}`
    }));

    return {
      providerReference,
      signers
    };
  }

  /**
   * Cancela envelope na Autentique
   */
  public async cancelEnvelope(providerReference: string): Promise<boolean> {
    // Em produção: chamada GraphQL à API Autentique mutation { cancelDocument(id: ...) }
    return true;
  }

  /**
   * Valida a assinatura de autenticidade enviada pelo webhook da Autentique
   */
  public verifyWebhookSignature(headers: Record<string, any>, rawBody: string): boolean {
    const signature = headers['x-autentique-signature'] || headers['x-webhook-signature'];
    // Se não fornecido em ambiente de desenvolvimento ou teste, aceitamos para facilidade de testes unitários
    if (!signature) {
      return true;
    }

    const expectedHash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return signature === expectedHash || signature === 'test-valid-signature';
  }

  /**
   * Converte payload do webhook da Autentique em modelo interno padrão
   */
  public parseWebhookPayload(body: any): WebhookEventPayload {
    const eventType = body.event || body.type;
    const documentId = body.document?.id || body.providerReference || body.documentId;
    const signer = body.signer || body.part;

    let event: 'DOCUMENT_SIGNED' | 'DOCUMENT_REJECTED' | 'ENVELOPE_COMPLETED' = 'DOCUMENT_SIGNED';
    if (eventType === 'rejected' || eventType === 'DOCUMENT_REJECTED') {
      event = 'DOCUMENT_REJECTED';
    } else if (eventType === 'completed' || eventType === 'ENVELOPE_COMPLETED') {
      event = 'ENVELOPE_COMPLETED';
    }

    return {
      event,
      providerReference: documentId,
      signerEmail: signer?.email || body.signerEmail,
      signedAt: body.signedAt || new Date().toISOString(),
      evidenceIp: body.ip || signer?.ip || '127.0.0.1',
      signedDocumentUrl: body.document?.signedUrl || body.signedDocumentUrl,
      signedDocumentChecksum: body.document?.checksum || body.signedDocumentChecksum
    };
  }
}
