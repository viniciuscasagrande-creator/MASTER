import React, { useState, useEffect } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  CheckSquare,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { TaskItem, MyInboxData } from './tasks.types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface MyInboxViewProps {
  onTaskUpdated?: () => void;
}

export const MyInboxView: React.FC<MyInboxViewProps> = ({ onTaskUpdated }) => {
  const { apiFetch } = useDiskContext();

  const [inboxData, setInboxData] = useState<MyInboxData | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'TODAY' | 'WAITING'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchInbox = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/v1/tasks/my-inbox');
      if (res.ok) {
        const json = await res.json();
        setInboxData(json.data);
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleRefresh = () => {
    fetchInbox();
    if (onTaskUpdated) onTaskUpdated();
  };

  let tasks = inboxData?.tasks || [];

  // Filter
  if (filter === 'URGENT') {
    tasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL');
  } else if (filter === 'WAITING') {
    tasks = tasks.filter(t => t.status === 'WAITING');
  } else if (filter === 'TODAY') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;
    tasks = tasks.filter(t => {
      if (!t.dueAt) return false;
      const d = new Date(t.dueAt).getTime();
      return d >= startOfDay && d <= endOfDay;
    });
  }

  // Search
  if (search.trim()) {
    const s = search.toLowerCase();
    tasks = tasks.filter(t =>
      t.taskNumber.toLowerCase().includes(s) ||
      t.title.toLowerCase().includes(s) ||
      t.module.toLowerCase().includes(s)
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Quick Counters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({inboxData?.total || 0})
          </button>
          <button
            onClick={() => setFilter('URGENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              filter === 'URGENT' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Urgentes ({inboxData?.urgentCount || 0})
          </button>
          <button
            onClick={() => setFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              filter === 'TODAY' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Vencendo Hoje ({inboxData?.dueTodayCount || 0})
          </button>
          <button
            onClick={() => setFilter('WAITING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'WAITING' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Em Espera ({inboxData?.waitingCount || 0})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na minha caixa..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Carregando tarefas da sua caixa...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Inbox className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Sua caixa de trabalho está em dia!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Nenhuma tarefa pendente com o filtro selecionado. Quando houver atividades atribuídas a você, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const checklist = task.checklist || (task as any).checklistItems || [];
            const completedCount = checklist.filter((i: any) => i.isCompleted).length;

            const priorityVariant =
              task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : 'default';

            const statusVariant =
              task.status === 'IN_PROGRESS'
                ? 'info'
                : task.status === 'WAITING'
                ? 'warning'
                : 'default';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-lg group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                        {task.taskNumber}
                      </span>
                      <Badge variant={priorityVariant}>{task.priority}</Badge>
                      <Badge variant={statusVariant}>{task.status}</Badge>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition line-clamp-1">
                      {task.title}
                    </h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800/80 shrink-0">
                    {task.module}
                  </span>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Prazo: {task.dueAt ? formatDateTime(task.dueAt) : 'Sem prazo'}</span>
                  </div>

                  {checklist.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                      <span>{completedCount}/{checklist.length}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            handleRefresh();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
