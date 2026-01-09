/**
 * src/hooks/useClockEventMarkers.js
 *
 * Purpose: Build clock marker view-models from economic events with minimal
 * per-tick work. Separates heavy grouping/bucketing (on data changes) from
 * lightweight temporal status (per second) so the overlay UI stays fast.
 *
 * Changelog:
 * v1.0.0 - 2026-01-07 - Extracted marker builder to isolate data shaping from UI; optimized per-second updates and live favorites/notes badge support.
 */

import { useMemo } from 'react';
import { resolveImpactMeta } from '../utils/newsApi';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { getEventEpochMs, NOW_WINDOW_MS } from '../utils/eventTimeEngine';

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

export function useClockEventMarkers({ events = [], timezone, eventFilters, nowEpochMs, isFavorite, hasNotes }) {
  const getTimeParts = useTimeParts(timezone);

  const baseMarkers = useMemo(() => {
    if (!timezone) return [];

    const grouped = new Map();

    // Enterprise: 30-minute buckets centered at :00 and :30; each bucket covers -14 to +15 minutes
    // Examples: 07:46-08:15 → 08:00 marker, 08:16-08:45 → 08:30 marker.
    const bucketFor = (hour, minute) => {
      const totalMinutes = hour * 60 + minute;
      const bucketIndex = Math.floor((totalMinutes + 14) / 30);
      const bucketCenter = bucketIndex * 30;
      return {
        bucketHour: Math.floor(bucketCenter / 60),
        bucketMinute: bucketCenter % 60,
      };
    };

    events.forEach((evt) => {
      const date = evt.date || evt.dateTime || evt.Date;
      const parts = getTimeParts(date);
      const eventEpochMs = getEventEpochMs(evt);
      if (!parts || eventEpochMs === null) return;

      const { hour, minute } = parts;
      const { bucketHour, bucketMinute } = bucketFor(hour, minute);

      const impactMeta = getImpactMeta(evt.impact || evt.strength || evt.Strength);
      const key = `${bucketHour}-${bucketMinute}`;

      const list = grouped.get(key) || [];
      list.push({
        evt,
        hour: bucketHour,
        minute: bucketMinute,
        eventEpochMs,
        impactMeta,
        currency: evt.currency || evt.Currency,
        countryCode: evt.currency || evt.Currency ? getCurrencyFlag(evt.currency || evt.Currency) : null,
        isFavoriteEvent: isFavorite ? isFavorite(evt) : false,
        hasNoteEvent: hasNotes ? hasNotes(evt) : false,
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
          events: list,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));

    if (eventFilters?.favoritesOnly) {
      return markers.filter((marker) => marker.events.some((item) => item.isFavoriteEvent));
    }

    return markers;
  }, [events, timezone, eventFilters?.favoritesOnly, getTimeParts, isFavorite, hasNotes]);

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
  }, [baseMarkers, nowEpochMs]);

  const markers = useMemo(() => {
    return baseMarkers.map((marker) => {
      const hasNowInGroup = marker.events.some((item) => {
        const diff = item.eventEpochMs - nowEpochMs;
        return diff <= 0 && Math.abs(diff) < NOW_WINDOW_MS;
      });

      const hasNextInGroup = !hasNowInGroup && earliestFuture !== null && marker.events.some((item) => item.eventEpochMs === earliestFuture);

      const scoredEvents = marker.events.map((item) => {
        const diff = item.eventEpochMs - nowEpochMs;
        const isNow = diff <= 0 && Math.abs(diff) < NOW_WINDOW_MS;
        const isPassed = item.eventEpochMs < nowEpochMs && !isNow;
        const isNext = !isNow && earliestFuture !== null && item.eventEpochMs === earliestFuture;
        const impactPriority = item.impactMeta.priority || 0;

        const score = [
          Number(!isPassed),
          Number(item.isFavoriteEvent),
          Number(item.hasNoteEvent),
          Number(isNow),
          Number(isNext),
          impactPriority,
          Number(!isPassed && item.eventEpochMs >= nowEpochMs),
        ];

        return { ...item, isNow, isPassed, isNext, score };
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

      const isAllPast = scoredEvents.every((item) => item.isPassed && !item.isNow);

      const upcomingOrNow = scoredEvents.filter((item) => !item.isPassed || item.isNow);
      const isFavoriteMarkerAny = scoredEvents.some((item) => item.isFavoriteEvent);
      const hasNoteMarkerAny = scoredEvents.some((item) => item.hasNoteEvent);
      const isFavoriteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((item) => item.isFavoriteEvent);
      const hasNoteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((item) => item.hasNoteEvent);

      return {
        ...marker,
        isNow: hasNowInGroup,
        isNext: hasNextInGroup,
        isTodayPast: isAllPast,
        meta: representative.impactMeta,
        currency: representative.currency,
        countryCode: representative.countryCode,
        isFavoriteMarker,
        hasNoteMarker,
        isFavoriteMarkerAny,
        hasNoteMarkerAny,
      };
    });
  }, [baseMarkers, earliestFuture, nowEpochMs]);

  const hasNowEvent = useMemo(() => markers.some((marker) => marker.isNow), [markers]);

  return { markers, hasNowEvent, earliestFuture };
}

export default useClockEventMarkers;