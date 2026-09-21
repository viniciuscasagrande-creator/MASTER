import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  FileCheck,
  Building,
  X
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
import { EventBalanceItemUI } from './EventBalancesView';

export interface ReceivableRecordUI {
  id: string;
  receivableNumber: string;
  producerId: string;
  eventId: string;
  eventTitle: string;
  origin: 'CARTAO_CREDITO' | 'BOLETO' | 'PIX' | 'PDV_CONSIGNADO';
  acquirer: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  dueDate: string;
  status: 'A_RECEBER' | 'RECEBIDO' | 'ANTECIPADO' | 'ATRASADO';
  orderId?: string;
}

export interface PayableRecordUI {
  id: string;
  payableNumber: string;
  producerId: string;
  eventId?: string;
  eventTitle?: string;
  beneficiary: string;
  category: string;
  costCenter: string;
  amount: number;
  dueDate: string;
  status: 'A_PAGAR' | 'EM_APROVACAO' | 'PAGO' | 'CANCELADO';
  paidAt?: string;
  paymentMethod: string;
  notes?: string;
}

interface ReceivablesPayablesViewProps {
  producerId: string;
  eventBalances: EventBalanceItemUI[];
  onRefreshBalances?: () => void;
}

export const ReceivablesPayablesView: React.FC<ReceivablesPayablesViewProps> = ({
  producerId,
  eventBalances,
  onRefreshBalances
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receivables' | 'payables'>('payables');
  const [receivables, setReceivables] = useState<ReceivableRecordUI[]>([]);
  const [payables, setPayables] = useState<PayableRecordUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Payable Modal
  const [isNewPayableOpen, setIsNewPayableOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState('');
  const [category, setCategory] = useState('Infraestrutura');
  const [costCenter, setCostCenter] = useState('Produção Técnica');
  const [payableAmount, setPayableAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BOLETO');
  const [notes, setNotes] = useState('');
  const [payableError, setPayableError] = useState('');
  const [isSubmittingPayable, setIsSubmittingPayable] = useState(false);

  // Pay Modal
  const [payingPayable, setPayingPayable] = useState<PayableRecordUI | null>(null);
  const [bankAuth, setBankAuth] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const [resRec, resPay] = await Promise.all([
        fetch(`/api/finance/receivables?producerId=${producerId}`, {
          headers: { 'x-producer-id': producerId }
        }),
        fetch(`/api/finance/payables?producerId=${producerId}`, {
          headers: { 'x-producer-id': producerId }
        })
      ]);

      if (resRec.ok) {
        const json = await resRec.json();
        setReceivables(json.data || []);
      }
      if (resPay.ok) {
        const json = await resPay.json();
        setPayables(json.data || []);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Falha ao carregar registros.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [producerId]);

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayableError('');

    const parsedAmount = parseFloat(payableAmount.replace(/\./g, '').replace(',', '.')) || 0;
    if (!beneficiary.trim()) {
      setPayableError('Informe o fornecedor ou beneficiário.');
      return;
    }
    if (parsedAmount <= 0) {
      setPayableError('Informe um valor válido.');
      return;
    }
    if (!dueDate) {
      setPayableError('Informe a data de vencimento.');
      return;
    }

    setIsSubmittingPayable(true);
    try {
      const res = await fetch('/api/finance/payables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({
          producerId,
          eventId: selectedEventId || undefined,
          beneficiary,
          category,
          costCenter,
          amount: parsedAmount,
          dueDate,
          paymentMethod,
          notes
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Falha ao criar conta a pagar.');

      setNotification({ type: 'success', message: 'Conta a pagar provisionada com sucesso.' });
      setIsNewPayableOpen(false);
      setBeneficiary('');
      setPayableAmount('');
      setDueDate('');
      setNotes('');
      loadData();
      onRefreshBalances?.();
    } catch (err: any) {
      setPayableError(err.message || 'Erro ao salvar conta a pagar.');
    } finally {
      setIsSubmittingPayable(false);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayable) return;

    setIsPaying(true);
    try {
      const res = await fetch(`/api/finance/payables/${payingPayable.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-producer-id': producerId
        },
        body: JSON.stringify({
          bankAuth: bankAuth || `AUTH-${Date.now()}`
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Falha ao baixar conta a pagar.');

      setNotification({ type: 'success', message: `Conta ${payingPayable.payableNumber} liquidada com sucesso.` });
      setPayingPayable(null);
      setBankAuth('');
      loadData();
      onRefreshBalances?.();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Erro ao processar baixa.' });
    } finally {
      setIsPaying(false);
    }
  };

  // KPIs
  const totalReceivables = receivables.reduce((acc, curr) => acc + curr.netAmount, 0);
  const totalPayablesPending = payables
    .filter(p => p.status === 'A_PAGAR' || p.status === 'EM_APROVACAO')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalPayablesPaid = payables
    .filter(p => p.status === 'PAGO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              GESTÃO DE CONTAS A PAGAR & RECEBER
            </h2>
            <Badge variant="cyan" size="sm">
              Competência & Caixa
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Provisões de custos operacionais de produção, cachês, fornecedores técnicos e conciliação de recebíveis de bilheteria e canais de venda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          {activeSubTab === 'payables' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNewPayableOpen(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Nova Conta a Pagar
            </Button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total a Pagar Aberto</span>
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {formatCurrency(totalPayablesPending)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Provisões de fornecedores pendentes</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Contas Baixadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {formatCurrency(totalPayablesPaid)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Liquidado com comprovante bancário</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recebíveis Previstos</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {formatCurrency(totalReceivables)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Crédito, Boleto e PDV em processamento</span>
        </div>
      </div>

      {/* Sub-Tabs: Contas a Pagar vs Contas a Receber */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('payables')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'payables'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Contas a Pagar ({payables.length})
        </button>

        <button
          onClick={() => setActiveSubTab('receivables')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'receivables'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Contas a Receber ({receivables.length})
        </button>
      </div>

      {/* CONTAS A PAGAR */}
      {activeSubTab === 'payables' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5">Fornecedor / Favorecido</th>
                  <th className="px-4 py-3.5">Categoria / C. Custo</th>
                  <th className="px-4 py-3.5">Evento Vinculado</th>
                  <th className="px-4 py-3.5">Valor (R$)</th>
                  <th className="px-4 py-3.5">Vencimento</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma conta a pagar registrada.
                    </td>
                  </tr>
                ) : (
                  payables.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {p.payableNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white block">{p.beneficiary}</span>
                        {p.notes && <span className="text-[10px] text-slate-500 truncate block max-w-xs">{p.notes}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white block">{p.category}</span>
                        <span className="text-[10px] text-slate-500">{p.costCenter}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {p.eventTitle || 'Geral / Produtor'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(p.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'PAGO' ? (
                          <Badge variant="emerald" size="sm">Pago</Badge>
                        ) : p.status === 'EM_APROVACAO' ? (
                          <Badge variant="orange" size="sm">Em Aprovação</Badge>
                        ) : (
                          <Badge variant="rose" size="sm">A Pagar</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status !== 'PAGO' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setPayingPayable(p)}
                            icon={<FileCheck className="h-3 w-3" />}
                          >
                            Baixar
                          </Button>
                        )}
                        {p.status === 'PAGO' && (
                          <span className="text-[10px] text-emerald-400 font-mono">Liquidado</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTAS A RECEBER */}
      {activeSubTab === 'receivables' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5">Origem / Canal</th>
                  <th className="px-4 py-3.5">Adquirente</th>
                  <th className="px-4 py-3.5">Evento Vinculado</th>
                  <th className="px-4 py-3.5">Valor Bruto</th>
                  <th className="px-4 py-3.5">Taxas</th>
                  <th className="px-4 py-3.5">Valor Líquido</th>
                  <th className="px-4 py-3.5">Vencimento</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {receivables.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      Nenhum recebível registrado.
                    </td>
                  </tr>
                ) : (
                  receivables.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {r.receivableNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white block">{r.origin}</span>
                        {r.orderId && <span className="text-[10px] text-slate-500">Ped: {r.orderId}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {r.acquirer}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {r.eventTitle}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {formatCurrency(r.grossAmount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400">
                        -{formatCurrency(r.feeAmount)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(r.netAmount)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(r.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'RECEBIDO' ? (
                          <Badge variant="emerald" size="sm">Recebido</Badge>
                        ) : r.status === 'ANTECIPADO' ? (
                          <Badge variant="purple" size="sm">Antecipado</Badge>
                        ) : (
                          <Badge variant="cyan" size="sm">A Receber</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova Conta a Pagar */}
      {isNewPayableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nova Provisão a Pagar</h3>
                  <p className="text-xs text-slate-400">Cadastrar obrigação financeira de evento ou produção</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPayableOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {payableError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payableError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePayable} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fornecedor / Beneficiário *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empresa de Iluminação Master Ltda"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Artístico & Cachê">Artístico & Cachê</option>
                    <option value="Marketing & Tráfego">Marketing & Tráfego</option>
                    <option value="Limpeza & Apoio">Limpeza & Apoio</option>
                    <option value="Locação de Espaço">Locação de Espaço</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Centro de Custo
                  </label>
                  <input
                    type="text"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vincular ao Evento (Opcional)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="">Geral do Produtor (Sem evento específico)</option>
                  {eventBalances.map(ev => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.eventTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5000,00"
                    value={payableAmount}
                    onChange={(e) => setPayableAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="TED">TED Bancária</option>
                    <option value="CARTAO">Cartão Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Contrato nº 2026/04"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewPayableOpen(false)}
                  disabled={isSubmittingPayable}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingPayable}
                  icon={<Plus className="h-4 w-4" />}
                >
                  {isSubmittingPayable ? 'Salvando...' : 'Cadastrar Obrigação'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baixar Pagamento */}
      {payingPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Baixa de Pagamento</h3>
                  <p className="text-xs text-slate-400 font-mono">{payingPayable.payableNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setPayingPayable(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Favorecido:</span>
                  <span className="text-white font-medium">{payingPayable.beneficiary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(payingPayable.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma:</span>
                  <span className="text-emerald-400 font-medium">{payingPayable.paymentMethod}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Autenticação Bancária / ID PIX
                </label>
                <input
                  type="text"
                  placeholder="Ex: ITAU-AUTH-984214 ou E2E-PIX-..."
                  value={bankAuth}
                  onChange={(e) => setBankAuth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayingPayable(null)}
                  disabled={isPaying}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPaying}
                  icon={<FileCheck className="h-4 w-4" />}
                >
                  {isPaying ? 'Liquidando...' : 'Confirmar Baixa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
