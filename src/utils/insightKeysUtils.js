/**
 * src/utils/insightKeysUtils.js
 *
 * Purpose: Shared utility functions for computing canonical insightKeys.
 * Used by Phase 2 backfill + runtime insightKeys generation across
 * blogPosts, systemActivityLog, and eventNotes collections.
 *
 * Pattern: insightKeys is an array of standardized string keys with prefixes:
 * - "event:{eventSlug}" (from event names via BLOG_ECONOMIC_EVENTS)
 * - "currency:{code}" (from currency codes via BLOG_CURRENCIES)
 * - "eventCurrency:{eventSlug}_{code}" (composite)
 * - "post:{postId}" (from blog post references)
 * - "eventNameKey:{eventNameString}" (fallback for unmapped event names)
 * - "eventIdentity:{composite}" (Phase 8: for calendar event matching)
 *
 * BEP: Pure functions, no side effects, deterministic, testable.
 *
 * Changelog:
 * v1.1.0 - 2026-02-09 - Phase 2: Fixed normalizeKey (hyphens not underscores), added determineActivityVisibility(), fixed metadata.currency handling
 * v1.0.0 - 2026-02-09 - Initial implementation (Phase 1)
 */

/**
 * CANONICAL EVENT SLUGS (from kb.md)
 * 25 major economic events used across blog + calendar
 */
export const BLOG_ECONOMIC_EVENTS = [
  'nfp', // Non-Farm Payroll (USA)
  'fomc', // Federal Open Market Committee
  'cpi', // Consumer Price Index
  'ppi', // Producer Price Index
  'rba', // Reserve Bank of Australia
  'ecb', // European Central Bank
  'boe', // Bank of England
  'boj', // Bank of Japan
  'snb', // Swiss National Bank
  'rbnz', // Reserve Bank of New Zealand
  'china-gdp', // China GDP
  'china-pmi', // China PMI
  'eurozone-gdp', // Eurozone GDP
  'eurozone-pmi', // Eurozone PMI
  'uk-gdp', // UK GDP
  'uk-pmi', // UK PMI
  'japan-gdp', // Japan GDP
  'japan-pmi', // Japan PMI
  'canada-gdp', // Canada GDP
  'ism-pmi', // ISM PMI (USA)
  'unemployment', // Unemployment Rate
  'retail-sales', // Retail Sales
  'housing-starts', // Housing Starts
  'consumer-sentiment', // Consumer Sentiment
  'oil-inventory', // Oil Inventory
];

/**
 * CANONICAL CURRENCY CODES (from kb.md)
 * 17 major trading currencies
 */
export const BLOG_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'CHF', // Swiss Franc
  'CAD', // Canadian Dollar
  'AUD', // Australian Dollar
  'NZD', // New Zealand Dollar
  'CNY', // Chinese Yuan
  'SGD', // Singapore Dollar
  'HKD', // Hong Kong Dollar
  'INR', // Indian Rupee
  'MXN', // Mexican Peso
  'BRL', // Brazilian Real
  'KRW', // Korean Won
  'SEK', // Swedish Krona
  'NOK', // Norwegian Krone
];

// ──────────────────────────────────────────────────────────────────────────────
// PUBLIC FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * computeBlogInsightKeys - Extract insightKeys from a blog post
 *
 * Processes eventTags[] and currencyTags[] from post to generate:
 * - "event:{slug}" for each event tag
 * - "currency:{code}" for each currency tag
 * - "eventCurrency:{slug}_{code}" for all combinations
 * - "post:{postId}"
 *
 * @param {Object} post - Blog post object
 * @param {string} post.id - Post ID (required)
 * @param {Array<string>} [post.eventTags=[]] - Event taxonomy (canonical slugs)
 * @param {Array<string>} [post.currencyTags=[]] - Currency taxonomy (ISO codes)
 * @returns {string[]} Array of insightKeys
 *
 * @example
 * const keys = computeBlogInsightKeys({
 *   id: 'post_abc123',
 *   eventTags: ['nfp', 'cpi'],
 *   currencyTags: ['USD', 'EUR'],
 * });
 * // Returns: ['event:nfp', 'event:cpi', 'currency:USD', 'currency:EUR', 
 * //           'eventCurrency:nfp_USD', 'eventCurrency:nfp_EUR', 
 * //           'eventCurrency:cpi_USD', 'eventCurrency:cpi_EUR', 'post:post_abc123']
 */
