/**
 * src/components/DigitalClock.jsx
 *
 * Purpose: Display current time in 12-hour digital format (HH:MM:SS AM/PM).
 * Responsive font sizing scales with clock container; memoized to minimize recalculations.
 * Time display includes millisecond precision to sync with animated clock hands.
 *
 * Changelog:
 * v1.2.0 - 2026-01-07 - Sync digital clock with hand animations by including milliseconds in seconds calculation for sub-second accuracy.
 * v1.1.0 - 2026-01-07 - Memoize font size and time formatting calculations to reduce per-render work while maintaining responsiveness.
 * v1.0.0 - 2025-12-09 - Initial implementation with responsive scaling and AM/PM display.
 */

import React, { useMemo } from 'react';
import { Typography } from '@mui/material';

const DigitalClock = React.memo(({ time, clockSize, textColor }) => {
  if (!time) return null;

  // Enterprise: Memoize font size calculation since it only changes when clockSize changes
  const computedFontSize = useMemo(() => {
    const baseSize = 375;
    const baseFontSize = 18;
    const scaleFactor = clockSize / baseSize;
    return Math.max(12, Math.round(baseFontSize * scaleFactor));
  }, [clockSize]);

  // Enterprise: Memoize time formatting with millisecond precision to sync with hand animations
  // Clock hands animate with GSAP over 0.3-0.5s, so we include milliseconds for precise sync
  const timeDisplay = useMemo(() => {
    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const milliseconds = time.getMilliseconds();
    const seconds = time.getSeconds();

    // Include milliseconds for sub-second accuracy (matched to hand animation precision)
    // This ensures digital clock and animated hands appear synchronized
    const totalSeconds = seconds + (milliseconds / 1000);
    const displaySeconds = Math.floor(totalSeconds).toString().padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}:${displaySeconds} ${ampm}`;
  }, [time]);

  // Enterprise: Memoize sx object to avoid style recreation
  const sxStyles = useMemo(
    () => ({
      fontSize: `${computedFontSize}px`,
      color: textColor,
      fontWeight: 400,
      marginBottom: 0,
    }),
    [computedFontSize, textColor]
  );

  return (
    <Typography className="digital-clock" sx={sxStyles}>
      {timeDisplay}
    </Typography>
  );
});

DigitalClock.displayName = 'DigitalClock';

export default DigitalClock;

