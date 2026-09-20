import React from 'react';
import { JobPriority } from '../jobs.types';
import { Badge, BadgeVariant } from '../../../shared/components/Badge';

interface PriorityBadgeProps {
  priority: JobPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const getConfig = (): { label: string; variant: BadgeVariant } => {
    switch (priority) {
      case 'CRITICAL':
        return { label: 'Crítica', variant: 'danger' };
      case 'HIGH':
        return { label: 'Alta', variant: 'amber' };
      case 'NORMAL':
        return { label: 'Normal', variant: 'slate' };
      case 'LOW':
        return { label: 'Baixa', variant: 'neutral' };
      default:
        return { label: priority, variant: 'slate' };
    }
  };

  const { label, variant } = getConfig();

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};
