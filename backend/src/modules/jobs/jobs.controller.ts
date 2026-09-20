import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/authenticate';
import { User } from '@shared/types/index';
import { JobService } from '../../jobs/core/job.service';
import { BatchService } from '../../jobs/batches/batch.service';
import { SchedulerService } from '../../jobs/scheduler/scheduler.service';
import { WorkerRegistry } from '../../jobs/workers/worker.registry';
import { QueueService } from '../../jobs/queue/queue.service';

export class JobsController {
  private jobService: JobService;
  private batchService: BatchService;
  private schedulerService: SchedulerService;
  private workerRegistry: WorkerRegistry;
  private queueService: QueueService;

  constructor() {
    this.jobService = JobService.getInstance();
    this.batchService = new BatchService(this.jobService.repository, this.jobService.queueService);
    this.schedulerService = this.jobService.schedulerService;
    this.workerRegistry = this.jobService.workerRegistry;
    this.queueService = this.jobService.queueService;
  }

  private getUser(req: AuthenticatedRequest): User {
    if (req.user) {
      return {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        roles: req.user.roles,
        permissions: req.user.permissions,
        scope: {
          type: req.user.scope?.isGlobal ? 'GLOBAL' : (req.user.scope?.producers?.length ? 'PRODUCER' : 'EVENT'),
          isGlobal: req.user.scope?.isGlobal,
          producerId: req.user.scope?.producers?.[0],
          eventId: req.user.scope?.events?.[0],
          producers: req.user.scope?.producers,
          events: req.user.scope?.events
        }
      };
    }
    return {
      id: 'usr_sys',
      name: 'Sistema',
      role: 'ADMINISTRADOR_GERAL',
      permissions: ['*'],
      scope: { type: 'GLOBAL', isGlobal: true }
    };
  }

  // --- Statistics & Hub ---
  public getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.jobService.getProcessingStats(this.getUser(req));
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getRegistry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const registry = this.jobService.registry.list();
      res.json(registry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // --- Jobs CRUD & Actions ---
  public listJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filters = {
        status: req.query.status,
        queue: req.query.queue,
        module: req.query.module,
        type: req.query.type as string,
        batchId: req.query.batchId as string,
        producerId: req.query.producerId as string,
        eventId: req.query.eventId as string
      };
      const jobs = await this.jobService.listJobs(filters, this.getUser(req));
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.getJob((req.params.id as string), this.getUser(req));
      if (!job) {
        res.status(404).json({ error: 'Processamento não encontrado ou acesso restrito pelo escopo.' });
        return;
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public createJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.createJob(req.body, this.getUser(req));
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.getJob((req.params.id as string), this.getUser(req));
      if (!job) {
        res.status(404).json({ error: 'Processamento não encontrado.' });
        return;
      }
      const attempts = await this.jobService.repository.findAttempts((req.params.id as string));
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.getJob((req.params.id as string), this.getUser(req));
      if (!job) {
        res.status(404).json({ error: 'Processamento não encontrado.' });
        return;
      }
      res.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        progressData: job.progressData
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public cancelJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.cancelJob((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public pauseJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.pauseJob((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public resumeJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.resumeJob((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public retryJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.retryJob((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // --- Batches ---
  public listBatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const batches = await this.batchService.listBatches();
      res.json(batches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const batch = await this.batchService.getBatch((req.params.id as string));
      if (!batch) {
        res.status(404).json({ error: 'Lote não encontrado.' });
        return;
      }
      res.json(batch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public createBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, module, items, producerId, eventId } = req.body;
      const batch = await this.batchService.createBatch(name, module, items, this.getUser(req), {
        producerId,
        eventId
      });
      res.status(201).json(batch);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public retryBatchFailures = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.batchService.retryFailures((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public cancelBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.batchService.cancelBatch((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // --- Schedules ---
  public listSchedules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schedules = await this.schedulerService.findMany();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public createSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.schedulerService.createSchedule(req.body, this.getUser(req));
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public updateSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.schedulerService.updateSchedule((req.params.id as string), req.body);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public deleteSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      await this.schedulerService.deleteSchedule((req.params.id as string));
      res.json({ success: true, message: 'Agendamento removido.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public runScheduleNow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.schedulerService.executeSchedule((req.params.id as string));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public toggleSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const active = req.path.endsWith('/enable');
      const updated = await this.schedulerService.updateSchedule((req.params.id as string), { active });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // --- Technical Admin ---
  public listWorkers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workers = this.workerRegistry.list();
      res.json(workers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public listQueues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const metrics = await this.queueService.getMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public listDeadLetters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deadLetters = await this.jobService.listDeadLetters(this.getUser(req));
      res.json(deadLetters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public investigateDeadLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.investigateDeadLetter((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public reprocessDeadLetter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.reprocessDeadLetter((req.params.id as string), this.getUser(req));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
