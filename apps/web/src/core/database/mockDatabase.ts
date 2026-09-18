import {
  Producer,
  EventItem,
  Customer,
  Order,
  Payout,
  RefundRequest,
  Incident,
  SacTicket,
  AccountingEntry,
  MarketingCampaign,
  AbandonedCart,
  AuditLog,
  SystemNotification
} from '../types';

export const INITIAL_PRODUCERS: Producer[] = [
  {
    id: 'prod-1',
    name: 'Opus Entretenimento',
    cnpj: '12.345.678/0001-90',
    email: 'financeiro@opusentretenimento.com.br',
    phone: '(41) 3322-9000',
    status: 'active',
    totalEvents: 14,
    totalRevenue: 4850000,
    availableBalance: 842500,
    pendingBalance: 320000,
    blockedBalance: 45000,
    commissionRate: 0.08,
    bankAccount: {
      bank: '001 - Banco do Brasil',
      agency: '1502-4',
      account: '88291-0',
      pixKey: '12.345.678/0001-90'
    }
  },
  {
    id: 'prod-2',
    name: 'Live Nation Brasil',
    cnpj: '98.765.432/0001-11',
    email: 'operacoes.br@livenation.com',
    phone: '(11) 3045-8000',
    status: 'active',
    totalEvents: 8,
    totalRevenue: 9240000,
    availableBalance: 1450000,
    pendingBalance: 590000,
    blockedBalance: 0,
    commissionRate: 0.065,
    bankAccount: {
      bank: '341 - Itaú Unibanco',
      agency: '0300',
      account: '45910-2',
      pixKey: 'operacoes.br@livenation.com'
    }
  },
  {
    id: 'prod-3',
    name: 'CWB Brasil Produções',
    cnpj: '45.123.890/0001-55',
    email: 'contato@cwbbrasil.com.br',
    phone: '(41) 3051-7700',
    status: 'active',
    totalEvents: 19,
    totalRevenue: 3120000,
    availableBalance: 412000,
    pendingBalance: 180000,
    blockedBalance: 12000,
    commissionRate: 0.085,
    bankAccount: {
      bank: '033 - Santander',
      agency: '4012',
      account: '1300984-1',
      pixKey: 'financeiro@cwbbrasil.com.br'
    }
  },
  {
    id: 'prod-4',
    name: 'Planeta Entretenimento',
    cnpj: '71.234.901/0001-33',
    email: 'eventos@planetaentretenimento.com.br',
    phone: '(31) 3280-4500',
    status: 'active',
    totalEvents: 6,
    totalRevenue: 1980000,
    availableBalance: 295000,
    pendingBalance: 115000,
    blockedBalance: 0,
    commissionRate: 0.09,
    bankAccount: {
      bank: '260 - Nu Pagamentos',
      agency: '0001',
      account: '9928103-8',
      pixKey: '71.234.901/0001-33'
    }
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-101',
    producerId: 'prod-1',
    producerName: 'Opus Entretenimento',
    title: 'Festival de Inverno Curitiba 2026',
    category: 'Festival',
    venue: 'Pedreira Paulo Leminski',
    city: 'Curitiba',
    state: 'PR',
    date: '2026-07-18',
    doorsOpen: '14:00',
    status: 'in_operation',
    totalCapacity: 25000,
    ticketsSold: 21850,
    grossRevenue: 3714500,
    netRevenue: 3417340,
    checkInCount: 14200,
    sectors: [
      { id: 'sec-1', name: 'Pista Premium', capacity: 6000, sold: 5890, price: 340, batch: 3 },
      { id: 'sec-2', name: 'Pista Comum', capacity: 15000, sold: 13200, price: 180, batch: 2 },
      { id: 'sec-3', name: 'Camarote Open Bar', capacity: 4000, sold: 2760, price: 580, batch: 3 }
    ],
    activeIncidentCount: 2,
    hasDivergence: false
  },
  {
    id: 'evt-102',
    producerId: 'prod-2',
    producerName: 'Live Nation Brasil',
    title: 'Coldplay Experience World Tour',
    category: 'Show',
    venue: 'Estádio Couto Pereira',
    city: 'Curitiba',
    state: 'PR',
    date: '2026-09-24',
    doorsOpen: '16:00',
    status: 'on_sale',
    totalCapacity: 42000,
    ticketsSold: 38900,
    grossRevenue: 8558000,
    netRevenue: 8001730,
    checkInCount: 0,
    sectors: [
      { id: 'sec-4', name: 'Pista Premium A', capacity: 10000, sold: 10000, price: 420, batch: 3 },
      { id: 'sec-5', name: 'Cadeira Inferior', capacity: 16000, sold: 15200, price: 290, batch: 2 },
      { id: 'sec-6', name: 'Arquibancada', capacity: 16000, sold: 13700, price: 160, batch: 2 }
    ],
    activeIncidentCount: 0,
    hasDivergence: false
  },
  {
    id: 'evt-103',
    producerId: 'prod-3',
    producerName: 'CWB Brasil Produções',
    title: 'Stand-Up Comedy Stars: Noite de Gala',
    category: 'Teatro',
    venue: 'Teatro Guaíra',
    city: 'Curitiba',
    state: 'PR',
    date: '2026-04-12',
    doorsOpen: '19:30',
    status: 'on_sale',
    totalCapacity: 2100,
    ticketsSold: 1840,
    grossRevenue: 276000,
    netRevenue: 252540,
    checkInCount: 0,
    sectors: [
      { id: 'sec-7', name: 'Platéia A', capacity: 800, sold: 800, price: 180, batch: 2 },
      { id: 'sec-8', name: 'Platéia B', capacity: 700, sold: 640, price: 140, batch: 2 },
      { id: 'sec-9', name: 'Balcão', capacity: 600, sold: 400, price: 90, batch: 1 }
    ],
    activeIncidentCount: 1,
    hasDivergence: true
  },
  {
    id: 'evt-104',
    producerId: 'prod-4',
    producerName: 'Planeta Entretenimento',
    title: 'Summit Nacional de Inovação & IA 2026',
    category: 'Congresso',
    venue: 'Viasoft Experience',
    city: 'Curitiba',
    state: 'PR',
    date: '2026-05-20',
    doorsOpen: '08:00',
    status: 'published',
    totalCapacity: 3500,
    ticketsSold: 1450,
    grossRevenue: 986000,
    netRevenue: 897260,
    checkInCount: 0,
    sectors: [
      { id: 'sec-10', name: 'Pass VIP All-Access', capacity: 500, sold: 480, price: 1200, batch: 2 },
      { id: 'sec-11', name: 'Pass Congresso 2 Dias', capacity: 3000, sold: 970, price: 580, batch: 1 }
    ],
    activeIncidentCount: 0,
    hasDivergence: false
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Carolina Mendes de Albuquerque',
    cpf: '042.889.319-45',
    email: 'carolina.mendes@gmail.com',
    phone: '(41) 99871-4422',
    city: 'Curitiba',
    state: 'PR',
    totalOrders: 6,
    totalSpent: 3420,
    createdAt: '2024-02-11',
    isBlacklisted: false
  },
  {
    id: 'cust-2',
    name: 'Rodrigo Silveira Ramos',
    cpf: '812.304.779-88',
    email: 'rodrigo.ramos@outlook.com',
    phone: '(41) 98845-1290',
    city: 'São José dos Pinhais',
    state: 'PR',
    totalOrders: 3,
    totalSpent: 1280,
    createdAt: '2024-08-19',
    isBlacklisted: false
  },
  {
    id: 'cust-3',
    name: 'Mariana Castro Fagundes',
    cpf: '556.120.949-01',
    email: 'mariana.castro@yahoo.com.br',
    phone: '(41) 99120-7733',
    city: 'Curitiba',
    state: 'PR',
    totalOrders: 9,
    totalSpent: 5120,
    createdAt: '2023-11-04',
    isBlacklisted: false
  },
  {
    id: 'cust-4',
    name: 'Lucas Zanetti Ferrari',
    cpf: '109.843.519-72',
    email: 'lucas.ferrari@corpmail.com',
    phone: '(11) 97621-9988',
    city: 'São Paulo',
    state: 'SP',
    totalOrders: 2,
    totalSpent: 2400,
    createdAt: '2025-01-15',
    isBlacklisted: false
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'DK-98421',
    producerId: 'prod-1',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    customerId: 'cust-1',
    customerName: 'Carolina Mendes de Albuquerque',
    customerCpf: '042.889.319-45',
    customerEmail: 'carolina.mendes@gmail.com',
    itemsCount: 2,
    grossAmount: 680,
    serviceFee: 68,
    totalAmount: 748,
    status: 'paid',
    paymentMethod: 'credit_card',
    createdAt: '2026-09-18T14:22:10-03:00',
    marketingSource: {
      utmSource: 'instagram',
      utmCampaign: 'inverno_lote3_curitiba',
      adPlatform: 'meta'
    },
    payment: {
      id: 'pay-1',
      orderId: 'ord-1',
      gateway: 'Cielo',
      gatewayTransactionId: 'CIE-99841289',
      method: 'credit_card',
      amount: 748,
      netAmount: 722.57,
      gatewayFee: 25.43,
      diskFee: 68,
      installments: 3,
      cardLast4: '4489',
      cardBrand: 'Mastercard',
      paidAt: '2026-09-18T14:23:01-03:00',
      status: 'settled'
    },
    tickets: [
      {
        id: 'tkt-1',
        ticketCode: 'TKT-98421-01',
        orderId: 'ord-1',
        eventId: 'evt-101',
        eventName: 'Festival de Inverno Curitiba 2026',
        sectorName: 'Pista Premium',
        customerName: 'Carolina Mendes de Albuquerque',
        customerCpf: '042.889.319-45',
        nominalAttendee: 'Carolina Mendes de Albuquerque',
        price: 340,
        fee: 34,
        status: 'valid',
        qrCode: 'QR-DK-98421-01-SEC1'
      },
      {
        id: 'tkt-2',
        ticketCode: 'TKT-98421-02',
        orderId: 'ord-1',
        eventId: 'evt-101',
        eventName: 'Festival de Inverno Curitiba 2026',
        sectorName: 'Pista Premium',
        customerName: 'Carolina Mendes de Albuquerque',
        customerCpf: '042.889.319-45',
        nominalAttendee: 'Beatriz Mendes',
        price: 340,
        fee: 34,
        status: 'valid',
        qrCode: 'QR-DK-98421-02-SEC1'
      }
    ]
  },
  {
    id: 'ord-2',
    orderNumber: 'DK-98422',
    producerId: 'prod-2',
    eventId: 'evt-102',
    eventName: 'Coldplay Experience World Tour',
    customerId: 'cust-2',
    customerName: 'Rodrigo Silveira Ramos',
    customerCpf: '812.304.779-88',
    customerEmail: 'rodrigo.ramos@outlook.com',
    itemsCount: 1,
    grossAmount: 420,
    serviceFee: 42,
    totalAmount: 462,
    status: 'paid',
    paymentMethod: 'pix',
    createdAt: '2026-09-18T15:10:40-03:00',
    marketingSource: {
      utmSource: 'google_search',
      utmCampaign: 'coldplay_couto_pereira',
      adPlatform: 'google'
    },
    payment: {
      id: 'pay-2',
      orderId: 'ord-2',
      gateway: 'PIX_BancoCentral',
      gatewayTransactionId: 'E98712389172638712638',
      method: 'pix',
      amount: 462,
      netAmount: 460.05,
      gatewayFee: 1.95,
      diskFee: 42,
      installments: 1,
      paidAt: '2026-09-18T15:11:15-03:00',
      status: 'settled'
    },
    tickets: [
      {
        id: 'tkt-3',
        ticketCode: 'TKT-98422-01',
        orderId: 'ord-2',
        eventId: 'evt-102',
        eventName: 'Coldplay Experience World Tour',
        sectorName: 'Pista Premium A',
        customerName: 'Rodrigo Silveira Ramos',
        customerCpf: '812.304.779-88',
        nominalAttendee: 'Rodrigo Silveira Ramos',
        price: 420,
        fee: 42,
        status: 'valid',
        qrCode: 'QR-DK-98422-01-SEC4'
      }
    ]
  },
  {
    id: 'ord-3',
    orderNumber: 'DK-98420',
    producerId: 'prod-3',
    eventId: 'evt-103',
    eventName: 'Stand-Up Comedy Stars: Noite de Gala',
    customerId: 'cust-3',
    customerName: 'Mariana Castro Fagundes',
    customerCpf: '556.120.949-01',
    customerEmail: 'mariana.castro@yahoo.com.br',
    itemsCount: 2,
    grossAmount: 280,
    serviceFee: 28,
    totalAmount: 308,
    status: 'paid',
    paymentMethod: 'credit_card',
    createdAt: '2026-09-18T11:45:00-03:00',
    payment: {
      id: 'pay-3',
      orderId: 'ord-3',
      gateway: 'Rede',
      gatewayTransactionId: 'RED-8827101',
      method: 'credit_card',
      amount: 308,
      netAmount: 298.45,
      gatewayFee: 9.55,
      diskFee: 28,
      installments: 2,
      cardLast4: '9012',
      cardBrand: 'Visa',
      paidAt: '2026-09-18T11:46:12-03:00',
      status: 'settled'
    },
    tickets: [
      {
        id: 'tkt-4',
        ticketCode: 'TKT-98420-01',
        orderId: 'ord-3',
        eventId: 'evt-103',
        eventName: 'Stand-Up Comedy Stars: Noite de Gala',
        sectorName: 'Platéia B',
        customerName: 'Mariana Castro Fagundes',
        customerCpf: '556.120.949-01',
        nominalAttendee: 'Mariana Castro Fagundes',
        price: 140,
        fee: 14,
        status: 'valid',
        qrCode: 'QR-DK-98420-01-SEC8'
      },
      {
        id: 'tkt-5',
        ticketCode: 'TKT-98420-02',
        orderId: 'ord-3',
        eventId: 'evt-103',
        eventName: 'Stand-Up Comedy Stars: Noite de Gala',
        sectorName: 'Platéia B',
        customerName: 'Mariana Castro Fagundes',
        customerCpf: '556.120.949-01',
        nominalAttendee: 'Felipe Fagundes',
        price: 140,
        fee: 14,
        status: 'valid',
        qrCode: 'QR-DK-98420-02-SEC8'
      }
    ]
  }
];

