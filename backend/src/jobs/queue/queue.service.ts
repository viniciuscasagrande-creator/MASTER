import { Job, JobQueue, JobQueueMetrics } from '@shared/types/index';
import { IQueueProvider, InMemoryQueueProvider } from './queue.provider';

export class QueueService {
  private static instance: QueueService;
  private provider: IQueueProvider;

  private constructor(provider?: IQueueProvider) {
    this.provider = provider || new InMemoryQueueProvider();
  }

  public static getInstance(provider?: IQueueProvider): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService(provider);
    }
    return QueueService.instance;
  }

  public async enqueue(job: Job): Promise<void> {
    await this.provider.enqueue(job);
  }

  public async dequeue(queues: JobQueue[]): Promise<Job | null> {
    return this.provider.dequeue(queues);
  }

  public async peek(queue: JobQueue): Promise<Job | null> {
    return this.provider.peek(queue);
  }

  public async size(queue: JobQueue): Promise<number> {
    return this.provider.size(queue);
  }

  public async getMetrics(): Promise<JobQueueMetrics[]> {
    return this.provider.getMetrics();
  }

  public async getQueueMetrics(queue: JobQueue): Promise<JobQueueMetrics> {
    return this.provider.getQueueMetrics(queue);
  }

  public async pause(queue: JobQueue): Promise<void> {
    await this.provider.pause(queue);
  }

  public async resume(queue: JobQueue): Promise<void> {
    await this.provider.resume(queue);
  }

  public async isPaused(queue: JobQueue): Promise<boolean> {
    return this.provider.isPaused(queue);
  }

  public async clear(queue?: JobQueue): Promise<void> {
    await this.provider.clear(queue);
  }

  public getProvider(): IQueueProvider {
    return this.provider;
  }
}
