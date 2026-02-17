/**
 * src/components/ClockPanelPaper.jsx
 *
 * Purpose: Standalone clock panel Paper component for /calendar page left rail.
 * Displays market clock with canvas, overlays, session label, and timezone selector.
 * Separated from CalendarEmbed for better separation of concerns and overflow control.
 *
 * Key Features:
 * - Self-contained overflow control (minWidth: 0, maxWidth: 100%, overflow: hidden)
 * - Responsive clock sizing with container-aware calculations
 * - Session-based dynamic background color support
 * - Lazy-loaded ClockEventsOverlay for performance
 *
 * Changelog:
 * v3.2.1 - 2026-02-14 - BEP SESSION LABEL PARITY: Capped SessionLabel scaling on /calendar by
 *                        passing a max clockSize of 320. Prevents the calendar clock (often 440px
 *                        on md+) from inflating the label typography compared to the /clock sidebar.
 * v3.2.0 - 2026-02-14 - BEP CLOCK/CALENDAR PARITY: On xs/sm the /clock page now uses the same
 *                        width-only sizing as /calendar (no height constraint). Previously /clock
 *                        used Math.min(cw, ch) on ALL breakpoints — on xs/sm this height-constrained
 *                        the clock because flex:1 without aspectRatio collapsed the container height
 *                        below its width. Fix: use aspectRatio:1/1 + width-only sizing on xs/sm for
 *                        ALL pages. min(cw,ch) only applies on md+ /clock where flex:1 fills viewport.
 * v3.1.0 - 2026-02-14 - BEP RESPONSIVE FIX: Replaced window resize listener with ResizeObserver
 *                        for reliable container-measured sizing on tab switch/reflow. Removed
 *                        excessive labelInset (20px xs, 8px sm) + extra isXs 8px subtraction
 *                        that stole ~28px on mobile. Paper padding already provides breathing room.
 *                        Removed 440px cap on xs/sm so clock fills full Paper width — cap only on
 *                        md+. Changed breakpoint check from isXs to isMdUp so BOTH xs and sm get
 *                        uncapped sizing (sm devices in single-column layout can exceed 440px).
 *                        TabbedStickyPanel Paper padding also reduced (p:2→p:{xs:1.5,md:2}).
 * v3.0.0 - 2026-02-14 - BEP RESPONSIVE CLOCK SIZING: Unified sizing to container-measured on
 *                        ALL pages. Removed viewport-based math (window.innerWidth/innerHeight,
 *                        gutter guessing) from /calendar path. Now measures container ref width
 *                        directly — truly responsive to Paper width on xs/sm. Outer clock Box
 *                        maxWidth changed from { xs: 420, sm: 520 } to '100%' on xs/sm so clock
 *                        fills its Paper naturally. 440px bitmap cap preserved for md+. Clock
 *                        maintains 1:1 proportions via aspectRatio CSS on container + wrapper.
 * v2.9.0 - 2026-02-13 - BEP CONSOLIDATION: Removed /clock2 references. ClockPage2 now serves /clock.
 *                        hideSessionLabelOnRoute checks /clock (SessionLabel in right sidebar).
 * v2.8.0 - 2026-02-13 - BEP UI CLEANUP: Removed subtitle from all routes. Added hideSessionLabelOnRoute
 *                        to conditionally hide SessionLabel on /clock (moves to right column sidebar).
 * v2.7.0 - 2026-02-13 - BEP ROUTE AWARE: ClockPage2 uses MainLayout with ClockPanelPaper in
 *                        left column — requires same flex-fill sizing as /clock. isClockPage and
 *                        hideHeaderChrome apply to /clock.
 * v2.6.0 - 2026-02-13 - BEP LAYOUT: Repositioned Session Label to render between clock canvas and
 *                        timezone button (was after timezone button). New visual hierarchy on all pages:
 *                        Clock Canvas → Session Label → Timezone Button. Improves focus flow and makes
 *                        session status prominent above timezone controls. Applied to /clock, /calendar,
 *                        and all other pages using ClockPanelPaper component.
 * v2.5.0 - 2026-02-12 - BEP I18N SKELETON GUARD: Added Skeleton placeholders for all i18n-dependent
 *                        text (title, subtitle, add-reminder tooltip/aria, hidden message) while
 *                        translations load on initial page mount. Uses useTranslation ready flag.
 *                        Header stays visible with skeletons during load instead of flashing raw keys.
 *                        LoadingAnimation continues to show in clock area. Page-load only, not tab switch.
 * v2.4.0 - 2026-02-12 - BEP MOBILE TOUCH: Pass allowTouchScroll + touchTooltipDelayMs=150 to
 *                        ClockCanvas. Enables normal page scrolling over the clock on mobile
 *                        touch devices while preserving tap-to-inspect session arc tooltips.
 *                        150ms delay prevents accidental tooltips during swipe gestures.
 * v2.3.4 - 2026-02-11 - BEP THEME CONSISTENCY: Updated timezone button to match date/time styling. 
 *                        Changed fontWeight from 600 to 700 (bold), color to alpha(clockPaperTextColor, 0.8)
 *                        to match date and digital time labels. Hover state also uses alpha 0.8 for consistency.
 * v2.3.3 - 2026-02-11 - BEP ACCESSIBILITY: Fixed timezone button text color from alpha(clockPaperTextColor, 0.72) 
 *                        to full clockPaperTextColor for WCAG AA contrast compliance. Button now displays with
 *                        proper foreground color that adapts to session backgrounds + theme modes. Hover state 
 *                        reduced from alpha 0.1 to 0.08 for cleaner background feedback.
 * v2.3.2 - 2026-02-10 - BEP LOADING FIX: Removed opaque bgcolor + borderRadius from loading overlay Box that
 *                        created a visible white circle on transparent backgrounds (landing page). Overlay now
 *                        floats transparently above canvas. Bumped zIndex to 4 (above hands at z:3).
 * v2.3.1 - 2026-02-10 - Rename Market Clock branding in header/changelog copy.
 * v2.3.0 - 2026-02-08 - BEP LANDING CHROME: Hide title, subtitle, add-event button, and divider on
 *                        landing page (/) in addition to /clock page. Date, digital time, clock canvas,
 *                        and timezone button remain visible on all breakpoints. New hideHeaderChrome
 *                        boolean decouples header visibility from /clock-specific flex-fill sizing.
 * v2.2.0 - 2026-02-07 - BEP PARALLEL RENDER: Clock canvas + hands now render immediately behind the
 *                        LoadingAnimation overlay. Previous ternary blocked canvas mount until sizing
 *                        completed. Now both paint in parallel — canvas draws arcs/hands while the
 *                        loading overlay sits on top (z-index 2, circular bg match). Overlay unmounts
 *                        once workspaceHasSize flips true (~2 rAF frames). Zero layout shift, faster
 *                        perceived load. Event markers still load independently (no blocking).
 * v2.1.0 - 2026-02-07 - BEP LOADING ANIMATION: Re-integrated LoadingAnimation inside hand-clock-wrapper
 *                        while !workspaceHasSize. Shows rotating donut animation inside the clock panel
 *                        during initial sizing, replacing empty null render. Does NOT wait for event
 *                        markers to load — animation clears as soon as clock canvas is ready. Applies
 *                        to all pages (/clock, /calendar) via single source of truth in ClockPanelPaper.
 * v2.0.0 - 2026-02-07 - BEP LOADING STATE PASS-THROUGH: Added onLoadingStateChange prop to accept
 *                        loading state callback from parent (ClockPage, Calendar2Page). Passes it
 *                        through to ClockEventsOverlay so loading state can disable filters on both
 *                        pages. Improves UX by preventing filter changes during event data load.
 * v1.8.0 - 2026-02-07 - BEP FLEX-CHAIN FIX: Fixed clock staying tiny because outer clock Box used
 *                        flex-row (default) + alignItems:center, which shrank container ref to content
 *                        height instead of filling parent. On /clock: outer Box switches to
 *                        flexDirection:column so flex:1 on container ref controls height. Removed
 *                        belowClockChrome subtraction (timezone/session are Stack siblings, outside ref).
 *                        Container ref now reports true available height. Clock = min(width, height).
 * v1.7.0 - 2026-02-07 - BEP CONTAINER-MEASURED SIZING: Replaced hardcoded viewport overhead with
 *                        actual container measurement. On /clock, outer Box gets flex:1+minHeight:0 to fill
 *                        available space from ClockPage Paper. computeBaseSize reads containerRef height AND
 *                        width via getBoundingClientRect, uses min(h,w) for clock size. Container ref Box
 *                        drops aspectRatio on /clock (rectangular fill) — only inner .hand-clock-wrapper
 *                        maintains 1:1 square. Zero scroll on desktop/tablet; natural on very small screens.
 *                        /calendar sidebar completely unaffected (440px cap + original overhead preserved).
 * v1.6.0 - 2026-02-07 - BEP VIEWPORT-FILL: Replaced naive height budget with page-aware overhead.
 * v1.5.1 - 2026-02-07 - BEP DEV HOTFIX: Memoized isClockPage computation with useMemo and added fallback for
 *                        useLocation hook to prevent dependency array size changes during hot reload.
 *                        Fixes React warning: "The final argument passed to useEffect changed size between renders"
 * v1.5.0 - 2026-02-07 - BEP CONTAINER-AWARE SIZING: On /clock page, removed hardcoded 440px cap and
 *                        breakpoint maxWidth constraints (xs:420, sm:520, md:560). Clock now fills
 *                        available Paper container width while maintaining 1:1 aspect ratio via
 *                        aspectRatio CSS + container measurement. On /calendar, existing caps preserved
 *                        to keep clock compact in sidebar. Zero CSS breakage — conditional on isClockPage.
 * v1.4.0 - 2026-02-07 - BEP PAGE-AWARE: Added useLocation hook to detect /clock page. When pathname is '/clock', conditionally hide title, subtitle, add-icon button, and divider. Date/time display remains visible. Eliminates redundant header elements on /clock since ClockPage has its own title, filters, and add-event row. Single source of truth for header content.
 * v1.3.0 - 2026-02-07 - BEP NESTING REDUCTION: Removed outer Paper wrapper. ClockPanelPaper now returns Box content directly, relying on MainLayout.jsx Paper container. Eliminates unnecessary Paper nesting, simplifies component hierarchy, and lets MainLayout own all container styling (border, padding, border-radius). Maintains internal flex layout and content spacing.
 * v1.2.2 - 2026-02-07 - BEP CSS FIX: Import App.css for .clock-event-flag marker badge styles. Previously only CalendarEmbed, LandingPage, and App.jsx imported this CSS, causing missing flag badge positioning when ClockPanelPaper was used standalone (e.g., Calendar2Page). Self-contained dependency ensures markers render correctly on any page.
 * v1.2.0 - 2026-01-29 - BEP THEME AWARE: Fixed timezone button to use clockPaperTextColor instead of handColor. Button now adapts dynamically to both light/dark theme modes and session-based backgrounds. Ensures consistent text color adaptation across button text and hover states, matching the paper background context rather than canvas hand visibility.
 * v1.1.0 - 2026-01-28 - BEP THEME: Replaced hardcoded colors with theme tokens. Changed '#ffffff' to theme.palette.background.paper, '#F6F9FB' to theme.palette.background.default, '#0F172A' to theme.palette.text.primary. All clock surface, hand, and text colors now adapt to light/dark theme modes dynamically.
 * v1.0.9 - 2026-01-29 - BEP CONSISTENCY: Fixed font color to match Economic Calendar. Changed clockPaperTextColor to use theme.palette.text.primary when backgroundBasedOnSession is false (instead of hardcoded '#0F172A'). Now Market Clock panel text color matches CalendarEmbed's text color exactly, ensuring consistent font UI across /calendar page.
 * v1.0.8 - 2026-01-29 - BEP CONSISTENCY: Updated title Typography styling to exactly match CalendarEmbed title. Changed lineHeight from 1.1 to 1.2 (lineHeight: 1.2) for perfect visual consistency between "Market Clock" and "Economic Calendar" titles on /calendar page. Both now use variant="h6" with fontWeight: 900 and lineHeight: 1.2.
 * v1.0.6 - 2026-01-27 - BEP i18n migration: Added useTranslation hook, replaced 6 hardcoded strings with t() calls for calendar namespace (Market Clock title, Add reminder tooltips, subtitle, clock hidden message, Select Timezone fallback, aria-labels). Full i18n compliance for EN/ES/FR.
 * v1.0.5 - 2026-01-22 - BEP: Add circular border to Add reminder button with hover state (1.5px solid border with alpha transparency).
 * v1.0.4 - 2026-01-22 - BEP: Replace settings gear icon with Add icon that opens CustomEventDialog for creating new reminders.
 * v1.0.3 - 2026-01-21 - Removed fullscreen shortcut button from the calendar clock panel.
 * v1.0.1 - 2026-01-15 - BORDER & DIVIDER COLOR CONSISTENCY: Changed border and divider colors from
 *   dynamic alpha(clockPaperTextColor, 0.18/0.2) to fixed alpha('#3c4d63', 0.12) to match the economic
 *   calendar paper styling. This ensures consistent UI colors across the /calendar page regardless of
 *   background color settings, following enterprise dashboard design patterns with unified chrome styling.
 * v1.0.0 - 2026-01-15 - Initial implementation. Extracted from CalendarEmbed.jsx (ClockPanel).
 *   Added proper overflow containment with minWidth: 0 on all flex/grid children.
 *   Added overflow: hidden on Paper to prevent content escaping bounds.
 *   Follows enterprise MUI patterns for responsive flex containers.
 */

