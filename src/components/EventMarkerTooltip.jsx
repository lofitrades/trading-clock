/**
 * src/components/EventMarkerTooltip.jsx
 *
 * Purpose: Enterprise-grade compact tooltip for economic event markers with impact-based styling and click-to-action.
 * Follows Material Design v7 best practices with proper spacing, typography hierarchy, and Airbnb-inspired design.
 *
 * Changelog:
 * v1.1.35 - 2026-02-09 - UX: Renamed custom event label from 'CUS' to 'MINE' on tooltip badges. More intuitive and user-friendly across all languages.
 * v1.1.32 - 2026-01-29 - BEP i18n: Relative time labels ("In 2h 30m", "5m ago") now fully language-aware using events:relativeTime translations. Supports EN/ES/FR with proper preposition and time unit translations.
 * v1.1.31 - 2026-01-29 - BEP i18n: Footer event count and All Day/Tentative labels now fully language-aware. Event count uses plural-aware translations ("1 event" vs "N events") with full i18n support for EN/ES/FR. All hardcoded text now localized.
 * v1.1.30 - 2026-01-29 - BEP i18n: Date and time now fully language-aware and timezone-aware. Uses toLocaleDateString and toLocaleTimeString with i18n language detection (EN/ES/FR) and IANA timezone support.
 * v1.1.29 - 2026-01-22 - Hide time range subtitle when tooltip has a single event.
 * v1.1.28 - 2026-01-22 - Show grouped date as header title and time range as subtitle.
 * v1.1.27 - 2026-01-22 - Show event time above each row and display grouped time ranges in the tooltip header.
 * v1.1.26 - 2026-01-22 - Use grouped 5-minute marker time in tooltip header when provided.
 * v1.1.25 - 2026-01-22 - BEP: Add horizontal padding to custom CUS chip.
 * v1.1.24 - 2026-01-22 - BEP: Split custom event impact into its own icon-only chip and separate custom icon + CUS chip.
 * v1.1.23 - 2026-01-22 - BUGFIX: Preserve raw custom impact values when emitting clock tooltip events so EventModal and custom impact chips render correctly.
 * v1.1.22 - 2026-01-22 - BEP: Merge custom event icon and 'CUS' into single chip with custom impact level and background color.
 * v1.1.21 - 2026-01-22 - Use 12-hour (AM/PM) header time formatting for tooltip header.
 * v1.1.20 - 2026-01-21 - Honor custom reminder icon/color selections in tooltip impact badges.
 * v1.1.19 - 2026-01-21 - Use custom reminder icon for tooltip impact badge to match clock markers.
 * v1.1.18 - 2026-01-21 - Show Personal tag for custom reminder events in tooltip rows.
 * v1.1.17 - 2026-01-21 - Simplify tooltip skeletons to 7 rows that mirror real UI layout.
 * v1.1.16 - 2026-01-21 - Expand tooltip skeletons with realistic times, badges, and currency placeholders.
 * v1.1.15 - 2026-01-21 - Move favorite/note badges back next to event name.
 * v1.1.14 - 2026-01-21 - Move favorite/note icons to the impact row for clearer hierarchy.
 * v1.1.13 - 2026-01-21 - Restrict modal opening to event rows; header/footer clicks are inert.
 * v1.1.12 - 2026-01-21 - Show favorite/note icons next to event names in tooltip rows.
 * v1.1.11 - 2026-01-21 - Add close icon button to tooltip header.
 * v1.1.10 - 2026-01-21 - Raise tooltip z-index above AppBar and filter popovers.
 * v1.1.9 - 2026-01-21 - Add NOW/NEXT chips above event name in tooltip rows.
 * v1.1.8 - 2026-01-21 - Enable tooltip list scrolling only when viewport would overflow.
 * v1.1.7 - 2026-01-21 - Fix header time for All Day/Tentative-only groups.
 * v1.1.6 - 2026-01-21 - Header title shows grouped time; date row shows date only.
 * v1.1.5 - 2026-01-21 - Added header title row above date with larger font.
 * v1.1.4 - 2026-01-21 - Show All Day/Tentative labels above event names using timer-style typography.
 * v1.1.3 - 2026-01-21 - Render event names using raw source value (CalendarEmbed parity).
 * v1.1.2 - 2026-01-21 - Slimmed tooltip scrollbars and removed header impact chip.
 * v1.1.1 - 2026-01-21 - Use impact icons in rows, header uses primary color, show global currency icon when missing.
 * v1.1.0 - 2026-01-21 - Show grouped date/time in header and use impact chips in event rows.
 * v1.0.1 - 2026-01-21 - Added clearer dividers between event rows in tooltip.
 * v1.0.0 - 2026-01-16 - Initial implementation with impact-colored header, event details, and clickable action
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Box, Typography, Chip, Divider, IconButton, Skeleton, useTheme } from '@mui/material';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { resolveImpactMeta } from '../utils/newsApi';
import { isColorDark } from '../utils/clockUtils';
import { formatRelativeLabel, getEventEpochMs, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import PublicIcon from '@mui/icons-material/Public';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import RestoreIcon from '@mui/icons-material/Restore';
import { getCustomEventIconComponent, resolveCustomEventColor } from '../utils/customEventStyle';

/**
 * Get impact metadata (color, icon, label)
 * @param {string} impact - Impact level (High, Medium, Low, etc.)
 * @returns {Object} - Impact metadata
 */
