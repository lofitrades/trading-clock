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
 * v2.5.0 - 2026-02-13 - BEP ISOLATED DATE PRESET: Added `isolatedDatePreset` option. When set,
 *                        date filters are fully isolated from SettingsContext — the hook always uses
 *                        the locked preset for date range calculation, ignores SettingsContext datePreset
 *                        changes, and never writes date fields back to SettingsContext. Currency/impact
 *                        filters still sync bidirectionally. Designed for ClockEventsTable which must
 *                        always show today's events regardless of Calendar page date selection.
 *                        Backward-compatible: Calendar2Page (no isolatedDatePreset) works as before.
 * v2.4.0 - 2026-02-12 - BEP DAY ROLLOVER: Added timezone-aware day change detection. Polls every
 *                        60s, builds a YYYY-MM-DD dayKey in the user's timezone, and when the key
 *                        changes (midnight in their timezone) recalculates startDate/endDate from
 *                        the active datePreset. Clears stale events, shows skeleton, invalidates
 *                        Zustand cache, and triggers re-fetch. Ensures "Today" preset automatically
 *                        shows tomorrow's events when the day rolls over — no manual refresh needed.
 *                        Also handles "thisWeek"/"thisMonth" transitions at week/month boundaries.
 *                        Matches useClockEventsData dayKey pattern for consistency.
 * v2.3.0 - 2026-02-12 - BEP REALTIME SYNC: Subscribe to systemJobs sync status to invalidate
 *                        all cache layers (Zustand query cache + IndexedDB + lastFetchKey) when
 *                        NFS/JBlanked cloud functions update Firestore. Previously, stale cached
 *                        data was served indefinitely until manual cache clear. Now onSnapshot
 *                        listener on economicEventsCalendarSync doc detects new syncs and triggers
 *                        full re-fetch. Also added missing refreshEventsCache import (was used but
 *                        never imported — refresh() callback would fail at runtime).
 * v2.2.0 - 2026-02-12 - BEP STALE DATE FIX: On hook initialization and settings sync, recalculate
 *                        startDate/endDate from the stored datePreset + current timezone instead of
 *                        trusting stale persisted dates. Root cause: eventFilters stored computed
 *                        startDate/endDate from previous session's "thisWeek" — on return visit,
 *                        the stale dates took precedence over fresh defaultRange because they were
 *                        non-null. Now datePreset is the source of truth; stored dates are only
 *                        used as fallback when no preset exists.
 * v2.1.0 - 2026-02-11 - BEP TIMEZONE FIX: Replaced local calculateDateRange with shared import
 *                        from dateUtils.js. Previous local copy had a broken thisMonth case
 *                        (month===12 guard never fired since month is 0-indexed, and .getDate()
 *                        used system timezone instead of target). All date presets now use a
 *                        single source of truth with precise -1ms end-of-day boundaries.
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
import { fetchEventsWithAdaptiveStorage, clearIdbTimestamp } from '../services/eventsStorageAdapter';
import { subscribeToSyncUpdates, refreshEventsCache } from '../services/economicEventsService';
import useEventsStore from '../stores/eventsStore';
import eventsDB from '../services/eventsDB';
import { sortEventsByTime } from '../utils/newsApi';
import { calculateDateRange, getDatePartsInTimezone } from '../utils/dateUtils';
import { getEventEpochMs, formatRelativeLabel, NOW_WINDOW_MS } from '../utils/eventTimeEngine';

const MAX_DATE_RANGE_DAYS = 365;
const DAY_ROLLOVER_POLL_MS = 60_000; // Check every 60 seconds

/**
 * Build a YYYY-MM-DD day key for the user's timezone.
 * Used to detect midnight rollover without per-second re-renders.
 */
