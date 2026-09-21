import React, { useState } from 'react';
import {
  CommercialOfferingDTO,
  CommercialOfferingVersionDTO,
  ProposalTermType,
  CommercialPricingModel,
  ProposalPayer
} from '@shared/types/index';
import { CommercialCatalogApi } from '../api/commercial-catalog.api';
import { X, GitBranch, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface NewVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  offering: CommercialOfferingDTO;
  onVersionCreated: (version: CommercialOfferingVersionDTO) => void;
}

export const NewVersionModal: React.FC<NewVersionModalProps> = ({
  isOpen,
  onClose,
  offering,
  onVersionCreated
}) => {
  if (!isOpen) return null;

  const currentVer = offering.currentVersion;
  const nextVersionNumber = offering.currentVersionNumber + 1;

  const [nameSnapshot, setNameSnapshot] = useState(offering.name);
  const [descriptionSnapshot, setDescriptionSnapshot] = useState(offering.description || '');
  const [changeSummary, setChangeSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Termos iniciais baseados na versão corrente
  const initialTerm = currentVer?.defaultTerms?.[0];
  const [percentage, setPercentage] = useState<number | ''>(
    initialTerm?.percentage !== undefined && initialTerm?.percentage !== null ? initialTerm.percentage : 8.0
  );
  const [amount, setAmount] = useState<number | ''>(
    initialTerm?.amount !== undefined && initialTerm?.amount !== null ? initialTerm.amount : ''
  );
  const [minimumAmount, setMinimumAmount] = useState<number | ''>(
    initialTerm?.minimumAmount !== undefined && initialTerm?.minimumAmount !== null ? initialTerm.minimumAmount : ''
  );
  const [payer, setPayer] = useState<ProposalPayer>(initialTerm?.payer || 'PRODUCER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!changeSummary.trim()) {
      setError('O resumo das alterações (change summary) é obrigatório para o versionamento.');
      return;
    }

    try {
      setSubmitting(true);
      const draft = await CommercialCatalogApi.createDraftVersion(offering.id, {
        nameSnapshot: nameSnapshot.trim(),
        descriptionSnapshot: descriptionSnapshot.trim() || undefined,
        changeSummary: changeSummary.trim(),
        defaultTerms: [
          {
            termType: (initialTerm?.termType || 'PLATFORM_COMMISSION') as ProposalTermType,
            calculationType: (initialTerm?.calculationType || 'PERCENTAGE') as CommercialPricingModel,
            percentage: percentage !== '' ? Number(percentage) : undefined,
            amount: amount !== '' ? Number(amount) : undefined,
            minimumAmount: minimumAmount !== '' ? Number(minimumAmount) : undefined,
            payer,
            negotiable: true
          }
        ]
      });

      onVersionCreated(draft);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar nova versão do catálogo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Criar Nova Versão (v{nextVersionNumber} Rascunho)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {offering.publicCode} — {offering.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Justificativa / Resumo das Alterações (Obrigatório) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={e => setChangeSummary(e.target.value)}
              placeholder="Ex: Reajuste anual de comissão padrão e inclusão de suporte BI"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome da Oferta Nesta Versão
              </label>
              <input
                type="text"
                value={nameSnapshot}
                onChange={e => setNameSnapshot(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pagador Padrão
              </label>
              <select
                value={payer}
                onChange={e => setPayer(e.target.value as ProposalPayer)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="PRODUCER">Produtor</option>
                <option value="BUYER">Comprador</option>
                <option value="SPLIT">Rateio Compartilhado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição Atualizada
            </label>
            <textarea
              rows={2}
              value={descriptionSnapshot}
              onChange={e => setDescriptionSnapshot(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Revisão de Condições Financeiras Padrão
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={percentage}
                  onChange={e => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Valor Fixo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Garantia Mínima (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={minimumAmount}
                  onChange={e => setMinimumAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Opcional"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> A nova versão iniciará como RASCUNHO e exigirá publicação para se tornar ativa.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                Criar Rascunho v{nextVersionNumber}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
