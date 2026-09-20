import { JobSchedule, ScheduleFrequency, MisfirePolicy, JobQueue, JobPriority, JobModule, User } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { DistributedLockService } from './distributed-lock.service';
import { JobRepository } from '../core/job.repository';
import { QueueService } from '../queue/queue.service';
import { JobRegistry } from '../core/job.registry';
import { EventBus } from '../../events/event-bus';

export class SchedulerService {
  private lockService: DistributedLockService;
  private repository: JobRepository;
  private queueService: QueueService;
  private registry: JobRegistry;

  constructor(
    lockService?: DistributedLockService,
    repository?: JobRepository,
    queueService?: QueueService,
    registry?: JobRegistry
  ) {
    this.lockService = lockService || DistributedLockService.getInstance();
    this.repository = repository || new JobRepository();
    this.queueService = queueService || QueueService.getInstance();
    this.registry = registry || JobRegistry.getInstance();
  }

  public async createSchedule(
    data: {
      name: string;
      description?: string | null;
      jobType: string;
      module: JobModule;
      queue: JobQueue;
      priority?: JobPriority;
      frequency: ScheduleFrequency;
      cronExpression?: string | null;
      timeOfDay?: string | null; // e.g. "02:00"
      dayOfWeek?: number | null;
      dayOfMonth?: number | null;
      timezone?: string;
      misfirePolicy?: MisfirePolicy;
      payload?: any;
      producerId?: string | null;
      eventId?: string | null;
    },
    user: User
  ): Promise<JobSchedule> {
    const timezone = data.timezone || 'America/Sao_Paulo';
    const nextRunAt = this.calculateNextRunAt(
      data.frequency,
      data.timeOfDay,
      timezone,
      data.dayOfWeek,
      data.dayOfMonth
    );

    const record = await prisma.jobScheduleModel.create({
      data: {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: data.name,
        description: data.description || null,
        jobType: data.jobType,
        module: data.module,
        queue: data.queue,
        priority: data.priority || 'NORMAL',
        frequency: data.frequency,
        cronExpression: data.cronExpression || null,
        timeOfDay: data.timeOfDay || null,
        dayOfWeek: data.dayOfWeek !== undefined ? data.dayOfWeek : null,
        dayOfMonth: data.dayOfMonth !== undefined ? data.dayOfMonth : null,
        timezone,
        misfirePolicy: data.misfirePolicy || 'EXECUTE_IMMEDIATELY',
        payload: data.payload ? JSON.stringify(data.payload) : null,
        producerId: data.producerId || null,
        eventId: data.eventId || null,
        creatorUserId: user.id,
        creatorUserName: user.name,
        active: true,
        nextRunAt
      }
    });

    return this.mapToDomain(record);
  }

  public async findById(id: string): Promise<JobSchedule | null> {
    const record = await prisma.jobScheduleModel.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async findMany(where?: any): Promise<JobSchedule[]> {
    const records = await prisma.jobScheduleModel.findMany({ where });
    return records.map((r: any) => this.mapToDomain(r));
  }

  public async updateSchedule(id: string, data: Partial<JobSchedule>): Promise<JobSchedule> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.misfirePolicy !== undefined) updateData.misfirePolicy = data.misfirePolicy;
    if (data.payload !== undefined) updateData.payload = JSON.stringify(data.payload);

    if (data.frequency || data.timeOfDay || data.timezone) {
      updateData.nextRunAt = this.calculateNextRunAt(
        data.frequency || 'DAILY',
        data.timeOfDay || '02:00',
        data.timezone || 'America/Sao_Paulo'
      );
    }

    const record = await prisma.jobScheduleModel.update({
      where: { id },
      data: updateData
    });

