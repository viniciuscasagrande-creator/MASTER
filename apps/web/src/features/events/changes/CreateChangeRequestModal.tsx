import React, { useState } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  Info,
  Layers,
  Calendar,
  DollarSign,
  Ticket
} from 'lucide-react';
import { EventChangeType, CreateEventChangeRequestInput } from '@shared/types/index';
import { createEventChange } from '../api/changes.api';

interface CreateChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onCreated: () => void;
}

export const CreateChangeRequestModal: React.FC<CreateChangeRequestModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onCreated
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [changeType, setChangeType] = useState<EventChangeType>('SECTION_CAPACITY');
  const [resourceType, setResourceType] = useState('SECTION');
  const [resourceId, setResourceId] = useState('');
  const [field, setField] = useState('capacity');
  const [fieldName, setFieldName] = useState('Capacidade do Setor');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [reason, setReason] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');

  const handleTypeChange = (type: EventChangeType) => {
    setChangeType(type);
    switch (type) {
      case 'SECTION_CAPACITY':
        setResourceType('SECTION');
        setField('capacity');
        setFieldName('Capacidade do Setor');
        break;
      case 'SECTION_NAME':
        setResourceType('SECTION');
        setField('name');
        setFieldName('Nome do Setor');
        break;
      case 'SESSION_DATE':
        setResourceType('SESSION');
        setField('sessionDate');
        setFieldName('Data/Hora da Sessão');
        break;
      case 'BATCH_PRICE':
        setResourceType('BATCH');
        setField('price');
        setFieldName('Preço do Lote');
        break;
      case 'BATCH_QUANTITY':
        setResourceType('BATCH');
        setField('totalQuantity');
        setFieldName('Quantidade do Lote');
        break;
      case 'CHANNEL_STATUS':
        setResourceType('CHANNEL');
        setField('enabled');
        setFieldName('Canal Habilitado');
        break;
      case 'EVENT_DATE':
        setResourceType('EVENT');
        setField('eventDate');
        setFieldName('Data Geral do Evento');
        break;
      default:
        setResourceType('GENERIC');
        setField('generic');
        setFieldName('Configuração');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setErrorMsg('O motivo técnico da alteração é obrigatório (mínimo 5 caracteres).');
      return;
    }
    if (!after) {
      setErrorMsg('Informe o novo valor proposto.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const input: CreateEventChangeRequestInput = {
        resourceType,
        resourceId: resourceId || 'sec_principal',
        changeType,
        reason,
        businessJustification,
        changePayload: {
          field,
          fieldName,
          before: before || null,
          after,
          beforeFormatted: before ? String(before) : '—',
          afterFormatted: String(after)
        }
      };

      await createEventChange(eventId, input);
      onCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Nova Solicitação de Alteração Controlada</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tipo de Alteração
            </label>
            <select
              value={changeType}
              onChange={(e) => handleTypeChange(e.target.value as EventChangeType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="SECTION_CAPACITY">Ajuste de Capacidade de Setor (SECTION_CAPACITY)</option>
              <option value="SECTION_NAME">Renomear Setor (SECTION_NAME)</option>
              <option value="SESSION_DATE">Alteração de Data/Horário de Sessão (SESSION_DATE)</option>
              <option value="BATCH_PRICE">Ajuste de Preço do Lote (BATCH_PRICE)</option>
              <option value="BATCH_QUANTITY">Ajuste de Quantidade do Lote (BATCH_QUANTITY)</option>
              <option value="CHANNEL_STATUS">Ativação/Pausa de Canal de Vendas (CHANNEL_STATUS)</option>
              <option value="EVENT_DATE">Alteração de Data Geral do Evento (EVENT_DATE)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Valor Atual (Antes)
              </label>
              <input
                type="text"
                value={before}
                onChange={(e) => setBefore(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-emerald-400 block mb-1">
                Novo Valor (Depois) *
              </label>
              <input
                type="text"
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                placeholder="Ex: 6000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              ID do Recurso / Setor / Lote
            </label>
            <input
              type="text"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder="Ex: sec_pista_01 ou batch_lote_1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Motivo Técnico da Alteração *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva a razão técnica ou operacional desta solicitação..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Justificativa Comercial (Opcional)
            </label>
            <input
              type="text"
              value={businessJustification}
              onChange={(e) => setBusinessJustification(e.target.value)}
              placeholder="Ex: Autorizado pela produção executiva e alinhado com o contratante."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-center gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Uma análise de impacto imediata será executada ao submeter a solicitação.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/30"
            >
              {loading ? 'Criando Solicitação...' : 'Criar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
