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
        return <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">Ativo</span>;
      case 'PROSPECT':
        return <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-medium">Prospect</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">Suspenso</span>;
      case 'INACTIVE':
        return <span className="px-2 py-0.5 text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full font-medium">Inativo</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-500/10 text-slate-400 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                    <span>Carregando contas da carteira...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && accounts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma conta encontrada com os filtros selecionados.
                </td>
              </tr>
            )}

            {!isLoading && accounts.map((acc) => (
              <tr key={acc.producerId} className="hover:bg-slate-800/30 transition">
                {/* Produtor */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 text-slate-300 rounded-lg">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{acc.producerName}</div>
                      {acc.tradeName && <div className="text-[11px] text-slate-400">{acc.tradeName}</div>}
                      {acc.document && <div className="text-[10px] text-slate-500 font-mono">{acc.document}</div>}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {getStatusBadge(acc.commercialStatus)}
                </td>

                {/* Executivo */}
                <td className="px-4 py-3 text-slate-300">
                  {acc.responsibleName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{acc.responsibleName}</span>
                    </div>
                  ) : (
                    <span className="text-amber-400/80 italic text-[11px]">Não atribuído</span>
                  )}
                </td>

                {/* Contratos Ativos */}
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-white">{acc.activeContractsCount}</span>
                    {acc.expiringContractsCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-medium flex items-center gap-0.5" title="Contratos em janela de renovação">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {acc.expiringContractsCount}
                      </span>
                    )}
                  </div>
                </td>

                {/* Produtos Contratados */}
                <td className="px-4 py-3 text-center font-medium text-slate-300">
                  {acc.contractedOfferingsCount}
                </td>

                {/* Oportunidades & Renovações */}
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-white font-medium">{acc.openOpportunitiesCount} abertas</span>
                    {acc.pendingRenewalsCount > 0 && (
                      <span className="text-[10px] text-blue-400 font-medium">
                        {acc.pendingRenewalsCount} renovação(ões)
                      </span>
                    )}
                  </div>
                </td>

                {/* Próximo Vencimento */}
                <td className="px-4 py-3">
                  {acc.nearestContractExpiration ? (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(acc.nearestContractExpiration).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Sem contratos</span>
                  )}
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onOpenTimeline(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition"
                      title="Ver Linha do Tempo Comercial"
                    >
                      <Clock className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onOpenImpactModal(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                      title="Simulador de Impacto Comercial"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onCreateMovement(acc.producerId, acc.producerName)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition"
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
