/**
 * src/utils/dateUtils.js
 * 
 * Purpose: Centralized date/time utilities for timezone-aware formatting
 * Ensures consistent date/time display across all components (EventModal, EventsTimeline2, etc.)
 * 
 * Key Features:
 * - Timezone-aware formatting using Intl.DateTimeFormat
 * - Handles multiple input types (Date, Timestamp, ISO string, Unix timestamp)
 * - Mobile-first responsive design support
 * - Consistent error handling and fallbacks
 * 
 * Architecture:
 * - Backend stores: UTC timestamps in Firestore (corrected with JBlanked API offset)
 * - Frontend displays: User's selected timezone from TimezoneSelector
 * - Conversion: toLocaleString/toLocaleTimeString with timeZone parameter
 * 
 * Changelog:
 * v1.1.0 - 2025-12-01 - Added comprehensive logging to formatTime() for timezone debugging
 * v1.0.0 - 2025-12-01 - Initial implementation (extracted from EventModal & EventsTimeline2)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default timezone fallback
 */
export const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Date format options for consistency
 */
export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    month: 'short',
    day: 'numeric',
  },
  MEDIUM: {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  },
  LONG: {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  FULL: {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  },
};

/**
 * Time format options
 */
export const TIME_FORMAT_OPTIONS = {
  SHORT_24H: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  SHORT_12H: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  LONG_24H: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  LONG_12H: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  },
};

// ============================================================================
// DATE/TIME PARSING UTILITIES
// ============================================================================

/**
 * Convert various date formats to JavaScript Date object
 * Handles: Date objects, Firestore Timestamps, ISO strings, Unix timestamps, time strings
 * 
 * @param {Date|Object|string|number} date - Date in various formats
 * @returns {Date|null} JavaScript Date object or null if invalid
 * 
 * @example
 * parseDate(new Date()) // Date object
 * parseDate({ _seconds: 1764600300, _nanoseconds: 0 }) // Firestore Timestamp
 * parseDate("2025-12-01T14:45:00Z") // ISO string
 * parseDate(1764600300000) // Unix timestamp (milliseconds)
 * parseDate("09:45") // Time string (returns null - needs full datetime)
 */