    return this.mapToDomain(record);
  }

  public async deleteSchedule(id: string): Promise<boolean> {
    await prisma.jobScheduleModel.delete({ where: { id } });
    return true;
  }

  /**
   * Triggers a scheduled job execution with distributed lock & runtime permission re-validation
   */
  public async executeSchedule(
    scheduleId: string,
    nodeInstanceId: string = 'node-01'
  ): Promise<{ success: boolean; message: string; jobId?: string }> {
    const schedule = await this.findById(scheduleId);
    if (!schedule) {
      return { success: false, message: 'Agendamento não encontrado.' };
    }

    // 1. Distributed Lock to prevent duplicate executions across cluster nodes
    const lockKey = `lock:schedule:${schedule.id}`;
    const acquired = await this.lockService.acquireLock(lockKey, nodeInstanceId, 60000);
    if (!acquired) {
      return { success: false, message: 'Execução já iniciada por outro nó do cluster.' };
    }

    try {
      // 2. Dynamic Permission Re-validation: Check creator status
      const creator = await prisma.user.findUnique({
        where: { id: schedule.creatorUserId }
      });

      if (!creator || creator.status !== 'ACTIVE') {
        const errorMsg = `Execução bloqueada: o usuário criador (${schedule.creatorUserName}) está inativo ou foi revogado.`;
        await prisma.jobScheduleModel.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            lastRunStatus: 'FAILED',
            active: false // Automatically disable compromised schedule
          }
        });

        try {
          await EventBus.publish({
            id: `evt_sch_blocked_${schedule.id}_${Date.now()}`,
            type: 'SECURITY_UNAUTHORIZED_ACCESS',
            resourceType: 'JOB_SCHEDULE',
            resourceId: schedule.id,
            actorUserId: 'SYSTEM',
            data: { scheduleId: schedule.id, reason: errorMsg },
            timestamp: new Date()
          });
        } catch {}

        return { success: false, message: errorMsg };
      }

      // 3. Create and Enqueue Job
      const jobId = `job_sch_${schedule.id}_${Date.now()}`;
      const job = await this.repository.create({
        id: jobId,
        type: schedule.jobType,
        module: schedule.module,
        producerId: schedule.producerId || null,
        eventId: schedule.eventId || null,
        status: 'QUEUED',
        priority: schedule.priority,
        queue: schedule.queue,
        progress: 0,
        payload: schedule.payload,
        createdBy: schedule.creatorUserId,
        createdByName: schedule.creatorUserName,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3,
        correlationId: `cor_sch_${schedule.id}_${Date.now()}`,
        cancellable: true
      });

      await this.queueService.enqueue(job);

      // 4. Update Next Run Date
      const nextRunAt = this.calculateNextRunAt(
        schedule.frequency,
        schedule.timeOfDay,
        schedule.timezone,
        schedule.dayOfWeek,
        schedule.dayOfMonth
      );

      await prisma.jobScheduleModel.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'SUCCESS',
          nextRunAt
        }
      });

      return { success: true, message: 'Job agendado disparado com sucesso.', jobId };
    } finally {
      await this.lockService.releaseLock(lockKey, nodeInstanceId);
    }
  }

  public calculateNextRunAt(
    frequency: ScheduleFrequency,
    timeOfDay?: string | null,
    timezone: string = 'America/Sao_Paulo',
    dayOfWeek?: number | null,
    dayOfMonth?: number | null,
    fromDate: Date = new Date()
  ): Date {
    const next = new Date(fromDate.getTime());

    let hour = 2;
    let minute = 0;
    if (timeOfDay && timeOfDay.includes(':')) {
      const parts = timeOfDay.split(':');
      hour = parseInt(parts[0], 10) || 0;
      minute = parseInt(parts[1], 10) || 0;
    }

    switch (frequency) {
      case 'ONCE':
        next.setMinutes(next.getMinutes() + 10);
        return next;

      case 'HOURLY':
        next.setHours(next.getHours() + 1);
        next.setMinutes(minute);
        next.setSeconds(0);
        return next;

      case 'DAILY':
        next.setDate(next.getDate() + 1);
        next.setHours(hour, minute, 0, 0);
        return next;

      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        next.setHours(hour, minute, 0, 0);
        return next;

      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth) next.setDate(dayOfMonth);
        next.setHours(hour, minute, 0, 0);
        return next;

      case 'CRON':
      default:
        next.setDate(next.getDate() + 1);
        next.setHours(hour, minute, 0, 0);
        return next;
    }
  }

  private mapToDomain(record: any): JobSchedule {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      jobType: record.jobType,
      module: record.module as JobModule,
      queue: record.queue as JobQueue,
      priority: record.priority as JobPriority,
      frequency: record.frequency as ScheduleFrequency,
      cronExpression: record.cronExpression,
      timeOfDay: record.timeOfDay,
      dayOfWeek: record.dayOfWeek,
      dayOfMonth: record.dayOfMonth,
      timezone: record.timezone || 'America/Sao_Paulo',
      misfirePolicy: record.misfirePolicy as MisfirePolicy,
      payload: record.payload ? (typeof record.payload === 'string' ? JSON.parse(record.payload) : record.payload) : undefined,
      producerId: record.producerId,
      eventId: record.eventId,
      creatorUserId: record.creatorUserId,
      creatorUserName: record.creatorUserName,
      active: record.active,
      lastRunAt: record.lastRunAt ? (record.lastRunAt instanceof Date ? record.lastRunAt.toISOString() : record.lastRunAt) : null,
      lastRunStatus: record.lastRunStatus,
      nextRunAt: record.nextRunAt instanceof Date ? record.nextRunAt.toISOString() : record.nextRunAt,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt
    };
  }
}
