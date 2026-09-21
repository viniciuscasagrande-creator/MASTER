import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Clock,
  Send,
  CreditCard,
  QrCode,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRightLeft,
  Receipt,
  Landmark,
  ArrowLeft,
  LayoutGrid,
  Percent,
  FileCheck
} from 'lucide-react';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { StatCard } from '../../shared/components/StatCard';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { SectionCard } from '../../shared/components/SectionCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DataTable, Column } from '../../shared/components/DataTable';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatCompactCurrency } from '../../shared/utils/formatters';
import { NewPayoutModal } from './NewPayoutModal';
import { PayoutDetailModal } from './PayoutDetailModal';
import { EventBalancesView, EventBalanceItemUI } from './EventBalancesView';
import { AccountStatementView, FinancialTransactionUI } from './AccountStatementView';
import { ReconciliationView, GatewayReconciliationRecordUI } from './ReconciliationView';
import { TransfersView } from './TransfersView';
import { ReceivablesPayablesView } from './ReceivablesPayablesView';
import { TreasuryCashFlowView } from './TreasuryCashFlowView';
import { NewTransferModal } from './NewTransferModal';
import { FinanceHub } from './FinanceHub';
import { AdvancesView } from './AdvancesView';
import { BorderoView } from './BorderoView';

