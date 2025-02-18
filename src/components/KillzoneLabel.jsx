// src/components/KillzoneLabel.jsx
import React from 'react';
import { isColorDark, formatTime } from '../utils/clockUtils';

export default function KillzoneLabel({
  activeKillzone,
  showTimeToEnd,
  timeToEnd,
  showTimeToStart,
  nextKillzone,
  timeToStart,
  clockSize,
}) {
  // Base font sizes for Normal (375): 35px for title, 16px for details.
  const baseTitleSize = 22;
  const baseDetailSize = 18;
  const titleFontSize = Math.max(22, (clockSize / 375) * baseTitleSize);
  const detailFontSize = Math.max(18, (clockSize / 375) * baseDetailSize);

  const backgroundColor = activeKillzone?.color || '#ffffff';
  const textColor = activeKillzone
    ? (isColorDark(activeKillzone.color) ? '#fff' : '#333')
    : '#333';

  return (
    <div
      className="killzone-label"
      style={{
        backgroundColor,
        color: textColor,
        padding: '8px 16px',
        borderRadius: '4px',
        margin: '10px 40px', // Updated: 20px left/right margin
        textAlign: 'center',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: `${titleFontSize}px` }}>
        {activeKillzone ? `Active Killzone: ${activeKillzone.name}` : 'No Active Killzone'}
      </div>

      {activeKillzone && showTimeToEnd && timeToEnd != null && (
        <div style={{ fontSize: `${detailFontSize}px`, fontWeight: 'normal', opacity: 1 }}>
          Time to End: {formatTime(timeToEnd)}
        </div>
      )}

      {!activeKillzone && showTimeToStart && nextKillzone && timeToStart != null && (
        <div style={{ fontSize: `${detailFontSize}px`, fontWeight: 'normal', opacity: 1 }}>
          Next: {nextKillzone.name} in {formatTime(timeToStart)}
        </div>
      )}
    </div>
  );
}
