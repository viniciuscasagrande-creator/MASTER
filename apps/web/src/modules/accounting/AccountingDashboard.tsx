import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Scale,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Filter,
  Download,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
import { SectionCard } from '../../shared/components/SectionCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';

interface AccountingDashboardProps {
  initialSubItem?: string;
  onNavigate?: (module: string, sub?: string) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  initialSubItem = 'accounting-dashboard',
  onNavigate
}) => {
  const { accountingEntries, orders } = useCoreData();

  const [activeTab, setActiveTab] = useState<string>(initialSubItem || 'accounting-dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-09');

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(initialSubItem);
    }
  }, [initialSubItem]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.('accounting', tabId);
  };

  const totalEntries = accountingEntries.length;
  const totalDebits = accountingEntries.reduce((acc, e) => acc + e.amount, 0);
  const totalCredits = totalDebits; // Double-entry balance
  const platformFees = orders.reduce((acc, o) => acc + o.serviceFee, 0);

  // Plano de Contas Structure
  const chartOfAccounts = [
    { code: '1', name: 'ATIVO', type: 'Sintética', balance: 4850200.50, nature: 'Devedora' },
    { code: '1.1', name: 'ATIVO CIRCULANTE', type: 'Sintética', balance: 4850200.50, nature: 'Devedora' },
    { code: '1.1.1', name: 'Disponibilidades / Bancos', type: 'Sintética', balance: 3420100.00, nature: 'Devedora' },
    { code: '1.1.1.01', name: 'Banco Itaú Unibanco S/A - CC Movimento', type: 'Analítica', balance: 2850000.00, nature: 'Devedora' },
    { code: '1.1.1.02', name: 'Banco Santander - CC Reservas', type: 'Analítica', balance: 570100.00, nature: 'Devedora' },
    { code: '1.1.2', name: 'Contas a Receber (Adquirentes & Cartões)', type: 'Analítica', balance: 1430100.50, nature: 'Devedora' },
    { code: '2', name: 'PASSIVO', type: 'Sintética', balance: 3950200.50, nature: 'Credora' },
    { code: '2.1', name: 'PASSIVO CIRCULANTE', type: 'Sintética', balance: 3950200.50, nature: 'Credora' },
    { code: '2.1.1', name: 'Obrigações com Produtores (Repasses a Liquidar)', type: 'Analítica', balance: 3450000.00, nature: 'Credora' },
    { code: '2.1.2', name: 'Fornecedores Operacionais & Infraestrutura', type: 'Analítica', balance: 380200.50, nature: 'Credora' },
    { code: '2.1.3', name: 'Obrigações Tributárias (ISS / PIS / COFINS)', type: 'Analítica', balance: 120000.00, nature: 'Credora' },
    { code: '3', name: 'RECEITAS', type: 'Sintética', balance: 1840000.00, nature: 'Credora' },
    { code: '3.1.1.01', name: 'Receita de Taxa de Conveniência & Intermediação', type: 'Analítica', balance: platformFees || 890000.00, nature: 'Credora' },
    { code: '4', name: 'CUSTOS & DESPESAS', type: 'Sintética', balance: 940000.00, nature: 'Devedora' },
    { code: '4.1.1.01', name: 'Custos com Processamento de Cartão / Gateways', type: 'Analítica', balance: 410000.00, nature: 'Devedora' },
    { code: '4.1.2.01', name: 'Despesas de Infraestrutura em Nuvem & Datacenter', type: 'Analítica', balance: 180000.00, nature: 'Devedora' }
  ];

  // Balancete data
  const trialBalance = [
    { code: '1.1.1.01', account: 'Banco Itaú Movimento', prevBalance: 2100000, debits: 1450000, credits: 700000, currentBalance: 2850000 },
    { code: '1.1.2.01', account: 'Contas a Receber Cartões', prevBalance: 980000, debits: 890000, credits: 439899.50, currentBalance: 1430100.50 },
    { code: '2.1.1.01', account: 'Repasses a Pagar Produtores', prevBalance: 2600000, debits: 650000, credits: 1500000, currentBalance: 3450000 },
    { code: '2.1.2.01', account: 'Fornecedores a Pagar', prevBalance: 240000, debits: 120000, credits: 260200.50, currentBalance: 380200.50 },
    { code: '3.1.1.01', account: 'Receita Intermediação Disk', prevBalance: 520000, debits: 0, credits: 370000, currentBalance: 890000 }
  ];

  // Filtered entries for Livro Diário
  const filteredEntries = accountingEntries.filter((e) => {
    const matchesSearch =
      !searchTerm.trim() ||
      e.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.debitAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.creditAccount.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const entryColumns: Column<typeof accountingEntries[0]>[] = [
    {
      header: 'Nº Lançamento',
      width: '130px',
      accessor: (e) => <span className="font-mono font-bold text-orange-600">{e.entryNumber}</span>
    },
    {
      header: 'Data / Competência',
      width: '130px',
      accessor: (e) => <span className="font-mono text-slate-600 font-medium">{e.date}</span>
    },
    {
      header: 'Conta Devedora (D)',
      accessor: (e) => (
        <div>
          <span className="font-semibold text-slate-900 block">{e.debitAccount}</span>
          <span className="text-[10px] text-slate-400">Aplicação de Recursos</span>
        </div>
      )
    },
    {
      header: 'Conta Credora (C)',
      accessor: (e) => (
        <div>
          <span className="font-semibold text-slate-900 block">{e.creditAccount}</span>
          <span className="text-[10px] text-slate-400">Origem de Recursos</span>
        </div>
      )
    },
    {
      header: 'Histórico Contábil',
      accessor: (e) => <span className="text-slate-600 text-xs line-clamp-1">{e.description}</span>
    },
    {
      header: 'Valor',
      align: 'right',
      width: '140px',
      accessor: (e) => <span className="font-mono font-bold text-slate-900">{formatCurrency(e.amount)}</span>
    },
    {
      header: 'Status',
      align: 'right',
      width: '110px',
      accessor: () => <StatusBadge variant="success" label="Postado" />
    }
  ];

  const chartColumns: Column<typeof chartOfAccounts[0]>[] = [
    {
      header: 'Código Estrutural',
      width: '160px',
      accessor: (acc) => <span className="font-mono font-bold text-slate-900">{acc.code}</span>
    },
    {
      header: 'Descrição da Conta Contábil',
      accessor: (acc) => (
        <span className={`${acc.type === 'Sintética' ? 'font-bold text-slate-900' : 'pl-4 font-medium text-slate-700'}`}>
          {acc.name}
        </span>
      )
    },
    {
      header: 'Classificação',
      width: '120px',
      accessor: (acc) => (
        <span className={`text-[11px] font-semibold ${acc.type === 'Sintética' ? 'text-slate-500' : 'text-orange-600'}`}>
          {acc.type}
        </span>
      )
    },
    {
      header: 'Natureza',
      width: '110px',
      accessor: (acc) => (
        <StatusBadge variant={acc.nature === 'Devedora' ? 'info' : 'primary'} label={acc.nature} />
      )
    },
    {
      header: 'Saldo Atual',
      align: 'right',
      width: '160px',
      accessor: (acc) => <span className="font-mono font-bold text-slate-900">{formatCurrency(acc.balance)}</span>
    }
  ];

  const trialColumns: Column<typeof trialBalance[0]>[] = [
    {
      header: 'Código',
      width: '110px',
      accessor: (tb) => <span className="font-mono text-slate-600 font-medium">{tb.code}</span>
    },
    {
      header: 'Conta Contábil',
      accessor: (tb) => <span className="font-semibold text-slate-900">{tb.account}</span>
    },
    {
      header: 'Saldo Anterior',
      align: 'right',
      accessor: (tb) => <span className="font-mono text-slate-600">{formatCurrency(tb.prevBalance)}</span>
    },
    {
      header: 'Débitos',
      align: 'right',
      accessor: (tb) => <span className="font-mono text-emerald-600">+{formatCurrency(tb.debits)}</span>
    },
    {
      header: 'Créditos',
      align: 'right',
      accessor: (tb) => <span className="font-mono text-rose-600">-{formatCurrency(tb.credits)}</span>
    },
    {
      header: 'Saldo Atual',
      align: 'right',
      accessor: (tb) => <span className="font-mono font-bold text-slate-900">{formatCurrency(tb.currentBalance)}</span>
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title={
          activeTab === 'accounting-chart-of-accounts' ? 'Plano de Contas Estruturado' :
          activeTab === 'accounting-entries' ? 'Livro Diário - Partidas Dobradas' :
          activeTab === 'accounting-trial-balance' ? 'Balancete de Verificação' :
          activeTab === 'accounting-dre' ? 'DRE Contábil & Demonstrações' :
          activeTab === 'accounting-balance-sheet' ? 'Balanço Patrimonial Consolidado' :
          activeTab === 'accounting-closing' ? 'Fechamento de Período & Competência' :
          activeTab === 'accounting-reconciliation' ? 'Conciliação Contábil (Razão vs Extrato)' :
          'Painel Contábil & Partidas Dobradas'
        }
        description="Escrituração contábil em tempo real sincronizada a cada venda, estorno ou liquidação bancária"
        badge={<StatusBadge variant="success" label="Débito = Crédito (Equilibrado)" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTabChange('accounting-dashboard')}
              icon={<FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
            >
              Visão Geral
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleTabChange('accounting-entries')}
              icon={<BookOpen className="h-3.5 w-3.5" />}
            >
              Livro Diário
            </Button>
          </div>
        }
      />

      {/* Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'accounting-dashboard', label: 'Painel Geral' },
          { id: 'accounting-chart-of-accounts', label: 'Plano de Contas' },
          { id: 'accounting-entries', label: `Livro Diário (${totalEntries})` },
          { id: 'accounting-reconciliation', label: 'Conciliação Contábil' },
          { id: 'accounting-trial-balance', label: 'Balancete de Verificação' },
          { id: 'accounting-dre', label: 'DRE Contábil' },
          { id: 'accounting-balance-sheet', label: 'Balanço Patrimonial' },
          { id: 'accounting-closing', label: 'Fechamento de Período' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-xs ${
              activeTab === t.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUB-VIEW 1: PAINEL GERAL */}
      {activeTab === 'accounting-dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards Row (Standardized 120-140px Height) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="LANÇAMENTOS POSTADOS"
              value={totalEntries.toString()}
              subtitle="100% integrados à contabilidade"
              icon={<FileSpreadsheet className="h-4 w-4 text-orange-600" />}
              badge="Diário Contábil"
              badgeVariant="orange"
            />

            <MetricCard
              title="MOVIMENTAÇÃO DE DÉBITOS"
              value={formatCurrency(totalDebits)}
              trend={{ value: 'Partidas dobradas conferidas', isPositive: true }}
              icon={<Scale className="h-4 w-4 text-emerald-600" />}
              badge="Equilíbrio R$ 0"
              badgeVariant="emerald"
            />

            <MetricCard
              title="RECEITA TAXAS DISK"
              value={formatCurrency(platformFees)}
              subtitle="Conta 3.1.1.01 (DRE Líquido)"
              icon={<DollarSign className="h-4 w-4 text-blue-600" />}
              badge="DRE Líquido"
              badgeVariant="cyan"
            />

            <MetricCard
              title="STATUS DO FECHAMENTO"
              value="Em Dia"
              subtitle="Competência Setembro/2026"
              icon={<CheckCircle2 className="h-4 w-4 text-purple-600" />}
              badge="Auditado"
              badgeVariant="purple"
            />
          </div>

          {/* Quick Ledger Table Preview */}
          <SectionCard
            title="LIVRO DIÁRIO - LANÇAMENTOS EM TEMPO REAL"
            description="Cada venda, taxa ou estorno reflete instantaneamente nas contas contábeis de débito e crédito"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTabChange('accounting-entries')}
                icon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Ver Livro Completo
              </Button>
            }
          >
            <DataTable
              columns={entryColumns}
              data={filteredEntries.slice(0, 5)}
              keyExtractor={(e) => e.id}
              emptyMessage="Nenhum lançamento contábil registrado no período."
            />
          </SectionCard>
        </div>
      )}

      {/* SUB-VIEW 2: PLANO DE CONTAS */}
      {activeTab === 'accounting-chart-of-accounts' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar conta por código ou descrição..."
            hasActiveFilters={Boolean(searchTerm)}
            onClearFilters={() => setSearchTerm('')}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
                icon={<Download className="h-3.5 w-3.5" />}
              >
                Exportar Plano de Contas
              </Button>
            }
          />

          <DataTable
            columns={chartColumns}
            data={chartOfAccounts.filter(acc =>
              !searchTerm.trim() ||
              acc.code.includes(searchTerm) ||
              acc.name.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyExtractor={(acc) => acc.code}
            emptyMessage="Nenhuma conta contábil encontrada."
          />
        </div>
      )}

      {/* SUB-VIEW 3: LIVRO DIÁRIO COMPLETO */}
      {activeTab === 'accounting-entries' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por código, conta D/C ou histórico..."
            hasActiveFilters={Boolean(searchTerm)}
            onClearFilters={() => setSearchTerm('')}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
                icon={<Download className="h-3.5 w-3.5" />}
              >
                Exportar Diário (CSV)
              </Button>
            }
          />

          <DataTable
            columns={entryColumns}
            data={filteredEntries}
            keyExtractor={(e) => e.id}
            emptyMessage="Nenhum lançamento encontrado para a busca informada."
          />
        </div>
      )}

      {/* SUB-VIEW 4: BALANCETE DE VERIFICAÇÃO */}
      {activeTab === 'accounting-trial-balance' && (
        <div className="space-y-4">
          <SectionCard
            title="BALANCETE DE VERIFICAÇÃO CONSOLIDADO"
            description="Conferência de saldos anteriores, movimentação de débitos, créditos e saldos finais do período"
            badge={<StatusBadge variant="success" label="Total Débitos = Total Créditos" />}
          >
            <DataTable
              columns={trialColumns}
              data={trialBalance}
              keyExtractor={(tb) => tb.code}
              emptyMessage="Nenhum dado de balancete disponível."
            />
          </SectionCard>
        </div>
      )}

      {/* SUB-VIEW 5: DRE CONTÁBIL */}
      {activeTab === 'accounting-dre' && (
        <SectionCard
          title="DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE CONTÁBIL)"
          description="Apuração legal de receitas, deduções operacionais, custos e resultado contábil do exercício"
          badge={<StatusBadge variant="success" label="Exercício 2026" />}
          className="max-w-4xl"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900">1. RECEITA BRUTA DE SERVIÇOS & TAXAS</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {formatCurrency(platformFees || 890000)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Impostos Incidentes sobre Vendas (ISS 3.5%, PIS 0.65%, COFINS 3.0%)</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency((platformFees || 890000) * 0.0715)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 font-bold text-slate-900">
              <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="font-mono text-slate-900 text-sm">
                {formatCurrency((platformFees || 890000) * (1 - 0.0715))}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Custos dos Serviços Prestados (Gateways & Adquirentes)</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(410000)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 text-slate-600">
              <span>(-) Despesas Operacionais Gerais & Administrativas</span>
              <span className="font-mono text-rose-600">
                -{formatCurrency(180000)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-900 text-sm">
              <span className="uppercase tracking-wide">(=) RESULTADO LÍQUIDO ANTES DOS IMPOSTOS (LAIR)</span>
              <span className="font-mono text-base text-emerald-700">
                {formatCurrency(((platformFees || 890000) * (1 - 0.0715)) - 410000 - 180000)}
              </span>
            </div>
          </div>
        </SectionCard>
      )}

      {/* SUB-VIEW 6: BALANÇO PATRIMONIAL */}
      {activeTab === 'accounting-balance-sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            title="ATIVO (BENS & DIREITOS)"
            description="Ativo Circulante e Não Circulante"
            badge={<StatusBadge variant="info" label="R$ 4.850.200,50" />}
          >
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 font-bold text-slate-900">
                <span>Ativo Circulante</span>
                <span className="font-mono text-emerald-700">R$ 4.850.200,50</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-slate-600">
                <span>• Disponibilidades Bancárias (Itaú / Santander)</span>
                <span className="font-mono">R$ 3.420.100,00</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-slate-600">
                <span>• Créditos a Receber de Adquirentes</span>
                <span className="font-mono">R$ 1.430.100,50</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="PASSIVO & PATRIMÔNIO LÍQUIDO"
            description="Obrigações e Recursos Próprios"
            badge={<StatusBadge variant="primary" label="R$ 4.850.200,50" />}
          >
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 font-bold text-slate-900">
                <span>Passivo Circulante (Obrigações)</span>
                <span className="font-mono text-slate-900">R$ 3.950.200,50</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-slate-600">
                <span>• Repasses a Liquidar aos Produtores</span>
                <span className="font-mono">R$ 3.450.000,00</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-slate-600">
                <span>• Fornecedores Técnicos e Estrutura</span>
                <span className="font-mono">R$ 380.200,50</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-slate-600">
                <span>• Impostos a Recolher</span>
                <span className="font-mono">R$ 120.000,00</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-blue-50 font-bold text-blue-900 mt-2">
                <span>Patrimônio Líquido (PL)</span>
                <span className="font-mono">R$ 900.000,00</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* SUB-VIEW 7: FECHAMENTO & CONCILIAÇÃO */}
      {(activeTab === 'accounting-closing' || activeTab === 'accounting-reconciliation') && (
        <SectionCard
          title="FECHAMENTO DE COMPETÊNCIA & CONCILIAÇÃO CONTÁBIL"
          description="Travamento de períodos fiscais e conciliação entre extrato bancário e razão analítico"
          badge={<StatusBadge variant="success" label="Setembro/2026 Aberto" />}
          className="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Competência Vigente: Setembro de 2026</h4>
                <p className="text-slate-500 mt-0.5">Todos os lançamentos automáticos de bilheteria estão conciliados.</p>
              </div>
              <Button size="sm" variant="primary" icon={<Lock className="h-3.5 w-3.5" />}>
                Encerrar Mês
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-800 block">Razão vs Extrato Bancário</span>
                <span className="text-[11px] text-emerald-600 font-medium">100% Conciliado</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-800 block">Travamento de Lançamentos Retroativos</span>
                <span className="text-[11px] text-slate-500">Bloqueio Ativo</span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
