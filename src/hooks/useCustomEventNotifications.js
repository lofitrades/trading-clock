/**
 * src/hooks/useCustomEventNotifications.js
 * 
 * Purpose: Schedule and surface in-app/browser notifications for custom reminder events.
 * Key responsibility and main functionality: Detect due reminders, persist notifications,
 * and optionally trigger browser notifications with permission checks.
 * 
 * Changelog:
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
  addNotification,
  loadNotifications,
  loadTriggers,
  markAllNotificationsRead,
  markNotificationRead,
  saveTriggers,
  clearNotifications,
} from '../services/notificationsService';

const buildReminderKey = (eventId, minutesBefore, channel) => `${eventId}-${minutesBefore}-${channel}`;
const ENABLED_CHANNELS = new Set(['inApp', 'browser', 'push']);

const getChannelsForReminder = (reminder) => {
  const channels = reminder?.channels || {};
  return Object.keys(channels).filter((key) => channels[key] && ENABLED_CHANNELS.has(key));
};

export const useCustomEventNotifications = ({ events = [] } = {}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => loadNotifications(user?.uid));
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'));

  useEffect(() => {
    setNotifications(loadNotifications(user?.uid));
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
              };
              const updated = addNotification(user?.uid, notification);
              setNotifications(updated);
            } else if (channel === 'browser') {
              notifyBrowser(title, message);
            }
          });
        });
      });

      if (didUpdate) {
        saveTriggers(user?.uid, nextTriggers);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [events, notifyBrowser, user?.uid]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markRead = useCallback((notificationId) => {
    const next = markNotificationRead(user?.uid, notificationId);
    setNotifications(next);
  }, [user?.uid]);

  const markAllRead = useCallback(() => {
    const next = markAllNotificationsRead(user?.uid);
    setNotifications(next);
  }, [user?.uid]);

  const clearAll = useCallback(() => {
    const next = clearNotifications(user?.uid);
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
    notifications,
    unreadCount,
    permission,
    markRead,
    markAllRead,
    clearAll,
    requestPermission,
  };
};

export default useCustomEventNotifications;
