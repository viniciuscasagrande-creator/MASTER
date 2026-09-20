import React from 'react';
import { Building2, CheckCircle2, Map, Users } from 'lucide-react';
import { VenueSummaryDTO } from '@shared/types/index';
import { StatCard } from '../../../shared/components/StatCard';
import { formatNumber } from '../../../shared/utils/formatters';

interface VenueSummaryCardsProps {
  summary: VenueSummaryDTO | null;
  isLoading?: boolean;
}

export const VenueSummaryCards: React.FC<VenueSummaryCardsProps> = ({
  summary,
  isLoading = false
}) => {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const withMaps = summary?.withMaps ?? 0;
  const totalCapacity = summary?.totalPhysicalCapacity ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="TOTAL DE LOCAIS"
        value={isLoading ? '...' : formatNumber(total)}
        subtitle="Arenas, teatros e espaços"
        icon={<Building2 className="h-4 w-4 text-cyan-400" />}
        badge="Catálogo"
        badgeVariant="cyan"
      />

      <StatCard
        title="LOCAIS ATIVOS"
        value={isLoading ? '...' : formatNumber(active)}
        subtitle="Prontos para receber eventos"
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        badge="Operacional"
        badgeVariant="emerald"
      />

      <StatCard
        title="COM PLANTAS MAPEADAS"
        value={isLoading ? '...' : formatNumber(withMaps)}
        subtitle="Setorização e mapas prontos"
        icon={<Map className="h-4 w-4 text-purple-400" />}
        badge="Plantas"
        badgeVariant="purple"
      />

      <StatCard
        title="CAPACIDADE FÍSICA TOTAL"
        value={isLoading ? '...' : formatNumber(totalCapacity)}
        subtitle="Lotação máxima acumulada"
        icon={<Users className="h-4 w-4 text-orange-400" />}
        badge="Carga Máxima"
        badgeVariant="orange"
      />
    </div>
  );
};
