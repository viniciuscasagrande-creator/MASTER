import { useState, useEffect, useCallback, useRef } from 'react';
import {
  EventListItemDTO,
  EventSummaryDTO,
  ListEventsFilter,
  EventsViewMode
} from '../types/event.types';
import { fetchEvents, fetchEventSummary } from '../api/events.api';
import { useDiskContext } from '../../../core/context/DiskContext';

export function useEvents(initialFilters: Partial<ListEventsFilter> = {}) {
  const { apiFetch, selectedProducerId } = useDiskContext();

  const [events, setEvents] = useState<EventListItemDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [summary, setSummary] = useState<EventSummaryDTO | null>(null);
  const [viewMode, setViewMode] = useState<EventsViewMode>('cards');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ListEventsFilter>({
    search: '',
    status: 'ALL',
    period: 'all',
    sortBy: 'date_asc',
    producerId: selectedProducerId !== 'all' ? selectedProducerId : undefined,
    ...initialFilters
  });

  // Track search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync producerId from DiskContext
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      producerId: selectedProducerId !== 'all' ? selectedProducerId : undefined
    }));
  }, [selectedProducerId]);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await fetchEventSummary(
        selectedProducerId !== 'all' ? selectedProducerId : undefined,
        apiFetch
      );
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao carregar resumo de eventos:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [selectedProducerId, apiFetch]);

  // Load events
  const loadEvents = useCallback(async (activeFilters: ListEventsFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchEvents(activeFilters, apiFetch);
      setEvents(result.events);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar eventos');
      setEvents([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // Initial and reactive load on filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce when user is typing search
    if (filters.search) {
      searchTimeoutRef.current = setTimeout(() => {
        loadEvents(filters);
      }, 350);
    } else {
      loadEvents(filters);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, loadEvents]);

  // Load summary on mount or producer change
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleChangeFilter = useCallback((key: keyof ListEventsFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'ALL',
      period: 'all',
      sortBy: 'date_asc',
      producerId: selectedProducerId !== 'all' ? selectedProducerId : undefined
    });
  }, [selectedProducerId]);

  const refresh = useCallback(() => {
    loadEvents(filters);
    loadSummary();
  }, [filters, loadEvents, loadSummary]);

  return {
    events,
    total,
    summary,
    filters,
    viewMode,
    isLoading,
    isSummaryLoading,
    error,
    setViewMode,
    handleChangeFilter,
    handleClearFilters,
    refresh
  };
}
