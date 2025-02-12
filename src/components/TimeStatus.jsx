// src/components/TimeStatus.jsx
import React from 'react';
import { formatTime } from '../utils/clockUtils';

const TimeStatus = ({ activeKillzone, timeToEnd, nextKillzone, timeToStart, showTimeToEnd, showTimeToStart }) => {
  if (activeKillzone && showTimeToEnd && timeToEnd != null) {
    return (
      <div
        className="time-status"
        title={`Time to end: ${formatTime(timeToEnd)}`}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        Time to End: {formatTime(timeToEnd)}
      </div>
    );
  } else if (!activeKillzone && nextKillzone && showTimeToStart && timeToStart != null) {
    return (
      <div
        className="time-status"
        title={`Starts in: ${formatTime(timeToStart)}`}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        Next: {nextKillzone.name} ({formatTime(timeToStart)})
      </div>
    );
  } else {
    return null;
  }
};

export default TimeStatus;
