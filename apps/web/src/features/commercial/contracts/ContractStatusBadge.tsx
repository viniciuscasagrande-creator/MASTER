import React from 'react';
import { CommercialContractStatus } from '@shared/types/index';
import {
  FileEdit,
  Clock,
  ShieldCheck,
  FileSignature,
  CheckCircle,
  CheckCircle2,
  CalendarCheck2,
  CalendarOff,
  PauseCircle,
  AlertOctagon,
  XCircle
} from 'lucide-react';

interface ContractStatusBadgeProps {
  status: CommercialContractStatus | string;
  size?: 'sm' | 'md';
}

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      label: 'Rascunho',
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      border: 'border-slate-700/50',
      icon: <FileEdit className="h-3 w-3" />
    },
    IN_REVIEW: {
      label: 'Em Revisão',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      icon: <Clock className="h-3 w-3" />
    },
    APPROVAL_PENDING: {
      label: 'Aguardando Aprovação',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      icon: <Clock className="h-3 w-3 animate-pulse" />
    },
    APPROVED: {
      label: 'Aprovado Internamente',
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      icon: <ShieldCheck className="h-3 w-3" />
    },
    SIGNATURE_PENDING: {
      label: 'Aguardando Assinatura',
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: <FileSignature className="h-3 w-3 animate-pulse" />
    },
    PARTIALLY_SIGNED: {
      label: 'Parcialmente Assinado',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: <CheckCircle className="h-3 w-3" />
    },
    SIGNED: {
      label: 'Assinado (Aguardando Início)',
      bg: 'bg-teal-500/15',
      text: 'text-teal-300',
      border: 'border-teal-500/40',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    ACTIVE: {
      label: 'Vigente',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      icon: <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-400" />
    },
    EXPIRED: {
      label: 'Expirado',
      bg: 'bg-zinc-600/15',
      text: 'text-zinc-400',
      border: 'border-zinc-600/30',
      icon: <CalendarOff className="h-3 w-3" />
    },
    SUSPENDED: {
      label: 'Suspenso',
      bg: 'bg-orange-500/15',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      icon: <PauseCircle className="h-3 w-3" />
    },
    TERMINATED: {
      label: 'Rescindido',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: <AlertOctagon className="h-3 w-3" />
    },
    CANCELLED: {
      label: 'Cancelado',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: <XCircle className="h-3 w-3" />
    }
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: <Clock className="h-3 w-3" />
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
