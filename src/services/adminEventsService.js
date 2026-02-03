/**
 * src/services/adminEventsService.js
 * 
 * Purpose: Service layer for admin event management operations
 * Handles querying, updating, and changelog tracking for canonical events
 * BEP: Full timezone support - admin sees/edits in their timezone, system stores UTC
 * 
 * Changelog:
 * v1.3.0 - 2026-02-02 - Fixed impact filter: moved to client-side with case-insensitive matching (values vary: "Low", "Medium", "High", "Holiday")
 * v1.2.0 - 2026-02-02 - BEP TIMEZONE: Added convertLocalToUtc, fetchEventsInTimezone, updateEventWithTimezone. Admin edits in local TZ, stored as UTC.
 * v1.1.0 - 2026-02-02 - BEP: Enhanced validation, normalizedName sync, date/currency validation
 * v1.0.0 - 2026-02-02 - Initial implementation with source priority logic
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { parseISO, isBefore, startOfDay, parse, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Canonical events collection path: economicEvents/events/events
const getEventsCollectionRef = () => {
  const rootDoc = doc(collection(db, 'economicEvents'), 'events');
  return collection(rootDoc, 'events');
};

/**
 * Convert UTC datetime to local timezone for display
 * @param {Date} utcDate - UTC Date object
 * @param {string} timezone - Target timezone (e.g., 'America/New_York')
 * @returns {Object} { date: 'YYYY-MM-DD', time: 'HH:MM' } in local timezone
 */
export const convertUtcToLocal = (utcDate, timezone) => {
  if (!utcDate || !timezone) return { date: '', time: '' };
  
  try {
    // Convert UTC to local timezone
    const zonedDate = toZonedTime(utcDate, timezone);
    return {
      date: format(zonedDate, 'yyyy-MM-dd'),
      time: format(zonedDate, 'HH:mm'),
    };
  } catch (error) {
    console.error('Error converting UTC to local:', error);
    return { date: '', time: '' };
  }
};

/**
 * Convert local timezone datetime to UTC for storage
 * @param {string} localDate - Date in 'YYYY-MM-DD' format
 * @param {string} localTime - Time in 'HH:MM' format
 * @param {string} timezone - Source timezone (e.g., 'America/New_York')
 * @returns {Date} UTC Date object
 */
