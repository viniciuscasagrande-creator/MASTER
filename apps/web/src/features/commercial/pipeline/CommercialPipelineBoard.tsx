import React, { useState } from 'react';
import {
  CommercialOpportunityDTO,
  CommercialPipelineStageDTO,
  OpportunityCloseReasonDTO
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

interface CommercialPipelineBoardProps {
  stages: CommercialPipelineStageDTO[];
  opportunities: CommercialOpportunityDTO[];
  closeReasons: OpportunityCloseReasonDTO[];
  onSelectOpportunity: (opportunityId: string) => void;
  onRefresh: () => void;
}

export const CommercialPipelineBoard: React.FC<CommercialPipelineBoardProps> = ({
  stages,
  opportunities,
  closeReasons,
  onSelectOpportunity,
  onRefresh
}) => {
  // Move Stage Modal
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedOppForMove, setSelectedOppForMove] = useState<CommercialOpportunityDTO | null>(null);
  const [targetStageId, setTargetStageId] = useState<string>('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Close / Lost Modal
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedOppForClose, setSelectedOppForClose] = useState<CommercialOpportunityDTO | null>(null);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Win Modal
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [selectedOppForWin, setSelectedOppForWin] = useState<CommercialOpportunityDTO | null>(null);
  const [winValue, setWinValue] = useState<string>('');
  const [winNotes, setWinNotes] = useState<string>('');
  const [winLoading, setWinLoading] = useState(false);
  const [winError, setWinError] = useState<string | null>(null);

  // Quick move to next stage
  const handleQuickNextStage = async (opp: CommercialOpportunityDTO) => {
    const currentIdx = stages.findIndex((s) => s.id === opp.stageId);
    if (currentIdx === -1 || currentIdx >= stages.length - 1) return;
    const nextStage = stages[currentIdx + 1];

    if (nextStage.stageType === 'WON') {
      handleOpenWin(opp);
      return;
    }
    if (nextStage.stageType === 'CLOSED') {
      handleOpenClose(opp);
      return;
    }

    try {
      await CommercialApi.transitionOpportunity(opp.id, {
        targetStageId: nextStage.id,
        expectedVersion: opp.version
      });
      onRefresh();
    } catch (err: any) {
      if (err.message && err.message.includes('409')) {
        alert('A oportunidade foi modificada recentemente por outro usuário. O quadro será atualizado.');
      } else {
        alert(err.message || 'Erro ao transicionar oportunidade.');
      }
      onRefresh();
    }
  };

  const handleOpenMove = (opp: CommercialOpportunityDTO) => {
    setSelectedOppForMove(opp);
    setTargetStageId(opp.stageId);
    setMoveError(null);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForMove || !targetStageId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);
    if (targetStage?.stageType === 'WON') {
      setMoveModalOpen(false);
      handleOpenWin(selectedOppForMove);
      return;
    }
    if (targetStage?.stageType === 'CLOSED') {
      setMoveModalOpen(false);
      handleOpenClose(selectedOppForMove);
      return;
    }

    try {
      setMoveLoading(true);
      setMoveError(null);
      await CommercialApi.transitionOpportunity(selectedOppForMove.id, {
        targetStageId,
        expectedVersion: selectedOppForMove.version
      });
      setMoveModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setMoveError(err.message || 'Erro ao mover estágio da oportunidade.');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleOpenWin = (opp: CommercialOpportunityDTO) => {
    setSelectedOppForWin(opp);
    setWinValue(opp.estimatedValue ? opp.estimatedValue.toString() : '');
    setWinNotes('');
    setWinError(null);
    setWinModalOpen(true);
  };

  const handleConfirmWin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForWin) return;
    try {
      setWinLoading(true);
      setWinError(null);
      await CommercialApi.winOpportunity(selectedOppForWin.id, {
        expectedVersion: selectedOppForWin.version,
        notes: winNotes.trim() || undefined
      });
      setWinModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setWinError(err.message || 'Erro ao registrar ganho da oportunidade.');
    } finally {
      setWinLoading(false);
    }
  };

  const handleOpenClose = (opp: CommercialOpportunityDTO) => {
    setSelectedOppForClose(opp);
    setSelectedReasonId(closeReasons[0]?.id || '');
    setCloseNotes('');
    setCloseError(null);
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForClose) return;
    if (!selectedReasonId) {
      setCloseError('O motivo de encerramento é obrigatório.');
      return;
    }
    try {
      setCloseLoading(true);
      setCloseError(null);
      await CommercialApi.closeOpportunity(selectedOppForClose.id, {
        closeReasonId: selectedReasonId,
        closeNotes: closeNotes.trim() || 'Sem observações adicionais',
        expectedVersion: selectedOppForClose.version
      });
      setCloseModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setCloseError(err.message || 'Erro ao encerrar oportunidade.');
    } finally {
      setCloseLoading(false);
    }
  };

  // Sort stages by position
  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[600px] scrollbar-thin">
        {sortedStages.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
          const stageTotalValue = stageOpps.reduce((sum, o) => sum + (o.estimatedValue || 0), 0);

          return (
            <div
              key={stage.id}
              className="flex flex-col w-80 shrink-0 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm max-h-[750px]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        stage.stageType === 'WON'
                          ? '#10b981'
                          : stage.stageType === 'CLOSED'
                          ? '#f43f5e'
                          : '#f97316'
                    }}
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[150px]">
                    {stage.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {stageOpps.length}
                  </span>
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-300">
                  {stageTotalValue > 0 ? formatCurrency(stageTotalValue) : '—'}
                </div>
              </div>

              {/* Column Cards Scroll Area */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageOpps.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-slate-600 italic">
                    Nenhuma oportunidade neste estágio
                  </div>
                ) : (
                  stageOpps.map((opp) => {
                    const isActionOverdue =
                      opp.nextActionAt && new Date(opp.nextActionAt) < new Date();

                    return (
                      <div
                        key={opp.id}
                        onClick={() => onSelectOpportunity(opp.id)}
                        className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 shadow-md hover:border-orange-500/50 hover:bg-slate-800/60 transition-all cursor-pointer space-y-2.5 group relative"
                      >
                        {/* Top: Public Code & Business Type */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded">
                            {opp.publicCode}
                          </span>
                          <span className="text-slate-400">
                            {opp.timeInCurrentStageDays || 0}d no estágio
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <h5 className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                            {opp.title}
                          </h5>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{opp.producerName || opp.leadCompanyName || 'Prospecção'}</span>
                          </div>
                        </div>

                        {/* Estimated Value & Date */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                          <div className="font-mono font-bold text-emerald-400">
                            {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : '—'}
                          </div>
                          {opp.expectedDecisionAt && (
                            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(opp.expectedDecisionAt)}
                            </div>
                          )}
                        </div>

                        {/* Next Action Badge */}
                        {opp.nextActionDescription && (
                          <div
                            className={`p-1.5 rounded text-[10px] flex items-center justify-between ${
                              isActionOverdue
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                : 'bg-slate-950/60 text-slate-300 border border-slate-800'
                            }`}
                          >
                            <span className="truncate max-w-[170px]">{opp.nextActionDescription}</span>
                            {opp.nextActionAt && (
                              <span className="font-mono ml-1 shrink-0 font-semibold">
                                {formatDate(opp.nextActionAt)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Owner & Card Quick Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Briefcase className="h-3 w-3 text-slate-500" />
                            <span className="truncate max-w-[100px]">{opp.ownerName || 'Livre'}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMove(opp);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-medium"
                              title="Mover Estágio"
                            >
                              Mover
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickNextStage(opp);
                              }}
                              className="p-1 rounded text-orange-400 hover:text-white hover:bg-orange-500/20"
                              title="Avançar para próximo estágio"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Mover Estágio */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-orange-400" />
            <span>Mover Oportunidade de Estágio</span>
          </div>
        }
        size="sm"
      >
        <form onSubmit={handleConfirmMove} className="space-y-4">
          <p className="text-xs text-slate-300">
            Transicionar a oportunidade <strong className="text-white">{selectedOppForMove?.title}</strong> ({selectedOppForMove?.publicCode}).
          </p>

          {moveError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{moveError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Selecione o Estágio de Destino
            </label>
            <select
              value={targetStageId}
              onChange={(e) => setTargetStageId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {sortedStages.map((s) => (
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
              Confirmar Transição
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ganhar Oportunidade (WON) */}
      <Modal
        isOpen={winModalOpen}
        onClose={() => setWinModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>Marcar Oportunidade como Ganha (WON)</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleConfirmWin} className="space-y-4">
          <p className="text-xs text-slate-300">
            Parabéns pelo fechamento! A oportunidade{' '}
            <strong className="text-white">{selectedOppForWin?.title}</strong> será arquivada como sucesso comercial.
          </p>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Nota de governança: O ganho da oportunidade não cria contratos ou eventos automaticamente no Core.
            A operação de cadastro e publicação do evento segue as regras do módulo de Eventos.
          </div>

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
              placeholder="Ex: 250.000,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações do Fechamento
            </label>
            <textarea
              rows={3}
              value={winNotes}
              onChange={(e) => setWinNotes(e.target.value)}
              placeholder="Termos acertados, data de assinatura, detalhes do acordo..."
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
              Registrar Vitória Comercial
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Encerrar Oportunidade (LOST / CLOSED) */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <span>Encerrar Oportunidade Comercial</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleConfirmClose} className="space-y-4">
          <p className="text-xs text-slate-300">
            Informe o motivo de encerramento da oportunidade{' '}
            <strong className="text-white">{selectedOppForClose?.title}</strong>. O registro é obrigatório para auditoria de funil.
          </p>

          {closeError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{closeError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo do Fechamento / Perda <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={selectedReasonId}
              onChange={(e) => setSelectedReasonId(e.target.value)}
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
              Justificativa / Observações Detalhadas
            </label>
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="O que levou à perda da negociação? Preço do concorrente, adiamento da turnê..."
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
    </div>
  );
};
