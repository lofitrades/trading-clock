/**
 * src/components/EventMarkerTooltip.jsx
 *
 * Purpose: Enterprise-grade compact tooltip for economic event markers with impact-based styling and click-to-action.
 * Follows Material Design v7 best practices with proper spacing, typography hierarchy, and Airbnb-inspired design.
 *
 * Changelog:
 * v1.0.0 - 2026-01-16 - Initial implementation with impact-colored header, event details, and clickable action
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Chip } from '@mui/material';
import { formatTime } from '../utils/dateUtils';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { resolveImpactMeta } from '../utils/newsApi';
import { formatRelativeLabel, getEventEpochMs, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import PublicIcon from '@mui/icons-material/Public';

/**
 * Get impact metadata (color, icon, label)
 * @param {string} impact - Impact level (High, Medium, Low, etc.)
 * @returns {Object} - Impact metadata
 */
const getImpactMeta = (impact) => resolveImpactMeta(impact);

/**
 * EventMarkerTooltip Component
 * Enterprise-grade compact tooltip for event markers with timezone-aware relative times and click actions
 *
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of event objects at this time marker
 * @param {string} props.timezone - IANA timezone for time calculations (e.g., 'America/New_York')
 * @param {number} props.nowEpochMs - Current time in epoch milliseconds
 * @param {Function} props.onClick - Click handler for tooltip action
 * @returns {React.ReactElement} - Enterprise-styled tooltip
 *
 * @example
 * <EventMarkerTooltip
 *   events={[{ name: 'NFP', impact: 'High', currency: 'USD', date: '2026-01-16T08:30:00Z' }]}
 *   timezone="America/New_York"
 *   nowEpochMs={Date.now()}
 *   onClick={() => console.log('Clicked')}
 * />
 */
