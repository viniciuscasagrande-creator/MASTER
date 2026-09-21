import React, { useState, useEffect } from 'react';
import { ProposalDiffDTO } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { X, GitCompare, ArrowRight, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';

interface ProposalDiffModalProps {
  proposalId: string;
  baseVersion: number;
  targetVersion: number;
  totalVersions?: number;
  onClose: () => void;
}

export const ProposalDiffModal: React.FC<ProposalDiffModalProps> = ({
  proposalId,
  baseVersion: initialBase,
  targetVersion: initialTarget,
  totalVersions = Math.max(initialTarget, 2),
  onClose
}) => {
  const [base, setBase] = useState<number>(initialBase);
  const [target, setTarget] = useState<number>(initialTarget);
  const [diff, setDiff] = useState<ProposalDiffDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDiff(base, target);
  }, [base, target]);

  const loadDiff = async (b: number, t: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.getProposalDiff(proposalId, b, t);
      setDiff(res);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar comparativo.');
    } finally {
      setLoading(false);
    }
  };

  const availableVersions = Array.from({ length: totalVersions }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Comparativo Estruturado de Versões</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Selector Bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Versão Base:</span>
            <select
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-orange-500"
            >
              {availableVersions.map((v) => (
                <option key={v} value={v}>Versão {v} (V{v})</option>
              ))}
            </select>

            <ArrowRight className="w-4 h-4 text-slate-400" />

            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Versão Comparada:</span>
            <select
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-orange-500"
            >
              {availableVersions.map((v) => (
                <option key={v} value={v}>Versão {v} (V{v})</option>
              ))}
            </select>
          </div>

          {diff && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                V{base}: <code className="text-slate-700 dark:text-slate-300 font-mono">{diff.contentHashBase.substring(0, 8)}...</code>
              </span>
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                V{target}: <code className="text-slate-700 dark:text-slate-300 font-mono">{diff.contentHashTarget.substring(0, 8)}...</code>
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3" />
              <p>Calculando diferenças estruturais entre as versões...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : diff && !diff.hasDifferences ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhuma diferença detectada</h3>
              <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                As versões V{base} e V{target} possuem exatamente os mesmos termos, taxas e vigência (contentHash idêntico).
              </p>
            </div>
          ) : diff ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span>{diff.changes.length} modificações identificadas</span>
                <span>Auditável via SHA-256</span>
              </div>

              {diff.changes.map((item, idx) => {
                let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                let typeLabel: string = item.changeType;

                if (item.changeType === 'ADDED') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
                  typeLabel = '+ ADICIONADO';
                } else if (item.changeType === 'REMOVED') {
                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700';
                  typeLabel = '- REMOVIDO';
                } else if (item.changeType === 'MODIFIED') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700';
                  typeLabel = '~ ALTERADO';
                }

                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg border uppercase text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          {item.category === 'TERM' ? 'CONDIÇÃO / TAXA' : item.category === 'EVENT' ? 'ESCOPO DE EVENTO' : 'GERAL'}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${badgeClass}`}>
                        {typeLabel}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{item.description}</p>

                    {item.changeType === 'MODIFIED' && item.oldValue && item.newValue && typeof item.oldValue === 'object' && (
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-900 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-slate-900/80 border border-rose-200 dark:border-slate-800 text-rose-800 dark:text-slate-400">
                          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1">Versão V{base}</span>
                          <div>{JSON.stringify(item.oldValue, null, 1)}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 text-emerald-800 dark:text-slate-300">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Versão V{target}</span>
                          <div>{JSON.stringify(item.newValue, null, 1)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm transition font-medium"
          >
            Fechar Comparativo
          </button>
        </div>
      </div>
    </div>
  );
};
