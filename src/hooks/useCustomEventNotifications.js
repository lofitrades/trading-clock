/**
 * src/hooks/useCustomEventNotifications.js
 * 
 * Purpose: Schedule and surface in-app/browser notifications for custom reminder events.
 * Key responsibility and main functionality: Detect due reminders, persist notifications,
 * and optionally trigger browser notifications with permission checks.
 * 
 * Changelog:
 * v4.5.0 - 2026-02-20 - BEP CRITICAL FIX: occurrenceSources routing broke scope=series
 *                       recurring custom events in-app+browser channels.
 *                       ROOT CAUSE: v4.4.0 correctly populated `occurrences` via
 *                       expandReminderOccurrences() for series+hasStoredRecurrence, but
 *                       `occurrenceSources` was still gated on `scope === 'series'` and
 *                       always routed those reminders through `seriesMatches` (empty for
 *                       custom events). `occurrences` was computed but never consumed.
 *                       FIX: occurrenceSources uses `occurrences` whenever hasStoredRecurrence
 *                       is true — only falls back to seriesMatches for pure NFS series
 *                       reminders (no recurrence metadata).
 * v4.4.0 - 2026-02-19 - BEP CRITICAL FIX: Custom recurring series reminders (my-events)
 *                       never fired for in-app/browser channels.
 *                       ROOT CAUSE: scope=series reminders were forced to occurrences=[]
 *                       and relied on NFS API upcomingEvents series matching. Custom
 *                       my-events events don't appear in the NFS API, so seriesMatches
 *                       was always empty for custom series (NY Open, Market Close, etc.).
 *                       FIX: If a series reminder has stored recurrence metadata
 *                       (enabled=true + valid interval + valid eventEpochMs), use
 *                       expandReminderOccurrences() instead of forcing occurrences=[].
 *                       NFS series reminders (no recurrence config) continue to use the
 *                       existing API-based series matching via upcomingEvents.
 * v4.3.0 - 2026-02-10 - BEP CRITICAL FIX: Recurring custom event notification duplication (25→1).
 *                       ROOT CAUSE: customEventsService expands recurring events into N occurrence
 *                       objects for display (30 for daily over 30 days). Each occurrence has a
 *                       unique id (seriesId__epochMs), producing unique eventKeys that bypass all
 *                       dedup layers. All N enter the tick loop independently, each expanding its
 *                       own recurrence window, generating 25+ duplicate notifications per trigger.
 *                       FIX: Collapse expanded occurrences by seriesId in legacyReminders — keep
 *                       ONE representative per recurring series. Normalize with seriesId as event
 *                       id for stable eventKey (custom:seriesId) matching the Firestore reminder.
 *                       expandReminderOccurrences() handles generating actual occurrence timestamps.
 * v4.2.0 - 2026-02-09 - BEP PLATFORM-AWARE CHANNELS: Browser notifications fire only on non-PWA
 *                       devices. Push channel is PWA-only. Eliminates duplicate notifications on
 *                       both browser tabs and PWA devices. On PWA, browser channel is skipped
 *                       (push/SW handles it). On non-PWA, push channel is skipped (browser handles it).
 * v4.1.0 - 2026-02-08 - BEP CRITICAL: Fix Firestore write stream exhaustion (resource-exhausted).
 *                       ROOT CAUSE: 15-second interval loop fired 60+ individual fire-and-forget
 *                       setDoc calls via recordNotificationTrigger() per tick. Each call was a
 *                       separate Firestore write, overwhelming the write stream on remount.
 *                       FIX: Collect all trigger payloads during the loop into pendingTriggerWrites
 *                       array, then batch-write via single writeBatch after loop completes.
 *                       Max 50 trigger writes per tick to prevent flooding.
 * v4.0.0 - 2026-02-07 - BEP CRITICAL: Enterprise-grade deduplication overhaul (6→1 notification fix).
 *                       ROOT CAUSES FIXED:
 *                       1) Browser channel suppressed when push is also enabled for same offset —
 *                          push via FCM/SW already shows a browser notification, so client-side
 *                          `new Notification()` was a duplicate. Now: if push channel active on
 *                          the offset, skip browser dispatch entirely (server+SW handles it).
 *                       2) In-app optimistic update collided with Firestore onSnapshot replay —
 *                          Firestore listener replaces state array, so optimistic item + snapshot
 *                          item briefly coexist. Fix: optimistic updates now use a dedicated
 *                          `pendingOptimisticIds` ref. Firestore listener merges with pending
 *                          items instead of replacing, then clears pending once snapshot confirms.
 *                       3) Legacy reminders from `events` prop duplicated Firestore reminders —
 *                          effectiveReminders merge used eventKey, but legacy normalizer could
 *                          produce different keys for same event. Fix: legacy path now only adds
 *                          reminders that have NO Firestore counterpart at all (strict eventKey match).
 *                       4) FCM foreground listener now wired — when app is in foreground, intercepts
 *                          push payload and converts to in-app notification instead of letting SW
 *                          show a duplicate browser notification.
 * v3.0.0 - 2026-02-07 - BEP CRITICAL: Comprehensive notification deduplication overhaul.
 *                       1) Occurrence-level dedup: one notification per event per occurrence per channel
 *                          (not per reminder offset). Uses occurrenceKey in triggers Set to block
 *                          subsequent offsets after the first fires.
 *                       2) Tightened isDue window: reminderAt + NOW_WINDOW_MS instead of
 *                          occurrenceEpochMs + NOW_WINDOW_MS. Prevents wide windows for large
 *                          minutesBefore values (was 69min for 60-min offset, now 9min for all).
 *                       3) Fresh localStorage merge each tick: merges triggersRef with localStorage
 *                          to handle component remounts and cross-tab dedup.
 *                       4) isRunning guard: prevents overlapping async tick executions.
 *                       5) Browser notification tag: uses occurrenceKey for proper OS-level collapse.
 *                       6) Auto-expiry: notifications older than 24h auto-marked as read in state.
 *                       7) State-level dedup: visibleNotifications deduped by eventKey+eventEpochMs.
 * v2.8.0 - 2026-02-04 - BEP CRITICAL FIX: Do NOT record push triggers to Firestore from client-side.
 * v2.7.0 - 2026-02-03 - BEP FIX: Remove 'push' channel client-side handling.
 * v2.6.0 - 2026-02-03 - BEP FIX: Add real-time listener to preferences document.
 * v2.5.0 - 2026-02-03 - BEP: Support user-customizable quiet hours from Firestore preferences.
 * v2.4.0 - 2026-02-03 - BEP FIX: Expand rangeStartMs to look back by NOW_WINDOW_MS.
 * v2.3.0 - 2026-02-03 - DEBUG: Add comprehensive debug logging.
 * v2.2.0 - 2026-02-03 - BEP FIX: Add optimistic UI update for in-app notifications.
 * v2.1.0 - 2026-01-23 - Add series reminder matching for upcoming economic events.
 * v2.0.1 - 2026-01-23 - Skip reminder triggers for repeat intervals under 1h.
 * v2.0.0 - 2026-01-23 - Upgrade to unified reminders engine with recurrence expansion and trigger dedupe.
 * v1.7.0 - 2026-01-23 - CLEANUP: Remove debug console.log statements.
 * v1.6.0 - 2026-01-23 - BEP FIX: Subscription logging and localStorage fallback.
 * v1.5.0 - 2026-01-23 - BEP FIX: try-catch error handling for addNotificationForUser.
 * v1.4.0 - 2026-01-22 - BEP: Persist authenticated notifications in Firestore.
 * v1.3.0 - 2026-01-22 - BEP UX: Enhanced notification messages with TradingView-style detail.
 * v1.2.1 - 2026-01-22 - Remove email channel and allow push reminders.
 * v1.1.0 - 2026-01-21 - Send email reminders via callable and keep only in-app notifications.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { NOW_WINDOW_MS, getEventEpochMs } from '../utils/eventTimeEngine';
import { resolveImpactMeta } from '../utils/newsApi';
import { formatTime } from '../utils/dateUtils';
import { buildSeriesKey, expandReminderOccurrences, normalizeEventForReminder } from '../utils/remindersRegistry';
import { DAILY_REMINDER_CAP, THROTTLE_WINDOW_MS, getDayKeyForTimezone, isWithinQuietHours } from '../utils/remindersPolicy';
import { getEventsByDateRange } from '../services/economicEventsService';
import {
  addLocalNotification,
  addNotificationForUser,
  clearLocalNotifications,
  clearNotificationsForUser,
  loadLocalNotifications,
  markAllLocalNotificationsRead,
  markAllNotificationsReadForUser,
  markLocalNotificationRead,
  markNotificationReadForUser,
  subscribeToNotifications,
} from '../services/notificationsService';
import {
  batchRecordNotificationTriggers,
  buildTriggerId,
  loadLocalTriggerIds,
  saveLocalTriggerIds,
  subscribeToReminders,
} from '../services/remindersService';

const ENABLED_CHANNELS = new Set(['inApp', 'browser', 'push']);
const DAILY_COUNTS_KEY = 't2t_unified_notification_daily_counts_v1';
const DISALLOWED_REPEAT_INTERVALS = new Set(['5m', '15m', '30m']);

/**
 * BEP v4.2.0: Platform detection for channel routing.
 * - PWA devices: Use push channel (FCM/SW), skip browser channel
 * - Non-PWA devices: Use browser channel (new Notification()), skip push channel
 * - In-App: Always works on all platforms
 */
