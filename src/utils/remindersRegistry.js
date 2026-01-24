/**
 * src/utils/remindersRegistry.js
 * 
 * Purpose: Normalize events into unified reminder payloads with stable keys.
 * Key responsibility and main functionality: Provide event-key building, reminder normalization,
 * and recurrence expansion utilities for source-agnostic reminders.
 * 
 * BEP: Unified Same-Event Matching Engine (name + currency + time)
 * ========================================================================
 * This module implements the reference matching logic used across reminders, favorites, and notes:
 * 
 * - buildEventKey(): Source + eventId OR source + name + time (full key)
 * - buildSeriesKey(): source:series:name:currency:impact:category (template key)
 * 
 * Favorites and Notes services MUST use buildEventIdentity() from favoritesService.js,
 * which now mirrors this logic by building composite keys: name-currency-time.
 * 
 * This ensures:
 * ✅ NFP USD and NFP EUR are treated as different events
 * ✅ Same event at same time only matches once (no duplicates)
 * ✅ All three services (reminders, favorites, notes) use identical matching
 * 
 * Changelog:
 * v1.2.0 - 2026-01-23 - Enforce max reminders per event for unified reminder normalization.
 * v1.1.0 - 2026-01-23 - Add series key helpers for non-custom reminder matching.
 * v1.0.0 - 2026-01-23 - Unified reminder normalization and recurrence expansion utilities.
 */

import { buildEventIdentity } from '../services/favoritesService';
import { getEventEpochMs } from './eventTimeEngine';
import { DEFAULT_TIMEZONE, getDatePartsInTimezone, getUtcDateForTimezone } from './dateUtils';

const normalizeKey = (value) => {
    if (!value) return null;
    const trimmed = String(value).trim().toLowerCase();
    return trimmed.length ? trimmed : null;
};

export const MAX_REMINDERS_PER_EVENT = 3;

export const normalizeReminderChannels = (channels = {}) => ({
    inApp: Boolean(channels.inApp),
    browser: Boolean(channels.browser),
    push: Boolean(channels.push),
});

