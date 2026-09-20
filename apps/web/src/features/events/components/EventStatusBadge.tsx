import React from 'react';
import { EventStatus } from '../types/event.types';
import { Badge } from '../../../shared/components/Badge';
import {
  getEventStatusLabel,
  getEventStatusVariant,
  getEventStatusDescription,
  isEventActive
} from '../utils/event-status';

interface EventStatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md';
  showDescriptionTooltip?: boolean;
  className?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  size = 'sm',
  showDescriptionTooltip = true,
  className
}) => {
  const label = getEventStatusLabel(status);
  const variant = getEventStatusVariant(status);
  const description = getEventStatusDescription(status);
  const active = isEventActive(status);

  return (
    <Badge
      variant={variant}
      size={size}
      dot={active}
      title={showDescriptionTooltip ? description : undefined}
      className={className}
    >
      {label}
    </Badge>
  );
};
