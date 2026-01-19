/**
 * src/hooks/useCalendarData.js
 * 
 * Purpose: Headless calendar data hook that reuses EventsFilters3 logic with a configurable default preset,
 * fetches economic events, and exposes grouped, filter-aware state for embeddable calendar surfaces.
 * 
 * Changelog:
 * v1.1.5 - 2026-01-17 - UX IMPROVEMENT: Immediately set loading=true when filters change to show skeletons during reset/filter transitions. Prevents "No events for this day." message from appearing while fetching new data. Follows enterprise pattern: show loading state immediately on user action, then show content or empty state after fetch completes.
 * v1.1.4 - 2026-01-16 - FILTER PERSISTENCE: Removed early return when no persisted dates exist; now always applies defaultRange fallback (thisWeek) even when eventFilters has no dates. Ensures date range is NEVER unselected on /calendar page load.
 * v1.1.3 - 2026-01-16 - Removed 'yesterday' date preset; users now choose between Today, Tomorrow, This Week, Next Week, or This Month.
 * v1.1.2 - 2026-01-16 - Added 'thisMonth' date preset that calculates the current month's date range with full timezone awareness.
 * v1.1.1 - 2026-01-16 - Added 'nextWeek' date preset that calculates next week's date range with full timezone awareness.
 * v1.1.0 - 2026-01-13 - CRITICAL FIX: Added sync effect to restore filters from SettingsContext on page refresh/navigation; ensures filter persistence across sessions via Firestore and localStorage.
 * v1.0.4 - 2026-01-11 - Repaired fetchEvents callback structure to restore valid parsing and loading state handling.
 * v1.0.3 - 2026-01-11 - Added in-memory fetch cache, deferred search filtering, and stricter setState guards to cut render and network overhead.
 * v1.0.2 - 2026-01-11 - Performance: avoid redundant double-fetches by fetching only when date/source/impact/currency changes; ignore local-only filters (search/favorites) and guard against out-of-order responses.
 * v1.0.1 - 2026-01-06 - Fixed calculateDateRange to use timezone-safe end-of-day calculation (next day start - 1 second) preventing single-day presets from bleeding into the next calendar day.
 * v1.0.0 - 2026-01-06 - Introduced calendar data hook with This Week default, persistence via SettingsContext, and refresh support.
 */

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from './useFavorites';
import { getEventsByDateRange, refreshEventsCache } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';

const MAX_DATE_RANGE_DAYS = 365;
const EVENTS_CACHE_TTL_MS = 5 * 60 * 1000;

const buildFetchKey = (filters, newsSource) => {
  const startEpoch = filters.startDate ? ensureDate(filters.startDate)?.getTime() : null;
  const endEpoch = filters.endDate ? ensureDate(filters.endDate)?.getTime() : null;
  const impactsKey = (filters.impacts || []).slice().sort().join('|');
  const currenciesKey = (filters.currencies || []).slice().sort().join('|');
  const sourceKey = newsSource || 'auto';
  return `${sourceKey}-${startEpoch ?? 'na'}-${endEpoch ?? 'na'}-${impactsKey}-${currenciesKey}`;
};

const calculateDateRange = (preset, timezone) => {
  const { year, month, day, dayOfWeek } = getDatePartsInTimezone(timezone);
  const createDate = (y, m, d, endOfDay = false) => {
    if (endOfDay) {
      // Create start of NEXT day, then subtract 1 second to stay within the target day
      // This ensures we don't bleed into the next calendar day in the target timezone
      const nextDayStart = getUtcDateForTimezone(timezone, y, m, d + 1, { hour: 0, minute: 0, second: 0, millisecond: 0 });
      return new Date(nextDayStart.getTime() - 1000); // End at 23:59:59 of target day
    }
    return getUtcDateForTimezone(timezone, y, m, d, { endOfDay: false });
  };

  switch (preset) {
    case 'today':
      return { startDate: createDate(year, month, day), endDate: createDate(year, month, day, true) };
    case 'tomorrow':
      return { startDate: createDate(year, month, day + 1), endDate: createDate(year, month, day + 1, true) };
    case 'thisWeek': {
      const startDay = day - dayOfWeek;
      const endDay = day + (6 - dayOfWeek);
      return { startDate: createDate(year, month, startDay), endDate: createDate(year, month, endDay, true) };
    }
    case 'nextWeek': {
      // Start from the day after this week ends (next Sunday becomes Monday)
      const thisWeekEndDay = day + (6 - dayOfWeek);
      const nextWeekStartDay = thisWeekEndDay + 1;
      const nextWeekEndDay = nextWeekStartDay + 6;
      return { startDate: createDate(year, month, nextWeekStartDay), endDate: createDate(year, month, nextWeekEndDay, true) };
    }
    case 'thisMonth': {
      // Start: First day of current month at 00:00:00
      // End: Last day of current month at 23:59:59
      const startDay = 1;
      // Get last day of month: create first day of next month, then subtract 1 day
      const firstOfNextMonth = month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
      const endDay = new Date(createDate(firstOfNextMonth.year, firstOfNextMonth.month, firstOfNextMonth.day).getTime() - 24 * 60 * 60 * 1000).getDate();
      return { startDate: createDate(year, month, startDay), endDate: createDate(year, month, endDay, true) };
    }
    default:
      return null;
  }
};

