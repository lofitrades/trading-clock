// src/components/DigitalClock.jsx
import React from 'react';

const DigitalClock = React.memo(({ time, clockSize, textColor }) => {
  if (!time) return null;
  const baseFontSize = 35;
  const computedFontSize = Math.max(16, (clockSize / 375) * baseFontSize);
  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return (
    <div 
      className="digital-clock" 
      style={{ fontSize: `${computedFontSize}px`, color: textColor }}
    >
      {`${displayHours}:${minutes}:${seconds} ${ampm}`}
    </div>
  );
});

export default DigitalClock;
