import React, { useState } from 'react';
import {
  DollarSign,
  Landmark,
  Building2,
  ArrowRightLeft,
  Send,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  BarChart3,
  FileText,
  FileCheck,
  PieChart,
  Layers,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  ModuleHub,
  ModuleHero,
  ModuleMetricStrip,
  ModuleQuickActions,
  ModuleStatusPanel,
  ModuleSection,
  ModuleFeatureCard,
  ModuleRecentActivity
} from '../../shared/components/hub';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatCompactCurrency } from '../../shared/utils/formatters';
import { EventBalanceItemUI } from './EventBalancesView';
import { FinancialTransactionUI } from './AccountStatementView';
import { GatewayReconciliationRecordUI } from './ReconciliationView';

interface FinanceHubProps {
  producerName: string;
  summary: any;
  eventBalances: EventBalanceItemUI[];
  payouts: any[];
  statement: FinancialTransactionUI[];
  reconciliations: GatewayReconciliationRecordUI[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateToView: (viewId: string) => void;
  onOpenNewPayout: () => void;
  onOpenNewTransfer: () => void;
  onOpenNewPayable: () => void;
}

export const FinanceHub: React.FC<FinanceHubProps> = ({
  producerName,
  summary,
  eventBalances,
  payouts,
  statement,
  reconciliations,
  isLoading,
  onRefresh,
  onNavigateToView,
  onOpenNewPayout,
  onOpenNewTransfer,
  onOpenNewPayable
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const grossSales = summary?.grossSales || 0;
  const availableBalance = summary?.availableBalance || 0;
  const payoutsPaid = summary?.payoutsPaid || 0;
  const pendingPayouts = summary?.pendingPayouts || 0;

  // Filter cards by search query
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <ModuleHub glowColor="emerald">
      {/* 1. HERO BANNER */}
      <ModuleHero
        title="HUB FINANCEIRO"
        subtitle="Gestão financeira integrada de produtores, liquidação bancária, saldos segregados e conciliação de recebíveis"
        badgeText="Disk Pro Financial Hub"
        badgeVariant="emerald"
        icon={<Landmark className="h-6 w-6 text-emerald-400" />}
        contextInfo={
          <span className="flex items-center gap-2">
            <strong className="text-slate-900 font-bold">{producerName}</strong>
            <span>•</span>
            <span>{eventBalances.length} Eventos Ativos</span>
            <span>•</span>
            <span className="text-emerald-600 font-mono font-medium">Conta Gráfica Auditada</span>
          </span>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenNewTransfer}
              icon={<ArrowRightLeft className="h-3.5 w-3.5 text-purple-400" />}
            >
              Transferir
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewPayout}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Novo Repasse
            </Button>
          </>
        }
        searchPlaceholder="Buscar por função (ex: saldos, transferências, dre, conciliação, contas)..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. METRIC STRIP (FATUAL E DINÂMICO) */}
      <ModuleMetricStrip
        columns={4}
        metrics={[
          {
            id: 'm1',
            label: 'VENDAS BRUTAS TOTAIS',
            value: formatCurrency(grossSales),
            helper: 'Volume de ingressos processado',
            trend: { value: 'Real', isPositive: true },
            icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
            onClick: () => onNavigateToView('finance-dashboard')
          },
          {
            id: 'm2',
            label: 'SALDO DISPONÍVEL LÍQUIDO',
            value: formatCurrency(availableBalance),
            helper: 'Livre para repasse bancário',
            badge: 'Disponível',
            badgeVariant: 'emerald',
            icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
            onClick: () => onNavigateToView('finance-event-balances')
          },
          {
            id: 'm3',
            label: 'REPASSES PAGOS',
            value: formatCurrency(payoutsPaid),
            helper: 'Liquidados via PIX e TED',
            badge: 'Concluídos',
            badgeVariant: 'purple',
            icon: <Landmark className="h-4 w-4 text-purple-400" />,
            onClick: () => onNavigateToView('finance-payouts')
          },
          {
            id: 'm4',
            label: 'REPASSES PENDENTES',
            value: formatCurrency(pendingPayouts),
            helper: 'Em alçada ou agendamento',
            badge: pendingPayouts > 0 ? 'Aguardando' : 'Zero Pendência',
            badgeVariant: pendingPayouts > 0 ? 'amber' : 'slate',
            icon: <Clock className="h-4 w-4 text-amber-400" />,
            onClick: () => onNavigateToView('finance-payouts')
          }
        ]}
      />

