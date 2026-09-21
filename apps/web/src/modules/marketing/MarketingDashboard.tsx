import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  TrendingUp,
  Target,
  DollarSign,
  MousePointerClick,
  Eye,
  Share2,
  Tag,
  Link2,
  Users,
  Radio,
  Plus,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
import { SectionCard } from '../../shared/components/SectionCard';
import { ChartCard } from '../../shared/components/ChartCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatNumber, formatDate } from '../../shared/utils/formatters';

interface MarketingDashboardProps {
  initialSubItem?: string;
  onNavigate?: (module: string, sub?: string) => void;
}

export interface CouponUI {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number;
  usesCount: number;
  eventName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  expiresAt: string;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({
  initialSubItem = 'marketing-dashboard',
  onNavigate
}) => {
  const { marketingCampaigns } = useCoreData();
  const [activeTab, setActiveTab] = useState<string>(initialSubItem || 'marketing-dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // UTM generator states
  const [utmUrl, setUtmUrl] = useState('https://diskingressos.com.br/evento/vintage-culture');
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('stories');
  const [utmCampaign, setUtmCampaign] = useState('lote_1_promo');

  // Coupons with guaranteed safe values (no NaN / undefined)
  const [coupons, setCoupons] = useState<CouponUI[]>([
    {
      id: 'cup_1',
      code: 'VIPPROMO10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 100,
      usesCount: 42,
      eventName: 'Festival de Verão 2026',
      status: 'ACTIVE',
      expiresAt: '2026-10-31'
    },
    {
      id: 'cup_2',
      code: 'PRIMEIRACOMPRA20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxUses: 200,
      usesCount: 198,
      eventName: 'Vintage Culture Open Air',
      status: 'ACTIVE',
      expiresAt: '2026-11-15'
    },
    {
      id: 'cup_3',
      code: 'OFF50REAIS',
      discountType: 'FIXED',
      discountValue: 50,
      maxUses: 50,
      usesCount: 50,
      eventName: 'Teatro Musical Broadway',
      status: 'DEPLETED',
      expiresAt: '2026-09-20'
    }
  ]);

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(initialSubItem);
    }
  }, [initialSubItem]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.('marketing', tabId);
  };

  const totalSpend = marketingCampaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalAttributed = marketingCampaigns.reduce((acc, c) => acc + (c.attributedRevenue || 0), 0);
  const totalConversions = marketingCampaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
  const overallRoas = totalSpend > 0 ? (totalAttributed / totalSpend).toFixed(1) : '0.0';

  const generatedUtm = `${utmUrl}?utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(generatedUtm);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const channelsData = [
    { name: 'Meta Ads (Instagram & Facebook)', spend: 26950, revenue: 384200, roas: '14.2x', share: 45, color: 'bg-blue-500' },
    { name: 'Google Ads (Search & YouTube)', spend: 29000, revenue: 882000, roas: '30.4x', share: 35, color: 'bg-emerald-500' },
    { name: 'TikTok Ads (Viral & Shorts)', spend: 8500, revenue: 98600, roas: '11.6x', share: 12, color: 'bg-purple-500' },
    { name: 'Spotify Ads (Podcasts & Audio)', spend: 3200, revenue: 21750, roas: '6.8x', share: 8, color: 'bg-amber-500' }
  ];

  const campaignColumns: Column<typeof marketingCampaigns[0]>[] = [
    {
      header: 'Campanha & Plataforma',
      accessor: (c) => (
        <div>
          <div className="font-bold text-slate-900">{c.campaignName}</div>
          <div className="text-[11px] text-orange-600 font-bold uppercase">{c.platform}</div>
        </div>
      )
    },
    {
      header: 'Evento Vinculado',
      accessor: (c) => <span className="font-medium text-slate-700">{c.eventName}</span>
    },
    {
      header: 'Investimento',
      align: 'right',
      accessor: (c) => <span className="font-mono font-bold text-slate-900">{formatCurrency(c.spend)}</span>
    },
    {
      header: 'Impressões / Cliques',
      accessor: (c) => (
        <span className="font-mono text-slate-600 text-xs">
          {formatNumber(c.impressions)} imp. • {formatNumber(c.clicks)} cliq.
        </span>
      )
    },
    {
      header: 'Conversões',
      align: 'right',
      accessor: (c) => <span className="font-mono font-bold text-slate-900">{formatNumber(c.conversions)}</span>
    },
    {
      header: 'Receita Atribuída',
      align: 'right',
      accessor: (c) => <span className="font-mono font-bold text-emerald-700">{formatCurrency(c.attributedRevenue)}</span>
    },
    {
      header: 'ROAS',
      align: 'right',
      accessor: (c) => <span className="font-mono font-bold text-orange-600">{c.roas}x</span>
    },
    {
      header: 'Status',
      align: 'right',
      accessor: (c) => <StatusBadge variant="success" label={c.status.toUpperCase()} />
    }
  ];

  const couponColumns: Column<CouponUI>[] = [
    {
      header: 'Código do Cupom',
      accessor: (cup) => <span className="font-mono font-bold text-orange-600 text-sm">{cup.code}</span>
    },
    {
      header: 'Desconto',
      accessor: (cup) => (
        <span className="font-bold text-slate-900">
          {cup.discountType === 'PERCENTAGE' ? `${cup.discountValue}% OFF` : `${formatCurrency(cup.discountValue)} OFF`}
        </span>
      )
    },
    {
      header: 'Evento Vinculado',
      accessor: (cup) => <span className="text-slate-700 font-medium">{cup.eventName}</span>
    },
    {
      header: 'Utilizações / Limite',
      accessor: (cup) => {
        const percentage = Math.min(100, Math.round((cup.usesCount / (cup.maxUses || 1)) * 100));
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-mono mb-1">
              <span>{cup.usesCount} / {cup.maxUses}</span>
              <span className="font-bold text-slate-700">{percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Validade',
      accessor: (cup) => <span className="font-mono text-slate-600">{formatDate(cup.expiresAt)}</span>
    },
    {
      header: 'Status',
      align: 'right',
      accessor: (cup) => {
        if (cup.status === 'ACTIVE') return <StatusBadge variant="success" label="Ativo" />;
        if (cup.status === 'DEPLETED') return <StatusBadge variant="warning" label="Esgotado" />;
        return <StatusBadge variant="neutral" label="Expirado" />;
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <PageHeader
        title={
          activeTab === 'marketing-campaigns' ? 'Campanhas Multicanais & ROAS' :
          activeTab === 'marketing-ready-campaigns' ? 'Modelos de Campanhas Prontas' :
          activeTab === 'marketing-status' ? 'Status em Tempo Real & Monitoramento' :
          activeTab === 'marketing-whatsapp' ? 'WhatsApp Marketing & Disparos' :
          activeTab === 'marketing-email' ? 'E-mail Marketing & Newsletters' :
          activeTab === 'marketing-automations' ? 'Automações & Jornadas de Aquisição' :
          activeTab === 'marketing-coupons' ? 'Cupons & Descontos Promocionais' :
          activeTab === 'marketing-utm' ? 'Central UTM & Rastreabilidade de Links' :
          activeTab === 'marketing-affiliates' ? 'Afiliados & Divulgadores' :
          activeTab === 'marketing-pixels' ? 'Pixels & Conversões (Meta, Google, TikTok)' :
          activeTab === 'marketing-spotify' ? 'Spotify Ads & Campanhas de Áudio' :
          'Painel de Marketing & Mídia'
        }
        description="Performance consolidada de campanhas Meta, Google, TikTok, Spotify e cupons por evento"
        badge={<StatusBadge variant="success" label="Pixels Ativos & Sincronizados" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTabChange('marketing-utm')}
              icon={<Link2 className="h-3.5 w-3.5 text-orange-600" />}
            >
              Criar Link UTM
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleTabChange('marketing-coupons')}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Novo Cupom
            </Button>
          </div>
        }
      />

      {/* Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'marketing-dashboard', label: 'Painel Geral' },
          { id: 'marketing-campaigns', label: 'Campanhas Multicanais' },
          { id: 'marketing-ready-campaigns', label: 'Campanhas Prontas' },
          { id: 'marketing-status', label: 'Status Tempo Real' },
          { id: 'marketing-whatsapp', label: 'WhatsApp' },
          { id: 'marketing-email', label: 'E-mail' },
          { id: 'marketing-automations', label: 'Automações' },
          { id: 'marketing-coupons', label: `Cupons (${coupons.length})` },
          { id: 'marketing-utm', label: 'Central UTM' },
          { id: 'marketing-affiliates', label: 'Afiliados' },
          { id: 'marketing-pixels', label: 'Pixels' },
          { id: 'marketing-spotify', label: 'Spotify Ads' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-xs ${
              activeTab === t.id
                ? 'bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAINEL GERAL */}
      {activeTab === 'marketing-dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards (120-140px Height) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="ROAS MÉDIO GLOBAL"
              value={`${overallRoas}x`}
              trend={{ value: 'R$ 18,20 de retorno para cada R$ 1', isPositive: true }}
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              badge="Excelente"
              badgeVariant="emerald"
            />

            <MetricCard
              title="RECEITA ATRIBUÍDA"
              value={formatCurrency(totalAttributed)}
              subtitle="Vendas rastreadas via Pixel e UTM"
              icon={<DollarSign className="h-4 w-4 text-orange-600" />}
              badge="Bilheteria"
              badgeVariant="orange"
            />

            <MetricCard
              title="INVESTIMENTO EM MÍDIA"
              value={formatCurrency(totalSpend)}
              subtitle="Meta + Google + TikTok + Spotify"
              icon={<Target className="h-4 w-4 text-blue-600" />}
              badge="Ad Spend"
              badgeVariant="cyan"
            />

            <MetricCard
              title="CONVERSÕES CONFIRMADAS"
              value={formatNumber(totalConversions)}
              trend={{ value: 'CPA Médio: R$ 17,80', isPositive: true }}
              icon={<MousePointerClick className="h-4 w-4 text-purple-600" />}
              badge="Pedidos Pagos"
              badgeVariant="purple"
            />
          </div>

          {/* ChartCard for Channel Performance Breakdown */}
          <ChartCard
            title="DESEMPENHO & DISTRIBUIÇÃO POR CANAL DE AQUISIÇÃO"
            subtitle="Participação no faturamento, investimento direto e multiplicador de ROAS"
            badge={<StatusBadge variant="success" label="4 Canais Conectados" />}
            heightClass="h-[340px]"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full h-full items-center">
              {channelsData.map((channel, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs dark:border-slate-700/80 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span className="truncate pr-1">{channel.name.split(' ')[0]} Ads</span>
                    <span className="text-[#FF7A00] font-mono font-bold">{channel.roas}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Investido:</span>
                      <span className="text-slate-700 font-semibold dark:text-slate-200">{formatCurrency(channel.spend)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Receita:</span>
                      <span className="text-emerald-600 font-bold dark:text-emerald-400">{formatCurrency(channel.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className={`h-full ${channel.color} rounded-full`} style={{ width: `${channel.share * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Active Campaigns Table */}
          <SectionCard
            title="CAMPANHAS ATIVAS & DESEMPENHO POR EVENTO"
            description="Métricas de tráfego pago, impressões, cliques e conversões confirmadas pelo core de vendas"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTabChange('marketing-campaigns')}
              >
                Ver Todas as Campanhas
              </Button>
            }
          >
            <DataTable
              columns={campaignColumns}
              data={marketingCampaigns}
              keyExtractor={(c) => c.id}
            />
          </SectionCard>
        </div>
      )}

      {/* TAB 2: CAMPANHAS MULTICANAIS */}
      {activeTab === 'marketing-campaigns' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por campanha, evento ou plataforma..."
            hasActiveFilters={Boolean(searchTerm)}
            onClearFilters={() => setSearchTerm('')}
          />
          <DataTable
            columns={campaignColumns}
            data={marketingCampaigns.filter(c =>
              !searchTerm.trim() ||
              c.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.platform.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyExtractor={(c) => c.id}
          />
        </div>
      )}

      {/* TAB: CUPONS & DESCONTOS (Com cálculo 100% seguro) */}
      {activeTab === 'marketing-coupons' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar código do cupom ou evento..."
            hasActiveFilters={Boolean(searchTerm)}
            onClearFilters={() => setSearchTerm('')}
            actions={
              <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                Novo Cupom
              </Button>
            }
          />
          <DataTable
            columns={couponColumns}
            data={coupons.filter(cup =>
              !searchTerm.trim() ||
              cup.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              cup.eventName.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            keyExtractor={(cup) => cup.id}
          />
        </div>
      )}

      {/* TAB: CENTRAL UTM & LINKS */}
      {activeTab === 'marketing-utm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            title="GERADOR DE PARÂMETROS UTM"
            description="Crie links parametrizados para rastrear a origem precisa das vendas por anúncio, influenciador ou canal"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">URL Base do Evento</label>
                <input
                  type="text"
                  value={utmUrl}
                  onChange={(e) => setUtmUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Origem (utm_source)</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="instagram, google..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mídia (utm_medium)</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="stories, cpc, bio..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Campanha (utm_campaign)</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="virada_lote_2..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="LINK RASTREADO FINAL"
            description="Copie o link gerado para utilizar nos criativos ou enviar a influenciadores"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 break-all font-mono text-[11px] text-slate-800">
                {generatedUtm}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {copiedLink ? '✓ Copiado para a área de transferência!' : 'Clique para copiar o link com tags'}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCopyUtm}
                  icon={copiedLink ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copiedLink ? 'Copiado!' : 'Copiar Link'}
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* OTHER SUB-TABS (Campanhas Prontas, Pixels, Spotify, Afiliados, etc.) */}
      {(activeTab === 'marketing-ready-campaigns' ||
        activeTab === 'marketing-status' ||
        activeTab === 'marketing-whatsapp' ||
        activeTab === 'marketing-email' ||
        activeTab === 'marketing-automations' ||
        activeTab === 'marketing-affiliates' ||
        activeTab === 'marketing-pixels' ||
        activeTab === 'marketing-spotify') && (
        <SectionCard
          title={
            activeTab === 'marketing-ready-campaigns' ? 'Modelos de Campanhas Prontas para Eventos' :
            activeTab === 'marketing-status' ? 'Status e Disparos em Tempo Real' :
            activeTab === 'marketing-whatsapp' ? 'Disparos e Listas de Transmissão WhatsApp' :
            activeTab === 'marketing-email' ? 'Réguas de E-mail Marketing e Newsletters' :
            activeTab === 'marketing-automations' ? 'Automações e Gatilhos por Virada de Lote' :
            activeTab === 'marketing-affiliates' ? 'Gestão e Comissões de Afiliados' :
            activeTab === 'marketing-pixels' ? 'Pixels de Conversão Conectados' : 'Spotify Audio Ads'
          }
          description="Ferramentas corporativas de aquisição e conversão para bilheteria"
          badge={<StatusBadge variant="success" label="Operacional" />}
        >
          <div className="p-6 text-center text-xs text-slate-500">
            <Sparkles className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Ferramenta Integrada & Operacional</p>
            <p className="mt-1 max-w-md mx-auto text-slate-500">
              Todos os canais de marketing estão sincronizados aos eventos ativos do produtor e prontos para distribuição.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
