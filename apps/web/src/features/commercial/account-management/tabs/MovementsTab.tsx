import React, { useState } from 'react';
import { TrendingUp, Sparkles, RefreshCw, Plus, ArrowUpRight, ArrowDownRight, Tag, Layers, Calendar, DollarSign } from 'lucide-react';
import { CommercialMovementDTO, CommercialMovementType } from '@shared/types/index';

interface MovementsTabProps {
  movements: CommercialMovementDTO[];
  isLoading: boolean;
  onOpenCreateMovement: () => void;
  onOpenImpactModal: (producerId?: string, producerName?: string) => void;
}

export const MovementsTab: React.FC<MovementsTabProps> = ({
  movements,
  isLoading,
  onOpenCreateMovement,
  onOpenImpactModal
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filtered = movements.filter((m) => {
    if (selectedType === 'ALL') return true;
    return m.movementType === selectedType;
  });

  const getMovementBadge = (type: CommercialMovementType) => {
    switch (type) {
      case 'UPGRADE':
        return (
          <span className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Upgrade
          </span>
        );
      case 'DOWNGRADE':
        return (
          <span className="px-2 py-0.5 text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" /> Downgrade
          </span>
        );
      case 'EXPANSION':
        return (
          <span className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> Expansão
          </span>
        );
      case 'ADDITIONAL_SERVICE':
        return (
          <span className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <Tag className="h-3 w-3" /> Serviço Adicional
          </span>
        );
      case 'RENEWAL':
        return (
          <span className="px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Renovação
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium">{type}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: `Todas (${movements.length})` },
            { id: 'UPGRADE', label: `Upgrades (${movements.filter(m => m.movementType === 'UPGRADE').length})` },
            { id: 'DOWNGRADE', label: `Downgrades (${movements.filter(m => m.movementType === 'DOWNGRADE').length})` },
            { id: 'EXPANSION', label: `Expansões (${movements.filter(m => m.movementType === 'EXPANSION').length})` },
            { id: 'ADDITIONAL_SERVICE', label: `Serviços Adicionais (${movements.filter(m => m.movementType === 'ADDITIONAL_SERVICE').length})` }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedType(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedType === btn.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenImpactModal()}
            className="px-3.5 py-1.5 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span>Simulador de Impacto</span>
          </button>

          <button
            onClick={onOpenCreateMovement}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3">Oportunidade / Título</th>
                <th className="px-4 py-3">Produtor</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Etapa no Pipeline</th>
                <th className="px-4 py-3">Valor Estimado</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                      <span>Carregando movimentações de contas...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma oportunidade de movimentação cadastrada nesta categoria.
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Oportunidade & Título */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{m.title}</div>
                    <div className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">{m.publicCode}</div>
                  </td>

                  {/* Produtor */}
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                    {m.producerName}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3">
                    {getMovementBadge(m.movementType)}
                  </td>

                  {/* Etapa */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-medium">
                      {m.stageName || m.stageCode}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-200 font-bold">
                    {m.estimatedValue ? (
                      `R$ ${m.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {m.ownerName || 'Executivo'}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenImpactModal(m.producerId, m.producerName)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-orange-700 dark:text-orange-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 shadow-xs"
                      title="Simular Impacto Comercial"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Simular Impacto</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
