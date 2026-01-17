/**
 * functions/src/services/gptUploadService.ts
 *
 * Purpose: Ingest GPT-generated economic events into the canonical collection.
 * Performs matching, prevents overwriting NFS/JBlanked sources, and merges as fallback only.
 *
 * Changelog:
 * v1.0.0 - 2026-01-16 - Initial GPT uploader with canonical merge logic.
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

export interface GptUploadEventInput {
  eventId?: string | null;
  name?: string;
  currency?: string | null;
  category?: string | null;
  impact?: string | null;
  datetimeUtc?: string;
  status?: CanonicalEconomicEvent["status"];
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  sources?: {
    gpt?: {
      raw?: any;
      parsed?: {
        actual?: string | null;
        forecast?: string | null;
        previous?: string | null;
        outcome?: string | null;
        strength?: string | null;
        quality?: string | null;
      };
    };
  };
}

const PREFERRED_SOURCES = ["nfs", "jblanked-ff", "jblanked-mt", "jblanked-fxstreet"] as const;

const isPreferredSourcePresent = (event?: CanonicalEconomicEvent) => {
  if (!event?.sources) return false;
  return PREFERRED_SOURCES.some((key) => Boolean(event.sources[key]));
};

const parseUtcTimestamp = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
};

const normalizeCurrency = (value?: string | null) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

const toStringOrNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

export async function uploadGptEventsBatch(events: GptUploadEventInput[]) {
  const collection = getCanonicalEventsCollection();
  const db = admin.firestore();

  const mergedMap = new Map<string, CanonicalEconomicEvent>();
  let processed = 0;
  let created = 0;
  let merged = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    processed += 1;
    try {
      const name = toStringOrNull(event?.name);
      if (!name) {
        errors += 1;
        continue;
      }

      const datetimeUtc = parseUtcTimestamp(event?.datetimeUtc);
      if (!datetimeUtc) {
        errors += 1;
        continue;
      }

      const currency = normalizeCurrency(event?.currency);
      const normalizedName = normalizeEventName(name);
      const parsed = event?.sources?.gpt?.parsed || {};
      const raw = event?.sources?.gpt?.raw || {};

      const actual = toStringOrNull(parsed.actual ?? event?.actual);
      const forecast = toStringOrNull(parsed.forecast ?? event?.forecast);
      const previous = toStringOrNull(parsed.previous ?? event?.previous);

      const status: CanonicalEconomicEvent["status"] =
        event?.status || (actual ? "released" : "scheduled");

      const impact = toStringOrNull(event?.impact);
      const category = toStringOrNull(event?.category);

      const existingMatch = currency
        ? await findExistingCanonicalEvent({
            normalizedName,
            currency,
            datetimeUtc,
          })
        : undefined;

      if (existingMatch && isPreferredSourcePresent(existingMatch.event)) {
        skipped += 1;
        continue;
      }

      const eventId = existingMatch?.eventId ||
        computeEventId({ currency, normalizedName, datetimeUtc });

      const existingDoc = existingMatch?.event ||
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      if (existingDoc && isPreferredSourcePresent(existingDoc)) {
        skipped += 1;
        continue;
      }

      const mergedEvent = mergeProviderEvent(existingDoc, {
        provider: "gpt",
        eventId,
        normalizedName,
        currency,
        datetimeUtc,
        impact,
        category,
        forecast,
        previous,
        actual,
        status,
        raw,
        parsedExtras: {
          outcome: toStringOrNull(parsed.outcome),
          strength: toStringOrNull(parsed.strength),
          quality: toStringOrNull(parsed.quality),
        },
      });

      mergedMap.set(eventId, mergedEvent);
      if (existingDoc) {
        merged += 1;
      } else {
        created += 1;
      }
    } catch (error) {
      errors += 1;
      logger.error("❌ GPT upload event failed", { error });
    }
  }

  const entries = [...mergedMap.entries()];
  const batchSize = 400;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = db.batch();
    const slice = entries.slice(i, i + batchSize);
    for (const [eventId, canonical] of slice) {
      batch.set(collection.doc(eventId), canonical, { merge: true });
    }
    await batch.commit();
  }

  return {
    processed,
    created,
    merged,
    skipped,
    errors,
  };
}