export function parseDate(date) {
  if (!date) {
    return null;
  }

  // Already a Date object
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  // Firestore Timestamp object
  if (typeof date === 'object' && ('_seconds' in date || 'seconds' in date)) {
    const seconds = date._seconds || date.seconds || 0;
    const nanoseconds = date._nanoseconds || date.nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }

  // Unix timestamp (number)
  if (typeof date === 'number') {
    // Assume milliseconds if > year 2100 in seconds, otherwise convert from seconds
    const timestamp = date > 4102444800 ? date : date * 1000;
    const dateObj = new Date(timestamp);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  // String formats
  if (typeof date === 'string') {
    // Time-only string (HH:MM or HH:MM:SS) - cannot convert without full date
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
      console.warn('[dateUtils] Time-only string cannot be converted without date context:', date);
      return null;
    }

    // ISO string or other parseable date string
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  console.warn('[dateUtils] Unsupported date format:', typeof date, date);
  return null;
}

// ============================================================================
// TIMEZONE-AWARE FORMATTING
// ============================================================================

/**
 * Format time in 24-hour format with timezone awareness
 * Used for displaying event times across the app
 * 
 * @param {Date|Object|string|number} date - Date in various formats
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {Object} options - Additional formatting options
 * @returns {string} Formatted time (HH:MM) or fallback
 * 
 * @example
 * formatTime(1764600300, 'America/New_York') // "09:45"
 * formatTime(firestoreTimestamp, 'Europe/London') // "14:45"
 * formatTime(new Date(), 'Asia/Tokyo') // "23:45"
 */
export function formatTime(date, timezone = DEFAULT_TIMEZONE, options = {}) {
  // 🔍 LOGGING: Track frontend timezone conversion for debugging
  const isDebugEvent = typeof date === 'object' && date?._seconds === 1764600300; // "Final Manufacturing PMI" expected timestamp
  const isOldData = typeof date === 'object' && date?._seconds === 1764582300; // Old wrong timestamp
  
  if (isDebugEvent || isOldData) {
    console.log(`\n🎨 [formatTime] Processing ${isOldData ? '❌ OLD DATA' : '✅ NEW DATA'}:`);
    console.log(`   📥 Input type: ${typeof date}`);
    if (typeof date === 'object' && date?._seconds) {
      console.log(`   📥 Firestore Timestamp: ${date._seconds}.${date._nanoseconds || 0}`);
      console.log(`   📅 JS Date: ${new Date(date._seconds * 1000).toISOString()}`);
    } else if (typeof date === 'number') {
      console.log(`   📥 Unix timestamp: ${date}`);
      console.log(`   📅 JS Date: ${new Date(date * 1000).toISOString()}`);
    } else {
      console.log(`   📥 Raw input: ${date}`);
    }
    console.log(`   🌍 Target timezone: ${timezone}`);
  }
  
  // Handle time-only strings (HH:MM or HH:MM:SS) - return as-is
  if (typeof date === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
    return date.slice(0, 5); // Return HH:MM
  }

  const dateObj = parseDate(date);
  
  if (!dateObj) {
    console.warn('[dateUtils formatTime] Invalid date:', date);
    return '--:--';
  }

  if (isDebugEvent || isOldData) {
    console.log(`   📍 Parsed Date Object: ${dateObj.toISOString()}`);
    console.log(`   📍 UTC timestamp: ${dateObj.getTime()}`);
  }

  try {
    const formatOptions = {
      ...TIME_FORMAT_OPTIONS.SHORT_24H,
      ...options,
      timeZone: timezone,
    };

    const formatted = dateObj.toLocaleTimeString('en-US', formatOptions);
    
    if (isDebugEvent || isOldData) {
      console.log(`   🎯 toLocaleTimeString options: ${JSON.stringify(formatOptions)}`);
      console.log(`   ✅ Final formatted time: "${formatted}"`);
      console.log(`   🔢 Expected for ${timezone}:`);
      if (isDebugEvent) {
        console.log(`      - UTC: 14:45, EST: 09:45, GMT: 14:45, JST: 23:45`);
      } else {
        console.log(`      - ❌ WRONG DATA: UTC: 09:45, EST: 04:45 (5 hours off!)`);
      }
      console.log(`   ✨ Returning: "${formatted}"\n`);
    }

    return formatted;
  } catch (error) {
    console.error('[dateUtils formatTime] Formatting error:', {
      date,
      dateObj,
      timezone,
      error: error.message,
    });
    return '--:--';
  }
}

/**
 * Format date with timezone awareness
 * Used for day dividers, date headers, etc.
 * 
 * @param {Date|Object|string|number} date - Date in various formats
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {Object} options - Formatting options (use DATE_FORMAT_OPTIONS constants)
 * @returns {string} Formatted date or fallback
 * 
 * @example
 * formatDate(new Date(), 'America/New_York', DATE_FORMAT_OPTIONS.LONG)
 * // "Monday, Dec 1, 2025"
 * 
 * formatDate(firestoreTimestamp, 'Europe/London', DATE_FORMAT_OPTIONS.SHORT)
 * // "Dec 1"
 */
export function formatDate(date, timezone = DEFAULT_TIMEZONE, options = DATE_FORMAT_OPTIONS.LONG) {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    console.warn('[dateUtils formatDate] Invalid date:', date);
    return 'Invalid Date';
  }

  try {
    const formatOptions = {
      ...options,
      timeZone: timezone,
    };

    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    console.error('[dateUtils formatDate] Formatting error:', {
      date,
      dateObj,
      timezone,
      error: error.message,
    });
    return 'Invalid Date';
  }
}

/**
 * Format date and time together
 * Used for full datetime displays
 * 
 * @param {Date|Object|string|number} date - Date in various formats
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {Object} dateOptions - Date formatting options
 * @param {Object} timeOptions - Time formatting options
 * @returns {string} Formatted datetime
 * 
 * @example
 * formatDateTime(timestamp, 'America/New_York')
 * // "Monday, Dec 1, 2025, 09:45"
 */
