import React from 'react';
import { JobQueue } from '../jobs.types';
import { Badge, BadgeVariant } from '../../../shared/components/Badge';

interface QueueBadgeProps {
  queue: JobQueue;
  size?: 'sm' | 'md';
}

export const QueueBadge: React.FC<QueueBadgeProps> = ({ queue, size = 'sm' }) => {
  const getConfig = (): { label: string; variant: BadgeVariant } => {
    switch (queue) {
      case 'critical':
        return { label: 'Crítica', variant: 'rose' };
      case 'finance':
        return { label: 'Financeiro', variant: 'emerald' };
      case 'payments':
        return { label: 'Pagamentos', variant: 'cyan' };
      case 'integrations':
        return { label: 'Integrações', variant: 'purple' };
      case 'webhooks':
        return { label: 'Webhooks', variant: 'amber' };
      case 'documents':
        return { label: 'Documentos', variant: 'slate' };
      case 'analytics':
        return { label: 'Relatórios e BI', variant: 'orange' };
      case 'marketing':
        return { label: 'Marketing', variant: 'info' };
      case 'communications':
        return { label: 'Comunicações', variant: 'primary' };
      case 'maintenance':
        return { label: 'Manutenção', variant: 'neutral' };
      default:
        return { label: queue, variant: 'slate' };
    }
  };

  const { label, variant } = getConfig();

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};
