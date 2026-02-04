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
 * v1.7.0 - 2026-02-04 - BEP FIX: Window now only looks BACK (90s), not forward. This ensures
 *                       notifications NEVER fire before the scheduled reminder time. Previously,
 *                       windowEnd was nowEpochMs + 90s which caused notifications to fire up to
 *                       90 seconds early. Now windowEnd = nowEpochMs (current time).
 * v1.6.0 - 2026-02-04 - BEP FIX: Use correct FCM v1 API payload structure. badge/tag/sound must go
 *                       in platform-specific sections (android.notification, webpush.notification),
 *                       not in the top-level notification object. Added proper Android channel ID,
 *                       web push badge icon, vibration pattern, and requireInteraction for PWA.
 * v1.5.0 - 2026-02-04 - BEP FIX: Window set to 90s for 1-minute schedule (near-instant delivery).
 *                       Added detailed logging for occurrence expansion and window checks.
 * v1.4.0 - 2026-02-03 - BEP FIX: Add comprehensive logging to FCM scheduler for troubleshooting.
 *                       Logs: function start, users found, devices per user, reminders fetched,
 *                       push channel validation, FCM send attempts, success/failure counts, and
 *                       invalid token cleanup. Helps diagnose why FCM messages aren't being sent.
 * v1.3.0 - 2026-02-03 - BEP FIX: Add Android PWA push support with badge icon, vibration patterns,
 *                       and tag deduplication. FCM payload now includes badge image, vibrate data,
 *                       and tag in both notification and data fields for Android Chrome PWA compatibility.
 * v1.2.0 - 2026-02-03 - BEP: Document automatic invalid token cleanup in sendPushToTokens().
 *                       Tokens that fail with registration errors are deleted from Firestore.
 * v1.1.0 - 2026-02-03 - BEP FIX: Only send push for individual reminder offsets that have push channel enabled.
 *                       Previously, if ANY offset had push enabled, push would be sent for ALL offsets.
 * v1.0.0 - 2026-01-23 - Initial FCM reminder scheduler for push notifications.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const TOKENS_COLLECTION = "deviceTokens";
const REMINDERS_COLLECTION = "reminders";
const TRIGGERS_COLLECTION = "notificationTriggers";
const STATS_COLLECTION = "notificationStats";

// BEP: Window looks 90 seconds BACK to catch any reminders that came due since last run.
// We do NOT look forward - notifications should only fire AT or AFTER reminder time.
// Trigger deduplication in Firestore prevents duplicate notifications.
const WINDOW_BACK_MS = 90 * 1000; // Look back 90 seconds (covers 1-min schedule + buffer)
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const DAILY_CAP = 150;

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
      webpush: {
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
  // BEP: Only look BACK - notifications should never fire BEFORE the reminder time
  const windowStart = nowEpochMs - WINDOW_BACK_MS; // 90 seconds ago
  const windowEnd = nowEpochMs; // NOW - not in the future!
  const rangeStart = nowEpochMs - WINDOW_BACK_MS;
  const rangeEnd = nowEpochMs + LOOKAHEAD_MS;

  logger.info('🚀 FCM Reminder Scheduler started', { nowEpochMs: new Date(nowEpochMs).toISOString() });

  const usersSnapshot = await db.collection("users").get();
  logger.info(`📊 Found ${usersSnapshot.size} users with account`);
  if (usersSnapshot.empty) {
    logger.info('⏭️  No users found, exiting');
    return;
  }

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    logger.info(`👤 Processing user: ${userId}`);

    const tokensSnapshot = await db.collection(`users/${userId}/${TOKENS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    const tokens = tokensSnapshot.docs.map((docSnap) => docSnap.get("token") as string).filter(Boolean);
    logger.info(`📱 Found ${tokens.length} enabled devices for user ${userId}`);
    if (tokens.length === 0) {
      logger.debug(`⏭️  No enabled devices for user ${userId}`);
      continue;
    }

    const remindersSnapshot = await db.collection(`users/${userId}/${REMINDERS_COLLECTION}`)
      .where("enabled", "==", true)
      .get();

    logger.info(`📋 Found ${remindersSnapshot.size} enabled reminders for user ${userId}`);
    if (remindersSnapshot.empty) {
      logger.debug(`⏭️  No enabled reminders for user ${userId}`);
      continue;
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

      // BEP: Quiet hours temporarily disabled for testing
      // TODO: Make quiet hours user-configurable via settings
      // const timezone = reminder.timezone || "America/New_York";
      // const inQuietHours = isWithinQuietHours(timezone, now);
      // if (inQuietHours) {
      //   logger.info(`🌙 Skipping ${reminder.eventKey} - within quiet hours (22:00-06:00 ${timezone})`);
      //   continue;
      // }

      const occurrences = expandReminderOccurrences(reminder, rangeStart, rangeEnd);
      logger.info(`📅 Found ${occurrences.length} occurrence(s) for ${reminder.eventKey}`, {
        rangeStart: new Date(rangeStart).toISOString(),
        rangeEnd: new Date(rangeEnd).toISOString(),
      });
      if (occurrences.length === 0) continue;

      for (const occurrence of occurrences) {
        const reminderOffsets = Array.isArray(reminder.reminders) ? reminder.reminders : [];
        for (const offset of reminderOffsets) {
          // BEP: Only send push for offsets that have push channel enabled
          if (!offset?.channels?.push) continue;

          const minutesBefore = Number(offset?.minutesBefore);
          if (!Number.isFinite(minutesBefore)) continue;
          const reminderAt = occurrence.occurrenceEpochMs - minutesBefore * 60 * 1000;
          // BEP: Only fire if reminder time is IN THE PAST (between windowStart and now)
          // This ensures notifications never fire early
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

          const triggerId = buildTriggerId(reminder.eventKey, occurrence.occurrenceEpochMs, minutesBefore, "push");
          const triggerRef = db.doc(`users/${userId}/${TRIGGERS_COLLECTION}/${triggerId}`);
          const triggerSnap = await triggerRef.get();
          if (triggerSnap.exists) {
            logger.debug(`⏭️  Trigger already sent: ${triggerId}`);
            continue;
          }

          await triggerRef.set({
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
  }
};
