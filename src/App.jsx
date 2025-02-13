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
import './App.css';

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

  // effectiveBackground prioritizes active Killzone color if toggle is on.
  const effectiveBackground = backgroundBasedOnKillzone && activeKillzone
    ? activeKillzone.color
    : backgroundColor;

  // Compute text color based on effectiveBackground
  const effectiveTextColor = isColorDark(effectiveBackground) ? "#fff" : "#4B4B4B";

  useEffect(() => {
    document.body.style.backgroundColor = effectiveBackground;
  }, [effectiveBackground]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {(showDigitalClock || showKillzoneLabel) && (
          <div className="other-clocks">
            {showDigitalClock && (
              <DigitalClock 
                time={currentTime} 
                clockSize={clockSize} 
                textColor={effectiveTextColor}
              />
            )}
            <div className="timezone-selector">
              {memoizedTimezoneSelector}
            </div>
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
          </div>
        )}
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