interface FinanceDashboardProps {
  initialSubItem?: string;
  onNavigate?: (module: string, sub?: string) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  initialSubItem = 'finance-hub',
  onNavigate
}) => {
  const { activeProducer, activeEvent } = useDiskContext();
  const { currentUser, hasPermission } = useAuth();

  // Tab State: default directly to Hub Financeiro for premium entry experience
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (!initialSubItem || initialSubItem === 'finance-dashboard' || !initialSubItem.startsWith('finance-')) {
      return 'finance-hub';
    }
    return initialSubItem;
  });

  useEffect(() => {
    if (!initialSubItem || initialSubItem === 'finance-dashboard' || !initialSubItem.startsWith('finance-')) {
      setActiveTab('finance-hub');
    } else {
      setActiveTab(initialSubItem);
    }
  }, [initialSubItem]);

  // Data States
  const [summary, setSummary] = useState<any>(null);
  const [eventBalances, setEventBalances] = useState<EventBalanceItemUI[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [statement, setStatement] = useState<FinancialTransactionUI[]>([]);
  const [reconciliations, setReconciliations] = useState<GatewayReconciliationRecordUI[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals
  const [isNewPayoutModalOpen, setIsNewPayoutModalOpen] = useState(false);
  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [preselectedEventId, setPreselectedEventId] = useState<string>('');

  const producerId = activeProducer?.id || 'prd_100';
  const producerName = activeProducer?.name || 'Produtor Master';
  const eventId = activeEvent?.id;

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const queryParams = new URLSearchParams({
        producerId,
        ...(eventId ? { eventId } : {})
      });

      // 1. Resumo financeiro
      const [resSummary, resBalances, resPayouts, resStatement, resRec] = await Promise.all([
        fetch(`/api/finance/summary?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch(`/api/finance/event-balances?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch(`/api/finance/payouts?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch(`/api/finance/statement?${queryParams}`, { headers: { 'x-producer-id': producerId } }),
        fetch('/api/finance/reconciliation', { headers: { 'x-producer-id': producerId } })
      ]);

      if (resSummary.ok) {
        const json = await resSummary.json();
        setSummary(json.data);
      }

      if (resBalances.ok) {
        const json = await resBalances.json();
        setEventBalances(json.data || []);
      }

      if (resPayouts.ok) {
        const json = await resPayouts.json();
        setPayouts(json.data || []);
      }

      if (resStatement.ok) {
        const json = await resStatement.json();
        setStatement(json.data || []);
      }

      if (resRec.ok) {
        const json = await resRec.json();
        setReconciliations(json.data || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao carregar dados financeiros do servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [producerId, eventId]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const handleOpenPayoutForEvent = (evId: string) => {
    setPreselectedEventId(evId);
    setIsNewPayoutModalOpen(true);
  };

  const canApprove = hasPermission('financeiro.repasses.aprovar') || currentUser.roleSlug === 'admin_geral';

  // 1. HUB FINANCEIRO (LANDING VIEW PRINCIPAL)
  if (activeTab === 'finance-hub') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <FinanceHub
          producerName={producerName}
          summary={summary}
          eventBalances={eventBalances}
          payouts={payouts}
          statement={statement}
          reconciliations={reconciliations}
          isLoading={isLoading}
          onRefresh={loadFinancialData}
          onNavigateToView={(viewId) => {
            setActiveTab(viewId);
            onNavigate?.('finance', viewId);
          }}
          onOpenNewPayout={() => {
            setPreselectedEventId('');
            setIsNewPayoutModalOpen(true);
          }}
          onOpenNewTransfer={() => setIsNewTransferModalOpen(true)}
          onOpenNewPayable={() => {
            setActiveTab('finance-receivables-payables');
            onNavigate?.('finance', 'finance-receivables-payables');
          }}
        />

        {/* Global Modals Mounted for Instant Hub Access */}
        <NewPayoutModal
          isOpen={isNewPayoutModalOpen}
          onClose={() => setIsNewPayoutModalOpen(false)}
          producerId={producerId}
          producerName={producerName}
          events={eventBalances.map(e => ({
            id: e.eventId,
            title: e.eventTitle,
            availableBalance: e.availableBalance
          }))}
          onSuccess={loadFinancialData}
        />

        <NewTransferModal
          isOpen={isNewTransferModalOpen}
          onClose={() => setIsNewTransferModalOpen(false)}
          producerId={producerId}
          eventBalances={eventBalances}
          onSuccess={loadFinancialData}
        />
      </div>
    );
  }

  // 2. TELAS FUNCIONAIS OPERACIONAIS (COM BREADCRUMB E RETORNO AO HUB)
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header with Return to Hub */}
      <PageHeader
        title={
          activeTab === 'finance-dashboard' ? 'Posição Geral & Indicadores' :
          activeTab === 'finance-event-balances' ? 'Saldos Segregados por Evento' :
          activeTab === 'finance-transfers' ? 'Transferências entre Eventos' :
          activeTab === 'finance-receivables-payables' ? 'Contas a Pagar & Receber' :
          activeTab === 'finance-payouts' ? 'Repasses Programados' :
          activeTab === 'finance-treasury' ? 'Tesouraria, Fluxo de Caixa & DRE' :
          activeTab === 'finance-statement' ? 'Extrato Analítico da Conta' :
          activeTab === 'finance-reconciliation' ? 'Conciliação com Gateways' :
          activeTab === 'finance-advances' ? 'Antecipações & Crédito' :
          activeTab === 'finance-bordero' ? 'Borderô Oficial de Fechamento' : 'Módulo Financeiro'
        }
        description={`${producerName} • Gestão Financeira Integrada`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveTab('finance-hub');
                onNavigate?.('finance', 'finance-hub');
              }}
              icon={<ArrowLeft className="h-3.5 w-3.5 text-orange-600" />}
            >
              Hub Financeiro
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadFinancialData}
              disabled={isLoading}
              icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewTransferModalOpen(true)}
              icon={<ArrowRightLeft className="h-3.5 w-3.5 text-purple-600" />}
            >
              Transferir
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setPreselectedEventId('');
                setIsNewPayoutModalOpen(true);
              }}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Novo Repasse
            </Button>
          </div>
        }
      />

      {/* Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'finance-hub', label: 'Hub Principal', icon: <LayoutGrid className="h-3.5 w-3.5 text-orange-600" /> },
          { id: 'finance-dashboard', label: 'Visão Geral' },
          { id: 'finance-event-balances', label: `Saldos por Evento (${eventBalances.length})` },
          { id: 'finance-transfers', label: 'Transferências' },
          { id: 'finance-receivables-payables', label: 'Contas Pagar/Receber' },
          { id: 'finance-payouts', label: `Repasses (${payouts.length})` },
          { id: 'finance-treasury', label: 'Tesouraria & DRE' },
          { id: 'finance-statement', label: 'Extrato da Conta' },
          { id: 'finance-reconciliation', label: 'Conciliação' },
          { id: 'finance-advances', label: 'Antecipações' },
          { id: 'finance-bordero', label: 'Borderô' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              onNavigate?.('finance', t.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-xs ${
              activeTab === t.id
                ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 0: HUB FINANCEIRO PRINCIPAL (Executive Functional Clusters) */}
      {activeTab === 'finance-hub' && (
        <FinanceHub
          producerName={producerName}
          summary={summary}
          eventBalances={eventBalances}
          payouts={payouts}
          statement={statement}
          reconciliations={reconciliations}
          isLoading={isLoading}
          onRefresh={loadFinancialData}
          onNavigateToView={(viewId) => {
            setActiveTab(viewId);
            onNavigate?.('finance', viewId);
          }}
          onOpenNewPayout={() => {
            setPreselectedEventId('');
            setIsNewPayoutModalOpen(true);
          }}
          onOpenNewTransfer={() => setIsNewTransferModalOpen(true)}
          onOpenNewPayable={() => {
            setActiveTab('finance-receivables-payables');
            onNavigate?.('finance', 'finance-receivables-payables');
          }}
        />
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'finance-dashboard' && (
        <div className="space-y-6">
          {/* Executive KPI Cards (Standardized 120-140px Height) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="VENDAS BRUTAS"
              value={summary ? formatCurrency(summary.grossSales) : 'R$ 0,00'}
              trend={{ value: 'Real', isPositive: true }}
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
              badge="Processado"
              badgeVariant="emerald"
            />

            <MetricCard
              title="SALDO DISPONÍVEL"
              value={summary ? formatCurrency(summary.availableBalance) : 'R$ 0,00'}
              trend={{ value: 'Líquido', isPositive: true }}
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              badge="Livre p/ Saque"
              badgeVariant="emerald"
            />

            <MetricCard
              title="REPASSES PAGOS"
              value={summary ? formatCurrency(summary.payoutsPaid) : 'R$ 0,00'}
              subtitle="Transferências liquidadas via PIX/TED"
              icon={<QrCode className="h-4 w-4 text-purple-600" />}
              badge="Concluídos"
              badgeVariant="purple"
            />

            <MetricCard
              title="REPASSES PENDENTES"
              value={summary ? formatCurrency(summary.pendingPayouts) : 'R$ 0,00'}
              subtitle="Aguardando aprovação ou liquidação"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              badge="Em Aberto"
              badgeVariant="amber"
            />
          </div>

          {/* Middle Layout: Event Balances Quick Table + Payouts Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Balances Summary */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                    SALDO POR EVENTO
                  </h2>
                  <span className="text-xs text-emerald-600 font-bold font-mono">
                    {formatCompactCurrency(summary?.availableBalance || 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Disponibilidade líquida individual por evento
                </p>

                <div className="space-y-2.5">
                  {eventBalances.slice(0, 4).map((ev) => (
                    <div
                      key={ev.eventId}
                      onClick={() => handleOpenPayoutForEvent(ev.eventId)}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:border-orange-500/40 hover:bg-orange-50/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="truncate max-w-[180px]">
                          <div className="font-semibold text-slate-900 truncate">{ev.eventTitle}</div>
                          <div className="text-[10px] text-slate-500">{ev.eventDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-emerald-600">
                            {formatCurrency(ev.availableBalance)}
                          </div>
                          <span className="text-[10px] text-slate-400">solicitar</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Total de Eventos:</span>
                <span className="font-bold text-slate-900 font-mono">{eventBalances.length}</span>
              </div>
            </div>

            {/* Payouts Overview Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                    ÚLTIMOS REPASSES & PROGRAMAÇÕES
                  </h2>
                  <p className="text-xs text-slate-500">
                    Histórico de autorizações e liquidações bancárias
                  </p>
                </div>
                <StatusBadge variant="purple" label={`${payouts.length} registros`} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Código & Evento</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Dossiê</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-sans">
                          Nenhum repasse agendado para o produtor.
                        </td>
                      </tr>
                    ) : (
                      payouts.slice(0, 5).map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-sans">
                            <div className="font-mono font-bold text-slate-900">{pay.payoutNumber}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                              {pay.eventName}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {formatCurrency(pay.amount)}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-600">
                            {pay.scheduledDate}
                          </td>

                          <td className="py-3 px-3 font-sans">
                            {pay.status === 'COMPLETED' ? (
                              <StatusBadge variant="success" label="Liquidado" />
                            ) : pay.status === 'PROCESSING' ? (
                              <StatusBadge variant="info" label="Em Análise" />
                            ) : pay.status === 'SCHEDULED' ? (
                              <StatusBadge variant="purple" label="Agendado" />
                            ) : (
                              <StatusBadge variant="danger" label={pay.status} />
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-sans">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPayout(pay)}
                            >
                              Ver Dossiê
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALDOS POR EVENTO */}
      {activeTab === 'finance-event-balances' && (
        <EventBalancesView
          balances={eventBalances}
          isLoading={isLoading}
          onOpenPayoutForEvent={handleOpenPayoutForEvent}
        />
      )}

      {/* TAB 3: REPASSES & SAQUES */}
      {activeTab === 'finance-payouts' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                LISTA GERAL DE REPASSES OPERACIONAIS
              </h3>
              <p className="text-xs text-slate-500">
                Todos os repasses agendados, em processamento e liquidados no banco
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setPreselectedEventId('');
                setIsNewPayoutModalOpen(true);
              }}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Novo Repasse
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Código do Repasse</th>
                  <th className="py-3.5 px-4">Evento de Destino</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4">Data Prevista</th>
                  <th className="py-3.5 px-4">Instituição / Conta</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {payouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {pay.payoutNumber}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{pay.eventName}</div>
                      <div className="text-[11px] text-slate-500">Solicitado por: {pay.requestedBy}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(pay.amount)}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600">
                      {pay.scheduledDate}
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-slate-900 font-medium text-[11px]">{pay.bankInfo?.bankName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Ag {pay.bankInfo?.agency} | CC {pay.bankInfo?.account}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {pay.status === 'COMPLETED' ? (
                        <StatusBadge variant="success" label="Liquidado" />
                      ) : pay.status === 'PROCESSING' ? (
                        <StatusBadge variant="info" label="Em Análise" />
                      ) : pay.status === 'SCHEDULED' ? (
                        <StatusBadge variant="purple" label="Agendado" />
                      ) : (
                        <StatusBadge variant="danger" label={pay.status} />
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPayout(pay)}
                      >
                        Ver Dossiê
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TRANSFERÊNCIAS ENTRE EVENTOS */}
      {activeTab === 'finance-transfers' && (
        <TransfersView
          producerId={producerId}
          eventBalances={eventBalances}
          onRefreshBalances={loadFinancialData}
          canApprove={canApprove}
        />
      )}

      {/* TAB: CONTAS A PAGAR & RECEBER */}
      {activeTab === 'finance-receivables-payables' && (
        <ReceivablesPayablesView
          producerId={producerId}
          eventBalances={eventBalances}
          onRefreshBalances={loadFinancialData}
        />
      )}

      {/* TAB: TESOURARIA, FLUXO & DRE */}
      {activeTab === 'finance-treasury' && (
        <TreasuryCashFlowView
          producerId={producerId}
          eventId={eventId}
        />
      )}

      {/* TAB 4: EXTRATO DA CONTA CORRENTE */}
      {(activeTab === 'finance-statement' || activeTab === 'finance-reports') && (
        <AccountStatementView
          transactions={statement}
          isLoading={isLoading}
        />
      )}

      {/* TAB 5: CONCILIAÇÃO DE GATEWAYS */}
      {activeTab === 'finance-reconciliation' && (
        <ReconciliationView
          records={reconciliations}
          isLoading={isLoading}
          onRefresh={loadFinancialData}
        />
      )}

      {/* TAB 6: ANTECIPAÇÕES & CRÉDITO PRO */}
      {activeTab === 'finance-advances' && (
        <AdvancesView
          producerId={producerId}
          eventBalances={eventBalances}
          onRefreshBalances={loadFinancialData}
        />
      )}

      {/* TAB 7: BORDERÔ OFICIAL DE FECHAMENTO */}
      {activeTab === 'finance-bordero' && (
        <BorderoView
          producerName={producerName}
          eventBalances={eventBalances}
        />
      )}

      {/* MODAL 1: Novo Repasse */}
      <NewPayoutModal
        isOpen={isNewPayoutModalOpen}
        onClose={() => setIsNewPayoutModalOpen(false)}
        producerId={producerId}
        producerName={producerName}
        events={eventBalances.map(e => ({
          id: e.eventId,
          title: e.eventTitle,
          availableBalance: e.availableBalance
        }))}
        onSuccess={loadFinancialData}
      />

      {/* MODAL 2: Dossiê do Repasse */}
      <PayoutDetailModal
        isOpen={Boolean(selectedPayout)}
        onClose={() => setSelectedPayout(null)}
        payout={selectedPayout}
        onRefresh={loadFinancialData}
        canApprove={canApprove}
      />

      {/* MODAL 3: Nova Transferência entre Eventos */}
      <NewTransferModal
        isOpen={isNewTransferModalOpen}
        onClose={() => setIsNewTransferModalOpen(false)}
        producerId={producerId}
        eventBalances={eventBalances}
        onSuccess={loadFinancialData}
      />
    </div>
  );
};
