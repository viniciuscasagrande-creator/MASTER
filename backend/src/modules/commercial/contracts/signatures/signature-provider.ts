export interface SignatureSignerInput {
  name: string;
  email: string;
  document?: string | null;
  role?: string | null;
  partyType: 'DISK_INGRESSOS' | 'PRODUCER';
  signingOrder: number;
}

export interface CreateEnvelopeInput {
  contractId: string;
  contractPublicCode: string;
  title: string;
  documentChecksum: string;
  documentContent?: string;
  signers: SignatureSignerInput[];
}

export interface CreateEnvelopeResult {
  providerReference: string;
  signers: Array<{
    email: string;
    providerSignerId: string;
    signatureUrl: string;
  }>;
}

export interface WebhookEventPayload {
  event: 'DOCUMENT_SIGNED' | 'DOCUMENT_REJECTED' | 'ENVELOPE_COMPLETED';
  providerReference: string;
  signerEmail?: string;
  signedAt?: string;
  evidenceIp?: string;
  signedDocumentUrl?: string;
  signedDocumentChecksum?: string;
}

export interface ISignatureProvider {
  createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult>;
  cancelEnvelope(providerReference: string): Promise<boolean>;
  verifyWebhookSignature(headers: Record<string, any>, rawBody: string): boolean;
  parseWebhookPayload(body: any): WebhookEventPayload;
}
