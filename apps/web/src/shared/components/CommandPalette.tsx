import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Ticket,
  User,
  Calendar,
  Building2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenNewSale: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewSale
}) => {
  const [query, setQuery] = useState('');
  const { orders, customers, events, producers } = useCoreData();
  const { setSelectedProducerId, setSelectedEventId } = useScope();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Filter entities
  const matchingOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(cleanQuery) ||
    o.customerName.toLowerCase().includes(cleanQuery) ||
    o.customerCpf.includes(cleanQuery) ||
    o.tickets.some(t => t.ticketCode.toLowerCase().includes(cleanQuery))
  ).slice(0, 4);

  const matchingCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(cleanQuery) ||
    c.cpf.includes(cleanQuery) ||
    c.email.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  const matchingEvents = events.filter(e =>
    e.title.toLowerCase().includes(cleanQuery) ||
    e.venue.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  const matchingProducers = producers.filter(p =>
    p.name.toLowerCase().includes(cleanQuery) ||
    p.cnpj.includes(cleanQuery)
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/60">
          <Search className="h-5 w-5 text-orange-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por pedido (ex: DK-98421), CPF, ingresso, evento, produtor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 rounded border border-slate-800 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ações Rápidas
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewSale();
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <div>
                    <div className="font-semibold text-white">Simular Venda Real</div>
                    <div className="text-[10px] text-slate-400">Dispara cascata no Core</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('sac', 'sac-query-center');
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <MessageSquare className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Central de Consulta SAC</div>
                    <div className="text-[10px] text-slate-400">Localizar pedido por CPF</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('finance', 'finance-dashboard');
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Painel Financeiro</div>
                    <div className="text-[10px] text-slate-400">Ver saldos e repasses</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('refunds', 'refunds-approvals');
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <RotateCcw className="h-4 w-4 text-rose-400" />
                  <div>
                    <div className="font-semibold text-white">Fila de Estornos</div>
                    <div className="text-[10px] text-slate-400">Aprovar ou auditar</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Pedidos & Ingressos */}
          {matchingOrders.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pedidos & Ingressos ({matchingOrders.length})
              </div>
              <div className="mt-1 space-y-1">
                {matchingOrders.map(ord => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      onClose();
                      onNavigate('sac', 'sac-query-center');
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold font-mono text-white flex items-center gap-2">
                          {ord.orderNumber}
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                            ord.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {ord.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ord.customerName} • {ord.eventName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white font-mono">
                        R$ {ord.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">{ord.paymentMethod.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clientes */}
          {matchingCustomers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Clientes ({matchingCustomers.length})
              </div>
              <div className="mt-1 space-y-1">
                {matchingCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onNavigate('sac', 'sac-customers');
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">CPF: {c.cpf} • {c.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eventos */}
          {matchingEvents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Eventos ({matchingEvents.length})
              </div>
              <div className="mt-1 space-y-1">
                {matchingEvents.map(e => (
                  <div
                    key={e.id}
                    onClick={() => {
                      setSelectedEventId(e.id);
                      onClose();
                      onNavigate('events', 'events-dashboard');
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{e.title}</div>
                        <div className="text-[11px] text-slate-400">{e.venue} • {e.city}/{e.state}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      {e.ticketsSold} vendidos
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtores */}
          {matchingProducers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Produtores ({matchingProducers.length})
              </div>
              <div className="mt-1 space-y-1">
                {matchingProducers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProducerId(p.id);
                      onClose();
                      onNavigate('commercial', 'commercial-producers');
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400">CNPJ: {p.cnpj}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-emerald-400 font-mono">
                      Saldo: R$ {(p.availableBalance / 1000).toFixed(0)}k
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && matchingOrders.length === 0 && matchingCustomers.length === 0 && matchingEvents.length === 0 && matchingProducers.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhum registro encontrado para "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-500">
          <span>Dica: Use <strong>Tab</strong> ou setas para navegar rapidamente</span>
          <span>Core Relacional Integrado</span>
        </div>
      </div>
    </div>
  );
};