export function computeBlogInsightKeys(post) {
  const keys = [];

  // Post reference
  if (post.id) {
    keys.push(`post:${post.id}`);
  }

  // Event tags
  const eventTags = Array.isArray(post.eventTags) ? post.eventTags : [];
  eventTags.forEach((tag) => {
    const normalized = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
      keys.push(`event:${normalized}`);
    } else if (normalized) {
      // Fallback for unmapped event names
      keys.push(`eventNameKey:${normalized}`);
    }
  });

  // Currency tags
  const currencyTags = Array.isArray(post.currencyTags) ? post.currencyTags : [];
  currencyTags.forEach((code) => {
    const normalized = code.toUpperCase();
    if (BLOG_CURRENCIES.includes(normalized)) {
      keys.push(`currency:${normalized}`);
    }
  });

  // Event + Currency combinations
  eventTags.forEach((tag) => {
    const eventNorm = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm)) {
      currencyTags.forEach((code) => {
        const currNorm = code.toUpperCase();
        if (BLOG_CURRENCIES.includes(currNorm)) {
          keys.push(`eventCurrency:${eventNorm}_${currNorm}`);
        }
      });
    }
  });

  return Array.from(new Set(keys)); // Deduplicate
}

/**
 * computeActivityInsightKeys - Extract insightKeys from an activity log entry
 *
 * Processes metadata (eventName, currencyCode, postId, etc.) from activity log
 * to generate canonical keys. Falls back gracefully for unmapped event names.
 *
 * @param {string} activityType - Type of activity (e.g., 'blog_post_published')
 * @param {Object} metadata - Activity metadata
 * @param {string} [metadata.eventName] - Event name (e.g., 'Non-Farm Payroll')
 * @param {string} [metadata.currencyCode] - Currency code (e.g., 'USD')
 * @param {string} [metadata.postId] - Blog post ID
 * @param {string} [metadata.userAction] - User action (e.g., 'note_created')
 * @returns {string[]} Array of insightKeys
 *
 * @example
 * const keys = computeActivityInsightKeys('event_favorited', {
 *   eventName: 'Non-Farm Payroll',
 *   currencyCode: 'USD',
 * });
 * // Returns: ['eventNameKey:non-farm-payroll', 'currency:USD', 'eventCurrency:nfp_USD']
 * // (where 'nfp' was resolved via findCanonicalSlug)
 */
