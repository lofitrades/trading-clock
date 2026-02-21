/**
 * functions/src/models/economicEvent.ts
 *
 * Purpose: Canonical economic event model for multi-source redundancy.
 * Provides provider-agnostic types, normalization, deterministic IDs, merge logic,
 * and Firestore helpers to unify NFS weekly schedules with JBlanked actuals.
 *
 * Changelog:
 * v1.8.0 - 2026-02-20 - BEP FIX: findByIdentityWindow now correctly skips weekly recurring events.
 *   Guard 1: released/revised events cannot be rescheduled (they already happened).
 *   Guard 2: time diff ≈ N×7 days (±1 day tolerance) is weekly cadence, not a reschedule.
 *   Both guards prevent "Jobless Claims Feb 20" from being overwritten by "Jobless Claims Feb 27".
 * v1.7.0 - 2026-02-10 - BEP P0/P3: Removed console.info from reinstatement block; callers handle logging via logEventReinstatement().
 * v1.6.0 - 2026-02-09 - BEP FIX: Removed undefined field defaults (createdBy, winnerSource, rescheduledFrom) from factory. Undefined is not a valid Firestore value; optional fields are now omitted and added via ...partial spread when provided.
 * v1.5.0 - 2026-02-05 - BEP: Reinstate cancelled events when they reappear in NFS feed (handles reschedule → un-cancel).
 * v1.4.0 - 2026-02-05 - BEP: Added detectStaleEvents() to mark cancelled future events not seen in NFS feed for 3+ days.
 * v1.3.0 - 2026-02-05 - BEP: Event reschedule detection with ±15 day identity matching, originalDatetimeUtc/rescheduledFrom/lastSeenInFeed fields, findByIdentityWindow() function.
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
  // Reschedule detection fields (v1.3.0)
  /** Original scheduled datetime when event was first created (never changes) */
  originalDatetimeUtc?: FirebaseFirestore.Timestamp;
  /** Previous datetime if event was rescheduled (tracks last known datetime before change) */
  rescheduledFrom?: FirebaseFirestore.Timestamp;
  /** Last time this event appeared in a source feed (for stale detection) */
  lastSeenInFeed?: FirebaseFirestore.Timestamp;
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
    // BEP: createdBy, winnerSource, rescheduledFrom intentionally omitted (optional fields).
    // Setting them to `undefined` causes Firestore write errors. The ...partial spread adds them when provided.
    qualityScore: 0,
    createdAt: now,
    updatedAt: now,
    // Reschedule detection fields - set originalDatetimeUtc on creation
    originalDatetimeUtc: partial.datetimeUtc ?? now,
    lastSeenInFeed: now,
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
  const c = (params.currency || "N/A").toUpperCase();
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
  },
  options?: {
    /** Flag indicating this is a reschedule (date changed significantly) */
    isReschedule?: boolean;
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

  // ========== Reschedule Detection (v1.3.0) ==========
  // Handle significant date changes (>5 min difference = reschedule)
  if (options?.isReschedule && canonical) {
    // Only track as reschedule if datetime actually changed significantly
    if (driftMinutes > 5) {
      merged = {
        ...merged,
        rescheduledFrom: canonical.datetimeUtc, // Store old datetime
        datetimeUtc: incoming.datetimeUtc, // Update to new datetime
        timezoneSource: incoming.provider,
      };

      // Preserve original datetime if not already set
      if (!merged.originalDatetimeUtc) {
        merged.originalDatetimeUtc = canonical.datetimeUtc;
      }
    }
  }

  // Track last seen in feed for stale detection
  merged.lastSeenInFeed = now;

  // If event was previously cancelled but now reappears in feed, reinstate it
  // This handles the case where an event was marked stale but later rescheduled
  // BEP: Callers (NFS, GPT, JBlanked services) detect reinstatement and log via logEventReinstatement()
  if (merged.status === "cancelled" && incoming.status === "scheduled") {
    merged.status = "scheduled";
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

/**
 * Find existing canonical event by identity (currency + normalized name)
 * within a wider time window (±15 days) for reschedule detection.
 *
 * Use case: NFP scheduled for Feb 7 gets rescheduled to Feb 12.
 * Standard ±5 min window won't find it, but ±15 day identity match will.
 *
 * Weekly recurring events are explicitly excluded via two guards:
 * - Guard 1: If the matched event is already released/revised, it cannot
 *   be rescheduled — it already happened. Return undefined so the caller
 *   creates a fresh document for the new weekly occurrence.
 * - Guard 2: If timeDiff ≈ N × 7 days (±1 day, N = 1..4), the pattern is
 *   a weekly cadence, not a genuine reschedule. Return undefined.
 *
 * @param params.normalizedName - Normalized event name for fuzzy matching
 * @param params.currency - Currency code (exact match required)
 * @param params.datetimeUtc - New scheduled datetime from feed
 * @param params.windowDays - Search window in days (default: 15)
 * @param params.similarityThreshold - Name similarity threshold (default: 0.85)
 * @returns Existing event if found with isReschedule flag, undefined otherwise
 */
export async function findByIdentityWindow(params: {
  normalizedName: string;
  currency: string | null;
  datetimeUtc: Timestamp;
  windowDays?: number;
  similarityThreshold?: number;
}): Promise<{eventId: string; event: CanonicalEconomicEvent; isReschedule: boolean} | undefined> {
  const currency = params.currency ? params.currency.toUpperCase() : null;
  if (!currency) return undefined;

  const windowDays = params.windowDays ?? 15;
  const similarityThreshold = params.similarityThreshold ?? 0.85;
  const millis = params.datetimeUtc.toMillis();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Search ±15 days from incoming datetime
  const start = Timestamp.fromMillis(millis - windowDays * msPerDay);
  const end = Timestamp.fromMillis(millis + windowDays * msPerDay);

  const snapshot = await getCanonicalEventsCollection()
    .where("currency", "==", currency)
    .where("datetimeUtc", ">=", start)
    .where("datetimeUtc", "<=", end)
    .get();

  let bestMatch: {
    eventId: string;
    event: CanonicalEconomicEvent;
    score: number;
    timeDiffMs: number;
  } | undefined;

  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;
    const matchAgainst = data.normalizedName || data.name;
    const score = computeStringSimilarity(matchAgainst, params.normalizedName);
    const timeDiffMs = Math.abs(data.datetimeUtc.toMillis() - millis);

    // Only consider if name matches well enough
    if (score >= similarityThreshold) {
      // Prefer exact time match, then closest time match with highest score
      if (!bestMatch ||
          (score > bestMatch.score) ||
          (score === bestMatch.score && timeDiffMs < bestMatch.timeDiffMs)) {
        bestMatch = {eventId: doc.id, event: data, score, timeDiffMs};
      }
    }
  });

  if (bestMatch) {
    // ---- Guard 1: Released/revised events cannot be rescheduled ----
    // An event that already published actual values has already occurred.
    // The incoming event at a different datetime is a new weekly/monthly
    // occurrence of the same series — it must get its own document.
    if (
      bestMatch.event.status === "released" ||
      bestMatch.event.status === "revised"
    ) {
      return undefined;
    }

    // ---- Guard 2: Weekly cadence detection ----
    // If the time difference between the matched event and the incoming event
    // is approximately N × 7 days (N = 1..4, covering up to ~4 weeks), this is
    // a regularly recurring event (e.g., Jobless Claims, NFP, FOMC Minutes).
    // A genuine reschedule moves an event by days — not by exactly 7/14/21 days.
    // Tolerance: ±1 day around the exact week multiple.
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const weeksApprox = Math.round(bestMatch.timeDiffMs / WEEK_MS);
    if (weeksApprox >= 1 && weeksApprox <= 4) {
      const remainder = Math.abs(bestMatch.timeDiffMs - weeksApprox * WEEK_MS);
      if (remainder <= ONE_DAY_MS) {
        // Time diff is within ±1 day of a whole number of weeks → weekly cadence.
        // Treat as no match so the caller creates a fresh document for this occurrence.
        return undefined;
      }
    }

    // Determine if this is a genuine reschedule (datetime differs by more than 5 minutes)
    const isReschedule = bestMatch.timeDiffMs > 5 * 60 * 1000;
    return {
      eventId: bestMatch.eventId,
      event: bestMatch.event,
      isReschedule,
    };
  }

  return undefined;
}

