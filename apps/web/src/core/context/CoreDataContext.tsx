import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  Producer,
  EventItem,
  Customer,
  Order,
  RefundRequest,
  Payout,
  Incident,
  SacTicket,
  AccountingEntry,
  MarketingCampaign,
  AbandonedCart,
  AuditLog,
  SystemNotification
} from '../types';
import {
  INITIAL_PRODUCERS,
  INITIAL_EVENTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_REFUNDS,
  INITIAL_PAYOUTS,
  INITIAL_INCIDENTS,
  INITIAL_SAC_TICKETS,
  INITIAL_ACCOUNTING_ENTRIES,
  INITIAL_MARKETING_CAMPAIGNS,
  INITIAL_ABANDONED_CARTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../database/mockDatabase';

interface CoreDataContextType {
  producers: Producer[];
  events: EventItem[];
  customers: Customer[];
  orders: Order[];
  refunds: RefundRequest[];
  payouts: Payout[];
  incidents: Incident[];
  sacTickets: SacTicket[];
  accountingEntries: AccountingEntry[];
  marketingCampaigns: MarketingCampaign[];
  abandonedCarts: AbandonedCart[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];

  // Cross-module transactional actions
  processNewSale: (params: {
    eventId: string;
    customerName: string;
    customerCpf: string;
    customerEmail: string;
    sectorId: string;
    paymentMethod: 'credit_card' | 'pix';
    utmCampaign?: string;
  }) => Order;

  approveRefund: (refundId: string, approverName: string) => void;
  rejectRefund: (refundId: string, approverName: string, reason: string) => void;
  createRefundRequest: (params: {
    orderId: string;
    reason: 'arrependimento_7d' | 'evento_cancelado' | 'duplicidade' | 'solicitacao_judicial' | 'outro';
    description: string;
    type: 'total' | 'partial';
    requesterName: string;
  }) => RefundRequest;

  resolveIncident: (incidentId: string) => void;
  addIncident: (params: {
    eventId: string;
    title: string;
    category: Incident['category'];
    severity: Incident['severity'];
    description: string;
    reportedBy: string;
  }) => Incident;

  schedulePayout: (producerId: string, eventId: string, amount: number) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const CoreDataContext = createContext<CoreDataContextType | undefined>(undefined);

export const CoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [producers, setProducers] = useState<Producer[]>(INITIAL_PRODUCERS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [refunds, setRefunds] = useState<RefundRequest[]>(INITIAL_REFUNDS);
  const [payouts, setPayouts] = useState<Payout[]>(INITIAL_PAYOUTS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [sacTickets, setSacTickets] = useState<SacTicket[]>(INITIAL_SAC_TICKETS);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(INITIAL_ACCOUNTING_ENTRIES);
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>(INITIAL_MARKETING_CAMPAIGNS);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(INITIAL_ABANDONED_CARTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // Cross-module Transaction: New Sale
  const processNewSale = useCallback((params: {
    eventId: string;
    customerName: string;
    customerCpf: string;
    customerEmail: string;
    sectorId: string;
    paymentMethod: 'credit_card' | 'pix';
    utmCampaign?: string;
  }): Order => {
    const targetEvent = events.find(e => e.id === params.eventId) || events[0];
    const targetProducer = producers.find(p => p.id === targetEvent.producerId) || producers[0];
    const sector = targetEvent.sectors.find(s => s.id === params.sectorId) || targetEvent.sectors[0];

    const ticketPrice = sector.price;
    const serviceFee = Math.round(ticketPrice * 0.10); // 10% fee
    const totalAmount = ticketPrice + serviceFee;
    const netToProducer = ticketPrice; // producer takes base ticket
    const nowIso = new Date().toISOString();
    const orderSeq = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `DK-${orderSeq}`;

    // 1. Find or create Customer
    let customer = customers.find(c => c.cpf.replace(/\D/g, '') === params.customerCpf.replace(/\D/g, ''));
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        name: params.customerName,
        cpf: params.customerCpf,
        email: params.customerEmail,
        phone: '(41) 99999-0000',
        city: targetEvent.city,
        state: targetEvent.state,
        totalOrders: 1,
        totalSpent: totalAmount,
        createdAt: nowIso,
        isBlacklisted: false
      };
      setCustomers(prev => [customer!, ...prev]);
    } else {
      setCustomers(prev => prev.map(c => c.id === customer!.id ? {
        ...c,
        totalOrders: c.totalOrders + 1,
        totalSpent: c.totalSpent + totalAmount
      } : c));
    }

    // 2. Create Ticket
    const ticketId = `tkt-${Date.now()}-01`;
    const newTicket = {
      id: ticketId,
      ticketCode: `TKT-${orderSeq}-01`,
      orderId: `ord-${orderSeq}`,
      eventId: targetEvent.id,
      eventName: targetEvent.title,
      sectorName: sector.name,
      customerName: params.customerName,
      customerCpf: params.customerCpf,
      nominalAttendee: params.customerName,
      price: ticketPrice,
      fee: serviceFee,
      status: 'valid' as const,
      qrCode: `QR-${orderNumber}-01`
    };

    // 3. Create Order
    const newOrder: Order = {
      id: `ord-${orderSeq}`,
      orderNumber,
      producerId: targetProducer.id,
      eventId: targetEvent.id,
      eventName: targetEvent.title,
      customerId: customer.id,
      customerName: params.customerName,
      customerCpf: params.customerCpf,
      customerEmail: params.customerEmail,
      itemsCount: 1,
      grossAmount: ticketPrice,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      status: 'paid',
      paymentMethod: params.paymentMethod,
      createdAt: nowIso,
      tickets: [newTicket],
      payment: {
        id: `pay-${orderSeq}`,
        orderId: `ord-${orderSeq}`,
        gateway: params.paymentMethod === 'pix' ? 'PIX_BancoCentral' : 'Cielo',
        gatewayTransactionId: `GATEWAY-${Date.now()}`,
        method: params.paymentMethod,
        amount: totalAmount,
        netAmount: totalAmount - (params.paymentMethod === 'pix' ? 1.5 : 18.5),
        gatewayFee: params.paymentMethod === 'pix' ? 1.5 : 18.5,
        diskFee: serviceFee,
        installments: 1,
        cardLast4: params.paymentMethod === 'credit_card' ? '1288' : undefined,
        paidAt: nowIso,
        status: 'settled'
      },
      marketingSource: {
        utmSource: params.utmCampaign ? 'ad_campaign' : 'direct',
        utmCampaign: params.utmCampaign || 'organic_direct',
        adPlatform: params.utmCampaign?.includes('meta') ? 'meta' : 'google'
      }
    };

    setOrders(prev => [newOrder, ...prev]);

    // 4. CASCADE -> EVENTOS: Update capacity and sold count
    setEvents(prev => prev.map(evt => {
      if (evt.id === targetEvent.id) {
        return {
          ...evt,
          ticketsSold: evt.ticketsSold + 1,
          grossRevenue: evt.grossRevenue + totalAmount,
          netRevenue: evt.netRevenue + netToProducer,
          sectors: evt.sectors.map(sec => sec.id === sector.id ? { ...sec, sold: sec.sold + 1 } : sec)
        };
      }
      return evt;
    }));

    // 5. CASCADE -> COMERCIAL & FINANCEIRO: Update producer revenue & balance
    setProducers(prev => prev.map(prod => {
      if (prod.id === targetProducer.id) {
        return {
          ...prod,
          totalRevenue: prod.totalRevenue + totalAmount,
          availableBalance: prod.availableBalance + netToProducer
        };
      }
      return prod;
    }));

    // 6. CASCADE -> CONTABILIDADE: Generate double entry accounting facts
    const entry1: AccountingEntry = {
      id: `acc-${Date.now()}-1`,
      entryNumber: `LAN-${nowIso.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`,
      date: nowIso.slice(0, 10),
      orderId: newOrder.id,
      eventId: targetEvent.id,
      debitAccount: params.paymentMethod === 'pix' ? '1.1.1.05 - Banco Santander PIX' : '1.1.2.01 - Gateways a Receber (Cielo)',
      creditAccount: `2.1.3.01 - Obrigações com Produtores (${targetProducer.name.split(' ')[0]})`,
      amount: netToProducer,
      description: `Venda ${orderNumber} - Ingresso ${sector.name} [${targetEvent.title}]`,
      status: 'posted'
    };
    const entry2: AccountingEntry = {
      id: `acc-${Date.now()}-2`,
      entryNumber: `LAN-${nowIso.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`,
      date: nowIso.slice(0, 10),
      orderId: newOrder.id,
      eventId: targetEvent.id,
      debitAccount: params.paymentMethod === 'pix' ? '1.1.1.05 - Banco Santander PIX' : '1.1.2.01 - Gateways a Receber (Cielo)',
      creditAccount: '3.1.1.01 - Receita com Taxa de Conveniência DiskIngressos',
      amount: serviceFee,
      description: `Taxa conveniência apurada ${orderNumber}`,
      status: 'posted'
    };
    setAccountingEntries(prev => [entry1, entry2, ...prev]);

    // 7. CASCADE -> MARKETING: Attribute conversion if campaign present
    if (params.utmCampaign) {
      setMarketingCampaigns(prev => prev.map(camp => {
        if (camp.campaignName.toLowerCase().includes(params.utmCampaign!.toLowerCase()) || camp.eventId === targetEvent.id) {
          const newConversions = camp.conversions + 1;
          const newRev = camp.attributedRevenue + totalAmount;
          return {
            ...camp,
            conversions: newConversions,
            attributedRevenue: newRev,
            roas: Number((newRev / camp.spend).toFixed(2))
          };
        }
        return camp;
      }));
    }

    // 8. CASCADE -> NOTIFICATIONS: Broadcast sale
    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      title: `Nova Venda: ${orderNumber}`,
      description: `${params.customerName} comprou 1x ${sector.name} para ${targetEvent.title} (R$ ${totalAmount.toFixed(2)})`,
      type: 'sale',
      severity: 'success',
      timestamp: nowIso,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // 9. CASCADE -> AUDIT TRAIL: Log full transaction cascade
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: nowIso,
      userId: 'core-system',
      userName: 'Core Engine (Checkout)',
      action: 'VENDA_CONCLUIDA',
      module: 'CORE',
      entityType: 'ORDER',
      entityId: newOrder.id,
      details: `Venda ${orderNumber} finalizada. Cascata executada em Eventos (+1), Financeiro (+R$ ${netToProducer.toFixed(2)}), Contabilidade (2 lançamentos) e SAC.`,
      ipAddress: '127.0.0.1',
      impactCascade: [
        `EVENTOS: +1 ingresso vendido (${targetEvent.title})`,
        `COMERCIAL/FINANCEIRO: +R$ ${netToProducer.toFixed(2)} saldo produtor`,
        `SAC: Pedido ${orderNumber} indexado na Central de Consulta`,
        `CONTABILIDADE: Lançamentos ${entry1.entryNumber} e ${entry2.entryNumber}`,
        `MARKETING: Conversão atribuída à campanha`
      ]
    };
    setAuditLogs(prev => [audit, ...prev]);

    return newOrder;
  }, [events, producers, customers]);

  // Cross-module Transaction: Reverse Cascade (Refund Approval)
  const approveRefund = useCallback((refundId: string, approverName: string) => {
    const refund = refunds.find(r => r.id === refundId);
    if (!refund || refund.status === 'approved') return;

    const nowIso = new Date().toISOString();

    // 1. Update refund status
    setRefunds(prev => prev.map(r => r.id === refundId ? {
      ...r,
      status: 'approved' as const,
      processedAt: nowIso,
      approvedBy: approverName
    } : r));

    // 2. Update Order status
    const targetOrder = orders.find(o => o.orderNumber === refund.orderNumber || o.id === refund.orderId);
    if (targetOrder) {
      setOrders(prev => prev.map(o => o.id === targetOrder.id ? {
        ...o,
        status: refund.type === 'total' ? 'refunded' : 'partially_refunded',
        tickets: o.tickets.map(t => refund.ticketsToCancel.includes(t.id) ? { ...t, status: 'refunded' } : t)
      } : o));
    }

    // 3. Reverse in Eventos
    setEvents(prev => prev.map(evt => {
      if (evt.id === refund.eventId) {
        return {
          ...evt,
          ticketsSold: Math.max(0, evt.ticketsSold - (refund.type === 'total' ? 2 : 1)),
          grossRevenue: Math.max(0, evt.grossRevenue - refund.amount),
          netRevenue: Math.max(0, evt.netRevenue - refund.amount)
        };
      }
      return evt;
    }));

    // 4. Reverse in Financeiro (Deduct producer available balance)
    const evt = events.find(e => e.id === refund.eventId);
    if (evt) {
      setProducers(prev => prev.map(p => {
        if (p.id === evt.producerId) {
          return {
            ...p,
            availableBalance: Math.max(0, p.availableBalance - refund.amount)
          };
        }
        return p;
      }));
    }

    // 5. Reverse in Contabilidade
    const revEntry: AccountingEntry = {
      id: `acc-rev-${Date.now()}`,
      entryNumber: `EST-${nowIso.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`,
      date: nowIso.slice(0, 10),
      orderId: refund.orderId,
      eventId: refund.eventId,
      debitAccount: '2.1.3.01 - Obrigações com Produtores',
      creditAccount: '1.1.2.01 - Gateways a Receber (Estorno Cielo)',
      amount: refund.amount,
      description: `Estorno ${refund.type === 'total' ? 'Total' : 'Parcial'} Pedido ${refund.orderNumber} - Motivo: ${refund.reason}`,
      status: 'posted'
    };
    setAccountingEntries(prev => [revEntry, ...prev]);

    // 6. Notification
    const notif: SystemNotification = {
      id: `notif-ref-${Date.now()}`,
      title: `Estorno Aprovado: ${refund.orderNumber}`,
      description: `R$ ${refund.amount.toFixed(2)} devolvido a ${refund.customerName}. Ingressos invalidados no Core.`,
      type: 'refund',
      severity: 'warning',
      timestamp: nowIso,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // 7. Audit Log with full reverse cascade
    const audit: AuditLog = {
      id: `aud-ref-${Date.now()}`,
      timestamp: nowIso,
      userId: 'admin-user',
      userName: approverName,
      action: 'ESTORNO_APROVADO_CASCATA_REVERSA',
      module: 'ESTORNO',
      entityType: 'REFUND',
      entityId: refund.id,
      details: `Estorno de R$ ${refund.amount.toFixed(2)} aprovado para ${refund.orderNumber}. Cascata reversa executada em Pedido, Ingressos, Saldo Produtor e Contabilidade.`,
      ipAddress: '127.0.0.1',
      impactCascade: [
        `PEDIDO: Alterado para 'refunded'`,
        `INGRESSOS: Códigos de barra bloqueados na portaria`,
        `FINANCEIRO: Saldo do produtor debitado em R$ ${refund.amount.toFixed(2)}`,
        `CONTABILIDADE: Lançamento de devolução ${revEntry.entryNumber}`,
        `SAC: Protocolo atualizado para cliente`
      ]
    };
    setAuditLogs(prev => [audit, ...prev]);
  }, [refunds, orders, events]);

  const rejectRefund = useCallback((refundId: string, approverName: string, reason: string) => {
    setRefunds(prev => prev.map(r => r.id === refundId ? {
      ...r,
      status: 'rejected' as const,
      approvedBy: approverName,
      reasonDescription: `${r.reasonDescription} | Rejeitado: ${reason}`
    } : r));

    const audit: AuditLog = {
      id: `aud-rej-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'admin-user',
      userName: approverName,
      action: 'ESTORNO_REJEITADO',
      module: 'ESTORNO',
      entityType: 'REFUND',
      entityId: refundId,
      details: `Solicitação de estorno rejeitada. Justificativa: ${reason}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs(prev => [audit, ...prev]);
  }, []);

  const createRefundRequest = useCallback((params: {
    orderId: string;
    reason: RefundRequest['reason'];
    description: string;
    type: 'total' | 'partial';
    requesterName: string;
  }): RefundRequest => {
    const targetOrder = orders.find(o => o.id === params.orderId || o.orderNumber === params.orderId) || orders[0];
    const nowIso = new Date().toISOString();
    const newReq: RefundRequest = {
      id: `ref-${Date.now()}`,
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      eventId: targetOrder.eventId,
      eventName: targetOrder.eventName,
      customerName: targetOrder.customerName,
      customerCpf: targetOrder.customerCpf,
      type: params.type,
      amount: params.type === 'total' ? targetOrder.totalAmount : targetOrder.grossAmount / 2,
      reason: params.reason,
      reasonDescription: params.description,
      status: 'pending_approval',
      requestedAt: nowIso,
      requestedBy: params.requesterName,
      ticketsToCancel: targetOrder.tickets.map(t => t.id)
    };

    setRefunds(prev => [newReq, ...prev]);

    const notif: SystemNotification = {
      id: `notif-req-${Date.now()}`,
      title: `Nova Solicitação de Estorno: ${targetOrder.orderNumber}`,
      description: `${params.requesterName} solicitou estorno de R$ ${newReq.amount.toFixed(2)} (${params.reason}).`,
      type: 'refund',
      severity: 'warning',
      timestamp: nowIso,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    return newReq;
  }, [orders]);

  const resolveIncident = useCallback((incidentId: string) => {
    const nowIso = new Date().toISOString();
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? {
      ...inc,
      status: 'resolved' as const,
      resolvedAt: nowIso
    } : inc));

    // Update active incident count in event
    const inc = incidents.find(i => i.id === incidentId);
    if (inc) {
      setEvents(prev => prev.map(e => e.id === inc.eventId ? {
        ...e,
        activeIncidentCount: Math.max(0, e.activeIncidentCount - 1)
      } : e));
    }
  }, [incidents]);

  const addIncident = useCallback((params: {
    eventId: string;
    title: string;
    category: Incident['category'];
    severity: Incident['severity'];
    description: string;
    reportedBy: string;
  }): Incident => {
    const targetEvent = events.find(e => e.id === params.eventId) || events[0];
    const nowIso = new Date().toISOString();
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      eventId: targetEvent.id,
      eventName: targetEvent.title,
      title: params.title,
      category: params.category,
      severity: params.severity,
      status: 'open',
      reportedAt: nowIso,
      reportedBy: params.reportedBy,
      description: params.description,
      slaMinutes: params.severity === 'critical' ? 10 : params.severity === 'high' ? 20 : 45
    };

    setIncidents(prev => [newInc, ...prev]);
    setEvents(prev => prev.map(e => e.id === targetEvent.id ? { ...e, activeIncidentCount: e.activeIncidentCount + 1 } : e));

    const notif: SystemNotification = {
      id: `notif-inc-${Date.now()}`,
      title: `Incidente: ${params.title}`,
      description: `Severidade: ${params.severity.toUpperCase()} em ${targetEvent.title}`,
      type: 'incident',
      severity: params.severity === 'critical' ? 'critical' : 'warning',
      timestamp: nowIso,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    return newInc;
  }, [events]);

  const schedulePayout = useCallback((producerId: string, eventId: string, amount: number) => {
    const producer = producers.find(p => p.id === producerId);
    const event = events.find(e => e.id === eventId);
    if (!producer || !event) return;

    const newPayout: Payout = {
      id: `pay-sch-${Date.now()}`,
      producerId,
      producerName: producer.name,
      eventId,
      eventName: event.title,
      amount,
      status: 'scheduled',
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      bankInfo: `${producer.bankAccount.bank} - Ag ${producer.bankAccount.agency} CC ${producer.bankAccount.account}`,
      auditApprovalBy: 'Diretoria Financeira'
    };

    setPayouts(prev => [newPayout, ...prev]);
  }, [producers, events]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const value = useMemo(() => ({
    producers,
    events,
    customers,
    orders,
    refunds,
    payouts,
    incidents,
    sacTickets,
    accountingEntries,
    marketingCampaigns,
    abandonedCarts,
    auditLogs,
    notifications,
    processNewSale,
    approveRefund,
    rejectRefund,
    createRefundRequest,
    resolveIncident,
    addIncident,
    schedulePayout,
    markNotificationAsRead,
    markAllNotificationsAsRead
  }), [
    producers,
    events,
    customers,
    orders,
    refunds,
    payouts,
    incidents,
    sacTickets,
    accountingEntries,
    marketingCampaigns,
    abandonedCarts,
    auditLogs,
    notifications,
    processNewSale,
    approveRefund,
    rejectRefund,
    createRefundRequest,
    resolveIncident,
    addIncident,
    schedulePayout,
    markNotificationAsRead,
    markAllNotificationsAsRead
  ]);

  return (
    <CoreDataContext.Provider value={value}>
      {children}
    </CoreDataContext.Provider>
  );
};

export const useCoreData = () => {
  const context = useContext(CoreDataContext);
  if (!context) {
    throw new Error('useCoreData must be used within a CoreDataProvider');
  }
  return context;
};
