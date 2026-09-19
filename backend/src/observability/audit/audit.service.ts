import { AuditRepository } from './audit.repository';
import { AuditLogRecord, AuditDiffField, LogActionParams, AuditFilterParams, AuditExportParams } from './audit.types';

export class AuditService {
  private repository: AuditRepository;

  constructor(repository?: AuditRepository) {
    this.repository = repository || new AuditRepository();
  }

  /**
   * Registra uma ação na trilha imutável de auditoria
   */
  public async logAction(params: LogActionParams): Promise<AuditLogRecord> {
    return this.repository.create(params);
  }

  /**
   * Consulta registros com isolamento de escopo por RBAC
   */
  public async getAuditLogs(
    filters: AuditFilterParams,
    currentUser?: any
  ): Promise<{ items: AuditLogRecord[]; total: number }> {
    const scopedFilters = { ...filters };

    // Se o usuário possui escopo restrito a produtores específicos (e não é superadmin)
    if (currentUser && currentUser.roleSlug !== 'admin_geral') {
      if (currentUser.scope?.type === 'PRODUCER') {
        const allowedProducers = currentUser.scope.producerIds || [];
        if (scopedFilters.producerId && !allowedProducers.includes(scopedFilters.producerId)) {
          throw new Error('Acesso negado: produtor fora do seu escopo autorizado');
        }
        if (!scopedFilters.producerId && allowedProducers.length > 0) {
          scopedFilters.producerId = allowedProducers[0];
        }
      }
    }

    return this.repository.findMany(scopedFilters);
  }

  /**
   * Obtém detalhes de um registro específico de auditoria com cálculo de diff
   */
  public async getAuditById(
    id: string,
    currentUser?: any
  ): Promise<(AuditLogRecord & { diffFields: AuditDiffField[] }) | null> {
    const record = await this.repository.findById(id);
    if (!record) return null;

    // Verificação de escopo
    if (currentUser && currentUser.roleSlug !== 'admin_geral') {
      if (currentUser.scope?.type === 'PRODUCER' && record.producerId) {
        const allowed = currentUser.scope.producerIds || [];
        if (!allowed.includes(record.producerId)) {
          throw new Error('Acesso negado ao registro de auditoria selecionado');
        }
      }
    }

    const diffFields = this.repository.extractDiff(record.beforeData, record.afterData);
    return {
      ...record,
      diffFields
    };
  }

  /**
   * Obtém histórico completo de um recurso específico
   */
  public async getAuditByResource(
    resourceType: string,
    resourceId: string,
    currentUser?: any
  ): Promise<AuditLogRecord[]> {
    const result = await this.getAuditLogs({ resourceType, resourceId, limit: 100 }, currentUser);
    return result.items;
  }

  /**
   * Obtém ações executadas por um usuário específico
   */
  public async getAuditByUser(userId: string, currentUser?: any): Promise<AuditLogRecord[]> {
    const result = await this.getAuditLogs({ userId, limit: 100 }, currentUser);
    return result.items;
  }

  /**
   * Exportação segura da trilha de auditoria em CSV ou JSON.
   * Toda exportação é registrada automaticamente na própria trilha de auditoria!
   */
  public async exportAudit(
    params: AuditExportParams,
    operatorUser: any
  ): Promise<{ content: string; mimeType: string; fileName: string }> {
    const filters: AuditFilterParams = {
      module: params.module,
      userId: params.userId,
      producerId: params.producerId,
      eventId: params.eventId,
      action: params.action,
      result: params.result as any,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: 5000
    };

    const { items } = await this.getAuditLogs(filters, operatorUser);

    // Auditoria da exportação
    await this.logAction({
      userId: operatorUser?.id || 'system',
      userName: operatorUser?.name || 'Sistema',
      module: 'AUDITORIA',
      action: 'EXPORT',
      resourceType: 'AUDIT_LOG',
      resourceId: 'EXPORT_REPORT',
      producerId: params.producerId,
      eventId: params.eventId,
      details: `Exportação de ${items.length} registros no formato ${params.format}`,
      result: 'SUCCESS'
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (params.format === 'JSON') {
      return {
        content: JSON.stringify(items, null, 2),
        mimeType: 'application/json',
        fileName: `auditoria-export-${timestamp}.json`
      };
    }

    // CSV format
    const headers = ['ID', 'Data/Hora', 'Módulo', 'Ação', 'Recurso', 'Usuário', 'Produtor', 'Resultado', 'IP Hash'];
    const rows = items.map(item => [
      item.id,
      item.createdAt,
      item.module,
      item.action,
      `${item.resourceType || ''}:${item.resourceId || ''}`,
      item.userName || item.userId || '',
      item.producerId || '',
      item.result,
      item.ipHash || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    return {
      content: csvContent,
      mimeType: 'text/csv',
      fileName: `auditoria-export-${timestamp}.csv`
    };
  }

  /**
   * Garantia formal de imutabilidade: impede alteração ou exclusão
   */
  public async updateAudit(): Promise<never> {
    throw new Error('IMUTABILIDADE VIOLADA: Registros de auditoria são legalmente imutáveis e não podem ser alterados.');
  }

  public async deleteAudit(): Promise<never> {
    throw new Error('IMUTABILIDADE VIOLADA: Registros de auditoria são legalmente imutáveis e não podem ser excluídos.');
  }
}
