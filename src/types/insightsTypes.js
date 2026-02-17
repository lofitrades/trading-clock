/**
 * src/types/insightsTypes.js
 *
 * Purpose: TypeScript-style JSDoc type definitions for the Insights feature.
 * Defines canonical InsightItem format, filter contracts, and hook returns.
 * Single source of truth for all Insights data structures.
 *
 * Changelog:
 * v1.0.0 - 2026-02-09 - Initial type definitions (Phase 1)
 */

/**
 * @typedef {Object} InsightItemMetadata
 * @property {string} [slug] - Blog post slug (articles only)
 * @property {Object} [coverImage] - Blog post cover image (articles only)
 * @property {string} coverImage.url - Image URL
 * @property {string} coverImage.alt - Alt text
 * @property {number} [readingTime] - Reading time in minutes (articles)
 * @property {string} [category] - Blog category (articles)
 * @property {number} [likeCount] - Total likes (articles)
 * @property {number} [viewCount] - Total views (articles)
 * @property {'info'|'warning'|'error'|'success'} [severity] - Activity severity level
 * @property {string} [activityType] - ACTIVITY_TYPES value (e.g., 'sync_completed')
 * @property {'public'|'internal'|'admin'} [visibility] - Access level for activity logs
 * @property {string} [eventName] - Event name from activity or note
 * @property {Date} [eventDate] - Event date (notes)
 */

/**
 * Canonical Insight Item format — normalized across all sources
 *
 * @typedef {Object} InsightItem
 * @property {string} id - Unique ID: `${sourceType}:${sourceId}`
 * @property {'article'|'activity'|'note'} sourceType - Source type
 * @property {string} sourceId - Full source path (e.g., `blogPosts/abc123`, `systemActivityLog/def456`)
 * @property {string} title - Display title (blog title, activity title, or note excerpt)
 * @property {string} summary - Summary text (blog excerpt, activity description, or full note)
 * @property {Date} timestamp - Publication/creation time (publishedAt, createdAt, etc.)
 * @property {string[]} insightKeys - Computed keys for filtering (e.g., ['event:nfp', 'currency:USD'])
 * @property {string[]} [eventTags] - Original event slugs from blog or activity
 * @property {string[]} [currencyTags] - Currency codes
 * @property {InsightItemMetadata} metadata - Source-specific metadata
 * @property {number} [score] - Ranking score (computed by prioritization engine)
 */

/**
 * Page context passed to InsightsPanel — describes what the page is showing
 *
 * @typedef {Object} InsightsPageContext
 * @property {string} [postId] - Blog post ID (BlogPostPage)
 * @property {string[]} [eventTags] - Event taxonomy from the post (BlogPostPage)
 * @property {string[]} [currencyTags] - Currency taxonomy from the post (BlogPostPage)
 * @property {Object} [eventIdentity] - Event identity for Calendar event selection (Phase 8)
 * @property {string} eventIdentity.nameKey - Normalized event name key
 * @property {string} eventIdentity.currencyKey - Currency key
 * @property {number} eventIdentity.dateKey - Event timestamp in ms
 * @property {string} [eventId] - Canonical event ID (Calendar)
 * @property {string} [currency] - Selected currency on the page
 */

/**
 * User-selectable filter state for Insights
 *
 * @typedef {Object} InsightsFilters
 * @property {Array<'article'|'activity'|'note'>} sourceTypes - Which source types to include
 * @property {string} [eventKey] - Event slug filter (e.g., 'nfp') — optional autocomplete
 * @property {string} [currency] - Currency code filter (e.g., 'USD') — optional
 * @property {'24h'|'7d'|'30d'|'all'} timeframe - Time window for results (default: '7d')
 */

/**
 * Hook return value for useInsightsFeed
 *
 * @typedef {Object} UseInsightsFeedReturn
 * @property {InsightItem[]} items - Ranked, deduplicated feed of insights
 * @property {boolean} loading - True while fetching data
 * @property {string|null} error - Error message if fetch failed, null if OK
 * @property {boolean} hasMore - True if more results available for pagination
 * @property {Function} loadMore - Call to fetch next batch of results
 * @property {Object} totalBySource - Aggregated counts by source type
 * @property {number} totalBySource.article - Count of articles in feed
 * @property {number} totalBySource.activity - Count of activity logs in feed
 * @property {number} totalBySource.note - Count of notes in feed
 */

/**
 * Hook configuration
 *
 * @typedef {Object} UseInsightsFeedConfig
 * @property {InsightsPageContext} [context] - Page context (optional, for contextual mode)
 * @property {InsightsFilters} filters - User filter selections
 */

/**
 * insightKeys key format constants
 */
export const INSIGHT_KEY_PREFIXES = {
  EVENT: 'event',              // event:<slug> (e.g., 'event:nfp')
  CURRENCY: 'currency',        // currency:<CCY> (e.g., 'currency:USD')
  EVENT_CURRENCY: 'eventCurrency',  // eventCurrency:<slug>_<CCY> (e.g., 'eventCurrency:nfp_USD')
  POST: 'post',                // post:<postId> (e.g., 'post:abc123')
  EVENT_NAME_KEY: 'eventNameKey',  // eventNameKey:<normalizedKey> (e.g., 'eventNameKey:non_farm_payrolls')
  EVENT_IDENTITY: 'eventIdentity', // eventIdentity:<nameKey>:<currencyKey>:<dateKey>
};

/**
 * Insight source types
 */
export const INSIGHT_SOURCE_TYPES = {
  ARTICLE: 'article',
  ACTIVITY: 'activity',
  NOTE: 'note',
};

/**
 * Activity severity levels (used for ranking boosts)
 */
export const ACTIVITY_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
};

/**
 * Visibility levels for activity logs
 */
export const ACTIVITY_VISIBILITY = {
  PUBLIC: 'public',      // Any authenticated user
  INTERNAL: 'internal',  // Admin + Superadmin
  ADMIN: 'admin',        // Superadmin only
};

/**
 * Timeframe options for Insights filters
 */
export const INSIGHT_TIMEFRAMES = {
  DAY: '24h',
  WEEK: '7d',
  MONTH: '30d',
  ALL: 'all',
};

/**
 * Converts timeframe string to milliseconds
 *
 * @param {string} timeframe - One of '24h', '7d', '30d', 'all'
 * @returns {number|null} Milliseconds (negative, for date subtraction), or null for 'all'
 *
 * @example
 * timeframeToMs('7d') // -604800000 (ms in 7 days)
 * timeframeToMs('all') // null
 */
export function timeframeToMs(timeframe) {
  switch (timeframe) {
    case INSIGHT_TIMEFRAMES.DAY:
      return -86400000; // 24 hours
    case INSIGHT_TIMEFRAMES.WEEK:
      return -604800000; // 7 days
    case INSIGHT_TIMEFRAMES.MONTH:
      return -2592000000; // 30 days
    case INSIGHT_TIMEFRAMES.ALL:
      return null; // No time limit
    default:
      return -604800000; // Default to 7 days
  }
}

export default {
  INSIGHT_KEY_PREFIXES,
  INSIGHT_SOURCE_TYPES,
  ACTIVITY_SEVERITY,
  ACTIVITY_VISIBILITY,
  INSIGHT_TIMEFRAMES,
  timeframeToMs,
};
