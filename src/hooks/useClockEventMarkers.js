/**
 * src/hooks/useClockEventMarkers.js
 *
 * Purpose: Build clock marker view-models from economic events with minimal
 * per-tick work. Separates heavy grouping/bucketing (on data changes) from
 * lightweight temporal status (per second) so the overlay UI stays fast.
 *
 * Changelog:
 * v1.3.0 - 2026-01-29 - BEP PHASE 1.2: PERFORMANCE REFACTOR - Separated heavy computation (representative selection, custom icons, aggregation) from lightweight temporal updates. Created baseMarkersWithMetadata memoized separately from temporal status updates. Heavy work now memoizes ONLY on baseMarkers (not nowEpochMs), while temporal updates (NOW/NEXT/PAST) recalculate per second. Expected: 90% less CPU work per tick, smooth 60 FPS on low-end devices.
 * v1.2.6 - 2026-01-24 - BEP: Clarify scope-based reminder matching logic (event vs series scoped reminders).
 * v1.2.5 - 2026-01-23 - Match reminder docs by eventId alias to avoid source key mismatches.
 * v1.2.4 - 2026-01-23 - Match reminders by event and series keys for live marker badges.
 * v1.2.3 - 2026-01-23 - Expose reminder badge flags for marker overlays.
 * v1.2.2 - 2026-01-22 - Group event markers into nearest 5-minute windows for consistent clock clustering.
 * v1.2.1 - 2026-01-21 - Expose impact meta for custom marker badges.
 * v1.2.0 - 2026-01-21 - Use custom icon/color overrides for reminder markers.
 * v1.1.3 - 2026-01-21 - Use a custom MUI icon for custom reminder markers.
 * v1.1.2 - 2026-01-21 - Keep custom reminder markers visible when favorites-only filter is active.
 * v1.1.1 - 2026-01-21 - Refactor: Markers now group only by exact time; representative visuals follow current priority scoring.
 * v1.1.0 - 2026-01-21 - Refactor: Removed 30-minute window bucketing. Markers now group only by exact time and currency.
 * v1.0.0 - 2026-01-07 - Extracted marker builder to isolate data shaping from UI; optimized per-second updates and live favorites/notes badge support.
 */

import React, { useMemo } from 'react';
import { resolveImpactMeta } from '../utils/newsApi';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { getEventEpochMs, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { getCustomEventIconComponent, resolveCustomEventColor } from '../utils/customEventStyle';
import { buildEventKey, buildSeriesKey } from '../utils/remindersRegistry';

const useTimeParts = (timezone) => {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }),
    [timezone],
  );

  return (date) => {
    if (!date) return null;
    const parts = formatter.formatToParts(date instanceof Date ? date : new Date(date));
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return { hour, minute };
  };
};

const getImpactMeta = (impact) => resolveImpactMeta(impact);

const GROUP_MINUTES = 5;

const getNearestGroupTime = (hour, minute) => {
  const rounded = Math.round(minute / GROUP_MINUTES) * GROUP_MINUTES;
  let bucketMinute = rounded;
  let bucketHour = hour;

  if (bucketMinute === 60) {
    bucketMinute = 0;
    bucketHour = (bucketHour + 1) % 24;
  }

  return { bucketHour, bucketMinute };
};

const getMinuteDelta = (minute, bucketMinute) => {
  let delta = (bucketMinute - minute + 60) % 60;
  if (delta > 30) delta -= 60;
  return delta;
};

const extractReminderEventId = (eventKey) => {
  if (!eventKey) return null;
  const key = String(eventKey);
  if (key.includes(':series:')) return null;
  if (key.startsWith('event:')) return key.slice(6) || null;
  const idx = key.indexOf(':');
  if (idx === -1) return null;
  return key.slice(idx + 1) || null;
};

// BEP: Extract seriesId from custom event reminder keys for recurring event matching
const extractSeriesId = (eventKey) => {
  if (!eventKey) return null;
  const key = String(eventKey);
  // Custom event keys are like "custom:seriesId" or "custom:title-epochMs"
  const idx = key.indexOf(':');
  if (idx === -1) return null;
  const afterPrefix = key.slice(idx + 1);
  // If it contains double underscore, it's an occurrence id - extract seriesId
  if (afterPrefix.includes('__')) {
    return afterPrefix.split('__')[0] || null;
  }
  return afterPrefix || null;
};

const resolveEventSource = (event) => {
  if (!event) return 'unknown';
  if (event.isCustom) return 'custom';
  return event.eventSource || event.source || event.Source || event.sourceKey || 'canonical';
};

