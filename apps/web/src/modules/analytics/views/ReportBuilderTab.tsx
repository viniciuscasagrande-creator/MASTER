import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Play,
  Plus,
  Trash2,
  Lock,
  Layers,
  BarChart2,
  Table as TableIcon,
  PieChart,
  LineChart,
  HelpCircle,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import {
  MetricDomain,
  ChartType,
  ReportVisibility,
  FilterOperator,
  MetricDefinition,
  DimensionDefinition,
  FilterDefinition,
  AnalyticsQuery
} from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface ReportBuilderTabProps {
  availableMetrics: MetricDefinition[];
  availableDimensions: DimensionDefinition[];
  onSaveReport: (reportData: {
    title: string;
    description?: string;
    domain: MetricDomain;
    queryDefinition: AnalyticsQuery;
    chartType: ChartType;
    visibility: ReportVisibility;
  }) => Promise<void>;
  onPreviewQuery: (query: AnalyticsQuery) => void;
  onExplainMetric: (code: string) => void;
}

export const ReportBuilderTab: React.FC<ReportBuilderTabProps> = ({
  availableMetrics,
  availableDimensions,
  onSaveReport,
  onPreviewQuery,
  onExplainMetric
}) => {
  const [title, setTitle] = useState<string>('Novo Relatório Gerencial');
  const [description, setDescription] = useState<string>('');
  const [domain, setDomain] = useState<MetricDomain>('COMERCIAL');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sales.gross_amount', 'tickets.sold']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['channel']);
  const [periodType, setPeriodType] = useState<any>('THIS_MONTH');
  const [comparisonType, setComparisonType] = useState<any>('PREVIOUS_PERIOD');
  const [chartType, setChartType] = useState<ChartType>('TABLE');
  const [visibility, setVisibility] = useState<ReportVisibility>('PRIVATE');
  const [filters, setFilters] = useState<FilterDefinition[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filter metrics according to selected domain
  const filteredMetrics = availableMetrics.filter((m) => m.domain === domain);

  const toggleMetric = (code: string) => {
    if (selectedMetrics.includes(code)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== code));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, code]);
    }
  };

  const toggleDimension = (code: string) => {
    if (selectedDimensions.includes(code)) {
      setSelectedDimensions(selectedDimensions.filter((d) => d !== code));
    } else {
      setSelectedDimensions([...selectedDimensions, code]);
    }
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        field: 'channel',
        operator: 'EQUALS',
        value: 'ONLINE'
      }
    ]);
  };

  const updateFilter = (index: number, key: keyof FilterDefinition, val: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: val };
    setFilters(updated);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const buildQuery = (): AnalyticsQuery => ({
    metrics: selectedMetrics,
    dimensions: selectedDimensions,
    filters: filters.length > 0 ? filters : undefined,
    period: {
      type: periodType,
      comparison: comparisonType !== 'NONE' ? comparisonType : undefined
    }
  });

  const handlePreview = () => {
    onPreviewQuery(buildQuery());
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Informe um título para o relatório.');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveReport({
        title,
        description,
        domain,
        queryDefinition: buildQuery(),
        chartType,
        visibility
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
              CONSTRUTOR DECLARATIVO
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">Blindado contra SQL Injection</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">Criador Visual de Relatórios</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            Executar Prévia
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Salvando...' : 'Salvar Relatório'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Configuration Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: Info & Domain */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                1
              </span>
              Identificação & Domínio Oficial
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Título do Relatório
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
                  placeholder="Ex: Faturamento e Ingressos por Canal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Domínio Analítico
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as MetricDomain)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
                >
                  <option value="COMERCIAL">Comercial</option>
                  <option value="EVENTOS">Eventos & Portaria</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="SAC">Atendimento SAC</option>
                  <option value="ESTORNO">Estornos & Chargeback</option>
                  <option value="CONTABILIDADE">Contabilidade</option>
                  <option value="MARKETING">Marketing & ROAS</option>
                  <option value="REMARKETING">Remarketing</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Descrição e Finalidade
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
                  placeholder="Ex: Relatório semanal para prestação de contas com produtores"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Metrics Selection */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                  2
                </span>
                Métricas Oficiais do Domínio ({filteredMetrics.length})
              </h3>
              <span className="text-xs text-slate-400">
                Selecionadas: <strong className="text-orange-400">{selectedMetrics.length}</strong>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredMetrics.map((metric) => {
                const isSelected = selectedMetrics.includes(metric.code);
                return (
                  <div
                    key={metric.code}
                    onClick={() => toggleMetric(metric.code)}
                    className={`flex cursor-pointer items-start justify-between rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-orange-500/60 bg-orange-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">
                          {metric.name}
                        </span>
                        {metric.isSensitive && (
                          <Badge variant="warning" size="sm">
                            LGPD
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                        {metric.description}
                      </p>
                      <code className="mt-1 block text-[10px] text-slate-500">
                        {metric.code}
                      </code>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExplainMetric(metric.code);
                      }}
                      className="rounded p-1 text-slate-500 hover:text-orange-400"
                      title="Como este indicador é calculado?"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Dimensions Selection */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                3
              </span>
              Dimensões de Agrupamento
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {availableDimensions.map((dim) => {
                const isSelected = selectedDimensions.includes(dim.code);
                return (
                  <button
                    key={dim.code}
                    type="button"
                    onClick={() => toggleDimension(dim.code)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/20 font-semibold text-orange-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{dim.name}</span>
                    <span className="text-[10px] text-slate-500">({dim.code})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Declarative Filters */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                  4
                </span>
                Filtros Declarativos Seguros
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addFilter}
                className="flex items-center gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Adicionar Filtro
              </Button>
            </div>

            {filters.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                Nenhum filtro aplicado. Os dados serão consolidados para todo o escopo do usuário.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {filters.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5"
                  >
                    <select
                      value={f.field}
                      onChange={(e) => updateFilter(idx, 'field', e.target.value)}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      <option value="channel">Canal</option>
                      <option value="payment_method">Forma de Pagamento</option>
                      <option value="gateway">Gateway</option>
                      <option value="status">Status</option>
                      <option value="producer">Produtor</option>
                      <option value="event">Evento</option>
                    </select>

                    <select
                      value={f.operator}
                      onChange={(e) => updateFilter(idx, 'operator', e.target.value as FilterOperator)}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      <option value="EQUALS">Igual a (=)</option>
                      <option value="NOT_EQUALS">Diferente de (!=)</option>
                      <option value="IN">Contido em (IN)</option>
                      <option value="GREATER_THAN">Maior que (&gt;)</option>
                      <option value="LESS_THAN">Menor que (&lt;)</option>
                    </select>

                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                      placeholder="Valor do filtro"
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeFilter(idx)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visualization & Visibility Options */}
        <div className="space-y-6">
          {/* Chart Type Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tipo de Visualização
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { id: 'TABLE', label: 'Tabela Paginada', icon: <TableIcon className="h-4 w-4" /> },
                { id: 'BAR', label: 'Gráfico de Barras', icon: <BarChart2 className="h-4 w-4" /> },
                { id: 'LINE', label: 'Linha Temporal', icon: <LineChart className="h-4 w-4" /> },
                { id: 'DONUT', label: 'Rosca / Pizza', icon: <PieChart className="h-4 w-4" /> }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setChartType(opt.id as ChartType)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                    chartType === opt.id
                      ? 'border-orange-500 bg-orange-500/10 font-bold text-orange-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="mb-1.5">{opt.icon}</div>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Period Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recorte Temporal Padrão
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Período</label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="TODAY">Hoje</option>
                  <option value="LAST_7_DAYS">Últimos 7 dias</option>
                  <option value="LAST_30_DAYS">Últimos 30 dias</option>
                  <option value="THIS_MONTH">Este Mês</option>
                  <option value="LAST_MONTH">Mês Anterior</option>
                  <option value="THIS_YEAR">Este Ano</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Comparação Temporal</label>
                <select
                  value={comparisonType}
                  onChange={(e) => setComparisonType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NONE">Sem comparação</option>
                  <option value="PREVIOUS_PERIOD">Período Anterior (MoM)</option>
                  <option value="PREVIOUS_YEAR">Ano Anterior (YoY)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Visibilidade Inicial
            </h3>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="radio"
                  name="builder_visibility"
                  checked={visibility === 'PRIVATE'}
                  onChange={() => setVisibility('PRIVATE')}
                  className="text-orange-500"
                />
                <span>Privado (Apenas eu e Administradores)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="radio"
                  name="builder_visibility"
                  checked={visibility === 'TEAM'}
                  onChange={() => setVisibility('TEAM')}
                  className="text-orange-500"
                />
                <span>Minha Equipe Operacional</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="radio"
                  name="builder_visibility"
                  checked={visibility === 'ROLE'}
                  onChange={() => setVisibility('ROLE')}
                  className="text-orange-500"
                />
                <span>Por Perfil de Acesso</span>
              </label>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>O compartilhamento nunca eleva permissões dos destinatários.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
