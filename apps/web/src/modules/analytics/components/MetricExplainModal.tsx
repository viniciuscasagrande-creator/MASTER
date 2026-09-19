import React from 'react';
import { X, BookOpen, Clock, ShieldCheck, Database, GitBranch, Key } from 'lucide-react';
import { MetricDefinition } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';

interface MetricExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricDefinition | null;
}

export const MetricExplainModal: React.FC<MetricExplainModalProps> = ({
  isOpen,
  onClose,
  metric
}) => {
  if (!isOpen || !metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Como este indicador é calculado?</h2>
              <p className="text-xs text-slate-400">
                Governança e especificação técnica oficial do Disk Interno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6 text-sm">
          {/* Main Info Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {metric.domain}
                </span>
                <h3 className="text-lg font-bold text-white">{metric.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                  v{metric.version}
                </span>
                <Badge variant="primary" size="sm">
                  {metric.format}
                </Badge>
                {metric.isSensitive && (
                  <Badge variant="warning" size="sm">
                    Dado LGPD / Sensível
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {metric.description}
            </p>
            <div className="mt-2">
              <code className="rounded bg-slate-900 px-2 py-1 text-xs text-orange-400">
                {metric.code}
              </code>
            </div>
          </div>

          {/* Formula */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Key className="h-3.5 w-3.5 text-orange-400" />
              Fórmula Oficial de Cálculo
            </h4>
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-400">
              {metric.formula}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Database className="h-4 w-4 text-blue-400" />
                <span>Fonte Original dos Dados</span>
              </div>
              <p className="mt-1 font-semibold text-slate-200">{metric.source}</p>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Frequência de Atualização</span>
              </div>
              <p className="mt-1 font-semibold text-slate-200">
                {metric.updateFrequency === 'REAL_TIME' && 'Tempo Real (Event-Driven)'}
                {metric.updateFrequency === 'NEAR_REAL_TIME' && 'Quase Tempo Real (< 5 min)'}
                {metric.updateFrequency === 'PERIODIC' && 'Periódico (Horário)'}
                {metric.updateFrequency === 'DAILY_CLOSE' && 'Fechamento Diário (D+1)'}
                {metric.updateFrequency === 'SNAPSHOT' && 'Snapshot Histórico'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Responsável pela Governança</span>
              </div>
              <p className="mt-1 font-semibold text-slate-200">{metric.responsible}</p>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Key className="h-4 w-4 text-purple-400" />
                <span>Permissão de Acesso Exigida</span>
              </div>
              <p className="mt-1 font-mono text-xs text-purple-300">
                {metric.requiredPermission || 'Acesso Livre aos Operadores'}
              </p>
            </div>
          </div>

          {/* Lineage Steps */}
          {metric.lineage && metric.lineage.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <GitBranch className="h-3.5 w-3.5 text-orange-400" />
                Linhagem do Dado (Data Lineage)
              </h4>
              <div className="mt-3 space-y-2 border-l-2 border-slate-700 pl-4">
                {metric.lineage.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-orange-500"></div>
                    <div className="font-semibold text-slate-200">{step.step}</div>
                    <div className="text-xs text-slate-400">
                      Fonte: <span className="text-slate-300">{step.source}</span> &bull; {step.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supported Dimensions */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dimensões de Agrupamento Suportadas
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {metric.supportedDimensions?.map((dim, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300"
                >
                  {dim}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-800 bg-slate-950/60 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
