/**
 * src/hooks/useEventsRealtime.js
 *
 * ⚠️ DEPRECATED (v1.1.0 - 2026-02-02)
 * Real-time Firestore listeners have been removed from the application.
 * Reason: Timezone conversion complexity during real-time updates introduced display inaccuracies
 * (events showed UTC time instead of user's timezone until page reload).
 * 
 * Solution: Data refreshes reliably on page reload/remount with correct timezone handling.
 * Admin edits take effect when user refreshes or navigates to/from the page.
 * 
 * This file is kept for reference but is no longer imported or used.
 * Safe to delete in future cleanup.
 *
 * Original Purpose: React hook for real-time Firestore event subscriptions
 *
 * Changelog:
 * v1.1.0 - 2026-02-02 - DEPRECATED: Real-time listeners removed due to timezone conversion issues
 * v1.0.0 - 2026-02-02 - Initial implementation with timezone-aware subscription
 */

import { useEffect, useRef } from 'react';
import { subscribeToTodayEvents, subscribeToDateRange } from '../services/eventsRealtimeService';

/**
 * Hook to subscribe to real-time updates for today's events
 * Automatically resubscribes when timezone changes
 *
 * @param {string} timezone - User's timezone for determining "today"
 * @param {boolean} enabled - Whether to enable subscription (default: true)
 */
export const useEventsRealtimeToday = (timezone, enabled = true) => {
  const unsubscribeRef = useRef(null);
  const prevTimezoneRef = useRef(null);

  useEffect(() => {
    if (!enabled || !timezone) {
      // Cleanup if disabled
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Only resubscribe if timezone changed
    if (prevTimezoneRef.current === timezone && unsubscribeRef.current) {
      return;
    }

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to today's events
    prevTimezoneRef.current = timezone;
    unsubscribeRef.current = subscribeToTodayEvents(timezone);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [timezone, enabled]);
};

/**
 * Hook to subscribe to real-time updates for a date range
 * Useful for calendar view which may show week/month
 *
 * @param {Date|string} startDate - Start of date range
 * @param {Date|string} endDate - End of date range
 * @param {boolean} enabled - Whether to enable subscription (default: true)
 */
export const useEventsRealtimeRange = (startDate, endDate, enabled = true) => {
  const unsubscribeRef = useRef(null);
  const prevRangeRef = useRef(null);

  useEffect(() => {
    if (!enabled || !startDate || !endDate) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    const startStr = typeof startDate === 'string'
      ? startDate
      : startDate?.toISOString?.()?.split('T')[0];
    const endStr = typeof endDate === 'string'
      ? endDate
      : endDate?.toISOString?.()?.split('T')[0];

    const rangeKey = `${startStr}-${endStr}`;

    // Only resubscribe if range changed
    if (prevRangeRef.current === rangeKey && unsubscribeRef.current) {
      return;
    }

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to date range
    prevRangeRef.current = rangeKey;
    unsubscribeRef.current = subscribeToDateRange(startDate, endDate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [startDate, endDate, enabled]);
};

export default {
  useEventsRealtimeToday,
  useEventsRealtimeRange,
};
