/**
 * src/services/eventsRealtimeService.js
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
 * Original Purpose: Real-time Firestore listener for canonical economic events
 * Subscribed to admin edits and pushed updates to Zustand store for immediate UI refresh
 *
 * Changelog:
 * v1.1.0 - 2026-02-02 - DEPRECATED: Real-time listeners removed due to timezone conversion issues
 * v1.0.0 - 2026-02-02 - Initial implementation with today-scoped listener
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import useEventsStore from '../stores/eventsStore';

// Reference to the canonical events collection
const getEventsCollectionRef = () => {
  const rootDoc = doc(collection(db, 'economicEvents'), 'events');
  return collection(rootDoc, 'events');
};

/**
 * Build date range for a given date string (YYYY-MM-DD) in UTC
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Object} { startTimestamp, endTimestamp }
 */
const buildDayTimestamps = (dateStr) => {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return {
    startTimestamp: Timestamp.fromDate(start),
    endTimestamp: Timestamp.fromDate(end),
  };
};

/**
 * Get today's date in a specific timezone
 * @param {string} timezone - IANA timezone string
 * @returns {string} Date string in YYYY-MM-DD format
 */
const getTodayInTimezone = (timezone) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Returns YYYY-MM-DD
};

// Track active subscriptions for cleanup
let activeUnsubscribe = null;
let currentTimezone = null;

/**
 * Subscribe to real-time updates for today's canonical events
 * BEP: Listens for admin edits and updates Zustand store immediately
 *
 * @param {string} timezone - User's timezone for determining "today"
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTodayEvents = (timezone) => {
  // If already subscribed to the same timezone, return existing unsubscribe
  if (activeUnsubscribe && currentTimezone === timezone) {
    return activeUnsubscribe;
  }

  // Cleanup existing subscription if timezone changed
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  currentTimezone = timezone;
  const todayStr = getTodayInTimezone(timezone);
  const { startTimestamp, endTimestamp } = buildDayTimestamps(todayStr);

  const eventsRef = getEventsCollectionRef();
  const q = query(
    eventsRef,
    where('datetimeUtc', '>=', startTimestamp),
    where('datetimeUtc', '<=', endTimestamp)
  );

  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: false },
    (snapshot) => {
      const store = useEventsStore.getState();

      snapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        const eventId = change.doc.id;

        // Convert Firestore Timestamp to JS Date for compatibility
        const datetimeUtc = docData.datetimeUtc?.toDate
          ? docData.datetimeUtc.toDate()
          : null;

        // Build normalized event object
        const event = {
          id: eventId,
          ...docData,
          // Map event name from normalizedName or canonicalName
          name: docData.normalizedName || docData.canonicalName || docData.name || '',
          event: docData.normalizedName || docData.canonicalName || docData.event || '',
          // Convert Timestamp to date string for display
          date: datetimeUtc ? datetimeUtc.toISOString().split('T')[0] : docData.date || '',
          time: datetimeUtc ? datetimeUtc.toISOString().split('T')[1].substring(0, 5) : docData.time || '',
          datetimeUtc,
        };

        if (change.type === 'added') {
          // New event - could be from initial snapshot or new event created
          // Only log if not from initial load (has hasPendingWrites metadata)
          if (!snapshot.metadata.hasPendingWrites && !snapshot.metadata.fromCache) {
            // Debug: Event added
          }
          // Add to store (addEvents handles merge)
          store.addEvents([event], { source: 'realtime' });
        } else if (change.type === 'modified') {
          // Debug: Event modified
          // Update existing event in store
          store.updateEvent(eventId, event);
        } else if (change.type === 'removed') {
          // Debug: Event removed
          // Note: We don't have a removeEvent action yet - events rarely deleted
          // For now, just invalidate cache so next fetch excludes it
          store.invalidateQueryCache();
        }
      });
    },
    (error) => {
      console.error('❌ [EventsRealtime] Subscription error:', error);
    }
  );

  activeUnsubscribe = unsubscribe;
  return unsubscribe;
};

/**
 * Subscribe to real-time updates for a date range (for calendar view)
 * BEP: Broader listener for calendar page which may show week/month
 *
 * @param {Date|string} startDate - Start of date range
 * @param {Date|string} endDate - End of date range
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDateRange = (startDate, endDate) => {
  const startStr = typeof startDate === 'string'
    ? startDate
    : startDate?.toISOString().split('T')[0];
  const endStr = typeof endDate === 'string'
    ? endDate
    : endDate?.toISOString().split('T')[0];

  if (!startStr || !endStr) {
    console.warn('[EventsRealtime] Invalid date range for subscription');
    return () => {};
  }

  const { startTimestamp } = buildDayTimestamps(startStr);
  const { endTimestamp } = buildDayTimestamps(endStr);

  const eventsRef = getEventsCollectionRef();
  const q = query(
    eventsRef,
    where('datetimeUtc', '>=', startTimestamp),
    where('datetimeUtc', '<=', endTimestamp)
  );

  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: false },
    (snapshot) => {
      const store = useEventsStore.getState();

      snapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        const eventId = change.doc.id;

        const datetimeUtc = docData.datetimeUtc?.toDate
          ? docData.datetimeUtc.toDate()
          : null;

        const event = {
          id: eventId,
          ...docData,
          name: docData.normalizedName || docData.canonicalName || docData.name || '',
          event: docData.normalizedName || docData.canonicalName || docData.event || '',
          date: datetimeUtc ? datetimeUtc.toISOString().split('T')[0] : docData.date || '',
          time: datetimeUtc ? datetimeUtc.toISOString().split('T')[1].substring(0, 5) : docData.time || '',
          datetimeUtc,
        };

        if (change.type === 'modified') {
          // Debug: Calendar event modified
          store.updateEvent(eventId, event);
        } else if (change.type === 'added' && !snapshot.metadata.fromCache) {
          store.addEvents([event], { source: 'realtime' });
        }
      });
    },
    (error) => {
      console.error('❌ [EventsRealtime] Calendar subscription error:', error);
    }
  );

  return unsubscribe;
};

/**
 * Cleanup all active subscriptions
 */
export const cleanupRealtimeSubscriptions = () => {
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
    currentTimezone = null;
  }
};

export default {
  subscribeToTodayEvents,
  subscribeToDateRange,
  cleanupRealtimeSubscriptions,
};