function EventMarkerTooltip({ events = [], timezone = 'UTC', nowEpochMs = Date.now(), onClick }) {
    // Memoize display data calculations
    const displayData = useMemo(() => {
        if (!events || events.length === 0) {
            return { events: [], primaryEvent: null };
        }

        // Find the highest priority event for header styling
        const sortedEvents = [...events].sort((a, b) => {
            const aImpact = getImpactMeta(a.impact || a.strength || a.Strength);
            const bImpact = getImpactMeta(b.impact || b.strength || b.Strength);
            return bImpact.priority - aImpact.priority;
        });

        const primaryEvent = sortedEvents[0];
        const primaryImpact = getImpactMeta(primaryEvent.impact || primaryEvent.strength || primaryEvent.Strength);

        // Process each event with formatted data
        const processedEvents = events.map(evt => {
            const impact = getImpactMeta(evt.impact || evt.strength || evt.Strength);
            const currency = evt.currency || evt.Currency;
            const countryCode = currency ? getCurrencyFlag(currency) : null;
            const timeLabel = evt.timeLabel || formatTime(evt.date || evt.dateTime || evt.Date, timezone);

            // Calculate relative time
            const eventEpochMs = getEventEpochMs(evt);
            const relativeLabel = eventEpochMs !== null
                ? formatRelativeLabel({ eventEpochMs, nowEpochMs, nowWindowMs: NOW_WINDOW_MS })
                : '';

            // Determine event state
            const isNow = eventEpochMs !== null && nowEpochMs >= eventEpochMs && nowEpochMs < eventEpochMs + NOW_WINDOW_MS;
            const isPassed = eventEpochMs !== null && eventEpochMs < nowEpochMs && !isNow;

            return {
                ...evt,
                impact,
                currency,
                countryCode,
                timeLabel,
                relativeLabel,
                isNow,
                isPassed,
            };
        });

        return {
            events: processedEvents,
            primaryEvent,
            primaryImpact,
            headerColor: primaryImpact.color,
        };
    }, [events, timezone, nowEpochMs]);

    if (!displayData.primaryEvent) {
        return null;
    }

    const { events: processedEvents, primaryImpact, headerColor } = displayData;
    const showMultiple = processedEvents.length > 1;

    return (
        <Box
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                boxShadow: (theme) => theme.shadows[4],
                overflow: 'hidden',
                cursor: 'pointer',
                minWidth: { xs: 180, sm: 220 },
                maxWidth: { xs: 'calc(100vw - 32px)', sm: 280 },
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => theme.shadows[8],
                },
                '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: (theme) => theme.shadows[4],
                },
            }}
        >
            {/* Header Section: Primary Event Info */}
            <Box
                sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 1,
                    bgcolor: headerColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Chip
                    label={primaryImpact.icon}
                    size="small"
                    sx={{
                        height: 20,
                        minWidth: 36,
                        bgcolor: 'rgba(255,255,255,0.25)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        '& .MuiChip-label': {
                            px: 0.75,
                            py: 0,
                        },
                    }}
                />
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.95)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}
                >
                    {primaryImpact.label} Impact
                </Typography>
            </Box>

            {/* Events List */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    maxHeight: { xs: 200, sm: 240 },
                    overflowY: 'auto',
                    bgcolor: 'action.hover',
                }}
            >
                {processedEvents.map((evt, idx) => (
                    <Box
                        key={`${evt.id || evt.name}-${idx}`}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            opacity: evt.isPassed ? 0.6 : 1,
                        }}
                    >
                        {/* Event Name */}
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 700,
                                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                lineHeight: 1.3,
                                color: 'text.primary',
                            }}
                        >
                            {evt.name || evt.Name}
                        </Typography>

                        {/* Event Details Row */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            {/* Time */}
                            <Typography
                                variant="caption"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    letterSpacing: 0.3,
                                }}
                            >
                                {evt.timeLabel}
                            </Typography>

                            {/* Currency Flag */}
                            {evt.currency && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {evt.countryCode ? (
                                        <span
                                            className={`fi fi-${evt.countryCode}`}
                                            style={{
                                                display: 'inline-block',
                                                width: 16,
                                                height: 12,
                                                borderRadius: 2,
                                                boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
                                                opacity: evt.isPassed ? 0.6 : 1,
                                                filter: evt.isPassed ? 'grayscale(1)' : 'none',
                                            }}
                                            title={evt.currency}
                                        />
                                    ) : evt.currency === '—' || !evt.currency ? (
                                        <PublicIcon
                                            sx={{
                                                fontSize: 14,
                                                color: 'text.secondary',
                                                opacity: evt.isPassed ? 0.6 : 0.8,
                                            }}
                                            titleAccess="Global event"
                                        />
                                    ) : null}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.7rem',
                                            color: 'text.secondary',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {evt.currency}
                                    </Typography>
                                </Box>
                            )}

                            {/* Relative Time Label */}
                            {evt.relativeLabel && (
                                <>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        ·
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.7rem',
                                            color: evt.isNow ? 'primary.main' : 'text.secondary',
                                            fontWeight: evt.isNow ? 700 : 600,
                                        }}
                                    >
                                        {evt.relativeLabel}
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {/* Divider between events */}
                        {showMultiple && idx < processedEvents.length - 1 && (
                            <Box
                                sx={{
                                    height: 1,
                                    bgcolor: 'divider',
                                    opacity: 0.3,
                                    mt: 0.5,
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>

            {/* Footer: Click hint */}
            <Box
                sx={{
                    px: 2,
                    py: 0.75,
                    bgcolor: 'action.selected',
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.6875rem',
                        color: 'text.secondary',
                        fontWeight: 600,
                        textAlign: 'center',
                        display: 'block',
                        letterSpacing: 0.3,
                    }}
                >
                    {showMultiple ? `Click to view ${processedEvents.length} events` : 'Click to view details'}
                </Typography>
            </Box>
        </Box>
    );
}

EventMarkerTooltip.propTypes = {
    events: PropTypes.arrayOf(PropTypes.object).isRequired,
    timezone: PropTypes.string,
    nowEpochMs: PropTypes.number,
    onClick: PropTypes.func,
};

export default EventMarkerTooltip;
