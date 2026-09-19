export type ApprovalOperation =
  | 'FINANCE_TRANSFER'
  | 'REFUND_REQUEST'
  | 'ACCOUNTING_ADJUSTMENT'
  | 'ADMIN_ROLE_CHANGE'
  | 'ADMIN_PERMISSION_CHANGE'
  | 'EVENT_BATCH_DISCOUNT'
  | 'MARKETING_BUDGET_RELEASE'
  | 'FINANCE_PAYOUT'
  | 'FINANCE_ADVANCE'
  | string;

export type ApprovalStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ACTION_REQUIRED';

export type StepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED';

export type StepType = 'ROLE' | 'USER' | 'GROUP';

export type ExecutionStatus =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export type DecisionType = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';

export interface CreateApprovalRequestDto {
  operation: ApprovalOperation;
  title: string;
  description?: string;
  amount?: number;
  producerId?: string | null;
  eventId?: string | null;
  payload?: any;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }>;
}

export interface ApproveStepDto {
  stepId?: string;
  comment?: string;
  stepUpToken?: string;
}

export interface RejectStepDto {
  reason: string;
}

export interface RequestChangesDto {
  comment: string;
}

export interface SimulateApprovalDto {
  operation: ApprovalOperation;
  amount?: number;
  producerId?: string | null;
  eventId?: string | null;
  requesterId?: string;
}

export interface SimulationResult {
  operation: ApprovalOperation;
  amount?: number;
  producerId?: string | null;
  eventId?: string | null;
  matchedRule: {
    id: string;
    code: string;
    name: string;
    scopeLevel: 'EVENT' | 'PRODUCER' | 'GLOBAL';
    approvalsRequired: number;
    isSequential: boolean;
    requireDistinctApprovers: boolean;
    prohibitSelfApproval: boolean;
    requireStepUp: boolean;
    allowedRoles: string[];
    slaHours: number;
  } | null;
  stepsRequired: number;
  isSequential: boolean;
  eligibleRoles: string[];
  requireStepUp: boolean;
  summary: string;
}

export interface CreateDelegationDto {
  delegatedToId: string;
  startDate: string | Date;
  endDate: string | Date;
  operation?: string | null;
  producerId?: string | null;
  reason?: string;
}
