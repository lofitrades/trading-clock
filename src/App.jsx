/**
 * src/App.jsx
 * 
 * Purpose: Main application component for the trading clock.
 * Displays clock canvas, digital time, session labels, and economic events.
 * Now integrated with React Router for proper routing (routing removed from this file).
 * 
 * Changelog:
 * v2.6.11 - 2025-12-16 - Apply background-aware contrast color to timezone and session labels.
 * v2.6.10 - 2025-12-16 - Hide settings drawer whenever auth modal is shown to avoid overlapping overlays.
 * v2.6.9 - 2025-12-16 - Added setting-controlled timezone text label between the digital clock and session label.
 * v2.6.8 - 2025-12-16 - Performance/UX: Memoized canvas event click handler so ClockEventsOverlay doesn't re-render on 1s clock ticks (stabilizes marker tooltips).
 * v2.6.7 - 2025-12-15 - Added date range label above clock when showing events from Yesterday/Tomorrow or other non-today dates.
 * v2.6.6 - 2025-12-15 - Tag canvas-triggered event auto-scrolls so timeline can apply a longer highlight animation.
 * v2.6.5 - 2025-12-11 - Added quick-access economic events button to top-right
 * v2.6.4 - 2025-12-11 - Relocated timezone selector into settings drawer and updated layout sizing math
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography, alpha } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useSettings } from './contexts/SettingsContext';
import { useClock } from './hooks/useClock';
import useFullscreen from './hooks/useFullscreen';
import ClockCanvas from './components/ClockCanvas';
import ClockEventsOverlay from './components/ClockEventsOverlay';
import ClockHandsOverlay from './components/ClockHandsOverlay';
import DigitalClock from './components/DigitalClock';
import SessionLabel from './components/SessionLabel';
import SettingsSidebar2 from './components/SettingsSidebar2';
import EconomicEvents3 from './components/EconomicEvents3';
import LoadingScreen from './components/LoadingScreen';
import EmailLinkHandler from './components/EmailLinkHandler';
import AuthModal from './components/AuthModal';
import { isColorDark } from './utils/clockUtils';
import { getDatePartsInTimezone, getUtcDateForTimezone } from './utils/dateUtils';
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
    backgroundColor,
    backgroundBasedOnSession,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    showTimezoneLabel,
    showTimeToEnd,
    showTimeToStart,
    showSessionNamesInCanvas,
    showEventsOnCanvas,
    showClockNumbers,
    showClockHands,
    eventFilters,
    newsSource,
  } = useSettings();

  const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } =
    useClock(selectedTimezone, sessions);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [calculatedClockSize, setCalculatedClockSize] = useState(clockSize);
  const [hasCalculatedClockSize, setHasCalculatedClockSize] = useState(false);
  const appContainerRef = useRef(null);
  const { isFullscreen } = useFullscreen(appContainerRef);
  const [autoScrollRequest, setAutoScrollRequest] = useState(null);
  const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
  const [overlayLoading, setOverlayLoading] = useState(showHandClock && showEventsOnCanvas);

  const timezoneLabelText = useMemo(() => {
    if (!selectedTimezone) return '';
    return selectedTimezone.replace(/_/g, ' ');
  }, [selectedTimezone]);

  const openEventsFor = useCallback((evt, meta) => {
    setEventsOpen(true);
    if (evt?.id) {
      const source = meta?.source || 'canvas';
      setAutoScrollRequest({ eventId: evt.id, ts: Date.now(), source });
    }
  }, [setAutoScrollRequest, setEventsOpen]);

  const handleOpenAuth = useCallback(() => {
    setSettingsOpen(false);
    setAuthModalOpen(true);
  }, []);

  // Calculate the actual clock size based on viewport height and percentage
  useEffect(() => {
    const calculateSize = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Account for fixed elements (minimal margins)
      const settingsButtonHeight = 48; // Top margin + button size (10px + 38px)
      
      // Calculate scaling factor for digital clock and label based on base 375px
      const baseSize = 375;
      
      // Element height ratios relative to canvas size (based on 375px reference)
      const digitalClockRatio = showDigitalClock ? 0.133 : 0; // ~50px / 375px
      const timezoneLabelRatio = showTimezoneLabel ? 0.07 : 0; // ~26px / 375px
      const sessionLabelRatio = showSessionLabel ? 0.213 : 0; // ~80px / 375px
      
      // Total ratio: canvas + digital clock + session label
      const totalRatio = 1 + digitalClockRatio + timezoneLabelRatio + sessionLabelRatio;
      
      // Available height for all elements (minimal buffer)
      const availableHeight = viewportHeight - settingsButtonHeight - 10; // 10px tiny buffer
      
      // Calculate canvas size based on the percentage and ratio
      let calculatedSize = Math.floor((availableHeight / totalRatio) * (canvasSize / 100));
      
      // Ensure minimum size of 150px
      calculatedSize = Math.max(150, calculatedSize);
      
      // Also respect viewport width (leave small margin)
      const maxWidthSize = viewportWidth - 60;
      calculatedSize = Math.min(calculatedSize, maxWidthSize);
      
      // Verify everything fits with actual scaled sizes
      const actualDigitalHeight = showDigitalClock ? Math.round(60 * (calculatedSize / baseSize)) : 0;
      const actualTimezoneLabelHeight = showTimezoneLabel ? Math.round(28 * (calculatedSize / baseSize)) : 0;
      const actualLabelHeight = showSessionLabel ? Math.round(100 * (calculatedSize / baseSize)) : 0;
      const totalHeightNeeded = calculatedSize + actualDigitalHeight + actualTimezoneLabelHeight + actualLabelHeight + settingsButtonHeight + 20;
      
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
  }, [canvasSize, showDigitalClock, showSessionLabel, showTimezoneLabel]);


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

  const renderSkeleton = !hasCalculatedClockSize;
  const showLoadingScreen = isLoading || overlayLoading;

  useEffect(() => {
    setOverlayLoading(showHandClock && showEventsOnCanvas);
  }, [showHandClock, showEventsOnCanvas]);

  useEffect(() => {
    if (authModalOpen) {
      setSettingsOpen(false);
    }
  }, [authModalOpen]);

  const closeEvents = () => {
    setEventsOpen(false);
    setAutoScrollRequest(null);
  };

  return (
    <>
      {/* Global email link handler */}
      <EmailLinkHandler />
      
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
        <Tooltip title="Economic events" placement="left">
          <IconButton
            onClick={() => setEventsOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 'calc(12px + var(--t2t-safe-bottom, 0px))',
              right: 'max(12px, env(safe-area-inset-right, 0px))',
              color: effectiveTextColor,
              zIndex: 1100,
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.8,
              },
            }}
            aria-label="Open economic events"
          >
            <EventNoteIcon sx={{ fontSize: 26 }} />
          </IconButton>
        </Tooltip>

        {/* Settings gear removed; access settings from events drawer header */}

        {/* Date Range Label - shown when canvas events are filtered to non-today dates */}
        {showEventsOnCanvas && !renderSkeleton && eventFilters?.startDate && eventFilters?.endDate && (() => {
          // Get timezone-aware today
          const { year, month, day, dayOfWeek } = getDatePartsInTimezone(selectedTimezone);
          const todayStart = getUtcDateForTimezone(selectedTimezone, year, month, day);
          const todayEnd = getUtcDateForTimezone(selectedTimezone, year, month, day, { endOfDay: true });
          
          const start = new Date(eventFilters.startDate);
          const end = new Date(eventFilters.endDate);
          
          // Check if it's today
          const isToday = start.getTime() === todayStart.getTime() && 
                         end.getTime() === todayEnd.getTime();
          
          // Check if it's this week (Sunday to Saturday)
          const weekStart = getUtcDateForTimezone(selectedTimezone, year, month, day - dayOfWeek);
          const weekEnd = getUtcDateForTimezone(selectedTimezone, year, month, day + (6 - dayOfWeek), { endOfDay: true });
          const isThisWeek = start.getTime() === weekStart.getTime() && 
                            end.getTime() === weekEnd.getTime();
          
          if (isToday) return null;
          
          // Format the label with actual dates (timezone-aware)
          const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: selectedTimezone };
          const rangeOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: selectedTimezone };
          let label = '';
          
          // Get timezone-aware yesterday and tomorrow
          const yesterday = getUtcDateForTimezone(selectedTimezone, year, month, day - 1);
          const tomorrow = getUtcDateForTimezone(selectedTimezone, year, month, day + 1);
          
          if (isThisWeek) {
            // This Week - show date range
            const weekStartStr = weekStart.toLocaleDateString('en-US', rangeOptions);
            const weekEndStr = weekEnd.toLocaleDateString('en-US', rangeOptions);
            label = `Showing events for this week: ${weekStartStr} - ${weekEndStr}`;
          } else if (start.getTime() === yesterday.getTime()) {
            label = `Showing events from Yesterday: ${start.toLocaleDateString('en-US', dateOptions)}`;
          } else if (start.getTime() === tomorrow.getTime()) {
            label = `Showing events for Tomorrow: ${start.toLocaleDateString('en-US', dateOptions)}`;
          } else if (start.toDateString() === end.toDateString()) {
            // Single day
            label = `Showing events for ${start.toLocaleDateString('en-US', dateOptions)}`;
          } else {
            // Date range
            const startStr = start.toLocaleDateString('en-US', dateOptions);
            const endStr = end.toLocaleDateString('en-US', dateOptions);
            label = `Showing events: ${startStr} - ${endStr}`;
          }
          
          return (
            <Box
              onClick={() => setEventsOpen(true)}
              sx={{
                textAlign: 'center',
                mt: { xs: 1.5, sm: 2 },
                mb: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.625 },
                bgcolor: alpha('#000', 0.04),
                borderRadius: 1.5,
                maxWidth: { xs: '95%', sm: calculatedClockSize },
                mx: 'auto',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha('#000', 0.08),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  lineHeight: 1.4,
                  display: 'block',
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })()}

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
                    showClockNumbers={showClockNumbers}
                    showClockHands={showClockHands}
                    activeSession={activeSession}
                    backgroundBasedOnSession={backgroundBasedOnSession}
                    renderHandsInCanvas={false}
                    handAnglesRef={handAnglesRef}
                  />
                  {showClockHands && (
                    <ClockHandsOverlay
                      size={calculatedClockSize}
                      handAnglesRef={handAnglesRef}
                      handColor={effectiveTextColor}
                      time={currentTime}
                    />
                  )}
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
          {showTimezoneLabel && !renderSkeleton && timezoneLabelText && (
            <Box
              sx={{
                textAlign: 'center',
                mt: { xs: 0, sm: 0 },
                mb: { xs: 0.5, sm: 1.5 },
                px: { xs: 1.5, sm: 2 },
                maxWidth: { xs: '95%', sm: calculatedClockSize },
                mx: 'auto',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: effectiveTextColor,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  lineHeight: 1.35,
                  display: 'block',
                  wordBreak: 'break-word',
                }}
              >
                {timezoneLabelText}
              </Typography>
            </Box>
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
              contrastTextColor={effectiveTextColor}
            />
          )}
        </div>

        <SettingsSidebar2
          open={settingsOpen && !authModalOpen}
          onClose={() => setSettingsOpen(false)}
          onOpenAuth={handleOpenAuth}
        />

        {/* Economic Events Panel - Keep mounted for smooth navigation */}
        <EconomicEvents3 
          open={eventsOpen}
          onClose={closeEvents}
          autoScrollRequest={autoScrollRequest}
          onOpenAuth={handleOpenAuth}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Standalone Auth Modal - Enterprise pattern: auth at root level */}
        <AuthModal 
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </>
  );
}
