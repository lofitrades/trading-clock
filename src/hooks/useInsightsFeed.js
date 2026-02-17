/**
 * src/hooks/useInsightsFeed.js
 *
 * Purpose: React hook for fetching and managing Insights feed data.
 * Handles async queries, caching, and error states with BEP optimizations:
 * - Stable serialized deps (prevents infinite re-render loops from object refs)
 * - Mounted-guard cleanup (prevents stale setState on unmounted components)
 * - Deterministic cache keys (sorted JSON serialization)
 * - Session-level in-memory cache with 120s TTL
 *
 * Usage:
 * const { items, loading, error, totalBySource, refresh } = useInsightsFeed({
 *   context: { eventTags: ['nfp'], currencyTags: ['USD'] },
 *   filters: { sourceTypes: ['article', 'activity'], timeframe: '7d' },
 * });
 *
 * BEP: Stateless parent binding, ephemeral state only, session-level cache.
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP Audit: Stabilized deps via JSON serialization, added mounted-guard
 *                        cleanup, deterministic cache keys (sorted), pruned stale cache entries,
 *                        removed console.error (error state only), fixed refresh race condition
 * v1.0.0 - 2026-02-10 - Phase 5: Full implementation with caching and pagination stubs
 * (previous) - 2026-02-09 - Stub with contract (Phase 1)
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { fetchInsightsFeed } from '../services/insightsQueryService';

/** Cache TTL: 120 seconds (2 minutes — user-confirmed BEP window) */
const CACHE_TTL_MS = 120 * 1000;

/** Max cache entries before pruning (prevents unbounded memory growth) */
const MAX_CACHE_ENTRIES = 20;

/**
 * Deterministic JSON serialization: sorts object keys to ensure
 * identical content always produces the same cache key string.
 * @param {*} value - Value to serialize
 * @returns {string} Stable JSON string
 */
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * Prune expired entries from cache map.
 * Called before inserting new entries to prevent unbounded growth.
 * @param {Object} cache - Cache object (mutated in place)
 */
function pruneCache(cache) {
  const keys = Object.keys(cache);
  if (keys.length <= MAX_CACHE_ENTRIES) return;

  const now = Date.now();
  // Remove expired first
  keys.forEach((key) => {
    if (now - cache[key].timestamp >= CACHE_TTL_MS) {
      delete cache[key];
    }
  });

  // If still over limit, remove oldest entries
  const remaining = Object.keys(cache);
  if (remaining.length > MAX_CACHE_ENTRIES) {
    remaining
      .sort((a, b) => cache[a].timestamp - cache[b].timestamp)
      .slice(0, remaining.length - MAX_CACHE_ENTRIES)
      .forEach((key) => delete cache[key]);
  }
}

const EMPTY_TOTAL = { article: 0, activity: 0, note: 0 };

/**
 * useInsightsFeed Hook
 *
 * @param {Object} config - Configuration object
 * @param {Object} [config.context] - Page context (e.g., { postId, eventTags, currencyTags })
 * @param {Object} config.filters - User filter selections
 * @returns {Object} Hook return value with items, loading, error, totalBySource, refresh
 *
 * @example
 * const { items, loading, error, totalBySource } = useInsightsFeed({
 *   context: { postId: 'abc123', eventTags: ['nfp', 'fomc'], currencyTags: ['USD'] },
 *   filters: { sourceTypes: ['article', 'activity'], eventKey: 'nfp', timeframe: '7d' },
 * });
 */
export default function useInsightsFeed({ context = {}, filters = {} } = {}) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalBySource, setTotalBySource] = useState(EMPTY_TOTAL);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  /** Session-level cache: { [cacheKey]: { items, totalBySource, timestamp } } */
  const cacheRef = useRef({});
  /** Fetch generation counter — incremented on each fetch to detect stale responses */
  const fetchGenRef = useRef(0);

  // ─── Stable Serialized Dependencies ───────────────────────────────────────
  // BEP FIX: context/filters are objects — new refs every render from parent.
  // Serialize once, use as useEffect dep. Prevents infinite re-fetch loops.
  const contextKey = stableStringify(context);
  const filtersKey = stableStringify(filters);
  const cacheKey = `${contextKey}|${filtersKey}`;

  // ─── Main Fetch Effect ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true; // BEP: mounted guard prevents setState on unmounted component
    const generation = ++fetchGenRef.current;

    const fetchInsights = async () => {
      // Check cache (synchronous — no Firestore reads)
      const cached = cacheRef.current[cacheKey];
      if (cached?.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        if (mounted) {
          setItems(cached.items);
          setTotalBySource(cached.totalBySource);
          setError(null);
        }
        return;
      }

      // Cache miss: fetch fresh
      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }

        const result = await fetchInsightsFeed(context, filters);

        // Stale guard: if a newer fetch was started, discard this result
        if (!mounted || fetchGenRef.current !== generation) return;

        if (result.error) {
          setError(result.error);
          setItems([]);
          setTotalBySource(EMPTY_TOTAL);
        } else {
          const newItems = result.items || [];
          const newTotals = result.totalBySource || EMPTY_TOTAL;
          setItems(newItems);
          setTotalBySource(newTotals);

          // Store in cache (prune first to cap memory)
          pruneCache(cacheRef.current);
          cacheRef.current[cacheKey] = {
            items: newItems,
            totalBySource: newTotals,
            timestamp: Date.now(),
          };
        }

        setHasMore(false); // Pagination stub
      } catch (err) {
        if (!mounted || fetchGenRef.current !== generation) return;
        setError(err instanceof Error ? err.message : 'Failed to load insights');
        setItems([]);
        setTotalBySource(EMPTY_TOTAL);
      } finally {
        if (mounted && fetchGenRef.current === generation) {
          setLoading(false);
        }
      }
    };

    fetchInsights();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]); // BEP: cacheKey is a stable string derived from context + filters

  // ─── Pagination ───────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      // TODO Phase 8: Implement cursor-based pagination
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load more insights');
      setLoading(false);
    }
  }, [hasMore, loading]);

  // ─── Cache Bust ────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    delete cacheRef.current[cacheKey];
    const generation = ++fetchGenRef.current;

    setLoading(true);
    setError(null);

    fetchInsightsFeed(context, filters)
      .then((result) => {
        // Stale guard: discard if a newer operation started
        if (fetchGenRef.current !== generation) return;

        if (result.error) {
          setError(result.error);
          setItems([]);
          setTotalBySource(EMPTY_TOTAL);
        } else {
          const newItems = result.items || [];
          const newTotals = result.totalBySource || EMPTY_TOTAL;
          setItems(newItems);
          setTotalBySource(newTotals);

          // Re-cache the fresh result
          pruneCache(cacheRef.current);
          cacheRef.current[cacheKey] = {
            items: newItems,
            totalBySource: newTotals,
            timestamp: Date.now(),
          };
        }
      })
      .catch((err) => {
        if (fetchGenRef.current !== generation) return;
        setError(err.message || 'Failed to refresh insights');
      })
      .finally(() => {
        if (fetchGenRef.current === generation) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]); // BEP: cacheKey captures context + filters as stable string

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalBySource,
  };
}