/**
 * Detect and mark stale events that may have been cancelled.
 *
 * Stale event criteria:
 * 1. Future event (datetimeUtc > now)
 * 2. Has NFS source (was from Forex Factory feed)
 * 3. lastSeenInFeed is older than staleDays (default: 3 days)
 *
 * @param options.staleDays - Days without being seen before considered stale (default: 3)
 * @param options.dryRun - If true, only log without updating (default: false)
 * @returns Object with counts of detected and updated stale events
 */
export async function detectStaleEvents(options?: {
  staleDays?: number;
  dryRun?: boolean;
}): Promise<{detected: number; updated: number; events: Array<{eventId: string; name: string; currency: string | null; scheduledFor: string; lastSeen: string | null}>}> {
  const staleDays = options?.staleDays ?? 3;
  const dryRun = options?.dryRun ?? false;

  const now = admin.firestore.Timestamp.now();
  const staleThreshold = Timestamp.fromMillis(now.toMillis() - staleDays * 24 * 60 * 60 * 1000);

  const collection = getCanonicalEventsCollection();

  // Query: future events only
  // Note: We filter for NFS source and stale lastSeenInFeed in memory
  // because Firestore can't query nested map fields efficiently
  const snapshot = await collection
    .where("datetimeUtc", ">", now)
    .get();

  const staleEvents: Array<{
    eventId: string;
    name: string;
    currency: string | null;
    scheduledFor: string;
    lastSeen: string | null;
  }> = [];

  const db = admin.firestore();
  const batch = db.batch();
  let batchCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;

    // Check if event has NFS source (came from Forex Factory)
    const hasNfsSource = data.sources?.nfs !== undefined;
    if (!hasNfsSource) return;

    // Check if lastSeenInFeed is stale (or missing - treat as very stale)
    const lastSeen = data.lastSeenInFeed;
    const isStale = !lastSeen || lastSeen.toMillis() < staleThreshold.toMillis();
    if (!isStale) return;

    // This event is stale - likely cancelled
    staleEvents.push({
      eventId: doc.id,
      name: data.name || data.normalizedName || "Unknown",
      currency: data.currency,
      scheduledFor: data.datetimeUtc.toDate().toISOString(),
      lastSeen: lastSeen?.toDate().toISOString() ?? null,
    });

    // Mark as cancelled (unless dry run)
    if (!dryRun) {
      batch.update(doc.ref, {
        status: "cancelled",
        updatedAt: now,
      });
      batchCount++;
    }
  });

  // Commit batch if we have updates
  let updated = 0;
  if (batchCount > 0 && !dryRun) {
    await batch.commit();
    updated = batchCount;
  }

  return {
    detected: staleEvents.length,
    updated,
    events: staleEvents,
  };
}

