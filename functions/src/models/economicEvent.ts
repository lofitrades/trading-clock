/**
 * functions/src/models/economicEvent.ts
 *
 * Purpose: Canonical economic event model for multi-source redundancy.
 * Provides provider-agnostic types, normalization, deterministic IDs, merge logic,
 * and Firestore helpers to unify NFS weekly schedules with JBlanked actuals.
 *
 * Changelog:
 * v1.2.1 - 2026-01-21 - BEP Refactor: Defensive source initialization for legacy canonical docs.
 * v1.2.0 - 2026-01-21 - BEP Refactor: Added Firestore auto IDs, normalizedName field, originalName per source, name priority picker, dual-mode backwards compatibility.
 * v1.1.0 - 2026-01-21 - Updated source priority: NFS (highest), JBlanked-FF, GPT, JBlanked-MT, JBlanked-FXStreet (lowest).
 * v1.0.1 - 2026-01-16 - Added GPT as lowest-priority provider for fallback-only canonical merges.
 * v1.0.0 - 2025-12-11 - Initial canonical model, normalization, merge utilities, and helpers.
 */

import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

export type ProviderSourceName =
  | "nfs"
  | "jblanked-ff"
  | "jblanked-mt"
  | "jblanked-fxstreet"
  | string;

export interface CanonicalSourceData {
  originalName: string;
  lastSeenAt: FirebaseFirestore.Timestamp;
  raw: any;
  parsed?: {
    actual?: string | null;
    forecast?: string | null;
    previous?: string | null;
    outcome?: string | null;
    strength?: string | null;
    quality?: string | null;
  };
}

export interface CanonicalEconomicEvent {
  eventId: string;
  name: string;
  normalizedName: string;
  currency: string | null;
  category: string | null;
  impact: string | null;
  datetimeUtc: FirebaseFirestore.Timestamp;
  timezoneSource: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  status: "scheduled" | "released" | "revised" | "cancelled";
  sources: {
    [key in ProviderSourceName]?: CanonicalSourceData;
  };
  createdBy?: ProviderSourceName;
  winnerSource?: ProviderSourceName;
  qualityScore?: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Priority order for picking values: lower index = higher priority
// 1. NFS (Forex Factory) - primary schedule source
// 2. JBlanked-FF (Forex Factory) - live actuals updates
// 3. GPT (generated) - fallback enrichment
// 4. JBlanked-MT (MQL5) - alternative actuals
// 5. JBlanked-FXStreet - fallback actuals
const PROVIDER_PRIORITY: ProviderSourceName[] = [
  "nfs",
  "jblanked-ff",
  "gpt",
  "jblanked-mt",
  "jblanked-fxstreet",
];

// Quality scores for each provider (informational, ordered by priority)
const PROVIDER_QUALITY: Record<ProviderSourceName, number> = {
  nfs: 100,
  "jblanked-ff": 95,
  gpt: 60,
  "jblanked-mt": 90,
  "jblanked-fxstreet": 85,
};

const STATUS_ORDER: Record<CanonicalEconomicEvent["status"], number> = {
  scheduled: 0,
  released: 1,
  revised: 2,
  cancelled: 3,
};

export const CANONICAL_EVENTS_ROOT = "economicEvents";
export const CANONICAL_EVENTS_CONTAINER = "events";

export function getCanonicalEventsCollection() {
  const db = admin.firestore();
  return db
    .collection(CANONICAL_EVENTS_ROOT)
    .doc(CANONICAL_EVENTS_CONTAINER)
    .collection(CANONICAL_EVENTS_CONTAINER);
}

export function createEmptyCanonicalEvent(
  eventId: string,
  partial: Partial<CanonicalEconomicEvent> = {}
): CanonicalEconomicEvent {
  const now = admin.firestore.Timestamp.now();
  return {
    eventId,
    name: "",
    normalizedName: "",
    currency: null,
    category: null,
    impact: null,
    datetimeUtc: now,
    timezoneSource: "unknown",
    forecast: null,
    previous: null,
    actual: null,
    status: "scheduled",
    sources: {},
    createdBy: undefined,
    winnerSource: undefined,
    qualityScore: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function normalizeEventName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/[™®]/g, "")
    .replace(/\b(m\/m|m-o-m)\b/g, "mom");
}

function stableHash(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 32);
}

