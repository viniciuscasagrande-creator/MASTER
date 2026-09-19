import React, { useState } from 'react';
import { X, Camera, Lock, Check } from 'lucide-react';
import { SavedReport } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SavedReport | null;
  onConfirmSnapshot: (reportId: string, title: string, notes?: string) => Promise<void>;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirmSnapshot
}) => {
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const defaultTitle = `Snapshot Fechamento - ${report.title} (${new Date().toLocaleDateString('pt-BR')})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmSnapshot(report.id, title || defaultTitle, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Congelar Foto (Snapshot)</h2>
              <p className="text-xs text-slate-400">Fechamento fiscal e histórico imutável</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-sm">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="h-3.5 w-3.5" />
              Garantia de Imutabilidade
            </div>
            <p className="mt-1 text-slate-300">
              O snapshot grava uma foto exata dos dados neste instante. Transações futuras ou reprocessamentos não alterarão os números deste fechamento.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Título do Snapshot
            </label>
            <input
              type="text"
              defaultValue={defaultTitle}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Notas e Justificativa de Fechamento
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Fechamento contábil mensal final após conciliação bancária e auditoria externa."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Congelando...' : 'Confirmar Snapshot'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
