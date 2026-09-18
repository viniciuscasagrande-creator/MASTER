import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, CreditCard, QrCode } from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { Button } from './Button';
import { formatCurrency } from '../utils/formatters';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onNavigateToOrder }) => {
  const { events, processNewSale } = useCoreData();

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  const [selectedSectorId, setSelectedSectorId] = useState(activeEvent?.sectors[0]?.id || '');
  const activeSector = activeEvent?.sectors.find(s => s.id === selectedSectorId) || activeEvent?.sectors[0];

  const [customerName, setCustomerName] = useState('Mariana Siqueira Rocha');
  const [customerCpf, setCustomerCpf] = useState('098.341.229-50');
  const [customerEmail, setCustomerEmail] = useState('mariana.siqueira@gmail.com');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [utmCampaign, setUtmCampaign] = useState('inverno_2026_meta_retargeting');
  const [lastProcessedOrder, setLastProcessedOrder] = useState<any>(null);

  if (!isOpen) return null;

  const handleProcessSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !activeSector) return;

    const order = processNewSale({
      eventId: activeEvent.id,
      customerName,
      customerCpf,
      customerEmail,
      sectorId: activeSector.id,
      paymentMethod,
      utmCampaign: utmCampaign || undefined
    });

    setLastProcessedOrder(order);
  };

  const resetForm = () => {
    setLastProcessedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Simulador de Venda & Cascata Inter-Módulos
              </h2>
              <p className="text-[11px] text-slate-400">
                Demonstra o princípio central: Produtor → Evento → Pedido → Repasse
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body or Success State */}
        {!lastProcessedOrder ? (
          <form onSubmit={handleProcessSale} className="mt-4 space-y-4">
            {/* Event Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Evento
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  const evt = events.find(ev => ev.id === e.target.value);
                  if (evt && evt.sectors.length > 0) {
                    setSelectedSectorId(evt.sectors[0].id);
                  }
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.producerName})
                  </option>
                ))}
              </select>
            </div>

            {/* Sector & Price Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Setor / Lote
                </label>
                <select
                  value={selectedSectorId}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                >
                  {activeEvent?.sectors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meio de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" /> PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'credit_card'
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Cartão
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Comprador
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CPF
                </label>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Campaign Attribution */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Atribuição de Marketing (UTM / Campanha)
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="Ex: meta_inverno_lote3"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono"
              />
            </div>

            {/* Summary preview */}
            {activeSector && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Valor do Ingresso:</span>
                  <span className="text-white font-mono">{formatCurrency(activeSector.price)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxa de Conveniência (10%):</span>
                  <span className="text-orange-400 font-mono">{formatCurrency(activeSector.price * 0.1)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                  <span>Total Cobrado:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(activeSector.price * 1.1)}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" icon={<Sparkles className="h-4 w-4" />}>
                Processar Venda & Cascata Central
              </Button>
            </div>
          </form>
        ) : (
          /* Cascade feedback screen */
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Venda Confirmada com Sucesso!</div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                Pedido {lastProcessedOrder.orderNumber} • {lastProcessedOrder.tickets[0]?.ticketCode}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Efeitos Simultâneos no Core:
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>EVENTOS:</strong> +1 ingresso computado na capacidade do evento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>FINANCEIRO:</strong> Saldo liberado na conta do produtor Opus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>CONTABILIDADE:</strong> 2 lançamentos em partidas dobradas postados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>SAC:</strong> Pedido disponível instantaneamente na Central de Consulta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>MARKETING:</strong> Conversão computada no ROAS da campanha Meta</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={resetForm}
              >
                Concluído
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
