import React, { useState } from 'react';
import { Plus, Trash2, LogIn, ShieldCheck, AlertTriangle, X, Check } from 'lucide-react';
import { VenueAccessPointDTO, VenueAccessPointType } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';

interface VenueAccessPointsManagerProps {
  venueId: string;
  accessPoints: VenueAccessPointDTO[];
  onAddAccessPoint: (input: { name: string; code?: string; type: VenueAccessPointType; active?: boolean }) => Promise<void>;
  onUpdateAccessPoint: (id: string, input: { active?: boolean; name?: string; type?: VenueAccessPointType }) => Promise<void>;
  onDeleteAccessPoint: (id: string) => Promise<void>;
}

export const ACCESS_POINT_TYPE_LABELS: Record<VenueAccessPointType, string> = {
  MAIN_ENTRANCE: 'Entrada Principal / Bilheteria',
  GATE: 'Portão Geral / Catracas',
  VIP_GATE: 'Acesso VIP / Hospitality',
  CREDENTIALS: 'Credenciamento / Imprensa',
  STAFF: 'Entrada de Serviço / Staff',
  EMERGENCY_EXIT: 'Saída de Emergência'
};

export const VenueAccessPointsManager: React.FC<VenueAccessPointsManagerProps> = ({
  venueId,
  accessPoints,
  onAddAccessPoint,
  onUpdateAccessPoint,
  onDeleteAccessPoint
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<VenueAccessPointType>('GATE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setName('');
    setCode('');
    setType('GATE');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Informe a identificação do portão ou acesso.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onAddAccessPoint({
        name,
        code: code.trim() ? code.trim() : undefined,
        type,
        active: true
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar ponto de acesso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LogIn className="h-4 w-4 text-emerald-400" />
            Portões, Catracas e Acessos Físicos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro de pontos de controle de fluxo e validação de ingressos do local.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo Portão / Acesso
        </button>
      </div>

      {accessPoints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/30">
          <LogIn className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Nenhum portão ou acesso cadastrado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Adicione os portões de acesso do espaço (ex: Portão Principal, Portão B, Acesso VIP) para vinculação com os setores e controle de catracas.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-orange-400 font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Cadastrar primeiro portão
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Identificação</th>
                <th className="px-4 py-3">Tipo de Acesso</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {accessPoints.map((ap) => (
                <tr key={ap.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{ap.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{ap.code}</div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="emerald" size="sm">
                      {ACCESS_POINT_TYPE_LABELS[ap.type] || ap.type}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => onUpdateAccessPoint(ap.id, { active: !ap.active })}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        ap.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {ap.active ? 'Habilitado' : 'Desabilitado'}
                    </button>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remover o acesso "${ap.name}"?`)) {
                          onDeleteAccessPoint(ap.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Excluir portão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Novo Acesso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Novo Portão ou Acesso</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nome do Acesso <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Portão A, Catraca VIP 01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Tipo Operacional <span className="text-rose-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as VenueAccessPointType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="MAIN_ENTRANCE">Entrada Principal / Bilheteria</option>
                  <option value="GATE">Portão Geral / Catracas</option>
                  <option value="VIP_GATE">Acesso VIP / Hospitality</option>
                  <option value="CREDENTIALS">Credenciamento / Imprensa</option>
                  <option value="STAFF">Entrada de Serviço / Staff</option>
                  <option value="EMERGENCY_EXIT">Saída de Emergência</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Código Curto de Catraca (opcional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: GTA, VIP-01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 font-mono uppercase focus:border-orange-500 focus:outline-none"
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
                  {isSubmitting ? 'Salvando...' : 'Cadastrar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
