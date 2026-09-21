import React from 'react';
import { Building2, User, Calendar, FileText, AlertTriangle, Clock, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { CommercialAccountSummaryDTO } from '@shared/types/index';

interface PortfolioAccountsTabProps {
  accounts: CommercialAccountSummaryDTO[];
  isLoading: boolean;
  onOpenTimeline: (producerId: string, producerName: string) => void;
  onStartRenewal: (contractId: string, producerName: string) => void;
  onCreateMovement: (producerId: string, producerName: string) => void;
  onOpenImpactModal: (producerId: string, producerName: string) => void;
}

export const PortfolioAccountsTab: React.FC<PortfolioAccountsTabProps> = ({
  accounts,
  isLoading,
  onOpenTimeline,
  onStartRenewal,
  onCreateMovement,
  onOpenImpactModal
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full font-medium">Ativo</span>;
      case 'PROSPECT':
        return <span className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full font-medium">Prospect</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full font-medium">Suspenso</span>;
      case 'INACTIVE':
        return <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 rounded-full font-medium">Inativo</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <tr>
              <th className="px-4 py-3">Produtor / Razão Social</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Executivo de Contas</th>
              <th className="px-4 py-3 text-center">Contratos Ativos</th>
              <th className="px-4 py-3 text-center">Produtos</th>
              <th className="px-4 py-3 text-center">Oportunidades</th>
              <th className="px-4 py-3">Próximo Vencimento</th>
              <th className="px-4 py-3 text-right">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                    <span>Carregando contas da carteira...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && accounts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhuma conta encontrada com os filtros selecionados.
                </td>
              </tr>
            )}

            {!isLoading && accounts.map((acc) => (
              <tr key={acc.producerId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                {/* Produtor */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{acc.producerName}</div>
                      {acc.tradeName && <div className="text-[11px] text-slate-500 dark:text-slate-400">{acc.tradeName}</div>}
                      {acc.document && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{acc.document}</div>}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {getStatusBadge(acc.commercialStatus)}
                </td>

                {/* Executivo */}
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {acc.responsibleName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{acc.responsibleName}</span>
                    </div>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400/80 italic text-[11px]">Não atribuído</span>
                  )}
                </td>

                {/* Contratos Ativos */}
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{acc.activeContractsCount}</span>
                    {acc.expiringContractsCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded text-[10px] font-medium flex items-center gap-0.5" title="Contratos em janela de renovação">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {acc.expiringContractsCount}
                      </span>
                    )}
                  </div>
                </td>

                {/* Produtos Contratados */}
                <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                  {acc.contractedOfferingsCount}
                </td>

                {/* Oportunidades & Renovações */}
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-900 dark:text-white font-medium">{acc.openOpportunitiesCount} abertas</span>
                    {acc.pendingRenewalsCount > 0 && (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                        {acc.pendingRenewalsCount} renovação(ões)
                      </span>
                    )}
                  </div>
                </td>

                {/* Próximo Vencimento */}
                <td className="px-4 py-3">
                  {acc.nearestContractExpiration ? (
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(acc.nearestContractExpiration).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Sem contratos</span>
                  )}
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onOpenTimeline(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                      title="Ver Linha do Tempo Comercial"
                    >
                      <Clock className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onOpenImpactModal(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"
                      title="Simulador de Impacto Comercial"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onCreateMovement(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                      title="Nova Movimentação (Upgrade / Expansão)"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
