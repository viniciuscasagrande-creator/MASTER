export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'WAITING_INFORMATION'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export type RefundKind = 'TOTAL' | 'PARTIAL';

export type RefundRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RefundReason =
  | 'CDC_7_DAYS'
  | 'EVENT_CANCELLED'
  | 'EVENT_POSTPONED'
  | 'OPERATIONAL_ERROR'
  | 'MEDICAL_REASON'
  | 'FRAUD_CHARGEBACK_PREVENT'
  | 'OTHER';

export interface RefundApprovalRecord {
  level: number;
  approverId: string;
  approverName: string;
  role: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt: string;
}

export interface RefundTimelineEntry {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface RefundItem {
  id: string;
  refundCode: string;
  refundCodeNormalized: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCpfMasked: string;
  producerId: string;
  eventId: string;
  eventName: string;
  kind: RefundKind;
  amount: number;
  amountCents: number;
  originalOrderAmount: number;
  eligibleRemainingAmount: number;
  reason: RefundReason;
  reasonDescription: string;
  status: RefundStatus;
  riskLevel: RefundRiskLevel;
  requiredApprovals: number;
  approvalsReceived: number;
  approvals: RefundApprovalRecord[];
  requestedBy: string;
  requestedByUserId: string;
  paymentMethod: string;
  paymentGateway: string;
  transactionCode: string;
  gatewayRefundId?: string;
  idempotencyKey: string;
  ticketIds?: string[];
  orderItemIds?: string[];
  sacTicketId?: string;
  timeline: RefundTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateRefundRequestDTO {
  orderId: string;
  kind: RefundKind;
  amount?: number;
  itemIds?: string[];
  ticketIds?: string[];
  reason: RefundReason;
  reasonDescription: string;
  ticketId?: string; // SAC Ticket ID de origem
}

export interface ReviewRefundDTO {
  action: 'START_REVIEW' | 'REQUEST_INFO' | 'SEND_TO_APPROVAL';
  notes?: string;
}

export interface ApproveRefundDTO {
  comment?: string;
}

export interface RejectRefundDTO {
  reason: string;
}

export interface ProcessRefundDTO {
  idempotencyKey?: string;
}

export interface RefundEligibilityCheck {
  key: string;
  label: string;
  status: 'OK' | 'WARNING' | 'BLOCKED';
  detail: string;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  riskLevel: RefundRiskLevel;
  requiredApprovals: number;
  orderTotalAmount: number;
  previouslyRefundedAmount: number;
  maxRefundableAmount: number;
  requestedAmount: number;
  checks: RefundEligibilityCheck[];
  blockingReasons: string[];
}

export interface RefundReversalPlanStep {
  order: number;
  action: string;
  label: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  detail?: string;
}

export interface RefundReversalPlan {
  strategy: 'compensating_entries';
  immutableLedger: true;
  refundCode: string;
  orderCode: string;
  amount: number;
  amountCents: number;
  steps: RefundReversalPlanStep[];
}

export interface RefundMetricsSummary {
  totalRequested: number;
  totalUnderReview: number;
  totalPendingApproval: number;
  totalApproved: number;
  totalProcessing: number;
  totalCompleted: number;
  totalRejected: number;
  totalFailed: number;
  totalAmountRefundedMonth: number;
  totalAmountPending: number;
  averageProcessingHours: number;
  chargebackRatePercent: number;
}
