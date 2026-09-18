import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  Mail,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export const RemarketingDashboard: React.FC = () => {
  const { abandonedCarts } = useCoreData();

  const totalAbandoned = abandonedCarts.length;
  const recoveredList = abandonedCarts.filter(c => c.status === 'recovered');
  const totalRecoveredValue = recoveredList.reduce((acc, c) => acc + c.totalValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL DE REMARKETING & RECUPERAÇÃO
            </h1>
            <Badge variant="orange" size="sm">
              Automações WhatsApp & E-mail
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recuperação inteligente de carrinhos abandonados, réguas de engajamento e reativação de compradores
          </p>
        </div>

        <Badge variant="emerald" size="sm" dot>
          Jornada WhatsApp 15m / 2h / 24h Ativa
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TAXA DE RECUPERAÇÃO"
          value="24.8%"
          trend={{ value: '1 em cada 4 carrinhos recuperados', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge="Alta Conversão"
          badgeVariant="emerald"
        />

        <StatCard
          title="RECEITA RECUPERADA"
          value={formatCurrency(142800)}
          subtitle="Valor salvo pelas réguas ativas"
          icon={<DollarSign className="h-4 w-4 text-orange-400" />}
          badge="Incremental"
          badgeVariant="orange"
        />

        <StatCard
          title="MENSAGENS WHATSAPP"
          value="1.840 enviadas"
          subtitle="92% taxa de abertura em 10min"
          icon={<MessageCircle className="h-4 w-4 text-cyan-400" />}
          badge="Taxa 92%"
          badgeVariant="cyan"
        />

        <StatCard
          title="CARRINHOS EM JORNADA"
          value={abandonedCarts.filter(c => c.status === 'in_journey').length.toString()}
          subtitle="Aguardando disparo da régua"
          icon={<ShoppingCart className="h-4 w-4 text-purple-400" />}
          badge="Fila Ativa"
          badgeVariant="purple"
        />
      </div>

      {/* Abandoned Carts List */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Carrinhos Recentes & Status da Régua</h2>
            <p className="text-xs text-slate-400">Disparo automatizado de links com retenção de assento</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Comprador & Contato</th>
                <th className="pb-3">Evento & Ingressos</th>
                <th className="pb-3">Valor Abandonado</th>
                <th className="pb-3">Horário Abandono</th>
                <th className="pb-3">Canal da Régua</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {abandonedCarts.map((cart) => (
                <tr key={cart.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-white">{cart.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{cart.customerPhone}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-slate-200 truncate max-w-[200px]">{cart.eventName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cart.ticketCount} ingressos reservados</div>
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {formatCurrency(cart.totalValue)}
                  </td>
                  <td className="py-3 text-[11px] text-slate-400 font-mono">
                    {formatDateTime(cart.abandonedAt)}
                  </td>
                  <td className="py-3 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp API
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={cart.status === 'recovered' ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {cart.status === 'recovered' ? 'Recuperado com Sucesso' : 'Em Andamento'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => alert(`Link de checkout direto reenviado via WhatsApp para ${cart.customerPhone}`)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Disparar Agora
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
