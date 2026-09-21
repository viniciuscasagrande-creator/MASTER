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
import { Badge } from '../../shared/components/Badge';
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              TESOURARIA, FLUXO DE CAIXA & DRE GERENCIAL
            </h2>
            <Badge variant="purple" size="sm">
              Visão Gerencial Factual
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Projeção e realização do fluxo financeiro, resultado operacional por evento e contas bancárias homologadas para liquidação de repasses.
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
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('cash_flow')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'cash_flow'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Fluxo de Caixa (Realizado vs Projetado)
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'dre'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          DRE Gerencial por Evento
        </button>

        <button
          onClick={() => setActiveTab('bank_accounts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'bank_accounts'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Contas Bancárias de Tesouraria ({bankAccounts.length})
        </button>
      </div>

      {/* TAB 1: FLUXO DE CAIXA */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Período</th>
                    <th className="px-4 py-3.5 text-right">Entradas Realizadas</th>
                    <th className="px-4 py-3.5 text-right">Saídas Realizadas</th>
                    <th className="px-4 py-3.5 text-right">Líquido Realizado</th>
                    <th className="px-4 py-3.5 text-right">Entradas Projetadas</th>
                    <th className="px-4 py-3.5 text-right">Saídas Projetadas</th>
                    <th className="px-4 py-3.5 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {cashFlow.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        Nenhum registro de fluxo de caixa para o período.
                      </td>
                    </tr>
                  ) : (
                    cashFlow.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">
                          {item.period}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400 text-right">
                          +{formatCurrency(item.realizedInflows)}
                        </td>
                        <td className="px-4 py-3 font-mono text-rose-400 text-right">
                          -{formatCurrency(item.realizedOutflows)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white text-right">
                          {formatCurrency(item.realizedNet)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-right">
                          +{formatCurrency(item.projectedInflows)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-right">
                          -{formatCurrency(item.projectedOutflows)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">
                          {formatCurrency(item.finalBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRE GERENCIAL */}
      {activeTab === 'dre' && (
        <div className="max-w-4xl rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Demonstrativo de Resultado Operacional (DRE)
              </h3>
              <p className="text-xs text-slate-400">
                Competência: {dre?.period || 'Setembro 2026'}
              </p>
            </div>
            <Badge variant="emerald" size="sm">Consolidado Factual</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-white">(+) RECEITA BRUTA DE INGRESSOS</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(dre?.grossTicketRevenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-slate-400">
              <span>(-) Taxas de Serviço da Plataforma Disk</span>
              <span className="font-mono text-rose-400">
                -{formatCurrency(dre?.ticketingServiceFees || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 font-semibold text-white">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-white text-sm">
                {formatCurrency(dre?.netTicketRevenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-slate-400">
              <span>(-) Custos Diretos de Produção (Som, Luz, Brigada, Infraestrutura)</span>
              <span className="font-mono text-rose-400">
                -{formatCurrency(dre?.productionDirectCosts || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-slate-400">
              <span>(-) Investimentos em Marketing, Tráfego & Mídia</span>
              <span className="font-mono text-rose-400">
                -{formatCurrency(dre?.marketingCosts || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 font-bold text-purple-300">
              <span>(=) MARGEM DE CONTRIBUIÇÃO OPERACIONAL</span>
              <span className="font-mono text-sm">
                {formatCurrency(dre?.operationalContributionMargin || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-slate-400">
              <span>(-) Impostos, ISS e Retenções Tributárias</span>
              <span className="font-mono text-rose-400">
                -{formatCurrency(dre?.taxesAndRetentions || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 font-bold text-white text-sm">
              <span className="text-emerald-400 uppercase tracking-wide">(=) RESULTADO OPERACIONAL LÍQUIDO</span>
              <span className="font-mono text-base text-emerald-400">
                {formatCurrency(dre?.netOperationalResult || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAS BANCÁRIAS */}
      {activeTab === 'bank_accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{acc.bankName}</h4>
                    <span className="text-[11px] text-slate-500">Código Compe: {acc.bankCode}</span>
                  </div>
                </div>
                {acc.isDefault && (
                  <Badge variant="emerald" size="sm">Conta Principal</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Agência</span>
                  <span className="font-mono font-medium text-white">{acc.agency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Conta Corrente</span>
                  <span className="font-mono font-medium text-white">{acc.account}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block">Chave PIX ({acc.pixKeyType})</span>
                  <span className="font-mono text-emerald-400 select-all font-medium">{acc.pixKey}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <strong className="text-emerald-400">Homologada</strong></span>
                <span>Tipo: {acc.accountType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
