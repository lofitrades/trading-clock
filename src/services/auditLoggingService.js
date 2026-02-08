/**
 * src/services/auditLoggingService.js
 *
 * Purpose: Client-side audit logging for user activities with rescheduled/reinstated events.
 * Tracks when users add/remove/modify favorites, notes, and reminders for rescheduled events.
 * Provides traceability and debugging when user data doesn't persist across reschedules.
 *
 * Changelog:
 * v1.0.0 - 2026-02-06 - Initial implementation with rescheduled event audit logs for favorites, notes, and reminders.
 */

const shouldDebugAudit = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('t2t_debug_audit') === '1';
};

const logAudit = (...args) => {
  if (!shouldDebugAudit()) return;
  console.info('[audit][EventData]', ...args);
};

/**
 * Log favorite action on a rescheduled event
 * @param {Object} event - The event object
 * @param {string} action - 'added' or 'removed'
 * @param {string} userId - User ID
 */
export const logFavoriteAudit = (event, action, userId) => {
  if (!event?.rescheduledFrom) return; // Only log if rescheduled

  logAudit('⭐ Favorite action on rescheduled event', {
    action,
    eventId: event.id || event.eventId,
    eventName: event.name || event.Name,
    currency: event.currency || event.Currency,
    originalTime: event.originalDatetimeUtc?.toISOString?.() || event.originalDatetimeUtc,
    rescheduledFrom: event.rescheduledFrom?.toISOString?.() || event.rescheduledFrom,
    currentTime: event.datetimeUtc?.toISOString?.() || event.datetimeUtc,
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log note action on a rescheduled event
 * @param {Object} event - The event object
 * @param {string} action - 'added', 'updated', or 'removed'
 * @param {string} userId - User ID
 * @param {string} noteText - Optional note text preview (first 100 chars)
 */
export const logNoteAudit = (event, action, userId, noteText = '') => {
  if (!event?.rescheduledFrom) return; // Only log if rescheduled

  logAudit('📝 Note action on rescheduled event', {
    action,
    eventId: event.id || event.eventId,
    eventName: event.name || event.Name,
    currency: event.currency || event.Currency,
    notePreview: noteText ? noteText.substring(0, 100) : '(empty)',
    originalTime: event.originalDatetimeUtc?.toISOString?.() || event.originalDatetimeUtc,
    rescheduledFrom: event.rescheduledFrom?.toISOString?.() || event.rescheduledFrom,
    currentTime: event.datetimeUtc?.toISOString?.() || event.datetimeUtc,
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log reminder action on a rescheduled event
 * @param {Object} event - The event object
 * @param {string} action - 'added', 'updated', or 'removed'
 * @param {string} userId - User ID
 * @param {Object} reminder - Reminder object with minutesBefore and channels
 */
export const logReminderAudit = (event, action, userId, reminder = null) => {
  if (!event?.rescheduledFrom) return; // Only log if rescheduled

  logAudit('🔔 Reminder action on rescheduled event', {
    action,
    eventId: event.id || event.eventId,
    eventName: event.name || event.Name,
    currency: event.currency || event.Currency,
    reminderMinutesBefore: reminder?.minutesBefore ?? 'N/A',
    reminderChannels: reminder?.channels ? Object.keys(reminder.channels).filter(k => reminder.channels[k]) : [],
    originalTime: event.originalDatetimeUtc?.toISOString?.() || event.originalDatetimeUtc,
    rescheduledFrom: event.rescheduledFrom?.toISOString?.() || event.rescheduledFrom,
    currentTime: event.datetimeUtc?.toISOString?.() || event.datetimeUtc,
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log when user data (favorites/notes/reminders) is loaded for a rescheduled event
 * @param {Object} event - The event object
 * @param {string} dataType - 'favorites', 'notes', or 'reminders'
 * @param {boolean} found - Whether data was found
 * @param {string} userId - User ID
 */
export const logRescheduledEventDataLoad = (event, dataType, found, userId) => {
  if (!event?.rescheduledFrom) return; // Only log if rescheduled

  logAudit(`📊 User ${dataType} load on rescheduled event - ${found ? '✅ FOUND' : '❌ NOT FOUND'}`, {
    dataType,
    found,
    eventId: event.id || event.eventId,
    eventName: event.name || event.Name,
    currency: event.currency || event.Currency,
    originalTime: event.originalDatetimeUtc?.toISOString?.() || event.originalDatetimeUtc,
    rescheduledFrom: event.rescheduledFrom?.toISOString?.() || event.rescheduledFrom,
    currentTime: event.datetimeUtc?.toISOString?.() || event.datetimeUtc,
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log the composite key being used for a rescheduled event
 * Helps debug if key calculation is causing persistence issues
 * @param {Object} event - The event object
 * @param {string} eventKey - The calculated event key (from buildEventKey)
 * @param {string} userId - User ID
 */
export const logRescheduledEventKeyDebug = (event, eventKey, userId) => {
  if (!event?.rescheduledFrom) return; // Only log if rescheduled

  logAudit('🔑 Composite key calculation for rescheduled event', {
    eventKey,
    eventId: event.id || event.eventId,
    eventName: event.name || event.Name,
    currency: event.currency || event.Currency,
    originalDatetimeUtc: event.originalDatetimeUtc?.toISOString?.() || event.originalDatetimeUtc,
    rescheduledFrom: event.rescheduledFrom?.toISOString?.() || event.rescheduledFrom,
    currentDatetimeUtc: event.datetimeUtc?.toISOString?.() || event.datetimeUtc,
    userId,
    timestamp: new Date().toISOString(),
  });
};