export const INITIAL_REFUNDS: RefundRequest[] = [
  {
    id: 'ref-1',
    orderId: 'ord-109',
    orderNumber: 'DK-98399',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    customerName: 'Felipe Antunes Barreto',
    customerCpf: '019.283.471-12',
    type: 'total',
    amount: 374,
    reason: 'arrependimento_7d',
    reasonDescription: 'Cliente solicitou cancelamento dentro do prazo legal de 7 dias via SAC.',
    status: 'pending_approval',
    requestedAt: '2026-09-18T13:15:00-03:00',
    requestedBy: 'Ana Paula (Operador SAC)',
    ticketsToCancel: ['tkt-98399-01']
  },
  {
    id: 'ref-2',
    orderId: 'ord-105',
    orderNumber: 'DK-98340',
    eventId: 'evt-103',
    eventName: 'Stand-Up Comedy Stars: Noite de Gala',
    customerName: 'Camila Guimarães',
    customerCpf: '332.190.871-66',
    type: 'partial',
    amount: 154,
    reason: 'duplicidade',
    reasonDescription: 'Compra em duplicidade pelo mesmo CPF; solicita estorno de 1 dos 2 ingressos.',
    status: 'pending_approval',
    requestedAt: '2026-09-18T10:40:00-03:00',
    requestedBy: 'Marcos Vinicius (Operador SAC)',
    ticketsToCancel: ['tkt-98340-02']
  },
  {
    id: 'ref-3',
    orderId: 'ord-098',
    orderNumber: 'DK-98210',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    customerName: 'Guilherme Sampaio',
    customerCpf: '887.210.992-00',
    type: 'total',
    amount: 580,
    reason: 'solicitacao_judicial',
    reasonDescription: 'Reversão de Chargeback via Notificação Bancária Cielo.',
    status: 'approved',
    requestedAt: '2026-09-17T16:00:00-03:00',
    processedAt: '2026-09-17T17:30:00-03:00',
    requestedBy: 'Sistema AntiFraude',
    approvedBy: 'Carlos Eduardo (Diretoria Financeira)',
    ticketsToCancel: ['tkt-98210-01']
  }
];