export function computeEventId(params: {
  currency: string | null;
  normalizedName: string;
  datetimeUtc: FirebaseFirestore.Timestamp;
}): string {
  const c = (params.currency || "UNK").toUpperCase();
  const name = params.normalizedName.trim().toLowerCase();
  const millis = params.datetimeUtc.toMillis().toString();
  const key = `${c}|${name}|${millis}`;
  return stableHash(key);
}

export function computeStringSimilarity(a: string, b: string): number {
  const normalizedA = normalizeEventName(a);
  const normalizedB = normalizeEventName(b);
  if (!normalizedA && !normalizedB) return 1;
  if (!normalizedA || !normalizedB) return 0;

  const tokensA = new Set(normalizedA.split(/\s+|-/).filter(Boolean));
  const tokensB = new Set(normalizedB.split(/\s+|-/).filter(Boolean));

  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  if (union === 0) return 0;
  return intersection / union;
}

function pickStatus(current: CanonicalEconomicEvent["status"], incoming?: CanonicalEconomicEvent["status"]) {
  if (!incoming) return current;
  return STATUS_ORDER[incoming] >= STATUS_ORDER[current] ? incoming : current;
}

function pickValueByPriority(
  canonical: CanonicalEconomicEvent,
  selector: (data: NonNullable<CanonicalSourceData["parsed"]>) => string | null | undefined
): {value: string | null; source?: ProviderSourceName} {
  for (const provider of PROVIDER_PRIORITY) {
    const parsed = canonical.sources?.[provider]?.parsed;
    if (!parsed) continue;
    const candidate = selector(parsed as NonNullable<CanonicalSourceData["parsed"]>);
    if (candidate !== undefined && candidate !== null) {
      return {value: candidate ?? null, source: provider};
    }
  }
  return {value: null, source: canonical.winnerSource};
}

function pickNameByPriority(
  canonical: CanonicalEconomicEvent
): {name: string; source?: ProviderSourceName} {
  // Pick display name from highest priority source with originalName
  for (const provider of PROVIDER_PRIORITY) {
    const originalName = canonical.sources?.[provider]?.originalName;
    if (originalName) {
      return {name: originalName, source: provider};
    }
  }
  // Fallback to existing name or normalizedName
  return {name: canonical.name || canonical.normalizedName || "", source: canonical.createdBy};
}

