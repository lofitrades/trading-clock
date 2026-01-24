/**
 * src/hooks/useReminderActions.js
 *
 * Purpose: React hook for managing reminder save/delete operations with Firestore persistence.
 * Provides centralized auth checks, loading/error states, and optimistic UX patterns.
 *
 * Changelog:
 * v1.1.0 - 2026-01-24 - BEP FIX: Delete by actual document IDs from found reminder, not just computed keys. Fixes reminder deletion when doc was saved under different key format.
 * v1.0.0 - 2026-01-23 - Initial implementation with save, delete, and subscription support.
 */
import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteReminderForUser,
  subscribeToReminders,
  upsertReminderForUser,
} from '../services/remindersService';
import {
  buildEventKey,
  buildSeriesKey,
  normalizeEventForReminder,
} from '../utils/remindersRegistry';

/**
 * Debug logging helper - enable via localStorage.setItem('t2t_debug_reminders', '1')
 */
const shouldDebugReminders = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('t2t_debug_reminders') === '1';
};

const logReminderDebug = (...args) => {
  if (!shouldDebugReminders()) return;
  console.info('[useReminderActions]', ...args);
};

/**
 * Resolve event source for key building
 */
const resolveEventSource = (event) => {
  if (!event) return 'unknown';
  if (event.isCustom) return 'custom';
  return event.eventSource || event.source || event.Source || event.sourceKey || 'canonical';
};

/**
 * Check if recurrence interval is allowed for reminders (1h+ only)
 */
const isRepeatIntervalAllowed = (recurrence) => {
  if (!recurrence?.enabled) return true;
  const interval = recurrence?.interval;
  if (!interval || interval === 'none') return true;
  const disallowedIntervals = ['1m', '5m', '10m', '15m', '30m'];
  return !disallowedIntervals.includes(interval);
};

/**
 * useReminderActions - Centralized hook for reminder CRUD operations
 *
 * @returns {Object} - { reminders, saveReminder, deleteReminder, saving, error, clearError, hasReminder }
 */