export const INITIAL_PAYOUTS: Payout[] = [
  {
    id: 'pay-sch-1',
    producerId: 'prod-1',
    producerName: 'Opus Entretenimento',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    amount: 280000,
    status: 'scheduled',
    scheduledDate: '2026-09-21',
    bankInfo: 'Banco do Brasil - Ag 1502-4 CC 88291-0',
    auditApprovalBy: 'Diretoria Financeira'
  },
  {
    id: 'pay-sch-2',
    producerId: 'prod-2',
    producerName: 'Live Nation Brasil',
    eventId: 'evt-102',
    eventName: 'Coldplay Experience World Tour',
    amount: 190000,
    status: 'scheduled',
    scheduledDate: '2026-09-22',
    bankInfo: 'Itaú Unibanco - Ag 0300 CC 45910-2',
    auditApprovalBy: 'Diretoria Financeira'
  },
  {
    id: 'pay-sch-3',
    producerId: 'prod-3',
    producerName: 'CWB Brasil Produções',
    eventId: 'evt-103',
    eventName: 'Stand-Up Comedy Stars: Noite de Gala',
    amount: 122000,
    status: 'processing',
    scheduledDate: '2026-09-18',
    bankInfo: 'Santander - Ag 4012 CC 1300984-1',
    auditApprovalBy: 'Diretoria Financeira'
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    title: 'Catraca 04 Portão B com falha de leitura óptica',
    category: 'catraca',
    severity: 'high',
    status: 'in_investigation',
    reportedAt: '2026-09-18T15:40:00-03:00',
    reportedBy: 'Equipe de Portaria Pedreira',
    description: 'Leitor óptico não reconhece QR codes em telas de OLED com alto brilho. Técnico acionado.',
    slaMinutes: 15
  },
  {
    id: 'inc-2',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    title: 'Tentativa de reutilização de ingresso nominal TKT-98101',
    category: 'ingresso_falso',
    severity: 'medium',
    status: 'open',
    reportedAt: '2026-09-18T16:02:00-03:00',
    reportedBy: 'Fiscal de Acesso Portão A',
    description: 'Ingresso já constava como validado às 14:45. Cliente retido para averiguação no posto SAC.',
    slaMinutes: 30
  }
];

