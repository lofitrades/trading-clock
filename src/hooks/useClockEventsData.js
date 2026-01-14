/**
 * src/hooks/useClockEventsData.js
 *
 * Purpose: Lightweight data hook for clock event markers. Reuses already-provided
 * event lists when available, otherwise fetches today's events for the active
 * timezone/news source with filter awareness. Keeps data concerns out of the
 * overlay UI and exposes a simple loading + events API for reuse.
 * 
 * Filter Sync: This hook automatically re-fetches when eventFilters (impacts, currencies)
 * change in SettingsContext, ensuring the clock canvas reflects user filter preferences
 * set on the /calendar page.
 *
 * Changelog:
 * v1.2.1 - 2026-01-13 - CRITICAL FIX: Removed nowEpochMs from effect deps to prevent infinite re-fetch loop causing LoadingScreen blink; dayKey handles day rollover correctly.
 * v1.2.0 - 2026-01-13 - Ensure filter changes from SettingsContext trigger re-fetch; added favoritesOnly filtering; improved filterKey stability.
 * v1.1.0 - 2026-01-08 - Refreshes automatically on timezone-based day rollover using caller-provided nowEpochMs.
 * v1.0.0 - 2026-01-07 - Initial extraction from ClockEventsOverlay for data/UI separation and reuse.
 */

import { useEffect, useMemo, useState } from 'react';
import { getEventsByDateRange } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';

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

const buildTodayRange = (timezone, nowEpochMs) => {
  const dateStr = buildDayKey(timezone, nowEpochMs);
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);

  return { start, end };
};

export function useClockEventsData({
  events: providedEvents = null,
  timezone,
  eventFilters,
  newsSource,
  nowEpochMs = Date.now(),
}) {
  const [events, setEvents] = useState(() => (Array.isArray(providedEvents) ? providedEvents : []));
  const [loading, setLoading] = useState(!providedEvents);

  const dayKey = useMemo(() => buildDayKey(timezone, nowEpochMs), [timezone, nowEpochMs]);

  // Serialize filter arrays for stable comparison (sort to ensure order-independent matching)
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

  const filterKey = useMemo(
    () => [timezone || 'na', newsSource || 'na', impactsKey, eventTypesKey, currenciesKey, dayKey].join('::'),
    [timezone, newsSource, impactsKey, eventTypesKey, currenciesKey, dayKey],
  );

  useEffect(() => {
    if (providedEvents) {
      setEvents(providedEvents);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        // Use dayKey-based range (already incorporates timezone-aware current day)
        const { start, end } = buildTodayRange(timezone, Date.now());
        const result = await getEventsByDateRange(start, end, {
          source: newsSource,
          impacts: eventFilters?.impacts || [],
          eventTypes: eventFilters?.eventTypes || [],
          currencies: eventFilters?.currencies || [],
        });

        if (cancelled) return;

        if (result.success) {
          const withDates = (result.data || []).filter((evt) => evt.date || evt.dateTime || evt.Date);
          setEvents(sortEventsByTime(withDates));
        } else {
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // filterKey captures all filter state changes including dayKey for day rollover
    // CRITICAL: Do NOT include nowEpochMs here - it changes every second and would cause infinite re-fetches
  }, [filterKey, providedEvents, timezone, newsSource, eventFilters?.impacts, eventFilters?.eventTypes, eventFilters?.currencies]);

  return { events, loading };
}

export default useClockEventsData;