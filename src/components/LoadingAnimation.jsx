/**
 * src/components/LoadingAnimation.jsx
 * 
 * Purpose: Reusable clock loading animation with rotating donuts
 * Uses GSAP for smooth 60fps animations
 * 
 * Features:
 * - 5 rotating session donuts matching default clock arcs (2 inner AM, 3 outer PM)
 * - Arc lengths proportional to actual session durations on 12-hour face
 * - Colors and radii match SettingsContext default sessions
 * - Automatic cleanup on unmount
 * 
 * Used by:
 * - LoadingScreen.jsx (fullscreen loading)
 * - EventsTimeline2.jsx (drawer loading state)
 * 
 * Changelog:
 * v1.3.1 - 2026-02-07 - Enhanced transparency: lowered arc opacity range (0.45–0.15) for softer, more translucent loading animation
 * v1.3.0 - 2026-02-07 - Updated arcs to match default clock session sizes and colors (5 sessions: NY AM, London inner; NY PM, Market Closed, Asia outer) with correct radii (0.47/0.78), arc lengths, and brand colors from SettingsContext defaults
 * v1.2.0 - 2025-11-30 - Added smooth fade in/out transitions (500ms) with 300ms delay on completion to prevent abrupt jumps
 * v1.1.0 - 2025-11-30 - Removed clock hands (h,m,s), keeping only animated donuts for cleaner look
 * v1.0.0 - 2025-11-30 - Initial extraction from LoadingScreen.jsx for reusability
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * LoadingAnimation Component
 * Displays an animated clock with rotating donuts (no hands)
 * 
 * @param {number} clockSize - Size of the canvas in pixels (default: 375)
 * @param {boolean} isLoading - Whether the animation should be visible (default: true)
 * @returns {JSX.Element} Canvas element with animation
 */
const LoadingAnimation = ({ clockSize = 375, isLoading = true }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const donutsRef = useRef([]);
  const [opacity, setOpacity] = useState(0);
  const [shouldRender, setShouldRender] = useState(true);

  // Handle fade in/out with delay
  useEffect(() => {
    if (isLoading) {
      // Fade in with slight delay
      setShouldRender(true);
      const fadeInTimer = setTimeout(() => {
        setOpacity(1);
      }, 50);
      return () => clearTimeout(fadeInTimer);
    } else {
      // Fade out
      setOpacity(0);
      // Wait for fade out animation + delay before unmounting
      const fadeOutTimer = setTimeout(() => {
        setShouldRender(false);
      }, 800); // 500ms fade + 300ms delay
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldRender) return;

    const ctx = canvas.getContext('2d');
    const size = clockSize;
    const dpr = window.devicePixelRatio || 1;

    // Reset any prior transforms before sizing/scaling to avoid double-scaling artifacts
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2 - 5;

    // Five donuts matching default clock sessions (SettingsContext.jsx)
    // AM sessions (startHour < 12) → inner circle (radius 0.47)
    // PM sessions (startHour >= 12) → outer circle (radius 0.78)
    // Arc lengths proportional to session durations on 12-hour clock face
    // Phase offsets = session start position in degrees (12 o'clock = 0°)
    const donutConfigs = [
      // AM circle (inner) — startHour < 12
      { radius: 0.47, color: '#018786', speed: 1.5, phase: 210, lineWidth: 40, arcLength: (Math.PI * 2) / 3 },  // NY AM (07:00-11:00, 4h = 120°)
      { radius: 0.47, color: '#FF6F91', speed: -1.8, phase: 60, lineWidth: 40, arcLength: Math.PI / 2 },         // London (02:00-05:00, 3h = 90°)
      // PM circle (outer) — startHour >= 12
      { radius: 0.78, color: '#FFA85C', speed: 1.2, phase: 45, lineWidth: 40, arcLength: (Math.PI * 5) / 12 },   // NY PM (13:30-16:00, 2.5h = 75°)
      { radius: 0.78, color: '#8B6CFF', speed: -1.4, phase: 150, lineWidth: 40, arcLength: Math.PI / 6 },        // Market Closed (17:00-18:00, 1h = 30°)
      { radius: 0.78, color: '#4E7DFF', speed: 1.6, phase: 240, lineWidth: 40, arcLength: (Math.PI * 2) / 3 },   // Asia (20:00-00:00, 4h = 120°)
    ];

    // Scale line width based on clock size
    const scaleFactor = size / 375;

    // Initialize donuts animation states
    donutsRef.current = donutConfigs.map((config) => ({
      ...config,
      currentOpacity: 0.45,
      rotation: config.phase,
      lineWidth: Math.round(config.lineWidth * scaleFactor),
    }));

    // Animate each donut - each completes one full rotation in 1.5 seconds
    donutsRef.current.forEach((donut, index) => {
      // Opacity pulsation — gentle transparency pulse for soft, airy feel
      gsap.to(donut, {
        currentOpacity: 0.15,
        duration: 1.5 + index * 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Continuous rotation - all donuts complete one full loop in 1.5 seconds
      // Some clockwise (positive), some counter-clockwise (negative)
      const rotationAmount = donut.speed > 0 ? 360 : -360;
      gsap.fromTo(donut,
        { rotation: donut.phase }, // Start from initial phase
        {
          rotation: donut.phase + rotationAmount,
          duration: 1.5, // One full rotation in 1.5 seconds
          repeat: -1,
          ease: 'none',
        }
      );
    });

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw animated session donuts (2 inner AM + 3 outer PM = 5 total)
      donutsRef.current.forEach((donut) => {
        const radius = baseRadius * donut.radius;
        const rotation = (donut.rotation * Math.PI) / 180;

        // Draw smaller arcs (90 degrees each) to avoid overlap
        ctx.save();
        ctx.globalAlpha = donut.currentOpacity;
        ctx.beginPath();

        const arcLength = donut.arcLength; // 90 degrees (quarter circle)
        ctx.arc(
          centerX,
          centerY,
          radius,
          rotation - Math.PI / 2,
          rotation - Math.PI / 2 + arcLength
        );

        ctx.lineWidth = donut.lineWidth;
        ctx.strokeStyle = donut.color;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gsap.killTweensOf(donutsRef.current);
    };
  }, [clockSize, shouldRender]);

  if (!shouldRender) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        opacity: opacity,
        transition: 'opacity 500ms ease-in-out',
        willChange: 'opacity, transform',
      }}
    />
  );
};

export default LoadingAnimation;
