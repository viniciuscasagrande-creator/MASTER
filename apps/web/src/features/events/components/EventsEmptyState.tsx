import React from 'react';
import { CalendarSearch, Plus, RotateCcw } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../../../core/auth/AuthContext';

interface EventsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onOpenCreateModal: () => void;
}

export const EventsEmptyState: React.FC<EventsEmptyStateProps> = ({
  hasFilters,
  onClearFilters,
  onOpenCreateModal
}) => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('eventos.evento.criar');

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-4">
          <CalendarSearch className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Nenhum evento encontrado</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
          Não localizamos nenhum evento correspondente aos critérios de busca ou filtros selecionados.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          icon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Limpar Filtros de Busca
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
        <CalendarSearch className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-white">Nenhum evento cadastrado no seu escopo</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
        Comece criando o primeiro evento para configurar sessões, setores, lotes e abrir as vendas na DiskIngressos.
      </p>
      {canCreate && (
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateModal}
          icon={<Plus className="h-4 w-4" />}
        >
          Criar Primeiro Evento
        </Button>
      )}
    </div>
  );
};
