import {
  TaskStatus,
  TaskPriority,
  TaskModule,
  TaskWaitingReason,
  SlaStatus,
  UserAvailabilityStatus
} from '@shared/types/index';

export interface CreateTaskInput {
  title: string;
  description?: string;
  module: TaskModule;
  type?: string;
  priority?: TaskPriority;
  assignedUserId?: string;
  assignedTeamId?: string;
  assignedTeamCode?: string;
  producerId?: string;
  eventId?: string;
  resourceType?: string;
  resourceId?: string;
  workflowId?: string;
  workflowRuleId?: string;
  templateCode?: string;
  slaPolicyId?: string;
  dueAt?: Date | string;
  estimatedMinutes?: number;
  checklist?: Array<{ text: string; isRequired?: boolean }>;
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: Date | string;
  estimatedMinutes?: number;
}

export interface AssignTaskInput {
  userId?: string;
  teamId?: string;
  reason?: string;
  comment?: string;
}

export interface ReassignTaskInput {
  toUserId?: string;
  toTeamId?: string;
  reason: string;
  comment?: string;
}

export interface WaitTaskInput {
  reason: TaskWaitingReason;
  details?: string;
}

export interface CompleteTaskInput {
  notes?: string;
  forwardToApproval?: boolean;
  approvalOperation?: string;
  approvalAmount?: number;
}

export interface CancelTaskInput {
  reason: string;
}

export interface ReopenTaskInput {
  reason: string;
}

export interface AddCommentInput {
  content: string;
  mentions?: string[];
}

export interface UpdateChecklistItemInput {
  isCompleted: boolean;
}

export interface ListTasksQuery {
  search?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  module?: TaskModule;
  assignedUserId?: string;
  assignedTeamId?: string;
  producerId?: string;
  eventId?: string;
  resourceType?: string;
  resourceId?: string;
  slaStatus?: SlaStatus;
  dueToday?: boolean;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
  orderBy?: 'dueAt' | 'priority' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface TaskSummaryResponse {
  total: number;
  urgent: number;
  dueToday: number;
  waiting: number;
  overdue: number;
  completedToday: number;
  byModule: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface WorkflowRuleCondition {
  divergenceAmount?: { gt?: number; gte?: number; lt?: number; lte?: number };
  failureRate?: { gt?: number; gte?: number };
  amount?: { gt?: number; gte?: number; lt?: number; lte?: number };
  producerId?: string;
  eventId?: string;
  category?: string;
  [key: string]: any;
}

export interface WorkflowRuleAction {
  createTasks?: Array<{
    templateCode?: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    slaMinutes?: number;
    targetTeamCode?: string;
    targetTeamId?: string;
    checklist?: Array<{ text: string; isRequired?: boolean }>;
  }>;
  notify?: Array<{
    channels: string[];
    message: string;
  }>;
  routeTeamCode?: string;
}
