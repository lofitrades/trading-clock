/**
 * src/hooks/useClockEventsData.js
 *
 * Purpose: Lightweight data hook for clock event markers with adaptive storage strategy
 * Reuses provided events when available, otherwise fetches today's events via storage adapter
 * (Zustand cache → IndexedDB → Batcher → Firestore) with filter awareness
 * 
 * Filter Sync: Re-fetches when eventFilters (impacts, currencies) change in SettingsContext,
 * ensuring clock canvas reflects user filter preferences. Also subscribes to Zustand store
 * for real-time updates without redundant Firestore queries.
 *
 * Storage Strategy:
 * 1. Zustand query cache (0-5ms, 5-min TTL) - single source of truth
 * 2. IndexedDB (50-100ms, O(log N) indexed queries) - persistent structured cache
 * 3. Query Batcher (100-150ms) - merges overlapping Firestore requests
 * 4. Firestore (150-300ms) - authoritative source
 * All results written back through all layers for future hits
 *
 * Changelog:
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
import { sortEventsByTime } from '../utils/newsApi';
import { getEventEpochMs } from '../utils/eventTimeEngine';

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
 * Build date range from stable dayKey string
 * dayKey is already timezone-aware (computed via buildDayKey with user's timezone)
 * Returns Date objects for the start/end of that day + the date string for comparison
 */
const buildRangeFromDayKey = (dayKey) => {
  const start = new Date(`${dayKey}T00:00:00`);
  const end = new Date(`${dayKey}T23:59:59.999`);
  return { start, end, dateStr: dayKey };
};

const normalizeImpactValue = (impact) => {
  if (!impact) return 'Data Not Loaded';

  const value = String(impact).toLowerCase();

  if (value.includes('strong') || value.includes('high') || value.includes('!!!')) {
    return 'Strong Data';
  }
  if (value.includes('moderate') || value.includes('medium') || value.includes('!!')) {
    return 'Moderate Data';
  }
  if (value.includes('weak') || value.includes('low') || value.includes('!')) {
    return 'Weak Data';
  }
  if (value.includes('non-eco') || value.includes('non-economic') || value.includes('none')) {
    return 'Non-Economic';
  }

  return 'Data Not Loaded';
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
  // Use dayKey as dependency to only recompute when day actually changes
  const { start: todayStart, end: todayEnd } = useMemo(
    () => buildRangeFromDayKey(dayKey),
    [dayKey]
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
  // ========================================================================
  if (Array.isArray(providedEvents)) {
    const mergedEvents = useMemo(() => {
      return sortEventsByTime([...providedEvents]);
    }, [providedEvents]);

    return { events: mergedEvents, loading: false, dataKey, requestKey: filterKey };
  }

  // ========================================================================
  // STRATEGY 2: Use adaptive storage adapter for today's events
  // ========================================================================
  const {
    events: adapterEvents,
    loading: adapterLoading,
  } = useEventsAdapter(todayStart, todayEnd, {
    currency: eventFilters?.currencies?.[0],
    impact: eventFilters?.impacts?.[0],
    source: newsSource,
    enrich: false,
  });

  // ========================================================================
  // STRATEGY 3: Subscribe to Zustand store for real-time updates
  // Real-time subscription (no re-fetch needed when store changes)
  // ========================================================================
  // Use stable selectors to avoid infinite render loops
  // (Zustand selectors must return stable references)
  const eventsById = useEventsStore((state) => state.eventsById);
  const eventIds = useEventsStore((state) => state.eventIds);
  
  // Memoize the filtered events to prevent re-computation on every render
  // CRITICAL: Use dayKey (stable string) instead of Date objects to avoid
  // re-renders when nowEpochMs changes within the same day
  // dayKey already includes timezone info (e.g., "2026-01-29" for user's timezone)
  const storeEvents = useMemo(() => {
    if (!eventIds?.length || !eventsById) return [];
    
    // Build date range from dayKey (includes timezone context)
    const { start, end, dateStr } = buildRangeFromDayKey(dayKey);
    const startTs = start.getTime();
    const endTs = end.getTime();
    const impactFilter = eventFilters?.impacts || [];
    const currencyFilter = eventFilters?.currencies || [];
    
    return eventIds
      .map((id) => eventsById[id])
      .filter((event) => {
        if (!event) return false;
        
        // Date filter - use both timestamp and date string matching
        // This handles events stored with different timezone formats
        const eventDate = event.date?.toDate?.() || new Date(event.date);
        const eventTs = eventDate.getTime();
        
        // Primary: timestamp range check
        const inRange = eventTs >= startTs && eventTs <= endTs;
        
        // Secondary: date string match (for events with date-only storage)
        const eventDateStr = event.dateStr || eventDate.toISOString().split('T')[0];
        const dateMatch = eventDateStr === dateStr;
        
        if (!inRange && !dateMatch) return false;
        
        // Impact filter
        if (impactFilter.length > 0 && !impactFilter.includes(event.impact)) return false;
        // Currency filter
        if (currencyFilter.length > 0 && !currencyFilter.includes(event.currency)) return false;
        return true;
      });
  }, [eventIds, eventsById, dayKey, eventFilters?.impacts, eventFilters?.currencies]);

  // Prefer Zustand store (real-time) over adapter (initial fetch) when both available
  const economicEvents = storeEvents.length > 0 ? storeEvents : adapterEvents;

  const eventKey = (evt) => {
    const epoch = getEventEpochMs(evt);
    return evt.id || evt.Event_ID || `${evt.title || evt.name || evt.Name || 'event'}-${epoch ?? 'na'}`;
  };

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

  const mergedEvents = useMemo(() => {
    const existingKeys = new Set((economicEvents || []).map(eventKey));
    const dedupedCustom = customFiltered.filter((evt) => !existingKeys.has(eventKey(evt)));
    return sortEventsByTime([...(economicEvents || []), ...dedupedCustom]);
  }, [economicEvents, customFiltered]);

  // Subscribe to custom events for real-time updates
  // Use dayKey instead of nowEpochMs to avoid re-subscribing on every tick
  useEffect(() => {
    if (!user) return undefined;

    // Build date range from stable dayKey
    const { start, end } = buildRangeFromDayKey(dayKey);

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
  }, [dayKey, user]);

  useEffect(() => {
    setDataKey(filterKey);
  }, [filterKey]);

  return { events: mergedEvents, loading: adapterLoading, dataKey, requestKey: filterKey };
}

export default useClockEventsData;