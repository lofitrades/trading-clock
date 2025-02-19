// src/utils/clockUtils.js
export const getLineWidthAndHoverArea = (clockSize) => {
    switch (clockSize) {
      case 300: return { lineWidth: 80, hoverLineWidth: 87 };
      case 150: return { lineWidth: 12, hoverLineWidth: 14 };
      case 250: return { lineWidth: 18, hoverLineWidth: 21 };
      case 375: return { lineWidth: 30, hoverLineWidth: 34 };
      case 500: return { lineWidth: 45, hoverLineWidth: 50 };
      case 1200: return { lineWidth: 100, hoverLineWidth: 120 };
      default: return { lineWidth: 30, hoverLineWidth: 34 };
    }
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
  
  export const drawClockNumbers = (ctx, centerX, centerY, radius, textColor) => {
    ctx.font = `${radius * 0.085}px Roboto`; // change this to make it more aesthetic
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor; // Apply dynamic text color
  
    for (let num = 1; num <= 12; num++) {
      const angle = ((num * 30) - 90) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * (radius * 0.31);
      const y = centerY + Math.sin(angle) * (radius * 0.31);
      ctx.fillText(num.toString(), x, y);
    }
  };
  
  export const drawDynamicElements = (ctx, size, killzones, time, hoveredKillzone, handColor) => {
    const centerX = size / 2,
          centerY = size / 2;
    const radius = Math.min(size, size) / 2 - 5;
    ctx.clearRect(
      Math.floor(centerX - radius),
      Math.floor(centerY - radius),
      Math.ceil(radius * 2),
      Math.ceil(radius * 2)
    );
    const totalTime = 12 * 60;
    killzones.forEach(kz => {
      if (!kz.startNY || !kz.endNY) return;
      const [startHour, startMinute] = kz.startNY.split(':').map(Number);
      const [endHour, endMinute] = kz.endNY.split(':').map(Number);
      let angleStart = ((startHour % 12) * 60 + startMinute) / totalTime * Math.PI * 2;
      let angleEnd = ((endHour % 12) * 60 + endMinute) / totalTime * Math.PI * 2;
      if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
        angleEnd += Math.PI * 2;
      }
      const targetRadius = startHour < 12 ? radius * 0.52 : radius * 0.75;
      const { lineWidth, hoverLineWidth } = getLineWidthAndHoverArea(size);
      const currentWidth = kz === hoveredKillzone ? hoverLineWidth : lineWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, targetRadius, angleStart - Math.PI / 2, angleEnd - Math.PI / 2);
      ctx.lineWidth = currentWidth;
      ctx.strokeStyle = kz.color;
      ctx.lineCap = 'butt';
      ctx.stroke();
    });
    // Draw clock hands using handColor prop
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
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
    const hourAngle = ((hours % 12) * 30 + minutes * 0.5) * Math.PI / 180;
    const hourLength = hours >= 12 ? radius * 0.74 : radius * 0.5;
    drawHand(hourAngle, hourLength, 6, handColor);
    const minuteAngle = (minutes * 6) * Math.PI / 180;
    drawHand(minuteAngle, radius * 0.9, 3, handColor);
    const secondAngle = (seconds * 6) * Math.PI / 180;
    drawHand(secondAngle, radius * 1, 1, handColor);
  };
  
  
  export const isColorDark = (color) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  };
  
  export const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}h:${m}m:${s}s`;
  };
  