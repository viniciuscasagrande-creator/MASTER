import React, { createContext, useContext, useState, useMemo } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User;
  setRole: (role: Role) => void;
  canAccessModule: (moduleId: string) => boolean;
  canPerformAction: (action: string) => boolean;
  allRoles: { role: Role; label: string; department: string }[];
}

const ROLES_CATALOG: { role: Role; label: string; department: string }[] = [
  { role: 'admin_master', label: 'Admin Master / CTO', department: 'Tecnologia & Operações' },
  { role: 'diretoria_financeira', label: 'Diretoria Financeira', department: 'Financeiro & Contabilidade' },
  { role: 'operador_sac', label: 'Supervisor de SAC', department: 'Atendimento & SAC' },
  { role: 'gerente_eventos', label: 'Gerente de Produção / Eventos', department: 'Operações de Campo' },
  { role: 'comercial_lead', label: 'Líder Comercial', department: 'Comercial & Novos Negócios' },
  { role: 'marketing_specialist', label: 'Especialista de Growth', department: 'Marketing & Remarketing' },
];

const DEFAULT_USER: User = {
  id: 'usr-admin-1',
  name: 'Vinicius Casagrande',
  email: 'vinicius.casagrande@diskingressos.com.br',
  role: 'admin_master',
  department: 'Diretoria de Tecnologia & Operações',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);

  const setRole = (newRole: Role) => {
    const meta = ROLES_CATALOG.find(r => r.role === newRole);
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      department: meta ? meta.department : prev.department
    }));
  };

  const canAccessModule = (moduleId: string): boolean => {
    if (currentUser.role === 'admin_master') return true;
    switch (currentUser.role) {
      case 'diretoria_financeira':
        return ['overview', 'finance', 'accounting', 'refunds', 'events', 'commercial'].includes(moduleId);
      case 'operador_sac':
        return ['overview', 'sac', 'refunds', 'events'].includes(moduleId);
      case 'gerente_eventos':
        return ['overview', 'events', 'event-support', 'sac'].includes(moduleId);
      case 'comercial_lead':
        return ['overview', 'commercial', 'events', 'finance'].includes(moduleId);
      case 'marketing_specialist':
        return ['overview', 'marketing', 'remarketing', 'events', 'commercial'].includes(moduleId);
      default:
        return true;
    }
  };

  const canPerformAction = (action: string): boolean => {
    if (currentUser.role === 'admin_master') return true;
    if (action === 'approve_refund') {
      return ['admin_master', 'diretoria_financeira'].includes(currentUser.role);
    }
    if (action === 'request_payout') {
      return ['admin_master', 'diretoria_financeira'].includes(currentUser.role);
    }
    if (action === 'manage_events') {
      return ['admin_master', 'gerente_eventos', 'comercial_lead'].includes(currentUser.role);
    }
    return true;
  };

  const value = useMemo(() => ({
    user: currentUser,
    setRole,
    canAccessModule,
    canPerformAction,
    allRoles: ROLES_CATALOG
  }), [currentUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
