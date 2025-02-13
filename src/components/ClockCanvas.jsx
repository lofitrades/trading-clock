import { useEffect, useRef, useState } from 'react';
import { 
  drawStaticElements, 
  drawDynamicElements, 
  getLineWidthAndHoverArea, 
  isColorDark,
  drawClockNumbers
} from '../utils/clockUtils';

export default function ClockCanvas({ size, time, killzones }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredKillzone, setHoveredKillzone] = useState(null);
  // Create an offscreen canvas for static elements
  const staticCanvas = useRef(document.createElement('canvas'));

  // Initialize the static offscreen canvas with DPR scaling
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const staticCtx = staticCanvas.current.getContext('2d');

    // Set the offscreen canvas resolution to account for DPR
    staticCanvas.current.width = size * dpr;
    staticCanvas.current.height = size * dpr;
    staticCtx.scale(dpr, dpr);

    // Draw static elements using the CSS size (size)
    drawStaticElements(staticCtx, size);
  }, [size]);

  // Animation loop for the onscreen canvas with DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution and CSS dimensions
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Scale the context so that drawing operations use CSS coordinates
    ctx.scale(dpr, dpr);

    let animationId;
    const animate = () => {
      // Clear the full canvas (high-res dimensions)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw static elements from the offscreen canvas
      ctx.drawImage(staticCanvas.current, 0, 0);

      // Draw dynamic elements (pass size as the CSS dimension)
      drawDynamicElements(ctx, size, killzones, time, hoveredKillzone);

      // Draw clock numbers on top
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 5;
      drawClockNumbers(ctx, centerX, centerY, radius);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [size, killzones, time, hoveredKillzone]);

  // Use CSS coordinates for hit detection
  const detectHoveredKillzone = (canvas, mouseX, mouseY) => {
    // Get the canvas CSS size
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2 - 5;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);

    const { hoverLineWidth } = getLineWidthAndHoverArea(size);
    const amRadius = radius * 0.52;
    const pmRadius = radius * 0.75;

    // Check AM killzones
    if (distance >= amRadius - hoverLineWidth / 2 && distance <= amRadius + hoverLineWidth / 2) {
      for (const kz of killzones) {
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

    // Check PM killzones
    if (distance >= pmRadius - hoverLineWidth / 2 && distance <= pmRadius + hoverLineWidth / 2) {
      for (const kz of killzones) {
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

  // Handle mouse movement over the canvas for hover detection
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hovered = detectHoveredKillzone(canvas, mouseX, mouseY);
    setHoveredKillzone(hovered);
    setTooltip(hovered
      ? { x: e.clientX, y: e.clientY, ...hovered }
      : null
    );
  };

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
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
