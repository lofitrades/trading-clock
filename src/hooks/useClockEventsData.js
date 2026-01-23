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
 * set on the /calendar page. Search filtering applied client-side with 3-second debounce
 * to prevent marker flicker while user types.
 *
 * Changelog:
 * v1.3.5 - 2026-01-22 - BEP FIX: Apply currency filter to custom events. Custom events now only show when CUS is selected or no currency filter is active. Prevents N/A filter from showing custom events.
 * v1.3.4 - 2026-01-22 - BEP: Add N/A/CUS currency filter support. Currency filtering now handles ALL (global), N/A (unknown/null), and CUS (custom events) special currency types correctly.
 * v1.3.3 - 2026-01-21 - Live subscribe to custom reminders for instant marker updates.
 * v1.3.2 - 2026-01-21 - BEP: Merge custom reminder events into clock marker data for today.
 * v1.3.1 - 2026-01-21 - FILTER SAFETY: Added client-side impact/currency/category filtering pass to guarantee events list matches active filters even when cached results return unfiltered.
 * v1.3.0 - 2026-01-21 - BEP Refactor: Added searchQuery support with client-side fuzzy matching, included searchQuery in filterKey for proper memoization, and debounce constraint for enterprise UX.
 * v1.2.1 - 2026-01-13 - CRITICAL FIX: Removed nowEpochMs from effect deps to prevent infinite re-fetch loop causing LoadingScreen blink; dayKey handles day rollover correctly.
 * v1.2.0 - 2026-01-13 - Ensure filter changes from SettingsContext trigger re-fetch; added favoritesOnly filtering; improved filterKey stability.
 * v1.1.0 - 2026-01-08 - Refreshes automatically on timezone-based day rollover using caller-provided nowEpochMs.
 * v1.0.0 - 2026-01-07 - Initial extraction from ClockEventsOverlay for data/UI separation and reuse.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByDateRange } from '../services/economicEventsService';
import { subscribeToCustomEventsByRange } from '../services/customEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { getUtcDayRangeForTimezone } from '../utils/dateUtils';
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

