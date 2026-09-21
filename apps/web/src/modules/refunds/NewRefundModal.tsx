import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { formatCurrency } from '../../shared/utils/formatters';

interface OrderOption {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCpf: string;
  eventName: string;
  totalAmount: number;
  status: string;
  tickets?: Array<{ id: string; ticketCode: string; sectorName?: string; price: number; checkInAt?: string | null }>;
}

interface NewRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableOrders: OrderOption[];
  preselectedOrderId?: string;
  onSubmit: (dto: {
    orderId: string;
    kind: 'TOTAL' | 'PARTIAL';
    amount: number;
    reason: string;
    reasonDescription: string;
    ticketIds?: string[];
  }) => Promise<void>;
}

export const NewRefundModal: React.FC<NewRefundModalProps> = ({
  isOpen,
  onClose,
  availableOrders,
  preselectedOrderId,
  onSubmit
}) => {
  const [step, setStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preselectedOrderId || '');
  const [refundKind, setRefundKind] = useState<'TOTAL' | 'PARTIAL'>('TOTAL');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('CDC_7_DAYS');
  const [reasonDescription, setReasonDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return availableOrders.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return availableOrders.filter(
      o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCpf.includes(q) ||
        o.eventName.toLowerCase().includes(q)
    );
  }, [availableOrders, searchQuery]);

  const selectedOrder = useMemo(() => {
    return availableOrders.find(o => o.id === selectedOrderId || o.orderNumber === selectedOrderId);
  }, [availableOrders, selectedOrderId]);

  // Dynamic calculation of amount
  const calculatedAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    if (refundKind === 'TOTAL') return selectedOrder.totalAmount;
    if (customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    // Sum prices of selected tickets if available
    if (selectedOrder.tickets && selectedOrder.tickets.length > 0 && selectedTicketIds.length > 0) {
      return selectedOrder.tickets
        .filter(t => selectedTicketIds.includes(t.id))
        .reduce((acc, t) => acc + (t.price || 0), 0);
    }
    return Math.round(selectedOrder.totalAmount / 2);
  }, [selectedOrder, refundKind, customAmount, selectedTicketIds]);

  // Alçadas calculadas preliminarmente
  const estimatedApprovals = calculatedAmount >= 5000 ? 3 : calculatedAmount >= 1000 ? 2 : 1;
  const estimatedRisk = calculatedAmount >= 5000 ? 'CRITICAL' : calculatedAmount >= 1000 ? 'HIGH' : refundKind === 'PARTIAL' ? 'MEDIUM' : 'LOW';

  const handleToggleTicket = (tId: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(tId) ? prev.filter(x => x !== tId) : [...prev, tId]
    );
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (!selectedOrder) {
        setErrorMessage('Selecione um pedido comercial para prosseguir.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (calculatedAmount <= 0) {
        setErrorMessage('O valor do estorno deve ser superior a zero.');
        return;
      }
      if (selectedOrder && calculatedAmount > selectedOrder.totalAmount) {
        setErrorMessage('O valor do estorno não pode ser maior que o total do pedido.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!reasonDescription.trim() || reasonDescription.trim().length < 5) {
      setErrorMessage('A justificativa formal do estorno é obrigatória (mínimo de 5 caracteres).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        orderId: selectedOrder!.id,
        kind: refundKind,
        amount: calculatedAmount,
        reason,
        reasonDescription,
        ticketIds: selectedTicketIds
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao registrar solicitação de estorno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nova Solicitação de Estorno</h2>
              <p className="text-xs text-slate-400">
                Passo {step} de 3 — {step === 1 ? 'Identificação do Pedido' : step === 2 ? 'Modalidade e Valores' : 'Justificativa e Alçadas'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-[11px] font-semibold text-center bg-slate-950/40">
          <div className={`py-2 border-b-2 transition-all ${step === 1 ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500'}`}>
            1. Pedido
          </div>
          <div className={`py-2 border-b-2 transition-all ${step === 2 ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500'}`}>
            2. Modalidade & Valores
          </div>
          <div className={`py-2 border-b-2 transition-all ${step === 3 ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500'}`}>
            3. Motivo & Alçadas
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step 1: Select Order */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Buscar Pedido Comercial (por código, cliente ou CPF)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: PED-984521, Maria Oliveira, 123456..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pedidos Disponíveis ({filteredOrders.length})
                </span>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {filteredOrders.map(order => {
                    const isSelected = selectedOrderId === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{order.orderNumber}</span>
                            <Badge variant={order.status === 'CONFIRMED' || order.status === 'PAID' ? 'emerald' : 'slate'} size="sm">
                              {order.status}
                            </Badge>
                          </div>
                          <span className="font-mono font-bold text-rose-400">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{order.customerName} • CPF {order.customerCpf}</span>
                          <span className="truncate max-w-[200px]">{order.eventName}</span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Nenhum pedido encontrado com este termo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Kind & Amount */}
          {step === 2 && selectedOrder && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Pedido Selecionado</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-white">{selectedOrder.orderNumber} • {selectedOrder.customerName}</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Modalidade do Estorno
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundKind('TOTAL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      refundKind === 'TOTAL'
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">Estorno Total</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Cancela o pedido integralmente ({formatCurrency(selectedOrder.totalAmount)})
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundKind('PARTIAL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      refundKind === 'PARTIAL'
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">Estorno Parcial</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Estorna parte dos ingressos ou valor específico
                    </div>
                  </button>
                </div>
              </div>

              {refundKind === 'PARTIAL' && (
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/50">
                  {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                        Selecione os Ingressos para Devolução:
                      </span>
                      <div className="space-y-1.5">
                        {selectedOrder.tickets.map(t => {
                          const checked = selectedTicketIds.includes(t.id);
                          return (
                            <label
                              key={t.id}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer ${
                                checked
                                  ? 'border-orange-500/50 bg-orange-500/10 text-white'
                                  : 'border-slate-800 bg-slate-900/40 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleTicket(t.id)}
                                  className="rounded border-slate-700 text-orange-500 focus:ring-0"
                                />
                                <span className="font-mono">{t.ticketCode}</span>
                                <span className="text-slate-400">({t.sectorName || 'Setor Padrão'})</span>
                              </div>
                              <span className="font-mono font-bold text-rose-400">{formatCurrency(t.price)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Ou informe o valor parcial desejado (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`Até ${selectedOrder.totalAmount}`}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rose-300 font-bold uppercase block">Valor Final do Estorno</span>
                  <span className="text-xs text-slate-300">Refletirá nos balancetes do evento</span>
                </div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {formatCurrency(calculatedAmount)}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Reason & Thresholds */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo Formal do Estorno
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="CDC_7_DAYS">Direito de Arrependimento (7 dias - Art. 49 CDC)</option>
                  <option value="EVENT_CANCELLED">Cancelamento Oficial do Evento</option>
                  <option value="EVENT_POSTPONED">Adiamento com Alteração de Data/Local</option>
                  <option value="OPERATIONAL_ERROR">Erro Operacional de Cobrança / Duplicidade</option>
                  <option value="MEDICAL_REASON">Impossibilidade Médica com Atestado</option>
                  <option value="FRAUD_CHARGEBACK_PREVENT">Prevenção de Fraude / Chargeback</option>
                  <option value="OTHER">Outro Motivo Específico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Justificativa Detalhada (Obrigatória para Auditoria)
                </label>
                <textarea
                  rows={3}
                  value={reasonDescription}
                  onChange={(e) => setReasonDescription(e.target.value)}
                  placeholder="Descreva o contexto do cliente, número de protocolo de atendimento, atestados ou motivos da liberação..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Threshold & Risk Projection */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Alçadas Requeridas para Efetivação Bancária
                </span>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span>Alçadas Requeridas:</span>
                  <strong className="text-cyan-400 font-mono">{estimatedApprovals} nível(is) de aprovação</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span>Classificação de Risco:</span>
                  <strong className="text-orange-400 font-mono">{estimatedRisk}</strong>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  A solicitação entrará na fila com status "Aguardando Aprovação". Conforme o princípio de Maker-Checker, você não poderá aprovar a sua própria solicitação.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Voltar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {step < 3 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleNext}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Próximo
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Solicitação'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
