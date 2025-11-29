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
  
  export const drawStaticElements = (ctx, size) => {
    const centerX = size / 2,
          centerY = size / 2;
    const radius = Math.min(size, size) / 2 - 5;
  
    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  
    // Draw numbers
    drawClockNumbers(ctx, centerX, centerY, radius);
  };
  
  export const drawClockNumbers = (ctx, centerX, centerY, radius, textColor, clockStyle = 'normal') => {
    ctx.font = `${radius * 0.085}px Roboto`; // change this to make it more aesthetic
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor; // Apply dynamic text color
  
    // Use larger radius for minimalistic style (0.5), smaller for others (0.31)
    const numberRadius = clockStyle === 'minimalistic' ? 0.5 : 0.31;
  
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
        
        // Enterprise solution: Use round caps but compensate for the extension
        // Calculate the angular compensation needed for round caps
        // The round cap extends by lineWidth/2 at each end
        const angularCompensation = (currentWidth / 2) / targetRadius;
        
        // Adjust angles inward to compensate for round cap extension
        const adjustedAngleStart = angleStart + angularCompensation;
        const adjustedAngleEnd = angleEnd - angularCompensation;
        
        // Only draw if the session is long enough to show after compensation
        if (adjustedAngleEnd > adjustedAngleStart) {
          // Check if this is the active session and calculate progress
          const isActiveSession = activeSession && kz.name === activeSession.name;
          let currentAngle = null;
          
          if (isActiveSession) {
            // Calculate current hour hand angle for progress tracking
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const seconds = time.getSeconds();
            const currentTimeInMinutes = (hours % 12) * 60 + minutes + seconds / 60;
            currentAngle = (currentTimeInMinutes / totalTime) * Math.PI * 2;
            
            // Define merge zone size (in radians) for smooth transition
            const mergeZoneSize = angularCompensation * 2; // Double the compensation for smooth blend
            
            // Draw remaining portion (original color) FIRST - with round cap at the end
            if (currentAngle < adjustedAngleEnd) {
              const remainingAngleStart = Math.max(currentAngle, adjustedAngleStart);
              
              // Add compensation to the start to leave space for merge
              const remainingAdjustedStart = remainingAngleStart + angularCompensation;
              
              if (remainingAdjustedStart < adjustedAngleEnd) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, targetRadius, remainingAdjustedStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
                ctx.lineWidth = currentWidth;
                ctx.strokeStyle = kz.color;
                ctx.lineCap = 'round'; // Keep the round cap at the end
                ctx.stroke();
                ctx.restore();
              }
            }
            
            // Draw merge/gradient zone between passed and remaining
            if (currentAngle > adjustedAngleStart && currentAngle < adjustedAngleEnd) {
              const mergeStart = currentAngle - mergeZoneSize / 2;
              const mergeEnd = currentAngle + mergeZoneSize / 2;
              
              // Create gradient from light to dark
              const lightColor = lightenColor(kz.color, 60);
              const darkColor = kz.color;
              
              // Calculate gradient positions in canvas coordinates
              const gradientStartAngle = mergeStart - Math.PI / 2;
              const gradientEndAngle = mergeEnd - Math.PI / 2;
              const gradientStartX = centerX + Math.cos(gradientStartAngle) * targetRadius;
              const gradientStartY = centerY + Math.sin(gradientStartAngle) * targetRadius;
              const gradientEndX = centerX + Math.cos(gradientEndAngle) * targetRadius;
              const gradientEndY = centerY + Math.sin(gradientEndAngle) * targetRadius;
              
              // Create linear gradient
              const gradient = ctx.createLinearGradient(gradientStartX, gradientStartY, gradientEndX, gradientEndY);
              gradient.addColorStop(0, lightColor);
              gradient.addColorStop(1, darkColor);
              
              // Draw the merge zone with round cap
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, targetRadius, mergeStart - Math.PI / 2, mergeEnd - Math.PI / 2);
              ctx.lineWidth = currentWidth;
              ctx.strokeStyle = gradient;
              ctx.lineCap = 'round';
              ctx.stroke();
              ctx.restore();
            }
            
            // Draw passed portion (lighter color) ON TOP - stops before the merge zone
            if (currentAngle > adjustedAngleStart) {
              const passedAngleEnd = Math.min(currentAngle, adjustedAngleEnd);
              
              // Subtract compensation so it stops before the merge zone
              const passedAdjustedEnd = passedAngleEnd - angularCompensation;
              
              if (passedAdjustedEnd > adjustedAngleStart) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, passedAdjustedEnd - Math.PI / 2);
                ctx.lineWidth = currentWidth;
                ctx.strokeStyle = lightenColor(kz.color, 60); // 60% lighter
                ctx.lineCap = 'round'; // Round cap at the start
                ctx.stroke();
                ctx.restore();
              }
            }
          } else {
            // Draw normal session (not active)
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
            ctx.lineWidth = currentWidth;
            ctx.strokeStyle = kz.color;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
          
          // TradingView-inspired active session enhancement when background matches
          if (backgroundBasedOnSession && activeSession && kz.name === activeSession.name) {
            const isDark = isColorDark(kz.color);
            
            // Layer 1: Subtle outer glow/shadow for depth (TradingView style)
            ctx.save();
            ctx.shadowColor = 'rgba(255,255,255,0.3)';
            ctx.shadowBlur = currentWidth * 0.4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
            ctx.lineWidth = currentWidth + 6; // Slightly wider for glow effect
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
            
            // Layer 2: Crisp border outline (TradingView's sharp contrast)
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
            ctx.lineWidth = currentWidth + 3; // 1.5px border on each side
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
            
            // Layer 3: Inner highlight for 3D effect (top half lighter)
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
            ctx.lineWidth = currentWidth * 0.3;
            
            // Create gradient for 3D highlight
            const highlightGradient = ctx.createLinearGradient(
              centerX, centerY - targetRadius, 
              centerX, centerY + targetRadius
            );
            highlightGradient.addColorStop(0, isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)');
            highlightGradient.addColorStop(0.5, 'rgba(255,255,255,0)');
            highlightGradient.addColorStop(1, isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.15)');
            
            ctx.strokeStyle = highlightGradient;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
            
            // Layer 4: Redraw the session progress with enhanced contrast
            if (isActiveSession && currentAngle) {
              // Redraw remaining portion FIRST (dark, with round cap at the end)
              if (currentAngle < adjustedAngleEnd) {
                const remainingAngleStart = Math.max(currentAngle, adjustedAngleStart);
                const remainingAdjustedStart = remainingAngleStart + angularCompensation;
                
                if (remainingAdjustedStart < adjustedAngleEnd) {
                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, targetRadius, remainingAdjustedStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
                  ctx.lineWidth = currentWidth;
                  ctx.strokeStyle = kz.color;
                  ctx.lineCap = 'round'; // Keep round cap at the end
                  ctx.stroke();
                  ctx.restore();
                }
              }
              
              // Redraw merge zone
              if (currentAngle > adjustedAngleStart && currentAngle < adjustedAngleEnd) {
                const mergeZoneSize = angularCompensation * 2;
                const mergeStart = currentAngle - mergeZoneSize / 2;
                const mergeEnd = currentAngle + mergeZoneSize / 2;
                
                const lightColor = lightenColor(kz.color, 60);
                const darkColor = kz.color;
                
                const gradientStartAngle = mergeStart - Math.PI / 2;
                const gradientEndAngle = mergeEnd - Math.PI / 2;
                const gradientStartX = centerX + Math.cos(gradientStartAngle) * targetRadius;
                const gradientStartY = centerY + Math.sin(gradientStartAngle) * targetRadius;
                const gradientEndX = centerX + Math.cos(gradientEndAngle) * targetRadius;
                const gradientEndY = centerY + Math.sin(gradientEndAngle) * targetRadius;
                
                const gradient = ctx.createLinearGradient(gradientStartX, gradientStartY, gradientEndX, gradientEndY);
                gradient.addColorStop(0, lightColor);
                gradient.addColorStop(1, darkColor);
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, targetRadius, mergeStart - Math.PI / 2, mergeEnd - Math.PI / 2);
                ctx.lineWidth = currentWidth;
                ctx.strokeStyle = gradient;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.restore();
              }
              
              // Redraw passed portion ON TOP (light, stops before merge zone)
              if (currentAngle > adjustedAngleStart) {
                const passedAngleEnd = Math.min(currentAngle, adjustedAngleEnd);
                const passedAdjustedEnd = passedAngleEnd - angularCompensation;
                
                if (passedAdjustedEnd > adjustedAngleStart) {
                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, passedAdjustedEnd - Math.PI / 2);
                  ctx.lineWidth = currentWidth;
                  ctx.strokeStyle = lightenColor(kz.color, 60);
                  ctx.lineCap = 'round'; // Round cap at start
                  ctx.stroke();
                  ctx.restore();
                }
              }
            } else {
              // No progress, redraw entire session
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, targetRadius, adjustedAngleStart - Math.PI / 2, adjustedAngleEnd - Math.PI / 2);
              ctx.lineWidth = currentWidth;
              ctx.strokeStyle = kz.color;
              ctx.lineCap = 'round';
              ctx.stroke();
              ctx.restore();
            }
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
};  export const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}h:${m}m:${s}s`;
  };
  