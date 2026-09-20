export * from '@shared/types/index';

import {
  Job,
  JobStatus,
  JobPriority,
  JobQueue,
  JobModule,
  JobBatch,
  JobSchedule,
  JobWorker,
  JobDeadLetter,
  JobQueueMetrics,
  ProcessingCenterStats
} from '@shared/types/index';

export type ProcessingTab =
  | 'overview'
  | 'running'
  | 'queued'
  | 'schedules'
  | 'completed'
  | 'dead_letter'
  | 'batches'
  | 'queues'
  | 'workers';

export interface JobFilterOptions {
  status?: JobStatus | 'ALL';
  queue?: JobQueue | 'ALL';
  priority?: JobPriority | 'ALL';
  module?: JobModule | 'ALL';
  searchTerm?: string;
  producerId?: string;
  eventId?: string;
}
