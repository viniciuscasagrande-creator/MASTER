import React from 'react';
import { PermissionString } from '@shared/types/index';
import { useAuth } from './AuthContext';
import { AccessDeniedView } from './AccessDeniedView';

interface ProtectedRouteProps {
  permission: PermissionString;
  scope?: {
    producerId?: string;
    eventId?: string;
  };
  onBack?: () => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  scope,
  onBack,
  children
}) => {
  const { hasPermission } = useAuth();

  const isAllowed = hasPermission(permission, scope);

  if (!isAllowed) {
    return (
      <AccessDeniedView
        requiredPermission={permission}
        onBack={onBack}
      />
    );
  }

  return <>{children}</>;
};