export const convertLocalToUtc = (localDate, localTime, timezone) => {
  if (!localDate || !timezone) return null;
  
  try {
    const timeStr = localTime || '00:00';
    // Parse the date/time as if it's in the specified timezone
    const localDateTime = parse(
      `${localDate} ${timeStr}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );
    // Convert from local timezone to UTC
    const utcDate = fromZonedTime(localDateTime, timezone);
    return utcDate;
  } catch (error) {
    console.error('Error converting local to UTC:', error);
    return null;
  }
};

/**
 * Fetch events with filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Array of event documents
 */
export const fetchEventsWithFilters = async (filters) => {
  try {
    const {
      startDate,
      endDate,
      currency,
      impact,
      source,
      searchQuery,
    } = filters;

    // Convert string dates to Timestamps for Firestore query
    // startDate format: 'YYYY-MM-DD' -> start of that day in UTC
    const startDateObj = new Date(startDate + 'T00:00:00.000Z');
    const endDateObj = new Date(endDate + 'T23:59:59.999Z');
    
    const startTimestamp = Timestamp.fromDate(startDateObj);
    const endTimestamp = Timestamp.fromDate(endDateObj);

    // Build base query with date range (required) - using datetimeUtc field
    const eventsRef = getEventsCollectionRef();
    
    let constraints = [
      where('datetimeUtc', '>=', startTimestamp),
      where('datetimeUtc', '<=', endTimestamp),
    ];

    // Add optional filters (server-side for indexed fields)
    if (currency) {
      constraints.push(where('currency', '==', currency));
    }

    // Note: Impact filter moved to client-side due to inconsistent casing in stored data
    // (e.g., "Low", "Medium", "High", "Holiday" from different sources)

    // Add orderBy for proper index usage
    const q = query(eventsRef, ...constraints, orderBy('datetimeUtc', 'asc'));
    
    const snapshot = await getDocs(q);

    let events = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const datetimeUtc = data.datetimeUtc?.toDate ? data.datetimeUtc.toDate() : null;
      
      // Convert Firestore Timestamps to serializable ISO strings
      // Prevents React rendering errors ("Objects are not valid as a React child")
      const lastModified = data.lastModified?.toDate ? data.lastModified.toDate().toISOString() : null;
      const frozenAt = data.frozenAt?.toDate ? data.frozenAt.toDate().toISOString() : null;
      
      // Process changelog entries to ensure all values are serializable
      const changelog = (data.changelog || []).map(entry => ({
        ...entry,
        // Ensure timestamp is ISO string
        timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate().toISOString() : entry.timestamp,
        // Convert any Timestamp objects in oldValue/newValue
        oldValue: entry.oldValue?.toDate ? entry.oldValue.toDate().toISOString() : entry.oldValue,
        newValue: entry.newValue?.toDate ? entry.newValue.toDate().toISOString() : entry.newValue,
      }));
      
      return {
        id: docSnap.id,
        ...data,
        // Override Timestamp fields with serialized values
        lastModified,
        frozenAt,
        changelog,
        // Map event name from normalizedName or canonicalName
        event: data.normalizedName || data.canonicalName || data.event || '',
        // Store raw UTC date/time for backend reference
        dateUtc: datetimeUtc ? datetimeUtc.toISOString().split('T')[0] : '',
        timeUtc: datetimeUtc ? datetimeUtc.toISOString().split('T')[1].substring(0, 5) : '',
        // Display will be converted in component based on admin timezone
        date: datetimeUtc ? datetimeUtc.toISOString().split('T')[0] : '',
        time: datetimeUtc ? datetimeUtc.toISOString().split('T')[1].substring(0, 5) : '',
        datetimeUtc,
      };
    });

    // Client-side filtering for source, impact, and search
    // (These filters use case-insensitive matching for data consistency)
    if (source) {
      const beforeFilter = events.length;
      events = events.filter(event => {
        // Check if event has this source in sources object
        return event.sources && event.sources[source];
      });
    }

    // Impact filter: case-insensitive matching (stored values may be "Low", "Medium", "High", "Holiday", etc.)
    if (impact) {
      const beforeFilter = events.length;
      const lowerImpact = impact.toLowerCase();
      events = events.filter(event => {
        const eventImpact = (event.impact || '').toLowerCase();
        return eventImpact.includes(lowerImpact) || lowerImpact.includes(eventImpact);
      });
    }

    if (searchQuery) {
      const beforeFilter = events.length;
      const lowerQuery = searchQuery.toLowerCase();
      events = events.filter(event =>
        event.event?.toLowerCase().includes(lowerQuery) ||
        event.canonicalName?.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort by date and time
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Parse time strings (format: "HH:MM" or "HH:MM:SS")
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    return events;
  } catch (error) {
    console.error('❌ [AdminEvents] Error fetching events:', error);
    console.error('❌ [AdminEvents] Error stack:', error.stack);
    throw new Error('Failed to fetch events: ' + error.message);
  }
};

/**
 * Update event with changelog tracking
 * @param {string} eventId - Event document ID
 * @param {Object} updates - Fields to update
 * @param {Object} adminUser - Admin user info { uid, email }
 * @param {string} reason - Optional reason for change
 * @param {Object} originalEvent - Original event data for old values
 * @returns {Promise<void>}
 */
export const updateEventWithChangelog = async (
  eventId,
  updates,
  adminUser,
  reason = '',
  originalEvent
) => {
  try {
    const eventsRef = getEventsCollectionRef();
    const eventRef = doc(eventsRef, eventId);

    // Determine if event is in the past
    const eventDate = parseISO(originalEvent.date);
    const now = startOfDay(new Date());
    const isEventInPast = isBefore(eventDate, now);

    // Build changelog entries for each changed field
    const changelogEntries = Object.keys(updates).map(field => ({
      timestamp: new Date().toISOString(),
      adminUid: adminUser.uid,
      adminEmail: adminUser.email,
      field,
      oldValue: originalEvent[field] ?? null,
      newValue: updates[field],
      reason: reason || '',
    }));

    // Prepare update payload
    const updatePayload = {
      ...updates,
      lastModified: serverTimestamp(),
      lastModifiedBy: adminUser.uid,
    };

    // If event name is updated, also update normalizedName for consistency
    if (updates.event) {
      updatePayload.normalizedName = updates.event.toLowerCase().trim();
    }

    // Add changelog entries
    changelogEntries.forEach(entry => {
      updatePayload.changelog = arrayUnion(entry);
    });

    // Handle manuallyEdited flag based on event date
    if (isEventInPast) {
      // Past event: Flag as manually edited and freeze syncs
      updatePayload.manuallyEdited = true;
      updatePayload.syncFrozen = true;
      updatePayload.frozenAt = serverTimestamp();
      updatePayload.frozenBy = adminUser.uid;
    } else {
      // Future event: Flag as edited but keep sync active
      updatePayload.manuallyEdited = true;
      updatePayload.syncFrozen = false;
    }

    // Update document
    await updateDoc(eventRef, updatePayload);

    return {
      success: true,
      message: 'Event updated successfully',
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event: ' + error.message);
  }
};

/**
 * Get event changelog
 * @param {string} eventId - Event document ID
 * @returns {Promise<Array>} Array of changelog entries
 */
export const getEventChangelog = async (eventId) => {
  try {
    const eventsRef = getEventsCollectionRef();
    const eventRef = doc(eventsRef, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.data();
    return eventData.changelog || [];
  } catch (error) {
    console.error('Error fetching changelog:', error);
    throw new Error('Failed to fetch changelog: ' + error.message);
  }
};

/**
 * Validate event field update
 * @param {string} field - Field name
 * @param {any} value - New value
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export const validateFieldUpdate = (field, value) => {
  switch (field) {
    case 'impact':
      if (!['high', 'medium', 'low', 'High', 'Medium', 'Low'].includes(value)) {
        return { valid: false, error: 'Invalid impact value (use high, medium, or low)' };
      }
      break;

    case 'time': {
      // Validate time format HH:MM or HH:MM:SS
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(value)) {
        return { valid: false, error: 'Invalid time format (use HH:MM or HH:MM:SS)' };
      }
      break;
    }

    case 'date': {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { valid: false, error: 'Invalid date format (use YYYY-MM-DD)' };
      }
      // Validate it's a real date
      const parsed = new Date(value + 'T00:00:00Z');
      if (isNaN(parsed.getTime())) {
        return { valid: false, error: 'Invalid date value' };
      }
      break;
    }

    case 'currency':
      if (!/^[A-Z]{3}$/.test(value) && value !== 'ALL') {
        return { valid: false, error: 'Invalid currency code (use 3-letter code or ALL)' };
      }
      break;

    case 'forecast':
    case 'previous':
    case 'actual':
      // Allow numbers, percentages, text values, or empty string
      // Economic data can be: "1.5%", "125K", "0.2", "-0.5%", "N/A", ""
      // Be permissive for these fields
      break;

    case 'event':
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return { valid: false, error: 'Event name is required' };
      }
      break;

    default:
      break;
  }

  return { valid: true };
};

/**
 * Format event data for display in timezone
 * @param {Object} event - Event data
 * @param {string} timezone - Target timezone
 * @returns {Object} Formatted event
 */
export const formatEventForDisplay = (event, timezone) => {
  try {
    // If we have datetimeUtc, use it for accurate conversion
    if (event.datetimeUtc) {
      const utcDate = event.datetimeUtc instanceof Date 
        ? event.datetimeUtc 
        : event.datetimeUtc.toDate?.() || new Date(event.datetimeUtc);
      
      const { date, time } = convertUtcToLocal(utcDate, timezone);
      return {
        ...event,
        date,
        time,
        // Keep UTC versions for reference
        dateUtc: utcDate.toISOString().split('T')[0],
        timeUtc: utcDate.toISOString().split('T')[1].substring(0, 5),
      };
    }
    
    // Fallback: parse date and time strings (assumed UTC)
    const dateTimeStr = `${event.date}T${event.time || '00:00'}:00Z`;
    const utcDate = new Date(dateTimeStr);
    const { date, time } = convertUtcToLocal(utcDate, timezone);

    return {
      ...event,
      date,
      time,
      dateUtc: event.date,
      timeUtc: event.time || '00:00',
    };
  } catch (error) {
    console.error('Error formatting event:', error);
    return event;
  }
};

/**
 * Fetch events with filters and convert to admin's timezone
 * @param {Object} filters - Filter criteria
 * @param {string} timezone - Admin's timezone for display
 * @returns {Promise<Array>} Array of event documents in admin timezone
 */
export const fetchEventsInTimezone = async (filters, timezone) => {
  const events = await fetchEventsWithFilters(filters);
  
  if (!timezone || timezone === 'UTC') {
    return events;
  }
  
  // Convert all events to admin's timezone for display
  return events.map(event => formatEventForDisplay(event, timezone));
};

/**
 * Update event with timezone-aware date/time conversion
 * Admin edits in their local timezone -> system converts to UTC -> stores in Firestore
 * 
 * @param {string} eventId - Event document ID
 * @param {Object} updates - Fields to update (date/time in admin's timezone)
 * @param {Object} adminUser - Admin user info { uid, email }
 * @param {string} reason - Optional reason for change
 * @param {Object} originalEvent - Original event data
 * @param {string} timezone - Admin's timezone (for date/time conversion)
 * @returns {Promise<Object>} Result with UTC values for real-time sync
 */
export const updateEventWithTimezone = async (
  eventId,
  updates,
  adminUser,
  reason = '',
  originalEvent,
  timezone = 'UTC'
) => {
  try {
    const eventsRef = getEventsCollectionRef();
    const eventRef = doc(eventsRef, eventId);

    // Build update payload
    const updatePayload = { ...updates };
    let newDatetimeUtc = null;

    // If date or time changed, convert from admin's timezone to UTC
    if (updates.date || updates.time) {
      const newDate = updates.date || originalEvent.dateUtc || originalEvent.date;
      const newTime = updates.time || originalEvent.timeUtc || originalEvent.time || '00:00';
      
      // Convert local timezone to UTC
      const utcDate = convertLocalToUtc(newDate, newTime, timezone);
      
      if (utcDate) {
        newDatetimeUtc = utcDate;
        updatePayload.datetimeUtc = Timestamp.fromDate(utcDate);
        
        // Also store the UTC string versions for backward compatibility
        updatePayload.dateUtc = utcDate.toISOString().split('T')[0];
        updatePayload.timeUtc = utcDate.toISOString().split('T')[1].substring(0, 5);
        
        console.log('🕐 [AdminEvents] Timezone conversion:', {
          inputDate: newDate,
          inputTime: newTime,
          timezone,
          utcResult: utcDate.toISOString(),
        });
      }
    }

    // Determine if event is in the past (use original UTC date)
    const eventDateUtc = originalEvent.dateUtc || originalEvent.date;
    const eventDate = parseISO(eventDateUtc);
    const now = startOfDay(new Date());
    const isEventInPast = isBefore(eventDate, now);

    // Build changelog entries using UTC values for old/new comparison
    const changelogEntries = Object.keys(updates)
      .filter(field => !['dateUtc', 'timeUtc', 'datetimeUtc'].includes(field))
      .map(field => ({
        timestamp: new Date().toISOString(),
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
        field,
        oldValue: originalEvent[field] ?? null,
        newValue: updates[field],
        reason: reason || '',
      }));

    // Add metadata
    updatePayload.lastModified = serverTimestamp();
    updatePayload.lastModifiedBy = adminUser.uid;

    // If event name is updated, also update normalizedName
    if (updates.event) {
      updatePayload.normalizedName = updates.event.toLowerCase().trim();
    }

    // Add changelog entries
    changelogEntries.forEach(entry => {
      updatePayload.changelog = arrayUnion(entry);
    });

    // Handle manuallyEdited flag based on event date
    if (isEventInPast) {
      updatePayload.manuallyEdited = true;
      updatePayload.syncFrozen = true;
      updatePayload.frozenAt = serverTimestamp();
      updatePayload.frozenBy = adminUser.uid;
    } else {
      updatePayload.manuallyEdited = true;
      updatePayload.syncFrozen = false;
    }

    // Update document
    await updateDoc(eventRef, updatePayload);

    return {
      success: true,
      message: 'Event updated successfully',
      utcDatetime: newDatetimeUtc,
      utcDate: updatePayload.dateUtc,
      utcTime: updatePayload.timeUtc,
    };
  } catch (error) {
    console.error('Error updating event with timezone:', error);
    throw new Error('Failed to update event: ' + error.message);
  }
};
