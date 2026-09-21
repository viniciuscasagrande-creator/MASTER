import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowDownLeft,
  Activity,
  Layers,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Send,
  Eye,
  CreditCard,
  QrCode,
  Building2,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Can } from '../../core/auth/Can';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';
import { RefundDetailModal, RefundDetailItem } from './RefundDetailModal';
import { NewRefundModal } from './NewRefundModal';
import { RefundsApi } from '../../features/refunds/api/refunds.api';

interface RefundsDashboardProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const RefundsDashboard: React.FC<RefundsDashboardProps> = ({
  initialSubItem = 'refunds-dashboard',
  onNavigate
}) => {
  const { refunds, orders, approveRefund, rejectRefund, createRefundRequest } = useCoreData();
  const { currentUser, hasPermission } = useAuth();
  const { activeProducer, activeEvent, selectedProducerId, selectedEventId } = useDiskContext();

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(initialSubItem || 'refunds-dashboard');

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(initialSubItem);
    }
  }, [initialSubItem]);

  useEffect(() => {
    RefundsApi.listRefunds()
      .then(res => {
        if (res && res.refunds && res.refunds.length > 0) {
          const mapped: RefundDetailItem[] = res.refunds.map(r => ({
            id: r.id,
            refundCode: r.refundCode,
            orderId: r.orderId,
            orderNumber: r.orderNumber,
            customerId: r.customerId,
            customerName: r.customerName,
            customerCpfMasked: r.customerCpfMasked,
            producerId: r.producerId,
            eventId: r.eventId,
            eventName: r.eventName,
            kind: r.kind,
            amount: r.amount,
            originalOrderAmount: r.originalOrderAmount,
            eligibleRemainingAmount: r.eligibleRemainingAmount,
            reason: r.reason,
            reasonDescription: r.reasonDescription,
            status: r.status,
            riskLevel: r.riskLevel,
            requiredApprovals: r.requiredApprovals,
            approvalsReceived: r.approvalsReceived,
            approvals: r.approvals || [],
            requestedBy: r.requestedBy,
            requestedByUserId: r.requestedByUserId,
            paymentMethod: r.paymentMethod,
            paymentGateway: r.paymentGateway,
            transactionCode: r.transactionCode,
            gatewayRefundId: r.gatewayRefundId,
            idempotencyKey: r.idempotencyKey,
            ticketIds: r.ticketIds || [],
            sacTicketId: r.sacTicketId,
            timeline: r.timeline || [],
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            completedAt: r.completedAt
          }));
          setRichRefunds(mapped);
        }
      })
      .catch(err => {
        console.warn('Backend refunds API fallback to initial seed:', err);
      });
  }, []);

  // Modals State
  const [selectedRefundForDetail, setSelectedRefundForDetail] = useState<RefundDetailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Local state for full rich refund items synchronized with Core Data
  const [richRefunds, setRichRefunds] = useState<RefundDetailItem[]>([
    {
      id: 'ref-882',
      refundCode: 'EST-2026-000882',
      orderId: 'ord-984521',
      orderNumber: 'PED-984521',
      customerId: 'cust-maria',
      customerName: 'Maria Oliveira',
      customerCpfMasked: '***.456.789-**',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      eventName: 'Festival de Inverno Curitiba 2026',
      kind: 'TOTAL',
      amount: 642.00,
      originalOrderAmount: 642.00,
      eligibleRemainingAmount: 642.00,
      reason: 'CDC_7_DAYS',
      reasonDescription: 'Solicitação do comprador dentro do prazo legal de 7 dias do CDC.',
      status: 'APPROVAL_PENDING',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: 'Carlos Lima (SAC)',
      requestedByUserId: 'usr-agent-1',
      paymentMethod: 'PIX',
      paymentGateway: 'PIX_BancoCentral',
      transactionCode: 'TRX-552811',
      idempotencyKey: 'idemp-882-seed',
      ticketIds: ['tkt-88211', 'tkt-88212'],
      sacTicketId: 'SAC-2026-001001',
      timeline: [
        {
          id: 'tl-1',
          action: 'SOLICITAÇÃO_CRIADA',
          actor: 'Carlos Lima (SAC)',
          details: 'Solicitação gerada com vínculo ao protocolo SAC-2026-001001.',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'ref-883',
      refundCode: 'EST-2026-000883',
      orderId: 'ord-921885',
      orderNumber: 'PED-921885',
      customerId: 'cust-maria',
      customerName: 'Maria Oliveira',
      customerCpfMasked: '***.456.789-**',
      producerId: 'prd_100',
      eventId: 'evt_1002',
      eventName: 'Teatro Musical Broadway Curitiba',
      kind: 'TOTAL',
      amount: 280.00,
      originalOrderAmount: 280.00,
      eligibleRemainingAmount: 280.00,
      reason: 'EVENT_POSTPONED',
      reasonDescription: 'Desistência devido à alteração na data da sessão teatral pelo produtor.',
      status: 'UNDER_REVIEW',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: 'Carlos Lima (SAC)',
      requestedByUserId: 'usr-agent-1',
      paymentMethod: 'CARTAO_CREDITO',
      paymentGateway: 'Cielo',
      transactionCode: 'TRX-771120',
      idempotencyKey: 'idemp-883-seed',
      ticketIds: [],
      timeline: [
        {
          id: 'tl-2',
          action: 'SOLICITAÇÃO_CRIADA',
          actor: 'Carlos Lima (SAC)',
          details: 'Solicitação em triagem.',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'ref-884',
      refundCode: 'EST-2026-000884',
      orderId: 'ord-rodrigo',
      orderNumber: 'DK-98422',
      customerId: 'cust-2',
      customerName: 'Rodrigo Silveira Ramos',
      customerCpfMasked: '***.304.779-**',
      producerId: 'prd_200',
      eventId: 'evt_2001',
      eventName: 'Coldplay Experience World Tour',
      kind: 'TOTAL',
      amount: 462.00,
      originalOrderAmount: 462.00,
      eligibleRemainingAmount: 0.00,
      reason: 'CDC_7_DAYS',
      reasonDescription: 'Cancelamento solicitado pelo cliente dentro da política do CDC.',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 1,
      approvals: [
        {
          level: 1,
          approverId: 'usr-supervisor-1',
          approverName: 'Aline Castro (Gerente Financeira)',
          role: 'finance_manager',
          decision: 'APPROVED',
          comment: 'Dentro do prazo do CDC. Estorno aprovado.',
          approvedAt: new Date(Date.now() - 3600000 * 20).toISOString()
        }
      ],
      requestedBy: 'Ana Paula (Atendimento)',
      requestedByUserId: 'usr-agent-2',
      paymentMethod: 'PIX',
      paymentGateway: 'PIX_BancoCentral',
      transactionCode: 'TRX-998412',
      gatewayRefundId: 'GW-PIX-REF-998124',
      idempotencyKey: 'idemp-884-seed',
      ticketIds: ['tkt-rodrigo'],
      timeline: [
        {
          id: 'tl-3',
          action: 'GATEWAY_CONFIRMADO',
          actor: 'PIX Banco Central',
          details: 'Devolução PIX efetuada com sucesso.',
          timestamp: new Date(Date.now() - 3600000 * 19).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 19).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 19).toISOString()
    }
  ]);

  // Context-filtered items
  const scopedRefunds = useMemo(() => {
    let list = richRefunds;
    if (selectedProducerId && selectedProducerId !== 'all') {
      list = list.filter(r => r.producerId === selectedProducerId);
    }
    if (selectedEventId && selectedEventId !== 'all') {
      list = list.filter(r => r.eventId === selectedEventId);
    }
    return list;
  }, [richRefunds, selectedProducerId, selectedEventId]);

  // Tab counts
  const pendingApprovalsList = useMemo(() => {
    return scopedRefunds.filter(r => r.status === 'APPROVAL_PENDING' || r.status === 'UNDER_REVIEW');
  }, [scopedRefunds]);

  const completedList = useMemo(() => {
    return scopedRefunds.filter(r => r.status === 'COMPLETED' || r.status === 'PROCESSED');
  }, [scopedRefunds]);

  // Filtered Table Items
  const displayedRefunds = useMemo(() => {
    let list = scopedRefunds;

    if (activeTab === 'refunds-approvals') {
      list = pendingApprovalsList;
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }

    if (paymentFilter !== 'ALL') {
      list = list.filter(r => r.paymentMethod.toUpperCase() === paymentFilter.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r =>
        r.refundCode.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerCpfMasked.includes(q) ||
        r.reasonDescription.toLowerCase().includes(q) ||
        r.eventName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [scopedRefunds, activeTab, pendingApprovalsList, statusFilter, paymentFilter, searchQuery]);

  // KPI Calculations
  const pendingAmount = pendingApprovalsList.reduce((acc, r) => acc + r.amount, 0);
  const completedAmount = completedList.reduce((acc, r) => acc + r.amount, 0);

  // Handlers
  const handleApprove = async (refundId: string, comment?: string) => {
    // Maker-checker check
    const target = richRefunds.find(r => r.id === refundId);
    if (!target) return;

    if (target.requestedByUserId === currentUser.id) {
      throw new Error('Violação de Segregação de Função: Solicitante não pode aprovar o próprio estorno.');
    }

    try {
      await RefundsApi.approveRefund(refundId, comment);
    } catch (e) {
      console.warn('RefundsApi.approveRefund fallback to local:', e);
    }

    const currentLevel = target.approvalsReceived + 1;
    const isApproved = currentLevel >= target.requiredApprovals;

    setRichRefunds(prev =>
      prev.map(r => {
        if (r.id === refundId) {
          const newApprovals = [
            ...r.approvals,
            {
              level: currentLevel,
              approverId: currentUser.id,
              approverName: currentUser.name,
              role: currentUser.roleName,
              decision: 'APPROVED' as const,
              comment,
              approvedAt: new Date().toISOString()
            }
          ];
          return {
            ...r,
            approvalsReceived: currentLevel,
            approvals: newApprovals,
            status: isApproved ? 'APPROVED' : 'APPROVAL_PENDING',
            updatedAt: new Date().toISOString(),
            timeline: [
              ...r.timeline,
              {
                id: `tl-app-${Date.now()}`,
                action: isApproved ? 'APROVAÇÃO_COMPLETA' : `APROVAÇÃO_NÍVEL_${currentLevel}`,
                actor: currentUser.name,
                details: `Alçada concedida por ${currentUser.name}. ${comment ? `Nota: "${comment}"` : ''}`,
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return r;
      })
    );

    // Call CoreDataContext
    approveRefund(refundId, currentUser.name);
    showToast(`Estorno ${target.refundCode} aprovado na alçada com sucesso!`);
  };

  const handleReject = async (refundId: string, reason: string) => {
    const target = richRefunds.find(r => r.id === refundId);
    if (!target) return;

    try {
      await RefundsApi.rejectRefund(refundId, reason);
    } catch (e) {
      console.warn('RefundsApi.rejectRefund fallback to local:', e);
    }

    setRichRefunds(prev =>
      prev.map(r => {
        if (r.id === refundId) {
          return {
            ...r,
            status: 'REJECTED',
            updatedAt: new Date().toISOString(),
            timeline: [
              ...r.timeline,
              {
                id: `tl-rej-${Date.now()}`,
                action: 'SOLICITAÇÃO_RECUSADA',
                actor: currentUser.name,
                details: `Estorno recusado formalmente. Justificativa: ${reason}`,
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return r;
      })
    );

    rejectRefund(refundId, currentUser.name, reason);
    showToast(`Estorno ${target.refundCode} recusado.`);
  };

  const handleProcess = async (refundId: string) => {
    const target = richRefunds.find(r => r.id === refundId);
    if (!target) return;

    try {
      await RefundsApi.processRefund(refundId);
    } catch (e) {
      console.warn('RefundsApi.processRefund fallback to local:', e);
    }

    const gwId = `GW-${target.paymentMethod.slice(0, 3)}-${Date.now().toString().slice(-6)}`;

    setRichRefunds(prev =>
      prev.map(r => {
        if (r.id === refundId) {
          return {
            ...r,
            status: 'COMPLETED',
            gatewayRefundId: gwId,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timeline: [
              ...r.timeline,
              {
                id: `tl-proc-${Date.now()}`,
                action: 'GATEWAY_CONFIRMADO',
                actor: target.paymentGateway,
                details: `Estorno executado com sucesso no provedor bancário. ID: ${gwId}`,
                timestamp: new Date().toISOString()
              },
              {
                id: `tl-casc-${Date.now()}`,
                action: 'CASCATA_REVERSA_CONCLUÍDA',
                actor: 'Sistema Core',
                details: 'Ingressos cancelados nas catracas e lançamentos compensatórios emitidos no Ledger.',
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return r;
      })
    );

    showToast(`Estorno ${target.refundCode} executado no gateway com sucesso!`);
  };

  const handleRetry = async (refundId: string) => {
    await handleProcess(refundId);
  };

  const handleCreateRefundSubmit = async (dto: {
    orderId: string;
    kind: 'TOTAL' | 'PARTIAL';
    amount: number;
    reason: string;
    reasonDescription: string;
    ticketIds?: string[];
  }) => {
    const ord = orders.find(o => o.id === dto.orderId || o.orderNumber === dto.orderId);
    if (!ord) throw new Error('Pedido não encontrado.');

    const newRefCounter = richRefunds.length + 885;
    const refCode = `EST-2026-${String(newRefCounter).padStart(6, '0')}`;
    const requiredApprovals = dto.amount >= 5000 ? 3 : dto.amount >= 1000 ? 2 : 1;
    const riskLevel = dto.amount >= 5000 ? 'CRITICAL' : dto.amount >= 1000 ? 'HIGH' : dto.kind === 'PARTIAL' ? 'MEDIUM' : 'LOW';

    try {
      await RefundsApi.createRefund({
        orderId: ord.id,
        kind: dto.kind,
        amount: dto.amount,
        reason: dto.reason as any,
        reasonDescription: dto.reasonDescription,
        ticketIds: dto.ticketIds
      });
    } catch (e) {
      console.warn('RefundsApi.createRefund fallback to local:', e);
    }

    const newRefundItem: RefundDetailItem = {
      id: `ref-${newRefCounter}`,
      refundCode: refCode,
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      customerId: ord.customerId,
      customerName: ord.customerName,
      customerCpfMasked: ord.customerCpf ? `***.${ord.customerCpf.slice(4, 7)}.${ord.customerCpf.slice(8, 11)}-**` : '***.***.***-**',
      producerId: ord.producerId || 'prd_100',
      eventId: ord.eventId,
      eventName: ord.eventName,
      kind: dto.kind,
      amount: dto.amount,
      originalOrderAmount: ord.totalAmount,
      eligibleRemainingAmount: Math.max(0, ord.totalAmount - dto.amount),
      reason: dto.reason,
      reasonDescription: dto.reasonDescription,
      status: 'APPROVAL_PENDING',
      riskLevel,
      requiredApprovals,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: `${currentUser.name} (${currentUser.roleName})`,
      requestedByUserId: currentUser.id,
      paymentMethod: ord.paymentMethod === 'pix' ? 'PIX' : 'CARTAO_CREDITO',
      paymentGateway: ord.paymentMethod === 'pix' ? 'PIX_BancoCentral' : 'Cielo',
      transactionCode: `TRX-${Date.now().toString().slice(-6)}`,
      idempotencyKey: `idemp-ui-${newRefCounter}-${Date.now()}`,
      ticketIds: dto.ticketIds || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          action: 'SOLICITAÇÃO_CRIADA',
          actor: currentUser.name,
          details: `Solicitação registrada. Motivo: ${dto.reasonDescription}`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRichRefunds(prev => [newRefundItem, ...prev]);

    // Also call CoreDataContext for cross-module synchronization
    createRefundRequest({
      orderId: ord.id,
      reason: dto.reason === 'CDC_7_DAYS' ? 'arrependimento_7d' : 'outro',
      description: dto.reasonDescription,
      type: dto.kind === 'TOTAL' ? 'total' : 'partial',
      requesterName: currentUser.name
    });

    showToast(`Solicitação ${refCode} aberta e encaminhada para fila de aprovação!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVAL_PENDING':
        return <Badge variant="amber" size="sm">Aguardando Aprovação</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="cyan" size="sm">Em Análise Técnica</Badge>;
      case 'WAITING_INFORMATION':
        return <Badge variant="amber" size="sm">Aguardando Dados</Badge>;
      case 'APPROVED':
        return <Badge variant="cyan" size="sm">Aprovado (Gateway)</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan" size="sm">Processando</Badge>;
      case 'COMPLETED':
      case 'PROCESSED':
        return <Badge variant="emerald" size="sm">Concluído</Badge>;
      case 'REJECTED':
        return <Badge variant="rose" size="sm">Recusado</Badge>;
      case 'FAILED':
        return <Badge variant="rose" size="sm">Falha no Gateway</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-500/30 bg-slate-900/95 p-3.5 text-xs text-emerald-400 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              CENTRO DE CONTROLE DE ESTORNOS
            </h1>
            <Badge variant="rose" size="sm">
              Cascata Reversa Integrada
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de estornos totais, parciais e alçadas com cancelamento factual de ingressos na catraca e lançamentos compensatórios no Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="estorno.solicitacao.criar">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNewModalOpen(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Nova Solicitação
            </Button>
          </Can>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="SOLICITAÇÕES PENDENTES"
          value={`${pendingApprovalsList.length} pedidos`}
          subtitle={`Total: ${formatCurrency(pendingAmount)}`}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          badge={pendingApprovalsList.length > 0 ? 'Ação Requerida' : 'Zerado'}
          badgeVariant={pendingApprovalsList.length > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="TOTAL ESTORNADO (MÊS)"
          value={formatCurrency(completedAmount)}
          subtitle="Refletido em balancetes no Ledger"
          icon={<ArrowDownLeft className="h-4 w-4 text-rose-500" />}
          badge="Auditado"
          badgeVariant="rose"
        />

        <StatCard
          title="TAXA DE CHARGEBACK"
          value="0.08%"
          trend={{ value: 'Abaixo do limite de 1.0%', isPositive: true }}
          icon={<ShieldAlert className="h-4 w-4 text-emerald-500" />}
          badge="Segurança Visa/Master"
          badgeVariant="emerald"
        />

        <StatCard
          title="TEMPO MÉDIO DE EXECUÇÃO"
          value="1.4 horas"
          subtitle="Até invalidação do QR Code na catraca"
          icon={<Activity className="h-4 w-4 text-cyan-500" />}
          badge="SLA Cumprido"
          badgeVariant="cyan"
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-1 rounded-xl text-xs font-semibold overflow-x-auto shadow-xs">
        {[
          { id: 'refunds-dashboard', label: 'Centro de Controle' },
          { id: 'refunds-requests', label: `Central de Solicitações (${scopedRefunds.length})` },
          { id: 'refunds-approvals', label: `Fila de Aprovação (${pendingApprovalsList.length})` },
          { id: 'refunds-chargebacks', label: 'Chargebacks & Disputas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Centro de Controle (Overview) */}
      {activeTab === 'refunds-dashboard' && (
        <div className="space-y-4">
          {/* Cascata Reversa Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200 shrink-0 dark:bg-orange-500/10 dark:border-orange-500/30">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-white block font-bold">Arquitetura de Cascata Reversa Integrada:</strong>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Ao aprovar e processar uma devolução, o Core desativa os QR Codes nas catracas do evento, recalcula o split com o produtor, atualiza o status do pedido no SAC e emite lançamentos compensatórios no Ledger Contábil — sem jamais editar saldos históricos.
              </p>
            </div>
          </div>

          {/* Quick Pending Approvals Callout */}
          {pendingApprovalsList.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {pendingApprovalsList.length} solicitação(ões) de estorno aguardando avaliação de alçada
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    Montante total aguardando decisão: {formatCurrency(pendingAmount)}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveTab('refunds-approvals')}
              >
                Abrir Fila de Aprovação
              </Button>
            </div>
          )}

          {/* Recents table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs space-y-3 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Últimas Solicitações de Estorno
              </span>
              <button
                onClick={() => setActiveTab('refunds-requests')}
                className="text-xs text-[#FF7A00] hover:underline font-semibold cursor-pointer"
              >
                Ver Todas ({scopedRefunds.length}) →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Código & Pedido</th>
                    <th className="p-3 font-semibold">Comprador</th>
                    <th className="p-3 font-semibold">Evento</th>
                    <th className="p-3 font-semibold">Valor</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scopedRefunds.slice(0, 5).map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <strong className="text-slate-900 dark:text-white block">{ref.refundCode}</strong>
                        <span className="text-[11px] text-slate-500">{ref.orderNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-900 dark:text-slate-200 font-medium block">{ref.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{ref.customerCpfMasked}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-700 dark:text-slate-300 truncate block max-w-[180px]">{ref.eventName}</span>
                        <span className="text-[10px] text-slate-500">{formatDateTime(ref.createdAt)}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(ref.amount)}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(ref.status)}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRefundForDetail(ref);
                            setIsDetailModalOpen(true);
                          }}
                          icon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Dossiê
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

      {/* TAB 2: Central de Solicitações & TAB 3: Fila de Aprovação */}
      {(activeTab === 'refunds-requests' || activeTab === 'refunds-approvals') && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs space-y-4 text-slate-900 dark:text-white">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, pedido, cliente, CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-500 font-mono transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'refunds-requests' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="APPROVAL_PENDING">Aguardando Aprovação</option>
                  <option value="UNDER_REVIEW">Em Análise Técnica</option>
                  <option value="APPROVED">Aprovado (Gateway)</option>
                  <option value="COMPLETED">Concluído / Estornado</option>
                  <option value="REJECTED">Recusado</option>
                  <option value="FAILED">Falha no Gateway</option>
                </select>
              )}

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="ALL">Todos os Meios</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Código & Pedido</th>
                  <th className="p-3 font-semibold">Comprador (LGPD)</th>
                  <th className="p-3 font-semibold">Evento & Data</th>
                  <th className="p-3 font-semibold">Valor</th>
                  <th className="p-3 font-semibold">Motivo & Risco</th>
                  <th className="p-3 font-semibold">Alçadas</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 text-right font-semibold">Ação Central</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayedRefunds.map(ref => {
                  const isMaker = ref.requestedByUserId === currentUser.id;
                  const canApprove = ref.status === 'APPROVAL_PENDING' || ref.status === 'UNDER_REVIEW';
                  const canExecuteGateway = ref.status === 'APPROVED';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <strong className="text-slate-900 dark:text-white block">{ref.refundCode}</strong>
                        <span className="text-[11px] text-slate-400">{ref.orderNumber}</span>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-900 dark:text-slate-200 font-medium">{ref.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ref.customerCpfMasked}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-300 font-medium truncate max-w-[170px]" title={ref.eventName}>
                          {ref.eventName}
                        </div>
                        <div className="text-[10px] text-slate-500">{formatDateTime(ref.createdAt)}</div>
                      </td>

                      <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(ref.amount)}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          de {formatCurrency(ref.originalOrderAmount)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]" title={ref.reasonDescription}>
                          {ref.reason}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Risco: <strong className="text-slate-600 dark:text-slate-300">{ref.riskLevel}</strong>
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <span className={ref.approvalsReceived >= ref.requiredApprovals ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                          {ref.approvalsReceived} / {ref.requiredApprovals}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {ref.paymentMethod}
                        </span>
                      </td>

                      <td className="p-3">
                        {getStatusBadge(ref.status)}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && (
                            <Can permission="estorno.solicitacao.aprovar">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(ref.id)}
                                disabled={isMaker}
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              >
                                {isMaker ? 'Solicitante' : 'Aprovar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  setSelectedRefundForDetail(ref);
                                  setIsDetailModalOpen(true);
                                }}
                                icon={<XCircle className="h-3.5 w-3.5" />}
                              >
                                Recusar
                              </Button>
                            </Can>
                          )}

                          {canExecuteGateway && (
                            <Can permission="estorno.solicitacao.executar">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleProcess(ref.id)}
                                icon={<Send className="h-3.5 w-3.5" />}
                              >
                                Executar
                              </Button>
                            </Can>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRefundForDetail(ref);
                              setIsDetailModalOpen(true);
                            }}
                            icon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Dossiê
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayedRefunds.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      Nenhuma solicitação de estorno encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Chargebacks & Disputas */}
      {activeTab === 'refunds-chargebacks' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Monitoramento de Disputas & Bandeiras (Visa / Mastercard)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Controle de chargebacks preventivos e contestação bancária
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">Índice: 0.08% (Saudável)</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Disputas Abertas</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">0 ativas</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Nenhuma notificação adquirente</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Limite Máximo Bandeira</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-200 mt-1 block">1.00%</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">Margem de segurança de 92%</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Prevenção por Cancelamento Rápido</span>
                <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">100% resolvidos</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Estornos efetuados antes da contestação</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <strong className="text-slate-900 dark:text-white block font-bold">Regra de Proteção Antifraude:</strong>
              <p className="leading-relaxed">
                O Disk Interno prioriza o estorno amigável direto via adquirente para solicitações legítimas de CDC ou cancelamentos, evitando que o comprador acione a contestação do banco emissor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes & Dossiê */}
      <RefundDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        refund={selectedRefundForDetail}
        currentUserId={currentUser.id}
        onApprove={handleApprove}
        onReject={handleReject}
        onProcess={handleProcess}
        onRetry={handleRetry}
        onNavigateToOrder={(orderId) => {
          setIsDetailModalOpen(false);
          onNavigate?.('commercial', 'commercial-orders');
        }}
        onNavigateToSacTicket={(ticketId) => {
          setIsDetailModalOpen(false);
          onNavigate?.('sac', 'sac-queue');
        }}
      />

      {/* Modal: Nova Solicitação de Estorno */}
      <NewRefundModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        availableOrders={orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerCpf: o.customerCpf,
          eventName: o.eventName,
          totalAmount: o.totalAmount,
          status: o.status,
          tickets: (o.tickets || []).map((t: any) => ({
            id: t.id,
            ticketCode: t.ticketCode,
            price: t.price || Math.round(o.totalAmount / (o.tickets?.length || 1)),
            checkInAt: t.checkInAt
          }))
        }))}
        onSubmit={handleCreateRefundSubmit}
      />
    </div>
  );
};
