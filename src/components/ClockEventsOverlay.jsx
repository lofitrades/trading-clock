/**
 * src/components/ClockEventsOverlay.jsx
 *
 * Purpose: Overlay markers for today's economic events on the analog clock.
 * Renders impact-based icons on AM (inner) and PM (outer) rings using current filters and news source.
 *
 * Changelog:
 * v1.10.0 - 2025-12-16 - Added PropTypes validation and removed unused imports for lint compliance.
 * v1.9.9 - 2025-12-16 - UX: Tooltip event list day header uses primary color background for Today.
 * v1.9.8 - 2025-12-16 - UX: When a marker tooltip spans multiple days, prioritize NOW/NEXT/upcoming events for marker impact and only gray out the marker if all events in that marker group have passed.
 * v1.9.7 - 2025-12-16 - UX: Ensure active marker (tooltip open) renders above all others (zIndex 65) and refine MUI tooltip arrow styling for clearer visual linkage.
 * v1.9.6 - 2025-12-16 - UX: Prevent overlapping tooltips by using a single controlled open state (only one marker tooltip open at a time) and closing the previous tooltip immediately when a new marker is hovered.
 * v1.9.5 - 2025-12-16 - UX: Prevent tooltip flicker on 1s clock ticks (memoized overlay), removed touch auto-hide timer, and added hover leave delay to make scrolling/hovering the tooltip reliable.
 * v1.9.4 - 2025-12-16 - CRITICAL FIX: Stabilized mobile tooltip positioning with enterprise Popper modifiers (tether:false, adaptive:false, fixed width, proper padding). Eliminated jumping/repositioning issues.
 * v1.9.3 - 2025-12-15 - ENHANCEMENT: Added "(Today)" label next to current day in tooltip event overlay.
 * v1.9.2 - 2025-12-15 - Added favorites/notes icons in tooltip; NEXT state correctly based on all applied filters.
 * v1.9.1 - 2025-12-15 - Added responsive max height and scrollability to tooltip for mobile-first UX.
 * v1.9.0 - 2025-12-15 - Added day dividers in tooltip when showing events from multiple days (this week).
 * v1.8.0 - 2025-12-15 - Support eventFilters date range (Yesterday/Tomorrow/etc.) instead of hardcoded today.
 * v1.7.0 - 2025-12-15 - CRITICAL FIX: Refactored to use shared eventTimeEngine for absolute-epoch-based NOW/NEXT detection and countdown. Eliminates timezone-shifted Date object bugs.
 * v1.6.3 - 2025-12-15 - Tooltip event rows are clickable/tappable: opens events drawer and auto-scrolls to the exact event clicked.
 * v1.6.2 - 2025-12-12 - Touch-first tooltip flow: first tap shows tooltip; second tap opens drawer and auto-scrolls.
 * v1.6.1 - 2025-12-11 - Tooltip rows combine time, flag/currency, and countdown; removed impact label row.
 * v1.6.0 - 2025-12-11 - Tooltips show time-to-event countdown for each listed event.
 * v1.5.1 - 2025-12-13 - NEXT markers keep impact border and use smooth scale animation when no NOW event.
 * v1.5.0 - 2025-12-12 - Added notes badge on markers and synced note detection with new notes hook.
 * v1.4.0 - 2025-12-12 - Honor favorites-only filter for clock event markers.
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tooltip, Typography, Stack, alpha, Divider, Chip } from '@mui/material';
import { getEventsByDateRange } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { formatTime } from '../utils/dateUtils';
import { getCurrencyFlag } from './EventsTimeline2';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useEventNotes } from '../hooks/useEventNotes';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import {
  NOW_WINDOW_MS,
  getEventEpochMs,
  formatRelativeLabel,
} from '../utils/eventTimeEngine';

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

/**
 * Get today's date range in specified timezone
 * Uses Intl.DateTimeFormat for accurate timezone conversion
 * @param {string} timezone - IANA timezone
 * @returns {{ start: Date, end: Date }} - Start and end of today in timezone
 */
const getTodayRangeInTimezone = (timezone) => {
  const now = new Date();
  
  // Use Intl to get today's date parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  
  // Create Date objects for start and end of day (in UTC, adjusted for timezone offset)
  // These will be used for Firestore queries
  const dateStr = `${year}-${month}-${day}`;
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  
  return { start, end };
};

