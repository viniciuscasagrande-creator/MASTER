import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RotateCcw,
  Sparkles,
  Send,
  Phone,
  Mail
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

interface SacDashboardProps {
  onNavigateToRefunds?: () => void;
}

export const SacDashboard: React.FC<SacDashboardProps> = ({ onNavigateToRefunds }) => {
  const { orders, customers, sacTickets, createRefundRequest } = useCoreData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(orders[0] || null);
  const [refundReason, setRefundReason] = useState<'arrependimento_7d' | 'duplicidade' | 'evento_cancelado'>('arrependimento_7d');
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Search filter
  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerCpf.includes(searchQuery) ||
    o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenRefund = (order: any) => {
    setSelectedOrder(order);
    setRefundModalOpen(true);
  };

  const handleConfirmRefundRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    createRefundRequest({
      orderId: selectedOrder.id,
      reason: refundReason,
      description: `Abertura de estorno realizada via Central de Atendimento SAC pelo operador.`,
      type: 'total',
      requesterName: 'Atendente SAC'
    });
    setRefundModalOpen(false);
    alert(`Solicitação de estorno enviada para a fila de aprovação do módulo Estorno!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              ATENDIMENTO SAC & CENTRAL DE CONSULTA
            </h1>
            <Badge variant="cyan" size="sm">
              Visão 360° do Comprador
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consulta centralizada de pedidos, validação de titularidade de ingressos e gestão de protocolos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm" dot>
            Fila Normal • 3 atendentes ativos
          </Badge>
        </div>
      </div>

      {/* SAC KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="TEMPO MÉDIO DE RESPOSTA"
          value="3m 12s"
          trend={{ value: '45s mais rápido', isPositive: true }}
          icon={<Clock className="h-4 w-4 text-cyan-400" />}
          badge="SLA 98.4%"
          badgeVariant="emerald"
        />

        <StatCard
          title="CSAT / SATISFAÇÃO"
          value="4.9 / 5.0"
          subtitle="94 avaliações hoje"
          icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          badge="Excelente"
          badgeVariant="emerald"
        />

        <StatCard
          title="CHAMADOS HOJE"
          value="142"
          subtitle="128 resolvidos no 1º contato"
          icon={<MessageSquare className="h-4 w-4 text-orange-400" />}
          badge="WhatsApp 78%"
          badgeVariant="orange"
        />

        <StatCard
          title="PEDIDOS CONSULTADOS"
          value={orders.length.toString()}
          subtitle="Base em tempo real sem duplicidade"
          icon={<Ticket className="h-4 w-4 text-emerald-400" />}
          badge="100% Sincronizado"
          badgeVariant="emerald"
        />
      </div>

      {/* Central de Consulta 360: Search & Split View */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              CENTRAL DE CONSULTA DE PEDIDOS & INGRESSOS
            </h2>
            <p className="text-xs text-slate-400">
              Digite CPF, e-mail, nome do comprador ou código do pedido (ex: DK-98421)
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por CPF, DK-..., e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500 font-mono"
            />
          </div>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Order list (Master) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 max-h-[520px] overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Pedidos Encontrados ({filteredOrders.length})
            </div>

            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-500/60 bg-orange-500/10 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono text-xs">{ord.orderNumber}</span>
                    <Badge
                      variant={ord.status === 'paid' ? 'emerald' : 'rose'}
                      size="sm"
                    >
                      {ord.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs font-medium text-slate-300 mt-1 truncate">
                    {ord.customerName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ord.eventName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/60">
                    <span>{ord.paymentMethod.toUpperCase()}</span>
                    <span className="font-bold text-white">{formatCurrency(ord.totalAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Details (Detail 360) */}
          {selectedOrder ? (
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-5">
              {/* Header details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-mono">{selectedOrder.orderNumber}</span>
                    <Badge
                      variant={selectedOrder.status === 'paid' ? 'emerald' : 'rose'}
                      size="sm"
                    >
                      {selectedOrder.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Comprado em {formatDateTime(selectedOrder.createdAt)} via {selectedOrder.paymentMethod.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'paid' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleOpenRefund(selectedOrder)}
                      icon={<RotateCcw className="h-3.5 w-3.5" />}
                    >
                      Solicitar Estorno
                    </Button>
                  )}
                </div>
              </div>

              {/* Customer & Event info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-orange-400" />
                    Titular do Pedido
                  </div>
                  <div className="text-xs text-white font-semibold">{selectedOrder.customerName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">CPF: {selectedOrder.customerCpf}</div>
                  <div className="text-[11px] text-slate-400">{selectedOrder.customerEmail}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-cyan-400" />
                    Evento & Produção
                  </div>
                  <div className="text-xs text-white font-semibold">{selectedOrder.eventName}</div>
                  <div className="text-[11px] text-slate-400">Total Pago: <strong className="text-emerald-400 font-mono">{formatCurrency(selectedOrder.totalAmount)}</strong></div>
                  <div className="text-[11px] text-slate-400">Taxa Disk: <strong className="text-orange-400 font-mono">{formatCurrency(selectedOrder.serviceFee)}</strong></div>
                </div>
              </div>

              {/* Issued Tickets List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Ingressos Emitidos no Pedido ({selectedOrder.tickets.length})
                </div>

                <div className="space-y-2">
                  {selectedOrder.tickets.map((tkt: any) => (
                    <div
                      key={tkt.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                          <QrCode className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <div className="font-bold font-mono text-white flex items-center gap-2">
                            {tkt.ticketCode}
                            <Badge
                              variant={tkt.status === 'valid' ? 'emerald' : 'rose'}
                              size="sm"
                            >
                              {tkt.status === 'valid' ? 'Válido para Acesso' : 'Invalido / Estornado'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Setor: <strong>{tkt.sectorName}</strong> • Titular: {tkt.nominalAttendee}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white font-mono">
                          {formatCurrency(tkt.price)}
                        </div>
                        <button
                          onClick={() => alert(`Código de barras do ingresso ${tkt.ticketCode} reenviado para ${selectedOrder.customerEmail} e WhatsApp.`)}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-medium underline mt-1"
                        >
                          Reenviar Voucher
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 py-20 text-center text-xs text-slate-500">
              Selecione um pedido para visualizar a ficha 360° do comprador.
            </div>
          )}
        </div>
      </div>

      {/* Refund Request Modal from SAC */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">
              Abrir Solicitação de Estorno (SAC)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pedido {selectedOrder?.orderNumber} • Valor: {formatCurrency(selectedOrder?.totalAmount || 0)}
            </p>

            <form onSubmit={handleConfirmRefundRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo da Solicitação
                </label>
                <select
                  value={refundReason}
                  onChange={(e: any) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                >
                  <option value="arrependimento_7d">Arrependimento Legal (Art. 49 CDC - 7 dias)</option>
                  <option value="duplicidade">Compra em Duplicidade</option>
                  <option value="evento_cancelado">Evento Cancelado / Alteração de Data</option>
                </select>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                A solicitação entrará imediatamente na fila de aprovação da Diretoria Financeira no módulo de Estornos.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setRefundModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="danger">
                  Enviar para Aprovação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
