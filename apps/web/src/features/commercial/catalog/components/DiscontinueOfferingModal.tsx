import React, { useState, useEffect } from 'react';
import {
  CommercialOfferingDTO,
  CommercialCatalogImpactDTO
} from '@shared/types/index';
import { CommercialCatalogApi } from '../api/commercial-catalog.api';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, FileText, Layers, Building2 } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface DiscontinueOfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  offering: CommercialOfferingDTO;
  onDiscontinued: (offering: CommercialOfferingDTO) => void;
}

export const DiscontinueOfferingModal: React.FC<DiscontinueOfferingModalProps> = ({
  isOpen,
  onClose,
  offering,
  onDiscontinued
}) => {
  if (!isOpen) return null;

  const [impact, setImpact] = useState<CommercialCatalogImpactDTO | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadImpact() {
      try {
        setLoadingImpact(true);
        const data = await CommercialCatalogApi.getOfferingImpact(offering.id);
        setImpact(data);
      } catch (err: any) {
        setError('Não foi possível calcular o impacto da descontinuação.');
      } finally {
        setLoadingImpact(false);
      }
    }
    loadImpact();
  }, [offering.id]);

  const handleDiscontinue = async () => {
    if (!reason.trim()) {
      setError('Informe o motivo da descontinuação da oferta.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await CommercialCatalogApi.discontinueOffering(offering.id, {
        reason: reason.trim()
      });
      onDiscontinued(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao descontinuar oferta comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl text-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Descontinuar Oferta Comercial</h2>
              <p className="text-xs text-slate-400">{offering.publicCode} — {offering.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Impact Cards */}
        {loadingImpact ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Calculando impacto comercial e contratual em tempo real...
          </div>
        ) : impact ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              Relatório de Impacto no Ecossistema Comercial:
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Rascunhos</p>
                <p className="text-lg font-bold text-amber-400">{impact.draftProposalsCount}</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Enviadas</p>
                <p className="text-lg font-bold text-indigo-400">{impact.sentProposalsCount}</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Contratos Ativos</p>
                <p className="text-lg font-bold text-emerald-400">{impact.activeContractsCount}</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Pacotes Pai</p>
                <p className="text-lg font-bold text-purple-400">{impact.parentPackagesCount}</p>
              </div>
            </div>

            {impact.parentPackages.length > 0 && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <span className="text-slate-400 font-semibold">Pacotes que utilizam este item:</span>
                <p className="text-slate-300">
                  {impact.parentPackages.map(p => `${p.name} (${p.publicCode})`).join(', ')}
                </p>
              </div>
            )}

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Garantia de Não-Ruptura:</strong> Todas as propostas aceitas e contratos em vigor mantêm seus snapshots originais intactos. Nenhuma taxa sofrerá alteração retroativa. Apenas novas seleções serão bloqueadas.
              </span>
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Motivo da Descontinuação <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Substituído pelo novo Plano 2027 ou descontinuação de insumo físico..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDiscontinue}
            loading={submitting}
            className="bg-amber-600 hover:bg-amber-500 text-white border-none"
          >
            Confirmar Descontinuação
          </Button>
        </div>
      </div>
    </div>
  );
};
