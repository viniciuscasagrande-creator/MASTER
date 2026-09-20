import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Ticket,
  Users,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import {
  ComplimentaryRequestDTO,
  ComplimentaryQuotaDTO,
  ComplimentaryCategoryDTO,
  ComplimentaryRequestStatus
} from '@shared/types/index';
import {
  fetchComplimentaryRequests,
  fetchComplimentaryQuotas,
  fetchComplimentaryCategories
} from '../api/complimentary.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { ComplimentaryRequestModal } from './ComplimentaryRequestModal';
import { ComplimentaryDetailsModal } from './ComplimentaryDetailsModal';

interface ComplimentaryPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToInventory?: () => void;
}

const STATUS_BADGES: Record<ComplimentaryRequestStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  SUBMITTED: { label: 'Aguardando Aprovação', variant: 'warning' },
  APPROVAL_PENDING: { label: 'Em Análise', variant: 'warning' },
  APPROVED: { label: 'Aprovada (Pronta para Emissão)', variant: 'info' },
  ISSUING: { label: 'Emitindo...', variant: 'info' },
  PARTIALLY_ISSUED: { label: 'Parcialmente Emitida', variant: 'info' },
  ISSUED: { label: 'Emitida no Inventário', variant: 'success' },
  REJECTED: { label: 'Rejeitada', variant: 'danger' },
  CANCELLED: { label: 'Cancelada', variant: 'default' },
  DRAFT: { label: 'Rascunho', variant: 'default' }
};

export const ComplimentaryPage: React.FC<ComplimentaryPageProps> = ({
  eventId,
  eventName,
  onNavigateToInventory
}) => {
  const [requests, setRequests] = useState<ComplimentaryRequestDTO[]>([]);
  const [quotas, setQuotas] = useState<ComplimentaryQuotaDTO[]>([]);
  const [categories, setCategories] = useState<ComplimentaryCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ComplimentaryRequestDTO | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqData, qData, catData] = await Promise.all([
        fetchComplimentaryRequests(eventId),
        fetchComplimentaryQuotas(eventId),
        fetchComplimentaryCategories(eventId)
      ]);
      setRequests(reqData || []);
      setQuotas(qData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Erro ao carregar cortesias:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de métricas oficiais
  const totalRequested = requests.reduce((sum, r) => sum + r.quantity, 0);
  const totalIssued = requests.reduce((sum, r) => sum + (r.quantityIssued || 0), 0);
  const pendingCount = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVAL_PENDING').length;
  const totalQuotaLimit = quotas.reduce((sum, q) => sum + q.quantityLimit, 0);
  const totalQuotaUsed = quotas.reduce((sum, q) => sum + q.quantityUsed, 0);
  const totalQuotaReserved = quotas.reduce((sum, q) => sum + q.quantityReserved, 0);

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Central de Cortesias & Convites</h1>
            <Badge variant="info">Fase 1.2.7</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de cotas de imprensa, patrocinadores e convidados com reserva e emissão direta sobre o inventário oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>Solicitar Cortesia</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Solicitado"
          value={formatNumber(totalRequested)}
          subtitle={`${requests.length} pedidos registrados`}
          icon={<Gift className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          title="Ingressos Emitidos"
          value={formatNumber(totalIssued)}
          subtitle="Consumidos do Pool Oficial"
          icon={<Ticket className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          title="Aguardando Aprovação"
          value={formatNumber(pendingCount)}
          subtitle="Pedidos pendentes de decisão"
          icon={<Clock className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          title="Cotas Autorizadas"
          value={`${formatNumber(totalQuotaUsed + totalQuotaReserved)} / ${formatNumber(totalQuotaLimit)}`}
          subtitle="Utilizadas + Reservadas"
          icon={<Layers className="h-5 w-5 text-cyan-400" />}
        />
      </div>

      {/* Painel de Cotas por Setor */}
      {quotas.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Cotas de Cortesias por Setor</span>
            </div>
            {onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Ver Inventário Geral</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quotas.map(q => {
              const usedAndReserved = q.quantityUsed + q.quantityReserved;
              const percent = Math.min(100, Math.round((usedAndReserved / q.quantityLimit) * 100));

              return (
                <div key={q.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">
                      {q.sectionId ? 'Setor Operacional' : 'Cota Geral do Evento'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {usedAndReserved} / {q.quantityLimit} ({percent}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Emitidos: {q.quantityUsed}</span>
                    <span>Reservados: {q.quantityReserved}</span>
                    <span>Restantes: {Math.max(0, q.quantityLimit - usedAndReserved)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela de Solicitações */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Filtros de Status */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold mr-2">Filtrar:</span>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'SUBMITTED', label: 'Pendentes' },
              { id: 'APPROVED', label: 'Aprovadas' },
              { id: 'ISSUED', label: 'Emitidas' },
              { id: 'REJECTED', label: 'Rejeitadas' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === f.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filteredRequests.length} solicitação(ões)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Sessão & Setor</th>
                <th className="py-3 px-4 text-center">Qtd.</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequests.map(req => {
                const badgeInfo = STATUS_BADGES[req.status] || { label: req.status, variant: 'default' };

                return (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{req.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{req.categoryName}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{req.sectionName}</div>
                      <div className="text-[11px] text-slate-500">{req.sessionName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-white">{req.quantity}</span>
                      {req.quantityIssued > 0 && (
                        <div className="text-[10px] text-emerald-400">({req.quantityIssued} emit.)</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{req.requesterName}</div>
                      <div className="text-[11px] text-slate-500">{formatDateTime(req.createdAt)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    Nenhuma solicitação encontrada para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {isRequestModalOpen && (
        <ComplimentaryRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          eventId={eventId}
          onSaved={loadData}
        />
      )}

      {selectedRequest && (
        <ComplimentaryDetailsModal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          eventId={eventId}
          request={selectedRequest}
          onUpdated={loadData}
        />
      )}
    </div>
  );
};
