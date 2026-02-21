/**
 * functions/src/services/fcmReminderScheduler.ts
 *
 * Purpose: Server-side FCM push scheduler for reminder notifications.
 * Key responsibility and main functionality: Expand reminder occurrences, dedupe triggers,
 * enforce daily caps/quiet hours, and send push notifications via Firebase Admin SDK.
 *
 * BEP Token Handling:
 * - Invalid tokens (registration-token-not-registered, invalid-registration-token) are automatically
 *   deleted from Firestore when FCM returns an error for them.
 * - This ensures stale/unregistered devices don't accumulate in the database.
 * - Combined with client-side lastSeenAt tracking, allows for robust device management.
 *
 * Changelog:
 * v4.0.0 - 2026-02-19 - BEP CRITICAL FIX: Series reminder support for NFS/canonical events.
 *                       ROOT CAUSE: Series reminders (scope=series) with no recurrence metadata
 *                       had stale eventEpochMs (past occurrence). expandReminderOccurrences()
 *                       treated them as one-time past events → 0 occurrences → 0 push sent.
 *                       FIX: After expandReminderOccurrences() returns 0 for a series reminder,
 *                       query Firestore economicEvents collection for upcoming matching events.
 *                       Match by normalized name + currency (ignoring impact/category to avoid
 *                       client-server impact label mismatch: 'strong data' vs 'High').
 *                       Canonical events collection is loaded ONCE per scheduler run for all
 *                       users — not per user — to avoid redundant Firestore reads.
 *                       Also adds diagnostic logging (eventEpochMs, recurrence, scope) when
 *                       0 occurrences found to aid future debugging.
 * v3.1.0 - 2026-02-07 - BEP: Stale device token expiration (30 days). Tokens with
 *                       lastSeenAt older than 30 days are pruned inline during scheduler
 *                       execution. Reduces wasted FCM sends to dead devices, eliminates
 *                       unnecessary Firestore reads on subsequent runs, and keeps the
 *                       deviceTokens subcollection lean. lastSeenAt is already updated
 *                       on every app load via refreshFcmTokenForUser() in AuthContext.
 * v3.0.0 - 2026-02-07 - BEP CRITICAL: Enterprise notification delivery overhaul.
 *                       1) Widened lookback window from 90s to 300s (5 min) to handle Cloud
 *                          Scheduler jitter, Pub/Sub latency, and cold starts. Trigger dedup
 *                          prevents double-sends so wider window is safe.
 *                       2) Parallelized user processing with Promise.allSettled() + concurrency
 *                          limiter (5 users at a time) instead of sequential for-of loop.
 *                          Reduces total execution time from O(n*reads) to O(n/5*reads).
 *                       3) Function timeout increased from 60s to 120s to accommodate wider
 *                          window + parallel processing for growing user base.
 * v2.0.0 - 2026-02-07 - BEP CRITICAL: Comprehensive deduplication overhaul.
 *                       1) Occurrence-level dedup: one push per event per occurrence per user.
 *                          Uses occurrenceTrigger doc to block subsequent offsets after first fires.
 *                       2) Encode trigger IDs with encodeFirestoreDocId() to safely handle
 *                          eventKeys containing slashes (prevents subcollection path errors).
 *                       3) Tightened isDue window: reminderAt + WINDOW_BACK_MS instead of
 *                          occurrenceEpochMs + window. Consistent with client-side v3.0.0.
 * v1.7.0 - 2026-02-04 - BEP FIX: Window now only looks BACK (90s), not forward.
 * v1.6.0 - 2026-02-04 - BEP FIX: Use correct FCM v1 API payload structure.
 * v1.5.0 - 2026-02-04 - BEP FIX: Window set to 90s for 1-minute schedule.
 * v1.4.0 - 2026-02-03 - BEP FIX: Add comprehensive logging to FCM scheduler.
 * v1.3.0 - 2026-02-03 - BEP FIX: Add Android PWA push support.
 * v1.2.0 - 2026-02-03 - BEP: Document automatic invalid token cleanup.
 * v1.1.0 - 2026-02-03 - BEP FIX: Only send push for individual reminder offsets that have push enabled.
 * v4.2.0 - 2026-02-20 - BEP CRITICAL PERF: Fix 10+ minute Chrome PWA push delay.
 *                       ROOT CAUSE 1: Missing Urgency:high + TTL headers on webpush config.
 *                       Chrome/Android batches web push to save battery unless told otherwise.
 *                       FIX: Added headers: { Urgency:"high", TTL:"60" } to webpush payload.
 *                       Urgency:high bypasses Chrome delivery queue for instant delivery.
 *                       TTL:60 drops stale pushes not delivered within 60s (no late noise).
 *                       ROOT CAUSE 2: windowEnd=nowEpochMs (0 forward buffer). If scheduler
 *                       fires 1-2s before reminder time, reminder was missed for a full minute.
 *                       FIX: windowEnd = nowEpochMs + 30s (WINDOW_FORWARD_MS). Dedup prevents
 *                       double-sends from the wider window.
 * v4.1.0 - 2026-02-20 - BEP CRITICAL FIX: Add '1WD' (weekday) interval to expandReminderOccurrences.
 *                       ROOT CAUSE: CustomEventDialog offers 'Weekdays' recurrence (interval='1WD').
 *                       customEventsService correctly saves it to Firestore, but
 *                       expandReminderOccurrences had no entry for '1WD' → intervalMeta undefined
 *                       → returned [] → zero push notifications fired for weekday-recurring events.
 *                       FIX: Added '1WD' to RECURRENCE_INTERVALS and weekday-aware expansion
 *                       logic (advance day-by-day, skip Saturday+Sunday).
 * v1.0.0 - 2026-01-23 - Initial FCM reminder scheduler for push notifications.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const TOKENS_COLLECTION = "deviceTokens";
const REMINDERS_COLLECTION = "reminders";
const TRIGGERS_COLLECTION = "notificationTriggers";
const STATS_COLLECTION = "notificationStats";

// BEP v4.0.0: Canonical events collection path for NFS series reminder matching.
// Path: economicEvents (collection) → events (document) → events (sub-collection)
const CANONICAL_EVENTS_ROOT = "economicEvents";
const CANONICAL_EVENTS_CONTAINER = "events";

// BEP v4.0.0: NFS/canonical source prefixes that can be matched against the
// canonical events Firestore collection. 'jblanked' events are enriched into
// the canonical collection so they're included as well.
const CANONICAL_SOURCE_PREFIXES = new Set(["nfs", "canonical", "jblanked"]);

/**
 * BEP v4.0.0: Normalize a string for series key matching.
 * Mirrors the client-side normalizeKey() function: trim + lowercase.
 * Does NOT apply normalizeEventName()'s m/m→mom transform because
 * series keys stored in Firestore were built with the simpler normalizeKey().
 */