/**
 * BEP repair: scan all events that have rescheduledFrom set and clear
 * any that were false-positives caused by the weekly cadence bug.
 *
 * A false-positive reschedule is identified when:
 *   |datetimeUtc − rescheduledFrom| ≈ N × 7 days (N = 1..8, ±1 day tolerance)
 *
 * For each false-positive:
 *   - rescheduledFrom is deleted (FieldValue.delete())
 *   - originalDatetimeUtc is cleared if it equals rescheduledFrom (meaning
 *     it was set solely by the false reschedule and not by a real first-creation)
 *
 * The current datetimeUtc is left unchanged — it holds the most recent NFS
 * datetime and should be correct (it IS this week's scheduled datetime).
 *
 * @param options.dryRun - If true, only count without writing (default: false)
 * @returns Summary of detected and repaired events
 */
export async function repairWeeklyEventReschedules(options?: {
  dryRun?: boolean;
}): Promise<{
  scanned: number;
  detected: number;
  repaired: number;
  events: Array<{
    eventId: string;
    name: string;
    currency: string | null;
    datetimeUtc: string;
    rescheduledFrom: string;
    weeksApart: number;
  }>;
}> {
  const dryRun = options?.dryRun ?? false;
  const collection = getCanonicalEventsCollection();
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  // Fetch all events — we filter in-memory because Firestore cannot query
  // "field exists" without a composite index that may not be present.
  const snapshot = await collection.get();

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const falseReschedules: Array<{
    eventId: string;
    name: string;
    currency: string | null;
    datetimeUtc: string;
    rescheduledFrom: string;
    weeksApart: number;
    clearOriginal: boolean;
  }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;
    if (!data.rescheduledFrom) return;

    const timeDiffMs = Math.abs(
      data.datetimeUtc.toMillis() - data.rescheduledFrom.toMillis()
    );
    const weeksApprox = Math.round(timeDiffMs / WEEK_MS);

    if (weeksApprox >= 1 && weeksApprox <= 8) {
      const remainder = Math.abs(timeDiffMs - weeksApprox * WEEK_MS);
      if (remainder <= ONE_DAY_MS) {
        // originalDatetimeUtc should be cleared only if it was set to the same
        // value as rescheduledFrom (meaning it was stamped by the false reschedule).
        const clearOriginal =
          !!data.originalDatetimeUtc &&
          data.originalDatetimeUtc.toMillis() === data.rescheduledFrom.toMillis();

        falseReschedules.push({
          eventId: doc.id,
          name: data.name || data.normalizedName || "Unknown",
          currency: data.currency,
          datetimeUtc: data.datetimeUtc.toDate().toISOString(),
          rescheduledFrom: data.rescheduledFrom.toDate().toISOString(),
          weeksApart: weeksApprox,
          clearOriginal,
        });
      }
    }
  });

  let repaired = 0;

  if (!dryRun && falseReschedules.length > 0) {
    // Firestore batch limit is 500 writes; chunk if needed.
    const BATCH_SIZE = 400;
    for (let i = 0; i < falseReschedules.length; i += BATCH_SIZE) {
      const chunk = falseReschedules.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const item of chunk) {
        const ref = collection.doc(item.eventId);
        const update: Record<string, any> = {
          rescheduledFrom: admin.firestore.FieldValue.delete(),
          updatedAt: now,
        };
        if (item.clearOriginal) {
          update.originalDatetimeUtc = admin.firestore.FieldValue.delete();
        }
        batch.update(ref, update);
      }

      await batch.commit();
      repaired += chunk.length;
    }
  }

  return {
    scanned: snapshot.size,
    detected: falseReschedules.length,
    repaired,
    events: falseReschedules.map(({clearOriginal: _ignored, ...rest}) => rest),
  };
}
