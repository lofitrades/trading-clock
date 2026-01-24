/**
 * src/hooks/useCustomEventNotifications.js
 * 
 * Purpose: Schedule and surface in-app/browser notifications for custom reminder events.
 * Key responsibility and main functionality: Detect due reminders, persist notifications,
 * and optionally trigger browser notifications with permission checks.
 * 
 * Changelog:
 * v2.1.0 - 2026-01-23 - Add series reminder matching for upcoming economic events.
 * v2.0.1 - 2026-01-23 - Skip reminder triggers for repeat intervals under 1h.
 * v2.0.0 - 2026-01-23 - Upgrade to unified reminders engine with recurrence expansion and trigger dedupe.
 * v1.7.0 - 2026-01-23 - CLEANUP: Remove debug console.log statements. Keep only console.error for error handling (subscription failures, fallback to localStorage).
 * v1.6.0 - 2026-01-23 - BEP FIX: Add console.log to subscription success/error for debugging notification persistence across sessions. Error handler now falls back to localStorage instead of empty array. Logs subscription setup, snapshot receipt, and error details.
 * v1.5.0 - 2026-01-23 - BEP FIX: Add try-catch error handling to addNotificationForUser() calls with fallback to localStorage. Console.error() logs all Firestore save failures for debugging. Ensures notifications persist even if Firestore fails.
 * v1.4.0 - 2026-01-22 - BEP: Persist authenticated notifications in Firestore with read/deleted status management.
 * v1.3.0 - 2026-01-22 - BEP UX: Enhanced notification messages with TradingView-style detail (event name, time, impact, countdown). Notifications now include event metadata (impact, time, currency) for rich display in NotificationCenter.
 * v1.2.1 - 2026-01-22 - Remove email channel and allow push reminders.
 * v1.1.0 - 2026-01-21 - Send email reminders via callable and keep only in-app notifications.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  buildTriggerId,
  loadLocalTriggerIds,
  recordNotificationTrigger,
  saveLocalTriggerIds,
  subscribeToReminders,
} from '../services/remindersService';

const ENABLED_CHANNELS = new Set(['inApp', 'browser', 'push']);
const DAILY_COUNTS_KEY = 't2t_unified_notification_daily_counts_v1';
const DISALLOWED_REPEAT_INTERVALS = new Set(['5m', '15m', '30m']);

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
  const triggersRef = useRef(loadLocalTriggerIds(user?.uid));
  const dailyCountsRef = useRef(loadDailyCounts(user?.uid));
  const lastTriggeredRef = useRef(new Map());

  useEffect(() => {
    if (!user?.uid) {
      setNotifications(loadLocalNotifications(user?.uid));
      return undefined;
    }

    const unsubscribe = subscribeToNotifications(
      user.uid,
      (items) => {
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

  const legacyReminders = useMemo(() => (
    (events || [])
      .map((event) => normalizeEventForReminder({
        event,
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
      }))
      .filter((reminder) => reminder.reminders && reminder.reminders.length > 0)
  ), [events, user?.uid]);

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

  const notifyBrowser = useCallback((title, body) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, tag: `t2t-${title}` });
    } catch {
      // Ignore browser notification errors
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const run = async () => {
        if (!effectiveReminders.length) return;

        const nowEpochMs = Date.now();
        const rangeStartMs = nowEpochMs;
        const rangeEndMs = nowEpochMs + 24 * 60 * 60 * 1000;
        let triggers = triggersRef.current;
        let dailyCounts = dailyCountsRef.current;
        let didUpdate = false;

        effectiveReminders.forEach((reminderRecord) => {
          if (!reminderRecord?.enabled) return;

          const recurrenceInterval = reminderRecord?.metadata?.recurrence?.interval;
          if (DISALLOWED_REPEAT_INTERVALS.has(recurrenceInterval)) {
            return;
          }

          const occurrences = reminderRecord.scope === 'series'
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

          const occurrenceSources = reminderRecord.scope === 'series'
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
              const isDue = nowEpochMs >= reminderAt && nowEpochMs < occurrenceEpochMs + NOW_WINDOW_MS;
              if (!isDue) return;

              const timezone = reminderRecord.timezone || 'America/New_York';
              const dayKey = getDayKeyForTimezone({ epochMs: reminderAt, timezone });
              const channels = getChannelsForReminder(reminder);

              if (isWithinQuietHours({ epochMs: reminderAt, timezone })) {
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
                  void recordNotificationTrigger(user?.uid, triggerId, {
                    eventKey: reminderRecord.eventKey,
                    occurrenceEpochMs,
                    minutesBefore,
                    channel,
                    status: 'skipped-quiet-hours',
                    scheduledForMs: reminderAt,
                  });
                });
                return;
              }

              channels.forEach((channel) => {
                const triggerId = buildTriggerId({
                  eventKey: reminderRecord.eventKey,
                  occurrenceEpochMs,
                  minutesBefore,
                  channel,
                });
                if (triggers.has(triggerId)) return;

                if (dayKey && (dailyCounts[dayKey] || 0) >= DAILY_REMINDER_CAP) {
                  triggers = new Set(triggers);
                  triggers.add(triggerId);
                  didUpdate = true;
                  void recordNotificationTrigger(user?.uid, triggerId, {
                    eventKey: reminderRecord.eventKey,
                    occurrenceEpochMs,
                    minutesBefore,
                    channel,
                    status: 'skipped-cap',
                    scheduledForMs: reminderAt,
                  });
                  return;
                }

                const lastKey = `${reminderRecord.eventKey}:${channel}`;
                const lastTriggeredAt = lastTriggeredRef.current.get(lastKey);
                if (lastTriggeredAt && nowEpochMs - lastTriggeredAt < THROTTLE_WINDOW_MS) return;

                const eventTime = formatTime(new Date(occurrenceEpochMs), timezone);
                const impact = matchedEvent?.strength || matchedEvent?.impact || reminderRecord.impact || 'medium';
                const impactMeta = resolveImpactMeta(impact);
                const impactLabel = impactMeta?.label || 'Medium';
                const title = matchedEvent?.name || matchedEvent?.Name || reminderRecord.title || 'Event reminder';
                const impactIcon = impactMeta?.icon || '•';
                const message = `${impactIcon} ${impactLabel} Impact • ${eventTime} • in ${minutesBefore} min`;

                triggers = new Set(triggers);
                triggers.add(triggerId);
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
                  if (user?.uid) {
                    addNotificationForUser(user.uid, notification).catch((error) => {
                      console.error('❌ Failed to save notification to Firestore, falling back to localStorage:', error);
                      const updated = addLocalNotification(user.uid, notification);
                      setNotifications(updated);
                    });
                  } else {
                    const updated = addLocalNotification(user?.uid, notification);
                    setNotifications(updated);
                  }
                }

                if (channel === 'browser') {
                  notifyBrowser(title, message);
                }

                void recordNotificationTrigger(user?.uid, triggerId, {
                  eventKey: reminderRecord.eventKey,
                  occurrenceEpochMs,
                  minutesBefore,
                  channel,
                  status: 'sent',
                  scheduledForMs: reminderAt,
                });
              });
            });
          });
        });

        if (didUpdate) {
          triggersRef.current = triggers;
          saveLocalTriggerIds(user?.uid, triggers);
          dailyCountsRef.current = dailyCounts;
          saveDailyCounts(user?.uid, dailyCounts);
        }
      };

      void run().catch((error) => {
        console.error('❌ Error in notification processing loop:', error);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [effectiveReminders, notifyBrowser, user?.uid]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !item.deleted),
    [notifications]
  );

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
