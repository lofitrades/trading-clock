import { useEffect, useRef, useState } from 'react';
import { 
  drawStaticElements, 
  drawDynamicElements, 
  getLineWidthAndHoverArea, 
  isColorDark 
} from '../utils/clockUtils';

export default function ClockCanvas({ size, time, killzones }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredKillzone, setHoveredKillzone] = useState(null);

  // Handle initial draw and resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    drawStaticElements(ctx, size);
  }, [size]);

  // Handle animation and updates
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      drawDynamicElements(ctx, size, killzones, time, hoveredKillzone);
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [size, killzones, time, hoveredKillzone]);

  // Hover handling
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const hovered = detectHoveredKillzone(canvas, mouseX, mouseY, size, killzones);
    setHoveredKillzone(hovered);
    setTooltip(hovered ? {
      x: e.clientX,
      y: e.clientY,
      ...hovered
    } : null);
  };

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredKillzone(null);
          setTooltip(null);
        }}
      />
      {tooltip && (
        <div className="tooltip" style={{ 
          left: tooltip.x + 10,
          top: tooltip.y + 10,
          backgroundColor: tooltip.color,
          color: isColorDark(tooltip.color) ? '#fff' : '#000'
        }}>
          <strong>{tooltip.name}</strong>
          <div>Start: {tooltip.startNY}</div>
          <div>End: {tooltip.endNY}</div>
        </div>
      )}
    </div>
  );
}



function detectHoveredKillzone(canvas, mouseX, mouseY, size, killzones) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 - 5;
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);

  const { hoverLineWidth } = getLineWidthAndHoverArea(size);
  const amRadius = radius * 0.52;
  const pmRadius = radius * 0.75;

  if (distance >= amRadius - hoverLineWidth && distance <= amRadius + hoverLineWidth) {
    for (const kz of killzones) {
      const [startHour, startMinute] = kz.startNY.split(':').map(Number);
      const [endHour, endMinute] = kz.endNY.split(':').map(Number);
      if (startHour < 12) {
        const startAngle = ((startHour % 12) * 60 + startMinute) / (12 * 60) * Math.PI * 2;
        let endAngle = ((endHour % 12) * 60 + endMinute) / (12 * 60) * Math.PI * 2;
        if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
          endAngle += Math.PI * 2;
        }
        if ((normalizedAngle >= startAngle && normalizedAngle <= endAngle) ||
            (normalizedAngle + 2 * Math.PI >= startAngle && normalizedAngle + 2 * Math.PI <= endAngle)) {
          return kz;
        }
      }
    }
  } else if (distance >= pmRadius - hoverLineWidth && distance <= pmRadius + hoverLineWidth) {
    for (const kz of killzones) {
      const [startHour, startMinute] = kz.startNY.split(':').map(Number);
      const [endHour, endMinute] = kz.endNY.split(':').map(Number);
      if (startHour >= 12) {
        const startAngle = ((startHour % 12) * 60 + startMinute) / (12 * 60) * Math.PI * 2;
        let endAngle = ((endHour % 12) * 60 + endMinute) / (12 * 60) * Math.PI * 2;
        if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
          endAngle += Math.PI * 2;
        }
        if ((normalizedAngle >= startAngle && normalizedAngle <= endAngle) ||
            (normalizedAngle + 2 * Math.PI >= startAngle && normalizedAngle + 2 * Math.PI <= endAngle)) {
          return kz;
        }
      }
    }
  }
  return null;
}