export function formatDateTime(
  date, 
  timezone = DEFAULT_TIMEZONE, 
  dateOptions = DATE_FORMAT_OPTIONS.LONG,
  timeOptions = TIME_FORMAT_OPTIONS.SHORT_24H
) {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    console.warn('[dateUtils formatDateTime] Invalid date:', date);
    return 'Invalid Date';
  }

  try {
    const formatOptions = {
      ...dateOptions,
      ...timeOptions,
      timeZone: timezone,
    };

    return dateObj.toLocaleString('en-US', formatOptions);
  } catch (error) {
    console.error('[dateUtils formatDateTime] Formatting error:', {
      date,
      dateObj,
      timezone,
      error: error.message,
    });
    return 'Invalid Date';
  }
}

// ============================================================================
// DATE COMPARISON UTILITIES
// ============================================================================

/**
 * Check if a date is in the past relative to now in a specific timezone
 * 
 * @param {Date|Object|string|number} date - Date to check
 * @param {string} timezone - IANA timezone for comparison
 * @returns {boolean} True if date is in the past
 */
export function isPast(date, timezone = DEFAULT_TIMEZONE) {
  const dateObj = parseDate(date);
  if (!dateObj) return false;

  const now = new Date();
  return dateObj.getTime() < now.getTime();
}

/**
 * Check if a date is today in a specific timezone
 * 
 * @param {Date|Object|string|number} date - Date to check
 * @param {string} timezone - IANA timezone for comparison
 * @returns {boolean} True if date is today
 */
export function isToday(date, timezone = DEFAULT_TIMEZONE) {
  const dateObj = parseDate(date);
  if (!dateObj) return false;

  const now = new Date();
  
  // Normalize both dates to the specified timezone
  const dateStr = dateObj.toLocaleDateString('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const todayStr = now.toLocaleDateString('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return dateStr === todayStr;
}

/**
 * Check if two dates are the same day in a specific timezone
 * 
 * @param {Date|Object|string|number} date1 - First date
 * @param {Date|Object|string|number} date2 - Second date
 * @param {string} timezone - IANA timezone for comparison
 * @returns {boolean} True if dates are on the same day
 */
export function isSameDay(date1, date2, timezone = DEFAULT_TIMEZONE) {
  const dateObj1 = parseDate(date1);
  const dateObj2 = parseDate(date2);
  
  if (!dateObj1 || !dateObj2) return false;
  
  const date1Str = dateObj1.toLocaleDateString('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const date2Str = dateObj2.toLocaleDateString('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return date1Str === date2Str;
}

/**
 * Normalize date to start of day (midnight) in a specific timezone
 * Used for date comparison without time component
 * 
 * @param {Date|Object|string|number} date - Date to normalize
 * @param {string} timezone - IANA timezone
 * @returns {Date} Date set to midnight in the specified timezone
 */
export function normalizeToStartOfDay(date, timezone = DEFAULT_TIMEZONE) {
  const dateObj = parseDate(date);
  if (!dateObj) return null;

  // Get YYYY-MM-DD string in the specified timezone
  const dateStr = dateObj.toLocaleDateString('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  // Parse back as midnight local time
  return new Date(dateStr + 'T00:00:00');
}

// ============================================================================
// RELATIVE TIME UTILITIES
// ============================================================================

/**
 * Get time until/since a date
 * Returns human-readable relative time
 * 
 * @param {Date|Object|string|number} date - Target date
 * @param {string} timezone - IANA timezone for comparison
 * @returns {string} Relative time string (e.g., "in 2 hours", "5 minutes ago")
 */
export function getRelativeTime(date, timezone = DEFAULT_TIMEZONE) {
  const dateObj = parseDate(date);
  if (!dateObj) return 'Unknown';

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

  const isPastEvent = diffMs < 0;
  const prefix = isPastEvent ? '' : 'in ';
  const suffix = isPastEvent ? ' ago' : '';

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${prefix}${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}${suffix}`;
  } else if (diffHours < 24) {
    return `${prefix}${diffHours} hour${diffHours !== 1 ? 's' : ''}${suffix}`;
  } else {
    return `${prefix}${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`;
  }
}

// ============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Legacy export - use formatTime instead
 * @deprecated Use formatTime(date, timezone) instead
 */
export const formatEventTime = formatTime;

/**
 * Legacy export - use formatDate instead
 * @deprecated Use formatDate(date, timezone, options) instead
 */
export const formatEventDate = formatDate;
