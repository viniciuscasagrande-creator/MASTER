import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Building,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useCoreData } from '../../../core/context/CoreDataContext';

export interface AdvanceOperationItem {
  id: string;
  code: string;
  eventId: string;
  eventTitle: string;
  producerName: string;
  requestedCents: number;
  advanceRateBps: number;
  costCents: number;
  netTransferredCents: number;
  status: 'solicitada' | 'aprovada' | 'transferida' | 'liquidada' | 'rejeitada';
  eligibleBalanceCents: number;
  requestedBy: string;
  requestedAt: string;
  notes?: string;
}

const DEFAULT_ADVANCES: AdvanceOperationItem[] = [
  {
    id: 'adv-1',
    code: 'ADV-EVT-101-839211',
    eventId: 'evt-1',
    eventTitle: 'Festival de Inverno Curitiba 2026',
    producerName: 'Seven Entretenimento',
    requestedCents: 15000000, // R$ 150.000,00
    advanceRateBps: 250, // 2.5%
    costCents: 375000, // R$ 3.750,00
    netTransferredCents: 14625000, // R$ 146.250,00
    status: 'transferida',
    eligibleBalanceCents: 28500000,
    requestedBy: 'Carlos Eduardo Seven',
    requestedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    notes: 'Antecipação para quitação de fornecedores de cenografia e sonorização.'
  },
  {
    id: 'adv-2',
    code: 'ADV-EVT-103-918233',
    eventId: 'evt-3',
    eventTitle: 'Sunset Eletrônico Warung Tour',
    producerName: 'CWB Brasil Produções',
    requestedCents: 5000000, // R$ 50.000,00
    advanceRateBps: 250, // 2.5%
    costCents: 125000, // R$ 1.250,00
    netTransferredCents: 4875000, // R$ 48.750,00
    status: 'solicitada',
    eligibleBalanceCents: 12000000,
    requestedBy: 'Mariana Guimarães',
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Adiantamento de cachê internacional de atração principal.'
  }
];

export const CommercialAdvancesPage: React.FC = () => {
  const { events } = useCoreData();
  const [advances, setAdvances] = useState<AdvanceOperationItem[]>(DEFAULT_ADVANCES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [requestedValue, setRequestedValue] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalRequested = advances.reduce((sum, a) => sum + a.requestedCents, 0);
  const totalTransferred = advances
    .filter(a => a.status === 'transferida' || a.status === 'liquidada')
    .reduce((sum, a) => sum + a.netTransferredCents, 0);
  const totalCost = advances.reduce((sum, a) => sum + a.costCents, 0);

  const handleApprove = (id: string) => {
    setAdvances(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'aprovada' as const } : a))
    );
    setFeedback({ type: 'success', text: 'Operação de antecipação aprovada com sucesso para transferência bancária!' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(requestedValue) * 100);
    if (!selectedEventId || isNaN(cents) || cents <= 0) {
      setFeedback({ type: 'error', text: 'Informe um evento e valor válido para a antecipação.' });
      return;
    }

    const event = events.find(ev => ev.id === selectedEventId);
    const cost = Math.round(cents * 0.025);
    const net = cents - cost;

    const newAdv: AdvanceOperationItem = {
      id: `adv-${Date.now()}`,
      code: `ADV-${(event as any)?.code || 'EVT'}-${Date.now().toString().slice(-6)}`,
      eventId: selectedEventId,
      eventTitle: event?.name || event?.title || 'Evento',
      producerName: 'Produtora Solicitante',
      requestedCents: cents,
      advanceRateBps: 250,
      costCents: cost,
      netTransferredCents: net,
      status: 'solicitada',
      eligibleBalanceCents: cents * 1.5,
      requestedBy: 'Operador Comercial',
      requestedAt: new Date().toISOString(),
      notes: advanceNotes
    };

    setAdvances([newAdv, ...advances]);
    setIsModalOpen(false);
    setSelectedEventId('');
    setRequestedValue('');
    setAdvanceNotes('');
    setFeedback({ type: 'success', text: `Solicitação ${newAdv.code} criada com sucesso e aguardando conferência!` });
    setTimeout(() => setFeedback(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'transferida':
        return <Badge variant="emerald" size="sm">Transferida</Badge>;
      case 'aprovada':
        return <Badge variant="cyan" size="sm">Aprovada</Badge>;
      case 'solicitada':
        return <Badge variant="amber" size="sm">Solicitada</Badge>;
      case 'liquidada':
        return <Badge variant="slate" size="sm">Liquidada</Badge>;
      case 'rejeitada':
        return <Badge variant="rose" size="sm">Rejeitada</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              ANTECIPAÇÕES FINANCEIRAS (ADVANCED)
            </h1>
            <Badge variant="orange" size="sm">
              Operações de Crédito Comercial
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Antecipação de repasses baseada no saldo elegível de vendas realizadas e pagas
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Nova Antecipação
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Solicitado
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalRequested / 100)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Operações solicitadas no período</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Líquido Transferido
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalTransferred / 100)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Recursos efetivamente liberados</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Receita Financeira Retida (Taxa)
          </span>
          <div className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400">
            {formatCurrency(totalCost / 100)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Taxa de antecipação Disk</p>
        </div>
      </div>

      {/* Advances Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando <strong className="text-slate-900 dark:text-white font-mono">{advances.length}</strong> operação(ões) de antecipação
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Operação / Código</th>
                <th className="py-3 px-4">Evento & Produtor</th>
                <th className="py-3 px-4">Valor Solicitado</th>
                <th className="py-3 px-4">Taxa / Custo</th>
                <th className="py-3 px-4">Valor Líquido</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {advances.map((adv) => (
                <tr key={adv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <strong className="text-orange-600 font-mono">{adv.code}</strong>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">{adv.eventTitle}</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{adv.producerName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(adv.requestedCents / 100)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-orange-600 dark:text-orange-400 font-mono">{(adv.advanceRateBps / 100).toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">({formatCurrency(adv.costCents / 100)})</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(adv.netTransferredCents / 100)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(adv.status)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {formatDateTime(adv.requestedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {adv.status === 'solicitada' && (
                      <Button size="sm" variant="primary" onClick={() => handleApprove(adv.id)}>
                        Aprovar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Solicitar Antecipação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="bg-slate-50/80 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nova Solicitação de Antecipação</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Selecione o Evento:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none focus:bg-white"
                >
                  <option value="">Selecione...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name || ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Valor Solicitado (R$):
                </label>
                <input
                  type="number"
                  step="100"
                  min="1000"
                  placeholder="Ex: 50000"
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none focus:bg-white"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Taxa padrão de antecipação: 2,5% sobre o montante solicitado.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações / Justificativa:
                </label>
                <textarea
                  rows={2}
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="Informe a destinação dos recursos (opcional)..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Submeter Solicitação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
