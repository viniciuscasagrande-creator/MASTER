import { prisma } from '../../../core/database/prisma';

export interface RetentionCheckResult {
  canPurge: boolean;
  retentionDays: number;
  daysRemaining: number;
  policyAction: string;
  reason?: string;
}

export class DocumentRetentionService {
  /**
   * Evaluates if a document can be physically deleted or must be preserved under retention policy
   */
  public static async evaluateRetention(documentId: string): Promise<RetentionCheckResult> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { category: true }
    });

    if (!document) {
      throw new Error('Documento não encontrado para avaliação de retenção');
    }

    // Check specific policy or category retention days
    const policy = await prisma.documentRetentionPolicy.findFirst({
      where: {
        categoryId: document.categoryId,
        OR: [
          { producerId: document.producerId },
          { producerId: null }
        ]
      }
    });

    const retentionDays = policy?.retentionDays || document.category?.retentionDays || 365;
    const policyAction = policy?.action || 'ARCHIVE';

    const createdAt = new Date(document.createdAt).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, retentionDays - elapsedDays);

    if (daysRemaining > 0) {
      return {
        canPurge: false,
        retentionDays,
        daysRemaining,
        policyAction,
        reason: `Documento sob custódia obrigatória. Faltam ${daysRemaining} dias para expiração do período de retenção legal.`
      };
    }

    return {
      canPurge: true,
      retentionDays,
      daysRemaining: 0,
      policyAction
    };
  }
}
