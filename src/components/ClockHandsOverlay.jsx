/**
 * src/components/ClockHandsOverlay.jsx
 *
 * Purpose: Draw clock hands on a dedicated overlay canvas with higher stacking order.
 * Enables separate z-layer control to keep hands above event markers while retaining smooth animation.
 *
 * Changelog:
 * v1.0.1 - 2025-12-09 - Stabilized animation by decoupling render loop from per-second time updates (uses refs instead of recreating the loop).
 * v1.0.0 - 2025-12-09 - Initial extraction of hour/minute/second hands to overlay canvas with DPR scaling.
 */

import { useEffect, useRef } from 'react';

export default function ClockHandsOverlay({ size, handAnglesRef, handColor, time }) {
  const canvasRef = useRef(null);
  const timeRef = useRef(time);

  // Keep latest time without restarting the render loop
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');

    const setupCanvas = () => {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = Math.min(size, size) / 2 - 5;

      const angles = handAnglesRef?.current || { hour: 0, minute: 0, second: 0 };
      const hours = timeRef.current?.getHours?.() ?? 0;
      const hourLength = hours >= 12 ? radius * 0.74 : radius * 0.5;

      const drawHand = (deg, length, width) => {
        const angle = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle - Math.PI / 2) * length,
          centerY + Math.sin(angle - Math.PI / 2) * length
        );
        ctx.strokeStyle = handColor;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      drawHand(angles.hour, hourLength, 6);
      drawHand(angles.minute, radius * 0.9, 3);
      drawHand(angles.second, radius * 1, 1);

      // Center pin
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = handColor;
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };

    setupCanvas();
    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [size, handAnglesRef, handColor]);

  return (
    <canvas
      ref={canvasRef}
      className="clock-hands-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}
    />
  );
}