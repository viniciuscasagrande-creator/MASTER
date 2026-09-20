import React from 'react';
import { useDiskContext } from '../../core/context/DiskContext';
import { ModuleSidebar } from './ModuleSidebar';
import { EventContextSidebar } from './EventContextSidebar';

interface SidebarProps {
  activeModule: string;
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubItem,
  onNavigate,
  isExpanded,
  onToggleExpanded
}) => {
  const { activeEvent, selectedEventId, clearEvent } = useDiskContext();

  const isEventContextActive = Boolean(selectedEventId && selectedEventId !== 'all' && activeEvent);

  const handleExitEventContext = () => {
    clearEvent();
    onNavigate('events', 'events-all');
  };

  if (isEventContextActive) {
    return (
      <EventContextSidebar
        activeSubItem={activeSubItem}
        onNavigate={onNavigate}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        onExitEventContext={handleExitEventContext}
      />
    );
  }

  return (
    <ModuleSidebar
      activeModule={activeModule}
      activeSubItem={activeSubItem}
      onNavigate={onNavigate}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
    />
  );
};
