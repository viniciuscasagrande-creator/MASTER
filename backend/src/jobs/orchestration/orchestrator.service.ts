import { DependencyService, DependencyNode } from './dependency.service';
import { JobRepository } from '../core/job.repository';
import { WorkerService } from '../workers/worker.service';
import { User } from '@shared/types/index';

export interface WorkflowExecutionPlan {
  id: string;
  name: string;
  stagesCount: number;
  totalJobs: number;
  stages: DependencyNode[][];
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: 'COMPLETED' | 'FAILED';
  executedStages: number;
  completedJobsCount: number;
  failedJobsCount: number;
  results: Record<string, any>;
  durationMs: number;
}

export class JobOrchestrator {
  private dependencyService: DependencyService;
  private repository: JobRepository;
  private workerService: WorkerService;

  constructor(
    dependencyService?: DependencyService,
    repository?: JobRepository,
    workerService?: WorkerService
  ) {
    this.dependencyService = dependencyService || new DependencyService();
    this.repository = repository || new JobRepository();
    this.workerService = workerService || new WorkerService('wrk-orch', 'Orchestrator Worker', ['finance', 'analytics'], 10);
  }

  public planWorkflow(name: string, nodes: DependencyNode[]): WorkflowExecutionPlan {
    const stages = this.dependencyService.computeExecutionStages(nodes);
    return {
      id: `wf_${Date.now()}`,
      name,
      stagesCount: stages.length,
      totalJobs: nodes.length,
      stages
    };
  }

  public async executeWorkflow(
    plan: WorkflowExecutionPlan,
    user: User,
    correlationId: string = `cor_wf_${Date.now()}`
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    let completedCount = 0;
    let failedCount = 0;

    for (let stageIdx = 0; stageIdx < plan.stages.length; stageIdx++) {
      const stageNodes = plan.stages[stageIdx];

      // Execute nodes in the current stage in parallel
      const stagePromises = stageNodes.map(async (node) => {
        const job = await this.repository.create({
          id: `job_${plan.id}_${node.id}`,
          type: node.jobType,
          module: 'FINANCEIRO',
          status: 'RUNNING',
          priority: 'HIGH',
          queue: 'finance',
          progress: 0,
          payload: { ...node.payload, previousResults: results },
          createdBy: user.id,
          createdByName: user.name,
          createdAt: new Date().toISOString(),
          attempts: 0,
          maxAttempts: 3,
          correlationId,
          workflowId: plan.id,
          cancellable: true
        });

        try {
          const res = await this.workerService.executeJob(job);
          results[node.id] = res;
          completedCount++;
          return { success: true, nodeId: node.id, res };
        } catch (error: any) {
          failedCount++;
          return { success: false, nodeId: node.id, error: error.message };
        }
      });

      const stageResults = await Promise.all(stagePromises);
      const stageFailed = stageResults.some(r => !r.success);

      if (stageFailed) {
        return {
          workflowId: plan.id,
          status: 'FAILED',
          executedStages: stageIdx + 1,
          completedJobsCount: completedCount,
          failedJobsCount: failedCount,
          results,
          durationMs: Date.now() - startTime
        };
      }
    }

    return {
      workflowId: plan.id,
      status: 'COMPLETED',
      executedStages: plan.stages.length,
      completedJobsCount: completedCount,
      failedJobsCount: failedCount,
      results,
      durationMs: Date.now() - startTime
    };
  }
}
