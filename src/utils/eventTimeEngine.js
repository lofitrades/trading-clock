/**
 * src/utils/eventTimeEngine.js
 *
 * Purpose: Shared timezone-aware "Next/Now engine" for consistent event timing across the app.
 * Provides absolute-epoch-based countdown and state detection used by timeline and clock overlay.
 * Key responsibility: Eliminate timezone-shifted Date objects from countdown math while preserving
 * timezone-aware display formatting.
 *
 * Changelog:
 * v1.0.1 - 2025-12-16 - Marked timezone param as intentionally unused to satisfy lint.
 * v1.0.0 - 2025-12-15 - Initial implementation: centralized NOW/NEXT detection with absolute epoch comparisons.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * NOW window duration (milliseconds)
 * Events within this window AFTER release time are marked as "NOW"
 * Matches existing app behavior (9 minutes for initial market reaction)
 */
export const NOW_WINDOW_MS = 9 * 60 * 1000; // 9 minutes

// ============================================================================
// CORE ENGINE FUNCTIONS
// ============================================================================

/**
 * Extract absolute event instant as epoch milliseconds
 * Handles multiple event field formats used across the app
 * 
 * CRITICAL: Never uses toLocaleString parsing - returns the TRUE absolute instant
 * 
 * @param {Object} event - Event object (may have date, dateTime, Date, or time fields)
 * @returns {number|null} - Absolute epoch milliseconds or null if invalid
 */
