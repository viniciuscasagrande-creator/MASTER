import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Check, ShieldAlert, ArrowRight, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { CommercialChangeImpactDTO, CommercialMovementType, CommercialOfferingDTO } from '@shared/types/index';

interface CommercialChangeImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName?: string;
  initialMovementType?: CommercialMovementType;
  availableOfferings?: CommercialOfferingDTO[];
}

export const CommercialChangeImpactModal: React.FC<CommercialChangeImpactModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName,
  initialMovementType = 'UPGRADE',
  availableOfferings = []
}) => {
  const [movementType, setMovementType] = useState<CommercialMovementType>(initialMovementType);
  const [proposedOfferingId, setProposedOfferingId] = useState<string>('');
  const [impactData, setImpactData] = useState<CommercialChangeImpactDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (availableOfferings.length > 0 && !proposedOfferingId) {
      setProposedOfferingId(availableOfferings[0].id);
    }
  }, [availableOfferings]);

  const handleSimulate = async () => {
    if (!proposedOfferingId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await CommercialAccountsApi.simulateChangeImpact({
        producerId,
        movementType,
        proposedOfferingId
      });
      setImpactData(res);
    } catch (err: any) {
      setError(err.message || 'Falha ao executar simulação de impacto.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && proposedOfferingId) {
      handleSimulate();
    }
  }, [isOpen, proposedOfferingId, movementType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Simulador de Impacto Comercial</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativo factual de pacotes e condições para {producerName || 'Produtor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Movimentação:</span>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as CommercialMovementType)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 shadow-xs"
            >
              <option value="UPGRADE">Upgrade de Plano / Pacote</option>
              <option value="DOWNGRADE">Downgrade / Readequação</option>
              <option value="EXPANSION">Expansão de Conta</option>
              <option value="ADDITIONAL_SERVICE">Serviço Adicional</option>
              <option value="RENEWAL">Renovação Contratual</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Oferta Pretendida:</span>
            <select
              value={proposedOfferingId}
              onChange={(e) => setProposedOfferingId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 shadow-xs"
            >
              {availableOfferings.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.code}) — {off.type}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span>Recalcular</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && !impactData && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm">Cruzando dados de catálogo e termos contratuais...</p>
            </div>
          )}

          {impactData && (
            <>
              {/* Architectural Invariant Banner */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    <strong>Simulação Não-Executória:</strong> Nenhuma alteração é aplicada a contratos, habilitações ou cobranças diretamente.
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded font-mono text-[10px]">
                  entitlementsMutation: FALSE
                </span>
              </div>

              {/* Operational Risks & Warnings */}
              {impactData.impactAnalysis.operationalRisks.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Pontos de Atenção & Riscos Identificados na Transição</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-xs text-amber-900/90 dark:text-amber-200/90">
                    {impactData.impactAnalysis.operationalRisks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Features Difference (Added vs Removed vs Maintained) */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Comparativo de Funcionalidades Técnicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Features Adicionadas */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Novas Features Incluídas
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold border border-emerald-200 dark:border-emerald-500/20">
                        +{impactData.impactAnalysis.featuresAdded.length}
                      </span>
                    </div>
                    {impactData.impactAnalysis.featuresAdded.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum recurso novo em relação ao pacote vigente.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {impactData.impactAnalysis.featuresAdded.map((f) => (
                          <div key={f.key} className="p-2 bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-200/80 dark:border-emerald-500/20 rounded-lg text-xs flex justify-between items-center">
                            <span className="font-medium text-emerald-800 dark:text-emerald-300">{f.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{f.category}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features Removidas (Downgrade Risk) */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <X className="h-4 w-4" /> Features Descontinuadas / Perdidas
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-full font-semibold border border-rose-200 dark:border-rose-500/20">
                        -{impactData.impactAnalysis.featuresRemoved.length}
                      </span>
                    </div>
                    {impactData.impactAnalysis.featuresRemoved.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum recurso será revogado nesta transição.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {impactData.impactAnalysis.featuresRemoved.map((f) => (
                          <div key={f.key} className="p-2 bg-rose-50/60 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 rounded-lg text-xs flex justify-between items-center">
                            <span className="font-medium text-rose-800 dark:text-rose-300">{f.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{f.category}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alterações de Limites Operacionais */}
              {impactData.impactAnalysis.limitChanges.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Alterações em Cotas e Limites
                  </h3>
                  <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[11px]">
                        <tr>
                          <th className="px-4 py-2.5">Funcionalidade</th>
                          <th className="px-4 py-2.5">Métrica / Cota</th>
                          <th className="px-4 py-2.5">Limite Atual</th>
                          <th className="px-4 py-2.5">Novo Limite</th>
                          <th className="px-4 py-2.5">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                        {impactData.impactAnalysis.limitChanges.map((lc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{lc.featureName}</td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{lc.limitKey}</td>
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{lc.currentValue !== null ? lc.currentValue : 'Ilimitado'}</td>
                            <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">{lc.proposedValue !== null ? lc.proposedValue : 'Ilimitado'}</td>
                            <td className="px-4 py-2">
                              {lc.difference !== null ? (
                                <span className={`font-semibold ${lc.difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {lc.difference > 0 ? `+${lc.difference}` : lc.difference}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Comparativo de Termos Financeiros */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Comparativo de Condições Comerciais & Taxas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condições Vigentes (Base Efetiva)</span>
                    <div className="space-y-1 text-xs">
                      {impactData.impactAnalysis.termComparison.currentTerms.length === 0 ? (
                        <p className="text-slate-500 italic">Nenhum termo ativo encontrado.</p>
                      ) : (
                        impactData.impactAnalysis.termComparison.currentTerms.map((t, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <span>{t.type}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {t.value}% (Pagador: {t.payer})
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/40 dark:bg-indigo-500/5 border border-orange-200 dark:border-indigo-500/20 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-orange-700 dark:text-indigo-400">Condições Pretendidas ({impactData.proposedOffering.name})</span>
                    <div className="space-y-1 text-xs">
                      {impactData.impactAnalysis.termComparison.proposedTerms.map((t, idx) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-orange-200/50 dark:border-slate-800 text-orange-900 dark:text-indigo-200">
                          <span>{t.type}</span>
                          <span className="font-bold text-orange-900 dark:text-white">
                            {t.value}% (Pagador: {t.payer})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
          >
            Fechar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
