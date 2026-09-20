import React, { useState } from 'react';
import { Plus, Map, Edit3, CheckCircle2, History, X, AlertCircle } from 'lucide-react';
import { VenueMapDTO } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';
import { formatDateTime } from '../../../shared/utils/formatters';

interface VenueMapsListProps {
  venueId: string;
  maps: VenueMapDTO[];
  onCreateMap: (input: { name: string; description?: string }) => Promise<VenueMapDTO>;
  onOpenMapEditor: (mapId: string, versionId?: string) => void;
}

export const VenueMapsList: React.FC<VenueMapsListProps> = ({
  venueId,
  maps,
  onCreateMap,
  onOpenMapEditor
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Informe um nome para a planta / mapa.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const newMap = await onCreateMap({
        name,
        description: description.trim() ? description.trim() : undefined
      });
      setIsModalOpen(false);
      // Auto-open editor on the newly created map
      if (newMap?.id) {
        onOpenMapEditor(newMap.id, newMap.activeVersionId || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar mapa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Map className="h-4 w-4 text-purple-400" />
            Plantas & Mapas Gráficos do Espaço
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Diferentes configurações físicas do mesmo local (ex: Palco Frontal 360°, Teatro Clássico, Festival Completo).
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setDescription('');
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova Planta / Layout
        </button>
      </div>

      {maps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/30">
          <Map className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Nenhuma planta configurada para este local</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Crie uma planta para desenhar o palco, posicionar setores em pé e mapear cadeiras/mesas numeradas.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-orange-400 font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar primeira planta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maps.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="purple" size="sm">
                    {m.status === 'ACTIVE' ? 'Planta Ativa' : 'Arquivada'}
                  </Badge>

                  {m.activeVersionNumber && (
                    <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                      <History className="h-3 w-3 text-slate-500" />
                      Versão v{m.activeVersionNumber}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-white">{m.name}</h4>
                {m.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Criado em {formatDateTime(m.createdAt).split(' ')[0]}
                </span>

                <button
                  onClick={() => onOpenMapEditor(m.id, m.activeVersionId || undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Abrir Editor Gráfico
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Planta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Criar Nova Planta de Local</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nome da Configuração / Layout <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Configuração Palco Central 360°, Teatro Padrão"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Descrição do Uso
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Utilizado para grandes shows com palco de 20m no setor norte."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-semibold shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? 'Criando...' : 'Criar e Abrir Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
