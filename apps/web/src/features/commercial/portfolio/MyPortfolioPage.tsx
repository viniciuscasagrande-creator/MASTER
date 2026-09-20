import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  Building2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import {
  CommercialPortfolioSummaryDTO,
  ProducerCommercialSummaryDTO,
  CommercialStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { StatCard } from '../../../shared/components/StatCard';
import { formatCnpj, formatDate } from '../../../shared/utils/formatters';

interface MyPortfolioPageProps {
  onSelectProducer: (producerId: string) => void;
  onNavigateToOpportunities?: () => void;
}

export const MyPortfolioPage: React.FC<MyPortfolioPageProps> = ({
  onSelectProducer,
  onNavigateToOpportunities
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CommercialPortfolioSummaryDTO | null>(null);
  const [producers, setProducers] = useState<ProducerCommercialSummaryDTO[]>([]);
  const [search, setSearch] = useState('');

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, prodRes] = await Promise.all([
        CommercialApi.getMyPortfolioSummary(),
        CommercialApi.getMyPortfolioProducers()
      ]);
      setSummary(sumRes);
      setProducers(prodRes || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar carteira comercial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const filteredProducers = producers.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.producer.name.toLowerCase().includes(term) ||
      p.producer.cnpj.includes(term)
    );
  });

  const priorityProducers = producers.filter((p) => {
    if (!p.nextActionAt) return false;
    const actionDate = new Date(p.nextActionAt);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return actionDate <= today;
  });

  const getStatusBadge = (st?: CommercialStatus | string) => {
    switch (st) {
      case 'ACTIVE':
      case 'ATIVO':
        return <Badge variant="emerald">Ativo</Badge>;
      case 'PROSPECT':
        return <Badge variant="cyan">Prospect</Badge>;
      case 'SUSPENDED':
      case 'SUSPENSO':
        return <Badge variant="rose">Suspenso</Badge>;
      case 'CLOSED':
        return <Badge variant="rose">Encerrado</Badge>;
      default:
        return <Badge variant="slate">Inativo</Badge>;
    }
  };

  const getClassificationBadge = (cl?: string) => {
    switch (cl) {
      case 'ESTRATEGICO':
        return <Badge variant="purple">Estratégico</Badge>;
      case 'KEY_ACCOUNT':
        return <Badge variant="orange">Key Account</Badge>;
      case 'NOVO':
        return <Badge variant="cyan">Novo</Badge>;
      case 'REGULAR':
        return <Badge variant="slate">Regular</Badge>;
      default:
        return <Badge variant="slate">Geral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-orange-400" />
              MINHA CARTEIRA COMERCIAL
            </h1>
            <Badge variant="orange" size="sm">Executivo B2B</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Painel de gestão de produtores atribuídos, ações prioritárias e acompanhamento de receita
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPortfolio}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
          {onNavigateToOpportunities && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToOpportunities}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            >
              Ver Meu Funil
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Meus Produtores"
          value={summary?.producersCount || 0}
          subtitle="Contas sob minha gestão"
          icon={<Building2 className="h-4 w-4 text-orange-400" />}
        />
        <StatCard
          title="Eventos Ativos"
          value={summary?.activeEventsCount || 0}
          subtitle="Eventos em venda na carteira"
          icon={<Calendar className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          title="Oportunidades"
          value={summary?.openOpportunitiesCount || 0}
          subtitle="Negociações abertas no pipeline"
          icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}
        />
        <StatCard
          title="Ações Pendentes"
          value={summary?.pendingActionsCount || 0}
          subtitle="Tarefas agendadas na carteira"
          icon={<Clock className="h-4 w-4 text-amber-400" />}
        />
        <StatCard
          title="Ações Vencidas"
          value={summary?.overdueActionsCount || 0}
          subtitle="Exigem contato imediato"
          badge={summary && summary.overdueActionsCount > 0 ? 'Atrasada' : 'Em dia'}
          badgeVariant={summary && summary.overdueActionsCount > 0 ? 'rose' : 'emerald'}
          icon={<AlertCircle className="h-4 w-4 text-rose-400" />}
        />
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Priority Actions Box */}
      {priorityProducers.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Prioridades Comerciais do Dia / Ações Vencidas ({priorityProducers.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Estes produtores possuem prazos de alinhamento vencidos ou agendados para hoje.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {priorityProducers.map((prod) => {
              const isOverdue = new Date(prod.nextActionAt!) < new Date();
              return (
                <div
                  key={prod.producer.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5 flex flex-col justify-between hover:border-orange-500/50 transition-colors cursor-pointer"
                  onClick={() => onSelectProducer(prod.producer.id)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate">
                        {prod.producer.name}
                      </span>
                      {isOverdue ? (
                        <Badge variant="rose" size="sm">Atrasada</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Hoje</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Data limite: {formatDate(prod.nextActionAt!)}
                    </div>
                    {prod.nextActionDescription && (
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                        {prod.nextActionDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {prod.activeEventsCount} eventos ativos
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProducer(prod.producer.id);
                      }}
                      icon={<ChevronRight className="h-3 w-3" />}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Full Portfolio List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Todos os Produtores da Minha Carteira</h3>
            <span className="text-xs text-slate-400 font-mono">
              {filteredProducers.length} produtores encontrados
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Produtor / Razão Social</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3 text-center">Eventos Ativos</th>
                <th className="px-4 py-3 text-center">Oportunidades</th>
                <th className="px-4 py-3">Último Contato</th>
                <th className="px-4 py-3">Próxima Ação</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && producers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-400" />
                    Carregando carteira de produtores...
                  </td>
                </tr>
              ) : filteredProducers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Nenhum produtor atribuído a esta carteira comercial.
                  </td>
                </tr>
              ) : (
                filteredProducers.map((prod) => {
                  const isActionOverdue =
                    prod.nextActionAt && new Date(prod.nextActionAt) < new Date();

                  return (
                    <tr
                      key={prod.producer.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectProducer(prod.producer.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {prod.producer.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          CNPJ: {formatCnpj(prod.producer.cnpj)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(prod.commercialAccount?.commercialStatus || 'ACTIVE')}
                      </td>
                      <td className="px-4 py-3">
                        {getClassificationBadge(prod.commercialAccount?.commercialClassification)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400 font-bold">
                        {prod.activeEventsCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={prod.openOpportunitiesCount > 0 ? 'orange' : 'slate'} size="sm">
                          {prod.openOpportunitiesCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                        {prod.lastContactAt ? formatDate(prod.lastContactAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {prod.nextActionAt ? (
                          <span
                            className={`font-mono text-xs font-medium ${
                              isActionOverdue ? 'text-rose-400' : 'text-slate-200'
                            }`}
                          >
                            {formatDate(prod.nextActionAt)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProducer(prod.producer.id);
                          }}
                          icon={<ChevronRight className="h-3.5 w-3.5" />}
                        >
                          Visão Comercial
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
