import { SavedReport, ReportVisibility } from '@shared/types/index';
import { MetricRegistry } from '../core/metric.registry';

export interface ShareReportDto {
  visibility: ReportVisibility;
  sharedWithUserIds?: string[];
  sharedWithRoleCodes?: string[];
}

export class ReportSharingService {
  private metricRegistry: MetricRegistry;

  constructor() {
    this.metricRegistry = MetricRegistry.getInstance();
  }

  public validateSharing(report: SavedReport, shareDto: ShareReportDto, user: any): void {
    const isOwner = report.creatorUserId === user.id;
    const isSuperAdmin = user.roleSlug === 'admin_geral' || user.isSuperAdmin;

    if (!isOwner && !isSuperAdmin) {
      throw new Error('Acesso negado: Apenas o criador do relatório ou o Administrador Geral podem alterar as opções de compartilhamento.');
    }

    if (shareDto.visibility === 'SPECIFIC_USERS' && (!shareDto.sharedWithUserIds || shareDto.sharedWithUserIds.length === 0)) {
      throw new Error('Compartilhamento inválido: Para visibilidade "SPECIFIC_USERS", informe ao menos um ID de usuário.');
    }

    if (shareDto.visibility === 'ROLE' && (!shareDto.sharedWithRoleCodes || shareDto.sharedWithRoleCodes.length === 0)) {
      throw new Error('Compartilhamento inválido: Para visibilidade "ROLE", informe ao menos um perfil (roleCode).');
    }
  }

  /**
   * IMPORTANT: "Compartilhamento nunca amplia a permissão do destinatário" (Section 1.1.5.13.31)
   * Mesmo que o relatório tenha sido compartilhado com o usuário, ele só poderá visualizá-lo
   * se seu perfil e escopo ATUAIS possuírem as permissões exigidas pelas métricas contidas no relatório.
   */
  public verifyRecipientHasPermissions(report: SavedReport, recipientUser: any): boolean {
    if (!recipientUser) return false;
    if (recipientUser.roleSlug === 'admin_geral' || recipientUser.isSuperAdmin) return true;

    const userPermissions: string[] = recipientUser.permissions || [];

    // 1. Central access required
    if (!userPermissions.includes('relatorios.central.visualizar') && !userPermissions.includes('relatorios.relatorio.visualizar')) {
      return false;
    }

    // 2. Check each metric's required permission
    const metricCodes = report.queryDefinition?.metrics || [];
    for (const code of metricCodes) {
      const def = this.metricRegistry.getMetric(code);
      if (def && def.requiredPermission) {
        if (!userPermissions.includes(def.requiredPermission)) {
          return false; // BLOQUEADO: Destinatário não possui a permissão subjacente da métrica
        }
      }
    }

    // 3. Producer scope check
    const scope = recipientUser.scope || { type: 'GLOBAL' };
    if (scope.type === 'PRODUCER' && report.producerId) {
      if (!scope.producerIds?.includes(report.producerId)) {
        return false; // BLOQUEADO: Produtor do relatório não autorizado para o destinatário
      }
    }

    return true;
  }

  public getMissingPermissions(report: SavedReport, recipientUser: any): string[] {
    if (!recipientUser) return ['AUTH_REQUIRED'];
    if (recipientUser.roleSlug === 'admin_geral' || recipientUser.isSuperAdmin) return [];

    const missing: string[] = [];
    const userPermissions: string[] = recipientUser.permissions || [];

    if (!userPermissions.includes('relatorios.central.visualizar') && !userPermissions.includes('relatorios.relatorio.visualizar')) {
      missing.push('relatorios.central.visualizar');
    }

    const metricCodes = report.queryDefinition?.metrics || [];
    for (const code of metricCodes) {
      const def = this.metricRegistry.getMetric(code);
      if (def && def.requiredPermission && !userPermissions.includes(def.requiredPermission)) {
        if (!missing.includes(def.requiredPermission)) {
          missing.push(def.requiredPermission);
        }
      }
    }
    return missing;
  }
}
