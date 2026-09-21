import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Ticket,
  Headphones,
  History,
  RotateCcw,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Eye,
  Lock
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

interface CustomerDossierModalProps {
  customer: any;
  orders: any[];
  tickets: any[];
  supportTickets?: any[];
  refunds?: any[];
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTicket?: (customer: any, order?: any) => void;
  onRequestRefund?: (order: any) => void;
  onOpenOrderDossier?: (order: any) => void;
}

export const CustomerDossierModal: React.FC<CustomerDossierModalProps> = ({
  customer,
  orders,
  tickets,
  supportTickets = [],
  refunds = [],
  isOpen,
  onClose,
  onOpenNewTicket,
  onRequestRefund,
  onOpenOrderDossier
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'tickets' | 'support' | 'refunds' | 'timeline'>('overview');
  const [unmaskedCpf, setUnmaskedCpf] = useState(false);

  if (!isOpen || !customer) return null;

  // Filter orders for this customer
  const customerOrders = orders.filter(o => o.customerId === customer.id || o.customerCpf === customer.cpf);
  const customerOrderIds = customerOrders.map(o => o.id);
  const customerTickets = tickets.filter(t => customerOrderIds.includes(t.orderId) || t.customerName === customer.name);
  const customerSupport = supportTickets.filter(s => s.customerId === customer.id || s.customerName === customer.name);
  const customerRefunds = refunds.filter(r => r.customerId === customer.id || customerOrderIds.includes(r.orderId));

  const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Masked CPF helper
  const renderCpf = () => {
    if (unmaskedCpf) return customer.cpf || customer.cpfNormalized || 'Não informado';
    const raw = customer.cpf || customer.cpfNormalized || '';
    if (raw.length >= 11) {
      return `***.${raw.slice(3, 6)}.${raw.slice(6, 9)}-**`;
    }
    return '***.***.***-**';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header - Dark Executive Limitless Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {customer.name}
                </h2>
                <Badge variant="cyan" size="sm">
                  Ficha do Comprador
                </Badge>
                {customer.status && (
                  <Badge variant={customer.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                    {customer.status === 'ACTIVE' ? 'ATIVO' : customer.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>ID: {customer.id}</span>
                <span>•</span>
                <span>CPF: {renderCpf()}</span>
                {!unmaskedCpf && (
                  <button
                    onClick={() => setUnmaskedCpf(true)}
                    title="Revelar CPF completo (Ação auditada)"
                    className="text-orange-400 hover:text-orange-300 text-[11px] font-sans flex items-center gap-1 ml-1"
                  >
                    <Eye className="w-3 h-3" /> Revelar
                  </button>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNewTicket && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onOpenNewTicket(customer)}
                icon={<Headphones className="w-3.5 h-3.5" />}
              >
                Novo Atendimento
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Resumo
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Pedidos ({customerOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            Ingressos ({customerTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'support'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Atendimentos SAC ({customerSupport.length})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'refunds'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Estornos ({customerRefunds.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Linha do Tempo
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB: Resumo */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Comprado</div>
                  <div className="text-xl font-extrabold text-white mt-1">{formatCurrency(totalSpent)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{customerOrders.length} pedidos realizados</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ingressos Emitidos</div>
                  <div className="text-xl font-extrabold text-cyan-400 mt-1">{customerTickets.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Credenciais ativas</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Protocolos SAC</div>
                  <div className="text-xl font-extrabold text-amber-400 mt-1">{customerSupport.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Chamados no histórico</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Estornos Solicitados</div>
                  <div className="text-xl font-extrabold text-rose-400 mt-1">{customerRefunds.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Solicitações abertas</div>
                </div>
              </div>

              {/* Personal Data & Contact Info (LGPD Minimized) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Dados Cadastrais & LGPD
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Nome Completo:</span>
                      <span className="font-semibold text-white">{customer.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">CPF:</span>
                      <span className="font-mono text-white">{renderCpf()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Data de Cadastro:</span>
                      <span className="text-slate-300">
                        {customer.createdAt ? formatDateTime(customer.createdAt) : 'Não informada'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-400" />
                    Canais de Contato
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="text-slate-200 font-mono">{customer.email || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Telefone / WhatsApp:</span>
                      <span className="text-slate-200 font-mono">{customer.phone || customer.phoneNormalized || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Status Cadastral:</span>
                      <span className="text-emerald-400 font-semibold">Verificado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Ações operacionais rápidas para este consumidor:
                </div>
                <div className="flex items-center gap-2">
                  {onOpenNewTicket && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenNewTicket(customer)}
                      icon={<Headphones className="w-3.5 h-3.5 text-amber-400" />}
                    >
                      Abrir Protocolo SAC
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Pedidos */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Histórico de pedidos associados ao comprador em todos os canais de venda DiskIngressos.
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Evento</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Pagamento</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {customerOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          Nenhum pedido encontrado para este comprador.
                        </td>
                      </tr>
                    ) : (
                      customerOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-white">{o.orderNumber}</td>
                          <td className="p-3 text-slate-300 truncate max-w-[200px]">{o.eventName}</td>
                          <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                          <td className="p-3 font-mono font-bold text-white">{formatCurrency(o.totalAmount)}</td>
                          <td className="p-3 uppercase text-slate-300 font-mono text-[11px]">{o.paymentMethod || 'PIX'}</td>
                          <td className="p-3">
                            <Badge variant={o.status === 'paid' ? 'emerald' : 'rose'} size="sm">
                              {o.status?.toUpperCase() || 'PAGO'}
                            </Badge>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            {onOpenOrderDossier && (
                              <button
                                onClick={() => onOpenOrderDossier(o)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                              >
                                Ver Dossiê
                              </button>
                            )}
                            {o.status === 'paid' && onRequestRefund && (
                              <button
                                onClick={() => onRequestRefund(o)}
                                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold border border-rose-500/30 transition"
                              >
                                Solicitar Estorno
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Ingressos */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Credenciais e ingressos emitidos para este cliente.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customerTickets.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Nenhum ingresso emitido vinculado a este comprador.
                  </div>
                ) : (
                  customerTickets.map(t => (
                    <div key={t.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{t.ticketCode || t.id}</span>
                          <Badge variant={t.status === 'used' ? 'slate' : 'emerald'} size="sm">
                            {t.status === 'used' ? 'UTILIZADO' : 'EMITIDO'}
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-slate-300 mt-1">{t.sector || t.sectionName || 'Pista'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Tipo: {t.ticketType || 'Inteira'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Check-in</div>
                        <div className="text-xs font-semibold text-slate-300">
                          {t.checkedInAt ? formatDateTime(t.checkedInAt) : 'Não realizado'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: Atendimentos SAC */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Chamados e protocolos de suporte abertos para este comprador.
                </div>
                {onOpenNewTicket && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onOpenNewTicket(customer)}
                    icon={<PlusCircle className="w-3.5 h-3.5" />}
                  >
                    Novo Chamado
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {customerSupport.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Nenhum atendimento SAC registrado para este comprador.
                  </div>
                ) : (
                  customerSupport.map(s => (
                    <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-orange-400 text-xs">{s.ticketCode || s.id}</span>
                          <Badge variant={s.status === 'RESOLVED' || s.status === 'resolved' ? 'emerald' : 'amber'} size="sm">
                            {s.status}
                          </Badge>
                          <span className="text-[11px] text-slate-400">• Canal: {s.channel}</span>
                        </div>
                        <div className="text-xs font-medium text-white mt-1">{s.subject}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Responsável: {s.agentName || 'Atendente SAC'}</div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {formatDateTime(s.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: Estornos */}
          {activeTab === 'refunds' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Histórico de solicitações de estorno encaminhadas para o módulo de Estorno.
              </div>
              <div className="space-y-2">
                {customerRefunds.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Nenhuma solicitação de estorno registrada para este comprador.
                  </div>
                ) : (
                  customerRefunds.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-400 text-xs">{r.code || r.id}</span>
                          <Badge variant="amber" size="sm">
                            {r.status?.toUpperCase() || 'EM ANÁLISE'}
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-white mt-1">Pedido: {r.orderNumber || r.orderId}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Motivo: {r.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-xs">{formatCurrency(r.amount || 0)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {r.requestedAt ? formatDateTime(r.requestedAt) : 'Recentemente'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: Linha do Tempo */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Linha do tempo consolidada de interações do comprador no Disk Interno (sem duplicação).
              </div>
              <div className="relative pl-6 border-l border-slate-800 space-y-6">
                {customerOrders.map(o => (
                  <div key={o.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    <div className="text-xs font-bold text-emerald-400">Compra Aprovada</div>
                    <div className="text-xs text-white font-medium mt-0.5">
                      Pedido {o.orderNumber} • {formatCurrency(o.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400">{o.eventName}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{formatDateTime(o.createdAt)}</div>
                  </div>
                ))}

                {customerSupport.map(s => (
                  <div key={s.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900" />
                    <div className="text-xs font-bold text-amber-400">Atendimento SAC Aberto</div>
                    <div className="text-xs text-white font-medium mt-0.5">
                      Protocolo {s.ticketCode || s.id}: {s.subject}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{formatDateTime(s.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
