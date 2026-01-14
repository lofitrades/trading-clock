/**
 * src/utils/clockUtils.js
 *
 * Purpose: Clock drawing utilities for the Time 2 Trade canvas (static elements, numbers, sessions, and hands).
 * Key responsibility and main functionality: Compute stroke widths and render static/dynamic clock layers with session arcs and labels.
 *
 * Changelog:
 * v1.1.7 - 2026-01-13 - Add normalizeClockSize helper to keep canvas dimensions square-friendly and clamped before rendering.
 * v1.1.6 - 2026-01-08 - Add safety checks to prevent negative radius in drawStaticElements when canvas size is too small.
 * v1.1.5 - 2026-01-08 - Updated clock hands behavior: hour and minute hands always visible, seconds hand controlled by showSecondsHand toggle following enterprise best practices.
 * v1.1.4 - 2026-01-08 - Gray out session donuts that have already ended for the current day.
 * v1.1.3 - 2026-01-07 - Ensure number radius updates correctly when toggling session names on/off and align signature with callers.
 * v1.1.1 - 2026-01-07 - Reduced clock number font size for tighter fit on mobile-first layouts.
 * v1.1.0 - 2025-12-16 - Added file header and removed unused showSessionNamesInCanvas parameter from drawClockNumbers.
 * v1.0.0 - 2025-09-15 - Initial implementation.
 */

