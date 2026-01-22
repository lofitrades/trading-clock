/**
 * src/components/ClockCanvas.jsx
 *
 * Purpose: Canvas-based analog clock with session arcs, hover detection, and event markers.
 * Renders static background + dynamic session donuts + interactive tooltips.
 *
 * Changelog:
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
import { Portal } from '@mui/material';
import gsap from 'gsap';
import {
  drawStaticElements,
  drawDynamicElements,
  getLineWidthAndHoverArea,
  isColorDark,
  drawClockNumbers
} from '../utils/clockUtils';
import { useSettings } from '../contexts/SettingsContext';
import SessionArcTooltip from './SessionArcTooltip';
import { useTooltipCoordinator } from '../contexts/useTooltipCoordinator';

export default function ClockCanvas({ size, time, sessions, handColor, clockStyle = 'normal', showSessionNamesInCanvas = true, showPastSessionsGray = true, showClockNumbers = true, showClockHands = true, activeSession = null, backgroundBasedOnSession = false, renderHandsInCanvas = true, handAnglesRef = null }) {
  const { selectedTimezone } = useSettings();
  const { openTooltip, closeTooltip: closeGlobalTooltip, isTooltipActive } = useTooltipCoordinator();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredSession, setHoveredSession] = useState(null);
  const staticCanvas = useRef(document.createElement('canvas'));
  const targetDprRef = useRef(1);

  // Animation states for smooth transitions
  const animationStates = useRef({});
  const tooltipRef = useRef(null);
  const previousHoveredSession = useRef(null);
  const tooltipAnimation = useRef(null);

  // Clock hand animation states (shared with overlay when provided)
  const internalHandAngles = useRef({
    hour: 0,
    minute: 0,
    second: 0
  });
  const handAngles = handAnglesRef || internalHandAngles;

  // Initialize animation states for each session
  useEffect(() => {
    sessions.forEach((session, index) => {
      if (!animationStates.current[index]) {
        animationStates.current[index] = {
          lineWidth: 0,
          opacity: 0,
          targetLineWidth: 0,
          targetOpacity: 1
        };

        // Animate session entry with staggered delay
        gsap.to(animationStates.current[index], {
          lineWidth: getLineWidthAndHoverArea(size, clockStyle).lineWidth,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power2.out"
        });
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
    drawStaticElements(staticCtx, size, showSessionNamesInCanvas, handColor);
  }, [size, showSessionNamesInCanvas, handColor]);

  // Animate hover effects
  useEffect(() => {
    const { lineWidth, hoverLineWidth } = getLineWidthAndHoverArea(size, clockStyle);

    sessions.forEach((session, index) => {
      if (!animationStates.current[index]) return;

      const isHovered = session === hoveredSession;
      const targetWidth = isHovered ? hoverLineWidth : lineWidth;

      // Animate line width change on hover
      gsap.to(animationStates.current[index], {
        targetLineWidth: targetWidth,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  }, [hoveredSession, size, sessions, clockStyle]);

  // Animate clock hands smoothly
  useEffect(() => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();

    // Calculate target angles (in degrees for easier math)
    let secondAngle = (seconds + milliseconds / 1000) * 6; // 360/60 = 6 degrees per second
    let minuteAngle = (minutes + seconds / 60) * 6; // Smooth minute hand
    let hourAngle = ((hours % 12) + minutes / 60) * 30; // 360/12 = 30 degrees per hour

    // Handle circular motion for second hand (prevent backward jump at 59->0)
    const currentSecond = handAngles.current.second;
    if (secondAngle < currentSecond && (currentSecond - secondAngle) > 180) {
      // We crossed from 59s to 0s, add 360 to continue forward
      secondAngle += 360;
    }

    // Handle circular motion for minute hand (prevent backward jump at 59->0)
    const currentMinute = handAngles.current.minute;
    if (minuteAngle < currentMinute && (currentMinute - minuteAngle) > 180) {
      minuteAngle += 360;
    }

    // Handle circular motion for hour hand (prevent backward jump at 11->12)
    const currentHour = handAngles.current.hour;
    if (hourAngle < currentHour && (currentHour - hourAngle) > 180) {
      hourAngle += 360;
    }

    // Animate second hand (fast but smooth, linear for constant speed)
    gsap.to(handAngles.current, {
      second: secondAngle,
      duration: 0.3,
      ease: "linear",
      onUpdate: () => {
        // Normalize angle to 0-360 range after animation
        handAngles.current.second = handAngles.current.second % 360;
      }
    });

    // Animate minute hand (medium speed)
    gsap.to(handAngles.current, {
      minute: minuteAngle,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: () => {
        handAngles.current.minute = handAngles.current.minute % 360;
      }
    });

    // Animate hour hand (slow, smooth)
    gsap.to(handAngles.current, {
      hour: hourAngle,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: () => {
        handAngles.current.hour = handAngles.current.hour % 360;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = targetDprRef.current || Math.min(Math.max(window.devicePixelRatio || 1, 1.2), 2.5);

    // Reset transform each time before applying DPR scaling to avoid compounded scaling artifacts
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(staticCanvas.current, 0, 0, size, size);

      // Pass animation states and animated hand angles to draw function
      drawDynamicElements(
        ctx,
        size,
        sessions,
        time,
        hoveredSession,
        handColor,
        clockStyle,
        animationStates.current,
        handAngles.current,
        showSessionNamesInCanvas,
        showPastSessionsGray,
        activeSession,
        backgroundBasedOnSession,
        renderHandsInCanvas,
        renderHandsInCanvas && showClockHands
      );

      // Pass handColor as the text color for the clock numbers and showSessionNamesInCanvas to update immediately on toggle
      if (showClockNumbers) {
        drawClockNumbers(ctx, size / 2, size / 2, size / 2 - 5, handColor, showSessionNamesInCanvas);
      }

      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [size, sessions, hoveredSession, handColor, clockStyle, showSessionNamesInCanvas, showPastSessionsGray, activeSession, backgroundBasedOnSession, showClockNumbers, showClockHands, renderHandsInCanvas, time, handAngles]);

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

  const showTooltip = (clientX, clientY, session) => {
    // Kill any ongoing tooltip animation
    if (tooltipAnimation.current) {
      tooltipAnimation.current.kill();
    }

    const tooltipId = `session-${session.name}`;
    setTooltip({ x: clientX, y: clientY, ...session });
    openTooltip('session', tooltipId); // Register in global coordinator

    // Animate tooltip entrance
    if (tooltipRef.current) {
      tooltipAnimation.current = gsap.fromTo(tooltipRef.current,
        { opacity: 0, scale: 0.96, y: 6 },
        { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power3.out" }
      );
    }
  };

  const hideTooltip = () => {
    // Kill any ongoing tooltip animation
    if (tooltipAnimation.current) {
      tooltipAnimation.current.kill();
    }

    if (tooltipRef.current) {
      tooltipAnimation.current = gsap.to(tooltipRef.current, {
        opacity: 0,
        scale: 0.96,
        y: 6,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          setTooltip(null);
          closeGlobalTooltip('session'); // Close in global coordinator
        }
      });
    } else {
      setTooltip(null);
      closeGlobalTooltip('session'); // Close in global coordinator
    }
  };

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
      if (!canvas.contains(e.target)) {
        previousHoveredSession.current = null;
        setHoveredSession(null);
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
        // Prevent default only when we detect a donut tap
        e.preventDefault();
        previousHoveredSession.current = tapped;
        setHoveredSession(tapped);
        showTooltip(touch.clientX, touch.clientY, tapped);
      } else {
        // Tapped outside - hide tooltip
        previousHoveredSession.current = null;
        setHoveredSession(null);
        hideTooltip();
      }
    };

    // Add event listeners for both mouse and touch
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    // Add touch listener with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [clockStyle, sessions, size, detectHoveredSession]);

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
        style={{ touchAction: 'none', width: '100%', height: '100%', cursor: hoveredSession ? 'pointer' : 'default' }}
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
};