export const INITIAL_SAC_TICKETS: SacTicket[] = [
  {
    id: 'sac-1',
    ticketNumber: 'SAC-88190',
    customerId: 'cust-1',
    customerName: 'Carolina Mendes de Albuquerque',
    customerEmail: 'carolina.mendes@gmail.com',
    orderNumber: 'DK-98421',
    channel: 'whatsapp',
    subject: 'Dúvida sobre alteração de titularidade do ingresso',
    status: 'resolved',
    priority: 'normal',
    createdAt: '2026-09-18T14:35:00-03:00',
    updatedAt: '2026-09-18T14:48:00-03:00',
    agentName: 'Juliana Paes',
    csatRating: 5
  },
  {
    id: 'sac-2',
    ticketNumber: 'SAC-88191',
    customerId: 'cust-4',
    customerName: 'Lucas Zanetti Ferrari',
    customerEmail: 'lucas.ferrari@corpmail.com',
    channel: 'chat',
    subject: 'Não recebeu e-mail com voucher de confirmação',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-09-18T15:55:00-03:00',
    updatedAt: '2026-09-18T16:05:00-03:00',
    agentName: 'Rodrigo Santoro'
  }
];

export const INITIAL_ACCOUNTING_ENTRIES: AccountingEntry[] = [
  {
    id: 'acc-1',
    entryNumber: 'LAN-2026-0918-001',
    date: '2026-09-18',
    orderId: 'ord-1',
    eventId: 'evt-101',
    debitAccount: '1.1.2.01 - Gateways a Receber (Cielo)',
    creditAccount: '2.1.3.01 - Obrigações com Produtores (Opus)',
    amount: 680,
    description: 'Venda de ingressos Pedido DK-98421 - Festival de Inverno',
    status: 'posted'
  },
  {
    id: 'acc-2',
    entryNumber: 'LAN-2026-0918-002',
    date: '2026-09-18',
    orderId: 'ord-1',
    eventId: 'evt-101',
    debitAccount: '1.1.2.01 - Gateways a Receber (Cielo)',
    creditAccount: '3.1.1.01 - Receita com Taxa de Conveniência',
    amount: 68,
    description: 'Taxa de serviço apurada Pedido DK-98421',
    status: 'posted'
  },
  {
    id: 'acc-3',
    entryNumber: 'LAN-2026-0918-003',
    date: '2026-09-18',
    orderId: 'ord-2',
    eventId: 'evt-102',
    debitAccount: '1.1.1.05 - Banco Santander Conta PIX',
    creditAccount: '2.1.3.01 - Obrigações com Produtores (Live Nation)',
    amount: 420,
    description: 'Venda de ingressos PIX Pedido DK-98422 - Coldplay',
    status: 'posted'
  }
];