const normalizeKeyForMatch = (value: string | null | undefined): string => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

/**
 * BEP v4.0.0: Parse a series key into its components.
 * Series key format: source:series:name:currency:impact:category
 * e.g. "nfs:series:fomc meeting minutes:usd:strong data:na"
 * Returns null if the key is not a valid series key.
 */
const parseSeriesKey = (key: string): { source: string; name: string; currency: string | null } | null => {
  if (!key) return null;
  const parts = key.split(":");
  // Minimum: source:series:name:currency = 4 parts
  if (parts.length < 4 || parts[1] !== "series") return null;
  const source = parts[0];
  const name = parts[2]; // Already normalized (client used normalizeKey before building key)
  const currencyRaw = parts[3]; // Already normalized
  const currency = currencyRaw === "na" || !currencyRaw ? null : currencyRaw;
  return { source, name, currency };
};

/**
 * BEP v4.0.0: A canonical event entry for series matching.
 */
interface CanonicalEventEntry {
  name: string;        // normalized (trim+lowercase) from event.name
  currency: string | null; // normalized currency, or null
  epochMs: number;     // UTC epoch milliseconds from datetimeUtc Timestamp
}

/**
 * BEP v4.0.0: Load upcoming scheduled canonical events from Firestore.
 * Queries the economicEvents collection for events in [rangeStart, rangeEnd].
 * Called ONCE per scheduler run, shared across all users.
 *
 * Matching uses event.name (not event.normalizedName) so that client-side
 * normalizeKey(event.name) produces the same value as the stored series key name.
 * Example: normalizeKey("Core CPI m/m") = "core cpi m/m" which matches series key.
 *          normalizedName uses normalizeEventName which converts m/m→mom (different!).
 */
const loadUpcomingCanonicalEvents = async (
  db: FirebaseFirestore.Firestore,
  rangeStart: number,
  rangeEnd: number
): Promise<CanonicalEventEntry[]> => {
  try {
    const snapshot = await db
      .collection(CANONICAL_EVENTS_ROOT)
      .doc(CANONICAL_EVENTS_CONTAINER)
      .collection(CANONICAL_EVENTS_CONTAINER)
      .where("datetimeUtc", ">=", admin.firestore.Timestamp.fromMillis(rangeStart))
      .where("datetimeUtc", "<=", admin.firestore.Timestamp.fromMillis(rangeEnd))
      .get();

    const entries: CanonicalEventEntry[] = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // Skip cancelled events
      if (data.status === "cancelled") return;
      const rawDatetime = data.datetimeUtc;
      const epochMs: number | null = typeof rawDatetime?.toMillis === "function"
        ? rawDatetime.toMillis()
        : null;
      if (!epochMs) return;
      entries.push({
        name: normalizeKeyForMatch(data.name || data.normalizedName || ""),
        currency: data.currency ? normalizeKeyForMatch(data.currency) : null,
        epochMs,
      });
    });

    logger.info(`📚 Loaded ${entries.length} canonical event(s) in range for series matching`);
    return entries;
  } catch (error) {
    logger.warn("⚠️ Failed to load canonical events for series matching", { error: String(error) });
    return [];
  }
};

