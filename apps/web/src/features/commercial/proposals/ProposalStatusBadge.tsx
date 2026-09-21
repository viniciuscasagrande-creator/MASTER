import React from 'react';
import { CommercialProposalStatus } from '@shared/types/index';
import { Clock, CheckCircle2, XCircle, Send, Eye, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface ProposalStatusBadgeProps {
  status: CommercialProposalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const getStatusConfig = (s: CommercialProposalStatus) => {
    switch (s) {
      case 'DRAFT':
        return {
          label: 'Rascunho',
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: FileText
        };
      case 'IN_REVIEW':
        return {
          label: 'Em Revisão',
          bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700/60',
          icon: Clock
        };
      case 'APPROVAL_PENDING':
        return {
          label: 'Aguardando Aprovação',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/60',
          icon: Clock
        };
      case 'APPROVED':
        return {
          label: 'Aprovada Internamente',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60',
          icon: CheckCircle2
        };
      case 'REJECTED_INTERNAL':
        return {
          label: 'Reprovada Internamente',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/60',
          icon: XCircle
        };
      case 'READY_TO_SEND':
        return {
          label: 'Pronta para Envio',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/60',
          icon: Send
        };
      case 'SENT':
        return {
          label: 'Enviada ao Produtor',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/60',
          icon: Send
        };
      case 'VIEWED':
        return {
          label: 'Visualizada',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/60',
          icon: Eye
        };
      case 'ACCEPTED':
        return {
          label: 'Aceita pelo Produtor',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-500 font-bold',
          icon: CheckCircle2
        };
      case 'DECLINED':
        return {
          label: 'Recusada pelo Produtor',
          bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/60',
          icon: XCircle
        };
      case 'EXPIRED':
        return {
          label: 'Vigência Expirada',
          bg: 'bg-slate-100 text-slate-500 border-slate-200 line-through dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: AlertCircle
        };
      case 'CANCELLED':
        return {
          label: 'Cancelada',
          bg: 'bg-zinc-100 text-zinc-500 border-zinc-200 line-through dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800',
          icon: XCircle
        };
      case 'SUPERSEDED':
        return {
          label: 'Substituída por Nova Versão',
          bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
          icon: RefreshCw
        };
      default:
        return {
          label: s,
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: FileText
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : size === 'lg'
    ? 'px-3.5 py-1.5 text-sm font-medium'
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClass}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};
