/**
 * src/utils/remindersPolicy.js
 * 
 * Purpose: Enforce reminder cost controls (daily cap, quiet hours, throttling) with UX helpers.
 * Key responsibility and main functionality: Provide helper utilities for warning messages and
 * timezone-aware quiet-hour checks used by reminder UI and trigger engine.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-23 - Align UI warnings with max reminders per event cap.
 * v1.0.0 - 2026-01-23 - Initial reminder policy utilities for caps, quiet hours, and throttling.
 */

import { DEFAULT_TIMEZONE } from './dateUtils';
import { MAX_REMINDERS_PER_EVENT } from './remindersRegistry';

export const DAILY_REMINDER_CAP = 50;
export const QUIET_HOURS = { start: 21, end: 6 };
export const THROTTLE_WINDOW_MS = 2 * 60 * 1000;

const getQuietHoursLabel = (quietHours = QUIET_HOURS) => {
    const format = (hour) => {
        const normalized = ((hour % 24) + 24) % 24;
        const suffix = normalized >= 12 ? 'PM' : 'AM';
        const hour12 = normalized % 12 || 12;
        return `${hour12} ${suffix}`;
    };
    return `${format(quietHours.start)} – ${format(quietHours.end)}`;
};

export const getReminderQuietHoursLabel = () => getQuietHoursLabel(QUIET_HOURS);

export const getOccurrencesPerDay = (recurrence) => {
    if (!recurrence?.enabled || recurrence?.interval === 'none') return 1;

    switch (recurrence.interval) {
        case '5m':
            return 288;
        case '15m':
            return 96;
        case '30m':
            return 48;
        case '1h':
            return 24;
        case '4h':
            return 6;
        case '1D':
            return 1;
        case '1W':
            return 1 / 7;
        case '1M':
            return 1 / 30;
        case '1Q':
            return 1 / 90;
        case '1Y':
            return 1 / 365;
        default:
            return 1;
    }
};

const countReminderChannels = (reminder) => {
    if (!reminder?.channels) return 0;
    return Object.values(reminder.channels).filter(Boolean).length;
};

export const estimateDailyTriggers = ({ reminders = [], recurrence }) => {
    const occurrencesPerDay = getOccurrencesPerDay(recurrence);
    const perOccurrence = reminders.reduce((sum, reminder) => sum + countReminderChannels(reminder), 0);
    return occurrencesPerDay * perOccurrence;
};

export const getReminderPolicyWarnings = ({ reminders = [], recurrence }) => {
    const warnings = [];
    const estimated = estimateDailyTriggers({ reminders, recurrence });

    if (estimated > DAILY_REMINDER_CAP) {
        warnings.push(`This schedule could generate about ${Math.ceil(estimated)} reminders per day, which exceeds the daily cap (${DAILY_REMINDER_CAP}).`);
    }

    const interval = recurrence?.interval;
    if (['5m', '15m', '30m'].includes(interval)) {
        warnings.push('High-frequency repeats can be throttled to protect performance. Consider fewer reminders or a longer interval.');
    }

    if (reminders.length > MAX_REMINDERS_PER_EVENT) {
        warnings.push(`Only ${MAX_REMINDERS_PER_EVENT} reminders are allowed per event. Extra reminders will be ignored.`);
    }

    return warnings;
};

export const isWithinQuietHours = ({ epochMs, timezone = DEFAULT_TIMEZONE, quietHours = QUIET_HOURS }) => {
    if (!Number.isFinite(epochMs)) return false;
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            hour12: false,
        });
        const hour = Number(formatter.format(new Date(epochMs)));
        if (Number.isNaN(hour)) return false;
        const { start, end } = quietHours;
        if (start === end) return false;
        if (start < end) {
            return hour >= start && hour < end;
        }
        return hour >= start || hour < end;
    } catch {
        return false;
    }
};

export const getDayKeyForTimezone = ({ epochMs, timezone = DEFAULT_TIMEZONE }) => {
    if (!Number.isFinite(epochMs)) return null;
    try {
        const date = new Date(epochMs);
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch {
        return null;
    }
};
