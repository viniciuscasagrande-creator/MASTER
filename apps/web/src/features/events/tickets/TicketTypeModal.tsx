import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  EventTicketTypeDTO,
  CreateEventTicketTypeInput,
  TicketTypeCategory,
  EventSectionDTO,
  TicketTypeDTO
} from '@shared/types/index';
import { fetchTicketTypeCatalog } from '../api/ticket-types.api';

interface TicketTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateEventTicketTypeInput) => Promise<void>;
  ticketTypeToEdit?: EventTicketTypeDTO | null;
  sections: EventSectionDTO[];
}

const CATEGORIES: { value: TicketTypeCategory; label: string; desc: string }[] = [
  { value: 'INTEIRA', label: 'Inteira', desc: 'Ingresso padrão sem desconto' },
  { value: 'MEIA', label: 'Meia-Entrada', desc: 'Conforme Lei nº 12.933/2013' },
  { value: 'SOCIAL', label: 'Social / Solidário', desc: 'Desconto com doação de alimento' },
  { value: 'VIP', label: 'VIP / Camarote', desc: 'Acesso exclusivo ou open bar' },
  { value: 'PROMOTIONAL', label: 'Promocional', desc: 'Exige código ou cupom de desconto' },
  { value: 'CORTESIA', label: 'Cortesia', desc: 'Ingresso gratuito para staff/parceiros' },
  { value: 'COMBO', label: 'Combo / Passaporte', desc: 'Válido para múltiplos dias' },
  { value: 'OTHER', label: 'Outro', desc: 'Modalidade personalizada' }
];

