/**
 * src/utils/defaultCustomEvents.js
 *
 * Purpose: Centralized module for default/sample custom events.
 * Provides guest-facing sample markers (NY Open, Market Close) for the clock overlay,
 * and Firestore creation of default custom events + reminders for new authenticated users.
 *
 * Key responsibilities:
 * - buildGuestSampleEvents(): Timezone-aware sample events for non-auth clock markers (today only, weekdays)
 * - buildGuestSampleEventsForRange(): Timezone-aware sample events for a date range (calendar, weekdays)
 * - createDefaultCustomEventsForUser(): Creates two recurring weekday custom events with 10-min reminders
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP: Added buildGuestSampleEventsForRange for Calendar2Page multi-day guest events.
 *                        Single source of truth: reuses DEFAULT_EVENTS definitions. Includes showOnCalendar
 *                        flag, _displayCache with correct strengthValue, and all fields matching clock overlay.
 * v1.0.0 - 2026-02-09 - Initial implementation. Guest sample events + new-user default events with reminders.
 */

import { getDatePartsInTimezone, getUtcDateForTimezone } from './dateUtils';
import { addCustomEvent } from '../services/customEventsService';

/** NY timezone constant */
const NY_TIMEZONE = 'America/New_York';

/** Default custom event definitions (times in NY / America/New_York) */
const DEFAULT_EVENTS = [
  {
    title: 'NY Open',
    hour: 9,
    minute: 30,
    color: '#018786',
    icon: 'play',
    impact: 'my-events',
    description: 'New York Stock Exchange opening bell.',
  },
  {
    title: 'Market Close',
    hour: 17,
    minute: 0,
    color: '#8B6CFF',
    icon: 'close',
    impact: 'my-events',
    description: 'US equity and futures markets close.',
  },
];

/**
 * Build the epoch (UTC milliseconds) for a specific wall-clock time in a timezone on a given day.
 * @param {number} year
 * @param {number} month - 0-indexed (Jan = 0)
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @param {string} timezone - IANA timezone
 * @returns {number} epoch ms
 */
const epochForTime = (year, month, day, hour, minute, timezone) => {
  const utcDate = getUtcDateForTimezone(timezone, year, month, day, { hour, minute });
  return utcDate.getTime();
};

/**
 * Build display-ready sample events for the clock overlay (guest / non-auth users).
 * Returns events for TODAY in the user's selected timezone, but the reference times
 * are defined in America/New_York and converted to UTC epoch for correct positioning.
 *
 * Only returns events on weekdays (Mon-Fri in NY time).
 *
 * @returns {Array<Object>} Array of display-ready custom event objects (may be empty on weekends)
 */
export const buildGuestSampleEvents = () => {
  const now = new Date();

  // Check if today is a weekday in NY timezone
  const { year, month, day, dayOfWeek } = getDatePartsInTimezone(NY_TIMEZONE, now);
  if (dayOfWeek === 0 || dayOfWeek === 6) return []; // Weekend in NY

  return DEFAULT_EVENTS.map((def) => {
    const eventEpoch = epochForTime(year, month, day, def.hour, def.minute, NY_TIMEZONE);

    // Build a localDate string (YYYY-MM-DD) in NY timezone for display
    const localDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const localTime = `${String(def.hour).padStart(2, '0')}:${String(def.minute).padStart(2, '0')}`;

    return {
      id: `guest-sample-${def.title.replace(/\s+/g, '-').toLowerCase()}`,
      seriesId: `guest-sample-${def.title.replace(/\s+/g, '-').toLowerCase()}`,
      title: def.title,
      name: def.title,
      description: def.description,
      timezone: NY_TIMEZONE,
      localDate,
      localTime,
      epochMs: eventEpoch,
      date: eventEpoch,
      time: eventEpoch,
      customColor: def.color,
      customIcon: def.icon,
      impact: def.impact,
      currency: '—',
      showOnClock: true,
      reminders: [],
      recurrence: { enabled: false },
      recurrenceEnabled: false,
      source: 'custom',
      isCustom: true,
      isSample: true, // Flag to identify as sample event
      externalId: null,
      syncProvider: null,
      lastSyncedAt: null,
      createdAt: null,
      updatedAt: null,
      _displayCache: {
        isSpeech: false,
        actual: '—',
        forecast: '—',
        previous: '—',
        epochMs: eventEpoch,
        strengthValue: def.impact,
        relativeLabel: '',
      },
    };
  });
};