export function useClockEventMarkers({ events = [], timezone, eventFilters, nowEpochMs, isFavorite, hasNotes, reminders = [] }) {
  const getTimeParts = useTimeParts(timezone);

  const reminderKeySets = useMemo(() => {
    const eventKeys = new Set();
    const seriesKeys = new Set();
    const eventIds = new Set();
    const seriesIds = new Set(); // BEP: Track seriesIds for custom recurring events
    (reminders || []).forEach((reminder) => {
      if (!reminder) return;
      const scope = reminder.scope || 'event';
      
      // BEP: Match reminders by scope:
      // - 'event' scope: reminder applies to specific event, stored with eventKey
      // - 'series' scope: reminder applies to all matching events in series, stored with seriesKey
      if (reminder.eventKey) {
        if (scope === 'event') {
          eventKeys.add(String(reminder.eventKey));
        } else if (scope === 'series') {
          // For series-scoped reminders, eventKey is set to seriesKey
          seriesKeys.add(String(reminder.eventKey));
        }
      }
      
      const seriesKey = reminder.seriesKey || reminder.eventKey;
      if (scope === 'series' && seriesKey) {
        seriesKeys.add(String(seriesKey));
      }
      
      const eventId = extractReminderEventId(reminder.eventKey);
      if (eventId) eventIds.add(String(eventId));
      
      // BEP: Also track seriesId from metadata for custom recurring events
      const metaSeriesId = reminder.metadata?.seriesId;
      if (metaSeriesId) seriesIds.add(String(metaSeriesId));
      
      // Extract seriesId from eventKey if it's a custom event format
      const extractedSeriesId = extractSeriesId(reminder.eventKey);
      if (extractedSeriesId) seriesIds.add(String(extractedSeriesId));
    });
    
    return { eventKeys, seriesKeys, eventIds, seriesIds };
  }, [reminders]);

  const baseMarkers = useMemo(() => {
    if (!timezone) return [];

    const grouped = new Map();

    events.forEach((evt) => {
      const date = evt.date || evt.dateTime || evt.Date;
      const parts = getTimeParts(date);
      const eventEpochMs = getEventEpochMs(evt);
      if (!parts || eventEpochMs === null) return;

      const { hour, minute } = parts;
      const currency = evt.currency || evt.Currency || '';

      const { bucketHour, bucketMinute } = getNearestGroupTime(hour, minute);
      const minuteDelta = getMinuteDelta(minute, bucketMinute);
      const groupEpochMs = eventEpochMs + minuteDelta * 60000;

      const impactMeta = getImpactMeta(evt.impact || evt.strength || evt.Strength);
      const eventSource = resolveEventSource(evt);
      const eventTitle = evt.title || evt.name || evt.Name || evt.canonicalName || evt.eventTitle || evt.eventName || evt.headline;
      const eventKey = buildEventKey({ event: evt, eventSource, eventEpochMs, title: eventTitle });
      const seriesKey = buildSeriesKey({ event: evt, eventSource });
      const eventIdCandidate = evt?.id || evt?.eventId || evt?.EventId || null;
      const eventSeriesId = evt?.seriesId || null; // BEP: Track seriesId for custom recurring events
      
      // BEP: Check for reminder match including seriesId for custom recurring events
      const hasReminderEvent = reminderKeySets.eventKeys.has(String(eventKey))
        || reminderKeySets.seriesKeys.has(String(seriesKey))
        || (eventIdCandidate && reminderKeySets.eventIds.has(String(eventIdCandidate)))
        || (eventSeriesId && reminderKeySets.seriesIds.has(String(eventSeriesId)));
      
      const key = `${bucketHour}-${bucketMinute}`;

      const list = grouped.get(key) || [];
      list.push({
        evt,
        hour: bucketHour,
        minute: bucketMinute,
        eventEpochMs,
        groupEpochMs,
        impactMeta,
        currency,
        countryCode: currency ? getCurrencyFlag(currency) : null,
        isFavoriteEvent: isFavorite ? isFavorite(evt) : false,
        hasNoteEvent: hasNotes ? hasNotes(evt) : false,
        hasReminderEvent,
      });
      grouped.set(key, list);
    });

    const markers = Array.from(grouped.entries())
      .map(([key, list]) => {
        if (!list || list.length === 0) return null;

        return {
          key,
          hour: list[0].hour,
          minute: list[0].minute,
          groupEpochMs: list[0].groupEpochMs ?? null,
          events: list,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const timeDiff = (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
        if (timeDiff !== 0) return timeDiff;
        const aCurrency = (a.events?.[0]?.currency || '').toString();
        const bCurrency = (b.events?.[0]?.currency || '').toString();
        return aCurrency.localeCompare(bCurrency);
      });

    if (eventFilters?.favoritesOnly) {
      return markers.filter((marker) =>
        marker.events.some((item) => item.isFavoriteEvent || item.evt?.isCustom)
      );
    }

    return markers;
  }, [events, timezone, eventFilters?.favoritesOnly, getTimeParts, isFavorite, hasNotes, reminderKeySets]);

  // BEP PHASE 1.2: Pre-compute static marker data (structure, representative, custom icon)
  // This heavy computation depends ONLY on events/filters/timezone, not nowEpochMs
  // Memoizing here prevents unnecessary recomputation every second
  const baseMarkersWithMetadata = useMemo(() => {
    return baseMarkers.map((marker) => {
      const scoredEvents = marker.events.map((item) => {
        const impactPriority = item.impactMeta.priority || 0;
        // Static score components (don't depend on now time)
        const score = [
          Number(item.isFavoriteEvent),
          Number(item.hasNoteEvent),
          impactPriority,
        ];
        return { ...item, score };
      });

      const representative = scoredEvents.reduce((best, current) => {
        const sa = best.score;
        const sb = current.score;
        for (let i = 0; i < sa.length; i += 1) {
          if (sa[i] !== sb[i]) return sa[i] > sb[i] ? best : current;
        }
        if (!best.eventEpochMs || !current.eventEpochMs) return best;
        return best.eventEpochMs <= current.eventEpochMs ? best : current;
      }, scoredEvents[0]);

      const isCustomEvent = Boolean(representative?.evt?.isCustom);
      const CustomIcon = isCustomEvent
        ? getCustomEventIconComponent(representative?.evt?.customIcon)
        : null;
      const customMeta = isCustomEvent
        ? {
            ...representative.impactMeta,
            icon: CustomIcon ? React.createElement(CustomIcon, { sx: { fontSize: 14, color: '#fff' } }) : representative.impactMeta.icon,
            color: resolveCustomEventColor(representative?.evt?.customColor),
          }
        : representative.impactMeta;

      return {
        ...marker,
        representative,
        customMeta,
        impactMeta: representative.impactMeta,
        currency: representative.currency,
        countryCode: representative.countryCode,
        isFavoriteMarkerAny: marker.events.some((item) => item.isFavoriteEvent),
        hasNoteMarkerAny: marker.events.some((item) => item.hasNoteEvent),
        hasReminderMarkerAny: marker.events.some((item) => item.hasReminderEvent),
      };
    });
  }, [baseMarkers]); // ✅ Only depends on baseMarkers, NOT nowEpochMs

  // BEP PHASE 1.2: Lightweight temporal status updates (per second)
  // Calculate NOW/NEXT/PAST status based on current time
  // This memoized separately so it can update every second without heavy recomputation
  const earliestFuture = useMemo(() => {
    let min = null;
    baseMarkers.forEach((marker) => {
      marker.events.forEach((item) => {
        if (item.eventEpochMs > nowEpochMs) {
          if (min === null || item.eventEpochMs < min) {
            min = item.eventEpochMs;
          }
        }
      });
    });
    return min;
  }, [baseMarkers, nowEpochMs]); // ✅ Fast O(N) scan, only called once per second

  const markers = useMemo(() => {
    return baseMarkersWithMetadata.map((marker) => {
      // Lightweight status updates for this tick
      const hasNowInGroup = marker.events.some((item) => {
        const diff = item.eventEpochMs - nowEpochMs;
        return diff <= 0 && Math.abs(diff) < NOW_WINDOW_MS;
      });

      const hasNextInGroup = !hasNowInGroup && earliestFuture !== null && marker.events.some((item) => item.eventEpochMs === earliestFuture);

      const isAllPast = marker.events.every((item) => item.eventEpochMs < nowEpochMs);

      const upcomingOrNow = marker.events.filter((item) => item.eventEpochMs >= nowEpochMs);
      const isFavoriteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((item) => item.isFavoriteEvent);
      const hasNoteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((item) => item.hasNoteEvent);
      const hasReminderMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((item) => item.hasReminderEvent);

      return {
        ...marker,
        isNow: hasNowInGroup,
        isNext: hasNextInGroup,
        isTodayPast: isAllPast,
        meta: marker.customMeta,
        isFavoriteMarker,
        hasNoteMarker,
        hasReminderMarker,
      };
    });
  }, [baseMarkersWithMetadata, earliestFuture, nowEpochMs]);

  const hasNowEvent = useMemo(() => markers.some((marker) => marker.isNow), [markers]);

  return { markers, hasNowEvent, earliestFuture };
}

export default useClockEventMarkers;