export function getEventEpochMs(event) {
  if (!event) return null;

  // Try various field names used across the app
  const raw = event.date ?? event.dateTime ?? event.Date ?? event.time;
  if (!raw) return null;

  // Handle Date objects (most common)
  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  // Handle Firestore Timestamps
  if (typeof raw === 'object' && typeof raw.toDate === 'function') {
    const date = raw.toDate();
    const ms = date.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  // Handle epoch milliseconds (number)
  if (typeof raw === 'number') {
    return Number.isNaN(raw) ? null : raw;
  }

  // Handle ISO strings or other parseable formats
  if (typeof raw === 'string') {
    const date = new Date(raw);
    const ms = date.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  return null;
}

/**
 * Get current time as absolute epoch milliseconds
 * Timezone parameter is unused - "now" is timezone-independent
 * Included for API consistency and future use cases
 * 
 * @param {string} _timezone - IANA timezone (unused but kept for API consistency)
 * @returns {number} - Current epoch milliseconds
 */
export function getNowEpochMs(_timezone) {
  // Keep signature for API compatibility; explicitly mark unused for lint
  void _timezone;
  return Date.now();
}

/**
 * Compute NOW/NEXT state for a collection of events
 * Uses absolute epoch comparisons - timezone-independent
 * 
 * State priority: NOW > NEXT (no event can be both)
 * NOW: Within NOW_WINDOW_MS after event time
 * NEXT: Earliest upcoming event(s) - supports simultaneous releases
 * 
 * @param {Object} params - Computation parameters
 * @param {Array} params.events - Array of event objects
 * @param {number} params.nowEpochMs - Current time in epoch ms (from getNowEpochMs or Date.now())
 * @param {number} [params.nowWindowMs=NOW_WINDOW_MS] - NOW window duration in ms
 * @param {Function} [params.buildKey] - Optional function to build stable event keys (event, index) => string
 * @returns {Object} - { nowEventIds: Set, nextEventIds: Set, nextEventEpochMs: number|null }
 */
export function computeNowNextState({ events, nowEpochMs, nowWindowMs = NOW_WINDOW_MS, buildKey }) {
  const nowEventIds = new Set();
  const nextEventIds = new Set();
  let nextEventEpochMs = null;

  if (!events || !Array.isArray(events)) {
    return { nowEventIds, nextEventIds, nextEventEpochMs };
  }

  // Default key builder: use event.id or fallback to deterministic compound key
  const keyBuilder = buildKey || ((evt, idx) => {
    return evt.id || `${evt.name || evt.Name}-${evt.date || evt.dateTime || evt.Date || evt.time}-${idx}`;
  });

  events.forEach((event, index) => {
    const eventEpochMs = getEventEpochMs(event);
    if (eventEpochMs === null) return;

    const eventKey = keyBuilder(event, index);
    if (!eventKey) return;

    // Check if event is in NOW window (after event time, within window)
    const diff = nowEpochMs - eventEpochMs;
    const isNow = eventEpochMs <= nowEpochMs && diff < nowWindowMs;

    if (isNow) {
      nowEventIds.add(eventKey);
      return; // NOW events are not considered for NEXT
    }

    // Check if event is upcoming (future)
    if (eventEpochMs > nowEpochMs) {
      if (nextEventEpochMs === null || eventEpochMs < nextEventEpochMs) {
        // Found earlier event - reset NEXT set
        nextEventEpochMs = eventEpochMs;
        nextEventIds.clear();
        nextEventIds.add(eventKey);
      } else if (eventEpochMs === nextEventEpochMs) {
        // Simultaneous event - add to NEXT set
        nextEventIds.add(eventKey);
      }
    }
  });

  return { nowEventIds, nextEventIds, nextEventEpochMs };
}

/**
 * Format countdown as H:MM:SS
 * 
 * @param {number} diffMs - Time difference in milliseconds (absolute value)
 * @returns {string} - Formatted countdown (e.g., "1:23:45" or "0:05:30")
 */
export function formatCountdownHMS(diffMs) {
  if (diffMs < 0) diffMs = 0;
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  return `${hours}:${mm}:${ss}`;
}

/**
 * Format relative time label for tooltips and badges
 * Returns "Starting now" | "In 1h 02m" | "5m ago"
 * 
 * @param {Object} params - Formatting parameters
 * @param {number} params.eventEpochMs - Event time in epoch ms
 * @param {number} params.nowEpochMs - Current time in epoch ms
 * @param {number} [params.nowWindowMs=NOW_WINDOW_MS] - NOW window duration
 * @returns {string} - Formatted relative label
 */
export function formatRelativeLabel({ eventEpochMs, nowEpochMs, nowWindowMs = NOW_WINDOW_MS }) {
  if (eventEpochMs === null || eventEpochMs === undefined) return '';
  
  const diff = eventEpochMs - nowEpochMs;
  const absDiff = Math.abs(diff);
  
  // Check if in NOW window
  if (diff <= 0 && absDiff < nowWindowMs) {
    // Within 45 seconds shows "Starting now"
    if (absDiff < 45 * 1000) {
      return 'Starting now';
    }
    // Otherwise show "Xm ago" for the NOW window
  }
  
  // Format time parts
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  
  const days = Math.floor(absDiff / dayMs);
  const hours = Math.floor((absDiff % dayMs) / hourMs);
  const minutes = Math.floor((absDiff % hourMs) / minuteMs);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  
  const label = parts.join(' ');
  
  return diff >= 0 ? `In ${label}` : `${label} ago`;
}

/**
 * Get timezone-aware day serial for grouping (YYYYMMDD)
 * Used for determining if an event is "past today" vs "future day" in selected timezone
 * 
 * CRITICAL: This is for DISPLAY logic only (day grouping, gray-out)
 * Never use this serial for countdown math - use absolute epochs instead
 * 
 * @param {Date} date - JavaScript Date object
 * @param {string} timezone - IANA timezone
 * @returns {number|null} - Day serial (YYYYMMDD) or null
 */
export function getDaySerialInTimezone(date, timezone) {
  if (!date || !(date instanceof Date)) return null;
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    if (!year || !month || !day) return null;
    
    return parseInt(year) * 10000 + parseInt(month) * 100 + parseInt(day);
  } catch (error) {
    console.error('[eventTimeEngine] getDaySerialInTimezone error:', error);
    return null;
  }
}

/**
 * Check if event is "past today" in selected timezone
 * Used for gray-out logic in timeline and overlay
 * 
 * @param {number} eventEpochMs - Event time in epoch ms
 * @param {number} nowEpochMs - Current time in epoch ms
 * @param {string} timezone - IANA timezone
 * @param {number} [nowWindowMs=NOW_WINDOW_MS] - NOW window duration
 * @returns {boolean} - True if event is past (not NOW, not future day, before now)
 */
export function isPastToday({ eventEpochMs, nowEpochMs, timezone, nowWindowMs = NOW_WINDOW_MS }) {
  if (eventEpochMs === null || nowEpochMs === null) return false;
  
  const eventDate = new Date(eventEpochMs);
  const nowDate = new Date(nowEpochMs);
  
  const eventDaySerial = getDaySerialInTimezone(eventDate, timezone);
  const nowDaySerial = getDaySerialInTimezone(nowDate, timezone);
  
  if (eventDaySerial === null || nowDaySerial === null) return false;
  
  // Check if future day
  const isFutureDay = eventDaySerial > nowDaySerial;
  if (isFutureDay) return false;
  
  // Check if in NOW window
  const diff = nowEpochMs - eventEpochMs;
  const isNow = eventEpochMs <= nowEpochMs && diff < nowWindowMs;
  if (isNow) return false;
  
  // Past if before now
  return eventEpochMs < nowEpochMs;
}
