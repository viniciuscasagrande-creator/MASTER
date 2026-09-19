import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  User,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Send,
  Lock,
  Play,
  Paperclip,
  Eye
} from 'lucide-react';
import { ApprovalRequestItem } from './approval.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatDateTime, formatCurrency } from '../../shared/utils/formatters';

interface ApprovalDetailsModalProps {
  request: ApprovalRequestItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, stepId?: string, comment?: string, stepUpToken?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onRequestChanges: (requestId: string, comment: string) => Promise<void>;
  onCancel: (requestId: string, reason?: string) => Promise<void>;
  onExecute: (requestId: string) => Promise<void>;
  onAddComment: (requestId: string, comment: string) => Promise<void>;
  currentUserId: string;
  userRoles: string[];
}

export const ApprovalDetailsModal: React.FC<ApprovalDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  onCancel,
  onExecute,
  onAddComment,
  currentUserId,
  userRoles
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'policy' | 'comments' | 'attachments'>('timeline');
  const [commentText, setCommentText] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [stepUpTokenInput, setStepUpTokenInput] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = userRoles.includes('ADMINISTRADOR_GERAL') || userRoles.includes('SUPER_ADMIN');
  const isRequester = request.requesterId === currentUserId;
  const isPendingOrInProgress = request.status === 'PENDING' || request.status === 'IN_PROGRESS';
  const isApproved = request.status === 'APPROVED';

  // Find active step
  const activeStep = (request.steps || []).find(s => s.status === 'IN_PROGRESS');

  // Rule snapshot parsed
  let parsedRule: any = null;
  if (request.policySnapshot) {
    try {
      parsedRule = JSON.parse(request.policySnapshot);
    } catch {
      parsedRule = request.rule;
    }
  } else {
    parsedRule = request.rule;
  }

  const requiresStepUp = parsedRule?.requireStepUp || (request.amount && request.amount >= 200000);

  const handleApproveAction = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onApprove(request.id, activeStep?.id, actionComment, stepUpTokenInput.trim() || undefined);
      setActionComment('');
      setStepUpTokenInput('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao aprovar a etapa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAction = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg('O motivo da rejeição é obrigatório.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onReject(request.id, rejectReason.trim());
      setRejectReason('');
      setIsRejecting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao rejeitar a solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestChangesAction = async () => {
    if (!actionComment.trim()) {
      setErrorMsg('Por favor informe quais alterações são necessárias.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onRequestChanges(request.id, actionComment.trim());
      setActionComment('');
      setIsRequestingChanges(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao solicitar alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onCancel(request.id, actionComment.trim() || 'Cancelado pelo usuário.');
      setActionComment('');
      setIsCancelling(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cancelar a solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onExecute(request.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao executar a operação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      await onAddComment(request.id, commentText.trim());
      setCommentText('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adicionar comentário.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejeitado</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelado</Badge>;
      case 'ACTION_REQUIRED':
        return <Badge variant="warning">Ajustes Requeridos</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary">Em Andamento</Badge>;
      default:
        return <Badge variant="warning">Pendente</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#1e222d] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between bg-gray-900/40">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {request.requestCode}
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{request.title}</h2>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-4">
              <span>Operação: <strong className="text-gray-200">{request.operation}</strong></span>
              {request.amount !== undefined && request.amount !== null && (
                <span>Valor: <strong className="text-emerald-400">{formatCurrency(request.amount)}</strong></span>
              )}
              <span>Criado em: {formatDateTime(request.createdAt)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-800 px-6 gap-6 bg-gray-900/20 text-sm">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Linha do Tempo ({request.steps?.length || 0} Etapas)
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Dados da Operação
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Snapshot da Regra
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="h-4 w-4" />
            Comentários ({request.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'attachments'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Paperclip className="h-4 w-4" />
            Anexos ({request.attachments?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Progresso das Aprovações ({request.approvalsCount} de {request.approvalsRequired} aprovadas)
                </h3>
                {parsedRule?.isSequential ? (
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                    Fluxo Sequencial
                  </span>
                ) : (
                  <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                    Fluxo Paralelo
                  </span>
                )}
              </div>

              {/* Step progression nodes */}
              <div className="space-y-4">
                {(request.steps || []).map((step, idx) => {
                  const isDone = step.status === 'APPROVED';
                  const isCurrent = step.status === 'IN_PROGRESS';
                  const isRejected = step.status === 'REJECTED';

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : isCurrent
                          ? 'bg-orange-500/5 border-orange-500/40 ring-1 ring-orange-500/20'
                          : 'bg-gray-800/30 border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : isRejected
                                ? 'bg-rose-500 text-white'
                                : isCurrent
                                ? 'bg-orange-500 text-white animate-pulse'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {isDone ? '✓' : isRejected ? '✕' : step.stepOrder}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-white">
                              Etapa {step.stepOrder}: Perfil{' '}
                              <span className="text-orange-400">{step.roleCode || 'Aprovador Autorizado'}</span>
                            </h4>
                            <p className="text-xs text-gray-400">
                              Status: <span className="font-medium text-gray-300">{step.status}</span>
                            </p>
                          </div>
                        </div>

                        {isDone && (
                          <div className="text-right">
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado por {step.approvedByUserName}
                            </span>
                            {step.decidedAt && (
                              <span className="text-xs text-gray-400">{formatDateTime(step.decidedAt)}</span>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="text-right">
                            <span className="text-xs text-rose-400 font-medium flex items-center gap-1 justify-end">
                              <XCircle className="h-3.5 w-3.5" /> Rejeitado por {step.approvedByUserName}
                            </span>
                          </div>
                        )}
                      </div>

                      {step.comment && (
                        <div className="mt-3 text-xs bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-gray-300">
                          <strong>Parecer do Aprovador:</strong> {step.comment}
                        </div>
                      )}

                      {step.stepUpVerified && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> Reautenticação Step-Up 2FA verificada com sucesso
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Execution Status Card (if approved) */}
              {isApproved && (
                <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-white">Execução da Operação</h4>
                    </div>
                    <Badge variant={request.executionStatus === 'SUCCESS' ? 'success' : request.executionStatus === 'FAILED' ? 'danger' : 'warning'}>
                      {request.executionStatus || 'NOT_STARTED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    O pedido foi formalmente aprovado e encontra-se pronto para execução contábil/bancária isolada.
                  </p>
                  {request.executionError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                      Falha na execução externa: {request.executionError}
                    </p>
                  )}
                  {request.executionId && (
                    <p className="text-xs font-mono text-gray-400">
                      Protocolo de Execução: {request.executionId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: DETAILS */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                <span className="text-xs text-gray-400">Solicitante</span>
                <p className="font-semibold text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-400" />
                  {request.requesterName} ({request.requesterRole || 'Operador'})
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                <span className="text-xs text-gray-400">Valor da Operação</span>
                <p className="font-semibold text-emerald-400 text-base">
                  {request.amount ? formatCurrency(request.amount) : 'Não monetário'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                <span className="text-xs text-gray-400">Produtor / Organização</span>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-400" />
                  {request.producerId ? `Produtora ID: ${request.producerId}` : 'Escopo Global'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                <span className="text-xs text-gray-400">Evento Vinculado</span>
                <p className="font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  {request.eventId ? `Evento ID: ${request.eventId}` : 'Todos os Eventos'}
                </p>
              </div>

              {request.description && (
                <div className="col-span-2 p-4 rounded-xl bg-gray-900/40 border border-gray-800 space-y-1">
                  <span className="text-xs text-gray-400">Descrição / Justificativa</span>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{request.description}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: POLICY SNAPSHOT */}
          {activeTab === 'policy' && (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
                Esta solicitação está vinculada ao <strong>Snapshot Imutável da Versão {request.ruleVersion}</strong> da regra.
                Quaisquer alterações futuras realizadas no painel de regras não alteram retroativamente este pedido.
              </div>

              {parsedRule ? (
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span className="font-semibold text-white">{parsedRule.name}</span>
                    <span className="font-mono text-xs text-orange-400">{parsedRule.code}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>Aprovações Requeridas: <strong>{parsedRule.approvalsRequired}</strong></div>
                    <div>Modo: <strong>{parsedRule.isSequential ? 'Sequencial' : 'Paralelo'}</strong></div>
                    <div>Maker-Checker Proibido Auto-Aprovação: <strong>{parsedRule.prohibitSelfApproval ? 'Sim' : 'Não'}</strong></div>
                    <div>Aprovadores Distintos (Checker 1 ≠ Checker 2): <strong>{parsedRule.requireDistinctApprovers ? 'Sim' : 'Não'}</strong></div>
                    <div>Requer Step-Up 2FA: <strong>{parsedRule.requireStepUp ? 'Sim' : 'Não'}</strong></div>
                    <div>SLA: <strong>{parsedRule.slaMinutes || 120} minutos</strong></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Nenhum snapshot de regra detalhado disponível.</p>
              )}
            </div>
          )}

          {/* TAB: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(request.comments || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum comentário registrado.</p>
                ) : (
                  request.comments?.map(c => (
                    <div key={c.id} className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <strong className="text-gray-200">{c.userName}</strong>
                        <span>{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-gray-300">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Adicionar nota técnica ou parecer..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <Button onClick={handleSendComment} size="sm" variant="primary">
                  Enviar
                </Button>
              </div>
            </div>
          )}

          {/* TAB: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-3">
              {(request.attachments || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum documento anexado.</p>
              ) : (
                request.attachments?.map(att => (
                  <div
                    key={att.id}
                    className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-400" />
                      <div>
                        <p className="font-semibold text-white">{att.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {att.documentType} • Anexado por {att.uploadedByUserName}
                        </p>
                      </div>
                    </div>
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" /> Visualizar
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ACTION FORMS (Approve / Reject / Changes / Cancel) */}
          {isPendingOrInProgress && !isRequester && (
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Ação do Aprovador</h4>

              {requiresStepUp && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4" /> Reautenticação Step-Up 2FA Obrigatória
                  </div>
                  <p>Esta operação é de alta criticidade e exige confirmação de token Step-Up para aprovar.</p>
                  <input
                    type="password"
                    placeholder="Token de reautenticação Step-Up..."
                    value={stepUpTokenInput}
                    onChange={e => setStepUpTokenInput(e.target.value)}
                    className="w-full bg-gray-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              {isRejecting ? (
                <div className="p-4 bg-rose-500/5 border border-rose-500/30 rounded-xl space-y-3">
                  <h5 className="text-sm font-semibold text-rose-400">Rejeição da Solicitação</h5>
                  <textarea
                    rows={2}
                    placeholder="Descreva obrigatoriamente a justificativa da recusa..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full bg-gray-900 border border-rose-500/40 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>
                      Voltar
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleRejectAction} isLoading={isLoading}>
                      Confirmar Rejeição
                    </Button>
                  </div>
                </div>
              ) : isRequestingChanges ? (
                <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl space-y-3">
                  <h5 className="text-sm font-semibold text-amber-400">Solicitar Ajustes</h5>
                  <textarea
                    rows={2}
                    placeholder="Descreva o que o solicitante deve corrigir..."
                    value={actionComment}
                    onChange={e => setActionComment(e.target.value)}
                    className="w-full bg-gray-900 border border-amber-500/40 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsRequestingChanges(false)}>
                      Voltar
                    </Button>
                    <Button size="sm" variant="warning" onClick={handleRequestChangesAction} isLoading={isLoading}>
                      Enviar Solicitação de Ajustes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setIsRejecting(true)}
                      disabled={isLoading}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsRequestingChanges(true)}
                      disabled={isLoading}
                    >
                      Pedir Ajustes
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="success"
                    onClick={handleApproveAction}
                    isLoading={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Aprovar Etapa {activeStep?.stepOrder || ''}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* CANCEL ACTION FOR REQUESTER OR SUPER ADMIN */}
          {isPendingOrInProgress && (isRequester || isSuperAdmin) && !isRejecting && !isRequestingChanges && (
            <div className="pt-2 flex justify-end">
              {isCancelling ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Motivo do cancelamento..."
                    value={actionComment}
                    onChange={e => setActionComment(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <Button size="xs" variant="ghost" onClick={() => setIsCancelling(false)}>
                    Voltar
                  </Button>
                  <Button size="xs" variant="danger" onClick={handleCancelAction} isLoading={isLoading}>
                    Confirmar Cancelamento
                  </Button>
                </div>
              ) : (
                <Button size="xs" variant="ghost" onClick={() => setIsCancelling(true)} className="text-gray-400 hover:text-rose-400">
                  Cancelar Solicitação
                </Button>
              )}
            </div>
          )}

          {/* EXECUTE ACTION IF APPROVED */}
          {isApproved && (request.executionStatus === 'NOT_STARTED' || request.executionStatus === 'FAILED') && (
            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <Button
                variant="primary"
                onClick={handleExecuteAction}
                isLoading={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Executar Operação
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
