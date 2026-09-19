import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Key,
  ShieldCheck,
  Clock,
  HelpCircle,
  Database,
  Layers
} from 'lucide-react';
import { MetricDefinition, MetricDomain } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface MetricsCatalogTabProps {
  metrics: MetricDefinition[];
  onExplainMetric: (code: string) => void;
}

export const MetricsCatalogTab: React.FC<MetricsCatalogTabProps> = ({
  metrics,
  onExplainMetric
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const filteredMetrics = metrics.filter((m) => {
    const matchesDomain = selectedDomain === 'ALL' || m.domain === selectedDomain;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.formula.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72 sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar métrica por nome, código ou fórmula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-orange-500"
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500"
          >
            <option value="ALL">Todos os Domínios ({metrics.length})</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="EVENTOS">Eventos</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="SAC">SAC</option>
            <option value="ESTORNO">Estorno</option>
            <option value="CONTABILIDADE">Contabilidade</option>
            <option value="MARKETING">Marketing</option>
            <option value="REMARKETING">Remarketing</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <BookOpen className="h-4 w-4 text-orange-400" />
          <span>
            Total de Indicadores Padronizados: <strong className="text-white">{metrics.length}</strong>
          </span>
        </div>
      </div>

      {/* Metrics List Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredMetrics.map((metric) => (
          <div
            key={metric.code}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition hover:border-slate-700"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                      {metric.domain}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      v{metric.version}
                    </span>
                    <Badge variant="primary" size="sm">
                      {metric.format}
                    </Badge>
                    {metric.isSensitive && (
                      <Badge variant="warning" size="sm">
                        LGPD
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-white">{metric.name}</h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExplainMetric(metric.code)}
                  className="flex items-center gap-1 text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Como é calculado?
                </Button>
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {metric.description}
              </p>

              {/* Formula Snippet */}
              <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Fórmula Oficial
                </span>
                <div className="mt-1 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-emerald-400">
                  {metric.formula}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate" title={metric.source}>
                    Fonte: <strong className="text-slate-200">{metric.source}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>
                    Frequência: <strong className="text-slate-200">{metric.updateFrequency}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate" title={metric.responsible}>
                    Gestão: <strong className="text-slate-200">{metric.responsible}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate font-mono text-[10px] text-purple-300" title={metric.requiredPermission || 'Acesso Livre'}>
                    {metric.requiredPermission || 'Acesso Livre'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
