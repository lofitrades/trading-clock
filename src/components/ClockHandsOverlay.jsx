/**
 * src/components/ClockHandsOverlay.jsx
 *
 * Purpose: Draw clock hands on a dedicated overlay canvas with higher stacking order.
 * Enables separate z-layer control to keep hands above event markers while retaining smooth animation.
 *
 * Changelog:
 * v1.0.6 - 2026-01-28 - BEP THEME-AWARE: Clock hands now adapt to light/dark mode. Uses theme.palette.mode to determine hand color: light hands (#E0E0E0) on dark mode, dark hands (#0F172A) on light mode. Ignores passed handColor prop in favor of theme-aware color for automatic contrast and accessibility. Improves UX by ensuring hands remain visible regardless of background color or theme preference.
 * v1.0.5 - 2026-01-08 - Add showSecondsHand prop to conditionally render seconds hand; hour/minute always visible (enterprise best practice).
 * v1.0.4 - 2026-01-07 - Track handColor in ref to stabilize dependencies; minimize animation loop restarts and improve canvas rendering performance.
 * v1.0.3 - 2026-01-06 - Remove sub-second interpolation to reduce render overhead; rely on upstream hand angles for smooth but lightweight motion.
 * v1.0.1 - 2025-12-09 - Stabilized animation by decoupling render loop from per-second time updates (uses refs instead of recreating the loop).
 * v1.0.0 - 2025-12-09 - Initial extraction of hour/minute/second hands to overlay canvas with DPR scaling.
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';

export default function ClockHandsOverlay({ size, handAnglesRef, handColor, time, showSecondsHand = true }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const timeRef = useRef(time);
  const handColorRef = useRef(handColor);
  const showSecondsHandRef = useRef(showSecondsHand);
  const animationIdRef = useRef(null);

  // Determine theme-aware hand color: light hands on dark mode, dark hands on light mode
  const themeAwareHandColor = theme.palette.mode === 'dark' ? '#E0E0E0' : '#0F172A';

  // Enterprise: track prop changes in refs to avoid restarting animation loop
  // Only size change triggers canvas rebuild and effect re-run
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    handColorRef.current = themeAwareHandColor;
  }, [themeAwareHandColor]);

  useEffect(() => {
    showSecondsHandRef.current = showSecondsHand;
  }, [showSecondsHand]);

  // Setup canvas and animation loop: only restart on size change (canvas rebuild)
  // time, handColor, and handAnglesRef tracked via refs to avoid loop restarts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = Math.min(size, size) / 2 - 5;

      const angles = handAnglesRef?.current || { hour: 0, minute: 0, second: 0 };
      const hours = timeRef.current?.getHours?.() ?? 0;
      const isXsViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 599px)').matches;
      const innerRadius = radius * 0.47;
      const outerRadius = radius * (isXsViewport ? 0.78 : 0.78);
      const hourLength = hours >= 12 ? outerRadius : innerRadius;
      const maxHandLength = radius - 4;
      const minuteLength = radius - 20;
      const secondLength = Math.min(maxHandLength, outerRadius + radius);

      const drawHand = (deg, length, width) => {
        const angle = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle - Math.PI / 2) * length,
          centerY + Math.sin(angle - Math.PI / 2) * length
        );
        ctx.strokeStyle = handColorRef.current;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      drawHand(angles.hour, hourLength, 6);
      drawHand(angles.minute, minuteLength, 3);
      if (showSecondsHandRef.current) {
        drawHand(angles.second, secondLength, 1);
      }

      // Center pin
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = handColorRef.current;
      ctx.fill();

      animationIdRef.current = requestAnimationFrame(draw);
    };

    setupCanvas();
    draw();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className="clock-hands-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, width: '100%', height: '100%' }}
    />
  );
}

ClockHandsOverlay.propTypes = {
  size: PropTypes.number.isRequired,
  handAnglesRef: PropTypes.shape({
    current: PropTypes.shape({
      hour: PropTypes.number,
      minute: PropTypes.number,
      second: PropTypes.number,
    })
  }),
  handColor: PropTypes.string.isRequired,
  time: PropTypes.instanceOf(Date).isRequired,
  showSecondsHand: PropTypes.bool,
};