import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, CheckCircle, RefreshCw, MessageSquare, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { AccountCommercialTimelineDTO, AccountCommercialTimelineEventDTO } from '@shared/types/index';

interface AccountTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName?: string;
}

export const AccountTimelineModal: React.FC<AccountTimelineModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName
}) => {
  const [timeline, setTimeline] = useState<AccountCommercialTimelineDTO | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && producerId) {
      loadTimeline();
    }
  }, [isOpen, producerId]);

  const loadTimeline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await CommercialAccountsApi.getAccountTimeline(producerId);
      setTimeline(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar linha do tempo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const events = (timeline?.events || []).filter((e) => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CONTRACT':
      case 'AMENDMENT':
        return <FileText className="h-4 w-4 text-emerald-400" />;
      case 'RENEWAL':
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      case 'OPPORTUNITY':
        return <ArrowRight className="h-4 w-4 text-purple-400" />;
      case 'PROPOSAL':
        return <FileText className="h-4 w-4 text-indigo-400" />;
      case 'ACTIVITY':
        return <MessageSquare className="h-4 w-4 text-amber-400" />;
      case 'ENTITLEMENT':
        return <ShieldCheck className="h-4 w-4 text-cyan-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'CONTRACT':
      case 'AMENDMENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RENEWAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'OPPORTUNITY':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PROPOSAL':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'ACTIVITY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ENTITLEMENT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Linha do Tempo Comercial</h2>
              <p className="text-xs text-slate-400">
                {producerName || timeline?.producerName || 'Produtor'} • Histórico unificado e factual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'ALL', label: 'Todos os Fatos' },
            { id: 'CONTRACT', label: 'Contratos' },
            { id: 'RENEWAL', label: 'Renovações' },
            { id: 'OPPORTUNITY', label: 'Oportunidades' },
            { id: 'PROPOSAL', label: 'Propostas' },
            { id: 'ACTIVITY', label: 'Relacionamento' },
            { id: 'ENTITLEMENT', label: 'Habilitações' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm">Agregando cronologia factual dos módulos comerciais...</p>
            </div>
          )}

          {!isLoading && events.length === 0 && (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock className="h-10 w-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium">Nenhum evento registrado nesta categoria.</p>
              <p className="text-xs text-slate-500">
                Os fatos são registrados automaticamente conforme contratos, propostas e contatos ocorrem.
              </p>
            </div>
          )}

          {!isLoading && events.length > 0 && (
            <div className="relative pl-6 border-l border-slate-800 space-y-6">
              {events.map((evt) => (
                <div key={evt.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1.5 p-1 bg-slate-900 border border-slate-700 rounded-full group-hover:border-indigo-500 transition">
                    {getCategoryIcon(evt.category)}
                  </div>

                  <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1.5 hover:border-slate-600 transition">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded border ${getCategoryBadgeClass(evt.category)}`}>
                          {evt.category}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{evt.title}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>{evt.actorName ? `Por: ${evt.actorName}` : 'Sistema'}</span>
                      {evt.referencePublicCode && (
                        <span className="font-mono text-indigo-400">{evt.referencePublicCode}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
