import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  User,
  Building2,
  Calendar,
  Send,
  ExternalLink,
  Layers,
  ArrowDownLeft,
  RefreshCw,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Can } from '../../core/auth/Can';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export interface RefundDetailItem {
  id: string;
  refundCode: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCpfMasked: string;
  producerId: string;
  eventId: string;
  eventName: string;
  kind: 'TOTAL' | 'PARTIAL';
  amount: number;
  originalOrderAmount: number;
  eligibleRemainingAmount: number;
  reason: string;
  reasonDescription: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'WAITING_INFORMATION' | 'APPROVAL_PENDING' | 'APPROVED' | 'PROCESSING' | 'PROCESSED' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'CANCELLED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredApprovals: number;
  approvalsReceived: number;
  approvals: Array<{
    level: number;
    approverId: string;
    approverName: string;
    role: string;
    decision: 'APPROVED' | 'REJECTED';
    comment?: string;
    approvedAt: string;
  }>;
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
  timeline: Array<{
    id: string;
    action: string;
    actor: string;
    details: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface RefundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: RefundDetailItem | null;
  currentUserId: string;
  onApprove: (refundId: string, comment?: string) => Promise<void>;
  onReject: (refundId: string, reason: string) => Promise<void>;
  onProcess: (refundId: string) => Promise<void>;
  onRetry: (refundId: string) => Promise<void>;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToSacTicket?: (ticketId: string) => void;
}

export const RefundDetailModal: React.FC<RefundDetailModalProps> = ({
  isOpen,
  onClose,
  refund,
  currentUserId,
  onApprove,
  onReject,
  onProcess,
  onRetry,
  onNavigateToOrder,
  onNavigateToSacTicket
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'order' | 'payment' | 'approvals' | 'reversal' | 'timeline'>('overview');
  const [actionComment, setActionComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen || !refund) return null;

  const isMaker = refund.requestedByUserId === currentUserId;
  const canApprove = refund.status === 'APPROVAL_PENDING' || refund.status === 'UNDER_REVIEW';
  const canExecuteGateway = refund.status === 'APPROVED';
  const canRetry = refund.status === 'FAILED';

  const handleApproveAction = async () => {
    if (isMaker) {
      setActionFeedback('Violação de Segregação de Função: Solicitante não pode aprovar a própria solicitação.');
      return;
    }
    setIsProcessingAction(true);
    setActionFeedback(null);
    try {
      await onApprove(refund.id, actionComment);
      setActionFeedback('Aprovação de alçada concedida com sucesso!');
      setActionComment('');
    } catch (err: any) {
      setActionFeedback(err?.message || 'Falha ao processar aprovação.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectAction = async () => {
    if (!rejectReason.trim()) {
      setActionFeedback('A justificativa da recusa é obrigatória.');
      return;
    }
    setIsProcessingAction(true);
    setActionFeedback(null);
    try {
      await onReject(refund.id, rejectReason);
      setActionFeedback('Solicitação recusada formalmente.');
      setShowRejectBox(false);
      setRejectReason('');
    } catch (err: any) {
      setActionFeedback(err?.message || 'Falha ao recusar solicitação.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleProcessAction = async () => {
    setIsProcessingAction(true);
    setActionFeedback(null);
    try {
      await onProcess(refund.id);
      setActionFeedback('Estorno executado no adquirente com sucesso!');
    } catch (err: any) {
      setActionFeedback(err?.message || 'Erro ao processar estorno no gateway.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVAL_PENDING':
        return <Badge variant="amber">Aguardando Aprovação</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="cyan">Em Análise Técnica</Badge>;
      case 'WAITING_INFORMATION':
        return <Badge variant="amber">Aguardando Informações</Badge>;
      case 'APPROVED':
        return <Badge variant="cyan">Aprovado (Pendente Execução)</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan">Processando no Gateway</Badge>;
      case 'PROCESSED':
      case 'COMPLETED':
        return <Badge variant="emerald">Concluído / Estornado</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">Recusado</Badge>;
      case 'FAILED':
        return <Badge variant="rose">Falha no Gateway</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate">Cancelado</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">Risco Crítico</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">Risco Alto</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Risco Médio</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Risco Padrão</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{refund.refundCode}</h2>
                {getStatusBadge(refund.status)}
                {getRiskBadge(refund.riskLevel)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pedido <span className="font-mono text-slate-300">{refund.orderNumber}</span> • {refund.eventName} • {refund.customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            actionFeedback.includes('sucesso')
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'overview', label: 'Resumo Operacional' },
            { id: 'order', label: 'Pedido & Itens' },
            { id: 'payment', label: 'Transação Bancária' },
            { id: 'approvals', label: `Alçadas (${refund.approvalsReceived}/${refund.requiredApprovals})` },
            { id: 'reversal', label: 'Plano de Reversão' },
            { id: 'timeline', label: 'Trilha de Auditoria' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400 font-medium">VALOR SOLICITADO</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                    {formatCurrency(refund.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 capitalize">
                    Modalidade: {refund.kind === 'TOTAL' ? 'Estorno Total' : 'Estorno Parcial'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400 font-medium">TOTAL DO PEDIDO</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {formatCurrency(refund.originalOrderAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Saldo Restante: {formatCurrency(refund.eligibleRemainingAmount)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-[11px] text-slate-400 font-medium">ALÇADAS DE APROVAÇÃO</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                    {refund.approvalsReceived} de {refund.requiredApprovals}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {refund.status === 'APPROVED' ? 'Aprovações Cumpridas' : 'Aguardando Avaliação'}
                  </div>
                </div>
              </div>

              {/* Justification Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-orange-400" />
                    Motivo Formal & Justificativa
                  </span>
                  <Badge variant="slate" size="sm">
                    {refund.reason}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  "{refund.reasonDescription}"
                </p>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Solicitante: <strong className="text-slate-200">{refund.requestedBy}</strong></span>
                  <span>Data: {formatDateTime(refund.createdAt)}</span>
                </div>
              </div>

              {/* SAC Ticket Link if present */}
              {refund.sacTicketId && (
                <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-cyan-200">Vínculo ao Atendimento SAC</div>
                      <div className="text-[11px] text-cyan-400/80 font-mono">Protocolo: {refund.sacTicketId}</div>
                    </div>
                  </div>
                  {onNavigateToSacTicket && (
                    <Button size="sm" variant="ghost" onClick={() => onNavigateToSacTicket(refund.sacTicketId!)}>
                      Abrir SAC
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Order & Items */}
          {activeTab === 'order' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Dados do Pedido Comercial</span>
                  </div>
                  {onNavigateToOrder && (
                    <Button size="sm" variant="ghost" onClick={() => onNavigateToOrder(refund.orderId)}>
                      Visualizar Pedido Completo
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Número do Pedido</span>
                    <strong className="font-mono text-white">{refund.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cliente Comprador</span>
                    <strong className="text-white">{refund.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Documento (LGPD)</span>
                    <strong className="font-mono text-slate-300">{refund.customerCpfMasked}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Evento</span>
                    <strong className="text-white truncate block">{refund.eventName}</strong>
                  </div>
                </div>
              </div>

              {/* Tickets affected */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-emerald-400" />
                    Ingressos Vinculados para Invalidação na Catraca
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {refund.ticketIds?.length || 0} ingresso(s)
                  </span>
                </div>

                {refund.ticketIds && refund.ticketIds.length > 0 ? (
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40 text-xs">
                    {refund.ticketIds.map((tId) => (
                      <div key={tId} className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{tId}</span>
                          <span className="text-slate-400">• Setor Principal</span>
                        </div>
                        <Badge variant={refund.status === 'COMPLETED' ? 'rose' : 'emerald'} size="sm">
                          {refund.status === 'COMPLETED' ? 'Cancelado / Invalidação Catraca' : 'Aguardando Invalidação'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 p-3 text-center border border-dashed border-slate-800 rounded-lg">
                    Estorno financeiro global ou sem ingressos individuais selecionados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Payment */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Transação e Gateway Adquirente</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Meio de Pagamento</span>
                    <strong className="text-white font-mono">{refund.paymentMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Gateway / Provedor</span>
                    <strong className="text-white">{refund.paymentGateway}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Código da Transação Original</span>
                    <strong className="font-mono text-cyan-400">{refund.transactionCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ID do Estorno no Provedor</span>
                    <strong className="font-mono text-emerald-400">
                      {refund.gatewayRefundId || 'Pendente de Execução'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Chave de Idempotência</span>
                    <strong className="font-mono text-slate-300 text-[11px] truncate block" title={refund.idempotencyKey}>
                      {refund.idempotencyKey}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Status da Reconciliação</span>
                    <strong className="text-emerald-400">
                      {refund.status === 'COMPLETED' ? 'Reconciliado no Ledger' : 'Pendente de Confirmação'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Idempotency Explanation */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/30 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Garantia de Idempotência:</strong> Todas as tentativas de estorno utilizam uma chave única vinculada à solicitação, impedindo duplicidade bancária mesmo em cenários de reenvio de webhook ou instabilidade de conexão.
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Approvals */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Alçadas Requeridas & Segregação de Função (Maker-Checker)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Nível de Risco: {refund.riskLevel}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Array.from({ length: refund.requiredApprovals }).map((_, idx) => {
                    const level = idx + 1;
                    const record = refund.approvals.find(a => a.level === level);
                    const isPassed = Boolean(record && record.decision === 'APPROVED');

                    return (
                      <div
                        key={level}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isPassed
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-slate-800 bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono font-bold text-xs ${
                            isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {level}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {level === 1 ? 'Supervisão Operacional / Financeira' : level === 2 ? 'Gerência Financeira' : 'Diretoria Executiva'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isPassed && record ? `Aprovado por ${record.approverName} em ${formatDateTime(record.approvedAt)}` : 'Aguardando aprovação de alçada'}
                            </div>
                            {record?.comment && (
                              <div className="text-[10px] text-slate-300 italic mt-0.5">
                                "{record.comment}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {isPassed ? (
                            <Badge variant="emerald" size="sm">Aprovado</Badge>
                          ) : (
                            <Badge variant="amber" size="sm">Pendente</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isMaker && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Você é o solicitante deste estorno. Conforme a regra de Maker-Checker, a aprovação deve ser realizada por outro usuário qualificado.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Reversal Plan */}
          {activeTab === 'reversal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-bold text-white">Plano de Lançamentos Compensatórios (Ledger)</span>
                  </div>
                  <Badge variant="slate" size="sm">Estratégia Imutável</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { step: 1, label: 'Bloquear exposição financeira do valor em análise', done: true },
                    { step: 2, label: 'Calcular reversão proporcional do split de pagamento', done: true },
                    { step: 3, label: 'Consumir reserva elegível do produtor antes de saldo negativo', done: true },
                    { step: 4, label: 'Executar estorno no gateway/adquirente com idempotência', done: refund.status === 'COMPLETED' },
                    { step: 5, label: 'Gerar lançamentos compensatórios no ledger (nunca editar saldo)', done: refund.status === 'COMPLETED' },
                    { step: 6, label: 'Conciliar retorno do provedor e atualizar conta gráfica', done: refund.status === 'COMPLETED' },
                    { step: 7, label: 'Fechar trilha de auditoria e notificar protocolo SAC', done: refund.status === 'COMPLETED' }
                  ].map(s => (
                    <div key={s.step} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-500 font-bold">{s.step}.</span>
                        <span className={s.done ? 'text-slate-200' : 'text-slate-400'}>{s.label}</span>
                      </div>
                      {s.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white mb-2">Trilha Cronológica Auditada</div>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {refund.timeline.map((event) => (
                  <div key={event.id} className="relative text-xs">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-mono">{event.action}</strong>
                      <span className="text-[10px] text-slate-500">{formatDateTime(event.timestamp)}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{event.details}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Por: {event.actor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {canApprove && !isMaker && (
              <span>Pronto para avaliação de alçada.</span>
            )}
            {canExecuteGateway && (
              <span>Aprovações concluídas. Pronto para despacho ao gateway.</span>
            )}
            {refund.status === 'COMPLETED' && (
              <span className="text-emerald-400 font-semibold">Estorno concluído e auditado.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {showRejectBox ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Informe a justificativa da recusa..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-64"
                />
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleRejectAction}
                  disabled={isProcessingAction}
                >
                  Confirmar Recusa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectBox(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                {canApprove && (
                  <Can permission="estorno.solicitacao.aprovar">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleApproveAction}
                      disabled={isMaker || isProcessingAction}
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Aprovar Alçada
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setShowRejectBox(true)}
                      disabled={isProcessingAction}
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
                      onClick={handleProcessAction}
                      disabled={isProcessingAction}
                      icon={<Send className="h-3.5 w-3.5" />}
                    >
                      Executar no Gateway
                    </Button>
                  </Can>
                )}

                {canRetry && (
                  <Can permission="estorno.solicitacao.executar">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onRetry(refund.id)}
                      disabled={isProcessingAction}
                      icon={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                      Reprocessar Estorno
                    </Button>
                  </Can>
                )}

                <Button size="sm" variant="ghost" onClick={onClose}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