export function computeActivityInsightKeys(activityType, metadata = {}) {
  const keys = [];

  // Post reference
  if (metadata.postId) {
    keys.push(`post:${metadata.postId}`);
  }

  // Blog-related activities may carry eventTags/currencyTags
  const eventTags = Array.isArray(metadata.eventTags) ? metadata.eventTags : [];
  const currencyTags = Array.isArray(metadata.currencyTags) ? metadata.currencyTags : [];

  eventTags.forEach((tag) => {
    const normalized = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
      keys.push(`event:${normalized}`);
    } else if (normalized) {
      keys.push(`eventNameKey:${normalized}`);
    }
  });

  currencyTags.forEach((code) => {
    const normalized = code.toUpperCase();
    if (BLOG_CURRENCIES.includes(normalized)) {
      keys.push(`currency:${normalized}`);
    }
  });

  // Event name → slug mapping (for event-related activities)
  let eventSlug = null;
  if (metadata.eventName) {
    eventSlug = findCanonicalSlug(metadata.eventName);
    if (eventSlug) {
      keys.push(`event:${eventSlug}`);
    } else {
      // Fallback for unmapped event names
      keys.push(`eventNameKey:${normalizeKey(metadata.eventName)}`);
    }
  }

  // Currency — handle both 'currencyCode' and 'currency' field names
  // activityLogger uses metadata.currency, some callers may use currencyCode
  let currencyCode = null;
  const rawCurrency = metadata.currencyCode || metadata.currency;
  if (rawCurrency) {
    currencyCode = rawCurrency.toUpperCase();
    if (BLOG_CURRENCIES.includes(currencyCode)) {
      keys.push(`currency:${currencyCode}`);
    }
  }

  // Event + Currency combination
  if (eventSlug && currencyCode && BLOG_CURRENCIES.includes(currencyCode)) {
    keys.push(`eventCurrency:${eventSlug}_${currencyCode}`);
  }

  // eventTag × currencyTag combinations (for blog activities)
  eventTags.forEach((tag) => {
    const eventNorm = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm)) {
      currencyTags.forEach((code) => {
        const currNorm = code.toUpperCase();
        if (BLOG_CURRENCIES.includes(currNorm)) {
          keys.push(`eventCurrency:${eventNorm}_${currNorm}`);
        }
      });
    }
  });

  return Array.from(new Set(keys)); // Deduplicate
}

/**
 * computeNoteInsightKeys - Extract insightKeys from a user event note
 *
 * Processes note metadata (primaryNameKey, currencyKey, dateKey, etc.)
 * to generate insight keys. Notes are per-user, so don't include user ID.
 *
 * @param {Object} note - Event note object
 * @param {string} [note.primaryNameKey] - Event name key (e.g., 'nfp')
 * @param {string} [note.currencyKey] - Currency code (e.g., 'USD')
 * @param {string} [note.dateKey] - Date key for event (e.g., '2026-02-06')
 * @returns {string[]} Array of insightKeys
 *
 * @example
 * const keys = computeNoteInsightKeys({
 *   primaryNameKey: 'nfp',
 *   currencyKey: 'USD',
 *   dateKey: '2026-02-06',
 * });
 * // Returns: ['event:nfp', 'currency:USD', 'eventCurrency:nfp_USD']
 */
export function computeNoteInsightKeys(note) {
  const keys = [];

  // Event
  if (note.primaryNameKey) {
    const eventNorm = normalizeKey(note.primaryNameKey);
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm)) {
      keys.push(`event:${eventNorm}`);
    } else if (eventNorm) {
      keys.push(`eventNameKey:${eventNorm}`);
    }
  }

  // Currency
  if (note.currencyKey) {
    const currCode = note.currencyKey.toUpperCase();
    if (BLOG_CURRENCIES.includes(currCode)) {
      keys.push(`currency:${currCode}`);
    }
  }

  // Event + Currency combination
  if (note.primaryNameKey && note.currencyKey) {
    const eventNorm = normalizeKey(note.primaryNameKey);
    const currCode = note.currencyKey.toUpperCase();
    if (
      BLOG_ECONOMIC_EVENTS.includes(eventNorm) &&
      BLOG_CURRENCIES.includes(currCode)
    ) {
      keys.push(`eventCurrency:${eventNorm}_${currCode}`);
    }
  }

  return Array.from(new Set(keys)); // Deduplicate
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * normalizeKey - Normalize a string for slug matching
 *
 * Converts to lowercase, replaces spaces + underscores with hyphens,
 * removes special characters. Uses hyphens to match BLOG_ECONOMIC_EVENTS
 * format (e.g., 'china-gdp', 'ism-pmi').
 *
 * @param {string} str - Input string
 * @returns {string} Normalized slug
 *
 * @example
 * normalizeKey('Non-Farm Payroll') // 'non-farm-payroll'
 * normalizeKey('china-gdp')        // 'china-gdp' (preserved)
 * normalizeKey('china_gdp')        // 'china-gdp' (unified)
 * normalizeKey('CPI')              // 'cpi'
 */
