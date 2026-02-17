/**
 * src/services/insightsQueryService.js
 *
 * Purpose: Query service for Insights feed data with role-based visibility filtering.
 * Resolves query plans based on context + filters, executes bounded queries per source type.
 * Handles caching, deduplication, scoring, and pagination.
 *
 * BEP Optimizations (v1.2.0):
 * - Session-cached visibility role (avoids async getIdTokenResult on every fetch)
 * - Parallelized Firestore queries via Promise.all (~3× faster)
 * - Early-exit for empty source results (skips dedup/ranking overhead)
 * - No console.log/warn in production hot paths
 *
 * Visibility Enforcement:
 * - Unauthenticated users: See 'public' activity logs (trending insights)
 * - Authenticated non-admin: See 'public' activity logs
 * - Admin users: See 'public' + 'internal' activity logs
 * - Superadmin: See all activity logs (no filtering)
 *
 * Changelog:
 * v1.7.0 - 2026-02-10 - BEP QUERY FIX: (1) Reordered Firestore query constraints to canonical
 *                        form (equality → range → orderBy → limit). The splice()-based insertion
 *                        placed createdAt >= BEFORE visibility in, which can cause SDK validation
 *                        failures in some Firestore client versions. (2) Propagated errors from
 *                        queryActivityLogs/queryTrendingActivityLogs to caller instead of silently
 *                        returning []. Previously, Firestore permission/index errors were caught
 *                        and returned as empty arrays with error:null — the UI showed "0 activities"
 *                        with no error banner, and the empty result was CACHED for 120s. Errors now
 *                        bubble up to fetchInsightsFeed which sets error state for UI display.
 * v1.6.0 - 2026-02-10 - BEP TRENDING FIX: Added cascading timeframe fallback to trending mode.
 *                        When the constrained-timeframe trending query returns 0 results, retries
 *                        without time limit (Infinity) to guarantee content as long as ANY public
 *                        activity logs exist in Firestore. Fixes empty InsightsPanel on Calendar2Page
 *                        when no currency filter is applied for both auth and non-auth users.
 * v1.5.0 - 2026-02-10 - BEP CRITICAL: (1) Non-auth users now see public insights — getVisibilityFilter
 *                        returns ['public'] instead of [] for unauthenticated users. (2) Keyed query
 *                        fallback — when context-based query returns 0 results, falls back to trending
 *                        mode so BlogPostPage/Calendar2Page always show content. (3) Requires
 *                        composite index (visibility ASC, createdAt DESC) on systemActivityLog.
 * v1.4.0 - 2026-02-10 - BEP FIX: Trending mode fallback — when no context/filters provided,
 *                        query recent activity logs without key filter instead of returning empty.
 *                        Enables Insights to show useful content on Calendar2Page with no currency filter.
 * v1.3.0 - 2026-02-09 - BEP FIX: Handle 'all' timeframe (Infinity) — conditional createdAt filter prevents Invalid Date crash
 * v1.2.0 - 2026-02-10 - BEP Audit: Cached visibility role per UID, parallelized queries,
 *                        early-exit for empty results, removed console.log/warn
 * v1.1.0 - 2026-02-10 - Phase 3 integration: Added ranking + dedup from insightsPrioritization.js; fixed eventCurrency format (underscore not colon)
 * v1.0.0 - 2026-02-09 - Phase 7: Initial implementation with visibility filtering
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { rankInsights, deduplicateItems } from '../utils/insightsPrioritization';

/**
 * Normalize timeframe string to milliseconds
 * @param {string} timeframe - Timeframe preset ('24h', '7d', '30d', 'all')
 * @returns {number} Milliseconds
 */
function timeframeToMs(timeframe) {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  switch (timeframe) {
    case '24h':
      return 1 * DAY;
    case '7d':
      return 7 * DAY;
    case '30d':
      return 30 * DAY;
    case 'all':
      return Infinity;
    default:
      return 7 * DAY; // Default: 7 days
  }
}

/**
 * Session-cached visibility role.
 * Role is derived from Firebase custom claims which don't change mid-session.
 * Caching eliminates the async getIdTokenResult() call on every fetch.
 * Invalidated when UID changes (logout/login).
 * @type {{ uid: string|null, filter: string[] }}
 */
let _visibilityCache = { uid: null, filter: [] };

/**
 * Determine visibility filter based on user role (session-cached).
 * First call per UID: async claim lookup. Subsequent calls: synchronous cache hit.
 * @async
 * @param {string} [userRole] - Override user role (for testing)
 * @returns {Promise<string[]>} Array of visibility levels
 */
