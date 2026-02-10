/**
 * src/hooks/useCustomEvents.js
 * 
 * Purpose: Auth-aware hook for user custom reminder events with realtime range subscriptions.
 * Key responsibility and main functionality: Stream custom events for a date range, and expose
 * create/update/delete helpers with BEP schema handling, plus activity logging for CRUD ops.
 * For non-auth users, displays default weekday custom events (read-only).
 * 
 * Changelog:
 * v1.2.1 - 2026-02-10 - BEP: Replaced hardcoded guest events with shared buildGuestSampleEventsForRange
 *                        from defaultCustomEvents.js. Single source of truth — names, times, colors,
 *                        and impact values now match ClockEventsOverlay guest markers exactly.
 * v1.2.0 - 2026-02-10 - BEP: Non-auth users now see default weekday custom events (NY Open/Close).
 *                        Auth users get personalized Firestore events. Both merge in Calendar2Page.
 *                        Clicking custom events shows AuthModal2 for non-auth users (read-only view).
 * v1.1.0 - 2026-02-05 - Added activity logging for event_created, event_updated, event_deleted actions
 * v1.0.0 - 2026-01-21 - Initial implementation for custom reminder events.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  addCustomEvent,
  deleteCustomEvent,
  subscribeToCustomEventsByRange,
  updateCustomEvent,
} from '../services/customEventsService';
import {
  logEventCreated,
  logEventDeleted,
  logEventUpdated,
} from '../services/activityLogger';
import { buildGuestSampleEventsForRange } from '../utils/defaultCustomEvents';

export const useCustomEvents = ({ startDate, endDate } = {}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rangeKey = useMemo(() => {
    const startMs = startDate?.getTime?.() || null;
    const endMs = endDate?.getTime?.() || null;
    return `${startMs || 'na'}-${endMs || 'na'}`;
  }, [startDate, endDate]);

  useEffect(() => {
    // BEP v1.2.0: Non-auth users get default guest events, auth users get Firestore
    if (!user) {
      // Non-auth: show default weekday events (read-only) from shared utility
      if (startDate && endDate) {
        setLoading(true);
        setError(null);
        const defaultEvents = buildGuestSampleEventsForRange(startDate, endDate);
        setEvents(defaultEvents);
        setLoading(false);
      } else {
        setEvents([]);
        setLoading(false);
      }
      return undefined;
    }

    // Auth: load user's custom events from Firestore
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCustomEventsByRange(
      user.uid,
      startDate,
      endDate,
      (nextEvents) => {
        setEvents(nextEvents || []);
        setLoading(false);
      },
      (err) => {
        const message = err?.message || 'Failed to load custom events.';
        if (/permission/i.test(message) || err?.code === 'permission-denied') {
          setError('Permission denied. Custom reminders require updated access rules.');
        } else {
          setError(message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, startDate, endDate, rangeKey]);

  const createEvent = useCallback(async (payload) => {
    if (!user) return { success: false, requiresAuth: true };
    try {
      const id = await addCustomEvent(user.uid, payload);
      
      // Log activity: custom event created
      await logEventCreated(
        payload.title || 'Untitled',
        payload.currency || 'USD',
        payload.localDate || new Date().toISOString().split('T')[0],
        user.uid
      );
      
      return { success: true, id };
    } catch (err) {
      const message = err?.message || 'Failed to add custom event.';
      if (/permission/i.test(message) || err?.code === 'permission-denied') {
        return { success: false, error: 'Permission denied. Custom reminders require updated access rules.' };
      }
      return { success: false, error: message };
    }
  }, [user]);

  const saveEvent = useCallback(async (eventId, payload) => {
    if (!user) return { success: false, requiresAuth: true };
    try {
      await updateCustomEvent(user.uid, eventId, payload);
      
      // Log activity: custom event updated
      await logEventUpdated(
        payload.title || 'Untitled',
        payload.currency || 'USD',
        user.uid
      );
      
      return { success: true };
    } catch (err) {
      const message = err?.message || 'Failed to update custom event.';
      if (/permission/i.test(message) || err?.code === 'permission-denied') {
        return { success: false, error: 'Permission denied. Custom reminders require updated access rules.' };
      }
      return { success: false, error: message };
    }
  }, [user]);

  const removeEvent = useCallback(async (eventId) => {
    if (!user) return { success: false, requiresAuth: true };
    try {
      await deleteCustomEvent(user.uid, eventId);
      
      // Log activity: custom event deleted
      await logEventDeleted(
        'Custom Event',
        'USD',
        user.uid
      );
      
      return { success: true };
    } catch (err) {
      const message = err?.message || 'Failed to delete custom event.';
      if (/permission/i.test(message) || err?.code === 'permission-denied') {
        return { success: false, error: 'Permission denied. Custom reminders require updated access rules.' };
      }
      return { success: false, error: message };
    }
  }, [user]);

  return {
    events,
    loading,
    error,
    createEvent,
    saveEvent,
    removeEvent,
  };
};

export default useCustomEvents;
