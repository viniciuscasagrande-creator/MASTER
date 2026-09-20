import React, { useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building,
  Globe,
  Layers
} from 'lucide-react';
import { EventDetailDTO, EventCategoryDTO } from '../../types/event.types';
import { useSlugChecker } from '../hooks/useSlugChecker';

interface EventInformationStepProps {
  event: Partial<EventDetailDTO>;
  categories: EventCategoryDTO[];
  onUpdateField: (field: string, value: any) => void;
  onUpdateMultiple: (fields: Record<string, any>) => void;
}

const AGE_RATINGS = [
  { value: 'Livre', label: 'L', desc: 'Livre para todos os públicos', color: 'bg-emerald-600 text-white' },
  { value: '10', label: '10', desc: 'Não recomendado para menores de 10 anos', color: 'bg-blue-600 text-white' },
  { value: '12', label: '12', desc: 'Não recomendado para menores de 12 anos', color: 'bg-amber-500 text-slate-950' },
  { value: '14', label: '14', desc: 'Não recomendado para menores de 14 anos', color: 'bg-orange-500 text-white' },
  { value: '16', label: '16', desc: 'Não recomendado para menores de 16 anos', color: 'bg-rose-600 text-white' },
  { value: '18', label: '18', desc: 'Não recomendado para menores de 18 anos', color: 'bg-black text-white border border-rose-500' }
];

export const EventInformationStep: React.FC<EventInformationStepProps> = ({
  event,
  categories = [],
  onUpdateField,
  onUpdateMultiple
}) => {
  const {
    slug,
    setSlug,
    isChecking,
    isAvailable,
    suggestedSlug,
    applySuggestedSlug
  } = useSlugChecker(event.slug || '', event.id, (validSlug) => {
    onUpdateField('slug', validSlug);
  });

  // Auto-generate slug when name changes and slug is empty
  const handleNameChange = (newName: string) => {
    onUpdateField('name', newName);
    if (!event.slug || event.slug.trim() === '') {
      const generated = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (generated) {
        setSlug(generated);
      }
    }
  };

  // Resolve subcategories based on selected categoryId
  const selectedCategory = categories.find((c) => c.id === event.categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">1. Informações Básicas do Evento</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Defina o nome oficial, classificação de conteúdo, formato operacional e o link de divulgação.
        </p>
      </div>

      {/* 1. Nome do Evento */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Nome Oficial do Evento <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={event.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Turnê Acústica MPB Curitiba 2026"
          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors shadow-inner"
        />
        <p className="text-[11px] text-slate-500">
          Este será o título principal exibido nos ingressos, comprovantes e canais de venda.
        </p>
      </div>

      {/* 2. Categorias e Subcategorias Hierárquicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Categoria Principal <span className="text-rose-400">*</span>
          </label>
          <select
            value={event.categoryId || ''}
            onChange={(e) => {
              const newCatId = e.target.value;
              onUpdateMultiple({
                categoryId: newCatId || null,
                subcategoryId: null
              });
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
          >
            <option value="">Selecione a categoria...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Subcategoria
          </label>
          <select
            value={event.subcategoryId || ''}
            disabled={!event.categoryId || subcategories.length === 0}
            onChange={(e) => onUpdateField('subcategoryId', e.target.value || null)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">
              {subcategories.length > 0 ? 'Selecione a subcategoria...' : 'Nenhuma subcategoria disponível'}
            </option>
            {subcategories.map((sub: any) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Formato do Evento (Presencial, Online, Híbrido) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Formato do Evento <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'IN_PERSON',
              title: 'Presencial',
              desc: 'Com local físico, controle de portaria e check-in presencial',
              icon: Building
            },
            {
              id: 'ONLINE',
              title: 'Online',
              desc: 'Transmissão remota por link seguro e plataforma web',
              icon: Globe
            },
            {
              id: 'HYBRID',
              title: 'Híbrido',
              desc: 'Público presencial no local + transmissão online simultânea',
              icon: Layers
            }
          ].map((fmt) => {
            const isSelected = (event.format || 'IN_PERSON') === fmt.id;
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.id}
                onClick={() => onUpdateField('format', fmt.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/40 text-white shadow-md'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-orange-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{fmt.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{fmt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Classificação Indicativa */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Classificação Indicativa (Ministério da Justiça)
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map((rating) => {
            const isSelected = (event.ageRating || 'Livre') === rating.value;
            return (
              <button
                key={rating.value}
                type="button"
                onClick={() => onUpdateField('ageRating', rating.value)}
                title={rating.desc}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? `${rating.color} ring-2 ring-white/40 shadow-lg scale-102`
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span className="font-mono">{rating.label}</span>
                <span className="font-normal text-[11px]">{rating.value === 'Livre' ? 'Livre' : `${rating.value} anos`}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={event.ageRatingDescription || ''}
          onChange={(e) => onUpdateField('ageRatingDescription', e.target.value)}
          placeholder="Descrição complementar (ex: 'Contém linguagem imprópria e drogas lícitas')"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 5. Slug Amigável com verificação em tempo real */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="block text-xs font-semibold text-slate-300">
          Identificador Amigável (Slug da URL) <span className="text-rose-400">*</span>
        </label>
        <div className="flex rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 shadow-inner">
          <span className="inline-flex items-center px-3 text-xs text-slate-400 bg-slate-850 border-r border-slate-700 select-none font-mono">
            diskingressos.com.br/evento/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="nome-do-evento-2026"
            className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center pr-3">
            {isChecking && <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}
            {!isChecking && isAvailable === true && (
              <span title="Slug disponível" className="flex items-center text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
            {!isChecking && isAvailable === false && (
              <span title="Slug já em uso" className="flex items-center text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        {/* Slug availability status & suggestion */}
        {!isChecking && isAvailable === false && suggestedSlug && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <span>Este slug já está em uso por outro evento.</span>
            <button
              type="button"
              onClick={applySuggestedSlug}
              className="flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 bg-slate-850 px-2.5 py-1 rounded border border-orange-500/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Usar sugestão: <strong className="font-mono text-white">{suggestedSlug}</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
