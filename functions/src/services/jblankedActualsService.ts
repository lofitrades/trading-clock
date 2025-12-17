/**
 * functions/src/services/jblankedActualsService.ts
 *
 * Purpose: Ingest "today" actuals from JBlanked providers (ForexFactory, MQL5/MT, FXStreet)
 * into the canonical economic events collection, enriching schedule data with outcomes.
 *
 * Changelog:
 * v1.1.0 - 2025-12-16 - Prevent JBlanked from creating new events; only merge into existing NFS documents.
 * v1.0.0 - 2025-12-11 - Added multi-provider JBlanked actuals sync with configurable enablement.
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
import {parseJblankedDateToTimestamp} from "../utils/dateUtils";

const PROVIDER_PATH_MAP: Record<"jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet", string> = {
  "jblanked-ff": "forex-factory",
  "jblanked-mt": "mql5",
  "jblanked-fxstreet": "fxstreet",
};

function getJblankedEndpoint(provider: "jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet") {
  return PROVIDER_PATH_MAP[provider];
}

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

export function getEnabledJblankedProvidersFromConfig(): Array<"jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet"> {
  try {
    const cfg = functionsConfig();
    const enabled = (cfg?.jblanked?.enabled as string | undefined) || undefined;
    if (enabled) {
      const list = enabled.split(",").map((s) => s.trim()).filter(Boolean);
      const filtered = list.filter((p) =>
        p === "jblanked-ff" || p === "jblanked-mt" || p === "jblanked-fxstreet"
      ) as Array<"jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet">;
      if (filtered.length > 0) return filtered;
    }
  } catch (error) {
    logger.warn("⚠️ Unable to read JBlanked provider config", {error});
  }

  const envProviders = process.env.JBLANKED_PROVIDERS;
  if (envProviders) {
    const filtered = envProviders.split(",").map((s) => s.trim()).filter(Boolean);
    const normalized = filtered.filter((p) =>
      p === "jblanked-ff" || p === "jblanked-mt" || p === "jblanked-fxstreet"
    ) as Array<"jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet">;
    if (normalized.length > 0) return normalized;
  }

  // Default for free tier
  return ["jblanked-ff"];
}

async function fetchProviderPayload(provider: "jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet", apiKey: string) {
  const path = getJblankedEndpoint(provider);
  const url = `https://www.jblanked.com/news/api/${path}/calendar/today/`;
  logger.info("🌐 Fetching JBlanked provider", {provider, url});

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

export async function syncTodayActualsFromJblankedProvider(
  provider: "jblanked-ff" | "jblanked-mt" | "jblanked-fxstreet"
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.error("❌ Missing JBlanked API key (JBLANKED_API_KEY)");
    return;
  }

  let payload: any[] = [];
  try {
    payload = await fetchProviderPayload(provider, apiKey);
  } catch (error) {
    logger.error("❌ Failed to fetch JBlanked provider", {provider, error});
    return;
  }

  const db = admin.firestore();
  const collection = getCanonicalEventsCollection();
  const mergedMap = new Map<string, CanonicalEconomicEvent>();
  let processed = 0;
  let mergedIntoExisting = 0;
  let skippedMissingBase = 0;

  for (const raw of payload) {
    processed += 1;
    try {
      const rawName = raw.Name || "";
      const normalizedName = normalizeEventName(rawName);
      const currency = raw.Currency ? String(raw.Currency).trim().toUpperCase() : null;
      if (!raw.Date) {
        logger.warn("⚠️ Skipping JBlanked event with missing date", {provider, rawName});
        continue;
      }
      const datetimeUtc = parseJblankedDateToTimestamp(String(raw.Date));
      const status: CanonicalEconomicEvent["status"] =
        raw.Actual != null && raw.Actual !== "" ? "released" : "scheduled";

      const existingMatch = await findExistingCanonicalEvent({
        normalizedName,
        currency,
        datetimeUtc,
      });

      if (!existingMatch) {
        skippedMissingBase += 1;
        logger.debug("ℹ️ Skipping JBlanked event without existing NFS base", {
          provider,
          normalizedName,
          currency,
          datetimeUtc: datetimeUtc.toDate().toISOString(),
        });
        continue;
      }

      const eventId = existingMatch.eventId;
      const existingDoc = existingMatch.event;

      const merged = mergeProviderEvent(existingDoc, {
        provider,
        eventId,
        normalizedName,
        currency,
        datetimeUtc,
        impact: null,
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
      mergedIntoExisting += 1;
    } catch (error) {
      logger.error("❌ Error processing JBlanked event", {provider, error, raw});
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

  logger.info("✅ JBlanked actuals sync complete", {
    provider,
    processed,
    written: entries.length,
    mergedIntoExisting,
    skippedMissingBase,
  });
}

export async function syncTodayActualsFromJblankedAllConfigured(): Promise<void> {
  const providers = getEnabledJblankedProvidersFromConfig();
  for (const provider of providers) {
    await syncTodayActualsFromJblankedProvider(provider);
  }
}
