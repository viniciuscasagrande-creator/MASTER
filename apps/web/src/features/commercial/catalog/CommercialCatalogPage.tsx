import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  Sparkles,
  Package,
  Cpu,
  Search,
  Plus,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Archive
} from 'lucide-react';
import {
  CommercialOfferingDTO,
  CommercialCatalogMetricsDTO,
  CommercialOfferingType,
  CommercialOfferingCategoryDTO
} from '@shared/types/index';
import { CommercialCatalogApi } from './api/commercial-catalog.api';
import { CreateOfferingModal } from './components/CreateOfferingModal';
import { DiscontinueOfferingModal } from './components/DiscontinueOfferingModal';
import { StatCard } from '../../../shared/components/StatCard';
import { Button } from '../../../shared/components/Button';

interface CommercialCatalogPageProps {
  onSelectOffering: (offeringId: string) => void;
}

type TabType = 'ALL' | 'PLANS' | 'PACKAGES' | 'SERVICES' | 'TERMS';

export const CommercialCatalogPage: React.FC<CommercialCatalogPageProps> = ({
  onSelectOffering
}) => {
  const [offerings, setOfferings] = useState<CommercialOfferingDTO[]>([]);
  const [categories, setCategories] = useState<CommercialOfferingCategoryDTO[]>([]);
  const [metrics, setMetrics] = useState<CommercialCatalogMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [discontinuingOffering, setDiscontinuingOffering] = useState<CommercialOfferingDTO | null>(null);

  const loadCatalogData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [met, offs, cats] = await Promise.all([
        CommercialCatalogApi.getMetrics(),
        CommercialCatalogApi.listOfferings(),
        CommercialCatalogApi.listCategories()
      ]);
      setMetrics(met);
      setOfferings(offs);
      setCategories(cats);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar catálogo comercial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  // Filtragem local baseada na tab e busca
  const filteredOfferings = offerings.filter(off => {
    if (activeTab === 'PLANS' && off.type !== 'PLAN') return false;
    if (activeTab === 'PACKAGES' && off.type !== 'PACKAGE') return false;
    if (activeTab === 'SERVICES' && off.type !== 'SERVICE' && off.type !== 'ADD_ON') return false;

    if (categoryFilter !== 'ALL' && off.categoryId !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && off.status !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = off.name.toLowerCase().includes(q);
      const matchCode = off.code.toLowerCase().includes(q);
      const matchPublic = off.publicCode.toLowerCase().includes(q);
      const matchDesc = off.description?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPublic && !matchDesc) return false;
    }

    return true;
  });

  const getTypeBadge = (type: CommercialOfferingType) => {
    switch (type) {
      case 'PLAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <Sparkles className="h-3 w-3" /> Plano Oficial
          </span>
        );
      case 'PACKAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <Package className="h-3 w-3" /> Pacote Combo
          </span>
        );
      case 'SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Layers className="h-3 w-3" /> Serviço
          </span>
        );
      case 'MODULE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
            <Cpu className="h-3 w-3" /> Módulo
          </span>
        );
      case 'ADD_ON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            Insumo Físico
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Ativo
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            Rascunho
          </span>
        );
      case 'DISCONTINUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <Archive className="h-3 w-3" /> Descontinuado
          </span>
        );
      default:
        return null;
    }
  };

  const formatDefaultPrice = (off: CommercialOfferingDTO) => {
    if (off.defaultPricingModel === 'PERCENTAGE' && off.defaultPercentage !== null && off.defaultPercentage !== undefined) {
      return `${off.defaultPercentage}% sobre ingressos`;
    }
    if (off.defaultAmount !== null && off.defaultAmount !== undefined) {
      return `R$ ${off.defaultAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return 'Sob Consulta';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-orange-500 dark:text-orange-400" />
            Catálogo Comercial & Condições Padrão
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fonte oficial de Planos, Pacotes e Serviços DiskIngressos para produtores, com versionamento imutável.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCatalogData}
            loading={loading}
            className="gap-2 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Nova Oferta Comercial
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ofertas Ativas no Catálogo"
            value={metrics.activeCount}
            subtitle={`${metrics.totalOfferings} ofertas cadastradas no total`}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
          />
          <StatCard
            title="Planos Oficiais Disk"
            value={metrics.plansCount}
            subtitle="Plataforma de ticketeria digital"
            icon={<Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />}
          />
          <StatCard
            title="Pacotes Comerciais (Combos)"
            value={metrics.packagesCount}
            subtitle="Soluções operacionais completas"
            icon={<Package className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
          />
          <StatCard
            title="Serviços & Adicionais"
            value={metrics.servicesCount + metrics.addOnsCount}
            subtitle="Equipamentos, bilheteria e portaria"
            icon={<Layers className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-4 gap-6 text-sm overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todas as Ofertas', count: offerings.length },
            { id: 'PLANS', label: 'Planos Oficiais', count: metrics?.plansCount },
            { id: 'PACKAGES', label: 'Pacotes (Combos)', count: metrics?.packagesCount },
            { id: 'SERVICES', label: 'Serviços Individuais', count: (metrics?.servicesCount || 0) + (metrics?.addOnsCount || 0) }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 border-b-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, código público (OFR-...) ou escopo..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="DRAFT">Rascunhos</option>
              <option value="DISCONTINUED">Descontinuados</option>
            </select>
          </div>
        </div>

        {/* Offerings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Código / Oferta</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5">Categoria</th>
                <th className="px-6 py-3.5">Versão Ativa</th>
                <th className="px-6 py-3.5">Condição Padrão</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Carregando catálogo comercial...
                  </td>
                </tr>
              ) : filteredOfferings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    Nenhuma oferta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOfferings.map(off => (
                  <tr
                    key={off.id}
                    onClick={() => onSelectOffering(off.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-semibold group-hover:underline">
                          {off.publicCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {off.name}
                        </span>
                        {off.shortDescription && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {off.shortDescription}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(off.type)}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {off.categoryName || 'Geral'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          v{off.currentVersionNumber}
                        </span>
                        {off.currentVersion?.contentHash && (
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            ({off.currentVersion.contentHash.substring(0, 8)}...)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-200">
                      {formatDefaultPrice(off)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(off.status)}
                    </td>

                    <td
                      className="px-6 py-4 text-right whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectOffering(off.id)}
                          className="h-8 px-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-500/10 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Detalhes
                        </Button>

                        {off.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDiscontinuingOffering(off)}
                            className="h-8 px-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            title="Descontinuar Oferta"
                          >
                            <Archive className="h-4 w-4" />
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

      {/* Modals */}
      <CreateOfferingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={newOff => {
          loadCatalogData();
          onSelectOffering(newOff.id);
        }}
      />

      {discontinuingOffering && (
        <DiscontinueOfferingModal
          isOpen={Boolean(discontinuingOffering)}
          onClose={() => setDiscontinuingOffering(null)}
          offering={discontinuingOffering}
          onDiscontinued={() => {
            loadCatalogData();
          }}
        />
      )}
    </div>
  );
};
