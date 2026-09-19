import { prisma } from '../../database/prisma';
import { PolicyResolverService } from './policy-resolver.service';
import { PolicyEvaluatorService } from './policy-evaluator.service';
import {
  ResolvePolicyInput,
  ResolvedPolicyDecision,
  CreatePolicyInput
} from '../configuration.types';
import { AppError } from '../../errors/AppError';
import { AuthenticatedUser } from '../../middleware/authenticate';
import { DomainEvents } from '../../../events/DomainEvents';

export class PolicyEngineService {
  /**
   * Main resolution method: takes context + input and produces decision + requirements + snapshot
   */
  public static async resolve(input: ResolvePolicyInput): Promise<ResolvedPolicyDecision> {
    const domain = input.domain.toUpperCase();
    const producerId = input.context.producerId || null;
    const eventId = input.context.eventId || null;
    const userId = input.context.user?.id || 'usr_system';

    // 1. Resolve active policy in hierarchy
    const activeResolved = await PolicyResolverService.resolveActivePolicy(domain, producerId, eventId);

    let effectivePolicy: any = null;
    let source: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT' = 'DEFAULT';
    let outcome: any = null;

    if (activeResolved) {
      effectivePolicy = activeResolved.policy;
      source = activeResolved.scope;
      outcome = PolicyEvaluatorService.evaluate(effectivePolicy.rules || [], input.input);
    }

    const action = outcome?.action || { decision: true, approvalsRequired: 1, stepUpRequired: false, requiredDocuments: [] };
    const explanation = outcome?.explanation || 'Operação autorizada pela política padrão da plataforma.';

    const decisionResult: ResolvedPolicyDecision = {
      decision: action.decision ?? true,
      effectivePolicy: effectivePolicy
        ? {
            id: effectivePolicy.id,
            code: effectivePolicy.code,
            name: effectivePolicy.name,
            version: effectivePolicy.currentVersion,
            ruleId: outcome?.matchedRule?.id,
            ruleName: outcome?.matchedRule?.name
          }
        : null,
      source,
      approvalsRequired: action.approvalsRequired ?? 1,
      stepUpRequired: action.stepUpRequired ?? false,
      requiredDocuments: action.requiredDocuments ?? [],
      slaMinutes: action.slaMinutes,
      explanation,
      actionPayload: action.metadata
    };

    // 2. Persist PolicyEvaluation snapshot for total auditability
    const evaluation = await prisma.policyEvaluation.create({
      data: {
        operation: input.operation,
        domain,
        producerId,
        eventId,
        inputJson: JSON.stringify(input.input),
        decisionJson: JSON.stringify(decisionResult),
        effectiveSource: source,
        policyId: effectivePolicy?.id || null,
        policyVersion: effectivePolicy?.currentVersion || null,
        ruleId: outcome?.matchedRule?.id || null,
        isSimulated: false,
        evaluatedByUserId: userId
      }
    });

    decisionResult.evaluationId = evaluation.id;
    return decisionResult;
  }

  /**
   * Creates a new policy in DRAFT status
   */
  public static async createPolicy(input: CreatePolicyInput, user: AuthenticatedUser): Promise<any> {
    if (!input.code || !input.name || !input.domain) {
      throw new AppError('Código, nome e domínio são obrigatórios para criar uma política.', 400);
    }

    const existing = await prisma.policy.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new AppError(`Já existe uma política cadastrada com o código "${input.code}".`, 409);
    }

    const policy = await prisma.policy.create({
      data: {
        code: input.code,
        name: input.name,
        domain: input.domain.toUpperCase(),
        description: input.description || null,
        scopeType: input.scopeType || 'GLOBAL',
        producerId: input.producerId || null,
        eventId: input.eventId || null,
        status: 'DRAFT', // Starts in DRAFT
        currentVersion: 1,
        priority: input.priority || 100,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
        effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
        requiresApproval: input.requiresApproval || false,
        createdBy: user.id,
        creatorName: user.name
      }
    });

