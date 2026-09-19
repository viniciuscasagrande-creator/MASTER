import { AnalyticsResult } from '@shared/types/index';
import { ValidatedExecutionPlan } from '../core/query-builder.service';

export class FieldSecurityService {
  private sensitiveFieldNames = [
    'cpf',
    'customercpf',
    'email',
    'customeremail',
    'phone',
    'telefone',
    'pixkey',
    'chavepix',
    'bankaccount',
    'contabancaria'
  ];

  public sanitizeResult(result: AnalyticsResult, plan: ValidatedExecutionPlan, user: any): AnalyticsResult {
    const isSuperAdmin = user?.roleSlug === 'admin_geral' || user?.isSuperAdmin;
    const permissions: string[] = user?.permissions || [];
    const canViewSensitive = isSuperAdmin || permissions.includes('relatorios.dados_sensiveis.visualizar');

    if (canViewSensitive) {
      return result;
    }

    // Clone result
    const sanitizedRows = result.rows.map(row => {
      const copy: Record<string, any> = {};

      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        const isSensitiveKey = this.sensitiveFieldNames.some(s => lowerKey.includes(s));

        if (isSensitiveKey) {
          copy[key] = '*** MASCARADO (LGPD) ***';
        } else {
          copy[key] = value;
        }
      }

      return copy;
    });

    return {
      ...result,
      rows: sanitizedRows
    };
  }
}
