import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { EventSalesChannelDTO, ConfigureEventSalesChannelInput } from '@shared/types/index';
import { configureChannel, saveChannelAllocation } from '../api/sales-channels.api';
import { fetchEventSessions } from '../api/sessions.api';
import { fetchEventSections } from '../api/venues.api';
import { fetchInventoryPools } from '../api/inventory.api';
import { Check, AlertCircle, Save, Layers, Calendar, MapPin } from 'lucide-react';

interface ConfigureSalesChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  channel: EventSalesChannelDTO | null;
  onSaved: () => void;
}

export const ConfigureSalesChannelModal: React.FC<ConfigureSalesChannelModalProps> = ({
  isOpen,
  onClose,
  eventId,
  channel,
  onSaved
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [enabled, setEnabled] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [allocationLimits, setAllocationLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || !channel) return;

    setEnabled(channel.enabled);
    setSelectedSessions(channel.sessionIds || []);
    setSelectedSections(channel.sectionIds || []);

    const allocMap: Record<string, number> = {};
    (channel.allocations || []).forEach(a => {
      allocMap[a.inventoryPoolId] = a.quantityLimit;
    });
    setAllocationLimits(allocMap);

    // Carrega sessões e setores do evento
    const loadDependencies = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sesData, secsData] = await Promise.all([
          fetchEventSessions(eventId),
          fetchEventSections(eventId)
        ]);
        setSessions(sesData || []);
        setSections(secsData || []);

        if (sesData && sesData.length > 0) {
          const poolsData = await fetchInventoryPools(eventId, sesData[0].id);
          setPools(poolsData || []);
        } else {
          setPools([]);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados do canal:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDependencies();
  }, [isOpen, channel, eventId]);

  const toggleSession = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    setSaving(true);
    setError(null);

    try {
      // 1. Salva escopo do canal
      const input: ConfigureEventSalesChannelInput = {
        salesChannelId: channel.salesChannelId,
        enabled,
        sessionIds: selectedSessions,
        sectionIds: selectedSections
      };
      const updated = await configureChannel(eventId, input);

      // 2. Salva alocações de estoque nos pools se especificadas
      for (const [poolId, limit] of Object.entries(allocationLimits)) {
        if (limit > 0) {
          await saveChannelAllocation(eventId, updated.id, {
            inventoryPoolId: poolId,
            quantityLimit: limit
          });
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configuração do canal');
    } finally {
      setSaving(false);
    }
  };

  if (!channel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar Canal: ${channel.salesChannel?.name || 'Canal de Venda'}`}
      size="xl"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Ativo / Inativo */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <div className="text-sm font-bold text-white">Disponibilidade no Evento</div>
            <div className="text-xs text-slate-400">
              Habilita ou suspende as vendas para este evento através deste canal
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Escopo de Sessões */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Sessões Permitidas (Vazio = Todas as sessões)
            </label>
            <span className="text-[11px] text-slate-500">{selectedSessions.length} selecionada(s)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2">
            {sessions.map(s => {
              const checked = selectedSessions.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSession(s.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    checked
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-white font-medium'
                      : 'border-slate-800/60 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{s.name || `Sessão ${s.sessionNumber || ''}`}</span>
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      checked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
            {sessions.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">Nenhuma sessão encontrada</div>
            )}
          </div>
        </div>

        {/* Escopo de Setores */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              Setores Autorizados (Vazio = Todos os setores)
            </label>
            <span className="text-[11px] text-slate-500">{selectedSections.length} selecionado(s)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2">
            {sections.map(sec => {
              const checked = selectedSections.includes(sec.id);
              return (
                <div
                  key={sec.id}
                  onClick={() => toggleSection(sec.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    checked
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-white font-medium'
                      : 'border-slate-800/60 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{sec.name}</span>
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      checked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
            {sections.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">Nenhum setor cadastrado</div>
            )}
          </div>
        </div>

        {/* Alocação de Estoque sobre Pools (Invariante: Sem Estoque Paralelo) */}
        <div>
          <div className="mb-1 text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Alocações de Estoque por Setor (Teto Máximo Consumível do Pool)
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            O canal consome diretamente do inventário oficial. Definir um limite restringe a quantidade máxima que este canal pode emitir sem criar estoque duplicado.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            {pools.map(p => {
              const sec = sections.find(s => s.id === p.eventSectionId);
              const ses = sessions.find(s => s.id === p.sessionId);
              const curLimit = allocationLimits[p.id] || 0;

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {sec?.name || 'Setor'} <span className="text-slate-500 font-normal">({ses?.name || 'Sessão'})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Capacidade total: <strong className="text-slate-300">{p.capacity}</strong> • Disponível no Pool:{' '}
                      <strong className="text-emerald-400">{p.available ?? p.capacity}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Teto do Canal:</label>
                    <input
                      type="number"
                      min="0"
                      max={p.capacity}
                      value={curLimit === 0 ? '' : curLimit}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setAllocationLimits(prev => ({ ...prev, [p.id]: val }));
                      }}
                      placeholder="Ilimitado"
                      className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white text-right focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
            {pools.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">Nenhum pool de inventário gerado ainda.</div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
