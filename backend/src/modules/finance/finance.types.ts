export type PayoutStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'BLOCKED' | 'REJECTED';

export type TransactionType = 'SALE' | 'COMMISSION_FEE' | 'PAYOUT' | 'REFUND' | 'ADVANCE' | 'ADJUSTMENT' | 'TRANSFER_OUT' | 'TRANSFER_IN';

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
  transfersIn: number;
  transfersOut: number;
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
  referenceId?: string; // Order ID, Payout ID, Transfer ID, Refund ID
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

export interface EventTransfer {
  id: string;
  transferNumber: string;
  producerId: string;
  fromEventId: string;
  fromEventTitle: string;
  toEventId: string;
  toEventTitle: string;
  amount: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'REVERTED' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string;
  revertedBy?: string;
  reversalReason?: string;
  reversalTransferId?: string;
  createdAt: string;
  updatedAt: string;
  revertedAt?: string;
}

export interface ReceivableRecord {
  id: string;
  receivableNumber: string;
  producerId: string;
  eventId: string;
  eventTitle: string;
  origin: 'CARTAO_CREDITO' | 'BOLETO' | 'PIX' | 'PDV_CONSIGNADO';
  acquirer: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  dueDate: string;
  status: 'A_RECEBER' | 'RECEBIDO' | 'ANTECIPADO' | 'ATRASADO';
  orderId?: string;
}

export interface PayableRecord {
  id: string;
  payableNumber: string;
  producerId: string;
  eventId?: string;
  eventTitle?: string;
  beneficiary: string;
  category: string;
  costCenter: string;
  amount: number;
  dueDate: string;
  status: 'A_PAGAR' | 'EM_APROVACAO' | 'PAGO' | 'CANCELADO';
  paidAt?: string;
  paymentMethod: string;
  notes?: string;
}

export interface TreasuryBankAccount {
  id: string;
  producerId: string;
  bankCode: string;
  bankName: string;
  agency: string;
  account: string;
  accountType: 'CORRENTE' | 'POUPANCA';
  pixKey: string;
  pixKeyType: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CashFlowItem {
  period: string; // ex: '2026-09-01' ou 'Setembro 2026'
  realizedInflows: number;
  realizedOutflows: number;
  realizedNet: number;
  projectedInflows: number;
  projectedOutflows: number;
  projectedNet: number;
  finalBalance: number;
}

export interface ManagementDRE {
  producerId: string;
  eventId?: string;
  period: string;
  grossTicketRevenue: number;
  ticketingServiceFees: number;
  netTicketRevenue: number;
  productionDirectCosts: number;
  marketingCosts: number;
  operationalContributionMargin: number;
  taxesAndRetentions: number;
  netOperationalResult: number;
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

export interface CreateTransferInput {
  producerId: string;
  fromEventId: string;
  toEventId: string;
  amount: number;
  reason: string;
}

export interface RevertTransferInput {
  transferId: string;
  reason: string;
}

export interface CreatePayableInput {
  producerId: string;
  eventId?: string;
  beneficiary: string;
  category: string;
  costCenter: string;
  amount: number;
  dueDate: string;
  paymentMethod: string;
  notes?: string;
}

export interface FinancialFilterInput {
  producerId?: string;
  eventId?: string;
  status?: string;
  timeRange?: 'hoje' | '7d' | '30d' | 'mes' | 'todos';
  startDate?: string;
  endDate?: string;
}

