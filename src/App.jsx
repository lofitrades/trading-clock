// src/App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { useClock } from './hooks/useClock';
import ClockCanvas from './components/ClockCanvas';
import DigitalClock from './components/DigitalClock';
import KillzoneLabel from './components/KillzoneLabel';
import TimezoneSelector from './components/TimezoneSelector';
import Sidebar from './components/Sidebar';
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
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
    toggleBackgroundBasedOnKillzone,
  } = useSettings();

  const { currentTime, activeKillzone, timeToEnd, nextKillzone, timeToStart } =
    useClock(selectedTimezone, killzones);

  // Determine effective background color
  const effectiveBackground = backgroundBasedOnKillzone && activeKillzone
    ? activeKillzone.color
    : backgroundColor;

  // Update the document body background so the entire page changes
  useEffect(() => {
    document.body.style.backgroundColor = effectiveBackground;
  }, [effectiveBackground]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Preserve the original placement of the timezone selector (below the digital clock)
  const memoizedTimezoneSelector = useMemo(() => (
    <TimezoneSelector
      selectedTimezone={selectedTimezone}
      setSelectedTimezone={setSelectedTimezone}
    />
  ), [selectedTimezone]);

  return (
    <div
      className="app-container"
      style={{
        maxWidth: clockSize + 200,
        background: effectiveBackground,
        minHeight: '100vh'
      }}
    >
      <button 
        className="settings-button material-symbols-outlined"
        onClick={() => setSidebarOpen(true)}
      >
        menu
      </button>

      <ClockCanvas size={clockSize} time={currentTime} killzones={killzones} />
      <DigitalClock time={currentTime} />
      {memoizedTimezoneSelector}
      <KillzoneLabel
        activeKillzone={activeKillzone}
        showTimeToEnd={showTimeToEnd}
        timeToEnd={timeToEnd}
        showTimeToStart={showTimeToStart}
        nextKillzone={nextKillzone}
        timeToStart={timeToStart}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        clockSize={clockSize}
        killzones={killzones}
        onSizeChange={updateClockSize}
        onKillzonesChange={updateKillzones}
        showTimeToEnd={showTimeToEnd}
        showTimeToStart={showTimeToStart}
        toggleShowTimeToEnd={toggleShowTimeToEnd}
        toggleShowTimeToStart={toggleShowTimeToStart}
        backgroundColor={backgroundColor}
        updateBackgroundColor={updateBackgroundColor}
        backgroundBasedOnKillzone={backgroundBasedOnKillzone}
        toggleBackgroundBasedOnKillzone={toggleBackgroundBasedOnKillzone}
      />
    </div>
  );
}
