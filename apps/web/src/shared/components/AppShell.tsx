import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { ContextSelector } from './ContextSelector';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ErrorBoundary } from '../../modules/observability/components/ErrorBoundary';

interface AppShellProps {
  activeModule: string;
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onOpenNewSale: () => void;
  onNavigateToAdmin?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeModule,
  activeSubItem,
  onNavigate,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenAudit,
  onOpenNewSale,
  onNavigateToAdmin,
  children
}) => {
  // Sidebar expanded/collapsed state with persistence
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('master_sidebar_expanded') !== 'false';
    } catch {
      return true;
    }
  });

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('master_sidebar_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const handleMobileNavigate = (moduleId: string, subItemId?: string) => {
    setIsMobileSidebarOpen(false);
    onNavigate(moduleId, subItemId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        <AppSidebar
          activeModule={activeModule}
          activeSubItem={activeSubItem}
          onNavigate={onNavigate}
          isExpanded={isSidebarExpanded}
          onToggleExpanded={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-[260px] max-w-[85vw] h-full z-10 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
            <AppSidebar
              activeModule={activeModule}
              activeSubItem={activeSubItem}
              onNavigate={handleMobileNavigate}
              isExpanded={true}
              onToggleExpanded={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main App Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <AppHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={onOpenCommandPalette}
          onOpenNotifications={onOpenNotifications}
          onOpenAudit={onOpenAudit}
          onOpenNewSale={onOpenNewSale}
          onNavigateToAdmin={onNavigateToAdmin}
        />

        {/* Produtor x Evento Context Selector */}
        <ContextSelector onNavigate={onNavigate} />

        {/* Breadcrumbs Bar */}
        <AppBreadcrumb
          activeModule={activeModule}
          activeSubItem={activeSubItem}
          onNavigate={onNavigate}
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] dark:bg-[#0B1120]">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary fallbackTitle="Erro ao renderizar conteúdo no workspace">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