      {/* 3. QUICK ACTIONS BAR */}
      <ModuleQuickActions
        title="ATALHOS OPERACIONAIS INSTANTÂNEOS"
        actions={[
          {
            id: 'qa1',
            label: 'Solicitar Repasse Bancário',
            icon: <Send className="h-3.5 w-3.5" />,
            variant: 'primary',
            onClick: onOpenNewPayout
          },
          {
            id: 'qa2',
            label: 'Nova Transferência Entre Eventos',
            icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
            variant: 'purple',
            onClick: onOpenNewTransfer
          },
          {
            id: 'qa3',
            label: 'Lançar Provisão / Conta a Pagar',
            icon: <Plus className="h-3.5 w-3.5" />,
            variant: 'outline',
            onClick: onOpenNewPayable
          },
          {
            id: 'qa4',
            label: 'Consultar Extrato da Conta',
            icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
            variant: 'outline',
            onClick: () => onNavigateToView('finance-statement')
          },
          {
            id: 'qa5',
            label: 'Painel de Conciliação Gateways',
            icon: <Scale className="h-3.5 w-3.5" />,
            variant: 'emerald',
            onClick: () => onNavigateToView('finance-reconciliation')
          }
        ]}
      />

      {/* 4. STATUS OPERACIONAL & GOVERNANÇA */}
      <ModuleStatusPanel
        title="STATUS OPERACIONAL, CONCILIAÇÃO & GOVERNANÇA"
        items={[
          {
            label: 'Segregação de Funções (Maker-Checker)',
            statusText: 'Ativo & Fiscalizado',
            isHealthy: true,
            detail: 'Auto-aprovação proibida no backend'
          },
          {
            label: 'Alçadas de Segurança (> R$ 50.000)',
            statusText: 'Step-Up Obrigatório',
            isHealthy: true,
            detail: 'Diretoria Financeira autorizada'
          },
          {
            label: 'Conciliação com Adquirentes',
            statusText: '100% Conciliado',
            isHealthy: true,
            detail: 'Cielo, Rede e PIX auditados'
          },
          {
            label: 'Contas Bancárias Homologadas',
            statusText: '2 Contas Ativas',
            isHealthy: true,
            detail: 'Itaú Unibanco (Principal) e Santander'
          }
        ]}
      />

      {/* 5. SEÇÃO 1: OPERAÇÕES FINANCEIRAS */}
      <ModuleSection
        title="OPERAÇÕES FINANCEIRAS"
        description="Gestão diária de liquidez, transferências, saldos por evento e repasses bancários"
        badge="Áreas Operacionais"
        badgeVariant="emerald"
        columns={3}
      >
        {matchesSearch('conta financeira posicao geral saldo consolidado') && (
          <ModuleFeatureCard
            id="f-account"
            title="Conta Financeira & Posição Geral"
            description="Visão consolidada da carteira do produtor, faturamento total e disponibilidade para saque."
            icon={<Landmark className="h-5 w-5" />}
            iconTheme="emerald"
            metricValue={formatCurrency(availableBalance)}
            metricLabel="Disponibilidade Líquida"
            badge="Factual"
            badgeVariant="emerald"
            onClick={() => onNavigateToView('finance-dashboard')}
          />
        )}

        {matchesSearch('saldos eventos centros de custo eventos') && (
          <ModuleFeatureCard
            id="f-balances"
            title="Saldos por Evento"
            description="Gestão segregada de centros de custo por evento com vendas, taxas retidas e saldo individual."
            icon={<Building2 className="h-5 w-5" />}
            iconTheme="cyan"
            metricValue={`${eventBalances.length} Eventos`}
            metricLabel="Centros de Custo"
            badge="Segregado"
            badgeVariant="cyan"
            onClick={() => onNavigateToView('finance-event-balances')}
          />
        )}

        {matchesSearch('transferencias entre eventos remanejamento safesaff') && (
          <ModuleFeatureCard
            id="f-transfers"
            title="Transferências entre Eventos"
            description="Remanejamento direto de saldos entre eventos do mesmo produtor com compensação contábil."
            icon={<ArrowRightLeft className="h-5 w-5" />}
            iconTheme="purple"
            metricValue="SafeSaff"
            metricLabel="Motor Contábil"
            badge="Maker-Checker"
            badgeVariant="purple"
            onClick={() => onNavigateToView('finance-transfers')}
          />
        )}

