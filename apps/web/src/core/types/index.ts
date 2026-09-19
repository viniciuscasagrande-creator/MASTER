// Core Relational Entity Definitions for Disk Interno
// Central Chain: Produtor -> Evento -> Cliente -> Pedido -> Ingresso -> Pagamento -> Repasse

export type Role = 
  | 'admin_master'
  | 'diretoria_financeira'
  | 'operador_sac'
  | 'gerente_eventos'
  | 'comercial_lead'
  | 'marketing_specialist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department: string;
}

export interface Producer {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'suspended';
  totalEvents: number;
  totalRevenue: number;
  availableBalance: number;
  pendingBalance: number;
  blockedBalance: number;
  commissionRate: number; // e.g., 0.08 = 8%
  bankAccount: {
    bank: string;
    agency: string;
    account: string;
    pixKey: string;
  };
}

export interface EventSector {
  id: string;
  name: string;
  capacity: number;
  sold: number;
  price: number;
  batch: number;
}

export interface EventItem {
  id: string;
  producerId: string;
  producerName: string;
  title: string;
  name?: string;
  category: 'Show' | 'Festival' | 'Teatro' | 'Esporte' | 'Corporativo' | 'Congresso';
  venue: string;
  city: string;
  state: string;
  date: string;
  doorsOpen: string;
  status: 'published' | 'on_sale' | 'in_operation' | 'completed' | 'cancelled';
  totalCapacity: number;
  ticketsSold: number;
  grossRevenue: number;
  netRevenue: number;
  checkInCount: number;
  sectors: EventSector[];
  activeIncidentCount: number;
  hasDivergence: boolean;
}

export interface Customer {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  isBlacklisted: boolean;
}

export type OrderStatus = 
  | 'paid' 
  | 'refunded' 
  | 'partially_refunded' 
  | 'chargeback' 
  | 'pending' 
  | 'cancelled';

export interface Ticket {
  id: string;
  ticketCode: string;
  orderId: string;
  eventId: string;
  eventName: string;
  sectorName: string;
  customerName: string;
  customerCpf: string;
  nominalAttendee: string;
  price: number;
  fee: number;
  status: 'valid' | 'used' | 'cancelled' | 'refunded' | 'blocked';
  checkInAt?: string;
  checkInGate?: string;
  qrCode: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  gateway: 'Cielo' | 'Rede' | 'PIX_BancoCentral' | 'Stone';
  gatewayTransactionId: string;
  method: 'credit_card' | 'pix' | 'boleto';
  amount: number;
  netAmount: number;
  gatewayFee: number;
  diskFee: number;
  installments: number;
  cardLast4?: string;
  cardBrand?: string;
  paidAt: string;
  status: 'settled' | 'pending' | 'refunded' | 'disputed';
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "DK-98421"
  producerId: string;
  eventId: string;
  eventName: string;
  customerId: string;
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  itemsCount: number;
  grossAmount: number;
  serviceFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  createdAt: string;
  tickets: Ticket[];
  payment: PaymentTransaction;
  marketingSource?: {
    utmSource: string;
    utmCampaign: string;
    adPlatform?: 'meta' | 'google' | 'tiktok' | 'spotify' | 'organic' | 'affiliate';
  };
}

export interface Payout {
  id: string;
  producerId: string;
  producerName: string;
  eventId: string;
  eventName: string;
  amount: number;
  status: 'scheduled' | 'processing' | 'completed' | 'blocked';
  scheduledDate: string;
  paidAt?: string;
  bankInfo: string;
  auditApprovalBy?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerCpf: string;
  type: 'total' | 'partial';
  amount: number;
  reason: 'arrependimento_7d' | 'evento_cancelado' | 'duplicidade' | 'solicitacao_judicial' | 'outro';
  reasonDescription: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedAt?: string;
  requestedBy: string;
  approvedBy?: string;
  ticketsToCancel: string[]; // ticket IDs
}

export interface Incident {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  category: 'catraca' | 'rede_wifi' | 'ingresso_falso' | 'tumulto' | 'sistema' | 'produtor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_investigation' | 'resolved';
  reportedAt: string;
  reportedBy: string;
  resolvedAt?: string;
  description: string;
  slaMinutes: number;
}

export interface SacTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  channel: 'whatsapp' | 'email' | 'chat' | 'phone';
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  agentName: string;
  csatRating?: number; // 1 - 5
}

export interface AccountingEntry {
  id: string;
  entryNumber: string;
  date: string;
  orderId?: string;
  eventId?: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  status: 'posted' | 'reconciled';
}

export interface MarketingCampaign {
  id: string;
  eventId: string;
  eventName: string;
  platform: 'meta' | 'google' | 'tiktok' | 'spotify';
  campaignName: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  attributedRevenue: number;
  roas: number;
  cpa: number;
  status: 'active' | 'paused' | 'ended';
}

export interface AbandonedCart {
  id: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  ticketCount: number;
  totalValue: number;
  abandonedAt: string;
  status: 'recovered' | 'waiting' | 'in_journey' | 'lost';
  recoveryChannel?: 'whatsapp' | 'email';
  recoveredAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: 'EVENTOS' | 'COMERCIAL' | 'SUPORTE' | 'SAC' | 'ESTORNO' | 'FINANCEIRO' | 'CONTABILIDADE' | 'MARKETING' | 'REMARKETING' | 'CORE';
  entityType: 'ORDER' | 'TICKET' | 'EVENT' | 'PRODUCER' | 'REFUND' | 'PAYOUT' | 'INCIDENT' | 'CUSTOMER';
  entityId: string;
  details: string;
  ipAddress: string;
  impactCascade?: string[];
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: 'sale' | 'refund' | 'incident' | 'payout' | 'chargeback' | 'system';
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
}
