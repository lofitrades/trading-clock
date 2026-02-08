/**
 * functions/src/services/nfsSyncService.ts
 *
 * Purpose: Sync weekly Forex Factory NFS feed into canonical economic events collection
 * using provider-agnostic merge logic. NFS is the highest-priority schedule source (rank 1).
 * JBlanked and GPT sources enrich NFS data without overwriting core fields.
 *
 * Changelog:
 * v1.5.0 - 2026-02-05 - Integrated activity logging for reschedules, cancellations, and sync completion.
 * v1.4.0 - 2026-02-05 - BEP: Added stale event detection after sync - marks future events not seen for 3+ days as cancelled.
 * v1.3.0 - 2026-02-05 - BEP: Two-phase matching for reschedule detection (±15 day identity match + ±5 min fallback), reschedule logging.
 * v1.2.0 - 2026-01-21 - BEP Refactor: Use Firestore auto IDs, pass originalName, enhanced fuzzy matching.
 * v1.1.0 - 2026-01-21 - Updated priority: NFS is now highest-priority source (rank 1).
 * v1.0.0 - 2025-12-11 - Added NFS weekly sync to canonical economic events model.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  CanonicalEconomicEvent,
  detectStaleEvents,
  findByIdentityWindow,
  findExistingCanonicalEvent,
  getCanonicalEventsCollection,
  mergeProviderEvent,
  normalizeEventName,
} from "../models/economicEvent";
import {parseNfsDateToTimestamp} from "../utils/dateUtils";
import {
  logSyncCompleted,
  logSyncFailed,
  logEventReschedule,
  logEventCancellation,
} from "./activityLoggingService";

interface NfsEconomicEvent {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string | number | null;
  previous?: string | number | null;
  [key: string]: any;
}

export async function syncWeekFromNfs(): Promise<void> {
  const url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
  logger.info("🌐 Fetching NFS weekly calendar", {url});

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    logger.error("❌ NFS fetch failed", {error});
    await logSyncFailed("NFS", `Fetch error: ${error}`);
    return;
  }

  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText;
    logger.error("❌ NFS HTTP error", {status, statusText});
    await logSyncFailed("NFS", `HTTP ${status}: ${statusText}`);
    return;
  }

  let payload: NfsEconomicEvent[];
  try {
    payload = (await response.json()) as NfsEconomicEvent[];
  } catch (error) {
    logger.error("❌ Failed to parse NFS payload", {error});
    await logSyncFailed("NFS", `JSON parse error: ${error}`);
    return;
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    logger.warn("⚠️ NFS payload empty or malformed", {count: Array.isArray(payload) ? payload.length : "n/a"});
    return;
  }

  const db = admin.firestore();
  const collection = getCanonicalEventsCollection();
  const mergedMap = new Map<string, CanonicalEconomicEvent>();
  let processed = 0;
  let createdOrUpdated = 0;
  let rescheduledCount = 0;

  for (const raw of payload) {
    processed += 1;
    try {
      const rawName = raw.title || "";
      const normalizedName = normalizeEventName(rawName);
      const currency = raw.country ? raw.country.trim().toUpperCase() : null;
      if (!raw.date) {
        logger.warn("⚠️ Skipping NFS event with missing date", {title: rawName});
        continue;
      }
      const datetimeUtc = parseNfsDateToTimestamp(raw.date);
      const status: "scheduled" = "scheduled";

      // ========== Two-Phase Matching for Reschedule Detection (v1.3.0) ==========

      // Phase 1: Identity match (±15 days) - catches reschedules
      let identityMatch = await findByIdentityWindow({
        normalizedName,
        currency,
        datetimeUtc,
        windowDays: 15,
        similarityThreshold: 0.85,
      });

      let isReschedule = identityMatch?.isReschedule ?? false;

      // Phase 2: Narrow datetime match (±5 min) - for new events with similar times
      // Only if identity match didn't find anything
      let existingMatch: {eventId: string; event: CanonicalEconomicEvent} | undefined;

      if (identityMatch) {
        existingMatch = {eventId: identityMatch.eventId, event: identityMatch.event};
      } else {
        const narrowMatch = await findExistingCanonicalEvent({
          normalizedName,
          currency,
          datetimeUtc,
        });
        if (narrowMatch) {
          existingMatch = narrowMatch;
          isReschedule = false;
        }
      }

      // ========== Reschedule Logging ==========
      if (isReschedule && existingMatch) {
        const oldDate = existingMatch.event.datetimeUtc.toDate();
        const newDate = datetimeUtc.toDate();
        const daysDiff = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));
        logger.info("📅 EVENT RESCHEDULED DETECTED", {
          eventName: rawName,
          currency,
          oldDatetime: oldDate.toISOString(),
          newDatetime: newDate.toISOString(),
          daysDiff,
        });

        // Log reschedule activity
        await logEventReschedule(
          rawName,
          oldDate.toISOString().split("T")[0],
          newDate.toISOString().split("T")[0],
          currency
        );

        rescheduledCount += 1;
      }

      // Use Firestore auto ID if no match found, otherwise use existing event ID
      const eventId = existingMatch?.eventId ?? collection.doc().id;

      const existingDoc = existingMatch?.event ??
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      const merged = mergeProviderEvent(
        existingDoc,
        {
          provider: "nfs",
          eventId,
          originalName: rawName,
          normalizedName,
          currency,
          datetimeUtc,
          impact: raw.impact ?? null,
          category: null,
          forecast: raw.forecast != null ? String(raw.forecast) : null,
          previous: raw.previous != null ? String(raw.previous) : null,
          actual: null,
          status,
          raw,
          parsedExtras: {},
        },
        {isReschedule} // Pass reschedule flag to merge function
      );

      // Validate merged event
      if (!merged.eventId) {
        logger.error("❌ Merged event missing eventId", {rawName, eventId});
        continue;
      }
      if (!merged.name && !merged.normalizedName) {
        logger.error("❌ Merged event missing names", {eventId, rawName});
        continue;
      }

      mergedMap.set(eventId, merged);
      createdOrUpdated += 1;
      
      // Log first 3 events for debugging
      if (createdOrUpdated <= 3) {
        logger.info("✨ Event merged", {
          index: createdOrUpdated,
          eventId,
          name: merged.name,
          normalizedName: merged.normalizedName,
          isNew: !existingDoc,
          isReschedule,
        });
      }
    } catch (error) {
      logger.error("❌ Error processing NFS event", {error, raw});
    }
  }

  const entries = [...mergedMap.entries()];
  
  if (entries.length === 0) {
    logger.warn("⚠️ No events to write after processing", {processed});
    return;
  }

  logger.info("📝 Preparing to write events", {
    totalEvents: entries.length,
    sampleEventIds: entries.slice(0, 3).map(([id]) => id),
  });

  const batchSize = 400;
  let batchesWritten = 0;
  
  try {
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = db.batch();
      const slice = entries.slice(i, i + batchSize);
      
      for (const [eventId, canonical] of slice) {
        const docRef = collection.doc(eventId);
        batch.set(docRef, canonical, {merge: true});
        
        // Log first event for verification
        if (i === 0 && slice.indexOf([eventId, canonical]) === 0) {
          logger.info("📄 Sample event to write", {
            eventId,
            name: canonical.name,
            normalizedName: canonical.normalizedName,
            currency: canonical.currency,
            datetime: canonical.datetimeUtc.toDate().toISOString(),
            hasOriginalName: !!canonical.sources?.nfs?.originalName,
            createdBy: canonical.createdBy,
          });
        }
      }
      
      await batch.commit();
      batchesWritten += 1;
      logger.info("✍️ Batch committed", {
        batchNumber: batchesWritten,
        eventsInBatch: slice.length,
      });
    }

    logger.info("✅ NFS weekly sync complete", {
      processed,
      written: entries.length,
      createdOrUpdated,
      rescheduled: rescheduledCount,
      batchesWritten,
    });

    // Log activity to dashboard
    await logSyncCompleted(
      "NFS",
      processed,
      createdOrUpdated - rescheduledCount,
      createdOrUpdated,
      rescheduledCount,
      0 // Will be populated after stale detection
    );

    // ========== Phase 3: Stale Event Detection ==========
    // After sync, check for future events that disappeared from feed
    try {
      const staleResult = await detectStaleEvents({staleDays: 3, dryRun: false});
      if (staleResult.detected > 0) {
        logger.warn("⚠️ STALE EVENTS DETECTED - Marked as cancelled", {
          detected: staleResult.detected,
          updated: staleResult.updated,
          events: staleResult.events.slice(0, 5), // Log first 5 for brevity
        });

        // Log each cancelled event
        for (const staleEvent of staleResult.events.slice(0, 10)) {
          await logEventCancellation(
            staleEvent.name,
            staleEvent.currency || "N/A",
            "Not seen in feed for 3+ days"
          );
        }
      } else {
        logger.info("✅ No stale events detected");
      }
    } catch (staleError) {
      // Don't fail the sync if stale detection fails
      logger.error("❌ Stale event detection failed (non-fatal)", {error: staleError});
    }
  } catch (error) {
    logger.error("❌ Batch write failed", {
      error,
      batchesWritten,
      totalEntries: entries.length,
    });
    throw error;
  }
}
