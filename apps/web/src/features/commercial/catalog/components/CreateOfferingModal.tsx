import React, { useState, useEffect } from 'react';
import {
  CommercialOfferingDTO,
  CommercialOfferingType,
  CommercialPricingModel,
  ProposalPayer,
  CommercialOfferingCategoryDTO,
  CommercialFeatureDTO
} from '@shared/types/index';
import { CommercialCatalogApi } from '../api/commercial-catalog.api';
import { X, Plus, Trash2, Layers, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface CreateOfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (offering: CommercialOfferingDTO) => void;
}

export const CreateOfferingModal: React.FC<CreateOfferingModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  if (!isOpen) return null;

  const [categories, setCategories] = useState<CommercialOfferingCategoryDTO[]>([]);
  const [availableOfferings, setAvailableOfferings] = useState<CommercialOfferingDTO[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<CommercialFeatureDTO[]>([]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<CommercialOfferingType>('SERVICE');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState<CommercialPricingModel>('PERCENTAGE');
  const [percentage, setPercentage] = useState<number | ''>(8.0);
  const [amount, setAmount] = useState<number | ''>('');
  const [payer, setPayer] = useState<ProposalPayer>('PRODUCER');
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Composições (para Pacotes e Planos)
  const [compositions, setCompositions] = useState<
    Array<{ childOfferingId: string; quantity: number; required: boolean }>
  >([]);

  // Recursos Técnicos vinculados
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, offs, feats] = await Promise.all([
          CommercialCatalogApi.listCategories(),
          CommercialCatalogApi.listOfferings({ activeOnly: true }),
          CommercialCatalogApi.listFeatures()
        ]);
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
        setAvailableOfferings(offs);
        setAvailableFeatures(feats);
      } catch (err: any) {
        setError('Erro ao carregar dados auxiliares do catálogo.');
      }
    }
    loadData();
  }, []);

  const handleAddComposition = () => {
    if (availableOfferings.length === 0) return;
    setCompositions([
      ...compositions,
      { childOfferingId: availableOfferings[0].id, quantity: 1, required: true }
    ]);
  };

  const handleRemoveComposition = (index: number) => {
    setCompositions(compositions.filter((_, i) => i !== index));
  };

  const handleToggleFeature = (featureId: string) => {
    if (selectedFeatureIds.includes(featureId)) {
      setSelectedFeatureIds(selectedFeatureIds.filter(id => id !== featureId));
    } else {
      setSelectedFeatureIds([...selectedFeatureIds, featureId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome da oferta é obrigatório.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await CommercialCatalogApi.createOffering({
        name: name.trim(),
        code: code.trim() ? code.trim().toUpperCase() : undefined,
        type,
        categoryId,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        defaultPricingModel: pricingModel,
        defaultPercentage: percentage !== '' ? Number(percentage) : undefined,
        defaultAmount: amount !== '' ? Number(amount) : undefined,
        defaultPayer: payer,
        sortOrder: Number(sortOrder) || 0,
        compositions:
          type === 'PACKAGE' || type === 'PLAN'
            ? compositions.map((c, idx) => ({
                childOfferingId: c.childOfferingId,
                quantity: c.quantity,
                required: c.required,
                sortOrder: idx + 1
              }))
            : undefined,
        features: selectedFeatureIds.map(fId => ({
          featureId: fId,
          included: true
        }))
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar oferta comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nova Oferta Comercial Oficial</h2>
              <p className="text-xs text-slate-400">
                Cadastre um Plano, Pacote, Serviço ou Adicional oficial no catálogo DiskIngressos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo da Oferta <span className="text-rose-400">*</span>
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CommercialOfferingType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="PLAN">Plano Oficial (Ticketeria)</option>
                <option value="PACKAGE">Pacote Comercial (Combo)</option>
                <option value="SERVICE">Serviço Comercial</option>
                <option value="MODULE">Módulo Adicional</option>
                <option value="ADD_ON">Insumo / Adicional Físico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoria Comercial <span className="text-rose-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome e Código */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome da Oferta <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Plano Festival Gold, Locação de Validador QR"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Código Interno (Opcional)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: PLAN_GOLD_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 uppercase font-mono"
              />
            </div>
          </div>

          {/* Descrições */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição Comercial Detalhada
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o escopo, entregáveis e diferenciais desta oferta para o produtor..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Modelo de Preço e Condições Padrão Iniciais */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Condições Comerciais Padrão (Versão 1 Inicial)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Modelo de Cobrança</label>
                <select
                  value={pricingModel}
                  onChange={e => setPricingModel(e.target.value as CommercialPricingModel)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="PERCENTAGE">Percentual sobre Ingresso (%)</option>
                  <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                  <option value="PER_TICKET">Valor Fixo por Ingresso (R$)</option>
                  <option value="SUBSCRIPTION">Mensalidade / Assinatura (R$)</option>
                  <option value="HYBRID">Híbrido (% + Fixo)</option>
                </select>
              </div>

              {['PERCENTAGE', 'HYBRID'].includes(pricingModel) && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Percentual Padrão (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={e => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {['FIXED_AMOUNT', 'PER_TICKET', 'SUBSCRIPTION', 'HYBRID'].includes(pricingModel) && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Responsável pelo Pagamento</label>
                <select
                  value={payer}
                  onChange={e => setPayer(e.target.value as ProposalPayer)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="PRODUCER">Produtor (Desconto no Repasse)</option>
                  <option value="BUYER">Comprador (Taxa de Conveniência)</option>
                  <option value="SPLIT">Rateio Compartilhado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Composição de Pacotes (Apenas para PACKAGE ou PLAN) */}
          {(type === 'PACKAGE' || type === 'PLAN') && (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Composição do Pacote / Itens Incluídos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione as ofertas e serviços que integram esta solução
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddComposition}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Item
                </Button>
              </div>

              {compositions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  Nenhum componente adicionado. O pacote pode ser composto posteriormente na gestão de versões.
                </p>
              ) : (
                <div className="space-y-2">
                  {compositions.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg"
                    >
                      <select
                        value={comp.childOfferingId}
                        onChange={e => {
                          const updated = [...compositions];
                          updated[idx].childOfferingId = e.target.value;
                          setCompositions(updated);
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        {availableOfferings.map(o => (
                          <option key={o.id} value={o.id}>
                            [{o.type}] {o.name} ({o.publicCode})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Qtd:</span>
                        <input
                          type="number"
                          min="1"
                          value={comp.quantity}
                          onChange={e => {
                            const updated = [...compositions];
                            updated[idx].quantity = Math.max(1, Number(e.target.value));
                            setCompositions(updated);
                          }}
                          className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 text-center"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={comp.required}
                          onChange={e => {
                            const updated = [...compositions];
                            updated[idx].required = e.target.checked;
                            setCompositions(updated);
                          }}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600"
                        />
                        Obrigatório
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveComposition(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recursos Técnicos (Features) */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Recursos Técnicos da Solução (Features de Catálogo)
            </h3>
            <p className="text-xs text-slate-400">
              Funcionalidades ativadas contratualmente para eventos que utilizarem este item
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {availableFeatures.map(feat => {
                const isSelected = selectedFeatureIds.includes(feat.id);
                return (
                  <label
                    key={feat.id}
                    onClick={() => handleToggleFeature(feat.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                        : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-200">{feat.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{feat.code}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-900/80">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> A criação inicial publica a Versão 1 (v1) ativa automaticamente com hash SHA-256.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500"
            >
              Publicar Oferta no Catálogo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
