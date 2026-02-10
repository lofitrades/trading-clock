/**
 * src/services/eventsStorageAdapter.js
 *
 * Purpose: Unified adapter coordinating multiple storage layers
 * Implements adaptive storage strategy: IndexedDB → Query Batcher → Firestore → Zustand
 * Single entry point for all event data fetching with intelligent caching and batching
 *
 * Architecture:
 * - Layer 1: Zustand query cache (0-5ms, 5-min TTL)
 * - Layer 2: IndexedDB storage (50-100ms, O(log N) indexed queries)
 * - Layer 3: Query Batcher (100-150ms, merges overlapping requests)
 * - Layer 4: Firestore fallback (150-300ms, direct source)
 * - All results: Update IndexedDB + Zustand store for future hits
 *
 * Changelog:
 * v1.1.0 - 2026-02-09 - BEP MULTI-FILTER: Accept currencies[] and impacts[] arrays instead of
 *                        single currency/impact. Apply all filter values in client-side filtering.
 *                        Cache key now includes sorted arrays for proper deduplication.
 *                        Fetch from Firestore uses date range only (no server-side filter),
 *                        then client-side filter for full multi-select support.
 * v1.0.0 - 2026-01-29 - BEP PHASE 2.5: Initial storage adapter with layered caching strategy
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import useEventsStore from '@/stores/eventsStore';
import { queryBatcher } from '@/services/queryBatcher';
import eventsDB from '@/services/eventsDB';

/**
 * Fetch events with adaptive storage strategy
 * Tries multiple layers in order: Zustand cache → IndexedDB → Batcher → Firestore
 *
 * @param {Date|string} startDate - Start of date range (YYYY-MM-DD or Date object)
 * @param {Date|string} endDate - End of date range (YYYY-MM-DD or Date object)
 * @param {Object} options - { currency, impact, source, enrich, skipCache }
 * @returns {Promise<Array>} Array of event objects
 *
 * @example
 * const events = await fetchEventsWithAdaptiveStorage(
 *   '2026-01-29',
 *   '2026-02-05',
 *   { currency: 'USD', impact: 'high' }
 * );
 */
export const fetchEventsWithAdaptiveStorage = async (
  startDate,
  endDate,
  options = {}
) => {
  const {
    // BEP v1.1.0: Accept both array and single-value forms for backwards compatibility
    currencies,
    currency,
    impacts,
    impact,
    source,
    enrich = false,
    skipCache = false,
  } = options;

  // BEP v1.1.0: Normalize to arrays for consistent handling
  const currencyList = currencies || (currency ? [currency] : []);
  const impactList = impacts || (impact ? [impact] : []);

  const store = useEventsStore.getState();

  // Normalize dates to ISO strings
  const startStr = typeof startDate === 'string'
    ? startDate
    : startDate instanceof Date
      ? startDate.toISOString().split('T')[0]
      : startDate;

  const endStr = typeof endDate === 'string'
    ? endDate
    : endDate instanceof Date
      ? endDate.toISOString().split('T')[0]
      : endDate;

  // BEP v1.1.0: Cache key includes sorted arrays for proper deduplication
  const cacheKey = skipCache
    ? null
    : JSON.stringify({
        type: 'adaptive',
        startStr,
        endStr,
        currencies: [...currencyList].sort(),
        impacts: [...impactList].sort(),
        source,
      });

  // ========================================================================
  // BEP v1.1.0: Client-side multi-filter helper
  // Applied after each cache layer to support full multi-select filtering
  // ========================================================================
  const applyClientFilters = (events) => {
    let filtered = events;
    if (currencyList.length > 0) {
      const set = new Set(currencyList.map((c) => String(c).toUpperCase().trim()));
      filtered = filtered.filter((e) => {
        const cur = (e.currency || e.Currency || '').toUpperCase().trim();
        // Always include global events (no currency)
        if (!cur || cur === 'ALL' || cur === 'GLOBAL') return true;
        return set.has(cur);
      });
    }
    if (impactList.length > 0) {
      const set = new Set(impactList.map((i) => String(i).toLowerCase().trim()));
      filtered = filtered.filter((e) => {
        const imp = (e.impact || e.strength || e.Strength || '').toLowerCase().trim();
        return set.has(imp);
      });
    }
    return filtered;
  };

  // ========================================================================
  // LAYER 1: Zustand Query Cache (fastest, 5-min TTL)
  // ========================================================================
  if (cacheKey && !skipCache) {
    const cached = store.queryCache.get?.(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // Cache hit! Return immediately
      const cachedEvents = store.getEventsByIds?.(cached.ids);
      if (cachedEvents?.length > 0) {
        return cachedEvents;
      }
    }
  }

  try {
    // ========================================================================
    // LAYER 2: IndexedDB (fast, no serialization, O(log N) queries)
    // BEP v1.1.0: Fetch full date range from IDB, then apply multi-filters client-side
    // ========================================================================
    if (eventsDB.isSupported()) {
      try {
        const idbEvents = await eventsDB.getEventsByDateRange(startStr, endStr);

        if (idbEvents.length > 0) {
          // BEP v1.1.0: Apply all filters client-side for full multi-select support
          const filtered = applyClientFilters(idbEvents);

          if (filtered.length > 0) {
            // Cache found! Update Zustand store
            store.addEvents?.(idbEvents, { source: 'indexeddb' });
            return filtered;
          }
        }
      } catch (error) {
        console.warn('IndexedDB fetch failed, falling back to Firestore:', error);
        // Fall through to Layer 3
      }
    }

    // ========================================================================
    // LAYER 3: Query Batcher (merges overlapping Firestore requests)
    // BEP v1.1.0: Fetch full date range, client-side filter for multi-select
    // ========================================================================
    const batchResults = await queryBatcher.fetch({
      startDate: new Date(startStr),
      endDate: new Date(endStr),
      currencies: currencyList,
      impacts: impactList,
      source,
      enrich,
    });

    // BEP v1.1.0: Apply client-side multi-filters
    const filtered = applyClientFilters(batchResults);

    // ========================================================================
    // LAYER 4: Write to IndexedDB for next time (persistent cache)
    // ========================================================================
    if (eventsDB.isSupported() && batchResults.length > 0) {
      try {
        await eventsDB.addEvents(batchResults, { skipValidation: true });
      } catch (error) {
        console.warn('Failed to cache to IndexedDB:', error);
        // Non-fatal, continue
      }
    }

    // ========================================================================
    // LAYER 5: Update Zustand store (single source of truth)
    // BEP v1.1.0: Store full (unfiltered) results for broader cache coverage,
    // then cache the filtered IDs for this specific query
    // ========================================================================
    if (store.addEvents && batchResults.length > 0) {
      store.addEvents(batchResults, { source: 'firestore' });
    }
    // Cache filtered result IDs for this exact query key
    if (cacheKey && filtered.length > 0) {
      const filteredIds = filtered.map((e) => e.id).filter(Boolean);
      store.queryCache.set(cacheKey, {
        ids: filteredIds,
        timestamp: Date.now(),
      });
    }

    return filtered;
  } catch (error) {
    console.error('Failed to fetch events with adaptive storage:', error);
    throw error;
  }
};

