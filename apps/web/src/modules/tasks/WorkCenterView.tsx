import React, { useState, useEffect, useCallback } from 'react';
import {
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CheckSquare,
  Activity,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Users,
  GitBranch,
  Play
} from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { TaskItem, TaskSummaryData, UserAvailabilityStatus } from './tasks.types';
import { MyInboxView } from './MyInboxView';
import { TaskKanbanView } from './TaskKanbanView';
import { ProductivityDashboardView } from './ProductivityDashboardView';
import { WorkflowAdminView } from './WorkflowAdminView';
import { TeamAdminView } from './TeamAdminView';
import { TaskDetailsModal } from './TaskDetailsModal';
import { NewTaskModal } from './NewTaskModal';

interface WorkCenterViewProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const WorkCenterView: React.FC<WorkCenterViewProps> = ({
  initialSubItem,
  onNavigate
}) => {
  const { apiFetch, activeProducer, activeEvent } = useDiskContext();
  const { currentUser, hasPermission } = useAuth();

  // Tab state derived from initialSubItem or default
  const resolveTab = (subItem?: string) => {
    switch (subItem) {
      case 'tasks-inbox':
        return 'inbox';
      case 'tasks-all':
        return 'all';
      case 'tasks-kanban':
        return 'kanban';
      case 'tasks-dashboard':
        return 'productivity';
      case 'tasks-workflows':
        return 'workflows';
      case 'tasks-teams':
        return 'teams';
      default:
        return 'inbox';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(resolveTab(initialSubItem));

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(resolveTab(initialSubItem));
    }
  }, [initialSubItem]);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<TaskSummaryData | null>(null);
  const [availability, setAvailability] = useState<UserAvailabilityStatus>('AVAILABLE');
  const [isLoading, setIsLoading] = useState(true);

  // Table Filters
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/tasks/summary');
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data);
      }
    } catch (err) {
      console.error('Error fetching summary metrics:', err);
    }
  }, [apiFetch]);

  // Fetch task list
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      let queryUrl = '/api/v1/tasks?limit=100';
      if (activeProducer?.id) queryUrl += `&producerId=${activeProducer.id}`;
      if (activeEvent?.id) queryUrl += `&eventId=${activeEvent.id}`;

      const res = await apiFetch(queryUrl);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data?.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, activeProducer, activeEvent]);

  // Fetch user availability
  const fetchAvailability = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/tasks/availability/me');
      if (res.ok) {
        const json = await res.json();
        setAvailability(json.data?.status || 'AVAILABLE');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchSummary();
    fetchTasks();
    fetchAvailability();
  }, [fetchSummary, fetchTasks, fetchAvailability]);

  const handleUpdateAvailability = async (newStatus: UserAvailabilityStatus) => {
    try {
      const res = await apiFetch('/api/v1/tasks/availability/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAvailability(newStatus);
      }
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchSummary();
  };

  // Filtered Tasks for table
  const filteredTasks = tasks.filter((t) => {
    if (selectedModule !== 'ALL' && t.module !== selectedModule) return false;
    if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const num = t.taskNumber?.toLowerCase() || '';
      const title = t.title?.toLowerCase() || '';
      const assignee = t.assignedUserName?.toLowerCase() || '';
      return num.includes(s) || title.includes(s) || assignee.includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-amber-400" />
            Central de Trabalho & Workflows
          </h1>
          <p className="text-slate-400 text-sm">
            Gestão operacional unificada, distribuição inteligente e cumprimento de SLA
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Availability Status Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                availability === 'AVAILABLE'
                  ? 'bg-emerald-400 animate-pulse'
                  : availability === 'BUSY'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <select
              value={availability}
              onChange={(e) => handleUpdateAvailability(e.target.value as UserAvailabilityStatus)}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="AVAILABLE" className="bg-slate-900">Disponível para Tarefas</option>
              <option value="BUSY" className="bg-slate-900">Ocupado</option>
              <option value="AWAY" className="bg-slate-900">Ausente / Intervalo</option>
              <option value="VACATION" className="bg-slate-900">Férias</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTasks();
              fetchSummary();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1 text-slate-400" /> Atualizar
          </Button>

          {hasPermission('tarefas.tarefa.criar') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewTaskModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              <Plus className="h-4 w-4 mr-1 text-slate-950" /> Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Total de Tarefas</span>
            <div className="text-xl font-bold text-white">{summary.total}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> Urgentes
            </span>
            <div className="text-xl font-bold text-rose-400">{summary.urgent}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5" /> Vencendo Hoje
            </span>
            <div className="text-xl font-bold text-amber-400">{summary.dueToday}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Em Espera</span>
            <div className="text-xl font-bold text-slate-300">{summary.waiting}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Concluídas Hoje
            </span>
            <div className="text-xl font-bold text-emerald-400">{summary.completedToday}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-6 text-sm overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'inbox' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User className="h-4 w-4" /> Minha Caixa
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'all' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TableIcon className="h-4 w-4" /> Todas as Tarefas
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kanban')}
          className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'kanban' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="h-4 w-4" /> Quadro Kanban
        </button>

        {hasPermission('tarefas.dashboard.visualizar') && (
          <button
            onClick={() => setActiveTab('productivity')}
            className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'productivity' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" /> Produtividade & SLA
          </button>
        )}

        {hasPermission('tarefas.workflow.visualizar') && (
          <button
            onClick={() => setActiveTab('workflows')}
            className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'workflows' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="h-4 w-4" /> Fluxos de Trabalho
          </button>
        )}

        {hasPermission('tarefas.equipe.visualizar') && (
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-3 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'teams' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> Equipes & Plantão
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'inbox' && (
        <MyInboxView onTaskUpdated={handleTaskUpdated} />
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, título ou responsável..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">Todos os Módulos</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="SAC">SAC</option>
                <option value="EVENTOS">Eventos</option>
                <option value="ESTORNO">Estorno</option>
                <option value="CONTABILIDADE">Contabilidade</option>
                <option value="MARKETING">Marketing</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="OPERACOES">Operações</option>
                <option value="SEGURANCA">Segurança</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">Todas as Prioridades</option>
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Baixa</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Aberta</option>
                <option value="ASSIGNED">Atribuída</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="WAITING">Em Espera</option>
                <option value="BLOCKED">Bloqueada</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Título da Tarefa</th>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Prazo / SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Carregando tarefas...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhuma tarefa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const pVariant =
                      t.priority === 'CRITICAL' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'default';

                    const sVariant =
                      t.status === 'COMPLETED'
                        ? 'success'
                        : t.status === 'IN_PROGRESS'
                        ? 'info'
                        : t.status === 'WAITING'
                        ? 'warning'
                        : t.status === 'BLOCKED'
                        ? 'danger'
                        : 'default';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="hover:bg-slate-800/50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {t.taskNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                          {t.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-300 font-mono">{t.module}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={pVariant}>{t.priority}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={sVariant}>{t.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {t.assignedUserName || <span className="text-slate-500 italic">Não atribuído</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {t.dueAt ? formatDateTime(t.dueAt) : 'Sem prazo'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'kanban' && (
        <TaskKanbanView tasks={tasks} onTaskUpdated={handleTaskUpdated} />
      )}

      {activeTab === 'productivity' && (
        <ProductivityDashboardView summary={summary} isLoading={isLoading} />
      )}

      {activeTab === 'workflows' && (
        <WorkflowAdminView />
      )}

      {activeTab === 'teams' && (
        <TeamAdminView />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            handleTaskUpdated();
            setSelectedTask(null);
          }}
        />
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={true}
          onClose={() => setIsNewTaskModalOpen(false)}
          onTaskCreated={handleTaskUpdated}
        />
      )}
    </div>
  );
};
