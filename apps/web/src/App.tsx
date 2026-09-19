import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { DiskContextProvider, useDiskContext } from './core/context/DiskContext';
import { ScopeProvider } from './core/context/ScopeContext';
import { CoreDataProvider } from './core/context/CoreDataContext';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import { LoginView } from './core/auth/LoginView';

import { Header } from './shared/components/Header';
import { Sidebar } from './shared/components/Sidebar';
import { CommandPalette } from './shared/components/CommandPalette';
import { NotificationsDrawer } from './shared/components/NotificationsDrawer';
import { AuditDrawer } from './shared/components/AuditDrawer';
import { NewSaleModal } from './shared/components/NewSaleModal';

// Module Dashboards
import { OverviewDashboard } from './modules/overview/OverviewDashboard';
import { EventsDashboard } from './modules/events/EventsDashboard';
import { CommercialDashboard } from './modules/commercial/CommercialDashboard';
import { EventSupportDashboard } from './modules/eventSupport/EventSupportDashboard';
import { SacDashboard } from './modules/sac/SacDashboard';
import { RefundsDashboard } from './modules/refunds/RefundsDashboard';
import { FinanceDashboard } from './modules/finance/FinanceDashboard';
import { AccountingDashboard } from './modules/accounting/AccountingDashboard';
import { MarketingDashboard } from './modules/marketing/MarketingDashboard';
import { RemarketingDashboard } from './modules/remarketing/RemarketingDashboard';
import { SettingsView } from './modules/settings/SettingsView';

// Central Administrativa (Fase 1.1.5.2 & Fase 1.1.5.4)
import { AdminDashboardView } from './modules/admin/AdminDashboardView';
import { AdminUsersView } from './modules/admin/AdminUsersView';
import { AdminRolesView } from './modules/admin/AdminRolesView';
import { AdminPermissionsView } from './modules/admin/AdminPermissionsView';
import { AdminSessionsView } from './modules/admin/AdminSessionsView';
import { AdminAuditView } from './modules/admin/AdminAuditView';
import { SecurityCenterView } from './modules/admin/SecurityCenterView';

// Central de Notificações & Realtime (Fase 1.1.5.5)
import { NotificationProvider } from './core/context/NotificationContext';
import { NotificationCenterView } from './modules/notifications/NotificationCenterView';

// Central de Consulta & Busca Global (Fase 1.1.5.6)
import { QueryCenterView } from './modules/search/QueryCenterView';

// Motor Central de Aprovações (Fase 1.1.5.7)
import { ApprovalInboxView } from './modules/approvals/ApprovalInboxView';
import { MyRequestsView } from './modules/approvals/MyRequestsView';
import { ApprovalHistoryView } from './modules/approvals/ApprovalHistoryView';
import { ApprovalRulesAdminView } from './modules/approvals/ApprovalRulesAdminView';
import { ApprovalThresholdsAdminView } from './modules/approvals/ApprovalThresholdsAdminView';

const MODULE_NAMES: Record<string, string> = {
  overview: 'Visão Geral',
  search: 'Central de Consulta',
  notifications: 'Notificações',
  approvals: 'Aprovações',
  events: 'Eventos',
  commercial: 'Comercial',
  'event-support': 'Suporte Eventos',
  sac: 'Atendimento SAC',
  refunds: 'Estorno',
  finance: 'Financeiro',
  accounting: 'Contabilidade',
  marketing: 'Marketing',
  remarketing: 'Remarketing',
  admin: 'Administração',
  settings: 'Configurações'
};

