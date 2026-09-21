import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  X
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';
import { EventBalanceItemUI } from './EventBalancesView';
import { NewTransferModal } from './NewTransferModal';

export interface EventTransferUI {
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

interface TransfersViewProps {
  producerId: string;
  eventBalances: EventBalanceItemUI[];
  onRefreshBalances?: () => void;
  canApprove?: boolean;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  producerId,
  eventBalances,
  onRefreshBalances,
  canApprove = true
}) => {
  const [transfers, setTransfers] = useState<EventTransferUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Reversal State
  const [reversingTransfer, setReversingTransfer] = useState<EventTransferUI | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadTransfers = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/finance/transfers?producerId=${producerId}`, {
        headers: { 'x-producer-id': producerId }
      });
      if (res.ok) {
        const json = await res.json();
        setTransfers(json.data || []);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao carregar transferências.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [producerId]);

  const handleApprove = async (transferId: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/finance/transfers/${transferId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({ approvedBy: 'Maria Oliveira (Diretoria)' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Falha ao aprovar transferência.');

      setActionSuccess(`Transferência aprovada e liquidada com sucesso.`);
      loadTransfers();
      onRefreshBalances?.();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao aprovar transferência.');
    }
  };

  const handleExecuteRevert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingTransfer) return;
    if (!reversalReason.trim()) {
      setActionError('Informe o motivo da reversão para auditoria.');
      return;
    }

    setIsReverting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/finance/transfers/${reversingTransfer.id}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({ reason: reversalReason })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Falha ao reverter transferência.');

      setActionSuccess(`Transferência ${reversingTransfer.transferNumber} revertida com compensação contábil.`);
      setReversingTransfer(null);
      setReversalReason('');
      loadTransfers();
      onRefreshBalances?.();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao reverter transferência.');
    } finally {
      setIsReverting(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromEventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toEventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTransferred = transfers
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);
  const pendingCount = transfers.filter(t => t.status === 'PENDING_APPROVAL').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const revertedCount = transfers.filter(t => t.status === 'REVERTED').length;

  const getStatusBadge = (status: EventTransferUI['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <StatusBadge variant="success" label="Concluída" />;
      case 'PENDING_APPROVAL':
        return <StatusBadge variant="warning" label="Pendente Aprovação" />;
      case 'APPROVED':
        return <StatusBadge variant="info" label="Aprovada" />;
      case 'REVERTED':
        return <StatusBadge variant="purple" label="Revertida" />;
      case 'REJECTED':
        return <StatusBadge variant="danger" label="Rejeitada" />;
      default:
        return <StatusBadge variant="neutral" label={status} />;
    }
  };

  const columns: Column<EventTransferUI>[] = [
    {
      header: 'Código',
      width: '130px',
      accessor: (t) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{t.transferNumber}</span>
          {t.reversalTransferId && (
            <span className="block text-[10px] text-purple-600 font-mono">
              Ref: {t.reversalTransferId}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Origem (Débito)',
      accessor: (t) => (
        <div>
          <span className="font-semibold text-slate-800 block">{t.fromEventTitle}</span>
          <span className="text-[10px] text-slate-400">ID: {t.fromEventId}</span>
        </div>
      )
    },
    {
      header: 'Destino (Crédito)',
      accessor: (t) => (
        <div>
          <span className="font-semibold text-emerald-700 block">{t.toEventTitle}</span>
          <span className="text-[10px] text-slate-400">ID: {t.toEventId}</span>
        </div>
      )
    },
    {
      header: 'Valor',
      align: 'right',
      width: '140px',
      accessor: (t) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(t.amount)}
        </span>
      )
    },
    {
      header: 'Status',
      width: '150px',
      accessor: (t) => getStatusBadge(t.status)
    },
    {
      header: 'Solicitante & Data',
      width: '180px',
      accessor: (t) => (
        <div>
          <span className="text-slate-800 block font-medium">{t.requestedBy}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatDateTime(t.createdAt)}
          </span>
        </div>
      )
    },
    {
      header: 'Ações',
      align: 'right',
      width: '150px',
      accessor: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          {t.status === 'PENDING_APPROVAL' && canApprove && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApprove(t.id)}
              icon={<CheckCircle2 className="h-3 w-3" />}
            >
              Aprovar
            </Button>
          )}

          {t.status === 'COMPLETED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReversingTransfer(t)}
              icon={<RotateCcw className="h-3 w-3 text-purple-600" />}
            >
              Reverter
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Cards Row (120-140px Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL MOVIMENTADO"
          value={formatCurrency(totalTransferred)}
          subtitle="Remanejamentos concluídos"
          icon={<ArrowRightLeft className="h-4 w-4 text-slate-700" />}
          badge="Segregado"
          badgeVariant="slate"
        />

        <MetricCard
          title="TRANSFERÊNCIAS CONCLUÍDAS"
          value={completedCount}
          trend={{ value: 'Liquidadas entre saldos', isPositive: true }}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          badge="Efetivadas"
          badgeVariant="emerald"
        />

        <MetricCard
          title="PENDENTES DE APROVAÇÃO"
          value={pendingCount}
          subtitle="Aguardando autorização de alçada"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          badge="Em Análise"
          badgeVariant="amber"
        />

        <MetricCard
          title="TRANSFERÊNCIAS REVERTIDAS"
          value={revertedCount}
          subtitle="Compensações contábeis emitidas"
          icon={<RotateCcw className="h-4 w-4 text-purple-600" />}
          badge="Histórico Salvo"
          badgeVariant="purple"
        />
      </div>

      {/* FilterBar Toolbar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por código, evento ou motivo..."
        selects={[
          {
            id: 'filter-status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Todos os Status', value: 'ALL' },
              { label: 'Concluídas', value: 'COMPLETED' },
              { label: 'Pendente Aprovação', value: 'PENDING_APPROVAL' },
              { label: 'Revertidas', value: 'REVERTED' },
              { label: 'Rejeitadas', value: 'REJECTED' }
            ]
          }
        ]}
        hasActiveFilters={statusFilter !== 'ALL' || Boolean(searchTerm)}
        onClearFilters={() => {
          setStatusFilter('ALL');
          setSearchTerm('');
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadTransfers}
              disabled={isLoading}
              icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNewModalOpen(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Nova Transferência
            </Button>
          </div>
        }
      />

      {/* Transfers Data Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma transferência entre eventos registrada até o momento."
        emptyIcon={<ArrowRightLeft className="h-8 w-8 text-slate-300" />}
      />

      {/* Reversal Confirmation Modal */}
      {reversingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reverter Transferência</h3>
                  <p className="text-xs text-slate-500 font-mono">{reversingTransfer.transferNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReversingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRevert} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor a Reverter:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(reversingTransfer.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origem original:</span>
                  <span className="font-medium text-slate-800">{reversingTransfer.fromEventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destino original:</span>
                  <span className="font-medium text-slate-800">{reversingTransfer.toEventTitle}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Compensação Contábil Registrada:</strong> Uma movimentação reversa será gerada (Débito no destino e Crédito na origem) preservando o histórico auditado.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo da Reversão (Obrigatório)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Cancelamento de serviço terceirizado ou ajuste operacional..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReversingTransfer(null)}
                  disabled={isReverting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isReverting}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  {isReverting ? 'Processando...' : 'Confirmar Reversão'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Transfer Modal */}
      <NewTransferModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          loadTransfers();
          onRefreshBalances?.();
        }}
        eventBalances={eventBalances}
        producerId={producerId}
      />
    </div>
  );
};
