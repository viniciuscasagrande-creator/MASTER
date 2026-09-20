import React from 'react';
import { JobStatus } from '../jobs.types';
import { Badge, BadgeVariant } from '../../../shared/components/Badge';

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md';
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = (): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'CREATED':
        return { label: 'Criado', variant: 'slate' };
      case 'SCHEDULED':
        return { label: 'Agendado', variant: 'info' };
      case 'QUEUED':
        return { label: 'Na fila', variant: 'cyan' };
      case 'RUNNING':
        return { label: 'Em execução', variant: 'warning' };
      case 'WAITING':
        return { label: 'Aguardando', variant: 'purple' };
      case 'RETRYING':
        return { label: 'Tentando novamente', variant: 'amber' };
      case 'COMPLETED':
        return { label: 'Concluído', variant: 'success' };
      case 'FAILED':
        return { label: 'Falhou', variant: 'danger' };
      case 'CANCELLED':
        return { label: 'Cancelado', variant: 'neutral' };
      case 'DEAD_LETTER':
        return { label: 'Requer intervenção', variant: 'danger' };
      default:
        return { label: status, variant: 'slate' };
    }
  };

  const { label, variant } = getBadgeConfig();

  return (
    <Badge variant={variant} size={size} dot={status === 'RUNNING' || status === 'RETRYING'}>
      {label}
    </Badge>
  );
};
