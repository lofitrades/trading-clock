// src/components/KillzoneLabel.jsx
import React from 'react';
import { isColorDark, formatTime } from '../utils/clockUtils';

export default function KillzoneLabel({
  activeKillzone,
  showTimeToEnd,
  timeToEnd,
  showTimeToStart,
  nextKillzone,
  timeToStart
}) {
  const backgroundColor = activeKillzone?.color || '#ffffff';
  const textColor = activeKillzone
    ? (isColorDark(activeKillzone.color) ? '#fff' : '#000')
    : '#4B4B4B';

  return (
    <div
      className="killzone-label"
      style={{
        backgroundColor,
        color: textColor,
        padding: '8px 16px',
        borderRadius: '4px',
        margin: '10px 0',
        textAlign: 'center',
        transition: 'background-color 0.3s, color 0.3s'
      }}
    >
      <div style={{ fontWeight: 'bold' }}>
        {activeKillzone ? `Active Killzone: ${activeKillzone.name}` : 'No Active Killzone'}
      </div>

      {activeKillzone && showTimeToEnd && timeToEnd != null && (
        <div style={{ fontSize: '0.75em', fontWeight: 'normal', opacity: 0.8 }}>
          Time to End: {formatTime(timeToEnd)}
        </div>
      )}

      {!activeKillzone && showTimeToStart && nextKillzone && timeToStart != null && (
        <div style={{ fontSize: '0.75em', fontWeight: 'normal', opacity: 0.8 }}>
          Next: {nextKillzone.name} in {formatTime(timeToStart)}
        </div>
      )}
    </div>
  );
}
