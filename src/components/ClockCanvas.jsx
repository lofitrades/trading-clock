// src/components/ClockCanvas.jsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  drawStaticElements, 
  drawDynamicElements, 
  getLineWidthAndHoverArea, 
  isColorDark,
  drawClockNumbers,
  lightenColor
} from '../utils/clockUtils';

export default function ClockCanvas({ size, time, sessions, handColor, clockStyle = 'normal', showSessionNamesInCanvas = true, activeSession = null, backgroundBasedOnSession = false }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredSession, setHoveredSession] = useState(null);
  const staticCanvas = useRef(document.createElement('canvas'));
  
  // Animation states for smooth transitions
  const animationStates = useRef({});
  const tooltipRef = useRef(null);
  const previousHoveredSession = useRef(null);
  const tooltipAnimation = useRef(null);
  
  // Clock hand animation states
  const handAngles = useRef({
    hour: 0,
    minute: 0,
    second: 0
  });

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
    const dpr = window.devicePixelRatio || 1;
    const staticCtx = staticCanvas.current.getContext('2d');
    staticCanvas.current.width = Math.round(size * dpr);
    staticCanvas.current.height = Math.round(size * dpr);
    staticCtx.scale(dpr, dpr);
    drawStaticElements(staticCtx, size, showSessionNamesInCanvas, clockStyle);
  }, [size, showSessionNamesInCanvas, clockStyle]);

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
  }, [time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

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
        activeSession,
        backgroundBasedOnSession
      );
      
      // Pass handColor as the text color for the clock numbers and clockStyle
      drawClockNumbers(ctx, size / 2, size / 2, size / 2 - 5, handColor, clockStyle);
  
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [size, sessions, time, hoveredSession, handColor, clockStyle]);

  const detectHoveredSession = (canvas, mouseX, mouseY) => {
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
  };

  const showTooltip = (clientX, clientY, session) => {
    // Kill any ongoing tooltip animation
    if (tooltipAnimation.current) {
      tooltipAnimation.current.kill();
    }
    
    setTooltip({ x: clientX, y: clientY, ...session });
    
    // Animate tooltip entrance
    if (tooltipRef.current) {
      tooltipAnimation.current = gsap.fromTo(tooltipRef.current, 
        { opacity: 0, scale: 0.8, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "back.out(1.7)" }
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
        scale: 0.8,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => setTooltip(null)
      });
    } else {
      setTooltip(null);
    }
  };

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
      
      if (hovered) {
        showTooltip(e.clientX, e.clientY, hovered);
      } else {
        hideTooltip();
      }
    } else if (hovered && tooltip) {
      // Just update tooltip position without re-animating
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
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
        hideTooltip();
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
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    // Add touch listener with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [clockStyle, sessions, size]);

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          previousHoveredSession.current = null;
          setHoveredSession(null);
          hideTooltip();
        }}
        style={{ touchAction: 'none' }}
      />
      {tooltip && (
        <div 
          ref={tooltipRef}
          className="tooltip" 
          style={{ 
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            backgroundColor: tooltip.color,
            color: isColorDark(tooltip.color) ? '#fff' : '#000'
          }}
        >
          <strong>{tooltip.name}</strong>
          <div>Start: {tooltip.startNY}</div>
          <div>End: {tooltip.endNY}</div>
        </div>
      )}
    </div>
  );
}
