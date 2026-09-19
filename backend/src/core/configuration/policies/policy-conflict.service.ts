import { prisma } from '../../database/prisma';
import { DomainEvents } from '../../../events/DomainEvents';
import { TaskService } from '../../../modules/tasks/task.service';

export class PolicyConflictService {
  /**
   * Detects conflicts across policies in the same domain and scope
   */
  public static async detectConflicts(domain: string): Promise<any[]> {
    const policies = await prisma.policy.findMany({
      where: { domain: domain.toUpperCase(), status: 'ACTIVE' },
      include: { rules: true }
    });

    const detectedConflicts: any[] = [];

    for (let i = 0; i < policies.length; i++) {
      for (let j = i + 1; j < policies.length; j++) {
        const pA = policies[i];
        const pB = policies[j];

        // Conflict check 1: Same scope & overlapping dates
        const sameScope =
          pA.scopeType === pB.scopeType &&
          pA.producerId === pB.producerId &&
          pA.eventId === pB.eventId;

        if (sameScope) {
          // Check date overlap
          const aStart = pA.effectiveFrom ? new Date(pA.effectiveFrom).getTime() : 0;
          const aEnd = pA.effectiveUntil ? new Date(pA.effectiveUntil).getTime() : Infinity;
          const bStart = pB.effectiveFrom ? new Date(pB.effectiveFrom).getTime() : 0;
          const bEnd = pB.effectiveUntil ? new Date(pB.effectiveUntil).getTime() : Infinity;

          const datesOverlap = Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);

          if (datesOverlap) {
            // Check if equal priority creates ambiguity
            if (pA.priority === pB.priority) {
              const description = `Conflito de prioridade ambígua entre as políticas "${pA.name}" (${pA.code}) e "${pB.name}" (${pB.code}) no mesmo escopo ${pA.scopeType} e vigência simultânea.`;

              // Record conflict
              const conflict = await prisma.policyConflict.create({
                data: {
                  policyAId: pA.id,
                  policyBId: pB.id,
                  domain: domain.toUpperCase(),
                  conflictType: 'AMBIGUOUS_PRIORITY',
                  description,
                  status: 'DETECTED'
                }
              });

              detectedConflicts.push(conflict);

              // Dispatch Domain Event
              DomainEvents.dispatch('POLICY_CONFLICT_DETECTED', {
                resourceType: 'POLICY',
                resourceId: pA.id,
                data: {
                  conflictId: conflict.id,
                  policyA: pA.code,
                  policyB: pB.code,
                  domain
                }
              });

              // Automatically trigger an operational task for the Admin team (Fase 1.1.5.9 integration)
              try {
                await TaskService.createTask(
                  {
                    title: `Revisar conflito de políticas: ${pA.code} × ${pB.code}`,
                    description: `Foi detectado um conflito de regras no domínio ${domain}. Detalhes: ${description}`,
                    module: 'ADMINISTRACAO' as any,
                    priority: 'HIGH',
                    assignedTeamCode: 'ADMINISTRACAO',
                    producerId: pA.producerId || undefined,
                    eventId: pA.eventId || undefined,
                    checklist: [
                      { text: 'Analisar prioridade das políticas conflitantes', isRequired: true },
                      { text: 'Ajustar prioridade ou definir vigências exclusivas', isRequired: true },
                      { text: 'Marcar conflito como resolvido', isRequired: true }
                    ]
                  },
                  {
                    id: 'usr_system',
                    name: 'Motor Central de Políticas',
                    email: 'system@diskinterno.com.br',
                    roles: ['ADMINISTRADOR_GERAL']
                  } as any
                );
              } catch (err) {
                // If team doesn't exist in test environment, continue silently
              }
            }
          }
        }
      }
    }

    return detectedConflicts;
  }

  public static async resolveConflict(conflictId: string, resolutionNotes: string, userId: string): Promise<any> {
    const conflict = await prisma.policyConflict.findUnique({ where: { id: conflictId } });
    if (!conflict) throw new Error('Conflito não encontrado.');

    return prisma.policyConflict.update({
      where: { id: conflictId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: userId,
        resolutionNotes
      }
    });
  }

  public static async listConflicts(domain?: string): Promise<any[]> {
    const where: any = {};
    if (domain) where.domain = domain.toUpperCase();
    return prisma.policyConflict.findMany({ where });
  }
}
