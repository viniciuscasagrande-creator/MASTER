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
  FileSpreadsheet,
  ShieldCheck,
  X
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
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

      setActionSuccess(`Transferência ${reversingTransfer.transferNumber} revertida com emissão de compensação contábil.`);
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

  const getStatusBadge = (status: EventTransferUI['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="emerald" size="sm">Concluída</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="orange" size="sm">Pendente Aprovação</Badge>;
      case 'APPROVED':
        return <Badge variant="cyan" size="sm">Aprovada</Badge>;
      case 'REVERTED':
        return <Badge variant="purple" size="sm">Revertida (Compensada)</Badge>;
      case 'REJECTED':
        return <Badge variant="rose" size="sm">Rejeitada</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              TRANSFERÊNCIAS ENTRE EVENTOS
            </h2>
            <Badge variant="emerald" size="sm">
              SafeSaff Multi-Evento
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Remanejamento controlado de saldos entre eventos do mesmo produtor. As operações preservam a segregação contábil, histórico e alçadas de aprovação.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Mini Event Balance Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {eventBalances.slice(0, 4).map(ev => (
          <div key={ev.eventId} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
            <span className="text-[11px] font-semibold text-slate-400 block truncate" title={ev.eventTitle}>
              {ev.eventTitle}
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">
                {formatCurrency(ev.availableBalance)}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Disponível</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
              <span>Transf. Entradas: {formatCurrency(ev.transfersIn || 0)}</span>
              <span>Saídas: {formatCurrency(ev.transfersOut || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por código, evento ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos os Status</option>
              <option value="COMPLETED" className="bg-slate-900">Concluídas</option>
              <option value="PENDING_APPROVAL" className="bg-slate-900">Pendente Aprovação</option>
              <option value="REVERTED" className="bg-slate-900">Revertidas</option>
              <option value="REJECTED" className="bg-slate-900">Rejeitadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Evento de Origem (Débito)</th>
                <th className="px-4 py-3.5">Evento de Destino (Crédito)</th>
                <th className="px-4 py-3.5">Valor (R$)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Solicitante</th>
                <th className="px-4 py-3.5">Data / Hora</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Nenhuma transferência entre eventos registrada até o momento.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      {t.transferNumber}
                      {t.reversalTransferId && (
                        <span className="block text-[10px] text-purple-400 font-mono">
                          Ref: {t.reversalTransferId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-white block">{t.fromEventTitle}</span>
                      <span className="text-[10px] text-slate-500">ID: {t.fromEventId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-emerald-400 block">{t.toEventTitle}</span>
                      <span className="text-[10px] text-slate-500">ID: {t.toEventId}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white block">{t.requestedBy}</span>
                      {t.approvedBy && (
                        <span className="text-[10px] text-slate-500">Aprov: {t.approvedBy}</span>
                      )}
                      {t.revertedBy && (
                        <span className="text-[10px] text-purple-400">Rev: {t.revertedBy}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
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
                            icon={<RotateCcw className="h-3 w-3 text-purple-400" />}
                          >
                            Reverter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reverter Transferência */}
      {reversingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reverter Transferência</h3>
                  <p className="text-xs text-slate-400 font-mono">{reversingTransfer.transferNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setReversingTransfer(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRevert} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor a Estornar:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(reversingTransfer.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origem original:</span>
                  <span className="text-white">{reversingTransfer.fromEventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destino original:</span>
                  <span className="text-white">{reversingTransfer.toEventTitle}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Compensação Contábil Factual:</strong> O sistema criará uma transferência compensatória reversa (Débito no destino e Crédito na origem) preservando a integridade e histórico auditado.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo da Reversão (Obrigatório)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Cancelamento de serviço terceirizado ou erro de digitação do valor..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
