import { Job, JobQueue, JobPriority, JobQueueMetrics } from '@shared/types/index';

export interface IQueueProvider {
  enqueue(job: Job): Promise<void>;
  dequeue(queues: JobQueue[]): Promise<Job | null>;
  peek(queue: JobQueue): Promise<Job | null>;
  size(queue: JobQueue): Promise<number>;
  getMetrics(): Promise<JobQueueMetrics[]>;
  getQueueMetrics(queue: JobQueue): Promise<JobQueueMetrics>;
  pause(queue: JobQueue): Promise<void>;
  resume(queue: JobQueue): Promise<void>;
  isPaused(queue: JobQueue): Promise<boolean>;
  clear(queue?: JobQueue): Promise<void>;
}

export class InMemoryQueueProvider implements IQueueProvider {
  private queues: Map<JobQueue, Job[]> = new Map();
  private running: Map<JobQueue, Set<string>> = new Map();
  private pausedQueues: Set<JobQueue> = new Set();
  private processedHistory: { queue: JobQueue; timestamp: number }[] = [];

  private readonly priorityWeight: Record<JobPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1
  };

  private readonly queueDisplayNames: Record<JobQueue, string> = {
    critical: 'Crítica',
    finance: 'Financeiro',
    payments: 'Pagamentos',
    integrations: 'Integrações',
    webhooks: 'Webhooks',
    documents: 'Documentos',
    analytics: 'Relatórios e BI',
    marketing: 'Marketing',
    communications: 'Comunicações',
    maintenance: 'Manutenção'
  };

  constructor() {
    const allQueues: JobQueue[] = [
      'critical',
      'finance',
      'payments',
      'integrations',
      'webhooks',
      'documents',
      'analytics',
      'marketing',
      'communications',
      'maintenance'
    ];
    for (const q of allQueues) {
      this.queues.set(q, []);
      this.running.set(q, new Set());
    }
  }

  public async enqueue(job: Job): Promise<void> {
    const list = this.queues.get(job.queue) || [];
    list.push(job);
    // Sort by priority desc, then createdAt asc
    list.sort((a, b) => {
      const pDiff = this.priorityWeight[b.priority] - this.priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    this.queues.set(job.queue, list);
  }

  public async dequeue(allowedQueues: JobQueue[]): Promise<Job | null> {
    // Critical queues take priority
    const prioritySortedQueues = [...allowedQueues].sort((a, b) => {
      if (a === 'critical') return -1;
      if (b === 'critical') return 1;
      return 0;
    });

    for (const q of prioritySortedQueues) {
      if (this.pausedQueues.has(q)) continue;
      const list = this.queues.get(q);
      if (list && list.length > 0) {
        const job = list.shift()!;
        this.running.get(q)?.add(job.id);
        this.processedHistory.push({ queue: q, timestamp: Date.now() });
        return job;
      }
    }
    return null;
  }

  public async peek(queue: JobQueue): Promise<Job | null> {
    const list = this.queues.get(queue);
    return list && list.length > 0 ? list[0] : null;
  }

  public async size(queue: JobQueue): Promise<number> {
    return this.queues.get(queue)?.length || 0;
  }

  public markCompleted(queue: JobQueue, jobId: string): void {
    this.running.get(queue)?.delete(jobId);
  }

  public async pause(queue: JobQueue): Promise<void> {
    this.pausedQueues.add(queue);
  }

  public async resume(queue: JobQueue): Promise<void> {
    this.pausedQueues.delete(queue);
  }

  public async isPaused(queue: JobQueue): Promise<boolean> {
    return this.pausedQueues.has(queue);
  }

  public async clear(queue?: JobQueue): Promise<void> {
    if (queue) {
      this.queues.set(queue, []);
      this.running.set(queue, new Set());
    } else {
      for (const q of this.queues.keys()) {
        this.queues.set(q, []);
        this.running.set(q, new Set());
      }
    }
  }

  public async getQueueMetrics(queue: JobQueue): Promise<JobQueueMetrics> {
    const list = this.queues.get(queue) || [];
    const depth = list.length;
    const runningCount = this.running.get(queue)?.size || 0;

    let oldestJobAgeSeconds = 0;
    if (list.length > 0) {
      const oldestDate = new Date(list[0].createdAt).getTime();
      oldestJobAgeSeconds = Math.max(0, Math.floor((Date.now() - oldestDate) / 1000));
    }

    const oneMinuteAgo = Date.now() - 60000;
    const recentProcessed = this.processedHistory.filter(
      item => item.queue === queue && item.timestamp >= oneMinuteAgo
    ).length;

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (depth > 1000 || oldestJobAgeSeconds > 300) {
      status = 'CRITICAL';
    } else if (depth > 200 || oldestJobAgeSeconds > 60) {
      status = 'WARNING';
    }

    return {
      name: queue,
      displayName: this.queueDisplayNames[queue] || queue,
      depth,
      runningCount,
      processingRatePerMinute: recentProcessed,
      oldestJobAgeSeconds,
      activeWorkers: runningCount > 0 ? runningCount : (depth > 0 ? 1 : 0),
      status
    };
  }

  public async getMetrics(): Promise<JobQueueMetrics[]> {
    const allQueues: JobQueue[] = [
      'critical',
      'finance',
      'payments',
      'integrations',
      'webhooks',
      'documents',
      'analytics',
      'marketing',
      'communications',
      'maintenance'
    ];
    const results: JobQueueMetrics[] = [];
    for (const q of allQueues) {
      results.push(await this.getQueueMetrics(q));
    }
    return results;
  }
}
