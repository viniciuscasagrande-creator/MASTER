import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  User,
  ShoppingBag,
  Ticket,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Lock
} from 'lucide-react';
import { OrderDTO, OrderStatus } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency } from '../../../shared/utils/formatters';

interface OrderDetailsPageProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ orderId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal/action
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.getOrderById(orderId);
      setOrder(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!cancelReason.trim()) {
      alert('Por favor, informe a justificativa do cancelamento.');
      return;
    }

    try {
      setCancelling(true);
      const updated = await CommercialApi.transitionOrder(
        order.id,
        'CANCELLED',
        cancelReason,
        order.version
      );
      setOrder(updated);
      setIsCancelModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      alert(err.message || 'Falha ao cancelar pedido.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-2">
        <div className="animate-spin inline-block h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        <p className="text-xs">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <h2 className="text-sm font-bold text-white">Não foi possível exibir o pedido</h2>
        <p className="text-xs text-rose-300">{error || 'Pedido não encontrado ou sem permissão de acesso.'}</p>
        <Button size="sm" variant="secondary" onClick={onBack}>
          Voltar para Lista
        </Button>
      </div>
    );
  }

  const buyer = order.buyerSnapshot;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Voltar
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-white tracking-tight">
                {order.publicCode}
              </h1>
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
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
                v{order.version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Criado em {new Date(order.createdAt).toLocaleString('pt-BR')} • Canal: {order.salesChannelName || 'Online'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsCancelModalOpen(true)}
              icon={<XCircle className="h-3.5 w-3.5" />}
            >
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Financial & Buyer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span>Resumo Financeiro</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-800/80">
            <div className="flex justify-between text-slate-300 pt-1">
              <span>Subtotal dos Ingressos</span>
              <span className="font-mono text-white">
                {order.subtotalAmount > 0 ? formatCurrency(order.subtotalAmount) : '—'}
              </span>
            </div>

            <div className="flex justify-between text-slate-300 pt-2">
              <span>Descontos Aplicados</span>
              <span className="font-mono text-emerald-400">
                {order.discountAmount > 0 ? `- ${formatCurrency(order.discountAmount)}` : 'R$ 0,00'}
              </span>
            </div>

            <div className="flex justify-between text-slate-300 pt-2">
              <span>Taxa de Serviço / Conveniência</span>
              <span className="font-mono text-slate-300">
                {order.feeAmount > 0 ? formatCurrency(order.feeAmount) : 'R$ 0,00'}
              </span>
            </div>

            <div className="flex justify-between text-white font-bold pt-3 text-sm">
              <span>Valor Total Liquidado</span>
              <span className="font-mono text-emerald-400">
                {order.totalAmount > 0 ? formatCurrency(order.totalAmount) : '— (Sigiloso)'}
              </span>
            </div>
          </div>
        </div>

        {/* Buyer Details (LGPD Protection) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <User className="h-4 w-4 text-cyan-400" />
              <span>Dados do Comprador</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-medium">
              <ShieldCheck className="h-3 w-3" /> Proteção LGPD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">Nome do Titular</div>
              <div className="font-medium text-white text-sm">{buyer?.name || 'Não informado'}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">CPF / Documento</div>
              <div className="font-mono text-white text-sm">
                {buyer?.documentMasked || buyer?.document || '***'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">E-mail Cadastrado</div>
              <div className="font-mono text-white text-sm">
                {buyer?.emailMasked || buyer?.email || '***@***'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
              <div className="text-[11px] text-slate-400">Telefone / WhatsApp</div>
              <div className="font-mono text-white text-sm">
                {buyer?.phoneMasked || buyer?.phone || 'Não informado'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Table (Immutable Pricing Snapshots) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Itens do Pedido ({order.items?.length || 0})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingressos vinculados com valores congelados na data da emissão
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>Preços protegidos por snapshot imutável</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Item / Modalidade</th>
                <th className="py-2.5 px-3">Sessão & Setor</th>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3 text-center">Qtd</th>
                <th className="py-2.5 px-3 text-right">Base Unit.</th>
                <th className="py-2.5 px-3 text-right">Taxa Unit.</th>
                <th className="py-2.5 px-3 text-right">Total Item</th>
                <th className="py-2.5 px-3 text-right">Snapshot ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {order.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{item.ticketTypeName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {item.eventTicketTypeId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-200">{item.sectionName || 'Setor Padrão'}</div>
                    <div className="text-[10px] text-slate-400">{item.sessionName || 'Sessão Principal'}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {item.batchName || 'Lote Padrão'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-white">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {item.unitBaseAmount > 0 ? formatCurrency(item.unitBaseAmount) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {item.unitFeeAmount > 0 ? formatCurrency(item.unitFeeAmount) : 'R$ 0,00'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {item.totalAmount > 0 ? formatCurrency(item.totalAmount) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-500">
                    {item.priceSnapshotId || 'snap_auto'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Linha do Tempo Auditada (Timeline)
          </h2>
        </div>

        <div className="space-y-3 relative border-l-2 border-slate-800 ml-3 pl-4">
          {order.timeline?.map((ev, idx) => (
            <div key={idx} className="relative space-y-1">
              {/* Dot */}
              <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-orange-500" />

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{ev.eventType}</span>
                  <Badge variant="slate" size="sm">
                    {ev.actorType}
                  </Badge>
                  {ev.actorName && (
                    <span className="text-slate-400">• {ev.actorName}</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(ev.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>

              <p className="text-xs text-slate-300">{ev.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirmar Cancelamento de Pedido</span>
            </div>

            <p className="text-xs text-slate-300">
              Você está prestes a cancelar o pedido <strong className="font-mono text-white">{order.publicCode}</strong>. Esta ação é irreversível na esteira comercial e registrará evento permanente na linha do tempo auditada.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Motivo formal do cancelamento:
              </label>
              <textarea
                rows={3}
                placeholder="Ex.: Solicitação do cliente no SAC com estorno já autorizado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={cancelling}
                onClick={() => setIsCancelModalOpen(false)}
              >
                Voltar
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={cancelling}
                onClick={handleCancelOrder}
                icon={<XCircle className="h-3.5 w-3.5" />}
              >
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
