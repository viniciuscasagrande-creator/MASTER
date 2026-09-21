import React, { useState } from 'react';
import { RefreshCw, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, FileText, ArrowRight, User } from 'lucide-react';
import { CommercialRenewalDTO, CommercialRenewalStatus } from '@shared/types/index';

interface RenewalsTabProps {
  renewals: CommercialRenewalDTO[];
  isLoading: boolean;
  onStartNegotiation: (renewal: CommercialRenewalDTO) => void;
  onUpdateStatus: (renewal: CommercialRenewalDTO) => void;
  onDecideRenewal: (renewal: CommercialRenewalDTO) => void;
}

export const RenewalsTab: React.FC<RenewalsTabProps> = ({
  renewals,
  isLoading,
  onStartNegotiation,
  onUpdateStatus,
  onDecideRenewal
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = renewals.filter((r) => {
    if (filterType === 'WINDOW') return r.isWithinPlanningWindow;
    if (filterType === 'OVERDUE') return r.isOverdue;
    if (filterType === 'ONGOING') return ['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'].includes(r.status);
    if (filterType === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: CommercialRenewalStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return <span className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full font-medium">Não Iniciada</span>;
      case 'PLANNED':
        return <span className="px-2 py-0.5 text-[11px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full font-medium">Planejada</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 text-[11px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full font-medium">Em Negociação</span>;
      case 'PROPOSAL':
        return <span className="px-2 py-0.5 text-[11px] bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-full font-medium">Proposta Enviada</span>;
      case 'AWAITING_DECISION':
        return <span className="px-2 py-0.5 text-[11px] bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-full font-medium">Em Decisão / Assinatura</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full font-medium">Renovado</span>;
      case 'NOT_RENEWED':
        return <span className="px-2 py-0.5 text-[11px] bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-full font-medium">Não Renovado</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full font-medium">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `Todos (${renewals.length})` },
          { id: 'WINDOW', label: `Em Janela de Renovação (${renewals.filter(r => r.isWithinPlanningWindow).length})` },
          { id: 'OVERDUE', label: `Vencidos (${renewals.filter(r => r.isOverdue).length})` },
          { id: 'ONGOING', label: `Em Negociação (${renewals.filter(r => ['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'].includes(r.status)).length})` },
          { id: 'COMPLETED', label: `Renovados (${renewals.filter(r => r.status === 'COMPLETED').length})` }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === btn.id
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3">Contrato / Produtor</th>
                <th className="px-4 py-3">Ciclo & Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vencimento Contratual</th>
                <th className="px-4 py-3">Prazo Restante</th>
                <th className="px-4 py-3">Oportunidade Vinculada</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                      <span>Carregando dados da Central de Renovações...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum contrato em ciclo de renovação nesta categoria.
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Contrato & Produtor */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{r.contractPublicCode}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.producerName}</div>
                  </td>

                  {/* Ciclo e Tipo */}
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-white font-medium">Ciclo {r.renewalCycle}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {r.renewalType === 'SIMPLE' ? 'Simples (Prazo)' : 'Renegociação'}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(r.status)}
                  </td>

                  {/* Vencimento */}
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(r.contractExpiresAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>

                  {/* Prazo Restante */}
                  <td className="px-4 py-3">
                    {r.isOverdue ? (
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-md font-semibold text-[10px] inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Vencido ({Math.abs(r.daysUntilExpiration)}d atrás)
                      </span>
                    ) : r.isWithinPlanningWindow ? (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 rounded-md font-medium text-[10px] inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.daysUntilExpiration} dias restantes
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">{r.daysUntilExpiration} dias</span>
                    )}
                  </td>

                  {/* Oportunidade Vinculada */}
                  <td className="px-4 py-3">
                    {r.sourceOpportunityPublicCode ? (
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded text-[11px] font-mono">
                        {r.sourceOpportunityPublicCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {r.responsibleName || 'Comercial'}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'NOT_STARTED' && (
                        <button
                          onClick={() => onStartNegotiation(r)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Iniciar Negociação
                        </button>
                      )}

                      {['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'].includes(r.status) && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(r)}
                            className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs transition-colors shadow-xs"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => onDecideRenewal(r)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            Decidir
                          </button>
                        </>
                      )}

                      {['COMPLETED', 'NOT_RENEWED', 'CANCELLED'].includes(r.status) && (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">Ciclo Finalizado</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
