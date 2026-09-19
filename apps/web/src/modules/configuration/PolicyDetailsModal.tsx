import React, { useState } from 'react';
import { PolicyItem, PolicyRuleItem, PolicyVersionItem, VersionDiffItem } from './configuration.types';
import {
  FileText,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  Layers,
  ArrowRight,
  Shield,
  Eye,
  Sliders,
  Sparkles,
  Split
} from 'lucide-react';

interface PolicyDetailsModalProps {
  policy: PolicyItem;
  onClose: () => void;
  onActivate: (policyId: string) => Promise<void>;
  onSchedule: (policyId: string, from: string, until?: string) => Promise<void>;
  onRollback: (policyId: string, targetVersion: number, reason: string) => Promise<void>;
  onCompareVersions: (policyId: string, v1: number, v2: number) => Promise<{ v1: number; v2: number; diffs: VersionDiffItem[] }>;
  isSuperAdmin: boolean;
}

export const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({
  policy,
  onClose,
  onActivate,
  onSchedule,
  onRollback,
  onCompareVersions,
  isSuperAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'versions' | 'diff'>('rules');
  const [diffData, setDiffData] = useState<{ v1: number; v2: number; diffs: VersionDiffItem[] } | null>(null);
  const [v1Compare, setV1Compare] = useState<number>(1);
  const [v2Compare, setV2Compare] = useState<number>(policy.currentVersion || 1);
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const rules: PolicyRuleItem[] = policy.rules || [];
  const versions: PolicyVersionItem[] = policy.versions || [];

  const handleRunDiff = async () => {
    if (v1Compare === v2Compare) {
      alert('Selecione duas versões distintas para comparar.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await onCompareVersions(policy.id, v1Compare, v2Compare);
      setDiffData(res);
      setActiveTab('diff');
    } catch (err: any) {
      alert(err.message || 'Erro ao comparar versões da política.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!rollbackTarget || !rollbackReason.trim()) return;
    setIsProcessing(true);
    try {
      await onRollback(policy.id, rollbackTarget, rollbackReason.trim());
      setRollbackTarget(null);
      setRollbackReason('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao executar rollback.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ATIVO</span>;
      case 'DRAFT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">RASCUNHO</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">AGENDADO</span>;
      case 'SUPERSEDED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-700/50 text-slate-400 border border-slate-600">SUBSTITUÍDO</span>;
      case 'ARCHIVED':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">ARQUIVADO</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                {policy.code}
              </span>
              <h2 className="text-base font-semibold text-slate-100">{policy.name}</h2>
              {getStatusPill(policy.status)}
              <span className="text-xs text-slate-400 font-mono">v{policy.currentVersion}</span>
            </div>
            {policy.description && <p className="text-xs text-slate-400">{policy.description}</p>}
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-light leading-none">
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Regras de Negócio ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="h-3.5 w-3.5" />
            Histórico de Versões ({versions.length})
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'diff'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            Comparador de Versões (Diff)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhuma regra cadastrada nesta versão da política.
                </div>
              ) : (
                rules.map((rule, idx) => {
                  let parsedConditions: any[] = [];
                  let parsedAction: any = {};
                  try {
                    parsedConditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : (rule.conditions || []);
                  } catch {}
                  try {
                    parsedAction = typeof rule.action === 'string' ? JSON.parse(rule.action) : (rule.action || {});
                  } catch {}

                  return (
                    <div
                      key={rule.id || idx}
                      className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Ordem #{rule.orderIndex || idx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-200">{rule.name}</h4>
                          <span className="text-xs text-slate-400">Prioridade: <strong>{rule.priority}</strong></span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          {parsedConditions.length} {parsedConditions.length === 1 ? 'Condição' : 'Condições'}
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-slate-400">{rule.description}</p>
                      )}

                      {/* Conditions View */}
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Critérios / Condições de Disparo
                        </div>
                        {parsedConditions.length === 0 ? (
                          <div className="text-xs text-slate-500 italic">Disparo incondicional (aplica sempre)</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {parsedConditions.map((cond: any, cIdx: number) => (
                              <div
                                key={cIdx}
                                className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono"
                              >
                                <span className="text-purple-300">{cond.field}</span>
                                <span className="text-amber-400 font-bold">{cond.operator}</span>
                                <span className="text-emerald-300">{JSON.stringify(cond.value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action View */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Ação & Exigências Geradas
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span className={`px-2 py-1 rounded font-semibold ${parsedAction.decision !== false ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
                            {parsedAction.decision !== false ? 'Autorizado' : 'Bloqueado'}
                          </span>

                          {parsedAction.approvalsRequired && (
                            <span className="px-2 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {parsedAction.approvalsRequired} {parsedAction.approvalsRequired === 1 ? 'Aprovação' : 'Aprovações'}
                            </span>
                          )}

                          {parsedAction.stepUpRequired && (
                            <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5" /> Requer 2FA Step-Up
                            </span>
                          )}

                          {parsedAction.slaMinutes && (
                            <span className="px-2 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> SLA: {parsedAction.slaMinutes} min
                            </span>
                          )}

                          {parsedAction.requiredDocuments && parsedAction.requiredDocuments.length > 0 && (
                            <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              Anexos: {parsedAction.requiredDocuments.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <span>Total de {versions.length} versões registradas. Cada nova versão ou rollback é 100% auditável e imutável.</span>
              </div>

              <div className="space-y-3">
                {versions.map(ver => (
                  <div
                    key={ver.id || ver.versionNumber}
                    className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-purple-300">v{ver.versionNumber}</span>
                        {getStatusPill(ver.status)}
                        {ver.versionNumber === policy.currentVersion && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-600 text-white">ATUAL</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{ver.changeReason || 'Versão gerada pelo sistema'}</p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Criado por: {ver.creatorName || ver.createdBy}</span>
                        <span>Data: {new Date(ver.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ver.versionNumber !== policy.currentVersion && (
                        <button
                          onClick={() => setRollbackTarget(ver.versionNumber)}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reverter para v{ver.versionNumber}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="space-y-4">
              {/* Diff Selector Header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Versão Base:</span>
                  <select
                    value={v1Compare}
                    onChange={e => setV1Compare(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-purple-300 font-mono"
                  >
                    {versions.map(v => (
                      <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}</option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-500" />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Versão Comparada:</span>
                  <select
                    value={v2Compare}
                    onChange={e => setV2Compare(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-purple-300 font-mono"
                  >
                    {versions.map(v => (
                      <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRunDiff}
                  disabled={isProcessing}
                  className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1.5"
                >
                  <Split className="h-3.5 w-3.5" />
                  {isProcessing ? 'Comparando...' : 'Comparar Versões'}
                </button>
              </div>

              {diffData && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Diferenças Encontradas (v{diffData.v1} vs v{diffData.v2})
                  </h4>

                  {diffData.diffs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
                      Nenhuma diferença identificada entre as versões selecionadas.
                    </div>
                  ) : (
                    diffData.diffs.map((diff, dIdx) => {
                      let badge = <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-400">INALTERADO</span>;
                      if (diff.changeType === 'ADDED') {
                        badge = <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">+ ADICIONADA</span>;
                      } else if (diff.changeType === 'REMOVED') {
                        badge = <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">- REMOVIDA</span>;
                      } else if (diff.changeType === 'MODIFIED') {
                        badge = <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MODIFICADA</span>;
                      }

                      return (
                        <div
                          key={dIdx}
                          className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">{diff.ruleName}</span>
                            {badge}
                          </div>

                          {diff.fieldDiffs && diff.fieldDiffs.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {diff.fieldDiffs.map((fd, fIdx) => (
                                <div key={fIdx} className="text-[11px] font-mono grid grid-cols-2 gap-2 p-2 rounded bg-slate-900">
                                  <div className="text-rose-400 line-through">
                                    <strong>v{diffData.v1}:</strong> {JSON.stringify(fd.oldValue)}
                                  </div>
                                  <div className="text-emerald-400">
                                    <strong>v{diffData.v2}:</strong> {JSON.stringify(fd.newValue)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Escopo: <strong className="text-slate-200">{policy.scopeType}</strong>
          </div>

          <div className="flex items-center gap-2">
            {policy.status !== 'ACTIVE' && isSuperAdmin && (
              <button
                onClick={() => {
                  if (confirm(`Deseja ativar a política "${policy.name}"? As políticas ativas anteriores no mesmo escopo serão substituídas.`)) {
                    onActivate(policy.id);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ativar Política
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Rollback Prompt Modal */}
      {rollbackTarget !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-sm font-bold">Confirmar Rollback Seguro</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a reverter a política para as regras da <strong>versão v{rollbackTarget}</strong>.
              Isso gerará uma <strong>nova versão v{(policy.currentVersion || 1) + 1}</strong> preservando todo o histórico anterior.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Motivo do Rollback (Obrigatório para Auditoria) *
              </label>
              <textarea
                rows={3}
                value={rollbackReason}
                onChange={e => setRollbackReason(e.target.value)}
                placeholder="Informe o motivo da reversão..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing || !rollbackReason.trim()}
                onClick={handleExecuteRollback}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? 'Revertendo...' : 'Executar Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
