export type PayoutStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'BLOCKED' | 'REJECTED';

export type TransactionType = 'SALE' | 'COMMISSION_FEE' | 'PAYOUT' | 'REFUND' | 'ADVANCE' | 'ADJUSTMENT';

export interface ProducerBalanceSummary {
  producerId: string;
  producerName: string;
  grossSales: number;
  diskFeeRetained: number;
  refundsDeducted: number;
  advancesGranted: number;
  payoutsPaid: number;
  pendingPayouts: number;
  availableBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface EventBalanceItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: string;
  ticketsSold: number;
  grossAmount: number;
  diskFee: number;
  netRevenue: number;
  paidPayouts: number;
  pendingPayouts: number;
  availableBalance: number;
}

export interface FinancialTransaction {
  id: string;
  producerId: string;
  eventId?: string;
  eventTitle?: string;
  type: TransactionType;
  description: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string; // Order ID, Payout ID, Refund ID
  createdAt: string;
}

export interface PayoutRecord {
  id: string;
  payoutNumber: string;
  producerId: string;
  producerName: string;
  eventId: string;
  eventName: string;
  amount: number;
  status: PayoutStatus;
  scheduledDate: string;
  paidAt?: string;
  bankInfo: {
    bankName: string;
    agency: string;
    account: string;
    pixKey?: string;
    document: string;
  };
  requestedBy: string;
  approvedBy?: string;
  approvalChain?: Array<{
    level: number;
    approverName: string;
    approvedAt: string;
  }>;
  bankAuthCode?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayReconciliationRecord {
  id: string;
  gateway: 'Cielo' | 'Rede' | 'PIX_BancoCentral' | 'Asaas';
  period: string;
  ordersCount: number;
  systemAmount: number;
  gatewayAmount: number;
  divergenceAmount: number;
  gatewayFees: number;
  status: 'CONCILIADO' | 'DIVERGENTE' | 'PENDENTE';
  lastCheckedAt: string;
}

export interface SchedulePayoutInput {
  producerId: string;
  eventId: string;
  amount: number;
  scheduledDate: string;
  notes?: string;
}

export interface ApprovePayoutInput {
  payoutId: string;
  stepUpToken?: string;
}

export interface ProcessPayoutInput {
  payoutId: string;
  bankAuthCode: string;
  notes?: string;
}

export interface RejectPayoutInput {
  payoutId: string;
  reason: string;
}

export interface FinancialFilterInput {
  producerId?: string;
  eventId?: string;
  timeRange?: 'hoje' | '7d' | '30d' | 'mes' | 'todos';
  startDate?: string;
  endDate?: string;
}
