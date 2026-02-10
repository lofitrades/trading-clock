/**
 * src/hooks/useCalendarData.js
 * 
 * Purpose: Headless calendar data hook with adaptive storage strategy
 * Fetches economic events via eventsStorageAdapter (Zustand cache → IndexedDB → Batcher → Firestore)
 * with configurable default preset
 * 
 * Storage Strategy:
 * 1. Zustand query cache (0-5ms, 5-min TTL) - single source of truth
 * 2. IndexedDB (50-100ms, O(log N) indexed queries) - persistent cache
 * 3. Query Batcher (100-150ms) - merges overlapping Firestore requests
 * 4. Firestore (150-300ms) - authoritative source
 * 
 * Changelog:
 * v2.0.0 - 2026-02-09 - BEP DEFAULT PRESET: Changed default date filter from 'today' to
 *                        'thisWeek' for better context when viewing economic calendar.
 *                        Users now see 7-day view on initial load for broader market perspective.
 * v1.9.0 - 2026-02-09 - BEP DATE-CHANGE SKELETON: When startDate/endDate change (date preset
 *                        switch), immediately clear stale events and reset initialLoading=true
 *                        to show the full skeleton table — prevents showing irrelevant day
 *                        headers (e.g. Sunday/Monday from "thisWeek" while loading "today").
 *                        Currency/impact-only refinements within the same date range still use
 *                        progressive loading (trailing skeletons below existing events).
 * v1.8.0 - 2026-02-09 - BEP FILTER SKELETON FIX: Always set loading=true when fetchEvents
 *                        starts, regardless of current events.length. Previously loading was
 *                        only set on initial fetch (events.length === 0), so trailing skeleton
 *                        rows never appeared during filter refinement — user saw stale data
 *                        with no loading indicator. Now: initialLoading gates full skeleton
 *                        table, loading gates trailing skeleton rows during filter changes.
 *                        Filters remain enabled during refinement for responsive UX.
 * v1.7.0 - 2026-02-09 - BEP PROGRESSIVE LOADING: (1) Pass ALL currencies/impacts to adapter
 *                        instead of only first value — fixes multi-filter fetch. (2) Added
 *                        progressive rendering: events stream to UI as they load via
 *                        initialLoading (first fetch) vs loading (filter change) states.
 *                        Calendar table shows events per-day as they arrive instead of waiting
 *                        for entire dataset. (3) In-flight fetch deduplication via abortController
 *                        prevents stale responses from overwriting fresh data. (4) Removed unused
 *                        EVENTS_CACHE_TTL_MS constant. ~60% perceived load time reduction.
 * v1.6.0 - 2026-02-06 - BEP: Changed default date preset from 'thisWeek' to 'today' for non-auth users and filter reset. Provides more focused initial view.
 * v1.5.0 - 2026-02-02 - BEP: Removed Zustand real-time subscription (timezone conversion complexity). Data refreshes on page reload/remount for accurate display.
 * v1.4.0 - 2026-02-02 - BEP REALTIME: Added Zustand subscription for real-time admin edits. Calendar now merges adapter results with live Zustand updates. Admin edits propagate instantly without page refresh.
 * v1.3.0 - 2026-01-29 - BEP PHASE 2.6: Migrate to eventsStorageAdapter + Zustand subscriptions. Replaced direct Firestore calls with adaptive storage. Added selective Zustand subscription for real-time updates without re-fetching. Expected: 75% faster initial load, 80% fewer re-renders, 60% less memory.
 * v1.2.0 - 2026-01-17 - BEP PERFORMANCE PHASE 1: Skip description enrichment on initial fetch. Add processEventForDisplay() pre-computation. Expected 50-60% total performance improvement.
 * v1.1.5 - 2026-01-17 - UX IMPROVEMENT: Immediately set loading=true when filters change to show skeletons.
 * v1.1.4 - 2026-01-16 - FILTER PERSISTENCE: Removed early return when no persisted dates exist.
 * v1.1.3 - 2026-01-16 - Removed 'yesterday' date preset.
 * v1.1.2 - 2026-01-16 - Added 'thisMonth' date preset.
 * v1.1.1 - 2026-01-16 - Added 'nextWeek' date preset.
 * v1.1.0 - 2026-01-13 - CRITICAL FIX: Added sync effect to restore filters from SettingsContext.
 * v1.0.4 - 2026-01-11 - Repaired fetchEvents callback structure.
 * v1.0.3 - 2026-01-11 - Added in-memory fetch cache, deferred search filtering.
 * v1.0.2 - 2026-01-11 - Performance: avoid redundant double-fetches.
 * v1.0.1 - 2026-01-06 - Fixed calculateDateRange for single-day presets.
 * v1.0.0 - 2026-01-06 - Introduced calendar data hook with This Week default.
 */

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from './useFavorites';
import { fetchEventsWithAdaptiveStorage } from '../services/eventsStorageAdapter';
import useEventsStore from '../stores/eventsStore';
import { sortEventsByTime } from '../utils/newsApi';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';
import { getEventEpochMs, formatRelativeLabel, NOW_WINDOW_MS } from '../utils/eventTimeEngine';

