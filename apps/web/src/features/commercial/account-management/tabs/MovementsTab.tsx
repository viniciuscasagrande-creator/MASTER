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
          <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Upgrade
          </span>
        );
      case 'DOWNGRADE':
        return (
          <span className="px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" /> Downgrade
          </span>
        );
      case 'EXPANSION':
        return (
          <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> Expansão
          </span>
        );
      case 'ADDITIONAL_SERVICE':
        return (
          <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <Tag className="h-3 w-3" /> Serviço Adicional
          </span>
        );
      case 'RENEWAL':
        return (
          <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Renovação
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full">{type}</span>;
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedType === btn.id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenImpactModal()}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Simulador de Impacto</span>
          </button>

          <button
            onClick={onOpenCreateMovement}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Carregando movimentações de contas...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma oportunidade de movimentação cadastrada nesta categoria.
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                  {/* Oportunidade & Título */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{m.title}</div>
                    <div className="text-[11px] text-indigo-400 font-mono">{m.publicCode}</div>
                  </td>

                  {/* Produtor */}
                  <td className="px-4 py-3 text-slate-300 font-medium">
                    {m.producerName}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3">
                    {getMovementBadge(m.movementType)}
                  </td>

                  {/* Etapa */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-[11px]">
                      {m.stageName || m.stageCode}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-4 py-3 text-slate-200 font-medium">
                    {m.estimatedValue ? (
                      `R$ ${m.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="px-4 py-3 text-slate-400">
                    {m.ownerName || 'Executivo'}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenImpactModal(m.producerId, m.producerName)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
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
