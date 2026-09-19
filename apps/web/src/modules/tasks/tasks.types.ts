import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskModule,
  TaskWaitingReason,
  SlaStatus,
  UserAvailabilityStatus,
  TaskChecklistItem,
  TaskCommentItem,
  TaskHistoryItem,
  TeamItem,
  TeamMemberItem,
  WorkflowItem,
  WorkflowRuleItem,
  SlaPolicyItem
} from '@shared/types/index';

export type {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskModule,
  TaskWaitingReason,
  SlaStatus,
  UserAvailabilityStatus,
  TaskChecklistItem,
  TaskCommentItem,
  TaskHistoryItem,
  TeamItem,
  TeamMemberItem,
  WorkflowItem,
  WorkflowRuleItem,
  SlaPolicyItem
};

export interface TaskSummaryData {
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

export interface MyInboxData {
  tasks: TaskItem[];
  urgentCount: number;
  dueTodayCount: number;
  waitingCount: number;
  total: number;
}

export interface TeamInboxData {
  team: TeamItem;
  tasks: TaskItem[];
  unassigned: TaskItem[];
  inProgress: TaskItem[];
  waiting: TaskItem[];
  total: number;
  unassignedCount: number;
}
