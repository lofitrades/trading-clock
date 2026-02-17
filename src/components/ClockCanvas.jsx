/**
 * src/components/ClockCanvas.jsx
 *
 * Purpose: Canvas-based analog clock with session arcs, hover detection, and event markers.
 * Renders static background + dynamic session donuts + interactive tooltips.
 *
 * Changelog:
 * v1.3.29 - 2026-02-12 - BEP UX: Re-added GSAP opacity fade for session arc tooltip show/hide
 *   (0.15s in, 0.12s out). Restores smooth visual feedback on tooltip open/close while keeping
 *   all mount animations removed (no hand tweens, no entry animation, no scale/zoom).
 * v1.3.28 - 2026-02-12 - BEP UX: Re-added GSAP hover lineWidth animation (0.3s power2.out) for
 *   smooth arc thickness feedback on session hover. Restores tactile interactivity while keeping
 *   all other animations removed (no hand tweens, no tooltip fade, no entry animation).
 * v1.3.27 - 2026-02-12 - BEP PERFORMANCE: Removed ALL GSAP animations for instant rendering.
 *   Eliminates hover lineWidth tween, clock hand angle tweens (caused "small to big pop" on mount
 *   as hands swept from 12 o'clock to current time), and tooltip show/hide opacity transitions.
 *   Clock hands now set angles directly each tick. Hover lineWidth changes instantly. Tooltips
 *   mount/unmount without fade. GSAP import removed entirely. Maximises loading speed and
 *   immediate functionality — zero animation overhead.
 * v1.3.26 - 2026-02-12 - BEP UX: Removed scale/y zoom animation from session arc tooltip show/hide.
 *   Tooltip now uses opacity-only fade (0.15s in, 0.12s out). Eliminates the scale(0.96→1) zoom-in
 *   effect for a cleaner, less distracting tooltip appearance. Hover line-width animation retained.
 * v1.3.25 - 2026-02-12 - BEP PERFORMANCE: Removed GSAP staggered opacity fade-in entry animation.
 *   Session arcs now render at full opacity immediately on mount. Eliminates the distracting
 *   0.6s staggered fade-in that replayed every time ClockCanvas remounted (e.g. tab switching
 *   in Calendar2Page). Hover/click animations retained. Only entry animation removed.
 * v1.3.24 - 2026-02-12 - BEP MOBILE TOUCH: ClockPanelPaper now passes allowTouchScroll=true and
 *   touchTooltipDelayMs=150. This enables normal page scrolling (swipe) over the clock canvas on
 *   mobile while preserving tap-to-inspect session arc tooltips. touch-action:pan-y lets the
 *   browser handle vertical scroll natively; 150ms delay cancels tooltips during swipe gestures.
 * v1.3.23 - 2026-02-11 - BEP REACT HOOKS: Fixed react-hooks/exhaustive-deps warnings by wrapping
 *   showTooltip and hideTooltip functions in useCallback. Both functions now have stable references
 *   across renders. Added hideTooltip and showTooltip to event listener useEffect dependency array.
 *   Prevents unnecessary effect re-runs and improves performance.
 * v1.3.22 - 2026-02-11 - BEP TRANSPARENT FACE: Set faceColor to 'transparent' instead of background.paper.
 *   v1.3.20 still drew a white circle because background.paper resolves to #fff in light mode. Now the
 *   canvas draws no background circle at all — the container (Paper, Box, etc.) provides the surface color.
 *   Fixes visible white circle on landing page and any other transparent-background context.
 * v1.3.21 - 2026-02-10 - BEP RENDER PERF: Eliminated glitchy arc rendering. (1) Fixed entry animation: GSAP now
 *   targets `targetLineWidth` (the property drawDynamicElements actually reads) instead of unused `lineWidth`.
 *   (2) Moved time, hoveredSession, handColor, activeSession to refs so the rAF animation loop is NOT torn
 *   down and rebuilt every second — prevents visible canvas flash from canvas.width reset. (3) Separated
 *   canvas dimension setup (size-only dep) from the rAF draw loop (structural deps only). (4) Entry
 *   animation uses opacity-only fade (0→1) with full width from start for clean, modern SaaS appearance.
 * v1.3.20 - 2026-02-10 - BEP THEME-AWARE FACE: Pass theme.palette.background.paper as faceColor to drawStaticElements. Eliminates hardcoded #fff clock face circle visible on transparent backgrounds. Face color now adapts to light/dark theme.
 * v1.3.19 - 2026-01-28 - BEP UI FIX: Removed inline backgroundColor from canvas-container div. Background now fully transparent to eliminate visible gap between outer border and canvas content. Border masking handled by .hand-clock-wrapper in App.css.
 * v1.3.18 - 2026-01-28 - BEP THEME FIX: Added backgroundColor: theme.palette.background.default to canvas-container inline style. Ensures canvas background matches theme in both light and dark modes. Works with MUI theme system instead of CSS variables.
 * v1.3.15 - 2026-01-22 - BEP: Disable mobile tap highlight on the clock canvas.
 * v1.3.14 - 2026-01-22 - BEP: Add optional touch tooltip delay to avoid showing tooltips during scroll.
 * v1.3.13 - 2026-01-22 - BEP: Allow opt-in vertical scroll on touch devices (landing hero canvas).
 * v1.3.12 - 2026-01-21 - UX: Refine session tooltip open/close animation for Apple-like motion.
 * v1.3.11 - 2026-01-21 - UX: Left hemisphere sessions anchor tooltips from top-left; right hemisphere from top-right on all pages/breakpoints.
 * v1.3.9 - 2026-01-21 - UX: Bias session tooltip placement toward viewport center to reduce side overflow.
 * v1.3.8 - 2026-01-21 - UX: Session tooltip syncs with global coordinator to enforce single tooltip.
 * v1.3.7 - 2026-01-21 - UX: Pointer cursor on session hover; outside clicks always close tooltip.
 * v1.3.6 - 2026-01-21 - UX: Session arc tooltip opens on click only; hover keeps size effect.
 * v1.3.5 - 2026-01-21 - UX: Position session tooltips toward available viewport space (flip left/up as needed).
 * v1.3.4 - 2026-01-21 - Removed fullscreen tooltip branching after fullscreen toggle removal.
 * v1.3.3 - 2026-01-17 - FULLSCREEN TOOLTIP POSITIONING FIX: Fixed SessionArcTooltip positioning in fullscreen by (1) adding position:relative to canvas-container, (2) converting viewport coordinates to container-relative coordinates, (3) removing incorrect transform. Tooltips now render at correct position relative to canvas. Added containerRef to track canvas container for coordinate conversion.
 * v1.3.2 - 2026-01-17 - FULLSCREEN TOOLTIP STACKING CONTEXT FIX: When isFullscreenMode is true, tooltips now render with absolute positioning instead of Portal. This keeps tooltips within the fullscreen element's stacking context, fixing visibility issues where Portal-rendered tooltips were hidden behind the fullscreen element. Tooltips now visible on hover in fullscreen mode on all breakpoints.
 * v1.3.1 - 2026-01-17 - FULLSCREEN TOOLTIP Z-INDEX FIX: Increased SessionArcTooltip z-index from 1000 to 1250 so tooltips remain visible during fullscreen mode. Tooltips now render above all clock content and fullscreen button while staying below modals (10001+). Fixes visibility issue where tooltips were hidden behind fullscreen elements on hover.
 * v1.3.0 - 2026-01-16 - Pass timezone-aware calculations to SessionArcTooltip for accurate 'in/ago' labels
 * v1.2.0 - 2026-01-16 - Replace session arc tooltip with SessionArcTooltip component (12-hour format, relative labels, edit hint)
 * v1.1.0 - 2025-12-15 - Session arc hover detection and inline tooltips
 * v1.0.0 - 2025-11-15 - Initial implementation with canvas drawing utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Portal, useTheme } from '@mui/material';
import gsap from 'gsap';
import {
  drawStaticElements,
  drawDynamicElements,
  getLineWidthAndHoverArea,
  drawClockNumbers
} from '../utils/clockUtils';
import { useSettings } from '../contexts/SettingsContext';
import SessionArcTooltip from './SessionArcTooltip';
import { useTooltipCoordinator } from '../contexts/useTooltipCoordinator';

export default function ClockCanvas({ size, time, sessions, handColor, clockStyle = 'normal', showSessionNamesInCanvas = true, showPastSessionsGray = true, showClockNumbers = true, showClockHands = true, activeSession = null, backgroundBasedOnSession = false, renderHandsInCanvas = true, handAnglesRef = null, allowTouchScroll = false, touchTooltipDelayMs = 0 }) {
  const theme = useTheme();
  const { selectedTimezone } = useSettings();
  const { openTooltip, closeTooltip: closeGlobalTooltip, isTooltipActive } = useTooltipCoordinator();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredSession, setHoveredSession] = useState(null);

  // Determine theme-aware clock numbers color: light numbers on dark mode, dark numbers on light mode
  const themeAwareNumbersColor = theme.palette.mode === 'dark' ? '#E0E0E0' : '#0F172A';
  // BEP v1.3.22: Transparent clock face — no filled circle on canvas.
  // Container background (Paper on /calendar, transparent on landing) provides the surface color.
  // Eliminates the white circle artifact on pages with transparent/non-white backgrounds.
  const themeAwareFaceColor = 'transparent';
  const staticCanvas = useRef(document.createElement('canvas'));
  const targetDprRef = useRef(1);

  // Animation states for smooth transitions
  const animationStates = useRef({});
  const tooltipRef = useRef(null);
  const previousHoveredSession = useRef(null);
  const tooltipAnimation = useRef(null);
  const touchTooltipTimerRef = useRef(null);
  const touchHasMovedRef = useRef(false);

  // Clock hand animation states (shared with overlay when provided)
  const internalHandAngles = useRef({
    hour: 0,
    minute: 0,
    second: 0
  });
  const handAngles = handAnglesRef || internalHandAngles;

  // BEP v1.3.21: Refs for fast-changing values — read inside rAF loop without restarting it
  const timeRef = useRef(time);
  const hoveredSessionRef = useRef(hoveredSession);
  const handColorRef = useRef(handColor);
  const activeSessionRef = useRef(activeSession);
  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { hoveredSessionRef.current = hoveredSession; }, [hoveredSession]);
  useEffect(() => { handColorRef.current = handColor; }, [handColor]);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

  // Initialize animation states for each session
  useEffect(() => {
    const { lineWidth: targetLW } = getLineWidthAndHoverArea(size, clockStyle);
    sessions.forEach((session, index) => {
      if (!animationStates.current[index]) {
        // BEP v1.3.25: No entry animation — arcs appear instantly at full opacity.
        // Prevents distracting staggered fade-in on every tab-switch remount.
        animationStates.current[index] = {
          lineWidth: targetLW,
          opacity: 1,
          targetLineWidth: targetLW,
          targetOpacity: 1
        };
      }
    });
  }, [sessions, size, clockStyle]);

  useEffect(() => {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.2), 2.5);
    targetDprRef.current = dpr;
    const staticCtx = staticCanvas.current.getContext('2d');
    staticCanvas.current.width = Math.round(size * dpr);
    staticCanvas.current.height = Math.round(size * dpr);
    staticCtx.setTransform(1, 0, 0, 1, 0, 0);
    staticCtx.scale(dpr, dpr);
    staticCtx.imageSmoothingEnabled = true;
    staticCtx.imageSmoothingQuality = 'high';
    drawStaticElements(staticCtx, size, showSessionNamesInCanvas, themeAwareNumbersColor, themeAwareFaceColor);
  }, [size, showSessionNamesInCanvas, themeAwareNumbersColor, themeAwareFaceColor]);

  // BEP v1.3.28: Smooth hover line-width transition for tactile arc feedback
  useEffect(() => {
    const { lineWidth, hoverLineWidth } = getLineWidthAndHoverArea(size, clockStyle);

    sessions.forEach((session, index) => {
      if (!animationStates.current[index]) return;

      const isHovered = session === hoveredSession;
      const targetWidth = isHovered ? hoverLineWidth : lineWidth;

      gsap.to(animationStates.current[index], {
        targetLineWidth: targetWidth,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  }, [hoveredSession, size, sessions, clockStyle]);

  // BEP v1.3.27: Instant hand angle calculation — no GSAP tween.
  // Eliminates the mount "pop" where hands swept from 12 o'clock to current time.
  useEffect(() => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();

    handAngles.current.second = (seconds + milliseconds / 1000) * 6;   // 360/60 = 6°/s
    handAngles.current.minute = (minutes + seconds / 60) * 6;          // smooth minute
    handAngles.current.hour = ((hours % 12) + minutes / 60) * 30;    // 360/12 = 30°/h
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  // BEP v1.3.21: Canvas dimension setup — only runs on size change to avoid clearing
  // the canvas on every dep change (setting canvas.width resets all canvas state).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = targetDprRef.current || Math.min(Math.max(window.devicePixelRatio || 1, 1.2), 2.5);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }, [size]);

  // BEP v1.3.21: Animation loop — reads fast-changing values (time, hoveredSession,
  // handColor, activeSession) from refs so the rAF loop is NOT torn down and rebuilt
  // every second. Only structural/settings changes restart the loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = targetDprRef.current || Math.min(Math.max(window.devicePixelRatio || 1, 1.2), 2.5);

    let animationId;
    const animate = () => {
      // Reset transform each frame for correctness after any canvas resize
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(staticCanvas.current, 0, 0, size, size);

      // Read fast-changing values from refs (updated via separate effects)
      drawDynamicElements(
        ctx,
        size,
        sessions,
        timeRef.current,
        hoveredSessionRef.current,
        handColorRef.current,
        clockStyle,
        animationStates.current,
        handAngles.current,
        showSessionNamesInCanvas,
        showPastSessionsGray,
        activeSessionRef.current,
        backgroundBasedOnSession,
        renderHandsInCanvas,
        renderHandsInCanvas && showClockHands
      );

      // Numbers on top of arcs — theme-aware color
      if (showClockNumbers) {
        drawClockNumbers(ctx, size / 2, size / 2, size / 2 - 5, themeAwareNumbersColor, showSessionNamesInCanvas);
      }

      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [size, sessions, clockStyle, showSessionNamesInCanvas, showPastSessionsGray, backgroundBasedOnSession, showClockNumbers, showClockHands, renderHandsInCanvas, themeAwareNumbersColor, handAngles]);

  const detectHoveredSession = useCallback((canvas, mouseX, mouseY) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2 - 5;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
    const { hoverLineWidth } = getLineWidthAndHoverArea(size, clockStyle);
    const amRadius = radius * 0.52;
    const pmRadius = radius * 0.75;
    if (distance >= amRadius - hoverLineWidth / 2 && distance <= amRadius + hoverLineWidth / 2) {
      for (const kz of sessions) {
        const [startHour, startMinute] = kz.startNY.split(':').map(Number);
        const [endHour, endMinute] = kz.endNY.split(':').map(Number);
        if (startHour < 12) {
          const totalMinutes = 12 * 60;
          const start = ((startHour % 12) * 60 + startMinute) / totalMinutes * Math.PI * 2;
          let end = ((endHour % 12) * 60 + endMinute) / totalMinutes * Math.PI * 2;
          if (start > end) end += Math.PI * 2;
          if (normalizedAngle >= start && normalizedAngle <= end) return kz;
        }
      }
    }
    if (distance >= pmRadius - hoverLineWidth / 2 && distance <= pmRadius + hoverLineWidth / 2) {
      for (const kz of sessions) {
        const [startHour, startMinute] = kz.startNY.split(':').map(Number);
        const [endHour, endMinute] = kz.endNY.split(':').map(Number);
        if (startHour >= 12) {
          const totalMinutes = 12 * 60;
          const start = ((startHour % 12) * 60 + startMinute) / totalMinutes * Math.PI * 2;
          let end = ((endHour % 12) * 60 + endMinute) / totalMinutes * Math.PI * 2;
          if (start > end) end += Math.PI * 2;
          if (normalizedAngle >= start && normalizedAngle <= end) return kz;
        }
      }
    }
    return null;
  }, [sessions, size, clockStyle]);

  // BEP: Wrap tooltip handlers in useCallback to prevent dependency changes on every render
  // BEP v1.3.29: Opacity-only fade for tooltip show
  const showTooltip = useCallback((clientX, clientY, session) => {
    if (tooltipAnimation.current) {
      tooltipAnimation.current.kill();
    }
    const tooltipId = `session-${session.name}`;
    setTooltip({ x: clientX, y: clientY, ...session });
    openTooltip('session', tooltipId);

    if (tooltipRef.current) {
      tooltipAnimation.current = gsap.fromTo(tooltipRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power2.out' }
      );
    }
  }, [openTooltip]);

  // BEP v1.3.29: Opacity-only fade for tooltip hide
  const hideTooltip = useCallback(() => {
    if (tooltipAnimation.current) {
      tooltipAnimation.current.kill();
    }
    if (tooltipRef.current) {
      tooltipAnimation.current = gsap.to(tooltipRef.current, {
        opacity: 0,
        duration: 0.12,
        ease: 'power2.in',
        onComplete: () => {
          setTooltip(null);
          closeGlobalTooltip('session');
        },
      });
    } else {
      setTooltip(null);
      closeGlobalTooltip('session');
    }
  }, [closeGlobalTooltip]);

  // Tick effect to update tooltip time labels every second
  useEffect(() => {
    if (!tooltip) return;

    const tickInterval = window.setInterval(() => {
      // Force re-render of SessionArcTooltip by updating tooltip state
      setTooltip(prev => ({ ...prev }));
    }, 1000);

    return () => window.clearInterval(tickInterval);
  }, [tooltip]);

  useEffect(() => {
    if (!tooltip) return;
    const tooltipId = `session-${tooltip.name}`;
    if (!isTooltipActive('session', tooltipId)) {
      hideTooltip();
    }
  }, [tooltip, isTooltipActive, hideTooltip]);

  const handleMouseMove = (e) => {
    // Disable hover detection for minimalistic style
    if (clockStyle === 'minimalistic') {
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const hovered = detectHoveredSession(canvas, mouseX, mouseY);

    // Only update if the hovered session actually changed
    if (hovered !== previousHoveredSession.current) {
      previousHoveredSession.current = hovered;
      setHoveredSession(hovered);

    }
  };

  const handleCanvasClick = (e) => {
    // Disable click tooltip for minimalistic style
    if (clockStyle === 'minimalistic') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const clicked = detectHoveredSession(canvas, clickX, clickY);

    if (clicked) {
      previousHoveredSession.current = clicked;
      setHoveredSession(clicked);
      showTooltip(e.clientX, e.clientY, clicked);
    } else {
      hideTooltip();
    }
  };

  // Handle clicks/taps outside the canvas to hide tooltip
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClickOutside = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const inCanvas = canvas.contains(target);
      const inTooltip = tooltipRef.current?.contains(target) ?? false;
      if (inCanvas || inTooltip) return;

      previousHoveredSession.current = null;
      setHoveredSession(null);
      hideTooltip();
    };

    const clearTouchTooltipTimer = () => {
      if (touchTooltipTimerRef.current) {
        window.clearTimeout(touchTooltipTimerRef.current);
        touchTooltipTimerRef.current = null;
      }
    };

    const handleTouchStart = (e) => {
      // Disable touch detection for minimalistic style
      if (clockStyle === 'minimalistic') {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      const tapped = detectHoveredSession(canvas, touchX, touchY);

      if (tapped) {
        // Prevent default only when we detect a donut tap and touch scrolling is disabled
        if (!allowTouchScroll) {
          e.preventDefault();
        }
        previousHoveredSession.current = tapped;
        setHoveredSession(tapped);
        clearTouchTooltipTimer();
        touchHasMovedRef.current = false;

        if (touchTooltipDelayMs > 0) {
          touchTooltipTimerRef.current = window.setTimeout(() => {
            if (touchHasMovedRef.current) return;
            showTooltip(touch.clientX, touch.clientY, tapped);
          }, touchTooltipDelayMs);
        } else {
          showTooltip(touch.clientX, touch.clientY, tapped);
        }
      } else {
        // Tapped outside - hide tooltip
        previousHoveredSession.current = null;
        setHoveredSession(null);
        clearTouchTooltipTimer();
        hideTooltip();
      }
    };

    const handleTouchMove = () => {
      touchHasMovedRef.current = true;
      clearTouchTooltipTimer();
    };

    // Add event listeners for both mouse and touch
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    // Add touch listeners with passive set for scroll friendliness when enabled
    canvas.addEventListener('touchstart', handleTouchStart, { passive: allowTouchScroll });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      clearTouchTooltipTimer();
    };
  }, [allowTouchScroll, clockStyle, sessions, size, detectHoveredSession, touchTooltipDelayMs, showTooltip, hideTooltip]);

  return (
    <div ref={containerRef} className="canvas-container" style={{ width: '100%', height: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        onMouseLeave={() => {
          previousHoveredSession.current = null;
          setHoveredSession(null);
        }}
        style={{ touchAction: allowTouchScroll ? 'pan-y' : 'none', width: '100%', height: '100%', cursor: hoveredSession ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent', outline: 'none' }}
      />
      {tooltip ? (
        <Portal>
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              left: tooltip.x + (typeof window !== 'undefined' && tooltip.x > window.innerWidth * 0.5 ? -12 : 12),
              top: tooltip.y + 12,
              transform: `translate(${typeof window !== 'undefined' && tooltip.x > window.innerWidth * 0.5 ? '-100%' : '0%'}, 0%)`,
              zIndex: 1250,
              pointerEvents: 'auto',
            }}
          >
            <SessionArcTooltip
              sessionName={tooltip.name}
              startTime={tooltip.startNY}
              endTime={tooltip.endNY}
              timezone={selectedTimezone}
              arcColor={tooltip.color}
              onClose={hideTooltip}
            />
          </div>
        </Portal>
      ) : null}
    </div>
  );
}

ClockCanvas.propTypes = {
  size: PropTypes.number.isRequired,
  time: PropTypes.instanceOf(Date).isRequired,
  sessions: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    startNY: PropTypes.string,
    endNY: PropTypes.string,
    color: PropTypes.string,
  })).isRequired,
  handColor: PropTypes.string.isRequired,
  clockStyle: PropTypes.string,
  showSessionNamesInCanvas: PropTypes.bool,
  showPastSessionsGray: PropTypes.bool,
  showClockNumbers: PropTypes.bool,
  showClockHands: PropTypes.bool,
  activeSession: PropTypes.object,
  backgroundBasedOnSession: PropTypes.bool,
  renderHandsInCanvas: PropTypes.bool,
  handAnglesRef: PropTypes.shape({
    current: PropTypes.object,
  }),
  allowTouchScroll: PropTypes.bool,
  touchTooltipDelayMs: PropTypes.number,
};
