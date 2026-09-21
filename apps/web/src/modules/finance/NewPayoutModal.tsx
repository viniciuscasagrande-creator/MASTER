import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';

interface NewPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName?: string;
  events: Array<{
    id: string;
    title: string;
    availableBalance: number;
  }>;
  onSuccess: () => void;
}

export const NewPayoutModal: React.FC<NewPayoutModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName = 'Produtor',
  events,
  onSuccess
}) => {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [transferType, setTransferType] = useState<'PIX' | 'TED'>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  if (!isOpen) return null;

  const activeEvent = events.find(e => e.id === selectedEventId);
  const availableBalance = activeEvent ? activeEvent.availableBalance : 0;
  const numAmount = parseFloat(amount) || 0;
  const isExceeding = numAmount > availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (numAmount <= 0) {
      setErrorMessage('Informe um valor de repasse estritamente positivo.');
      return;
    }

    if (isExceeding) {
      setErrorMessage(
        `O valor solicitado (${formatCurrency(numAmount)}) excede o saldo disponível do evento (${formatCurrency(availableBalance)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/payouts/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({
          producerId,
          eventId: selectedEventId,
          amount: numAmount,
          scheduledDate,
          notes: notes ? `${notes} [Modalidade: ${transferType}]` : `[Modalidade: ${transferType}]`
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Falha ao agendar repasse.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de comunicação ao registrar repasse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                SOLICITAR REPASSE BANCÁRIO
              </h2>
              <p className="text-xs text-slate-400">
                {producerName} • Agendamento Operacional
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Event Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Evento de Origem dos Recursos
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900">
                  {ev.title} (Disponível: {formatCurrency(ev.availableBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Available Balance Indicator */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-emerald-400 block">
                Saldo Disponível para Saque
              </span>
              <span className="text-xs text-slate-400">
                Líquido de taxas e repasses anteriores
              </span>
            </div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatCurrency(availableBalance)}
            </div>
          </div>

          {/* Transfer Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Modalidade de Transferência
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferType('PIX')}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  transferType === 'PIX'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>PIX Instantâneo</span>
              </button>
              <button
                type="button"
                onClick={() => setTransferType('TED')}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  transferType === 'TED'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>TED Bancária</span>
              </button>
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valor do Repasse (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className={`w-full rounded-xl border bg-slate-950 py-2 pl-9 pr-3 text-xs text-white font-mono outline-none transition-colors ${
                    isExceeding
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {isExceeding && (
                <span className="text-[10px] text-rose-400 mt-1 block">
                  Valor excede o saldo disponível.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data Prevista de Liquidação
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white font-mono outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Notes / Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Justificativa ou Observações Operacionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fechamento de primeiro lote ou adiantamento conforme cláusula 4.2 do contrato"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* High value warning */}
          {numAmount > 50000 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Alçada Superior Requerida</span>
                <span>Valores acima de R$ 50.000 exigem aprovação da Diretoria Financeira e reautenticação Step-Up.</span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isExceeding || numAmount <= 0}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
