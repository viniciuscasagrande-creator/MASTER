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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {isProducerUser ? 'MEUS EVENTOS' : 'CENTRAL DE EVENTOS'}
          </h1>
          <Badge variant="orange" size="sm">
            Fase 1.2
          </Badge>

          {activeProducer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Building2 className="h-3 w-3 text-cyan-400" />
              <span className="text-slate-400">Produtor:</span>
              <strong className="text-white">{activeProducer.name}</strong>
            </div>
          )}

          {isGlobalScope && !activeProducer && (
            <Badge variant="cyan" size="sm">
              Visão Global (Todos os Produtores)
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
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
