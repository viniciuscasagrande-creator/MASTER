import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Ticket,
  CreditCard,
  History,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  FileCheck,
  ExternalLink,
  Check,
  Copy
} from 'lucide-react';
import { OrderDTO, OrderItemDTO } from '@shared/types/index';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';

interface OrderDossierModalProps {
  order: OrderDTO;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

type TabKey = 'geral' | 'ingressos' | 'pagamento' | 'timeline' | 'developer';

export const OrderDossierModal: React.FC<OrderDossierModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('geral');
  const [reissuingTicketId, setReissuingTicketId] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReissueTicket = async (ticketItemId: string) => {
    setReissuingTicketId(ticketItemId);
    setActionSuccess(null);
    setActionError(null);
    try {
      const response = await fetch(`/api/commercial/tickets/${ticketItemId}/reissue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ reason: 'Reemissão solicitada pelo operador no Dossiê Operacional' })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao reemitir ingresso.');
      }

      setActionSuccess('Novo ingresso e credencial QR Code gerados com sucesso! O QR Code anterior foi revogado.');
      onOrderUpdated?.();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao processar reemissão.');
    } finally {
      setReissuingTicketId(null);
      setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
    }
  };

  const handleReconcileOrder = async () => {
    setIsReconciling(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const response = await fetch(`/api/commercial/orders/${order.id}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Falha na reconciliação do pedido.');
      }

      setActionSuccess('Pedido conciliado com sucesso entre o gateway de pagamento, Ledger e emissão de ingressos!');
      onOrderUpdated?.();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao conciliar pedido.');
    } finally {
      setIsReconciling(false);
      setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return <Badge variant="emerald" size="sm">Confirmado</Badge>;
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return <Badge variant="amber" size="sm">Aguardando Pagamento</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan" size="sm">Em Processamento</Badge>;
      case 'CANCELLED':
        return <Badge variant="rose" size="sm">Cancelado</Badge>;
      case 'EXPIRED':
        return <Badge variant="slate" size="sm">Expirado</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      data-testid="order-dossier-modal"
    >
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-50/80 dark:bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  {order.publicCode || order.id}
                </span>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Canal: <strong className="text-slate-800 dark:text-slate-200">{order.salesChannelName || 'Site Oficial'}</strong> • Criado em: {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReconcileOrder}
              disabled={isReconciling}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />}
            >
              Conciliar Pedido
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar dossiê"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Alerts */}
        {actionSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 bg-slate-50/50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto select-none">
          {[
            { id: 'geral', label: 'Visão Geral', icon: <Building className="w-4 h-4" /> },
            { id: 'ingressos', label: `Ingressos (${order.totalTicketsCount || order.itemsCount || 0})`, icon: <Ticket className="w-4 h-4" /> },
            { id: 'pagamento', label: 'Transação & Pagamento', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'timeline', label: `Linha do Tempo (${order.timeline?.length || 0})`, icon: <History className="w-4 h-4" /> },
            { id: 'developer', label: 'Integridade & Técnico', icon: <Code2 className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Comprador */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Comprador
                    </span>
                    <button
                      onClick={() => handleCopy(order.buyerSnapshot?.document || order.buyerSnapshot?.documentMasked || '', 'CPF')}
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                      {copiedText === 'CPF' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'CPF' ? 'Copiado' : 'Copiar CPF'}</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{order.buyerSnapshot?.name || 'Cliente Balcão'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{order.buyerSnapshot?.documentMasked || 'Não informado'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{order.buyerSnapshot?.emailMasked || 'Não informado'}</p>
                    {order.buyerSnapshot?.phoneMasked && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{order.buyerSnapshot.phoneMasked}</p>
                    )}
                  </div>
                </div>

                {/* Evento & Sessão */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Evento & Sessão
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{order.eventName || 'Evento Geral'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{formatDateTime(order.createdAt)}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Itens: {order.itemsCount} ingresso(s)</span>
                    </p>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Totalização Financeira
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Subtotal Ingressos:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(order.subtotalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Taxa de Conveniência:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(order.feeAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Desconto Aplicado:</span>
                        <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                      <span>Valor Total:</span>
                      <span className="font-mono text-orange-600 dark:text-orange-400">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Itens Adquiridos
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {order.items?.length || 0} item(ns) detalhado(s)
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white font-semibold">{item.ticketTypeName || 'Ingresso Geral'}</strong>
                            {item.sectionName && (
                              <Badge variant="cyan" size="sm">{item.sectionName}</Badge>
                            )}
                            {item.batchName && (
                              <Badge variant="orange" size="sm">{item.batchName}</Badge>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Qtd: <strong className="text-slate-800 dark:text-slate-200">{item.quantity}</strong> • Valor unitário: {formatCurrency(item.unitFinalAmount || item.unitBaseAmount)}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.subtotalAmount || (item.quantity * item.unitBaseAmount))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nenhum item discriminado disponível no snapshot.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INGRESSOS & QR CODES */}
          {activeTab === 'ingressos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Credenciais de Acesso & Ingressos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rastreamento de códigos de barras, QR codes e controle de reemissão.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.ticketTypeName || 'Ingresso Oficial'}</h4>
                            <Badge variant="emerald" size="sm">Ativo</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Código: ING-{order.publicCode || order.id.slice(0, 6)}-{idx + 1}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Titular: <strong className="text-slate-700 dark:text-slate-300">{order.buyerSnapshot?.name || 'Titular da Compra'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReissueTicket(item.id)}
                          disabled={reissuingTicketId === item.id}
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${reissuingTicketId === item.id ? 'animate-spin' : ''}`} />}
                        >
                          Reemitir Ingresso
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                    Ingressos ainda não gerados ou pedido pendente de aprovação financeira.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAGAMENTO & TRANSAÇÃO */}
          {activeTab === 'pagamento' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dados do Gateway de Pagamento</h3>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Método:</span>
                    <strong className="text-slate-900 dark:text-white">Cartão de Crédito / PIX</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Moeda:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{order.currency || 'BRL'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Canal de Venda:</span>
                    <strong className="text-slate-900 dark:text-white">{order.salesChannelName || 'Site Oficial'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Status de Liquidação:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">Conciliado no Ledger</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Garantia Antifraude & Rastreabilidade</h4>
                  <p className="text-emerald-600/80 dark:text-emerald-400/80 text-[11px] mt-0.5">
                    Transação verificada com score de risco baixo. Webhooks confirmados e integrados com a conciliação contábil do Financeiro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LINHA DO TEMPO */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Histórico de Eventos da Ordem</h3>
              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-3 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800">
                  {order.timeline.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900" />
                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{ev.eventType}</span>
                          <span>{formatDateTime(ev.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 mt-1">{ev.description}</p>
                        {ev.actorName && (
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Ator: {ev.actorName} ({ev.actorType})</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  Nenhum evento registrado na linha do tempo deste pedido.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDITORIA & TÉCNICO */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Snapshot de Integridade do Core</h3>
                <button
                  onClick={() => handleCopy(JSON.stringify(order, null, 2), 'JSON')}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  {copiedText === 'JSON' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'JSON' ? 'Copiado!' : 'Copiar Payload JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(order, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">ID: {order.id} • Versão {order.version || 1}</span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
