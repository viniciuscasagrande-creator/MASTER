import React, { useState } from 'react';
import { AuthProvider } from './core/auth/AuthContext';
import { ScopeProvider } from './core/context/ScopeContext';
import { CoreDataProvider } from './core/context/CoreDataContext';
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

const MainShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>('overview-main');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  const handleNavigate = (moduleId: string, subItemId?: string) => {
    setActiveModule(moduleId);
    setActiveSubItem(subItemId);
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
      case 'events':
        return <EventsDashboard />;
      case 'commercial':
        return <CommercialDashboard />;
      case 'event-support':
        return <EventSupportDashboard />;
      case 'sac':
        return <SacDashboard onNavigateToRefunds={() => handleNavigate('refunds', 'refunds-approvals')} />;
      case 'refunds':
        return <RefundsDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      case 'accounting':
        return <AccountingDashboard />;
      case 'marketing':
        return <MarketingDashboard />;
      case 'remarketing':
        return <RemarketingDashboard />;
      case 'settings':
        return <SettingsView />;
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
      {/* Expandable Sidebar */}
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
      <ScopeProvider>
        <CoreDataProvider>
          <MainShell />
        </CoreDataProvider>
      </ScopeProvider>
    </AuthProvider>
  );
}
