import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  Send,
  CreditCard,
  QrCode,
  Sparkles
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Can } from '../../core/auth/Can';
import { formatCurrency, formatCompactCurrency } from '../../shared/utils/formatters';

export const FinanceDashboard: React.FC = () => {
  const { events, payouts, producers, schedulePayout } = useCoreData();
  const { selectedProducerId, selectedEventId, setSelectedProducerId, setSelectedEventId } = useScope();

  const [timeRange, setTimeRange] = useState('hoje');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');

  // Interactive payout modal state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('50000');
  const [payoutProducerId, setPayoutProducerId] = useState(producers[0]?.id || '');
  const [payoutEventId, setPayoutEventId] = useState(events[0]?.id || '');

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    schedulePayout(payoutProducerId, payoutEventId, parseFloat(payoutAmount));
    setIsPayoutModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              FINANCEIRO
            </h1>
            <Badge variant="orange" size="sm">
              Módulo Financeiro Central
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de saldos por evento, contas de produtores, conciliação e repasses automáticos
          </p>
        </div>

        {/* Filters: Period & Event */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 mr-2">Período:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              <option value="hoje" className="bg-slate-900">Hoje ▾</option>
              <option value="7d" className="bg-slate-900">Últimos 7 dias</option>
              <option value="30d" className="bg-slate-900">Últimos 30 dias</option>
              <option value="mes" className="bg-slate-900">Mês Atual</option>
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 mr-2">Escopo:</span>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todos eventos ▾</option>
              {events.map(e => (
                <option key={e.id} value={e.id} className="bg-slate-900">
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <Can
            permission="financeiro.repasses.aprovar"
            fallback={
              <span className="text-[11px] text-slate-500 italic px-2 py-1 rounded border border-slate-800 bg-slate-900/50">
                Aprovação de repasses restrita à Diretoria
              </span>
            }
          >
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsPayoutModalOpen(true)}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Novo Repasse
            </Button>
          </Can>
        </div>
      </div>

      {/* 4 Main KPI Cards exactly as designed */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="VENDAS"
          value="R$ 1,84 mi"
          trend={{ value: '12,4%', isPositive: true }}
          icon={<DollarSign className="h-4 w-4 text-orange-400" />}
          badge="Volume Hoje"
          badgeVariant="orange"
        />

        <StatCard
          title="SALDO"
          value="R$ 912 mil"
          trend={{ value: '8,1%', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge="Disponível Líquido"
          badgeVariant="emerald"
        />

        <StatCard
          title="A RECEBER"
          value="R$ 421 mil"
          subtitle="37 eventos em ciclo de liquidação"
          icon={<CreditCard className="h-4 w-4 text-cyan-400" />}
          badge="Gateways"
          badgeVariant="cyan"
        />

        <StatCard
          title="REPASSES"
          value="R$ 387 mil"
          subtitle="18 hoje agendados via PIX/TED"
          icon={<QrCode className="h-4 w-4 text-purple-400" />}
          badge="Em Andamento"
          badgeVariant="purple"
        />
      </div>

      {/* Middle Row: Fluxo Financeiro (Chart) + Saldo por Evento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Fluxo Financeiro (Interactive visual timeline) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                FLUXO FINANCEIRO
              </h2>
              <p className="text-xs text-slate-400">
                Entradas brutas, taxas DiskIngressos e saídas de repasses por hora
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Entradas (Vendas)
              </span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="h-2 w-2 rounded-full bg-orange-400" /> Taxas Retidas
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="h-2 w-2 rounded-full bg-purple-400" /> Repasses Pagos
              </span>
            </div>
          </div>

          {/* Visual Bar Graph Simulation */}
          <div className="pt-6 pb-2 px-2">
            <div className="h-44 w-full flex items-end justify-between gap-3 border-b border-slate-800 pb-2">
              {[
                { time: '08h', sales: 40, fee: 8, payout: 0 },
                { time: '10h', sales: 65, fee: 12, payout: 20 },
                { time: '12h', sales: 88, fee: 16, payout: 40 },
                { time: '14h', sales: 95, fee: 19, payout: 60 },
                { time: '15h', sales: 78, fee: 15, payout: 35 },
                { time: '16h', sales: 110, fee: 22, payout: 90 },
                { time: 'Agora', sales: 125, fee: 25, payout: 100 },
              ].map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                    {/* Sales bar */}
                    <div
                      style={{ height: `${(item.sales / 125) * 100}%` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all group-hover:brightness-110"
                      title={`Vendas: ${item.sales}k`}
                    />
                    {/* Payout bar */}
                    <div
                      style={{ height: `${(item.payout / 125) * 100}%` }}
                      className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all group-hover:brightness-110"
                      title={`Repasses: ${item.payout}k`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>Pico operacional detectado às 16:15 com liquidação Cielo & Rede</span>
            <span className="text-emerald-400 font-semibold font-mono">Taxa de conversão: 98.6%</span>
          </div>
        </div>

        {/* Right: Saldo por Evento */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                SALDO POR EVENTO
              </h2>
              <span className="text-xs text-slate-400">Saldo Líquido</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Disponibilidade segregada para transferência ou repasse imediato
            </p>

            <div className="space-y-3.5">
              {[
                { name: 'Festival de Inverno 2026', code: 'Festival A', balance: 280000, color: 'from-orange-500 to-amber-500' },
                { name: 'Coldplay Experience World Tour', code: 'Show B', balance: 190000, color: 'from-emerald-500 to-teal-500' },
                { name: 'Stand-Up Comedy Stars: Noite de Gala', code: 'Evento C', balance: 122000, color: 'from-cyan-500 to-blue-500' },
                { name: 'Summit Nacional de Inovação & IA', code: 'Evento D', balance: 84000, color: 'from-purple-500 to-pink-500' },
              ].map((ev, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{ev.name}</div>
                      <div className="text-[10px] text-slate-500">{ev.code}</div>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {formatCompactCurrency(ev.balance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Segregado:</span>
            <span className="font-bold text-white font-mono">R$ 676.000,00</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Próximos Repasses + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Próximos Repasses Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                PRÓXIMOS REPASSES
              </h2>
              <p className="text-xs text-slate-400">Tabela operacional de liquidações bancárias</p>
            </div>
            <Badge variant="purple" size="sm">
              {payouts.length} programados
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3">Produtor & Evento</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Data Prevista</th>
                  <th className="pb-3">Conta Bancária</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-white">{pay.producerName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{pay.eventName}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-white">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      {pay.scheduledDate}
                    </td>
                    <td className="py-3 text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {pay.bankInfo}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={pay.status === 'completed' ? 'emerald' : pay.status === 'processing' ? 'amber' : 'purple'}
                        size="sm"
                      >
                        {pay.status === 'completed' ? 'Efetivado' : pay.status === 'processing' ? 'Em Processamento' : 'Agendado'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => alert(`Repasse de ${formatCurrency(pay.amount)} aprovado e enviado para processamento bancário CNAB.`)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Alertas de Conciliação */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                ALERTAS & CONCILIAÇÃO
              </h2>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Cruzamento automático de extratos de gateways vs pedidos Core
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">3 divergências encontradas</div>
                  <div className="text-[11px] text-amber-200/80 mt-0.5">
                    Diferença de centavos em taxas Cielo Lote #419.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs">
                <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-cyan-300">2 conciliações em processamento</div>
                  <div className="text-[11px] text-cyan-200/80 mt-0.5">
                    Arquivo CNAB 240 Banco Santander aguarda fechamento.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">41 conciliados com 100% paridade</div>
                  <div className="text-[11px] text-emerald-200/80 mt-0.5">
                    Nenhum lançamento órfão nas últimas 24 horas.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={() => alert('Rotina de auto-reconciliação acionada em Cielo, Rede e Santander PIX.')}
              className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Executar Auto-Conciliação Agora
            </button>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Agendar Novo Repasse</h3>
            <p className="text-xs text-slate-400 mb-4">
              Libera valor disponível da conta do produtor para transferência bancária
            </p>

            <form onSubmit={handleCreatePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Produtor</label>
                <select
                  value={payoutProducerId}
                  onChange={(e) => setPayoutProducerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                >
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Disponível: {formatCurrency(p.availableBalance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Evento de Origem</label>
                <select
                  value={payoutEventId}
                  onChange={(e) => setPayoutEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor do Repasse (R$)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsPayoutModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Confirmar Repasse
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
