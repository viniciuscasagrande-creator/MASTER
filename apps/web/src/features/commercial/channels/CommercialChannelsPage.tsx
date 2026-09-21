import React, { useState } from 'react';
import {
  Share2,
  Globe,
  Building,
  Store,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Ticket,
  Sliders,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency } from '../../../shared/utils/formatters';

interface SalesChannelSummary {
  id: string;
  code: 'SITE' | 'BOX_OFFICE' | 'PDV' | 'DISK' | 'PARTNER';
  name: string;
  description: string;
  status: 'active' | 'maintenance' | 'paused';
  totalSales: number;
  ticketsSold: number;
  sharePercentage: number;
  allowedPayments: string[];
  commissionRatePercent: number;
}

const DEFAULT_CHANNELS: SalesChannelSummary[] = [
  {
    id: 'chan-1',
    code: 'SITE',
    name: 'Site Oficial DiskIngressos',
    description: 'E-commerce oficial com checkout responsivo, PIX instantâneo e parcelamento via cartão de crédito.',
    status: 'active',
    totalSales: 845000,
    ticketsSold: 7200,
    sharePercentage: 68.5,
    allowedPayments: ['PIX', 'Crédito', 'Boleto'],
    commissionRatePercent: 10.0
  },
  {
    id: 'chan-2',
    code: 'BOX_OFFICE',
    name: 'Bilheteria Física do Local',
    description: 'Ponto presencial na entrada do evento para venda de última hora e troca de vouchers.',
    status: 'active',
    totalSales: 215000,
    ticketsSold: 1850,
    sharePercentage: 17.4,
    allowedPayments: ['Dinheiro', 'Débito', 'Crédito', 'PIX'],
    commissionRatePercent: 5.0
  },
  {
    id: 'chan-3',
    code: 'PDV',
    name: 'Rede de PDVs Parceiros',
    description: 'Quiosques credenciados em shoppings, lojas de conveniência e bilheterias conveniadas.',
    status: 'active',
    totalSales: 118000,
    ticketsSold: 980,
    sharePercentage: 9.6,
    allowedPayments: ['Débito', 'Crédito', 'Dinheiro'],
    commissionRatePercent: 7.5
  },
  {
    id: 'chan-4',
    code: 'DISK',
    name: 'Portal do Produtor (Emissão Direta)',
    description: 'Emissões manuais, cotas de patrocinadores, permutas e cortesias geradas diretamente pela produtora.',
    status: 'active',
    totalSales: 55000,
    ticketsSold: 450,
    sharePercentage: 4.5,
    allowedPayments: ['Faturamento Direto', 'Cortesia'],
    commissionRatePercent: 0.0
  }
];

export const CommercialChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<SalesChannelSummary[]>(DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannelSummary | null>(null);

  const totalVolume = channels.reduce((sum, c) => sum + c.totalSales, 0);
  const totalTickets = channels.reduce((sum, c) => sum + c.ticketsSold, 0);

  const getChannelIcon = (code: string) => {
    switch (code) {
      case 'SITE':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'BOX_OFFICE':
        return <Building className="w-5 h-5 text-amber-400" />;
      case 'PDV':
        return <Store className="w-5 h-5 text-emerald-400" />;
      case 'DISK':
        return <UserCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <Share2 className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CANAIS DE VENDA OMNICHANNEL
            </h1>
            <Badge variant="orange" size="sm">
              Gestão de Canais
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distribuição de ingressos, controle de cotas e faturamento por canal de comercialização
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Volume Total Comercializado
          </span>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrency(totalVolume)}
          </div>
          <p className="text-[11px] text-slate-400">Somatório de todos os canais ativos</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ingressos Distribuídos
          </span>
          <div className="text-xl font-bold font-mono text-orange-400">
            {totalTickets.toLocaleString('pt-BR')}
          </div>
          <p className="text-[11px] text-slate-400">Total de entradas confirmadas</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Canais Ativos Homologados
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {channels.filter(c => c.status === 'active').length} de {channels.length}
          </div>
          <p className="text-[11px] text-slate-400">Canais operando sem restrições</p>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((chan) => (
          <div
            key={chan.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {getChannelIcon(chan.code)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{chan.name}</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{chan.code}</span>
                  </div>
                </div>
                <Badge variant={chan.status === 'active' ? 'emerald' : 'amber'} size="sm">
                  {chan.status === 'active' ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">
                {chan.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Volume</span>
                <strong className="text-white font-mono">{formatCurrency(chan.totalSales)}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Ingressos</span>
                <strong className="text-white font-mono">{chan.ticketsSold.toLocaleString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Participação</span>
                <strong className="text-orange-400 font-mono">{chan.sharePercentage}%</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Pagamentos:</span>
                {chan.allowedPayments.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 font-mono">
                    {p}
                  </span>
                ))}
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Taxa: <strong>{chan.commissionRatePercent}%</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