// BEP v3.0.0: Window looks 5 minutes BACK to handle Cloud Scheduler jitter, Pub/Sub
// delivery latency, and cold starts. Previous 90s was too tight — reminders could be
// missed entirely if the function ran late. Trigger deduplication in Firestore prevents
// duplicate notifications even with the wider window.
const WINDOW_BACK_MS = 300 * 1000; // 5 minutes (handles jitter + cold starts)
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const DAILY_CAP = 150;
// BEP v3.0.0: Concurrency limit for parallel user processing
const USER_CONCURRENCY = 5;
// BEP v3.1.0: Stale device token expiration — tokens not seen in 30 days are pruned.
// Firebase recommends cleaning tokens inactive for 30+ days to avoid wasted FCM sends
// and unnecessary Firestore reads. lastSeenAt is updated on every app load via
// refreshFcmTokenForUser() in AuthContext.
const STALE_TOKEN_DAYS = 30;
const STALE_TOKEN_MS = STALE_TOKEN_DAYS * 24 * 60 * 60 * 1000;

/**
 * BEP v2.0.0: Encode trigger/doc IDs for safe Firestore document paths.
 * Firestore document IDs cannot contain forward slashes — eventKeys built from
 * composite keys (source:name:time) are safe, but eventKeys containing `/`
 * would create subcollections instead of documents, breaking trigger dedup.
 * Uses Base64url encoding (RFC 4648 §5) for safe, reversible encoding.
 */
const encodeFirestoreDocId = (id: string): string => {
  if (!id) return id;
  // Only encode if the ID contains characters unsafe for Firestore doc IDs
  if (!id.includes("/")) return id;
  try {
    const encoded = Buffer.from(id, "utf-8").toString("base64url");
    return encoded;
  } catch {
    return encodeURIComponent(id);
  }
};

const RECURRENCE_INTERVALS: Record<string, { unit: string; step: number; ms?: number }> = {
  "5m": { unit: "minute", step: 5, ms: 5 * 60 * 1000 },
  "15m": { unit: "minute", step: 15, ms: 15 * 60 * 1000 },
  "30m": { unit: "minute", step: 30, ms: 30 * 60 * 1000 },
  "1h": { unit: "hour", step: 1, ms: 60 * 60 * 1000 },
  "4h": { unit: "hour", step: 4, ms: 4 * 60 * 60 * 1000 },
  "1D": { unit: "day", step: 1 },
  "1WD": { unit: "weekday", step: 1 }, // Mon–Fri only, skips weekends
  "1W": { unit: "week", step: 1 },
  "1M": { unit: "month", step: 1 },
  "1Q": { unit: "quarter", step: 1 },
  "1Y": { unit: "year", step: 1 },
};

// BEP v4.1.0: UTC weekday check (0=Sunday, 6=Saturday)
const isWeekday = (dateParts: { year: number; month: number; day: number }): boolean => {
  const date = new Date(Date.UTC(dateParts.year, dateParts.month, dateParts.day));
  const dow = date.getUTCDay();
  return dow !== 0 && dow !== 6;
};

const parseLocalDateParts = (localDate?: string | null) => {
  if (!localDate) return null;
  const [yearStr, monthStr, dayStr] = String(localDate).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;
  return { year, month, day };
};

const parseLocalTimeParts = (localTime?: string | null) => {
  if (!localTime) return null;
  const [hourStr, minuteStr] = String(localTime).split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if ([hour, minute].some((value) => Number.isNaN(value))) return null;
  return { hour, minute };
};

const getDatePartsInTimezone = (timezone: string, referenceDate = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(referenceDate).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
  };
};

const getUtcDateForTimezone = (
  timezone: string,
  year: number,
  month: number,
  day: number,
  options: { hour?: number; minute?: number; second?: number; millisecond?: number; endOfDay?: boolean } = {}
) => {
  const { hour = 0, minute = 0, second = 0, millisecond = 0, endOfDay = false } = options;
  const utcDate = endOfDay
    ? new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  const offset = asUtc - utcDate.getTime();
  return new Date(utcDate.getTime() - offset);
};

const getLocalTimePartsFromEpoch = (epochMs: number, timezone: string) => {
  try {
    const date = new Date(epochMs);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if ([hour, minute].some((value) => Number.isNaN(value))) return null;
    return { hour, minute };
  } catch {
    return null;
  }
};

