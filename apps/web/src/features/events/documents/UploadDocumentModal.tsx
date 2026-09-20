import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { EventDocumentRequirementDTO, UploadEventDocumentInput } from '@shared/types/index';
import { uploadEventDocument } from '../api/documents.api';
import { AlertCircle, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  requirement: EventDocumentRequirementDTO | null;
  onSaved: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  eventId,
  requirement,
  onSaved
}) => {
  const [fileName, setFileName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!requirement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError('Informe o nome do arquivo anexado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: UploadEventDocumentInput = {
        requirementId: requirement.id,
        documentName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        fileSize: '2.1 MB',
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        notes: notes.trim() ? notes : undefined
      };
      await uploadEventDocument(eventId, input);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao anexar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Anexar Documento: ${requirement.categoryName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Zona de Drop Simulada */}
        <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer">
          <UploadCloud className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
          <div className="text-xs font-bold text-white mb-0.5">Arraste o arquivo ou clique para selecionar</div>
          <div className="text-[11px] text-slate-500">PDF, JPG ou PNG com até 15MB</div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Documento / Protocolo</label>
          <input
            type="text"
            placeholder="Ex: AVCB_Arena_Disk_Curitiba_2026.pdf"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Data de Vencimento / Validade</label>
          <input
            type="date"
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Observações do Órgão Emissor</label>
          <textarea
            rows={2}
            placeholder="Número de protocolo, órgão expedidor ou ressalvas da vistoria"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{loading ? 'Salvando...' : 'Confirmar Envio'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
