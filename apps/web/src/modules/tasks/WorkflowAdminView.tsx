import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, History, CheckCircle2, AlertCircle, Eye, Settings, Play } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { WorkflowItem } from './tasks.types';

export const WorkflowAdminView: React.FC = () => {
  const { apiFetch } = useDiskContext();

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionReason, setVersionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/v1/tasks/admin/workflows');
      if (res.ok) {
        const json = await res.json();
        setWorkflows(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !versionReason.trim()) return;

    try {
      setIsSubmitting(true);
      setMessage(null);
      const res = await apiFetch(`/api/v1/tasks/admin/workflows/${selectedWorkflow.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeReason: versionReason })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar nova versão');
      }
      setMessage({ text: 'Nova versão imutável do fluxo criada com sucesso!', type: 'success' });
      setShowVersionModal(false);
      setVersionReason('');
      fetchWorkflows();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-amber-400" /> Fluxos de Trabalho & Automação
          </h2>
          <p className="text-xs text-slate-400">
            Regras de disparo automático acionadas por eventos do ecossistema
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Carregando fluxos de trabalho...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => {
            const rules = (wf as any).rules || [];
            return (
              <div
                key={wf.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          v{wf.currentVersion || 1}
                        </span>
                        <Badge variant="default">{wf.module}</Badge>
                        <Badge variant={wf.isActive ? 'success' : 'default'}>
                          {wf.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">{wf.name}</h3>
                    </div>
                  </div>

                  {wf.description && <p className="text-xs text-slate-400">{wf.description}</p>}

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1.5 font-mono">
                    <div className="text-slate-400 flex items-center gap-1">
                      <Play className="h-3 w-3 text-amber-400" /> Evento de Disparo:
                    </div>
                    <div className="text-amber-300 font-bold">{wf.triggerEvent}</div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-white">{rules.length}</span> {rules.length === 1 ? 'regra de condição' : 'regras de condição'} configurada(s)
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkflow(wf);
                      setShowVersionModal(true);
                    }}
                  >
                    <History className="h-4 w-4 mr-1 text-slate-400" /> Criar Versão Snapshot
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Criar Nova Versão Imutável</h3>
            <p className="text-xs text-slate-400">
              Captura um snapshot imutável das regras atuais do fluxo &quot;{selectedWorkflow.name}&quot; para auditoria de governança.
            </p>

            <form onSubmit={handleCreateVersion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Motivo da Alteração de Versão <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  value={versionReason}
                  onChange={(e) => setVersionReason(e.target.value)}
                  placeholder="Ex: Atualização dos limites de SLA para operação..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 h-24"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowVersionModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || !versionReason.trim()}>
                  {isSubmitting ? 'Gravando...' : 'Gravar Versão'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
