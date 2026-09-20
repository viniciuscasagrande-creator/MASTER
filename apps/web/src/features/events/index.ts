// Types
export * from './types/event.types';

// Utils
export * from './utils/event-status';

// API
export * from './api';

// Hooks
export * from './hooks/useEvents';
export * from './hooks/useEventSelection';

// Components
export * from './components/EventStatusBadge';
export * from './components/EventsHeader';
export * from './components/EventsSummary';
export * from './components/EventsFilters';
export * from './components/EventCard';
export * from './components/EventTable';
export * from './components/EventsEmptyState';
export * from './components/EventContextHeader';
export * from './components/CreateEventModal';

// Pages - Core & Wizard
export * from './pages/EventsPage';
export * from './pages/EventDashboardPage';
export * from './wizard/EventWizardPage';

// Pages - Venues & Map Editor (Fase 1.2.3)
export * from './venues/VenuesPage';
export * from './venues/VenueDetailsPage';
export * from './venues/VenueCreatePage';
export * from './venues/VenueMapEditorPage';

// Pages - Sessions & Capacity (Fase 1.2.4)
export * from './sessions/EventSessionsPage';
export * from './sessions/EventSessionDetailsPage';

// Pages & Components - Tickets & Inventory (Fase 1.2.5)
export * from './tickets/EventSectionsPage';
export * from './tickets/EventTicketTypesPage';
export * from './tickets/EventCapacityPage';
export * from './tickets/TicketTypeModal';
export * from './tickets/QuotaModal';
export * from './tickets/InventoryBlockModal';

// Pages & Components - Batches, Pricing & Sales Rules (Fase 1.2.6)
export * from './sales/EventBatchesPage';
export * from './sales/EventPricingPage';
export * from './sales/EventSalesRulesPage';
export * from './sales/CreateBatchModal';
export * from './sales/PriceSimulatorModal';
export * from './sales/BulkPricingModal';

// Pages & Components - Sales Channels, Complimentary & Team (Fase 1.2.7)
export * from './sales-channels/EventSalesChannelsPage';
export * from './sales-channels/ConfigureSalesChannelModal';
export * from './complimentary/ComplimentaryPage';
export * from './complimentary/ComplimentaryRequestModal';
export * from './complimentary/ComplimentaryDetailsModal';
export * from './team/EventTeamPage';
export * from './team/AddTeamMemberModal';
export * from './team/AddShiftModal';
export * from './team/AssignResponsibilityModal';

// Pages & Components - Documents, Tasks & Readiness (Fase 1.2.8)
export * from './documents/EventDocumentsPage';
export * from './documents/UploadDocumentModal';
export * from './tasks/EventTasksPage';
export * from './tasks/CreateTaskModal';
export * from './readiness/EventReadinessPage';
export * from './publication/EventReviewPublicationPage';
export * from './changes/EventChangeManagementPage';
export * from './operation/EventOperationPage';