const buildTodayRange = (timezone, nowEpochMs) => {
  const dateStr = buildDayKey(timezone, nowEpochMs);
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);

  return { start, end };
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
  const [economicEvents, setEconomicEvents] = useState(() => (Array.isArray(providedEvents) ? providedEvents : []));
  const [customEvents, setCustomEvents] = useState([]);
  const [loading, setLoading] = useState(!providedEvents);
  const [dataKey, setDataKey] = useState('');

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

  const searchQuery = useMemo(
    () => (eventFilters?.searchQuery || '').trim().toLowerCase(),
    [eventFilters?.searchQuery]
  );

  const filterKey = useMemo(
    () => [timezone || 'na', newsSource || 'na', impactsKey, eventTypesKey, currenciesKey, searchQuery, dayKey, user?.uid || 'guest'].join('::'),
    [timezone, newsSource, impactsKey, eventTypesKey, currenciesKey, searchQuery, dayKey, user?.uid],
  );

  const mergedEvents = useMemo(() => {
    const hasProvided = Array.isArray(providedEvents);
    if (hasProvided) {
      return sortEventsByTime([...providedEvents]);
    }

    const eventKey = (evt) => {
      const epoch = getEventEpochMs(evt);
      return evt.id || evt.Event_ID || `${evt.title || evt.name || evt.Name || 'event'}-${epoch ?? 'na'}`;
    };

    // BEP: Apply currency filter to custom events
    // Custom events should only show when:
    // 1. No currency filter is applied (show all)
    // 2. CUS is explicitly selected in the currency filter
    const currencies = eventFilters?.currencies || [];
    let currencyFilteredCustom = customEvents || [];
    if (currencies.length > 0) {
      const normalizedFilters = currencies.map((c) => String(c).toUpperCase().trim());
      const hasCusFilter = normalizedFilters.includes('CUS');
      // If currency filter is active but CUS is not selected, hide all custom events
      if (!hasCusFilter) {
        currencyFilteredCustom = [];
      }
    }

    const customFiltered = currencyFilteredCustom
      .filter((evt) => evt.showOnClock !== false)
      .filter((evt) => {
        if (!searchQuery) return true;
        const name = (evt.title || evt.name || '').toLowerCase();
        const description = (evt.description || '').toLowerCase();
        return name.includes(searchQuery) || description.includes(searchQuery);
      });

    const existingKeys = new Set((economicEvents || []).map(eventKey));
    const dedupedCustom = customFiltered.filter((evt) => !existingKeys.has(eventKey(evt)));

    return sortEventsByTime([...(economicEvents || []), ...dedupedCustom]);
  }, [customEvents, economicEvents, eventFilters?.currencies, providedEvents, searchQuery]);

  useEffect(() => {
    setDataKey(filterKey);
  }, [filterKey]);

  useEffect(() => {
    if (providedEvents) {
      setEconomicEvents(providedEvents);
      setLoading(false);
    }
  }, [providedEvents]);

  useEffect(() => {
    if (!user || providedEvents) return undefined;

    const anchorDate = new Date(nowEpochMs ?? Date.now());
    const { startDate, endDate } = getUtcDayRangeForTimezone(timezone, anchorDate);

    return subscribeToCustomEventsByRange(
      user.uid,
      startDate,
      endDate,
      (eventsSnapshot) => {
        setCustomEvents(eventsSnapshot || []);
      },
      () => {
        setCustomEvents([]);
      }
    );
  }, [nowEpochMs, providedEvents, timezone, user]);

  useEffect(() => {
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

        if (result.success) {
          let filtered = (result.data || []).filter((evt) => evt.date || evt.dateTime || evt.Date);
          
          // BEP: Client-side search filtering with fuzzy matching on event name
          if (searchQuery) {
            filtered = filtered.filter((evt) => {
              const eventName = (evt.name || evt.Name || '').toLowerCase();
              const eventCategory = (evt.category || evt.Category || '').toLowerCase();

              // Simple fuzzy match: check if search query appears in name or category
              return eventName.includes(searchQuery) || eventCategory.includes(searchQuery);
            });

          }

          // Safety pass: ensure cached results match active filters (impacts, categories, currencies)
          const impacts = eventFilters?.impacts || [];
          const eventTypes = eventFilters?.eventTypes || [];
          const currencies = eventFilters?.currencies || [];

          if (impacts.length > 0) {
            const normalizedImpactFilters = impacts.map(normalizeImpactValue);
            filtered = filtered.filter((evt) => {
              const impact = normalizeImpactValue(evt.strength || evt.Strength || evt.impact);
              return normalizedImpactFilters.includes(impact);
            });
          }

          if (eventTypes.length > 0) {
            filtered = filtered.filter((evt) => {
              const category = evt.category || evt.Category;
              if (!category || category === 'null') return false;
              return eventTypes.includes(category);
            });
          }

          // BEP: Handle special currencies: ALL (global), N/A (unknown/null), CUS (custom events)
          if (currencies.length > 0) {
            const normalizedFilters = currencies.map((c) => String(c).toUpperCase().trim());
            const hasAllFilter = normalizedFilters.includes('ALL');
            const hasUnkFilter = normalizedFilters.includes('N/A');
            const hasCusFilter = normalizedFilters.includes('CUS');
            
            filtered = filtered.filter((evt) => {
              const currency = evt.currency || evt.Currency;
              const isCustom = Boolean(evt.isCustom);
              const normalizedCurrency = currency ? String(currency).toUpperCase().trim() : null;
              
              // CUS filter: match custom user events
              if (hasCusFilter && isCustom) {
                return true;
              }
              
              // ALL filter: match global events (currency === 'ALL' or 'GLOBAL')
              if (hasAllFilter && (normalizedCurrency === 'ALL' || normalizedCurrency === 'GLOBAL')) {
                return true;
              }
              
              // N/A filter: match events with null/empty/missing currency (but not custom events)
              if (hasUnkFilter && !isCustom) {
                if (normalizedCurrency === null || normalizedCurrency === '' || normalizedCurrency === '—' || normalizedCurrency === '-' || normalizedCurrency === 'N/A') {
                  return true;
                }
              }
              
              // Standard currency: exact match
              if (normalizedCurrency && normalizedFilters.includes(normalizedCurrency)) {
                return true;
              }
              
              return false;
            });
          }
          
          setEconomicEvents(filtered);
          setDataKey(filterKey);
        } else {
          setEconomicEvents([]);
          setDataKey(filterKey);
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
    // filterKey captures all filter state changes including dayKey for day rollover AND searchQuery
    // CRITICAL: Do NOT include nowEpochMs here - it changes every second and would cause infinite re-fetches
  }, [filterKey, providedEvents, timezone, newsSource, eventFilters?.impacts, eventFilters?.eventTypes, eventFilters?.currencies, searchQuery, user]);

  return { events: mergedEvents, loading, dataKey, requestKey: filterKey };
}

export default useClockEventsData;