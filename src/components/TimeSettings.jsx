// src/components/TimeSettings.jsx
import React from 'react';

const TimeSettings = ({ showTimeToEnd, showTimeToStart, toggleShowTimeToEnd, toggleShowTimeToStart }) => {
  return (
    <div className="time-settings" style={{ marginTop: '20px' }}>
      <h4>
        Time Display
        <span
          title="Settings for displaying time countdowns"
          style={{ marginLeft: '5px', cursor: 'help' }}
        >
          ?
        </span>
      </h4>
      <div className="setting-item" style={{ marginBottom: '10px' }}>
        <input
          type="checkbox"
          id="showTimeToEnd"
          checked={showTimeToEnd}
          onChange={toggleShowTimeToEnd}
        />
        <label
          htmlFor="showTimeToEnd"
          title="Display the time remaining until the current killzone ends"
          style={{ marginLeft: '5px' }}
        >
          Show Time to End
        </label>
      </div>
      <div className="setting-item">
        <input
          type="checkbox"
          id="showTimeToStart"
          checked={showTimeToStart}
          onChange={toggleShowTimeToStart}
        />
        <label
          htmlFor="showTimeToStart"
          title="Display the time until the next killzone starts"
          style={{ marginLeft: '5px' }}
        >
          Show Time to Start
        </label>
      </div>
    </div>
  );
};

export default TimeSettings;