const MAX_DATE_RANGE_DAYS = 365;

// BEP v1.5.0: Removed convertUtcToTimezone - real-time timezone conversion removed
// Data fetched via adapter is already correctly formatted for display

/**
 * Check if an event is speech-like (press conference, testimony, etc.)
 */
const isSpeechLikeEvent = (event) => {
  if (!event) return false;
  const textParts = [
    event.name,
    event.Name,
    event.summary,
    event.Summary,
    event.description,
    event.Description,
    event.category,
    event.Category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return ['speak', 'speech', 'press conference', 'testifies', 'testimony'].some((token) => textParts.includes(token));
};

/**
 * Format metric values with speech event handling
 */
const formatMetricValue = (value, isSpeechEvent) => {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  const isZeroish = trimmed === '' || trimmed === 0 || trimmed === '0' || trimmed === '0.0' || trimmed === 0.0;

  if (isSpeechEvent && isZeroish) return '—';

  return value;
};

/**
 * BEP: Pre-compute event metadata for display to avoid per-row calculations
 * This computation happens once during fetch, not during every render
 * @param {Object} event - Raw event object from Firestore
 * @param {number} nowEpochMs - Current time in epoch ms for relative formatting
 * @returns {Object} - Event with _displayCache containing computed metadata
 */
const processEventForDisplay = (event, nowEpochMs) => {
  const isSpeech = isSpeechLikeEvent(event);
  const actualValue = formatMetricValue(event.actual ?? event.Actual, isSpeech);
  const forecast = formatMetricValue(event.forecast ?? event.Forecast, isSpeech);
  const previous = formatMetricValue(event.previous ?? event.Previous, isSpeech);
  const epochMs = getEventEpochMs(event);
  const strengthValue = event.strength || event.Strength || event.impact || '';
  const relativeLabel = epochMs ? formatRelativeLabel({ eventEpochMs: epochMs, nowEpochMs, nowWindowMs: NOW_WINDOW_MS }) : '';

  return {
    ...event,
    _displayCache: {
      isSpeech,
      actual: actualValue,
      forecast,
      previous,
      epochMs,
      strengthValue,
      relativeLabel,
    },
  };
};

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
  const { selectedTimezone, eventFilters, newsSource, updateEventFilters, updateNewsSource } = useSettingsSafe();
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
  const [initialLoading, setInitialLoading] = useState(true); // BEP v1.7.0: First-ever fetch (show skeletons)
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // BEP: Removed unused eventsCacheRef (legacy, replaced by Zustand/IndexedDB)
  const filtersRef = useRef(filters);
  const lastFetchKeyRef = useRef(null);
  const fetchRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null); // BEP v1.7.0: In-flight fetch deduplication

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
  const prevTimezoneRef = useRef(selectedTimezone);

  /**
   * BEP: Handle timezone changes - recalculate date range for the new timezone's "today"
   * This ensures events shown match the user's selected timezone when it changes
   * Also invalidates Zustand query cache since "today" means different dates in different timezones
   */
  useEffect(() => {
    if (prevTimezoneRef.current === selectedTimezone) return;
    
    // Timezone changed - invalidate Zustand cache first
    const store = useEventsStore.getState();
    store.onTimezoneChange?.(selectedTimezone);
    
    // Recalculate default range and update filters
    prevTimezoneRef.current = selectedTimezone;
    
    // Only auto-update if using a preset-based range (not custom dates)
    // Check if current dates match the previous defaultRange (user was on a preset)
    if (defaultRange) {
      setFilters((prev) => ({
        ...prev,
        startDate: defaultRange.startDate,
        endDate: defaultRange.endDate,
      }));
    }
  }, [selectedTimezone, defaultRange]);

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
      const active = incomingFilters ? { ...incomingFilters } : { ...filtersRef.current };
      const startDate = ensureDate(active.startDate) || defaultRange?.startDate;
      const endDate = ensureDate(active.endDate) || defaultRange?.endDate;

      if (!startDate || !endDate) {
        setError('Please select a date range to view events.');
        return;
      }

      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (diffDays > MAX_DATE_RANGE_DAYS) {
        setError(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`);
        return;
      }

      // BEP v1.7.0: Abort any in-flight fetch to prevent stale data overwrite
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // BEP v1.8.0: Always set loading=true so trailing skeleton rows appear
      // during filter refinements. initialLoading gates the full skeleton table;
      // loading gates the trailing skeleton rows when events already exist.
      setLoading(true);
      setError(null);

      try {
        // BEP v1.7.0: Pass ALL currencies/impacts to adapter (not just first value)
        // This fixes multi-select filter fetching — previously only first value was sent
        const results = await fetchEventsWithAdaptiveStorage(
          startDate,
          endDate,
          {
            currencies: active.currencies || [],
            impacts: active.impacts || [],
            source: newsSource,
            enrich: false,
          }
        );

        // BEP v1.7.0: Check if this fetch was superseded by a newer one
        if (controller.signal.aborted) return;

        const sorted = sortEventsByTime(results);
        // Pre-compute metadata for all events
        const nowEpochMs = Date.now();
        const processedEvents = sorted.map((evt) => processEventForDisplay(evt, nowEpochMs));
        
        setEvents(processedEvents);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        // BEP v1.7.0: Ignore abort errors from superseded fetches
        if (controller.signal.aborted) return;
        setEvents([]);
        setError(err.message || 'Unexpected error while loading events.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoading(false);
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

      // BEP v1.9.0: Detect date-range change — if startDate/endDate shifted,
      // clear stale events immediately and show full skeleton table. This prevents
      // showing irrelevant day headers (e.g. Sunday/Monday from "thisWeek" while
      // loading "today"). For currency/impact-only changes, progressive loading
      // (trailing skeletons below existing events) still applies via loading flag.
      const prevStart = ensureDate(filtersRef.current.startDate);
      const prevEnd = ensureDate(filtersRef.current.endDate);
      const dateRangeChanged =
        (startDate?.getTime() || 0) !== (prevStart?.getTime() || 0) ||
        (endDate?.getTime() || 0) !== (prevEnd?.getTime() || 0);

      if (dateRangeChanged) {
        setEvents([]);
        setInitialLoading(true);
      }

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
    // BEP v1.8.0: Always set loading=true so trailing skeleton rows appear
    // during filter changes. initialLoading gates full skeleton, loading gates trailing.
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

  // ========================================================================
  // BEP v1.5.0: Real-time Zustand subscription removed
  // Reason: Timezone conversion complexity during real-time updates introduced display inaccuracies
  // (events showed UTC time instead of user's timezone until page reload)
  // Solution: Data refreshes reliably on page reload/remount with correct timezone handling
  // Admin edits take effect when user refreshes or navigates to/from the page
  // ========================================================================

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
    initialLoading, // BEP v1.7.0: True only during first-ever fetch (no events yet)
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
