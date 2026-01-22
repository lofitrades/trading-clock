/**
 * functions/src/services/nfsSyncService.ts
 *
 * Purpose: Sync weekly Forex Factory NFS feed into canonical economic events collection
 * using provider-agnostic merge logic. NFS is the highest-priority schedule source (rank 1).
 * JBlanked and GPT sources enrich NFS data without overwriting core fields.
 *
 * Changelog:
 * v1.2.0 - 2026-01-21 - BEP Refactor: Use Firestore auto IDs, pass originalName, enhanced fuzzy matching.
 * v1.1.0 - 2026-01-21 - Updated priority: NFS is now highest-priority source (rank 1).
 * v1.0.0 - 2025-12-11 - Added NFS weekly sync to canonical economic events model.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  CanonicalEconomicEvent,
  findExistingCanonicalEvent,
  getCanonicalEventsCollection,
  mergeProviderEvent,
  normalizeEventName,
} from "../models/economicEvent";
import {parseNfsDateToTimestamp} from "../utils/dateUtils";

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
    return;
  }

  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText;
    logger.error("❌ NFS HTTP error", {status, statusText});
    return;
  }

  let payload: NfsEconomicEvent[];
  try {
    payload = (await response.json()) as NfsEconomicEvent[];
  } catch (error) {
    logger.error("❌ Failed to parse NFS payload", {error});
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

      const existingMatch = await findExistingCanonicalEvent({
        normalizedName,
        currency,
        datetimeUtc,
      });

      // Use Firestore auto ID if no match found, otherwise use existing event ID
      const eventId = existingMatch?.eventId ?? collection.doc().id;

      const existingDoc = existingMatch?.event ??
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      const merged = mergeProviderEvent(existingDoc, {
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
      });

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
      batchesWritten,
    });
  } catch (error) {
    logger.error("❌ Batch write failed", {
      error,
      batchesWritten,
      totalEntries: entries.length,
    });
    throw error;
  }
}
