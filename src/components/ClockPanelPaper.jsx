/**
 * src/components/ClockPanelPaper.jsx
 *
 * Purpose: Standalone clock panel Paper component for /calendar page left rail.
 * Displays trading clock with canvas, overlays, session label, and timezone selector.
 * Separated from CalendarEmbed for better separation of concerns and overflow control.
 *
 * Key Features:
 * - Self-contained overflow control (minWidth: 0, maxWidth: 100%, overflow: hidden)
 * - Responsive clock sizing with container-aware calculations
 * - Session-based dynamic background color support
 * - Lazy-loaded ClockEventsOverlay for performance
 *
 * Changelog:
 * v1.2.0 - 2026-01-29 - BEP THEME AWARE: Fixed timezone button to use clockPaperTextColor instead of handColor. Button now adapts dynamically to both light/dark theme modes and session-based backgrounds. Ensures consistent text color adaptation across button text and hover states, matching the paper background context rather than canvas hand visibility.
 * v1.1.0 - 2026-01-28 - BEP THEME: Replaced hardcoded colors with theme tokens. Changed '#ffffff' to theme.palette.background.paper, '#F6F9FB' to theme.palette.background.default, '#0F172A' to theme.palette.text.primary. All clock surface, hand, and text colors now adapt to light/dark theme modes dynamically.
 * v1.0.9 - 2026-01-29 - BEP CONSISTENCY: Fixed font color to match Economic Calendar. Changed clockPaperTextColor to use theme.palette.text.primary when backgroundBasedOnSession is false (instead of hardcoded '#0F172A'). Now Trading Clock panel text color matches CalendarEmbed's text color exactly, ensuring consistent font UI across /calendar page.
 * v1.0.8 - 2026-01-29 - BEP CONSISTENCY: Updated title Typography styling to exactly match CalendarEmbed title. Changed lineHeight from 1.1 to 1.2 (lineHeight: 1.2) for perfect visual consistency between "Trading Clock" and "Economic Calendar" titles on /calendar page. Both now use variant="h6" with fontWeight: 900 and lineHeight: 1.2.
 * v1.0.6 - 2026-01-27 - BEP i18n migration: Added useTranslation hook, replaced 6 hardcoded strings with t() calls for calendar namespace (Trading Clock title, Add reminder tooltips, subtitle, clock hidden message, Select Timezone fallback, aria-labels). Full i18n compliance for EN/ES/FR.
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
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
import LoadingAnimation from './LoadingAnimation';
import SessionLabel from './SessionLabel';

import { useClock } from '../hooks/useClock';
import { useClockVisibilitySnap } from '../hooks/useClockVisibilitySnap';
import { isColorDark } from '../utils/clockUtils';

const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));

/**
 * ClockPanelPaper - Trading clock panel for calendar page left rail
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
}) {
    const { t, i18n } = useTranslation(['calendar', 'common']);
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const { currentTime, activeSession, nextSession, timeToEnd, timeToStart } = useClock(clockTimezone, sessions, timeEngine);
    const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
    useClockVisibilitySnap({ handAnglesRef, currentTime, resumeToken: timeEngine?.resumeToken });

    const workspaceClockContainerRef = useRef(null);
    const [workspaceClockSize, setWorkspaceClockSize] = useState(260);
    const [workspaceHasSize, setWorkspaceHasSize] = useState(false);
    const [shouldRenderEventsOverlay, setShouldRenderEventsOverlay] = useState(false);

    // Compute clock size based on container width
    useEffect(() => {
        const computeBaseSize = () => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

            const settingsButtonHeight = 48;
            const totalRatio = 1;
            const availableHeight = vh - settingsButtonHeight - 10;
            let next = Math.floor((availableHeight / totalRatio) * 1);
            next = Math.max(180, next);

            const containerWidth = workspaceClockContainerRef.current?.getBoundingClientRect?.().width || 0;
            const viewportGutter = vw < 600 ? 32 : 96;
            const baseWidthBudget = containerWidth > 0 ? containerWidth : (vw - viewportGutter);
            const labelSafeInset = isXs ? 20 : 8;
            const widthBudget = Math.max(180, Math.floor(baseWidthBudget - labelSafeInset));

            next = Math.min(next, widthBudget, 440);
            if (isXs) {
                next = Math.max(180, next - 8);
            }

            setWorkspaceClockSize((prev) => (prev === next ? prev : next));
            setWorkspaceHasSize(true);
        };

        computeBaseSize();
        const onResize = () => window.requestAnimationFrame(computeBaseSize);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [isXs]);

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

    const shouldShowSessionLabel = Boolean(showSessionLabel && workspaceHasSize);

    return (
        <Paper
            elevation={0}
            sx={{
                position: 'relative',
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#3c4d63', 0.12),
                bgcolor: clockPaperBg,
                color: clockPaperTextColor,
                p: { xs: 1.25, sm: 1.5, md: 1.75 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                // CRITICAL: Overflow containment for flex children
                minWidth: 0,
                maxWidth: '100%',
                width: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
        >
            {/* Header section */}
            <Stack spacing={0.75} sx={{ mb: 0.5, position: 'relative', minWidth: 0, maxWidth: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {t('calendar:clock.title')}
                </Typography>
                <Tooltip title={t('calendar:tooltip.addReminder')} placement="left">
                    <IconButton
                        size="medium"
                        onClick={onOpenAddEvent}
                        sx={{
                            position: 'absolute',
                            top: -2,
                            right: 0,
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
                        aria-label={t('calendar:aria.addReminder')}
                    >
                        <AddRoundedIcon fontSize="medium" />
                    </IconButton>
                </Tooltip>
                <Typography variant="body2" sx={{ color: alpha(clockPaperTextColor, 0.72) }}>
                    {t('calendar:clock.subtitle')}
                </Typography>
                <Divider sx={{ borderColor: alpha('#3c4d63', 0.12) }} />
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
                }}
            >
                {showHandClock ? (
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: { xs: 420, sm: 520, md: 560 },
                            mx: 'auto',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 0,
                            boxSizing: 'border-box',
                            minWidth: 0,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            ref={workspaceClockContainerRef}
                            sx={{
                                width: '100%',
                                aspectRatio: '1 / 1',
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
                                {workspaceHasSize ? null : (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(255,255,255,0.6)',
                                            borderRadius: '50%',
                                        }}
                                    >
                                        <LoadingAnimation
                                            clockSize={Math.min(workspaceClockSize, 220)}
                                            isLoading
                                        />
                                    </Box>
                                )}

                                {workspaceHasSize ? (
                                    <>
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
                                                    suppressTooltipAutoscroll
                                                />
                                            </Suspense>
                                        ) : null}
                                    </>
                                ) : null}
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%' }}>
                        {t('calendar:clock.hidden')}
                    </Typography>
                )}

                {/* Timezone button */}
                {workspaceHasSize ? (
                    <Button
                        variant="text"
                        size="small"
                        onClick={onOpenTimezone}
                        sx={{
                            textTransform: 'none',
                            color: alpha(clockPaperTextColor, 0.72),
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            mt: 0.25,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            '&:hover': {
                                bgcolor: alpha(clockPaperTextColor, 0.1),
                                color: clockPaperTextColor,
                            },
                        }}
                    >
                        {selectedTimezone?.replace(/_/g, ' ') || t('calendar:clock.selectTimezone')}
                    </Button>
                ) : null}

                {/* Session label */}
                {shouldShowSessionLabel && workspaceHasSize ? (
                    <SessionLabel
                        activeSession={activeSession}
                        showTimeToEnd={showTimeToEnd}
                        timeToEnd={timeToEnd}
                        showTimeToStart={showTimeToStart}
                        nextSession={nextSession}
                        timeToStart={timeToStart}
                        clockSize={workspaceClockSize}
                        contrastTextColor={handColor}
                        backgroundBasedOnSession={backgroundBasedOnSession}
                    />
                ) : null}
            </Stack>

        </Paper>
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
};

ClockPanelPaper.displayName = 'ClockPanelPaper';

export default ClockPanelPaper;
