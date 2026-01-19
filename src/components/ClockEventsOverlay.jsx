/**
 * src/components/ClockEventsOverlay.jsx
 *
 * Purpose: Overlay markers for today's economic events on the analog clock.
 * Renders impact-based icons on AM (inner) and PM (outer) rings using current filters and news source.
 *
 * Changelog:
 * v1.15.13 - 2026-01-17 - FULLSCREEN TOOLTIP POSITIONING FIX: Fixed EventMarkerTooltip positioning in fullscreen by converting viewport coordinates to container-relative coordinates using overlayRef.current?.parentElement?.getBoundingClientRect(). Tooltips now render at correct position relative to overlay container. Removed incorrect transform. Ensures EventModal opens correctly from tooltip click in fullscreen mode on all breakpoints.
 * v1.15.12 - 2026-01-17 - FULLSCREEN TOOLTIP STACKING CONTEXT FIX: When isFullscreenMode is true, tooltips now render with absolute positioning instead of Portal. This keeps tooltips within the fullscreen element's stacking context, fixing visibility issues where Portal-rendered tooltips were hidden behind the fullscreen element. Tooltips now visible on click in fullscreen mode on all breakpoints.
 * v1.15.11 - 2026-01-17 - FULLSCREEN TOOLTIP Z-INDEX FIX: Increased EventMarkerTooltip z-index from 1000 to 1250 so tooltips remain visible during fullscreen mode. Tooltips now render above all clock content and fullscreen button while staying below modals (10001+). Fixes visibility issue where tooltips were hidden behind fullscreen elements on click.
 * v1.15.10 - 2026-01-16 - Fix: outside-click close works even when tooltip autoscroll is suppressed (calendar clock).
 * v1.15.9 - 2026-01-16 - Enable marker click actions when tooltips are disabled (landing hero), with propagation guard.
 * v1.15.8 - 2026-01-16 - Show event tooltip only on click/touch (no hover/focus open/close) for stable UX.
 * v1.15.7 - 2026-01-16 - Render event tooltip in a portal so it sits above ClockHandsOverlay while keeping z-index aligned with session tooltips.
 * v1.15.6 - 2026-01-16 - Align event tooltip z-index with session arc tooltip for consistent layering.
 * v1.15.5 - 2026-01-16 - Raise event tooltip z-index above clock hands overlay for reliable click/touch targeting.
 * v1.15.4 - 2026-01-16 - FIX: Mark event tooltip container with data attribute so outside-click handler does not immediately close it; enables tooltip click to open EventModal on /clock.
 * v1.15.3 - 2026-01-16 - GLOBAL CURRENCY ICON: Show MUI PublicIcon for '—' or missing currency (global events) instead of missing flag badge. Fully responsive, mobile-first, enterprise UX.
 * v1.15.2 - 2026-01-16 - Display GPT all-day/tentative time labels in tooltip rows.
 * v1.15.1 - 2026-01-14 - CRITICAL FIX: Fixed React duplicate key warning for multiple events at same time. Fallback markerKey now includes array index to ensure uniqueness: `${hour}-${minute}-${idx}`.
 * v1.15.0 - 2026-01-13 - Lock markers to today-only display: date range filters (startDate/endDate) from EventsFilters3 are completely ignored. Only impact and currency filters apply to markers. "Showing events..." banner removed from App.
 * v1.14.4 - 2026-01-08 - Auto-refreshes markers when the day rolls over by reloading today's events for the active timezone.
 * v1.14.3 - 2026-01-07 - Refactor marker lifecycle to ref-based exit handling, eliminating render-loop risk and reducing overlay tick work while keeping animations.
 * v1.14.2 - 2026-01-07 - Group markers in 30-minute windows (07:46-08:15 → 08:00, 08:16-08:45 → 08:30) to show all events per window in one tooltip.
 * v1.14.1 - 2026-01-07 - Marker priority updated: favorites > notes > NOW > NEXT > impact > upcoming with non-passed preference; badges gray when the driving favorite/note has passed.
 * v1.13.4 - 2026-01-06 - Keep marker currency flags visible for passed events and gray them out to match tooltip behavior.
 * v1.13.3 - 2026-01-06 - Remove legacy allowedEventKeys hook dependency so overlay runs standalone without ReferenceError.
 * v1.13.2 - 2026-01-06 - Overlay always shows today's events (timezone-aware) regardless of date range filters; impact/currency filters still apply for performance.
 * v1.13.1 - 2026-01-06 - Honor allowedEventKeys so filtered-out events never render markers or tooltips.
 * v1.13.0 - 2026-01-06 - Refine hover detection so tooltips show on hybrid devices; add embed-ready parity for non-autoscrolling marker clicks.
 * v1.14.0 - 2026-01-07 - Extract data + marker logic into reusable hooks, cut per-tick recompute, and keep badges live with favorites/notes subscriptions.
 * v1.12.9 - 2025-12-22 - Add disableTooltips option so landing hero preview can show markers without opening marker tooltips.
 * v1.12.8 - 2025-12-22 - Add suppressTooltipAutoscroll to tooltip close listener deps to satisfy lint and keep effect in sync.
 * v1.12.7 - 2025-12-22 - Measure overlay bounds and fill parent to keep markers centered when containers add padding/margins (e.g., Paper hero card).
 * v1.12.6 - 2025-12-22 - Align marker radii with ClockCanvas (0.47/0.78) so markers stay centered on AM/PM arcs inside responsive app paper layouts.
 * v1.12.5 - 2025-12-18 - Group events by 10-minute window per impact (cross-currency). Marker position uses the bucket start time while preserving priority: NOW > NEXT > favorite > note > impact.
 * v1.12.4 - 2025-12-18 - Group same-time same-impact events into a single marker (multi-currency). Marker icon/color chosen by priority: NOW > NEXT > favorite > note > impact (high→low) > upcoming.
 * v1.12.3 - 2025-12-18 - Marker click keeps tooltip open (no drawer). Only tooltip event rows open drawer for precise intent on desktop/touch.
 * v1.12.2 - 2025-12-18 - Centralize impact colors: low = yellow (#F2C94C), unknown = taupe (#C7B8A4); avoids session/NOW collisions.
 * v1.12.1 - 2025-12-18 - Centralize impact colors for markers/tooltip chips; low impact now taupe (#C7B8A4) to avoid session/NOW clashes.
 * v1.12.0 - 2025-12-20 - Clockwise render order (00:00 inner through 23:59 outer) and unified 1.5s marker animations with performance-safe timing.
 * v1.11.1 - 2025-12-20 - Stabilized marker animations (no tooltip jitter, guarded exit timers to avoid render loops).
 * v1.11.0 - 2025-12-20 - Added pop-in entry and swoosh-out exit animations for event markers with exit preservation buffer.
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
import { Box, Tooltip, Typography, Stack, alpha, Divider, Chip, Portal } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { formatTime } from '../utils/dateUtils';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PublicIcon from '@mui/icons-material/Public';
import { useEventNotes } from '../hooks/useEventNotes';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { resolveImpactMeta } from '../utils/newsApi';
import {
  NOW_WINDOW_MS,
  getEventEpochMs,
  formatRelativeLabel,
} from '../utils/eventTimeEngine';
import useClockEventsData from '../hooks/useClockEventsData';
import useClockEventMarkers from '../hooks/useClockEventMarkers';
import EventMarkerTooltip from './EventMarkerTooltip';
import { useTooltipCoordinator } from '../contexts/useTooltipCoordinator';

const MARKER_ANIM_MS = 1500; // Enterprise-grade marker motion duration
const MARKER_EXIT_GRACE_MS = MARKER_ANIM_MS + 120; // Keep exiting markers long enough to finish

const getImpactMeta = (impact) => resolveImpactMeta(impact);

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

function ClockEventsOverlay({ size, timezone, eventFilters, newsSource, events: providedEvents, onEventClick, onLoadingStateChange, suppressTooltipAutoscroll = false, disableTooltips = false, isFullscreenMode = false }) {
  const location = useLocation();
  const isCalendarPage = location.pathname === '/calendar';
  const { openTooltip, closeTooltip: closeGlobalTooltip, isTooltipActive } = useTooltipCoordinator();
  const [nowTick, setNowTick] = useState(Date.now());
  const [openMarkerKey, setOpenMarkerKey] = useState(null);
  const [pinnedMarkerKey, setPinnedMarkerKey] = useState(null);
  const closeTimerRef = useRef(null);
  const lastAutoScrollKeyRef = useRef(null);
  const overlayRef = useRef(null);
  const [measuredSize, setMeasuredSize] = useState(size);
  const { isFavorite } = useFavorites();
  const { hasNotes } = useEventNotes();
  const appearedAtRef = useRef(new Map());
  const exitingMarkersRef = useRef(new Map());
  const prevMarkersRef = useRef(new Map());
  const nowEpochMs = nowTick; // CRITICAL: Use absolute epoch milliseconds - timezone only affects display

  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const supportsHover = typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover)').matches;
    const hasCoarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    return !supportsHover && hasCoarsePointer && touchCapable;
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    // Do not auto-close if the marker is pinned (clicked)
    if (pinnedMarkerKey && pinnedMarkerKey === openMarkerKey) return;

    clearCloseTimer();
    // Short grace period allows moving from marker -> tooltip without accidental close
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMarkerKey(null);
      closeTimerRef.current = null;
    }, 150);
  }, [clearCloseTimer, openMarkerKey, pinnedMarkerKey]);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    setPinnedMarkerKey(null);
    setOpenMarkerKey(null);
    closeGlobalTooltip('event'); // Close in global coordinator
  }, [clearCloseTimer, closeGlobalTooltip]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  // Track the actual overlay box size so marker math stays aligned even if the parent adds padding/margins.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const measure = () => {
      const el = overlayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = Math.round(Math.min(rect.width, rect.height));
      if (!Number.isFinite(next) || next <= 0) return;
      setMeasuredSize((prev) => (prev === next ? prev : next));
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      if (overlayRef.current) observer.observe(overlayRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [size]);

  // Keep tooltip open after click and close only on explicit outside interaction
  useEffect(() => {
    if (!openMarkerKey) return;

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
  }, [closeTooltip, openMarkerKey, suppressTooltipAutoscroll]);

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
      if (suppressTooltipAutoscroll) return;
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
  }, [openMarkerKey, suppressTooltipAutoscroll]);

  const handleMarkerSelect = useCallback((marker, markerKey) => {
    if (!marker) return;
    const key = markerKey || `${marker.hour}-${marker.minute}`;

    // Enterprise UX: marker clicks only open/keep tooltip; drawer opens from tooltip rows.
    clearCloseTimer();
    if (openMarkerKey !== key) {
      setOpenMarkerKey(key);
      setPinnedMarkerKey(key);
      openTooltip('event', key); // Register in global coordinator
      return;
    }

    // If already open, keep it open; dismissal happens via outside click/hover leave.
    setOpenMarkerKey(key);
    setPinnedMarkerKey(key);
    openTooltip('event', key); // Register in global coordinator
  }, [clearCloseTimer, openMarkerKey, openTooltip]);

  const handleTooltipEventSelect = useCallback((evt) => {
    // Tooltip row click should target only the selected event (not the entire marker group).
    onEventClick?.(evt, { source: 'canvas-tooltip' });
    closeTooltip();
  }, [closeTooltip, onEventClick]);

  const { events: sourceEvents, loading: eventsLoading } = useClockEventsData({
    events: providedEvents,
    timezone,
    eventFilters,
    newsSource,
    nowEpochMs,
  });

  useEffect(() => {
    onLoadingStateChange?.(eventsLoading);
  }, [eventsLoading, onLoadingStateChange]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { markers, hasNowEvent, earliestFuture } = useClockEventMarkers({
    events: sourceEvents,
    timezone,
    eventFilters,
    nowEpochMs,
    isFavorite,
    hasNotes,
  });

  // Track marker lifecycle in refs to avoid setState render loops
  useEffect(() => {
    const currentKeys = new Set(markers.map((m) => m.key));

    // Mark exiting markers for keys that disappeared
    prevMarkersRef.current.forEach((prevMarker, key) => {
      if (!currentKeys.has(key) && !exitingMarkersRef.current.has(key)) {
        exitingMarkersRef.current.set(key, {
          ...prevMarker,
          exiting: true,
          exitAt: nowEpochMs,
        });
      }
    });

    // Update appearance timestamps and clear exits for active markers
    markers.forEach((marker) => {
      if (!appearedAtRef.current.has(marker.key)) {
        appearedAtRef.current.set(marker.key, nowEpochMs);
      }
      exitingMarkersRef.current.delete(marker.key);
    });

    // Prune stale exiting markers
    exitingMarkersRef.current.forEach((marker, key) => {
      if (nowEpochMs - (marker.exitAt || 0) >= MARKER_EXIT_GRACE_MS) {
        exitingMarkersRef.current.delete(key);
        appearedAtRef.current.delete(key);
      }
    });

    // Snapshot current markers for the next tick
    const nextPrev = new Map();
    markers.forEach((marker) => {
      nextPrev.set(marker.key, marker);
    });
    prevMarkersRef.current = nextPrev;
  }, [markers, nowEpochMs]);

  const renderedMarkers = useMemo(() => {
    const exiting = Array.from(exitingMarkersRef.current.values());
    const staying = markers.map((marker) => ({
      ...marker,
      exiting: false,
      appeared: appearedAtRef.current.get(marker.key) || nowEpochMs,
    }));
    return [...staying, ...exiting];
  }, [markers, nowEpochMs]);

  const effectiveSize = measuredSize || size;
  const center = effectiveSize / 2;
  const radius = effectiveSize / 2 - 5;
  // Match session arc radii from ClockCanvas (drawDynamicElements) for perfect alignment in responsive containers.
  const amRadius = radius * 0.47;
  const pmRadius = radius * 0.78;

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
      ref={overlayRef}
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 2 }}
    >
      {renderedMarkers.map((marker, idx) => {
        const isAm = marker.hour < 12;
        const markerKey = marker.key || `${marker.hour}-${marker.minute}-${idx}`;
        const isMarkerOpen = openMarkerKey === markerKey;
        const { x, y } = getPosition(marker.hour, marker.minute, isAm);
        const overlayRect = overlayRef.current?.getBoundingClientRect();
        const tooltipLeft = (overlayRect?.left ?? 0) + x;
        const tooltipTop = (overlayRect?.top ?? 0) + y;

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
          width: 24,
          height: 24,
          borderRadius: '50%',
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
            : marker.exiting
              ? `markerSwooshOut ${MARKER_ANIM_MS}ms ease-in forwards`
              : `markerPopIn ${MARKER_ANIM_MS}ms cubic-bezier(0.18, 0.89, 0.32, 1.28), ${marker.isNow
                ? `nowScale ${MARKER_ANIM_MS}ms ease-in-out ${Math.round(MARKER_ANIM_MS * 0.15)}ms infinite`
                : (marker.isNext && !hasNowEvent)
                  ? `nextScale ${MARKER_ANIM_MS}ms ease-in-out ${Math.round(MARKER_ANIM_MS * 0.15)}ms infinite`
                  : 'none'
              }`,
          cursor: disableTooltips ? 'default' : 'pointer',
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
          '@keyframes markerPopIn': {
            '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7)' },
            '55%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.12)' },
            '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          },
          '@keyframes markerSwooshOut': {
            '0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            '40%': { opacity: 0.9, transform: 'translate(-50%, -50%) scale(0.82)' },
            '100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.4)' },
          },
        };

        let tooltipContent = null;
        if (!disableTooltips) {
          const markerEvents = marker.events.map((item) => item.evt);
          // Group events by day for dividers
          const eventsByDay = markerEvents.reduce((acc, evt) => {
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

          tooltipContent = (
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
                    const timeLabel = evt.timeLabel || formatTime(evt.date || evt.dateTime || evt.Date, timezone);
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
        }

        const markerNode = (
          <Box
            className="clock-event-marker"
            sx={markerStyle}
            style={{ pointerEvents: disableTooltips ? 'none' : 'auto' }}
            data-t2t-event-marker-key={markerKey}
            onMouseEnter={undefined}
            onMouseLeave={undefined}
            onFocus={undefined}
            onBlur={undefined}
            onClick={(() => {
              if (disableTooltips && !onEventClick) return undefined;
              return (e) => {
                e.stopPropagation();
                if (disableTooltips) {
                  if (marker.events && marker.events.length > 0) {
                    const targetEvent = marker.events[0].evt;
                    onEventClick?.(targetEvent, {
                      source: 'canvas-marker',
                      isCalendarPage,
                    });
                  }
                  return;
                }
                handleMarkerSelect(marker, markerKey);
              };
            })()}
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
            {marker.countryCode ? (
              <span
                className="clock-event-flag"
                title={marker.currency}
                style={{
                  opacity: marker.isTodayPast ? 0.75 : 1,
                  filter: marker.isTodayPast ? 'grayscale(1)' : 'none',
                }}
              >
                <span className={`fi fi-${marker.countryCode}`} />
              </span>
            ) : (marker.currency === '—' || !marker.currency) ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  opacity: marker.isTodayPast ? 0.75 : 1,
                  filter: marker.isTodayPast ? 'grayscale(1)' : 'none',
                }}
                title="Global"
              >
                <PublicIcon sx={{ fontSize: 14, lineHeight: 1 }} />
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontWeight: 700, lineHeight: 1, fontSize: '0.65rem' }}
                >
                  ALL
                </Typography>
              </Box>
            ) : null}
          </Box>
        );

        if (disableTooltips) {
          return (
            <React.Fragment key={markerKey}>
              {markerNode}
            </React.Fragment>
          );
        }

        // Render EventMarkerTooltip as a positioned overlay when marker is active
        return (
          <React.Fragment key={markerKey}>
            {markerNode}
            {isMarkerOpen && isFullscreenMode ? (
              // In fullscreen: use absolute positioning with container-relative coordinates
              (() => {
                // In fullscreen, coordinates are viewport-relative, need to convert to container-relative
                const containerRect = overlayRef.current?.parentElement?.getBoundingClientRect();
                const relativeLeft = containerRect ? tooltipLeft - containerRect.left + 10 : tooltipLeft + 10;
                const relativeTop = containerRect ? tooltipTop - containerRect.top - 10 : tooltipTop - 10;
                return (
                  <Box
                    data-t2t-event-tooltip-key={markerKey}
                    role="tooltip"
                    sx={{
                      position: 'absolute',
                      left: `${relativeLeft}px`,
                      top: `${relativeTop}px`,
                      zIndex: 1250,
                      pointerEvents: 'auto',
                    }}
                  >
                    <EventMarkerTooltip
                      events={marker.events.map(e => e.evt)}
                      timezone={timezone}
                      nowEpochMs={nowEpochMs}
                      onClick={() => {
                        if (marker.events && marker.events.length > 0) {
                          const targetEvent = marker.events[0].evt;
                          onEventClick?.(targetEvent, {
                            source: 'canvas-tooltip',
                            isCalendarPage
                          });
                        }
                        closeTooltip();
                      }}
                    />
                  </Box>
                );
              })()
            ) : isMarkerOpen && !isFullscreenMode ? (
              // Not in fullscreen: use Portal for root-level rendering
              <Portal>
                <Box
                  data-t2t-event-tooltip-key={markerKey}
                  role="tooltip"
                  sx={{
                    position: 'fixed',
                    left: tooltipLeft + 10,
                    top: tooltipTop - 10,
                    zIndex: 1250, // Above all content and fullscreen button, below modals (10001+)
                    pointerEvents: 'auto',
                  }}
                >
                  <EventMarkerTooltip
                    events={marker.events.map(e => e.evt)}
                    timezone={timezone}
                    nowEpochMs={nowEpochMs}
                    onClick={() => {
                      // On /calendar page: auto-scroll to event (will be handled by parent)
                      // On other pages: open event modal
                      if (marker.events && marker.events.length > 0) {
                        const targetEvent = marker.events[0].evt; // Extract event from wrapper
                        onEventClick?.(targetEvent, {
                          source: 'canvas-tooltip',
                          isCalendarPage
                        });
                      }
                      closeTooltip();
                    }}
                  />
                </Box>
              </Portal>
            ) : null}
          </React.Fragment>
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
  events: PropTypes.arrayOf(PropTypes.object),
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
  suppressTooltipAutoscroll: PropTypes.bool,
  disableTooltips: PropTypes.bool,
  isFullscreenMode: PropTypes.bool,
};

export default MemoClockEventsOverlay;
