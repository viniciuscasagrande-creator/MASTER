import { AnalyticsResult, ExportFormat, ReportExportJob } from '@shared/types/index';
import { CsvExporter } from './csv-exporter';
import { XlsxExporter } from './xlsx-exporter';
import { PdfExporter } from './pdf-exporter';
import { prisma } from '../../core/database/prisma';

export interface RequestExportDto {
  reportId?: string;
  reportTitle: string;
  format: ExportFormat;
  result: AnalyticsResult;
  isAsync?: boolean;
}

export class ExportService {
  private defaultRetentionDays: number = 7;

  public async exportDirect(dto: RequestExportDto, user: any): Promise<{
    content: string;
    mimeType: string;
    fileName: string;
    jobId: string;
  }> {
    const exportId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + this.defaultRetentionDays * 24 * 60 * 60 * 1000);

    const watermark = `Gerado por Disk Interno | Operador: ${user?.name || 'Sistema'} | Emissão: ${new Date().toLocaleString('pt-BR')} | ID: ${exportId}`;

    let exportResult: { content: string; mimeType: string; fileName: string };

    switch (dto.format) {
      case 'CSV':
        exportResult = CsvExporter.exportToCsv(dto.result, { title: dto.reportTitle });
        break;
      case 'XLSX':
        exportResult = XlsxExporter.exportToXlsx(dto.result, { title: dto.reportTitle, watermark });
        break;
      case 'PDF':
        exportResult = PdfExporter.exportToPdf(dto.result, { title: dto.reportTitle, watermark, user, exportId });
        break;
      default:
        throw new Error(`Formato de exportação não suportado: "${dto.format}"`);
    }

    // Persist Export Job Record (Section 1.1.5.13.37: Exportação Auditada)
    await prisma.reportExportJobModel.create({
      data: {
        id: exportId,
        reportId: dto.reportId || null,
        reportTitle: dto.reportTitle,
        format: dto.format,
        status: 'COMPLETED',
        userId: user?.id || 'system',
        userName: user?.name || 'Sistema',
        recordCount: dto.result.rows.length,
        fileSizeBytes: Buffer.byteLength(exportResult.content, 'utf8'),
        downloadUrl: `/api/v1/report-exports/${exportId}/download`,
        expiresAt,
        watermark,
        completedAt: new Date()
      }
    });

    return {
      ...exportResult,
      jobId: exportId
    };
  }

  public async createAsyncExportJob(dto: RequestExportDto, user: any): Promise<ReportExportJob> {
    const exportId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + this.defaultRetentionDays * 24 * 60 * 60 * 1000);

    const record = await prisma.reportExportJobModel.create({
      data: {
        id: exportId,
        reportId: dto.reportId || null,
        reportTitle: dto.reportTitle,
        format: dto.format,
        status: 'PENDING',
        userId: user?.id || 'system',
        userName: user?.name || 'Sistema',
        recordCount: dto.result.rows.length,
        expiresAt
      }
    });

    // Simulate async execution dispatch
    setTimeout(async () => {
      try {
        await prisma.reportExportJobModel.update({
          where: { id: exportId },
          data: {
            status: 'COMPLETED',
            downloadUrl: `/api/v1/report-exports/${exportId}/download`,
            completedAt: new Date()
          }
        });
      } catch (err) {
        // ignore
      }
    }, 100);

    return this.mapToDomain(record);
  }

  public async requestExport(dto: RequestExportDto, user: any): Promise<any> {
    if (dto.isAsync) {
      return this.createAsyncExportJob(dto, user);
    }
    return this.exportDirect(dto, user);
  }

  public async getExportJob(id: string): Promise<ReportExportJob | null> {
    const record = await prisma.reportExportJobModel.findUnique({
      where: { id }
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async getExportById(id: string): Promise<ReportExportJob | null> {
    return this.getExportJob(id);
  }

  public async listExportJobs(userOrUserId: any): Promise<ReportExportJob[]> {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const isSuperAdmin = typeof userOrUserId === 'object' && (userOrUserId?.roleSlug === 'admin_geral' || userOrUserId?.isSuperAdmin);
    
    const where: any = {};
    if (!isSuperAdmin && userId) {
      where.userId = userId;
    }

    const records = await prisma.reportExportJobModel.findMany({ where });
    return records.map((r: any) => this.mapToDomain(r));
  }

  public async listExports(userOrUserId: any): Promise<ReportExportJob[]> {
    return this.listExportJobs(userOrUserId);
  }

  public async downloadExport(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const job = await this.getExportJob(id);
    if (!job) {
      throw new Error(`Exportação não encontrada: ${id}`);
    }

    const now = new Date();
    if (new Date(job.expiresAt) < now) {
      throw new Error(`Este arquivo de exportação expirou em ${new Date(job.expiresAt).toLocaleDateString('pt-BR')}.`);
    }

    let mimeType = 'text/csv; charset=utf-8';
    let extension = 'csv';
    let mockContent = `ID;Relatório;Data\n${job.id};${job.reportTitle};${job.createdAt}`;

    if (job.format === 'XLSX') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else if (job.format === 'PDF') {
      mimeType = 'application/pdf';
      extension = 'pdf';
    }

    return {
      buffer: Buffer.from(mockContent, 'utf-8'),
      mimeType,
      filename: `${job.reportTitle.toLowerCase().replace(/\s+/g, '_')}_${job.id}.${extension}`
    };
  }

  private mapToDomain(record: any): ReportExportJob {
    return {
      id: record.id,
      reportId: record.reportId,
      reportTitle: record.reportTitle,
      format: record.format,
      status: record.status,
      userId: record.userId,
      userName: record.userName,
      recordCount: record.recordCount,
      fileSizeBytes: record.fileSizeBytes,
      downloadUrl: record.downloadUrl,
      documentId: record.documentId,
      expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : record.expiresAt.toISOString(),
      errorMessage: record.errorMessage,
      watermark: record.watermark,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      completedAt: record.completedAt ? (typeof record.completedAt === 'string' ? record.completedAt : record.completedAt.toISOString()) : null
    };
  }
}
