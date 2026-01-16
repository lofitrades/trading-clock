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
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

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
    onOpenSettings,
    onOpenTimezone,
    onOpenEvent,
}) {
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
    const clockSurfaceColor = backgroundBasedOnSession && activeSession?.color ? activeSession.color : '#ffffff';
    const clockSurfaceIsDark = useMemo(() => isColorDark(clockSurfaceColor), [clockSurfaceColor]);
    const handColor = useMemo(() => (clockSurfaceIsDark ? '#F6F9FB' : '#0F172A'), [clockSurfaceIsDark]);
    const clockPaperBg = useMemo(
        () => (backgroundBasedOnSession && activeSession?.color ? activeSession.color : '#ffffff'),
        [activeSession?.color, backgroundBasedOnSession],
    );
    const clockPaperTextColor = useMemo(() => {
        if (!backgroundBasedOnSession) return '#0F172A';
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
            return new Intl.DateTimeFormat(undefined, { ...baseOptions, timeZone: clockTimezone }).format(date);
        } catch {
            return new Intl.DateTimeFormat(undefined, baseOptions).format(date);
        }
    }, [clockTimezone, timeEngine?.nowEpochMs]);

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
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                    Trading Clock
                </Typography>
                <Tooltip title="Open settings" placement="left">
                    <IconButton
                        size="medium"
                        onClick={onOpenSettings}
                        sx={{
                            position: 'absolute',
                            top: -2,
                            right: 0,
                            color: alpha(clockPaperTextColor, 0.9),
                            p: 0.75,
                        }}
                        aria-label="Open settings"
                    >
                        <SettingsRoundedIcon fontSize="medium" />
                    </IconButton>
                </Tooltip>
                <Typography variant="body2" sx={{ color: alpha(clockPaperTextColor, 0.72) }}>
                    Today&apos;s market sessions and economic events.
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
                        Clock hidden in settings.
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
                            color: alpha(handColor, 0.7),
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
                                bgcolor: alpha(handColor, 0.08),
                                color: handColor,
                            },
                        }}
                    >
                        {selectedTimezone?.replace(/_/g, ' ') || 'Select Timezone'}
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
};

ClockPanelPaper.displayName = 'ClockPanelPaper';

export default ClockPanelPaper;
