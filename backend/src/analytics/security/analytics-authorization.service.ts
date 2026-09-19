import { AnalyticsQuery } from '@shared/types/index';
import { ValidatedExecutionPlan } from '../core/query-builder.service';

export class AnalyticsAuthorizationService {
  public authorizeQuery(plan: ValidatedExecutionPlan, user: any): void {
    if (!user) {
      throw new Error('Acesso não autorizado: Usuário não autenticado.');
    }

    // Super Admin has universal access
    if (user.roleSlug === 'admin_geral' || user.isSuperAdmin) {
      return;
    }

    const permissions: string[] = user.permissions || [];

    // 1. Check Central Access Permission
    if (!permissions.includes('relatorios.central.visualizar')) {
      throw new Error('Acesso negado: Usuário não possui permissão para acessar o motor de relatórios (relatorios.central.visualizar).');
    }

    // 2. Check Domain-level permissions for each metric in the plan
    for (const m of plan.resolvedMetrics) {
      if (m.requiredPermission && !permissions.includes(m.requiredPermission)) {
        throw new Error(
          `Acesso negado: Usuário não possui a permissão necessária (${m.requiredPermission}) para consultar o indicador "${m.name}".`
        );
      }
    }

    // 3. Enforce Scope Isolation (Producer / Event)
    const scope = user.scope || { type: 'GLOBAL' };

    if (scope.type === 'PRODUCER') {
      const authorizedProducers: string[] = scope.producerIds || [];
      if (plan.query.producerId && !authorizedProducers.includes(plan.query.producerId)) {
        throw new Error(`Acesso negado: Consulta restrita aos produtores vinculados ao seu perfil.`);
      }
    }

    if (scope.type === 'EVENT') {
      const authorizedEvents: string[] = scope.eventIds || [];
      if (plan.query.eventId && !authorizedEvents.includes(plan.query.eventId)) {
        throw new Error(`Acesso negado: Consulta restrita aos eventos vinculados ao seu perfil.`);
      }
    }
  }
}
