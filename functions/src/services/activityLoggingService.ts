/**
 * functions/src/services/activityLoggingService.ts
 *
 * Purpose: Log system activities to Firestore for admin dashboard audit trail.
 * Records event reschedules, cancellations, syncs, blog publishes, etc.
 *
 * Deduplication Strategy:
 * - Sync activities use date-based deterministic IDs (one per source per day)
 * - Event changes use event-based deterministic IDs (one per event per action)
 * - This prevents duplicate logs when Cloud Functions retry or are called multiple times
 *
 * Changelog:
 * v1.5.0 - 2026-02-10 - BEP DEDUP FIX: generateActivityId no longer embeds UTC today in event-based
 *                        activity IDs. Cloud Functions running across UTC midnight (e.g. 5 PM CST =
 *                        Feb 10 UTC, 9 PM CST = Feb 11 UTC) were creating DUPLICATE documents for the
 *                        same event reschedule because the UTC date differed. Fix: event-based IDs
 *                        use {type}_{dedupeKey} only (no date). Sync-based IDs retain {type}_{today}
 *                        for daily-granularity dedup. Also uses merge:true so re-runs update existing
 *                        docs with latest visibility/insightKeys instead of failing on overwrites.
 * v1.4.0 - 2026-02-10 - BEP P4: logBlogPublished accepts optional eventTags/currencyTags for insightKeys enrichment
 * v1.3.0 - 2026-02-10 - BEP P2: logSyncCompleted accepts optional currencyTags for insightKeys enrichment
 * v1.2.0 - 2026-02-09 - Phase 7: Added visibility field to all activity logs for role-based Insights filtering
 * v1.1.0 - 2026-02-05 - Added deduplication via deterministic document IDs for sync/event activities.
 * v1.0.0 - 2026-02-05 - Initial implementation with activity logging functions.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { computeActivityInsightKeys, determineActivityVisibility } from "../utils/insightKeysUtils";

export interface ActivityLog {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
  insightKeys: string[];
  visibility: "public" | "internal" | "admin";
  source: "backend" | "frontend";
  createdAt: admin.firestore.FieldValue;
}

const ACTIVITY_COLLECTION = "systemActivityLog";

/**
 * Generate a deterministic document ID for deduplication.
 *
 * BEP v1.5.0 FIX: Event-based IDs no longer embed UTC today.
 * Cloud Functions run at different UTC dates within the same local day
 * (e.g. 5 PM CST = Feb 10 UTC, 9 PM CST = Feb 11 UTC). Embedding today
 * in the ID caused DUPLICATE documents for the same event reschedule.
 *
 * Strategy:
 *   - WITH dedupeKey (event changes): {type}_{dedupeKey} — one doc per event action, period.
 *     Re-runs overwrite the same doc via merge:true, keeping data fresh.
 *   - WITHOUT dedupeKey (sync summaries): {type}_{today} — one doc per type per UTC day.
 */
