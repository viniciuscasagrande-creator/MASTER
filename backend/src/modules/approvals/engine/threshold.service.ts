import { prisma } from '../../../core/database/prisma';

export interface ThresholdValidationResult {
  allowed: boolean;
  maxLimit?: number;
  reason?: string;
}

export class ThresholdService {
  /**
   * Validates if a user (or their roles) has sufficient approval threshold for an operation and amount.
   */
  async validateThreshold(
    userId: string,
    operation: string,
    amount?: number | null,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<ThresholdValidationResult> {
    // If no monetary amount is involved or amount <= 0, threshold check passes
    if (amount === undefined || amount === null || amount <= 0) {
      return { allowed: true };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      return { allowed: false, reason: 'USUARIO_NAO_ENCONTRADO' };
    }

    const roleCodes: string[] = (user.userRoles || []).map((ur: any) => ur.role?.code || ur.roleCode || ur.role?.name || '');

    // Super Admin has unlimited approval threshold
    if (user.isSuperAdmin || roleCodes.includes('ADMINISTRADOR_GERAL') || roleCodes.includes('SUPER_ADMIN')) {
      return { allowed: true, maxLimit: Infinity };
    }

    // 1. Check user-specific thresholds
    const userThresholds = await prisma.approvalThreshold.findMany({
      where: {
        userId,
        operation
      }
    });

    if (userThresholds && userThresholds.length > 0) {
      // Check if producer matches if specified
      const matching = userThresholds.filter((t: any) => {
        if (t.producerId && producerId && t.producerId !== producerId) return false;
        if (t.eventId && eventId && t.eventId !== eventId) return false;
        return true;
      });

      if (matching.length > 0) {
        // Take the highest threshold among matching
        const maxLimit = Math.max(...matching.map((t: any) => t.maxApprovalAmount));
        if (amount <= maxLimit) {
          return { allowed: true, maxLimit };
        } else {
          return {
            allowed: false,
            maxLimit,
            reason: `ALCADA_INSUFICIENTE: O valor da solicitação (R$ ${amount.toFixed(2)}) excede seu limite de aprovação pessoal (R$ ${maxLimit.toFixed(2)})`
          };
        }
      }
    }

    // 2. Check role-based thresholds
    const roleThresholds = await prisma.approvalThreshold.findMany({
      where: {
        operation,
        roleCode: { in: roleCodes }
      }
    });

    if (roleThresholds && roleThresholds.length > 0) {
      const matchingRoles = roleThresholds.filter((t: any) => {
        if (t.producerId && producerId && t.producerId !== producerId) return false;
        return true;
      });

      if (matchingRoles.length > 0) {
        const maxLimit = Math.max(...matchingRoles.map((t: any) => t.maxApprovalAmount));
        if (amount <= maxLimit) {
          return { allowed: true, maxLimit };
        } else {
          return {
            allowed: false,
            maxLimit,
            reason: `ALCADA_INSUFICIENTE: O valor da solicitação (R$ ${amount.toFixed(2)}) excede a alçada do seu perfil (R$ ${maxLimit.toFixed(2)})`
          };
        }
      }
    }

    // If no threshold rule is defined for this operation, default to allowing or fallback
    return { allowed: true, maxLimit: Infinity };
  }
}

export const thresholdService = new ThresholdService();
