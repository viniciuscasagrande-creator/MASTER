export type EntityType =
  | 'CUSTOMER'
  | 'ORDER'
  | 'TICKET'
  | 'EVENT'
  | 'PRODUCER'
  | 'PAYMENT'
  | 'REFUND'
  | 'SUPPORT'
  | 'CAMPAIGN'
  | 'DOCUMENT'
  | 'TASK'
  | 'POLICY';

export type DetectedQueryType =
  | 'CPF'
  | 'ORDER_CODE'
  | 'TICKET_CODE'
  | 'PAYMENT_CODE'
  | 'REFUND_CODE'
  | 'SUPPORT_CODE'
  | 'TASK_CODE'
  | 'POLICY_CODE'
  | 'EMAIL'
  | 'PHONE'
  | 'TEXT';

export interface ParsedQuery {
  raw: string;
  normalized: string;
  detectedType: DetectedQueryType;
  confidence: number;
  extractedCode?: string;
  extractedDigits?: string;
}

export interface SearchResultItem {
  id: string;
  entityType: EntityType;
  title: string;
  subtitle: string;
  status?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  meta?: Record<string, any>;
  producerId?: string | null;
  producerName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  actionUrl: string;
}

export interface CategoryResult {
  count: number;
  items: SearchResultItem[];
}

export interface CategorizedSearchResults {
  query: string;
  detectedType: DetectedQueryType;
  totalMatches: number;
  categories: {
    customers: CategoryResult;
    orders: CategoryResult;
    tickets: CategoryResult;
    events: CategoryResult;
    producers: CategoryResult;
    payments: CategoryResult;
    refunds: CategoryResult;
    supportTickets: CategoryResult;
    campaigns: CategoryResult;
    documents?: CategoryResult;
    tasks?: CategoryResult;
    policies?: CategoryResult;
  };
}

export interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  entityType: EntityType;
  actionUrl: string;
  meta?: Record<string, any>;
}

export interface CustomerCompleteView {
  customer: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    city?: string | null;
    state?: string | null;
    createdAt: string | Date;
  };
  summary: {
    totalOrders: number;
    totalSpent: number;
    totalTickets: number;
    totalEvents: number;
    lastOrder?: any;
  };
  orders: any[];
  tickets: any[];
  payments: any[];
  supportTickets: any[];
  refunds: any[];
}

export interface OrderCompleteView {
  order: {
    id: string;
    orderNumber: string;
    producerId: string;
    producerName?: string;
    eventId: string;
    eventName: string;
    customerId: string;
    customerName: string;
    customerCpf: string;
    customerEmail?: string;
    customerPhone?: string;
    itemsCount: number;
    grossAmount: number;
    serviceFee: number;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string | Date;
  };
  financialSummary: {
    grossAmount: number;
    serviceFee: number;
    totalAmount: number;
    netAmount?: number;
  };
  tickets: any[];
  payments: any[];
  supportTickets: any[];
  refunds: any[];
  permissions: {
    canResendTicket: boolean;
    canOpenSupport: boolean;
    canRequestRefund: boolean;
    canApproveRefund: boolean;
    canViewFullCpf: boolean;
  };
}
