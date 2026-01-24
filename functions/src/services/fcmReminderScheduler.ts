/**
 * functions/src/services/fcmReminderScheduler.ts
 * 
 * Purpose: Server-side FCM push scheduler for reminder notifications.
 * Key responsibility and main functionality: Expand reminder occurrences, dedupe triggers,
 * enforce daily caps/quiet hours, and send push notifications via Firebase Admin SDK.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-23 - Initial FCM reminder scheduler for push notifications.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const TOKENS_COLLECTION = "deviceTokens";
const REMINDERS_COLLECTION = "reminders";
const TRIGGERS_COLLECTION = "notificationTriggers";
const STATS_COLLECTION = "notificationStats";

const WINDOW_MS = 2 * 60 * 1000;
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const DAILY_CAP = 150;
const QUIET_HOURS = { start: 22, end: 6 };

const RECURRENCE_INTERVALS: Record<string, { unit: string; step: number; ms?: number }> = {
  "5m": { unit: "minute", step: 5, ms: 5 * 60 * 1000 },
  "15m": { unit: "minute", step: 15, ms: 15 * 60 * 1000 },
  "30m": { unit: "minute", step: 30, ms: 30 * 60 * 1000 },
  "1h": { unit: "hour", step: 1, ms: 60 * 60 * 1000 },
  "4h": { unit: "hour", step: 4, ms: 4 * 60 * 60 * 1000 },
  "1D": { unit: "day", step: 1 },
  "1W": { unit: "week", step: 1 },
  "1M": { unit: "month", step: 1 },
  "1Q": { unit: "quarter", step: 1 },
  "1Y": { unit: "year", step: 1 },
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

  let stepDays = 0;
  let stepMonths = 0;
  if (intervalMeta.unit === "day") stepDays = intervalMeta.step;
  if (intervalMeta.unit === "week") stepDays = intervalMeta.step * 7;
  if (intervalMeta.unit === "month") stepMonths = intervalMeta.step;
  if (intervalMeta.unit === "quarter") stepMonths = intervalMeta.step * 3;
  if (intervalMeta.unit === "year") stepMonths = intervalMeta.step * 12;

  let startIndex = 0;
  if (stepDays > 0) {
    const diffDays = Math.floor((rangeStartUtc.getTime() - baseDateUtc.getTime()) / dayMs);
    startIndex = diffDays > 0 ? Math.floor(diffDays / stepDays) : 0;
  } else if (stepMonths > 0) {
    const diffMonths = (rangeStartParts.year - localDateParts.year) * 12 + (rangeStartParts.month - localDateParts.month);
    startIndex = diffMonths > 0 ? Math.floor(diffMonths / stepMonths) : 0;
  }

  let currentIndex = Math.max(0, startIndex);
  while (generated < 5000) {
    let nextDateParts = localDateParts;
    if (stepDays > 0) {
      nextDateParts = addDaysToLocalDateParts(localDateParts, currentIndex * stepDays);
    }
    if (stepMonths > 0) {
      nextDateParts = addMonthsToLocalDateParts(localDateParts, currentIndex * stepMonths);
    }

    const occurrenceEpochMs = buildEpochFromLocalParts(timezone, { ...nextDateParts, ...timeParts });
    if (occurrenceEpochMs < rangeStartMs) {
      currentIndex += 1;
      continue;
    }
    if (occurrenceEpochMs > rangeEndMs) break;
    if (untilEpochMs !== null && occurrenceEpochMs > untilEpochMs) break;
    if (Number.isFinite(maxCount) && currentIndex >= maxCount) break;

    occurrences.push({
      occurrenceEpochMs,
      occurrenceKey: `${reminder.eventKey}__${occurrenceEpochMs}`,
    });

    generated += 1;
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

const isWithinQuietHours = (timezone: string, now = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  const hour = Number(formatter.format(now));
  if (Number.isNaN(hour)) return false;
  if (QUIET_HOURS.start < QUIET_HOURS.end) {
    return hour >= QUIET_HOURS.start && hour < QUIET_HOURS.end;
  }
  return hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end;
};

const sendPushToTokens = async (tokens: string[], payload: admin.messaging.MessagingPayload, userId: string) => {
  if (tokens.length === 0) return;
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: payload.notification,
      data: payload.data,
    });

    const removals: Promise<FirebaseFirestore.WriteResult>[] = [];
    response.responses.forEach((res, index) => {
      if (res.success) return;
      const errorCode = res.error?.code || "";
      if (errorCode.includes("registration-token-not-registered") || errorCode.includes("invalid-registration-token")) {
        const token = chunk[index];
        const tokenRef = admin.firestore().doc(`users/${userId}/${TOKENS_COLLECTION}/${token}`);
        removals.push(tokenRef.delete());
      }
    });

    if (removals.length) {
      await Promise.allSettled(removals);
    }
  }
};

export const runFcmReminderScheduler = async () => {
  const db = admin.firestore();
  const nowEpochMs = Date.now();
  const windowStart = nowEpochMs - WINDOW_MS;
  const windowEnd = nowEpochMs + WINDOW_MS;
  const rangeStart = nowEpochMs - WINDOW_MS;
  const rangeEnd = nowEpochMs + LOOKAHEAD_MS;

  const usersSnapshot = await db.collection("users").get();
  if (usersSnapshot.empty) return;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const tokensSnapshot = await db.collection(`users/${userId}/${TOKENS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    const tokens = tokensSnapshot.docs.map((docSnap) => docSnap.get("token") as string).filter(Boolean);
    if (tokens.length === 0) continue;

    const remindersSnapshot = await db.collection(`users/${userId}/${REMINDERS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    if (remindersSnapshot.empty) continue;

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
      if (!reminder?.channels?.push) continue;
      if (reminder?.enabled === false) continue;

      const timezone = reminder.timezone || "America/New_York";
      if (isWithinQuietHours(timezone, now)) continue;

      const occurrences = expandReminderOccurrences(reminder, rangeStart, rangeEnd);
      if (occurrences.length === 0) continue;

      for (const occurrence of occurrences) {
        const reminderOffsets = Array.isArray(reminder.reminders) ? reminder.reminders : [];
        for (const offset of reminderOffsets) {
          const minutesBefore = Number(offset?.minutesBefore);
          if (!Number.isFinite(minutesBefore)) continue;
          const reminderAt = occurrence.occurrenceEpochMs - minutesBefore * 60 * 1000;
          if (reminderAt < windowStart || reminderAt > windowEnd) continue;

          if (sentToday >= DAILY_CAP) break;

          const triggerId = buildTriggerId(reminder.eventKey, occurrence.occurrenceEpochMs, minutesBefore, "push");
          const triggerRef = db.doc(`users/${userId}/${TRIGGERS_COLLECTION}/${triggerId}`);
          const triggerSnap = await triggerRef.get();
          if (triggerSnap.exists) continue;

          await triggerRef.set({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const title = reminder.title || "Reminder";
          const body = `${minutesBefore} min before • ${title}`;

          try {
            await sendPushToTokens(tokens, {
              notification: { title, body },
              data: {
                eventKey: reminder.eventKey || "",
                eventSource: reminder.eventSource || "",
                occurrenceEpochMs: String(occurrence.occurrenceEpochMs),
                minutesBefore: String(minutesBefore),
                clickUrl: "/calendar",
              },
            }, userId);
            sentToday += 1;
          } catch (error) {
            logger.error("❌ Failed to send FCM push", { userId, error });
          }
        }
      }

      if (sentToday >= DAILY_CAP) break;
    }

    await statsRef.set({
      count: sentToday,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
};