export function mergeProviderEvent(
  canonical: CanonicalEconomicEvent | undefined,
  incoming: {
    provider: ProviderSourceName;
    eventId: string;
    originalName: string;
    normalizedName: string;
    currency: string | null;
    datetimeUtc: FirebaseFirestore.Timestamp;
    impact?: string | null;
    category?: string | null;
    forecast?: string | null;
    previous?: string | null;
    actual?: string | null;
    status?: "scheduled" | "released" | "revised" | "cancelled";
    raw: any;
    parsedExtras?: {
      outcome?: string | null;
      strength?: string | null;
      quality?: string | null;
    };
  }
): CanonicalEconomicEvent {
  const now = admin.firestore.Timestamp.now();
  const normalizedCurrency = incoming.currency ? incoming.currency.toUpperCase() : null;

  let merged = canonical ??
    createEmptyCanonicalEvent(incoming.eventId, {
      name: incoming.originalName,
      normalizedName: incoming.normalizedName,
      currency: normalizedCurrency,
      datetimeUtc: incoming.datetimeUtc,
      timezoneSource: incoming.provider,
      createdBy: incoming.provider,
    });

  if (!merged.sources) {
    merged = {...merged, sources: {}};
  }

  // Currency reconciliation
  if (!merged.currency && normalizedCurrency) {
    merged = {...merged, currency: normalizedCurrency};
  } else if (merged.currency && normalizedCurrency && merged.currency !== normalizedCurrency) {
    // Keep existing but note discrepancy in logs
    console.warn(`⚠️ Currency mismatch for ${incoming.eventId}: existing=${merged.currency}, incoming=${normalizedCurrency}`);
  }

  // Datetime reconciliation (small drift allowed)
  const existingMillis = merged.datetimeUtc.toMillis();
  const incomingMillis = incoming.datetimeUtc.toMillis();
  const driftMinutes = Math.abs(existingMillis - incomingMillis) / (1000 * 60);
  if (driftMinutes <= 5 && existingMillis !== incomingMillis) {
    const incomingPriority = PROVIDER_PRIORITY.indexOf(incoming.provider);
    const winnerPriority = PROVIDER_PRIORITY.indexOf(merged.timezoneSource as ProviderSourceName);
    if (winnerPriority === -1 || (incomingPriority !== -1 && incomingPriority < winnerPriority)) {
      merged = {...merged, datetimeUtc: incoming.datetimeUtc, timezoneSource: incoming.provider};
    }
  }

  // NormalizedName reconciliation (for backwards compatibility with old events)
  if (!merged.normalizedName) {
    merged = {...merged, normalizedName: incoming.normalizedName};
  }

  // Category/impact updates (prefer non-null from higher-priority source)
  if (!merged.category && incoming.category) {
    merged = {...merged, category: incoming.category};
  }
  if (!merged.impact && incoming.impact) {
    merged = {...merged, impact: incoming.impact};
  }

  // Update per-provider source entry
  const existingSource = merged.sources[incoming.provider];
  merged.sources = {
    ...merged.sources,
    [incoming.provider]: {
      originalName: incoming.originalName,
      lastSeenAt: now,
      raw: incoming.raw,
      parsed: {
        actual: incoming.actual ?? existingSource?.parsed?.actual ?? null,
        forecast: incoming.forecast ?? existingSource?.parsed?.forecast ?? null,
        previous: incoming.previous ?? existingSource?.parsed?.previous ?? null,
        outcome: incoming.parsedExtras?.outcome ?? existingSource?.parsed?.outcome ?? null,
        strength: incoming.parsedExtras?.strength ?? existingSource?.parsed?.strength ?? null,
        quality: incoming.parsedExtras?.quality ?? existingSource?.parsed?.quality ?? null,
      },
    },
  };

  // Status progression
  merged.status = pickStatus(merged.status, incoming.status);

  // Root fields picked by provider priority
  const actualPick = pickValueByPriority(merged, (p) => p.actual ?? null);
  const forecastPick = pickValueByPriority(merged, (p) => p.forecast ?? null);
  const previousPick = pickValueByPriority(merged, (p) => p.previous ?? null);

  merged.actual = actualPick.value;
  merged.forecast = forecastPick.value;
  merged.previous = previousPick.value;

  // Winner source: whichever provided the first non-null root field
  merged.winnerSource = actualPick.source || forecastPick.source || previousPick.source || merged.winnerSource || incoming.provider;

  // Display name: pick from highest priority source with originalName
  const namePick = pickNameByPriority(merged);
  merged.name = namePick.name;

  // Quality score preference
  merged.qualityScore = PROVIDER_QUALITY[merged.winnerSource || incoming.provider] ?? 50;

  // Update timestamps
  merged.updatedAt = now;

  return merged;
}

export async function findExistingCanonicalEvent(params: {
  normalizedName: string;
  currency: string | null;
  datetimeUtc: Timestamp;
  windowMinutes?: number;
  similarityThreshold?: number;
}): Promise<{eventId: string; event: CanonicalEconomicEvent} | undefined> {
  const currency = params.currency ? params.currency.toUpperCase() : null;
  if (!currency) return undefined;

  const windowMinutes = params.windowMinutes ?? 5;
  const similarityThreshold = params.similarityThreshold ?? 0.8;
  const millis = params.datetimeUtc.toMillis();
  const start = Timestamp.fromMillis(millis - windowMinutes * 60 * 1000);
  const end = Timestamp.fromMillis(millis + windowMinutes * 60 * 1000);

  const snapshot = await getCanonicalEventsCollection()
    .where("currency", "==", currency)
    .where("datetimeUtc", ">=", start)
    .where("datetimeUtc", "<=", end)
    .get();

  let bestMatch: {eventId: string; event: CanonicalEconomicEvent; score: number} | undefined;

  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;
    // Use normalizedName for matching (backwards compatible - falls back to name)
    const matchAgainst = data.normalizedName || data.name;
    const score = computeStringSimilarity(matchAgainst, params.normalizedName);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {eventId: doc.id, event: data, score};
    }
  });

  if (bestMatch && bestMatch.score >= similarityThreshold) {
    return {eventId: bestMatch.eventId, event: bestMatch.event};
  }

  return undefined;
}
