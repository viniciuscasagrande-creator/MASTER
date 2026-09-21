import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  QrCode,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  Ban
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { formatCurrency } from '../../shared/utils/formatters';

interface PayoutRecordUI {
  id: string;
  payoutNumber: string;
  producerId: string;
  producerName: string;
  eventId: string;
  eventName: string;
  amount: number;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'BLOCKED' | 'REJECTED';
  scheduledDate: string;
  paidAt?: string;
  bankInfo: {
    bankName: string;
    agency: string;
    account: string;
    pixKey?: string;
    document: string;
  };
  requestedBy: string;
  approvedBy?: string;
  approvalChain?: Array<{
    level: number;
    approverName: string;
    approvedAt: string;
  }>;
  bankAuthCode?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

interface PayoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: PayoutRecordUI | null;
  onRefresh: () => void;
  canApprove?: boolean;
}

export const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({
  isOpen,
  onClose,
  payout,
  onRefresh,
  canApprove = true
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !payout) return null;

  const handleApprove = async () => {
    setActionError('');
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/finance/payouts/${payout.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Erro ao aprovar repasse.');
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/finance/payouts/${payout.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAuthCode: authCodeInput })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Erro ao liquidar repasse.');
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonInput) {
      setActionError('Informe o motivo da rejeição.');
      return;
    }
    setActionError('');
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/finance/payouts/${payout.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReasonInput })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Erro ao rejeitar repasse.');
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="emerald">Liquidado</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan">Em Processamento</Badge>;
      case 'SCHEDULED':
        return <Badge variant="purple">Agendado</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">Rejeitado</Badge>;
      case 'BLOCKED':
        return <Badge variant="orange">Bloqueado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide font-mono">
                  {payout.payoutNumber}
                </h2>
                {getStatusBadge(payout.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {payout.producerName} • {payout.eventName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Value Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Valor do Repasse
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                {formatCurrency(payout.amount)}
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500 block">Data Prevista</span>
              <span className="font-mono text-white font-semibold">{payout.scheduledDate}</span>
            </div>
          </div>

          {/* Banking Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              Dados Bancários do Produtor
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Instituição</span>
                <span className="text-white font-medium">{payout.bankInfo.bankName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Agência & Conta</span>
                <span className="text-white font-mono">{payout.bankInfo.agency} / {payout.bankInfo.account}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CNPJ / Titular</span>
                <span className="text-white font-mono">{payout.bankInfo.document}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Chave PIX</span>
                <span className="text-white font-mono truncate block" title={payout.bankInfo.pixKey}>
                  {payout.bankInfo.pixKey || 'Não cadastrada'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payout.notes && (
            <div className="text-xs rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-slate-300">
              <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Observações:</span>
              {payout.notes}
            </div>
          )}

          {/* Timeline & Audit Chain */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              Trilha de Auditoria & Aprovação
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Solicitado por:</span>
                <span className="font-semibold text-white">{payout.requestedBy}</span>
              </div>

              {payout.approvalChain && payout.approvalChain.map((appr, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Alçada {appr.level}: {appr.approverName}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{new Date(appr.approvedAt).toLocaleString('pt-BR')}</span>
                </div>
              ))}

              {payout.bankAuthCode && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-cyan-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Autenticação Bancária:
                  </span>
                  <span className="font-mono font-bold">{payout.bankAuthCode}</span>
                </div>
              )}

              {payout.rejectionReason && (
                <div className="flex items-start justify-between py-1.5 text-rose-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Ban className="h-3.5 w-3.5" /> Motivo da Rejeição:
                  </span>
                  <span className="text-right max-w-xs">{payout.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Process Payout Form */}
          {showProcessForm && (
            <form onSubmit={handleProcess} className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
              <div className="text-xs font-semibold text-cyan-300">
                Confirmar Baixa e Liquidação Bancária
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Código de Autenticação Bancária / EndToEndId do PIX
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ITAU-PIX-984128912"
                  value={authCodeInput}
                  onChange={(e) => setAuthCodeInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => setShowProcessForm(false)}>
                  Voltar
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isActionLoading}>
                  {isActionLoading ? 'Confirmando...' : 'Efetivar Liquidação'}
                </Button>
              </div>
            </form>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <form onSubmit={handleReject} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
              <div className="text-xs font-semibold text-rose-300">
                Rejeitar Solicitação de Repasse
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Justificativa Formal da Rejeição
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Divergência na chave PIX ou saldo bloqueado judicialmente"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-rose-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => setShowRejectForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="danger" type="submit" disabled={isActionLoading}>
                  {isActionLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/40 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            {payout.status === 'SCHEDULED' && canApprove && !showRejectForm && !showProcessForm && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="text-rose-400 border-rose-900/40 hover:bg-rose-900/20"
                >
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  {isActionLoading ? 'Aprovando...' : 'Aprovar Repasse'}
                </Button>
              </>
            )}

            {(payout.status === 'PROCESSING' || payout.status === 'SCHEDULED') && canApprove && !showProcessForm && !showRejectForm && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowProcessForm(true)}
                icon={<Building2 className="h-3.5 w-3.5" />}
              >
                Liquidar no Banco
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