        {matchesSearch('repasses programados solicitacoes saques pix') && (
          <ModuleFeatureCard
            id="f-payouts"
            title="Repasses Programados"
            description="Solicitação formal de saques, fluxo de autorização por alçadas e baixa com comprovante PIX."
            icon={<Send className="h-5 w-5" />}
            iconTheme="orange"
            metricValue={`${payouts.length} Registros`}
            metricLabel="Histórico Repasses"
            badge="D+X Contratual"
            badgeVariant="orange"
            onClick={() => onNavigateToView('finance-payouts')}
          />
        )}

        {matchesSearch('extrato analitico conta corrente movimentacoes vendas taxas') && (
          <ModuleFeatureCard
            id="f-statement"
            title="Extrato Analítico da Conta"
            description="Livro analítico de lançamentos com rastreio de vendas, comissões, transferências e exportação CSV."
            icon={<FileSpreadsheet className="h-5 w-5" />}
            iconTheme="blue"
            metricValue={`${statement.length} Itens`}
            metricLabel="Lançamentos"
            badge="Exportável"
            badgeVariant="slate"
            onClick={() => onNavigateToView('finance-statement')}
          />
        )}

        {matchesSearch('antecipacoes credito recebiveis simulador spread') && (
          <ModuleFeatureCard
            id="f-advances"
            title="Antecipações & Crédito"
            description="Simulação e solicitação de antecipação de recebíveis futuros de bilheteria e taxas com spread transparente."
            icon={<TrendingUp className="h-5 w-5" />}
            iconTheme="amber"
            metricValue="1.8% a.m."
            metricLabel="Taxa Balcão"
            badge="Crédito Pro"
            badgeVariant="amber"
            onClick={() => onNavigateToView('finance-advances')}
          />
        )}
      </ModuleSection>

      {/* 6. SEÇÃO 2: CONTROLE, RISCO & TAXAS */}
      <ModuleSection
        title="CONTROLE, RISCO & AUDITORIA"
        description="Conciliação com processadoras de pagamento, conferência de taxas e gestão orçamentária"
        badge="Governança"
        badgeVariant="purple"
        columns={3}
      >
        {matchesSearch('conciliacao bancaria gateways adquirentes cielo rede pix') && (
          <ModuleFeatureCard
            id="f-reconciliation"
            title="Conciliação de Gateways"
            description="Confronto entre os pedidos do sistema e as liquidações nos adquirentes (Cielo, Rede, PIX Banco Central)."
            icon={<Scale className="h-5 w-5" />}
            iconTheme="emerald"
            metricValue="100% Conciliado"
            metricLabel="Auditado"
            badge="Zero Divergência"
            badgeVariant="emerald"
            onClick={() => onNavigateToView('finance-reconciliation')}
          />
        )}

        {matchesSearch('pagamentos taxas split conveniencia comissao') && (
          <ModuleFeatureCard
            id="f-split"
            title="Pagamentos, Taxas & Split"
            description="Detalhamento das taxas de conveniência retidas, regras de split por canal e repasse de comissões."
            icon={<PieChart className="h-5 w-5" />}
            iconTheme="purple"
            metricValue="8.0% Retenção"
            metricLabel="Taxa Padrão Disk"
            badge="Contratual"
            badgeVariant="purple"
            onClick={() => onNavigateToView('finance-split')}
          />
        )}

        {matchesSearch('centros de custo orcamento classificacao departamentos') && (
          <ModuleFeatureCard
            id="f-cost-centers"
            title="Centros de Custo & Orçamento"
            description="Classificação gerencial por departamento: Artístico, Som, Luz, Segurança, Locação e Tráfego."
            icon={<Layers className="h-5 w-5" />}
            iconTheme="cyan"
            metricValue="6 Categorias"
            metricLabel="Estrutura de Custos"
            badge="Orçamento"
            badgeVariant="cyan"
            onClick={() => onNavigateToView('finance-cost-centers')}
          />
        )}
      </ModuleSection>

