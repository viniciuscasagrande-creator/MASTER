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

export type ExecutionStatus =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export interface ApprovalStepItem {
  id: string;
  requestId: string;
  stepOrder: number;
  roleCode?: string | null;
  groupId?: string | null;
  status: StepStatus;
  approvedByUserId?: string | null;
  approvedByUserName?: string | null;
  decision?: string | null;
  comment?: string | null;
  stepUpVerified?: boolean;
  decidedAt?: string | null;
  createdAt: string;
}

export interface ApprovalDecisionItem {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole?: string | null;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'CANCELLED';
  comment?: string | null;
  isDelegated?: boolean;
  delegatedFromUserId?: string | null;
  stepUpToken?: string | null;
  createdAt: string;
}

export interface ApprovalCommentItem {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface ApprovalAttachmentItem {
  id: string;
  requestId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedByUserName?: string;
  createdAt: string;
}

export interface ApprovalRequestItem {
  id: string;
  requestCode: string;
  operation: ApprovalOperation;
  title: string;
  description?: string | null;
  amount?: number | null;
  producerId?: string | null;
  eventId?: string | null;
  requesterId: string;
  requesterName: string;
  requesterRole?: string | null;
  ruleId: string;
  ruleVersion: number;
  policySnapshot?: string;
  status: ApprovalStatus;
  approvalsCount: number;
  approvalsRequired: number;
  currentStep: number;
  executionStatus?: ExecutionStatus;
  executionId?: string | null;
  executionError?: string | null;
  executedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  steps?: ApprovalStepItem[];
  decisions?: ApprovalDecisionItem[];
  comments?: ApprovalCommentItem[];
  attachments?: ApprovalAttachmentItem[];
  rule?: any;
  hasSufficientThreshold?: boolean;
  thresholdLimit?: number;
}

export interface ApprovalRuleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  operation: ApprovalOperation;
  producerId?: string | null;
  eventId?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  approvalsRequired: number;
  isSequential: boolean;
  requireDistinctApprovers: boolean;
  prohibitSelfApproval: boolean;
  requireStepUp: boolean;
  require2FA: boolean;
  requireComment: boolean;
  requiredDocuments?: string | null;
  allowedRoles: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApprovalThresholdItem {
  id: string;
  userId?: string | null;
  roleId?: string | null;
  roleCode?: string | null;
  operation: string;
  maxApprovalAmount: number;
  producerId?: string | null;
  eventId?: string | null;
  createdAt: string;
}

export interface ApprovalDelegationItem {
  id: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  operation?: string | null;
  producerId?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  reason?: string;
  createdAt: string;
}
