// src/components/DigitalClock.jsx
import React from 'react';
import { Typography } from '@mui/material';

const DigitalClock = React.memo(({ time, clockSize, textColor }) => {
  if (!time) return null;
  // Base size for Normal at 50% (375px reference)
  const baseSize = 375;
  const baseFontSize = 28;
  const scaleFactor = clockSize / baseSize;
  const computedFontSize = Math.max(16, Math.round(baseFontSize * scaleFactor));
  
  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return (
    <Typography
      className="digital-clock"
      sx={{
        fontSize: `${computedFontSize}px`,
        color: textColor,
        fontWeight: 400,
        marginBottom: '10px',
      }}
    >
      {`${displayHours}:${minutes}:${seconds} ${ampm}`}
    </Typography>
  );
});

export default DigitalClock;
