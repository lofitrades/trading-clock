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
 * v1.1.0 - 2026-02-05 - Added deduplication via deterministic document IDs for sync/event activities.
 * v1.0.0 - 2026-02-05 - Initial implementation with activity logging functions.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export interface ActivityLog {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
  source: "backend" | "frontend";
  createdAt: admin.firestore.FieldValue;
}

const ACTIVITY_COLLECTION = "systemActivityLog";

/**
 * Generate a deterministic document ID for deduplication
 * Format: {type}_{source}_{date}_{hash} where hash is based on key identifiers
 */
function generateActivityId(
  type: string,
  dedupeKey?: string
): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (dedupeKey) {
    // Use provided key for more granular deduplication (e.g., eventId)
    return `${type}_${today}_${dedupeKey}`;
  }
  // Default: one activity per type per day
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
      source: "backend",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use deterministic ID to prevent duplicates
    const docId = generateActivityId(type, dedupeKey);
    await db.collection(ACTIVITY_COLLECTION).doc(docId).set(activity, {merge: false});
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
  cancelledCount: number = 0
): Promise<void> {
  const dedupeKey = source.toLowerCase().replace(/\s+/g, "_");
  await logActivity(
    "sync_completed",
    `${source} sync completed`,
    `Processed ${eventsProcessed} events: ${eventsCreated} created, ${eventsUpdated} updated, ${rescheduledCount} rescheduled, ${cancelledCount} cancelled`,
    "success",
    {source, eventsProcessed, eventsCreated, eventsUpdated, rescheduledCount, cancelledCount},
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
 */
export async function logBlogPublished(
  postTitle: string,
  postId: string,
  languages: string[]
): Promise<void> {
  const dedupeKey = postId;
  await logActivity(
    "blog_published",
    `Blog post published: ${postTitle}`,
    `Published in ${languages.join(", ")}`,
    "success",
    {postTitle, postId, languages},
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
