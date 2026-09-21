import React from 'react';
import { Calendar, Ticket, Clock, Wrench } from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { EventSummaryDTO } from '../types/event.types';

interface EventsSummaryProps {
  summary: EventSummaryDTO | null;
  isLoading?: boolean;
}

export const EventsSummary: React.FC<EventsSummaryProps> = ({
  summary,
  isLoading = false
}) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between"
          >
            <div className="h-4 w-28 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded mt-2" />
            <div className="h-3 w-32 bg-slate-800 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const configuringCount = (summary.configuring || 0) + (summary.draft || 0);
  const totalCount = summary.total ?? 0;
  const onSaleCount = summary.onSale ?? (summary as any).emVenda ?? 0;
  const upcomingCount = summary.upcoming ?? (summary as any).proximos ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="TOTAL DE EVENTOS"
        value={String(totalCount)}
        subtitle="Eventos sob seu escopo"
        icon={<Calendar className="h-4 w-4 text-orange-400" />}
        badge="Catálogo"
        badgeVariant="orange"
      />

      <StatCard
        title="EM VENDA"
        value={String(onSaleCount)}
        subtitle="Bilheteria aberta ao público"
        icon={<Ticket className="h-4 w-4 text-emerald-400" />}
        badge="Ativos"
        badgeVariant="emerald"
      />

      <StatCard
        title="PRÓXIMOS / PROGRAMADOS"
        value={String(upcomingCount)}
        subtitle="Aguardando abertura de vendas"
        icon={<Clock className="h-4 w-4 text-cyan-400" />}
        badge="Agendados"
        badgeVariant="cyan"
      />

      <StatCard
        title="EM CONFIGURAÇÃO"
        value={String(configuringCount)}
        subtitle={`${summary.draft || 0} rascunhos em preenchimento`}
        icon={<Wrench className="h-4 w-4 text-amber-400" />}
        badge="Setup"
        badgeVariant="amber"
      />
    </div>
  );
};
