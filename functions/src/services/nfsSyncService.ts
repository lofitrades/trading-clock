/**
 * functions/src/services/nfsSyncService.ts
 *
 * Purpose: Sync weekly Forex Factory NFS feed into canonical economic events collection
 * using provider-agnostic merge logic. Acts as the breadth/schedule source while
 * JBlanked providers supply depth/actuals.
 *
 * Changelog:
 * v1.0.0 - 2025-12-11 - Added NFS weekly sync to canonical economic events model.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  CanonicalEconomicEvent,
  computeEventId,
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

      const eventId = existingMatch?.eventId ??
        computeEventId({currency, normalizedName, datetimeUtc});

      const existingDoc = existingMatch?.event ??
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      const merged = mergeProviderEvent(existingDoc, {
        provider: "nfs",
        eventId,
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

      mergedMap.set(eventId, merged);
      createdOrUpdated += 1;
    } catch (error) {
      logger.error("❌ Error processing NFS event", {error, raw});
    }
  }

  const entries = [...mergedMap.entries()];
  const batchSize = 400;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = db.batch();
    const slice = entries.slice(i, i + batchSize);
    for (const [eventId, canonical] of slice) {
      batch.set(collection.doc(eventId), canonical, {merge: true});
    }
    await batch.commit();
  }

  logger.info("✅ NFS weekly sync complete", {
    processed,
    written: entries.length,
    createdOrUpdated,
  });
}