const buildEpochFromLocalParts = (timezone: string, { year, month, day, hour, minute }: { year: number; month: number; day: number; hour: number; minute: number }) => {
  const utcDate = getUtcDateForTimezone(timezone, year, month, day, { hour, minute, second: 0, millisecond: 0 });
  return utcDate.getTime();
};

const addDaysToLocalDateParts = ({ year, month, day }: { year: number; month: number; day: number }, addDays: number) => {
  const base = new Date(Date.UTC(year, month, day));
  const next = new Date(base.getTime() + addDays * 24 * 60 * 60 * 1000);
  return { year: next.getUTCFullYear(), month: next.getUTCMonth(), day: next.getUTCDate() };
};

const addMonthsToLocalDateParts = ({ year, month, day }: { year: number; month: number; day: number }, addMonths: number) => {
  const totalMonths = month + addMonths;
  const nextYear = year + Math.floor(totalMonths / 12);
  const nextMonth = ((totalMonths % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  return { year: nextYear, month: nextMonth, day: Math.min(day, lastDay) };
};

const getRecurrenceUntilEpoch = (recurrence: any, timezone: string, timeParts: { hour: number; minute: number } | null) => {
  if (recurrence?.ends?.type !== "onDate") return null;
  const untilParts = parseLocalDateParts(recurrence?.ends?.untilLocalDate);
  if (!untilParts || !timeParts) return null;
  return buildEpochFromLocalParts(timezone, { ...untilParts, ...timeParts });
};

const expandReminderOccurrences = (reminder: any, rangeStartMs: number, rangeEndMs: number) => {
  const recurrence = reminder?.metadata?.recurrence;
  const baseEpochMs = Number.isFinite(reminder?.eventEpochMs) ? reminder.eventEpochMs : null;

  if (!recurrence?.enabled || !recurrence?.interval || recurrence.interval === "none") {
    if (!baseEpochMs || baseEpochMs < rangeStartMs || baseEpochMs > rangeEndMs) return [];
    return [{ occurrenceEpochMs: baseEpochMs, occurrenceKey: reminder.eventKey }];
  }

  const intervalMeta = RECURRENCE_INTERVALS[recurrence.interval];
  if (!intervalMeta || !baseEpochMs) return [];

  const timezone = reminder.timezone || "America/New_York";
  const localDateParts = parseLocalDateParts(reminder?.metadata?.localDate)
    || getDatePartsInTimezone(timezone, new Date(baseEpochMs));
  const timeParts = parseLocalTimeParts(reminder?.metadata?.localTime)
    || getLocalTimePartsFromEpoch(baseEpochMs, timezone)
    || { hour: 0, minute: 0 };

  const untilEpochMs = getRecurrenceUntilEpoch(recurrence, timezone, timeParts);
  const maxCount = recurrence?.ends?.type === "after"
    ? Math.max(1, Number(recurrence?.ends?.count || 1))
    : Number.POSITIVE_INFINITY;

  const occurrences: Array<{ occurrenceEpochMs: number; occurrenceKey: string }> = [];
  let generated = 0;

  if (intervalMeta.unit === "minute" || intervalMeta.unit === "hour") {
    const stepMs = intervalMeta.ms || 0;
    const rawStartIndex = Math.ceil((rangeStartMs - baseEpochMs) / stepMs);
    const startIndex = Math.max(0, rawStartIndex);
    let maxIndex = Math.floor((rangeEndMs - baseEpochMs) / stepMs);
    if (untilEpochMs !== null) {
      maxIndex = Math.min(maxIndex, Math.floor((untilEpochMs - baseEpochMs) / stepMs));
    }
    if (Number.isFinite(maxCount)) {
      maxIndex = Math.min(maxIndex, maxCount - 1);
    }

    for (let idx = startIndex; idx <= maxIndex; idx += 1) {
      const occurrenceEpochMs = baseEpochMs + idx * stepMs;
      if (occurrenceEpochMs < rangeStartMs || occurrenceEpochMs > rangeEndMs) continue;
      occurrences.push({
        occurrenceEpochMs,
        occurrenceKey: `${reminder.eventKey}__${occurrenceEpochMs}`,
      });
      generated += 1;
      if (generated >= 5000) break;
    }
    return occurrences;
  }

  const baseDateUtc = new Date(Date.UTC(localDateParts.year, localDateParts.month, localDateParts.day));
  const rangeStartParts = getDatePartsInTimezone(timezone, new Date(rangeStartMs));
  const rangeStartUtc = new Date(Date.UTC(rangeStartParts.year, rangeStartParts.month, rangeStartParts.day));
  const dayMs = 24 * 60 * 60 * 1000;

  // BEP v4.1.0: Weekday-only recurrence (Mon–Fri) — advance one calendar day at a time,
  // skip Saturday+Sunday. currentIndex is an absolute day-offset, not a step multiplier.
  const isWeekdayInterval = intervalMeta.unit === "weekday";

  let stepDays = 0;
  let stepMonths = 0;
  if (intervalMeta.unit === "day") stepDays = intervalMeta.step;
  if (intervalMeta.unit === "weekday") stepDays = 1; // advance 1 cal-day at a time; weekends filtered below
  if (intervalMeta.unit === "week") stepDays = intervalMeta.step * 7;
  if (intervalMeta.unit === "month") stepMonths = intervalMeta.step;
  if (intervalMeta.unit === "quarter") stepMonths = intervalMeta.step * 3;
  if (intervalMeta.unit === "year") stepMonths = intervalMeta.step * 12;

  let startIndex = 0;
  if (isWeekdayInterval) {
    // Find the first weekday calendar-day >= rangeStart
    const maxSearch = 365 * 2;
    for (let d = 0; d < maxSearch; d += 1) {
      const parts = addDaysToLocalDateParts(localDateParts, d);
      const testEpoch = buildEpochFromLocalParts(timezone, { ...parts, ...timeParts });
      if (testEpoch >= rangeStartMs && isWeekday(parts)) {
        startIndex = d;
        break;
      }
    }
  } else if (stepDays > 0) {
    const diffDays = Math.floor((rangeStartUtc.getTime() - baseDateUtc.getTime()) / dayMs);
    startIndex = diffDays > 0 ? Math.floor(diffDays / stepDays) : 0;
  } else if (stepMonths > 0) {
    const diffMonths = (rangeStartParts.year - localDateParts.year) * 12 + (rangeStartParts.month - localDateParts.month);
    startIndex = diffMonths > 0 ? Math.floor(diffMonths / stepMonths) : 0;
  }

  let currentIndex = Math.max(0, startIndex);
  let countGenerated = 0; // tracks actual emissions for 'after' end type
  while (generated < 5000) {
    let nextDateParts = localDateParts;
    if (isWeekdayInterval) {
      // For weekday recurrence currentIndex is the absolute day-offset from base
      nextDateParts = addDaysToLocalDateParts(localDateParts, currentIndex);
      if (!isWeekday(nextDateParts)) {
        currentIndex += 1;
        continue;
      }
    } else if (stepDays > 0) {
      nextDateParts = addDaysToLocalDateParts(localDateParts, currentIndex * stepDays);
    } else if (stepMonths > 0) {
      nextDateParts = addMonthsToLocalDateParts(localDateParts, currentIndex * stepMonths);
    }

    const occurrenceEpochMs = buildEpochFromLocalParts(timezone, { ...nextDateParts, ...timeParts });
    if (occurrenceEpochMs < rangeStartMs) {
      currentIndex += 1;
      continue;
    }
    if (occurrenceEpochMs > rangeEndMs) break;
    if (untilEpochMs !== null && occurrenceEpochMs > untilEpochMs) break;
    if (Number.isFinite(maxCount) && countGenerated >= maxCount) break;
    if (!isWeekdayInterval && Number.isFinite(maxCount) && currentIndex >= maxCount) break;

    occurrences.push({
      occurrenceEpochMs,
      occurrenceKey: `${reminder.eventKey}__${occurrenceEpochMs}`,
    });

    generated += 1;
    countGenerated += 1;
    currentIndex += 1;
  }

  return occurrences;
};

const buildTriggerId = (eventKey: string, occurrenceEpochMs: number, minutesBefore: number, channel: string) => (
  `${eventKey}__${occurrenceEpochMs}__${minutesBefore}__${channel}`
);

const getDayKey = (timezone: string, now = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
};

// BEP: Quiet hours temporarily disabled for testing
// TODO: Make quiet hours user-configurable via settings
// const isWithinQuietHours = (timezone: string, now = new Date()) => {
//   const formatter = new Intl.DateTimeFormat("en-US", {
//     timeZone: timezone,
//     hour: "2-digit",
//     hour12: false,
//   });
//   const hour = Number(formatter.format(now));
//   if (Number.isNaN(hour)) return false;
//   if (QUIET_HOURS.start < QUIET_HOURS.end) {
//     return hour >= QUIET_HOURS.start && hour < QUIET_HOURS.end;
//   }
//   return hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end;
// };

const sendPushToTokens = async (
  tokens: string[],
  title: string,
  body: string,
  tag: string,
  data: Record<string, string>,
  userId: string
) => {
  if (tokens.length === 0) {
    logger.warn('⚠️  No tokens to send to');
    return;
  }
  logger.info(`📨 sendPushToTokens called with ${tokens.length} tokens for user ${userId}`);
  
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  logger.info(`📦 Split into ${chunks.length} chunk(s) (max 500 per chunk)`);

  for (const chunk of chunks) {
    logger.info(`📤 Sending chunk with ${chunk.length} tokens`);
    
    // BEP: Use proper FCM v1 API multicast message format
    // Platform-specific options go in android/webpush objects, not notification
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title,
        body,
      },
      // Android-specific notification options
      android: {
        priority: "high",
        notification: {
          icon: "ic_notification",
          color: "#4DB6AC",
          tag, // Prevents duplicate notifications
          sound: "default",
          defaultVibrateTimings: true,
          channelId: "t2t_reminders",
        },
      },
      // Web push (PWA) specific options
      // BEP v4.2.0: Urgency:high bypasses Chrome/Android delivery batching (battery opt).
      // Without it Chrome queues web push for 5-15+ min. TTL:60 drops stale pushes
      // that arrive after the event started instead of delivering them late.
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "60", // drop if undelivered after 60 s — prefer silence over late noise
        },
        notification: {
          icon: "https://time2.trade/icons/icon-192.png",
          badge: "https://time2.trade/icons/icon-72.png",
          tag,
          vibrate: [100, 50, 100],
          requireInteraction: true,
        },
        fcmOptions: {
          link: "https://time2.trade/calendar",
        },
      },
      data,
    });

    logger.info(`📊 FCM response: ${response.successCount} succeeded, ${response.failureCount} failed`);

    const removals: Promise<FirebaseFirestore.WriteResult>[] = [];
    response.responses.forEach((res, index) => {
      if (res.success) {
        logger.debug(`✅ Token ${index} sent successfully`);
        return;
      }
      const errorCode = res.error?.code || "";
      logger.warn(`⚠️  Token ${index} failed: ${errorCode}`, { error: res.error?.message });
      
      if (errorCode.includes("registration-token-not-registered") || errorCode.includes("invalid-registration-token")) {
        logger.info(`🗑️  Deleting invalid token: ${chunk[index]}`);
        const token = chunk[index];
        const tokenRef = admin.firestore().doc(`users/${userId}/${TOKENS_COLLECTION}/${token}`);
        removals.push(tokenRef.delete());
      }
    });

    if (removals.length) {
      logger.info(`🔄 Cleaning up ${removals.length} invalid token(s)...`);
      await Promise.allSettled(removals);
      logger.info(`✅ Cleanup complete`);
    }
  }
};

