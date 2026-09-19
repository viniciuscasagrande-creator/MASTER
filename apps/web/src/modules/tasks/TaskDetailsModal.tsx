import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  UserCheck,
  UserPlus,
  Send,
  FileText,
  MessageSquare,
  History,
  CheckSquare,
  Lock,
  ArrowRight,
  ShieldCheck,
  Paperclip
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { TaskItem, TaskWaitingReason } from './tasks.types';
import { ResourceDocuments } from '../documents/ResourceDocuments';

interface TaskDetailsModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const { apiFetch } = useDiskContext();
  const { currentUser, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'attachments' | 'comments' | 'history'>('details');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Submodals
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [waitReason, setWaitReason] = useState<TaskWaitingReason>('CLIENTE');
  const [waitDetails, setWaitDetails] = useState('');

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignUserId, setReassignUserId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [forwardApproval, setForwardApproval] = useState(false);
  const [approvalOperation, setApprovalOperation] = useState('FINANCE_TRANSFER');
  const [approvalAmount, setApprovalAmount] = useState<number>(0);

  if (!isOpen || !task) return null;

  const handleClaim = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/claim`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao assumir tarefa.');
      }
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao iniciar tarefa.');
      }
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWait = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/wait`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: waitReason, details: waitDetails })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao pausar tarefa.');
      }
      setShowWaitModal(false);
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/resume`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao retomar tarefa.');
      }
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: completeNotes,
          forwardToApproval: forwardApproval,
          approvalOperation: forwardApproval ? approvalOperation : undefined,
          approvalAmount: forwardApproval ? approvalAmount : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao concluir tarefa.');
      }
      setShowCompleteModal(false);
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignReason.trim()) {
      setErrorMessage('O motivo da reatribuição é obrigatório.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: reassignUserId || undefined,
          reason: reassignReason
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao reatribuir tarefa.');
      }
      setShowReassignModal(false);
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setErrorMessage('O motivo do cancelamento é obrigatório.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao cancelar tarefa.');
      }
      setShowCancelModal(false);
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      setErrorMessage('O motivo da reabertura é obrigatório.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reopenReason })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao reabrir tarefa.');
      }
      setShowReopenModal(false);
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentCompleted: boolean) => {
    try {
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentCompleted })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao atualizar checklist.');
      }
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiFetch(`/api/v1/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao enviar comentário.');
      }
      setCommentText('');
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checklist = task.checklist || (task as any).checklistItems || [];
  const completedCount = checklist.filter((i: any) => i.isCompleted).length;
  const pendingRequiredCount = checklist.filter((i: any) => i.isRequired && !i.isCompleted).length;

  const priorityBadgeVariant =
    task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : 'default';

  const statusBadgeVariant =
    task.status === 'COMPLETED'
      ? 'success'
      : task.status === 'IN_PROGRESS'
      ? 'info'
      : task.status === 'WAITING'
      ? 'warning'
      : task.status === 'BLOCKED'
      ? 'danger'
      : 'default';

  const slaBadgeVariant =
    task.slaStatus === 'BREACHED'
      ? 'danger'
      : task.slaStatus === 'NEARING_BREACH'
      ? 'warning'
      : task.slaStatus === 'PAUSED'
      ? 'default'
      : 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                {task.taskNumber}
              </span>
              <Badge variant="default">{task.module}</Badge>
              <Badge variant={priorityBadgeVariant}>{task.priority}</Badge>
              <Badge variant={statusBadgeVariant}>{task.status}</Badge>
              <Badge variant={slaBadgeVariant}>
                {task.slaStatus === 'BREACHED'
                  ? 'SLA Estourado'
                  : task.slaStatus === 'NEARING_BREACH'
                  ? 'SLA Quase Estourando'
                  : task.slaStatus === 'PAUSED'
                  ? 'SLA Pausado'
                  : 'Dentro do SLA'}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {task.status === 'OPEN' && (
              <Button size="sm" variant="primary" onClick={handleClaim} disabled={isSubmitting}>
                <UserCheck className="h-4 w-4 mr-1 text-amber-400" /> Assumir Tarefa
              </Button>
            )}

            {(task.status === 'OPEN' || task.status === 'ASSIGNED') && (
              <Button size="sm" variant="primary" onClick={handleStart} disabled={isSubmitting}>
                <Play className="h-4 w-4 mr-1 text-emerald-400" /> Iniciar
              </Button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowWaitModal(true)} disabled={isSubmitting}>
                  <Pause className="h-4 w-4 mr-1 text-amber-400" /> Pausar / Aguardar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowCompleteModal(true)}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir Tarefa
                </Button>
              </>
            )}

            {task.status === 'WAITING' && (
              <Button size="sm" variant="primary" onClick={handleResume} disabled={isSubmitting}>
                <RotateCcw className="h-4 w-4 mr-1 text-emerald-400" /> Retomar Trabalho
              </Button>
            )}

            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
              <Button size="sm" variant="ghost" onClick={() => setShowReassignModal(true)} disabled={isSubmitting}>
                <UserPlus className="h-4 w-4 mr-1" /> Reatribuir
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
              <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300" onClick={() => setShowCancelModal(true)}>
                Cancelar
              </Button>
            )}

            {(task.status === 'COMPLETED' || task.status === 'CANCELLED') && hasPermission('tarefas.tarefa.reabrir') && (
              <Button size="sm" variant="outline" onClick={() => setShowReopenModal(true)}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reabrir
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-800 flex gap-6 text-sm">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 font-medium transition ${
              activeTab === 'details' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
              activeTab === 'checklist' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="h-4 w-4" /> Checklist
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800">
              {completedCount}/{checklist.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
              activeTab === 'attachments' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Paperclip className="h-4 w-4" /> Anexos & Docs
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
              activeTab === 'comments' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Comentários
            {task.comments && task.comments.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800">{task.comments.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
              activeTab === 'history' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" /> Histórico
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {task.description && (
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descrição</h4>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {task.waitingReason && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    Motivo da Espera: {task.waitingReason}
                  </h4>
                  <p className="text-sm text-slate-300">{task.blockedReason || 'Aguardando ação externa para prosseguir.'}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atribuição & Equipe</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Responsável:</span>
                      <span className="text-white font-medium">{task.assignedUserName || 'Não atribuído'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Equipe:</span>
                      <span className="text-white font-medium">{task.assignedTeamName || 'Geral'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Escalonação:</span>
                      <span className="text-white font-medium">Nível {task.escalationLevel || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prazos & SLA</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Criada em:</span>
                      <span className="text-white">{formatDateTime(task.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prazo Estimado:</span>
                      <span className="text-white">{task.dueAt ? formatDateTime(task.dueAt) : 'Sem prazo'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deadline SLA:</span>
                      <span className="text-white font-mono">{task.slaDeadline ? formatDateTime(task.slaDeadline) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Itens de Verificação</h4>
                <span className="text-xs text-slate-400">
                  {pendingRequiredCount > 0 ? (
                    <span className="text-amber-400 font-medium">
                      {pendingRequiredCount} {pendingRequiredCount === 1 ? 'item obrigatório pendente' : 'itens obrigatórios pendentes'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium">Todos os itens obrigatórios cumpridos</span>
                  )}
                </span>
              </div>

              {checklist.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum item de checklist cadastrado para esta tarefa.</p>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item: any) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${
                        item.isCompleted
                          ? 'bg-slate-950/60 border-emerald-500/20 text-slate-300'
                          : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                        className="mt-1 rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={item.isCompleted ? 'line-through text-slate-400' : ''}>{item.text}</span>
                          {item.isRequired && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        {item.completedAt && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Concluído em {formatDateTime(item.completedAt)}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <ResourceDocuments
                resourceType="TASK"
                resourceId={task.id}
                title="Documentos e Anexos Vinculados à Tarefa"
              />
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((cmt: any) => (
                    <div key={cmt.id} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400">{cmt.userName || 'Operador'}</span>
                        <span className="text-slate-500">{formatDateTime(cmt.createdAt)}</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-wrap">{cmt.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Nenhum comentário registrado.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário ou mencione colegas (@nome)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <Button type="submit" size="sm" variant="primary" disabled={isSubmitting || !commentText.trim()}>
                    <Send className="h-4 w-4 mr-1" /> Comentar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {task.history && task.history.length > 0 ? (
                <div className="relative pl-4 border-l border-slate-800 space-y-4">
                  {task.history.map((h: any) => (
                    <div key={h.id} className="relative text-xs space-y-1">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase">{h.action}</span>
                        <span className="text-slate-400">por {h.userName || 'Sistema'}</span>
                        <span className="text-slate-500">• {formatDateTime(h.createdAt)}</span>
                      </div>
                      {h.details && (
                        <p className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-900 overflow-x-auto">
                          {typeof h.details === 'object' ? JSON.stringify(h.details, null, 2) : h.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Sem histórico registrado.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {/* Submodal: Pausar / Aguardar */}
      {showWaitModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Colocar Tarefa em Espera</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Motivo da Espera:</label>
                <select
                  value={waitReason}
                  onChange={(e) => setWaitReason(e.target.value as TaskWaitingReason)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="CLIENTE">Aguardando Cliente</option>
                  <option value="PRODUTOR">Aguardando Produtor</option>
                  <option value="BANCO">Aguardando Banco</option>
                  <option value="GATEWAY">Aguardando Gateway</option>
                  <option value="FORNECEDOR">Aguardando Fornecedor</option>
                  <option value="OUTRO_DEPARTAMENTO">Outro Departamento</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Detalhes adicionais:</label>
                <textarea
                  value={waitDetails}
                  onChange={(e) => setWaitDetails(e.target.value)}
                  placeholder="Explique o motivo do bloqueio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowWaitModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleWait} disabled={isSubmitting}>Confirmar Pausa</Button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Concluir com Aprovação opcional */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Concluir Tarefa</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Observações de Conclusão:</label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Informações sobre o resultado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white h-20"
                />
              </div>
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forwardApproval}
                    onChange={(e) => setForwardApproval(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500"
                  />
                  <span>Encaminhar para o Motor de Aprovações</span>
                </label>
              </div>
              {forwardApproval && (
                <div className="space-y-2 pt-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Operação de Aprovação:</label>
                    <select
                      value={approvalOperation}
                      onChange={(e) => setApprovalOperation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    >
                      <option value="FINANCE_TRANSFER">Transferência Financeira</option>
                      <option value="REFUND_REQUEST">Solicitação de Estorno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Valor (R$):</label>
                    <input
                      type="number"
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCompleteModal(false)}>Voltar</Button>
              <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleComplete} disabled={isSubmitting}>
                Confirmar Conclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Reatribuir */}
      {showReassignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reatribuir Tarefa</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">ID do Usuário de Destino:</label>
                <input
                  type="text"
                  value={reassignUserId}
                  onChange={(e) => setReassignUserId(e.target.value)}
                  placeholder="Ex: usr_fin_carlos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Motivo da Reatribuição (Obrigatório):</label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Explique o motivo da transferência..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReassignModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleReassign} disabled={isSubmitting}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-rose-400">Cancelar Tarefa</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Motivo do Cancelamento (Obrigatório):</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explique o motivo do cancelamento..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Voltar</Button>
              <Button variant="primary" className="bg-rose-600 hover:bg-rose-500 text-white" onClick={handleCancel} disabled={isSubmitting}>
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Reabrir */}
      {showReopenModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reabrir Tarefa</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Motivo da Reabertura (Obrigatório):</label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explique o motivo da reabertura..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReopenModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleReopen} disabled={isSubmitting}>Confirmar Reabertura</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