/**
 * Format time-to-event countdown for tooltip display
 * REFACTORED v1.7.0: Uses eventTimeEngine for consistent countdown logic
 * @param {Date|string|number} dateLike - Event date/time
 * @param {string} _timezone - IANA timezone (unused - kept for API compatibility)
 * @param {number} nowEpochMs - Current time in epoch ms
 * @returns {string} - Formatted countdown label
 */
const formatTimeToEvent = (dateLike, _timezone, nowEpochMs) => {
  if (!dateLike || nowEpochMs === null || nowEpochMs === undefined) return '';
  
  const eventEpochMs = getEventEpochMs({ date: dateLike });
  if (eventEpochMs === null) return '';
  
  return formatRelativeLabel({ eventEpochMs, nowEpochMs, nowWindowMs: NOW_WINDOW_MS });
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

function ClockEventsOverlay({ size, timezone, eventFilters, newsSource, onEventClick, onLoadingStateChange }) {
  const [events, setEvents] = useState([]);
  const [nowTick, setNowTick] = useState(Date.now());
  const [openMarkerKey, setOpenMarkerKey] = useState(null);
  const closeTimerRef = useRef(null);
  const lastAutoScrollKeyRef = useRef(null);
  const { isFavorite } = useFavorites();
  const { hasNotes } = useEventNotes();

  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    // Short grace period allows moving from marker -> tooltip without accidental close
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMarkerKey(null);
      closeTimerRef.current = null;
    }, 150);
  }, [clearCloseTimer]);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    setOpenMarkerKey(null);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  // Touch UX: keep tooltip open for scrolling, but allow clean dismissal
  useEffect(() => {
    if (!isTouchDevice || !openMarkerKey) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeTooltip();
      }
    };

    const handlePointerDown = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const inMarker = target.closest(`[data-t2t-event-marker-key="${openMarkerKey}"]`);
      const inTooltip = target.closest(`[data-t2t-event-tooltip-key="${openMarkerKey}"]`);
      if (inMarker || inTooltip) return;

      closeTooltip();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
    };
  }, [closeTooltip, isTouchDevice, openMarkerKey]);

  // Auto-scroll the tooltip on open so passed events above are hidden.
  useEffect(() => {
    if (!openMarkerKey) {
      lastAutoScrollKeyRef.current = null;
      return;
    }
    if (lastAutoScrollKeyRef.current === openMarkerKey) return;
    lastAutoScrollKeyRef.current = openMarkerKey;

    const markerKey = openMarkerKey;

    const findTooltipEl = () => {
      const candidates = Array.from(document.querySelectorAll(`[data-t2t-event-tooltip-key="${markerKey}"]`));
      return (
        candidates.find((el) => el.getAttribute('role') === 'tooltip') ||
        candidates.find((el) => el.classList && el.classList.contains('MuiTooltip-tooltip')) ||
        null
      );
    };

    const scroll = () => {
      const tooltipEl = findTooltipEl();
      if (!tooltipEl) return;

      const rows = Array.from(tooltipEl.querySelectorAll('[data-t2t-event-row-state]'));
      if (rows.length === 0) return;

      const firstNonPastIndex = rows.findIndex((el) => {
        const state = el.getAttribute('data-t2t-event-row-state');
        return state === 'now' || state === 'next' || state === 'upcoming';
      });
      if (firstNonPastIndex === -1) return;

      // Keep the last passed event visible as a cue there are events above.
      const scrollTarget = rows[Math.max(0, firstNonPastIndex - 2)];
      scrollTarget?.scrollIntoView({ block: 'start', inline: 'nearest' });
    };

    // Wait for Popper/Tooltip DOM to mount before attempting to scroll.
    requestAnimationFrame(() => requestAnimationFrame(scroll));
  }, [openMarkerKey]);

  const handleMarkerSelect = useCallback((marker, markerKey) => {
    if (!marker) return;
    const key = markerKey || `${marker.hour}-${marker.minute}`;
    if (!isTouchDevice) {
      // When clicking marker icon, highlight all events from that marker
      onEventClick?.(marker.events || []);
      return;
    }

    if (openMarkerKey !== key) {
      // Touch-first UX: first tap opens tooltip (kept open for scrolling)
      setOpenMarkerKey(key);
      return;
    }

    // When clicking marker icon on touch device, highlight all events
    onEventClick?.(marker.events || []);
    closeTooltip();
  }, [closeTooltip, isTouchDevice, onEventClick, openMarkerKey]);

  const handleTooltipEventSelect = useCallback((evt) => {
    // Tooltip row click should target only the selected event (not the entire marker group).
    onEventClick?.(evt, { source: 'canvas-tooltip' });
    if (isTouchDevice) {
      closeTooltip();
    }
  }, [closeTooltip, isTouchDevice, onEventClick]);

  const getTimeParts = useTimeParts(timezone);

  // Fetch events based on eventFilters date range (defaults to today if not specified)
  useEffect(() => {
    let cancelled = false;
    onLoadingStateChange?.(true);

    const load = async () => {
      try {
        // Use eventFilters date range if provided, otherwise default to today
        let start, end;
        if (eventFilters?.startDate && eventFilters?.endDate) {
          start = new Date(eventFilters.startDate);
          end = new Date(eventFilters.endDate);
        } else {
          const todayRange = getTodayRangeInTimezone(timezone);
          start = todayRange.start;
          end = todayRange.end;
        }

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
  }, [timezone, newsSource, eventFilters?.impacts, eventFilters?.eventTypes, eventFilters?.currencies, eventFilters?.startDate, eventFilters?.endDate, onLoadingStateChange]);

  // CRITICAL: Use absolute epoch milliseconds - timezone only affects display
  const nowEpochMs = nowTick;

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const filteredEvents = useMemo(() => {
    if (eventFilters?.favoritesOnly) {
      return events.filter((evt) => isFavorite(evt));
    }
    return events;
  }, [eventFilters?.favoritesOnly, events, isFavorite]);

  const earliestFuture = useMemo(() => {
    let min = null;
    filteredEvents.forEach((evt) => {
      const eventEpochMs = getEventEpochMs(evt);
      if (eventEpochMs === null) return;
      
      if (eventEpochMs > nowEpochMs) {
        if (min === null || eventEpochMs < min) {
          min = eventEpochMs;
        }
      }
    });
    return min;
  }, [filteredEvents, nowEpochMs]);

  // Check if any NOW event exists to disable NEXT animation
  const hasNowEvent = useMemo(() => {
    return filteredEvents.some((evt) => {
      const eventEpochMs = getEventEpochMs(evt);
      if (eventEpochMs === null) return false;
      const diff = eventEpochMs - nowEpochMs;
      return diff <= 0 && Math.abs(diff) < NOW_WINDOW_MS;
    });
  }, [filteredEvents, nowEpochMs]);

  const markers = useMemo(() => {
    const grouped = new Map();

    filteredEvents.forEach((evt) => {
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
      const [hourStr, minuteStr] = key.split('-');
      const hour = Number(hourStr);
      const minute = Number(minuteStr);

      const enriched = list
        .map((evt) => {
          const eventEpochMs = getEventEpochMs(evt);
          if (eventEpochMs === null) return null;
          const diff = eventEpochMs - nowEpochMs;
          const isNow = diff <= 0 && Math.abs(diff) < NOW_WINDOW_MS;
          const isPassed = eventEpochMs < nowEpochMs && !isNow;
          const impactMeta = getImpactMeta(evt.impact || evt.strength || evt.Strength);
          return { evt, eventEpochMs, isNow, isPassed, impactMeta };
        })
        .filter(Boolean);

      if (enriched.length === 0) return null;

      const upcomingOrNow = enriched.filter((e) => !e.isPassed);
      const isFavoriteMarkerAny = list.some((evt) => isFavorite(evt));
      const hasNoteMarkerAny = list.some((evt) => hasNotes(evt));
      const isFavoriteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((e) => isFavorite(e.evt));
      const hasNoteMarker = upcomingOrNow.length > 0 && upcomingOrNow.some((e) => hasNotes(e.evt));

      // Marker state rules (enterprise UX):
      // - NOW if ANY event in this marker group is NOW
      // - NEXT if ANY event in this marker group is the global earliestFuture (and no NOW exists)
      // - Gray-out ONLY if ALL events in the marker group have passed
      const hasNowInGroup = enriched.some((e) => e.isNow);
      const hasNextInGroup = !hasNowInGroup && earliestFuture !== null && enriched.some((e) => e.eventEpochMs === earliestFuture);
      const isAllPast = enriched.every((e) => e.isPassed);

      // Choose the representative event for marker icon/impact:
      // NOW -> NEXT -> highest-impact among upcoming (not passed) -> fallback to highest-impact overall.
      let metaCandidates = enriched;
      if (hasNowInGroup) {
        metaCandidates = enriched.filter((e) => e.isNow);
      } else if (hasNextInGroup) {
        metaCandidates = enriched.filter((e) => e.eventEpochMs === earliestFuture);
      } else {
        const upcoming = enriched.filter((e) => !e.isPassed);
        if (upcoming.length > 0) metaCandidates = upcoming;
      }

      const representative = metaCandidates.reduce((best, current) => {
        return current.impactMeta.priority > best.impactMeta.priority ? current : best;
      }, metaCandidates[0]);

      const meta = representative.impactMeta;
      const currency = representative.evt.currency || representative.evt.Currency;
      const countryCode = currency ? getCurrencyFlag(currency) : null;

      return {
        hour,
        minute,
        events: list,
        meta,
        isNow: hasNowInGroup,
        isNext: hasNextInGroup,
        currency,
        countryCode,
        isTodayPast: isAllPast,
        // Active badges (only if there's at least one upcoming/NOW event that has the badge)
        isFavoriteMarker,
        hasNoteMarker,
        // Any badges (includes past events; used for rendering a gray badge, but NOT for z-index)
        isFavoriteMarkerAny,
        hasNoteMarkerAny,
      };
    }).filter(Boolean); // Remove null entries
  }, [filteredEvents, getTimeParts, earliestFuture, nowEpochMs, hasNotes, isFavorite]);

  const center = size / 2;
  const radius = size / 2 - 5;
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
        const markerKey = `${marker.hour}-${marker.minute}`;
        const isMarkerOpen = openMarkerKey === markerKey;
        const { x, y } = getPosition(marker.hour, marker.minute, isAm);
        
        // Calculate z-index priority: OPEN > Favorite(active) > NOW > NEXT > Note(active) > High Impact > Medium > Low > Rest
        // Enterprise UX: keep the active marker above all others so it never gets visually occluded.
        let zIndex = 10; // Base z-index
        if (isMarkerOpen) {
          zIndex = 65;
        } else if (!marker.isTodayPast && marker.isFavoriteMarker) {
          zIndex = 60;
        } else if (marker.isNow) {
          zIndex = 50;
        } else if (marker.isNext) {
          zIndex = 40;
        } else if (!marker.isTodayPast && marker.hasNoteMarker) {
          zIndex = 35;
        } else {
          // Impact-based priority
          const impactPriority = marker.meta.priority || 0;
          if (impactPriority >= 3) {
            zIndex = 30;
          } else if (impactPriority === 2) {
            zIndex = 20;
          } else if (impactPriority === 1) {
            zIndex = 15;
          }
        }
        
        const markerStyle = {
          position: 'absolute',
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
          border: `2px solid ${marker.isTodayPast ? '#9e9e9e' : alpha('#000', 0.14)}`,
          boxShadow: marker.isTodayPast ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
          // IMPORTANT: Keep the tooltip anchor stable while open.
          // If the marker is animating (NOW/NEXT scale), Popper will keep re-positioning, causing a visible "tick".
          animation: isMarkerOpen
            ? 'none'
            : marker.isNow
              ? 'nowScale 1.25s ease-in-out infinite'
              : (marker.isNext && !hasNowEvent)
                ? 'nextScale 1.25s ease-in-out infinite'
                : 'none',
          cursor: 'pointer',
          userSelect: 'none',
          zIndex,
          '@keyframes nowScale': {
            '0%, 100%': { 
              transform: 'translate(-50%, -50%) scale(1)',
            },
            '50%': { 
              transform: 'translate(-50%, -50%) scale(1.25)',
            },
          },
          '@keyframes nextScale': {
            '0%, 100%': { 
              transform: 'translate(-50%, -50%) scale(1)',
            },
            '50%': { 
              transform: 'translate(-50%, -50%) scale(1.15)',
            },
          },
        };

        // Group events by day for dividers
        const eventsByDay = marker.events.reduce((acc, evt) => {
          const eventDate = new Date(evt.date || evt.dateTime || evt.Date);
          const dayKey = eventDate.toLocaleDateString('en-US', { 
            timeZone: timezone,
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          if (!acc[dayKey]) acc[dayKey] = [];
          acc[dayKey].push(evt);
          return acc;
        }, {});

        const dayKeys = Object.keys(eventsByDay);
        const hasMultipleDays = dayKeys.length > 1;

        // Passed-state colors: slightly muted but still AA-readable on #111 background.
        const passedPrimaryColor = 'rgba(255,255,255,0.74)';
        const passedSecondaryColor = 'rgba(255,255,255,0.64)';
        const activeDayHeaderColor = 'rgba(255,255,255,0.82)';
        const passedDayHeaderColor = 'rgba(255,255,255,0.72)';
        
        // Determine "Today" for comparison
        const todayKey = new Date().toLocaleDateString('en-US', {
          timeZone: timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        const tooltipContent = (
          <Stack spacing={0.5} sx={{ minWidth: 240 }}>
            {dayKeys.map((dayKey, dayIndex) => (
              <React.Fragment key={dayKey}>
                {(() => {
                  const dayHasUpcoming = (eventsByDay[dayKey] || []).some((evt) => {
                    const epochMs = getEventEpochMs(evt);
                    if (epochMs === null) return false;
                    const isNowEvent = nowEpochMs >= epochMs && nowEpochMs < epochMs + NOW_WINDOW_MS;
                    return epochMs >= nowEpochMs || isNowEvent;
                  });
                  const dayHeaderColor = dayHasUpcoming ? activeDayHeaderColor : passedDayHeaderColor;

                  const isTodayHeader = dayKey === todayKey;

                  return (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: isTodayHeader ? 'primary.contrastText' : dayHeaderColor,
                        bgcolor: isTodayHeader ? 'primary.main' : 'transparent',
                        pl: isTodayHeader ? 1 : 0.5,
                        pr: isTodayHeader ? 2 : 1.75,
                        py: isTodayHeader ? 0.5 : 0,
                        mt: dayIndex > 0 ? 0.5 : 0,
                        fontSize: '0.7rem',
                        letterSpacing: 0.5,
                        lineHeight: 1.2,
                        display: 'block',
                        // Reserve space so right rounded corners don't sit under the scrollbar.
                        width: '100%', // 'calc(100% - 10px)',
                        //mr: '10px',
                        boxSizing: 'border-box',
                        borderRadius: isTodayHeader ? 1 : 0,
                      }}
                    >
                      {isTodayHeader ? 'Today - ' : ''}{dayKey}
                    </Typography>
                  );
                })()}
                {eventsByDay[dayKey].map((evt) => {
                  const timeLabel = formatTime(evt.date || evt.dateTime || evt.Date, timezone);
                  const impactMeta = getImpactMeta(evt.impact || evt.strength || evt.Strength);
                  const currency = evt.currency || evt.Currency;
                  const countryCode = currency ? getCurrencyFlag(currency) : null;
                  const timeToEvent = formatTimeToEvent(evt.date || evt.dateTime || evt.Date, timezone, nowEpochMs);
                  const isEventFavorite = isFavorite(evt);
                  const hasEventNotes = hasNotes(evt);
                  
                  // Check if this event is NOW or NEXT or PASSED
                  const eventEpochMs = getEventEpochMs(evt);
                  const hasValidEpoch = eventEpochMs !== null;
                  const isEventNow = hasValidEpoch && nowEpochMs >= eventEpochMs && nowEpochMs < eventEpochMs + NOW_WINDOW_MS;
                  const isEventNext = hasValidEpoch && !isEventNow && earliestFuture !== null && eventEpochMs === earliestFuture;
                  const isEventPassed = hasValidEpoch && eventEpochMs < nowEpochMs && !isEventNow;
                  
                  return (
                    <Box
                      key={`${evt.id}-${evt.name || evt.Name}`}
                      data-t2t-event-row-state={isEventPassed ? 'past' : isEventNow ? 'now' : isEventNext ? 'next' : 'upcoming'}
                      data-t2t-event-row-id={evt.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTooltipEventSelect(evt);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTooltipEventSelect(evt);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.25,
                        '&:hover': isTouchDevice ? undefined : { bgcolor: alpha('#fff', 0.08) },
                        '&:focus-visible': {
                          outline: '2px solid rgba(255,255,255,0.35)',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Chip
                        component="span"
                        label={impactMeta.icon}
                        size="small"
                        aria-label={`${impactMeta.label} impact`}
                        sx={{
                          minWidth: 40,
                          height: 20,
                          mt: '2px',
                          flex: '0 0 auto',
                          bgcolor: isEventPassed ? '#616161' : impactMeta.color,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          '& .MuiChip-label': {
                            px: 0.75,
                            py: 0,
                          },
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: isEventPassed ? passedPrimaryColor : '#fff',
                          }}
                        >
                          {evt.name || evt.Name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            flexWrap: 'wrap',
                            color: isEventPassed ? passedSecondaryColor : 'rgba(255,255,255,0.82)',
                          }}
                        >
                          <span>{timeLabel}</span>
                          {currency && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {countryCode ? (
                                <span
                                  className={`fi fi-${countryCode}`}
                                  style={{
                                    display: 'inline-block',
                                    width: 16,
                                    height: 12,
                                    borderRadius: 2,
                                    boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
                                    opacity: isEventPassed ? 0.75 : 1,
                                    filter: isEventPassed ? 'grayscale(1)' : 'none',
                                  }}
                                  title={currency}
                                />
                              ) : null}
                              <span>{currency}</span>
                            </span>
                          )}
                          {timeToEvent && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              · {timeToEvent}
                              {isEventNow && (
                                <Box
                                  component="span"
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 0.5,
                                    py: 0.125,
                                    bgcolor: '#0288d1',
                                    color: '#fff',
                                    borderRadius: 0.5,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    ml: 0.5,
                                  }}
                                >
                                  NOW
                                </Box>
                              )}
                              {isEventNext && (
                                <Box
                                  component="span"
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 0.5,
                                    py: 0.125,
                                    bgcolor: '#018786',
                                    color: '#fff',
                                    borderRadius: 0.5,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    ml: 0.5,
                                  }}
                                >
                                  NEXT
                                </Box>
                              )}
                              {isEventFavorite && (
                                <FavoriteIcon sx={{ fontSize: 12, color: isEventPassed ? passedSecondaryColor : '#f50057', ml: 0.25 }} />
                              )}
                              {hasEventNotes && (
                                <NoteAltIcon sx={{ fontSize: 12, color: isEventPassed ? passedSecondaryColor : '#fff', ml: 0.25 }} />
                              )}
                            </span>
                          )}
                          {evt.category || evt.Category ? <span>· {evt.category || evt.Category}</span> : null}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                {hasMultipleDays && dayIndex < dayKeys.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </Stack>
        );

        const touchTooltipProps = isTouchDevice
          ? {
              open: openMarkerKey === markerKey,
              disableHoverListener: true,
              disableFocusListener: true,
              disableTouchListener: true,
              onClose: closeTooltip,
              enterTouchDelay: 0,
              leaveTouchDelay: 0,
            }
          : {};

        const desktopTooltipProps = !isTouchDevice
          ? {
              open: openMarkerKey === markerKey,
              disableHoverListener: true,
              disableFocusListener: true,
              disableTouchListener: true,
              onClose: closeTooltip,
            }
          : {};

        return (
          <Tooltip 
            key={markerKey} 
            title={tooltipContent} 
            placement="top" 
            arrow 
            disableInteractive={false}
            {...touchTooltipProps}
            {...desktopTooltipProps}
            slotProps={{
              popper: {
                'data-t2t-event-tooltip-key': markerKey,
                modifiers: [
                  {
                    name: 'preventOverflow',
                    enabled: true,
                    options: {
                      altAxis: true,
                      altBoundary: true,
                      tether: false,
                      rootBoundary: 'viewport',
                      padding: { top: 16, right: 16, bottom: 16, left: 16 },
                    },
                  },
                  {
                    name: 'flip',
                    enabled: true,
                    options: {
                      fallbackPlacements: ['bottom', 'top', 'left', 'right'],
                      boundary: 'viewport',
                      padding: { top: 16, right: 16, bottom: 16, left: 16 },
                    },
                  },
                  {
                    name: 'offset',
                    enabled: true,
                    options: {
                      offset: [0, 12],
                    },
                  },
                  {
                    name: 'computeStyles',
                    options: {
                      adaptive: false,
                      gpuAcceleration: true,
                    },
                  },
                ],
              },
              tooltip: {
                'data-t2t-event-tooltip-key': markerKey,
                onClick: isTouchDevice ? () => handleMarkerSelect(marker, markerKey) : undefined,
                onMouseEnter: !isTouchDevice ? clearCloseTimer : undefined,
                onMouseLeave: !isTouchDevice ? scheduleClose : undefined,
                sx: {
                  bgcolor: '#111',
                  color: '#fff',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.32)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: { xs: 'min(calc(100vw - 32px), 320px)', sm: 320 },
                  maxWidth: { xs: 'calc(100vw - 32px)', sm: 320 },
                  minHeight: { xs: 'auto', sm: 'auto' },
                  maxHeight: { xs: 'calc(var(--t2t-vv-height, 100dvh) - 120px)', sm: 400 },
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: 1.25,
                  // Let child Typography control its own color (needed for passed-state gray-out).
                  '& .MuiTypography-root': { color: 'inherit' },
                  cursor: isTouchDevice ? 'pointer' : 'default',
                  WebkitOverflowScrolling: 'touch',
                  // Hide scrollbar by default, show on hover - Firefox
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                  // Hide scrollbar by default, show on hover - Webkit
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  },
                },
              },
              arrow: {
                sx: {
                  color: '#111',
                  '&::before': {
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxSizing: 'border-box',
                  },
                },
              },
            }}
          >
            <Box
              className="clock-event-marker"
              sx={markerStyle}
              style={{ pointerEvents: 'auto' }}
              data-t2t-event-marker-key={markerKey}
              onMouseEnter={!isTouchDevice ? () => {
                // Enterprise: only one tooltip open at a time (switch instantly)
                clearCloseTimer();
                setOpenMarkerKey(markerKey);
              } : undefined}
              onMouseLeave={!isTouchDevice ? scheduleClose : undefined}
              onFocus={!isTouchDevice ? () => {
                clearCloseTimer();
                setOpenMarkerKey(markerKey);
              } : undefined}
              onBlur={!isTouchDevice ? scheduleClose : undefined}
              onClick={() => handleMarkerSelect(marker, markerKey)}
            >
                {(marker.hasNoteMarker || marker.hasNoteMarkerAny) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: (marker.isTodayPast || !marker.hasNoteMarker) ? '#616161' : 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
                      pointerEvents: 'none',
                    }}
                  >
                    <NoteAltIcon sx={{ fontSize: 12, color: '#fff', opacity: (marker.isTodayPast || !marker.hasNoteMarker) ? 0.9 : 1 }} />
                  </Box>
                )}
              {(marker.isFavoriteMarker || marker.isFavoriteMarkerAny) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: (marker.isTodayPast || !marker.isFavoriteMarker) ? '#616161' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
                    pointerEvents: 'none',
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 12, color: '#fff', opacity: (marker.isTodayPast || !marker.isFavoriteMarker) ? 0.9 : 1 }} />
                </Box>
              )}
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

const MemoClockEventsOverlay = React.memo(ClockEventsOverlay);
MemoClockEventsOverlay.displayName = 'ClockEventsOverlay';

ClockEventsOverlay.propTypes = {
  size: PropTypes.number.isRequired,
  timezone: PropTypes.string.isRequired,
  eventFilters: PropTypes.shape({
    startDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    endDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    impacts: PropTypes.arrayOf(PropTypes.string),
    eventTypes: PropTypes.arrayOf(PropTypes.string),
    currencies: PropTypes.arrayOf(PropTypes.string),
    favoritesOnly: PropTypes.bool,
  }),
  newsSource: PropTypes.string,
  onEventClick: PropTypes.func,
  onLoadingStateChange: PropTypes.func,
};

export default MemoClockEventsOverlay;
