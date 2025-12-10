/**
 * src/App.jsx
 * 
 * Purpose: Main application component for the trading clock.
 * Displays clock canvas, digital time, session labels, and economic events.
 * Now integrated with React Router for proper routing (routing removed from this file).
 * 
 * Changelog:
 * v2.6.3 - 2025-12-09 - Added setting-controlled toggle for clock event markers and aligned loader gating.
 * v2.6.2 - 2025-12-09 - Keep loading animation visible until clock event markers finish rendering.
 * v2.6.1 - 2025-12-09 - Event markers now open the economic events drawer and auto-scroll to the selected event; improved accessibility and state styling
 * v2.6.0 - 2025-12-09 - Added ClockEventsOverlay to display today's filtered economic events on the analog clock
 * v2.5.0 - 2025-12-09 - Added mobile fullscreen toggle and viewport-aware sizing
 * v2.4.1 - 2025-12-09 - Compact loader sizing and remove unused ready flag
 * v2.4.0 - 2025-12-09 - Delay clock render until layout calculated with donut skeleton placeholder
 * v2.3.0 - 2025-12-09 - Align fixed action icons to viewport edge and refine loading animation stability
 * v2.2.0 - 2025-12-09 - Smoothed loading ↔ canvas transitions with extended fades and motion
 * v2.1.0 - 2025-12-03 - Keep loading screen until layout calculation completes
 * v2.0.0 - 2025-11-30 - Removed hash-based routing, now uses React Router
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSettings } from './contexts/SettingsContext';
import { useClock } from './hooks/useClock';
import useFullscreen from './hooks/useFullscreen';
import ClockCanvas from './components/ClockCanvas';
import ClockEventsOverlay from './components/ClockEventsOverlay';
import ClockHandsOverlay from './components/ClockHandsOverlay';
import DigitalClock from './components/DigitalClock';
import SessionLabel from './components/SessionLabel';
import TimezoneSelector from './components/TimezoneSelector';
import SettingsSidebar from './components/SettingsSidebar';
import EconomicEvents2 from './components/EconomicEvents2';
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
    showEventsOnCanvas,
    eventFilters,
    newsSource,
  } = useSettings();

  const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } =
    useClock(selectedTimezone, sessions);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [calculatedClockSize, setCalculatedClockSize] = useState(clockSize);
  const [hasCalculatedClockSize, setHasCalculatedClockSize] = useState(false);
  const appContainerRef = useRef(null);
  const { isFullscreen } = useFullscreen(appContainerRef);
  const [autoScrollRequest, setAutoScrollRequest] = useState(null);
  const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
  const [overlayLoading, setOverlayLoading] = useState(showHandClock && showEventsOnCanvas);

  const openEventsFor = (evt) => {
    setEventsOpen(true);
    if (evt?.id) {
      setAutoScrollRequest({ eventId: evt.id, ts: Date.now() });
    }
  };

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
      const digitalClockRatio = showDigitalClock ? 0.133 : 0; // ~50px / 375px
      const sessionLabelRatio = showSessionLabel ? 0.213 : 0; // ~80px / 375px
      
      // Total ratio: canvas + digital clock + session label
      const totalRatio = 1 + digitalClockRatio + sessionLabelRatio;
      
      // Available height for all elements (minimal buffer)
      const availableHeight = viewportHeight - settingsButtonHeight - timezoneSelectorHeight - 10; // 10px tiny buffer
      
      // Calculate canvas size based on the percentage and ratio
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
      setHasCalculatedClockSize(true);
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

  useEffect(() => {
    // Recompute layout when entering/exiting fullscreen to keep sizing accurate.
    window.dispatchEvent(new Event('resize'));
  }, [isFullscreen]);

  // Timezone selector is always rendered at the bottom of the clock elements.
  // v1.1.0: TimezoneSelector now uses SettingsContext directly (removed selectedTimezone/setSelectedTimezone props)
  const memoizedTimezoneSelector = useMemo(() => (
    <TimezoneSelector
      textColor={effectiveTextColor}
      eventsOpen={eventsOpen}
      onToggleEvents={() => setEventsOpen(!eventsOpen)}
    />
  ), [effectiveTextColor, eventsOpen]);

  const renderSkeleton = !hasCalculatedClockSize;
  const showLoadingScreen = isLoading || overlayLoading;

  useEffect(() => {
    setOverlayLoading(showHandClock && showEventsOnCanvas);
  }, [showHandClock, showEventsOnCanvas]);

  const closeEvents = () => {
    setEventsOpen(false);
    setAutoScrollRequest(null);
  };

  return (
    <>
      <LoadingScreen isLoading={showLoadingScreen} clockSize={calculatedClockSize} />
      
      <div
        className="app-container"
        ref={appContainerRef}
        style={{
          maxWidth: calculatedClockSize + 200,
          backgroundColor: effectiveBackground,
          opacity: showLoadingScreen ? 0 : 1,
          pointerEvents: showLoadingScreen ? 'none' : 'auto',
          transition: 'opacity 0.6s ease',
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1200,
          }}
        >
          <IconButton
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 'max(12px, env(safe-area-inset-right, 0px))',
              color: effectiveTextColor,
              pointerEvents: 'auto',
              backgroundColor: 'transparent',
            }}
            aria-label="Open settings"
          >
            <SettingsIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        <div className="clock-elements-container">
          {showHandClock && (
            <div className="hand-clock" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {renderSkeleton ? (
                <div style={{ width: calculatedClockSize, height: calculatedClockSize }} />
              ) : (
                <div className="hand-clock-wrapper" style={{ position: 'relative', width: calculatedClockSize, height: calculatedClockSize }}>
                  <ClockCanvas 
                    size={calculatedClockSize} 
                    time={currentTime} 
                    sessions={sessions}
                    handColor={effectiveTextColor}
                    clockStyle={clockStyle}
                    showSessionNamesInCanvas={showSessionNamesInCanvas}
                    activeSession={activeSession}
                    backgroundBasedOnSession={backgroundBasedOnSession}
                    renderHandsInCanvas={false}
                    handAnglesRef={handAnglesRef}
                  />
                  <ClockHandsOverlay
                    size={calculatedClockSize}
                    handAnglesRef={handAnglesRef}
                    handColor={effectiveTextColor}
                    time={currentTime}
                  />
                  {showEventsOnCanvas ? (
                    <ClockEventsOverlay 
                      size={calculatedClockSize}
                      timezone={selectedTimezone}
                      eventFilters={eventFilters}
                      newsSource={newsSource}
                      onEventClick={openEventsFor}
                      onLoadingStateChange={showHandClock ? setOverlayLoading : undefined}
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}
          {showDigitalClock && !renderSkeleton && (
            <DigitalClock 
              time={currentTime} 
              clockSize={calculatedClockSize} 
              textColor={effectiveTextColor}
            />
          )}
          {showSessionLabel && !renderSkeleton && (
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

        {/* Economic Events Panel - Keep mounted for smooth navigation */}
        <EconomicEvents2 
          open={eventsOpen}
          onClose={closeEvents} 
          timezone={selectedTimezone}
          autoScrollRequest={autoScrollRequest}
        />
      </div>
    </>
  );
}
