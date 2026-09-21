import React, { useState } from 'react';
import {
  X,
  Headphones,
  User,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  Lock,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Check
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatDateTime } from '../../shared/utils/formatters';

interface SacTicketDetailModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
  onAddMessage: (ticketId: string, type: 'AGENT' | 'INTERNAL_NOTE', content: string) => void;
  onUpdateStatus: (ticketId: string, status: string) => void;
  onRequestRefund?: (orderId: string, ticketId?: string) => void;
}

export const SacTicketDetailModal: React.FC<SacTicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onAddMessage,
  onUpdateStatus,
  onRequestRefund
}) => {
  const [replyType, setReplyType] = useState<'AGENT' | 'INTERNAL_NOTE'>('AGENT');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    onAddMessage(ticket.id, replyType, content.trim());
    setContent('');
    setIsSending(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="orange" size="sm">ABERTO</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="cyan" size="sm">EM ANDAMENTO</Badge>;
      case 'WAITING_CUSTOMER':
        return <Badge variant="amber" size="sm">AGUARDANDO CLIENTE</Badge>;
      case 'RESOLVED':
        return <Badge variant="emerald" size="sm">RESOLVIDO</Badge>;
      case 'CLOSED':
        return <Badge variant="slate" size="sm">ENCERRADO</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-base">
                  {ticket.ticketCode || ticket.id}
                </span>
                {getStatusBadge(ticket.status)}
                <span className="text-[11px] text-slate-400 font-semibold">• Canal: {ticket.channel}</span>
                {ticket.slaPaused ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <PauseCircle className="w-3 h-3" /> SLA Pausado
                  </span>
                ) : ticket.slaMinutesRemaining !== undefined && ticket.slaMinutesRemaining > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> SLA: {ticket.slaMinutesRemaining}m
                  </span>
                ) : null}
              </div>
              <h3 className="text-xs font-semibold text-slate-300 mt-0.5">
                {ticket.subject}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ticket.orderId && onRequestRefund && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onRequestRefund(ticket.orderId, ticket.id)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Solicitar Estorno
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Operational Context Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-4">
            <span>Cliente: <strong className="text-white">{ticket.customerName}</strong></span>
            {ticket.orderNumber && (
              <span>Pedido: <strong className="text-orange-400 font-mono">{ticket.orderNumber}</strong></span>
            )}
            {ticket.eventName && (
              <span>Evento: <strong className="text-slate-200">{ticket.eventName}</strong></span>
            )}
            <span>Fila: <strong className="text-slate-200">{ticket.queue}</strong></span>
          </div>

          {/* Quick Status Transition Controls */}
          <div className="flex items-center gap-1.5">
            {ticket.status !== 'WAITING_CUSTOMER' && ticket.status !== 'RESOLVED' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'WAITING_CUSTOMER')}
                className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-semibold border border-amber-500/20 transition flex items-center gap-1"
              >
                <PauseCircle className="w-3 h-3" /> Aguardar Cliente
              </button>
            )}
            {ticket.status === 'WAITING_CUSTOMER' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'IN_PROGRESS')}
                className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-semibold border border-cyan-500/20 transition flex items-center gap-1"
              >
                <PlayCircle className="w-3 h-3" /> Retomar Atendimento
              </button>
            )}
            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'RESOLVED')}
                className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 transition flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Resolver
              </button>
            )}
          </div>
        </div>

        {/* Message Thread (Conversation Body) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40">
          {(!ticket.messages || ticket.messages.length === 0) ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhuma mensagem registrada neste atendimento.
            </div>
          ) : (
            ticket.messages.map((m: any) => {
              if (m.type === 'SYSTEM_EVENT') {
                return (
                  <div key={m.id} className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                      {m.content} • {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                );
              }

              if (m.type === 'INTERNAL_NOTE') {
                return (
                  <div key={m.id} className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-semibold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Nota Interna • {m.authorName} (Invisível para o comprador)
                      </span>
                      <span className="text-[10px] text-amber-500/80">{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="text-amber-100/90 whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              }

              const isCustomer = m.type === 'CUSTOMER';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                    <span className="font-semibold">{m.authorName}</span>
                    <span>•</span>
                    <span>{formatDateTime(m.createdAt)}</span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap ${
                      isCustomer
                        ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
                        : 'bg-orange-600 text-white rounded-tr-sm shadow-md'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Composer Footer */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setReplyType('AGENT')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                replyType === 'AGENT'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Resposta ao Cliente ({ticket.channel})
            </button>
            <button
              type="button"
              onClick={() => setReplyType('INTERNAL_NOTE')}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                replyType === 'INTERNAL_NOTE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3" />
              Nota Interna da Equipe
            </button>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              placeholder={
                replyType === 'AGENT'
                  ? 'Digite sua resposta ao consumidor...'
                  : 'Digite uma nota interna (visível apenas para atendentes)...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`flex-1 rounded-xl border p-2.5 text-xs text-white outline-none resize-none ${
                replyType === 'INTERNAL_NOTE'
                  ? 'border-amber-500/40 bg-amber-950/20 focus:border-amber-500'
                  : 'border-slate-800 bg-slate-900 focus:border-orange-500'
              }`}
            />
            <Button
              size="md"
              variant={replyType === 'INTERNAL_NOTE' ? 'secondary' : 'primary'}
              type="submit"
              disabled={isSending || !content.trim()}
              icon={<Send className="w-4 h-4" />}
            >
              Enviar
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
