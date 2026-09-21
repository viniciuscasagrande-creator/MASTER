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
  Receipt,
  X
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
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
  const [activeSubTab, setActiveSubTab] = useState<'payables' | 'receivables'>('payables');
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
        const jsonRec = await resRec.json();
        setReceivables(jsonRec.data || []);
      }

      if (resPay.ok) {
        const jsonPay = await resPay.json();
        setPayables(jsonPay.data || []);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Erro ao carregar contas a pagar/receber.' });
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
    const parsedAmount = parseFloat(payableAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPayableError('Informe um valor monetário válido maior que zero.');
      return;
    }
    if (!dueDate) {
      setPayableError('Selecione a data de vencimento.');
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

  const filteredPayables = payables.filter(p => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.payableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.eventTitle && p.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch =
      !searchTerm.trim() ||
      r.receivableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.acquirer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.eventTitle && r.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const payableColumns: Column<PayableRecordUI>[] = [
    {
      header: 'Código',
      width: '120px',
      accessor: (p) => <span className="font-mono font-bold text-slate-900">{p.payableNumber}</span>
    },
    {
      header: 'Fornecedor / Beneficiário',
      accessor: (p) => (
        <div>
          <span className="font-semibold text-slate-800 block">{p.beneficiary}</span>
          {p.notes && <span className="text-[11px] text-slate-500 truncate block max-w-xs">{p.notes}</span>}
        </div>
      )
    },
    {
      header: 'Categoria & C. Custo',
      accessor: (p) => (
        <div>
          <span className="font-medium text-slate-700 block">{p.category}</span>
          <span className="text-[10px] text-slate-500">{p.costCenter}</span>
        </div>
      )
    },
    {
      header: 'Evento Vinculado',
      accessor: (p) => (
        <span className="text-slate-600 font-medium">
          {p.eventTitle || 'Geral do Produtor'}
        </span>
      )
    },
    {
      header: 'Valor',
      align: 'right',
      width: '140px',
      accessor: (p) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(p.amount)}
        </span>
      )
    },
    {
      header: 'Vencimento',
      width: '120px',
      accessor: (p) => (
        <span className="font-mono text-slate-600 font-medium">
          {formatDate(p.dueDate)}
        </span>
      )
    },
    {
      header: 'Status',
      width: '130px',
      accessor: (p) => {
        if (p.status === 'PAGO') return <StatusBadge variant="success" label="Pago" />;
        if (p.status === 'EM_APROVACAO') return <StatusBadge variant="warning" label="Em Aprovação" />;
        return <StatusBadge variant="danger" label="A Pagar" />;
      }
    },
    {
      header: 'Ação',
      align: 'right',
      width: '120px',
      accessor: (p) => (
        p.status !== 'PAGO' ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setPayingPayable(p)}
            icon={<FileCheck className="h-3 w-3" />}
          >
            Baixar
          </Button>
        ) : (
          <span className="text-xs text-emerald-600 font-medium">Liquidado</span>
        )
      )
    }
  ];

  const receivableColumns: Column<ReceivableRecordUI>[] = [
    {
      header: 'Código',
      width: '120px',
      accessor: (r) => <span className="font-mono font-bold text-slate-900">{r.receivableNumber}</span>
    },
    {
      header: 'Origem / Canal',
      accessor: (r) => (
        <div>
          <span className="font-semibold text-slate-800 block">{r.origin}</span>
          {r.orderId && <span className="text-[10px] text-slate-500 font-mono">Ped: {r.orderId}</span>}
        </div>
      )
    },
    {
      header: 'Adquirente',
      accessor: (r) => <span className="font-medium text-slate-700">{r.acquirer}</span>
    },
    {
      header: 'Evento Vinculado',
      accessor: (r) => <span className="font-medium text-slate-800">{r.eventTitle}</span>
    },
    {
      header: 'Valor Bruto',
      align: 'right',
      accessor: (r) => <span className="font-mono text-slate-500">{formatCurrency(r.grossAmount)}</span>
    },
    {
      header: 'Taxas',
      align: 'right',
      accessor: (r) => <span className="font-mono text-rose-600">-{formatCurrency(r.feeAmount)}</span>
    },
    {
      header: 'Valor Líquido',
      align: 'right',
      accessor: (r) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(r.netAmount)}</span>
    },
    {
      header: 'Vencimento',
      width: '120px',
      accessor: (r) => <span className="font-mono text-slate-600 font-medium">{formatDate(r.dueDate)}</span>
    },
    {
      header: 'Status',
      align: 'right',
      width: '130px',
      accessor: (r) => {
        if (r.status === 'RECEBIDO') return <StatusBadge variant="success" label="Recebido" />;
        if (r.status === 'ANTECIPADO') return <StatusBadge variant="purple" label="Antecipado" />;
        return <StatusBadge variant="info" label="A Receber" />;
      }
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Notification Toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards Row (120-140px Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL A PAGAR ABERTO"
          value={formatCurrency(totalPayablesPending)}
          subtitle="Provisões de fornecedores pendentes"
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
          badge="A Pagar"
          badgeVariant="rose"
        />

        <MetricCard
          title="TOTAL CONTAS BAIXADAS"
          value={formatCurrency(totalPayablesPaid)}
          trend={{ value: 'Liquidado com comprovante', isPositive: true }}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          badge="Pago"
          badgeVariant="emerald"
        />

        <MetricCard
          title="RECEBÍVEIS PREVISTOS"
          value={formatCurrency(totalReceivables)}
          subtitle="Crédito, Boleto e PIX sob liquidação"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          badge="A Receber"
          badgeVariant="cyan"
        />

        <MetricCard
          title="TOTAL DE OBRIGAÇÕES"
          value={payables.length + receivables.length}
          subtitle="Títulos ativos em carteira"
          icon={<Receipt className="h-4 w-4 text-slate-700" />}
          badge="Carteira"
          badgeVariant="slate"
        />
      </div>

      {/* Sub-Tabs: Contas a Pagar vs Contas a Receber */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('payables')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'payables'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Contas a Pagar ({payables.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('receivables')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'receivables'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Contas a Receber ({receivables.length})
        </button>
      </div>

      {/* FilterBar Toolbar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={activeSubTab === 'payables' ? 'Buscar fornecedor, código, categoria...' : 'Buscar adquirente, código, origem...'}
        selects={[
          {
            id: 'status-filter',
            value: statusFilter,
            onChange: setStatusFilter,
            options: activeSubTab === 'payables'
              ? [
                  { label: 'Todos os Status', value: 'ALL' },
                  { label: 'A Pagar', value: 'A_PAGAR' },
                  { label: 'Em Aprovação', value: 'EM_APROVACAO' },
                  { label: 'Pago', value: 'PAGO' }
                ]
              : [
                  { label: 'Todos os Status', value: 'ALL' },
                  { label: 'A Receber', value: 'A_RECEBER' },
                  { label: 'Recebido', value: 'RECEBIDO' },
                  { label: 'Antecipado', value: 'ANTECIPADO' }
                ]
          }
        ]}
        hasActiveFilters={statusFilter !== 'ALL' || Boolean(searchTerm)}
        onClearFilters={() => {
          setStatusFilter('ALL');
          setSearchTerm('');
        }}
        actions={
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
        }
      />

      {/* Tables depending on SubTab */}
      {activeSubTab === 'payables' ? (
        <DataTable
          columns={payableColumns}
          data={filteredPayables}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyMessage="Nenhuma conta a pagar encontrada para os filtros selecionados."
          emptyIcon={<TrendingDown className="h-8 w-8 text-slate-300" />}
        />
      ) : (
        <DataTable
          columns={receivableColumns}
          data={filteredReceivables}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="Nenhum recebível encontrado para os filtros selecionados."
          emptyIcon={<TrendingUp className="h-8 w-8 text-slate-300" />}
        />
      )}

      {/* Modal Nova Conta a Pagar */}
      {isNewPayableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Nova Provisão a Pagar</h3>
                  <p className="text-xs text-slate-500">Cadastrar obrigação financeira de evento ou produção</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPayableOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {payableError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payableError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePayable} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fornecedor / Beneficiário *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empresa de Iluminação Master Ltda"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Centro de Custo
                  </label>
                  <input
                    type="text"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vincular ao Evento (Opcional)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5000,00"
                    value={payableAmount}
                    onChange={(e) => setPayableAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="TED">TED Bancária</option>
                    <option value="CARTAO">Cartão Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Contrato nº 2026/04"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Baixa de Pagamento</h3>
                  <p className="text-xs text-slate-500 font-mono">{payingPayable.payableNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingPayable(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Favorecido:</span>
                  <span className="text-slate-900 font-semibold">{payingPayable.beneficiary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(payingPayable.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma:</span>
                  <span className="text-emerald-700 font-medium">{payingPayable.paymentMethod}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Autenticação Bancária / ID PIX
                </label>
                <input
                  type="text"
                  placeholder="Ex: ITAU-AUTH-984214 ou E2E-PIX-..."
                  value={bankAuth}
                  onChange={(e) => setBankAuth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
