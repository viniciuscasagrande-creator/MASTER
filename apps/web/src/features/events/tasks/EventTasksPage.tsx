import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  User,
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { EventTaskDTO } from '@shared/types/index';
import {
  fetchEventTasks,
  updateEventTaskStatus,
  generateTasksFromReadiness
} from '../api/tasks.api';
import { fetchEventReadiness } from '../api/readiness.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { CreateTaskModal } from './CreateTaskModal';

interface EventTasksPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToReadiness?: () => void;
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgente', variant: 'danger' as const },
  HIGH: { label: 'Alta', variant: 'warning' as const },
  MEDIUM: { label: 'Média', variant: 'info' as const },
  LOW: { label: 'Baixa', variant: 'default' as const }
};

export const EventTasksPage: React.FC<EventTasksPageProps> = ({
  eventId,
  eventName,
  onNavigateToReadiness
}) => {
  const [tasks, setTasks] = useState<EventTaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('OPEN_OR_IN_PROGRESS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEventTasks(eventId);
      setTasks(data || []);
    } catch (err) {
      console.error('Erro ao carregar pendências:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (taskId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await updateEventTaskStatus(eventId, taskId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleSyncWithReadiness = async () => {
    setSyncing(true);
    try {
      const readiness = await fetchEventReadiness(eventId);
      await generateTasksFromReadiness(eventId, readiness.issues);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao sincronizar pendências com prontidão');
    } finally {
      setSyncing(false);
    }
  };

  // Métricas
  const totalTasks = tasks.length;
  const criticalCount = tasks.filter(t => t.blockingPublication && t.status !== 'COMPLETED').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OPEN_OR_IN_PROGRESS') return t.status === 'OPEN' || t.status === 'IN_PROGRESS';
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Central de Pendências & Tarefas Operacionais</h1>
            <Badge variant="info">Fase 1.2.8</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Integração com o motor de tarefas e o Readiness Engine para resolução e desbloqueio antes da publicação do evento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={handleSyncWithReadiness}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar com Readiness</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Pendência</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Pendências"
          value={formatNumber(totalTasks)}
          subtitle={`${totalTasks - completedCount} não resolvidas`}
          icon={<CheckSquare className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          title="Bloqueantes de Publicação"
          value={formatNumber(criticalCount)}
          subtitle="Impedem abertura de vendas"
          icon={<ShieldAlert className="h-5 w-5 text-rose-400" />}
        />
        <StatCard
          title="Em Andamento"
          value={formatNumber(inProgressCount)}
          subtitle="Com responsável atuando"
          icon={<Clock className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          title="Concluídas"
          value={formatNumber(completedCount)}
          subtitle="Itens sanados e homologados"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* Filtros e Lista */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold mr-2">Filtrar:</span>
            {[
              { id: 'OPEN_OR_IN_PROGRESS', label: 'Pendentes Ativas' },
              { id: 'OPEN', label: 'Não Iniciadas' },
              { id: 'IN_PROGRESS', label: 'Em Andamento' },
              { id: 'COMPLETED', label: 'Concluídas' },
              { id: 'ALL', label: 'Todas' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === f.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filteredTasks.length} tarefa(s) listada(s)
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {filteredTasks.map(task => {
            const pInfo = PRIORITY_CONFIG[task.priority] || { label: task.priority, variant: 'default' };
            const isDone = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isDone ? 'bg-slate-950/20 opacity-70' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleStatusChange(task.id, isDone ? 'OPEN' : 'COMPLETED')}
                    className={`h-5 w-5 mt-0.5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </span>
                      <Badge variant={pInfo.variant}>{pInfo.label}</Badge>
                      {task.blockingPublication && !isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          Bloqueia Publicação
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {task.origin}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                      {task.assigneeName && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{task.assigneeName}</span>
                        </span>
                      )}

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Prazo: {formatDateTime(task.dueDate)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações de Estado */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {task.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      Iniciar
                    </button>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Concluir
                    </button>
                  )}

                  {task.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'OPEN')}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-700"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-500">
              Nenhuma pendência encontrada para o filtro selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CreateTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventId={eventId}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
