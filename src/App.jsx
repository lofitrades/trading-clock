/**
 * src/App.jsx
 * 
 * Purpose: Main application component for the trading clock.
 * Displays clock canvas, digital time, session labels, and economic events.
 * Now integrated with React Router for proper routing (routing removed from this file).
 * 
 * Changelog:
 * v2.6.86 - 2026-01-16 - SEO HEADING: Added a single visible H1 label for the trading clock and updated nav to /clock.
 * v2.6.85 - 2026-01-15 - LOADINGSCREEN REMOVAL: Removed LoadingScreen from root App.jsx level (import and both render calls). LoadingScreen is now handled by PublicLayout following enterprise layout best practices. Simplifies App.jsx to focus on clock content and modals, not loading chrome.
 * v2.6.84 - 2026-01-14 - MOBILE SCROLL PADDING FIX: Added responsive pb (padding-bottom) to inner content Box for xs/sm to account for PublicLayout mobile logo row (32px logo + 16px pb = 48px). Formula: xs/sm use calc(8 * 8px + 48px) = 112px, md+ uses contentPaddingBottom (calculated dynamically). Ensures content scrolls all the way to bottom without being clipped on mobile. Matches AboutPage and CalendarEmbedLayout pattern for consistent scrollability across all pages.
 * v2.6.83 - 2026-01-14 - CENTERING FIX (ENTERPRISE DEEP AUDIT): Fixed PublicLayout flex/width conflict affecting /app centering on all breakpoints. PublicLayout now uses proper flex:center pattern (justifyContent:center + alignItems:center) for enterprise-grade centering instead of conflicting mx:auto approach. App.jsx app-container is now just a flex column for layout (no centering styles, no width/maxWidth duplicates). Content naturally centers through PublicLayout. Matches enterprise MUI dashboard pattern and works consistently on xs/sm/md/lg/xl.
 * v2.6.81 - 2026-01-15 - TIMEZONE MODAL BACKDROP FIX: Keep backdrop behind paper and ensure modal sits above AppBar to prevent overlaying the dialog.
 * v2.6.80 - 2026-01-14 - TIMEZONE MODAL: Replaced static timezone label with clickable Button that opens a Dialog modal containing TimezoneSelector, matching /calendar page pattern. Fully responsive, mobile-first design with enterprise best practices. Added lazy import for TimezoneSelector and required MUI imports (Dialog, DialogTitle, DialogContent, IconButton, Button, alpha, CloseIcon).
 * v2.6.79 - 2026-01-14 - INSTANT BACKGROUND UPDATE: Add backgroundBasedOnSession and activeSession to effect dependencies to ensure document.body background color updates immediately when the 'Session-based Background' toggle is enabled/disabled; follows enterprise reactive patterns matching MUI theme updates.
 * v2.6.78 - 2026-01-14 - CONTRAST-AWARE TEXT: Pass effectiveTextColor to DigitalClock and EventsFilters3 so digital clock and Reset button adapt to session-based background colors; previously DigitalClock used fixed canvasHandColor which was unreadable on dark session backgrounds.
 * v2.6.77 - 2026-01-14 - CLEAN MOBILE STYLING: Remove boxShadow, borderTop, borderColor, bgcolor, and backdropFilter on xs/sm for the fixed filter container; make background fully transparent and remove top shadow/border for cleaner mobile appearance that blends with clock content.
 * v2.6.76 - 2026-01-14 - ENTERPRISE LAYOUT AUDIT FIX: Use left/right instead of width:100vw for fixed container; add box-sizing: border-box to include padding in width calculation. Remove maxWidth on xs/sm since left/right handles viewport spanning. Reduce py padding on xs/sm. This is the enterprise standard for full-width fixed positioning that respects viewport constraints without overflow.
 * v2.6.75 - 2026-01-14 - MOBILE-FIRST WIDTH FIX: Update fixed EventsFilters3 container on mobile to use width: 100vw (full viewport width) instead of 100% to prevent overflow; reduce padding on xs/sm (py: 0.5/0.75 instead of 0.75/1) to accommodate viewport-constrained layout. EventsFilters3 component now uses calc-based width on xs/sm to prevent double-padding overflow.
 * v2.6.74 - 2026-01-13 - FILTER UI POLISH: Hide search icon from /app (showSearchFilter={false}); center filter chips horizontally on md+ (centerFilters={true}); inactive chips now display white background instead of transparent for better visual contrast.
 * v2.6.73 - 2026-01-13 - HIDE DATE FILTER ON /APP: Pass showDateFilter={false} to EventsFilters3 on /app page (both xs/sm and md+); shows only impact/currency/search/favorites filters while hiding date range filter on clock canvas.
 * v2.6.72 - 2026-01-13 - FIXED FILTERS ON MOBILE: On xs/sm, EventsFilters3 is now position:fixed at bottom above mobile AppBar (bottom: 64px, zIndex: 1300) with frosted glass backdrop; prevents interference with clock content while keeping filters accessible; on md+ stays above clock.
 * v2.6.71 - 2026-01-13 - RESPONSIVE LAYOUT: Move EventsFilters3 below timezone label on xs/sm breakpoints for better mobile UX (prevents crowding above clock); keep EventsFilters3 above clock on md+ for desktop visibility. Use display: { xs: 'none', md: 'block' } / { xs: 'block', md: 'none' } for conditional rendering.
 * v2.6.70 - 2026-01-13 - RESPONSIVE: Increased EventsFilters3 max-width to 100% on md (allows responsive wrapping on md+) and lg 560px for optimal layout; improved spacing/padding responsive values; EventsFilters3 now wraps on xs/sm and uses single-row layout on md+ following enterprise best practices.
 * v2.6.69 - 2026-01-13 - Added EventsFilters3 above the analog clock for direct filter control on /app page; lazy-loaded with responsive mobile-first styling; filter changes persist via SettingsContext for cross-page sync.
 * v2.6.68 - 2026-01-13 - Removed "Showing events..." date range banner since ClockEventsOverlay now always displays today's events only, regardless of date range selection in EventsFilters3. Date range filter only applies to the events drawer/table.
 * v2.6.67 - 2026-01-13 - COMPLETE REFACTOR: Simplified deeply nested flex hierarchy to single-layer centering. Removed viewportFrameSx and chromeContainerSx intermediate wrappers. App-container now directly handles centering (width:100%, maxWidth:1560, mx:auto) matching /calendar pattern. Fixes xs/sm/md/lg breakpoint centering issues - only XL was working before.
 * v2.6.66 - 2026-01-13 - CRITICAL: Removed redundant AppLayout wrapper that was blocking centering with double width:100% layers. Now app-container (maxWidth:1560, mx:auto) centers directly as intended.
 * v2.6.65 - 2026-01-13 - CRITICAL FIX: Removed width constraints (width:100% then width:auto) from viewportFrameSx and appContainerRef. Flex children were blocking parent's alignItems:center centering. Now children rely on chromeContainerSx (mx:auto + maxWidth:1560) for self-centering.
 * v2.6.64 - 2026-01-13 - Aligned /app content width with canonical AppBar container to prevent md/lg overflow; mirrors /calendar layout sizing.
 * v2.6.63 - 2026-01-13 - Locked AppBar to canonical container sizing by removing per-page overrides; /app now relies solely on shared layout defaults.
 * v2.6.62 - 2026-01-13 - Standardized AppBar sizing via shared profile presets; /app now selects the desktop profile without custom sx overrides.
 * v2.6.61 - 2026-01-13 - Synced with banner removal across public shells; /app stays nav-only with AppBar padding overrides for centering.
 * v2.6.60 - 2026-01-13 - Removed the ad banner from PublicLayout and kept /app centered using AppBar padding overrides only.
 * v2.6.59 - 2026-01-13 - Applied md-only horizontal padding to the /app banner and AppBar via PublicLayout overrides to re-center chrome on all breakpoints.
 * v2.6.58 - 2026-01-13 - Scoped md-only AppBar margin to /app via PublicLayout overrides so other pages stay unchanged.
 * v2.6.57 - 2026-01-13 - Finalized /app PublicLayout usage by removing legacy chrome sizing and anchoring layout height to the inner container.
 * v2.6.56 - 2026-01-13 - Swapped /app shell to PublicLayout, removing inline banner/AppBar while keeping mobile-bottom nav spacing.
 * v2.6.55 - 2026-01-13 - Trimmed analog clock max width on sm to reduce overflow and keep a tighter stack.
 * v2.6.54 - 2026-01-13 - Added xs padding to full-bleed top banner so the creative never touches viewport edges.
 * v2.6.53 - 2026-01-13 - Made /app top banner full-bleed like /calendar while keeping height-aware layout sizing.
 * v2.6.52 - 2026-01-13 - Restored top referral banner on /app and included it in height calculations for responsive, mobile-first layout.
 * v2.6.51 - 2026-01-13 - Matched /app clock stack layout to /calendar with centered max-width container and tighter digital/timezone spacing.
 * v2.6.50 - 2026-01-13 - Included AppBar wrapper spacing in height measurement and clamped clock stack whenever it exceeds viewport to stop overflow.
 * v2.6.49 - 2026-01-13 - Wrapped /app AppBar in shared dashboard container sizing to mirror /calendar widths/heights on all breakpoints.
 * v2.6.48 - 2026-01-13 - Restored DashboardAppBar on /app with mobile bottom nav and matched centered layout widths; added bottom padding to clear mobile nav.
 * v2.6.47 - 2026-01-13 - Enforced square analog clock sizing with layout-aware width measuring to prevent responsive stretching across breakpoints.
 * v2.6.46 - 2026-01-13 - Removed DashboardAppBar and AdTopBanner chrome from the /app experience.
 * v2.6.45 - 2026-01-12 - Matched /app layout to /calendar: changed chrome wrapper to width:100% for full-width banner/appbar; updated clock size calculation to account for content padding for consistent 1:1 square aspect ratio on all breakpoints.
 * v2.6.44 - 2026-01-12 - Implemented mobile-first responsive centering: replaced width:100% + maxWidth:100% with responsive maxWidth (360/540/full) for xs/sm/md+ to ensure proper horizontal centering of banner, AppBar, and clock canvas.
 * v2.6.43 - 2026-01-12 - Fixed horizontal centering: added alignItems:center to viewportFrameSx and mx:auto to chrome wrapper for proper center alignment of all /app content to viewport.
 * v2.6.42 - 2026-01-12 - Fixed xs/sm horizontal centering: applied maxWidth constraint and flexbox centering to chrome wrapper; ensures AppBar height consistency across pages.
 * v2.6.41 - 2026-01-12 - Fixed AppBar chrome consistency: standardized banner wrapper margins and removed width:100% from app-container for proper horizontal centering on md+ breakpoints.
 * v2.6.40 - 2026-01-12 - Applied calendar layout constraints (maxWidth 1560, shared padding) to /app so AppBar width matches across pages.
 * v2.6.39 - 2026-01-12 - Match AppBar vertical spacing to /calendar by wrapping AdTopBanner with consistent margin and container.
 * v2.6.38 - 2026-01-12 - Apply shared AppBar container spacing so top chrome matches /calendar and /about.
 * v2.6.37 - 2026-01-12 - Fold digital clock and timezone label heights into canvas sizing and account for bottom padding so chrome fits without overflow across breakpoints.
 * v2.6.36 - 2026-01-12 - Remove residual scrollbars on /app by clamping the viewport frame and flexing the main container to fill available height without extra padding.
 * v2.6.35 - 2026-01-12 - Add AdTopBanner and DashboardAppBar to the in-app experience with mobile-first navigation (lock icon for unlock CTA).
 * v2.6.34 - 2026-01-09 - Wire ContactModal from settings Contact button to avoid /contact redirect inside the app.
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

import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, useMediaQuery, Dialog, DialogTitle, DialogContent, IconButton, Button, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
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
import InstallPromptCTA from './components/InstallPromptCTA';
import { MOBILE_BOTTOM_APPBAR_HEIGHT_PX } from './components/AppBar';
import PublicLayout from './components/PublicLayout';
import { isColorDark, normalizeClockSize } from './utils/clockUtils';
import './index.css';  // Import global CSS styles
import './App.css';    // Import App-specific CSS

const SettingsSidebar2 = lazy(() => import('./components/SettingsSidebar2'));
const AuthModal2 = lazy(() => import('./components/AuthModal2'));
const ClockEventsOverlay = lazy(() => import('./components/ClockEventsOverlay'));
const ContactModal = lazy(() => import('./components/ContactModal'));
const EventModal = lazy(() => import('./components/EventModal'));
const EventsFilters3 = lazy(() => import('./components/EventsFilters3'));
const TimezoneSelector = lazy(() => import('./components/TimezoneSelector'));

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
    updateEventFilters,
  } = useSettings();

  const { isAuthenticated, loading: authLoading, profileLoading } = useAuth();
  const theme = useTheme();
  const isMobileNav = useMediaQuery(theme.breakpoints.down('sm'));

  const sessionLabelVisible = false;
  const timezoneLabelActive = showTimezoneLabel || !showDigitalClock;

  const timeEngine = useTimeEngine(selectedTimezone);

  const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } =
    useClock(selectedTimezone, sessions, timeEngine);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedEventFromClock, setSelectedEventFromClock] = useState(null);
  const [calculatedClockSize, setCalculatedClockSize] = useState(clockSize);
  const [hasCalculatedClockSize, setHasCalculatedClockSize] = useState(false);
  const [hasRenderedSettingsDrawer, setHasRenderedSettingsDrawer] = useState(false);
  const [hasRenderedAuthModal, setHasRenderedAuthModal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
  const [shouldRenderEventsOverlay, setShouldRenderEventsOverlay] = useState(false);
  const [minLoaderElapsed, setMinLoaderElapsed] = useState(false);
  const appContainerRef = useRef(null);
  const { isFullscreen } = useFullscreen(appContainerRef);
  const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
  useClockVisibilitySnap({ handAnglesRef, currentTime, resumeToken: timeEngine?.resumeToken });
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [clockShellWidth, setClockShellWidth] = useState(null);
  const clockShellRef = useRef(null);

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
  const suppressInstallPrompt = showLoadingScreen || authModalOpen || settingsOpen;

  // showAuthCta retained for future guest CTA reuse; lint-ignore to avoid unused warning
  // eslint-disable-next-line no-unused-vars
  const showAuthCta = useMemo(
    () => !authModalOpen && !authLoading && !profileLoading && !isAuthenticated() && !showLoadingScreen && !renderSkeleton,
    [authModalOpen, authLoading, profileLoading, isAuthenticated, showLoadingScreen, renderSkeleton],
  );

  const timezoneLabelText = useMemo(() => {
    if (!selectedTimezone) return '';
    return selectedTimezone.replace(/_/g, ' ');
  }, [selectedTimezone]);

  const handleEventFromClockClick = useCallback((evt) => {
    if (!isAuthenticated()) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedEventFromClock(evt);
  }, [isAuthenticated]);

  const handleOpenAuth = useCallback(() => {
    setSettingsOpen(false);
    setAuthModalOpen(true);
  }, []);

  const openContactModal = useCallback(() => {
    setSettingsOpen(false);
    setContactModalOpen(true);
  }, []);
  const closeContactModal = useCallback(() => setContactModalOpen(false), []);

  // EventsFilters3 handlers - persist filter changes to SettingsContext (Firestore/localStorage)
  const handleFiltersChange = useCallback((nextFilters) => {
    updateEventFilters(nextFilters);
  }, [updateEventFilters]);

  const handleApplyFilters = useCallback((nextFilters) => {
    updateEventFilters(nextFilters);
  }, [updateEventFilters]);

  const navItems = useMemo(
    () => [
      {
        id: 'calendar',
        label: 'Calendar',
        shortLabel: 'Calendar',
        to: '/calendar',
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
        ariaLabel: 'Economic calendar',
      },
      {
        id: 'clock',
        label: 'Trading Clock',
        shortLabel: 'Clock',
        to: '/clock',
        icon: <AccessTimeRoundedIcon fontSize="small" />,
        ariaLabel: 'Open the trading clock',
      },
      {
        id: 'about',
        label: 'About',
        shortLabel: 'About',
        to: '/about',
        icon: <InfoRoundedIcon fontSize="small" />,
        ariaLabel: 'Learn about Time 2 Trade',
      },
      {
        id: 'contact',
        label: 'Contact',
        shortLabel: 'Help',
        onClick: openContactModal,
        icon: <SupportAgentRoundedIcon fontSize="small" />,
        ariaLabel: 'Contact support',
      },
      {
        id: 'signin',
        label: 'Sign in',
        shortLabel: 'Sign in',
        icon: <LockOpenRoundedIcon fontSize="small" />,
        onClick: handleOpenAuth,
        primary: true,
        ariaLabel: 'Sign in or create an account',
      },
    ],
    [handleOpenAuth, openContactModal],
  );

  const sessionLabelActive = sessionLabelVisible && showSessionLabel;

  const navBottomInset = isMobileNav ? MOBILE_BOTTOM_APPBAR_HEIGHT_PX : 0;
  const contentPaddingBottom = useMemo(
    () => safeAreaBottom + navBottomInset + 8,
    [navBottomInset, safeAreaBottom],
  );

  useLayoutEffect(() => {
    const measureSafeArea = () => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      const topInset = parseFloat(computed.getPropertyValue('env(safe-area-inset-top, 0px)')) || 0;
      const bottomInset = parseFloat(computed.getPropertyValue('env(safe-area-inset-bottom, 0px)')) || 0;
      setSafeAreaTop(topInset);
      setSafeAreaBottom(bottomInset);
    };

    measureSafeArea();
    window.addEventListener('resize', measureSafeArea);
    return () => window.removeEventListener('resize', measureSafeArea);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const node = clockShellRef.current;
    if (!node) return undefined;

    let rafId = null;
    const measureWidth = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const nextWidth = rect?.width ? Math.round(rect.width) : null;
        setClockShellWidth((prev) => {
          if (!nextWidth) return prev;
          if (prev === nextWidth) return prev;
          return nextWidth;
        });
      });
    };

    measureWidth();

    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(measureWidth)
      : null;

    if (observer) {
      observer.observe(node);
    }
    window.addEventListener('resize', measureWidth);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measureWidth);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Calculate the actual clock size based on viewport height and percentage
  useEffect(() => {
    const calculateSize = () => {
      const viewportHeight = appContainerRef.current?.getBoundingClientRect().height || window.innerHeight;
      const viewportWidth = window.innerWidth;

      const chromeHeight = safeAreaTop;

      // Account for fixed elements (minimal margins)
      const settingsButtonHeight = 48; // Top margin + button size (10px + 38px)
      const bottomPadding = contentPaddingBottom; // padding we add to clear safe area

      // Calculate scaling factor for digital clock and label based on base 375px
      const baseSize = 375;

      // Element height ratios relative to canvas size (based on 375px reference)
      const digitalClockRatio = showDigitalClock ? 0.133 : 0; // ~50px / 375px
      const timezoneLabelRatio = timezoneLabelActive ? 0.07 : 0; // ~26px / 375px
      const sessionLabelRatio = sessionLabelActive ? 0.213 : 0; // ~80px / 375px

      // Total ratio: canvas + digital clock + timezone label + session label
      const totalRatio = 1 + digitalClockRatio + timezoneLabelRatio + sessionLabelRatio;

      // Available height for all elements (minimal buffer)
      const availableHeight = viewportHeight - chromeHeight - settingsButtonHeight - bottomPadding - 10; // 10px tiny buffer

      // Calculate canvas size based on the percentage and ratio
      let calculatedSize = normalizeClockSize((availableHeight / totalRatio) * (canvasSize / 100));

      // Ensure minimum size of 150px
      calculatedSize = Math.max(150, calculatedSize);

      // Respect viewport width considering content padding
      // On xs/sm: padding is 16px (2 * 8px from px: 2)
      // On sm: padding is 22px (2 * 11px from px: 2.75)
      // On md+: padding is 28px (2 * 14px from px: 3.5)
      let horizontalPadding = 16; // xs default
      if (viewportWidth >= 600 && viewportWidth < 900) {
        horizontalPadding = 22; // sm
      } else if (viewportWidth >= 900) {
        horizontalPadding = 28; // md+
      }

      // Respect actual clock shell width (handles grid/landscape layouts that constrain the column)
      const effectiveShellWidth = clockShellWidth && clockShellWidth > 0 ? clockShellWidth : viewportWidth;
      const widthBudget = Math.max(0, Math.min(viewportWidth - horizontalPadding, effectiveShellWidth));

      // Calculate max width size accounting for content container padding
      const maxWidthSize = Math.max(0, widthBudget);
      calculatedSize = Math.min(calculatedSize, maxWidthSize);

      // Verify everything fits with actual scaled sizes
      const actualDigitalHeight = showDigitalClock ? Math.round(60 * (calculatedSize / baseSize)) : 0;
      const actualTimezoneLabelHeight = timezoneLabelActive ? Math.round(28 * (calculatedSize / baseSize)) : 0;
      const actualLabelHeight = sessionLabelActive ? Math.round(100 * (calculatedSize / baseSize)) : 0;
      // Include vertical margins/padding around digital/timezone blocks for accurate clamping
      const verticalSpacingBuffer =
        (showDigitalClock ? 24 : 0) +
        (timezoneLabelActive ? 24 : 0) +
        (sessionLabelActive ? 28 : 0);

      const totalHeightNeeded = calculatedSize + actualDigitalHeight + actualTimezoneLabelHeight + actualLabelHeight + settingsButtonHeight + 20 + chromeHeight + bottomPadding + verticalSpacingBuffer;

      // If we exceed viewport at 100%, adjust down
      if (totalHeightNeeded > viewportHeight) {
        const adjustmentFactor = viewportHeight / totalHeightNeeded;
        calculatedSize = Math.floor(calculatedSize * adjustmentFactor * 0.98); // 98% for tiny safety margin
      }

      setCalculatedClockSize(normalizeClockSize(calculatedSize));
      setHasCalculatedClockSize(true);
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);

    return () => window.removeEventListener('resize', calculateSize);
  }, [canvasSize, clockShellWidth, contentPaddingBottom, safeAreaTop, sessionLabelActive, showDigitalClock, timezoneLabelActive]);

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
  }, [effectiveBackground, applyThemeColor, backgroundBasedOnSession, activeSession]);

  useEffect(() => {
    const handleVisibility = () => applyThemeColor(effectiveBackground);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [applyThemeColor, effectiveBackground, backgroundBasedOnSession, activeSession]);

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
      import('./components/AuthModal2');
      if (showEventsOnCanvas) {
        import('./components/ClockEventsOverlay');
        import('./components/EventModal');
      }
    });

    return () => cancelIdle(id);
  }, [showEventsOnCanvas]);

  const closeEventModal = () => {
    setSelectedEventFromClock(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setMinLoaderElapsed(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const ready = !isLoading && hasCalculatedClockSize && minLoaderElapsed;

  if (!ready) {
    return (
      <PublicLayout
        navItems={navItems}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      >
        <Box
          className="app-container"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: effectiveBackground,
          }}
        >
          <InstallPromptCTA isBusy />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flex: 1,
              width: '100%',
            }}
          >
            {/* LoadingScreen now handled by PublicLayout */}
          </Box>
        </Box>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      navItems={navItems}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenAuth={() => setAuthModalOpen(true)}
    >
      <Box
        ref={appContainerRef}
        className="app-container"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: effectiveBackground,
        }}
      >
        <InstallPromptCTA isBusy={suppressInstallPrompt} />

        <Box
          sx={{
            backgroundColor: effectiveBackground,
            opacity: 1,
            pointerEvents: 'auto',
            transition: 'opacity 0.6s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            flex: 1,
            alignItems: 'center',
            pb: { xs: 'calc(8 * 8px + 48px)', sm: 'calc(8 * 8px + 48px)', md: contentPaddingBottom },
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Settings gear removed; access settings from events drawer header */}

          {/* Date Range Label - removed as of v2.6.18: ClockEventsOverlay always shows today's events only, regardless of date range selection in EventsFilters3 */}

          <div className="clock-elements-container">
            <Box
              sx={{
                width: '100%',
                maxWidth: { xs: 420, sm: 480, md: 560 },
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: { xs: 1.25, sm: 1.5 },
              }}
            >
              <Typography
                component="h1"
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  color: effectiveTextColor,
                }}
              >
                Trading Clock
              </Typography>
              {/* EventsFilters3 - filter controls above the clock on md+, hidden on xs/sm (moved below timezone label) */}
              <Suspense fallback={null}>
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 480, md: '100%', lg: 560 },
                    px: { xs: 0.25, sm: 0, md: 0 },
                    mb: { xs: 0.5, sm: 1, md: 1.25 },
                  }}
                >
                  <EventsFilters3
                    filters={eventFilters}
                    onFiltersChange={handleFiltersChange}
                    onApply={handleApplyFilters}
                    loading={overlayLoading}
                    timezone={selectedTimezone}
                    newsSource={newsSource}
                    defaultPreset="today"
                    showDateFilter={false}
                    showSearchFilter={false}
                    centerFilters={true}
                    textColor={effectiveTextColor}
                  />
                </Box>
              </Suspense>

              {showHandClock && (
                <Box
                  className="hand-clock"
                  ref={clockShellRef}
                  sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  {renderSkeleton ? (
                    <Box sx={{ width: calculatedClockSize, maxWidth: '100%', aspectRatio: '1 / 1' }} />
                  ) : (
                    <Box
                      className="hand-clock-wrapper"
                      sx={{ position: 'relative', width: '100%', maxWidth: calculatedClockSize, aspectRatio: '1 / 1' }}
                    >
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
                            onEventClick={handleEventFromClockClick}
                            onLoadingStateChange={showHandClock ? setOverlayLoading : undefined}
                          />
                        </Suspense>
                      ) : null}
                    </Box>
                  )}
                </Box>
              )}

              {showDigitalClock && !renderSkeleton && (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: { xs: 1.5, sm: 1.25 } }}>
                  <DigitalClock time={currentTime} clockSize={calculatedClockSize} textColor={effectiveTextColor} />
                </Box>
              )}

              {timezoneLabelActive && !renderSkeleton && timezoneLabelText && (
                <Box
                  sx={{
                    textAlign: 'center',
                    mt: { xs: 0.25, sm: 0.5 },
                    mb: { xs: 0.75, sm: 1 },
                    px: { xs: 1.5, sm: 2 },
                    maxWidth: { xs: '95%', sm: calculatedClockSize },
                    mx: 'auto',
                  }}
                >
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setTimezoneModalOpen(true)}
                    sx={{
                      textTransform: 'none',
                      color: alpha(effectiveTextColor, 0.7),
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 600,
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                      '&:hover': {
                        bgcolor: alpha(effectiveTextColor, 0.08),
                        color: effectiveTextColor,
                      },
                    }}
                  >
                    {timezoneLabelText}
                  </Button>
                </Box>
              )}

              {/* EventsFilters3 - filter controls fixed at bottom on xs/sm (above mobile AppBar), shown above clock on md+ */}
              <Suspense fallback={null}>
                <Box
                  sx={{
                    display: { xs: 'block', md: 'none' },
                    position: { xs: 'fixed', md: 'static' },
                    left: { xs: 0, md: 'auto' },
                    right: { xs: 0, md: 'auto' },
                    bottom: { xs: MOBILE_BOTTOM_APPBAR_HEIGHT_PX, md: 'auto' },
                    width: { xs: 'auto', md: 'auto' },
                    maxWidth: { md: '100%', lg: 560 },
                    zIndex: 1300,
                    px: { xs: 1, sm: 1.25, md: 0 },
                    py: { xs: 0.5, sm: 0.75, md: 0 },
                    borderTop: { xs: 'none', md: 'none' },
                    borderColor: { xs: 'transparent', md: 'transparent' },
                    bgcolor: { xs: 'transparent', md: 'transparent' },
                    backdropFilter: { xs: 'none', md: 'none' },
                    boxShadow: { xs: 'none', md: 'none' },
                    boxSizing: 'border-box',
                    mb: { md: 1.25 },
                  }}
                >
                  <EventsFilters3
                    filters={eventFilters}
                    onFiltersChange={handleFiltersChange}
                    onApply={handleApplyFilters}
                    loading={overlayLoading}
                    timezone={selectedTimezone}
                    newsSource={newsSource}
                    defaultPreset="today"
                    showDateFilter={false}
                    showSearchFilter={false}
                    centerFilters={true}
                    textColor={effectiveTextColor}
                  />
                </Box>
              </Suspense>

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
            </Box>
          </div>
        </Box>

        {(hasRenderedSettingsDrawer || settingsOpen) && (
          <Suspense fallback={null}>
            <SettingsSidebar2
              open={settingsOpen && !authModalOpen}
              onClose={() => setSettingsOpen(false)}
              onOpenAuth={handleOpenAuth}
              onOpenContact={openContactModal}
            />
          </Suspense>
        )}

        {/* Event Modal - Opens when auth user clicks clock event */}
        {selectedEventFromClock && isAuthenticated() && (
          <Suspense fallback={null}>
            <EventModal
              open={Boolean(selectedEventFromClock)}
              onClose={closeEventModal}
              event={selectedEventFromClock}
              timezone={selectedTimezone}
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
              redirectPath="/clock"
            />
          </Suspense>
        )}

        {contactModalOpen && (
          <Suspense fallback={null}>
            <ContactModal open={contactModalOpen} onClose={closeContactModal} />
          </Suspense>
        )}

        {/* Timezone Modal - Opens when user clicks timezone label button */}
        <Dialog
          open={timezoneModalOpen}
          onClose={() => setTimezoneModalOpen(false)}
          maxWidth="xs"
          fullWidth
          fullScreen={false}
          sx={{ zIndex: 1701 }}
          slotProps={{
            backdrop: { sx: { zIndex: -1 } },
          }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Select Timezone
            </Typography>
            <IconButton
              edge="end"
              onClick={() => setTimezoneModalOpen(false)}
              aria-label="close"
              sx={{
                ml: 1,
                p: { xs: 1, sm: 1.25, md: 1.5 },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 3 }}>
            <Suspense fallback={null}>
              <TimezoneSelector
                textColor={theme.palette.text.primary}
                onRequestSignUp={handleOpenAuth}
                onTimezoneChange={() => setTimezoneModalOpen(false)}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      </Box>
    </PublicLayout>
  );
}
