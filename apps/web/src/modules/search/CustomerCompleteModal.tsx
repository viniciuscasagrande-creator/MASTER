import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Ticket,
  CreditCard,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CustomerCompleteView } from './search.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';

interface CustomerCompleteModalProps {
  data: CustomerCompleteView | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
}

type TabKey = 'summary' | 'orders' | 'tickets' | 'payments' | 'support' | 'refunds';

export const CustomerCompleteModal: React.FC<CustomerCompleteModalProps> = ({
  data,
  isOpen,
  onClose,
  onSelectOrder
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  if (!isOpen || !data) return null;

  const { customer, summary, orders, tickets, payments, supportTickets, refunds } = data;
  const isMasked = customer.cpf.includes('*');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 bg-slate-950/70 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-xl shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">{customer.name}</h2>
                <Badge variant={isMasked ? 'warning' : 'success'} size="sm">
                  {isMasked ? 'LGPD Mascarado' : 'Acesso Completo'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Visão Completa do Cliente • Central de Consulta Unificada
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
                  CPF: <strong className="text-white">{customer.cpf}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  {customer.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  {customer.phone}
                </span>
                {customer.city && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {customer.city}/{customer.state}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto">
          {[
            { key: 'summary', label: 'Resumo Geral', icon: User, count: undefined },
            { key: 'orders', label: 'Pedidos', icon: ShoppingBag, count: orders.length },
            { key: 'tickets', label: 'Ingressos', icon: Ticket, count: tickets.length },
            { key: 'payments', label: 'Pagamentos', icon: CreditCard, count: payments.length },
            { key: 'support', label: 'SAC', icon: Headphones, count: supportTickets.length },
            { key: 'refunds', label: 'Estornos', icon: RotateCcw, count: refunds.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: RESUMO GERAL */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Gasto</span>
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    R$ {Number(summary.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Faturamento consolidado
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pedidos Realizados</span>
                    <ShoppingBag className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    {summary.totalOrders}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Histórico de compras
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ingressos Emitidos</span>
                    <Ticket className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    {summary.totalTickets}
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-1">
                    Vouchers emitidos
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Eventos Distintos</span>
                    <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1">
                    {summary.totalEvents}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Diversificação de eventos
                  </div>
                </div>
              </div>

              {/* Security LGPD Notice */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-orange-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Governança e Mascaramento de Dados LGPD</div>
                    <div className="text-[11px] text-slate-400">
                      {isMasked
                        ? 'Os documentos e contatos deste cliente estão parcialmente ofuscados no Node.js conforme seu perfil de acesso.'
                        : 'Você possui privilégio de visualização de documentos completos auditada pelo sistema.'}
                    </div>
                  </div>
                </div>
                <Badge variant={isMasked ? 'warning' : 'success'} size="sm">
                  {isMasked ? 'Mascaramento Ativo' : 'Documento Liberado'}
                </Badge>
              </div>

              {/* Recent Orders Overview */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Últimos Pedidos do Cliente</h3>
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder?.(order.id)}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-orange-400">{order.orderNumber}</span>
                          <span className="text-xs text-white font-medium">• {order.eventName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')} • {order.itemsCount || 1} ingresso(s) • Método: {order.paymentMethod || 'PIX'}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="text-xs font-bold text-white">
                            R$ {Number(order.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <Badge variant={order.status === 'PAID' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'} size="sm">
                            {order.status === 'PAID' ? 'Pago' : order.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                          </Badge>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEDIDOS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhum pedido localizado no escopo autorizado.</div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder?.(order.id)}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-orange-500/40 hover:bg-slate-800/40 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-orange-400">{order.orderNumber}</span>
                        <span className="text-sm font-semibold text-white">• {order.eventName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>{order.itemsCount || 1} item(ns)</span>
                        <span>Método: {order.paymentMethod || 'PIX'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          R$ {Number(order.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <Badge variant={order.status === 'PAID' ? 'success' : 'warning'} size="sm">
                          {order.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                      <Button size="sm" variant="secondary" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                        Ver Pedido
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: INGRESSOS */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhum ingresso emitido para este cliente.</div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold shrink-0">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">#{ticket.ticketCode}</span>
                          <span className="text-xs font-medium text-slate-300">• {ticket.eventName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Setor: <strong className="text-slate-200">{ticket.sectorName || 'Pista'}</strong> • Titular: {ticket.nominalAttendee || ticket.customerName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white mb-1">
                        R$ {Number(ticket.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant={ticket.status === 'VALID' ? 'success' : ticket.status === 'USED' ? 'info' : 'danger'} size="sm">
                        {ticket.status === 'VALID' ? 'Válido' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PAGAMENTOS */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhum pagamento registrado.</div>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">#{payment.transactionCode}</span>
                        <span className="text-xs text-white font-medium">• Método: {payment.method}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Gateway: {payment.gateway || 'Central'} • Data: {new Date(payment.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white mb-1">
                        R$ {Number(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant={payment.status === 'APPROVED' ? 'success' : 'warning'} size="sm">
                        {payment.status === 'APPROVED' ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: ATENDIMENTOS SAC */}
          {activeTab === 'support' && (
            <div className="space-y-3">
              {supportTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhum chamado de atendimento aberto para este cliente.</div>
              ) : (
                supportTickets.map((sup) => (
                  <div
                    key={sup.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">#{sup.ticketCode}</span>
                        <span className="text-xs text-white font-semibold">{sup.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Canal: {sup.channel} • Atendente: {sup.agentName || 'Fila'} • SLA: {sup.slaMinutes || 30}m
                      </div>
                    </div>
                    <Badge variant={sup.status === 'IN_PROGRESS' ? 'warning' : sup.status === 'OPEN' ? 'danger' : 'success'} size="sm">
                      {sup.status === 'IN_PROGRESS' ? 'Em Andamento' : sup.status === 'OPEN' ? 'Aberto' : 'Concluído'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: ESTORNOS */}
          {activeTab === 'refunds' && (
            <div className="space-y-3">
              {refunds.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Nenhum registro de estorno ou contestação.</div>
              ) : (
                refunds.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400">#{ref.refundCode}</span>
                        <span className="text-xs text-white font-medium">{ref.reason}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pedido: #{ref.orderId} • Data: {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white mb-1">
                        R$ {Number(ref.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant={ref.status === 'APPROVED' ? 'success' : ref.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'} size="sm">
                        {ref.status === 'APPROVED' ? 'Aprovado' : ref.status === 'PENDING_APPROVAL' ? 'Aguardando Aprovação' : 'Rejeitado'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 p-4 px-6">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
