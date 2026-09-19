import React, { useState } from 'react';
import {
  Inbox,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  User,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { formatDateTime } from '../../shared/utils/formatters';
import { TaskItem } from './tasks.types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskKanbanViewProps {
  tasks: TaskItem[];
  onTaskUpdated?: () => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ tasks, onTaskUpdated }) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const openTasks = tasks.filter(t => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'BLOCKED');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const waitingTasks = tasks.filter(t => t.status === 'WAITING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const columns = [
    {
      id: 'open',
      title: 'Abertas / A Fazer',
      icon: <Inbox className="h-4 w-4 text-blue-400" />,
      tasks: openTasks,
      borderClass: 'border-t-blue-500'
    },
    {
      id: 'in_progress',
      title: 'Em Andamento',
      icon: <Play className="h-4 w-4 text-amber-400" />,
      tasks: inProgressTasks,
      borderClass: 'border-t-amber-500'
    },
    {
      id: 'waiting',
      title: 'Em Espera',
      icon: <Pause className="h-4 w-4 text-orange-400" />,
      tasks: waitingTasks,
      borderClass: 'border-t-orange-500'
    },
    {
      id: 'completed',
      title: 'Concluídas',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      tasks: completedTasks,
      borderClass: 'border-t-emerald-500'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col border-t-4 ${col.borderClass} max-h-[80vh] shadow-lg`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="text-sm font-bold text-white">{col.title}</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {col.tasks.length}
              </span>
            </div>

            {/* Column Body / Cards List */}
            <div className="p-3 overflow-y-auto space-y-3 flex-1">
              {col.tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">Nenhuma tarefa nesta coluna.</div>
              ) : (
                col.tasks.map((task) => {
                  const checklist = task.checklist || (task as any).checklistItems || [];
                  const completedCount = checklist.filter((i: any) => i.isCompleted).length;

                  const priorityVariant =
                    task.priority === 'CRITICAL'
                      ? 'danger'
                      : task.priority === 'HIGH'
                      ? 'warning'
                      : 'default';

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg p-3.5 space-y-3 cursor-pointer transition shadow-md group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-amber-400">
                          {task.taskNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant={priorityVariant}>{task.priority}</Badge>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          <User className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">{task.assignedUserName || 'Não atribuído'}</span>
                        </div>

                        {checklist.length > 0 && (
                          <div className="flex items-center gap-1 text-slate-300 font-mono">
                            <CheckSquare className="h-3 w-3 text-amber-400" />
                            <span>{completedCount}/{checklist.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            if (onTaskUpdated) onTaskUpdated();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
