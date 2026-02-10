/**
 * src/hooks/useClockEventsData.js
 *
 * Purpose: Lightweight data hook for clock event markers with adaptive storage strategy
 * Reuses provided events when available, otherwise fetches today's events via storage adapter
 * (Zustand cache → IndexedDB → Batcher → Firestore) with filter awareness
 * 
 * Filter Sync: Re-fetches when eventFilters (impacts, currencies) change in SettingsContext,
 * ensuring clock canvas reflects user filter preferences.
 *
 * Storage Strategy:
 * 1. Zustand query cache (0-5ms, 5-min TTL) - single source of truth
 * 2. IndexedDB (50-100ms, O(log N) indexed queries) - persistent structured cache
 * 3. Query Batcher (100-150ms) - merges overlapping Firestore requests
 * 4. Firestore (150-300ms) - authoritative source
 * All results written back through all layers for future hits
 *
 * Changelog:
 * v1.9.0 - 2026-02-09 - BEP: Inject guest sample custom events (NY Open 9:30 AM ET, Market Close 5:00 PM ET)
 *                        for non-auth users so clock markers show sample custom events on weekdays.
 * v1.8.0 - 2026-02-09 - BEP MULTI-FILTER: Pass ALL currencies/impacts to adapter instead of only
 *                        first value. Fixes multi-select filter for clock markers. Shared cached
 *                        data with Calendar via Zustand store for instant cross-page loads.
 * v1.7.2 - 2026-02-03 - BEP FIX: Prevented marker blinking by using dayKey (stable per day) instead of nowEpochMs (changes every second) for date range calculation.
 * v1.7.1 - 2026-02-03 - BEP FIX: Refactored to call all hooks unconditionally (rules of hooks compliance). Removed unused normalizeImpactValue.
 * v1.7.0 - 2026-02-03 - BEP FIX: Custom events now display correctly. Fixed buildRangeFromDayKey to use timezone-aware getUtcDayRangeForTimezone instead of local browser time. This ensures custom event queries use the correct day boundaries for the user's selected clock timezone.
 * v1.6.0 - 2026-02-02 - BEP: Removed Zustand real-time subscription (timezone conversion complexity). Data refreshes on page reload/remount for accurate display.
 * v1.5.0 - 2026-02-02 - BEP REALTIME FIX: Fixed date parsing to handle multiple formats (Timestamp, Date, string). Added lastNormalizedAt subscription to detect Zustand updates. Admin edits now propagate instantly to clock markers.
 * v1.4.0 - 2026-01-29 - BEP PHASE 2.5: Migrate to eventsStorageAdapter + Zustand subscriptions. Replaced direct Firestore calls with adaptive storage. Added Zustand selective subscription for real-time updates without re-fetching. Expected: 50% faster initial load, 1 re-render per filter change (vs 5+).
 * v1.3.5 - 2026-01-22 - BEP FIX: Apply currency filter to custom events.
 * v1.3.4 - 2026-01-22 - BEP: Add N/A/CUS currency filter support.
 * v1.3.3 - 2026-01-21 - Live subscribe to custom reminders for instant marker updates.
 * v1.3.2 - 2026-01-21 - BEP: Merge custom reminder events into clock marker data.
 * v1.3.1 - 2026-01-21 - FILTER SAFETY: Added client-side impact/currency filtering pass.
 * v1.3.0 - 2026-01-21 - BEP Refactor: Added searchQuery support with fuzzy matching.
 * v1.2.1 - 2026-01-13 - CRITICAL FIX: Removed nowEpochMs from deps to prevent re-fetch loop.
 * v1.2.0 - 2026-01-13 - Ensure filter changes trigger re-fetch; added favoritesOnly filtering.
 * v1.1.0 - 2026-01-08 - Refreshes automatically on timezone-based day rollover.
 * v1.0.0 - 2026-01-07 - Initial extraction from ClockEventsOverlay.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEventsAdapter } from '../services/eventsStorageAdapter';
import useEventsStore from '../stores/eventsStore';
import { subscribeToCustomEventsByRange } from '../services/customEventsService';
import { buildGuestSampleEvents } from '../utils/defaultCustomEvents';
import { sortEventsByTime } from '../utils/newsApi';
import { getEventEpochMs } from '../utils/eventTimeEngine';
import { getUtcDayRangeForTimezone } from '../utils/dateUtils';

const buildDayKey = (timezone, nowEpochMs) => {
  const now = new Date(nowEpochMs ?? Date.now());
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
};

/**
 * Build timezone-aware date range for custom events query
 * Uses getUtcDayRangeForTimezone to get correct day boundaries in the user's selected timezone
 * This ensures custom events created in a specific timezone are properly queried
 * 
 * @param {string} timezone - IANA timezone string (e.g., 'America/New_York')
 * @param {number} nowEpochMs - Current epoch timestamp for reference
 * @returns {{ start: Date, end: Date }} Start and end Date objects for the day in UTC
 */