const buildDayKey = (timezone) => {
  const { year, month, day } = getDatePartsInTimezone(timezone);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

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

// calculateDateRange imported from dateUtils.js (single source of truth)

const ensureDate = (value) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export function useCalendarData({ defaultPreset = 'thisWeek', isolatedDatePreset = null } = {}) {
  const { user } = useAuth();
  const { selectedTimezone, eventFilters, newsSource, updateEventFilters, updateNewsSource } = useSettingsSafe();
  const { isFavorite, toggleFavorite, favoritesLoading, isFavoritePending } = useFavorites();

  // BEP v2.5.0: When isolatedDatePreset is set, dates are fully isolated from SettingsContext.
  // The hook always uses the locked preset — ignores eventFilters.datePreset, never writes dates back.
  const isDateIsolated = Boolean(isolatedDatePreset);
  const effectiveDatePreset = isolatedDatePreset || defaultPreset;

  const defaultRange = useMemo(
    () => calculateDateRange(effectiveDatePreset, selectedTimezone),
    [effectiveDatePreset, selectedTimezone],
  );

  // BEP v2.5.0: Isolated date range — always computed from locked preset, never from SettingsContext
  const isolatedRange = useMemo(
    () => isDateIsolated ? calculateDateRange(isolatedDatePreset, selectedTimezone) : null,
    [isDateIsolated, isolatedDatePreset, selectedTimezone],
  );

  const [filters, setFilters] = useState(() => {
    // BEP v2.5.0: When date-isolated, always use the locked preset range.
    // When not isolated, use datePreset from SettingsContext (v2.2.0 source of truth).
    if (isDateIsolated) {
      const range = calculateDateRange(isolatedDatePreset, selectedTimezone);
      return {
        startDate: range?.startDate || null,
        endDate: range?.endDate || null,
        impacts: eventFilters.impacts || [],
        currencies: eventFilters.currencies || [],
        favoritesOnly: eventFilters.favoritesOnly || false,
        searchQuery: eventFilters.searchQuery || '',
      };
    }
    // Non-isolated: existing v2.2.0 logic — datePreset is source of truth
    const preset = eventFilters.datePreset || defaultPreset;
    const presetRange = calculateDateRange(preset, selectedTimezone);
    const startDate = presetRange?.startDate || ensureDate(eventFilters.startDate) || defaultRange?.startDate || null;
    const endDate = presetRange?.endDate || ensureDate(eventFilters.endDate) || defaultRange?.endDate || null;
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
  const abortControllerRef = useRef(null); // BEP v1.7.0: In-flight fetch deduplication

  // ========================================================================
  // BEP v2.4.0: Timezone-aware day rollover detection
  // Polls every 60s to detect when the day changes in the user's timezone.
  // When dayKey shifts (e.g., 2026-02-11 → 2026-02-12), recalculate date range
  // from the active datePreset so "Today" shows the new day's events automatically.
  // ========================================================================
  const dayKeyRef = useRef(buildDayKey(selectedTimezone));

  useEffect(() => {
    const checkRollover = () => {
      const currentDayKey = buildDayKey(selectedTimezone);
      if (currentDayKey !== dayKeyRef.current) {
        dayKeyRef.current = currentDayKey;

        // Day changed — recalculate date range from the active preset
        // BEP v2.5.0: When date-isolated, always use locked preset (never SettingsContext)
        const preset = isDateIsolated ? isolatedDatePreset : (eventFilters.datePreset || defaultPreset);
        const freshRange = calculateDateRange(preset, selectedTimezone);
        if (freshRange) {
          // Clear stale events and show skeleton (date range changed)
          setEvents([]);
          setInitialLoading(true);

          // Invalidate Zustand query cache ("today" means a different day now)
          const store = useEventsStore.getState();
          store.onDayRollover?.();

          // Reset fetch deduplication key so fetchEvents re-runs
          lastFetchKeyRef.current = null;

          // Update local filters with fresh range
          const updated = {
            ...filtersRef.current,
            startDate: freshRange.startDate,
            endDate: freshRange.endDate,
          };
          filtersRef.current = updated;
          setFilters(updated);

          // BEP v2.5.0: Only persist dates to SettingsContext when NOT date-isolated
          if (!isDateIsolated) {
            updateEventFilters(updated);
          }
        }
      }
    };

    const id = setInterval(checkRollover, DAY_ROLLOVER_POLL_MS);
    return () => clearInterval(id);
  }, [selectedTimezone, eventFilters.datePreset, defaultPreset, updateEventFilters, isDateIsolated, isolatedDatePreset]);

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
    
    // BEP v2.5.0: When date-isolated, use isolated range; otherwise use default range
    const rangeToUse = isDateIsolated ? isolatedRange : defaultRange;
    if (rangeToUse) {
      setFilters((prev) => ({
        ...prev,
        startDate: rangeToUse.startDate,
        endDate: rangeToUse.endDate,
      }));
    }
  }, [selectedTimezone, defaultRange, isolatedRange, isDateIsolated]);

  useEffect(() => {
    // Skip if eventFilters haven't meaningfully changed (avoid infinite loops)
    const prev = prevEventFiltersRef.current;

    // BEP v2.5.0: When date-isolated, ignore date changes from SettingsContext entirely
    const hasDatesChanged = isDateIsolated ? false : (
      (eventFilters.startDate?.getTime?.() || null) !== (prev.startDate?.getTime?.() || null) ||
      (eventFilters.endDate?.getTime?.() || null) !== (prev.endDate?.getTime?.() || null)
    );
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

    // BEP v2.5.0: When date-isolated, keep locked date range — only sync non-date fields.
    // When not isolated, recalculate dates from datePreset (v2.2.0 source of truth).
    let startDate, endDate;
    if (isDateIsolated) {
      // Dates stay locked to isolated preset — use current local values
      startDate = filtersRef.current.startDate;
      endDate = filtersRef.current.endDate;
    } else {
      const preset = eventFilters.datePreset;
      const presetRange = preset ? calculateDateRange(preset, selectedTimezone) : null;
      startDate = presetRange?.startDate || ensureDate(eventFilters.startDate) || defaultRange?.startDate || null;
      endDate = presetRange?.endDate || ensureDate(eventFilters.endDate) || defaultRange?.endDate || null;
    }
    
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
  }, [eventFilters, defaultRange, selectedTimezone, isDateIsolated]);

  const persistFilters = useCallback(
    (nextFilters) => {
      if (isDateIsolated) {
        // BEP v2.5.0: When date-isolated, only persist non-date fields to SettingsContext.
        // Prevents /clock from overwriting Calendar page's datePreset.
        const { startDate: _s, endDate: _e, datePreset: _d, ...nonDateFilters } = nextFilters;
        updateEventFilters(nonDateFilters);
      } else {
        updateEventFilters(nextFilters);
      }
    },
    [updateEventFilters, isDateIsolated],
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
      // BEP v2.5.0: When date-isolated, strip any incoming date fields and force locked range
      let effectiveNext = nextFilters;
      if (isDateIsolated) {
        // eslint-disable-next-line no-unused-vars
        const { datePreset, startDate: _s, endDate: _e, ...nonDateNext } = nextFilters;
        effectiveNext = nonDateNext;
      }

      const merged = {
        ...filtersRef.current,
        ...effectiveNext,
      };

      // BEP v2.5.0: When date-isolated, always use the locked date range
      const startDate = isDateIsolated
        ? (isolatedRange?.startDate || defaultRange?.startDate)
        : (ensureDate(merged.startDate) || defaultRange?.startDate);
      const endDate = isDateIsolated
        ? (isolatedRange?.endDate || defaultRange?.endDate)
        : (ensureDate(merged.endDate) || defaultRange?.endDate);

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
    [defaultRange, persistFilters, isDateIsolated, isolatedRange],
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
  // BEP v2.3.0: Subscribe to systemJobs sync status for real-time cache invalidation.
  // When NFS/JBlanked cloud functions update Firestore, the sync doc timestamp changes.
  // This listener detects new syncs and invalidates ALL cache layers:
  //   1. Zustand query cache (immediate in-memory clear)
  //   2. IndexedDB persistent cache (async clear)
  //   3. lastFetchKeyRef (forces fetchEvents to re-execute)
  // Then triggers a full re-fetch so users see updated data without manual refresh.
  // ========================================================================
  useEffect(() => {
    let unsubscribe;

    subscribeToSyncUpdates(() => {
      // Invalidate Zustand query cache
      const store = useEventsStore.getState();
      store.invalidateQueryCache?.();

      // Invalidate IndexedDB persistent cache + TTL marker
      clearIdbTimestamp();
      eventsDB.clear().catch(() => {/* non-fatal */});

      // Reset lastFetchKey so the fetch effect re-executes
      lastFetchKeyRef.current = null;

      // Re-fetch with current filters
      fetchEvents(filtersRef.current);
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch(() => {
      // Graceful fallback — sync subscription not critical for basic operation
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchEvents]);

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
      // BEP v2.3.0: Invalidate ALL cache layers before re-fetching
      // 1. Legacy localStorage cache (eventsCache.js)
      await refreshEventsCache(newsSource);
      // 2. Zustand query cache (in-memory)
      const store = useEventsStore.getState();
      store.invalidateQueryCache?.();
      // 3. IndexedDB persistent cache + TTL marker
      clearIdbTimestamp();
      await eventsDB.clear().catch(() => {/* non-fatal */});
      // 4. Reset lastFetchKey to force re-execute
      lastFetchKeyRef.current = null;
      // 5. Re-fetch from Firestore
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