const IS_PWA = typeof window !== 'undefined' && (
  window.matchMedia?.('(display-mode: standalone)')?.matches ||
  window.navigator?.standalone === true
);

const getChannelsForReminder = (reminder) => {
  const channels = reminder?.channels || {};
  return Object.keys(channels).filter((key) => channels[key] && ENABLED_CHANNELS.has(key));
};

const readStore = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStore = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures
  }
};

const loadDailyCounts = (userId) => {
  const store = readStore(DAILY_COUNTS_KEY) || {};
  return store[userId || 'guest'] || {};
};

const saveDailyCounts = (userId, counts) => {
  const store = readStore(DAILY_COUNTS_KEY) || {};
  store[userId || 'guest'] = counts;
  writeStore(DAILY_COUNTS_KEY, store);
};

export const useCustomEventNotifications = ({ events = [] } = {}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => (user?.uid ? [] : loadLocalNotifications(user?.uid)));
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'));
  const [reminders, setReminders] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [quietHours, setQuietHours] = useState({ enabled: true, start: 21, end: 6 });
  const triggersRef = useRef(loadLocalTriggerIds(user?.uid));
  const dailyCountsRef = useRef(loadDailyCounts(user?.uid));
  const lastTriggeredRef = useRef(new Map());
  // BEP v4.0.0: Track optimistic in-app notification IDs to prevent Firestore listener from adding dupes
  const pendingOptimisticIdsRef = useRef(new Set());

  // Load user's quiet hours preferences with real-time listener
  useEffect(() => {
    if (!user?.uid) {
      setQuietHours({ enabled: true, start: 21, end: 6 });
      return undefined;
    }

    try {
      const prefRef = doc(db, 'users', user.uid, 'preferences', 'notifications');
      const unsubscribe = onSnapshot(
        prefRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setQuietHours({
              enabled: data.quietHoursEnabled ?? true,
              start: data.quietHoursStart ?? 21,
              end: data.quietHoursEnd ?? 6,
            });
          } else {
            setQuietHours({ enabled: true, start: 21, end: 6 });
          }
        },
        (err) => {
          console.warn('[useCustomEventNotifications] Failed to subscribe to quiet hours:', err);
          setQuietHours({ enabled: true, start: 21, end: 6 });
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('[useCustomEventNotifications] Error setting up quiet hours listener:', err);
      setQuietHours({ enabled: true, start: 21, end: 6 });
      return undefined;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications(loadLocalNotifications(user?.uid));
      return undefined;
    }

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (items) => {
        // BEP v4.0.0: Merge Firestore snapshot with pending optimistic items
        // Firestore snapshot is the source of truth — any optimistic item whose ID
        // now appears in Firestore is confirmed and the optimistic copy is dropped.
        const firestoreIds = new Set(items.map((n) => n.id));
        // Clear confirmed optimistic IDs
        pendingOptimisticIdsRef.current.forEach((id) => {
          if (firestoreIds.has(id)) {
            pendingOptimisticIdsRef.current.delete(id);
          }
        });
        setNotifications(items);
      },
      (error) => {
        console.error('❌ Failed to subscribe to notifications:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
        // Fallback to localStorage on subscription failure
        const fallback = loadLocalNotifications(user.uid);
        setNotifications(fallback);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    triggersRef.current = loadLocalTriggerIds(user?.uid);
    dailyCountsRef.current = loadDailyCounts(user?.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setReminders([]);
      return undefined;
    }

    const unsubscribe = subscribeToReminders(
      user.uid,
      (items) => {
        setReminders(items || []);
      },
      (error) => {
        console.error('❌ Failed to subscribe to reminders:', {
          code: error?.code,
          message: error?.message,
        });
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const legacyReminders = useMemo(() => {
    // BEP FIX v4.3.0: Collapse recurring event occurrences by seriesId.
    // customEventsService.expandRecurringEvent() expands a recurring event into N occurrence
    // objects for calendar/clock display (e.g., 30 for a daily event over 30 days). Each
    // occurrence gets a unique id (seriesId__epochMs) which produces a unique eventKey via
    // buildEventIdentity. Without collapsing, all N occurrences enter the tick loop as
    // independent reminders, each expanding its own recurrence window and bypassing dedup
    // (because dedup keys include the per-occurrence eventKey). Result: 25+ duplicate
    // notifications per trigger.
    // FIX: Group recurring occurrences by seriesId, keep ONE representative per series.
    // Normalize with seriesId as the event id so the eventKey is stable (custom:seriesId),
    // matching the Firestore reminder key. expandReminderOccurrences() handles generating
    // actual occurrence timestamps from the single representative.
    const collapsedEvents = (() => {
      const seriesMap = new Map();
      const singles = [];

      (events || []).forEach((event) => {
        const sid = event.seriesId;
        if (event.recurrence?.enabled && sid) {
          const existing = seriesMap.get(sid);
          if (!existing) {
            seriesMap.set(sid, event);
          } else if (event.id === sid) {
            // Prefer the base event (id === seriesId) over expanded occurrences
            seriesMap.set(sid, event);
          } else if (existing.id !== sid && (event.epochMs || 0) < (existing.epochMs || 0)) {
            // Both are expanded occurrences — keep the earliest for most accurate base
            seriesMap.set(sid, event);
          }
        } else {
          singles.push(event);
        }
      });

      return [...singles, ...seriesMap.values()];
    })();

    const mapped = collapsedEvents.map((event) => {
      // BEP FIX: For recurring occurrences, normalize with seriesId as the event id.
      // This produces a stable eventKey (custom:seriesId) regardless of which occurrence
      // was selected as representative. Without this, occurrence ids (seriesId__epochMs)
      // produce unique keys that bypass all notification dedup layers.
      const stableEvent = (event.recurrence?.enabled && event.seriesId && event.id !== event.seriesId)
        ? { ...event, id: event.seriesId }
        : event;

      const normalized = normalizeEventForReminder({
        event: stableEvent,
        source: 'custom',
        userId: user?.uid,
        reminders: event.reminders,
        metadata: {
          recurrence: event.recurrence || null,
          localDate: event.localDate || null,
          localTime: event.localTime || null,
          isCustom: true,
          seriesId: event.seriesId || event.id || null,
        },
      });
      return normalized;
    });

    const filtered = mapped.filter((reminder) => reminder.reminders && reminder.reminders.length > 0);

    return filtered;
  }, [events, user?.uid]);

  const effectiveReminders = useMemo(() => {
    const map = new Map();
    reminders.forEach((reminder) => {
      if (reminder?.eventKey) map.set(reminder.eventKey, reminder);
    });
    legacyReminders.forEach((reminder) => {
      if (reminder?.eventKey && !map.has(reminder.eventKey)) {
        map.set(reminder.eventKey, reminder);
      }
    });
    return Array.from(map.values());
  }, [reminders, legacyReminders]);

  const hasSeriesReminders = useMemo(
    () => effectiveReminders.some((reminder) => reminder?.scope === 'series' && reminder?.seriesKey),
    [effectiveReminders]
  );

  useEffect(() => {
    if (!hasSeriesReminders) {
      setUpcomingEvents([]);
      return undefined;
    }

    let isMounted = true;
    const loadUpcoming = async () => {
      const start = new Date();
      const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await getEventsByDateRange(start, end, {}, { enrichDescriptions: false });
      if (isMounted) {
        setUpcomingEvents(result?.data || result?.events || []);
      }
    };

    void loadUpcoming();
    const timer = setInterval(() => {
      void loadUpcoming();
    }, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [hasSeriesReminders]);

  const notifyBrowser = useCallback((title, body, occurrenceTag) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      // BEP: Use occurrence-based tag so the OS collapses duplicates per event+occurrence
      new Notification(title, { body, tag: occurrenceTag || `t2t-${title}` });
    } catch {
      // Ignore browser notification errors
    }
  }, []);

  // BEP: Guard to prevent overlapping async tick executions
  const isRunningRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // BEP: Prevent overlapping runs (defensive — run is mostly synchronous, but guards edge cases)
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      const run = async () => {
        try {
          if (!effectiveReminders.length) return;

          // BEP v4.1.0: Collect trigger writes for single batched Firestore operation
          // Replaces 60+ individual fire-and-forget setDoc calls that caused resource-exhausted
          const pendingTriggerWrites = [];

          const nowEpochMs = Date.now();
          // BEP FIX v2.4.0: Look back by NOW_WINDOW_MS so events currently happening are still included
          const rangeStartMs = nowEpochMs - NOW_WINDOW_MS;
          const rangeEndMs = nowEpochMs + 24 * 60 * 60 * 1000;

          // BEP v3.0.0: Merge in-memory triggers with fresh localStorage read each tick
          // Handles component remounts, cross-tab writes, and stale ref edge cases
          const freshLocalTriggers = loadLocalTriggerIds(user?.uid);
          let triggers = new Set([...triggersRef.current, ...freshLocalTriggers]);
          let dailyCounts = dailyCountsRef.current;
          let didUpdate = false;

          // BEP v3.0.0: Track if triggers grew from merge (needs persistence)
          if (triggers.size > triggersRef.current.size) {
            didUpdate = true;
          }

          effectiveReminders.forEach((reminderRecord) => {
            if (!reminderRecord?.enabled) return;

            const recurrenceInterval = reminderRecord?.metadata?.recurrence?.interval;
            if (DISALLOWED_REPEAT_INTERVALS.has(recurrenceInterval)) {
              return;
            }

            // BEP v4.4.0: Custom recurring series reminders use expandReminderOccurrences.
            // ROOT CAUSE: scope=series reminders were forced to occurrences=[] then relied on
            // NFS API series matching (upcomingEvents). Custom my-events series are NOT in the
            // NFS API — their events don't appear in upcomingEvents — so seriesMatches was
            // always empty and they never fired.
            // FIX: If the series reminder has stored recurrence (enabled=true + valid interval)
            // AND a valid eventEpochMs, use expandReminderOccurrences. This handles recurring
            // custom events (NY Open, Market Close) stored with scope=series.
            // NFS series reminders have no recurrence config so they still use series matching.
            const hasStoredRecurrence = (
              reminderRecord?.metadata?.recurrence?.enabled === true
              && reminderRecord?.metadata?.recurrence?.interval
              && reminderRecord?.metadata?.recurrence?.interval !== 'none'
              && Number.isFinite(reminderRecord?.eventEpochMs)
            );

            const occurrences = (reminderRecord.scope === 'series' && !hasStoredRecurrence)
              ? []
              : expandReminderOccurrences({
                reminder: reminderRecord,
                rangeStartMs,
                rangeEndMs,
              });

            const remindersList = Array.isArray(reminderRecord.reminders)
              ? reminderRecord.reminders
              : [];

            const seriesMatches = reminderRecord.scope === 'series' && reminderRecord.seriesKey
              ? upcomingEvents.filter((event) => buildSeriesKey({ event, eventSource: event.source || event.sourceKey || 'canonical' }) === reminderRecord.seriesKey)
              : [];

            // BEP v4.5.0: Use occurrences (from expandReminderOccurrences) whenever the
            // reminder has stored recurrence metadata — this covers ALL custom recurring events
            // regardless of their scope. Only fall back to seriesMatches (NFS API) for pure
            // NFS series reminders that have no recurrence config stored.
            const occurrenceSources = (reminderRecord.scope === 'series' && !hasStoredRecurrence)
              ? seriesMatches.map((event) => ({
                occurrenceEpochMs: getEventEpochMs(event),
                event,
              }))
              : occurrences.map(({ occurrenceEpochMs }) => ({ occurrenceEpochMs, event: null }));

            occurrenceSources.forEach(({ occurrenceEpochMs, event: matchedEvent }) => {
              if (!Number.isFinite(occurrenceEpochMs)) return;

              remindersList.forEach((reminder) => {
                const minutesBefore = Number(reminder?.minutesBefore);
                if (!Number.isFinite(minutesBefore)) return;

                const reminderAt = occurrenceEpochMs - minutesBefore * 60 * 1000;
                // BEP v3.0.0: Tightened isDue window — relative to REMINDER time, not event time.
                // Old: nowEpochMs < occurrenceEpochMs + NOW_WINDOW_MS (up to 69min for 60-min offset!)
                // New: nowEpochMs < reminderAt + NOW_WINDOW_MS (always 9min regardless of offset)
                const isDue = nowEpochMs >= reminderAt && nowEpochMs < reminderAt + NOW_WINDOW_MS;

                if (!isDue) return;

                const timezone = reminderRecord.timezone || 'America/New_York';
                const dayKey = getDayKeyForTimezone({ epochMs: reminderAt, timezone });
                const channels = getChannelsForReminder(reminder);

                // Check quiet hours - skip if disabled by user or within quiet time range
                const userQuietHours = quietHours.enabled
                  ? { start: quietHours.start, end: quietHours.end }
                  : { start: 0, end: 0 }; // Disabled = no quiet hours

                if (isWithinQuietHours({ epochMs: reminderAt, timezone, quietHours: userQuietHours })) {
                  channels.forEach((channel) => {
                    const triggerId = buildTriggerId({
                      eventKey: reminderRecord.eventKey,
                      occurrenceEpochMs,
                      minutesBefore,
                      channel,
                    });
                    if (triggers.has(triggerId)) return;
                    triggers = new Set(triggers);
                    triggers.add(triggerId);
                    didUpdate = true;
                    pendingTriggerWrites.push({ triggerId, payload: {
                      eventKey: reminderRecord.eventKey,
                      occurrenceEpochMs,
                      minutesBefore,
                      channel,
                      status: 'skipped-quiet-hours',
                      scheduledForMs: reminderAt,
                    }});
                  });
                  return;
                }

                channels.forEach((channel) => {
                  // BEP v3.0.0: Occurrence-level dedup — ONE notification per event per occurrence per channel.
                  // This ensures multiple reminder offsets (e.g., 60min, 30min, 0min before) only produce
                  // ONE notification. The first offset that becomes due wins; subsequent offsets are silently
                  // recorded as triggered but don't create additional notifications.
                  const occurrenceKey = `${reminderRecord.eventKey}__${occurrenceEpochMs}__${channel}`;
                  if (triggers.has(occurrenceKey)) {
                    // Already notified for this occurrence+channel — mark offset trigger and skip
                    const triggerId = buildTriggerId({
                      eventKey: reminderRecord.eventKey,
                      occurrenceEpochMs,
                      minutesBefore,
                      channel,
                    });
                    if (!triggers.has(triggerId)) {
                      triggers = new Set(triggers);
                      triggers.add(triggerId);
                      didUpdate = true;
                    }
                    return;
                  }

                  const triggerId = buildTriggerId({
                    eventKey: reminderRecord.eventKey,
                    occurrenceEpochMs,
                    minutesBefore,
                    channel,
                  });

                  if (triggers.has(triggerId)) {
                    return;
                  }

                  if (dayKey && (dailyCounts[dayKey] || 0) >= DAILY_REMINDER_CAP) {
                    triggers = new Set(triggers);
                    triggers.add(triggerId);
                    triggers.add(occurrenceKey);
                    didUpdate = true;
                    pendingTriggerWrites.push({ triggerId, payload: {
                      eventKey: reminderRecord.eventKey,
                      occurrenceEpochMs,
                      minutesBefore,
                      channel,
                      status: 'skipped-cap',
                      scheduledForMs: reminderAt,
                    }});
                    return;
                  }

                  const lastKey = `${reminderRecord.eventKey}:${channel}`;
                  const lastTriggeredAt = lastTriggeredRef.current.get(lastKey);
                  if (lastTriggeredAt && nowEpochMs - lastTriggeredAt < THROTTLE_WINDOW_MS) {
                    return;
                  }

                  // BEP v4.0.0: Skip browser channel dispatch when push is also enabled for this offset.
                  // The server-side FCM scheduler sends a push notification which the service worker
                  // displays as a browser notification via showNotification(). Firing `new Notification()`
                  // from the client AND having SW show the push would result in duplicate browser notifs.
                  //
                  // BEP v4.2.0: PLATFORM-AWARE — On PWA devices, ALWAYS skip browser channel.
                  // Push/SW handles all OS-level notifications on PWA. This prevents duplicates
                  // regardless of whether push is enabled on the same offset.
                  if (channel === 'browser') {
                    if (IS_PWA) {
                      // PWA: push/SW handles browser notifications — skip client-side dispatch
                      triggers = new Set(triggers);
                      triggers.add(triggerId);
                      triggers.add(occurrenceKey);
                      didUpdate = true;
                      pendingTriggerWrites.push({ triggerId, payload: {
                        eventKey: reminderRecord.eventKey,
                        occurrenceEpochMs,
                        minutesBefore,
                        channel,
                        status: 'skipped-pwa-push-handles-browser',
                        scheduledForMs: reminderAt,
                      }});
                      return;
                    }
                    const pushAlsoEnabled = reminder?.channels?.push === true;
                    if (pushAlsoEnabled) {
                      // Mark as triggered but skip dispatch — push/SW will handle browser display
                      triggers = new Set(triggers);
                      triggers.add(triggerId);
                      triggers.add(occurrenceKey);
                      didUpdate = true;
                      pendingTriggerWrites.push({ triggerId, payload: {
                        eventKey: reminderRecord.eventKey,
                        occurrenceEpochMs,
                        minutesBefore,
                        channel,
                        status: 'skipped-push-handles-browser',
                        scheduledForMs: reminderAt,
                      }});
                      return;
                    }
                  }

                  const eventTime = formatTime(new Date(occurrenceEpochMs), timezone);
                  const impact = matchedEvent?.strength || matchedEvent?.impact || reminderRecord.impact || 'medium';
                  const impactMeta = resolveImpactMeta(impact);
                  const impactLabel = impactMeta?.label || 'Medium';
                  const title = matchedEvent?.name || matchedEvent?.Name || reminderRecord.title || 'Event reminder';
                  const impactIcon = impactMeta?.icon || '•';
                  const message = `${impactIcon} ${impactLabel} Impact • ${eventTime} • in ${minutesBefore} min`;

                  // BEP v3.0.0: Mark BOTH per-offset and per-occurrence triggers
                  triggers = new Set(triggers);
                  triggers.add(triggerId);
                  triggers.add(occurrenceKey); // Blocks future offsets for this occurrence+channel
                  didUpdate = true;
                  lastTriggeredRef.current.set(lastKey, nowEpochMs);

                  if (dayKey) {
                    dailyCounts = { ...dailyCounts, [dayKey]: (dailyCounts[dayKey] || 0) + 1 };
                  }

                  const notificationEventId = matchedEvent?.id
                    || reminderRecord.metadata?.seriesId
                    || reminderRecord.metadata?.eventId
                    || reminderRecord.eventKey;

                  const notification = {
                    id: triggerId,
                    eventId: notificationEventId,
                    eventKey: reminderRecord.eventKey,
                    eventSource: reminderRecord.eventSource,
                    title,
                    message,
                    eventTime,
                    impact,
                    impactLabel,
                    minutesBefore,
                    eventEpochMs: occurrenceEpochMs,
                    scheduledForMs: reminderAt,
                    sentAtMs: nowEpochMs,
                    channel,
                    read: false,
                    deleted: false,
                    status: 'unread',
                  };

                  if (channel === 'inApp') {
                    // BEP v4.0.0: Optimistic update with pending ID tracking
                    // Track this notification ID so the Firestore listener won't add a duplicate
                    pendingOptimisticIdsRef.current.add(notification.id);
                    setNotifications((prev) => {
                      // BEP v3.0.0: Dedup by id AND by eventKey+eventEpochMs for same occurrence
                      if (prev.some((n) => n.id === notification.id)) return prev;
                      if (prev.some((n) =>
                        n.eventKey === notification.eventKey
                        && n.eventEpochMs === notification.eventEpochMs
                        && n.channel === notification.channel
                        && !n.deleted
                      )) return prev;
                      return [notification, ...prev];
                    });

                    if (user?.uid) {
                      addNotificationForUser(user.uid, notification).catch((error) => {
                        console.error('❌ Failed to save notification to Firestore, falling back to localStorage:', error);
                        const updated = addLocalNotification(user.uid, notification);
                        setNotifications(updated);
                      });
                    } else {
                      addLocalNotification(user?.uid, notification);
                    }
                  }

                  if (channel === 'browser') {
                    // BEP v3.0.0: Occurrence-based tag collapses duplicates at OS level
                    const browserTag = `t2t-${reminderRecord.eventKey}__${occurrenceEpochMs}`;
                    notifyBrowser(title, message, browserTag);
                  }

                  if (channel === 'push') {
                    // BEP v4.2.0: PLATFORM-AWARE — Push is PWA-only.
                    // On non-PWA (browser tabs), skip push entirely. Browser channel handles it.
                    if (!IS_PWA) {
                      triggers = new Set(triggers);
                      triggers.add(triggerId);
                      triggers.add(occurrenceKey);
                      didUpdate = true;
                      return; // Non-PWA: browser channel handles notifications
                    }
                    // BEP v4.0.0: Push notifications are handled server-side via FCM Cloud Function.
                    // Also mark browser occurrence as triggered since SW showNotification() covers it.
                    const browserOccurrenceKey = `${reminderRecord.eventKey}__${occurrenceEpochMs}__browser`;
                    if (!triggers.has(browserOccurrenceKey)) {
                      triggers = new Set(triggers);
                      triggers.add(browserOccurrenceKey);
                      didUpdate = true;
                    }
                    return;
                  }

                  // BEP: Only record inApp/browser triggers to Firestore - NOT push
                  pendingTriggerWrites.push({ triggerId, payload: {
                    eventKey: reminderRecord.eventKey,
                    occurrenceEpochMs,
                    minutesBefore,
                    channel,
                    status: 'sent',
                    scheduledForMs: reminderAt,
                  }});
                });
              });
            });
          });

          // BEP v4.1.0: Single batched Firestore write for all collected triggers
          // Replaces 60+ individual fire-and-forget setDoc calls that caused resource-exhausted
          if (pendingTriggerWrites.length && user?.uid) {
            void batchRecordNotificationTriggers(user.uid, pendingTriggerWrites);
          }

          if (didUpdate) {
            triggersRef.current = triggers;
            saveLocalTriggerIds(user?.uid, triggers);
            dailyCountsRef.current = dailyCounts;
            saveDailyCounts(user?.uid, dailyCounts);
          }
        } finally {
          isRunningRef.current = false;
        }
      };

      void run().catch((error) => {
        console.error('❌ Error in notification processing loop:', error);
        isRunningRef.current = false;
      });
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveReminders, notifyBrowser, user?.uid, quietHours]);

  // BEP v3.0.0: Deduplicate visible notifications — one per eventKey+eventEpochMs+channel
  // Notifications are sorted by sentAtMs desc from Firestore, so the first seen is the latest
  const visibleNotifications = useMemo(() => {
    const seen = new Map();
    const AUTO_READ_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    const nowMs = Date.now();

    return notifications
      .filter((item) => !item.deleted)
      .map((item) => {
        // BEP v3.0.0: Auto-expire — notifications older than 24h marked as read in state
        if (!item.read && item.sentAtMs && (nowMs - item.sentAtMs > AUTO_READ_AGE_MS)) {
          return { ...item, read: true, status: 'read' };
        }
        return item;
      })
      .filter((item) => {
        // BEP v3.0.0: Occurrence-level dedup in UI — only show latest per event+occurrence+channel
        // Non-event notifications (e.g., blog drafts) always pass through using unique id
        const dedupeKey = item.eventKey && Number.isFinite(item.eventEpochMs)
          ? `${item.eventKey}__${item.eventEpochMs}__${item.channel || 'inApp'}`
          : item.id;
        if (seen.has(dedupeKey)) return false;
        seen.set(dedupeKey, true);
        return true;
      });
  }, [notifications]);

  const unreadCount = useMemo(
    () => visibleNotifications.filter((item) => !item.read).length,
    [visibleNotifications]
  );

  const markRead = useCallback((notificationId) => {
    if (user?.uid) {
      void markNotificationReadForUser(user.uid, notificationId).catch((error) => {
        console.error('❌ Failed to mark notification as read:', error);
      });
      return;
    }
    const next = markLocalNotificationRead(user?.uid, notificationId);
    setNotifications(next);
  }, [user?.uid]);

  const markAllRead = useCallback(() => {
    if (user?.uid) {
      void markAllNotificationsReadForUser(user.uid).catch((error) => {
        console.error('❌ Failed to mark all notifications as read:', error);
      });
      return;
    }
    const next = markAllLocalNotificationsRead(user?.uid);
    setNotifications(next);
  }, [user?.uid]);

  const clearAll = useCallback(() => {
    if (user?.uid) {
      void clearNotificationsForUser(user.uid).catch((error) => {
        console.error('❌ Failed to clear notifications:', error);
      });
      return;
    }
    const next = clearLocalNotifications(user?.uid);
    setNotifications(next);
  }, [user?.uid]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return 'granted';
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return {
    notifications: visibleNotifications,
    unreadCount,
    permission,
    markRead,
    markAllRead,
    clearAll,
    requestPermission,
  };
};

export default useCustomEventNotifications;
