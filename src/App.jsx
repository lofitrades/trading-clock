// src/App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { IconButton, Fab, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useSettings } from './contexts/SettingsContext';
import { useClock } from './hooks/useClock';
import ClockCanvas from './components/ClockCanvas';
import DigitalClock from './components/DigitalClock';
import SessionLabel from './components/SessionLabel';
import TimezoneSelector from './components/TimezoneSelector';
import SettingsSidebar from './components/SettingsSidebar';
import EconomicEvents from './components/EconomicEvents';
import LoadingScreen from './components/LoadingScreen';
import { isColorDark } from './utils/clockUtils';
import './index.css';  // Import global CSS styles
import './App.css';    // Import App-specific CSS

export default function App() {
  const {
    isLoading,
    clockStyle,
    canvasSize,
    clockSize,
    sessions,
    selectedTimezone,
    updateClockStyle,
    updateCanvasSize,
    updateClockSize,
    updateSessions,
    setSelectedTimezone,
    backgroundColor,
    updateBackgroundColor,
    backgroundBasedOnSession,
    toggleBackgroundBasedOnSession,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowSessionLabel,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
    showSessionNamesInCanvas,
  } = useSettings();

  const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } =
    useClock(selectedTimezone, sessions);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [calculatedClockSize, setCalculatedClockSize] = useState(clockSize);

  // Calculate the actual clock size based on viewport height and percentage
  useEffect(() => {
    const calculateSize = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Account for fixed elements (minimal margins)
      const settingsButtonHeight = 48; // Top margin + button size (10px + 38px)
      const timezoneSelectorHeight = 50; // Bottom selector + margins (10px + 40px)
      
      // Calculate scaling factor for digital clock and label based on base 375px
      const baseSize = 375;
      
      // Element height ratios relative to canvas size (based on 375px reference)
      // Digital clock: ~50px total height (font + margins) / 375px = 0.133
      const digitalClockRatio = showDigitalClock ? 0.133 : 0;
      // Session label: ~80px total height (text + padding + margins) / 375px = 0.213
      const sessionLabelRatio = showSessionLabel ? 0.213 : 0;
      
      // Total ratio: canvas + digital clock + session label
      const totalRatio = 1 + digitalClockRatio + sessionLabelRatio;
      
      // Available height for all elements (minimal buffer)
      const availableHeight = viewportHeight - settingsButtonHeight - timezoneSelectorHeight - 10; // 10px tiny buffer
      
      // Calculate canvas size based on the percentage and ratio
      // At 100%, we want to use all available height
      let calculatedSize = Math.floor((availableHeight / totalRatio) * (canvasSize / 100));
      
      // Ensure minimum size of 150px
      calculatedSize = Math.max(150, calculatedSize);
      
      // Also respect viewport width (leave small margin)
      const maxWidthSize = viewportWidth - 60;
      calculatedSize = Math.min(calculatedSize, maxWidthSize);
      
      // Verify everything fits with actual scaled sizes
      const actualDigitalHeight = showDigitalClock ? Math.round(60 * (calculatedSize / baseSize)) : 0;
      const actualLabelHeight = showSessionLabel ? Math.round(100 * (calculatedSize / baseSize)) : 0;
      const totalHeightNeeded = calculatedSize + actualDigitalHeight + actualLabelHeight + settingsButtonHeight + timezoneSelectorHeight + 20;
      
      // If we exceed viewport at 100%, adjust down
      if (canvasSize === 100 && totalHeightNeeded > viewportHeight) {
        const adjustmentFactor = viewportHeight / totalHeightNeeded;
        calculatedSize = Math.floor(calculatedSize * adjustmentFactor * 0.98); // 98% for tiny safety margin
      }
      
      setCalculatedClockSize(calculatedSize);
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    
    return () => window.removeEventListener('resize', calculateSize);
  }, [canvasSize, showDigitalClock, showSessionLabel]);

  // If background toggle is on, use the active session color.
  const effectiveBackground =
    backgroundBasedOnSession && activeSession
      ? activeSession.color
      : backgroundColor;

  const effectiveTextColor = isColorDark(effectiveBackground)
    ? "#fff"
    : "#4B4B4B";

  useEffect(() => {
    document.body.style.backgroundColor = effectiveBackground;
  }, [effectiveBackground]);

  // Timezone selector is always rendered at the bottom of the clock elements.
  const memoizedTimezoneSelector = useMemo(() => (
    <TimezoneSelector
      selectedTimezone={selectedTimezone}
      setSelectedTimezone={setSelectedTimezone}
      textColor={effectiveTextColor}
    />
  ), [selectedTimezone, effectiveTextColor]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} clockSize={clockSize} />
      
      <div
        className="app-container"
        style={{
          maxWidth: calculatedClockSize + 200,
          minHeight: '100vh',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        <IconButton
          className="settings-button"
          onClick={() => setSettingsOpen(true)}
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            color: effectiveTextColor,
            zIndex: 1000,
          }}
          aria-label="Open settings"
        >
          <SettingsIcon sx={{ fontSize: 28 }} />
        </IconButton>

        {/* Economic Events Toggle Button */}
        <Tooltip title="Economic Events" placement="left">
          <Fab
            color="primary"
            onClick={() => setEventsOpen(!eventsOpen)}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              zIndex: 1000,
            }}
            aria-label="Toggle economic events"
          >
            <CalendarMonthIcon />
          </Fab>
        </Tooltip>

        <div className="clock-elements-container">
          {showHandClock && (
            <div className="hand-clock">
              <ClockCanvas 
                size={calculatedClockSize} 
                time={currentTime} 
                sessions={sessions}
                handColor={effectiveTextColor}
                clockStyle={clockStyle}
                showSessionNamesInCanvas={showSessionNamesInCanvas}
                activeSession={activeSession}
                backgroundBasedOnSession={backgroundBasedOnSession}
              />
            </div>
          )}
          {showDigitalClock && (
            <DigitalClock 
              time={currentTime} 
              clockSize={calculatedClockSize} 
              textColor={effectiveTextColor}
            />
          )}
          {showSessionLabel && (
            <SessionLabel
              activeSession={activeSession}
              showTimeToEnd={showTimeToEnd}
              timeToEnd={timeToEnd}
              showTimeToStart={showTimeToStart}
              nextSession={nextSession}
              timeToStart={timeToStart}
              clockSize={calculatedClockSize}
            />
          )}
        </div>

        {/* Fixed timezone selector at bottom of viewport */}
        {memoizedTimezoneSelector}

        <SettingsSidebar
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        {/* Economic Events Panel */}
        {eventsOpen && (
          <EconomicEvents onClose={() => setEventsOpen(false)} />
        )}
      </div>
    </>
  );
}
