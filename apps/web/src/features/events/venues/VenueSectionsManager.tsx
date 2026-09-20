import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Layers, AlertCircle, Check, X } from 'lucide-react';
import { VenueSectionDTO, VenueSectionType, CreateVenueSectionInput } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';

interface VenueSectionsManagerProps {
  venueId: string;
  venueCapacity?: number | null;
  sections: VenueSectionDTO[];
  onAddSection: (input: CreateVenueSectionInput) => Promise<void>;
  onUpdateSection: (sectionId: string, input: Partial<CreateVenueSectionInput> & { active?: boolean }) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
}

export const VENUE_SECTION_TYPE_LABELS: Record<VenueSectionType, string> = {
  GENERAL_ADMISSION: 'Pista / Em Pé (Geral)',
  SEATED: 'Cadeiras Numeradas',
  TABLE: 'Mesas / Bistrôs',
  BOX: 'Camarotes / Frisas',
  VIP: 'Área VIP / Premium',
  TECHNICAL: 'Área Técnica / Produção',
  ACCESS_ONLY: 'Circulação / Acesso'
};

const COLOR_PRESETS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b'  // slate
];

export const VenueSectionsManager: React.FC<VenueSectionsManagerProps> = ({
  venueId,
  venueCapacity,
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<VenueSectionType>('GENERAL_ADMISSION');
  const [capacity, setCapacity] = useState<number>(100);
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  // Quick in-line capacity edit
  const [inlineCapId, setInlineCapId] = useState<string | null>(null);
  const [inlineCapVal, setInlineCapVal] = useState<number>(0);

  const totalSectionsCapacity = sections.reduce((acc, s) => acc + (s.active ? s.capacity : 0), 0);

  const handleOpenAddModal = () => {
    setEditingSectionId(null);
    setName('');
    setType('GENERAL_ADMISSION');
    setCapacity(100);
    setColor(COLOR_PRESETS[sections.length % COLOR_PRESETS.length]);
    setDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sec: VenueSectionDTO) => {
    setEditingSectionId(sec.id);
    setName(sec.name);
    setType(sec.type);
    setCapacity(sec.capacity);
    setColor(sec.color || '#3b82f6');
    setDescription(sec.description || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Informe o nome do setor.');
      return;
    }
    if (capacity <= 0) {
      setErrorMessage('A capacidade deve ser maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (editingSectionId) {
        await onUpdateSection(editingSectionId, {
          name,
          type,
          capacity,
          color,
          description
        });
      } else {
        await onAddSection({
          name,
          type,
          capacity,
          color,
          description,
          active: true
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar setor físico');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveInlineCap = async (secId: string) => {
    if (inlineCapVal <= 0) return;
    try {
      await onUpdateSection(secId, { capacity: inlineCapVal });
      setInlineCapId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar capacidade');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Setores Físicos Cadastrados
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Divisão física do espaço (arquibancadas, camarotes, pistas). Cada setor possui capacidade nominal própria.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Setor Físico
        </button>
      </div>

      {/* Capacity Health Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Soma das Capacidades Nominais: <span className="font-mono text-cyan-400">{formatNumber(totalSectionsCapacity)}</span> lugares
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {venueCapacity
                ? `Capacidade global informada no Local: ${formatNumber(venueCapacity)} lugares.`
                : 'Capacidade nominal global não definida.'}
            </div>
          </div>
        </div>

        {venueCapacity && totalSectionsCapacity > venueCapacity && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Atenção: A soma dos setores excede a capacidade global do local ({formatNumber(venueCapacity)}).</span>
          </div>
        )}
      </div>

      {/* Sections Table / Cards */}
      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/30">
          <Layers className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Nenhum setor físico configurado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cadastre os setores físicos deste local (ex: Pista, Camarote 1, Cadeira Inferior) para que possam ser utilizados nos eventos e mapas.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-orange-400 font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Cadastrar primeiro setor
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3">Tipo Físico</th>
                <th className="px-4 py-3">Capacidade Nominal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sections.map((sec) => {
                const isEditingThisCap = inlineCapId === sec.id;

                return (
                  <tr key={sec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: sec.color || '#3b82f6' }}
                        />
                        <div>
                          <div className="font-bold text-white">{sec.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{sec.code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="cyan" size="sm">
                        {VENUE_SECTION_TYPE_LABELS[sec.type] || sec.type}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {isEditingThisCap ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={inlineCapVal}
                            onChange={(e) => setInlineCapVal(parseInt(e.target.value, 10) || 0)}
                            className="w-24 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white font-mono"
                          />
                          <button
                            onClick={() => handleSaveInlineCap(sec.id)}
                            className="p-1 rounded hover:bg-slate-700 text-emerald-400"
                            title="Salvar"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setInlineCapId(null)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setInlineCapId(sec.id);
                            setInlineCapVal(sec.capacity);
                          }}
                          className="cursor-pointer font-mono font-bold text-white hover:text-orange-400 flex items-center gap-1.5 group"
                          title="Clique para editar capacidade"
                        >
                          <span>{formatNumber(sec.capacity)}</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-500" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onUpdateSection(sec.id, { active: !sec.active })}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                          sec.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {sec.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(sec)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Editar setor"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover o setor "${sec.name}"?`)) {
                              onDeleteSection(sec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Excluir setor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar / Editar Setor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingSectionId ? 'Editar Setor Físico' : 'Novo Setor Físico'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nome do Setor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pista Premium, Cadeira Superior A"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tipo Físico <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VenueSectionType)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="GENERAL_ADMISSION">Pista / Em Pé</option>
                    <option value="SEATED">Cadeiras Numeradas</option>
                    <option value="TABLE">Mesas / Bistrôs</option>
                    <option value="BOX">Camarote / Frisa</option>
                    <option value="VIP">Área VIP / Premium</option>
                    <option value="TECHNICAL">Área Técnica</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Capacidade Nominal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seletor de Cor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Cor de Identificação no Mapa
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
                    title="Cor personalizada"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Descrição / Orientações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Acesso pela rampa leste. Visão frontal do palco."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-semibold shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? 'Salvando...' : editingSectionId ? 'Atualizar Setor' : 'Adicionar Setor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
