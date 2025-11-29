// src/components/TimeStatus.jsx
import React from 'react';
import { formatTime } from '../utils/clockUtils';

const TimeStatus = ({ activeSession, timeToEnd, nextSession, timeToStart, showTimeToEnd, showTimeToStart }) => {
  if (activeSession && showTimeToEnd && timeToEnd != null) {
    return (
      <div
        className="time-status"
        title={`Time to end: ${formatTime(timeToEnd)}`}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        Time to End: {formatTime(timeToEnd)}
      </div>
    );
  } else if (!activeSession && nextSession && showTimeToStart && timeToStart != null) {
    return (
      <div
        className="time-status"
        title={`Starts in: ${formatTime(timeToStart)}`}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        Next: {nextSession.name} ({formatTime(timeToStart)})
      </div>
    );
  } else {
    return null;
  }
};

export default TimeStatus;
