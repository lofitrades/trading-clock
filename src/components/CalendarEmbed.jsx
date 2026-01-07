/**
 * src/components/CalendarEmbed.jsx
 * 
 * Purpose: Two-panel, Airbnb-inspired economic calendar surface that reuses EventsFilters3, groups events by day,
 * and stays embeddable for other pages while keeping Time 2 Trade branding and SEO-friendly copy.
 * 
 * Changelog:
 * v1.3.53 - 2026-01-07 - Keep the Sponsored ad visible on single-column layout above the calendar surface.
 * v1.3.52 - 2026-01-07 - Hide Today's Trading Clock panel on single-column layout; show only in two-column (lg+) view.
 * v1.3.51 - 2026-01-07 - Added responsive ad Paper beneath Today's Trading Clock using Google AdSense enterprise loading pattern.
 * v1.3.50 - 2026-01-07 - Removed Trading Clock auth CTA button to keep header spacing consistent when not signed in.
 * v1.3.49 - 2026-01-07 - Added 16px top margin to Economic Calendar paper for consistent alignment in two-column layout.
 * v1.3.48 - 2026-01-07 - Added IntersectionObserver to detect when sticky filters are actually frozen. Shadow now only appears when filters are stuck, not in their original position, using isFiltersStuck state.
 * v1.3.47 - 2026-01-07 - Removed rounded corners from sticky filters (borderRadius: 0) and added bottom-only shadow (boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)') like top nav bars - visible when frozen over content.
 * v1.3.46 - 2026-01-07 - Fixed sticky filters to freeze at top: 0 (relative to Paper) instead of top: 16 (viewport offset). Prevents gap above filters when scrolling since Paper is already sticky at top: 16.
 * v1.3.45 - 2026-01-07 - Made Economic Calendar Paper sticky at top: 16px (lg) to maintain consistent top position while scrolling. Follows MUI dashboard best practices with alignSelf: flex-start.
 * v1.3.44 - 2026-01-06 - Moved 'Search & Filters' title and event stats inside sticky filters box. All freeze together at top: 0 (xs) and 16px (lg) matching Economic Calendar Paper position.
 * v1.3.43 - 2026-01-06 - Made sticky filters "invisible" in original position: removed shadow/border, matched button radius, auto-sized to content. Becomes visible only when sticky due to solid background.
 * v1.3.42 - 2026-01-06 - Refined sticky filters to be more bubble-like: removed negative margins, increased border radius, added subtle border, stays within Paper bounds with proper spacing.
 * v1.3.41 - 2026-01-06 - Made filters sticky on scroll with floating appearance. When scrolling past filters, they freeze at top of viewport with shadow and backdrop blur following MUI best practices.
 * v1.3.40 - 2026-01-06 - Replaced refresh button in footer with standard copyright notice "© 2026 Time 2 Trade. All rights reserved." following enterprise best practices.
 * v1.3.39 - 2026-01-06 - Removed duplicate "Updated" timestamp from top stats row, keeping only the one in footer for cleaner UI.
 * v1.3.38 - 2026-01-06 - Simplified event stats UI from chips to minimalistic text with icons, removing background colors for cleaner look aligned with page design.
 * v1.3.37 - 2026-01-06 - Moved 'Events table by day' section with chips above EventsFilters3 for better information hierarchy and improved UX flow.
 * v1.3.36 - 2026-01-06 - Fixed gear icon positioning in Trading Clock header to use absolute positioning, ensuring it doesn't affect vertical spacing between title and subtitle. Both headers now have identical spacing structure.
 * v1.3.35 - 2026-01-06 - Replaced NewsSourceSelector button with inline underlined link in subtitle. "Forex Factory" text is now clickable and opens informational modal.
 * v1.3.34 - 2026-01-06 - Standardized both header subtitles to body2 variant with identical styling (72% opacity). Both headers now perfectly identical in structure and appearance.
 * v1.3.33 - 2026-01-06 - Unified Trading Clock header structure to match Economic Calendar header layout. Settings gear icon now positioned exactly like Forex Factory button with same responsive behavior.
 * v1.3.32 - 2026-01-06 - Moved Forex Factory (NewsSourceSelector) button from footer to top-right corner of Economic Calendar heading. Fully responsive with mobile-first layout (stacks on xs, inline on sm+).
 * v1.3.31 - 2026-01-06 - Removed data source selection functionality. NewsSourceSelector now displays informational modal about Forex Factory data only. Backend continues fetching from all sources for future flexibility.
 * v1.3.30 - 2026-01-06 - Added timezone selector button below digital clock in Trading Clock panel that opens responsive modal with full TimezoneSelector functionality. Mobile-first design with collapsed text button that expands to searchable dropdown.
 * v1.3.29 - 2026-01-06 - Implemented proper two-column dashboard layout: Trading Clock is now truly sticky/frozen on lg+ while only Economic Calendar scrolls, following MUI dashboard best practices.
 * v1.3.28 - 2026-01-06 - FINAL FIX: Root cause was in EventsFilters3/useCalendarData calculateDateRange - endOfDay using 23:59:59.999 was bleeding into next calendar day due to timezone offset. Fixed by using (next day start - 1 second) approach.
 * v1.3.27 - 2026-01-06 - Improved buildDaySequence loop termination logic to strictly stop at endKey and added safety check to prevent infinite loops, ensuring single-day presets return exactly one day key.
 * v1.3.26 - 2026-01-06 - Fixed buildDaySequence to iterate by UTC timestamps with getDayKey formatting instead of local Date objects, preventing timezone-dependent day sequence errors that caused extra day cards.
 * v1.3.25 - 2026-01-06 - Fixed eventsByDay to only include events matching visibleDayKeys (preventing extra day cards) and added skeleton placeholder for day header dates during loading.
 * v1.3.24 - 2026-01-06 - Rewrote buildDaySequence to iterate by timezone-aware calendar days and simplified visibleDayKeys to strictly enforce single-day rendering (startKey === endKey) for Today/Tomorrow/Yesterday presets, eliminating all stray day headers.
 * v1.3.23 - 2026-01-06 - Force single-day filters to render only the selected day, preventing stray previous-day headers.
 * v1.3.22 - 2026-01-06 - Align skeleton placeholder widths with table columns for consistent loading layout.
 * v1.3.21 - 2026-01-06 - Force single-day presets to render only the selected day key, preventing stray previous-day headers when timezones shift.
 * v1.3.20 - 2026-01-06 - Align day rendering with date presets (single-day only when selected), show skeletons while loading, and remove the 'No upcoming events' chip.
 * v1.3.19 - 2026-01-06 - Center the trading clock canvas with padded max-width container so session labels stay visible without overflow.
 * v1.3.18 - 2026-01-06 - Add skeleton loaders for day rows and delay empty-state copy until events finish loading.
 * v1.3.17 - 2026-01-06 - Session-based Background now also tints the Trading Clock panel background for live preview consistency.
 * v1.3.16 - 2026-01-06 - Add settings gear on Trading Clock card header to open SettingsSidebar2 for quick access.
 * v1.3.15 - 2026-01-06 - For speech/speaks events, show dashes for A/F/P metrics instead of zero placeholders when no data exists.
 * v1.3.14 - 2026-01-06 - Gray out past-event currency flags in the table while keeping badges visible.
 * v1.3.13 - 2026-01-06 - Remove allowedEventKeys wiring (overlay handles its own fetch) and clean unused visibleEventKeys to avoid runtime and lint issues.
 * v1.3.12 - 2026-01-06 - Let the Economic Calendar paper size to its content (no viewport height clamp) so the table isn’t compressed and the page scrolls naturally.
 * v1.3.11 - 2026-01-06 - Make Trading Clock panel sticky on lg+ and confine scrolling to the Economic Calendar column for a stable two-column experience.
 * v1.3.10 - 2026-01-06 - Prevent hidden-by-filter events from rendering markers/tooltips by syncing allowedEventKeys with the table view.
 * v1.3.9 - 2026-01-06 - Add digital clock and session label to Trading Clock when enabled (defaults on) for functional parity.
 * v1.3.8 - 2026-01-06 - Smooth hand overlay interpolation and hoverable tooltips on hybrid devices; disable marker auto-scroll while keeping tooltip row click scroll.
 * v1.3.7 - 2026-01-06 - Replace Trading Clock clock with the full app implementation (sizing, overlays, badges) for visual parity.
 * v1.3.6 - 2026-01-06 - Add responsive session clock preview (canvas + overlays) to Trading Clock using app settings.
 * v1.3.5 - 2026-01-06 - Repair corrupted imports and re-wire favorites/notes props for the md+ action column.
 * v1.3.4 - 2026-01-06 - Match EventsTable mobile width behavior: auto table layout, constrained to Paper, ellipsis headers, wrap-safe event cells.
 * v1.3.3 - 2026-01-06 - Restore day headers on xs, hide notes icon on xs, and tighten xs gaps between time/currency/impact columns.
 * v1.3.2 - 2026-01-06 - Align xs view with EventsTable mobile: hide table headers on xs, tighter padding, flag-only currency on phones.
 * v1.3.1 - 2026-01-06 - Show next badge only in the page header and remove inline A/F/P caption under event names.
 * v1.3.0 - 2026-01-06 - Rebuilt day view as an enterprise MUI table with actions-first column, responsive columns, and aligned mobile layout.
 * v1.2.4 - 2026-01-06 - Match xs rows to EventsTable mobile: add actions column, inline metrics caption, tighter grid.
 * v1.2.3 - 2026-01-06 - Compact xs layout: table-style inline row (time/meta/details/metrics) instead of stacked cards.
 * v1.2.2 - 2026-01-06 - Rebuilt EventRow/helpers after merge corruption to restore lint pass and table layout behavior.
 * v1.2.1 - 2026-01-06 - Restyled event rows to table-like layout and simplified footer status (text-based updated label, removed event count chip).
 * v1.2.0 - 2026-01-06 - Added NOW/NEXT countdown chips, timezone-aware past styling, EventModal + notes actions, and primary-highlighted today headers.
 * v1.1.0 - 2026-01-06 - Moved filters to top panel and relocated hero copy into footer for the calendar page.
 * v1.0.1 - 2026-01-06 - Added PropTypes coverage and lint cleanups (React import, unused values).
 * v1.0.0 - 2026-01-06 - Initial implementation with This Week default preset, day grouping (including empty days), and embed-ready layout.
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));
import EventsFilters3 from './EventsFilters3';
import NewsSourceSelector from './NewsSourceSelector';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import useCalendarData from '../hooks/useCalendarData';
import { useClock } from '../hooks/useClock';
import { useEventNotes } from '../hooks/useEventNotes';
import EventModal from './EventModal';
import EventNotesDialog from './EventNotesDialog';
import DigitalClock from './DigitalClock';
import SessionLabel from './SessionLabel';
import TimezoneSelector from './TimezoneSelector';
import SettingsSidebar2 from './SettingsSidebar2';
import '../App.css';
import { DATE_FORMAT_OPTIONS, formatDate, formatTime } from '../utils/dateUtils';
import { isColorDark } from '../utils/clockUtils';
import { resolveImpactMeta } from '../utils/newsApi';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { hasAdConsent, subscribeConsent } from '../utils/consent';
import {
    NOW_WINDOW_MS,
    computeNowNextState,
    formatCountdownHMS,
    formatRelativeLabel,
    getEventEpochMs,
    getNowEpochMs,
    isPastToday,
} from '../utils/eventTimeEngine';

const eventShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Event_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    dateTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    Date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    name: PropTypes.string,
    Name: PropTypes.string,
    description: PropTypes.string,
    Description: PropTypes.string,
    summary: PropTypes.string,
    Summary: PropTypes.string,
    currency: PropTypes.string,
    Currency: PropTypes.string,
    impact: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    importance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    forecast: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Forecast: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    previous: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Previous: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const buildEventKey = (event) => {
    const epoch = getEventEpochMs(event);
    const identifier = event.id || event.Event_ID || `${event.name || event.Name || 'event'}`;
    return `${identifier}-${epoch ?? 'na'}`;
};

const isSpeechLikeEvent = (event) => {
    if (!event) return false;
    const textParts = [
        event.name,
        event.Name,
        event.summary,
        event.Summary,
        event.description,
        event.Description,
        event.category,
        event.Category,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return ['speak', 'speech', 'press conference', 'testifies', 'testimony'].some((token) => textParts.includes(token));
};

const formatMetricValue = (value, isSpeechEvent) => {
    const isEmpty = value === null || value === undefined;
    if (isEmpty) return '—';

    const trimmed = typeof value === 'string' ? value.trim() : value;
    const isZeroish = trimmed === '' || trimmed === 0 || trimmed === '0' || trimmed === '0.0' || trimmed === 0.0;

    if (isSpeechEvent && isZeroish) return '—';

    return value;
};

const areSetsEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.size !== b.size) return false;
    for (const value of a) {
        if (!b.has(value)) return false;
    }
    return true;
};

const getDayKey = (value, timezone) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(date);
    } catch (error) {
        console.error('[CalendarEmbed] Failed to format day key', error);
        return null;
    }
};

const buildDaySequence = (startDate, endDate, timezone) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

    // Get the day keys for start and end dates in the target timezone
    const startKey = getDayKey(start, timezone);
    const endKey = getDayKey(end, timezone);
    if (!startKey || !endKey) return [];

    // If it's the same day, return single key immediately (CRITICAL for single-day presets)
    if (startKey === endKey) {
        return [startKey];
    }

    // For multi-day ranges only: iterate through each day
    // Use timezone-aware formatting at each step to handle DST and offset changes
    const days = [startKey];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let cursor = new Date(start.getTime());

    // Keep adding days until we reach the end key
    while (days[days.length - 1] !== endKey) {
        cursor = new Date(cursor.getTime() + MS_PER_DAY);
        const key = getDayKey(cursor, timezone);
        if (!key) break;
        if (key !== days[days.length - 1]) {
            days.push(key);
        }
        if (key === endKey) break;
        // Safety check to prevent infinite loops (max 400 days)
        if (days.length > 400) break;
    }

    return days;
};

const CurrencyBadge = ({ currency, isPast = false }) => {
    const code = (currency || '').toUpperCase();
    const countryCode = getCurrencyFlag(code);

    if (!code) {
        return <Chip label="—" size="small" variant="outlined" sx={{ fontWeight: 700 }} />;
    }

    if (!countryCode) {
        return <Chip label={code} size="small" sx={{ height: 22, fontWeight: 700, opacity: isPast ? 0.7 : 1 }} />;
    }

    return (
        <Tooltip title={code}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    opacity: isPast ? 0.7 : 1,
                    filter: isPast ? 'grayscale(1)' : 'none',
                }}
            >
                <Box component="span" className={`fi fi-${countryCode}`} sx={{ fontSize: 16, lineHeight: 1 }} />
                <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
                >
                    {code}
                </Typography>
            </Box>
        </Tooltip>
    );
};

CurrencyBadge.propTypes = {
    currency: PropTypes.string,
    isPast: PropTypes.bool,
};

const ImpactBadge = ({ strength, isPast = false }) => {
    const meta = resolveImpactMeta(strength || 'unknown');

    return (
        <Tooltip title={meta.label}>
            <Chip
                label={meta.icon}
                size="small"
                sx={{
                    minWidth: 38,
                    height: 22,
                    bgcolor: isPast ? '#9e9e9e' : meta.color,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                }}
            />
        </Tooltip>
    );
};

ImpactBadge.propTypes = {
    strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isPast: PropTypes.bool,
};

const TABLE_COLUMNS = [
    { id: 'action', label: '', align: 'center', width: { xs: 0, sm: 64 }, hideBelow: 'md' },
    { id: 'time', label: 'Time', align: 'center', width: { xs: 64, sm: 92 } },
    { id: 'currency', label: 'Cur', align: 'center', width: { xs: 52, sm: 68 } },
    { id: 'impact', label: 'Imp', align: 'center', width: { xs: 52, sm: 68 } },
    { id: 'name', label: 'Event', align: 'left' },
    { id: 'actual', label: 'A', align: 'center', width: 82, hideBelow: 'md' },
    { id: 'forecast', label: 'F', align: 'center', width: 82, hideBelow: 'md' },
    { id: 'previous', label: 'P', align: 'center', width: 82, hideBelow: 'md' },
];

const metricCellDisplay = { xs: 'none', md: 'table-cell' };

const ADS_CLIENT_ID = 'ca-pub-3984565509623618';
const ADS_SLOT_ID = '4350738073';
const ADS_SCRIPT_ATTR = 'data-adsbygoogle-script';

const EventRow = memo(({
    event,
    timezone,
    onToggleFavorite,
    isFavorite,
    isFavoritePending,
    onOpenNotes,
    hasEventNotes,
    isEventNotesLoading,
    onOpenEvent,
    isNow = false,
    isNext = false,
    nextCountdownLabel,
    isPast = false,
    nowEpochMs,
}) => {
    const name = event.name || event.Name || 'Unnamed event';
    const description = event.description || event.Description || event.summary || event.Summary || '';
    const isSpeechEvent = useMemo(() => isSpeechLikeEvent(event), [event]);
    const actualValue = formatMetricValue(event.actual ?? event.Actual, isSpeechEvent);
    const forecast = formatMetricValue(event.forecast ?? event.Forecast, isSpeechEvent);
    const previous = formatMetricValue(event.previous ?? event.Previous, isSpeechEvent);
    const strengthValue = event.strength || event.Strength || event.impact || event.importance || '';
    const eventEpochMs = getEventEpochMs(event);
    const nextTooltip = eventEpochMs ? formatRelativeLabel({ eventEpochMs, nowEpochMs }) : 'Upcoming event';
    const favorite = isFavorite ? isFavorite(event) : false;
    const favoritePending = isFavoritePending ? isFavoritePending(event) : false;
    const hasNotes = hasEventNotes ? hasEventNotes(event) : false;
    const notesLoading = isEventNotesLoading ? isEventNotesLoading(event) : false;

    const handleOpenEvent = () => {
        if (onOpenEvent) onOpenEvent(event);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenEvent();
        }
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(event);
    };

    const handleOpenNotes = (e) => {
        e.stopPropagation();
        if (onOpenNotes) onOpenNotes(event);
    };

    return (
        <TableRow
            hover
            tabIndex={0}
            onClick={handleOpenEvent}
            onKeyDown={handleKeyDown}
            data-t2t-event-row-key={buildEventKey(event)}
            sx={{
                cursor: 'pointer',
                backgroundColor: (theme) => {
                    if (isNow) return alpha(theme.palette.info.main, 0.08);
                    if (isNext) return alpha(theme.palette.success.main, 0.06);
                    return 'transparent';
                },
                opacity: isPast && !isNow && !isNext ? 0.72 : 1,
                borderLeft: (theme) => {
                    if (isNow) return `3px solid ${theme.palette.info.main}`;
                    if (isNext) return `3px solid ${theme.palette.success.main}`;
                    return 'none';
                },
                '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                },
            }}
        >

            <TableCell
                align="center"
                sx={{
                    borderColor: 'divider',
                    width: { xs: 0, sm: 72 },
                    minWidth: { xs: 0, sm: 64 },
                    px: { xs: 0, sm: 0.6 },
                    display: { xs: 'none', md: 'table-cell' },
                }}
                padding="checkbox"
            >
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ minWidth: 0, flexWrap: 'nowrap' }}>
                    {onOpenNotes ? (
                        <Tooltip title={notesLoading ? 'Loading notes...' : hasNotes ? 'View notes' : 'Add note'}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={handleOpenNotes}
                                    disabled={notesLoading}
                                    sx={{
                                        p: 0.35,
                                        color: hasNotes ? 'primary.main' : 'text.secondary',
                                        '&:hover': {
                                            color: 'primary.main',
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                        },
                                        '&.Mui-disabled': {
                                            color: 'text.disabled',
                                        },
                                    }}
                                >
                                    {notesLoading ? (
                                        <CircularProgress size={14} thickness={5} />
                                    ) : hasNotes ? (
                                        <NoteAltIcon fontSize="small" />
                                    ) : (
                                        <NoteAltOutlinedIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                    {onToggleFavorite ? (
                        <Tooltip title={favorite ? 'Remove favorite' : 'Add to favorites'}>
                            <span>
                                <IconButton size="small" onClick={handleFavoriteClick} disabled={favoritePending} sx={{ p: 0.35 }}>
                                    {favorite ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                </Stack>
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', whiteSpace: { xs: 'normal', sm: 'nowrap' }, minWidth: { xs: 60, sm: 86 }, px: { xs: 0, sm: 1 } }}>
                <Stack direction="row" spacing={{ xs: 0.05, sm: 0.5 }} alignItems="center" justifyContent="center" sx={{ flexWrap: 'wrap', rowGap: 0.05, width: '100%' }}>
                    <Typography variant="body2" fontWeight={800} sx={{ minWidth: 48, fontFamily: 'monospace', textAlign: 'center', width: '100%' }}>
                        {formatTime(event.time || event.date || event.Date, timezone)}
                    </Typography>
                    {isNext ? (
                        <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                            <Tooltip title={nextCountdownLabel ? nextTooltip : 'Upcoming event'}>
                                <AccessTimeIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            </Tooltip>
                        </Box>
                    ) : null}
                    {isNow ? (
                        <Chip
                            label="NOW"
                            size="small"
                            color="info"
                            sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }}
                        />
                    ) : null}
                </Stack>
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', width: { xs: 52, sm: 68 }, minWidth: { xs: 52, sm: 64 }, px: { xs: 0, sm: 0.85 } }}>
                <CurrencyBadge currency={event.currency || event.Currency} isPast={isPast && !isNow && !isNext} />
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', width: { xs: 52, sm: 68 }, minWidth: { xs: 52, sm: 64 }, px: { xs: 0, sm: 0.85 } }}>
                <ImpactBadge strength={strengthValue} isPast={isPast && !isNow && !isNext} />
            </TableCell>

            <TableCell sx={{ borderColor: 'divider', minWidth: { xs: 0, sm: 180 }, px: { xs: 0.6, sm: 1 }, width: '100%', maxWidth: '100%' }}>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 700,
                        color: isPast ? 'text.secondary' : 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        wordBreak: 'break-word',
                        minWidth: 0,
                        maxWidth: '100%',
                        width: '100%',
                    }}
                    title={name}
                >
                    {name}
                </Typography>
                {/* Metrics are displayed in dedicated columns; keep name clean on all breakpoints */}
                {description ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', maxWidth: '100%' }}
                    >
                        {description}
                    </Typography>
                ) : null}
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 86, px: { xs: 0.5, sm: 1 } }}>
                <Typography
                    variant="body2"
                    fontWeight={600}
                    color={actualValue !== '—' ? 'primary.main' : 'text.secondary'}
                    sx={{ fontFamily: 'monospace' }}
                >
                    {actualValue}
                </Typography>
            </TableCell>
            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 86, px: { xs: 0.5, sm: 1 } }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {forecast}
                </Typography>
            </TableCell>
            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 86, px: { xs: 0.5, sm: 1 } }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {previous}
                </Typography>
            </TableCell>
        </TableRow>
    );
});

