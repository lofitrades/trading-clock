/**
 * functions/src/services/gptUploadService.ts
 *
 * Purpose: Ingest GPT-generated economic events into the canonical collection.
 * Performs matching, prevents overwriting primary sources (NFS, JBlanked), and merges as fallback only.
 * Priority: NFS > JBlanked-FF > JBlanked-MT > JBlanked-FXStreet > GPT
 *
 * Changelog:
 * v1.6.0 - 2026-02-06 - BEP CRITICAL FIX: Rescheduled/reinstated events now bypass isPreferredSourcePresent skip. Previously, GPT reschedules were detected but never written because NFS source was present. Now schedule changes (datetime, status) are always applied.
 * v1.5.0 - 2026-02-06 - BEP: Track and return rescheduled/reinstated event counts in response (for admin activity logging).
 * v1.4.0 - 2026-02-06 - BUGFIX: Filter undefined values before Firestore batch write to prevent "undefined is not a valid Firestore value" error on rescheduledFrom field.
 * v1.3.0 - 2026-02-05 - BEP: Added two-phase identity matching (±15 days) for reschedule detection.
 *                       Reinstates cancelled events when they reappear. Matches NFS sync logic.
 * v1.2.0 - 2026-01-21 - BEP Refactor: Use Firestore auto IDs, pass originalName, remove computeEventId.
 * v1.1.0 - 2026-01-21 - Updated PREFERRED_SOURCES to match new priority order.
 * v1.0.0 - 2026-01-16 - Initial GPT uploader with canonical merge logic.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  CanonicalEconomicEvent,
  findByIdentityWindow,
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

// GPT is skipped because it's the lowest priority source; prevent overwriting primary data
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
  let rescheduled = 0;
  let reinstated = 0;

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

      // ========== Two-Phase Matching for Reschedule Detection (v1.3.0) ==========
      // Phase 1: Identity match (±15 days) - catches rescheduled/reinstated events
      let identityMatch = currency
        ? await findByIdentityWindow({
            normalizedName,
            currency,
            datetimeUtc,
            windowDays: 15,
            similarityThreshold: 0.85,
          })
        : undefined;

      let isReschedule = identityMatch?.isReschedule ?? false;

      // Phase 2: Narrow datetime match (±5 min) - for new events
      let existingMatch: {eventId: string; event: CanonicalEconomicEvent} | undefined;

      if (identityMatch) {
        existingMatch = {eventId: identityMatch.eventId, event: identityMatch.event};
        // Log reschedule/reinstatement detection
        if (isReschedule) {
          logger.info(`📅 GPT: Reschedule detected for ${name} (${currency})`, {
            oldDate: identityMatch.event.datetimeUtc?.toDate?.()?.toISOString(),
            newDate: datetimeUtc.toDate().toISOString(),
          });
          rescheduled += 1;
        }
        if (identityMatch.event.status === "cancelled") {
          logger.info(`📢 GPT: Reinstating cancelled event ${name} (${currency})`);
          reinstated += 1;
        }
      } else if (currency) {
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

      // BEP v1.6.0: Allow reschedule/reinstate to update even when preferred sources present
      // Reschedules change the datetime, reinstates change the status - both are schedule changes
      // Only skip normal merges where GPT would overwrite higher-priority source data
      const isCancelledReinstate = existingMatch?.event?.status === "cancelled";
      const shouldForceUpdate = isReschedule || isCancelledReinstate;

      if (existingMatch && isPreferredSourcePresent(existingMatch.event) && !shouldForceUpdate) {
        skipped += 1;
        continue;
      }

      // Use Firestore auto ID if no match, otherwise use existing event ID
      const eventId = existingMatch?.eventId || collection.doc().id;

      const existingDoc = existingMatch?.event ||
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      if (existingDoc && isPreferredSourcePresent(existingDoc) && !shouldForceUpdate) {
        skipped += 1;
        continue;
      }

      const mergedEvent = mergeProviderEvent(existingDoc, {
        provider: "gpt",
        eventId,
        originalName: name,
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
      }, {isReschedule});

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
      // Clean undefined values before writing (Firestore doesn't allow undefined)
      const cleanedCanonical = Object.fromEntries(
        Object.entries(canonical).filter(([, v]) => v !== undefined)
      ) as typeof canonical;
      batch.set(collection.doc(eventId), cleanedCanonical, { merge: true });
    }
    await batch.commit();
  }

  return {
    processed,
    created,
    merged,
    skipped,
    errors,
    rescheduled,
    reinstated,
  };
}
