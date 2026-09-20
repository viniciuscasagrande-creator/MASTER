import React from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Ticket,
  Clock,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { EventPreviewTokenDTO } from '@shared/types/index';

interface PublicPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewTokenData: EventPreviewTokenDTO | null;
  eventName: string;
}

export const PublicPreviewModal: React.FC<PublicPreviewModalProps> = ({
  isOpen,
  onClose,
  previewTokenData,
  eventName
}) => {
  if (!isOpen || !previewTokenData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header do Preview */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              PRÉ-VISUALIZAÇÃO PÚBLICA
            </span>
            <span className="text-xs text-slate-400">
              Expira em: {new Date(previewTokenData.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visualização Simulada do Checkout / Portal DiskIngressos */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Banner Hero */}
          <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-slate-800 flex flex-col justify-end p-6">
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-slate-300 border border-white/10">
              Token Seguro: {previewTokenData.token.slice(0, 12)}...
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{eventName}</h1>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Sessões Confirmadas
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Local Oficial Homologado
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Venda Oficial DiskIngressos
              </span>
            </div>
          </div>

          {/* Cards de Ingressos Simulados */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              Ingressos e Lotes Ativos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">Pista Premium - Lote 1</div>
                  <div className="text-xs text-slate-400">Acesso exclusivo em frente ao palco</div>
                  <div className="text-xs text-emerald-400 mt-1">Disponível para venda</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white">R$ 240,00</div>
                  <div className="text-[10px] text-slate-400">+ taxa R$ 24,00</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">Camarote Open Bar - Lote 1</div>
                  <div className="text-xs text-slate-400">Bebidas e lounge exclusivo</div>
                  <div className="text-xs text-emerald-400 mt-1">Disponível para venda</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white">R$ 480,00</div>
                  <div className="text-[10px] text-slate-400">+ taxa R$ 48,00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Link direto de preview */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <div className="font-medium text-blue-300 mb-0.5">Link de Visualização Externa</div>
              <div>Utilize este link temporário para validar o visual com a produção antes da abertura oficial.</div>
            </div>
            <a
              href={previewTokenData.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Link
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Fechar Pré-visualização
          </button>
        </div>
      </div>
    </div>
  );
};
