import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  X,
  User,
  ShoppingBag,
  Ticket,
  CreditCard,
  Headphones,
  RotateCcw,
  Calendar,
  Building2,
  Megaphone,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  CategorizedSearchResults,
  SearchResultItem,
  CustomerCompleteView,
  OrderCompleteView,
  EntityType
} from './search.types';
import { CustomerCompleteModal } from './CustomerCompleteModal';
import { OrderCompleteModal } from './OrderCompleteModal';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';

interface QueryCenterViewProps {
  initialQuery?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

type CategoryFilter =
  | 'all'
  | 'customers'
  | 'orders'
  | 'tickets'
  | 'payments'
  | 'events'
  | 'producers'
  | 'supportTickets'
  | 'refunds'
  | 'campaigns'
  | 'documents';

export const QueryCenterView: React.FC<QueryCenterViewProps> = ({
  initialQuery = '',
  onNavigate
}) => {
  const { apiFetch, activeProducer, activeEvent, isGlobalScope } = useDiskContext();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [scopeMode, setScopeMode] = useState<'context' | 'global'>('context');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [results, setResults] = useState<CategorizedSearchResults | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCompleteView | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderCompleteView | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches
  const loadRecent = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/search/recent');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recent)) {
          setRecentSearches(data.recent.map((r: any) => r.query));
        }
      }
    } catch {
      // Fallback
    }
  }, [apiFetch]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Execute unified search
  const executeSearch = useCallback(
    async (searchTerm: string, forcedScope = scopeMode) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setResults(null);
        setErrorBanner(null);
        return;
      }

      setIsLoading(true);
      setErrorBanner(null);

      try {
        const url = `/api/v1/search?q=${encodeURIComponent(searchTerm.trim())}&scope=${forcedScope}`;
        const res = await apiFetch(url);

        if (res.status === 429) {
          setErrorBanner(
            'Limite de consultas de documentos/CPF excedido por política de segurança anti-enumeração. Ação auditada preventivamente.'
          );
          setResults(null);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Erro na busca: ${res.statusText}`);
        }

        const data: CategorizedSearchResults = await res.json();
        setResults(data);
        loadRecent();
      } catch (err: any) {
        console.error('Search error:', err);
        setErrorBanner('Não foi possível conectar ao servidor de busca unificada.');
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch, scopeMode, loadRecent]
  );

  // Debounced search on input change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query || query.trim().length < 2) {
      setResults(null);
      setErrorBanner(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(query);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, executeSearch]);

  // Open Visão Completa do Cliente
  const handleOpenCustomer = async (customerId: string) => {
    setLoadingModal(true);
    try {
      const res = await apiFetch(`/api/v1/search/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
        setIsCustomerModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  // Open Visão do Pedido
  const handleOpenOrder = async (orderIdOrNumber: string) => {
    setLoadingModal(true);
    try {
      const res = await apiFetch(`/api/v1/search/orders/${orderIdOrNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
        setIsOrderModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'CUSTOMER':
        return <User className="h-4 w-4 text-orange-400" />;
      case 'ORDER':
        return <ShoppingBag className="h-4 w-4 text-emerald-400" />;
      case 'TICKET':
        return <Ticket className="h-4 w-4 text-cyan-400" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-purple-400" />;
      case 'EVENT':
        return <Calendar className="h-4 w-4 text-sky-400" />;
      case 'PRODUCER':
        return <Building2 className="h-4 w-4 text-amber-400" />;
      case 'SUPPORT':
        return <Headphones className="h-4 w-4 text-indigo-400" />;
      case 'REFUND':
        return <RotateCcw className="h-4 w-4 text-rose-400" />;
      case 'CAMPAIGN':
        return <Megaphone className="h-4 w-4 text-pink-400" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 text-cyan-400" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  const categories = results?.categories;
  const totalMatches = results?.totalMatches || 0;

  // Flattened items based on active category pill
  const displayedItems: SearchResultItem[] = (() => {
    if (!categories) return [];
    if (activeCategory === 'all') {
      return [
        ...categories.customers.items,
        ...categories.orders.items,
        ...categories.tickets.items,
        ...categories.payments.items,
        ...categories.events.items,
        ...categories.producers.items,
        ...categories.supportTickets.items,
        ...categories.refunds.items,
        ...categories.campaigns.items,
        ...(categories.documents?.items || [])
      ];
    }
    return categories[activeCategory]?.items || [];
  })();

  const formatDetectedType = (detected?: string) => {
    switch (detected) {
      case 'CPF':
        return 'CPF do Cliente';
      case 'ORDER_CODE':
        return 'Código do Pedido';
      case 'TICKET_CODE':
        return 'Código de Ingresso';
      case 'PAYMENT_CODE':
        return 'Transação de Pagamento';
      case 'REFUND_CODE':
        return 'Protocolo de Estorno';
      case 'SUPPORT_CODE':
        return 'Protocolo SAC';
      case 'EMAIL':
        return 'E-mail do Cliente';
      case 'PHONE':
        return 'Telefone de Contato';
      default:
        return 'Texto Livre / Geral';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Central de Consulta</h1>
            <Badge variant="primary" size="sm">
              Fase 1.1.5.6 Real
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Motor de Busca Global Inteligente e Visão Completa do Cliente com governança RBAC e LGPD
          </p>
        </div>

        {/* Scope Context Indicator & Toggle */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-2 px-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-400" />
            <span className="text-slate-400">Contexto:</span>
            <strong className="text-white">{activeProducer ? activeProducer.name : 'Todas as Produtoras'}</strong>
            {activeEvent && (
              <span className="text-slate-300">• {activeEvent.title}</span>
            )}
          </div>

          {(currentUser.roleSlug === 'admin_geral' || isGlobalScope) && (
            <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-3">
              <button
                onClick={() => {
                  const newMode = scopeMode === 'context' ? 'global' : 'context';
                  setScopeMode(newMode);
                  if (query) executeSearch(query, newMode);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                  scopeMode === 'global'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {scopeMode === 'global' ? 'Visão Global Ativa' : 'Alternar para Global'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 shadow-2xl p-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
          <Search className="h-6 w-6 text-orange-400 ml-3 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Digite CPF, Código do Pedido (PED-...), Ingresso (ING-...), Transação, SAC, Nome, E-mail ou Telefone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none pr-4"
            autoFocus
          />

          {isLoading && (
            <RefreshCw className="h-4 w-4 text-orange-400 animate-spin mr-3 shrink-0" />
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-mono text-slate-300 shrink-0 mr-2">
            <span>⌘</span>K
          </kbd>
        </div>

        {/* Intent Detector Badge */}
        {results?.detectedType && (
          <div className="flex items-center gap-2 mt-2 px-1 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Intenção reconhecida:</span>
            <strong className="text-orange-400 font-semibold">{formatDetectedType(results.detectedType)}</strong>
            <span className="text-slate-600">•</span>
            <span>{totalMatches} resultado(s) encontrado(s)</span>
          </div>
        )}
      </div>

      {/* Security Error Alert (e.g. 429 Anti-enumeration) */}
      {errorBanner && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-xs text-rose-300 animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="flex-1 font-medium">{errorBanner}</div>
        </div>
      )}

      {/* Recent Searches Chips */}
      {recentSearches.length > 0 && !results && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Consultas Recentes:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 6).map((term, i) => (
              <button
                key={`${term}-${i}`}
                onClick={() => {
                  setQuery(term);
                  executeSearch(term);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:border-orange-500/40 hover:bg-slate-800 transition-colors"
              >
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      {results && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: 'Todos', count: totalMatches },
            { id: 'customers', label: 'Clientes', count: categories?.customers.count || 0 },
            { id: 'orders', label: 'Pedidos', count: categories?.orders.count || 0 },
            { id: 'tickets', label: 'Ingressos', count: categories?.tickets.count || 0 },
            { id: 'payments', label: 'Pagamentos', count: categories?.payments.count || 0 },
            { id: 'events', label: 'Eventos', count: categories?.events.count || 0 },
            { id: 'producers', label: 'Produtores', count: categories?.producers.count || 0 },
            { id: 'supportTickets', label: 'Tickets SAC', count: categories?.supportTickets.count || 0 },
            { id: 'refunds', label: 'Estornos', count: categories?.refunds.count || 0 },
            { id: 'campaigns', label: 'Campanhas', count: categories?.campaigns.count || 0 },
            { id: 'documents', label: 'Documentos', count: categories?.documents?.count || 0 }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryFilter)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeCategory === cat.id ? 'bg-black/25 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results Container */}
      {results && (
        <div className="space-y-4">
          {displayedItems.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-slate-800/80 bg-slate-950/40 p-8">
              <Search className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">Nenhum resultado encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Não localizamos itens para &quot;{query}&quot; nesta categoria ou dentro do escopo operacional ativo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedItems.map((item) => (
                <div
                  key={`${item.entityType}-${item.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 hover:border-orange-500/40 hover:bg-slate-900 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/60 shrink-0">
                          {getEntityIcon(item.entityType)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.entityType}
                          </div>
                        </div>
                      </div>

                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'default'} size="sm">
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-4">
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                      {item.eventName || item.producerName || 'Disk Interno'}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.entityType === 'CUSTOMER' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Eye className="h-3 w-3" />}
                          onClick={() => handleOpenCustomer(item.id)}
                        >
                          Visão Completa
                        </Button>
                      )}

                      {item.entityType === 'ORDER' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Eye className="h-3 w-3" />}
                          onClick={() => handleOpenOrder(item.id)}
                        >
                          Visão do Pedido
                        </Button>
                      )}

                      {item.entityType === 'TICKET' && item.meta?.orderId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Eye className="h-3 w-3" />}
                          onClick={() => handleOpenOrder(item.meta!.orderId)}
                        >
                          Ver Pedido
                        </Button>
                      )}

                      {item.entityType === 'EVENT' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ArrowRight className="h-3 w-3" />}
                          onClick={() => onNavigate?.('events', 'events-all')}
                        >
                          Ver Evento
                        </Button>
                      )}

                      {item.entityType === 'PRODUCER' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ArrowRight className="h-3 w-3" />}
                          onClick={() => onNavigate?.('commercial', 'commercial-producers')}
                        >
                          Ver Produtor
                        </Button>
                      )}

                      {item.entityType === 'CAMPAIGN' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ArrowRight className="h-3 w-3" />}
                          onClick={() => onNavigate?.('marketing', 'marketing-campaigns')}
                        >
                          Ver Campanha
                        </Button>
                      )}

                      {item.entityType === 'DOCUMENT' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Eye className="h-3 w-3" />}
                          onClick={() => onNavigate?.('documents')}
                        >
                          Ver na Central
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CustomerCompleteModal
        data={selectedCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSelectOrder={(orderId) => {
          setIsCustomerModalOpen(false);
          handleOpenOrder(orderId);
        }}
      />

      <OrderCompleteModal
        data={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        onOpenCustomer={(customerId) => {
          setIsOrderModalOpen(false);
          handleOpenCustomer(customerId);
        }}
      />
    </div>
  );
};
