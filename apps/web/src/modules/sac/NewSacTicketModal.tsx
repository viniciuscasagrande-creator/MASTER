import React, { useState } from 'react';
import {
  X,
  Headphones,
  User,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Send,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface NewSacTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  orders: any[];
  preSelectedCustomer?: any;
  preSelectedOrder?: any;
  onCreateTicket: (ticketData: {
    customerId: string;
    orderId?: string;
    channel: 'WHATSAPP' | 'EMAIL' | 'CHAT' | 'PHONE' | 'INTERNAL';
    subject: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    queue: string;
    initialMessage: string;
  }) => void;
}

export const NewSacTicketModal: React.FC<NewSacTicketModalProps> = ({
  isOpen,
  onClose,
  customers,
  orders,
  preSelectedCustomer,
  preSelectedOrder,
  onCreateTicket
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomer?.id || customers[0]?.id || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preSelectedOrder?.id || '');
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL' | 'CHAT' | 'PHONE' | 'INTERNAL'>('WHATSAPP');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [queue, setQueue] = useState<string>('Atendimento Geral');
  const [subject, setSubject] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter orders for selected customer
  const availableOrders = orders.filter(o => o.customerId === selectedCustomerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !subject.trim() || !initialMessage.trim()) return;

    setIsSubmitting(true);
    onCreateTicket({
      customerId: selectedCustomerId,
      orderId: selectedOrderId || undefined,
      channel,
      priority,
      queue,
      subject: subject.trim(),
      initialMessage: initialMessage.trim()
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Novo Atendimento SAC
              </h2>
              <p className="text-[11px] text-slate-400">
                Abertura de protocolo com consumidor DiskIngressos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Customer Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Cliente / Comprador *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedOrderId('');
              }}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cpf ? `***.${c.cpf.slice(3, 6)}...` : c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Related Order (Optional) */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Pedido Relacionado (Opcional)
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500 font-mono text-xs"
            >
              <option value="">Nenhum pedido vinculado</option>
              {availableOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* Channel & Queue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Canal de Origem</label>
              <select
                value={channel}
                onChange={(e: any) => setChannel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-mail</option>
                <option value="CHAT">Chat Online</option>
                <option value="PHONE">Telefone</option>
                <option value="INTERNAL">Interno</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fila Operacional</label>
              <select
                value={queue}
                onChange={(e) => setQueue(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500"
              >
                <option value="Atendimento Geral">Atendimento Geral</option>
                <option value="Pedidos & Pagamentos">Pedidos & Pagamentos</option>
                <option value="Ingressos & Credenciais">Ingressos & Credenciais</option>
                <option value="Estorno & Reembolso">Estorno & Reembolso</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Prioridade & SLA</label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => {
                const isSelected = priority === p;
                const labels: Record<string, string> = {
                  LOW: 'Baixa (4h)',
                  NORMAL: 'Normal (2h)',
                  HIGH: 'Alta (1h)',
                  URGENT: 'Urgente (30m)'
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Assunto do Chamado *</label>
            <input
              type="text"
              placeholder="Ex: Dúvida sobre assento ou troca de voucher"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500"
            />
          </div>

          {/* Initial Message */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Mensagem Inicial / Relato do Cliente *
            </label>
            <textarea
              rows={3}
              placeholder="Descreva a solicitação ou mensagem recebida..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <Button size="sm" variant="ghost" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Criar Atendimento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
