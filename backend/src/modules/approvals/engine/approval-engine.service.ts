import { prisma } from '../../../core/database/prisma';
import { ruleResolverService } from './rule-resolver.service';
import { thresholdService } from './threshold.service';
import { segregationService } from './segregation.service';
import { delegationService } from './delegation.service';
import { executionService } from './execution.service';
import { financePolicy } from '../policies/finance.policy';
import { refundPolicy } from '../policies/refund.policy';
import { adminPolicy } from '../policies/admin.policy';
import { SecurityService } from '../../security/security.service';
import { auditService } from '../../audit/audit.service';
import {
  CreateApprovalRequestDto,
  ApproveStepDto,
  RejectStepDto,
  RequestChangesDto,
  SimulateApprovalDto,
  SimulationResult
} from '../approval.types';

export class ApprovalEngineService {
  public static async createRequest(requester: any, dto: CreateApprovalRequestDto): Promise<any> {
    return new ApprovalEngineService().createRequest(requester, dto);
  }

  /**
   * Creates a new approval request, binds an immutable rule snapshot, and instantiates approval steps.
   */
  async createRequest(requester: any, dto: CreateApprovalRequestDto): Promise<any> {
    const operation = dto.operation;
    const amount = dto.amount !== undefined ? dto.amount : null;
    const producerId = dto.producerId || null;
    const eventId = dto.eventId || null;

    // 1. Resolve matching rule via hierarchy (EVENT -> PRODUCER -> GLOBAL)
    const resolved = await ruleResolverService.resolveRule(operation, amount, producerId, eventId);
    if (!resolved || !resolved.rule) {
      const err: any = new Error(`Nenhuma regra de aprovação ativa configurada para a operação ${operation}.`);
      err.code = 'REGRA_NAO_ENCONTRADA';
      err.statusCode = 404;
      throw err;
    }

    const { rule } = resolved;

    // 2. Validate domain policy
    if (operation.startsWith('FINANCE_')) {
      const check = financePolicy.validateRequest(dto, rule);
      if (!check.valid) {
        const err: any = new Error(check.error);
        err.code = 'POLICY_VALIDATION_ERROR';
        err.statusCode = 400;
        throw err;
      }
    } else if (operation === 'REFUND_REQUEST') {
      const check = refundPolicy.validateRequest(dto, rule);
      if (!check.valid) {
        const err: any = new Error(check.error);
        err.code = 'POLICY_VALIDATION_ERROR';
        err.statusCode = 400;
        throw err;
      }
    } else if (operation.startsWith('ADMIN_')) {
      const check = adminPolicy.validateRequest(dto, rule);
      if (!check.valid) {
        const err: any = new Error(check.error);
        err.code = 'POLICY_VALIDATION_ERROR';
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Generate sequential request code
    const requestCode = `APR-${Math.floor(1000 + Math.random() * 9000)}`;

    const requesterRoles = requester.roles || [];
    const requesterRole = requesterRoles[0] || 'SOLICITANTE';

    const approvalsRequired = rule.approvalsRequired || 1;
    const isSequential = rule.isSequential || false;

    // 4. Create Approval Request with immutable rule snapshot
    const request = await prisma.approvalRequest.create({
      data: {
        requestCode,
        operation,
        title: dto.title,
        description: dto.description || null,
        resourceType: operation,
        resourceId: `res_${Date.now()}`,
        amount,
        producerId,
        eventId,
        requesterId: requester.id,
        requesterName: requester.name || requester.email || 'Solicitante',
        requesterRole,
        ruleId: rule.id,
        ruleVersion: rule.version || 1,
        policySnapshot: JSON.stringify(rule),
        status: approvalsRequired > 1 ? 'IN_PROGRESS' : 'PENDING',
        approvalsCount: 0,
        approvalsRequired,
        currentStep: 1,
        payload: dto.payload ? (typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload)) : null
      }
    });

    // 5. Instantiate approval steps
    let allowedRoleCodes: string[] = [];
    if (typeof rule.allowedRoles === 'string') {
      try {
        allowedRoleCodes = JSON.parse(rule.allowedRoles);
      } catch {
        allowedRoleCodes = [rule.allowedRoles];
      }
    } else if (Array.isArray(rule.allowedRoles)) {
      allowedRoleCodes = rule.allowedRoles;
    }

    const stepItems: any[] = [];
    for (let i = 1; i <= approvalsRequired; i++) {
      let initialStatus = 'PENDING';
      if (isSequential) {
        // Only step 1 starts IN_PROGRESS; step 2 is PENDING
        initialStatus = i === 1 ? 'IN_PROGRESS' : 'PENDING';
      } else {
        // Parallel: all steps start IN_PROGRESS
        initialStatus = 'IN_PROGRESS';
      }

      stepItems.push({
        id: `step_${request.id}_${i}`,
        requestId: request.id,
        stepOrder: i,
        roleCode: allowedRoleCodes[i - 1] || allowedRoleCodes[0] || null,
        status: initialStatus
      });
    }

    await prisma.approvalStep.createMany({ data: stepItems });

    // 6. Save attachments if any
    if (dto.attachments && dto.attachments.length > 0) {
      for (const att of dto.attachments) {
        await prisma.approvalAttachment.create({
          data: {
            requestId: request.id,
            documentType: att.fileType || 'ANEXO',
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize || 0,
            uploadedByUserId: requester.id,
            uploadedByUserName: requester.name || requester.email
          }
        });
      }
    }

    // 7. Audit log
    await auditService.log({
      userId: requester.id,
      action: 'APPROVAL_REQUEST_CREATED',
      resource: 'approval_request',
      resourceId: request.id,
      details: {
        requestCode,
        operation,
        amount,
        ruleId: rule.id,
        approvalsRequired,
        isSequential
      }
    });

    return prisma.approvalRequest.findUnique({
      where: { id: request.id },
      include: { steps: true, rule: true, attachments: true }
    });
  }

  /**
   * Approves a step in an approval request.
   */
  async approveStep(
    requestId: string,
    approver: any,
    dto: ApproveStepDto,
    clientIp: string = '127.0.0.1'
  ): Promise<any> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        steps: true,
        decisions: true,
        rule: true
      }
    });

    if (!request) {
      const err: any = new Error('Solicitação de aprovação não encontrada.');
      err.code = 'NAO_ENCONTRADO';
      err.statusCode = 404;
      throw err;
    }

    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) {
      const err: any = new Error(`Esta solicitação já foi finalizada com status ${request.status}.`);
      err.code = 'SOLICITACAO_JA_FINALIZADA';
      err.statusCode = 400;
      throw err;
    }

    // Retrieve immutable rule from snapshot (protects against retroactive rule changes)
    let rule = request.rule;
    if (request.policySnapshot) {
      try {
        rule = JSON.parse(request.policySnapshot);
      } catch {
        rule = request.rule;
      }
    }

    const approverRoles: string[] = approver.roles || [];
    const isSuperAdmin = approverRoles.includes('ADMINISTRADOR_GERAL') || approverRoles.includes('SUPER_ADMIN');

    // 1. Segregation validation: Maker-Checker + Distinct Checkers
    const segCheck = segregationService.validateSegregation(request, rule, approver.id, approverRoles);
    if (!segCheck.allowed) {
      const err: any = new Error(segCheck.reason);
      err.code = segCheck.code || 'SEGREGAÇÃO_VIOLADA';
      err.statusCode = 403;
      throw err;
    }

    // 2. Threshold validation: Alçada
    const threshCheck = await thresholdService.validateThreshold(
      approver.id,
      request.operation,
      request.amount,
      request.producerId,
      request.eventId
    );
    if (!threshCheck.allowed) {
      const err: any = new Error(threshCheck.reason);
      err.code = 'ALCADA_INSUFICIENTE';
      err.statusCode = 403;
      throw err;
    }

    // 3. Step-Up / 2FA verification
    const requiresStepUp = rule.requireStepUp || (request.amount && request.amount >= 200000);
    if (requiresStepUp) {
      if (!dto.stepUpToken) {
        const err: any = new Error('Esta operação requer reautenticação imediata (Step-Up / 2FA).');
        err.code = 'STEP_UP_REQUIRED';
        err.statusCode = 403;
        throw err;
      }

      const isValidToken = SecurityService.verifyStepUpToken(approver.id, dto.stepUpToken);
      if (!isValidToken) {
        const err: any = new Error('Token de reautenticação (Step-Up) inválido ou expirado.');
        err.code = 'STEP_UP_EXPIRED';
        err.statusCode = 403;
        throw err;
      }
    }

    // 4. Determine which step to approve
    const pendingSteps = (request.steps || []).filter((s: any) => s.status === 'IN_PROGRESS');
    if (pendingSteps.length === 0) {
      const err: any = new Error('Nenhuma etapa aberta aguardando aprovação nesta solicitação.');
      err.code = 'SEM_ETAPAS_PENDENTES';
      err.statusCode = 400;
      throw err;
    }

    let targetStep = pendingSteps[0];
    if (dto.stepId) {
      const matched = pendingSteps.find((s: any) => s.id === dto.stepId);
      if (matched) targetStep = matched;
    }

    // Check delegation
    let isDelegated = false;
    let delegatedFromUserId: string | null = null;
    const delegators = await delegationService.getActiveDelegatorsForUser(
      approver.id,
      request.operation,
      request.producerId
    );
    if (delegators.length > 0) {
      isDelegated = true;
      delegatedFromUserId = delegators[0];
    }

    // 5. Record Decision
    await prisma.approvalDecision.create({
      data: {
        requestId: request.id,
        userId: approver.id,
        approverId: approver.id,
        userName: approver.name || approver.email || 'Aprovador',
        userRole: approverRoles[0] || 'APROVADOR',
        decision: 'APPROVED',
        comment: dto.comment || 'Aprovado conforme conformidade.',
        isDelegated,
        delegatedFromUserId,
        stepUpToken: dto.stepUpToken || null
      }
    });

    // 6. Update Step
    await prisma.approvalStep.update({
      where: { id: targetStep.id },
      data: {
        status: 'APPROVED',
        approvedByUserId: approver.id,
        approvedByUserName: approver.name || approver.email,
        decision: 'APPROVED',
        comment: dto.comment || null,
        stepUpVerified: !!requiresStepUp,
        decidedAt: new Date()
      }
    });

    // 7. Advance Request State
    const allSteps = await prisma.approvalStep.findMany({
      where: { requestId: request.id }
    });

    const approvedCount = allSteps.filter((s: any) => s.status === 'APPROVED').length;
    const isFullyApproved = approvedCount >= request.approvalsRequired;

    let nextStatus = request.status;
    let currentStepNum = request.currentStep;

    if (isFullyApproved) {
      nextStatus = 'APPROVED';
    } else {
      nextStatus = 'IN_PROGRESS';
      // If sequential, activate next pending step
      if (rule.isSequential) {
        const nextPending = allSteps.find((s: any) => s.status === 'PENDING');
        if (nextPending) {
          await prisma.approvalStep.update({
            where: { id: nextPending.id },
            data: { status: 'IN_PROGRESS' }
          });
          currentStepNum = nextPending.stepOrder;
        }
      }
    }

    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        approvalsCount: approvedCount,
        currentStep: currentStepNum
      }
    });

    // 8. Audit Log
    await auditService.log({
      userId: approver.id,
      action: isFullyApproved ? 'APPROVAL_REQUEST_FULLY_APPROVED' : 'APPROVAL_STEP_APPROVED',
      resource: 'approval_request',
      resourceId: request.id,
      details: {
        stepId: targetStep.id,
        stepOrder: targetStep.stepOrder,
        isFullyApproved,
        isDelegated,
        delegatedFromUserId,
        ipAddress: clientIp
      }
    });

    return prisma.approvalRequest.findUnique({
      where: { id: request.id },
      include: { steps: true, decisions: true, rule: true }
    });
  }

  /**
   * Rejects an approval request with mandatory reason.
   */
  async rejectRequest(
    requestId: string,
    approver: any,
    dto: RejectStepDto
  ): Promise<any> {
    if (!dto.reason || !dto.reason.trim()) {
      const err: any = new Error('O motivo da rejeição é obrigatório.');
      err.code = 'MOTIVO_OBRIGATORIO';
      err.statusCode = 400;
      throw err;
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: true, decisions: true, rule: true }
    });

    if (!request) {
      const err: any = new Error('Solicitação de aprovação não encontrada.');
      err.code = 'NAO_ENCONTRADO';
      err.statusCode = 404;
      throw err;
    }

    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) {
      const err: any = new Error(`Esta solicitação já foi finalizada com status ${request.status}.`);
      err.code = 'SOLICITACAO_JA_FINALIZADA';
      err.statusCode = 400;
      throw err;
    }

    const approverRoles: string[] = approver.roles || [];

    // Record rejection decision
    await prisma.approvalDecision.create({
      data: {
        requestId: request.id,
        userId: approver.id,
        approverId: approver.id,
        userName: approver.name || approver.email || 'Aprovador',
        userRole: approverRoles[0] || 'APROVADOR',
        decision: 'REJECTED',
        comment: dto.reason
      }
    });

    // Mark current in-progress step as REJECTED
    const inProgressStep = (request.steps || []).find((s: any) => s.status === 'IN_PROGRESS');
    if (inProgressStep) {
      await prisma.approvalStep.update({
        where: { id: inProgressStep.id },
        data: {
          status: 'REJECTED',
          approvedByUserId: approver.id,
          approvedByUserName: approver.name || approver.email,
          decision: 'REJECTED',
          comment: dto.reason,
          decidedAt: new Date()
        }
      });
    }

    // Set request to REJECTED
    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' }
    });

    // Audit Log
    await auditService.log({
      userId: approver.id,
      action: 'APPROVAL_REQUEST_REJECTED',
      resource: 'approval_request',
      resourceId: request.id,
      details: { reason: dto.reason }
    });

    return prisma.approvalRequest.findUnique({
      where: { id: request.id },
      include: { steps: true, decisions: true }
    });
  }

  /**
   * Requests changes from the requester (ACTION_REQUIRED).
   */
  async requestChanges(
    requestId: string,
    approver: any,
    dto: RequestChangesDto
  ): Promise<any> {
    if (!dto.comment || !dto.comment.trim()) {
      const err: any = new Error('O comentário com os ajustes necessários é obrigatório.');
      err.code = 'COMENTARIO_OBRIGATORIO';
      err.statusCode = 400;
      throw err;
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: true }
    });

    if (!request) {
      const err: any = new Error('Solicitação de aprovação não encontrada.');
      err.code = 'NAO_ENCONTRADO';
      err.statusCode = 404;
      throw err;
    }

    await prisma.approvalDecision.create({
      data: {
        requestId: request.id,
        userId: approver.id,
        approverId: approver.id,
        userName: approver.name || approver.email || 'Aprovador',
        userRole: (approver.roles || [])[0] || 'APROVADOR',
        decision: 'CHANGES_REQUESTED',
        comment: dto.comment
      }
    });

    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: 'ACTION_REQUIRED' }
    });

    await prisma.approvalComment.create({
      data: {
        requestId: request.id,
        userId: approver.id,
        userName: approver.name || approver.email,
        comment: `Ajustes solicitados: ${dto.comment}`
      }
    });

    await auditService.log({
      userId: approver.id,
      action: 'APPROVAL_CHANGES_REQUESTED',
      resource: 'approval_request',
      resourceId: request.id,
      details: { comment: dto.comment }
    });

    return prisma.approvalRequest.findUnique({
      where: { id: request.id },
      include: { steps: true, decisions: true, comments: true }
    });
  }

  /**
   * Cancels a pending request (Requester or Super Admin only).
   */
  async cancelRequest(requestId: string, user: any, reason?: string): Promise<any> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      const err: any = new Error('Solicitação de aprovação não encontrada.');
      err.code = 'NAO_ENCONTRADO';
      err.statusCode = 404;
      throw err;
    }

    const isRequester = request.requesterId === user.id;
    const isSuperAdmin = (user.roles || []).includes('ADMINISTRADOR_GERAL');

    if (!isRequester && !isSuperAdmin) {
      const err: any = new Error('Apenas o próprio solicitante ou o Administrador Geral podem cancelar esta solicitação.');
      err.code = 'NAO_AUTORIZADO';
      err.statusCode = 403;
      throw err;
    }

    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) {
      const err: any = new Error(`Solicitações com status ${request.status} não podem ser canceladas.`);
      err.code = 'STATUS_INVALIDO';
      err.statusCode = 400;
      throw err;
    }

    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: 'CANCELLED' }
    });

    await prisma.approvalDecision.create({
      data: {
        requestId: request.id,
        userId: user.id,
        approverId: user.id,
        userName: user.name || user.email,
        decision: 'CANCELLED',
        comment: reason || 'Cancelado pelo usuário.'
      }
    });

    await auditService.log({
      userId: user.id,
      action: 'APPROVAL_REQUEST_CANCELLED',
      resource: 'approval_request',
      resourceId: request.id,
      details: { reason }
    });

    return prisma.approvalRequest.findUnique({
      where: { id: request.id }
    });
  }

  /**
   * Simulates an approval rule for a prospective operation and amount.
   */
  async simulateRule(dto: SimulateApprovalDto): Promise<SimulationResult> {
    const resolved = await ruleResolverService.resolveRule(
      dto.operation,
      dto.amount,
      dto.producerId,
      dto.eventId
    );

    if (!resolved || !resolved.rule) {
      return {
        operation: dto.operation,
        amount: dto.amount,
        producerId: dto.producerId,
        eventId: dto.eventId,
        matchedRule: null,
        stepsRequired: 1,
        isSequential: false,
        eligibleRoles: ['ADMINISTRADOR_GERAL'],
        requireStepUp: false,
        summary: `Nenhuma regra específica encontrada. A operação seguirá a governança padrão do Administrador Geral.`
      };
    }

    const { rule, scopeLevel } = resolved;

    let allowedRoles: string[] = [];
    if (typeof rule.allowedRoles === 'string') {
      try {
        allowedRoles = JSON.parse(rule.allowedRoles);
      } catch {
        allowedRoles = [rule.allowedRoles];
      }
    } else if (Array.isArray(rule.allowedRoles)) {
      allowedRoles = rule.allowedRoles;
    }

    const approvalsRequired = rule.approvalsRequired || 1;
    const isSequential = rule.isSequential || false;
    const requireStepUp = rule.requireStepUp || (dto.amount !== undefined && dto.amount !== null && dto.amount >= 200000);

    const summary = `Regra [${rule.code}] identificada no nível de escopo ${scopeLevel}. Exige ${approvalsRequired} aprovação(ões)${
      isSequential ? ' sequenciais' : ' em paralelo'
    }. Perfis elegíveis: ${allowedRoles.join(', ')}.${requireStepUp ? ' Requer reautenticação Step-Up / 2FA.' : ''}`;

    return {
      operation: dto.operation,
      amount: dto.amount,
      producerId: dto.producerId,
      eventId: dto.eventId,
      matchedRule: {
        id: rule.id,
        code: rule.code,
        name: rule.name,
        scopeLevel,
        approvalsRequired,
        isSequential,
        requireDistinctApprovers: rule.requireDistinctApprovers ?? true,
        prohibitSelfApproval: rule.prohibitSelfApproval ?? true,
        requireStepUp,
        allowedRoles,
        slaHours: rule.slaHours || 24
      },
      stepsRequired: approvalsRequired,
      isSequential,
      eligibleRoles: allowedRoles,
      requireStepUp,
      summary
    };
  }

  /**
   * Returns items pending approval in the current user's inbox.
   */
  async getInbox(user: any, filter?: any): Promise<any[]> {
    const userRoles: string[] = user.roles || [];
    const isSuperAdmin = userRoles.includes('ADMINISTRADOR_GERAL') || userRoles.includes('SUPER_ADMIN');

    // Find all open requests
    const openRequests = await prisma.approvalRequest.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        steps: true,
        decisions: true,
        rule: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const inboxItems: any[] = [];

    for (const req of openRequests) {
      let rule = req.rule;
      if (req.policySnapshot) {
        try {
          rule = JSON.parse(req.policySnapshot);
        } catch {
          rule = req.rule;
        }
      }

      // Maker-Checker: if prohibitSelfApproval and user is requester, hide from inbox
      if (rule?.prohibitSelfApproval && req.requesterId === user.id) {
        continue;
      }

      // Distinct checkers: if user already approved a previous step, hide
      if (rule?.requireDistinctApprovers) {
        const decisions = req.decisions || [];
        const alreadyApproved = decisions.some(
          (d: any) => (d.userId === user.id || d.approverId === user.id) && d.decision === 'APPROVED'
        );
        if (alreadyApproved) {
          continue;
        }
      }

      // Producer scope filter: if request is bound to a producer and user is not superadmin, ensure access
      if (req.producerId && !isSuperAdmin) {
        const userProducers = (user.producerAccesses || []).map((p: any) => p.producerId);
        if (userProducers.length > 0 && !userProducers.includes(req.producerId)) {
          continue;
        }
      }

      // Check active steps
      const activeStep = (req.steps || []).find((s: any) => s.status === 'IN_PROGRESS');
      if (!activeStep) continue;

      // Check role eligibility
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

      const roleMatches = isSuperAdmin || userRoles.some(r => allowedRoles.includes(r));
      if (!roleMatches) {
        // Check if user has active delegation from an eligible approver
        const delegators = await delegationService.getActiveDelegatorsForUser(
          user.id,
          req.operation,
          req.producerId
        );
        if (delegators.length === 0) {
          continue;
        }
      }

      // Check threshold
      const thresh = await thresholdService.validateThreshold(
        user.id,
        req.operation,
        req.amount,
        req.producerId,
        req.eventId
      );

      inboxItems.push({
        ...req,
        currentStepInfo: activeStep,
        hasSufficientThreshold: thresh.allowed,
        thresholdLimit: thresh.maxLimit
      });
    }

    return inboxItems;
  }

  /**
   * Returns requests created by the user.
   */
  async getMyRequests(user: any): Promise<any[]> {
    return prisma.approvalRequest.findMany({
      where: { requesterId: user.id },
      include: { steps: true, decisions: true, rule: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Returns completed decisions and past requests.
   */
  async getHistory(user: any): Promise<any[]> {
    const isSuperAdmin = (user.roles || []).includes('ADMINISTRADOR_GERAL');

    if (isSuperAdmin) {
      return prisma.approvalRequest.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED', 'CANCELLED'] }
        },
        include: { steps: true, decisions: true, rule: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return prisma.approvalRequest.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { decisions: { some: { userId: user.id } } }
        ]
      },
      include: { steps: true, decisions: true, rule: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get single approval request details.
   */
  async getDetails(requestId: string, user: any): Promise<any> {
    const req = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        steps: { include: { decisions: true } },
        decisions: true,
        comments: true,
        attachments: true,
        rule: true,
        producer: true,
        event: true
      }
    });

    if (!req) {
      const err: any = new Error('Solicitação de aprovação não encontrada.');
      err.code = 'NAO_ENCONTRADO';
      err.statusCode = 404;
      throw err;
    }

    return req;
  }

  /**
   * Triggers decoupled execution of an approved request.
   */
  async executeApproved(requestId: string, executor: any, idempotencyKey?: string): Promise<any> {
    return executionService.executeApprovedRequest(requestId, executor.id, idempotencyKey);
  }

  /**
   * Adds an immutable comment to a request.
   */
  async addComment(requestId: string, user: any, comment: string): Promise<any> {
    if (!comment || !comment.trim()) {
      throw new Error('Comentário não pode estar vazio.');
    }

    return prisma.approvalComment.create({
      data: {
        requestId,
        userId: user.id,
        userName: user.name || user.email || 'Usuário',
        comment: comment.trim()
      }
    });
  }

  /**
   * Adds an attachment to a request.
   */
  async addAttachment(requestId: string, user: any, attachmentData: any): Promise<any> {
    return prisma.approvalAttachment.create({
      data: {
        requestId,
        documentType: attachmentData.documentType || 'ANEXO',
        fileName: attachmentData.fileName,
        fileUrl: attachmentData.fileUrl,
        fileSize: attachmentData.fileSize || 0,
        uploadedByUserId: user.id,
        uploadedByUserName: user.name || user.email || 'Usuário'
      }
    });
  }
}

export const approvalEngineService = new ApprovalEngineService();