export const INITIAL_MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-1',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    platform: 'meta',
    campaignName: 'Inverno 2026 - Retargeting Carrinho & Lookalike',
    spend: 18450,
    clicks: 14200,
    impressions: 489000,
    conversions: 840,
    attributedRevenue: 285600,
    roas: 15.48,
    cpa: 21.96,
    status: 'active'
  },
  {
    id: 'camp-2',
    eventId: 'evt-102',
    eventName: 'Coldplay Experience World Tour',
    platform: 'google',
    campaignName: 'Coldplay BR - Rede de Pesquisa Oficial',
    spend: 29000,
    clicks: 38900,
    impressions: 610000,
    conversions: 2100,
    attributedRevenue: 882000,
    roas: 30.41,
    cpa: 13.80,
    status: 'active'
  },
  {
    id: 'camp-3',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    platform: 'tiktok',
    campaignName: 'Lineup Reveal & Shorts Viral',
    spend: 8500,
    clicks: 9400,
    impressions: 780000,
    conversions: 290,
    attributedRevenue: 98600,
    roas: 11.60,
    cpa: 29.31,
    status: 'active'
  },
  {
    id: 'camp-4',
    eventId: 'evt-103',
    eventName: 'Stand-Up Comedy Stars: Noite de Gala',
    platform: 'spotify',
    campaignName: 'Áudio Podcasters Curitiba Geo-Targeted',
    spend: 3200,
    clicks: 1800,
    impressions: 140000,
    conversions: 145,
    attributedRevenue: 21750,
    roas: 6.80,
    cpa: 22.06,
    status: 'active'
  }
];

