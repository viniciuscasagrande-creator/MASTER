import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CreditCard,
  Headphones,
  Megaphone,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useDiskContext } from '../../core/context/DiskContext';
import { CategorizedSearchResults, SearchResultItem } from '../../modules/search/search.types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenNewSale: () => void;
  onOpenCustomer?: (customerId: string) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewSale,
  onOpenCustomer,
  onOpenOrder
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CategorizedSearchResults | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { apiFetch, setProducer, setEvent } = useDiskContext();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          setSearchResults(null);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'Enter' && isOpen && query.trim().length >= 2) {
        onClose();
        onNavigate('search', query.trim());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate, query]);

  // Debounced API Search
  const fetchSearch = useCallback(
    async (text: string) => {
      if (!text || text.trim().length < 2) {
        setSearchResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await apiFetch(`/api/v1/search?q=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        // Silent fallback
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSearch(query);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, fetchSearch]);

  if (!isOpen) return null;

  const categories = searchResults?.categories;
  const totalMatches = searchResults?.totalMatches || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-800 px-4 py-3.5 bg-slate-950/80">
          <Search className="h-5 w-5 text-orange-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Buscar pedidos, CPF, ingressos, clientes, eventos ou comandos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          {isLoading && (
            <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mr-2" />
          )}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSearchResults(null);
              }}
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
          {/* Quick Actions (when query is empty) */}
          {!query && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ações Rápidas & Módulos
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('search');
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <Search className="h-4 w-4 text-orange-400" />
                  <div>
                    <div className="font-semibold text-white">Central de Consulta</div>
                    <div className="text-[10px] text-slate-400">Busca Global e Visão Completa</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenNewSale();
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Simular Venda Real</div>
                    <div className="text-[10px] text-slate-400">Dispara pedido no Core</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('finance', 'finance-dashboard');
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-white transition-all"
                >
                  <DollarSign className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Painel Financeiro</div>
                    <div className="text-[10px] text-slate-400">Saldos, repasses e fluxo</div>
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
                    <div className="text-[10px] text-slate-400">Aprovar e auditar</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Results: Clientes */}
          {categories && categories.customers.items.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Clientes ({categories.customers.count})</span>
                <span className="text-[10px] font-normal text-slate-400">Visão Completa</span>
              </div>
              <div className="mt-1 space-y-1">
                {categories.customers.items.map((c: SearchResultItem) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onClose();
                      if (onOpenCustomer) onOpenCustomer(c.id);
                      else onNavigate('search', c.title);
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.title}</div>
                        <div className="text-[11px] text-slate-400">{c.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results: Pedidos */}
          {categories && categories.orders.items.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pedidos ({categories.orders.count})
              </div>
              <div className="mt-1 space-y-1">
                {categories.orders.items.map((ord: SearchResultItem) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      onClose();
                      if (onOpenOrder) onOpenOrder(ord.id);
                      else onNavigate('search', ord.title);
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold font-mono text-white flex items-center gap-2">
                          {ord.title}
                          {ord.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                              {ord.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{ord.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results: Ingressos */}
          {categories && categories.tickets.items.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ingressos ({categories.tickets.count})
              </div>
              <div className="mt-1 space-y-1">
                {categories.tickets.items.map((t: SearchResultItem) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onClose();
                      onNavigate('search', t.title);
                    }}
                    className="flex items-center justify-between rounded-xl p-2.5 text-xs hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold font-mono text-white">{t.title}</div>
                        <div className="text-[11px] text-slate-400">{t.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results: Eventos */}
          {categories && categories.events.items.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Eventos ({categories.events.count})
              </div>
              <div className="mt-1 space-y-1">
                {categories.events.items.map((e: SearchResultItem) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      setEvent(e.id);
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
                        <div className="text-[11px] text-slate-400">{e.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results: Produtores */}
          {categories && categories.producers.items.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Produtores ({categories.producers.count})
              </div>
              <div className="mt-1 space-y-1">
                {categories.producers.items.map((p: SearchResultItem) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProducer(p.id);
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
                        <div className="font-semibold text-white">{p.title}</div>
                        <div className="text-[11px] text-slate-400">{p.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && totalMatches === 0 && !isLoading && (
            <div className="py-10 text-center text-xs text-slate-500">
              Nenhum registro encontrado para &quot;{query}&quot;. Pressione Enter para pesquisar na Central de Consulta.
            </div>
          )}
        </div>

        {/* Footer with Enter Action */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
              ↵ Enter
            </kbd>
            <span>Ver resultados completos na Central de Consulta</span>
          </div>
          {totalMatches > 0 && (
            <button
              onClick={() => {
                onClose();
                onNavigate('search', query);
              }}
              className="text-orange-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{totalMatches} resultados</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
