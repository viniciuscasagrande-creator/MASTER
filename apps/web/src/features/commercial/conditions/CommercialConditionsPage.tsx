import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  RefreshCw,
  Percent,
  AlertCircle,
  Building2,
  Edit3,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight,
  X,
  History,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useCoreData } from '../../../core/context/CoreDataContext';
import { useDiskContext } from '../../../core/context/DiskContext';

export interface CommercialEventCondition {
  eventId: string;
  eventCode: string;
  eventTitle: string;
  producerId: string;
  producerName: string;
  producerDocument: string;
  status: string;
  salesGross: number;
  ticketsSold: number;
  diskFeeAmount: number;
  serviceFeeType: 'percentage' | 'fixed';
  serviceFeeBps: number;
  serviceFeeFixedCents: number;
  serviceFeePaidBy: 'buyer' | 'producer';
  spreadEnabled: boolean;
  spreadBps: number;
  advancedEnabled: boolean;
  advancedRateBps: number;
  advancedMaxPercent: number;
  payoutTermsDays: number;
  payoutModel: 'pos_evento' | 'semanal' | 'quinzenal';
  contractNumber: string;
  currentVersion: number;
  situation: 'regular' | 'sem_taxa' | 'com_pendencia';
}

export const CommercialConditionsPage: React.FC = () => {
  const { events, producers } = useCoreData();
  const { activeEvent } = useDiskContext();

  const [loading, setLoading] = useState(false);
  const [conditionsList, setConditionsList] = useState<CommercialEventCondition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSituation, setFilterSituation] = useState<'all' | 'regular' | 'sem_taxa' | 'com_pendencia' | 'advanced'>('all');

  // Modals
  const [editingCondition, setEditingCondition] = useState<CommercialEventCondition | null>(null);
  const [dossierCondition, setDossierCondition] = useState<CommercialEventCondition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for editing
  const [formFeeType, setFormFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [formFeePercent, setFormFeePercent] = useState('10.0');
  const [formFeeFixed, setFormFeeFixed] = useState('5.00');
  const [formFeePaidBy, setFormFeePaidBy] = useState<'buyer' | 'producer'>('buyer');
  const [formSpreadEnabled, setFormSpreadEnabled] = useState(false);
  const [formSpreadPercent, setFormSpreadPercent] = useState('1.5');
  const [formAdvancedEnabled, setFormAdvancedEnabled] = useState(false);
  const [formAdvancedRate, setFormAdvancedRate] = useState('2.5');
  const [formAdvancedMax, setFormAdvancedMax] = useState('70');
  const [formPayoutDays, setFormPayoutDays] = useState('2');
  const [formPayoutModel, setFormPayoutModel] = useState<'pos_evento' | 'semanal' | 'quinzenal'>('pos_evento');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formChangeReason, setFormChangeReason] = useState('');

  // Mock initial conditions correlated with real events
  useEffect(() => {
    setLoading(true);
    const mockConditions: CommercialEventCondition[] = events.map((ev, idx) => {
      const prod = producers.find(p => p.id === ev.producerId);
      const isSemTaxa = idx % 4 === 3;
      const isPendencia = idx % 5 === 4;
      const hasAdvanced = idx % 2 === 0;

      return {
        eventId: ev.id,
        eventCode: (ev as any).code || `EVT-${ev.id.slice(0, 4)}`,
        eventTitle: ev.name || ev.title || 'Evento sem título',
        producerId: ev.producerId || 'prod-1',
        producerName: prod?.name || 'Produtora Parceira',
        producerDocument: (prod as any)?.document || '12.345.678/0001-90',
        status: (ev as any).status || 'published',
        salesGross: 145000 + (idx * 32000),
        ticketsSold: 1200 + (idx * 250),
        diskFeeAmount: 14500 + (idx * 3200),
        serviceFeeType: isSemTaxa ? 'percentage' : (idx % 3 === 0 ? 'fixed' : 'percentage'),
        serviceFeeBps: isSemTaxa ? 0 : 1000,
        serviceFeeFixedCents: isSemTaxa ? 0 : 500,
        serviceFeePaidBy: idx % 2 === 0 ? 'buyer' : 'producer',
        spreadEnabled: idx % 3 === 1,
        spreadBps: 150,
        advancedEnabled: hasAdvanced,
        advancedRateBps: 250,
        advancedMaxPercent: 70,
        payoutTermsDays: 2,
        payoutModel: 'pos_evento',
        contractNumber: `CTR-2026-${100 + idx}`,
        currentVersion: isSemTaxa ? 0 : 1,
        situation: isSemTaxa ? 'sem_taxa' : (isPendencia ? 'com_pendencia' : 'regular')
      };
    });

    setConditionsList(mockConditions);
    setLoading(false);
  }, [events, producers]);

  // Filtered conditions
  const filteredConditions = useMemo(() => {
    return conditionsList.filter(item => {
      if (activeEvent && item.eventId !== activeEvent.id) return false;
      if (filterSituation === 'regular' && item.situation !== 'regular') return false;
      if (filterSituation === 'sem_taxa' && item.situation !== 'sem_taxa') return false;
      if (filterSituation === 'com_pendencia' && item.situation !== 'com_pendencia') return false;
      if (filterSituation === 'advanced' && !item.advancedEnabled) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.eventTitle.toLowerCase().includes(q) ||
          item.eventCode.toLowerCase().includes(q) ||
          item.producerName.toLowerCase().includes(q) ||
          item.contractNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conditionsList, activeEvent, filterSituation, searchTerm]);

  // Open edit modal
  const handleOpenEdit = (condition: CommercialEventCondition) => {
    setEditingCondition(condition);
    setFormFeeType(condition.serviceFeeType);
    setFormFeePercent((condition.serviceFeeBps / 100).toFixed(1));
    setFormFeeFixed((condition.serviceFeeFixedCents / 100).toFixed(2));
    setFormFeePaidBy(condition.serviceFeePaidBy);
    setFormSpreadEnabled(condition.spreadEnabled);
    setFormSpreadPercent((condition.spreadBps / 100).toFixed(1));
    setFormAdvancedEnabled(condition.advancedEnabled);
    setFormAdvancedRate((condition.advancedRateBps / 100).toFixed(1));
    setFormAdvancedMax(String(condition.advancedMaxPercent || 70));
    setFormPayoutDays(String(condition.payoutTermsDays || 2));
    setFormPayoutModel(condition.payoutModel || 'pos_evento');
    setFormContractNumber(condition.contractNumber || '');
    setFormChangeReason('');
    setFeedbackMessage(null);
  };

  // Submit condition changes
  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCondition) return;

    if (!formChangeReason.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'O motivo da alteração é obrigatório para o registro na trilha de auditoria comercial.'
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      // Simulate API call to PUT /api/commercial/events/:eventId/agreement
      await new Promise(r => setTimeout(r, 600));

      const updatedList = conditionsList.map(item => {
        if (item.eventId === editingCondition.eventId) {
          return {
            ...item,
            serviceFeeType: formFeeType,
            serviceFeeBps: formFeeType === 'percentage' ? Math.round(parseFloat(formFeePercent) * 100) : 0,
            serviceFeeFixedCents: formFeeType === 'fixed' ? Math.round(parseFloat(formFeeFixed) * 100) : 0,
            serviceFeePaidBy: formFeePaidBy,
            spreadEnabled: formSpreadEnabled,
            spreadBps: formSpreadEnabled ? Math.round(parseFloat(formSpreadPercent) * 100) : 0,
            advancedEnabled: formAdvancedEnabled,
            advancedRateBps: formAdvancedEnabled ? Math.round(parseFloat(formAdvancedRate) * 100) : 0,
            advancedMaxPercent: parseInt(formAdvancedMax, 10),
            payoutTermsDays: parseInt(formPayoutDays, 10),
            payoutModel: formPayoutModel,
            contractNumber: formContractNumber,
            currentVersion: item.currentVersion + 1,
            situation: 'regular' as const
          };
        }
        return item;
      });

      setConditionsList(updatedList);
      setEditingCondition(null);
      setFeedbackMessage({
        type: 'success',
        text: 'Condições comerciais atualizadas com sucesso e registradas na trilha de auditoria!'
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erro ao persistir condições comerciais do evento.'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const semTaxaCount = conditionsList.filter(c => c.situation === 'sem_taxa').length;
  const pendenciasCount = conditionsList.filter(c => c.situation === 'com_pendencia').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CONDIÇÕES COMERCIAIS & TAXAS DOS EVENTOS
            </h1>
            <Badge variant="orange" size="sm">
              Acordos Homologados
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão auditada de taxas de serviço, spread, antecipações (Advanced) e modelos de repasse
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Smart Alerts */}
      {(semTaxaCount > 0 || pendenciasCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {semTaxaCount > 0 && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 font-bold block">
                  {semTaxaCount} evento(s) sem taxa de conveniência cadastrada
                </strong>
                <p className="text-rose-400/80 mt-0.5">
                  Defina as condições comerciais antes de abrir as vendas oficiais para evitar repasses incorretos.
                </p>
              </div>
            </div>
          )}

          {pendenciasCount > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold block">
                  {pendenciasCount} pendência(s) de aprovação contratual
                </strong>
                <p className="text-amber-400/80 mt-0.5">
                  Existem contratos comerciais aguardando aceite da produtora responsável.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por evento, código (EVT-...), produtora ou contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'regular', label: 'Regulares' },
              { id: 'sem_taxa', label: 'Sem Taxa' },
              { id: 'com_pendencia', label: 'Pendentes' },
              { id: 'advanced', label: 'Com Antecipação' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSituation(tab.id as any)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  filterSituation === tab.id
                    ? 'bg-orange-500 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Mostrando <strong className="text-white font-mono">{filteredConditions.length}</strong> evento(s) configurado(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Evento / Código</th>
                <th className="py-3 px-4">Produtora</th>
                <th className="py-3 px-4">Taxa de Serviço</th>
                <th className="py-3 px-4">Spread</th>
                <th className="py-3 px-4">Antecipação (Adv)</th>
                <th className="py-3 px-4">Repasse</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredConditions.map((item) => (
                <tr key={item.eventId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <strong className="text-white block font-medium">{item.eventTitle}</strong>
                      <span className="font-mono text-[10px] text-orange-400">{item.eventCode}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="text-slate-200 block">{item.producerName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{item.producerDocument}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {item.situation === 'sem_taxa' ? (
                      <span className="text-rose-400 font-bold">Não definida</span>
                    ) : item.serviceFeeType === 'percentage' ? (
                      <div>
                        <strong className="text-white">{(item.serviceFeeBps / 100).toFixed(1)}%</strong>
                        <span className="text-[10px] text-slate-400 block">
                          {item.serviceFeePaidBy === 'buyer' ? 'Comprador' : 'Produtor'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-white">{formatCurrency(item.serviceFeeFixedCents / 100)}</strong>
                        <span className="text-[10px] text-slate-400 block">Fixa por ingresso</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.spreadEnabled ? (
                      <Badge variant="cyan" size="sm">+{(item.spreadBps / 100).toFixed(1)}%</Badge>
                    ) : (
                      <span className="text-slate-500">Inativo</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.advancedEnabled ? (
                      <Badge variant="emerald" size="sm">Teto {item.advancedMaxPercent}%</Badge>
                    ) : (
                      <span className="text-slate-500">Desabilitado</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-300">D+{item.payoutTermsDays}</span>
                    <span className="text-[10px] text-slate-500 block capitalize">{item.payoutModel.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4">
                    {item.situation === 'regular' && <Badge variant="emerald" size="sm">Regular (v{item.currentVersion})</Badge>}
                    {item.situation === 'sem_taxa' && <Badge variant="rose" size="sm">Sem Taxa</Badge>}
                    {item.situation === 'com_pendencia' && <Badge variant="amber" size="sm">Pendência</Badge>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenEdit(item)}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Definir Taxa
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDossierCondition(item)}
                        icon={<FileText className="w-3.5 h-3.5" />}
                      >
                        Dossiê
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DEFINIR CONDIÇÕES COMERCIAIS */}
      {editingCondition && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Condições Comerciais: {editingCondition.eventTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {editingCondition.eventCode} • {editingCondition.producerName}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingCondition(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCondition} className="p-6 space-y-5">
              {/* Tipo de Taxa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Tipo de Taxa de Conveniência (Serviço Disk)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormFeeType('percentage')}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      formFeeType === 'percentage'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-300'
                    }`}
                  >
                    Percentual (%) sobre o valor facial
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormFeeType('fixed')}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      formFeeType === 'fixed'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-300'
                    }`}
                  >
                    Valor Fixo (R$) por ingresso emitido
                  </button>
                </div>
              </div>

              {/* Valor da Taxa e Pagador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formFeeType === 'percentage' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Percentual da Taxa (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formFeePercent}
                      onChange={(e) => setFormFeePercent(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Valor Fixo em Reais (R$):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={formFeeFixed}
                      onChange={(e) => setFormFeeFixed(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Quem Paga a Taxa de Serviço?
                  </label>
                  <select
                    value={formFeePaidBy}
                    onChange={(e) => setFormFeePaidBy(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="buyer">Comprador (Taxa Adicional no Checkout)</option>
                    <option value="producer">Produtor (Taxa Embutida no Valor do Ingresso)</option>
                  </select>
                </div>
              </div>

              {/* Spread e Antecipação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Spread Comercial</label>
                    <input
                      type="checkbox"
                      checked={formSpreadEnabled}
                      onChange={(e) => setFormSpreadEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  {formSpreadEnabled && (
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Spread % (ex: 1.5)"
                      value={formSpreadPercent}
                      onChange={(e) => setFormSpreadPercent(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Habilitar Antecipação (Advanced)</label>
                    <input
                      type="checkbox"
                      checked={formAdvancedEnabled}
                      onChange={(e) => setFormAdvancedEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  {formAdvancedEnabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Taxa %"
                        value={formAdvancedRate}
                        onChange={(e) => setFormAdvancedRate(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Teto % (ex: 70)"
                        value={formAdvancedMax}
                        onChange={(e) => setFormAdvancedMax(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Repasse & Contrato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Prazo de Repasse (Dias após evento):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPayoutDays}
                    onChange={(e) => setFormPayoutDays(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Número do Contrato:
                  </label>
                  <input
                    type="text"
                    value={formContractNumber}
                    onChange={(e) => setFormContractNumber(e.target.value)}
                    placeholder="CTR-2026-..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Motivo da Alteração (Obrigatório para Auditoria) */}
              <div className="space-y-1 pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-orange-400 block uppercase tracking-wider">
                  Motivo da Alteração / Justificativa Comercial *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explique o motivo da definição/atualização de taxa (ex: negociação contratual, acordo de volume)..."
                  value={formChangeReason}
                  onChange={(e) => setFormChangeReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Esta justificativa será registrada na trilha imutável de auditoria e versionamento do acordo.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button size="sm" variant="secondary" onClick={() => setEditingCondition(null)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando Versão...' : 'Salvar & Emitir Nova Versão'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOSSIÊ COMERCIAL DO EVENTO */}
      {dossierCondition && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Dossiê Comercial do Evento
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {dossierCondition.eventCode} • {dossierCondition.eventTitle}
                  </p>
                </div>
              </div>
              <button onClick={() => setDossierCondition(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Versão Vigente</span>
                  <strong className="text-white text-base">Versão {dossierCondition.currentVersion || 1}</strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Contrato</span>
                  <strong className="text-white text-base font-mono">{dossierCondition.contractNumber || 'Não vinculado'}</strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Situação</span>
                  <strong className="text-emerald-400 text-base capitalize">{dossierCondition.situation}</strong>
                </div>
              </div>

              {/* Trilha de Auditoria Comercial */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Histórico de Alterações e Auditoria
                  </h4>
                </div>

                <div className="space-y-3 relative pl-6 border-l-2 border-slate-800 text-xs">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-slate-900" />
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <strong className="text-orange-400">Versão {dossierCondition.currentVersion || 1} (Ativa)</strong>
                        <span>Hoje</span>
                      </div>
                      <p className="text-slate-200 mt-1">
                        Taxa de conveniência ajustada para {dossierCondition.serviceFeeBps / 100}% com repasse em D+{dossierCondition.payoutTermsDays}.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Responsável: Equipe Comercial DiskIngressos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setDossierCondition(null)}>
                Fechar Dossiê
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