/**
 * React hook wrapper for fetchEventsWithAdaptiveStorage
 * Handles loading/error state and automatic fetching
 *
 * @param {Date|string} startDate - Start of date range
 * @param {Date|string} endDate - End of date range
 * @param {Object} options - { currency, impact, source, enrich, skipCache }
 * @returns {Object} { events, loading, error, refetch }
 *
 * @example
 * const { events, loading, error } = useEventsAdapter(
 *   '2026-01-29',
 *   '2026-02-05',
 *   { currency: 'USD' }
 * );
 */
export const useEventsAdapter = (startDate, endDate, options = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BEP v1.1.0: Stable serialization that handles both arrays and single values
  const optionsKey = useMemo(
    () => JSON.stringify({
      currencies: options.currencies || (options.currency ? [options.currency] : []),
      impacts: options.impacts || (options.impact ? [options.impact] : []),
      source: options.source,
      enrich: options.enrich,
    }),
    [options.currencies, options.currency, options.impacts, options.impact, options.source, options.enrich]
  );

  // Refetch function for manual updates
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await fetchEventsWithAdaptiveStorage(startDate, endDate, {
        ...options,
        skipCache: true,
      });
      setEvents(results);
    } catch (err) {
      setError(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, options]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchEventsWithAdaptiveStorage(startDate, endDate, options)
      .then(setEvents)
      .catch((err) => {
        setError(err);
        setEvents([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, optionsKey]);

  return { events, loading, error, refetch };
};

/**
 * Batch fetch multiple date ranges (useful for prefetching)
 * Automatically batches requests if they overlap
 *
 * @param {Array<Object>} queries - Array of { startDate, endDate, options }
 * @returns {Promise<Object>} Map of { queryKey: events[] }
 */
export const batchFetchEventsWithAdaptiveStorage = async (queries) => {
  const results = {};

  for (const query of queries) {
    const key = `${query.startDate}:${query.endDate}`;
    try {
      results[key] = await fetchEventsWithAdaptiveStorage(
        query.startDate,
        query.endDate,
        query.options
      );
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      results[key] = [];
    }
  }

  return results;
};

/**
 * Prefetch events for the next week (optimization)
 * Silently cache data without returning it
 *
 * @param {Object} options - { timezone, currency, impact }
 * @returns {Promise<void>}
 */
export const prefetchNextWeek = async (options = {}) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    await fetchEventsWithAdaptiveStorage(today, nextWeek, {
      ...options,
      skipCache: true,
    });
  } catch (error) {
    console.warn('Prefetch failed (non-fatal):', error);
  }
};

/**
 * Clear all adapter caches (Zustand + IndexedDB)
 * Useful for logout or manual refresh
 *
 * @returns {Promise<void>}
 */
export const clearAdapterCaches = async () => {
  const store = useEventsStore.getState();

  // Clear Zustand store
  store.clear?.();

  // Clear IndexedDB
  if (eventsDB.isSupported()) {
    await eventsDB.clearAll();
  }

  // Clear query batcher
  queryBatcher.clear();
};

/**
 * Get adapter statistics for debugging
 * @returns {Object} { store, indexedDb, batcher }
 */
export const getAdapterStats = () => {
  const store = useEventsStore.getState();

  return {
    store: store.getStats?.(),
    indexedDb: eventsDB.getStats?.(),
    batcher: queryBatcher.getStats?.(),
  };
};

export default {
  fetchEventsWithAdaptiveStorage,
  useEventsAdapter,
  batchFetchEventsWithAdaptiveStorage,
  prefetchNextWeek,
  clearAdapterCaches,
  getAdapterStats,
};
