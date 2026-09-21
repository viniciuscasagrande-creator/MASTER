import React, { useState } from 'react';
import { ArrowRightLeft, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { EventBalanceItemUI } from './EventBalancesView';
import { formatCurrency } from '../../shared/utils/formatters';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventBalances: EventBalanceItemUI[];
  producerId: string;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventBalances,
  producerId
}) => {
  const [fromEventId, setFromEventId] = useState('');
  const [toEventId, setToEventId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const originEvent = eventBalances.find(e => e.eventId === fromEventId);
  const targetEvent = eventBalances.find(e => e.eventId === toEventId);
  const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0;
  const isHighValue = amount > 50000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromEventId) {
      setError('Selecione o evento de origem.');
      return;
    }
    if (!toEventId) {
      setError('Selecione o evento de destino.');
      return;
    }
    if (fromEventId === toEventId) {
      setError('O evento de destino deve ser diferente do evento de origem.');
      return;
    }
    if (amount <= 0) {
      setError('Informe um valor de transferência válido maior que zero.');
      return;
    }
    if (originEvent && amount > originEvent.availableBalance) {
      setError(`Saldo insuficiente no evento de origem. Disponível: ${formatCurrency(originEvent.availableBalance)}`);
      return;
    }
    if (!reason.trim()) {
      setError('A justificativa operacional é obrigatória para fins de auditoria contábil.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({
          producerId,
          fromEventId,
          toEventId,
          amount,
          reason
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Falha ao processar transferência.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                TRANSFERÊNCIA ENTRE EVENTOS
              </h2>
              <p className="text-xs text-slate-400">
                Remanejamento de saldo entre eventos do mesmo produtor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Evento de Origem (Débito)
            </label>
            <select
              value={fromEventId}
              onChange={(e) => setFromEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Selecione o evento de origem...</option>
              {eventBalances.map(ev => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.eventTitle} — Saldo Disp: {formatCurrency(ev.availableBalance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Evento de Destino (Crédito)
            </label>
            <select
              value={toEventId}
              onChange={(e) => setToEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Selecione o evento de destino...</option>
              {eventBalances
                .filter(ev => ev.eventId !== fromEventId)
                .map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventTitle} — Saldo Atual: {formatCurrency(ev.availableBalance)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Valor da Transferência (R$)
            </label>
            <input
              type="text"
              placeholder="Ex: 500,00 ou 10000,00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            {originEvent && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Disponível para remanejamento: <strong className="text-emerald-400">{formatCurrency(originEvent.availableBalance)}</strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo / Justificativa Operacional (Obrigatório)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Cobertura de adiantamento de fornecedor de som do evento destino..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isHighValue && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Atenção (Alçada de Segurança):</strong> Para valores superiores a R$ 50.000,00, a transferência entrará em status <strong>PENDENTE DE APROVAÇÃO</strong> (Maker-Checker com Step-Up de Diretoria) antes de efetivar o débito.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              disabled={isSubmitting}
              icon={<ArrowRightLeft className="h-4 w-4" />}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
