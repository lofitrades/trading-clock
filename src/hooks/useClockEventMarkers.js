/**
 * src/hooks/useClockEventMarkers.js
 *
 * Purpose: Build clock marker view-models from economic events with minimal
 * per-tick work. Separates heavy grouping/bucketing (on data changes) from
 * lightweight temporal status (per second) so the overlay UI stays fast.
 *
 * Changelog:
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

export function useClockEventMarkers({ events = [], timezone, eventFilters, nowEpochMs, isFavorite, hasNotes }) {
  const getTimeParts = useTimeParts(timezone);

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
        meta: customMeta,
        impactMeta: representative.impactMeta,
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