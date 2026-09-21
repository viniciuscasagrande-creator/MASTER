import React, { useState } from 'react';
import {
  CommercialOfferingDTO,
  CommercialOfferingVersionDTO
} from '@shared/types/index';
import { CommercialCatalogApi } from '../api/commercial-catalog.api';
import { X, CheckCircle2, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface PublishVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  offering: CommercialOfferingDTO;
  version: CommercialOfferingVersionDTO;
  onPublished: (version: CommercialOfferingVersionDTO) => void;
}

export const PublishVersionModal: React.FC<PublishVersionModalProps> = ({
  isOpen,
  onClose,
  offering,
  version,
  onPublished
}) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const published = await CommercialCatalogApi.publishVersion(version.id, {
        reason: reason.trim() || undefined,
        changeSummary: reason.trim() || version.changeSummary || undefined
      });
      onPublished(published);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao publicar versão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg text-slate-900 dark:text-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publicar Versão v{version.versionNumber}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{offering.publicCode} — {offering.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Hash Criptográfico (SHA-256):</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 font-semibold">
              {version.contentHash.substring(0, 16)}...
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status Atual:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{version.status}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Termos Cadastrados:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{version.defaultTerms?.length || 0} condição(ões)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nota de Homologação / Motivo da Publicação
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Aprovado pelo comitê comercial em reunião ordinária..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Ao publicar, esta versão se tornará a <strong>versão ativa oficial</strong> do catálogo. Novas propostas utilizarão automaticamente estas condições. Propostas e contratos anteriores permanecem isolados sem alteração.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handlePublish}
            loading={submitting}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            Confirmar Publicação
          </Button>
        </div>
      </div>
    </div>
  );
};
