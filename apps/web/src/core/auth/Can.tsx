import React from 'react';
import { PermissionString } from '@shared/types/index';
import { useAuth } from './AuthContext';

interface CanProps {
  permission: PermissionString;
  scope?: {
    producerId?: string;
    eventId?: string;
  };
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional UI wrapper that renders children only if the current user
 * has the specified permission and data scope.
 */
export const Can: React.FC<CanProps> = ({
  permission,
  scope,
  fallback = null,
  children
}) => {
  const { hasPermission } = useAuth();

  const isAllowed = hasPermission(permission, scope);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
