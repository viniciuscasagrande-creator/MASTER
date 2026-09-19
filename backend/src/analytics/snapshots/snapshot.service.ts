import { ReportSnapshot } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { ReportService } from '../reports/report.service';

export interface CreateSnapshotDto {
  reportId: string;
  title: string;
  snapshotDate?: string;
  notes?: string;
}

export class SnapshotService {
  private reportService: ReportService;

  constructor(reportService?: ReportService) {
    this.reportService = reportService || new ReportService();
  }

  public async createSnapshot(dto: CreateSnapshotDto, user: any): Promise<ReportSnapshot> {
    if (!user) {
      throw new Error('Acesso não autorizado.');
    }

    const { report, result } = await this.reportService.executeReport(dto.reportId, user);

    const snapshotId = `snp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const snapshotDate = dto.snapshotDate ? new Date(dto.snapshotDate) : new Date();

    const record = await prisma.reportSnapshotModel.create({
      data: {
        id: snapshotId,
        reportId: dto.reportId,
        title: dto.title || `Snapshot ${report.title} - ${snapshotDate.toLocaleDateString('pt-BR')}`,
        snapshotDate,
        frozenData: JSON.stringify(result),
        creatorUserId: user.id,
        creatorUserName: user.name || 'Operador',
        notes: dto.notes || null
      }
    });

    return this.mapToDomain(record);
  }

  public async getSnapshot(id: string): Promise<ReportSnapshot | null> {
    const record = await prisma.reportSnapshotModel.findUnique({
      where: { id }
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async listSnapshots(reportId?: string): Promise<ReportSnapshot[]> {
    const where: any = {};
    if (reportId) where.reportId = reportId;

    const records = await prisma.reportSnapshotModel.findMany({ where });
    return records.map((r: any) => this.mapToDomain(r));
  }

  private mapToDomain(record: any): ReportSnapshot {
    return {
      id: record.id,
      reportId: record.reportId,
      title: record.title,
      snapshotDate: typeof record.snapshotDate === 'string' ? record.snapshotDate : record.snapshotDate.toISOString(),
      frozenData: typeof record.frozenData === 'string' ? JSON.parse(record.frozenData) : record.frozenData,
      creatorUserId: record.creatorUserId,
      creatorUserName: record.creatorUserName,
      notes: record.notes,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString()
    };
  }
}
