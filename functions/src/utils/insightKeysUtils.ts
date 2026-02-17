/**
 * functions/src/utils/insightKeysUtils.ts
 *
 * Purpose: Backend (Cloud Functions) version of insightKeys computation utilities.
 * Mirrors frontend src/utils/insightKeysUtils.js for use in backfill + backend sync.
 *
 * BEP: Pure functions, no side effects, deterministic, testable.
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP P5: Annotated VISIBILITY_BY_TYPE with producer status (✅ active / 📋 planned)
 * v1.0.0 - 2026-02-09 - Phase 2: Initial backend implementation
 */

/**
 * 25 canonical economic event slugs
 */
export const BLOG_ECONOMIC_EVENTS = [
  "nfp", "fomc", "cpi", "ppi", "rba", "ecb", "boe", "boj", "snb", "rbnz",
  "china-gdp", "china-pmi", "eurozone-gdp", "eurozone-pmi",
  "uk-gdp", "uk-pmi", "japan-gdp", "japan-pmi", "canada-gdp", "ism-pmi",
  "unemployment", "retail-sales", "housing-starts", "consumer-sentiment", "oil-inventory",
];

/**
 * 17 canonical currency codes
 */
export const BLOG_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD",
  "CNY", "SGD", "HKD", "INR", "MXN", "BRL", "KRW", "SEK", "NOK",
];

/**
 * Visibility mapping by activity type
 *
 * Producer status key:
 *   ✅ = Active producer exists in codebase (wired in P0-P3)
 *   📋 = Planned for future implementation (no producer yet)
 *
 * Unknown types not in this map default to "internal" via determineActivityVisibility().
 */
const VISIBILITY_BY_TYPE: Record<string, "public" | "internal" | "admin"> = {
  // ── Active: Public (visible to all authenticated users) ────────────────
  event_rescheduled: "public",       // ✅ nfsSyncService, gptUploadService
  event_cancelled: "public",         // ✅ nfsSyncService (stale detection)
  event_reinstated: "public",        // ✅ nfsSyncService, gptUploadService, jblankedFFRangeService
  blog_published: "public",          // ✅ index.ts onBlogPostWrite trigger

  // ── Active: Internal (visible to admin/internal roles) ─────────────────
  sync_completed: "internal",        // ✅ nfsSyncService, jblankedActualsService, jblankedFFRangeService
  sync_failed: "internal",           // ✅ nfsSyncService, jblankedActualsService, jblankedFFRangeService
  blog_created: "internal",          // ✅ gptBlogActionsService
  gpt_upload: "internal",            // ✅ index.ts uploadGptEvents callable

  // ── Active: Admin (visible to admin only) ──────────────────────────────
  user_signup: "admin",              // ✅ index.ts onUserCreated trigger

  // ── Planned: Public (no producer yet) ──────────────────────────────────
  event_created: "public",           // 📋 Future: manual event creation UI
  event_deleted: "public",           // 📋 Future: manual event deletion UI
  event_updated: "public",           // 📋 Future: manual event editing UI
  canonical_event_updated: "public", // 📋 Future: canonical event diff tracking

  // ── Planned: Internal (no producer yet) ────────────────────────────────
  blog_updated: "internal",          // 📋 Future: blog edit trigger
  blog_deleted: "internal",          // 📋 Future: blog delete trigger
  event_description_created: "internal", // 📋 Future: event description CRUD
  event_description_updated: "internal", // 📋 Future: event description CRUD
  event_description_deleted: "internal", // 📋 Future: event description CRUD
  blog_author_created: "internal",   // 📋 Future: blog author CRUD
  blog_author_updated: "internal",   // 📋 Future: blog author CRUD
  blog_author_deleted: "internal",   // 📋 Future: blog author CRUD
  events_exported: "internal",       // 📋 Future: export tracking

  // ── Planned: Admin (no producer yet) ───────────────────────────────────
  settings_changed: "admin",         // 📋 Future: settings audit trail
};

/**
 * Normalize a string for slug matching (uses hyphens to match BLOG_ECONOMIC_EVENTS)
 */
export function normalizeKey(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Look up canonical slug for an event name
 */
export function findCanonicalSlug(eventName: string): string | null {
  if (!eventName) return null;

  const normalized = normalizeKey(eventName);

  if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
    return normalized;
  }

  const partial = BLOG_ECONOMIC_EVENTS.find(
    (slug) => slug.includes(normalized) || normalized.includes(slug)
  );

  return partial || null;
}

/**
 * Compute insightKeys for a blog post
 */
