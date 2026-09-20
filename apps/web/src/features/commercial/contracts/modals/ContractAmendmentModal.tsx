import React, { useState } from 'react';
import {
  ContractAmendmentType,
  ProposalTermType,
  CommercialPricingModel,
  ProposalPayer,
  ContractAmendmentDTO
} from '@shared/types/index';
import { CommercialContractsApi } from '../api/commercial-contracts.api';
import { X, FileDiff, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface ContractAmendmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractCode: string;
  onSuccess?: (amendment: ContractAmendmentDTO) => void;
}

interface TermItem {
  termType: ProposalTermType;
  name: string;
  calculationType: CommercialPricingModel;
  percentage?: number;
  amount?: number;
  payer: ProposalPayer;
  splitProducerPercentage?: number;
  conditions?: string;
}

export const ContractAmendmentModal: React.FC<ContractAmendmentModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contractCode,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<ContractAmendmentType>('COMMERCIAL_TERMS');
  const [effectiveFrom, setEffectiveFrom] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional updated terms if COMMERCIAL_TERMS
  const [terms, setTerms] = useState<TermItem[]>([
    {
      termType: 'PLATFORM_COMMISSION',
      name: 'Comissão de Plataforma (Repactuada)',
      calculationType: 'PERCENTAGE',
      percentage: 7.5,
      payer: 'PRODUCER',
      conditions: 'Nova condição repactuada em aditivo'
    }
  ]);

  const handleAddTerm = () => {
    setTerms(prev => [
      ...prev,
      {
        termType: 'CUSTOM',
        name: 'Taxa de Conveniência Aditiva',
        calculationType: 'PERCENTAGE',
        percentage: 10.0,
        payer: 'BUYER'
      }
    ]);
  };

  const handleRemoveTerm = (index: number) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTerm = (index: number, field: keyof TermItem, value: any) => {
    setTerms(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A justificativa/motivo do aditivo é obrigatória.');
      return;
    }
    if (!summary.trim()) {
      setError('O resumo descritivo das alterações é obrigatório.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const amendment = await CommercialContractsApi.createAmendment(contractId, {
        type,
        effectiveFrom,
        reason: reason.trim(),
        summary: summary.trim(),
        terms:
          type === 'COMMERCIAL_TERMS'
            ? terms.map(t => ({
                termType: t.termType,
                name: t.name,
                calculationType: t.calculationType,
                percentage: t.percentage ? Number(t.percentage) : undefined,
                amount: t.amount ? Number(t.amount) : undefined,
                payer: t.payer,
                splitProducerPercentage: t.splitProducerPercentage
                  ? Number(t.splitProducerPercentage)
                  : undefined,
                conditions: t.conditions
              }))
            : undefined
      });

      onSuccess?.(amendment);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao lavrar aditivo contratual.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400 border border-orange-500/20">
              <FileDiff className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lavrar Aditivo Contratual (Amendment)</h2>
              <p className="text-xs text-slate-400">
                Alteração formal e versionada para o contrato <span className="font-mono text-white">{contractCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm flex-1">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tipo do Aditivo *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ContractAmendmentType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="COMMERCIAL_TERMS">Repactuação de Condições Comerciais / Taxas</option>
                <option value="VALIDITY_EXTENSION">Prorrogação de Vigência</option>
                <option value="SCOPE_CHANGE">Expansão de Escopo Operacional</option>
                <option value="SERVICE_INCLUSION">Inclusão de Novos Serviços</option>
                <option value="SERVICE_REMOVAL">Remoção de Serviços Contratados</option>
                <option value="LEGAL_CLAUSE">Alteração de Cláusulas Jurídicas</option>
                <option value="OTHER">Outros Ajustes Contratuais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Vigência das Novas Regras (effectiveFrom) *
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Motivo Formal da Alteração *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Renegociação anual de taxas para festival de verão..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Resumo Descritivo das Modificações *
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Descreva claramente o que está sendo ajustado em relação ao contrato original..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>

          {/* If terms change, provide terms editor */}
          {type === 'COMMERCIAL_TERMS' && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200">
                  Novas Condições Repactuadas
                </div>
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-orange-400 hover:bg-slate-700 border border-slate-700"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar Taxa
                </button>
              </div>

              <div className="space-y-2">
                {terms.map((term, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] text-slate-400">Tipo de Taxa</label>
                      <select
                        value={term.termType}
                        onChange={e => handleUpdateTerm(index, 'termType', e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                      >
                        <option value="PLATFORM_COMMISSION">Comissão de Plataforma</option>
                        <option value="ACCESS_CONTROL">Controle de Acesso</option>
                        <option value="BOX_OFFICE">Bilheteria Física</option>
                        <option value="MARKETING">Marketing & Divulgação</option>
                        <option value="EQUIPMENT">Equipamentos & Hardware</option>
                        <option value="SETUP_FEE">Taxa de Configuração</option>
                        <option value="CUSTOM">Taxa Personalizada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400">Descrição</label>
                      <input
                        type="text"
                        value={term.name}
                        onChange={e => handleUpdateTerm(index, 'name', e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400">Percentual (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={term.percentage ?? ''}
                        onChange={e =>
                          handleUpdateTerm(index, 'percentage', e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400">Pagador</label>
                        <select
                          value={term.payer}
                          onChange={e => handleUpdateTerm(index, 'payer', e.target.value)}
                          className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                        >
                          <option value="PRODUCER">Produtor</option>
                          <option value="BUYER">Comprador Final</option>
                        </select>
                      </div>

                      {terms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(index)}
                          className="text-slate-500 hover:text-rose-400 p-1 mb-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20"
            >
              {submitting ? 'Registrando...' : 'Criar Aditivo Contratual'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
