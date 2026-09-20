import React, { useState, useEffect } from 'react';
import {
  CommercialOfferingCategoryDTO,
  CommercialOfferingDTO,
  ProposalTermType,
  CommercialPricingModel,
  ProposalPayer,
  CommercialModelType
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { X, Plus, Trash2, Sparkles, Building2, Calendar, FileText, Check } from 'lucide-react';

interface ProposalCreateModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (proposal: any) => void;
  onCreated?: (proposal: any) => void;
  initialProducerId?: string;
  initialOpportunityId?: string;
  isNewVersionMode?: boolean;
  parentProposalId?: string;
  expectedVersion?: number;
}

interface TermItem {
  offeringId?: string;
  termType: ProposalTermType;
  name: string;
  calculationType: CommercialPricingModel;
  percentage?: number;
  amount?: number;
  payer: ProposalPayer;
  splitProducerPercentage?: number;
  splitBuyerPercentage?: number;
  conditions?: string;
}

interface EventItem {
  estimatedEventName: string;
  estimatedDate?: string;
  estimatedVenue?: string;
  estimatedTickets?: number;
  estimatedGrossRevenue?: number;
}

export const ProposalCreateModal: React.FC<ProposalCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCreated,
  initialProducerId,
  initialOpportunityId,
  isNewVersionMode = false,
  parentProposalId,
  expectedVersion
}) => {
  if (isOpen === false) return null;

  const [producers, setProducers] = useState<any[]>([]);
  const [categories, setCategories] = useState<CommercialOfferingCategoryDTO[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [producerId, setProducerId] = useState(initialProducerId || '');
  const [opportunityId, setOpportunityId] = useState(initialOpportunityId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [commercialModel, setCommercialModel] = useState<CommercialModelType>('STANDARD');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Structured Terms
  const [terms, setTerms] = useState<TermItem[]>([
    {
      termType: 'PLATFORM_COMMISSION',
      name: 'Comissão de Plataforma DiskIngressos',
      calculationType: 'PERCENTAGE',
      percentage: 8.0,
      payer: 'PRODUCER',
      conditions: 'Válido para vendas online'
    }
  ]);

  // Event Scope References
  const [events, setEvents] = useState<EventItem[]>([
    {
      estimatedEventName: '',
      estimatedTickets: undefined,
      estimatedGrossRevenue: undefined
    }
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [cats, prods] = await Promise.all([
          CommercialApi.listOfferingCategories().catch(() => []),
          // List producers using core api if available, otherwise mock list
          fetch('/api/v1/commercial/producers', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
        ]);

        setCategories(cats);
        if (Array.isArray(prods)) {
          setProducers(prods);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  // Quick addition from Commercial Offering Catalog
  const handleAddFromCatalog = (offering: CommercialOfferingDTO) => {
    const newTerm: TermItem = {
      offeringId: offering.id,
      termType: offering.categoryId.includes('access')
        ? 'ACCESS_CONTROL'
        : offering.categoryId.includes('box')
        ? 'BOX_OFFICE'
        : offering.categoryId.includes('mkt')
        ? 'MARKETING'
        : offering.categoryId.includes('eqp')
        ? 'EQUIPMENT'
        : 'PLATFORM_COMMISSION',
      name: offering.name,
      calculationType: offering.defaultPricingModel,
      percentage: offering.defaultPercentage || undefined,
      amount: offering.defaultAmount || undefined,
      payer: offering.defaultPayer,
      conditions: offering.description || ''
    };
    setTerms([...terms, newTerm]);
  };

  const handleRemoveTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const handleUpdateTerm = (index: number, field: keyof TermItem, value: any) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: value };
    setTerms(updated);
  };

  const handleAddEvent = () => {
    setEvents([...events, { estimatedEventName: '' }]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleUpdateEvent = (index: number, field: keyof EventItem, value: any) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setEvents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Informe o título da proposta comercial.');
      return;
    }

    if (!isNewVersionMode && !producerId) {
      setError('Selecione o produtor destinatário da proposta.');
      return;
    }

    if (isNewVersionMode && !changeSummary.trim()) {
      setError('Informe a justificativa/resumo das alterações para esta nova versão.');
      return;
    }

    if (terms.length === 0) {
      setError('Adicione ao menos uma condição comercial de remuneração ou serviço.');
      return;
    }

    try {
      setSubmitting(true);

      const validEvents = events.filter(ev => ev.estimatedEventName.trim() !== '');

      if (isNewVersionMode && parentProposalId) {
        // Criar Nova Versão (V2, V3...)
        const result = await CommercialApi.createProposalVersion(parentProposalId, {
          changeSummary,
          title,
          validUntil,
          commercialModel,
          terms,
          events: validEvents,
          notes,
          internalNotes,
          expectedVersion: expectedVersion || 1
        });
        onCreated?.(result);
        onSuccess?.(result);
      } else {
        // Criar Nova Proposta (V1)
        const result = await CommercialApi.createProposal({
          producerId,
          opportunityId: opportunityId || undefined,
          title,
          description,
          validUntil,
          commercialModel,
          terms,
          events: validEvents,
          notes,
          internalNotes
        });
        onCreated?.(result);
        onSuccess?.(result);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar proposta comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              {isNewVersionMode ? 'Criar Nova Versão da Proposta (Imutável)' : 'Nova Proposta Comercial B2B'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-rose-900/40 border border-rose-800 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Section: Basic Data */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
              1. Identificação da Proposta & Destinatário
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isNewVersionMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Produtor Parceiro *</label>
                  <select
                    value={producerId}
                    onChange={(e) => setProducerId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Selecione o produtor...</option>
                    {producers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.document ? `(${p.document})` : ''}
                      </option>
                    ))}
                    {/* Fallback sample producers */}
                    {producers.length === 0 && (
                      <>
                        <option value="prd_100">Curitiba Live Produções (00.123.456/0001-00)</option>
                        <option value="prd_200">Mega Shows Brasil Entretenimento</option>
                        <option value="prd_300">Teatro & Arte Cultural</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Proposta *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta Comercial — Festival de Verão 2027"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Validade da Proposta *</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo Comercial</label>
                <select
                  value={commercialModel}
                  onChange={(e) => setCommercialModel(e.target.value as CommercialModelType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="STANDARD">Padrão DiskIngressos</option>
                  <option value="EXCLUSIVE">Exclusividade Total de Ticketeria</option>
                  <option value="ENTERPRISE">Grande Porte / Estádio (Enterprise)</option>
                  <option value="CUSTOM">Personalizado / Sob Medida</option>
                </select>
              </div>
            </div>

            {isNewVersionMode && (
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Justificativa da Nova Versão (Obrigatório) *
                </label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Ex: Redução da taxa de comissão de 8% para 7% após contraproposta do produtor."
                  required
                  className="w-full bg-slate-800 border border-amber-600/70 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section: Catalog Quick Pick */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Catálogo Oficial de Ofertas DiskIngressos (Atalho Rápido)
              </h3>
              <span className="text-xs text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Clique para adicionar condição
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {categories.flatMap(cat => cat.offerings || []).slice(0, 8).map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => handleAddFromCatalog(off)}
                  className="p-2 text-left bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-700/60 rounded-lg transition text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                    {off.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {off.defaultPricingModel === 'PERCENTAGE'
                      ? `${off.defaultPercentage}%`
                      : `R$ ${off.defaultAmount}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Structured Commercial Terms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Condições Comerciais Estruturadas ({terms.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setTerms([
                    ...terms,
                    {
                      termType: 'CUSTOM',
                      name: 'Novo Termo Comercial',
                      calculationType: 'PERCENTAGE',
                      percentage: 0,
                      payer: 'PRODUCER'
                    }
                  ])
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Condição
              </button>
            </div>

            <div className="space-y-2">
              {terms.map((term, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={term.name}
                        onChange={(e) => handleUpdateTerm(index, 'name', e.target.value)}
                        placeholder="Nome da Condição / Taxa"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <select
                        value={term.calculationType}
                        onChange={(e) => handleUpdateTerm(index, 'calculationType', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="PERCENTAGE">Percentual (%)</option>
                        <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                        <option value="PER_TICKET">Por Ingresso (R$)</option>
                        <option value="HYBRID">Híbrido</option>
                      </select>
                    </div>

                    <div>
                      {term.calculationType === 'PERCENTAGE' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={term.percentage ?? ''}
                            onChange={(e) => handleUpdateTerm(index, 'percentage', parseFloat(e.target.value))}
                            placeholder="Ex: 8.0"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={term.amount ?? ''}
                            onChange={(e) => handleUpdateTerm(index, 'amount', parseFloat(e.target.value))}
                            placeholder="0,00"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={term.payer}
                        onChange={(e) => handleUpdateTerm(index, 'payer', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="PRODUCER">Produtor</option>
                        <option value="BUYER">Comprador (Taxa)</option>
                        <option value="SPLIT">Dividido (Split)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                        title="Remover termo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={term.conditions || ''}
                    onChange={(e) => handleUpdateTerm(index, 'conditions', e.target.value)}
                    placeholder="Regras e condições específicas (ex: Válido até 10.000 ingressos emitidos)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section: Event References */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                4. Escopo de Eventos Estimados
              </h3>
              <button
                type="button"
                onClick={handleAddEvent}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Evento
              </button>
            </div>

            <div className="space-y-2">
              {events.map((evt, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center p-2.5 bg-slate-950 border border-slate-800 rounded-lg"
                >
                  <input
                    type="text"
                    value={evt.estimatedEventName}
                    onChange={(e) => handleUpdateEvent(idx, 'estimatedEventName', e.target.value)}
                    placeholder="Nome Estimado do Evento *"
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={evt.estimatedVenue || ''}
                    onChange={(e) => handleUpdateEvent(idx, 'estimatedVenue', e.target.value)}
                    placeholder="Local / Praça (ex: Pedreira)"
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={evt.estimatedTickets ?? ''}
                    onChange={(e) => handleUpdateEvent(idx, 'estimatedTickets', parseInt(e.target.value) || undefined)}
                    placeholder="Ingressos Estimados"
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={evt.estimatedGrossRevenue ?? ''}
                      onChange={(e) => handleUpdateEvent(idx, 'estimatedGrossRevenue', parseFloat(e.target.value) || undefined)}
                      placeholder="Receita Bruta (R$)"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isNewVersionMode ? 'Publicar Nova Versão' : 'Gerar Proposta Comercial'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
