/**
 * src/App.jsx
 * 
 * Purpose: Main application component for the trading clock.
 * Displays clock canvas, digital time, session labels, and economic events.
 * Now integrated with React Router for proper routing (routing removed from this file).
 * 
 * Changelog:
 * v2.6.33 - 2026-01-08 - Pass backgroundBasedOnSession to SessionLabel so chip text is always dark when session-based bg is disabled.
 * v2.6.32 - 2026-01-08 - Unified text color to #0F172A (dark navy) when Session-based Background is disabled for consistent contrast across all UI elements and canvas components.
 * v2.6.31 - 2026-01-08 - Fixed isColorDark contrast issue: separated canvasHandColor (always dark #0F172A) from effectiveTextColor for proper readability on white canvas when Session-based Background is disabled.
 * v2.6.30 - 2026-01-08 - Removed standalone "Background Color" setting; only Session-based Background functionality remains. Default background fixed at #F9F9F9.
 * v2.6.29 - 2026-01-07 - Stabilize clock resume after background inactivity with snap-to-time hand angles and shared time engine resume tokens.
 * v2.6.28 - 2026-01-07 - Keep timezone label visible even when the digital clock is hidden.
 * v2.6.27 - 2026-01-07 - Temporarily hide session label surface and related UI while keeping the feature wired for future releases.
 * v2.6.26 - 2026-01-07 - Use shared time engine to align clock ticks across analog/digital surfaces for second-level sync.
 * v2.6.25 - 2025-12-22 - Centralize email link handling in AppRoutes so the app shell no longer mounts a redundant handler.
 * v2.6.24 - 2025-12-20 - Sync PWA status/navigation bars to user background color at runtime for installed/standalone mode
 * v2.6.23 - 2025-12-20 - Keep loader visible until events overlay finishes loading so clock hands/donuts and markers are ready before reveal
 * v2.6.22 - 2025-12-17 - Let loader dismiss once settings/layout/min-duration are ready; do not block on overlay lazy load
 * v2.6.21 - 2025-12-17 - Guarantee loader is first paint and hold it for a minimum duration on hard reloads
 * v2.6.20 - 2025-12-17 - Render nothing but loader until ready; no canvas/overlays/CTAs before load completes
 * v2.6.19 - 2025-12-17 - Gate initial render behind loader so no app elements flash before loading begins
 * v2.6.18 - 2025-12-17 - Defer heavy lazy chunks until user intent or idle to cut first paint weight
 * v2.6.17 - 2025-12-17 - Lazy-load ClockEventsOverlay to trim initial JS for mobile
 * v2.6.16 - 2025-12-17 - Lazy-load heavy drawers/modals to shrink initial bundle and improve first paint
 * v2.6.15 - 2025-12-17 - Switcahed guest CTA button to use AuthModal2 for conversion-optimized benefit-focused design
 * v2.6.14 - 2025-12-17 - Close both settings and events drawers when opening AuthModal for clean modal layering
 * v2.6.13 - 2025-12-17 - Added guest-only top-right auth CTA button to open AuthModal
 * v2.6.12 - 2025-12-16 - Convert date range label to dismissable Alert with auto-reset on filter changes.
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

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useSettings } from './contexts/SettingsContext';
import { useClock } from './hooks/useClock';
import { useTimeEngine } from './hooks/useTimeEngine';
import { useClockVisibilitySnap } from './hooks/useClockVisibilitySnap';
import useFullscreen from './hooks/useFullscreen';
import { useAuth } from './contexts/AuthContext';
import ClockCanvas from './components/ClockCanvas';
import ClockHandsOverlay from './components/ClockHandsOverlay';
import DigitalClock from './components/DigitalClock';
import SessionLabel from './components/SessionLabel';
import LoadingScreen from './components/LoadingScreen';
import InstallPromptCTA from './components/InstallPromptCTA';
import { isColorDark } from './utils/clockUtils';
import { getDatePartsInTimezone, getUtcDateForTimezone } from './utils/dateUtils';
import './index.css';  // Import global CSS styles
import './App.css';    // Import App-specific CSS

const SettingsSidebar2 = lazy(() => import('./components/SettingsSidebar2'));
const EconomicEvents3 = lazy(() => import('./components/EconomicEvents3'));
const AuthModal2 = lazy(() => import('./components/AuthModal2'));
const ClockEventsOverlay = lazy(() => import('./components/ClockEventsOverlay'));

export default function App() {
  const {
    isLoading,
    clockStyle,
    canvasSize,
    clockSize,
    sessions,
    selectedTimezone,
    backgroundBasedOnSession,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    showTimezoneLabel,
    showTimeToEnd,
    showTimeToStart,
    showSessionNamesInCanvas,
    showPastSessionsGray,
    showEventsOnCanvas,
    showClockNumbers,
    showClockHands,
    eventFilters,
    newsSource,
  } = useSettings();

  const { isAuthenticated, loading: authLoading, profileLoading } = useAuth();

  const sessionLabelVisible = false;
  const timezoneLabelActive = showTimezoneLabel || !showDigitalClock;

  const timeEngine = useTimeEngine(selectedTimezone);

  const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } =
    useClock(selectedTimezone, sessions, timeEngine);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [calculatedClockSize, setCalculatedClockSize] = useState(clockSize);
  const [hasCalculatedClockSize, setHasCalculatedClockSize] = useState(false);
  const [hasRenderedSettingsDrawer, setHasRenderedSettingsDrawer] = useState(false);
  const [hasRenderedEventsDrawer, setHasRenderedEventsDrawer] = useState(false);
  const [hasRenderedAuthModal, setHasRenderedAuthModal] = useState(false);
  const [shouldRenderEventsOverlay, setShouldRenderEventsOverlay] = useState(false);
  const [minLoaderElapsed, setMinLoaderElapsed] = useState(false);
  const appContainerRef = useRef(null);
  const { isFullscreen } = useFullscreen(appContainerRef);
  const [autoScrollRequest, setAutoScrollRequest] = useState(null);
  const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
  useClockVisibilitySnap({ handAnglesRef, currentTime, resumeToken: timeEngine?.resumeToken });
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [dismissedDateBanner, setDismissedDateBanner] = useState(false);

  const applyThemeColor = useCallback((color) => {
    if (typeof document === 'undefined') return;
    const ensureThemeMeta = () => {
      const existing = document.querySelector('meta[name="theme-color"]');
      if (existing) return existing;
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
      return meta;
    };
    const themeMeta = ensureThemeMeta();
    themeMeta.setAttribute('content', color || '#f9f9f9');
  }, []);

  const renderSkeleton = !hasCalculatedClockSize;
  // Loader shows during initialization; auth modals render above via higher z-index
  const showLoadingScreen = (isLoading || overlayLoading || !minLoaderElapsed || !hasCalculatedClockSize);
  const suppressInstallPrompt = showLoadingScreen || authModalOpen || settingsOpen || eventsOpen;

  const showAuthCta = useMemo(
    () => !authModalOpen && !authLoading && !profileLoading && !isAuthenticated() && !showLoadingScreen && !renderSkeleton,
    [authModalOpen, authLoading, profileLoading, isAuthenticated, showLoadingScreen, renderSkeleton],
  );

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
    setEventsOpen(false);
    setAuthModalOpen(true);
  }, []);

  const sessionLabelActive = sessionLabelVisible && showSessionLabel;

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
      const timezoneLabelRatio = timezoneLabelActive ? 0.07 : 0; // ~26px / 375px
      const sessionLabelRatio = sessionLabelActive ? 0.213 : 0; // ~80px / 375px

      // Total ratio: canvas + digital clock + session label
      const totalRatio = 1 + digitalClockRatio + timezoneLabelRatio + sessionLabelRatio;

      // Available height for all elements (minimal buffer)
      const availableHeight = viewportHeight - settingsButtonHeight - 10; // 10px tiny buffer

      // Calculate canvas size based on the percentage and ratio
      let calculatedSize = Math.floor((availableHeight / totalRatio) * (canvasSize / 100));

      // Ensure minimum size of 150px
      calculatedSize = Math.max(150, calculatedSize);

      // Also respect viewport width (leave small margin)
      const horizontalMargin = viewportWidth < 600 ? 16 : 48; // tighter margin on mobile
      const maxWidthSize = viewportWidth - horizontalMargin;
      calculatedSize = Math.min(calculatedSize, maxWidthSize);

      // Verify everything fits with actual scaled sizes
      const actualDigitalHeight = showDigitalClock ? Math.round(60 * (calculatedSize / baseSize)) : 0;
      const actualTimezoneLabelHeight = timezoneLabelActive ? Math.round(28 * (calculatedSize / baseSize)) : 0;
      const actualLabelHeight = sessionLabelActive ? Math.round(100 * (calculatedSize / baseSize)) : 0;
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
  }, [canvasSize, sessionLabelActive, showDigitalClock, timezoneLabelActive]);

  // Reset date banner dismissal when date filters change
  useEffect(() => {
    setDismissedDateBanner(false);
  }, [eventFilters?.startDate, eventFilters?.endDate]);

  // If background toggle is on, use the active session color. Otherwise, use default background.
  const effectiveBackground =
    backgroundBasedOnSession && activeSession
      ? activeSession.color
      : '#F9F9F9';

  // Text color logic: 
  // - When Session-based Background is DISABLED: always use dark text on fixed light background
  // - When Session-based Background is ENABLED: use isColorDark to determine contrast based on active session color
  const effectiveTextColor = backgroundBasedOnSession && activeSession
    ? (isColorDark(activeSession.color) ? "#fff" : "#4B4B4B")
    : "#0F172A"; // Always dark when session-based background is disabled

  // Canvas elements (clock numbers, hands, markers) are drawn ON the white canvas face
  // So they always need dark color for contrast against white background
  const canvasHandColor = "#0F172A"; // Always dark for white canvas

  useEffect(() => {
    document.body.style.backgroundColor = effectiveBackground;
    applyThemeColor(effectiveBackground);
  }, [effectiveBackground, applyThemeColor]);

  useEffect(() => {
    const handleVisibility = () => applyThemeColor(effectiveBackground);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [applyThemeColor, effectiveBackground]);

  useEffect(() => {
    // Recompute layout when entering/exiting fullscreen to keep sizing accurate.
    window.dispatchEvent(new Event('resize'));
  }, [isFullscreen]);

  useEffect(() => {
    if (showHandClock && showEventsOnCanvas && shouldRenderEventsOverlay) {
      setOverlayLoading(true);
    } else {
      setOverlayLoading(false);
    }
  }, [showHandClock, showEventsOnCanvas, shouldRenderEventsOverlay]);

  useEffect(() => {
    if (authModalOpen) {
      setSettingsOpen(false);
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (settingsOpen && !hasRenderedSettingsDrawer) {
      setHasRenderedSettingsDrawer(true);
    }
  }, [settingsOpen, hasRenderedSettingsDrawer]);

  useEffect(() => {
    if (eventsOpen && !hasRenderedEventsDrawer) {
      setHasRenderedEventsDrawer(true);
    }
  }, [eventsOpen, hasRenderedEventsDrawer]);

  useEffect(() => {
    if (authModalOpen && !hasRenderedAuthModal) {
      setHasRenderedAuthModal(true);
    }
  }, [authModalOpen, hasRenderedAuthModal]);

  useEffect(() => {
    if (!showEventsOnCanvas) {
      setShouldRenderEventsOverlay(false);
      return () => { };
    }

    let cancelled = false;
    const scheduleOverlay = (cb) => {
      if (typeof window === 'undefined') return 0;
      if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(cb, { timeout: 1200 });
      }
      return window.setTimeout(cb, 550);
    };

    const cancelOverlay = (id) => {
      if (typeof window === 'undefined') return;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };

    const handle = scheduleOverlay(() => {
      if (!cancelled) {
        setShouldRenderEventsOverlay(true);
      }
    });

    return () => {
      cancelled = true;
      cancelOverlay(handle);
    };
  }, [showEventsOnCanvas]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const idlePrefetch = (cb) => {
      if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(cb, { timeout: 1800 });
      }
      return window.setTimeout(cb, 900);
    };

    const cancelIdle = (id) => {
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };

    const id = idlePrefetch(() => {
      import('./components/SettingsSidebar2');
      import('./components/EconomicEvents3');
      import('./components/AuthModal2');
      if (showEventsOnCanvas) {
        import('./components/ClockEventsOverlay');
      }
    });

    return () => cancelIdle(id);
  }, [showEventsOnCanvas]);

  const closeEvents = () => {
    setEventsOpen(false);
    setAutoScrollRequest(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setMinLoaderElapsed(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const ready = !isLoading && hasCalculatedClockSize && minLoaderElapsed;

  if (!ready) {
    return (
      <>
        <InstallPromptCTA isBusy />
        <LoadingScreen isLoading clockSize={calculatedClockSize} />
      </>
    );
  }

  return (
    <>
      <InstallPromptCTA isBusy={suppressInstallPrompt} />

      <LoadingScreen isLoading={showLoadingScreen} clockSize={calculatedClockSize} />

      {showAuthCta && (
        <Button
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleOpenAuth}
          aria-label="Open sign up or log in modal"
          sx={{
            position: 'fixed',
            top: 'max(12px, env(safe-area-inset-top, 0px))',
            right: 'max(12px, env(safe-area-inset-right, 0px))',
            zIndex: 1200,
            borderRadius: 999,
            px: { xs: 1.75, sm: 2.5 },
            py: { xs: 0.85, sm: 1 },
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            letterSpacing: 0.1,
            backdropFilter: 'blur(6px)',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          Get started free
        </Button>
      )}

      <div
        className="app-container"
        ref={appContainerRef}
        style={{
          maxWidth: calculatedClockSize + 200,
          backgroundColor: effectiveBackground,
          opacity: 1,
          pointerEvents: 'auto',
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
        {!dismissedDateBanner && showEventsOnCanvas && !renderSkeleton && eventFilters?.startDate && eventFilters?.endDate && (() => {
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
            <Alert
              severity="info"
              onClose={() => setDismissedDateBanner(true)}
              sx={{
                mt: { xs: 1.5, sm: 2 },
                mb: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.625 },
                maxWidth: { xs: '95%', sm: calculatedClockSize },
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                '& .MuiAlert-message': {
                  width: '100%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                },
                '& .MuiAlert-icon': {
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  padding: 0,
                  marginRight: { sm: 1 },
                  flexShrink: 0,
                },
                '& .MuiAlert-action': {
                  padding: 0,
                  paddingLeft: { xs: 0.5, sm: 1 },
                  marginRight: 0,
                  alignItems: 'center',
                  flexShrink: 0,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  lineHeight: 1,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Typography>
            </Alert>
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
                    handColor={canvasHandColor}
                    clockStyle={clockStyle}
                    showSessionNamesInCanvas={showSessionNamesInCanvas}
                    showPastSessionsGray={showPastSessionsGray}
                    showClockNumbers={showClockNumbers}
                    showClockHands={showClockHands}
                    activeSession={activeSession}
                    backgroundBasedOnSession={backgroundBasedOnSession}
                    renderHandsInCanvas={false}
                    handAnglesRef={handAnglesRef}
                  />
                  <ClockHandsOverlay
                    size={calculatedClockSize}
                    handAnglesRef={handAnglesRef}
                    handColor={canvasHandColor}
                    time={currentTime}
                    showSecondsHand={showClockHands}
                  />
                  {showEventsOnCanvas && shouldRenderEventsOverlay ? (
                    <Suspense fallback={null}>
                      <ClockEventsOverlay
                        size={calculatedClockSize}
                        timezone={selectedTimezone}
                        eventFilters={eventFilters}
                        newsSource={newsSource}
                        onEventClick={openEventsFor}
                        onLoadingStateChange={showHandClock ? setOverlayLoading : undefined}
                      />
                    </Suspense>
                  ) : null}
                </div>
              )}
            </div>
          )}
          {showDigitalClock && !renderSkeleton && (
            <Box
              sx={{
                mt: { xs: 3, sm: 2 },
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <DigitalClock
                time={currentTime}
                clockSize={calculatedClockSize}
                textColor={canvasHandColor}
              />
            </Box>
          )}
          {timezoneLabelActive && !renderSkeleton && timezoneLabelText && (
            <Box
              sx={{
                textAlign: 'center',
                mt: { xs: -2, sm: -2 },
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
          {sessionLabelActive && !renderSkeleton && (
            <SessionLabel
              activeSession={activeSession}
              showTimeToEnd={showTimeToEnd}
              timeToEnd={timeToEnd}
              showTimeToStart={showTimeToStart}
              nextSession={nextSession}
              timeToStart={timeToStart}
              clockSize={calculatedClockSize}
              contrastTextColor={effectiveTextColor}
              backgroundBasedOnSession={backgroundBasedOnSession}
            />
          )}
        </div>

        {(hasRenderedSettingsDrawer || settingsOpen) && (
          <Suspense fallback={null}>
            <SettingsSidebar2
              open={settingsOpen && !authModalOpen}
              onClose={() => setSettingsOpen(false)}
              onOpenAuth={handleOpenAuth}
            />
          </Suspense>
        )}

        {/* Economic Events Panel - Keep mounted for smooth navigation */}
        {(hasRenderedEventsDrawer || eventsOpen) && (
          <Suspense fallback={null}>
            <EconomicEvents3
              open={eventsOpen}
              onClose={closeEvents}
              autoScrollRequest={autoScrollRequest}
              onOpenAuth={handleOpenAuth}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </Suspense>
        )}

        {/* Standalone Auth Modal - Conversion-optimized with benefits showcase */}
        {(hasRenderedAuthModal || authModalOpen) && (
          <Suspense fallback={null}>
            <AuthModal2
              open={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
              initialMode="signup"
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
