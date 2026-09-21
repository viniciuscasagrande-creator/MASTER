import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  UserCheck,
  Briefcase,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  ProducerCommercialSummaryDTO,
  CommercialStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { StatCard } from '../../../shared/components/StatCard';
import { Modal } from '../../../shared/components/Modal';
import { formatCnpj, formatDate } from '../../../shared/utils/formatters';

interface ProducersPageProps {
  onSelectProducer: (producerId: string) => void;
  onNavigateToLeads?: () => void;
}

export const ProducersPage: React.FC<ProducersPageProps> = ({
  onSelectProducer,
  onNavigateToLeads
}) => {
  const [loading, setLoading] = useState(true);
  const [producers, setProducers] = useState<ProducerCommercialSummaryDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [segmentId, setSegmentId] = useState<string>('');
  const [classification, setClassification] = useState<string>('');
  const [commercialStatus, setCommercialStatus] = useState<string>('');

  // Modal: Nova Prospecção / Produtor
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [createForm, setCreateForm] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    segmentId: 'SHOWS_FESTIVAIS',
    notes: ''
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const loadProducers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.listProducers({
        search: search.trim() || undefined,
        segmentId: segmentId || undefined,
        classification: classification || undefined,
        commercialStatus: commercialStatus || undefined,
        pageSize: 100
      });
      setProducers(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar central de produtores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducers();
  }, [segmentId, classification, commercialStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducers();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.companyName.trim()) {
      setCreateError('Razão Social / Nome da Empresa é obrigatório.');
      return;
    }
    try {
      setCreatingLead(true);
      setCreateError(null);
      await CommercialApi.createLead({
        companyName: createForm.companyName.trim(),
        tradeName: createForm.tradeName.trim() || undefined,
        cnpj: createForm.cnpj.trim() || undefined,
        contactName: createForm.contactName.trim() || undefined,
        contactEmail: createForm.contactEmail.trim() || undefined,
        contactPhone: createForm.contactPhone.trim() || undefined,
        segmentId: createForm.segmentId,
        notes: createForm.notes.trim() || undefined
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        companyName: '',
        tradeName: '',
        cnpj: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        segmentId: 'SHOWS_FESTIVAIS',
        notes: ''
      });
      if (onNavigateToLeads) {
        onNavigateToLeads();
      } else {
        loadProducers();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao cadastrar prospecção.');
    } finally {
      setCreatingLead(false);
    }
  };

  // KPIs
  const totalActive = producers.filter(
    (p) => p.commercialAccount?.commercialStatus === 'ACTIVE' || p.producer.status === 'active'
  ).length;
  const totalActiveEvents = producers.reduce((sum, p) => sum + (p.activeEventsCount || 0), 0);
  const overdueActionsCount = producers.filter((p) => {
    if (!p.nextActionAt) return false;
    return new Date(p.nextActionAt) < new Date();
  }).length;

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
      case 'INACTIVE':
      case 'INATIVO':
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
              <Building2 className="h-6 w-6 text-orange-400" />
              CENTRAL DE PRODUTORES
            </h1>
            <Badge variant="orange" size="sm">B2B Comercial</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão do relacionamento B2B, carteira de produtores credenciados e saúde de contas comerciais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducers}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nova Prospecção / Produtor
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Produtores"
          value={total}
          subtitle="Contas cadastradas no sistema"
          icon={<Building2 className="h-4 w-4 text-orange-400" />}
        />
        <StatCard
          title="Produtores Ativos"
          value={totalActive}
          subtitle="Com relacionamento comercial ativo"
          badge={`${total > 0 ? Math.round((totalActive / total) * 100) : 0}% ativos`}
          badgeVariant="emerald"
          icon={<UserCheck className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          title="Eventos Ativos"
          value={totalActiveEvents}
          subtitle="Eventos em venda no catálogo"
          icon={<Calendar className="h-4 w-4 text-cyan-400" />}
        />
        <StatCard
          title="Ações Vencidas"
          value={overdueActionsCount}
          subtitle="Próximas ações comerciais atrasadas"
          badge={overdueActionsCount > 0 ? 'Atenção imediata' : 'Em dia'}
          badgeVariant={overdueActionsCount > 0 ? 'rose' : 'emerald'}
          icon={<Clock className="h-4 w-4 text-rose-400" />}
        />
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Razão Social, Nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              aria-label="Filtrar por Segmento"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="">Todos os Segmentos</option>
              <option value="SHOWS_FESTIVAIS">Shows & Festivais</option>
              <option value="TEATRO_CULTURA">Teatro & Cultura</option>
              <option value="CORPORATIVO">Corporativo</option>
              <option value="ESPORTIVO">Esportivo</option>
              <option value="RELIGIOSO">Religioso</option>
              <option value="OUTRO">Outros</option>
            </select>

            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              aria-label="Filtrar por Classificação"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="">Todas Classificações</option>
              <option value="ESTRATEGICO">Estratégico</option>
              <option value="KEY_ACCOUNT">Key Account</option>
              <option value="REGULAR">Regular</option>
              <option value="NOVO">Novo</option>
              <option value="INATIVO">Inativo</option>
            </select>

            <select
              value={commercialStatus}
              onChange={(e) => setCommercialStatus(e.target.value)}
              aria-label="Filtrar por Status Comercial"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="">Todos os Status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="PROSPECT">Prospect</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="CLOSED">Encerrado</option>
              <option value="INACTIVE">Inativo</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Filtrar
            </Button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Producers Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Produtor / Razão Social</th>
                <th className="px-4 py-3">Status Comercial</th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-center">Eventos</th>
                <th className="px-4 py-3 text-center">Oportunidades</th>
                <th className="px-4 py-3">Próxima Ação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && producers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-400" />
                    Carregando carteira de produtores...
                  </td>
                </tr>
              ) : producers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Nenhum produtor encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                producers.map((prod) => {
                  const isActionOverdue =
                    prod.nextActionAt && new Date(prod.nextActionAt) < new Date();
                  const primaryOwner =
                    prod.portfolio.find((a) => a.role === 'PRIMARY') || prod.portfolio[0];

                  return (
                    <tr
                      key={prod.producer.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectProducer(prod.producer.id)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {prod.producer.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          CNPJ: {formatCnpj(prod.producer.cnpj)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(prod.commercialAccount?.commercialStatus || 'ACTIVE')}
                      </td>
                      <td className="px-4 py-3.5">
                        {getClassificationBadge(prod.commercialAccount?.commercialClassification)}
                      </td>
                      <td className="px-4 py-3.5">
                        {primaryOwner?.userName ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Briefcase className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{primaryOwner.userName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="font-mono text-slate-700 dark:text-slate-200">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{prod.activeEventsCount}</span>
                          <span className="text-slate-400"> / {prod.eventsCount}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">ativos/total</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={prod.openOpportunitiesCount > 0 ? 'orange' : 'slate'} size="sm">
                          {prod.openOpportunitiesCount} abertas
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {prod.nextActionAt ? (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-mono font-medium ${
                                isActionOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {formatDate(prod.nextActionAt)}
                            </span>
                            {isActionOverdue && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Atrasada
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
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

      {/* Modal: Nova Prospecção / Produtor */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            <span>Nova Prospecção Comercial (Lead)</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre uma nova empresa promotora de eventos no pipeline de prospecção comercial.
            Após a qualificação, ela poderá ser convertida formalmente em Produtor Credenciado no Core.
          </p>

          {createError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Razão Social <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.companyName}
                onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                placeholder="Ex: Opus Produções Ltda"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={createForm.tradeName}
                onChange={(e) => setCreateForm({ ...createForm, tradeName: e.target.value })}
                placeholder="Ex: Opus Entretenimento"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                CNPJ (Validação automática anti-duplicidade)
              </label>
              <input
                type="text"
                value={createForm.cnpj}
                onChange={(e) => setCreateForm({ ...createForm, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Segmento de Atuação
              </label>
              <select
                value={createForm.segmentId}
                onChange={(e) => setCreateForm({ ...createForm, segmentId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="SHOWS_FESTIVAIS">Shows & Festivais</option>
                <option value="TEATRO_CULTURA">Teatro & Cultura</option>
                <option value="CORPORATIVO">Corporativo</option>
                <option value="ESPORTIVO">Esportivo</option>
                <option value="RELIGIOSO">Religioso</option>
                <option value="OUTRO">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contato Principal (Nome)
              </label>
              <input
                type="text"
                value={createForm.contactName}
                onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                placeholder="Ex: Carlos Eduardo"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email de Contato
              </label>
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                placeholder="carlos@empresa.com.br"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={createForm.contactPhone}
                onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações Comerciais / Contexto do Evento
            </label>
            <textarea
              rows={3}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Descreva a expectativa de eventos, público estimado, histórico de bilheteria..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={creatingLead}
            >
              Salvar Prospecção
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