const ensureDate = (value) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export function useCalendarData({ defaultPreset = 'thisWeek' } = {}) {
  const { user } = useAuth();
  const { selectedTimezone, eventFilters, newsSource, updateEventFilters, updateNewsSource } = useSettings();
  const { isFavorite, toggleFavorite, favoritesLoading, isFavoritePending } = useFavorites();

  const defaultRange = useMemo(
    () => calculateDateRange(defaultPreset, selectedTimezone),
    [defaultPreset, selectedTimezone],
  );

  const [filters, setFilters] = useState(() => {
    const startDate = ensureDate(eventFilters.startDate) || defaultRange?.startDate || null;
    const endDate = ensureDate(eventFilters.endDate) || defaultRange?.endDate || null;
    return {
      startDate,
      endDate,
      impacts: eventFilters.impacts || [],
      currencies: eventFilters.currencies || [],
      favoritesOnly: eventFilters.favoritesOnly || false,
      searchQuery: eventFilters.searchQuery || '',
    };
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const eventsCacheRef = useRef(new Map());
  const filtersRef = useRef(filters);
  const lastFetchKeyRef = useRef(null);
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Sync local filters state with SettingsContext eventFilters when they change
   * CRITICAL: This ensures filters persist across page refreshes and browser sessions.
   * When Firestore data loads after initial mount, this effect updates local state.
   */
  const hasInitializedFromSettingsRef = useRef(false);
  const prevEventFiltersRef = useRef(eventFilters);

  useEffect(() => {
    // Skip if eventFilters haven't meaningfully changed (avoid infinite loops)
    const prev = prevEventFiltersRef.current;
    const hasDatesChanged = 
      (eventFilters.startDate?.getTime?.() || null) !== (prev.startDate?.getTime?.() || null) ||
      (eventFilters.endDate?.getTime?.() || null) !== (prev.endDate?.getTime?.() || null);
    const hasFiltersChanged = 
      JSON.stringify(eventFilters.impacts || []) !== JSON.stringify(prev.impacts || []) ||
      JSON.stringify(eventFilters.currencies || []) !== JSON.stringify(prev.currencies || []) ||
      eventFilters.favoritesOnly !== prev.favoritesOnly ||
      eventFilters.searchQuery !== prev.searchQuery;

    if (!hasDatesChanged && !hasFiltersChanged && hasInitializedFromSettingsRef.current) {
      return;
    }

    prevEventFiltersRef.current = eventFilters;
    hasInitializedFromSettingsRef.current = true;

    // Always sync from SettingsContext to local state
    // If dates are saved, use them; otherwise, fall back to defaultRange (thisWeek)
    // This ensures date range is NEVER unselected
    const startDate = ensureDate(eventFilters.startDate) || defaultRange?.startDate || null;
    const endDate = ensureDate(eventFilters.endDate) || defaultRange?.endDate || null;
    
    const syncedFilters = {
      startDate,
      endDate,
      impacts: eventFilters.impacts || [],
      currencies: eventFilters.currencies || [],
      favoritesOnly: eventFilters.favoritesOnly || false,
      searchQuery: eventFilters.searchQuery || '',
    };

    setFilters(syncedFilters);
    filtersRef.current = syncedFilters;
  }, [eventFilters, defaultRange]);

  const persistFilters = useCallback(
    (nextFilters) => {
      updateEventFilters(nextFilters);
    },
    [updateEventFilters],
  );

  const fetchEvents = useCallback(
    async (incomingFilters = null) => {
      const requestId = ++fetchRequestIdRef.current;
      const active = incomingFilters ? { ...incomingFilters } : { ...filtersRef.current };
      const startDate = ensureDate(active.startDate) || defaultRange?.startDate;
      const endDate = ensureDate(active.endDate) || defaultRange?.endDate;
      const fetchKey = buildFetchKey({ ...active, startDate, endDate }, newsSource);

      if (!startDate || !endDate) {
        setError('Please select a date range to view events.');
        return;
      }

      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (diffDays > MAX_DATE_RANGE_DAYS) {
        setError(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`);
        return;
      }

      const cached = eventsCacheRef.current.get(fetchKey);
      if (cached && Date.now() - cached.timestamp < EVENTS_CACHE_TTL_MS) {
        setEvents(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getEventsByDateRange(startDate, endDate, {
          source: newsSource,
          impacts: active.impacts || [],
          currencies: active.currencies || [],
        });

        if (result.success) {
          if (fetchRequestIdRef.current === requestId) {
            const sorted = sortEventsByTime(result.data);
            setEvents(sorted);
            const timestamp = Date.now();
            setLastUpdated(new Date(timestamp));
            eventsCacheRef.current.set(fetchKey, { timestamp, data: sorted });
          }
        } else {
          if (fetchRequestIdRef.current === requestId) {
            setEvents([]);
            setError(result.error || 'Failed to load events.');
          }
        }
      } catch (err) {
        if (fetchRequestIdRef.current === requestId) {
          setEvents([]);
          setError(err.message || 'Unexpected error while loading events.');
        }
      } finally {
        if (fetchRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [defaultRange, newsSource],
  );

  const applyFilters = useCallback(
    (nextFilters) => {
      const merged = {
        ...filtersRef.current,
        ...nextFilters,
      };

      const startDate = ensureDate(merged.startDate) || defaultRange?.startDate;
      const endDate = ensureDate(merged.endDate) || defaultRange?.endDate;

      const resolved = {
        ...merged,
        startDate,
        endDate,
        searchQuery: merged.searchQuery || '',
      };

      filtersRef.current = resolved;
      setFilters(resolved);
      persistFilters(resolved);
    },
    [defaultRange, persistFilters],
  );

  const handleFiltersChange = useCallback((nextFilters) => {
    // Immediately show loading skeleton when filters change
    // This prevents "No events" message from appearing during filter/reset transitions
    setLoading(true);
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  const fetchKey = useMemo(
    () => buildFetchKey(filters, newsSource),
    [filters, newsSource],
  );

  useEffect(() => {
    const hasDates = Boolean(filters.startDate && filters.endDate);

    if (!hasDates && defaultRange?.startDate && defaultRange?.endDate) {
      const seeded = { ...filtersRef.current, ...defaultRange };
      filtersRef.current = seeded;
      setFilters(seeded);
      persistFilters(seeded);
      return;
    }

    if (!hasDates) return;

    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    fetchEvents(filtersRef.current);
  }, [defaultRange, fetchEvents, fetchKey, filters.endDate, filters.startDate, persistFilters]);

  const deferredSearchQuery = useDeferredValue(filters.searchQuery || '');

  const displayedEvents = useMemo(() => {
    let filtered = events;

    if (deferredSearchQuery && deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((event) => {
        const name = (event.name || event.Name || '').toLowerCase();
        const currency = (event.currency || event.Currency || '').toLowerCase();
        const description = (event.description || event.Description || event.summary || event.Summary || '').toLowerCase();

        return (
          name.includes(query) ||
          currency.includes(query) ||
          description.includes(query)
        );
      });
    }

    if (filters.favoritesOnly) {
      filtered = filtered.filter((event) => isFavorite(event));
    }

    return filtered;
  }, [events, filters.favoritesOnly, deferredSearchQuery, isFavorite]);

  const visibleCount = displayedEvents.length;

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshEventsCache(newsSource);
      await fetchEvents(filtersRef.current);
    } catch (err) {
      setError(err.message || 'Failed to refresh events.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvents, newsSource, refreshing]);

  const handleNewsSourceChange = useCallback(
    (nextSource) => {
      updateNewsSource(nextSource);
    },
    [updateNewsSource],
  );

  return {
    filters,
    handleFiltersChange,
    applyFilters,
    events: displayedEvents,
    rawEvents: events,
    loading,
    error,
    lastUpdated,
    visibleCount,
    timezone: selectedTimezone,
    newsSource,
    handleNewsSourceChange,
    refresh,
    refreshing,
    isFavorite,
    toggleFavorite,
    isFavoritePending,
    favoritesLoading,
    defaultRange,
    user,
  };
}

export default useCalendarData;
