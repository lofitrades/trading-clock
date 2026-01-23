/**
 * src/hooks/useCustomEventNotifications.js
 * 
 * Purpose: Schedule and surface in-app/browser notifications for custom reminder events.
 * Key responsibility and main functionality: Detect due reminders, persist notifications,
 * and optionally trigger browser notifications with permission checks.
 * 
 * Changelog:
 * v1.7.0 - 2026-01-23 - CLEANUP: Remove debug console.log statements. Keep only console.error for error handling (subscription failures, fallback to localStorage).
 * v1.6.0 - 2026-01-23 - BEP FIX: Add console.log to subscription success/error for debugging notification persistence across sessions. Error handler now falls back to localStorage instead of empty array. Logs subscription setup, snapshot receipt, and error details.
 * v1.5.0 - 2026-01-23 - BEP FIX: Add try-catch error handling to addNotificationForUser() calls with fallback to localStorage. Console.error() logs all Firestore save failures for debugging. Ensures notifications persist even if Firestore fails.
 * v1.4.0 - 2026-01-22 - BEP: Persist authenticated notifications in Firestore with read/deleted status management.
 * v1.3.0 - 2026-01-22 - BEP UX: Enhanced notification messages with TradingView-style detail (event name, time, impact, countdown). Notifications now include event metadata (impact, time, currency) for rich display in NotificationCenter.
 * v1.2.1 - 2026-01-22 - Remove email channel and allow push reminders.
 * v1.1.0 - 2026-01-21 - Send email reminders via callable and keep only in-app notifications.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { resolveImpactMeta } from '../utils/newsApi';
import { formatTime } from '../utils/dateUtils';
import {
  addLocalNotification,
  addNotificationForUser,
  clearLocalNotifications,
  clearNotificationsForUser,
  loadLocalNotifications,
  loadTriggers,
  markAllLocalNotificationsRead,
  markAllNotificationsReadForUser,
  markLocalNotificationRead,
  markNotificationReadForUser,
  saveTriggers,
  subscribeToNotifications,
} from '../services/notificationsService';

const buildReminderKey = (eventId, minutesBefore, channel) => `${eventId}-${minutesBefore}-${channel}`;
const ENABLED_CHANNELS = new Set(['inApp', 'browser', 'push']);

const getChannelsForReminder = (reminder) => {
  const channels = reminder?.channels || {};
  return Object.keys(channels).filter((key) => channels[key] && ENABLED_CHANNELS.has(key));
};

export const useCustomEventNotifications = ({ events = [] } = {}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => (user?.uid ? [] : loadLocalNotifications(user?.uid)));
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'));

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
        const nowEpochMs = Date.now();
        const triggers = loadTriggers(user?.uid);
        let nextTriggers = triggers;
        let didUpdate = false;

        events.forEach((event) => {
          const eventEpochMs = Number.isFinite(event?.epochMs) ? event.epochMs : Number(event?.date);
          if (!eventEpochMs) return;

          const reminders = Array.isArray(event.reminders) ? event.reminders : [];
          reminders.forEach((reminder) => {
            const minutesBefore = Number(reminder?.minutesBefore);
            if (!Number.isFinite(minutesBefore)) return;

            const reminderAt = eventEpochMs - minutesBefore * 60 * 1000;
            const isDue = nowEpochMs >= reminderAt && nowEpochMs < eventEpochMs + NOW_WINDOW_MS;
            if (!isDue) return;

            const channels = getChannelsForReminder(reminder);
            channels.forEach((channel) => {
              const key = buildReminderKey(event.id, minutesBefore, channel);
              if (triggers.has(key)) return;

              const eventName = event.title || event.name || 'Custom reminder';
              const eventTime = formatTime(new Date(eventEpochMs), event.timezone || 'America/New_York');
              const impact = event.impact || 'medium';
              const impactMeta = resolveImpactMeta(impact);
              const impactLabel = impactMeta?.label || 'Medium';
              
              // TradingView-style notification title: "Event Name"
              const title = eventName;
              
              // TradingView-style notification message: "⚡ High Impact • 3:30 PM EST • in 15 min"
              const impactIcon = impactMeta?.icon || '•';
              const message = `${impactIcon} ${impactLabel} Impact • ${eventTime} • in ${minutesBefore} min`;

              nextTriggers = new Set(nextTriggers);
              nextTriggers.add(key);
              didUpdate = true;

              if (channel === 'inApp') {
                const notification = {
                  id: key,
                  eventId: event.id,
                  title,
                  message,
                  eventTime,
                  impact,
                  impactLabel,
                  minutesBefore,
                  eventEpochMs,
                  scheduledForMs: reminderAt,
                  sentAtMs: nowEpochMs,
                  channel,
                  read: false,
                  deleted: false,
                  status: 'unread',
                };
                if (user?.uid) {
                  // BEP FIX: Fire-and-forget with error handling
                  addNotificationForUser(user.uid, notification)
                    .then(() => {
                      console.log('✅ Notification saved to Firestore:', key);
                    })
                    .catch((error) => {
                      console.error('❌ Failed to save notification to Firestore, falling back to localStorage:', error);
                      const updated = addLocalNotification(user.uid, notification);
                      setNotifications(updated);
                    });
                } else {
                  const updated = addLocalNotification(user?.uid, notification);
                  setNotifications(updated);
                }
              } else if (channel === 'browser') {
                notifyBrowser(title, message);
              }
            });
          });
        });

        if (didUpdate) {
          saveTriggers(user?.uid, nextTriggers);
        }
      };

      void run().catch((error) => {
        console.error('❌ Error in notification processing loop:', error);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [events, notifyBrowser, user?.uid]);

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