function generateActivityId(
  type: string,
  dedupeKey?: string
): string {
  if (dedupeKey) {
    // Event-based: stable ID regardless of when the sync runs
    return `${type}_${dedupeKey}`;
  }
  // Sync-based: one per type per UTC day
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${type}_${today}`;
}

/**
 * Log an activity to Firestore
 * @param dedupeKey - Optional key for deduplication (e.g., source name, event ID)
 *                    If provided, ensures only one log per type+key+day
 */
export async function logActivity(
  type: string,
  title: string,
  description: string,
  severity: "info" | "warning" | "error" | "success" = "info",
  metadata: Record<string, any> = {},
  dedupeKey?: string
): Promise<void> {
  try {
    const db = admin.firestore();
    const activity: ActivityLog = {
      type,
      title,
      description,
      severity,
      metadata,
      insightKeys: computeActivityInsightKeys(type, metadata),
      visibility: determineActivityVisibility(type),
      source: "backend",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use deterministic ID to prevent duplicates.
    // BEP v1.5.0: merge:true ensures re-runs update existing docs with
    // latest visibility/insightKeys/createdAt (fixes missing fields on old docs).
    const docId = generateActivityId(type, dedupeKey);
    await db.collection(ACTIVITY_COLLECTION).doc(docId).set(activity, {merge: true});
    logger.info(`✅ Activity logged: ${type}`, {title, severity, docId});
  } catch (error) {
    logger.error("❌ Failed to log activity", {type, title, error});
  }
}

/**
 * Log event reschedule
 * Dedupe by event name + original date to allow multiple reschedules per event
 */
export async function logEventReschedule(
  eventName: string,
  originalDate: string,
  newDate: string,
  currency: string | null
): Promise<void> {
  const currencyStr = currency || "Unknown";
  // Dedupe key: eventName + originalDate (allows logging same event rescheduled multiple times)
  const dedupeKey = `${eventName.replace(/\s+/g, "_")}_${originalDate}`;
  await logActivity(
    "event_rescheduled",
    `${eventName} rescheduled`,
    `Event rescheduled from ${originalDate} to ${newDate} (${currencyStr})`,
    "warning",
    {eventName, originalDate, newDate, currency},
    dedupeKey
  );
}

/**
 * Log event cancellation
 * Dedupe by event name + currency
 */
export async function logEventCancellation(
  eventName: string,
  currency: string,
  reason: string = "Not seen in feed for 3+ days"
): Promise<void> {
  const dedupeKey = `${eventName.replace(/\s+/g, "_")}_${currency}`;
  await logActivity(
    "event_cancelled",
    `${eventName} cancelled`,
    `Event marked as cancelled (${currency}). ${reason}`,
    "warning",
    {eventName, currency, reason},
    dedupeKey
  );
}

/**
 * Log event reinstatement
 * Dedupe by event name + currency
 */
export async function logEventReinstatement(
  eventName: string,
  currency: string
): Promise<void> {
  const dedupeKey = `${eventName.replace(/\s+/g, "_")}_${currency}`;
  await logActivity(
    "event_reinstated",
    `${eventName} reinstated`,
    `Previously cancelled event reappeared in feed (${currency})`,
    "success",
    {eventName, currency},
    dedupeKey
  );
}

/**
 * Log sync completion
 * Dedupe by source - only ONE sync_completed per source per day
 */
export async function logSyncCompleted(
  source: string,
  eventsProcessed: number,
  eventsCreated: number,
  eventsUpdated: number,
  rescheduledCount: number = 0,
  cancelledCount: number = 0,
  options?: { currencyTags?: string[] }
): Promise<void> {
  const dedupeKey = source.toLowerCase().replace(/\s+/g, "_");
  const metadata: Record<string, any> = {
    source, eventsProcessed, eventsCreated, eventsUpdated, rescheduledCount, cancelledCount,
  };
  // P2: Enrich sync metadata with currencies for insightKeys population
  if (options?.currencyTags?.length) {
    metadata.currencyTags = options.currencyTags;
  }
  await logActivity(
    "sync_completed",
    `${source} sync completed`,
    `Processed ${eventsProcessed} events: ${eventsCreated} created, ${eventsUpdated} updated, ${rescheduledCount} rescheduled, ${cancelledCount} cancelled`,
    "success",
    metadata,
    dedupeKey
  );
}

/**
 * Log sync failure
 * Dedupe by source - only ONE sync_failed per source per day
 */
export async function logSyncFailed(
  source: string,
  error: string
): Promise<void> {
  const dedupeKey = source.toLowerCase().replace(/\s+/g, "_");
  await logActivity(
    "sync_failed",
    `${source} sync failed`,
    `Sync error: ${error}`,
    "error",
    {source, error},
    dedupeKey
  );
}

/**
 * Log blog post publication
 * Dedupe by post ID - only ONE log per post per day
 * @param eventTags - Optional economic event tags for insightKeys enrichment
 * @param currencyTags - Optional currency tags for insightKeys enrichment
 */
export async function logBlogPublished(
  postTitle: string,
  postId: string,
  languages: string[],
  eventTags?: string[],
  currencyTags?: string[]
): Promise<void> {
  const dedupeKey = postId;
  const metadata: Record<string, any> = {postTitle, postId, languages};
  // P4: Enrich blog_published metadata with event+currency tags for insightKeys
  if (eventTags?.length) {
    metadata.eventTags = eventTags;
  }
  if (currencyTags?.length) {
    metadata.currencyTags = currencyTags;
  }
  await logActivity(
    "blog_published",
    `Blog post published: ${postTitle}`,
    `Published in ${languages.join(", ")}`,
    "success",
    metadata,
    dedupeKey
  );
}

/**
 * Log GPT event upload
 * Dedupe by event name - only ONE log per event upload per day
 */
export async function logGptUpload(
  eventName: string,
  eventCount: number,
  source: string = "GPT"
): Promise<void> {
  const dedupeKey = `${eventName.replace(/\s+/g, "_")}_${source}`;
  await logActivity(
    "gpt_upload",
    `${eventCount} events uploaded via ${source}`,
    `Added/updated: ${eventName}`,
    "info",
    {eventName, eventCount, source},
    dedupeKey
  );
}

/**
 * Log user signup
 * Dedupe by user ID - only ONE signup log per user per day
 */
export async function logUserSignup(
  userId: string,
  email: string
): Promise<void> {
  const dedupeKey = userId;
  await logActivity(
    "user_signup",
    "New user registered",
    `User ${email} created (ID: ${userId})`,
    "info",
    {userId, email},
    dedupeKey
  );
}
