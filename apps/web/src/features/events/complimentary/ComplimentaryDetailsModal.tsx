import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { ComplimentaryRequestDTO } from '@shared/types/index';
import {
  approveComplimentaryRequest,
  rejectComplimentaryRequest,
  issueComplimentaryTickets,
  cancelComplimentaryRequest
} from '../api/complimentary.api';
import { Badge } from '../../../shared/components/Badge';
import { formatDateTime } from '../../../shared/utils/formatters';
import { CheckCircle2, XCircle, Ticket, User, Mail, FileText, Ban, AlertCircle } from 'lucide-react';

interface ComplimentaryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  request: ComplimentaryRequestDTO | null;
  onUpdated: () => void;
}

export const ComplimentaryDetailsModal: React.FC<ComplimentaryDetailsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  request,
  onUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveComplimentaryRequest(eventId, request.id);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Informe o motivo da rejeição');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await rejectComplimentaryRequest(eventId, request.id, rejectionReason);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      await issueComplimentaryTickets(eventId, request.id);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao emitir ingressos cortesia');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Deseja realmente cancelar esta solicitação e estornar o inventário?')) return;
    setLoading(true);
    setError(null);
    try {
      await cancelComplimentaryRequest(eventId, request.id, 'Cancelado administrativamente');
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const isPending = request.status === 'SUBMITTED' || request.status === 'APPROVAL_PENDING';
  const isApproved = request.status === 'APPROVED' || request.status === 'PARTIALLY_ISSUED';
  const canCancel = request.status !== 'CANCELLED' && request.status !== 'REJECTED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Solicitação de Cortesia: ${request.code}`}
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumo da Solicitação */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Categoria:</span>
            <strong className="text-white">{request.categoryName || 'Cortesia'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Sessão:</span>
            <strong className="text-white">{request.sessionName || 'Sessão Oficial'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Setor:</span>
            <strong className="text-indigo-400">{request.sectionName || 'Setor'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Quantidade:</span>
            <strong className="text-white">
              {request.quantityIssued} emitidos de {request.quantity}
            </strong>
          </div>
        </div>

        {/* Justificativa */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-3.5 text-xs">
          <span className="text-slate-500 font-semibold block mb-1">Justificativa:</span>
          <p className="text-slate-300 italic">"{request.reason}"</p>
          <div className="text-[11px] text-slate-500 mt-2">
            Solicitado por: <strong className="text-slate-400">{request.requesterName}</strong> em{' '}
            {formatDateTime(request.createdAt)}
          </div>
        </div>

        {/* Lista de Convidados e Status de Emissão */}
        <div>
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>Lista de Convidados ({request.guests?.length || 0})</span>
            <span className="text-[11px] text-slate-500">Consome diretamente do Pool de Inventário</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Convidado</th>
                  <th className="py-2.5 px-3">E-mail</th>
                  <th className="py-2.5 px-3">Documento</th>
                  <th className="py-2.5 px-3 text-center">Status Ingresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(request.guests || []).map((g, idx) => (
                  <tr key={g.id || idx}>
                    <td className="py-2.5 px-3 font-semibold text-white">{g.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{g.email || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{g.document || '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {g.issued ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Ticket className="h-3 w-3" />
                          <span>{g.ticketId ? g.ticketId.substring(0, 14) : 'Emitido'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          Não emitido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!request.guests || request.guests.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      Nenhum convidado cadastrado individualmente (emissão por lote).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motivo de Rejeição (se aplicável) */}
        {showRejectInput && (
          <div className="space-y-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
            <label className="text-xs font-bold text-rose-400">Motivo da Rejeição:</label>
            <input
              type="text"
              placeholder="Descreva o motivo pelo qual a cortesia não foi autorizada"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        )}

        {/* Ações Administrativas */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div>
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Cancelar Solicitação</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPending && !showRejectInput && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Rejeitar</span>
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aprovar Solicitação</span>
                </button>
              </>
            )}

            {isApproved && (
              <button
                type="button"
                onClick={handleIssue}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              >
                <Ticket className="h-4 w-4" />
                <span>Emitir Ingressos no Inventário</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