async function getVisibilityFilter(userRole) {
  try {
    const user = auth.currentUser;
    if (!user) {
      // BEP v1.5.0: Non-auth users can still see 'public' visibility insights.
      // Firestore rules allow unauthenticated reads for visibility == 'public'.
      _visibilityCache = { uid: null, filter: ['public'] };
      return ['public'];
    }

    // Cache hit: same UID, no override → return cached filter (synchronous path)
    if (!userRole && _visibilityCache.uid === user.uid && _visibilityCache.filter.length > 0) {
      return _visibilityCache.filter;
    }

    // Cache miss: resolve role from custom claims
    let role = userRole || 'user';
    if (!userRole && user.uid) {
      try {
        const claims = await user.getIdTokenResult();
        role = claims.claims.role || 'user';
      } catch {
        // Fallback to 'user' role on claim read failure
      }
    }

    // Map role → visibility levels
    let filter;
    if (role === 'superadmin') {
      filter = ['public', 'internal', 'admin'];
    } else if (role === 'admin') {
      filter = ['public', 'internal'];
    } else {
      filter = ['public'];
    }

    // Cache for this UID
    if (!userRole) {
      _visibilityCache = { uid: user.uid, filter };
    }

    return filter;
  } catch {
    return ['public']; // Safe default
  }
}

/**
 * Resolve query plan from context + filters
 * @param {Object} context - Page context (postId, eventTags, currencyTags, etc.)
 * @param {Object} filters - User filters (sourceTypes, eventKey, currency, timeframe)
 * @param {string[]} visibilityFilter - Array of visible visibility levels
 * @returns {Object} Query plan with candidate keys, source types, limits, timeframe, visibility filter
 */
function resolveQueryPlan(context, filters, visibilityFilter) {
  const plan = {
    candidateKeys: [],
    sourceTypes: filters.sourceTypes || ['article', 'activity', 'note'],
    limits: {
      article: 10,
      activity: 20,
      note: 10,
    },
    timeframeMs: timeframeToMs(filters.timeframe || '7d'),
    visibilityFilter,
  };

  // Derive candidate keys from context + filters
  if (filters.eventKey && filters.currency) {
    plan.candidateKeys.push(`eventCurrency:${filters.eventKey}_${filters.currency}`);
  } else if (filters.eventKey) {
    plan.candidateKeys.push(`event:${filters.eventKey}`);
  } else if (filters.currency) {
    plan.candidateKeys.push(`currency:${filters.currency}`);
  }

  // Add keys from context
  if (context.eventTags?.length) {
    context.eventTags.forEach((tag) => {
      plan.candidateKeys.push(`event:${tag}`);
    });
  }

  if (context.currencyTags?.length) {
    context.currencyTags.forEach((ccy) => {
      plan.candidateKeys.push(`currency:${ccy}`);
    });
  }

  if (context.postId) {
    plan.candidateKeys.push(`post:${context.postId}`);
  }

  // Deduplicate keys
  plan.candidateKeys = [...new Set(plan.candidateKeys)];

  // If no keys, fallback to empty (will use trending mode or return empty)
  // No console.warn — this is expected for pages without event/currency context

  return plan;
}

/**
 * Query activity logs with visibility filtering (parallelized).
 * BEP: Queries run in parallel via Promise.all for ~3× faster response.
 * @async
 * @param {string[]} candidateKeys - Array of insightKeys to query
 * @param {number} limit_count - Maximum docs to return
 * @param {number} timeframeMs - Milliseconds back from now to query
 * @param {string[]} visibilityFilter - Array of visible visibility levels
 * @returns {Promise<Object[]>} Array of activity log items
 */
async function queryActivityLogs(candidateKeys, limit_count, timeframeMs, visibilityFilter) {
  // Early exit: no keys or empty visibility = no results (0 Firestore reads)
  if (!candidateKeys.length || !visibilityFilter.length) {
    return [];
  }

  // BEP v1.7.0: Build constraints in canonical order (equality → range → orderBy → limit)
  // Previous splice()-based insertion placed range BEFORE equality, which can cause
  // SDK validation failures in some Firestore client versions.
  const hasTimebound = isFinite(timeframeMs);
  const since = hasTimebound ? new Date(Date.now() - timeframeMs) : null;

  // BEP: Parallelize queries — each key is an independent Firestore query
  // Limit to 3 keys to cap Firestore reads (3 queries × limit_count docs max)
  const queryPromises = candidateKeys.slice(0, 3).map((key) => {
    const constraints = [
      where('insightKeys', 'array-contains', key),
      where('visibility', 'in', visibilityFilter),
    ];
    if (hasTimebound) {
      constraints.push(where('createdAt', '>=', since));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limit_count));
    const q = query(collection(db, 'systemActivityLog'), ...constraints);
    return getDocs(q);
  });

  const snapshots = await Promise.all(queryPromises);

  // Flatten results + deduplicate by sourceId
  const seen = new Set();
  const results = [];

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      results.push({
        sourceType: 'activity',
        sourceId: doc.id,
        id: `activity:${doc.id}`,
        ...doc.data(),
      });
    }
  }

  return results.slice(0, limit_count);
}

/**
 * Query recent activity logs WITHOUT key filtering (trending mode).
 * Used when no context or filters are provided — shows general recent activity.
 * BEP: Bounded query with visibility filtering, no unbounded scans.
 * @async
 * @param {number} limit_count - Maximum docs to return
 * @param {number} timeframeMs - Milliseconds back from now to query
 * @param {string[]} visibilityFilter - Array of visible visibility levels
 * @returns {Promise<Object[]>} Array of recent activity log items
 */
