export * from '@shared/types/index';

import {
  Job,
  JobStatus,
  JobPriority,
  JobQueue,
  JobModule,
  JobProgressData,
  JobRegistryEntry
} from '@shared/types/index';

export interface CreateJobOptions {
  type: string;
  module?: JobModule;
  producerId?: string | null;
  eventId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  priority?: JobPriority;
  queue?: JobQueue;
  payload?: any;
  payloadReference?: string | null;
  scheduledAt?: Date | string | null;
  correlationId?: string;
  parentJobId?: string | null;
  batchId?: string | null;
  workflowId?: string | null;
  idempotencyKey?: string | null;
  maxAttempts?: number;
  requiresApproval?: boolean;
}

export interface JobHandlerContext {
  job: Job;
  correlationId: string;
  reportProgress: (processed: number, total: number, success?: number, failed?: number, currentStep?: string) => Promise<void>;
  saveCheckpoint: (cursor: any, processedCount: number, state?: any) => Promise<void>;
  getCheckpoint: () => Promise<any>;
  isCancellationRequested: () => Promise<boolean>;
  isPauseRequested: () => Promise<boolean>;
}

export type JobHandlerFunction = (payload: any, ctx: JobHandlerContext) => Promise<any>;

export interface RegisteredJobDefinition extends JobRegistryEntry {
  handler: JobHandlerFunction;
}