export function normalizeKey(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Spaces → hyphens
    .replace(/_/g, '-')   // Underscores → hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special chars (keep hyphens)
    .replace(/-+/g, '-')  // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * findCanonicalSlug - Look up canonical slug for an event name
 *
 * Tries exact match (after normalization) against BLOG_ECONOMIC_EVENTS.
 * Returns slug if found, null otherwise. Phase 4 can enhance with fuzzy matching.
 *
 * @param {string} eventName - Human-readable event name (e.g., 'Non-Farm Payroll')
 * @returns {string|null} Canonical slug (e.g., 'nfp') or null
 *
 * @example
 * findCanonicalSlug('Non-Farm Payroll') // 'nfp'
 * findCanonicalSlug('unemployment rate') // 'unemployment'
 * findCanonicalSlug('Unknown Event') // null
 */
export function findCanonicalSlug(eventName) {
  if (!eventName || typeof eventName !== 'string') return null;

  const normalized = normalizeKey(eventName);

  // Exact match
  if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
    return normalized;
  }

  // Partial match (first matching slug that contains normalized string)
  const partial = BLOG_ECONOMIC_EVENTS.find((slug) =>
    slug.includes(normalized) || normalized.includes(slug)
  );

  return partial || null;
}

/**
 * deduplicateKeys - Remove duplicate insightKeys
 *
 * Simple utility to deduplicate an insightKeys array while preserving order.
 *
 * @param {string[]} keys - Array of insightKeys
 * @returns {string[]} Deduplicated array
 */
export function deduplicateKeys(keys) {
  return Array.from(new Set(keys));
}

/**
 * filterKeysByPrefix - Filter insightKeys by prefix
 *
 * @param {string[]} keys - Array of insightKeys
 * @param {string} prefix - Prefix to match (e.g., 'event:', 'currency:')
 * @returns {string[]} Filtered keys
 *
 * @example
 * filterKeysByPrefix(['event:nfp', 'currency:USD', 'post:abc'], 'event:')
 * // Returns: ['event:nfp']
 */
export function filterKeysByPrefix(keys, prefix) {
  return keys.filter((key) => key.startsWith(prefix));
}

// ──────────────────────────────────────────────────────────────────────────────
// VISIBILITY HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Mapping of activity types → visibility level.
 * PUBLIC  = any authenticated user can see in Insights feed
 * INTERNAL = admin + superadmin only
 * ADMIN   = superadmin only
 */
const VISIBILITY_BY_TYPE = {
  // Public events (visible in Insights feed)
  event_rescheduled: 'public',
  event_cancelled: 'public',
  event_reinstated: 'public',
  event_created: 'public',
  event_deleted: 'public',
  event_updated: 'public',
  blog_published: 'public',
  canonical_event_updated: 'public',

  // Internal (admin audit trail)
  blog_created: 'internal',
  blog_updated: 'internal',
  blog_deleted: 'internal',
  sync_completed: 'internal',
  sync_failed: 'internal',
  gpt_upload: 'internal',
  event_description_created: 'internal',
  event_description_updated: 'internal',
  event_description_deleted: 'internal',
  blog_author_created: 'internal',
  blog_author_updated: 'internal',
  blog_author_deleted: 'internal',
  events_exported: 'internal',

  // Admin-only (sensitive)
  user_signup: 'admin',
  settings_changed: 'admin',
};

/**
 * determineActivityVisibility - Get the visibility level for an activity type
 *
 * @param {string} activityType - Activity type constant (e.g., 'blog_published')
 * @returns {'public'|'internal'|'admin'} Visibility level
 *
 * @example
 * determineActivityVisibility('blog_published')   // 'public'
 * determineActivityVisibility('sync_completed')   // 'internal'
 * determineActivityVisibility('user_signup')       // 'admin'
 * determineActivityVisibility('unknown_type')      // 'internal' (safe default)
 */
export function determineActivityVisibility(activityType) {
  return VISIBILITY_BY_TYPE[activityType] || 'internal';
}