export function computeBlogInsightKeys(post: {
  id?: string;
  eventTags?: string[];
  currencyTags?: string[];
}): string[] {
  const keys: string[] = [];

  if (post.id) {
    keys.push(`post:${post.id}`);
  }

  const eventTags = Array.isArray(post.eventTags) ? post.eventTags : [];
  eventTags.forEach((tag) => {
    const normalized = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
      keys.push(`event:${normalized}`);
    } else if (normalized) {
      keys.push(`eventNameKey:${normalized}`);
    }
  });

  const currencyTags = Array.isArray(post.currencyTags) ? post.currencyTags : [];
  currencyTags.forEach((code) => {
    const normalized = code.toUpperCase();
    if (BLOG_CURRENCIES.includes(normalized)) {
      keys.push(`currency:${normalized}`);
    }
  });

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

  return Array.from(new Set(keys));
}

/**
 * Compute insightKeys for an activity log entry
 */
export function computeActivityInsightKeys(
  activityType: string,
  metadata: Record<string, any> = {}
): string[] {
  const keys: string[] = [];

  if (metadata.postId) {
    keys.push(`post:${metadata.postId}`);
  }

  // Blog-related activities may carry eventTags/currencyTags
  const eventTags = Array.isArray(metadata.eventTags) ? metadata.eventTags : [];
  const currencyTags = Array.isArray(metadata.currencyTags) ? metadata.currencyTags : [];

  eventTags.forEach((tag: string) => {
    const normalized = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(normalized)) {
      keys.push(`event:${normalized}`);
    } else if (normalized) {
      keys.push(`eventNameKey:${normalized}`);
    }
  });

  currencyTags.forEach((code: string) => {
    const normalized = code.toUpperCase();
    if (BLOG_CURRENCIES.includes(normalized)) {
      keys.push(`currency:${normalized}`);
    }
  });

  let eventSlug: string | null = null;
  if (metadata.eventName) {
    eventSlug = findCanonicalSlug(metadata.eventName);
    if (eventSlug) {
      keys.push(`event:${eventSlug}`);
    } else {
      keys.push(`eventNameKey:${normalizeKey(metadata.eventName)}`);
    }
  }

  let currencyCode: string | null = null;
  const rawCurrency = metadata.currencyCode || metadata.currency;
  if (rawCurrency) {
    const upper: string = rawCurrency.toUpperCase();
    currencyCode = upper;
    if (BLOG_CURRENCIES.includes(upper)) {
      keys.push(`currency:${upper}`);
    }
  }

  if (eventSlug && currencyCode && BLOG_CURRENCIES.includes(currencyCode!)) {
    keys.push(`eventCurrency:${eventSlug}_${currencyCode}`);
  }

  eventTags.forEach((tag: string) => {
    const eventNorm = normalizeKey(tag);
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm)) {
      currencyTags.forEach((code: string) => {
        const currNorm = code.toUpperCase();
        if (BLOG_CURRENCIES.includes(currNorm)) {
          keys.push(`eventCurrency:${eventNorm}_${currNorm}`);
        }
      });
    }
  });

  return Array.from(new Set(keys));
}

/**
 * Compute insightKeys for an event note
 */
export function computeNoteInsightKeys(note: {
  primaryNameKey?: string;
  nameKey?: string;
  currencyKey?: string;
  dateKey?: string;
}): string[] {
  const keys: string[] = [];
  const nameKey = note.primaryNameKey || note.nameKey;

  if (nameKey) {
    const eventNorm = normalizeKey(nameKey);
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm)) {
      keys.push(`event:${eventNorm}`);
    } else if (eventNorm) {
      keys.push(`eventNameKey:${eventNorm}`);
    }
  }

  if (note.currencyKey) {
    const currCode = note.currencyKey.toUpperCase();
    if (BLOG_CURRENCIES.includes(currCode)) {
      keys.push(`currency:${currCode}`);
    }
  }

  if (nameKey && note.currencyKey) {
    const eventNorm = normalizeKey(nameKey);
    const currCode = note.currencyKey.toUpperCase();
    if (BLOG_ECONOMIC_EVENTS.includes(eventNorm) && BLOG_CURRENCIES.includes(currCode)) {
      keys.push(`eventCurrency:${eventNorm}_${currCode}`);
    }
  }

  return Array.from(new Set(keys));
}

/**
 * Get visibility level for an activity type
 */
export function determineActivityVisibility(activityType: string): "public" | "internal" | "admin" {
  return VISIBILITY_BY_TYPE[activityType] || "internal";
}
