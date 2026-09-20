import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  KeyRound,
  Check,
  ChevronRight
} from 'lucide-react';
import { OperationReadinessDTO, OperationReadinessItemDTO } from '@shared/types/index';

interface OperationReadinessCardProps {
  readiness: OperationReadinessDTO;
  onOverrideItem?: (code: string, reason: string) => Promise<void>;
  isOverriding?: boolean;
}

export const OperationReadinessCard: React.FC<OperationReadinessCardProps> = ({
  readiness,
  onOverrideItem,
  isOverriding = false
}) => {
  const [selectedItem, setSelectedItem] = useState<OperationReadinessItemDTO | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenOverrideModal = (item: OperationReadinessItemDTO) => {
    setSelectedItem(item);
    setOverrideReason('');
    setErrorMsg('');
  };

  const handleConfirmOverride = async () => {
    if (!selectedItem || !onOverrideItem) return;
    if (overrideReason.trim().length < 5) {
      setErrorMsg('Informe uma justificativa operacional válida (mínimo 5 caracteres).');
      return;
    }
    try {
      await onOverrideItem(selectedItem.code, overrideReason);
      setSelectedItem(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao aplicar override');
    }
  };

  const getItemIcon = (status: string, isOverridden?: boolean) => {
    if (isOverridden) {
      return <KeyRound className="w-4 h-4 text-purple-400" />;
    }
    switch (status) {
      case 'READY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'BLOCKED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Prontidão da Operação (Readiness)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Checklist pré-evento de validação de equipe, acessos, documentos e infraestrutura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {readiness.blockingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
              <XCircle className="w-3.5 h-3.5" />
              {readiness.blockingCount} {readiness.blockingCount === 1 ? 'Bloqueio Impeditivo' : 'Bloqueios Impeditivos'}
            </span>
          ) : readiness.warningCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              {readiness.warningCount} {readiness.warningCount === 1 ? 'Aviso de Atenção' : 'Avisos de Atenção'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Todos os Requisitos Validados
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-800/60 mt-2">
        {readiness.items.map((item) => (
          <div key={item.code} className="py-3 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getItemIcon(item.status, item.isOverridden)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{item.label}</span>
                  {item.isOverridden && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Override Autorizado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.message}</p>
                {item.details && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                )}
                {item.isOverridden && item.overrideReason && (
                  <p className="text-[11px] text-purple-400/90 mt-1 italic">
                    Justificativa: "{item.overrideReason}" ({item.overriddenBy || 'Liderança'})
                  </p>
                )}
              </div>
            </div>

            {/* Action button if BLOCKED and not yet overridden */}
            {item.status === 'BLOCKED' && !item.isOverridden && onOverrideItem && (
              <button
                onClick={() => handleOpenOverrideModal(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
              >
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>Override</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Override Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Autorizar Exceção / Override</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Item: <span className="font-semibold text-slate-200">{selectedItem.label}</span>
            </p>
            <p className="text-xs text-red-400/90 mt-1">
              {selectedItem.message}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Justificativa Operacional Obrigatória:
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explique o motivo do override e as medidas mitigatórias adotadas..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {errorMsg && (
                <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={isOverriding}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isOverriding ? 'Salvando...' : 'Confirmar Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
