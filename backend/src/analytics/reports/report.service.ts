import { SavedReport, AnalyticsQuery, AnalyticsResult } from '@shared/types/index';
import { ReportRepository } from './report.repository';
import { ReportSharingService, ShareReportDto } from './report-sharing.service';
import { AnalyticsService } from '../core/analytics.service';

export interface CreateReportDto {
  title: string;
  description?: string;
  domain: SavedReport['domain'];
  queryDefinition: AnalyticsQuery;
  chartType?: SavedReport['chartType'];
  visibility?: SavedReport['visibility'];
  producerId?: string;
  eventId?: string;
}

export class ReportService {
  private repository: ReportRepository;
  private sharingService: ReportSharingService;
  private analyticsService: AnalyticsService;

  constructor(analyticsService?: AnalyticsService) {
    this.repository = new ReportRepository();
    this.sharingService = new ReportSharingService();
    this.analyticsService = analyticsService || new AnalyticsService();
  }

  public async createReport(dto: CreateReportDto, user: any): Promise<SavedReport> {
    if (!user) {
      throw new Error('Acesso não autorizado.');
    }

    const permissions: string[] = user.permissions || [];
    const isSuperAdmin = user.roleSlug === 'admin_geral' || user.isSuperAdmin;

    if (!isSuperAdmin && !permissions.includes('relatorios.relatorio.criar')) {
      throw new Error('Acesso negado: Usuário não possui permissão para criar relatórios (relatorios.relatorio.criar).');
    }

    const report: SavedReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: dto.title,
      description: dto.description || null,
      domain: dto.domain,
      queryDefinition: dto.queryDefinition,
      chartType: dto.chartType || 'TABLE',
      visibility: dto.visibility || 'PRIVATE',
      creatorUserId: user.id,
      creatorUserName: user.name || 'Operador',
      producerId: dto.producerId || user.scope?.producerIds?.[0] || null,
      eventId: dto.eventId || user.scope?.eventIds?.[0] || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.repository.create(report);
  }

  public async getReportById(id: string, user: any): Promise<SavedReport> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new Error('Relatório não encontrado.');
    }

    // Check sharing permissions
    const missingPermissions = this.sharingService.getMissingPermissions(report, user);
    if (missingPermissions.length > 0) {
      throw new Error(`Acesso negado: Seu perfil não possui as permissões necessárias (${missingPermissions.join(', ')}) para acessar este relatório.`);
    }

    return report;
  }

  public async updateReport(id: string, dto: Partial<CreateReportDto>, user: any): Promise<SavedReport> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new Error('Relatório não encontrado.');
    }

    const isOwner = report.creatorUserId === user.id;
    const isSuperAdmin = user.roleSlug === 'admin_geral' || user.isSuperAdmin;

    if (!isOwner && !isSuperAdmin) {
      throw new Error('Acesso negado: Apenas o criador ou Administrador Geral podem alterar o relatório.');
    }

    return this.repository.update(id, dto as any);
  }

  public async deleteReport(id: string, user: any): Promise<boolean> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new Error('Relatório não encontrado.');
    }

    const isOwner = report.creatorUserId === user.id;
    const isSuperAdmin = user.roleSlug === 'admin_geral' || user.isSuperAdmin;

    if (!isOwner && !isSuperAdmin) {
      throw new Error('Acesso negado: Apenas o criador ou Administrador Geral podem excluir o relatório.');
    }

    return this.repository.delete(id);
  }

  public async duplicateReport(id: string, user: any, newTitle?: string): Promise<SavedReport> {
    const original = await this.getReportById(id, user);

    const copy: SavedReport = {
      ...original,
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: newTitle || `Cópia de ${original.title}`,
      visibility: 'PRIVATE',
      creatorUserId: user.id,
      creatorUserName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.repository.create(copy);
  }

  public async shareReport(id: string, shareDto: ShareReportDto, user: any): Promise<SavedReport> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new Error('Relatório não encontrado.');
    }

    this.sharingService.validateSharing(report, shareDto, user);

    return this.repository.update(id, {
      visibility: shareDto.visibility,
      sharedWithUserIds: shareDto.sharedWithUserIds,
      sharedWithRoleCodes: shareDto.sharedWithRoleCodes
    });
  }

  public async executeReport(
    id: string,
    user: any,
    overrides?: { period?: any; filters?: any; producerId?: string; eventId?: string }
  ): Promise<{ report: SavedReport; result: AnalyticsResult }> {
    const report = await this.getReportById(id, user);

    // Section 1.1.5.13.32: Filtro obrigatório de segurança.
    // Constrói consulta declarativa atualizando com escopo ATUAL do usuário
    const queryToExecute: AnalyticsQuery = {
      ...report.queryDefinition,
      period: overrides?.period || report.queryDefinition.period,
      filters: overrides?.filters || report.queryDefinition.filters,
      producerId: overrides?.producerId || report.producerId || undefined,
      eventId: overrides?.eventId || report.eventId || undefined
    };

    const result = await this.analyticsService.executeQuery(queryToExecute, user);

    return {
      report,
      result
    };
  }

  public async listReports(user: any): Promise<SavedReport[]> {
    return this.repository.listAccessible(user);
  }
}
