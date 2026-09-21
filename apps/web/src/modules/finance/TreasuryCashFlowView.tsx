import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  DollarSign,
  PieChart,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { DataTable, Column } from '../../shared/components/DataTable';
import { SectionCard } from '../../shared/components/SectionCard';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';

export interface TreasuryBankAccountUI {
  id: string;
  producerId: string;
  bankCode: string;
  bankName: string;
  agency: string;
  account: string;
  accountType: 'CORRENTE' | 'POUPANCA';
  pixKey: string;
  pixKeyType: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CashFlowItemUI {
  period: string;
  realizedInflows: number;
  realizedOutflows: number;
  realizedNet: number;
  projectedInflows: number;
  projectedOutflows: number;
  projectedNet: number;
  finalBalance: number;
}

export interface ManagementDREUI {
  producerId: string;
  eventId?: string;
  period: string;
  grossTicketRevenue: number;
  ticketingServiceFees: number;
  netTicketRevenue: number;
  productionDirectCosts: number;
  marketingCosts: number;
  operationalContributionMargin: number;
  taxesAndRetentions: number;
  netOperationalResult: number;
}

interface TreasuryCashFlowViewProps {
  producerId: string;
  eventId?: string;
}

export const TreasuryCashFlowView: React.FC<TreasuryCashFlowViewProps> = ({
  producerId,
  eventId
}) => {
  const [activeTab, setActiveTab] = useState<'cash_flow' | 'dre' | 'bank_accounts'>('cash_flow');
  const [cashFlow, setCashFlow] = useState<CashFlowItemUI[]>([]);
  const [dre, setDre] = useState<ManagementDREUI | null>(null);
  const [bankAccounts, setBankAccounts] = useState<TreasuryBankAccountUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const queryParams = new URLSearchParams({
        producerId,
        ...(eventId ? { eventId } : {})
      });

      const [resFlow, resDre, resBanks] = await Promise.all([
        fetch(`/api/finance/cash-flow?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch(`/api/finance/management-dre?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch(`/api/finance/bank-accounts?producerId=${producerId}`, { headers: { 'x-producer-id': producerId } })
      ]);

      if (resFlow.ok) {
        const json = await resFlow.json();
        setCashFlow(json.data || []);
      }
      if (resDre.ok) {
        const json = await resDre.json();
        setDre(json.data || null);
      }
      if (resBanks.ok) {
        const json = await resBanks.json();
        setBankAccounts(json.data || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao carregar dados de tesouraria.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [producerId, eventId]);

  const flowColumns: Column<CashFlowItemUI>[] = [
    {
      header: 'Período',
      accessor: (item) => <span className="font-semibold text-slate-900">{item.period}</span>
    },
    {
      header: 'Entradas Realizadas',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono text-emerald-600 font-medium">
          +{formatCurrency(item.realizedInflows)}
        </span>
      )
    },
    {
      header: 'Saídas Realizadas',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono text-rose-600 font-medium">
          -{formatCurrency(item.realizedOutflows)}
        </span>
      )
    },
    {
      header: 'Líquido Realizado',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(item.realizedNet)}
        </span>
      )
    },
    {
      header: 'Entradas Projetadas',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono text-slate-500">
          +{formatCurrency(item.projectedInflows)}
        </span>
      )
    },
    {
      header: 'Saídas Projetadas',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono text-slate-500">
          -{formatCurrency(item.projectedOutflows)}
        </span>
      )
    },
    {
      header: 'Saldo Final Projetado',
      align: 'right',
      accessor: (item) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(item.finalBalance)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sub-Tabs: Cash Flow / DRE / Bank Accounts */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cash_flow')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'cash_flow'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Fluxo de Caixa (Realizado vs Projetado)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dre')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'dre'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            DRE Gerencial por Evento
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank_accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'bank_accounts'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Contas Bancárias de Tesouraria ({bankAccounts.length})
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Atualizar
        </Button>
      </div>

      {/* TAB 1: FLUXO DE CAIXA */}
      {activeTab === 'cash_flow' && (
        <DataTable
          columns={flowColumns}
          data={cashFlow}
          keyExtractor={(item, idx) => `${item.period}-${idx}`}
          isLoading={isLoading}
          emptyMessage="Nenhum registro de fluxo de caixa para o período."
          emptyIcon={<FileSpreadsheet className="h-8 w-8 text-slate-300" />}
        />
      )}

      {/* TAB 2: DRE GERENCIAL */}
      {activeTab === 'dre' && (
        <SectionCard
          title="DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE GERENCIAL)"
          description={`Competência: ${dre?.period || 'Setembro/2026'}`}
          badge={<StatusBadge variant="success" label="Auditado" />}
          className="max-w-4xl"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900">(+) RECEITA BRUTA DE INGRESSOS</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {formatCurrency(dre?.grossTicketRevenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Taxas de Serviço da Plataforma</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(dre?.ticketingServiceFees || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 font-bold text-slate-900">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-slate-900 text-sm">
                {formatCurrency(dre?.netTicketRevenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Custos Diretos de Produção (Som, Luz, Brigada, Infraestrutura)</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(dre?.productionDirectCosts || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Investimentos em Marketing, Tráfego & Mídia</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(dre?.marketingCosts || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50 border border-purple-200 font-bold text-purple-900">
              <span>(=) MARGEM DE CONTRIBUIÇÃO OPERACIONAL</span>
              <span className="font-mono text-sm">
                {formatCurrency(dre?.operationalContributionMargin || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Impostos, ISS e Retenções Tributárias</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(dre?.taxesAndRetentions || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-900 text-sm">
              <span className="uppercase tracking-wide">(=) RESULTADO OPERACIONAL LÍQUIDO</span>
              <span className="font-mono text-base text-emerald-700">
                {formatCurrency(dre?.netOperationalResult || 0)}
              </span>
            </div>
          </div>
        </SectionCard>
      )}

      {/* TAB 3: CONTAS BANCÁRIAS */}
      {activeTab === 'bank_accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{acc.bankName}</h4>
                    <span className="text-[11px] text-slate-500">Código Compe: {acc.bankCode}</span>
                  </div>
                </div>
                {acc.isDefault && (
                  <StatusBadge variant="success" label="Conta Principal" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Agência</span>
                  <span className="font-mono font-bold text-slate-900">{acc.agency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Conta Corrente</span>
                  <span className="font-mono font-bold text-slate-900">{acc.account}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block">Chave PIX ({acc.pixKeyType})</span>
                  <span className="font-mono text-emerald-700 select-all font-semibold">{acc.pixKey}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Status: <strong className="text-emerald-700 font-semibold">Homologada</strong></span>
                <span>Tipo: {acc.accountType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