/**
 * Build display-ready sample events for a date range (guest / non-auth users).
 * Used by Calendar2Page to show default custom events across the active week.
 * Reuses the same DEFAULT_EVENTS definitions as buildGuestSampleEvents (single source of truth).
 *
 * Only returns events on weekdays (Mon-Fri in NY time).
 *
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Array<Object>} Array of display-ready custom event objects
 */
export const buildGuestSampleEventsForRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const events = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    // Check day of week in NY timezone
    const { year, month, day, dayOfWeek } = getDatePartsInTimezone(NY_TIMEZONE, current);

    // Only weekdays (Mon-Fri)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      for (const def of DEFAULT_EVENTS) {
        const eventEpoch = epochForTime(year, month, day, def.hour, def.minute, NY_TIMEZONE);
        const localDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const localTime = `${String(def.hour).padStart(2, '0')}:${String(def.minute).padStart(2, '0')}`;
        const slug = def.title.replace(/\s+/g, '-').toLowerCase();

        events.push({
          id: `guest-sample-${slug}-${localDate}`,
          seriesId: `guest-sample-${slug}`,
          title: def.title,
          name: def.title,
          description: def.description,
          timezone: NY_TIMEZONE,
          localDate,
          localTime,
          epochMs: eventEpoch,
          date: eventEpoch,
          time: eventEpoch,
          customColor: def.color,
          customIcon: def.icon,
          impact: def.impact,
          currency: '—',
          showOnClock: true,
          showOnCalendar: true,
          reminders: [],
          recurrence: { enabled: false },
          recurrenceEnabled: false,
          source: 'custom',
          isCustom: true,
          isSample: true,
          isReadOnly: true,
          isDefaultEvent: true,
          externalId: null,
          syncProvider: null,
          lastSyncedAt: null,
          createdAt: null,
          updatedAt: null,
          _displayCache: {
            isSpeech: false,
            actual: '—',
            forecast: '—',
            previous: '—',
            epochMs: eventEpoch,
            strengthValue: def.impact,
            relativeLabel: '',
          },
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return events;
};

/**
 * Create default custom events for a newly authenticated user.
 * Creates "NY Open" (9:30 AM ET) and "Market Close" (5:00 PM ET) as recurring
 * weekday events with a 10-minute reminder (in-app + browser + push channels).
 *
 * @param {string} userId - Firebase Auth UID
 * @param {string} [userTimezone='America/New_York'] - User's preferred IANA timezone
 * @returns {Promise<string[]>} Array of created event document IDs
 */
export const createDefaultCustomEventsForUser = async (userId) => {
  if (!userId) return [];

  const now = new Date();
  const { year, month, day } = getDatePartsInTimezone(NY_TIMEZONE, now);

  const createdIds = [];

  for (const def of DEFAULT_EVENTS) {
    const localDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const localTime = `${String(def.hour).padStart(2, '0')}:${String(def.minute).padStart(2, '0')}`;

    try {
      const docId = await addCustomEvent(userId, {
        title: def.title,
        description: def.description,
        timezone: NY_TIMEZONE,
        localDate,
        localTime,
        customColor: def.color,
        customIcon: def.icon,
        impact: def.impact,
        showOnClock: true,
        reminders: [
          {
            minutesBefore: 10,
            channels: {
              inApp: true,
              browser: true,
              push: true,
            },
          },
        ],
        recurrence: {
          enabled: true,
          interval: '1D',
          ends: { type: 'never' },
          daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        },
      });

      createdIds.push(docId);
    } catch (err) {
      // Non-critical: log and continue
      console.warn(`[defaultCustomEvents] Failed to create "${def.title}" for user ${userId}:`, err?.message || err);
    }
  }

  return createdIds;
};
