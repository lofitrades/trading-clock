// src/utils/clockUtils.js
export const getLineWidthAndHoverArea = (clockSize, clockStyle = 'normal') => {
    // Base line width for Normal at 50% (375px reference size)
    // Scale proportionally based on current size
    const baseSize = 375;
    
    // Aesthetic style has much thicker donuts (2.67x thicker than normal)
    // Normal: 30px base, Aesthetic: 80px base (at 375px reference)
    const baseLineWidth = clockStyle === 'aesthetic' ? 80 : 30;
    
    // Calculate proportional line width
    const scaleFactor = clockSize / baseSize;
    const lineWidth = Math.round(baseLineWidth * scaleFactor);
    const hoverLineWidth = Math.round(lineWidth * 1.13); // 13% increase on hover
    
    return { lineWidth, hoverLineWidth };
  };
  
  export const drawStaticElements = (ctx, size, showSessionNamesInCanvas = false, clockStyle = 'normal') => {
    const centerX = size / 2,
          centerY = size / 2;
    const radius = Math.min(size, size) / 2 - 5;
  
    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  
    // Draw numbers
    drawClockNumbers(ctx, centerX, centerY, radius, '#333', clockStyle, showSessionNamesInCanvas);
  };
  
  export const drawClockNumbers = (ctx, centerX, centerY, radius, textColor, clockStyle = 'normal', showSessionNamesInCanvas = false) => {
    ctx.font = `${radius * 0.085}px Roboto`; // change this to make it more aesthetic
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor; // Apply dynamic text color
  
    // Use larger radius for minimalistic style (0.5)
    // When session names are shown, reduce radius significantly to avoid overlap
    // Otherwise use default (0.31)
    let numberRadius;
    if (clockStyle === 'minimalistic') {
      numberRadius = 0.5;
    } else if (clockStyle === 'aesthetic') {
      numberRadius = 0.18; 
    } else {
      numberRadius = 0.29;
    }
  
    for (let num = 1; num <= 12; num++) {
      const angle = ((num * 30) - 90) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * (radius * numberRadius);
      const y = centerY + Math.sin(angle) * (radius * numberRadius);
      ctx.fillText(num.toString(), x, y);
    }
  };
  
  export const drawDynamicElements = (ctx, size, sessions, time, hoveredSession, handColor, clockStyle = 'normal', animationStates = {}, handAngles = null, showSessionNamesInCanvas = true, activeSession = null, backgroundBasedOnSession = false) => {
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
        const targetRadius = startHour < 12 ? radius * 0.52 : radius * 0.75;
        
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
          const isActiveSession = activeSession && kz.name === activeSession.name;
          let currentAngle = null;
          
          if (isActiveSession) {
            // Calculate current time angle for progress tracking
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const seconds = time.getSeconds();
            
            // Convert to minutes within the 12-hour cycle (0-719)
            const currentTimeInMinutes = (hours % 12) * 60 + minutes + seconds / 60;
            
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
            ctx.strokeStyle = kz.color;
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
              ctx.font = `${fontSize}px Roboto`;
              
              // Use donut color for text
              ctx.fillStyle = kz.color;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Position text: inner donuts (AM) on inner curve, outer donuts (PM) on outer curve
              const isInnerDonut = targetRadius === radius * 0.52; // AM sessions
              const textRadius = isInnerDonut 
                ? targetRadius - currentWidth / 2 - fontSize * 1.5  // Inner curve for AM (more pronounced curve + spacing)
                : targetRadius + currentWidth / 2 + fontSize * 1.2; // Outer curve for PM (more spacing)
              
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
    // Draw clock hands using handColor prop
    const hours = time.getHours();
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
      
      const hourLength = hours >= 12 ? radius * 0.74 : radius * 0.5;
      drawHand(hourAngle, hourLength, 6, handColor);
      drawHand(minuteAngle, radius * 0.9, 3, handColor);
      drawHand(secondAngle, radius * 1, 1, handColor);
    } else {
      // Fallback to instant positioning (for backward compatibility)
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();
      const hourAngle = ((hours % 12) * 30 + minutes * 0.5) * Math.PI / 180;
      const hourLength = hours >= 12 ? radius * 0.74 : radius * 0.5;
      drawHand(hourAngle, hourLength, 6, handColor);
      const minuteAngle = (minutes * 6) * Math.PI / 180;
      drawHand(minuteAngle, radius * 0.9, 3, handColor);
      const secondAngle = (seconds * 6) * Math.PI / 180;
      drawHand(secondAngle, radius * 1, 1, handColor);
    }
    
    // Draw center pin/cap that holds the hands
    // Pin diameter = hour hand width (6px) → radius = 3px
    const pinRadius = 3;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, pinRadius, 0, Math.PI * 2);
    ctx.fillStyle = handColor;
    ctx.fill();
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
};  export const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}h:${m}m:${s}s`;
  };
  