import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
  Lock,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  PieChart
} from 'lucide-react';
import {
  InventorySummaryDTO,
  EventSessionDTO,
  InventoryPoolDTO
} from '@shared/types/index';
import { fetchEventSessions } from '../api/sessions.api';
import { fetchInventorySummary, fetchInventoryPools } from '../api/inventory.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';

interface EventCapacityPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToSections?: () => void;
  onNavigateToPricing?: () => void;
}

export const EventCapacityPage: React.FC<EventCapacityPageProps> = ({
  eventId,
  eventName,
  onNavigateToSections,
  onNavigateToPricing
}) => {
  const [sessions, setSessions] = useState<EventSessionDTO[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [summary, setSummary] = useState<InventorySummaryDTO | null>(null);
  const [pools, setPools] = useState<InventoryPoolDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessList, sum] = await Promise.all([
        fetchEventSessions(eventId),
        fetchInventorySummary(eventId, selectedSessionId || undefined)
      ]);
      setSessions(sessList);
      setSummary(sum);

      const targetSessionId = selectedSessionId || sessList.find(s => s.isPrimary)?.id || sessList[0]?.id || '';
      if (targetSessionId) {
        setSelectedSessionId(targetSessionId);
        const poolList = await fetchInventoryPools(eventId, targetSessionId);
        setPools(poolList);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar decomposição de capacidade');
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedSessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    try {
      setLoading(true);
      const [sum, poolList] = await Promise.all([
        fetchInventorySummary(eventId, sessionId),
        fetchInventoryPools(eventId, sessionId)
      ]);
      setSummary(sum);
      setPools(poolList);
    } catch (err: any) {
      setError(err.message || 'Erro ao trocar de sessão');
    } finally {
      setLoading(false);
    }
  };

  const operational = summary?.totalOperationalCapacity || 0;
  const reserved = summary?.totalReservedCapacity || 0;
  const blocked = summary?.totalBlockedCapacity || 0;
  const held = summary?.totalHeldCapacity || 0;
  const sold = summary?.totalSoldCapacity || 0;
  const available = summary?.totalAvailableCommercial || 0;

  const reservedPct = operational > 0 ? ((reserved / operational) * 100).toFixed(1) : '0';
  const blockedPct = operational > 0 ? ((blocked / operational) * 100).toFixed(1) : '0';
  const heldPct = operational > 0 ? ((held / operational) * 100).toFixed(1) : '0';
  const soldPct = operational > 0 ? ((sold / operational) * 100).toFixed(1) : '0';
  const availablePct = operational > 0 ? ((available / operational) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
            <PieChart className="w-3.5 h-3.5" />
            <span>Fase 1.2.5 — Decomposição 360° de Capacidade</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Decomposição de Capacidade Real
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventName ? `Evento: ${eventName}` : 'Estrutura física, retenções operacionais e estoque vendável real'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToSections && (
            <button
              onClick={onNavigateToSections}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Gerenciar Setores</span>
            </button>
          )}
          {onNavigateToPricing && (
            <button
              onClick={onNavigateToPricing}
              className="px-3.5 py-1.5 text-xs font-medium bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Matriz de Preços</span>
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Session Filter */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300">Filtrar por Sessão:</span>
        </div>
        <select
          value={selectedSessionId}
          onChange={e => handleSessionChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.name || s.publicCode} {s.isPrimary ? '★ (Principal)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Pipeline of Capacity Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Funil de Decomposição Operacional
        </h2>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Step 1: Física */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Estrutura Física</span>
            <p className="text-xl font-bold text-slate-200">{formatNumber(summary?.totalPhysicalCapacity || 0)}</p>
            <p className="text-[11px] text-slate-400 leading-tight">Capacidade total do local</p>
          </div>

          {/* Step 2: Operacional Evento */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-brand-400 block">2. Operacional Sessão</span>
            <p className="text-xl font-bold text-brand-300">{formatNumber(operational)}</p>
            <p className="text-[11px] text-slate-400 leading-tight">Configurado para o evento</p>
          </div>

          {/* Step 3: Reservas Técnicas */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Reservas Técnicas</span>
            <p className="text-xl font-bold text-slate-300">-{formatNumber(reserved)}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{reservedPct}% da capacidade</p>
          </div>

          {/* Step 4: Bloqueios */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">4. Bloqueios & Buffers</span>
            <p className="text-xl font-bold text-amber-300">-{formatNumber(blocked)}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{blockedPct}% bombeiros / segurança</p>
          </div>

          {/* Step 5: Vendidos */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">5. Vendidos / Hold</span>
            <p className="text-xl font-bold text-blue-300">-{formatNumber(sold + held)}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{soldPct}% vendidos + {heldPct}% hold</p>
          </div>

          {/* Step 6: Disponível Real */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 shadow-lg shadow-emerald-500/5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">6. Disponível Real</span>
            <p className="text-xl font-bold text-emerald-300">{formatNumber(available)}</p>
            <p className="text-[11px] text-emerald-400/80 leading-tight">{availablePct}% vendável agora</p>
          </div>
        </div>

        {/* Global Progress Strip */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Distribuição Total ({operational} lugares):</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Vendidos ({soldPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Em Carrinho ({heldPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Bloqueados ({blockedPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" /> Reserva Técnica ({reservedPct}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Disponível ({availablePct}%)</span>
            </div>
          </div>

          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div style={{ width: `${soldPct}%` }} className="bg-blue-500 h-full" title={`Vendidos: ${sold}`} />
            <div style={{ width: `${heldPct}%` }} className="bg-purple-500 h-full" title={`Em Carrinho: ${held}`} />
            <div style={{ width: `${blockedPct}%` }} className="bg-amber-500 h-full" title={`Bloqueados: ${blocked}`} />
            <div style={{ width: `${reservedPct}%` }} className="bg-slate-600 h-full" title={`Reserva: ${reserved}`} />
            <div style={{ width: `${availablePct}%` }} className="bg-emerald-500 h-full" title={`Disponível: ${available}`} />
          </div>
        </div>
      </div>

      {/* Tabela de Decomposição por Setor */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Detalhamento por Setor Operacional
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3">Setor</th>
                <th className="pb-3 text-right">Capacidade</th>
                <th className="pb-3 text-right">Reserva Técnica</th>
                <th className="pb-3 text-right">Bloqueios</th>
                <th className="pb-3 text-right">Em Hold</th>
                <th className="pb-3 text-right">Vendidos</th>
                <th className="pb-3 text-right text-emerald-400">Disponível Real</th>
                <th className="pb-3 text-center">Taxa Ocupação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pools.map(pool => {
                const occ = pool.capacity > 0
                  ? Math.round(((pool.sold + pool.held + pool.blocked + pool.reserved) / pool.capacity) * 100)
                  : 0;

                return (
                  <tr key={pool.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-3 font-semibold text-slate-200">
                      {pool.sectionName || 'Setor'}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-200">
                      {formatNumber(pool.capacity)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-400">
                      {formatNumber(pool.reserved)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-amber-400">
                      {formatNumber(pool.blocked)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-purple-400">
                      {formatNumber(pool.held)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-blue-400">
                      {formatNumber(pool.sold)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-400">
                      {formatNumber(pool.available)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        occ > 90 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        occ > 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {occ}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