export const getLineWidthAndHoverArea = (clockSize, clockStyle = 'normal') => {
    // Base line width for Normal at 50% (375px reference size)
    // Scale proportionally based on current size
    const baseSize = 375;
    
    // Aesthetic style has much thicker donuts (2.5x thicker than normal)
    // Normal: 40px base, Aesthetic: 100px base (at 375px reference)
    // Increased for compact logo-friendly design
    const baseLineWidth = clockStyle === 'aesthetic' ? 100 : 40;
    
    // Calculate proportional line width
    const scaleFactor = clockSize / baseSize;
    const lineWidth = Math.round(baseLineWidth * scaleFactor);
    const hoverLineWidth = Math.round(lineWidth * 1.13); // 13% increase on hover
    
    return { lineWidth, hoverLineWidth };
  };

  export const normalizeClockSize = (size) => {
    if (!Number.isFinite(size)) return 0;
    return Math.max(0, Math.round(size));
  };
  
  export const drawStaticElements = (ctx, size, showSessionNamesInCanvas = false, numbersColor = '#333') => {
    // Safety: Ensure minimum size to prevent negative radius
    if (size < 20) {
      console.warn('[clockUtils] Canvas size too small:', size);
      return;
    }
    
    const centerX = size / 2,
          centerY = size / 2;
    const radius = Math.max(0, Math.min(size, size) / 2 - 5);
  
    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  
    // Draw numbers
    drawClockNumbers(ctx, centerX, centerY, radius, numbersColor, showSessionNamesInCanvas);
  };
  
  export const drawClockNumbers = (ctx, centerX, centerY, radius, textColor, showSessionNamesInCanvas = false) => {
    ctx.font = `${radius * 0.07}px Poppins`; // slightly smaller for tighter fit
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor; // Apply dynamic text color
  
    // When session names are shown, reduce radius significantly to avoid overlap
    let numberRadius;
    numberRadius = showSessionNamesInCanvas ? 0.198 : 0.25;

    for (let num = 1; num <= 12; num++) {
      const angle = ((num * 30) - 90) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * (radius * numberRadius);
      const y = centerY + Math.sin(angle) * (radius * numberRadius);
      ctx.fillText(num.toString(), x, y);
    }
  };
  
  export const drawDynamicElements = (ctx, size, sessions, time, hoveredSession, handColor, clockStyle = 'normal', animationStates = {}, handAngles = null, showSessionNamesInCanvas = true, showPastSessionsGray = true, activeSession = null, backgroundBasedOnSession = false, drawHands = true, showSecondsHand = true) => {
    const centerX = size / 2,
          centerY = size / 2;
    const radius = Math.min(size, size) / 2 - 5;
    ctx.clearRect(
      Math.floor(centerX - radius),
      Math.floor(centerY - radius),
      Math.ceil(radius * 2),
      Math.ceil(radius * 2)
    );
    
    // Skip drawing sessions for minimalistic style
    if (clockStyle !== 'minimalistic') {
      const totalTime = 12 * 60;
      const { lineWidth, hoverLineWidth } = getLineWidthAndHoverArea(size, clockStyle);
      
      // Compute once per frame for consistency and performance
      const nowHours = time.getHours();
      const nowMinutes = time.getMinutes();
      const nowSeconds = time.getSeconds();
      const currentMinutes = nowHours * 60 + nowMinutes + nowSeconds / 60;

      sessions.forEach((kz, index) => {
        if (!kz.startNY || !kz.endNY) return;
        
        // Get animation state for this session
        const animState = animationStates[index] || { 
          lineWidth: lineWidth, 
          opacity: 1, 
          targetLineWidth: lineWidth 
        };
        
        const [startHour, startMinute] = kz.startNY.split(':').map(Number);
        const [endHour, endMinute] = kz.endNY.split(':').map(Number);
        let angleStart = ((startHour % 12) * 60 + startMinute) / totalTime * Math.PI * 2;
        let angleEnd = ((endHour % 12) * 60 + endMinute) / totalTime * Math.PI * 2;
        if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
          angleEnd += Math.PI * 2;
        }
        const isInnerSession = startHour < 12;
        const isXsViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 599px)').matches;
        const innerRadius = radius * 0.47;
        const outerRadius = radius * (isXsViewport ? 0.78 : 0.78);
        const targetRadius = isInnerSession ? innerRadius : outerRadius;

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        const crossesMidnight = startMinutes > endMinutes;
        const sessionActive = activeSession && kz.name === activeSession.name;
        const isSessionPast = !showPastSessionsGray
          ? false
          : (!sessionActive && (
            crossesMidnight
              ? currentMinutes >= endMinutes && currentMinutes < startMinutes
              : currentMinutes >= endMinutes
          ));
        const isSessionPastGray = showPastSessionsGray && isSessionPast;
        
        // Use animated line width with smooth interpolation
        const currentWidth = animState.targetLineWidth || (kz === hoveredSession ? hoverLineWidth : lineWidth);
        
        // Apply opacity for fade-in effect
        ctx.save();
        ctx.globalAlpha = animState.opacity || 1;
        
        // Calculate angular compensation for round cap at the end
        // Round cap extends as a semicircle with radius = lineWidth/2
        const capRadius = currentWidth / 2;
        const angularCompensation = capRadius / targetRadius; // radians
        
        // Use exact angles - manual caps will be positioned precisely
        const adjustedAngleStart = angleStart;
        const adjustedAngleEnd = angleEnd;
        
        // Only draw if the session is long enough to show after compensation
        if (adjustedAngleEnd > adjustedAngleStart) {
          // Check if this is the active session and calculate progress
          const isActiveSession = sessionActive;
          let currentAngle = null;
          
          if (isActiveSession) {
            // Calculate current time angle for progress tracking
            // Convert to minutes within the 12-hour cycle (0-719)
            const currentTimeInMinutes = (nowHours % 12) * 60 + nowMinutes + nowSeconds / 60;
            
            // Convert to angle (0 to 2π) matching the session arc calculation
            currentAngle = (currentTimeInMinutes / totalTime) * Math.PI * 2;
            
            // Handle sessions that cross midnight
            if (angleEnd > Math.PI * 2) {
              // Session crosses midnight, already adjusted in angleEnd calculation
              // If current time is in the early morning (before session end on next day)
              if (currentAngle < (angleEnd - Math.PI * 2)) {
                // We're in the continuation part (next day), add 2π to current angle
                currentAngle += Math.PI * 2;
              }
            }
            
            // Step 1: Draw the full session donut (original session color) as base
            const compensatedStartAngle = adjustedAngleStart + angularCompensation;
            const compensatedEndAngle = adjustedAngleEnd - angularCompensation;
            
            // Color logic based on backgroundBasedOnSession setting
            let baseColor, progressColor;
            if (backgroundBasedOnSession && isActiveSession) {
              // Background enabled: dark base, light progress
              baseColor = darkenColor(kz.color, 15);
              progressColor = lightenColor(kz.color, 60);
            } else {
              // Background disabled: INVERTED - light base, original color progress
              baseColor = lightenColor(kz.color, 60);
              progressColor = kz.color;
            }
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, compensatedStartAngle - Math.PI / 2, compensatedEndAngle - Math.PI / 2);
            ctx.lineWidth = currentWidth;
            ctx.strokeStyle = baseColor;
            ctx.lineCap = 'round'; // Round caps with compensation for precise alignment
            ctx.stroke();
            ctx.restore();
            
            // Step 2: Draw the progress donut on top
            // Only if we're past the start of the session
            if (currentAngle > adjustedAngleStart) {
              const progressEnd = Math.min(currentAngle, adjustedAngleEnd);
              
              // Calculate the angular span of the progress
              const progressSpan = progressEnd - adjustedAngleStart;
              
              // Determine if we need to draw the start cap, the arc, or both
              if (progressSpan > 0) {
                ctx.save();
                
                // Draw the start cap progressively as an arc
                // The cap grows from the back edge (at start position) clockwise
                const capRadius = currentWidth / 2;
                
                // Calculate how much of the start cap should be visible based on progress
                const maxCapSpan = angularCompensation * 2; // Full cap span
                const progressRatio = progressSpan / maxCapSpan;
                // Start from 25%, grow to 52%, then jump to 100%
                const startCapProgress = progressRatio < 0.52 
                  ? 0.25 + (progressRatio * 0.22 / 0.52) // 25% + grow to 52%
                  : 1.0; // Jump to full circle at 52%
                
                // Move the cap center forward along the arc by the angular cap compensation
                const capCenterAngle = (adjustedAngleStart + angularCompensation) - Math.PI / 2;
                const startCapX = centerX + Math.cos(capCenterAngle) * targetRadius;
                const startCapY = centerY + Math.sin(capCenterAngle) * targetRadius;
                
                // Calculate the angle relative to the cap's center
                // Start from the back (pointing toward session start) and grow clockwise
                const capBackAngle = adjustedAngleStart - Math.PI / 2; // Points back to session start
                const capDirection = capBackAngle + Math.PI; // Direction from cap center to session start
                const capArcStart = capDirection; // Start from back
                const capArcEnd = capDirection + (Math.PI * 2 * startCapProgress); // Grow clockwise to 50%
                
                if (startCapProgress > 0) {
                  ctx.beginPath();
                  ctx.arc(startCapX, startCapY, capRadius, capArcStart, capArcEnd);
                  ctx.fillStyle = progressColor;
                  ctx.fill();
                }
                
                // Draw the main arc only after the start cap reaches 52%
                // This prevents the arc from appearing before the start cap is fully formed
                // (startCapProgress is already calculated above)
                
                // Only draw the arc if the start cap has reached 52% (fully formed)
                if (startCapProgress >= 0.52) {
                  const arcStart = adjustedAngleStart + angularCompensation;
                  
                  // Compensate for the round cap extension by pulling back the arc end
                  const arcEnd = progressEnd >= adjustedAngleEnd 
                    ? adjustedAngleEnd - angularCompensation 
                    : progressEnd - angularCompensation; // Compensate for round cap radius
                  
                  if (arcEnd >= arcStart) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, targetRadius, arcStart - Math.PI / 2, arcEnd - Math.PI / 2);
                    ctx.lineWidth = currentWidth;
                    ctx.strokeStyle = progressColor;
                    ctx.lineCap = 'round'; // Always use round caps at the end
                    ctx.stroke();
                  }
                }
                
                ctx.restore();
              }
            }
          } else {
            // Draw normal session (not active) with compensated round caps
            // ENTERPRISE SOLUTION: Compensate angles for round cap extensions
            const compensatedStartAngle = adjustedAngleStart + angularCompensation;
            const compensatedEndAngle = adjustedAngleEnd - angularCompensation;
            
            ctx.save();
            
            // Draw main arc with round caps
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, compensatedStartAngle - Math.PI / 2, compensatedEndAngle - Math.PI / 2);
            ctx.lineWidth = currentWidth;
            ctx.strokeStyle = isSessionPastGray ? '#9e9e9e' : kz.color;
            ctx.lineCap = 'round'; // Round caps with compensation for precise alignment
            ctx.stroke();
            
            ctx.restore();
          }
          
          // Draw session name along the arc following the donut curve (if enabled)
          if (showSessionNamesInCanvas) {
            const sessionName = kz.name || '';
            
            if (sessionName) {
              ctx.save();
              
              // Font size based on donut width
              const fontSize = Math.max(9, Math.min(currentWidth * 0.45, 13));
              ctx.font = `${fontSize}px Poppins`;
              
              // Use donut color for text
              ctx.fillStyle = isSessionPastGray ? '#9e9e9e' : kz.color;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Position text: inner donuts (AM) on inner curve, outer donuts (PM) on outer curve
              const isInnerDonut = isInnerSession;
              const maxTextRadius = radius - Math.max(fontSize * 0.6, currentWidth * 0.1); // Keep text inside canvas bounds
              const textRadius = isInnerDonut
                ? Math.max(targetRadius - currentWidth / 2 - fontSize * 1.1, fontSize * 2)  // Inner curve for AM
                : Math.min(targetRadius + currentWidth / 2 + fontSize * 1.1, maxTextRadius); // Outer curve for PM (clamped)
              
              // Calculate middle angle of the arc for centering
              const middleAngle = (adjustedAngleStart + adjustedAngleEnd) / 2;
              
              // Letter spacing (15% of font size)
              const letterSpacing = fontSize * 0.15;
              
              // Calculate total text width with spacing
              let totalWidth = 0;
              for (let i = 0; i < sessionName.length; i++) {
                totalWidth += ctx.measureText(sessionName[i]).width + (i < sessionName.length - 1 ? letterSpacing : 0);
              }
              
              // Convert total width to angular width
              const totalAngle = totalWidth / textRadius;
              const startTextAngle = middleAngle - totalAngle / 2;
              
              // Draw each character along the arc
              let currentAngle = startTextAngle;
              for (let i = 0; i < sessionName.length; i++) {
                const char = sessionName[i];
                const charWidth = ctx.measureText(char).width;
                const charAngle = charWidth / (2 * textRadius);
                
                // Position for this character
                const angle = currentAngle + charAngle;
                const x = centerX + Math.cos(angle - Math.PI / 2) * textRadius;
                const y = centerY + Math.sin(angle - Math.PI / 2) * textRadius;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle); // Rotate character to follow arc
                ctx.fillText(char, 0, 0);
                ctx.restore();
                
                // Move to next character position (include letter spacing)
                currentAngle += (charWidth + letterSpacing) / textRadius;
              }
              
              ctx.restore();
            }
          }
        }
        
        ctx.restore();
      });
    }
    if (drawHands) {
      // Draw clock hands using handColor prop
      // Hour and minute hands always visible; seconds hand controlled by showSecondsHand
      const hours = time.getHours();
      const isXsViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 599px)').matches;
      const innerRadius = radius * 0.47;
      const outerRadius = radius * (isXsViewport ? 0.8 : 0.78);
      const drawHand = (angle, length, width, color) => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle - Math.PI / 2) * length,
          centerY + Math.sin(angle - Math.PI / 2) * length
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.stroke();
      };
      
      // Use animated angles if available, otherwise calculate instantly
      if (handAngles) {
        // Convert animated degrees to radians
        const hourAngle = handAngles.hour * Math.PI / 180;
        const minuteAngle = handAngles.minute * Math.PI / 180;
        const secondAngle = handAngles.second * Math.PI / 180;
        
        const isPm = hours >= 12;
        const hourLength = isPm ? outerRadius : innerRadius;
        const maxHandLength = radius - 4; // keep within canvas bounds
        const minuteLength = Math.min(maxHandLength, outerRadius * 0.95);
        const secondLength = Math.min(maxHandLength, outerRadius + radius);
        
        // Always draw hour and minute hands
        drawHand(hourAngle, hourLength, 6, handColor);
        drawHand(minuteAngle, minuteLength, 3, handColor);
        
        // Only draw seconds hand if enabled
        if (showSecondsHand) {
          drawHand(secondAngle, secondLength, 1, handColor);
        }
      } else {
        // Fallback to instant positioning (for backward compatibility)
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();
        const hourAngle = ((hours % 12) * 30 + minutes * 0.5) * Math.PI / 180;
        const isPm = hours >= 12;
        const hourLength = isPm ? outerRadius : innerRadius;
        const maxHandLength = radius - 4;
        const minuteLength = Math.min(maxHandLength, outerRadius * 0.95);
        const secondLength = Math.min(maxHandLength, outerRadius + radius * 0.08);
        
        // Always draw hour and minute hands
        drawHand(hourAngle, hourLength, 6, handColor);
        const minuteAngle = (minutes * 6) * Math.PI / 180;
        drawHand(minuteAngle, minuteLength, 3, handColor);
        
        // Only draw seconds hand if enabled
        if (showSecondsHand) {
          const secondAngle = (seconds * 6) * Math.PI / 180;
          drawHand(secondAngle, secondLength, 1, handColor);
        }
      }
      
      // Draw center pin/cap that holds the hands
      // Pin diameter = hour hand width (6px) → radius = 3px
      const pinRadius = 3;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = handColor;
      ctx.fill();
    }
  };
  
  
export const isColorDark = (color) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

// Lighten a color by a given percentage (0-100)
export const lightenColor = (color, percent = 40) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Blend with white to lighten
  const newR = Math.round(r + (255 - r) * (percent / 100));
  const newG = Math.round(g + (255 - g) * (percent / 100));
  const newB = Math.round(b + (255 - b) * (percent / 100));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const darkenColor = (color, percent = 40) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Blend with black to darken
  const newR = Math.round(r * (1 - percent / 100));
  const newG = Math.round(g * (1 - percent / 100));
  const newB = Math.round(b * (1 - percent / 100));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}h:${m}m:${s}s`;
};
  