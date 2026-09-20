import React, { useState } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Star,
  FileImage,
  Info
} from 'lucide-react';
import { EventDetailDTO, EventMediaDTO } from '../../types/event.types';

interface EventMediaStepProps {
  event: Partial<EventDetailDTO>;
  mediaList?: EventMediaDTO[];
  onUpdateField: (field: string, value: any) => void;
  onUpdateMultiple: (fields: Record<string, any>) => void;
}

export const EventMediaStep: React.FC<EventMediaStepProps> = ({
  event,
  mediaList = [],
  onUpdateField,
  onUpdateMultiple
}) => {
  const [mockDocumentId, setMockDocumentId] = useState('');

  // Simulator for associating a document from DocumentService
  const handleLinkDocumentAsCover = (docId: string) => {
    if (!docId.trim()) return;
    onUpdateField('coverDocumentId', docId.trim());
    setMockDocumentId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">5. Identidade Visual e Mídias</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Faça a gestão da imagem de capa, banner horizontal e fotos oficiais do evento vinculadas ao DocumentService.
        </p>
      </div>

      {/* 1. Imagem de Capa Principal */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-bold text-white">Imagem de Capa Principal (Card e Ingressos)</span>
          </div>
          {event.coverDocumentId ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Capa Vinculada
            </span>
          ) : (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Capa Pendente
            </span>
          )}
        </div>

        {/* Upload / Document Linking Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="h-44 rounded-xl border-2 border-dashed border-slate-700 bg-slate-850/60 flex flex-col items-center justify-center p-4 text-center hover:border-orange-500/60 transition-colors">
            {event.coverDocumentId ? (
              <div className="space-y-2">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileImage className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-white">
                  Document ID: <span className="font-mono text-emerald-400">{event.coverDocumentId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateField('coverDocumentId', null)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Remover capa vinculada
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-8 w-8 text-slate-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">
                  Arraste a imagem ou informe o Document ID
                </div>
                <div className="text-[10px] text-slate-500">
                  Recomendado: 1200x800px (3:2) • JPG, PNG ou WEBP até 5MB
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Vincular Documento do DocumentService
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mockDocumentId}
                  onChange={(e) => setMockDocumentId(e.target.value)}
                  placeholder="Ex: doc_cover_mpb_01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleLinkDocumentAsCover(mockDocumentId)}
                  disabled={!mockDocumentId.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-orange-400 hover:bg-orange-300 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Vincular
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-850/80 border border-slate-750 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Conforme diretrizes de governança da DiskIngressos, mídias são persistidas e versionadas centralmente pelo <strong>DocumentService</strong>, garantindo integridade de armazenamento e CDN rápida.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banner Horizontal e Galeria */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            Banner Superior / Hero do Site de Vendas (1920x600px)
          </span>
          <span className="text-[11px] text-slate-500">Opcional</span>
        </div>

        <div className="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-850/40 flex items-center justify-center text-center p-3 text-xs text-slate-500">
          Banner panorâmico para destaque no topo do portal DiskIngressos (dimensões recomendadas 1920x600px).
        </div>
      </div>
    </div>
  );
};
