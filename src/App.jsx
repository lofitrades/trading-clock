// src/App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { useClock } from './hooks/useClock';
import ClockCanvas from './components/ClockCanvas';
import DigitalClock from './components/DigitalClock';
import KillzoneLabel from './components/KillzoneLabel';
import TimezoneSelector from './components/TimezoneSelector';
import Sidebar from './components/Sidebar';
import { isColorDark } from './utils/clockUtils';
import './index.css';  // Import global CSS styles
import './App.css';    // Import App-specific CSS

export default function App() {
  const {
    clockSize,
    killzones,
    selectedTimezone,
    updateClockSize,
    updateKillzones,
    setSelectedTimezone,
    backgroundColor,
    updateBackgroundColor,
    backgroundBasedOnKillzone,
    toggleBackgroundBasedOnKillzone,
    showHandClock,
    showDigitalClock,
    showKillzoneLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowKillzoneLabel,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
  } = useSettings();

  const { currentTime, activeKillzone, timeToEnd, nextKillzone, timeToStart } =
    useClock(selectedTimezone, killzones);

  // If background toggle is on, use the active killzone color.
  const effectiveBackground =
    backgroundBasedOnKillzone && activeKillzone
      ? activeKillzone.color
      : backgroundColor;

  const effectiveTextColor = isColorDark(effectiveBackground)
    ? "#fff"
    : "#4B4B4B";

  useEffect(() => {
    document.body.style.backgroundColor = effectiveBackground;
  }, [effectiveBackground]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Timezone selector is always rendered at the bottom of the clock elements.
  const memoizedTimezoneSelector = useMemo(() => (
    <TimezoneSelector
      selectedTimezone={selectedTimezone}
      setSelectedTimezone={setSelectedTimezone}
      textColor={effectiveTextColor}
    />
  ), [selectedTimezone, effectiveTextColor]);

  return (
    <div
      className="app-container"
      style={{
        maxWidth: clockSize + 200,
        minHeight: '100vh',
      }}
    >
      <button 
        className="settings-button material-symbols-outlined"
        onClick={() => setSidebarOpen(true)}
      >
        menu
      </button>

      <div className="clock-elements-container">
        {showHandClock && (
          <div className="hand-clock">
            <ClockCanvas 
              size={clockSize} 
              time={currentTime} 
              killzones={killzones}
              handColor={effectiveTextColor}
            />
          </div>
        )}
        {showDigitalClock && (
          <DigitalClock 
            time={currentTime} 
            clockSize={clockSize} 
            textColor={effectiveTextColor}
          />
        )}
        {showKillzoneLabel && (
          <KillzoneLabel
            activeKillzone={activeKillzone}
            showTimeToEnd={showTimeToEnd}
            timeToEnd={timeToEnd}
            showTimeToStart={showTimeToStart}
            nextKillzone={nextKillzone}
            timeToStart={timeToStart}
            clockSize={clockSize}
          />
        )}
        <div id="TimezoneSelector" className="timezone-selector">
          {memoizedTimezoneSelector}
        </div>
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        clockSize={clockSize}
        killzones={killzones}
        onSizeChange={updateClockSize}
        onKillzonesChange={updateKillzones}
        backgroundColor={backgroundColor}
        updateBackgroundColor={updateBackgroundColor}
        backgroundBasedOnKillzone={backgroundBasedOnKillzone}
        toggleBackgroundBasedOnKillzone={toggleBackgroundBasedOnKillzone}
        showHandClock={showHandClock}
        showDigitalClock={showDigitalClock}
        showKillzoneLabel={showKillzoneLabel}
        toggleShowHandClock={toggleShowHandClock}
        toggleShowDigitalClock={toggleShowDigitalClock}
        toggleShowKillzoneLabel={toggleShowKillzoneLabel}
        showTimeToEnd={showTimeToEnd}
        showTimeToStart={showTimeToStart}
        toggleShowTimeToEnd={toggleShowTimeToEnd}
        toggleShowTimeToStart={toggleShowTimeToStart}
      />
    </div>
  );
}
