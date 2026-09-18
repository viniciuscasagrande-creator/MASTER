import React from 'react';
import {
  Megaphone,
  TrendingUp,
  Target,
  DollarSign,
  MousePointerClick,
  Eye,
  ArrowUpRight,
  Share2
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

export const MarketingDashboard: React.FC = () => {
  const { marketingCampaigns } = useCoreData();

  const totalSpend = marketingCampaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalAttributed = marketingCampaigns.reduce((acc, c) => acc + c.attributedRevenue, 0);
  const totalConversions = marketingCampaigns.reduce((acc, c) => acc + c.conversions, 0);
  const overallRoas = (totalAttributed / (totalSpend || 1)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL DE MARKETING & ADS
            </h1>
            <Badge variant="orange" size="sm">
              Atribuição Multicanal
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Performance consolidada de campanhas Meta, Google, TikTok, Spotify e cupons por evento
          </p>
        </div>

        <Badge variant="emerald" size="sm" dot>
          Pixels Ativos & Conversões Conectadas
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ROAS MÉDIO GLOBAL"
          value={`${overallRoas}x`}
          trend={{ value: 'R$ 18,20 de retorno para cada R$ 1 investido', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge="Excelente"
          badgeVariant="emerald"
        />

        <StatCard
          title="RECEITA ATRIBUÍDA"
          value={formatCurrency(totalAttributed)}
          subtitle="Vendas rastreadas via Pixel e UTM"
          icon={<DollarSign className="h-4 w-4 text-orange-400" />}
          badge="Bilheteria"
          badgeVariant="orange"
        />

        <StatCard
          title="INVESTIMENTO EM MÍDIA"
          value={formatCurrency(totalSpend)}
          subtitle="Meta + Google + TikTok + Spotify"
          icon={<Target className="h-4 w-4 text-cyan-400" />}
          badge="Ad Spend"
          badgeVariant="cyan"
        />

        <StatCard
          title="CONVERSÕES CONFIRMADAS"
          value={formatNumber(totalConversions)}
          trend={{ value: 'CPA Médio: R$ 17,80', isPositive: true }}
          icon={<MousePointerClick className="h-4 w-4 text-purple-400" />}
          badge="Pedidos Pagos"
          badgeVariant="purple"
        />
      </div>

      {/* Channels Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { name: 'Meta Ads (Insta/FB)', spend: 26950, revenue: 384200, roas: '14.2x', share: '45%' },
          { name: 'Google Ads (Search/YT)', spend: 29000, revenue: 882000, roas: '30.4x', share: '35%' },
          { name: 'TikTok Ads (Viral/Shorts)', spend: 8500, revenue: 98600, roas: '11.6x', share: '12%' },
          { name: 'Spotify Ads (Podcasts)', spend: 3200, revenue: 21750, roas: '6.8x', share: '8%' },
        ].map((channel, idx) => (
          <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>{channel.name}</span>
              <span className="text-orange-400 font-mono">{channel.roas}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <span>Gasto: {formatCurrency(channel.spend)}</span>
              <span className="text-emerald-400">{formatCurrency(channel.revenue)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Campaigns Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white mb-4">Campanhas Ativas & Desempenho por Evento</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Campanha & Plataforma</th>
                <th className="pb-3">Evento Vinculado</th>
                <th className="pb-3">Investido</th>
                <th className="pb-3">Impressões / Cliques</th>
                <th className="pb-3">Conversões</th>
                <th className="pb-3">Receita Atribuída</th>
                <th className="pb-3">ROAS</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {marketingCampaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <div className="font-bold text-white font-sans">{c.campaignName}</div>
                    <div className="text-[10px] text-orange-400 uppercase font-mono">{c.platform}</div>
                  </td>
                  <td className="py-3 text-slate-300 font-sans truncate max-w-[180px]">
                    {c.eventName}
                  </td>
                  <td className="py-3 font-bold text-slate-200">
                    {formatCurrency(c.spend)}
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {formatNumber(c.impressions)} imp. • {formatNumber(c.clicks)} cliq.
                  </td>
                  <td className="py-3 font-bold text-white">
                    {formatNumber(c.conversions)}
                  </td>
                  <td className="py-3 font-bold text-emerald-400">
                    {formatCurrency(c.attributedRevenue)}
                  </td>
                  <td className="py-3 text-orange-400 font-bold">
                    {c.roas}x
                  </td>
                  <td className="py-3">
                    <Badge variant="emerald" size="sm">
                      {c.status.toUpperCase()}
                    </Badge>
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
