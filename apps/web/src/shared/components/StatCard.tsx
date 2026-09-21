import React from 'react';
import { cn } from '../utils/cn';
import { MetricCard } from './MetricCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'orange' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  badgeVariant = 'slate',
  className
}) => {
  return (
    <MetricCard
      title={title}
      value={value}
      subtitle={subtitle}
      trend={trend}
      icon={icon}
      badge={badge}
      badgeVariant={badgeVariant}
      className={className}
    />
  );
};