const getImpactMeta = (impact) => resolveImpactMeta(impact);

const SKELETON_EVENTS = [
    { id: 'skeleton-1', timeLabel: '6:00 AM NT', showFavorite: false, showNotes: true },
    { id: 'skeleton-2', timeLabel: '7:15 AM NT', showFavorite: true, showNotes: false },
    { id: 'skeleton-3', timeLabel: '8:30 AM NT', showFavorite: true, showNotes: true },
    { id: 'skeleton-4', timeLabel: '10:00 AM NT', showFavorite: false, showNotes: false },
    { id: 'skeleton-5', timeLabel: '12:00 PM NT', showFavorite: false, showNotes: true },
    { id: 'skeleton-6', timeLabel: '2:15 PM NT', showFavorite: true, showNotes: false },
    { id: 'skeleton-7', timeLabel: '4:00 PM NT', showFavorite: false, showNotes: false },
];

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
 * />
 */
function EventMarkerTooltip({ events = [], timezone = 'UTC', nowEpochMs = Date.now(), groupEpochMs = null, onClick, onClose, isFavoriteEvent, hasEventNotes }) {
    const theme = useTheme();
    const { i18n, t } = useTranslation(['calendar', 'common', 'events']);
    const rootRef = useRef(null);
    const listRef = useRef(null);
    const [listMaxHeight, setListMaxHeight] = useState(null);
    const [allowScroll, setAllowScroll] = useState(false);

    // Memoize display data calculations
    const displayData = useMemo(() => {
        // Helper function to get locale from i18n language code
        const getLocale = () => {
            if (i18n.language === 'es') return 'es-ES';
            if (i18n.language === 'fr') return 'fr-FR';
            return 'en-US';
        };

        if (!events || events.length === 0) {
            return { events: [], primaryEvent: null };
        }

        // Find the highest priority event for header styling
        const sortedEvents = [...events].sort((a, b) => {
            const aImpact = getImpactMeta(a.impact || a.strength || a.Strength || a?._displayCache?.strengthValue);
            const bImpact = getImpactMeta(b.impact || b.strength || b.Strength || b?._displayCache?.strengthValue);
            return bImpact.priority - aImpact.priority;
        });

        const primaryEvent = sortedEvents[0];
        const primaryImpact = getImpactMeta(primaryEvent.impact || primaryEvent.strength || primaryEvent.Strength || primaryEvent?._displayCache?.strengthValue);
        const headerDate = new Date(primaryEvent.date || primaryEvent.dateTime || primaryEvent.Date).toLocaleDateString(
            getLocale(),
            {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }
        );

        const timeLabels = events.map((evt) =>
            evt.timeLabel || new Date(evt.date || evt.dateTime || evt.Date).toLocaleTimeString(
                getLocale(),
                { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
            )
        ).filter(Boolean);
        const normalizedLabels = timeLabels.map((label) => String(label).toLowerCase());
        const hasAllDay = normalizedLabels.some((label) => label.includes('all day'));
        const hasTentative = normalizedLabels.some((label) => label.includes('tentative'));
        const hasRegularTime = normalizedLabels.some((label) => !label.includes('all day') && !label.includes('tentative'));

        const headerTime = hasRegularTime
            ? (groupEpochMs !== null
                ? (() => {
                    const rangeStart = groupEpochMs - 2 * 60000;
                    const rangeEnd = groupEpochMs + 2 * 60000;
                    const startLabel = new Date(rangeStart).toLocaleTimeString(
                        getLocale(),
                        { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
                    );
                    const endLabel = new Date(rangeEnd).toLocaleTimeString(
                        getLocale(),
                        { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
                    );
                    return `${startLabel} – ${endLabel}`;
                })()
                : (primaryEvent.timeLabel || new Date(primaryEvent.date || primaryEvent.dateTime || primaryEvent.Date).toLocaleTimeString(
                    getLocale(),
                    { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
                )))
            : (hasAllDay && hasTentative
                ? t('calendar:tooltip.allDayAndTentative', { defaultValue: 'All Day / Tentative' })
                : hasAllDay
                    ? t('calendar:tooltip.allDay', { defaultValue: 'All Day' })
                    : hasTentative
                        ? t('calendar:tooltip.tentative', { defaultValue: 'Tentative' })
                        : (timeLabels[0] || t('calendar:tooltip.time', { defaultValue: 'Time' })));

        const eventEpochs = events
            .map((evt) => getEventEpochMs(evt))
            .filter((epoch) => epoch !== null);
        const earliestFutureEpoch = eventEpochs.reduce((min, epoch) => {
            if (epoch <= nowEpochMs) return min;
            if (min === null || epoch < min) return epoch;
            return min;
        }, null);

        // Process each event with formatted data
        const processedEvents = events.map(evt => {
            const impactValue = evt.impact || evt.strength || evt.Strength || evt?._displayCache?.strengthValue;
            const impactMeta = getImpactMeta(impactValue);
            const currency = evt.currency || evt.Currency;
            const countryCode = currency ? getCurrencyFlag(currency) : null;
            const timeLabel = evt.timeLabel || new Date(evt.date || evt.dateTime || evt.Date).toLocaleTimeString(
                getLocale(),
                { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
            );
            const normalizedTimeLabel = (timeLabel || '').toLowerCase();
            const isSpecialTimeLabel = normalizedTimeLabel.includes('all day') || normalizedTimeLabel.includes('tentative');
            const isCustom = Boolean(evt.isCustom);
            // Calculate relative time
            const eventEpochMs = getEventEpochMs(evt);
            const relativeLabel = eventEpochMs !== null
                ? formatRelativeLabel({ eventEpochMs, nowEpochMs, nowWindowMs: NOW_WINDOW_MS, t })
                : '';

            // Determine event state
            const isNow = eventEpochMs !== null && nowEpochMs >= eventEpochMs && nowEpochMs < eventEpochMs + NOW_WINDOW_MS;
            const isPassed = eventEpochMs !== null && eventEpochMs < nowEpochMs && !isNow;
            const isNext = !isNow && eventEpochMs !== null && earliestFutureEpoch !== null && eventEpochMs === earliestFutureEpoch;
            const isFavorite = typeof isFavoriteEvent === 'function' ? isFavoriteEvent(evt) : false;
            const hasNotes = typeof hasEventNotes === 'function' ? hasEventNotes(evt) : false;

            return {
                ...evt,
                impactValue,
                impactMeta,
                currency,
                countryCode,
                timeLabel,
                isSpecialTimeLabel,
                relativeLabel,
                isNow,
                isNext,
                isPassed,
                isFavorite,
                hasNotes,
                isCustom,
            };
        });

        return {
            events: processedEvents,
            primaryEvent,
            primaryImpact,
            headerDate,
            headerTime,
            headerColor: primaryImpact.color,
        };
    }, [events, timezone, nowEpochMs, groupEpochMs, isFavoriteEvent, hasEventNotes, i18n.language, t]);

    const processedEvents = displayData.events || [];
    const headerDate = displayData.headerDate;
    const headerTime = displayData.headerTime;

    useEffect(() => {
        const measure = () => {
            if (!rootRef.current || !listRef.current || typeof window === 'undefined') return;

            const rootRect = rootRef.current.getBoundingClientRect();
            const listRect = listRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight || 0;
            const safePadding = 8;

            if (rootRect.bottom <= viewportHeight - safePadding) {
                setAllowScroll(false);
                setListMaxHeight(null);
                return;
            }

            const availableHeight = Math.max(0, viewportHeight - safePadding - rootRect.top);
            const headerFooterHeight = rootRect.height - listRect.height;
            const nextListHeight = Math.max(120, Math.floor(availableHeight - headerFooterHeight));

            setAllowScroll(true);
            setListMaxHeight(nextListHeight);
        };

        const frame = window.requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', measure);
        };
    }, [processedEvents.length, headerDate, headerTime]);

    if (!displayData.primaryEvent) {
        return (
            <Box
                ref={rootRef}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 1.5,
                    boxShadow: (theme) => theme.shadows[4],
                    overflow: 'hidden',
                    cursor: 'default',
                    zIndex: 1800,
                    minWidth: { xs: 180, sm: 220 },
                    maxWidth: { xs: 'calc(100vw - 32px)', sm: 280 },
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        pt: 1.5,
                        pb: 1,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 0.35,
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                        }}
                    >
                        <Skeleton
                            variant="text"
                            width="70%"
                            height={18}
                            sx={{ bgcolor: 'rgba(255,255,255,0.35)' }}
                        />
                        <IconButton
                            size="small"
                            aria-label="Close tooltip"
                            disabled
                            sx={{
                                color: 'primary.contrastText',
                                p: 0.5,
                                opacity: 0.6,
                            }}
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Skeleton
                        variant="text"
                        width="45%"
                        height={14}
                        sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}
                    />
                </Box>

                <Box
                    ref={listRef}
                    sx={{
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        maxHeight: allowScroll ? listMaxHeight : 'none',
                        overflowY: allowScroll ? 'auto' : 'visible',
                        bgcolor: 'action.hover',
                        ...(allowScroll ? {
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
                            '&::-webkit-scrollbar': {
                                width: 6,
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                borderRadius: 999,
                            },
                        } : {}),
                    }}
                >
                    {SKELETON_EVENTS.map((skeleton, idx) => (
                        <Box
                            key={skeleton.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                opacity: 0.85,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    letterSpacing: 0.3,
                                }}
                            >
                                {skeleton.timeLabel}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                {(skeleton.showFavorite || skeleton.showNotes) ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                        {skeleton.showFavorite ? (
                                            <Skeleton variant="circular" width={16} height={16} />
                                        ) : null}
                                        {skeleton.showNotes ? (
                                            <Skeleton variant="circular" width={16} height={16} />
                                        ) : null}
                                    </Box>
                                ) : null}
                                <Skeleton variant="text" width={`${50 + (idx % 4) * 12}%`} height={18} />
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Skeleton variant="circular" width={16} height={16} />

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Skeleton variant="rectangular" width={16} height={12} sx={{ borderRadius: 2 }} />
                                    <Skeleton variant="text" width={28} height={12} />
                                </Box>

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
                                        color: 'text.secondary',
                                        fontWeight: 600,
                                    }}
                                >
                                    {skeleton.timeLabel}
                                </Typography>
                            </Box>

                            {idx < SKELETON_EVENTS.length - 1 && (
                                <Divider
                                    sx={{
                                        mt: 0.75,
                                        opacity: 0.4,
                                        borderColor: 'divider',
                                    }}
                                />
                            )}
                        </Box>
                    ))}
                </Box>

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
                        Loading events…
                    </Typography>
                </Box>
            </Box>
        );
    }
    const showMultiple = processedEvents.length > 1;

    return (
        <Box
            ref={rootRef}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                boxShadow: (theme) => theme.shadows[4],
                overflow: 'hidden',
                cursor: 'default',
                zIndex: 1800,
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
                onClick={(e) => {
                    e.stopPropagation();
                }}
                sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 1,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.25,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                            color: 'primary.contrastText',
                            lineHeight: 1.2,
                            letterSpacing: 0.2,
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {headerDate}
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
                                bgcolor: 'rgba(255,255,255,0.12)',
                            },
                        }}
                    >
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </Box>
                {showMultiple ? (
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
                        {headerTime}
                    </Typography>
                ) : null}
            </Box>

            {/* Events List */}
            <Box
                ref={listRef}
                sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    maxHeight: allowScroll ? listMaxHeight : 'none',
                    overflowY: allowScroll ? 'auto' : 'visible',
                    bgcolor: 'action.hover',
                    ...(allowScroll ? {
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(0,0,0,0.2) transparent',
                        '&::-webkit-scrollbar': {
                            width: 6,
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: 999,
                        },
                    } : {}),
                }}
            >
                {processedEvents.map((evt, idx) => (
                    <Box
                        key={`${evt.id || evt.name}-${idx}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(evt);
                        }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            opacity: evt.isPassed ? 0.6 : 1,
                            cursor: 'pointer',
                        }}
                    >
                        {/* Time Label (All Day / Tentative / Regular) */}
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

                        {/* Event Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            {(evt.isFavorite || evt.hasNotes) ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    {evt.isFavorite ? (
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                bgcolor: evt.isPassed ? 'text.secondary' : 'error.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: evt.isPassed ? 0.7 : 1,
                                            }}
                                        >
                                            <FavoriteRoundedIcon sx={{ fontSize: 10, color: '#fff' }} />
                                        </Box>
                                    ) : null}
                                    {evt.hasNotes ? (
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                bgcolor: evt.isPassed ? 'text.secondary' : 'primary.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: evt.isPassed ? 0.7 : 1,
                                            }}
                                        >
                                            <NoteAltRoundedIcon sx={{ fontSize: 10, color: '#fff' }} />
                                        </Box>
                                    ) : null}
                                </Box>
                            ) : null}
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                    lineHeight: 1.3,
                                    color: 'text.primary',
                                }}
                            >
                                {evt.name || evt.Name || 'Unnamed event'}
                            </Typography>
                            {/* BEP v1.1.33: Reschedule/Reinstate badges */}
                            {evt.rescheduledFrom && (
                                <Chip
                                    icon={<ScheduleIcon sx={{ fontSize: '0.75rem' }} />}
                                    label={t('events:status.rescheduled')}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { ml: 0.25 },
                                        '& .MuiChip-label': { px: 0.5 },
                                    }}
                                />
                            )}
                            {evt.status === 'cancelled' && (
                                <Chip
                                    icon={<RestoreIcon sx={{ fontSize: '0.75rem' }} />}
                                    label={t('events:status.reinstated')}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { ml: 0.25 },
                                        '& .MuiChip-label': { px: 0.5 },
                                    }}
                                />
                            )}
                        </Box>

                        {/* Event Details Row */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            {/* Impact Badge or Custom Event Badge with Impact Level */}
                            {evt.isCustom ? (
                                (() => {
                                    const customImpact = evt.impactValue || evt.impact || evt.strength || 'unknown';
                                    const Icon = getCustomEventIconComponent(evt.customIcon);
                                    const impactMeta = evt.impactMeta || resolveImpactMeta(customImpact);
                                    return (
                                        <>
                                            <Chip
                                                label={impactMeta.icon}
                                                size="small"
                                                sx={{
                                                    height: 16,
                                                    minWidth: 16,
                                                    bgcolor: impactMeta.color,
                                                    color: isColorDark(impactMeta.color) ? '#fff' : '#1f1f1f',
                                                    fontWeight: 800,
                                                    fontSize: '0.625rem',
                                                    borderRadius: 999,
                                                    '& .MuiChip-label': {
                                                        px: 0.75,
                                                        lineHeight: 1,
                                                    },
                                                }}
                                            />
                                            <Chip
                                                icon={<Icon />}
                                                label={t('calendar:tooltip.customEventLabel', { defaultValue: 'MY EVENT' })}
                                                size="small"
                                                sx={{
                                                    height: 16,
                                                    bgcolor: resolveCustomEventColor(evt.customColor, theme),
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: '0.6rem',
                                                    borderRadius: 999,
                                                    '& .MuiChip-label': {
                                                        px: 0.75,
                                                        lineHeight: 1,
                                                        fontWeight: 700,
                                                    },
                                                    '& .MuiChip-icon': {
                                                        fontSize: '0.85rem',
                                                        color: '#fff',
                                                        ml: 0.5,
                                                        mr: -0.5,
                                                    },
                                                }}
                                            />
                                        </>
                                    );
                                })()
                            ) : (
                                <Chip
                                    label={evt.impactMeta.icon}
                                    size="small"
                                    sx={{
                                        height: 16,
                                        minWidth: 16,
                                        bgcolor: evt.impactMeta.color,
                                        color: isColorDark(evt.impactMeta.color) ? '#fff' : '#1f1f1f',
                                        fontWeight: 800,
                                        fontSize: '0.625rem',
                                        borderRadius: 999,
                                        '& .MuiChip-label': {
                                            px: 1,
                                            lineHeight: 1,
                                        },
                                    }}
                                />
                            )}

                            {/* Currency Flag for Non-Custom Events */}
                            {!evt.isCustom && (
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
                                            title={evt.currency || 'Global'}
                                        />
                                    ) : (
                                        <PublicIcon
                                            sx={{
                                                fontSize: 14,
                                                color: 'text.secondary',
                                                opacity: evt.isPassed ? 0.6 : 0.8,
                                            }}
                                            titleAccess="Global event"
                                        />
                                    )}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.7rem',
                                            color: 'text.secondary',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {evt.currency || 'ALL'}
                                    </Typography>
                                </Box>
                            )}

                            {/* Relative Time Label */}
                            {evt.relativeLabel && (
                                <>
                                    {!evt.isCustom && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                                fontSize: '0.7rem',
                                            }}
                                        >
                                            ·
                                        </Typography>
                                    )}
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
                                    {(evt.isNow || evt.isNext) ? (
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', ml: 0.5 }}>
                                            {evt.isNow ? (
                                                <Chip
                                                    label="NOW"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: (theme) => theme.palette.info.main + '1f',
                                                        color: 'info.main',
                                                        fontWeight: 800,
                                                        height: 18,
                                                        fontSize: '0.6rem',
                                                        minWidth: 40,
                                                        '& .MuiChip-label': {
                                                            px: 0.5,
                                                        },
                                                    }}
                                                />
                                            ) : null}
                                            {evt.isNext ? (
                                                <Chip
                                                    label="NEXT"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: (theme) => theme.palette.success.main + '1f',
                                                        color: 'success.main',
                                                        fontWeight: 800,
                                                        height: 18,
                                                        fontSize: '0.6rem',
                                                        minWidth: 40,
                                                        '& .MuiChip-label': {
                                                            px: 0.5,
                                                        },
                                                    }}
                                                />
                                            ) : null}
                                        </Box>
                                    ) : null}
                                </>
                            )}
                        </Box>

                        {/* Divider between events */}
                        {showMultiple && idx < processedEvents.length - 1 && (
                            <Divider
                                sx={{
                                    mt: 0.75,
                                    opacity: 0.5,
                                    borderColor: 'divider',
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>

            {/* Footer: Click hint */}
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                }}
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
                    {showMultiple ? t('calendar:tooltip.eventCount', { count: processedEvents.length, defaultValue: `${processedEvents.length} events` }) : t('calendar:tooltip.singleEvent', { defaultValue: '1 event' })}
                </Typography>
            </Box>
        </Box>
    );
}

EventMarkerTooltip.propTypes = {
    events: PropTypes.arrayOf(PropTypes.object).isRequired,
    timezone: PropTypes.string,
    nowEpochMs: PropTypes.number,
    groupEpochMs: PropTypes.number,
    onClick: PropTypes.func,
    onClose: PropTypes.func,
    isFavoriteEvent: PropTypes.func,
    hasEventNotes: PropTypes.func,
};

export default EventMarkerTooltip;
