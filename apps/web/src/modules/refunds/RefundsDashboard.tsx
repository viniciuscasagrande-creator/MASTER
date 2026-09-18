import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useAuth } from '../../core/auth/AuthContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Can } from '../../core/auth/Can';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export const RefundsDashboard: React.FC = () => {
  const { refunds, approveRefund, rejectRefund } = useCoreData();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const pendingList = refunds.filter(r => r.status === 'pending_approval');
  const approvedList = refunds.filter(r => r.status === 'approved');
  const displayList = activeTab === 'pending' ? pendingList : activeTab === 'approved' ? approvedList : refunds;

  const totalRefundedAmount = approvedList.reduce((acc, r) => acc + r.amount, 0);
  const pendingAmount = pendingList.reduce((acc, r) => acc + r.amount, 0);

  const handleApprove = (refundId: string) => {
    approveRefund(refundId, currentUser.name);
  };

  const handleReject = (refundId: string) => {
    const reason = prompt('Informe a justificativa da recusa do estorno:', 'Fora do prazo legal de 7 dias do CDC.');
    if (reason) {
      rejectRefund(refundId, currentUser.name, reason);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL DE ESTORNOS & CHARGEBACKS
            </h1>
            <Badge variant="rose" size="sm">
              Cascata Reversa Integrada
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de estornos totais, parciais e cancelamento com reflexo automático em Ingressos, Financeiro e Contabilidade
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingList.length > 0 ? (
            <Badge variant="amber" size="sm" dot>
              {pendingList.length} aguardando aprovação
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm" dot>
              Fila zerada
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="SOLICITAÇÕES PENDENTES"
          value={`${pendingList.length} pedidos`}
          subtitle={`Total: ${formatCurrency(pendingAmount)}`}
          icon={<Clock className="h-4 w-4 text-amber-400" />}
          badge={pendingList.length > 0 ? 'Ação Necessária' : 'Zerado'}
          badgeVariant={pendingList.length > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="TOTAL ESTORNADO (MÊS)"
          value={formatCurrency(totalRefundedAmount)}
          subtitle="Refletido nos balancetes contábeis"
          icon={<ArrowDownLeft className="h-4 w-4 text-rose-400" />}
          badge="Auditado"
          badgeVariant="rose"
        />

        <StatCard
          title="TAXA DE CHARGEBACK"
          value="0.08%"
          trend={{ value: 'Abaixo do limite de 1.0%', isPositive: true }}
          icon={<ShieldAlert className="h-4 w-4 text-emerald-400" />}
          badge="Segurança Visa/Master"
          badgeVariant="emerald"
        />

        <StatCard
          title="TEMPO DE PROCESSAMENTO"
          value="1.4 horas"
          subtitle="Até invalidação do ingresso na catraca"
          icon={<Activity className="h-4 w-4 text-cyan-400" />}
          badge="SLA Cumprido"
          badgeVariant="cyan"
        />
      </div>

      {/* Reverse Cascade Explanatory Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <strong className="text-white">Como funciona a Cascata Reversa:</strong> Ao aprovar um estorno, o Core invalida o QR Code do ingresso nas catracas, debita o valor da conta do produtor, atualiza o pedido no SAC e gera automaticamente o lançamento de estorno na Contabilidade.
          </div>
        </div>
      </div>

      {/* Refunds Table / Queue */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'approved'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aprovados ({approvedList.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos os Registros ({refunds.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Pedido & Titular</th>
                <th className="pb-3">Evento</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Tipo / Motivo</th>
                <th className="pb-3">Solicitante</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ação Central</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayList.map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <div className="font-bold font-mono text-white flex items-center gap-1.5">
                      {ref.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-400">{ref.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">CPF: {ref.customerCpf}</div>
                  </td>

                  <td className="py-3">
                    <div className="text-slate-200 font-medium truncate max-w-[200px]">{ref.eventName}</div>
                    <div className="text-[10px] text-slate-500">{formatDateTime(ref.requestedAt)}</div>
                  </td>

                  <td className="py-3 font-mono font-bold text-rose-400">
                    {formatCurrency(ref.amount)}
                  </td>

                  <td className="py-3">
                    <div className="font-semibold text-white capitalize">{ref.type === 'total' ? 'Estorno Total' : 'Estorno Parcial'}</div>
                    <div className="text-[11px] text-slate-400 max-w-[180px] truncate" title={ref.reasonDescription}>
                      {ref.reasonDescription}
                    </div>
                  </td>

                  <td className="py-3 text-[11px] text-slate-400">
                    {ref.requestedBy}
                  </td>

                  <td className="py-3">
                    <Badge
                      variant={ref.status === 'approved' ? 'emerald' : ref.status === 'rejected' ? 'rose' : 'amber'}
                      size="sm"
                    >
                      {ref.status === 'approved' ? 'Aprovado / Executado' : ref.status === 'rejected' ? 'Rejeitado' : 'Aguardando Aprovação'}
                    </Badge>
                  </td>

                  <td className="py-3 text-right">
                    {ref.status === 'pending_approval' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Can
                          permission="estorno.solicitacao.aprovar"
                          fallback={
                            <span className="text-[10px] text-slate-500 italic">
                              Aprovação restrita à Gerência
                            </span>
                          }
                        >
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprove(ref.id)}
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Aprovar Cascata
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(ref.id)}
                            icon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Recusar
                          </Button>
                        </Can>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {ref.approvedBy ? `Por: ${ref.approvedBy}` : 'Concluído'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {displayList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    Nenhuma solicitação encontrada nesta aba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
