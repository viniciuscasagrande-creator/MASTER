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
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: FileText
        };
      case 'IN_REVIEW':
        return {
          label: 'Em Revisão',
          bg: 'bg-sky-900/40 text-sky-300 border-sky-700/60',
          icon: Clock
        };
      case 'APPROVAL_PENDING':
        return {
          label: 'Aguardando Aprovação',
          bg: 'bg-amber-900/40 text-amber-300 border-amber-700/60',
          icon: Clock
        };
      case 'APPROVED':
        return {
          label: 'Aprovada Internamente',
          bg: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60',
          icon: CheckCircle2
        };
      case 'REJECTED_INTERNAL':
        return {
          label: 'Reprovada Internamente',
          bg: 'bg-rose-900/40 text-rose-300 border-rose-700/60',
          icon: XCircle
        };
      case 'READY_TO_SEND':
        return {
          label: 'Pronta para Envio',
          bg: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/60',
          icon: Send
        };
      case 'SENT':
        return {
          label: 'Enviada ao Produtor',
          bg: 'bg-blue-900/40 text-blue-300 border-blue-700/60',
          icon: Send
        };
      case 'VIEWED':
        return {
          label: 'Visualizada',
          bg: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/60',
          icon: Eye
        };
      case 'ACCEPTED':
        return {
          label: 'Aceita pelo Produtor',
          bg: 'bg-emerald-950 text-emerald-200 border-emerald-500 font-semibold',
          icon: CheckCircle2
        };
      case 'DECLINED':
        return {
          label: 'Recusada pelo Produtor',
          bg: 'bg-orange-900/40 text-orange-300 border-orange-700/60',
          icon: XCircle
        };
      case 'EXPIRED':
        return {
          label: 'Vigência Expirada',
          bg: 'bg-slate-800 text-slate-400 border-slate-700 line-through',
          icon: AlertCircle
        };
      case 'CANCELLED':
        return {
          label: 'Cancelada',
          bg: 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through',
          icon: XCircle
        };
      case 'SUPERSEDED':
        return {
          label: 'Substituída por Nova Versão',
          bg: 'bg-slate-900 text-slate-400 border-slate-800',
          icon: RefreshCw
        };
      default:
        return {
          label: s,
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
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
