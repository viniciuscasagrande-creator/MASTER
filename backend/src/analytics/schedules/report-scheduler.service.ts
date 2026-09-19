import { ReportSchedule, ScheduleFrequency, ExportFormat, ReportScheduleRecipient } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { ReportService } from '../reports/report.service';
import { ExportService } from '../exports/export.service';

export interface CreateScheduleDto {
  reportId: string;
  reportTitle: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  format: ExportFormat;
  recipients: ReportScheduleRecipient[];
}

export class ReportSchedulerService {
  private reportService: ReportService;
  private exportService: ExportService;

  constructor(reportService?: ReportService, exportService?: ExportService) {
    this.reportService = reportService || new ReportService();
    this.exportService = exportService || new ExportService();
  }

  public async createSchedule(dto: CreateScheduleDto, user: any): Promise<ReportSchedule> {
    if (!user) {
      throw new Error('Acesso não autorizado.');
    }

    const permissions: string[] = user.permissions || [];
    const isSuperAdmin = user.roleSlug === 'admin_geral' || user.isSuperAdmin;

    if (!isSuperAdmin && !permissions.includes('relatorios.agendamento.criar')) {
      throw new Error('Acesso negado: Usuário não possui permissão para criar agendamentos (relatorios.agendamento.criar).');
    }

    const nextRunAt = this.calculateNextRun(dto.frequency, dto.timeOfDay, dto.dayOfWeek, dto.dayOfMonth);

    const record = await prisma.reportScheduleModel.create({
      data: {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        reportId: dto.reportId,
        reportTitle: dto.reportTitle,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek || null,
        dayOfMonth: dto.dayOfMonth || null,
        timeOfDay: dto.timeOfDay,
        format: dto.format,
        recipients: JSON.stringify(dto.recipients),
        active: true,
        creatorUserId: user.id,
        nextRunAt
      }
    });

    return this.mapToDomain(record);
  }

  public async updateSchedule(id: string, data: Partial<CreateScheduleDto & { active?: boolean }>, user: any): Promise<ReportSchedule> {
    const existing = await prisma.reportScheduleModel.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Agendamento não encontrado: ${id}`);
    }

    const isSuperAdmin = user?.roleSlug === 'admin_geral' || user?.isSuperAdmin;
    if (!isSuperAdmin && existing.creatorUserId !== user?.id) {
      throw new Error('Acesso negado: Apenas o criador pode alterar o agendamento.');
    }

    const updateData: any = {};
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.recipients !== undefined) updateData.recipients = JSON.stringify(data.recipients);
    if (data.active !== undefined) updateData.active = data.active;

    if (data.frequency || data.timeOfDay || data.dayOfWeek || data.dayOfMonth) {
      const freq = data.frequency || existing.frequency;
      const time = data.timeOfDay || existing.timeOfDay;
      const dow = data.dayOfWeek !== undefined ? data.dayOfWeek : existing.dayOfWeek;
      const dom = data.dayOfMonth !== undefined ? data.dayOfMonth : existing.dayOfMonth;
      updateData.nextRunAt = this.calculateNextRun(freq, time, dow, dom);
    }

    const updated = await prisma.reportScheduleModel.update({
      where: { id },
      data: updateData
    });

    return this.mapToDomain(updated);
  }

  public async deleteSchedule(id: string, user: any): Promise<boolean> {
    const existing = await prisma.reportScheduleModel.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Agendamento não encontrado: ${id}`);
    }

    const isSuperAdmin = user?.roleSlug === 'admin_geral' || user?.isSuperAdmin;
    if (!isSuperAdmin && existing.creatorUserId !== user?.id) {
      throw new Error('Acesso negado: Apenas o criador pode remover o agendamento.');
    }

    await prisma.reportScheduleModel.delete({ where: { id } });
    return true;
  }

  public async executeSchedule(scheduleId: string, currentUser?: any): Promise<{
    schedule: ReportSchedule;
    status: 'SUCCESS' | 'FAILED';
    message?: string;
  }> {
    const record = await prisma.reportScheduleModel.findUnique({
      where: { id: scheduleId }
    });

    if (!record) {
      throw new Error('Agendamento de relatório não encontrado.');
    }

    const schedule = this.mapToDomain(record);

    // Section 1.1.5.13.41: Re-validação dinâmica de permissão no agendamento!
    // Verificar se o usuário criador ou o executor atual ainda possui acesso
    const userToEvaluate = currentUser || (await prisma.user.findUnique({ where: { id: schedule.creatorUserId } }));

    if (!userToEvaluate || userToEvaluate.status === 'BLOCKED') {
      await prisma.reportScheduleModel.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'FAILED',
          active: false
        }
      });
      return {
        schedule,
        status: 'FAILED',
        message: 'Execução bloqueada: Usuário criador inativo ou bloqueado.'
      };
    }

    try {
      // Execute the report with user's current credentials
      const { result } = await this.reportService.executeReport(schedule.reportId, userToEvaluate);

      // Generate export
      await this.exportService.exportDirect(
        {
          reportId: schedule.reportId,
          reportTitle: schedule.reportTitle,
          format: schedule.format,
          result
        },
        userToEvaluate
      );

      const nextRunAt = this.calculateNextRun(schedule.frequency, schedule.timeOfDay, schedule.dayOfWeek, schedule.dayOfMonth);

      await prisma.reportScheduleModel.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'SUCCESS',
          nextRunAt
        }
      });

      return {
        schedule,
        status: 'SUCCESS',
        message: 'Relatório agendado gerado e distribuído com sucesso.'
      };
    } catch (err: any) {
      await prisma.reportScheduleModel.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'FAILED'
        }
      });

      return {
        schedule,
        status: 'FAILED',
        message: `Falha na execução do agendamento: ${err.message}`
      };
    }
  }

  public async listSchedules(user: any): Promise<ReportSchedule[]> {
    const isSuperAdmin = user?.roleSlug === 'admin_geral' || user?.isSuperAdmin;
    const where: any = {};
    if (!isSuperAdmin && user?.id) {
      where.creatorUserId = user.id;
    }

    const records = await prisma.reportScheduleModel.findMany({ where });
    return records.map((r: any) => this.mapToDomain(r));
  }

  public calculateNextRun(frequency: ScheduleFrequency, timeOfDay: string, dayOfWeek?: number | null, dayOfMonth?: number | null): Date {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 8, minutes || 0, 0);

    if (frequency === 'DAILY') {
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'WEEKLY') {
      const targetDay = dayOfWeek !== undefined && dayOfWeek !== null ? dayOfWeek : 1; // 1 = Segunda
      let daysUntil = targetDay - next.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
    } else if (frequency === 'MONTHLY') {
      const targetDate = dayOfMonth || 1;
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDate);
    }

    return next;
  }

  private mapToDomain(record: any): ReportSchedule {
    return {
      id: record.id,
      reportId: record.reportId,
      reportTitle: record.reportTitle,
      frequency: record.frequency,
      dayOfWeek: record.dayOfWeek,
      dayOfMonth: record.dayOfMonth,
      timeOfDay: record.timeOfDay,
      format: record.format,
      recipients: typeof record.recipients === 'string' ? JSON.parse(record.recipients) : (record.recipients || []),
      active: record.active,
      creatorUserId: record.creatorUserId,
      lastRunAt: record.lastRunAt ? (typeof record.lastRunAt === 'string' ? record.lastRunAt : record.lastRunAt.toISOString()) : null,
      lastRunStatus: record.lastRunStatus,
      nextRunAt: typeof record.nextRunAt === 'string' ? record.nextRunAt : record.nextRunAt.toISOString(),
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString()
    };
  }
}
