/**
 * src/components/ClockEventsOverlay.jsx
 *
 * Purpose: Overlay markers for today's economic events on the analog clock.
 * Renders impact-based icons on AM (inner) and PM (outer) rings using current filters and news source.
 *
 * Changelog:
 * v1.18.19 - 2026-01-22 - Group clock event markers into 5-minute windows and pass grouped time to tooltips.
 * v1.18.18 - 2026-01-22 - BEP: Apply contrast-aware text color to custom marker icons for accessibility (matches custom currency chip behavior).
 * v1.18.17 - 2026-01-22 - Ensure unique marker keys by appending stable event identifiers.
 * v1.18.16 - 2026-01-22 - Raise hovered marker above all others, revert on hover leave.
 * v1.18.15 - 2026-01-22 - Update marker z-index priority: NOW > NEXT > custom > favorite > note > impact > non-economic > other.
 * v1.18.14 - 2026-01-21 - Show impact badge for custom markers with no currency.
 * v1.18.13 - 2026-01-21 - Use contrast-aware colors for custom marker icons and badges.
 * v1.18.12 - 2026-01-21 - Render custom reminder markers with a dedicated MUI icon.
 * v1.18.11 - 2026-01-21 - Reduce loading skeleton markers to 5 for spacious, realistic placement.
 * v1.18.10 - 2026-01-21 - Simplify loading skeleton markers to 7 while matching real marker sizing and badges.
 * v1.18.9 - 2026-01-21 - Expand loading skeleton markers to 12 with realistic times, currency badges, and favorite/note placeholders.
 * v1.18.8 - 2026-01-21 - UX: Tune global badge background for past events and set active badge icon to primary.
 * v1.18.7 - 2026-01-21 - BEP: Smooth NOW/NEXT marker animations; pause NEXT when any NOW marker is active.
 * v1.18.6 - 2026-01-21 - UX: Animate marker show/hide during filter transitions.
 * v1.18.5 - 2026-01-21 - UX: Add lightweight show/hide animation for event markers.
 * v1.18.4 - 2026-01-21 - UX: Add lightweight Apple-style open/close animation for event tooltips.
 * v1.18.3 - 2026-01-21 - Flip tooltip to the opposite side when horizontal space is tight to prevent detail-row wrapping.
 * v1.18.2 - 2026-01-21 - Raise event tooltip z-index above AppBar and filter bars on xs/sm.
 * v1.18.1 - 2026-01-21 - UX: Close marker tooltip when another tooltip becomes active.
 * v1.18.0 - 2026-01-21 - UX: Position tooltips toward available viewport space (flip left/up as needed).
 * v1.17.9 - 2026-01-21 - UX: Increased flag badge size and improved marker border contrast.
 * v1.17.8 - 2026-01-21 - Removed fullscreen tooltip branching after fullscreen toggle removal.
 * v1.17.0 - 2026-01-21 - PERFORMANCE: Removed all marker animations (entry pop-in, exit swoosh, NOW scale, NEXT scale). Markers now display instantly without animation overhead. BEP: Performance prioritization - markers render at full speed with zero animation delay. Significantly improves initial load time and clock responsiveness on low-end devices.
 * v1.17.1 - 2026-01-21 - BLINK FIX: Added filter confirmation state to prevent marker flicker when filters are applied. Markers only hide/show after filter confirmation (data fully loaded). Search and impact/currency filters now apply smoothly without visual blink. BEP: Smooth, stable marker rendering during filter changes.
 * v1.17.6 - 2026-01-21 - DATA KEY GATE: Tie skeleton visibility to dataKey from useClockEventsData so markers render only when data matches current filters. Eliminates post-skeleton unfiltered flash.
 * v1.17.7 - 2026-01-21 - UX: Render global currency icon in the flag position without ALL text for cleaner markers.
 * v1.17.4 - 2026-01-21 - FILTER TRANSITION CLEANUP: Clear marker lifecycle caches on filter changes so stale markers never flash during impact/currency updates.
 * v1.17.3 - 2026-01-21 - FILTER GATE FIX: Derive filter-loading state synchronously to prevent one-frame unfiltered marker flash when impact/currency filters change. Simplifies state and keeps skeleton gate deterministic.
 * v1.17.2 - 2026-01-21 - LOADING SKELETON: On filter change, real markers fade out and 5 fixed skeleton placeholders appear at different time positions. Skeletons disappear once new filtered events fully load. Provides visual feedback and prevents empty clock during filter transitions. BEP: Excellent UX with smooth loading states.
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
import { Box, Typography, alpha, Portal } from '@mui/material';
import { useLocation } from 'react-router-dom';

import { useFavorites } from '../hooks/useFavorites';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PublicIcon from '@mui/icons-material/Public';
import { useEventNotes } from '../hooks/useEventNotes';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import useClockEventsData from '../hooks/useClockEventsData';
import useClockEventMarkers from '../hooks/useClockEventMarkers';
import EventMarkerTooltip from './EventMarkerTooltip';
import { useTooltipCoordinator } from '../contexts/useTooltipCoordinator';
import { isColorDark } from '../utils/clockUtils';

const MARKER_TRANSITION_MS = 160; // Fast marker show/hide transition
const MARKER_EXIT_GRACE_MS = MARKER_TRANSITION_MS + 80; // Keep exiting markers long enough to finish
const TOOLTIP_ANIM_MS = 160; // Fast, Apple-like tooltip transition


function ClockEventsOverlay({ size, timezone, eventFilters, newsSource, events: providedEvents, onEventClick, onLoadingStateChange, suppressTooltipAutoscroll = false, disableTooltips = false }) {
  const location = useLocation();
  const isCalendarPage = location.pathname === '/calendar';
  const { openTooltip, closeTooltip: closeGlobalTooltip, isTooltipActive } = useTooltipCoordinator();
  const [nowTick, setNowTick] = useState(Date.now());
  const [openMarkerKey, setOpenMarkerKey] = useState(null);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState(null);
  const [renderedMarkerKey, setRenderedMarkerKey] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const tooltipAnimFrameRef = useRef(null);
  const tooltipCloseTimerRef = useRef(null);
  const lastAutoScrollKeyRef = useRef(null);
  const overlayRef = useRef(null);
  const [measuredSize, setMeasuredSize] = useState(size);
  const { isFavorite } = useFavorites();
  const { hasNotes } = useEventNotes();
  const appearedAtRef = useRef(new Map());
  const exitingMarkersRef = useRef(new Map());
  const prevMarkersRef = useRef(new Map());
  const prevFiltersKeyRef = useRef('');
  const nowEpochMs = nowTick; // CRITICAL: Use absolute epoch milliseconds - timezone only affects display

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeTooltip = useCallback(() => {
    clearCloseTimer();
    setOpenMarkerKey(null);
    closeGlobalTooltip('event'); // Close in global coordinator
  }, [clearCloseTimer, closeGlobalTooltip]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (tooltipAnimFrameRef.current) {
      window.cancelAnimationFrame(tooltipAnimFrameRef.current);
      tooltipAnimFrameRef.current = null;
    }
    if (tooltipCloseTimerRef.current) {
      window.clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }

    if (openMarkerKey) {
      setRenderedMarkerKey(openMarkerKey);
      setTooltipVisible(false);
      tooltipAnimFrameRef.current = window.requestAnimationFrame(() => {
        setTooltipVisible(true);
      });
      return undefined;
    }

    if (renderedMarkerKey) {
      setTooltipVisible(false);
      tooltipCloseTimerRef.current = window.setTimeout(() => {
        setRenderedMarkerKey(null);
      }, TOOLTIP_ANIM_MS);
    }

    return undefined;
  }, [openMarkerKey, renderedMarkerKey]);

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

  useEffect(() => {
    if (!openMarkerKey) return;
    if (!isTooltipActive('event', openMarkerKey)) {
      setOpenMarkerKey(null);
    }
  }, [openMarkerKey, isTooltipActive]);

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
      openTooltip('event', key); // Register in global coordinator
      return;
    }

    // If already open, keep it open; dismissal happens via outside click/hover leave.
    setOpenMarkerKey(key);
    openTooltip('event', key); // Register in global coordinator
  }, [clearCloseTimer, openMarkerKey, openTooltip]);

  // Fetch with live filters so data loads immediately on impact/currency changes.
  const { events: sourceEvents, loading: eventsLoading, dataKey, requestKey } = useClockEventsData({
    events: providedEvents,
    timezone,
    eventFilters,
    newsSource,
    nowEpochMs,
  });

  const isFilterLoading = eventsLoading || (requestKey || '') !== (dataKey || '');

  useEffect(() => {
    if (requestKey === prevFiltersKeyRef.current) return;
    prevFiltersKeyRef.current = requestKey || '';

    // Filter transition: clear marker lifecycle caches so stale markers never flash.
    exitingMarkersRef.current.clear();
    prevMarkersRef.current.clear();
    appearedAtRef.current.clear();

    // Close any open tooltip tied to previous markers.
    if (openMarkerKey) {
      setOpenMarkerKey(null);
      closeGlobalTooltip('event');
    }
  }, [requestKey, closeGlobalTooltip, openMarkerKey]);

  useEffect(() => {
    onLoadingStateChange?.(isFilterLoading);
  }, [isFilterLoading, onLoadingStateChange]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { markers } = useClockEventMarkers({
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
    if (isFilterLoading) {
      const exitingOnFilter = Array.from(prevMarkersRef.current.values()).map((marker) => ({
        ...marker,
        exiting: true,
        exitAt: nowEpochMs,
        appeared: appearedAtRef.current.get(marker.key) || nowEpochMs,
      }));
      return exitingOnFilter;
    }

    const exiting = Array.from(exitingMarkersRef.current.values());
    const staying = markers.map((marker) => ({
      ...marker,
      exiting: false,
      appeared: appearedAtRef.current.get(marker.key) || nowEpochMs,
    }));
    return [...staying, ...exiting];
  }, [markers, nowEpochMs, isFilterLoading]);

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

  // Fixed skeleton marker positions for loading state (5 positions across the clock)
  const skeletonMarkers = [
    { hour: 6, minute: 30, id: 'skeleton-1', showNotes: true, showFavorite: false },
    { hour: 8, minute: 30, id: 'skeleton-2', showNotes: false, showFavorite: true },
    { hour: 11, minute: 0, id: 'skeleton-3', showNotes: false, showFavorite: false },
    { hour: 14, minute: 30, id: 'skeleton-4', showNotes: false, showFavorite: true },
    { hour: 16, minute: 30, id: 'skeleton-5', showNotes: false, showFavorite: false },
  ];

  const hasActiveNowMarker = renderedMarkers.some((marker) => marker.isNow && !marker.isTodayPast);

  return (
    <Box
      className="clock-events-overlay"
      ref={overlayRef}
      sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 2 }}
    >
      {/* Show skeleton loaders during filter transitions */}
      {isFilterLoading && renderedMarkers.length === 0 && skeletonMarkers.map((skeleton) => {
        const isAm = skeleton.hour < 12;
        const { x, y } = getPosition(skeleton.hour, skeleton.minute, isAm);
        return (
          <Box
            key={skeleton.id}
            sx={{
              position: 'absolute',
              left: x,
              top: y,
              width: 24,
              height: 24,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#e0e0e0',
              border: `2px solid ${alpha('#000', 0.18)}`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
              opacity: 0.75,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.75 },
                '50%': { opacity: 0.35 },
              },
              pointerEvents: 'none',
              zIndex: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9e9e9e',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.7)',
              }}
            />
            {skeleton.showNotes ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 14,
                  height: 10,
                  borderRadius: 2,
                  bgcolor: '#cfcfcf',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                  border: '2px solid #fff',
                }}
              />
            ) : null}
            {skeleton.showFavorite ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 14,
                  height: 10,
                  borderRadius: 2,
                  bgcolor: '#cfcfcf',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                  border: '2px solid #fff',
                }}
              />
            ) : null}
            <Box
              sx={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 14,
                height: 10,
                borderRadius: 2,
                bgcolor: '#d9d9d9',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.18)',
              }}
            />
          </Box>
        );
      })}
      {/* Show real event markers when not loading */}
      {!isFilterLoading && renderedMarkers.map((marker, idx) => {
        const isAm = marker.hour < 12;
        const baseMarkerKey = marker.key || `${marker.hour}-${marker.minute}`;
        const markerEventKey = (marker.events || [])
          .map((item) => item?.evt?.id || item?.evt?.eventId || item?.evt?.EventId || item?.evt?.externalId || item?.evt?.name || item?.evt?.Name)
          .filter(Boolean)
          .map((value) => String(value).replace(/\s+/g, '').replace(/[^a-zA-Z0-9_-]/g, ''))
          .filter(Boolean)
          .sort()
          .join('_');
        const markerKey = markerEventKey ? `${baseMarkerKey}-${markerEventKey}` : `${baseMarkerKey}-${idx}`;
        const isMarkerOpen = openMarkerKey === markerKey;
        const isTooltipRendered = renderedMarkerKey === markerKey;
        const isNewMarker = !marker.exiting && marker.appeared && Math.abs(nowEpochMs - marker.appeared) < 50;
        const shouldAnimateNow = marker.isNow && !marker.isTodayPast;
        const shouldAnimateNext = !hasActiveNowMarker && marker.isNext && !marker.isTodayPast;
        const markerAnimations = [
          isNewMarker ? `marker-pop ${MARKER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : null,
          shouldAnimateNow ? 'marker-now 1800ms ease-in-out infinite' : null,
          shouldAnimateNext ? 'marker-next 2200ms ease-in-out infinite' : null,
        ].filter(Boolean);
        const { x, y } = getPosition(marker.hour, marker.minute, isAm);
        const overlayRect = overlayRef.current?.getBoundingClientRect();
        const tooltipLeft = (overlayRect?.left ?? 0) + x;
        const tooltipTop = (overlayRect?.top ?? 0) + y;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
        const safePadding = 16;
        const estimatedTooltipWidth = 260;
        const spaceRight = viewportWidth > 0 ? viewportWidth - tooltipLeft - safePadding : 0;
        const spaceLeft = viewportWidth > 0 ? tooltipLeft - safePadding : 0;
        const prefersLeft = viewportWidth > 0 && (
          (spaceRight > 0 && spaceRight < estimatedTooltipWidth && spaceLeft >= estimatedTooltipWidth) ||
          tooltipLeft > viewportWidth * 0.6
        );
        const prefersUp = viewportHeight > 0 && tooltipTop > viewportHeight * 0.6;
        const tooltipOffsetX = prefersLeft ? -10 : 10;
        const tooltipOffsetY = prefersUp ? -10 : 10;
        const tooltipTranslateX = prefersLeft ? '-100%' : '0%';
        const tooltipTranslateY = prefersUp ? '-100%' : '0%';

        const isCustomMarker = marker.events?.some((item) => item.evt?.isCustom);
        const impactMeta = marker.impactMeta || marker.meta;
        const impactKey = impactMeta?.key || marker.meta?.key;

        const isHovered = hoveredMarkerKey === markerKey;

        // Calculate z-index priority: NOW > NEXT > Custom > Favorite > Note > High > Medium > Low > Non-Economic > Other
        let zIndex = 12; // Base z-index
        if (marker.isNow) {
          zIndex = 90;
        } else if (marker.isNext) {
          zIndex = 80;
        } else if (!marker.isTodayPast && isCustomMarker) {
          zIndex = 70;
        } else if (!marker.isTodayPast && marker.isFavoriteMarker) {
          zIndex = 60;
        } else if (!marker.isTodayPast && marker.hasNoteMarker) {
          zIndex = 50;
        } else if (impactKey === 'strong') {
          zIndex = 40;
        } else if (impactKey === 'moderate') {
          zIndex = 30;
        } else if (impactKey === 'weak') {
          zIndex = 22;
        } else if (impactKey === 'non-economic') {
          zIndex = 18;
        } else {
          zIndex = 14;
        }

        if (isMarkerOpen) {
          zIndex += 2;
        }

        if (isHovered) {
          zIndex = 100;
        }
        const impactBadgeColor = impactMeta?.color || marker.meta?.color || '#9e9e9e';
        const impactBadgeTextColor = isColorDark(impactBadgeColor) ? '#fff' : '#1f1f1f';
        const markerBackground = marker.isNow
          ? '#0288d1'
          : marker.isTodayPast
            ? '#bdbdbd'
            : marker.meta.color;
        const markerTextColor = isCustomMarker
          ? (isColorDark(markerBackground) ? '#fff' : '#1f1f1f')
          : (marker.isTodayPast ? '#424242' : '#fff');

        const markerStyle = {
          position: 'absolute',
          left: x,
          top: y,
          width: 24,
          height: 24,
          borderRadius: '50%',
          transform: `translate(-50%, -50%) scale(${marker.exiting ? 0.96 : 1})`,
          transformOrigin: 'center',
          backgroundColor: markerBackground,
          color: markerTextColor,
          border: `2px solid ${marker.isTodayPast ? '#7a7a7a' : alpha('#000', 0.32)}`,
          boxShadow: marker.isTodayPast ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
          cursor: disableTooltips ? 'default' : 'pointer',
          userSelect: 'none',
          opacity: marker.exiting ? 0 : 1,
          transition: `transform ${MARKER_TRANSITION_MS}ms ease-in-out, opacity ${MARKER_TRANSITION_MS}ms ease-in-out`,
          animation: markerAnimations.length ? markerAnimations.join(', ') : 'none',
          zIndex,
        };

        // BEP: Lazy-load tooltip content only when marker is clicked
        const markerIcon = marker.meta?.icon;
        const markerIconNode = React.isValidElement(markerIcon) ? (
          (isCustomMarker
            ? React.cloneElement(markerIcon, {
              sx: {
                ...(markerIcon.props?.sx || {}),
                color: markerTextColor,
              },
            })
            : markerIcon)
        ) : (
          <Typography
            component="span"
            variant="caption"
            sx={{ fontWeight: 800, fontSize: '0.75rem', color: markerTextColor }}
          >
            {markerIcon}
          </Typography>
        );

        const markerNode = (
          <Box
            className="clock-event-marker"
            sx={{
              ...markerStyle,
              '@keyframes marker-pop': {
                from: {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.96)',
                },
                to: {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
              '@keyframes marker-now': {
                '0%, 100%': {
                  transform: 'translate(-50%, -50%) scale(1)',
                  boxShadow: '0 6px 16px rgba(2, 136, 209, 0.4)',
                },
                '50%': {
                  transform: 'translate(-50%, -50%) scale(1.16)',
                  boxShadow: '0 16px 36px rgba(2, 136, 209, 0.75)',
                },
              },
              '@keyframes marker-next': {
                '0%, 100%': {
                  transform: 'translate(-50%, -50%) scale(1)',
                  boxShadow: '0 5px 14px rgba(0, 0, 0, 0.22)',
                },
                '50%': {
                  transform: 'translate(-50%, -50%) scale(1.12)',
                  boxShadow: '0 14px 28px rgba(0, 0, 0, 0.45)',
                },
              },
            }}
            style={{ pointerEvents: disableTooltips ? 'none' : 'auto' }}
            data-t2t-event-marker-key={markerKey}
            onMouseEnter={disableTooltips ? undefined : () => setHoveredMarkerKey(markerKey)}
            onMouseLeave={disableTooltips ? undefined : () => setHoveredMarkerKey((prev) => (prev === markerKey ? null : prev))}
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
            {markerIconNode}
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
            ) : (
              <span
                className="clock-event-flag clock-event-flag--icon"
                title={isCustomMarker ? 'Impact' : 'Global'}
                style={{
                  backgroundColor: isCustomMarker
                    ? impactBadgeColor
                    : (marker.isTodayPast ? 'rgba(255,255,255,0.65)' : '#fff'),
                  opacity: marker.isTodayPast ? 0.75 : 1,
                  filter: marker.isTodayPast ? 'grayscale(1)' : 'none',
                }}
              >
                {isCustomMarker ? (
                  React.isValidElement(impactMeta?.icon) ? (
                    React.cloneElement(impactMeta.icon, { sx: { fontSize: 12, color: impactBadgeTextColor } })
                  ) : (
                    <Typography component="span" sx={{ fontSize: '0.6rem', fontWeight: 900, color: impactBadgeTextColor, lineHeight: 1 }}>
                      {impactMeta?.icon || '~'}
                    </Typography>
                  )
                ) : (
                  <PublicIcon
                    sx={{
                      fontSize: 14,
                      lineHeight: 1,
                      color: marker.isTodayPast ? 'text.secondary' : 'text.primary',
                    }}
                  />
                )}
              </span>
            )}
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
            {isTooltipRendered ? (
              <Portal>
                <Box
                  data-t2t-event-tooltip-key={markerKey}
                  role="tooltip"
                  sx={{
                    position: 'fixed',
                    left: tooltipLeft + tooltipOffsetX,
                    top: tooltipTop + tooltipOffsetY,
                    transform: `translate(${tooltipTranslateX}, ${tooltipTranslateY}) scale(${(tooltipVisible && isMarkerOpen) ? 1 : 0.96})`,
                    opacity: (tooltipVisible && isMarkerOpen) ? 1 : 0,
                    transition: 'opacity 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
                    willChange: 'opacity, transform',
                    zIndex: 1800, // Above AppBar/filters, below modals (10001+)
                    pointerEvents: isMarkerOpen ? 'auto' : 'none',
                  }}
                >
                  <EventMarkerTooltip
                    events={marker.events.map(e => e.evt)}
                    timezone={timezone}
                    nowEpochMs={nowEpochMs}
                    groupEpochMs={marker.groupEpochMs ?? null}
                    onClick={(eventOverride) => {
                      // On /calendar page: auto-scroll to event (will be handled by parent)
                      // On other pages: open event modal
                      if (marker.events && marker.events.length > 0) {
                        const targetEvent = eventOverride || marker.events[0].evt; // Extract event from wrapper
                        onEventClick?.(targetEvent, {
                          source: 'canvas-tooltip',
                          isCalendarPage
                        });
                      }
                      closeTooltip();
                    }}
                    onClose={closeTooltip}
                    isFavoriteEvent={isFavorite}
                    hasEventNotes={hasNotes}
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
    searchQuery: PropTypes.string,
  }),
  newsSource: PropTypes.string,
  onEventClick: PropTypes.func,
  onLoadingStateChange: PropTypes.func,
  suppressTooltipAutoscroll: PropTypes.bool,
  disableTooltips: PropTypes.bool,
};

export default MemoClockEventsOverlay;
