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
  Filter
} from 'lucide-react';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatCompactCurrency } from '../../shared/utils/formatters';
import { NewPayoutModal } from './NewPayoutModal';
import { PayoutDetailModal } from './PayoutDetailModal';
import { EventBalancesView, EventBalanceItemUI } from './EventBalancesView';
import { AccountStatementView, FinancialTransactionUI } from './AccountStatementView';
import { ReconciliationView, GatewayReconciliationRecordUI } from './ReconciliationView';

interface FinanceDashboardProps {
  initialSubItem?: string;
  onNavigate?: (module: string, sub?: string) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  initialSubItem = 'finance-dashboard',
  onNavigate
}) => {
  const { activeProducer, activeEvent } = useDiskContext();
  const { currentUser, hasPermission } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(initialSubItem);

  useEffect(() => {
    if (initialSubItem) {
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

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              FINANCEIRO & REPASSES
            </h1>
            <Badge variant="emerald" size="sm">
              Módulo Gestão Factual
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {producerName} • Gestão analítica de liquidação bancária, saldos segregados e conciliação
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab('finance-dashboard');
            onNavigate?.('finance', 'finance-dashboard');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'finance-dashboard'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => {
            setActiveTab('finance-event-balances');
            onNavigate?.('finance', 'finance-event-balances');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'finance-event-balances'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Saldos por Evento ({eventBalances.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('finance-payouts');
            onNavigate?.('finance', 'finance-payouts');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'finance-payouts'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Repasses Programados ({payouts.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('finance-statement');
            onNavigate?.('finance', 'finance-reports');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'finance-statement' || activeTab === 'finance-reports'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Extrato da Conta Corrente
        </button>

        <button
          onClick={() => {
            setActiveTab('finance-reconciliation');
            onNavigate?.('finance', 'finance-reconciliation');
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'finance-reconciliation'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Conciliação de Gateways
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'finance-dashboard' && (
        <div className="space-y-6">
          {/* Executive KPI Cards (100% Factual / Zero Fake Data) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="VENDAS BRUTAS"
              value={summary ? formatCurrency(summary.grossSales) : 'R$ 0,00'}
              trend={{ value: 'Real', isPositive: true }}
              icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
              badge="Volume Processado"
              badgeVariant="emerald"
            />

            <StatCard
              title="SALDO DISPONÍVEL"
              value={summary ? formatCurrency(summary.availableBalance) : 'R$ 0,00'}
              trend={{ value: 'Líquido', isPositive: true }}
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              badge="Livre p/ Saque"
              badgeVariant="emerald"
            />

            <StatCard
              title="REPASSES PAGOS"
              value={summary ? formatCurrency(summary.payoutsPaid) : 'R$ 0,00'}
              subtitle="Transferências liquidadas via PIX/TED"
              icon={<QrCode className="h-4 w-4 text-purple-400" />}
              badge="Concluídos"
              badgeVariant="purple"
            />

            <StatCard
              title="REPASSES PENDENTES"
              value={summary ? formatCurrency(summary.pendingPayouts) : 'R$ 0,00'}
              subtitle="Aguardando aprovação ou liquidação"
              icon={<Clock className="h-4 w-4 text-amber-400" />}
              badge="Em Aberto"
              badgeVariant="orange"
            />
          </div>

          {/* Middle Layout: Event Balances Quick Table + Payouts Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Balances Summary */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                    SALDO POR EVENTO
                  </h2>
                  <span className="text-xs text-emerald-400 font-semibold font-mono">
                    {formatCompactCurrency(summary?.availableBalance || 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Disponibilidade líquida individual por evento
                </p>

                <div className="space-y-3">
                  {eventBalances.slice(0, 4).map((ev) => (
                    <div
                      key={ev.eventId}
                      onClick={() => handleOpenPayoutForEvent(ev.eventId)}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="truncate max-w-[180px]">
                          <div className="font-semibold text-white truncate">{ev.eventTitle}</div>
                          <div className="text-[10px] text-slate-500">{ev.eventDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            {formatCurrency(ev.availableBalance)}
                          </div>
                          <span className="text-[10px] text-slate-500">solicitar</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total de Eventos:</span>
                <span className="font-bold text-white font-mono">{eventBalances.length}</span>
              </div>
            </div>

            {/* Payouts Overview Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                    ÚLTIMOS REPASSES & PROGRAMAÇÕES
                  </h2>
                  <p className="text-xs text-slate-400">
                    Histórico de autorizações e liquidações bancárias
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  {payouts.length} registros
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-3">Código & Evento</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Dossiê</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                          Nenhum repasse agendado para o produtor.
                        </td>
                      </tr>
                    ) : (
                      payouts.slice(0, 5).map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3">
                            <div className="font-mono font-bold text-white">{pay.payoutNumber}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                              {pay.eventName}
                            </div>
                          </td>

                          <td className="py-3 font-mono font-bold text-white">
                            {formatCurrency(pay.amount)}
                          </td>

                          <td className="py-3 font-mono text-slate-300">
                            {pay.scheduledDate}
                          </td>

                          <td className="py-3">
                            {pay.status === 'COMPLETED' ? (
                              <Badge variant="emerald">Liquidado</Badge>
                            ) : pay.status === 'PROCESSING' ? (
                              <Badge variant="cyan">Em Análise</Badge>
                            ) : pay.status === 'SCHEDULED' ? (
                              <Badge variant="purple">Agendado</Badge>
                            ) : (
                              <Badge variant="rose">{pay.status}</Badge>
                            )}
                          </td>

                          <td className="py-3 text-right">
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
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                LISTA GERAL DE REPASSES OPERACIONAIS
              </h3>
              <p className="text-xs text-slate-400">
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
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
              <tbody className="divide-y divide-slate-800/60">
                {payouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-white">
                      {pay.payoutNumber}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{pay.eventName}</div>
                      <div className="text-[11px] text-slate-500">Solicitado por: {pay.requestedBy}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(pay.amount)}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {pay.scheduledDate}
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-white font-medium text-[11px]">{pay.bankInfo?.bankName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Ag {pay.bankInfo?.agency} | CC {pay.bankInfo?.account}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {pay.status === 'COMPLETED' ? (
                        <Badge variant="emerald">Liquidado</Badge>
                      ) : pay.status === 'PROCESSING' ? (
                        <Badge variant="cyan">Em Análise</Badge>
                      ) : pay.status === 'SCHEDULED' ? (
                        <Badge variant="purple">Agendado</Badge>
                      ) : (
                        <Badge variant="rose">{pay.status}</Badge>
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
    </div>
  );
};