    // Create rules
    const createdRules: any[] = [];
    if (input.rules && input.rules.length > 0) {
      for (let i = 0; i < input.rules.length; i++) {
        const r = input.rules[i];
        const rule = await prisma.policyRule.create({
          data: {
            policyId: policy.id,
            version: 1,
            name: r.name,
            description: r.description || null,
            priority: r.priority || (i + 1) * 10,
            conditionJson: JSON.stringify(r.conditions || []),
            actionJson: JSON.stringify(r.action || { decision: true }),
            orderIndex: r.orderIndex || (i + 1),
            isActive: true
          }
        });
        createdRules.push(rule);
      }
    }

    // Create initial version snapshot
    await prisma.policyVersion.create({
      data: {
        policyId: policy.id,
        versionNumber: 1,
        status: 'DRAFT',
        rulesSnapshot: JSON.stringify(createdRules),
        changeReason: 'Criação inicial da política em rascunho',
        createdBy: user.id,
        creatorName: user.name
      }
    });

    // Dispatch event
    DomainEvents.dispatch('POLICY_CREATED', {
      resourceType: 'POLICY',
      resourceId: policy.id,
      actorUserId: user.id,
      data: {
        code: policy.code,
        name: policy.name,
        domain: policy.domain,
        scopeType: policy.scopeType
      }
    });

    return prisma.policy.findUnique({
      where: { id: policy.id },
      include: { rules: true, versions: true }
    });
  }

  /**
   * Activates a policy (changes status to ACTIVE, supersedes previous active policies in same scope)
   */
  public static async activatePolicy(policyId: string, user: AuthenticatedUser): Promise<any> {
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError('Política não encontrada.', 404);

    // Supersede previously active policy on same scope
    const previouslyActive = await prisma.policy.findFirst({
      where: {
        domain: policy.domain,
        scopeType: policy.scopeType,
        producerId: policy.producerId,
        eventId: policy.eventId,
        status: 'ACTIVE',
        id: { not: policy.id }
      }
    });

    if (previouslyActive) {
      await prisma.policy.update({
        where: { id: previouslyActive.id },
        data: { status: 'SUPERSEDED' }
      });
      await prisma.policyVersion.update({
        where: { id: `${previouslyActive.id}_v${previouslyActive.currentVersion}` },
        data: { status: 'SUPERSEDED' }
      }).catch(() => null);

      DomainEvents.dispatch('POLICY_SUPERSEDED', {
        resourceType: 'POLICY',
        resourceId: previouslyActive.id,
        actorUserId: user.id,
        data: { code: previouslyActive.code }
      });
    }

    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'ACTIVE',
        effectiveFrom: policy.effectiveFrom || new Date()
      },
      include: { rules: true, versions: true }
    });

    DomainEvents.dispatch('POLICY_ACTIVATED', {
      resourceType: 'POLICY',
      resourceId: updated.id,
      actorUserId: user.id,
      data: {
        code: updated.code,
        name: updated.name,
        domain: updated.domain
      }
    });

    return updated;
  }

  /**
   * Schedules a policy to become active at a future date
   */
  public static async schedulePolicy(
    policyId: string,
    effectiveFrom: Date | string,
    effectiveUntil: Date | string | null | undefined,
    user: AuthenticatedUser
  ): Promise<any> {
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError('Política não encontrada.', 404);

    const from = new Date(effectiveFrom);
    if (isNaN(from.getTime()) || from < new Date()) {
      throw new AppError('A data de início do agendamento deve ser uma data futura válida.', 400);
    }

    const until = effectiveUntil ? new Date(effectiveUntil) : null;
    if (until && until <= from) {
      throw new AppError('A data de término deve ser posterior à data de início.', 400);
    }

    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'SCHEDULED',
        effectiveFrom: from,
        effectiveUntil: until
      },
      include: { rules: true, versions: true }
    });

    DomainEvents.dispatch('POLICY_SCHEDULED', {
      resourceType: 'POLICY',
      resourceId: updated.id,
      actorUserId: user.id,
      data: {
        code: updated.code,
        effectiveFrom: from.toISOString(),
        effectiveUntil: until?.toISOString() || null
      }
    });

    return updated;
  }
}
