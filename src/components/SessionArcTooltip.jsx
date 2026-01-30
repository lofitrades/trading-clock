/**
 * src/components/SessionArcTooltip.jsx
 *
 * Purpose: Enterprise-grade compact tooltip for session arc donuts with 12-hour time, smart session state labels, and overnight session handling.
 * Follows Material Design v7 best practices with proper spacing, typography hierarchy, and alignment.
 *
 * Changelog:
 * v1.4.1 - 2026-01-21 - Add close icon button to tooltip header.
 * v1.4.0 - 2026-01-16 - Smart labels with session state: "Starts in X", "Started X ago", "Ended X ago", with overnight session handling
 * v1.2.0 - 2026-01-16 - Enterprise UI: proper spacing system, typography hierarchy, alignment, and visual grouping
 * v1.1.0 - 2026-01-16 - Simplified to show single 'in/ago' label based on session state, reduced size for performance
 * v1.0.0 - 2026-01-16 - Initial implementation with 12-hour time, relative labels, and edit hint
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/**
 * Convert 24-hour time string to 12-hour format with AM/PM
 * @param {string} timeStr - Time in HH:MM format (24-hour)
 * @returns {string} - Time in 12-hour format with AM/PM (e.g., "9:45 AM")
 */
const formatTo12Hour = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '';

    const [hourStr, minute] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);

    if (isNaN(hour) || isNaN(parseInt(minute, 10))) return '';

    const isPM = hour >= 12;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = isPM ? 'PM' : 'AM';

    return `${displayHour}:${minute} ${ampm}`;
};

/**
 * Get current time in a specific timezone in minutes since midnight
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {number} - Minutes since midnight in the specified timezone
 */
const getCurrentMinutesInTimezone = (timezone) => {
    if (!timezone) return 0;

    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const parts = formatter.formatToParts(now);
        const hourPart = parts.find(p => p.type === 'hour');
        const minutePart = parts.find(p => p.type === 'minute');

        const hour = parseInt(hourPart?.value || '0', 10);
        const minute = parseInt(minutePart?.value || '0', 10);

        return hour * 60 + minute;
    } catch (error) {
        console.warn('[SessionArcTooltip] Timezone calculation error:', error);
        return 0;
    }
};

/**
 * Determine session state and calculate relative time for display
 * Handles overnight sessions (e.g., 22:00-02:00) with smart logic
 * @param {number} startMins - Start time in minutes from midnight
 * @param {number} endMins - End time in minutes from midnight
 * @param {number} currentMins - Current time in minutes from midnight
 * @returns {object} - { state: 'not-started|active|ended', relativeMinutes: number }
 */
const getSessionState = (startMins, endMins, currentMins) => {
    // Adjust for overnight sessions (e.g., 22:00-02:00)
    let adjustedEndMins = endMins;
    if (endMins < startMins) {
        // End time is next day
        adjustedEndMins = endMins + 24 * 60;

        // If current time is before start, treat as future session of next day
        if (currentMins < startMins) {
            // Session starts later today
            const minutesUntilStart = startMins - currentMins;
            return {
                state: 'not-started',
                relativeMinutes: minutesUntilStart,
            };
        }
    }

    // Normal calculation
    if (currentMins < startMins) {
        // Session hasn't started yet today
        return {
            state: 'not-started',
            relativeMinutes: startMins - currentMins,
        };
    }

    if (currentMins < adjustedEndMins) {
        // Session is active
        return {
            state: 'active',
            relativeMinutes: currentMins - startMins,
        };
    }

    // Session has ended
    return {
        state: 'ended',
        relativeMinutes: currentMins - adjustedEndMins,
    };
};

/**
 * Format session state with smart, enterprise-grade copywriting
 * @param {string} state - 'not-started|active|ended'
 * @param {number} minutes - Absolute minutes for the state
 * @returns {string} - Formatted label (e.g., "Starts in 2h 15m", "Started 45m ago")
 */
const formatSessionLabel = (state, minutes) => {
    const absMins = Math.abs(minutes);
    const hours = Math.floor(absMins / 60);
    const mins = absMins % 60;

    // Format time part
    let timePart;
    if (hours === 0) {
        timePart = `${mins}m`;
    } else {
        timePart = `${hours}h ${mins}m`;
    }

    // Add state-specific copy
    switch (state) {
        case 'not-started':
            return `Starts in ${timePart}`;
        case 'active':
            return `Started ${timePart} ago`;
        case 'ended':
            return `Ended ${timePart} ago`;
        default:
            return '';
    }
};

