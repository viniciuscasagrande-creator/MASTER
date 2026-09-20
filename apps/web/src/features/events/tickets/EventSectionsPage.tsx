import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Users,
  ShieldAlert,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Lock,
  Unlock,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  EventSectionDTO,
  EventSessionDTO,
  InventoryPoolDTO,
  EventTicketTypeDTO,
  InventorySummaryDTO,
  SaveInventoryAllocationInput,
  CreateInventoryBlockInput
} from '@shared/types/index';
import { fetchEventSessions } from '../api/sessions.api';
import { fetchEventTicketTypes } from '../api/ticket-types.api';
import {
  fetchInventorySummary,
  fetchInventoryPools,
  saveInventoryAllocation,
  createInventoryBlock,
  releaseInventoryBlock
} from '../api/inventory.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';
import { QuotaModal } from './QuotaModal';
import { InventoryBlockModal } from './InventoryBlockModal';

interface EventSectionsPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToTickets?: () => void;
  onNavigateToCapacity?: () => void;
}

export const EventSectionsPage: React.FC<EventSectionsPageProps> = ({
  eventId,
  eventName,
  onNavigateToTickets,
  onNavigateToCapacity
}) => {
  const [sessions, setSessions] = useState<EventSessionDTO[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [pools, setPools] = useState<InventoryPoolDTO[]>([]);
  const [ticketTypes, setTicketTypes] = useState<EventTicketTypeDTO[]>([]);
  const [summary, setSummary] = useState<InventorySummaryDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [quotaModalPool, setQuotaModalPool] = useState<InventoryPoolDTO | null>(null);
  const [blockModalPool, setBlockModalPool] = useState<InventoryPoolDTO | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessList, ttList, sum] = await Promise.all([
        fetchEventSessions(eventId),
        fetchEventTicketTypes(eventId),
        fetchInventorySummary(eventId)
      ]);

      setSessions(sessList);
      setTicketTypes(ttList);
      setSummary(sum);

      const targetSessionId = selectedSessionId || sessList.find(s => s.isPrimary)?.id || sessList[0]?.id || '';
      if (targetSessionId) {
        setSelectedSessionId(targetSessionId);
        const poolList = await fetchInventoryPools(eventId, targetSessionId);
        setPools(poolList);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar setores e inventário');
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
      const [poolList, sum] = await Promise.all([
        fetchInventoryPools(eventId, sessionId),
        fetchInventorySummary(eventId, sessionId)
      ]);
      setPools(poolList);
      setSummary(sum);
    } catch (err: any) {
      setError(err.message || 'Erro ao trocar de sessão');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllocation = async (poolId: string, input: SaveInventoryAllocationInput) => {
    await saveInventoryAllocation(eventId, poolId, input);
    await loadData();
  };

  const handleCreateBlock = async (poolId: string, input: CreateInventoryBlockInput) => {
    await createInventoryBlock(eventId, poolId, input);
    await loadData();
  };

  const handleReleaseBlock = async (blockId: string) => {
    await releaseInventoryBlock(eventId, blockId);
    await loadData();
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Fase 1.2.5 — Setores & Inventário Vendável</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Setores Operacionais do Evento
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventName ? `Evento: ${eventName}` : 'Gerenciamento de setores, capacidade física vs operacional e cotas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToTickets && (
            <button
              onClick={onNavigateToTickets}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Ver Modalidades de Ingresso</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {onNavigateToCapacity && (
            <button
              onClick={onNavigateToCapacity}
              className="px-3.5 py-1.5 text-xs font-medium bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visão de Capacidade 360°</span>
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

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Reais (Sem dados fictícios) */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            title="Capacidade Total"
            value={formatNumber(summary.totalOperationalCapacity)}
            subtitle={`${summary.sectionsCount} setores ativos`}
            icon={<Building2 className="w-4 h-4 text-orange-400" />}
          />
          <StatCard
            title="Disponível Comercial"
            value={formatNumber(summary.totalAvailableCommercial)}
            subtitle="Inventário vendável em tempo real"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            title="Vendidos / Ocupados"
            value={formatNumber(summary.totalSoldCapacity)}
            subtitle="Ingressos confirmados"
            icon={<Users className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            title="Bloqueios & Buffers"
            value={formatNumber(summary.totalBlockedCapacity)}
            subtitle="Técnico, bombeiros, patrocínio"
            icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            title="Em Carrinho (Held)"
            value={formatNumber(summary.totalHeldCapacity)}
            subtitle="Reservas atômicas com TTL"
            icon={<Lock className="w-4 h-4 text-purple-400" />}
          />
        </div>
      )}

      {/* Seletor de Sessão */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300">Sessão Operacional:</span>
        </div>
        {sessions.length === 0 ? (
          <span className="text-xs text-amber-400">Nenhuma sessão encontrada para este evento.</span>
        ) : (
          <select
            value={selectedSessionId}
            onChange={e => handleSessionChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.publicCode} {s.isPrimary ? '★ (Principal)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid de Setores Operacionais / Pools */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>Setores e Estoque Compartilhado</span>
          <span className="text-xs font-normal text-slate-500">
            (Modalidades de ingresso compartilham o pool do setor sem duplicar ingressos)
          </span>
        </h2>

        {pools.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-300">Nenhum setor operacional carregado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Vincule um local físico com setores ao evento para inicializar os pools de inventário vendável.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pools.map(pool => {
              const occupancyPct = pool.capacity > 0
                ? Math.min(100, Math.round(((pool.sold + pool.blocked + pool.reserved + pool.held) / pool.capacity) * 100))
                : 0;

              return (
                <div
                  key={pool.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
                >
                  {/* Top: Section Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                        <span>{pool.sectionName || 'Setor'}</span>
                        <Badge variant="slate" size="sm">
                          Pool #{pool.id.substring(0, 6)}
                        </Badge>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Capacidade Operacional: <strong className="text-slate-200">{formatNumber(pool.capacity)}</strong> lugares
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQuotaModalPool(pool)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1 transition-colors"
                        title="Configurar cotas de modalidades"
                      >
                        <PieChart className="w-3.5 h-3.5 text-brand-400" />
                        <span>Cotas</span>
                      </button>
                      <button
                        onClick={() => setBlockModalPool(pool)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl flex items-center gap-1 transition-colors"
                        title="Bloquear capacidade operacional"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar of Capacity */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Ocupação do Setor ({occupancyPct}%)</span>
                      <span>
                        <strong className="text-emerald-400 font-semibold">{formatNumber(pool.available)}</strong> disponíveis para venda
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                      {/* Sold */}
                      <div
                        style={{ width: `${(pool.sold / pool.capacity) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Vendidos: ${pool.sold}`}
                      />
                      {/* Held */}
                      <div
                        style={{ width: `${(pool.held / pool.capacity) * 100}%` }}
                        className="bg-purple-500 h-full"
                        title={`Em Carrinho (Held): ${pool.held}`}
                      />
                      {/* Blocked */}
                      <div
                        style={{ width: `${(pool.blocked / pool.capacity) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`Bloqueados: ${pool.blocked}`}
                      />
                      {/* Reserved */}
                      <div
                        style={{ width: `${(pool.reserved / pool.capacity) * 100}%` }}
                        className="bg-slate-600 h-full"
                        title={`Reserva Técnica: ${pool.reserved}`}
                      />
                    </div>
                  </div>

                  {/* Breakdown Numbers */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Vendidos</span>
                      <span className="text-xs font-semibold text-blue-400">{formatNumber(pool.sold)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Em Hold</span>
                      <span className="text-xs font-semibold text-purple-400">{formatNumber(pool.held)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Bloqueados</span>
                      <span className="text-xs font-semibold text-amber-400">{formatNumber(pool.blocked)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Reserva Téc.</span>
                      <span className="text-xs font-semibold text-slate-400">{formatNumber(pool.reserved)}</span>
                    </div>
                  </div>

                  {/* Cotas Configuradas neste Setor */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Cotas Definidas por Ingresso</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {(pool.allocations || []).length} regra(s)
                      </span>
                    </h4>

                    {(!pool.allocations || pool.allocations.length === 0) ? (
                      <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                        Nenhuma cota restritiva. Todos os tipos de ingresso compartilham o pool livremente.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {pool.allocations.map(alloc => (
                          <div
                            key={alloc.id}
                            className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-200">{alloc.ticketTypeName || 'Ingresso'}</span>
                              <Badge variant="slate" size="sm">
                                {alloc.allocationType === 'PERCENTAGE'
                                  ? `${alloc.allocationValue}% do setor`
                                  : alloc.allocationType === 'FIXED'
                                  ? `${formatNumber(alloc.allocationValue)} fixos`
                                  : 'Ilimitado'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-300 font-semibold">{formatNumber(alloc.availableQuantity)}</span>
                              <span className="text-slate-400 text-[10px] ml-1">restantes</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bloqueios Ativos */}
                  {pool.blocks && pool.blocks.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Bloqueios Operacionais Ativos</span>
                      </h4>
                      <div className="space-y-1.5">
                        {pool.blocks.map(block => (
                          <div
                            key={block.id}
                            className="flex items-center justify-between p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs"
                          >
                            <div>
                              <p className="font-medium text-slate-200">
                                {block.reason === 'SECURITY_BUFFER' ? 'Buffer de Segurança' :
                                 block.reason === 'TECHNICAL_HOLD' ? 'Reserva Técnica' :
                                 block.reason === 'SPONSOR_HOLD' ? 'Cota Patrocinador' : 'Outro Bloqueio'}
                                <span className="text-amber-400 ml-1.5 font-semibold">({block.quantity} lugares)</span>
                              </p>
                              {block.notes && <p className="text-[11px] text-slate-400">{block.notes}</p>}
                            </div>
                            <button
                              onClick={() => handleReleaseBlock(block.id)}
                              className="px-2 py-1 text-[11px] text-amber-300 hover:text-white hover:bg-amber-600/30 rounded border border-amber-500/30 transition-colors"
                            >
                              Liberar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {quotaModalPool && (
        <QuotaModal
          isOpen={true}
          onClose={() => setQuotaModalPool(null)}
          onSave={handleSaveAllocation}
          pool={quotaModalPool}
          ticketTypes={ticketTypes}
        />
      )}

      {blockModalPool && (
        <InventoryBlockModal
          isOpen={true}
          onClose={() => setBlockModalPool(null)}
          onSave={handleCreateBlock}
          pool={blockModalPool}
        />
      )}
    </div>
  );
};