export const TicketTypeModal: React.FC<TicketTypeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ticketTypeToEdit,
  sections
}) => {
  const [catalog, setCatalog] = useState<TicketTypeDTO[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<TicketTypeCategory>('INTEIRA');
  const [description, setDescription] = useState('');
  const [halfPriceLawCompliance, setHalfPriceLawCompliance] = useState(false);
  const [requiresDocument, setRequiresDocument] = useState(false);
  const [documentType, setDocumentType] = useState('STUDENT_OR_OFFICIAL_ID');
  const [requiresCode, setRequiresCode] = useState(false);
  const [requiresBenefit, setRequiresBenefit] = useState(false);
  const [benefitDescription, setBenefitDescription] = useState('1kg de alimento não perecível');
  const [minPerOrder, setMinPerOrder] = useState(1);
  const [maxPerOrder, setMaxPerOrder] = useState(6);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<Array<{ name: string; description?: string }>>([]);
  const [newBenefitName, setNewBenefitName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketTypeCatalog().then(setCatalog).catch(console.error);
  }, []);

  useEffect(() => {
    if (ticketTypeToEdit) {
      setName(ticketTypeToEdit.name);
      setCode(ticketTypeToEdit.code);
      setCategory(ticketTypeToEdit.category);
      setDescription(ticketTypeToEdit.description || '');
      setHalfPriceLawCompliance(ticketTypeToEdit.halfPriceLawCompliance ?? false);
      setRequiresDocument(ticketTypeToEdit.requiresDocument ?? false);
      setDocumentType(ticketTypeToEdit.documentType || 'STUDENT_OR_OFFICIAL_ID');
      setRequiresCode(ticketTypeToEdit.requiresCode ?? false);
      setRequiresBenefit(ticketTypeToEdit.requiresBenefit ?? false);
      setBenefitDescription(ticketTypeToEdit.benefitDescription || '');
      setMinPerOrder(ticketTypeToEdit.minPerOrder || 1);
      setMaxPerOrder(ticketTypeToEdit.maxPerOrder || 6);
      setSelectedSectionIds((ticketTypeToEdit.sections || []).map(s => s.eventSectionId));
      setBenefits((ticketTypeToEdit.benefits || []).map(b => ({ name: b.name, description: b.description || '' })));
    } else {
      setName('');
      setCode('');
      setCategory('INTEIRA');
      setDescription('');
      setHalfPriceLawCompliance(false);
      setRequiresDocument(false);
      setDocumentType('STUDENT_OR_OFFICIAL_ID');
      setRequiresCode(false);
      setRequiresBenefit(false);
      setBenefitDescription('1kg de alimento não perecível');
      setMinPerOrder(1);
      setMaxPerOrder(6);
      setSelectedSectionIds(sections.map(s => s.id));
      setBenefits([]);
      setSelectedCatalogId('');
    }
  }, [ticketTypeToEdit, sections, isOpen]);

  const handleCatalogSelect = (catId: string) => {
    setSelectedCatalogId(catId);
    const item = catalog.find(c => c.id === catId);
    if (!item) return;

    setName(item.name);
    setCode(item.code);
    setCategory(item.category);
    setDescription(item.defaultDescription || '');
    setHalfPriceLawCompliance(item.halfPriceLawCompliance);
    setRequiresDocument(item.requiresDocument);
    setDocumentType(item.documentType || 'STUDENT_OR_OFFICIAL_ID');
    setRequiresCode(item.requiresCode);
    setRequiresBenefit(item.requiresBenefit);
    if (item.benefitDescription) setBenefitDescription(item.benefitDescription);
  };

  const handleCategoryChange = (cat: TicketTypeCategory) => {
    setCategory(cat);
    if (cat === 'MEIA') {
      setHalfPriceLawCompliance(true);
      setRequiresDocument(true);
      setMaxPerOrder(2);
    } else if (cat === 'SOCIAL') {
      setRequiresBenefit(true);
      setBenefitDescription('1kg de alimento não perecível');
    } else if (cat === 'PROMOTIONAL') {
      setRequiresCode(true);
    }
  };

  const handleToggleSection = (secId: string) => {
    if (selectedSectionIds.includes(secId)) {
      setSelectedSectionIds(selectedSectionIds.filter(id => id !== secId));
    } else {
      setSelectedSectionIds([...selectedSectionIds, secId]);
    }
  };

  const handleAddBenefit = () => {
    if (!newBenefitName.trim()) return;
    setBenefits([...benefits, { name: newBenefitName.trim() }]);
    setNewBenefitName('');
  };

  const handleRemoveBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do tipo de ingresso é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        ticketTypeId: selectedCatalogId || undefined,
        name: name.trim(),
        code: code.trim() || undefined,
        category,
        description: description.trim() || undefined,
        halfPriceLawCompliance,
        requiresDocument,
        documentType: requiresDocument ? documentType : undefined,
        requiresCode,
        requiresBenefit,
        benefitDescription: requiresBenefit ? benefitDescription : undefined,
        minPerOrder,
        maxPerOrder,
        sectionIds: selectedSectionIds,
        benefits
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar tipo de ingresso');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {ticketTypeToEdit ? 'Editar Modalidade de Ingresso' : 'Nova Modalidade de Ingresso'}
              </h2>
              <p className="text-xs text-slate-400">
                Define a modalidade comercial, regras de compra e setores aplicáveis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 mt-4 space-y-5">
          {/* Base Catalog Picker */}
          {!ticketTypeToEdit && catalog.length > 0 && (
            <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded-xl">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Preencher a partir do Catálogo Base
              </label>
              <div className="flex flex-wrap gap-2">
                {catalog.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCatalogSelect(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      selectedCatalogId === cat.id
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nome e Código */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome da Modalidade *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Meia-Entrada Estudante"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Código Interno
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="MEIA_EST"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Categoria Comercial *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    category === cat.value
                      ? 'bg-brand-500/10 border-brand-500 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">{cat.label}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição para o Comprador
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Válido mediante comprovação de matrícula ativa ou carteirinha DNE na portaria."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Regras e Comprovações */}
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Regras e Condições Especiais
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={halfPriceLawCompliance}
                onChange={e => setHalfPriceLawCompliance(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                Computar na cota legal de 40% de meia-entrada (Lei Federal nº 12.933/2013)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresDocument}
                onChange={e => setRequiresDocument(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                Exigir documento comprobatório no check-in/portaria
              </span>
            </label>

            {requiresDocument && (
              <div className="pl-7">
                <input
                  type="text"
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  placeholder="Ex: Carteira de Estudante CIE / DNE oficial"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresBenefit}
                onChange={e => setRequiresBenefit(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                Exige contrapartida social ou doação (Ingresso Solidário)
              </span>
            </label>

            {requiresBenefit && (
              <div className="pl-7">
                <input
                  type="text"
                  value={benefitDescription}
                  onChange={e => setBenefitDescription(e.target.value)}
                  placeholder="Ex: 1kg de alimento não perecível"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresCode}
                onChange={e => setRequiresCode(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">
                Ingresso fechado / requer cupom ou código promocional para liberação
              </span>
            </label>
          </div>

          {/* Limites por pedido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mínimo por Pedido
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={minPerOrder}
                onChange={e => setMinPerOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Máximo por Pedido
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxPerOrder}
                onChange={e => setMaxPerOrder(parseInt(e.target.value) || 6)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Setores Habilitados */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Setores onde esta modalidade é válida
            </label>
            {sections.length === 0 ? (
              <p className="text-xs text-amber-400">Nenhum setor cadastrado neste evento ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map(sec => {
                  const checked = selectedSectionIds.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleToggleSection(sec.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        checked
                          ? 'bg-brand-500/10 border-brand-500/50 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{sec.name}</p>
                        <p className="text-[10px] text-slate-400">Capacidade: {sec.capacity}</p>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        checked ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-700'
                      }`}>
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Benefícios Inclusos */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Benefícios & Inclusões (O que dá direito)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBenefitName}
                onChange={e => setNewBenefitName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddBenefit(); } }}
                placeholder="Ex: Acesso ao Open Bar, Kit Oficial, Área Exclusiva..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {benefits.length > 0 && (
              <div className="space-y-1.5">
                {benefits.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs">
                    <span className="text-slate-200">{b.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : ticketTypeToEdit ? 'Salvar Alterações' : 'Criar Modalidade'}
          </button>
        </div>
      </div>
    </div>
  );
};