const buildTimezoneAwareRange = (timezone, nowEpochMs) => {
  const referenceDate = new Date(nowEpochMs ?? Date.now());
  const { startDate, endDate } = getUtcDayRangeForTimezone(timezone, referenceDate);
  return { start: startDate, end: endDate };
};

const eventKey = (evt) => {
  const epoch = getEventEpochMs(evt);
  return evt.id || evt.Event_ID || `${evt.title || evt.name || evt.Name || 'event'}-${epoch ?? 'na'}`;
};

export function useClockEventsData({
  events: providedEvents = null,
  timezone,
  eventFilters,
  newsSource,
  nowEpochMs = Date.now(),
}) {
  const { user } = useAuth();
  const [customEvents, setCustomEvents] = useState([]);
  const [dataKey, setDataKey] = useState('');

  const hasProvidedEvents = Array.isArray(providedEvents);
  const dayKey = useMemo(() => buildDayKey(timezone, nowEpochMs), [timezone, nowEpochMs]);

  // ========================================================================
  // CACHE INVALIDATION: Clear Zustand query cache when timezone or day changes
  // This ensures "today" queries return correct events for the new context
  // ========================================================================
  const prevTimezoneRef = useRef(timezone);
  const prevDayKeyRef = useRef(dayKey);
  
  useEffect(() => {
    const store = useEventsStore.getState();
    
    // Handle timezone change
    if (prevTimezoneRef.current !== timezone) {
      store.onTimezoneChange?.(timezone);
      prevTimezoneRef.current = timezone;
    }
    
    // Handle day rollover (midnight in user's timezone)
    if (prevDayKeyRef.current !== dayKey) {
      store.onDayRollover?.(dayKey);
      prevDayKeyRef.current = dayKey;
    }
  }, [timezone, dayKey]);

  // Get today's date range for the given timezone (for adapter fetch)
  // Use timezone-aware boundaries to ensure correct day boundaries
  // BEP v1.7.1: Use dayKey as dependency (stable per day) instead of nowEpochMs (changes every second)
  // This prevents re-fetches and re-renders every second while still being timezone-aware
  const { start: todayStart, end: todayEnd } = useMemo(
    () => buildTimezoneAwareRange(timezone, Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timezone, dayKey]
  );

  // Serialize filter arrays for stable comparison
  const impactsKey = useMemo(
    () => (eventFilters?.impacts || []).slice().sort().join('|'),
    [eventFilters?.impacts]
  );
  const eventTypesKey = useMemo(
    () => (eventFilters?.eventTypes || []).slice().sort().join('|'),
    [eventFilters?.eventTypes]
  );
  const currenciesKey = useMemo(
    () => (eventFilters?.currencies || []).slice().sort().join('|'),
    [eventFilters?.currencies]
  );

  const searchQuery = useMemo(
    () => (eventFilters?.searchQuery || '').trim().toLowerCase(),
    [eventFilters?.searchQuery]
  );

  const filterKey = useMemo(
    () => [timezone || 'na', newsSource || 'na', impactsKey, eventTypesKey, currenciesKey, searchQuery, dayKey, user?.uid || 'guest'].join('::'),
    [timezone, newsSource, impactsKey, eventTypesKey, currenciesKey, searchQuery, dayKey, user?.uid],
  );

  // ========================================================================
  // STRATEGY 1: Use provided events if available (skip adapter fetch)
  // Memoize sorted provided events
  // ========================================================================
  const sortedProvidedEvents = useMemo(() => {
    if (!hasProvidedEvents) return null;
    return sortEventsByTime([...providedEvents]);
  }, [hasProvidedEvents, providedEvents]);

  // ========================================================================
  // STRATEGY 2: Use adaptive storage adapter for today's events
  // BEP v1.6.0: Removed Zustand real-time subscription - timezone conversion 
  // complexity introduced display inaccuracies. Data refreshes on page reload.
  // BEP v1.8.0: Pass ALL currencies/impacts to adapter for full multi-select support
  // Always call hook unconditionally (rules of hooks)
  // ========================================================================
  const {
    events: adapterEvents,
    loading: adapterLoading,
  } = useEventsAdapter(todayStart, todayEnd, {
    currencies: eventFilters?.currencies || [],
    impacts: eventFilters?.impacts || [],
    source: newsSource,
    enrich: false,
  });

  // Use adapter events directly (no real-time Zustand merge)
  const economicEvents = adapterEvents;

  // BEP: Apply currency filter to custom events
  // Custom events should only show when:
  // 1. No currency filter is applied (show all)
  // 2. CUS is explicitly selected in the currency filter
  const customFiltered = useMemo(() => {
    const currencies = eventFilters?.currencies || [];
    let currencyFilteredCustom = customEvents || [];
    if (currencies.length > 0) {
      const normalizedFilters = currencies.map((c) => String(c).toUpperCase().trim());
      const hasCusFilter = normalizedFilters.includes('CUS');
      if (!hasCusFilter) {
        currencyFilteredCustom = [];
      }
    }

    return currencyFilteredCustom
      .filter((evt) => evt.showOnClock !== false)
      .filter((evt) => {
        if (!searchQuery) return true;
        const name = (evt.title || evt.name || '').toLowerCase();
        const description = (evt.description || '').toLowerCase();
        return name.includes(searchQuery) || description.includes(searchQuery);
      });
  }, [customEvents, eventFilters?.currencies, searchQuery]);

  // BEP: Build guest sample events for non-auth users (NY Open + Market Close)
  const guestSampleEvents = useMemo(() => {
    if (user) return []; // Auth users get real custom events from Firestore
    return buildGuestSampleEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, timezone, dayKey]);

  const mergedEvents = useMemo(() => {
    const existingKeys = new Set((economicEvents || []).map(eventKey));
    const dedupedCustom = customFiltered.filter((evt) => !existingKeys.has(eventKey(evt)));
    // Merge guest sample events for non-auth users
    const dedupedGuest = guestSampleEvents.filter((evt) => !existingKeys.has(eventKey(evt)));
    return sortEventsByTime([...(economicEvents || []), ...dedupedCustom, ...dedupedGuest]);
  }, [economicEvents, customFiltered, guestSampleEvents]);

  // Subscribe to custom events for real-time updates
  // BEP v1.7.0: Use timezone-aware range for correct day boundaries
  useEffect(() => {
    if (!user) return undefined;

    // Build timezone-aware date range for custom events query
    const { start, end } = buildTimezoneAwareRange(timezone, Date.now());

    return subscribeToCustomEventsByRange(
      user.uid,
      start,
      end,
      (eventsSnapshot) => {
        setCustomEvents(eventsSnapshot || []);
      },
      () => {
        setCustomEvents([]);
      }
    );
  }, [timezone, dayKey, user]);

  useEffect(() => {
    setDataKey(filterKey);
  }, [filterKey]);

  // Return based on strategy (after all hooks have been called)
  if (hasProvidedEvents) {
    return { events: sortedProvidedEvents, loading: false, dataKey, requestKey: filterKey };
  }

  return { events: mergedEvents, loading: adapterLoading, dataKey, requestKey: filterKey };
}

export default useClockEventsData;