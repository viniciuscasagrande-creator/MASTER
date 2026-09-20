import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Layers,
  Sparkles,
  Copy,
  Calculator,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  PricingMatrixDTO,
  TicketBatchDTO,
  SavePriceConfigurationInput
} from '@shared/types/index';
import { fetchBatches } from '../api/batches.api';
import {
  fetchPricingMatrix,
  savePriceConfiguration,
  copyPricingFromBatch
} from '../api/pricing.api';
import { Badge } from '../../../shared/components/Badge';
import { formatCurrency, formatNumber } from '../../../shared/utils/formatters';
import { BulkPricingModal } from './BulkPricingModal';
import { PriceSimulatorModal } from './PriceSimulatorModal';

interface EventPricingPageProps {
  eventId: string;
  eventName?: string;
  initialBatchId?: string;
  onNavigateToBatches?: () => void;
  onNavigateToRules?: () => void;
}

export const EventPricingPage: React.FC<EventPricingPageProps> = ({
  eventId,
  eventName,
  initialBatchId,
  onNavigateToBatches,
  onNavigateToRules
}) => {
  const [batches, setBatches] = useState<TicketBatchDTO[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || '');
  const [matrix, setMatrix] = useState<PricingMatrixDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [copyFromModalOpen, setCopyFromModalOpen] = useState(false);
  const [sourceBatchId, setSourceBatchId] = useState<string>('');

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const batchList = await fetchBatches(eventId);
      setBatches(batchList);

      const targetBatchId = selectedBatchId || initialBatchId || batchList.find(b => b.status === 'ACTIVE')?.id || batchList[0]?.id || '';
      if (targetBatchId) {
        setSelectedBatchId(targetBatchId);
        const mat = await fetchPricingMatrix(eventId, targetBatchId);
        setMatrix(mat);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de preços');
    } finally {
      setLoading(false);
    }
  }, [eventId, initialBatchId, selectedBatchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    try {
      setLoading(true);
      const mat = await fetchPricingMatrix(eventId, batchId);
      setMatrix(mat);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar matriz do lote selecionado');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = async (sectionId: string, ticketTypeId: string, newPriceValue: number) => {
    const key = `${sectionId}_${ticketTypeId}`;
    setSavingCellKey(key);

    try {
      const priceInCents = Math.round(newPriceValue * 100);
      const currentCell = matrix?.cells[key];

      await savePriceConfiguration(eventId, {
        ticketBatchId: selectedBatchId,
        eventSectionId: sectionId,
        eventTicketTypeId: ticketTypeId,
        basePriceInCents: priceInCents,
        salePriceInCents: priceInCents,
        active: true,
        feeComponents: currentCell?.feeComponents || [
          { name: 'Taxa de Conveniência (10%)', type: 'PERCENTAGE', value: 10, payer: 'BUYER' }
        ]
      });

      // Recarrega matriz atualizada
      const updated = await fetchPricingMatrix(eventId, selectedBatchId);
      setMatrix(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar preço');
    } finally {
      setSavingCellKey(null);
    }
  };

  const handleExecuteCopy = async () => {
    if (!sourceBatchId || !selectedBatchId) return;

    try {
      setLoading(true);
      await copyPricingFromBatch(eventId, sourceBatchId, selectedBatchId);
      const updated = await fetchPricingMatrix(eventId, selectedBatchId);
      setMatrix(updated);
      setCopyFromModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao copiar preços');
    } finally {
      setLoading(false);
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Fase 1.2.6 — Precificação & Matriz Comercial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Tabela de Preços & Taxas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventName ? `Evento: ${eventName}` : 'Matriz de setores por modalidade com cálculo transparente de taxas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToBatches && (
            <button
              onClick={onNavigateToBatches}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Gerenciar Lotes</span>
            </button>
          )}

          {onNavigateToRules && (
            <button
              onClick={onNavigateToRules}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Regras de Venda</span>
            </button>
          )}

          <button
            onClick={() => setSimulatorModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-300 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulador de Taxas</span>
          </button>

          {matrix && (
            <button
              onClick={() => setBulkModalOpen(true)}
              className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reajuste em Massa</span>
            </button>
          )}

          <button
            onClick={loadBatches}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs / Batch Picker */}
      <div className="flex items-center justify-between gap-3 p-2 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {batches.map(batch => (
            <button
              key={batch.id}
              onClick={() => handleSelectBatch(batch.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                selectedBatchId === batch.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{batch.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                batch.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {batch.status === 'ACTIVE' ? 'Ativo' : batch.status === 'SOLD_OUT' ? 'Esgotado' : batch.status}
              </span>
            </button>
          ))}
        </div>

        {batches.length > 1 && (
          <button
            onClick={() => setCopyFromModalOpen(true)}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar de outro lote</span>
          </button>
        )}
      </div>

      {/* Pricing Matrix Table */}
      {!matrix || matrix.sections.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
          <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">Nenhum setor ou lote selecionado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Configure setores e modalidades de ingresso no evento para habilitar a matriz de preços.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Matriz de Preços — {selectedBatch?.name}
              </h2>
              <p className="text-xs text-slate-400">
                Altere o valor base de cada célula. O preço ao comprador e o repasse líquido são calculados automaticamente.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Total Comprador</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-400" /> Líquido Produtor</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-3 w-48">Setor Operacional</th>
                  {matrix.ticketTypes.map(tt => (
                    <th key={tt.id} className="pb-3 px-3 text-center min-w-[160px]">
                      <div className="font-semibold text-slate-200">{tt.name}</div>
                      <span className="text-[10px] text-brand-400 font-normal">({tt.category})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrix.sections.map(sec => (
                  <tr key={sec.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-3">
                      <div className="font-semibold text-slate-200">{sec.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Capacidade: {formatNumber(sec.capacity)}
                      </span>
                    </td>

                    {matrix.ticketTypes.map(tt => {
                      const key = `${sec.id}_${tt.id}`;
                      const cell = matrix.cells[key];
                      const isSaving = savingCellKey === key;
                      const basePrice = cell ? cell.basePriceInCents / 100 : 0;
                      const buyerTotal = cell ? cell.buyerTotalInCents / 100 : 0;
                      const producerNet = cell ? cell.producerNetInCents / 100 : 0;

                      return (
                        <td key={tt.id} className="py-3 px-2 text-center align-top">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all">
                            {/* Input Preço Base */}
                            <div>
                              <label className="text-[10px] text-slate-500 block uppercase font-medium mb-1">
                                Preço Base (R$)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  defaultValue={basePrice}
                                  onBlur={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    if (val !== basePrice) {
                                      handlePriceChange(sec.id, tt.id, val);
                                    }
                                  }}
                                  className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-brand-500"
                                />
                              </div>
                            </div>

                            {/* Detalhamento calculado */}
                            {basePrice > 0 ? (
                              <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                                <div className="flex justify-between text-slate-400">
                                  <span>Total Comprador:</span>
                                  <strong className="text-emerald-400 font-mono">
                                    {formatCurrency(buyerTotal)}
                                  </strong>
                                </div>
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>Líquido Produtor:</span>
                                  <strong className="text-blue-400 font-mono">
                                    {formatCurrency(producerNet)}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1 text-[10px] text-slate-600 italic">
                                Não configurado
                              </div>
                            )}

                            {isSaving && (
                              <div className="text-[10px] text-brand-400 animate-pulse">
                                Salvando...
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Reajuste em Massa */}
      {bulkModalOpen && matrix && selectedBatch && (
        <BulkPricingModal
          isOpen={true}
          onClose={() => setBulkModalOpen(false)}
          onApplied={async () => {
            const updated = await fetchPricingMatrix(eventId, selectedBatchId);
            setMatrix(updated);
          }}
          eventId={eventId}
          batchId={selectedBatchId}
          batchName={selectedBatch.name}
          matrix={matrix}
        />
      )}

      {/* Modal Simulador */}
      {simulatorModalOpen && (
        <PriceSimulatorModal
          isOpen={true}
          onClose={() => setSimulatorModalOpen(false)}
          eventId={eventId}
        />
      )}

      {/* Modal Copiar de Outro Lote */}
      {copyFromModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
            <h2 className="text-base font-semibold mb-2">Copiar Preços de Outro Lote</h2>
            <p className="text-xs text-slate-400 mb-4">
              Copia todas as configurações e valores do lote de origem para o {selectedBatch?.name}.
            </p>

            <select
              value={sourceBatchId}
              onChange={e => setSourceBatchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 mb-4"
            >
              <option value="">Selecione o lote de origem...</option>
              {batches
                .filter(b => b.id !== selectedBatchId)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}) — {b.pricesCount || 0} preços
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCopyFromModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 bg-slate-800/50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteCopy}
                disabled={!sourceBatchId || loading}
                className="px-4 py-2 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-xl disabled:opacity-50"
              >
                Copiar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
