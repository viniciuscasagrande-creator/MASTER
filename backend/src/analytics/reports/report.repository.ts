import { SavedReport } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class ReportRepository {
  public async create(report: SavedReport): Promise<SavedReport> {
    const record = await prisma.savedReportModel.create({
      data: {
        id: report.id,
        title: report.title,
        description: report.description || null,
        domain: report.domain,
        queryDefinition: JSON.stringify(report.queryDefinition),
        chartType: report.chartType,
        visibility: report.visibility,
        sharedWithUserIds: report.sharedWithUserIds ? JSON.stringify(report.sharedWithUserIds) : null,
        sharedWithRoleCodes: report.sharedWithRoleCodes ? JSON.stringify(report.sharedWithRoleCodes) : null,
        creatorUserId: report.creatorUserId,
        creatorUserName: report.creatorUserName,
        producerId: report.producerId || null,
        eventId: report.eventId || null,
        isFavorite: report.isFavorite || false
      }
    });

    return this.mapToDomain(record);
  }

  public async findById(id: string): Promise<SavedReport | null> {
    const record = await prisma.savedReportModel.findUnique({
      where: { id }
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async update(id: string, data: Partial<SavedReport>): Promise<SavedReport> {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.queryDefinition !== undefined) updateData.queryDefinition = JSON.stringify(data.queryDefinition);
    if (data.chartType !== undefined) updateData.chartType = data.chartType;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.sharedWithUserIds !== undefined) updateData.sharedWithUserIds = JSON.stringify(data.sharedWithUserIds);
    if (data.sharedWithRoleCodes !== undefined) updateData.sharedWithRoleCodes = JSON.stringify(data.sharedWithRoleCodes);
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

    const record = await prisma.savedReportModel.update({
      where: { id },
      data: updateData
    });

    return this.mapToDomain(record);
  }

  public async delete(id: string): Promise<boolean> {
    await prisma.savedReportModel.delete({
      where: { id }
    });
    return true;
  }

  public async listAccessible(user: any): Promise<SavedReport[]> {
    const records = await prisma.savedReportModel.findMany();
    const isSuperAdmin = user?.roleSlug === 'admin_geral' || user?.isSuperAdmin;

    const domainReports = records.map((r: any) => this.mapToDomain(r));

    if (isSuperAdmin) {
      return domainReports;
    }

    const userId = user?.id;
    const roleSlug = user?.roleSlug;
    const userScope = user?.scope || { type: 'GLOBAL' };

    return domainReports.filter(report => {
      // 1. Creator can always view their report
      if (report.creatorUserId === userId) {
        return true;
      }

      // 2. Private reports are strictly for creator
      if (report.visibility === 'PRIVATE') {
        return false;
      }

      // 3. Check shared with specific user
      if (report.sharedWithUserIds && report.sharedWithUserIds.includes(userId)) {
        return true;
      }

      // 4. Check shared with role
      if (report.sharedWithRoleCodes && roleSlug && report.sharedWithRoleCodes.includes(roleSlug)) {
        return true;
      }

      // 5. Producer-scoped sharing
      if (report.visibility === 'PRODUCER' && userScope.type === 'PRODUCER') {
        if (report.producerId && userScope.producerIds && userScope.producerIds.includes(report.producerId)) {
          return true;
        }
      }

      // 6. Team sharing
      if (report.visibility === 'TEAM') {
        return true;
      }

      return false;
    });
  }

  private mapToDomain(record: any): SavedReport {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      domain: record.domain,
      queryDefinition: typeof record.queryDefinition === 'string' ? JSON.parse(record.queryDefinition) : record.queryDefinition,
      chartType: record.chartType,
      visibility: record.visibility,
      sharedWithUserIds: typeof record.sharedWithUserIds === 'string' ? JSON.parse(record.sharedWithUserIds) : (record.sharedWithUserIds || []),
      sharedWithRoleCodes: typeof record.sharedWithRoleCodes === 'string' ? JSON.parse(record.sharedWithRoleCodes) : (record.sharedWithRoleCodes || []),
      creatorUserId: record.creatorUserId,
      creatorUserName: record.creatorUserName,
      producerId: record.producerId,
      eventId: record.eventId,
      isFavorite: record.isFavorite,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt.toISOString()
    };
  }
}
