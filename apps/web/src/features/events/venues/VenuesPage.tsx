import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Layers,
  MapPin,
  Users,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { VenueDTO, VenueSummaryDTO, ListVenuesFilter, VenueType, VenueScope } from '@shared/types/index';
import { fetchVenues, fetchVenueSummary } from '../api/venues.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { VenueSummaryCards } from './VenueSummaryCards';
import { VenueCard, VENUE_TYPE_LABELS } from './VenueCard';
import { formatNumber } from '../../../shared/utils/formatters';
import { Badge } from '../../../shared/components/Badge';

interface VenuesPageProps {
  onSelectVenue: (venueId: string) => void;
  onCreateVenue: () => void;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({ onSelectVenue, onCreateVenue }) => {
  const { apiFetch, selectedProducerId, isGlobalScope } = useDiskContext();

  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<VenueSummaryDTO | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<VenueType | 'ALL'>('ALL');
  const [selectedScope, setSelectedScope] = useState<VenueScope | 'ALL'>('ALL');
  const [cityFilter, setCityFilter] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load summary KPIs
  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await fetchVenueSummary(
        selectedProducerId !== 'all' ? selectedProducerId : undefined,
        apiFetch
      );
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao carregar resumo de locais:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [selectedProducerId, apiFetch]);

  // Load venues catalog
  const loadVenues = useCallback(async (activeFilters: ListVenuesFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchVenues(activeFilters, apiFetch);
      setVenues(result.venues);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar locais');
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // Trigger search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      loadVenues({
        search: search.trim() || undefined,
        type: selectedType,
        scope: selectedScope,
        city: cityFilter.trim() || undefined,
        producerId: selectedProducerId !== 'all' ? selectedProducerId : undefined
      });
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, selectedType, selectedScope, cityFilter, selectedProducerId, loadVenues]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-orange-400" />
            Central de Locais, Mapas & Estrutura Física
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Catálogo operacional de venues, arenas e teatros com setorização física e mapas reutilizáveis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadSummary();
              loadVenues({
                search: search.trim() || undefined,
                type: selectedType,
                scope: selectedScope,
                city: cityFilter.trim() || undefined,
                producerId: selectedProducerId !== 'all' ? selectedProducerId : undefined
              });
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={onCreateVenue}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Novo Local Físico
          </button>
        </div>
      </div>

      {/* 2. Real KPI Summary Cards */}
      <VenueSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, cidade ou código do local..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9.5 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-52">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">Todos os Tipos</option>
              {Object.entries(VENUE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as any)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">Todos os Escopos</option>
              <option value="GLOBAL">Apenas Globais</option>
              <option value="PRODUCER">Apenas do Produtor</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 border border-slate-700 rounded-xl p-1 bg-slate-800/80 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Venues List / Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Carregando locais...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/30">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/20">
          <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Nenhum local encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {search || selectedType !== 'ALL' || selectedScope !== 'ALL'
              ? 'Tente ajustar os filtros de busca para encontrar o espaço desejado.'
              : 'Nenhum local físico cadastrado no escopo atual. Cadastre arenas, estádios ou teatros para associar aos seus eventos.'}
          </p>
          <button
            onClick={onCreateVenue}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Novo Local
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v) => (
            <VenueCard key={v.id} venue={v} onSelect={onSelectVenue} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Local</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5">Cidade / UF</th>
                <th className="px-4 py-3.5">Capacidade</th>
                <th className="px-4 py-3.5">Setores</th>
                <th className="px-4 py-3.5">Escopo</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {venues.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => onSelectVenue(v.id)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5 font-bold text-white">
                    <div>{v.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{v.publicCode}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="cyan" size="sm">
                      {VENUE_TYPE_LABELS[v.type] || v.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {v.city} - {v.state}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-white">
                    {v.capacity ? formatNumber(v.capacity) : '—'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-cyan-400">
                    {v.sectionsCount ?? v.sections?.length ?? 0}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] text-slate-400">
                      {v.scope === 'GLOBAL' ? 'Global' : 'Produtor'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {v.status === 'ACTIVE' ? 'Ativo' : 'Arquivado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