EventRow.propTypes = {
    event: eventShape.isRequired,
    timezone: PropTypes.string.isRequired,
    onToggleFavorite: PropTypes.func,
    isFavorite: PropTypes.func,
    isFavoritePending: PropTypes.func,
    onOpenNotes: PropTypes.func,
    hasEventNotes: PropTypes.func,
    isEventNotesLoading: PropTypes.func,
    onOpenEvent: PropTypes.func,
    isNow: PropTypes.bool,
    isNext: PropTypes.bool,
    nextCountdownLabel: PropTypes.string,
    isPast: PropTypes.bool,
    nowEpochMs: PropTypes.number.isRequired,
};
EventRow.displayName = 'EventRow';

const DaySection = memo(({
    dayKey,
    timezone,
    events,
    nowEventIds,
    nextEventIds,
    nextCountdownLabel,
    nowEpochMs,
    onToggleFavorite,
    isFavorite,
    isFavoritePending,
    onOpenEvent,
    onOpenNotes,
    hasEventNotes,
    isEventNotesLoading,
    isToday,
    isLoading = false,
}) => {
    const displayDate = useMemo(() => {
        const parts = dayKey.split('-');
        const date = parts.length === 3 ? new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`) : null;
        return date ? formatDate(date, timezone, DATE_FORMAT_OPTIONS.LONG) : '—';
    }, [dayKey, timezone]);

    const displayDateElement = useMemo(() => {
        if (isLoading) {
            return <Skeleton variant="text" width="60%" sx={{ bgcolor: isToday ? alpha('#ffffff', 0.25) : undefined }} />;
        }
        return displayDate;
    }, [displayDate, isLoading, isToday]);

    const headerChipLabel = isLoading ? 'Loading…' : events.length ? `${events.length} event${events.length === 1 ? '' : 's'}` : 'No events';
    const showSkeletonRows = isLoading;
    const showEmptyState = !isLoading && events.length === 0;

    return (
        <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
                borderRadius: 2,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
            }}
        >
            <Table
                size="small"
                stickyHeader
                aria-label={`Events on ${displayDate}`}
                sx={{ tableLayout: 'auto', width: '100%', maxWidth: '100%' }}
            >
                <TableHead>
                    <TableRow>
                        <TableCell
                            colSpan={TABLE_COLUMNS.length}
                            sx={{
                                borderColor: 'divider',
                                bgcolor: isToday ? 'primary.main' : 'background.default',
                                color: isToday ? 'primary.contrastText' : 'text.primary',
                                py: 1,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={{ xs: 0.75, sm: 1.25 }}
                                alignItems="center"
                                justifyContent="space-between"
                                flexWrap="nowrap"
                                sx={{ width: '100%', minWidth: 0 }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {displayDateElement}
                                </Typography>
                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 'auto', flex: '0 0 auto', flexShrink: 0 }}>
                                    <Chip
                                        label={headerChipLabel}
                                        size="small"
                                        sx={{ fontWeight: 800, bgcolor: alpha(isToday ? '#ffffff' : '#3c4d63', 0.12), color: isToday ? 'primary.contrastText' : 'inherit' }}
                                    />
                                </Stack>
                            </Stack>
                        </TableCell>
                    </TableRow>
                    {!showEmptyState && (
                        <TableRow>
                            {TABLE_COLUMNS.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={column.align}
                                    sx={{
                                        borderColor: 'divider',
                                        width: column.width,
                                        minWidth: column.width,
                                        display: column.hideBelow ? { xs: 'none', [column.hideBelow]: 'table-cell' } : 'table-cell',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.2,
                                        bgcolor: 'background.default',
                                    }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableHead>
                <TableBody>
                    {showSkeletonRows ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                            <TableRow key={`skeleton-${idx}`}>
                                <TableCell colSpan={TABLE_COLUMNS.length} sx={{ borderColor: 'divider', py: 1.5 }}>
                                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                                        <Box sx={{ display: { xs: 'none', md: 'flex' }, width: { md: 64 }, justifyContent: 'center' }}>
                                            <Skeleton variant="circular" width={22} height={22} />
                                        </Box>
                                        <Skeleton variant="rounded" width={{ xs: 64, sm: 92 }} height={18} />
                                        <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                        <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                        <Stack spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
                                            <Skeleton variant="text" width="72%" />
                                            <Skeleton variant="text" width="54%" />
                                        </Stack>
                                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.75 }}>
                                            <Skeleton variant="text" width={86} />
                                            <Skeleton variant="text" width={86} />
                                            <Skeleton variant="text" width={86} />
                                        </Box>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : showEmptyState ? (
                        <TableRow>
                            <TableCell colSpan={TABLE_COLUMNS.length} sx={{ borderColor: 'divider', py: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    No events for this day.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        events.map((event) => {
                            const eventKey = buildEventKey(event);
                            const eventEpochMs = getEventEpochMs(event);
                            const pastToday = isPastToday({ eventEpochMs, nowEpochMs, timezone });
                            const activeNow = nowEventIds.has(eventKey);
                            const activeNext = nextEventIds.has(eventKey);
                            return (
                                <EventRow
                                    key={event.id || `${event.name}-${event.date}`}
                                    event={event}
                                    timezone={timezone}
                                    onToggleFavorite={onToggleFavorite}
                                    isFavorite={isFavorite}
                                    isFavoritePending={isFavoritePending}
                                    onOpenNotes={onOpenNotes}
                                    hasEventNotes={hasEventNotes}
                                    isEventNotesLoading={isEventNotesLoading}
                                    onOpenEvent={onOpenEvent}
                                    isNow={activeNow}
                                    isNext={activeNext}
                                    nextCountdownLabel={activeNext ? nextCountdownLabel : null}
                                    isPast={pastToday}
                                    nowEpochMs={nowEpochMs}
                                />
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

DaySection.propTypes = {
    dayKey: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
    events: PropTypes.arrayOf(eventShape).isRequired,
    nowEventIds: PropTypes.instanceOf(Set).isRequired,
    nextEventIds: PropTypes.instanceOf(Set).isRequired,
    nextCountdownLabel: PropTypes.string,
    nowEpochMs: PropTypes.number.isRequired,
    onToggleFavorite: PropTypes.func,
    isFavorite: PropTypes.func,
    isFavoritePending: PropTypes.func,
    onOpenEvent: PropTypes.func,
    onOpenNotes: PropTypes.func,
    hasEventNotes: PropTypes.func,
    isEventNotesLoading: PropTypes.func,
    isToday: PropTypes.bool,
    isLoading: PropTypes.bool,
};
DaySection.displayName = 'DaySection';

export default function CalendarEmbed({
    title = 'Economic Calendar',
    onOpenAuth = null,
    showSeoCopy = true,
}) {
    const theme = useTheme();
    const isTwoColumn = useMediaQuery(theme.breakpoints.up('lg'));
    const { user } = useAuth();
    const {
        filters,
        handleFiltersChange,
        applyFilters,
        events,
        loading,
        error,
        lastUpdated,
        visibleCount,
        timezone,
        newsSource,
        isFavorite,
        toggleFavorite,
        isFavoritePending,
        favoritesLoading,
    } = useCalendarData({ defaultPreset: 'thisWeek' });

    const {
        sessions,
        selectedTimezone,
        clockStyle,
        showSessionNamesInCanvas,
        showClockNumbers,
        showClockHands,
        showHandClock,
        showDigitalClock,
        showSessionLabel,
        showTimeToEnd,
        showTimeToStart,
        showEventsOnCanvas,
        eventFilters: settingsEventFilters,
        newsSource: settingsNewsSource,
        backgroundBasedOnSession,
        backgroundColor,
    } = useSettings();

    const clockTimezone = selectedTimezone || timezone;
    const { currentTime, activeSession, nextSession, timeToEnd, timeToStart } = useClock(clockTimezone, sessions);
    const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });

    const [workspaceClockBaseSize, setWorkspaceClockBaseSize] = useState(260);
    const [workspaceClockSize, setWorkspaceClockSize] = useState(260);
    const [workspaceHasSize, setWorkspaceHasSize] = useState(false);
    const [shouldRenderEventsOverlay, setShouldRenderEventsOverlay] = useState(false);
    const [workspaceOverlayLoading, setWorkspaceOverlayLoading] = useState(false);
    const workspaceClockContainerRef = useRef(null);
    const adRef = useRef(null);
    const adInitializedRef = useRef(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Only show skeletons during initial load, not on subsequent fetches
    const showSkeletons = loading && !initialLoadComplete;

    useEffect(() => {
        if (!loading && events.length >= 0) {
            setInitialLoadComplete(true);
        }
    }, [loading, events.length]);

    const {
        notesError,
        hasNotes,
        getNotesForEvent,
        ensureNotesStream,
        stopNotesStream,
        addNote,
        removeNote,
        isEventNotesLoading,
    } = useEventNotes();

    const [nowEpochMs, setNowEpochMs] = useState(() => getNowEpochMs(timezone));
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [noteTarget, setNoteTarget] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
    const [newsSourceModalOpen, setNewsSourceModalOpen] = useState(false);
    const [isFiltersStuck, setIsFiltersStuck] = useState(false);

    useEffect(() => {
        setNowEpochMs(getNowEpochMs(timezone));
    }, [timezone]);

    useEffect(() => {
        const computeBaseSize = () => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

            // Mirror /app sizing heuristics: prioritize height, clamp by width, ensure mobile margins.
            const settingsButtonHeight = 48;
            const totalRatio = 1; // Only analog clock in this panel.
            const availableHeight = vh - settingsButtonHeight - 10;
            let next = Math.floor((availableHeight / totalRatio) * 1);
            next = Math.max(180, next);
            const horizontalMargin = vw < 600 ? 16 : 48;
            const maxWidthSize = vw - horizontalMargin;
            next = Math.min(next, maxWidthSize, 440);

            setWorkspaceClockBaseSize((prev) => (prev === next ? prev : next));
        };

        computeBaseSize();
        const onResize = () => window.requestAnimationFrame(computeBaseSize);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const measure = () => {
            const node = workspaceClockContainerRef.current;
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const gutter = 12; // Keep breathing room so canvas text and arcs stay inside the paper
            const availableWidth = Math.max(0, rect.width - gutter);
            const next = Math.max(180, Math.min(availableWidth, workspaceClockBaseSize));
            if (Number.isFinite(next) && next > 0) {
                setWorkspaceClockSize((prev) => (prev === next ? prev : next));
                setWorkspaceHasSize(true);
            }
        };

        measure();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(measure);
            if (workspaceClockContainerRef.current) {
                observer.observe(workspaceClockContainerRef.current);
            }
            return () => observer.disconnect();
        }

        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [workspaceClockBaseSize]);

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

    useEffect(() => {
        const id = setInterval(() => {
            setNowEpochMs(getNowEpochMs(timezone));
        }, 1000);
        return () => clearInterval(id);
    }, [timezone]);

    useEffect(() => {
        if (!showEventsOnCanvas) {
            setWorkspaceOverlayLoading(false);
        }
    }, [showEventsOnCanvas]);

    const clockSurfaceColor = backgroundBasedOnSession && activeSession?.color ? activeSession.color : backgroundColor || '#0f1f2f';
    const clockSurfaceIsDark = useMemo(() => isColorDark(clockSurfaceColor), [clockSurfaceColor]);
    const handColor = useMemo(() => (clockSurfaceIsDark ? '#F6F9FB' : '#0F172A'), [clockSurfaceIsDark]);
    const overlayEventFilters = useMemo(() => filters || settingsEventFilters, [filters, settingsEventFilters]);
    const overlayNewsSource = newsSource || settingsNewsSource;

    const clockPaperBg = useMemo(() => (backgroundBasedOnSession && activeSession?.color ? activeSession.color : '#ffffff'), [activeSession?.color, backgroundBasedOnSession]);
    const clockPaperTextColor = useMemo(() => (clockPaperBg && isColorDark(clockPaperBg) ? '#F6F9FB' : theme.palette.text.primary), [clockPaperBg, theme.palette.text.primary]);

    const shouldShowDigitalClock = showDigitalClock !== false;
    const shouldShowSessionLabel = showSessionLabel !== false;

    const dayKeys = useMemo(
        () => buildDaySequence(filters.startDate, filters.endDate, timezone),
        [filters.endDate, filters.startDate, timezone],
    );

    const startDayKey = useMemo(() => getDayKey(filters.startDate, timezone), [filters.startDate, timezone]);
    const endDayKey = useMemo(() => getDayKey(filters.endDate, timezone), [filters.endDate, timezone]);
    const isSingleDayRange = useMemo(() => Boolean(startDayKey && endDayKey && startDayKey === endDayKey), [endDayKey, startDayKey]);

    const visibleDayKeys = useMemo(() => {
        // For single-day ranges (Today/Tomorrow/Yesterday), show ONLY that day
        if (isSingleDayRange && startDayKey) {
            return [startDayKey];
        }
        // For multi-day ranges (This Week), show all days from buildDaySequence
        return dayKeys;
    }, [dayKeys, isSingleDayRange, startDayKey]);

    const eventsByDay = useMemo(() => {
        const grouped = new Map();
        visibleDayKeys.forEach((key) => grouped.set(key, []));

        events.forEach((event) => {
            const bucket = getDayKey(event.date || event.Date, timezone);
            if (!bucket) return;
            // Only add to grouped map if this day key is in visibleDayKeys
            if (grouped.has(bucket)) {
                grouped.get(bucket).push(event);
            }
        });

        return grouped;
    }, [events, timezone, visibleDayKeys]);

    const todayKey = useMemo(() => getDayKey(new Date(), timezone), [timezone]);

    const nowNextState = useMemo(
        () => computeNowNextState({ events, nowEpochMs, nowWindowMs: NOW_WINDOW_MS, buildKey: buildEventKey }),
        [events, nowEpochMs],
    );

    const prevNowEventIdsRef = useRef(new Set());
    const prevNextEventIdsRef = useRef(new Set());
    const filtersBoxRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFiltersStuck(entry.intersectionRatio < 1);
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        );

        const currentRef = filtersBoxRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const adSlot = adRef.current;
        if (!adSlot) return undefined;

        let cleanupScript;

        const loadScriptAndPush = () => {
            if (adInitializedRef.current) return;
            let script = document.querySelector(`script[${ADS_SCRIPT_ATTR}="t2t-adsense"]`);

            const pushAd = () => {
                if (!adRef.current || adInitializedRef.current) return;
                adInitializedRef.current = true;
                try {
                    window.adsbygoogle = window.adsbygoogle || [];
                    window.adsbygoogle.requestNonPersonalizedAds = hasAdConsent() ? 0 : 1;
                    window.adsbygoogle.push({});
                } catch {
                    adInitializedRef.current = false;
                }
            };

            const handleScriptLoad = () => {
                if (script) {
                    script.setAttribute('data-loaded', 'true');
                }
                pushAd();
            };

            if (!script) {
                script = document.createElement('script');
                script.setAttribute(ADS_SCRIPT_ATTR, 't2t-adsense');
                script.async = true;
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT_ID}`;
                script.crossOrigin = 'anonymous';
                script.addEventListener('load', handleScriptLoad);
                document.head.appendChild(script);
                cleanupScript = () => {
                    script.removeEventListener('load', handleScriptLoad);
                };
            } else if (script.getAttribute('data-loaded') === 'true' || script.readyState === 'complete') {
                pushAd();
            } else {
                script.addEventListener('load', handleScriptLoad);
                cleanupScript = () => script.removeEventListener('load', handleScriptLoad);
            }
        };

        loadScriptAndPush();
        const unsubscribe = subscribeConsent(() => {
            adInitializedRef.current = false;
            loadScriptAndPush();
        });

        return () => {
            if (cleanupScript) cleanupScript();
            unsubscribe();
        };
    }, []);

    const nowEventIds = useMemo(() => {
        const nextSet = nowNextState.nowEventIds || new Set();
        if (areSetsEqual(prevNowEventIdsRef.current, nextSet)) return prevNowEventIdsRef.current;
        prevNowEventIdsRef.current = nextSet;
        return nextSet;
    }, [nowNextState.nowEventIds]);

    const nextEventIds = useMemo(() => {
        const nextSet = nowNextState.nextEventIds || new Set();
        if (areSetsEqual(prevNextEventIdsRef.current, nextSet)) return prevNextEventIdsRef.current;
        prevNextEventIdsRef.current = nextSet;
        return nextSet;
    }, [nowNextState.nextEventIds]);

    const nextEventEpochMs = nowNextState.nextEventEpochMs;

    const nextCountdownLabel = useMemo(
        () => (nextEventEpochMs ? formatCountdownHMS(Math.max(0, nextEventEpochMs - nowEpochMs)) : null),
        [nextEventEpochMs, nowEpochMs],
    );

    const scrollEventIntoView = useCallback((event) => {
        if (!event || typeof document === 'undefined') return;
        const eventKey = buildEventKey(event);
        if (!eventKey) return;

        const escapedKey = typeof window !== 'undefined' && window.CSS?.escape ? window.CSS.escape(eventKey) : eventKey.replace(/[^a-zA-Z0-9_-]/g, '_');
        const target = document.querySelector(`[data-t2t-event-row-key="${escapedKey}"]`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }, []);

    const handleToggleFavorite = useCallback(async (event) => {
        const result = await toggleFavorite(event);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
    }, [toggleFavorite, onOpenAuth]);

    const handleOpenEvent = useCallback((event, meta) => {
        if (meta?.source === 'canvas-tooltip') {
            scrollEventIntoView(event);
        }
        setSelectedEvent(event);
    }, [scrollEventIntoView]);

    const handleCloseEvent = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    const handleOpenNotes = useCallback((event) => {
        const { key, requiresAuth } = ensureNotesStream(event);
        if (requiresAuth && onOpenAuth) {
            onOpenAuth();
            return;
        }
        if (key) {
            setNoteTarget({ event, key });
        }
    }, [ensureNotesStream, onOpenAuth]);

    const handleCloseNotes = useCallback(() => {
        if (noteTarget?.event) {
            stopNotesStream(noteTarget.event);
        }
        setNoteTarget(null);
    }, [noteTarget, stopNotesStream]);

    const handleAddNote = useCallback(async (noteText) => {
        if (!noteTarget?.event) return { success: false };
        const result = await addNote(noteTarget.event, noteText);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
        return result;
    }, [addNote, noteTarget, onOpenAuth]);

    const handleRemoveNote = useCallback(async (noteId) => {
        if (!noteTarget?.event) return { success: false };
        const result = await removeNote(noteTarget.event, noteId);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
        return result;
    }, [noteTarget, onOpenAuth, removeNote]);

    const renderWorkspaceSkeleton = !workspaceHasSize;
    const lastUpdatedLabel = useMemo(() => (lastUpdated ? lastUpdated.toLocaleTimeString() : null), [lastUpdated]);

    const sponsoredAdPaper = (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.text.primary, 0.12),
                bgcolor: '#ffffff',
                color: theme.palette.text.primary,
                p: { xs: 1.25, sm: 1.5 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
            }}
        >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={0.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.25 }}>
                    Sponsored
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.72) }}>
                    Keeping the calendar free.
                </Typography>
            </Stack>
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 120,
                    px: { xs: 0, sm: 0.5 },
                }}
            >
                <Box
                    component="ins"
                    ref={adRef}
                    className="adsbygoogle"
                    data-ad-client={ADS_CLIENT_ID}
                    data-ad-slot={ADS_SLOT_ID}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                    sx={{
                        display: 'block',
                        width: '100%',
                    }}
                />
            </Box>
        </Paper>
    );

    return (
        <Box
            sx={{
                backgroundColor: '#f5f7fb',
                color: theme.palette.text.primary,
                py: { xs: 3, md: 4 },
                minHeight: { xs: '100dvh', lg: 'auto' },
                height: { lg: '100dvh' },
                overflowX: 'hidden',
                overflowY: { xs: 'auto', lg: 'auto' },
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', xl: 1400 },
                    mx: 'auto',
                    px: { xs: 2, sm: 2.75, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 2, md: 2.5 },
                    overflowX: 'hidden',
                    overflowY: { lg: 'auto' },
                    height: { lg: '100%' },
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isTwoColumn ? 'minmax(360px, 420px) 1fr' : 'minmax(0, 1fr)',
                        gap: { xs: 2, md: 2.5 },
                        alignItems: 'start',
                        minWidth: 0,
                    }}
                >
                    {isTwoColumn && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: { xs: 2, md: 2.5 },
                                minWidth: 0,
                                position: { xs: 'relative', lg: 'sticky' },
                                top: { lg: 16 },
                                alignSelf: { lg: 'start' },
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    position: 'relative',
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: alpha(clockPaperTextColor, 0.18),
                                    bgcolor: clockPaperBg,
                                    color: clockPaperTextColor,
                                    p: { xs: 1.5, sm: 1.75 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.25,
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    width: '100%',
                                }}
                            >
                                <Stack spacing={0.75} sx={{ mb: 0.5, position: 'relative' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                        Today&apos;s Trading Clock
                                    </Typography>
                                    <Tooltip title="Open settings" placement="left">
                                        <IconButton
                                            size="medium"
                                            onClick={() => setSettingsOpen(true)}
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
                                        Market sessions and economic events in one place.
                                    </Typography>
                                    <Divider sx={{ borderColor: alpha(clockPaperTextColor, 0.2) }} />
                                </Stack>

                                <Stack spacing={1.25} alignItems="center" sx={{ p: { xs: 0.75, sm: 1 }, width: '100%', maxWidth: '100%' }}>
                                    {showHandClock ? (
                                        <Box
                                            sx={{
                                                width: '100%',
                                                maxWidth: { xs: 420, sm: 520, md: 560 },
                                                mx: 'auto',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                p: { xs: 0.75, sm: 1 },
                                                boxSizing: 'border-box',
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
                                                }}
                                            >
                                                {renderWorkspaceSkeleton ? (
                                                    <Box sx={{ width: workspaceClockSize, height: workspaceClockSize }} />
                                                ) : (
                                                    <Box className="hand-clock-wrapper" sx={{ position: 'relative', width: workspaceClockSize, height: workspaceClockSize, maxWidth: '100%' }}>
                                                        <ClockCanvas
                                                            size={workspaceClockSize}
                                                            time={currentTime}
                                                            sessions={sessions}
                                                            handColor={handColor}
                                                            clockStyle={clockStyle}
                                                            showSessionNamesInCanvas={showSessionNamesInCanvas}
                                                            showClockNumbers={showClockNumbers}
                                                            showClockHands={showClockHands}
                                                            activeSession={activeSession}
                                                            backgroundBasedOnSession={backgroundBasedOnSession}
                                                            renderHandsInCanvas={false}
                                                            handAnglesRef={handAnglesRef}
                                                        />
                                                        {showClockHands ? (
                                                            <ClockHandsOverlay
                                                                size={workspaceClockSize}
                                                                handAnglesRef={handAnglesRef}
                                                                handColor={handColor}
                                                                time={currentTime}
                                                            />
                                                        ) : null}
                                                        {showEventsOnCanvas && shouldRenderEventsOverlay ? (
                                                            <Suspense
                                                                fallback={(
                                                                    <Box
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            inset: 0,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        <CircularProgress size={18} thickness={5} />
                                                                    </Box>
                                                                )}
                                                            >
                                                                <ClockEventsOverlay
                                                                    size={workspaceClockSize}
                                                                    timezone={clockTimezone}
                                                                    eventFilters={overlayEventFilters}
                                                                    newsSource={overlayNewsSource}
                                                                    onEventClick={handleOpenEvent || undefined}
                                                                    onLoadingStateChange={showHandClock ? setWorkspaceOverlayLoading : undefined}
                                                                    suppressTooltipAutoscroll
                                                                />
                                                            </Suspense>
                                                        ) : null}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%' }}>
                                            Clock hidden in settings.
                                        </Typography>
                                    )}
                                    {shouldShowDigitalClock && !renderWorkspaceSkeleton ? (
                                        <DigitalClock
                                            time={currentTime}
                                            clockSize={Math.min(workspaceClockSize, 360)}
                                            textColor={handColor}
                                        />
                                    ) : null}
                                    {shouldShowDigitalClock && !renderWorkspaceSkeleton ? (
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => setTimezoneModalOpen(true)}
                                            sx={{
                                                textTransform: 'none',
                                                color: alpha(handColor, 0.7),
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                minWidth: 'auto',
                                                px: 1,
                                                py: 0.5,
                                                mt: -0.5,
                                                '&:hover': {
                                                    bgcolor: alpha(handColor, 0.08),
                                                    color: handColor,
                                                },
                                            }}
                                        >
                                            {selectedTimezone?.replace(/_/g, ' ') || 'Select Timezone'}
                                        </Button>
                                    ) : null}
                                    {shouldShowSessionLabel && !renderWorkspaceSkeleton ? (
                                        <SessionLabel
                                            activeSession={activeSession}
                                            showTimeToEnd={showTimeToEnd}
                                            timeToEnd={timeToEnd}
                                            showTimeToStart={showTimeToStart}
                                            nextSession={nextSession}
                                            timeToStart={timeToStart}
                                            clockSize={workspaceClockSize}
                                            contrastTextColor={handColor}
                                        />
                                    ) : null}
                                    {workspaceOverlayLoading ? (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Loading event markers…
                                        </Typography>
                                    ) : null}
                                </Stack>

                            </Paper>

                            {sponsoredAdPaper}

                        </Box>
                    )}

                    {!isTwoColumn && sponsoredAdPaper}

                    <Paper
                        elevation={0}
                        sx={{
                            flex: 1,
                            position: { xs: 'relative', lg: 'sticky' },
                            top: { lg: 16 },
                            alignSelf: 'flex-start',
                            mt: 2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha('#3c4d63', 0.12),
                            bgcolor: '#ffffff',
                            color: theme.palette.text.primary,
                            p: { xs: 1.25, sm: 1.5, md: 1.75 },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.25,
                            width: '100%',
                            minWidth: 0,
                            maxWidth: '100%',
                        }}
                    >
                        {showSeoCopy && (
                            <Stack spacing={0.75} sx={{ mb: 0.5, position: 'relative' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                                    {title}
                                </Typography>
                                {!user && onOpenAuth && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<LockOpenIcon />}
                                        onClick={onOpenAuth}
                                        sx={{
                                            position: 'absolute',
                                            top: { xs: -4, sm: -2 },
                                            right: 0,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                            px: { xs: 1.25, sm: 1.5 },
                                            py: { xs: 0.5, sm: 0.625 },
                                            borderRadius: 2,
                                            boxShadow: '0 2px 8px rgba(15, 111, 236, 0.2)',
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(15, 111, 236, 0.3)',
                                            },
                                        }}
                                    >
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                            Unlock all features
                                        </Box>
                                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                            Unlock
                                        </Box>
                                    </Button>
                                )}
                                <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.72) }}>
                                    Powered by{' '}
                                    <Link
                                        component="button"
                                        onClick={() => setNewsSourceModalOpen(true)}
                                        sx={{
                                            color: 'inherit',
                                            textDecorationLine: 'underline',
                                            textDecorationColor: alpha(theme.palette.text.primary, 0.4),
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            '&:hover': {
                                                textDecorationColor: 'inherit',
                                            },
                                        }}
                                    >
                                        Forex Factory
                                    </Link>
                                </Typography>
                                <Divider sx={{ borderColor: alpha('#3c4d63', 0.12) }} />
                            </Stack>
                        )}

                        <Box
                            ref={filtersBoxRef}
                            sx={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                bgcolor: 'background.paper',
                                p: { xs: 1, sm: 0 },
                                borderRadius: 0,
                                boxShadow: isFiltersStuck ? '0 2px 4px -1px rgba(0, 0, 0, 0.1)' : 'none',
                            }}
                        >
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 0, mt: 1 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                        Search & Filters
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                        {visibleCount.toLocaleString()} events
                                    </Typography>
                                    {nextCountdownLabel ? (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <AccessTimeIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                Next in {nextCountdownLabel}
                                            </Typography>
                                        </Stack>
                                    ) : nowEventIds.size ? (
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main' }}>
                                            Events in progress
                                        </Typography>
                                    ) : null}
                                </Stack>
                            </Stack>
                            <EventsFilters3
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                                onApply={applyFilters}
                                loading={loading}
                                timezone={timezone}
                                newsSource={newsSource}
                                actionOffset={0}
                                defaultPreset="thisWeek"
                            />
                        </Box>

                        {error ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        ) : null}

                        {favoritesLoading && (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Loading favorites…
                            </Alert>
                        )}

                        {notesError ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {notesError}
                            </Alert>
                        ) : null}

                        <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
                            {visibleDayKeys.length === 0 ? (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Select a date range to view events.
                                    </Typography>
                                </Paper>
                            ) : (
                                visibleDayKeys.map((dayKey) => (
                                    <DaySection
                                        key={dayKey}
                                        dayKey={dayKey}
                                        timezone={timezone}
                                        events={eventsByDay.get(dayKey) || []}
                                        nowEventIds={nowEventIds}
                                        nextEventIds={nextEventIds}
                                        nextCountdownLabel={nextCountdownLabel}
                                        nowEpochMs={nowEpochMs}
                                        onToggleFavorite={handleToggleFavorite}
                                        isFavorite={isFavorite}
                                        isFavoritePending={isFavoritePending}
                                        onOpenEvent={handleOpenEvent}
                                        onOpenNotes={handleOpenNotes}
                                        hasEventNotes={hasNotes}
                                        isEventNotesLoading={isEventNotesLoading}
                                        isLoading={showSkeletons}
                                        isToday={dayKey === todayKey}
                                    />
                                ))
                            )}
                        </Stack>

                        <Divider sx={{ borderColor: alpha('#3c4d63', 0.12), mt: 1, mb: 0.5 }} />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                }}
                            >
                                © {new Date().getFullYear()} Time 2 Trade. All rights reserved.
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : 'Awaiting first sync'}
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Box>

            <EventModal
                open={Boolean(selectedEvent)}
                onClose={handleCloseEvent}
                event={selectedEvent}
                timezone={timezone}
                isFavoriteEvent={isFavorite}
                onToggleFavorite={handleToggleFavorite}
                isFavoritePending={isFavoritePending}
                favoritesLoading={favoritesLoading}
                hasEventNotes={hasNotes}
                onOpenNotes={handleOpenNotes}
                isEventNotesLoading={isEventNotesLoading}
            />

            <SettingsSidebar2
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onOpenAuth={onOpenAuth}
            />

            <EventNotesDialog
                open={Boolean(noteTarget)}
                onClose={handleCloseNotes}
                event={noteTarget?.event || null}
                timezone={timezone}
                notes={noteTarget ? getNotesForEvent(noteTarget.event) : []}
                loading={noteTarget ? isEventNotesLoading(noteTarget.event) : false}
                onAddNote={handleAddNote}
                onRemoveNote={handleRemoveNote}
                error={notesError}
            />

            <Dialog
                open={timezoneModalOpen}
                onClose={() => setTimezoneModalOpen(false)}
                maxWidth="xs"
                fullWidth
                fullScreen={false}
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
                        sx={{ ml: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, pb: 3 }}>
                    <TimezoneSelector
                        textColor={theme.palette.text.primary}
                        onRequestSignUp={onOpenAuth}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={newsSourceModalOpen}
                onClose={() => setNewsSourceModalOpen(false)}
                maxWidth="sm"
                fullWidth
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
                        Data Source Information
                    </Typography>
                    <IconButton
                        edge="end"
                        onClick={() => setNewsSourceModalOpen(false)}
                        aria-label="close"
                        sx={{ ml: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, pb: 3 }}>
                    <NewsSourceSelector />
                </DialogContent>
            </Dialog>
        </Box>
    );
}

CalendarEmbed.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    onOpenAuth: PropTypes.func,
    showSeoCopy: PropTypes.bool,
};
