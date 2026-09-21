import React from 'react';
import { Calendar, Plus, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { useAuth } from '../../../core/auth/AuthContext';
import { useDiskContext } from '../../../core/context/DiskContext';

interface EventsHeaderProps {
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  isLoading?: boolean;
}

export const EventsHeader: React.FC<EventsHeaderProps> = ({
  onRefresh,
  onOpenCreateModal,
  isLoading = false
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { activeProducer, isGlobalScope } = useDiskContext();

  const isProducerUser = currentUser.roleSlug === 'produtor';
  const canCreateEvent = hasPermission('eventos.evento.criar');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-2xs">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isProducerUser ? 'Meus Eventos' : 'Central de Eventos'}
          </h1>

          {activeProducer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <Building2 className="h-3 w-3 text-cyan-600" />
              <span className="text-slate-500">Produtor:</span>
              <strong className="text-slate-900">{activeProducer.name}</strong>
            </div>
          )}

          {isGlobalScope && !activeProducer && (
            <Badge variant="cyan" size="sm">
              Visão Global (Todos os Produtores)
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Ciclo operacional completo de eventos, bilheteria, lotes, capacidade e contexto integrado.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Atualizar
        </Button>

        {canCreateEvent && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateModal}
            icon={<Plus className="h-4 w-4" />}
          >
            Novo Evento
          </Button>
        )}
      </div>
    </div>
  );
};