export const normalizeReminders = (reminders = []) => {
    if (!Array.isArray(reminders)) return [];
    return reminders
        .map((reminder) => {
            const minutesBefore = Number(reminder?.minutesBefore);
            if (!Number.isFinite(minutesBefore) || minutesBefore < 0) return null;
            return {
                minutesBefore,
                channels: normalizeReminderChannels(reminder.channels),
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.minutesBefore - b.minutesBefore)
        .slice(0, MAX_REMINDERS_PER_EVENT);
};

export const aggregateReminderChannels = (reminders = []) => {
    const aggregated = { inApp: false, browser: false, push: false };
    reminders.forEach((reminder) => {
        const channels = reminder?.channels || {};
        if (channels.inApp) aggregated.inApp = true;
        if (channels.browser) aggregated.browser = true;
        if (channels.push) aggregated.push = true;
    });
    return aggregated;
};

const resolveEventTitle = (event = {}) => (
    event.title
    || event.name
    || event.Name
    || event.canonicalName
    || event.eventTitle
    || event.eventName
    || event.headline
    || 'Event reminder'
);

const resolveEventImpact = (event = {}) => (
    event.impact
    || event.strength
    || event.strengthValue
    || event._displayCache?.strengthValue
    || 'unknown'
);

const resolveEventCategory = (event = {}) => (
    event.category
    || event.Category
    || null
);

const resolveEventCurrency = (event = {}) => (
    event.currency
    || event.Currency
    || null
);

const resolveEventTimezone = (event = {}, fallbackTimezone = DEFAULT_TIMEZONE) => (
    event.timezone
    || event.tz
    || event.Timezone
    || fallbackTimezone
);

export const buildEventKey = ({ event = {}, eventSource = 'unknown', eventEpochMs, title }) => {
    const { eventId, primaryNameKey } = buildEventIdentity(event);
    if (eventId) return `${eventSource}:${eventId}`;
    if (primaryNameKey) return `${eventSource}:${primaryNameKey}`;
    const fallbackTitle = normalizeKey(title || resolveEventTitle(event)) || 'event';
    const fallbackEpoch = Number.isFinite(eventEpochMs) ? eventEpochMs : null;
    return `${eventSource}:${fallbackTitle}${fallbackEpoch ? `:${fallbackEpoch}` : ''}`;
};

export const buildSeriesKey = ({ event = {}, eventSource = 'unknown' }) => {
    const nameKey = normalizeKey(event.canonicalName || resolveEventTitle(event)) || 'event';
    const currencyKey = normalizeKey(resolveEventCurrency(event)) || 'na';
    const impactKey = normalizeKey(resolveEventImpact(event)) || 'unknown';
    const categoryKey = normalizeKey(resolveEventCategory(event)) || 'na';
    return `${eventSource}:series:${nameKey}:${currencyKey}:${impactKey}:${categoryKey}`;
};

export const normalizeEventForReminder = ({
    event = {},
    source,
    userId,
    reminders,
    enabled = true,
    metadata = {},
    scope = 'event',
}) => {
    const eventSource = source || event.source || event.Source || 'unknown';
    const eventEpochMs = Number.isFinite(event?.eventEpochMs)
        ? event.eventEpochMs
        : Number.isFinite(event?.epochMs)
            ? event.epochMs
            : getEventEpochMs(event);
    const title = resolveEventTitle(event);
    const impact = resolveEventImpact(event);
    const timezone = resolveEventTimezone(event, metadata?.timezone || DEFAULT_TIMEZONE);
    const normalizedReminders = normalizeReminders(reminders ?? event.reminders ?? []);
    const channels = aggregateReminderChannels(normalizedReminders);
    const seriesKey = buildSeriesKey({ event, eventSource });
    const resolvedScope = metadata?.scope || scope || 'event';
    const eventKey = resolvedScope === 'series' ? seriesKey : buildEventKey({ event, eventSource, eventEpochMs, title });

    return {
        userId: userId || null,
        eventKey,
        eventSource,
        eventEpochMs: Number.isFinite(eventEpochMs) ? eventEpochMs : null,
        title,
        impact,
        timezone,
        reminders: normalizedReminders,
        channels,
        enabled: Boolean(enabled),
        scope: resolvedScope,
        seriesKey,
        metadata: {
            ...metadata,
            scope: resolvedScope,
            currency: metadata.currency || event.currency || event.Currency || null,
            category: metadata.category || event.category || null,
            description: metadata.description || event.description || null,
            customColor: metadata.customColor || event.customColor || null,
            customIcon: metadata.customIcon || event.customIcon || null,
            showOnClock: metadata.showOnClock ?? event.showOnClock ?? null,
            isCustom: metadata.isCustom ?? event.isCustom ?? false,
            seriesId: metadata.seriesId || event.seriesId || null,
            localDate: metadata.localDate || event.localDate || null,
            localTime: metadata.localTime || event.localTime || null,
            recurrence: metadata.recurrence || event.recurrence || null,
        },
    };
};

const RECURRENCE_INTERVALS = {
    '5m': { unit: 'minute', step: 5, ms: 5 * 60 * 1000 },
    '15m': { unit: 'minute', step: 15, ms: 15 * 60 * 1000 },
    '30m': { unit: 'minute', step: 30, ms: 30 * 60 * 1000 },
    '1h': { unit: 'hour', step: 1, ms: 60 * 60 * 1000 },
    '4h': { unit: 'hour', step: 4, ms: 4 * 60 * 60 * 1000 },
    '1D': { unit: 'day', step: 1 },
    '1W': { unit: 'week', step: 1 },
    '1M': { unit: 'month', step: 1 },
    '1Q': { unit: 'quarter', step: 1 },
    '1Y': { unit: 'year', step: 1 },
};

const parseLocalDateParts = (localDate) => {
    if (!localDate) return null;
    const [yearStr, monthStr, dayStr] = String(localDate).split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const day = Number(dayStr);
    if ([year, month, day].some((value) => Number.isNaN(value))) return null;
    return { year, month, day };
};

const parseLocalTimeParts = (localTime) => {
    if (!localTime) return null;
    const [hourStr, minuteStr] = String(localTime).split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if ([hour, minute].some((value) => Number.isNaN(value))) return null;
    return { hour, minute };
};

const getLocalTimePartsFromEpoch = (epochMs, timezone) => {
    if (!Number.isFinite(epochMs)) return null;
    try {
        const date = new Date(epochMs);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const hour = Number(parts.find((p) => p.type === 'hour')?.value);
        const minute = Number(parts.find((p) => p.type === 'minute')?.value);
        if ([hour, minute].some((value) => Number.isNaN(value))) return null;
        return { hour, minute };
    } catch {
        return null;
    }
};

const buildEpochFromLocalParts = (timezone, { year, month, day, hour, minute }) => {
    const utcDate = getUtcDateForTimezone(timezone, year, month, day, { hour, minute, second: 0, millisecond: 0 });
    return utcDate.getTime();
};

const addDaysToLocalDateParts = ({ year, month, day }, addDays) => {
    const base = new Date(Date.UTC(year, month, day));
    const next = new Date(base.getTime() + addDays * 24 * 60 * 60 * 1000);
    return { year: next.getUTCFullYear(), month: next.getUTCMonth(), day: next.getUTCDate() };
};

const addMonthsToLocalDateParts = ({ year, month, day }, addMonths) => {
    const totalMonths = month + addMonths;
    const nextYear = year + Math.floor(totalMonths / 12);
    const nextMonth = ((totalMonths % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
    return { year: nextYear, month: nextMonth, day: Math.min(day, lastDay) };
};

const getRecurrenceUntilEpoch = (recurrence, timezone, timeParts) => {
    if (recurrence?.ends?.type !== 'onDate') return null;
    const untilParts = parseLocalDateParts(recurrence?.ends?.untilLocalDate);
    if (!untilParts || !timeParts) return null;
    return buildEpochFromLocalParts(timezone, { ...untilParts, ...timeParts });
};

export const expandReminderOccurrences = ({ reminder, rangeStartMs, rangeEndMs, maxOccurrences = 5000 }) => {
    if (!reminder) return [];
    const recurrence = reminder?.metadata?.recurrence;
    const baseEpochMs = Number.isFinite(reminder?.eventEpochMs) ? reminder.eventEpochMs : null;

    if (!recurrence?.enabled || !recurrence?.interval || recurrence.interval === 'none') {
        if (!baseEpochMs || baseEpochMs < rangeStartMs || baseEpochMs > rangeEndMs) return [];
        return [{ occurrenceEpochMs: baseEpochMs, occurrenceKey: reminder.eventKey }];
    }

    const intervalMeta = RECURRENCE_INTERVALS[recurrence.interval];
    if (!intervalMeta || !baseEpochMs) return [];

    const timezone = reminder.timezone || DEFAULT_TIMEZONE;
    const localDateParts = parseLocalDateParts(reminder?.metadata?.localDate)
        || getDatePartsInTimezone(timezone, new Date(baseEpochMs));
    const timeParts = parseLocalTimeParts(reminder?.metadata?.localTime)
        || getLocalTimePartsFromEpoch(baseEpochMs, timezone)
        || { hour: 0, minute: 0 };

    const untilEpochMs = getRecurrenceUntilEpoch(recurrence, timezone, timeParts);
    const maxCount = recurrence?.ends?.type === 'after'
        ? Math.max(1, Number(recurrence?.ends?.count || 1))
        : Infinity;

    const occurrences = [];
    let generated = 0;

    if (intervalMeta.unit === 'minute' || intervalMeta.unit === 'hour') {
        const stepMs = intervalMeta.ms;
        const rawStartIndex = Math.ceil((rangeStartMs - baseEpochMs) / stepMs);
        const startIndex = Math.max(0, rawStartIndex);
        let maxIndex = Math.floor((rangeEndMs - baseEpochMs) / stepMs);
        if (untilEpochMs !== null) {
            maxIndex = Math.min(maxIndex, Math.floor((untilEpochMs - baseEpochMs) / stepMs));
        }
        if (Number.isFinite(maxCount)) {
            maxIndex = Math.min(maxIndex, maxCount - 1);
        }

        for (let idx = startIndex; idx <= maxIndex; idx += 1) {
            const occurrenceEpochMs = baseEpochMs + idx * stepMs;
            if (occurrenceEpochMs < rangeStartMs || occurrenceEpochMs > rangeEndMs) continue;
            occurrences.push({
                occurrenceEpochMs,
                occurrenceKey: `${reminder.eventKey}__${occurrenceEpochMs}`,
            });
            generated += 1;
            if (generated >= maxOccurrences) break;
        }
        return occurrences;
    }

    const baseDateUtc = new Date(Date.UTC(localDateParts.year, localDateParts.month, localDateParts.day));
    const rangeStartParts = getDatePartsInTimezone(timezone, new Date(rangeStartMs));
    const rangeStartUtc = new Date(Date.UTC(rangeStartParts.year, rangeStartParts.month, rangeStartParts.day));
    const dayMs = 24 * 60 * 60 * 1000;

    let stepDays = 0;
    let stepMonths = 0;
    if (intervalMeta.unit === 'day') stepDays = intervalMeta.step;
    if (intervalMeta.unit === 'week') stepDays = intervalMeta.step * 7;
    if (intervalMeta.unit === 'month') stepMonths = intervalMeta.step;
    if (intervalMeta.unit === 'quarter') stepMonths = intervalMeta.step * 3;
    if (intervalMeta.unit === 'year') stepMonths = intervalMeta.step * 12;

    let startIndex = 0;
    if (stepDays > 0) {
        const diffDays = Math.floor((rangeStartUtc.getTime() - baseDateUtc.getTime()) / dayMs);
        startIndex = diffDays > 0 ? Math.floor(diffDays / stepDays) : 0;
    } else if (stepMonths > 0) {
        const diffMonths = (rangeStartParts.year - localDateParts.year) * 12 + (rangeStartParts.month - localDateParts.month);
        startIndex = diffMonths > 0 ? Math.floor(diffMonths / stepMonths) : 0;
    }

    let currentIndex = Math.max(0, startIndex);
    while (generated < maxOccurrences) {
        let nextDateParts = localDateParts;
        if (stepDays > 0) {
            nextDateParts = addDaysToLocalDateParts(localDateParts, currentIndex * stepDays);
        }
        if (stepMonths > 0) {
            nextDateParts = addMonthsToLocalDateParts(localDateParts, currentIndex * stepMonths);
        }

        const occurrenceEpochMs = buildEpochFromLocalParts(timezone, { ...nextDateParts, ...timeParts });
        if (occurrenceEpochMs < rangeStartMs) {
            currentIndex += 1;
            continue;
        }
        if (occurrenceEpochMs > rangeEndMs) break;
        if (untilEpochMs !== null && occurrenceEpochMs > untilEpochMs) break;
        if (Number.isFinite(maxCount) && currentIndex >= maxCount) break;

        occurrences.push({
            occurrenceEpochMs,
            occurrenceKey: `${reminder.eventKey}__${occurrenceEpochMs}`,
        });

        generated += 1;
        currentIndex += 1;
    }

    return occurrences;
};
