import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RotateCcw,
  Sparkles,
  Send,
  Phone,
  Mail,
  Headphones,
  Filter,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
  Layers,
  Check,
  ShoppingBag
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';
import { CustomerDossierModal } from './CustomerDossierModal';
import { NewSacTicketModal } from './NewSacTicketModal';
import { SacTicketDetailModal } from './SacTicketDetailModal';
import { OrderDossierModal } from '../../features/commercial/orders/OrderDossierModal';
import { SacApi } from '../../features/sac/api/sac.api';

interface SacDashboardProps {
  initialSubItem?: string;
  onNavigateToRefunds?: () => void;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const SacDashboard: React.FC<SacDashboardProps> = ({
  initialSubItem = 'sac-dashboard',
  onNavigateToRefunds,
  onNavigate
}) => {
  const { orders, customers, sacTickets, createRefundRequest } = useCoreData();
  const tickets = orders.flatMap(o =>
    (o.tickets || []).map((t: any) => ({
      ...t,
      orderId: o.id,
      customerName: o.customerName
    }))
  );

  // Active view state
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubItem || 'sac-dashboard');

  useEffect(() => {
    if (initialSubItem) {
      setActiveSubTab(initialSubItem);
    }
  }, [initialSubItem]);

  // Central de Consulta Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('ALL');

