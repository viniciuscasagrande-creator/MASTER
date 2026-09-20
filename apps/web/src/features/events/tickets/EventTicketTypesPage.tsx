import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileText,
  Gift,
  Layers,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  EventTicketTypeDTO,
  EventSectionDTO,
  CreateEventTicketTypeInput,
  TicketTypeCategory
} from '@shared/types/index';
import {
  fetchEventTicketTypes,
  createEventTicketType,
  updateEventTicketType,
  deleteEventTicketType
} from '../api/ticket-types.api';
import { fetchEventSections } from '../api/venues.api';
import { Badge } from '../../../shared/components/Badge';
import { TicketTypeModal } from './TicketTypeModal';

interface EventTicketTypesPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToPricing?: () => void;
  onNavigateToSections?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  INTEIRA: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  MEIA: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  SOCIAL: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  VIP: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  PROMOTIONAL: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  CORTESIA: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  COMBO: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
};

export const EventTicketTypesPage: React.FC<EventTicketTypesPageProps> = ({
  eventId,
  eventName,
  onNavigateToPricing,
  onNavigateToSections
}) => {
  const [ticketTypes, setTicketTypes] = useState<EventTicketTypeDTO[]>([]);
  const [sections, setSections] = useState<EventSectionDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EventTicketTypeDTO | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tts, secs] = await Promise.all([
        fetchEventTicketTypes(eventId),
        fetchEventSections(eventId).catch(() => [])
      ]);
      setTicketTypes(tts);
      setSections(secs);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tipos de ingresso');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingType(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type: EventTicketTypeDTO) => {
    setEditingType(type);
    setModalOpen(true);
  };

  const handleSubmitModal = async (input: CreateEventTicketTypeInput) => {
    if (editingType) {
      await updateEventTicketType(eventId, editingType.id, input);
    } else {
      await createEventTicketType(eventId, input);
    }
    await loadData();
  };

  const handleDelete = async (type: EventTicketTypeDTO) => {
    if (!window.confirm(`Tem certeza que deseja excluir a modalidade "${type.name}"?`)) return;

    try {
      await deleteEventTicketType(eventId, type.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir modalidade');
    }
  };

  const filteredTypes = ticketTypes.filter(tt => {
    const matchesSearch = tt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tt.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || tt.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
            <Tag className="w-3.5 h-3.5" />
            <span>Fase 1.2.5 — Modalidades Comerciais</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Tipos e Modalidades de Ingresso
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventName ? `Evento: ${eventName}` : 'Inteira, meia-entrada legal, social, VIP e cortesias'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToSections && (
            <button
              onClick={onNavigateToSections}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Ver Setores</span>
            </button>
          )}
          {onNavigateToPricing && (
            <button
              onClick={onNavigateToPricing}
              className="px-3.5 py-1.5 text-xs font-medium bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Configurar Preços & Lotes</span>
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Modalidade</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="INTEIRA">Inteira</option>
            <option value="MEIA">Meia-Entrada</option>
            <option value="SOCIAL">Social / Solidário</option>
            <option value="VIP">VIP / Camarote</option>
            <option value="PROMOTIONAL">Promocional</option>
            <option value="CORTESIA">Cortesia</option>
            <option value="COMBO">Combo</option>
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors ml-auto"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticket Types Cards Grid */}
      {filteredTypes.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
          <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">Nenhuma modalidade encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Crie tipos como Inteira, Meia-Entrada legal, Ingresso Social ou Área VIP para comercializar nos setores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTypes.map(tt => {
            const colors = CATEGORY_COLORS[tt.category] || CATEGORY_COLORS.INTEIRA;

            return (
              <div
                key={tt.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-md border uppercase tracking-wider mb-1.5 ${colors.bg} ${colors.text} ${colors.border}`}>
                        {tt.category}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100 leading-snug">
                        {tt.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {tt.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(tt)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar modalidade"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tt)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Excluir modalidade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tt.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {tt.description}
                    </p>
                  )}

                  {/* Badges / Conditions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tt.halfPriceLawCompliance && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        <ShieldCheck className="w-3 h-3" /> Cota Legal 40% (Lei 12.933)
                      </span>
                    )}
                    {tt.requiresDocument && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                        <FileText className="w-3 h-3" /> Exige Comprovante
                      </span>
                    )}
                    {tt.requiresBenefit && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        <Gift className="w-3 h-3" /> Solidário: {tt.benefitDescription || '1kg alimento'}
                      </span>
                    )}
                    {tt.requiresCode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-500/10 border border-pink-500/20 text-pink-300">
                        Cupom Obrigatório
                      </span>
                    )}
                  </div>

                  {/* Benefícios Inclusos */}
                  {tt.benefits && tt.benefits.length > 0 && (
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                        Benefícios Inclusos:
                      </span>
                      <ul className="text-xs text-slate-300 space-y-0.5">
                        {tt.benefits.map((b, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                            <span>{b.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom: Sectors and Limits */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Limites por pedido:</span>
                    <span className="text-slate-200 font-medium">
                      Mín {tt.minPerOrder} — Máx {tt.maxPerOrder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Habilitado em:</span>
                    <span className="text-slate-200 font-medium">
                      {(tt.sections || []).length} setor(es)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TicketTypeModal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitModal}
          ticketTypeToEdit={editingType}
          sections={sections}
        />
      )}
    </div>
  );
};
