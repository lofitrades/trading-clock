/**
 * functions/src/services/jblankedForexFactoryRangeService.ts
 *
 * Purpose: Manual backfill/merge of JBlanked Forex Factory calendar data into
 * the canonical economic events collection starting from 2026-01-01.
 * Creates new canonical events when no NFS match exists while preserving
 * priority logic (NFS > JBlanked-FF > GPT > JBlanked-MT > JBlanked-FXStreet).
 *
 * Changelog:
 * v1.0.1 - 2026-01-21 - Fix Forex Factory range endpoint URL format.
 * v1.0.0 - 2026-01-21 - Initial implementation for manual Forex Factory range backfill.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {config as functionsConfig} from "firebase-functions";
import {
  CanonicalEconomicEvent,
  findExistingCanonicalEvent,
  getCanonicalEventsCollection,
  mergeProviderEvent,
  normalizeEventName,
} from "../models/economicEvent";
import {formatDateISO, parseJblankedDateToTimestamp} from "../utils/dateUtils";

const DEFAULT_FROM_DATE = "2026-01-01";

function getApiKey(): string | undefined {
  try {
    const cfg = functionsConfig();
    if (cfg?.jblanked?.api_key) {
      return cfg.jblanked.api_key as string;
    }
  } catch (error) {
    logger.warn("⚠️ Unable to read functions config for JBlanked API key", {error});
  }

  return process.env.JBLANKED_API_KEY || process.env.NEWS_API_KEY;
}

async function fetchForexFactoryRange(from: string, to: string, apiKey: string) {
  const url = `https://www.jblanked.com/news/api/forex-factory/calendar/range?from=${from}&to=${to}`;
  logger.info("🌐 Fetching JBlanked Forex Factory range", {from, to, url});

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${apiKey}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized JBlanked API access - check API key");
  }
  if (response.status === 429) {
    throw new Error("JBlanked daily rate limit reached (429)");
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JBlanked request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).value)) return (data as any).value;
  throw new Error("Unexpected JBlanked payload format");
}

export async function syncJblankedForexFactorySince(
  fromDate: string = DEFAULT_FROM_DATE
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.error("❌ Missing JBlanked API key (JBLANKED_API_KEY)");
    return;
  }

  const toDate = formatDateISO(new Date());
  let payload: any[] = [];

  try {
    payload = await fetchForexFactoryRange(fromDate, toDate, apiKey);
  } catch (error) {
    logger.error("❌ Failed to fetch JBlanked Forex Factory range", {error});
    return;
  }

  const db = admin.firestore();
  const collection = getCanonicalEventsCollection();
  const mergedMap = new Map<string, CanonicalEconomicEvent>();

  let processed = 0;
  let mergedIntoExisting = 0;
  let createdNew = 0;
  let skipped = 0;

  for (const raw of payload) {
    processed += 1;
    try {
      const rawName = raw.Name || "";
      const normalizedName = normalizeEventName(rawName);
      const currency = raw.Currency
        ? String(raw.Currency).trim().toUpperCase().replace(/^CURRENCY_/, "")
        : null;

      if (!raw.Date) {
        logger.warn("⚠️ Skipping JBlanked FF event with missing date", {rawName});
        skipped += 1;
        continue;
      }

      const datetimeUtc = parseJblankedDateToTimestamp(String(raw.Date));
      const status: CanonicalEconomicEvent["status"] =
        raw.Actual != null && raw.Actual !== "" ? "released" : "scheduled";

      let existingMatch:
        | {eventId: string; event: CanonicalEconomicEvent}
        | undefined;

      if (currency) {
        existingMatch = await findExistingCanonicalEvent({
          normalizedName,
          currency,
          datetimeUtc,
        });

        if (!existingMatch) {
          const fallbackMatch = await findExistingCanonicalEvent({
            normalizedName,
            currency,
            datetimeUtc,
            windowMinutes: 180,
            similarityThreshold: 0.6,
          });

          if (fallbackMatch) {
            existingMatch = fallbackMatch;
            logger.warn("⚠️ JBlanked FF fallback match used (name/time drift)", {
              normalizedName,
              currency,
              datetimeUtc: datetimeUtc.toDate().toISOString(),
              matchedEventId: fallbackMatch.eventId,
            });
          }
        }
      }

      const eventId = existingMatch?.eventId ?? collection.doc().id;
      const existingDoc = existingMatch?.event ??
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      const merged = mergeProviderEvent(existingDoc, {
        provider: "jblanked-ff",
        eventId,
        originalName: rawName,
        normalizedName,
        currency,
        datetimeUtc,
        impact: raw.Strength ?? null,
        category: raw.Category ?? null,
        forecast: raw.Forecast != null ? String(raw.Forecast) : null,
        previous: raw.Previous != null ? String(raw.Previous) : null,
        actual: raw.Actual != null ? String(raw.Actual) : null,
        status,
        raw,
        parsedExtras: {
          outcome: raw.Outcome ?? null,
          strength: raw.Strength ?? null,
          quality: raw.Quality ?? null,
        },
      });

      mergedMap.set(eventId, merged);
      if (existingMatch) {
        mergedIntoExisting += 1;
      } else {
        createdNew += 1;
      }
    } catch (error) {
      logger.error("❌ Error processing JBlanked FF event", {error, raw});
      skipped += 1;
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

  logger.info("✅ JBlanked FF range sync complete", {
    fromDate,
    toDate,
    processed,
    written: entries.length,
    mergedIntoExisting,
    createdNew,
    skipped,
  });
}