export const runFcmReminderScheduler = async () => {
  const db = admin.firestore();
  const nowEpochMs = Date.now();
  // BEP v3.0.0: 5-minute lookback — safe due to trigger dedup, handles scheduler jitter
  // BEP v4.2.0: +30 s forward buffer on windowEnd so the scheduler running at T-1 s
  // still catches a reminder at exactly T instead of waiting a full extra minute.
  // Trigger dedup in Firestore ensures no double-sends from the wider window.
  const WINDOW_FORWARD_MS = 30 * 1000; // 30-second forward tolerance
  const windowStart = nowEpochMs - WINDOW_BACK_MS;
  const windowEnd = nowEpochMs + WINDOW_FORWARD_MS;
  const rangeStart = nowEpochMs - WINDOW_BACK_MS;
  const rangeEnd = nowEpochMs + LOOKAHEAD_MS;

  logger.info('🚀 FCM Reminder Scheduler started', { nowEpochMs: new Date(nowEpochMs).toISOString(), windowBackMs: WINDOW_BACK_MS });

  const usersSnapshot = await db.collection("users").get();
  logger.info(`📊 Found ${usersSnapshot.size} users with account`);
  if (usersSnapshot.empty) {
    logger.info('⏭️  No users found, exiting');
    return;
  }

  // BEP v4.0.0: Pre-load canonical events ONCE for all users — avoids redundant
  // Firestore reads per user. Used for NFS series reminder matching fallback.
  // rangeEnd = now + 24h, so this captures all events that could fire today.
  const upcomingCanonicalEvents = await loadUpcomingCanonicalEvents(db, rangeStart, rangeEnd);

  // BEP v3.0.0: Process users in parallel batches for faster execution
  // Uses concurrency limiter to avoid overwhelming Firestore with too many parallel reads
  const userDocs = usersSnapshot.docs;
  
  const processUser = async (userDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const userId = userDoc.id;
    logger.info(`👤 Processing user: ${userId}`);

    const tokensSnapshot = await db.collection(`users/${userId}/${TOKENS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    // BEP v3.1.0: Prune stale device tokens (inactive > 30 days) inline.
    // Avoids wasted FCM sends to dead devices and reduces future Firestore reads.
    // lastSeenAt is updated on every app load, so stale = user stopped using that device.
    const staleThreshold = nowEpochMs - STALE_TOKEN_MS;
    const staleRemovals: Promise<FirebaseFirestore.WriteResult>[] = [];
    const freshTokenDocs = tokensSnapshot.docs.filter((docSnap) => {
      const lastSeenAt = docSnap.get("lastSeenAt");
      // If lastSeenAt is missing, keep the token (may be newly created)
      if (!lastSeenAt) return true;
      const lastSeenMs = typeof lastSeenAt.toMillis === "function"
        ? lastSeenAt.toMillis()
        : new Date(lastSeenAt).getTime();
      if (Number.isNaN(lastSeenMs)) return true;
      if (lastSeenMs < staleThreshold) {
        logger.info(`🗑️  Pruning stale device token for user ${userId} (last seen: ${new Date(lastSeenMs).toISOString()})`);
        staleRemovals.push(docSnap.ref.delete());
        return false;
      }
      return true;
    });

    if (staleRemovals.length > 0) {
      await Promise.allSettled(staleRemovals);
      logger.info(`✅ Pruned ${staleRemovals.length} stale device(s) for user ${userId}`);
    }

    const tokens = freshTokenDocs.map((docSnap) => docSnap.get("token") as string).filter(Boolean);
    logger.info(`📱 Found ${tokens.length} active devices for user ${userId}`);
    if (tokens.length === 0) {
      logger.debug(`⏭️  No active devices for user ${userId}`);
      return;
    }

    const remindersSnapshot = await db.collection(`users/${userId}/${REMINDERS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    logger.info(`📋 Found ${remindersSnapshot.size} enabled reminders for user ${userId}`);
    if (remindersSnapshot.empty) {
      logger.debug(`⏭️  No enabled reminders for user ${userId}`);
      return;
    }

    const reminders: any[] = remindersSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    }));

    const now = new Date(nowEpochMs);
    const pushesTodayKey = getDayKey("America/New_York", now);
    const statsRef = db.doc(`users/${userId}/${STATS_COLLECTION}/${pushesTodayKey}`);
    const statsSnap = await statsRef.get();
    let sentToday = statsSnap.exists ? Number(statsSnap.get("count") || 0) : 0;

    for (const reminder of reminders) {
      if (!reminder?.channels?.push) {
        logger.debug(`⏭️  Reminder ${reminder.eventKey} does not have push channel enabled`);
        continue;
      }
      if (reminder?.enabled === false) {
        logger.debug(`⏭️  Reminder ${reminder.eventKey} is disabled`);
        continue;
      }
      logger.debug(`✅ Processing reminder: ${reminder.eventKey}`);

      let occurrences = expandReminderOccurrences(reminder, rangeStart, rangeEnd);
      logger.info(`📅 Found ${occurrences.length} occurrence(s) for ${reminder.eventKey}`, {
        rangeStart: new Date(rangeStart).toISOString(),
        rangeEnd: new Date(rangeEnd).toISOString(),
      });

      // BEP v4.0.0: Diagnostic log when 0 occurrences found — helps identify missing data
      if (occurrences.length === 0) {
        logger.info(`🔍 Zero occurrences diagnostic for ${reminder.eventKey}`, {
          eventEpochMs: reminder.eventEpochMs,
          recurrenceEnabled: reminder?.metadata?.recurrence?.enabled ?? null,
          recurrenceInterval: reminder?.metadata?.recurrence?.interval ?? null,
          scope: reminder.scope ?? null,
          hasSeriesKey: Boolean(reminder.seriesKey),
          timezone: reminder.timezone ?? null,
        });
      }

      // BEP v4.0.0: Series reminder fallback — match NFS/canonical series against
      // the canonical Firestore events loaded at the start of this run.
      // ROOT CAUSE: Series reminders (scope=series) for NFS events have no recurrence
      // metadata, so expandReminderOccurrences() treats them as one-time past events.
      // FIX: After 0 occurrences from expansion, if this is a series reminder from
      // an NFS-compatible source, find matching canonical events in the time range.
      // Matching ignores impact (client labels 'strong data' ≠ Firestore 'High') and
      // category — only requires name + currency match.
      if (occurrences.length === 0 && reminder.scope === "series") {
        const parsed = parseSeriesKey(reminder.eventKey || reminder.seriesKey || "");
        if (parsed && CANONICAL_SOURCE_PREFIXES.has(parsed.source)) {
          const matches = upcomingCanonicalEvents.filter((entry) => {
            const nameMatch = entry.name === parsed.name;
            // Currency: null in parsed means "na" (no currency) — match any currency;
            // otherwise require exact (lowercased) currency match
            const currencyMatch = parsed.currency === null || entry.currency === parsed.currency;
            return nameMatch && currencyMatch;
          });
          if (matches.length > 0) {
            logger.info(`📅 Series fallback: found ${matches.length} canonical match(es) for ${reminder.eventKey}`);
            occurrences = matches.map((entry) => ({
              occurrenceEpochMs: entry.epochMs,
              occurrenceKey: `${reminder.eventKey}__${entry.epochMs}`,
            }));
          } else {
            logger.debug(`⏭️  Series fallback: no canonical matches for ${reminder.eventKey} (name="${parsed.name}", currency="${parsed.currency ?? "na"}")`);
          }
        }
      }

      if (occurrences.length === 0) continue;

      for (const occurrence of occurrences) {
        // BEP v2.0.0: Occurrence-level dedup — ONE push per event per occurrence per user.
        // Check if ANY offset has already sent a push for this occurrence.
        const occurrenceTriggerId = `${reminder.eventKey}__${occurrence.occurrenceEpochMs}__push`;
        const encodedOccurrenceId = encodeFirestoreDocId(occurrenceTriggerId);
        const occurrenceTriggerRef = db.doc(`users/${userId}/${TRIGGERS_COLLECTION}/${encodedOccurrenceId}`);
        const occurrenceTriggerSnap = await occurrenceTriggerRef.get();
        if (occurrenceTriggerSnap.exists) {
          logger.debug(`⏭️  Already sent push for occurrence: ${occurrenceTriggerId}`);
          continue;
        }

        const reminderOffsets = Array.isArray(reminder.reminders) ? reminder.reminders : [];
        let pushSentForOccurrence = false;

        for (const offset of reminderOffsets) {
          if (pushSentForOccurrence) break; // BEP v2.0.0: Only one push per occurrence

          // BEP: Only send push for offsets that have push channel enabled
          if (!offset?.channels?.push) continue;

          const minutesBefore = Number(offset?.minutesBefore);
          if (!Number.isFinite(minutesBefore)) continue;
          const reminderAt = occurrence.occurrenceEpochMs - minutesBefore * 60 * 1000;
          // BEP v2.0.0: Only fire if reminder time is IN THE PAST (between windowStart and now)
          const isInWindow = reminderAt >= windowStart && reminderAt <= windowEnd;
          logger.info(`⏰ Window check for ${reminder.eventKey}`, {
            reminderAt: new Date(reminderAt).toISOString(),
            windowStart: new Date(windowStart).toISOString(),
            windowEnd: new Date(windowEnd).toISOString(),
            nowEpochMs: new Date(nowEpochMs).toISOString(),
            isInWindow,
            isPast: reminderAt <= nowEpochMs,
          });
          if (!isInWindow) continue;

          if (sentToday >= DAILY_CAP) {
            logger.info(`⚠️  Daily cap reached (${DAILY_CAP}) for user ${userId}`);
            break;
          }

          // BEP v2.0.0: Encode triggerId for safe Firestore doc paths
          const triggerId = buildTriggerId(reminder.eventKey, occurrence.occurrenceEpochMs, minutesBefore, "push");
          const encodedTriggerId = encodeFirestoreDocId(triggerId);
          const triggerRef = db.doc(`users/${userId}/${TRIGGERS_COLLECTION}/${encodedTriggerId}`);
          const triggerSnap = await triggerRef.get();
          if (triggerSnap.exists) {
            logger.debug(`⏭️  Trigger already sent: ${triggerId}`);
            continue;
          }

          // BEP v2.0.0: Record BOTH per-offset and per-occurrence triggers
          await triggerRef.set({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          await occurrenceTriggerRef.set({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const title = reminder.title || "Reminder";
          const body = minutesBefore === 0 
            ? `🔔 ${title} is starting now!`
            : `⏰ ${minutesBefore} min before • ${title}`;
          const tag = `t2t-${reminder.eventKey || `${occurrence.occurrenceEpochMs}`}`;

          try {
            logger.info(`📤 Sending FCM push to ${tokens.length} devices`, {
              userId,
              eventKey: reminder.eventKey,
              minutesBefore,
              title,
              tag,
            });
            await sendPushToTokens(
              tokens,
              title,
              body,
              tag,
              {
                eventKey: reminder.eventKey || "",
                eventSource: reminder.eventSource || "",
                occurrenceEpochMs: String(occurrence.occurrenceEpochMs),
                minutesBefore: String(minutesBefore),
                clickUrl: "/calendar",
                tag,
              },
              userId
            );
            logger.info(`✅ FCM push sent successfully for ${reminder.eventKey}`);
            sentToday += 1;
            pushSentForOccurrence = true; // BEP v2.0.0: Block further offsets for this occurrence
          } catch (error) {
            logger.error("❌ Failed to send FCM push", { userId, eventKey: reminder.eventKey, error });
          }
        }
      }

      if (sentToday >= DAILY_CAP) break;
    }

    await statsRef.set({
      count: sentToday,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  };

  // BEP v3.0.0: Process users in parallel batches (USER_CONCURRENCY at a time)
  // This dramatically reduces total execution time compared to sequential processing
  for (let i = 0; i < userDocs.length; i += USER_CONCURRENCY) {
    const batch = userDocs.slice(i, i + USER_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((userDoc) => processUser(userDoc)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`❌ Failed to process user ${batch[index].id}:`, { error: String(result.reason) });
      }
    });
  }

  logger.info('✅ FCM Reminder Scheduler complete');
};