      {/* 7. SEÇÃO 3: GESTÃO DE CAIXA & OBRIGAÇÕES */}
      <ModuleSection
        title="GESTÃO DE CAIXA & OBRIGAÇÕES"
        description="Contas a pagar de fornecedores, contas a receber, fluxo de caixa e demonstrativo de resultado (DRE)"
        badge="Competência & Caixa"
        badgeVariant="amber"
        columns={3}
      >
        {matchesSearch('contas a pagar fornecedores despesas producao infraestrutura cache') && (
          <ModuleFeatureCard
            id="f-payables"
            title="Contas a Pagar (Obrigações)"
            description="Provisões de custos operacionais de produção, cachês artísticos, som, luz e controle de baixa bancária."
            icon={<TrendingDown className="h-5 w-5" />}
            iconTheme="rose"
            metricValue="Aberto / Pago"
            metricLabel="Status Provisões"
            badge="Fornecedores"
            badgeVariant="rose"
            onClick={() => onNavigateToView('finance-receivables-payables')}
          />
        )}

        {matchesSearch('contas a receber recebiveis bilheteria canais cartao boleto') && (
          <ModuleFeatureCard
            id="f-receivables"
            title="Contas a Receber (Canais)"
            description="Acompanhamento dos recebíveis futuros de vendas a prazo no cartão de crédito, boletos e PDV."
            icon={<CreditCard className="h-5 w-5" />}
            iconTheme="cyan"
            metricValue="Recebíveis D+30"
            metricLabel="Previsão de Caixa"
            badge="Cartão & Boleto"
            badgeVariant="cyan"
            onClick={() => onNavigateToView('finance-receivables-payables')}
          />
        )}

        {matchesSearch('fluxo de caixa realizado projetado solvencia saldo') && (
          <ModuleFeatureCard
            id="f-cashflow"
            title="Fluxo de Caixa (Real vs Proj)"
            description="Visão temporal das entradas e saídas realizadas versus compromissos projetados e saldo acumulado."
            icon={<BarChart3 className="h-5 w-5" />}
            iconTheme="purple"
            metricValue="Projeção Positiva"
            metricLabel="Solvência 30d"
            badge="Caixa Real"
            badgeVariant="purple"
            onClick={() => onNavigateToView('finance-treasury')}
          />
        )}

        {matchesSearch('dre gerencial demonstrativo resultado margem contribuicao') && (
          <ModuleFeatureCard
            id="f-dre"
            title="DRE Gerencial por Evento"
            description="Demonstrativo analítico de rentabilidade com apuração de receita bruta, deduções e margem de contribuição."
            icon={<FileText className="h-5 w-5" />}
            iconTheme="emerald"
            metricValue="EBITDA Operacional"
            metricLabel="Resultado"
            badge="Rentabilidade"
            badgeVariant="emerald"
            onClick={() => onNavigateToView('finance-treasury')}
          />
        )}

        {matchesSearch('tesouraria contas bancarias pix homologacao itau santander') && (
          <ModuleFeatureCard
            id="f-treasury"
            title="Tesouraria & Contas Bancárias"
            description="Cadastro e homologação de contas bancárias e chaves PIX para direcionamento de repasses."
            icon={<Landmark className="h-5 w-5" />}
            iconTheme="blue"
            metricValue="2 Contas Ativas"
            metricLabel="Homologadas"
            badge="Titularidade CNPJ"
            badgeVariant="slate"
            onClick={() => onNavigateToView('finance-treasury')}
          />
        )}

        {matchesSearch('bordero oficial fechamento prestacao de contas assinaturas') && (
          <ModuleFeatureCard
            id="f-bordero"
            title="Borderô Oficial de Fechamento"
            description="Balanço oficial pós-evento para prestação de contas com produtores e emissão de borderô final."
            icon={<FileCheck className="h-5 w-5" />}
            iconTheme="amber"
            metricValue="Balanço Final"
            metricLabel="Consolidado"
            badge="Fechamento"
            badgeVariant="amber"
            onClick={() => onNavigateToView('finance-bordero')}
          />
        )}
      </ModuleSection>

      {/* 8. RECENT ACTIVITY & AUDIT FEED */}
      <ModuleRecentActivity
        title="ÚLTIMAS MOVIMENTAÇÕES & ATIVIDADES FINANCEIRAS"
        onViewAll={() => onNavigateToView('finance-statement')}
        activities={statement.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.description,
          subtitle: `${t.type} • Ref: ${t.referenceId || 'N/A'}`,
          timestamp: new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          amount: formatCurrency(t.amount),
          status: t.amount > 0 ? 'Crédito' : 'Débito',
          statusVariant: t.amount > 0 ? 'emerald' : 'rose',
          icon: t.amount > 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />
        }))}
      />
    </ModuleHub>
  );
};
