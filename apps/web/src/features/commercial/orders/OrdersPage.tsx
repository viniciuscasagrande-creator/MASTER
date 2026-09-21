import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ShoppingBag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  FileText,
  ShieldCheck,
  Globe,
  Building,
  Store,
  UserCheck
} from 'lucide-react';
import { OrderDTO, OrderStatus } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useCoreData } from '../../../core/context/CoreDataContext';
import { OrderDossierModal } from './OrderDossierModal';

interface OrdersPageProps {
  onSelectOrder: (orderId: string) => void;
  onBackToDashboard: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onSelectOrder, onBackToDashboard }) => {
  const { events } = useCoreData();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  // Modal State for Dossier
  const [dossierOrder, setDossierOrder] = useState<OrderDTO | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.listOrders({
        search: searchTerm || undefined,
        status: selectedStatus,
        eventId: selectedEventId || undefined,
        salesChannelId: selectedChannel !== 'ALL' ? selectedChannel : undefined,
        page,
        pageSize: 15
      });
      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, selectedStatus, selectedEventId, selectedChannel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleExportCsv = () => {
    const exportUrl = CommercialApi.getExportOrdersUrl({
      search: searchTerm || undefined,
      status: selectedStatus,
      eventId: selectedEventId || undefined
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CENTRAL DE PEDIDOS OMNICHANNEL
            </h1>
            <Badge variant="orange" size="sm">
              Gestão de Transações
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consulta unificada de pedidos originados pelo Site Oficial, Bilheterias, PDVs e Portal do Produtor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={loadOrders}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código (PED-...), nome do comprador, CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Todos os Eventos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name || ev.title}
              </option>
            ))}
          </select>

          <Button type="submit" size="sm" variant="primary">
            Filtrar
          </Button>
        </form>

        {/* Channel Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider">
            Canal:
          </span>
          {[
            { id: 'ALL', label: 'Todos os Canais' },
            { id: 'SITE', label: 'Site Oficial' },
            { id: 'BOX_OFFICE', label: 'Bilheteria' },
            { id: 'PDV', label: 'PDV' },
            { id: 'DISK', label: 'Portal Produtor' }
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedChannel(ch.id);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                selectedChannel === ch.id
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/40">
          <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wider">
            Status:
          </span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'CONFIRMED', label: 'Confirmados' },
            { id: 'PENDING', label: 'Pendentes' },
            { id: 'PROCESSING', label: 'Em Processamento' },
            { id: 'CANCELLED', label: 'Cancelados' },
            { id: 'EXPIRED', label: 'Expirados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id as any);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Mostrando <strong className="text-white font-mono">{orders.length}</strong> de <strong className="text-white font-mono">{total}</strong> pedidos cadastrados
          </div>
          <div className="text-xs text-slate-400">
            Página <strong className="text-white font-mono">{page}</strong> de <strong className="text-white font-mono">{totalPages}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Código / Protocolo</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4 text-center">Ingressos</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Carregando pedidos do sistema comercial...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-orange-400">
                      <button
                        onClick={() => setDossierOrder(order)}
                        className="hover:underline text-left font-mono cursor-pointer"
                        title="Abrir dossiê operacional do pedido"
                      >
                        {order.publicCode || order.id}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {order.eventName || 'Evento Geral'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">
                        {order.buyerSnapshot?.name || 'Cliente Balcão'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {order.buyerSnapshot?.documentMasked || '***'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {order.salesChannelName || 'Site Oficial'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                      {order.totalTicketsCount || order.itemsCount || 1}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {order.totalAmount > 0 ? formatCurrency(order.totalAmount) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          order.status === 'CONFIRMED'
                            ? 'emerald'
                            : order.status === 'PENDING'
                            ? 'amber'
                            : order.status === 'PROCESSING'
                            ? 'cyan'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {order.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : order.status === 'PENDING'
                          ? 'Pendente'
                          : order.status === 'PROCESSING'
                          ? 'Processando'
                          : order.status === 'CANCELLED'
                          ? 'Cancelado'
                          : order.status === 'EXPIRED'
                          ? 'Expirado'
                          : order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDossierOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400 hover:bg-orange-500 hover:text-white transition-all cursor-pointer"
                          title="Abrir dossiê operacional completo"
                        >
                          <Eye className="h-3 w-3" />
                          Dossiê
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            icon={<ChevronLeft className="h-3.5 w-3.5" />}
          >
            Anterior
          </Button>

          <span className="text-xs text-slate-400">
            Página {page} de {totalPages}
          </span>

          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            icon={<ChevronRight className="h-3.5 w-3.5" />}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Order Operational Dossier Modal */}
      {dossierOrder && (
        <OrderDossierModal
          order={dossierOrder}
          isOpen={Boolean(dossierOrder)}
          onClose={() => setDossierOrder(null)}
          onOrderUpdated={loadOrders}
        />
      )}
    </div>
  );
};