  // Modals state
  const [dossierCustomer, setDossierCustomer] = useState<any | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketTargetCustomer, setNewTicketTargetCustomer] = useState<any | null>(null);
  const [newTicketTargetOrder, setNewTicketTargetOrder] = useState<any | null>(null);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<any | null>(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [selectedOrderForDossier, setSelectedOrderForDossier] = useState<any | null>(null);
  const [isOrderDossierOpen, setIsOrderDossierOpen] = useState(false);

  // Local SAC tickets store for real-time reactivity
  const [localTickets, setLocalTickets] = useState<any[]>([
    {
      id: 'sac-1001',
      ticketCode: 'SAC-2026-001001',
      customerId: customers[0]?.id || 'cust-1',
      customerName: customers[0]?.name || 'Maria Oliveira',
      orderId: orders[0]?.id || 'ord-1',
      orderNumber: orders[0]?.orderNumber || 'DK-984521',
      eventName: orders[0]?.eventName || 'Festival Curitiba 2026',
      channel: 'WHATSAPP',
      subject: 'Dúvida sobre emissão de voucher e QR Code no e-mail',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      queue: 'Atendimento Geral',
      agentName: 'Carlos Lima',
      agentUserId: 'usr-1',
      slaMinutesRemaining: 42,
      slaBreached: false,
      slaPaused: false,
      messages: [
        {
          id: 'msg-1',
          type: 'CUSTOMER',
          authorName: customers[0]?.name || 'Maria Oliveira',
          content: 'Olá! Comprei o ingresso ontem via PIX mas não recebi a confirmação no meu e-mail.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg-2',
          type: 'AGENT',
          authorName: 'Carlos Lima',
          content: 'Olá! Localizei seu pedido DK-984521. A transação foi aprovada e vou reenviar os ingressos para seu e-mail.',
          createdAt: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: 'msg-3',
          type: 'INTERNAL_NOTE',
          authorName: 'Carlos Lima',
          content: 'Reemissão de voucher solicitada com sucesso. Pedido regular.',
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'sac-1002',
      ticketCode: 'SAC-2026-001002',
      customerId: customers[1]?.id || 'cust-2',
      customerName: customers[1]?.name || 'João da Silva',
      orderId: orders[1]?.id || 'ord-2',
      orderNumber: orders[1]?.orderNumber || 'DK-984522',
      eventName: orders[1]?.eventName || 'Coldplay World Tour Curitiba',
      channel: 'EMAIL',
      subject: 'Solicitação de cancelamento e estorno por arrependimento',
      status: 'WAITING_CUSTOMER',
      priority: 'HIGH',
      queue: 'Estorno & Reembolso',
      agentName: 'Ana Souza',
      agentUserId: 'usr-2',
      slaMinutesRemaining: 55,
      slaBreached: false,
      slaPaused: true,
      messages: [
        {
          id: 'msg-10',
          type: 'CUSTOMER',
          authorName: customers[1]?.name || 'João da Silva',
          content: 'Gostaria de solicitar o estorno do meu pedido realizado hoje.',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'msg-11',
          type: 'AGENT',
          authorName: 'Ana Souza',
          content: 'Recebemos sua solicitação dentro do prazo de 7 dias. Por favor confirme os últimos 4 dígitos do seu CPF.',
          createdAt: new Date(Date.now() - 5400000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 5400000).toISOString()
    }
  ]);

  // Load real tickets and metrics from backend /api/v1/sac
  const [backendMetrics, setBackendMetrics] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSacData() {
      try {
        const [ticketsRes, metricsRes] = await Promise.allSettled([
          SacApi.getTickets(),
          SacApi.getMetrics()
        ]);
        if (isMounted) {
          if (ticketsRes.status === 'fulfilled' && ticketsRes.value?.tickets?.length > 0) {
            setLocalTickets(ticketsRes.value.tickets);
          }
          if (metricsRes.status === 'fulfilled') {
            setBackendMetrics(metricsRes.value);
          }
        }
      } catch (err) {
        console.warn('[SAC] Backend load fallback:', err);
      }
    }
    loadSacData();
    return () => { isMounted = false; };
  }, []);

  // Central de Consulta: Filter customers, orders, tickets by search query
  const cleanDigits = searchQuery.replace(/\D/g, '');
  const searchLower = searchQuery.toLowerCase().trim();

  const matchedCustomers = customers.filter(c => {
    if (!searchLower) return true;
    const nameMatch = c.name?.toLowerCase().includes(searchLower);
    const emailMatch = c.email?.toLowerCase().includes(searchLower);
    const cpfMatch = cleanDigits.length >= 4 && c.cpf?.replace(/\D/g, '').includes(cleanDigits);
    const phoneMatch = cleanDigits.length >= 4 && c.phone?.replace(/\D/g, '').includes(cleanDigits);
    return nameMatch || emailMatch || cpfMatch || phoneMatch;
  });

  const matchedOrders = orders.filter(o => {
    if (!searchLower) return true;
    const orderMatch = o.orderNumber?.toLowerCase().includes(searchLower);
    const nameMatch = o.customerName?.toLowerCase().includes(searchLower);
    const cpfMatch = cleanDigits.length >= 4 && o.customerCpf?.replace(/\D/g, '').includes(cleanDigits);
    return orderMatch || nameMatch || cpfMatch;
  });

  // Filter local tickets for queue tab
  const filteredTickets = localTickets.filter(t => {
    if (selectedQueueFilter !== 'ALL' && t.queue !== selectedQueueFilter) return false;
    if (selectedStatusFilter !== 'ALL' && t.status !== selectedStatusFilter) return false;
    if (selectedChannelFilter !== 'ALL' && t.channel !== selectedChannelFilter) return false;
    if (searchLower) {
      return (
        t.ticketCode.toLowerCase().includes(searchLower) ||
        t.customerName.toLowerCase().includes(searchLower) ||
        t.subject.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Handlers
  const handleOpenCustomerDossier = (cust: any) => {
    setDossierCustomer(cust);
    setIsDossierOpen(true);
  };

  const handleOpenNewTicketModal = (cust?: any, order?: any) => {
    setNewTicketTargetCustomer(cust || null);
    setNewTicketTargetOrder(order || null);
    setIsNewTicketOpen(true);
  };

  const handleCreateTicket = async (data: any) => {
    const cust = customers.find(c => c.id === data.customerId) || newTicketTargetCustomer;
    const order = orders.find(o => o.id === data.orderId) || newTicketTargetOrder;
    
    try {
      const created = await SacApi.createTicket({
        customerId: data.customerId || cust?.id || 'cust-1',
        customerName: cust ? cust.name : 'Consumidor',
        orderId: data.orderId || order?.id,
        orderNumber: order ? order.orderNumber : undefined,
        eventName: order ? order.eventName : undefined,
        producerId: order ? order.producerId : undefined,
        channel: data.channel,
        subject: data.subject,
        priority: data.priority,
        queue: data.queue,
        initialMessage: data.initialMessage
      });
      setLocalTickets(prev => [created, ...prev]);
    } catch (err) {
      console.warn('[SAC] Fallback to in-memory ticket creation:', err);
      const newCode = `SAC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const newTicket = {
        id: `sac-${Date.now()}`,
        ticketCode: newCode,
        customerId: data.customerId,
        customerName: cust ? cust.name : 'Consumidor',
        orderId: data.orderId,
        orderNumber: order ? order.orderNumber : undefined,
        eventName: order ? order.eventName : undefined,
        channel: data.channel,
        subject: data.subject,
        status: 'OPEN',
        priority: data.priority,
        queue: data.queue,
        agentName: 'Atendente SAC',
        slaMinutesRemaining: data.priority === 'URGENT' ? 30 : data.priority === 'HIGH' ? 60 : 120,
        slaBreached: false,
        slaPaused: false,
        messages: [
          {
            id: `msg-${Date.now()}`,
            type: 'CUSTOMER',
            authorName: cust ? cust.name : 'Consumidor',
            content: data.initialMessage,
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setLocalTickets(prev => [newTicket, ...prev]);
    }
  };

  const handleAddMessageToTicket = async (ticketId: string, type: 'AGENT' | 'INTERNAL_NOTE', content: string) => {
    // Optimistic local update
    setLocalTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            type,
            authorName: type === 'AGENT' ? 'Atendente SAC' : 'Nota da Equipe',
            content,
            createdAt: new Date().toISOString()
          };
          return {
            ...t,
            messages: [...(t.messages || []), newMsg],
            updatedAt: new Date().toISOString(),
            status: t.status === 'WAITING_CUSTOMER' && type === 'AGENT' ? 'IN_PROGRESS' : t.status
          };
        }
        return t;
      })
    );

    // Also update selected ticket
    setSelectedTicketForDetail((prev: any) => {
      if (prev && prev.id === ticketId) {
        return {
          ...prev,
          messages: [
            ...(prev.messages || []),
            {
              id: `msg-${Date.now()}`,
              type,
              authorName: type === 'AGENT' ? 'Atendente SAC' : 'Nota da Equipe',
              content,
              createdAt: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return prev;
    });

    try {
      await SacApi.addMessage(ticketId, { type, content });
    } catch (err) {
      console.warn('[SAC] Real addMessage dispatch failed, kept local:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    setLocalTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status,
            slaPaused: status === 'WAITING_CUSTOMER',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );

    setSelectedTicketForDetail((prev: any) => {
      if (prev && prev.id === ticketId) {
        return {
          ...prev,
          status,
          slaPaused: status === 'WAITING_CUSTOMER',
          updatedAt: new Date().toISOString()
        };
      }
      return prev;
    });

    try {
      await SacApi.updateStatus(ticketId, status as any);
    } catch (err) {
      console.warn('[SAC] Real updateStatus dispatch failed, kept local:', err);
    }
  };

  const handleRequestRefundFromOrder = (order: any) => {
    createRefundRequest({
      orderId: order.id,
      reason: 'arrependimento_7d',
      description: `Abertura de estorno iniciada via Central de Atendimento SAC para pedido ${order.orderNumber}.`,
      type: 'total',
      requesterName: 'Atendente SAC'
    });
    alert(`Solicitação de estorno gerada com sucesso e enviada ao módulo Estorno para análise!`);
    if (onNavigateToRefunds) {
      onNavigateToRefunds();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              ATENDIMENTO SAC
            </h1>
            <span className="rounded bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700 border border-orange-200">
              Operação ao Consumidor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central operacional de suporte ao comprador, consulta unificada de pedidos, ingressos e gestão de protocolos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleOpenNewTicketModal()}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Novo Atendimento
          </Button>
        </div>
      </div>

      {/* Operational Subnavigation Tabs */}
      <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-1 rounded-xl text-xs font-semibold overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveSubTab('sac-dashboard')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'sac-dashboard'
              ? 'bg-orange-500 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveSubTab('sac-query-center')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'sac-query-center'
              ? 'bg-orange-500 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Central de Consulta
        </button>
        <button
          onClick={() => setActiveSubTab('sac-queue')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'sac-queue'
              ? 'bg-orange-500 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          Fila de Atendimento ({localTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length})
        </button>
        <button
          onClick={() => setActiveSubTab('sac-customers')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'sac-customers'
              ? 'bg-orange-500 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Clientes & Ingressos ({customers.length})
        </button>
      </div>

      {/* VIEW 1: VISÃO GERAL */}
      {activeSubTab === 'sac-dashboard' && (
        <div className="space-y-6">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="ATENDIMENTOS ABERTOS"
              value={localTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length.toString()}
              icon={<MessageSquare className="h-4 w-4 text-orange-500" />}
              badge="Tempo Real"
              badgeVariant="orange"
            />
            <StatCard
              title="EM ANDAMENTO"
              value={localTickets.filter(t => t.status === 'IN_PROGRESS').length.toString()}
              icon={<Clock className="h-4 w-4 text-cyan-500" />}
              badge="Ativos"
              badgeVariant="cyan"
            />
            <StatCard
              title="AGUARDANDO CLIENTE"
              value={localTickets.filter(t => t.status === 'WAITING_CUSTOMER').length.toString()}
              icon={<User className="h-4 w-4 text-amber-500" />}
              badge="SLA Pausado"
              badgeVariant="amber"
            />
            <StatCard
              title="RESOLVIDOS"
              value={localTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length.toString()}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              badge="Concluídos"
              badgeVariant="emerald"
            />
          </div>

          {/* Quick Query Search Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs text-slate-900 dark:text-white">
            <div className="max-w-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30">
                Atalho Central de Atendimento
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Localize rapidamente compradores, pedidos e ingressos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulte por CPF, nome, e-mail, telefone, código do pedido (DK-...) ou voucher para abrir a ficha consolidada.
              </p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="🔍 CPF, nome, telefone, e-mail, pedido ou ingresso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveSubTab('sac-query-center');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 font-mono transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => setActiveSubTab('sac-query-center')}
                icon={<Search className="w-3.5 h-3.5" />}
              >
                Pesquisar
              </Button>
            </div>
          </div>

          {/* Recent Tickets Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs space-y-3 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Atendimentos Recentes
              </h3>
              <button
                onClick={() => setActiveSubTab('sac-queue')}
                className="text-xs text-[#FF7A00] hover:underline font-semibold cursor-pointer"
              >
                Ver Fila Completa →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Código</th>
                    <th className="p-3 font-semibold">Comprador</th>
                    <th className="p-3 font-semibold">Assunto</th>
                    <th className="p-3 font-semibold">Canal</th>
                    <th className="p-3 font-semibold">Fila</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {localTickets.slice(0, 5).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#FF7A00]">{t.ticketCode}</td>
                      <td className="p-3 text-slate-900 dark:text-white font-medium">{t.customerName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 truncate max-w-[240px]">{t.subject}</td>
                      <td className="p-3 uppercase text-slate-500 dark:text-slate-400 text-[11px] font-mono">{t.channel}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{t.queue}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            t.status === 'RESOLVED' ? 'emerald' : t.status === 'WAITING_CUSTOMER' ? 'amber' : 'cyan'
                          }
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedTicketForDetail(t);
                            setIsTicketDetailOpen(true);
                          }}
                        >
                          Atender
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CENTRAL DE CONSULTA (A tela mais importante) */}
      {activeSubTab === 'sac-query-center' && (
        <div className="space-y-6">
          {/* Universal Search Bar */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 dark:bg-slate-800 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Central de Consulta de Compradores, Pedidos e Ingressos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digite CPF, nome, telefone, e-mail, número do pedido ou código do ingresso para investigação imediata.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="🔍 CPF, nome, telefone, e-mail, pedido ou ingresso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 font-mono transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Results Split: Customers vs Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Compradores Encontrados (Lista Não-Ambígua) */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 dark:text-white">
                  <User className="w-4 h-4 text-orange-500" />
                  Compradores ({matchedCustomers.length})
                </h3>
                <span className="text-[11px] text-slate-400">LGPD Minimizada</span>
              </div>

              {matchedCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
                  Nenhum comprador encontrado com o termo pesquisado.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto">
                  {matchedCustomers.map(c => {
                    const custOrders = orders.filter(o => o.customerId === c.id || o.customerCpf === c.cpf);
                    const rawCpf = c.cpf || '';
                    const maskedCpf = rawCpf.length >= 11 ? `***.${rawCpf.slice(3, 6)}.${rawCpf.slice(6, 9)}-**` : '***.***.***-**';

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-orange-500/50 transition-colors flex items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-700"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-xs dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 dark:text-slate-400">
                            <span>CPF: {maskedCpf}</span>
                            <span>•</span>
                            <span>{c.email}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                            <span>{custOrders.length} pedidos</span>
                            <span>•</span>
                            <span>{custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) > 0 ? formatCurrency(custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)) : 'R$ 0,00'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenCustomerDossier(c)}
                            icon={<ExternalLink className="w-3 h-3" />}
                          >
                            Abrir Ficha
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pedidos Encontrados */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 dark:text-white">
                  <ShoppingBag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Pedidos ({matchedOrders.length})
                </h3>
                <span className="text-[11px] text-slate-400">Origem: Comercial</span>
              </div>

              {matchedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
                  Nenhum pedido encontrado.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto">
                  {matchedOrders.map(o => (
                    <div
                      key={o.id}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-cyan-500/50 transition-colors flex items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-700"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs dark:text-white">{o.orderNumber}</span>
                          <Badge variant={o.status === 'paid' ? 'emerald' : 'rose'} size="sm">
                            {o.status?.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">• {o.paymentMethod?.toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-slate-800 font-medium dark:text-slate-200">{o.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[280px] dark:text-slate-400">{o.eventName}</div>
                        <div className="text-[11px] text-slate-900 font-mono font-bold pt-1 dark:text-white">
                          {formatCurrency(o.totalAmount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrderForDossier(o);
                            setIsOrderDossierOpen(true);
                          }}
                        >
                          Dossiê
                        </Button>
                        {o.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRequestRefundFromOrder(o)}
                            icon={<RotateCcw className="w-3 h-3" />}
                          >
                            Estorno
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: FILA DE ATENDIMENTO */}
      {activeSubTab === 'sac-queue' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedQueueFilter}
                onChange={(e) => setSelectedQueueFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="ALL">Todas as Filas</option>
                <option value="Atendimento Geral">Atendimento Geral</option>
                <option value="Pedidos & Pagamentos">Pedidos & Pagamentos</option>
                <option value="Ingressos & Credenciais">Ingressos & Credenciais</option>
                <option value="Estorno & Reembolso">Estorno & Reembolso</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Abertos</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="WAITING_CUSTOMER">Aguardando Cliente</option>
                <option value="RESOLVED">Resolvidos</option>
              </select>

              <select
                value={selectedChannelFilter}
                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="ALL">Todos os Canais</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-mail</option>
                <option value="CHAT">Chat</option>
                <option value="PHONE">Telefone</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar fila..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 dark:bg-slate-800 dark:border-slate-700">
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3 font-semibold">Código</th>
                    <th className="p-3 font-semibold">Comprador</th>
                    <th className="p-3 font-semibold">Assunto</th>
                    <th className="p-3 font-semibold">Canal</th>
                    <th className="p-3 font-semibold">Fila</th>
                    <th className="p-3 font-semibold">SLA</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        Nenhum atendimento corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-700/40">
                        <td className="p-3 font-mono font-bold text-[#FF7A00]">{t.ticketCode}</td>
                        <td className="p-3 text-slate-900 font-medium dark:text-white">{t.customerName}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[220px] dark:text-slate-300">{t.subject}</td>
                        <td className="p-3 uppercase text-slate-500 text-[11px] font-mono dark:text-slate-400">{t.channel}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{t.queue}</td>
                        <td className="p-3">
                          {t.slaPaused ? (
                            <span className="text-amber-600 font-semibold text-[10px] dark:text-amber-400">Pausado</span>
                          ) : (
                            <span className="text-cyan-600 font-mono font-bold text-[11px] dark:text-cyan-400">{t.slaMinutesRemaining}m</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              t.status === 'RESOLVED' ? 'emerald' : t.status === 'WAITING_CUSTOMER' ? 'amber' : 'cyan'
                            }
                            size="sm"
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedTicketForDetail(t);
                              setIsTicketDetailOpen(true);
                            }}
                          >
                            Atender
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CLIENTES & INGRESSOS */}
      {activeSubTab === 'sac-customers' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                  Diretório de Clientes & Participantes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consulte a base unificada de compradores cadastrados na plataforma
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 font-mono dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="p-3 font-semibold">Nome</th>
                    <th className="p-3 font-semibold">CPF (Mascarado)</th>
                    <th className="p-3 font-semibold">E-mail</th>
                    <th className="p-3 font-semibold">Telefone</th>
                    <th className="p-3 text-right font-semibold">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {matchedCustomers.map(c => {
                    const raw = c.cpf || '';
                    const masked = raw.length >= 11 ? `***.${raw.slice(3, 6)}.${raw.slice(6, 9)}-**` : '***.***.***-**';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-700/40">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{masked}</td>
                        <td className="p-3 text-slate-600 font-mono dark:text-slate-300">{c.email}</td>
                        <td className="p-3 text-slate-600 font-mono dark:text-slate-300">{c.phone || 'Não informado'}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenCustomerDossier(c)}
                            icon={<ExternalLink className="w-3 h-3" />}
                          >
                            Abrir Ficha
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Customer Dossier Modal */}
      {isDossierOpen && dossierCustomer && (
        <CustomerDossierModal
          customer={dossierCustomer}
          orders={orders}
          tickets={tickets}
          supportTickets={localTickets}
          refunds={[]}
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          onOpenNewTicket={(cust, order) => {
            setIsDossierOpen(false);
            handleOpenNewTicketModal(cust, order);
          }}
          onRequestRefund={(order) => {
            setIsDossierOpen(false);
            handleRequestRefundFromOrder(order);
          }}
          onOpenOrderDossier={(order) => {
            setSelectedOrderForDossier(order);
            setIsOrderDossierOpen(true);
          }}
        />
      )}

      {/* MODAL 2: New SAC Ticket Modal */}
      {isNewTicketOpen && (
        <NewSacTicketModal
          isOpen={isNewTicketOpen}
          onClose={() => setIsNewTicketOpen(false)}
          customers={customers}
          orders={orders}
          preSelectedCustomer={newTicketTargetCustomer}
          preSelectedOrder={newTicketTargetOrder}
          onCreateTicket={handleCreateTicket}
        />
      )}

      {/* MODAL 3: SAC Ticket Detail / Conversation Modal */}
      {isTicketDetailOpen && selectedTicketForDetail && (
        <SacTicketDetailModal
          ticket={selectedTicketForDetail}
          isOpen={isTicketDetailOpen}
          onClose={() => setIsTicketDetailOpen(false)}
          onAddMessage={handleAddMessageToTicket}
          onUpdateStatus={handleUpdateTicketStatus}
          onRequestRefund={(orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (order) handleRequestRefundFromOrder(order);
          }}
        />
      )}

      {/* MODAL 4: Order Dossier Modal (Limitless Operational View) */}
      {isOrderDossierOpen && selectedOrderForDossier && (
        <OrderDossierModal
          order={selectedOrderForDossier}
          isOpen={isOrderDossierOpen}
          onClose={() => setIsOrderDossierOpen(false)}
        />
      )}
    </div>
  );
};
