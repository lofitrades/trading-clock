/**
 * src/components/LoadingAnimation.jsx
 * 
 * Purpose: Reusable clock loading animation with rotating donuts
 * Uses GSAP for smooth 60fps animations
 * 
 * Features:
 * - 4 rotating quarter-circle donuts (2 inner AM, 2 outer PM)
 * - Opacity pulsation for visual interest
 * - Scalable clock size via props
 * - Automatic cleanup on unmount
 * 
 * Used by:
 * - LoadingScreen.jsx (fullscreen loading)
 * - EventsTimeline2.jsx (drawer loading state)
 * 
 * Changelog:
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
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2 - 5;

    // Four donuts - two per arc (AM and PM circles)
    // Each donut is 90 degrees (quarter circle) with offset phases to avoid overlap
    const donutConfigs = [
      // AM circle (inner) - two donuts
      { radius: 0.52, color: '#A8D8B9', speed: 1.5, phase: 0, lineWidth: 30, arcLength: Math.PI / 2 },
      { radius: 0.52, color: '#D1B2E1', speed: -1.8, phase: 180, lineWidth: 30, arcLength: Math.PI / 2 },
      // PM circle (outer) - two donuts
      { radius: 0.75, color: '#A7C7E7', speed: 1.2, phase: 90, lineWidth: 30, arcLength: Math.PI / 2 },
      { radius: 0.75, color: '#F8C8D1', speed: -1.4, phase: 270, lineWidth: 30, arcLength: Math.PI / 2 },
    ];

    // Scale line width based on clock size
    const scaleFactor = size / 375;
    
    // Initialize donuts animation states
    donutsRef.current = donutConfigs.map((config) => ({
      ...config,
      currentOpacity: 0.8,
      rotation: config.phase,
      lineWidth: Math.round(config.lineWidth * scaleFactor),
    }));

    // Animate each donut - each completes one full rotation in 1.5 seconds
    donutsRef.current.forEach((donut, index) => {
      // Opacity pulsation
      gsap.to(donut, {
        currentOpacity: 0.4,
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

      // Draw animated donuts (2 per arc = 4 total)
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
      }}
    />
  );
};

export default LoadingAnimation;
