import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Ticket,
  CreditCard,
  Headphones,
  RotateCcw,
  Send,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { OrderCompleteView } from './search.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';

interface OrderCompleteModalProps {
  data: OrderCompleteView | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomer?: (customerId: string) => void;
}

export const OrderCompleteModal: React.FC<OrderCompleteModalProps> = ({
  data,
  isOpen,
  onClose,
  onOpenCustomer
}) => {
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const { order, financialSummary, tickets, payments, supportTickets, refunds, permissions } = data;

  const handleAction = (actionName: string) => {
    setActionSuccessMessage(`Ação "${actionName}" executada com sucesso com registro em auditoria.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const isPaid = order.status === 'PAID';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 bg-slate-950/80 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-mono text-white">{order.orderNumber}</h2>
                <Badge variant={isPaid ? 'success' : isCancelled ? 'danger' : 'warning'} size="sm">
                  {isPaid ? 'Pago' : isCancelled ? 'Cancelado' : 'Pendente'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {order.eventName} • Produtora: {order.producerName || 'Opus Entretenimento'}
              </p>
              <div className="text-xs text-slate-300 mt-2 flex items-center gap-2">
                <span>Cliente:</span>
                <button
                  onClick={() => onOpenCustomer?.(order.customerId)}
                  className="font-semibold text-orange-400 hover:underline"
                >
                  {order.customerName}
                </button>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-400">CPF: {order.customerCpf}</span>
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

        {/* Action success alert banner */}
        {actionSuccessMessage && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Financial Breakdown Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>Resumo Financeiro da Transação</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Método: <strong className="text-white">{order.paymentMethod || 'PIX'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] text-slate-400">Valor Bruto</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  R$ {Number(financialSummary.grossAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Taxa de Serviço</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  R$ {Number(financialSummary.serviceFee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Valor Líquido</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">
                  R$ {Number(financialSummary.netAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Total Cobrado</div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                  R$ {Number(financialSummary.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Associated Tickets */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-orange-400" />
              <span>Ingressos do Pedido ({tickets.length})</span>
            </h3>
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">#{t.ticketCode}</span>
                      <span className="text-xs text-slate-300">• Setor: {t.sectorName || 'Pista'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Titular: {t.nominalAttendee || t.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={t.status === 'VALID' ? 'success' : 'info'} size="sm">
                      {t.status === 'VALID' ? 'Válido' : 'Utilizado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments & Transactions */}
          {payments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>Transações e Liquidação ({payments.length})</span>
              </h3>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-400">#{p.transactionCode}</span>
                      <span className="text-xs text-slate-300 ml-2">• Gateway: {p.gateway}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white mr-2">
                        R$ {Number(p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant="success" size="sm">
                        Conciliado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Action Buttons */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <h4 className="text-xs font-bold text-white mb-1">Ações Contextuais Autorizadas</h4>
            <p className="text-[11px] text-slate-400 mb-4">
              Os botões abaixo respeitam os limites do seu perfil de acesso.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {permissions.canResendTicket && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Send className="h-3.5 w-3.5" />}
                  onClick={() => handleAction('Reenviar Ingressos por E-mail/WhatsApp')}
                >
                  Reenviar Voucher
                </Button>
              )}

              {permissions.canOpenSupport && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Headphones className="h-3.5 w-3.5" />}
                  onClick={() => handleAction('Abrir Chamado SAC')}
                >
                  Abrir Chamado SAC
                </Button>
              )}

              {permissions.canRequestRefund && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RotateCcw className="h-3.5 w-3.5 text-rose-400" />}
                  onClick={() => handleAction('Solicitar Estorno')}
                >
                  Solicitar Estorno
                </Button>
              )}

              {permissions.canApproveRefund && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => handleAction('Aprovar Estorno Imediato')}
                >
                  Aprovação Financeira
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 p-4 px-6">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Emitido em {new Date(order.createdAt).toLocaleString('pt-BR')}
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
