import { prisma } from '../../database/prisma';
import { PolicyEvaluatorService } from './policy-evaluator.service';
import { PolicySimulateInput, PolicySimulateResult, PolicySimulateTraceStep } from '../configuration.types';

export class PolicySimulatorService {
  /**
   * Simulates policy resolution and rule evaluation with complete resolution trace
   */
  public static async simulate(input: PolicySimulateInput | any): Promise<PolicySimulateResult> {
    const domain = input.domain.toUpperCase();
    const producerId = input.producerId || input.context?.producerId || null;
    const eventId = input.eventId || input.context?.eventId || null;
    const trace: PolicySimulateTraceStep[] = [];
    const now = new Date();

    const isValidPolicy = (p: any) => {
      if (!p || p.status !== 'ACTIVE') return false;
      if (p.effectiveFrom && new Date(p.effectiveFrom) > now) return false;
      if (p.effectiveUntil && new Date(p.effectiveUntil) < now) return false;
      return true;
    };

    let selectedPolicy: any = null;
    let selectedScope: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT' = 'DEFAULT';
    let matchedOutcome: any = null;

    // 1. Trace Event Level
    if (eventId) {
      const evt = await prisma.event.findUnique({ where: { id: eventId } });
      const evtPolicies = await prisma.policy.findMany({
        where: { domain, scopeType: 'EVENT', eventId: eventId },
        include: { rules: true, versions: true },
        orderBy: { priority: 'desc' }
      });

      const validEvt = evtPolicies.find(isValidPolicy);
      if (validEvt) {
        const evalResult = PolicyEvaluatorService.evaluate(validEvt.rules || [], input.input);
        trace.push({
          level: 'EVENT',
          targetName: evt?.title || input.eventId,
          policyFound: true,
          policyCode: validEvt.code,
          version: validEvt.currentVersion,
          ruleMatched: evalResult?.matchedRule?.name,
          decision: evalResult?.action,
          notes: evalResult
            ? `Override de evento aplicado: regra "${evalResult.matchedRule.name}" satisfeita.`
            : 'Política de evento encontrada, mas nenhuma regra correspondeu aos parâmetros de entrada.'
        });

        if (evalResult) {
          selectedPolicy = validEvt;
          selectedScope = 'EVENT';
          matchedOutcome = evalResult;
        }
      } else {
        trace.push({
          level: 'EVENT',
          targetName: evt?.title || input.eventId,
          policyFound: false,
          notes: 'Nenhum override de política ativo encontrado para este evento.'
        });
      }
    }

    // 2. Trace Producer Level (if not already matched)
    if (!matchedOutcome && producerId) {
      const prod = await prisma.producer.findUnique({ where: { id: producerId } });
      const prodPolicies = await prisma.policy.findMany({
        where: { domain, scopeType: 'PRODUCER', producerId: producerId },
        include: { rules: true, versions: true },
        orderBy: { priority: 'desc' }
      });

      const validProd = prodPolicies.find(isValidPolicy);
      if (validProd) {
        const evalResult = PolicyEvaluatorService.evaluate(validProd.rules || [], input.input);
        trace.push({
          level: 'PRODUCER',
          targetName: prod?.name || input.producerId,
          policyFound: true,
          policyCode: validProd.code,
          version: validProd.currentVersion,
          ruleMatched: evalResult?.matchedRule?.name,
          decision: evalResult?.action,
          notes: evalResult
            ? `Regra de produtor aplicada: "${evalResult.matchedRule.name}".`
            : 'Política do produtor encontrada, porém nenhuma regra correspondeu aos dados.'
        });

        if (evalResult) {
          selectedPolicy = validProd;
          selectedScope = 'PRODUCER';
          matchedOutcome = evalResult;
        }
      } else {
        trace.push({
          level: 'PRODUCER',
          targetName: prod?.name || input.producerId,
          policyFound: false,
          notes: 'Nenhum override específico para este produtor. Prosseguindo para nível global.'
        });
      }
    }

    // 3. Trace Global Level (if not already matched)
    if (!matchedOutcome) {
      const globalPolicies = await prisma.policy.findMany({
        where: { domain, scopeType: 'GLOBAL' },
        include: { rules: true, versions: true },
        orderBy: { priority: 'desc' }
      });

      const validGlobal = globalPolicies.find(isValidPolicy);
      if (validGlobal) {
        const evalResult = PolicyEvaluatorService.evaluate(validGlobal.rules || [], input.input);
        trace.push({
          level: 'GLOBAL',
          targetName: 'DiskIngressos Padrão',
          policyFound: true,
          policyCode: validGlobal.code,
          version: validGlobal.currentVersion,
          ruleMatched: evalResult?.matchedRule?.name,
          decision: evalResult?.action,
          notes: evalResult
            ? `Política global aplicada: regra "${evalResult.matchedRule.name}".`
            : 'Política global encontrada, mas nenhuma regra correspondeu aos critérios.'
        });

        if (evalResult) {
          selectedPolicy = validGlobal;
          selectedScope = 'GLOBAL';
          matchedOutcome = evalResult;
        }
      } else {
        trace.push({
          level: 'GLOBAL',
          targetName: 'DiskIngressos Padrão',
          policyFound: false,
          notes: 'Nenhuma política global ativa encontrada para este domínio.'
        });
      }
    }

    // Fallback if no rule matched
    if (!matchedOutcome) {
      return {
        decision: true,
        effectivePolicy: null,
        scope: 'DEFAULT',
        requirements: {
          approvalsRequired: 1,
          stepUpRequired: false,
          requiredDocuments: []
        },
        explanation: 'Nenhuma regra específica foi atendida. Aplicação do fluxo padrão sem restrições adicionais.',
        trace
      };
    }

    const action = matchedOutcome.action;

    return {
      decision: action.decision ?? true,
      effectivePolicy: {
        id: selectedPolicy.id,
        code: selectedPolicy.code,
        name: selectedPolicy.name,
        version: selectedPolicy.currentVersion,
        ruleId: matchedOutcome.matchedRule?.id,
        ruleName: matchedOutcome.matchedRule?.name
      },
      scope: selectedScope,
      requirements: {
        approvalsRequired: action.approvalsRequired ?? 1,
        stepUpRequired: action.stepUpRequired ?? false,
        requiredDocuments: action.requiredDocuments ?? [],
        slaMinutes: action.slaMinutes
      },
      explanation: matchedOutcome.explanation,
      trace
    };
  }
}
