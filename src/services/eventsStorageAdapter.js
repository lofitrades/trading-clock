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
    currency,
    impact,
    source,
    enrich = false,
    skipCache = false,
  } = options;

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

  // Build query cache key
  const cacheKey = skipCache
    ? null
    : JSON.stringify({
        type: 'adaptive',
        startStr,
        endStr,
        currency,
        impact,
        source,
      });

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
    // ========================================================================
    if (eventsDB.isSupported()) {
      try {
        const idbEvents = await eventsDB.getEventsByDateRange(startStr, endStr);

        // Apply filters
        let filtered = idbEvents;
        if (currency) {
          filtered = filtered.filter((e) => e.currency === currency);
        }
        if (impact) {
          filtered = filtered.filter((e) => e.impact === impact);
        }
        if (source) {
          filtered = filtered.filter((e) => e.sources?.canonical === source);
        }

        if (filtered.length > 0) {
          // Cache found! Update Zustand store
          store.addEvents?.(idbEvents, { source: 'indexeddb' });

          return filtered;
        }
      } catch (error) {
        console.warn('IndexedDB fetch failed, falling back to Firestore:', error);
        // Fall through to Layer 3
      }
    }

    // ========================================================================
    // LAYER 3: Query Batcher (merges overlapping Firestore requests)
    // ========================================================================
    const batchResults = await queryBatcher.fetch({
      startDate: new Date(startStr),
      endDate: new Date(endStr),
      currency,
      impact,
      source,
      enrich,
    });

    // Apply additional filtering
    let filtered = batchResults;
    if (currency) {
      filtered = filtered.filter((e) => e.currency === currency);
    }
    if (impact) {
      filtered = filtered.filter((e) => e.impact === impact);
    }

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
    // ========================================================================
    if (store.addEvents && batchResults.length > 0) {
      store.addEvents(batchResults, { source: 'firestore' });
      store.invalidateQueryCache?.();
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

  // Memoize options to avoid complex dependency expressions
  const optionsKey = useMemo(
    () => JSON.stringify(options),
    [options]
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
