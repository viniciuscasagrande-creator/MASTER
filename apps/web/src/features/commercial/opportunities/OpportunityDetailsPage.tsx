import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  CommercialOpportunityDTO,
  CommercialPipelineStageDTO,
  OpportunityCloseReasonDTO,
  CommercialActivityDTO,
  CommercialActivityType,
  OpportunityStageHistoryDTO
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../shared/utils/formatters';

interface OpportunityDetailsPageProps {
  opportunityId: string;
  onBack: () => void;
  onSelectProducer?: (producerId: string) => void;
}

export const OpportunityDetailsPage: React.FC<OpportunityDetailsPageProps> = ({
  opportunityId,
  onBack,
  onSelectProducer
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opp, setOpp] = useState<CommercialOpportunityDTO & { stageHistory?: OpportunityStageHistoryDTO[] } | null>(null);
  const [stages, setStages] = useState<CommercialPipelineStageDTO[]>([]);
  const [closeReasons, setCloseReasons] = useState<OpportunityCloseReasonDTO[]>([]);
  const [activities, setActivities] = useState<CommercialActivityDTO[]>([]);

  // Modals
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetStageId, setTargetStageId] = useState<string>('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const [winModalOpen, setWinModalOpen] = useState(false);
  const [winValue, setWinValue] = useState<string>('');
  const [winNotes, setWinNotes] = useState<string>('');
  const [winLoading, setWinLoading] = useState(false);
  const [winError, setWinError] = useState<string | null>(null);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReasonId, setCloseReasonId] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'MEETING' as CommercialActivityType,
    subject: '',
    description: '',
    nextActionDescription: '',
    nextActionAt: ''
  });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const loadOpportunityDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [oppRes, reasonsRes, actRes] = await Promise.all([
        CommercialApi.getOpportunityById(opportunityId),
        CommercialApi.listCloseReasons(),
        CommercialApi.listActivities({ opportunityId })
      ]);
      setOpp(oppRes);
      setCloseReasons(reasonsRes);
      setActivities(actRes || []);

      if (oppRes.pipelineId) {
        const stagesRes = await CommercialApi.listStages(oppRes.pipelineId);
        setStages(stagesRes);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da oportunidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunityDetails();
  }, [opportunityId]);

  // Transitions
  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opp || !targetStageId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);
    if (targetStage?.stageType === 'WON') {
      setMoveModalOpen(false);
      setWinModalOpen(true);
      return;
    }
    if (targetStage?.stageType === 'CLOSED') {
      setMoveModalOpen(false);
      setCloseModalOpen(true);
      return;
    }

    try {
      setMoveLoading(true);
      setMoveError(null);
      await CommercialApi.transitionOpportunity(opp.id, {
        targetStageId,
        expectedVersion: opp.version
      });
      setMoveModalOpen(false);
      await loadOpportunityDetails();
    } catch (err: any) {
      setMoveError(err.message || 'Erro ao mover estágio da oportunidade.');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleConfirmWin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opp) return;
    try {
      setWinLoading(true);
      setWinError(null);
      await CommercialApi.winOpportunity(opp.id, {
        expectedVersion: opp.version,
        notes: winNotes.trim() || undefined
      });
      setWinModalOpen(false);
      await loadOpportunityDetails();
    } catch (err: any) {
      setWinError(err.message || 'Erro ao registrar ganho da oportunidade.');
    } finally {
      setWinLoading(false);
    }
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opp || !closeReasonId) {
      setCloseError('O motivo de encerramento é obrigatório.');
      return;
    }
    try {
      setCloseLoading(true);
      setCloseError(null);
      await CommercialApi.closeOpportunity(opp.id, {
        closeReasonId,
        closeNotes: closeNotes.trim() || 'Sem observações adicionais',
        expectedVersion: opp.version
      });
      setCloseModalOpen(false);
      await loadOpportunityDetails();
    } catch (err: any) {
      setCloseError(err.message || 'Erro ao encerrar oportunidade.');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleRegisterActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opp || !activityForm.subject.trim()) {
      setActivityError('O assunto da atividade é obrigatório.');
      return;
    }
    try {
      setActivityLoading(true);
      setActivityError(null);
      await CommercialApi.registerActivity({
        opportunityId: opp.id,
        producerId: opp.producerId || undefined,
        type: activityForm.type,
        subject: activityForm.subject.trim(),
        description: activityForm.description.trim() || undefined,
        nextActionDescription: activityForm.nextActionDescription.trim() || undefined,
        nextActionAt: activityForm.nextActionAt ? new Date(activityForm.nextActionAt).toISOString() : undefined
      });
      setActivityModalOpen(false);
      setActivityForm({
        type: 'MEETING',
        subject: '',
        description: '',
        nextActionDescription: '',
        nextActionAt: ''
      });
      await loadOpportunityDetails();
    } catch (err: any) {
      setActivityError(err.message || 'Erro ao registrar interação.');
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading && !opp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-400 mb-3" />
        <p className="text-sm">Carregando detalhes da oportunidade...</p>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar para Central de Oportunidades
        </Button>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <AlertCircle className="h-6 w-6 text-rose-400 mb-2" />
          <h2 className="font-semibold text-white">Não foi possível carregar a oportunidade</h2>
          <p className="text-xs text-rose-200 mt-1">{error || 'Oportunidade não encontrada ou acesso restrito.'}</p>
        </div>
      </div>
    );
  }

  const isNextActionOverdue = opp.nextActionAt && new Date(opp.nextActionAt) < new Date();

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Funil de Oportunidades
        </Button>

        <div className="flex items-center gap-2">
          {opp.status === 'OPEN' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetStageId(opp.stageId);
                  setMoveModalOpen(true);
                }}
                icon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Mover Estágio
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setCloseReasonId(closeReasons[0]?.id || '');
                  setCloseModalOpen(true);
                }}
                icon={<XCircle className="h-3.5 w-3.5" />}
              >
                Encerrar / Perder
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  setWinValue(opp.estimatedValue ? opp.estimatedValue.toString() : '');
                  setWinModalOpen(true);
                }}
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                Marcar como Ganha (WON)
              </Button>
            </>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActivityModalOpen(true)}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            Registrar Interação
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-xs">
                {opp.publicCode}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">{opp.title}</h1>
              <Badge
                variant={
                  opp.status === 'WON'
                    ? 'emerald'
                    : opp.status === 'CLOSED'
                    ? 'rose'
                    : 'amber'
                }
              >
                {opp.status}
              </Badge>
              <Badge variant="cyan" size="sm">
                {opp.stageName || 'Estágio do Funil'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {opp.producerId ? (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-orange-400" />
                  <span>Produtor:</span>
                  <button
                    onClick={() => onSelectProducer?.(opp.producerId!)}
                    className="font-semibold text-white hover:text-orange-400 underline flex items-center gap-1"
                  >
                    {opp.producerName || opp.producerId}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Prospecção: <strong className="text-slate-300">{opp.leadCompanyName || 'Lead'}</strong></span>
                </div>
              )}

              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                <span>Responsável: <strong className="text-white">{opp.ownerName || 'Não atribuído'}</strong></span>
              </div>

              {opp.typeId && (
                <>
                  <span>•</span>
                  <span>Tipo: <strong className="text-slate-300">{opp.typeId}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="pr-4 border-r border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Valor Estimado
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : '—'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Previsão de Fechamento
              </div>
              <div className="text-sm font-bold font-mono text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-orange-400" />
                {opp.expectedDecisionAt ? formatDate(opp.expectedDecisionAt) : 'Não informada'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Timeline, Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope and Context */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-400" />
              Escopo e Requisitos da Oportunidade
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {opp.description || 'Nenhum detalhe adicional informado no cadastro da oportunidade.'}
            </p>
          </div>

          {/* Stage History Timeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Linha do Tempo de Estágios do Funil
            </h3>

            <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {opp.stageHistory && opp.stageHistory.length > 0 ? (
                opp.stageHistory.map((hist, idx) => {
                  const durationDays = hist.durationSeconds ? Math.round(hist.durationSeconds / 86400) : 0;

                  return (
                    <div key={hist.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-orange-400 ring-4 ring-slate-900" />
                      <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {hist.fromStageName ? `${hist.fromStageName} → ${hist.toStageName}` : hist.toStageName}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {formatDateTime(hist.changedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Por: <strong className="text-slate-300">{hist.changedByName || 'Usuário'}</strong></span>
                          {durationDays > 0 && (
                            <>
                              <span>•</span>
                              <span>Tempo de permanência: <strong className="text-orange-400 font-mono">{durationDays} dias</strong></span>
                            </>
                          )}
                        </div>
                        {hist.reason && (
                          <p className="text-[11px] text-slate-300 italic pt-1">{hist.reason}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  Histórico de transições indisponível.
                </div>
              )}
            </div>
          </div>

          {/* Activities Log */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                Interações Comerciais Registradas ({activities.length})
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setActivityModalOpen(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Nova Interação
              </Button>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-xs text-slate-500 italic text-center py-6">
                  Nenhuma atividade registrada nesta oportunidade.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" size="sm">{act.type}</Badge>
                        <span className="font-semibold text-white">{act.subject}</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">{formatDateTime(act.createdAt)}</span>
                    </div>
                    {act.description && (
                      <p className="text-slate-300 leading-relaxed">{act.description}</p>
                    )}
                    {act.nextActionDescription && (
                      <div className="text-[11px] text-orange-400 font-medium pt-1">
                        Próxima Ação: {act.nextActionDescription} {act.nextActionAt ? `(${formatDate(act.nextActionAt)})` : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Next Action & Governance Information */}
        <div className="space-y-6">
          {/* Next Action Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-400" />
              Próximo Passo / Ação Comercial
            </h3>

            {opp.nextActionDescription ? (
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
                <div className="font-semibold text-white text-xs">{opp.nextActionDescription}</div>
                {opp.nextActionAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Prazo:</span>
                    <span
                      className={`font-mono font-bold ${
                        isNextActionOverdue ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {formatDate(opp.nextActionAt)}
                    </span>
                  </div>
                )}
                {isNextActionOverdue && (
                  <Badge variant="rose" size="sm" className="w-full justify-center">
                    Prazo Vencido - Requer Atenção
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-4 text-center">
                Nenhuma ação pendente agendada.
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => setActivityModalOpen(true)}
              icon={<MessageSquare className="h-3.5 w-3.5" />}
            >
              Agendar Nova Ação
            </Button>
          </div>

          {/* Governance & Audit Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Auditoria de Negociação
            </h3>
            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Versão de Bloqueio:</span>
                <span className="font-mono text-slate-200">v{opp.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Data de Criação:</span>
                <span className="font-mono text-slate-200">{formatDateTime(opp.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Última Atualização:</span>
                <span className="font-mono text-slate-200">{formatDateTime(opp.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Mover Estágio */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-orange-400" />
            <span>Transicionar Estágio</span>
          </div>
        }
        size="sm"
      >
        <form onSubmit={handleConfirmMove} className="space-y-4">
          {moveError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{moveError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Selecione o Novo Estágio
            </label>
            <select
              value={targetStageId}
              onChange={(e) => setTargetStageId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.stageType === 'WON' ? '(GANHO)' : s.stageType === 'CLOSED' ? '(PERDIDO)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMoveModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={moveLoading}
            >
              Confirmar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ganho (WON) */}
      <Modal
        isOpen={winModalOpen}
        onClose={() => setWinModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>Confirmar Ganho da Oportunidade (WON)</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleConfirmWin} className="space-y-4">
          {winError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{winError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Valor Final Fechado (R$)
            </label>
            <input
              type="text"
              value={winValue}
              onChange={(e) => setWinValue(e.target.value)}
              placeholder="Ex: 100.000,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Anotações de Fechamento
            </label>
            <textarea
              rows={3}
              value={winNotes}
              onChange={(e) => setWinNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWinModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              isLoading={winLoading}
            >
              Confirmar Fechamento Ganho
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Encerrar / Lost */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <span>Encerrar Negociação Comercial</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleConfirmClose} className="space-y-4">
          {closeError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{closeError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo do Fechamento <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={closeReasonId}
              onChange={(e) => setCloseReasonId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {closeReasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações Adicionais
            </label>
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCloseModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={closeLoading}
            >
              Encerrar Negociação
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Atividade */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            <span>Registrar Interação nesta Oportunidade</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleRegisterActivity} className="space-y-4">
          {activityError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{activityError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tipo de Atendimento
            </label>
            <select
              value={activityForm.type}
              onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as CommercialActivityType })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="MEETING">Reunião</option>
              <option value="CALL">Ligação Telefônica</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="VISIT">Visita Técnica</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assunto <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              value={activityForm.subject}
              onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
              placeholder="Ex: Alinhamento de minuta contratual"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição
            </label>
            <textarea
              rows={3}
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Próxima Ação (Título)
              </label>
              <input
                type="text"
                value={activityForm.nextActionDescription}
                onChange={(e) => setActivityForm({ ...activityForm, nextActionDescription: e.target.value })}
                placeholder="Ex: Enviar proposta final"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Prazo Limite
              </label>
              <input
                type="date"
                value={activityForm.nextActionAt}
                onChange={(e) => setActivityForm({ ...activityForm, nextActionAt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivityModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={activityLoading}
            >
              Registrar Atividade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
