// src/components/LoadingScreen.jsx
import React, { useEffect, useRef } from 'react';
import { Box, Fade } from '@mui/material';
import gsap from 'gsap';

const LoadingScreen = ({ isLoading, clockSize = 375 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const donutsRef = useRef([]);
  const handsRef = useRef({ hour: 0, minute: 0 });

  useEffect(() => {
    if (!isLoading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

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

    // Animate clock hands - following the donuts timing
    gsap.fromTo(handsRef.current, 
      { hour: 0 }, // Start at 12 o'clock
      {
        hour: 360,
        duration: 1.5, // Match donut rotation duration
        repeat: -1,
        ease: 'none',
      }
    );

    gsap.fromTo(handsRef.current,
      { minute: 0 }, // Start at 12 o'clock
      {
        minute: 360,
        duration: 1.5 / 12, // Move 12x faster
        repeat: -1,
        ease: 'none',
      }
    );

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

      // Draw clock hands
      const drawHand = (angle, length, width, color) => {
        const rad = (angle * Math.PI) / 180 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad) * length,
          centerY + Math.sin(rad) * length
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      // Draw hands with animated angles (no second hand)
      drawHand(handsRef.current.hour, baseRadius * 0.5, 6, '#4B4B4B');
      drawHand(handsRef.current.minute, baseRadius * 0.75, 4, '#4B4B4B');

      // Draw center pin
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4B4B4B';
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gsap.killTweensOf([donutsRef.current, handsRef.current]);
    };
  }, [isLoading, clockSize]);

  return (
    <Fade in={isLoading} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F9F9F9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: 3,
        }}
      >
        <canvas ref={canvasRef} />
        <Box
          sx={{
            fontSize: '1.2rem',
            fontWeight: 500,
            color: '#4B4B4B',
            fontFamily: 'Roboto, sans-serif',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 1 },
            },
          }}
        >
          Loading Time 2 Trade...
        </Box>
      </Box>
    </Fade>
  );
};

export default LoadingScreen;