import { Suspense, lazy, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Divider,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
import SessionLabel from './SessionLabel';
import LoadingAnimation from './LoadingAnimation';

import { useClock } from '../hooks/useClock';
import { useClockVisibilitySnap } from '../hooks/useClockVisibilitySnap';
import { isColorDark } from '../utils/clockUtils';

// BEP: Import shared marker styles (.clock-event-flag positioning/sizing for ClockEventsOverlay badges)
import '../App.css';

const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));

/**
 * ClockPanelPaper - Market clock panel for calendar page left rail
 */
const ClockPanelPaper = memo(function ClockPanelPaper({
    timeEngine,
    clockTimezone,
    sessions,
    clockStyle,
    showSessionNamesInCanvas,
    showPastSessionsGray,
    showClockNumbers,
    showClockHands,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    showTimeToEnd,
    showTimeToStart,
    showEventsOnCanvas,
    eventFilters,
    newsSource,
    backgroundBasedOnSession,
    selectedTimezone,
    onOpenTimezone,
    onOpenEvent,
    onOpenAddEvent,
    onLoadingStateChange,
}) {
    const { t, i18n, ready: isI18nReady } = useTranslation(['calendar', 'common']);
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
    const { pathname } = useLocation() || {};
    const isClockPage = useMemo(() => pathname === '/clock', [pathname]);
    // BEP v2.3.0: Hide title/subtitle/add-button/divider on /clock and landing (/)
    const hideHeaderChrome = useMemo(() => pathname === '/clock' || pathname === '/', [pathname]);
    // BEP v2.9.0: Hide SessionLabel on /clock (moves to right column sidebar in ClockPage2)
    const hideSessionLabelOnRoute = useMemo(() => pathname === '/clock', [pathname]);
    const { currentTime, activeSession, nextSession, timeToEnd, timeToStart } = useClock(clockTimezone, sessions, timeEngine);
    const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
    useClockVisibilitySnap({ handAnglesRef, currentTime, resumeToken: timeEngine?.resumeToken });

    const workspaceClockContainerRef = useRef(null);
    const [workspaceClockSize, setWorkspaceClockSize] = useState(260);
    const [workspaceHasSize, setWorkspaceHasSize] = useState(false);
    const [shouldRenderEventsOverlay, setShouldRenderEventsOverlay] = useState(false);

    // BEP v3.1.0: Compute clock size from actual container width using ResizeObserver.
    // Unified approach: measure container ref rect, use width for 1:1 square.
    // On /clock: min(width, height) to fill flex container.
    // On /calendar: container width drives size (Paper width → container width → clock size).
    // ResizeObserver reacts to ANY container size change (window resize, tab switch, reflow)
    // — no viewport math, no gutter guessing. Paper's own padding provides breathing room
    // so no extra labelInset subtraction is needed here.
    useEffect(() => {
        const el = workspaceClockContainerRef.current;
        if (!el) return undefined;

        const computeBaseSize = () => {
            const rect = el.getBoundingClientRect();
            const cw = Math.floor(rect.width);
            const ch = Math.floor(rect.height);

            if (cw < 10) return; // Not laid out yet

            if (isClockPage && isMdUp) {
                // /clock on md+: fill remaining Paper height via flex:1.
                // Use min(width, height) for the largest square that fits.
                if (ch < 10) return;
                const next = Math.max(180, Math.min(cw, ch));
                setWorkspaceClockSize((prev) => (prev === next ? prev : next));
                setWorkspaceHasSize(true);
            } else if (isMdUp) {
                // /calendar on md+: cap at 440px to keep clock compact in sidebar.
                const next = Math.max(180, Math.min(cw, 440));
                setWorkspaceClockSize((prev) => (prev === next ? prev : next));
                setWorkspaceHasSize(true);
            } else {
                // xs/sm (ALL pages): width is the single source of truth.
                // Columns stack vertically — no height constraint needed.
                // aspectRatio: 1/1 on the container ref guarantees a square.
                const next = Math.max(180, cw);
                setWorkspaceClockSize((prev) => (prev === next ? prev : next));
                setWorkspaceHasSize(true);
            }
        };

        // ResizeObserver fires on initial layout + any subsequent container size change
        const ro = new ResizeObserver(() => {
            window.requestAnimationFrame(computeBaseSize);
        });
        ro.observe(el);

        return () => ro.disconnect();
    }, [isMdUp, isClockPage]);

    // Deferred events overlay loading
    useEffect(() => {
        if (!showEventsOnCanvas) {
            setShouldRenderEventsOverlay(false);
            return undefined;
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

    // Color calculations
    const clockSurfaceColor = backgroundBasedOnSession && activeSession?.color ? activeSession.color : theme.palette.background.paper;
    const clockSurfaceIsDark = useMemo(() => isColorDark(clockSurfaceColor), [clockSurfaceColor]);
    const handColor = useMemo(() => (clockSurfaceIsDark ? theme.palette.background.default : theme.palette.text.primary), [clockSurfaceIsDark, theme.palette.background.default, theme.palette.text.primary]);
    const clockPaperBg = useMemo(
        () => (backgroundBasedOnSession && activeSession?.color ? activeSession.color : theme.palette.background.paper),
        [activeSession?.color, backgroundBasedOnSession, theme.palette.background.paper],
    );
    const clockPaperTextColor = useMemo(() => {
        if (!backgroundBasedOnSession) return theme.palette.text.primary;
        return isColorDark(clockPaperBg) ? '#F6F9FB' : theme.palette.text.primary;
    }, [backgroundBasedOnSession, clockPaperBg, theme.palette.text.primary]);

    // Date/time labels
    const todayFullDateLabel = useMemo(() => {
        const date = new Date(timeEngine?.nowEpochMs || Date.now());
        const baseOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        try {
            // BEP: Use i18n.language for locale-aware date formatting
            // When user switches language via LanguageSwitcher, date text updates (e.g., "Monday" → "Lunes" → "Lundi")
            return new Intl.DateTimeFormat(i18n.language, { ...baseOptions, timeZone: clockTimezone }).format(date);
        } catch {
            return new Intl.DateTimeFormat(i18n.language, baseOptions).format(date);
        }
    }, [clockTimezone, timeEngine?.nowEpochMs, i18n.language]);

    const headerDigitalClockLabel = useMemo(() => {
        if (!showDigitalClock || !currentTime) return null;

        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentTime.getSeconds().toString().padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes}:${seconds} ${ampm}`;
    }, [currentTime, showDigitalClock]);

    const shouldShowSessionLabel = Boolean(showSessionLabel && workspaceHasSize && !hideSessionLabelOnRoute);

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                // BEP: Content styling (Paper container now in MainLayout)
                color: clockPaperTextColor,
                minWidth: 0,
                maxWidth: '100%',
                width: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
                // BEP v1.7.0: On /clock, fill available Paper height from flex parent
                ...(isClockPage && { flex: 1, minHeight: 0 }),
            }}
        >
            {/* Header section */}
            <Stack spacing={0.75} sx={{ mb: 0.5, position: 'relative', minWidth: 0, maxWidth: '100%' }}>
                {!hideHeaderChrome && (
                    <>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ gap: 0.75 }}
                        >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                                    {isI18nReady ? t('calendar:clock.title') : <Skeleton variant="text" width={120} />}
                                </Typography>
                            </Stack>
                            <Tooltip title={isI18nReady ? t('calendar:tooltip.addReminder') : ''} placement="left">
                                <IconButton
                                    size="medium"
                                    onClick={onOpenAddEvent}
                                    sx={{
                                        color: alpha(clockPaperTextColor, 0.9),
                                        p: 0.75,
                                        border: '1.5px solid',
                                        borderColor: alpha(clockPaperTextColor, 0.2),
                                        borderRadius: '50%',
                                        '&:hover': {
                                            borderColor: alpha(clockPaperTextColor, 0.4),
                                            bgcolor: alpha(clockPaperTextColor, 0.08),
                                        },
                                    }}
                                    aria-label={isI18nReady ? t('calendar:aria.addReminder') : ''}
                                >
                                    <AddRoundedIcon fontSize="medium" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <Divider sx={{ borderColor: alpha('#3c4d63', 0.12) }} />
                    </>
                )}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        mt: 0.25,
                        gap: 1,
                        width: '100%',
                        minWidth: 0,
                        maxWidth: '100%',
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            fontWeight: 700,
                            letterSpacing: 0.15,
                            textAlign: 'left',
                            color: alpha(clockPaperTextColor, 0.8),
                            minWidth: 0,
                            flex: '1 1 auto',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {todayFullDateLabel}
                    </Typography>
                    {headerDigitalClockLabel ? (
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                fontWeight: 700,
                                letterSpacing: 0.15,
                                textAlign: 'right',
                                color: alpha(clockPaperTextColor, 0.8),
                                flex: '0 0 auto',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {headerDigitalClockLabel}
                        </Typography>
                    ) : null}
                </Stack>
            </Stack>

            {/* Clock content section */}
            <Stack
                spacing={0}
                alignItems="center"
                sx={{
                    p: 0,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'visible',
                    // BEP v1.7.0: On /clock, fill remaining height after header
                    ...(isClockPage && { flex: 1, minHeight: 0 }),
                }}
            >
                {showHandClock ? (
                    <Box
                        sx={{
                            width: '100%',
                            // BEP v3.0.0: On /clock, fill available space.
                            // On /calendar: xs/sm use 100% (fill Paper width for responsive sizing),
                            // md+ cap at 560px to keep clock compact in sidebar.
                            maxWidth: isClockPage ? '100%' : { xs: '100%', md: 560 },
                            mx: 'auto',
                            display: 'flex',
                            flexDirection: isClockPage ? 'column' : 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 0,
                            boxSizing: 'border-box',
                            minWidth: 0,
                            overflow: 'visible',
                            ...(isClockPage && { flex: 1, minHeight: 0 }),
                        }}
                    >
                        <Box
                            ref={workspaceClockContainerRef}
                            sx={{
                                width: '100%',
                                // BEP v3.1.0: On md+ /clock, container fills column height via flex:1
                                // and computeBaseSize reads min(width, height).
                                // On xs/sm (ALL pages), aspectRatio keeps container square
                                // and width is the single source of truth.
                                ...(isClockPage && isMdUp
                                    ? { flex: 1, minHeight: 0 }
                                    : { aspectRatio: '1 / 1' }),
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 0,
                                minWidth: 0,
                                maxWidth: '100%',
                                overflow: 'visible',
                            }}
                        >
                            <Box
                                className="hand-clock-wrapper"
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: workspaceClockSize,
                                    aspectRatio: '1 / 1',
                                    mx: 'auto',
                                    minWidth: 0,
                                    overflow: 'visible',
                                }}
                            >
                                {/* BEP v2.2.0: Always render clock canvas so arcs + hands paint in
                                    parallel behind the loading animation. LoadingAnimation overlays
                                    on top and fades out once workspaceHasSize is true. */}
                                <ClockCanvas
                                    size={workspaceClockSize}
                                    time={currentTime}
                                    sessions={sessions}
                                    handColor={handColor}
                                    clockStyle={clockStyle}
                                    showSessionNamesInCanvas={showSessionNamesInCanvas}
                                    showPastSessionsGray={showPastSessionsGray}
                                    showClockNumbers={showClockNumbers}
                                    showClockHands={showClockHands}
                                    activeSession={activeSession}
                                    backgroundBasedOnSession={backgroundBasedOnSession}
                                    renderHandsInCanvas={false}
                                    handAnglesRef={handAnglesRef}
                                    allowTouchScroll
                                    touchTooltipDelayMs={150}
                                />
                                <ClockHandsOverlay
                                    size={workspaceClockSize}
                                    handAnglesRef={handAnglesRef}
                                    handColor={handColor}
                                    time={currentTime}
                                    showSecondsHand={showClockHands}
                                />
                                {showEventsOnCanvas && shouldRenderEventsOverlay ? (
                                    <Suspense fallback={null}>
                                        <ClockEventsOverlay
                                            size={workspaceClockSize}
                                            timezone={clockTimezone}
                                            eventFilters={eventFilters}
                                            newsSource={newsSource}
                                            onEventClick={onOpenEvent || undefined}
                                            onLoadingStateChange={onLoadingStateChange}
                                            suppressTooltipAutoscroll
                                        />
                                    </Suspense>
                                ) : null}

                                {/* Loading overlay — sits on top of canvas, fades out when ready */}
                                {!workspaceHasSize && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 4,
                                        }}
                                    >
                                        <LoadingAnimation clockSize={Math.min(workspaceClockSize, 200)} isLoading />
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%' }}>
                        {isI18nReady ? t('calendar:clock.hidden') : <Skeleton variant="text" width={160} sx={{ mx: 'auto' }} />}
                    </Typography>
                )}

                {/* Session label — below clock, above timezone */}
                {shouldShowSessionLabel && workspaceHasSize ? (
                    <SessionLabel
                        activeSession={activeSession}
                        showTimeToEnd={showTimeToEnd}
                        timeToEnd={timeToEnd}
                        showTimeToStart={showTimeToStart}
                        nextSession={nextSession}
                        timeToStart={timeToStart}
                        clockSize={Math.min(workspaceClockSize, 320)}
                        contrastTextColor={handColor}
                        backgroundBasedOnSession={backgroundBasedOnSession}
                    />
                ) : null}

                {/* Timezone button */}
                {workspaceHasSize ? (
                    <Button
                        variant="text"
                        size="small"
                        onClick={onOpenTimezone}
                        sx={{
                            textTransform: 'none',
                            color: alpha(clockPaperTextColor, 0.8),
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            mt: 0.25,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': {
                                bgcolor: alpha(clockPaperTextColor, 0.08),
                                color: alpha(clockPaperTextColor, 0.8),
                            },
                        }}
                    >
                        {selectedTimezone?.replace(/_/g, ' ') || (isI18nReady ? t('calendar:clock.selectTimezone') : <Skeleton variant="text" width={110} />)}
                    </Button>
                ) : null}
            </Stack>

        </Box>
    );
});

ClockPanelPaper.propTypes = {
    timeEngine: PropTypes.object,
    clockTimezone: PropTypes.string.isRequired,
    sessions: PropTypes.arrayOf(PropTypes.object).isRequired,
    clockStyle: PropTypes.string,
    showSessionNamesInCanvas: PropTypes.bool,
    showPastSessionsGray: PropTypes.bool,
    showClockNumbers: PropTypes.bool,
    showClockHands: PropTypes.bool,
    showHandClock: PropTypes.bool,
    showDigitalClock: PropTypes.bool,
    showSessionLabel: PropTypes.bool,
    showTimeToEnd: PropTypes.bool,
    showTimeToStart: PropTypes.bool,
    showEventsOnCanvas: PropTypes.bool,
    eventFilters: PropTypes.object,
    newsSource: PropTypes.string,
    backgroundBasedOnSession: PropTypes.bool,
    selectedTimezone: PropTypes.string,
    onOpenSettings: PropTypes.func,
    onOpenTimezone: PropTypes.func,
    onOpenEvent: PropTypes.func,
    onOpenAddEvent: PropTypes.func,
    onLoadingStateChange: PropTypes.func,
};

ClockPanelPaper.displayName = 'ClockPanelPaper';

export default ClockPanelPaper;
