/**
 * src/components/ClockEventsOverlay.jsx
 *
 * Purpose: Overlay markers for today's economic events on the analog clock.
 * Renders impact-based icons on AM (inner) and PM (outer) rings using current filters and news source.
 *
 * Changelog:
 * v1.3.5 - 2025-12-09 - Expose loading state so the clock loader stays visible until markers render.
 * v1.3.4 - 2025-12-09 - Past-today markers use solid gray tones (no transparency) for clearer state.
 * v1.3.3 - 2025-12-09 - Disabled text selection, added pointer cursor, and grayed-out markers for past-today events.
 * v1.3.2 - 2025-12-09 - NOW markers use smooth size animation (no border change) for clearer attention cue; NEXT markers pulse border while keeping impact color fill.
 * v1.3.1 - 2025-12-09 - NOW markers now use NOW color for the entire icon background.
 * v1.3.0 - 2025-12-09 - Added currency flag badge to event markers.
 * v1.2.1 - 2025-12-09 - Added currency flag to event tooltips.
 * v1.2.0 - 2025-12-09 - Updated NOW window to 10 minutes, clarified NEXT vs NOW colors, added pulsing border animation for NOW markers.
 * v1.1.1 - 2025-12-09 - Restored centered marker radii for AM/PM rings.
 * v1.1.0 - 2025-12-09 - Added NOW/NEXT borders, accessible tooltip styling, and click-to-open timeline scroll.
 * v1.0.0 - 2025-12-09 - Initial implementation of timezone-aware event markers with grouped tooltips.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Tooltip, Typography, Stack, alpha } from '@mui/material';
import { getEventsByDateRange } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { formatTime } from '../utils/dateUtils';
import { getCurrencyFlag } from './EventsTimeline2';

const IMPACT_ORDER = [
  { test: (v) => v.includes('strong') || v.includes('high'), icon: '!!!', color: '#d32f2f', priority: 4, label: 'High' },
  { test: (v) => v.includes('moderate') || v.includes('medium'), icon: '!!', color: '#f57c00', priority: 3, label: 'Medium' },
  { test: (v) => v.includes('weak') || v.includes('low'), icon: '!', color: '#018786', priority: 2, label: 'Low' },
  { test: (v) => v.includes('non-economic') || v === 'none', icon: '~', color: '#9e9e9e', priority: 1, label: 'Non-Economic' },
  { test: () => true, icon: '?', color: '#666666', priority: 0, label: 'Unknown' },
];

const getImpactMeta = (impact) => {
  const normalized = (impact || '').toString().toLowerCase();
  return IMPACT_ORDER.find(({ test }) => test(normalized)) || IMPACT_ORDER[IMPACT_ORDER.length - 1];
};

const getTodayRangeInTimezone = (timezone) => {
  const now = new Date();
  const start = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const useTimeParts = (timezone) => {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }),
    [timezone]
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

export default function ClockEventsOverlay({ size, timezone, eventFilters, newsSource, onEventClick, onLoadingStateChange }) {
  const [events, setEvents] = useState([]);
  const [nowTick, setNowTick] = useState(Date.now());

  const getTimeParts = useTimeParts(timezone);

  // Fetch today's events when inputs change
  useEffect(() => {
    let cancelled = false;
    onLoadingStateChange?.(true);

    const load = async () => {
      try {
        const { start, end } = getTodayRangeInTimezone(timezone);
        const result = await getEventsByDateRange(start, end, {
          source: newsSource,
          impacts: eventFilters?.impacts || [],
          eventTypes: eventFilters?.eventTypes || [],
          currencies: eventFilters?.currencies || [],
        });

        if (cancelled) return;
        if (result.success) {
          const withDates = (result.data || []).filter((evt) => evt.date || evt.dateTime || evt.Date);
          setEvents(sortEventsByTime(withDates));
        } else {
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          onLoadingStateChange?.(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [timezone, newsSource, eventFilters?.impacts, eventFilters?.eventTypes, eventFilters?.currencies, onLoadingStateChange]);

  const nowInTz = useMemo(
    () => new Date(new Date(nowTick).toLocaleString('en-US', { timeZone: timezone })),
    [timezone, nowTick]
  );

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const earliestFuture = useMemo(() => {
    let min = null;
    events.forEach((evt) => {
      const raw = evt.date || evt.dateTime || evt.Date;
      if (!raw) return;
      const eventLocal = new Date(new Date(raw).toLocaleString('en-US', { timeZone: timezone }));
      const eventMs = eventLocal.getTime();
      const nowMs = nowInTz.getTime();
      if (eventMs > nowMs) {
        if (min === null || eventMs < min) {
          min = eventMs;
        }
      }
    });
    return min;
  }, [events, nowInTz, timezone]);

  const markers = useMemo(() => {
    const grouped = new Map();

    events.forEach((evt) => {
      const date = evt.date || evt.dateTime || evt.Date;
      const parts = getTimeParts(date);
      if (!parts) return;
      const { hour, minute } = parts;
      const key = `${hour}-${minute}`;
      const list = grouped.get(key) || [];
      list.push(evt);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries()).map(([key, list]) => {
      const top = list.reduce((best, current) => {
        const currentMeta = getImpactMeta(current.impact || current.strength || current.Strength);
        const bestMeta = getImpactMeta(best.impact || best.strength || best.Strength);
        return currentMeta.priority > bestMeta.priority ? current : best;
      }, list[0]);

      const [hourStr, minuteStr] = key.split('-');
      const hour = Number(hourStr);
      const minute = Number(minuteStr);
      const meta = getImpactMeta(top.impact || top.strength || top.Strength);
      const currency = top.currency || top.Currency;
      const countryCode = currency ? getCurrencyFlag(currency) : null;

      // State detection for borders (NOW/NEXT) in selected timezone
      const eventDateObj = new Date(top.date || top.dateTime || top.Date);
      const eventLocal = new Date(eventDateObj.toLocaleString('en-US', { timeZone: timezone }));
      const eventTimeMs = eventLocal.getTime();
      const nowMs = nowInTz.getTime();
      const diff = eventTimeMs - nowMs;
      const isNow = diff <= 0 && Math.abs(diff) < 9 * 60 * 1000; // 9-minute NOW window
      const isNext = !isNow && earliestFuture !== null && eventTimeMs === earliestFuture;

      const nowLocal = new Date(nowInTz.toLocaleString('en-US', { timeZone: timezone }));
      const eventDaySerial = eventLocal.getFullYear() * 10000 + (eventLocal.getMonth() + 1) * 100 + eventLocal.getDate();
      const nowDaySerial = nowLocal.getFullYear() * 10000 + (nowLocal.getMonth() + 1) * 100 + nowLocal.getDate();
      const isFutureDay = eventDaySerial > nowDaySerial;

      const isTodayPast =
        !isNow &&
        !isFutureDay &&
        eventTimeMs < nowMs;

      return { hour, minute, events: list, meta, isNow, isNext, currency, countryCode, isTodayPast };
    });
  }, [events, getTimeParts, earliestFuture, nowInTz]);

  if (!size || size <= 0) return null;

  const center = size / 2;
  const radius = size / 2 - 5;
  // Align with session rings (AM inner, PM outer)
  const amRadius = radius * 0.52;
  const pmRadius = radius * 0.75;

  const getPosition = (hour, minute, useAm) => {
    const angle = ((hour % 12) + minute / 60) * (Math.PI * 2) / 12 - Math.PI / 2;
    const r = useAm ? amRadius : pmRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  return (
    <Box
      className="clock-events-overlay"
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: size, height: size, zIndex: 2 }}
    >
      {markers.map((marker) => {
        const isAm = marker.hour < 12;
        const { x, y } = getPosition(marker.hour, marker.minute, isAm);
        const markerStyle = {
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
          transformOrigin: 'center',
          backgroundColor: marker.isNow
            ? '#0288d1'
            : marker.isTodayPast
              ? '#bdbdbd'
              : marker.meta.color,
          color: marker.isTodayPast ? '#424242' : '#fff',
          border: `2px solid ${marker.isNext ? '#2e7d32' : marker.isTodayPast ? '#9e9e9e' : alpha('#000', 0.14)}`,
          boxShadow: marker.isTodayPast ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
          animation: marker.isNow
            ? 'nowScale 1.25s ease-in-out infinite'
            : marker.isNext
              ? 'nextBorderPulse 1.3s ease-in-out infinite'
              : 'none',
          cursor: 'pointer',
          userSelect: 'none',
          '@keyframes nowScale': {
            '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
            '50%': { transform: 'translate(-50%, -50%) scale(1.16)' },
          },
          '@keyframes nextBorderPulse': {
            '0%, 100%': { boxShadow: '0 4px 12px rgba(0,0,0,0.2)', borderColor: '#2e7d32' },
            '50%': { boxShadow: '0 6px 16px rgba(0,0,0,0.28)', borderColor: alpha('#2e7d32', 0.85) },
          },
        };

        const tooltipContent = (
          <Stack spacing={0.5} sx={{ minWidth: 240 }}>
            {marker.events.map((evt) => {
              const timeLabel = formatTime(evt.date || evt.dateTime || evt.Date, timezone);
              const impactMeta = getImpactMeta(evt.impact || evt.strength || evt.Strength);
              const currency = evt.currency || evt.Currency;
              const countryCode = currency ? getCurrencyFlag(currency) : null;
              return (
                <Box key={`${evt.id}-${evt.name || evt.Name}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {impactMeta.icon}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {evt.name || evt.Name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{timeLabel}</span>
                      {currency && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {countryCode ? (
                            <span
                              className={`fi fi-${countryCode}`}
                              style={{ display: 'inline-block', width: 16, height: 12, borderRadius: 2, boxShadow: '0 0 0 1px rgba(255,255,255,0.18)' }}
                              title={currency}
                            />
                          ) : null}
                          <span>{currency}</span>
                        </span>
                      )}
                      {evt.category || evt.Category ? <span>· {evt.category || evt.Category}</span> : null}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Impact: {impactMeta.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        );

        return (
          <Tooltip 
            key={`${marker.hour}-${marker.minute}`} 
            title={tooltipContent} 
            placement="top" 
            arrow 
            enterDelay={100}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#111',
                  color: '#fff',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.32)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  maxWidth: 320,
                  p: 1.25,
                  '& .MuiTypography-root': { color: '#fff' },
                },
              },
              arrow: {
                sx: { color: '#111' },
              },
            }}
          >
            <Box
              className="clock-event-marker"
              sx={markerStyle}
              style={{ pointerEvents: 'auto' }}
              onClick={() => onEventClick && onEventClick(marker.events[0])}
            >
              <Typography component="span" variant="caption" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>
                {marker.meta.icon}
              </Typography>
              {marker.countryCode && !marker.isTodayPast ? (
                <span className="clock-event-flag" title={marker.currency}>
                  <span className={`fi fi-${marker.countryCode}`} />
                </span>
              ) : null}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}