const MainShell: React.FC = () => {
  const { currentUser, isAuthenticated, showLoginModal, setShowLoginModal } = useAuth();
  const { defaultDashboard } = useDiskContext();

  const [activeModule, setActiveModule] = useState<string>(defaultDashboard);
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>('overview-main');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  // Dynamic dashboard dispatch based on primary profile (Fase 1.1.5.3)
  useEffect(() => {
    setActiveModule(defaultDashboard);
    if (defaultDashboard === 'admin') {
      setActiveSubItem('admin-dashboard');
    } else {
      setActiveSubItem(`${defaultDashboard}-main`);
    }
  }, [currentUser.id, defaultDashboard]);

  const handleNavigate = (moduleId: string, subItemId?: string) => {
    setActiveModule(moduleId);
    setActiveSubItem(subItemId);
    if (moduleId === 'search') {
      setSearchInitialQuery(subItemId || '');
    }
  };

  // If user is logged out, present the central login screen
  if (!isAuthenticated || showLoginModal) {
    return <LoginView onSuccess={() => setShowLoginModal(false)} />;
  }

  const renderAdminSubContent = () => {
    switch (activeSubItem) {
      case 'admin-dashboard':
        return (
          <AdminDashboardView
            onNavigateSubItem={(sub) => handleNavigate('admin', sub)}
            onOpenNewUser={() => handleNavigate('admin', 'admin-users')}
          />
        );
      case 'admin-users':
        return <AdminUsersView />;
      case 'admin-roles':
        return <AdminRolesView />;
      case 'admin-permissions':
        return <AdminPermissionsView />;
      case 'admin-sessions':
        return <AdminSessionsView />;
      case 'admin-security':
        return <SecurityCenterView />;
      case 'admin-notifications':
        return <NotificationCenterView onNavigate={handleNavigate} />;
      case 'admin-approval-rules':
        return <ApprovalRulesAdminView />;
      case 'admin-approval-thresholds':
        return <ApprovalThresholdsAdminView />;
      case 'admin-audit':
        return <AdminAuditView />;
      default:
        return (
          <AdminDashboardView
            onNavigateSubItem={(sub) => handleNavigate('admin', sub)}
            onOpenNewUser={() => handleNavigate('admin', 'admin-users')}
          />
        );
    }
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <OverviewDashboard
            onNavigate={handleNavigate}
            onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          />
        );

      case 'search':
        return (
          <QueryCenterView
            initialQuery={searchInitialQuery}
            onNavigate={handleNavigate}
          />
        );

      case 'notifications':
        return <NotificationCenterView onNavigate={handleNavigate} />;

      case 'events':
        return (
          <ProtectedRoute permission="eventos.evento.visualizar" onBack={() => handleNavigate('overview')}>
            <EventsDashboard />
          </ProtectedRoute>
        );

      case 'commercial':
        return (
          <ProtectedRoute permission="comercial.produtores.visualizar" onBack={() => handleNavigate('overview')}>
            <CommercialDashboard />
          </ProtectedRoute>
        );

      case 'event-support':
        return (
          <ProtectedRoute permission="suporte.incidentes.visualizar" onBack={() => handleNavigate('overview')}>
            <EventSupportDashboard />
          </ProtectedRoute>
        );

      case 'sac':
        return (
          <ProtectedRoute permission="sac.consulta.acessar" onBack={() => handleNavigate('overview')}>
            <SacDashboard onNavigateToRefunds={() => handleNavigate('refunds', 'refunds-approvals')} />
          </ProtectedRoute>
        );

      case 'refunds':
        return (
          <ProtectedRoute permission="estorno.solicitacao.visualizar" onBack={() => handleNavigate('overview')}>
            <RefundsDashboard />
          </ProtectedRoute>
        );

      case 'finance':
        return (
          <ProtectedRoute permission="financeiro.saldo.visualizar" onBack={() => handleNavigate('overview')}>
            <FinanceDashboard />
          </ProtectedRoute>
        );

      case 'accounting':
        return (
          <ProtectedRoute permission="contabilidade.diario.visualizar" onBack={() => handleNavigate('overview')}>
            <AccountingDashboard />
          </ProtectedRoute>
        );

      case 'marketing':
        return (
          <ProtectedRoute permission="marketing.campanha.visualizar" onBack={() => handleNavigate('overview')}>
            <MarketingDashboard />
          </ProtectedRoute>
        );

      case 'remarketing':
        return (
          <ProtectedRoute permission="remarketing.carrinhos.visualizar" onBack={() => handleNavigate('overview')}>
            <RemarketingDashboard />
          </ProtectedRoute>
        );

      case 'approvals':
        return (
          <ProtectedRoute permission="aprovacoes.solicitacao.visualizar" onBack={() => handleNavigate('overview')}>
            {(() => {
              switch (activeSubItem) {
                case 'approvals-my-requests':
                  return <MyRequestsView />;
                case 'approvals-history':
                  return <ApprovalHistoryView />;
                case 'approvals-rules':
                  return <ApprovalRulesAdminView />;
                case 'approvals-thresholds':
                  return <ApprovalThresholdsAdminView />;
                case 'approvals-inbox':
                default:
                  return <ApprovalInboxView onNavigate={handleNavigate} />;
              }
            })()}
          </ProtectedRoute>
        );

      case 'admin':
        return (
          <ProtectedRoute permission="admin.usuarios.visualizar" onBack={() => handleNavigate('overview')}>
            {renderAdminSubContent()}
          </ProtectedRoute>
        );

      case 'settings':
        return (
          <ProtectedRoute permission="admin.configuracoes.editar" onBack={() => handleNavigate('overview')}>
            <SettingsView />
          </ProtectedRoute>
        );

      default:
        return (
          <OverviewDashboard
            onNavigate={handleNavigate}
            onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Expandable Sidebar with Dynamic RBAC filtering */}
      <Sidebar
        activeModule={activeModule}
        activeSubItem={activeSubItem}
        onNavigate={handleNavigate}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main App Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Header */}
        <Header
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAudit={() => setIsAuditOpen(true)}
          onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          onNavigateToAdmin={() => handleNavigate('admin', 'admin-dashboard')}
          activeModuleName={MODULE_NAMES[activeModule] || activeModule}
        />

        {/* Scrollable Module Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-950/60">
          <div className="mx-auto max-w-7xl">
            {renderModuleContent()}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenNewSale={() => setIsNewSaleModalOpen(true)}
      />

      {/* Real-time Notifications Slide-Over */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
        onOpenFullCenter={() => handleNavigate('notifications')}
      />

      {/* Immutable Core Audit Trail Slide-Over */}
      <AuditDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Interactive New Sale & Cross-Module Simulator Modal */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DiskContextProvider>
        <ScopeProvider>
          <NotificationProvider>
            <CoreDataProvider>
              <MainShell />
            </CoreDataProvider>
          </NotificationProvider>
        </ScopeProvider>
      </DiskContextProvider>
    </AuthProvider>
  );
}
