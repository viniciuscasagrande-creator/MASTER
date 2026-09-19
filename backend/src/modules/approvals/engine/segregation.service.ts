export interface SegregationValidationResult {
  allowed: boolean;
  reason?: string;
  code?: string;
}

export class SegregationService {
  /**
   * Validates Maker-Checker segregation and distinct checker rules:
   * 1. Solicitante ≠ Aprovador (prohibitSelfApproval)
   * 2. Aprovador 1 ≠ Aprovador 2 (requireDistinctApprovers)
   * 3. Role eligibility based on rule allowedRoles
   */
  validateSegregation(
    request: any,
    rule: any,
    approverId: string,
    approverRoles: string[]
  ): SegregationValidationResult {
    const isSuperAdmin = approverRoles.includes('ADMINISTRADOR_GERAL') || approverRoles.includes('SUPER_ADMIN');

    // 1. Solicitante ≠ Aprovador
    const prohibitSelf = rule?.prohibitSelfApproval !== undefined ? rule.prohibitSelfApproval : true;
    if (prohibitSelf && request.requesterId === approverId) {
      return {
        allowed: false,
        code: 'SOLICITANTE_NAO_PODE_APROVAR',
        reason: 'Segregação Maker-Checker violada: O solicitante da operação não pode aprovar o próprio pedido.'
      };
    }

    // 2. Aprovador 1 ≠ Aprovador 2 (multi-step approvals)
    const requireDistinct = rule?.requireDistinctApprovers !== undefined ? rule.requireDistinctApprovers : true;
    if (requireDistinct) {
      // Check past decisions on this request
      const pastDecisions = request.decisions || [];
      const alreadyApproved = pastDecisions.some(
        (d: any) => (d.decision === 'APPROVE' || d.decision === 'APPROVED') && (d.approverId === approverId || d.userId === approverId)
      );

      if (alreadyApproved) {
        return {
          allowed: false,
          code: 'MESMO_APROVADOR_NAO_PODE_REPETIR',
          reason: 'Dupla Validação violada: O mesmo usuário não pode realizar mais de uma etapa de aprovação nesta solicitação.'
        };
      }
    }

    // 3. Allowed Roles
    let allowedRoles: string[] = [];
    if (typeof rule?.allowedRoles === 'string') {
      try {
        allowedRoles = JSON.parse(rule.allowedRoles);
      } catch {
        allowedRoles = [rule.allowedRoles];
      }
    } else if (Array.isArray(rule?.allowedRoles)) {
      allowedRoles = rule.allowedRoles;
    }

    if (allowedRoles.length > 0 && !isSuperAdmin) {
      const hasAllowedRole = approverRoles.some(r => allowedRoles.includes(r));
      if (!hasAllowedRole) {
        return {
          allowed: false,
          code: 'PERFIL_NAO_AUTORIZADO',
          reason: `Seu perfil atual não possui autorização para aprovar esta regra. Perfis aceitos: ${allowedRoles.join(', ')}`
        };
      }
    }

    return { allowed: true };
  }
}

export const segregationService = new SegregationService();