/**
 * SessionArcTooltip Component
 * Enterprise-grade compact tooltip for session arc donuts with timezone-aware relative times
 *
 * @param {Object} props - Component props
 * @param {string} props.sessionName - Name of the session (e.g., "New York")
 * @param {string} props.startTime - Start time in HH:MM format (24-hour)
 * @param {string} props.endTime - End time in HH:MM format (24-hour)
 * @param {string} props.timezone - IANA timezone for time calculations (e.g., 'America/New_York')
 * @param {string} props.arcColor - Color of the arc session (e.g., theme color key or hex)
 * @returns {React.ReactElement} - Enterprise-styled tooltip
 *
 * @example
 * <SessionArcTooltip
 *   sessionName="New York"
 *   startTime="14:30"
 *   endTime="21:00"
 *   timezone="America/New_York"
 *   arcColor="primary.main"
 * />
 */
function SessionArcTooltip({ sessionName = '', startTime = '', endTime = '', timezone = 'UTC', arcColor = 'primary.main', onClose }) {
    // Memoize time calculations to avoid unnecessary recomputation
    // Timezone-aware: recalculates when timezone or session times change
    const displayData = useMemo(() => {
        const currentMinutes = getCurrentMinutesInTimezone(timezone);

        // Convert session times to minutes for state calculation
        const [startHourStr, startMinStr] = startTime.split(':');
        const startTimeMins = parseInt(startHourStr, 10) * 60 + parseInt(startMinStr, 10);

        const [endHourStr, endMinStr] = endTime.split(':');
        const endTimeMins = parseInt(endHourStr, 10) * 60 + parseInt(endMinStr, 10);

        // Get session state with overnight handling
        const sessionState = getSessionState(startTimeMins, endTimeMins, currentMinutes);

        // Format smart label based on state
        const relativeLabel = formatSessionLabel(sessionState.state, sessionState.relativeMinutes);

        const startLabel = formatTo12Hour(startTime);
        const endLabel = formatTo12Hour(endTime);

        return { startLabel, endLabel, relativeLabel, sessionState: sessionState.state };
    }, [startTime, endTime, timezone]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                boxShadow: (theme) => theme.shadows[3],
                overflow: 'hidden',
                // Enterprise spacing: tight but breathable
                minWidth: { xs: 148, sm: 164 }, // 8px base unit (reduced)
                maxWidth: { xs: 'calc(100vw - 32px)', sm: 200 },
            }}
        >
            {/* Header Section: Session Name */}
            <Box
                sx={{
                    px: 2, // 16px horizontal padding
                    pt: 1.5, // 12px top padding
                    pb: 1, // 8px bottom padding
                    bgcolor: arcColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' }, // 13px / 14px
                        lineHeight: 1.35,
                        color: 'primary.contrastText',
                        letterSpacing: 0.3,
                    }}
                    noWrap
                >
                    {sessionName}
                </Typography>
                <IconButton
                    size="small"
                    aria-label="Close tooltip"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.();
                    }}
                    sx={{
                        color: 'primary.contrastText',
                        p: 0.5,
                        '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.16)'
                                : 'rgba(255,255,255,0.12)',
                        },
                        '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.contrastText',
                            outlineOffset: 2,
                        },
                    }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Times Section */}
            <Box
                sx={{
                    px: 2, // 16px horizontal padding
                    py: 1, // 8px vertical padding
                    bgcolor: 'action.hover',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75, // 6px gap
                }}
            >
                {/* Time Range Row */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1, // 8px gap
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            fontSize: { xs: '0.75rem', sm: '0.8125rem' }, // 12px / 13px
                            fontWeight: 600,
                            color: 'text.primary',
                            fontFamily: 'monospace',
                            letterSpacing: 0.4,
                            flex: '0 0 auto',
                        }}
                    >
                        {displayData.startLabel}
                    </Typography>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            flex: '0 0 auto',
                            opacity: 0.7,
                        }}
                    >
                        –
                    </Typography>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: { xs: '0.75rem', sm: '0.8125rem' }, // 12px / 13px
                            fontWeight: 600,
                            color: 'text.primary',
                            fontFamily: 'monospace',
                            letterSpacing: 0.4,
                            flex: '0 0 auto',
                        }}
                    >
                        {displayData.endLabel}
                    </Typography>
                </Box>

                {/* Relative Time Label with State-based Coloring */}
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: { xs: '0.6875rem', sm: '0.75rem' }, // 11px / 12px (smaller)
                        fontWeight: 700,
                        color: displayData.sessionState === 'active' ? 'primary.main' : 'text.primary',
                        lineHeight: 1.4,
                        letterSpacing: 0.3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {displayData.relativeLabel}
                </Typography>
            </Box>
        </Box>
    );
}

SessionArcTooltip.propTypes = {
    sessionName: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    timezone: PropTypes.string,
    arcColor: PropTypes.string,
    onClose: PropTypes.func,
};

export default SessionArcTooltip;