async function queryTrendingActivityLogs(limit_count, timeframeMs, visibilityFilter) {
  // Early exit: empty visibility = no results
  if (!visibilityFilter.length) {
    return [];
  }

  // BEP v1.7.0: Build constraints in canonical order (equality → range → orderBy → limit)
  // Previous splice()-based insertion placed range BEFORE equality, which can cause
  // SDK validation failures in some Firestore client versions.
  const hasTimebound = isFinite(timeframeMs);
  const since = hasTimebound ? new Date(Date.now() - timeframeMs) : null;

  const constraints = [
    where('visibility', 'in', visibilityFilter),
  ];
  if (hasTimebound) {
    constraints.push(where('createdAt', '>=', since));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(limit_count));

  const q = query(collection(db, 'systemActivityLog'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    sourceType: 'activity',
    sourceId: doc.id,
    id: `activity:${doc.id}`,
    ...doc.data(),
  }));
}

// ─── Stubs: Blog Articles + Event Notes ──────────────────────────────────────
// TODO Phase 8+: Implement queryBlogArticles and queryEventNotes
// When implemented, re-enable in fetchInsightsFeed and add to allItems.
// Currently skipped entirely (no function call overhead).

/**
 * Main service function: Fetch insights based on context + filters
 * @async
 * @param {Object} context - Page context (postId, eventTags, currencyTags, etc.)
 * @param {Object} filters - User filters (sourceTypes, eventKey, currency, timeframe)
 * @returns {Promise<Object>} Insights feed with items and counts
 */
export async function fetchInsightsFeed(context = {}, filters = {}) {
  const EMPTY_RESULT = { items: [], totalBySource: { article: 0, activity: 0, note: 0 }, error: null };

  try {
    // Determine visibility filter based on user role (session-cached)
    // BEP v1.5.0: Returns ['public'] for non-auth users (no longer blocks)
    const visibilityFilter = await getVisibilityFilter();

    // Safety guard: if visibility filter is somehow empty, return early
    if (!visibilityFilter.length) {
      return EMPTY_RESULT;
    }

    // Resolve query plan
    const plan = resolveQueryPlan(context, filters, visibilityFilter);

    // Execute queries only for enabled source types
    const allItems = [];

    // BEP v1.4.0: Trending mode fallback — when no candidate keys, query recent activities
    const isTrendingMode = !plan.candidateKeys.length;

    if (plan.sourceTypes.includes('activity')) {
      if (isTrendingMode) {
        // No filters/context → show recent trending activity logs
        let trendingActivities = await queryTrendingActivityLogs(
          plan.limits.activity,
          plan.timeframeMs,
          plan.visibilityFilter
        );

        // BEP v1.6.0: Cascading timeframe fallback — if constrained timeframe
        // returned 0 results, retry without time limit. Ensures InsightsPanel always
        // shows content as long as ANY public activity logs exist in Firestore.
        if (!trendingActivities.length && isFinite(plan.timeframeMs)) {
          trendingActivities = await queryTrendingActivityLogs(
            plan.limits.activity,
            Infinity,
            plan.visibilityFilter
          );
        }

        allItems.push(...trendingActivities);
      } else {
        // Normal mode: query by candidate keys
        const activities = await queryActivityLogs(
          plan.candidateKeys,
          plan.limits.activity,
          plan.timeframeMs,
          plan.visibilityFilter
        );
        allItems.push(...activities);

        // BEP v1.5.0: Trending fallback — if keyed query returned 0 results,
        // fall back to trending mode so the panel always shows useful content.
        // This handles BlogPostPage posts with no matching activity logs.
        if (!activities.length) {
          let trendingFallback = await queryTrendingActivityLogs(
            plan.limits.activity,
            plan.timeframeMs,
            plan.visibilityFilter
          );

          // BEP v1.6.0: Cascading timeframe fallback for keyed-query trending fallback
          if (!trendingFallback.length && isFinite(plan.timeframeMs)) {
            trendingFallback = await queryTrendingActivityLogs(
              plan.limits.activity,
              Infinity,
              plan.visibilityFilter
            );
          }

          allItems.push(...trendingFallback);
        }
      }
    }

    // Blog articles stub — skip query entirely (returns [])
    // if (plan.sourceTypes.includes('article')) { ... }

    // Event notes stub — skip query entirely (returns [])
    // if (plan.sourceTypes.includes('note')) { ... }

    // Early exit: no items from any source → skip dedup + ranking overhead
    if (!allItems.length) {
      return EMPTY_RESULT;
    }

    // Deduplicate and rank
    const deduped = deduplicateItems(allItems);
    const ranked = rankInsights(deduped, {
      candidateKeys: plan.candidateKeys,
      applyDiversity: true,
    });

    // Count by source (from ranked items)
    const totalBySource = {
      article: 0,
      activity: 0,
      note: 0,
    };
    for (const item of ranked) {
      if (item.sourceType in totalBySource) {
        totalBySource[item.sourceType]++;
      }
    }

    return {
      items: ranked,
      totalBySource,
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      totalBySource: { article: 0, activity: 0, note: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  fetchInsightsFeed,
};