export const useReminderActions = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingKeys, setPendingKeys] = useState(new Set());

  // Track save cycle for UX (prevents dirty state during sync)
  const saveInProgress = useRef(false);
  const lastSavedReminders = useRef(null);

  // Subscribe to all user reminders
  useEffect(() => {
    if (!user?.uid) {
      setReminders([]);
      setRemindersLoading(false);
      return undefined;
    }

    setRemindersLoading(true);
    const unsubscribe = subscribeToReminders(
      user.uid,
      (items) => {
        logReminderDebug('subscription:update', { count: items?.length });
        setReminders(items || []);
        setRemindersLoading(false);

        // Clear lastSavedReminders if sync caught up
        if (lastSavedReminders.current !== null) {
          lastSavedReminders.current = null;
          saveInProgress.current = false;
        }
      },
      (err) => {
        logReminderDebug('subscription:error', { error: err?.message });
        setError(err?.message || 'Failed to load reminders');
        setRemindersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => setError(null), []);

  /**
   * Check if an event has a reminder set
   */
  const hasReminder = useCallback(
    (event) => {
      if (!event || !reminders.length) return false;

      const eventSource = resolveEventSource(event);
      const eventKey = buildEventKey({ event, eventSource });
      const seriesKey = buildSeriesKey({ event, eventSource });
      const eventId = event?.id || event?.eventId || event?.EventId || null;
      const seriesId = event?.seriesId || null;

      return reminders.some((r) => {
        if (!r) return false;
        if (r.eventKey === eventKey) return true;
        if (seriesKey && (r.seriesKey === seriesKey || r.eventKey === seriesKey)) return true;
        if (eventId && (r.eventKey?.endsWith(`:${eventId}`) || r.metadata?.eventId === eventId)) return true;
        if (seriesId && r.metadata?.seriesId === seriesId) return true;
        return false;
      });
    },
    [reminders]
  );

  /**
   * Get reminder for a specific event
   */
  const getReminder = useCallback(
    (event) => {
      if (!event || !reminders.length) return null;

      const eventSource = resolveEventSource(event);
      const eventKey = buildEventKey({ event, eventSource });
      const seriesKey = buildSeriesKey({ event, eventSource });
      const eventId = event?.id || event?.eventId || event?.EventId || null;
      const seriesId = event?.seriesId || null;

      return reminders.find((r) => {
        if (!r) return false;
        if (r.eventKey === eventKey) return true;
        if (seriesKey && (r.seriesKey === seriesKey || r.eventKey === seriesKey)) return true;
        if (eventId && (r.eventKey?.endsWith(`:${eventId}`) || r.metadata?.eventId === eventId)) return true;
        if (seriesId && r.metadata?.seriesId === seriesId) return true;
        return false;
      }) || null;
    },
    [reminders]
  );

  /**
   * Check if an event's reminder is being saved
   */
  const isPending = useCallback(
    (event) => {
      if (!event) return false;
      const eventSource = resolveEventSource(event);
      const eventKey = buildEventKey({ event, eventSource });
      return pendingKeys.has(eventKey);
    },
    [pendingKeys]
  );

  /**
   * Save or update reminders for an event
   *
   * @param {Object} options
   * @param {Object} options.event - The event to save reminders for
   * @param {Array} options.remindersList - Array of reminder configurations
   * @param {string} options.scope - 'event' or 'series'
   * @param {Object} options.metadata - Additional metadata to store
   * @returns {Promise<{success: boolean, requiresAuth?: boolean, error?: string}>}
   */
  const saveReminder = useCallback(
    async ({ event, remindersList, scope = 'event', metadata = {} }) => {
      logReminderDebug('saveReminder:start', {
        hasUser: Boolean(user?.uid),
        eventName: event?.name || event?.title,
        reminderCount: remindersList?.length,
        scope,
      });

      if (!user?.uid) {
        setError('Sign in to save reminders.');
        return { success: false, requiresAuth: true };
      }

      if (!event) {
        setError('No event provided for reminder.');
        return { success: false, error: 'No event provided' };
      }

      // Validate recurrence interval
      const recurrence = event?.recurrence || metadata?.recurrence;
      if (!isRepeatIntervalAllowed(recurrence)) {
        setError('Reminders can only repeat hourly or slower.');
        return { success: false, error: 'Invalid recurrence interval' };
      }

      const eventSource = resolveEventSource(event);
      const eventKey = buildEventKey({ event, eventSource });
      const seriesKey = buildSeriesKey({ event, eventSource });
      const targetId = scope === 'series' && seriesKey ? seriesKey : eventKey;

      // Set pending state
      setPendingKeys((prev) => new Set(prev).add(eventKey));
      setSaving(true);
      setError(null);
      saveInProgress.current = true;

      try {
        if (!remindersList || remindersList.length === 0) {
          // Delete all related reminders
          logReminderDebug('saveReminder:deleting', { targetId, eventKey, seriesKey });
          await deleteReminderForUser(user.uid, targetId);
          if (seriesKey && seriesKey !== targetId) {
            await deleteReminderForUser(user.uid, seriesKey);
          }
          if (eventKey !== targetId) {
            await deleteReminderForUser(user.uid, eventKey);
          }
        } else {
          // Normalize and save
          const reminderBase = normalizeEventForReminder({
            event,
            source: eventSource,
            userId: user.uid,
            reminders: remindersList,
            metadata: {
              ...metadata,
              scope,
              recurrence: recurrence || null,
            },
          });

          logReminderDebug('saveReminder:upserting', {
            targetId,
            reminderCount: remindersList.length,
          });

          await upsertReminderForUser(user.uid, {
            ...reminderBase,
            eventKey: targetId,
            reminders: remindersList,
            enabled: true,
            scope,
            seriesKey,
            metadata: {
              ...(reminderBase.metadata || {}),
              scope,
            },
          });
        }

        lastSavedReminders.current = remindersList ? [...remindersList] : [];
        logReminderDebug('saveReminder:success', { targetId });

        return { success: true };
      } catch (err) {
        logReminderDebug('saveReminder:error', { error: err?.message, stack: err?.stack });
        lastSavedReminders.current = null;
        saveInProgress.current = false;
        setError(err?.message || 'Failed to save reminder.');
        return { success: false, error: err?.message };
      } finally {
        setSaving(false);
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(eventKey);
          return next;
        });
      }
    },
    [user]
  );

  /**
   * Delete reminders for an event
   *
   * @param {Object} event - The event to delete reminders for
   * @param {Object} options - Optional { alsoDeleteSeries: boolean, existingDocId?: string, existingEventKey?: string, existingSeriesKey?: string }
   * @returns {Promise<{success: boolean, requiresAuth?: boolean, error?: string}>}
   */
  const deleteReminder = useCallback(
    async (event, { alsoDeleteSeries = true, existingDocId, existingEventKey, existingSeriesKey } = {}) => {
      logReminderDebug('deleteReminder:start', {
        hasUser: Boolean(user?.uid),
        eventName: event?.name || event?.title,
        alsoDeleteSeries,
        existingDocId,
        existingEventKey,
        existingSeriesKey,
      });

      if (!user?.uid) {
        setError('Sign in to manage reminders.');
        return { success: false, requiresAuth: true };
      }

      if (!event) {
        setError('No event provided.');
        return { success: false, error: 'No event provided' };
      }

      const eventSource = resolveEventSource(event);
      const computedEventKey = buildEventKey({ event, eventSource });
      const computedSeriesKey = buildSeriesKey({ event, eventSource });
      
      // BEP FIX: Use actual document IDs if provided, otherwise use computed keys
      const eventKey = existingEventKey || computedEventKey;
      const seriesKey = existingSeriesKey || computedSeriesKey;
      
      // Collect all unique document IDs to delete
      const docIdsToDelete = new Set();
      if (existingDocId) docIdsToDelete.add(existingDocId);
      if (eventKey) docIdsToDelete.add(eventKey);
      if (existingEventKey && existingEventKey !== eventKey) docIdsToDelete.add(existingEventKey);
      if (alsoDeleteSeries) {
        if (seriesKey) docIdsToDelete.add(seriesKey);
        if (existingSeriesKey && existingSeriesKey !== seriesKey) docIdsToDelete.add(existingSeriesKey);
      }
      // Also try computed keys if different
      if (computedEventKey && computedEventKey !== eventKey) docIdsToDelete.add(computedEventKey);
      if (alsoDeleteSeries && computedSeriesKey && computedSeriesKey !== seriesKey) docIdsToDelete.add(computedSeriesKey);

      setPendingKeys((prev) => new Set(prev).add(eventKey));
      setSaving(true);
      setError(null);
      saveInProgress.current = true;

      try {
        logReminderDebug('deleteReminder:deleting', { 
          docIdsToDelete: Array.from(docIdsToDelete),
          computedEventKey,
          computedSeriesKey,
        });
        
        // Delete all collected document IDs
        for (const docId of docIdsToDelete) {
          await deleteReminderForUser(user.uid, docId);
        }

        lastSavedReminders.current = [];
        logReminderDebug('deleteReminder:success', { deletedCount: docIdsToDelete.size });

        return { success: true };
      } catch (err) {
        logReminderDebug('deleteReminder:error', { error: err?.message, stack: err?.stack });
        lastSavedReminders.current = null;
        saveInProgress.current = false;
        setError(err?.message || 'Failed to delete reminder.');
        return { success: false, error: err?.message };
      } finally {
        setSaving(false);
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(eventKey);
          return next;
        });
      }
    },
    [user]
  );

  return {
    // State
    reminders,
    remindersLoading,
    saving,
    error,
    saveInProgress: saveInProgress.current,
    lastSavedReminders: lastSavedReminders.current,

    // Actions
    saveReminder,
    deleteReminder,
    clearError,

    // Helpers
    hasReminder,
    getReminder,
    isPending,
  };
};

export default useReminderActions;