export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: 'cart-1',
    eventId: 'evt-101',
    eventName: 'Festival de Inverno Curitiba 2026',
    customerName: 'Tatiane Cristina Moreira',
    customerPhone: '(41) 98765-1122',
    customerEmail: 'tatiane.moreira@gmail.com',
    ticketCount: 2,
    totalValue: 680,
    abandonedAt: '2026-09-18T14:50:00-03:00',
    status: 'in_journey',
    recoveryChannel: 'whatsapp'
  },
  {
    id: 'cart-2',
    eventId: 'evt-102',
    eventName: 'Coldplay Experience World Tour',
    customerName: 'Bernardo Silveira',
    customerPhone: '(11) 99182-4400',
    customerEmail: 'bernardo.silv@uol.com.br',
    ticketCount: 4,
    totalValue: 1680,
    abandonedAt: '2026-09-18T13:20:00-03:00',
    status: 'recovered',
    recoveryChannel: 'whatsapp',
    recoveredAt: '2026-09-18T13:38:00-03:00'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-18T14:23:01-03:00',
    userId: 'usr-gateway',
    userName: 'Gateway Cielo Auto-Settlement',
    action: 'CONFIRMAÇÃO_PAGAMENTO',
    module: 'CORE',
    entityType: 'ORDER',
    entityId: 'ord-1',
    details: 'Pedido DK-98421 aprovado. Disparado webhook para emissão de 2 ingressos e crédito de R$ 680,00 na conta do produtor Opus.',
    ipAddress: '177.12.98.4',
    impactCascade: ['EVENTOS: +2 ingressos', 'FINANCEIRO: Saldo atualizado', 'COMERCIAL: Meta +R$ 680', 'MARKETING: Meta Ads ROAS recalculado']
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-18T13:15:00-03:00',
    userId: 'usr-sac-01',
    userName: 'Ana Paula (Operador SAC)',
    action: 'SOLICITACAO_ESTORNO',
    module: 'ESTORNO',
    entityType: 'REFUND',
    entityId: 'ref-1',
    details: 'Abertura de solicitação de estorno total para pedido DK-98399 (Arrependimento 7 dias). Ingressos marcados para bloqueio preventivo.',
    ipAddress: '189.44.120.19'
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-18T11:46:12-03:00',
    userId: 'usr-gateway',
    userName: 'Gateway Rede',
    action: 'CONFIRMAÇÃO_PAGAMENTO',
    module: 'CORE',
    entityType: 'ORDER',
    entityId: 'ord-3',
    details: 'Pedido DK-98420 liquidado com sucesso. Crédito no saldo do evento Stand-Up Comedy.',
    ipAddress: '186.204.11.89'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Nova Venda em Lote Premium',
    description: 'Pedido DK-98421 (2x Pista Premium) aprovado para Festival de Inverno.',
    type: 'sale',
    severity: 'success',
    timestamp: '2026-09-18T14:23:01-03:00',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Catraca 04 com Alerta de Lentidão',
    description: 'Fila detectada no Portão B da Pedreira Paulo Leminski. 15min SLA.',
    type: 'incident',
    severity: 'warning',
    timestamp: '2026-09-18T15:40:00-03:00',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Solicitação de Estorno Pendente',
    description: 'Pedido DK-98399 aguarda aprovação da gerência financeira.',
    type: 'refund',
    severity: 'warning',
    timestamp: '2026-09-18T13:15:00-03:00',
    read: false
  },
  {
    id: 'notif-4',
    title: 'Repasse Agendado Hoje',
    description: 'CWB Brasil Produções tem repasse de R$ 122.000,00 programado.',
    type: 'payout',
    severity: 'info',
    timestamp: '2026-09-18T09:00:00-03:00',
    read: true
  }
];
