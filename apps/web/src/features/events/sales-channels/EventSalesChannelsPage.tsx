import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Store,
  Users,
  Layers,
  Settings2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Building2,
  AlertCircle
} from 'lucide-react';
import {
  EventSalesChannelDTO,
  SalesPointDTO,
  SalesPartnerDTO
} from '@shared/types/index';
import {
  fetchEventChannels,
  toggleChannel,
  fetchSalesPoints,
  fetchSalesPartners
} from '../api/sales-channels.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';
import { ConfigureSalesChannelModal } from './ConfigureSalesChannelModal';

interface EventSalesChannelsPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToInventory?: () => void;
  onNavigateToSessions?: () => void;
}

export const EventSalesChannelsPage: React.FC<EventSalesChannelsPageProps> = ({
  eventId,
  eventName,
  onNavigateToInventory,
  onNavigateToSessions
}) => {
  const [channels, setChannels] = useState<EventSalesChannelDTO[]>([]);
  const [salesPoints, setSalesPoints] = useState<SalesPointDTO[]>([]);
  const [partners, setPartners] = useState<SalesPartnerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'pos' | 'partners'>('channels');

  // Modal
  const [selectedChannel, setSelectedChannel] = useState<EventSalesChannelDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chData, spData, partData] = await Promise.all([
        fetchEventChannels(eventId),
        fetchSalesPoints(eventId),
        fetchSalesPartners(eventId)
      ]);
      setChannels(chData || []);
      setSalesPoints(spData || []);
      setPartners(partData || []);
    } catch (err) {
      console.error('Erro ao carregar canais e pontos de venda:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleChannel = async (salesChannelId: string, currentEnabled: boolean) => {
    try {
      await toggleChannel(eventId, salesChannelId, !currentEnabled);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar canal');
    }
  };

  // Métricas reais calculadas dos modelos oficiais
  const activeChannelsCount = channels.filter(c => c.enabled).length;
  const totalAllocated = channels.reduce((acc, c) => {
    return acc + (c.allocations || []).reduce((sum, a) => sum + (a.quantityLimit || 0), 0);
  }, 0);
  const totalConsumed = channels.reduce((acc, c) => {
    return acc + (c.allocations || []).reduce((sum, a) => sum + (a.quantityConsumed || 0), 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Canais de Venda & Distribuição</h1>
            <Badge variant="info">Fase 1.2.7</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distribuição em múltiplos pontos sem criar estoque paralelo: site oficial, bilheterias físicas, PDVs e parceiros consomem do mesmo inventário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Canais Habilitados"
          value={`${activeChannelsCount} / ${channels.length}`}
          subtitle="Canais autorizados a emitir"
          icon={<Globe className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          title="Ingressos Alocados"
          value={formatNumber(totalAllocated)}
          subtitle={`${formatNumber(totalConsumed)} emitidos via canais`}
          icon={<Layers className="h-5 w-5 text-cyan-400" />}
        />
        <StatCard
          title="Pontos de Venda Físicos"
          value={formatNumber(salesPoints.length)}
          subtitle="Bilheterias e totens presenciais"
          icon={<Store className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          title="Parceiros Comerciais"
          value={formatNumber(partners.length)}
          subtitle="Promoters e afiliados autorizados"
          icon={<Users className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* Abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'channels'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Canais Oficiais ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'pos'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Bilheterias & PDVs ({salesPoints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'partners'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Parceiros & Promoters ({partners.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Canais Oficiais */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(channel => {
            const sc = channel.salesChannel;
            const channelAllocations = channel.allocations || [];
            const channelTotalAllocated = channelAllocations.reduce((sum, a) => sum + a.quantityLimit, 0);

            return (
              <div
                key={channel.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  channel.enabled
                    ? 'border-slate-800 bg-slate-900/80 shadow-lg'
                    : 'border-slate-800/50 bg-slate-950/40 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                          channel.enabled
                            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                            : 'border-slate-700 bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{sc?.name || 'Canal'}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {sc?.code || 'CANAL'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 capitalize">
                          Tipo: {sc?.type ? sc.type.toLowerCase().replace('_', ' ') : 'Oficial'} • Escopo:{' '}
                          {sc?.scope === 'GLOBAL' ? 'Global Disk Ingressos' : 'Específico do Produtor'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleChannel(channel.salesChannelId, channel.enabled)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        channel.enabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {channel.enabled ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Inativo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Restrições de Escopo */}
                  <div className="grid grid-cols-2 gap-2 my-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Sessões Liberadas:</span>
                      <span className="font-semibold text-slate-200">
                        {channel.sessionIds && channel.sessionIds.length > 0
                          ? `${channel.sessionIds.length} selecionada(s)`
                          : 'Todas as sessões'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Setores Autorizados:</span>
                      <span className="font-semibold text-slate-200">
                        {channel.sectionIds && channel.sectionIds.length > 0
                          ? `${channel.sectionIds.length} selecionado(s)`
                          : 'Todos os setores'}
                      </span>
                    </div>
                  </div>

                  {/* Cotas e Alocações no Pool */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Teto Alocado em Pools:</span>
                      <span className="font-bold text-white">
                        {channelTotalAllocated > 0 ? `${formatNumber(channelTotalAllocated)} un.` : 'Sem teto (Ilimitado no Pool)'}
                      </span>
                    </div>
                    {channelAllocations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {channelAllocations.map(a => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            <span className="text-slate-500">{a.poolSectionName}:</span>
                            <strong className="text-cyan-400">{formatNumber(a.quantityLimit)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Anti-overselling ativo</span>
                  <button
                    onClick={() => {
                      setSelectedChannel(channel);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Configurar Escopo & Cotas</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conteúdo da Aba 2: PDVs Físicos */}
      {activeTab === 'pos' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Pontos de Venda e Bilheterias Físicas</h2>
              <p className="text-xs text-slate-400">Terminais e caixas autorizados a emitir ingressos no local</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesPoints.map(sp => (
              <div key={sp.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{sp.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>{sp.address || 'Endereço da Praça'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={sp.active ? 'success' : 'default'}>{sp.active ? 'Operando' : 'Inativo'}</Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Tipo: {sp.type === 'BOX_OFFICE' ? 'Bilheteria Oficial da Arena' : 'Loja / PDV Parceiro'}</span>
                  <span>
                    Terminais ativos: <strong className="text-white">{sp.terminalsCount || 0}</strong>
                  </span>
                </div>
              </div>
            ))}

            {salesPoints.length === 0 && (
              <div className="col-span-2 p-8 text-center text-xs text-slate-500">
                Nenhum ponto de venda físico cadastrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Parceiros Comerciais */}
      {activeTab === 'partners' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Parceiros, Agências & Promoters</h2>
              <p className="text-xs text-slate-400">Distribuição externa com rastreabilidade por código de parceiro</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Parceiro / Razão Social</th>
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{p.document}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.type}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{p.email || '—'}</div>
                      <div className="text-[11px] text-slate-500">{p.phone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {p.status === 'ACTIVE' ? 'Ativo' : p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum parceiro comercial vinculado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Escopo e Alocação */}
      {selectedChannel && (
        <ConfigureSalesChannelModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedChannel(null);
          }}
          eventId={eventId}
          channel={selectedChannel}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
