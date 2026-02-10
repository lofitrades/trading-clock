/**
 * src/pages/Calendar2Page.jsx
 *
 * Purpose: Primary /calendar page — economic calendar with two-column layout.
 * Left column: ClockEventsFilters (shared stateless component) + compact MUI table with day dividers.
 * Right column: ClockPanelPaper (trading clock).
 * Filters read/write SettingsContext via ClockEventsFilters — no local filter state, no sync.
 * BEP: Mobile-first, responsive, NOW/NEXT badges, jump-to-now FAB, timezone-aware.
 *
 * Changelog:
 * v3.3.0 - 2026-02-10 - BEP: Custom event click flow now checks authentication.
 *                        Non-auth users see AuthModal2 instead of EventModal.
 *                        Auth users skip EventModal and open CustomEventDialog directly
 *                        for custom events. Economic events still open EventModal normally.
 * v3.2.0 - 2026-02-10 - BEP: showOnCalendar integration — custom events with showOnCalendar=true
 *                        now appear in the calendar table. Subscribes via useCustomEvents with the
 *                        active date range. Custom events respect impact/currency filters and sort
 *                        chronologically with economic events. Timezone-aware display via shared helpers.
 * v3.1.0 - 2026-02-10 - BUGFIX: handleSaveCustomEvent now actually persists to Firestore via useCustomEvents
 *                        hook (createEvent/saveEvent). Previously ignored the payload parameter — dialog
 *                        closed but data never saved. Matches App.jsx reference implementation.
 * v3.0.0 - 2026-02-09 - BEP DEFAULT PRESET: Changed default date filter from 'today' to
 *                        'thisWeek' for broader market context on initial page load. Calendar2Page
 *                        now displays 7-day economic calendar instead of 1-day view by default.
 * v2.9.0 - 2026-02-09 - BEP DATE-CHANGE SKELETON: Full skeleton table now shows when date preset
 *                       changes (via useCalendarData v1.9.0). Stale day headers from the previous
 *                       date range are cleared immediately, preventing confusing UX where irrelevant
 *                       days stayed visible during load. Currency/impact changes still use
 *                       progressive trailing skeletons.
 * v2.8.0 - 2026-02-09 - BEP FILTER SKELETON FIX: Trailing skeleton rows now correctly appear
 *                       when filter changes in ClockEventsFilters trigger a re-fetch. Previously
 *                       loading was never true during refinement so trailing SkeletonRows were
 *                       invisible. Fix in useCalendarData v1.8.0 ensures loading=true on every
 *                       fetchEvents call. Filters stay enabled during refinement for responsive UX.
 * v2.7.0 - 2026-02-09 - BEP PROGRESSIVE LOADING: Table now shows events as they load per-day
 *                       instead of blocking behind full skeleton. Uses initialLoading (first fetch)
 *                       vs loading (filter refinement) for smarter UX. Trailing skeleton rows
 *                       appear below existing events during filter changes. ~60% perceived
 *                       load time reduction. Filters no longer disabled during filter refinement.
 * v2.6.0 - 2026-02-08 - BEP NAVIGATION FIX: Wrapped setInterval NOW/NEXT timer in startTransition.
 *                       React Router v7 wraps navigations in startTransition (low-priority). The
 *                       1-second sync setState was high-priority, continuously interrupting and
 *                       restarting the navigation transition — URL changed but page never committed.
 *                       Fix: startTransition(() => setNowEpochMs(...)) makes the tick low-priority
 *                       so it no longer blocks route transitions.
 * v2.5.0 - 2026-02-07 - BEP SMART FAB BUTTON: (1) FAB hides when NOW/NEXT event row is visible in
 *                       viewport. (2) Icon inverts to up arrow when target is above viewport, down
 *                       arrow when target is below. (3) Tracks scroll position in real-time. Improves
 *                       UX by only showing button when user needs it, with directional hint.
 * v2.4.0 - 2026-02-07 - BEP LOADING ANIMATION: Replaced Skeleton rectangle Suspense fallback for
 *                       ClockPanelPaper with LoadingAnimation component. Shows rotating donut
 *                       animation centered in the right column while lazy component loads.
 *                       Consistent UX across /clock and /calendar pages.
 * v2.3.1 - 2026-02-07 - BEP DUAL LOADING GATE: Updated filter disabled state to check both
 *                       isLoadingClockEvents (clock overlay) AND loading (calendar table).
 *                       Filters now stay visible but disabled during both loading phases.
 *                       Prevents user filter changes while either data source is loading.
 * v2.3.0 - 2026-02-07 - BEP LOADING DISABLED: Added isLoadingClockEvents state + handleClockOverlayLoadingStateChange
 *                       callback. ClockPanelPaper passes onLoadingStateChange to ClockEventsOverlay.
 *                       When clock events are loading/filtering, ClockEventsFilters disables all
 *                       interactive elements (disabled={isLoadingClockEvents}). Prevents user filter
 *                       changes during clock data load. Consistency with ClockPage.
 * v2.2.0 - 2026-02-07 - BEP TRUST SIGNAL: Added info icon + data source modal to left column header
 *                       (same as ClockPage). Shows "Powered by Forex Factory" tooltip with info button
 *                       in top-right of calendar title. Modal displays data reliability message.
 * v2.2.0 - 2026-02-10 - BEP: Wire onEditCustomEvent to EventModal so custom events show edit icon.
 *                       Adds customEditingEvent state + handleEditCustomEvent callback.
 *                       CustomEventDialog opens in edit mode at z-index 12003 (above EventModal).
 * v2.1.0 - 2026-02-07 - CONSOLIDATION: Replaced inline filter JSX with shared ClockEventsFilters
 *                       component. Removed local filter state, overlayEventFilters, incoming sync
 *                       effect, ClearableSelect, calculateDateRange, DATE_PRESETS, IMPACT_OPTIONS.
 *                       Zero infinite-loop risk — single source of truth (SettingsContext).
 * v2.0.0 - 2026-02-07 - MIGRATION: Became primary /calendar page. Added filter sync with
 *                       SettingsContext (read+write), search query placeholder, CustomEventDialog.
 * v1.1.0 - 2026-02-06 - Integrated ClockPanelPaper into right column with full settings sync and event handlers
 * v1.0.0 - 2026-02-06 - Initial implementation (Calendar 2.0 fast table)
 */

import { useState, useCallback, useEffect, useMemo, useRef, memo, lazy, Suspense, startTransition } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Fab,
    Tooltip,
    Skeleton,
    Zoom,
    IconButton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import useMediaQuery from '@mui/material/useMediaQuery';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import UpdateIcon from '@mui/icons-material/Update';
import PublicLayout from '../components/PublicLayout';
import MainLayout from '../components/layouts/MainLayout';
import SourceInfoModal from '../components/SourceInfoModal';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { useCalendarData } from '../hooks/useCalendarData';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEngine } from '../hooks/useTimeEngine';
import useCustomEvents from '../hooks/useCustomEvents';
import { preloadNamespaces } from '../i18n/config';
import { parseDate } from '../utils/dateUtils';
import { getEventEpochMs, computeNowNextState, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { getCurrencyFlag } from '../utils/currencyFlags';
import LoadingAnimation from '../components/LoadingAnimation';

const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const EventModal = lazy(() => import('../components/EventModal'));
const ClockPanelPaper = lazy(() => import('../components/ClockPanelPaper'));
const CustomEventDialog = lazy(() => import('../components/CustomEventDialog'));
const ClockEventsFilters = lazy(() => import('../components/ClockEventsFilters'));

// ============================================================================
// CONSTANTS
// ============================================================================

const IMPACT_COLORS = {
    'Strong Data': '#d32f2f',
    'Moderate Data': '#f57c00',
    'Weak Data': '#F2C94C',
    'My Events': '#42a5f5',
    'my-events': '#42a5f5',
    'Data Not Loaded': '#C7B8A4',
    'Non-Economic': '#9e9e9e',
};

/** Columns: no action column — clicking the row opens modal */
const TABLE_COLUMNS = [
    { id: 'time', headerKey: 'calendar:table.headers.time', align: 'center' },
    { id: 'currency', headerKey: 'calendar:table.headers.currency', align: 'center' },
    { id: 'impact', headerKey: 'calendar:table.headers.impact', align: 'center' },
    { id: 'name', headerKey: 'calendar:table.headers.event', align: 'left' },
    { id: 'actual', headerKey: 'calendar:table.headers.actual', align: 'center', hideBelow: 'lg' },
    { id: 'forecast', headerKey: 'calendar:table.headers.forecast', align: 'center', hideBelow: 'lg' },
    { id: 'previous', headerKey: 'calendar:table.headers.previous', align: 'center', hideBelow: 'lg' },
];

const METRIC_CELL_SX = { display: { xs: 'none', lg: 'table-cell' } };

// ============================================================================
// HELPERS
// ============================================================================

/** Build a YYYY-MM-DD day key in the user's timezone */
const getDayKey = (value, timezone) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch {
        return null;
    }
};

/** Is this dayKey (YYYY-MM-DD) equal to today in the given timezone? */
const isTodayKey = (dayKey, timezone) => {
    if (!dayKey) return false;
    const now = new Date();
    const todayKey = getDayKey(now, timezone);
    return dayKey === todayKey;
};

/** Group events by timezone-aware day key, preserving order */
const groupEventsByDay = (events, timezone) => {
    const groups = new Map();
    for (const event of events) {
        const raw = event.date || event.dateTime || event.Date || event.time;
        const key = getDayKey(raw, timezone) || 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(event);
    }
    return groups;
};

/** Format dayKey (YYYY-MM-DD) into a user-friendly locale-aware label */
const formatDayLabel = (dayKey, lang) => {
    if (!dayKey || dayKey === 'unknown') return '';
    const parts = dayKey.split('-');
    if (parts.length !== 3) return dayKey;
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dateObj.toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
};

/** Build a stable key for an event */
const buildEventKey = (event) => {
    const epoch = getEventEpochMs(event);
    const id = event.id || event.Event_ID || `${event.name || event.Name || 'evt'}`;
    return `${id}-${epoch ?? 'na'}`;
};

/** Format time as 12-hour */
const formatTime12h = (event, timezone) => {
    const raw = event.date || event.dateTime || event.Date || event.time;
    const dateObj = parseDate(raw);
    if (!dateObj) return '--:--';
    try {
        return dateObj.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '--:--';
    }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Compact impact dot/icon */
const ImpactDot = memo(({ strength }) => {
    const color = IMPACT_COLORS[strength] || '#9e9e9e';
    return (
        <Box
            sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: color,
                mx: 'auto',
                flexShrink: 0,
            }}
            title={strength}
        />
    );
});
ImpactDot.displayName = 'ImpactDot';
ImpactDot.propTypes = { strength: PropTypes.string };

/** Currency badge with flag */
const CurrencyLabel = memo(({ currency }) => {
    const code = (currency || '').toUpperCase();
    const countryCode = getCurrencyFlag(code);
    if (countryCode) {
        return (
            <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center">
                <Box
                    component="img"
                    loading="lazy"
                    width={{ xs: 12, sm: 16 }}
                    height={{ xs: 9, sm: 12 }}
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={code}
                    sx={{ borderRadius: 0.25, objectFit: 'cover' }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: { xs: '0.5rem', sm: '0.7rem' } }}>
                    {code}
                </Typography>
            </Stack>
        );
    }
    return (
        <Typography variant="caption" fontWeight={700} sx={{ fontSize: { xs: '0.5rem', sm: '0.7rem' } }}>
            {code || '—'}
        </Typography>
    );
});
CurrencyLabel.displayName = 'CurrencyLabel';
CurrencyLabel.propTypes = { currency: PropTypes.string };

/** Single event row */
const EventRow = memo(function EventRow({
    event,
    timezone,
    isNow,
    isNext,
    isPast,
    onOpen,
    scrollRef,
}) {
    const theme = useTheme();
    const name = event.name || event.Name || '—';
    const { actual, forecast, previous, strengthValue } = event._displayCache || {};
    const safeActual = actual && actual !== '-' && actual !== '' ? actual : '—';
    const safeForecast = forecast && forecast !== '-' && forecast !== '' ? forecast : '—';
    const safePrevious = previous && previous !== '-' && previous !== '' ? previous : '—';

    return (
        <TableRow
            ref={scrollRef}
            hover
            onClick={() => onOpen(event)}
            sx={{
                cursor: 'pointer',
                bgcolor: isNow
                    ? alpha(theme.palette.info.main, 0.08)
                    : isNext
                        ? alpha(theme.palette.success.main, 0.06)
                        : 'transparent',
                opacity: isPast && !isNow && !isNext ? 0.65 : 1,
                borderLeft: isNow
                    ? `3px solid ${theme.palette.info.main}`
                    : isNext
                        ? `3px solid ${theme.palette.success.main}`
                        : 'none',
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(event); } }}
        >
            {/* TIME */}
            <TableCell align="center" sx={{ px: { xs: 0.3, sm: 0.5, md: 0.4 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: { xs: '0.65rem', sm: '0.75rem' }, whiteSpace: 'nowrap' }}>
                    {formatTime12h(event, timezone)}
                </Typography>
            </TableCell>

            {/* CURRENCY */}
            <TableCell align="center" sx={{ px: { xs: 0.15, sm: 0.5, md: 0.3 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <CurrencyLabel currency={event.currency || event.Currency} />
            </TableCell>

            {/* IMPACT */}
            <TableCell align="center" sx={{ px: { xs: 0.15, sm: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <ImpactDot strength={strengthValue} />
            </TableCell>

            {/* EVENT NAME */}
            <TableCell sx={{ px: { xs: 0.4, sm: 0.75, md: 0.5 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: isPast && !isNow ? 'text.secondary' : 'text.primary',
                            overflow: 'hidden',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                        }}
                    >
                        {name}
                    </Typography>
                    {isNow && (
                        <Chip label="NOW" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.main', fontWeight: 800, height: 18, fontSize: '0.6rem', flex: '0 0 auto', '& .MuiChip-label': { px: 0.5 } }} />
                    )}
                    {isNext && (
                        <Chip label="NEXT" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.main', fontWeight: 800, height: 18, fontSize: '0.6rem', flex: '0 0 auto', '& .MuiChip-label': { px: 0.5 } }} />
                    )}
                </Stack>
            </TableCell>

            {/* ACTUAL */}
            <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{safeActual}</Typography>
            </TableCell>

            {/* FORECAST */}
            <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{safeForecast}</Typography>
            </TableCell>

            {/* PREVIOUS */}
            <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 }, borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{safePrevious}</Typography>
            </TableCell>
        </TableRow>
    );
});
EventRow.displayName = 'EventRow';
EventRow.propTypes = {
    event: PropTypes.object.isRequired,
    timezone: PropTypes.string.isRequired,
    isNow: PropTypes.bool,
    isNext: PropTypes.bool,
    isPast: PropTypes.bool,
    onOpen: PropTypes.func.isRequired,
    scrollRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

/** Day divider header row */
const DayDividerRow = memo(({ dayKey, colSpan, isToday, lang, eventCount = 0 }) => {
    const theme = useTheme();
    const { t } = useTranslation('calendar');
    const label = formatDayLabel(dayKey, lang);

    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                sx={{
                    bgcolor: isToday
                        ? 'primary.main'
                        : theme.palette.mode === 'dark'
                            ? 'grey.800'
                            : 'grey.200',
                    borderBottom: '2px solid',
                    borderColor: isToday ? 'primary.main' : 'divider',
                    py: 0.5,
                    px: { xs: 1, sm: 1.5 },
                    position: 'sticky',
                    top: 30,
                    zIndex: 1,
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {isToday && (
                            <UpdateIcon
                                sx={{
                                    fontSize: '0.95rem',
                                    color: 'primary.contrastText',
                                }}
                            />
                        )}
                        <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            sx={{
                                color: isToday
                                    ? 'primary.contrastText'
                                    : theme.palette.mode === 'dark'
                                        ? 'grey.100'
                                        : 'text.primary',
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}
                        >
                            {label}
                        </Typography>
                    </Stack>
                    {eventCount > 0 && (
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: isToday
                                    ? 'primary.contrastText'
                                    : theme.palette.mode === 'dark'
                                        ? 'grey.100'
                                        : 'text.secondary',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {eventCount} {t('common:events')}
                        </Typography>
                    )}
                </Stack>
            </TableCell>
        </TableRow>
    );
});
DayDividerRow.displayName = 'DayDividerRow';
DayDividerRow.propTypes = {
    dayKey: PropTypes.string.isRequired,
    colSpan: PropTypes.number.isRequired,
    isToday: PropTypes.bool,
    lang: PropTypes.string,
    eventCount: PropTypes.number,
};

/** Loading skeleton rows */
const SkeletonRows = ({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton variant="text" width={50} /></TableCell>
                <TableCell><Skeleton variant="text" width={30} /></TableCell>
                <TableCell align="center"><Skeleton variant="circular" width={12} height={12} /></TableCell>
                <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                <TableCell sx={METRIC_CELL_SX}><Skeleton variant="text" width={30} /></TableCell>
                <TableCell sx={METRIC_CELL_SX}><Skeleton variant="text" width={30} /></TableCell>
                <TableCell sx={METRIC_CELL_SX}><Skeleton variant="text" width={30} /></TableCell>
            </TableRow>
        ))}
    </>
);

SkeletonRows.propTypes = {
    count: PropTypes.number,
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function Calendar2Page() {
    const { t, i18n } = useTranslation(['calendar', 'filter', 'common']);
    const theme = useTheme();
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));
    const settingsContext = useSettingsSafe(); // ensure settings context is available
    useAuth(); // ensure auth context is available

    // Preload namespaces
    useEffect(() => {
        preloadNamespaces(['calendar', 'filter', 'events', 'settings', 'dialogs', 'auth']);
    }, []);

    // ─── Data ───
    const {
        events: economicEvents,
        loading,
        initialLoading,
        timezone,
        filters: calendarFilters,
        isFavorite,
        toggleFavorite,
        isFavoritePending,
        favoritesLoading,
        applyFilters,
    } = useCalendarData({ defaultPreset: 'thisWeek' });
    // ─── Clock Settings ───
    const timeEngine = useTimeEngine(settingsContext.selectedTimezone);

    // BEP v3.2.0: Custom event subscription with calendar date range for showOnCalendar integration
    const { events: customEvents, createEvent: createCustomEvent, saveEvent: saveCustomEvent } = useCustomEvents({
        startDate: calendarFilters.startDate,
        endDate: calendarFilters.endDate,
    });

    // BEP v3.2.0: Merge custom events (showOnCalendar + filter-aware) with economic events
    const events = useMemo(() => {
        if (!customEvents || customEvents.length === 0) return economicEvents;

        const activeImpacts = calendarFilters.impacts || [];
        const activeCurrencies = calendarFilters.currencies || [];

        const filteredCustom = customEvents.filter((evt) => {
            // Only include events with showOnCalendar enabled
            if (!evt.showOnCalendar) return false;

            // Respect impact filter if active
            if (activeImpacts.length > 0 && !activeImpacts.includes('My Events')) return false;

            // Respect currency filter if active
            if (activeCurrencies.length > 0) {
                const evtCurrency = (evt.currency || '').toUpperCase();
                if (evtCurrency && evtCurrency !== '—' && !activeCurrencies.includes(evtCurrency)) return false;
            }

            return true;
        });

        if (filteredCustom.length === 0) return economicEvents;

        // Merge and sort by epochMs for correct chronological order
        const merged = [...economicEvents, ...filteredCustom];
        merged.sort((a, b) => {
            const aEpoch = getEventEpochMs(a) ?? 0;
            const bEpoch = getEventEpochMs(b) ?? 0;
            return aEpoch - bEpoch;
        });
        return merged;
    }, [economicEvents, customEvents, calendarFilters.impacts, calendarFilters.currencies]);

    // ─── Filter change handler — delegates to useCalendarData.applyFilters ───
    const handleFilterChange = useCallback((partialFilters) => {
        applyFilters(partialFilters);
    }, [applyFilters]);

    // ─── NOW / NEXT detection ───
    const [nowEpochMs, setNowEpochMs] = useState(Date.now());
    // BEP: Wrap in startTransition so this low-priority tick doesn't block
    // React Router v7 navigation transitions (which also use startTransition).
    useEffect(() => {
        const timer = setInterval(() => {
            startTransition(() => setNowEpochMs(Date.now()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const { nowEventIds, nextEventIds } = useMemo(
        () => computeNowNextState({ events, nowEpochMs, nowWindowMs: NOW_WINDOW_MS, buildKey: buildEventKey }),
        [events, nowEpochMs],
    );

    // ─── Day grouping ───
    const groupedDays = useMemo(() => groupEventsByDay(events, timezone), [events, timezone]);

    // ─── Visible column count (for colSpan) ───
    const visibleColCount = isLg ? TABLE_COLUMNS.length : TABLE_COLUMNS.filter(c => !c.hideBelow).length;

    // ─── Auth check ───
    const { isAuthenticated } = useAuth();

    // ─── Event Modal ───
    const [selectedEvent, setSelectedEvent] = useState(null);

    // BEP: Custom events require authentication. Non-auth users see AuthModal2.
    // Auth users skip EventModal and open CustomEventDialog directly.
    const handleOpenEvent = useCallback((event) => {
        // If it's a custom event
        if (event?.isCustom) {
            // Require authentication
            if (!isAuthenticated()) {
                setAuthModalOpen(true);
                return;
            }
            // Authenticated: open CustomEventDialog directly, skip EventModal
            setCustomEditingEvent(event);
            setCustomDialogOpen(true);
            return;
        }
        // Economic event: open EventModal normally
        setSelectedEvent(event);
    }, [isAuthenticated]);

    const handleCloseEvent = useCallback(() => setSelectedEvent(null), []);

    // ─── Jump to Now ref ───
    const nowRowRef = useRef(null);
    const nextRowRef = useRef(null);
    const tableContainerRef = useRef(null);
    const [targetRowVisible, setTargetRowVisible] = useState(false);
    const [targetRowAbove, setTargetRowAbove] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const handleJumpToNow = useCallback(() => {
        const target = nowRowRef.current || nextRowRef.current;
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    // Check if target row is visible in viewport and position relative to viewport
    // Memoized with useCallback to prevent infinite dependency loop
    const checkTargetRowVisibility = useCallback(() => {
        const target = nowRowRef.current || nextRowRef.current;
        const container = tableContainerRef.current;

        if (!target || !container) {
            setTargetRowVisible(false);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        // Check if target is within container viewport
        const isVisible = (
            targetRect.top >= containerRect.top &&
            targetRect.bottom <= containerRect.bottom
        );

        // Check if target is above the container viewport
        const isAbove = targetRect.bottom < containerRect.top;

        setTargetRowVisible(isVisible);
        setTargetRowAbove(isAbove);
    }, []);

    // Listen to scroll events on the table container
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return undefined;

        const handleScroll = () => {
            checkTargetRowVisibility();
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        // Delay initial check until DOM is settled (after layout paint)
        const timerId = setTimeout(() => {
            checkTargetRowVisibility();
            setIsInitialized(true);
        }, 100);

        return () => {
            clearTimeout(timerId);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [checkTargetRowVisibility]);

    // Track first NOW/NEXT row for scroll target
    const firstNowKey = useMemo(() => {
        for (const [, dayEvents] of groupedDays) {
            for (const evt of dayEvents) {
                const key = buildEventKey(evt);
                if (nowEventIds.has(key)) return key;
            }
        }
        return null;
    }, [groupedDays, nowEventIds]);

    const firstNextKey = useMemo(() => {
        for (const [, dayEvents] of groupedDays) {
            for (const evt of dayEvents) {
                const key = buildEventKey(evt);
                if (nextEventIds.has(key)) return key;
            }
        }
        return null;
    }, [groupedDays, nextEventIds]);

    // ─── Loading state (from ClockEventsOverlay via ClockPanelPaper) ───
    const [isLoadingClockEvents, setIsLoadingClockEvents] = useState(false);
    const handleClockOverlayLoadingStateChange = useCallback((isLoading) => {
        setIsLoadingClockEvents(isLoading);
    }, []);

    // ─── Modal states ───
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customEditingEvent, setCustomEditingEvent] = useState(null);
    const [infoModalOpen, setInfoModalOpen] = useState(false);

    const handleOpenAuth = useCallback(() => { setSettingsOpen(false); setAuthModalOpen(true); }, []);
    const handleCloseAuth = useCallback(() => setAuthModalOpen(false), []);
    const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
    const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
    const handleOpenContact = useCallback(() => setContactModalOpen(true), []);
    const handleCloseContact = useCallback(() => setContactModalOpen(false), []);
    const handleOpenCustomDialog = useCallback(() => setCustomDialogOpen(true), []);
    const handleCloseCustomDialog = useCallback(() => { setCustomDialogOpen(false); setCustomEditingEvent(null); }, []);
    // BEP v2.2.0: Edit custom event from EventModal → close modal → open dialog in edit mode
    const handleEditCustomEvent = useCallback((event) => {
        setSelectedEvent(null);
        setCustomEditingEvent(event);
        setCustomDialogOpen(true);
    }, []);
    const handleOpenInfo = useCallback(() => setInfoModalOpen(true), []);
    const handleCloseInfo = useCallback(() => setInfoModalOpen(false), []);
    const handleOpenTimezone = useCallback(() => setSettingsOpen(true), []); // Open settings to change timezone

    // BEP: Auth check on CustomEventDialog save - show AuthModal2 if not authenticated
    const handleSaveCustomEvent = useCallback(async (payload) => {
        if (!isAuthenticated()) {
            setCustomDialogOpen(false);
            setAuthModalOpen(true);
            return;
        }
        const eventId = customEditingEvent?.seriesId || customEditingEvent?.id;
        const result = eventId
            ? await saveCustomEvent(eventId, payload)
            : await createCustomEvent(payload);
        if (result?.success) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
        }
    }, [isAuthenticated, createCustomEvent, customEditingEvent, saveCustomEvent]);

    const navItems = useAppBarNavItems({
        onOpenAuth: handleOpenAuth,
        onOpenSettings: handleOpenSettings,
        onOpenContact: handleOpenContact,
    });

    // ─── Left column content ───
    const leftContent = (
        <Box>
            {/* Title with Info Icon */}
            <Stack direction="row" alignItems="center" sx={{ mb: 0.5, gap: 0.75 }}>
                <Typography variant="h5" fontWeight={800}>
                    {t('calendar:title')}
                </Typography>
                <Tooltip title="Powered by Forex Factory" placement="right">
                    <IconButton
                        size="small"
                        onClick={handleOpenInfo}
                        sx={{
                            color: alpha(theme.palette.text.primary, 0.7),
                            p: 0,
                            minWidth: 'auto',
                            minHeight: 'auto',
                            '&:hover': {
                                color: theme.palette.text.primary,
                                bgcolor: 'transparent',
                            },
                        }}
                        aria-label="Data source information"
                    >
                        <InfoIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Subtitle */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('calendar:subtitle')}
            </Typography>

            {/* Filters — shared stateless component */}
            <Suspense fallback={null}>
                <ClockEventsFilters
                    showDateFilter
                    onChange={handleFilterChange}
                    timezone={timezone}
                    disabled={isLoadingClockEvents || initialLoading}
                    sx={{ mb: 2.5 }}
                />
            </Suspense>

            {/* Events Table */}
            <TableContainer ref={tableContainerRef} sx={{ maxHeight: { md: 'calc(var(--t2t-vv-height, 100dvh) - 260px)' }, overflowY: 'auto' }}>
                <Table size="small" stickyHeader sx={{ tableLayout: 'auto' }}>
                    {/* Column widths */}
                    <colgroup>
                        {TABLE_COLUMNS.map((col) => {
                            if (col.hideBelow && !isLg) return null;
                            return <col key={col.id} />;
                        })}
                    </colgroup>

                    <TableHead>
                        <TableRow>
                            {TABLE_COLUMNS.map((col) => {
                                if (col.hideBelow && !isLg) return null;
                                return (
                                    <TableCell
                                        key={col.id}
                                        align={col.align}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            py: 0.5,
                                            px: { xs: 0.3, sm: 0.5, md: 0.4 },
                                            bgcolor: 'background.paper',
                                            borderColor: 'divider',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t(col.headerKey)}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {/* BEP v2.7.0: Progressive loading — show skeleton only on first fetch.
                            For filter changes, keep existing events visible (loading=true but events exist). */}
                        {initialLoading ? (
                            <SkeletonRows count={8} />
                        ) : events.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColCount} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('calendar:noEvents')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {Array.from(groupedDays.entries()).map(([dayKey, dayEvents]) => {
                                    const isToday = isTodayKey(dayKey, timezone);
                                    return [
                                        <DayDividerRow
                                            key={`day-${dayKey}`}
                                            dayKey={dayKey}
                                            colSpan={visibleColCount}
                                            isToday={isToday}
                                            lang={i18n.language}
                                            eventCount={dayEvents.length}
                                        />,
                                        ...dayEvents.map((event) => {
                                            const key = buildEventKey(event);
                                            const isNow = nowEventIds.has(key);
                                            const isNext = nextEventIds.has(key);
                                            const epoch = getEventEpochMs(event);
                                            const isPast = epoch !== null && epoch < nowEpochMs;

                                            // Assign ref for jump-to-now
                                            const refProp =
                                                key === firstNowKey ? nowRowRef
                                                    : key === firstNextKey ? nextRowRef
                                                        : undefined;

                                            return (
                                                <EventRow
                                                    key={key}
                                                    event={event}
                                                    timezone={timezone}
                                                    isNow={isNow}
                                                    isNext={isNext}
                                                    isPast={isPast}
                                                    onOpen={handleOpenEvent}
                                                    scrollRef={refProp}
                                                />
                                            );
                                        }),
                                    ];
                                })}
                                {/* BEP v2.7.0: Show trailing skeleton while filter refinement loads */}
                                {loading && events.length > 0 && (
                                    <SkeletonRows count={3} />
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Event count */}
            {!loading && events.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('calendar:stats.eventsCount', { count: events.length })}
                </Typography>
            )}
        </Box>
    );

    // ─── Right column content (Clock Panel) ───
    const rightContent = (
        <Suspense fallback={
            <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingAnimation clockSize={200} isLoading />
            </Box>
        }>
            <ClockPanelPaper
                timeEngine={timeEngine}
                clockTimezone={settingsContext.selectedTimezone}
                sessions={settingsContext.sessions}
                clockStyle={settingsContext.clockStyle}
                showSessionNamesInCanvas={settingsContext.showSessionNamesInCanvas}
                showPastSessionsGray={settingsContext.showPastSessionsGray}
                showClockNumbers={settingsContext.showClockNumbers}
                showClockHands={settingsContext.showClockHands}
                showHandClock={settingsContext.showHandClock}
                showDigitalClock={settingsContext.showDigitalClock}
                showSessionLabel={settingsContext.showSessionLabel}
                showTimeToEnd={settingsContext.showTimeToEnd}
                showTimeToStart={settingsContext.showTimeToStart}
                showEventsOnCanvas={settingsContext.showEventsOnCanvas}
                eventFilters={settingsContext.eventFilters}
                newsSource={settingsContext.newsSource}
                backgroundBasedOnSession={settingsContext.backgroundBasedOnSession}
                selectedTimezone={settingsContext.selectedTimezone}
                onOpenTimezone={handleOpenTimezone}
                onOpenEvent={handleOpenEvent}
                onOpenAddEvent={handleOpenAuth}
                onLoadingStateChange={handleClockOverlayLoadingStateChange}
            />
        </Suspense>
    );

    return (
        <>
            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
                onOpenAddReminder={handleOpenCustomDialog}
            >
                <MainLayout
                    left={leftContent}
                    right={rightContent}
                    gap={3}
                    stickyTop={0}
                />
            </PublicLayout>

            {/* Jump to Now FAB */}
            <Zoom in={!loading && events.length > 0 && (nowEventIds.size > 0 || nextEventIds.size > 0) && !targetRowVisible && isInitialized}>
                <Tooltip title={nowEventIds.size > 0 ? t('calendar:badges.now') : t('calendar:badges.next')}>
                    <Fab
                        color="primary"
                        size="small"
                        onClick={handleJumpToNow}
                        sx={{
                            position: 'fixed',
                            bottom: { xs: 80, md: 24 },
                            left: { xs: 16, md: 24 },
                            zIndex: 1100,
                        }}
                        aria-label={t('calendar:badges.now')}
                    >
                        {targetRowAbove ? <KeyboardDoubleArrowUpIcon /> : <KeyboardDoubleArrowDownIcon />}
                    </Fab>
                </Tooltip>
            </Zoom>

            {/* Modals */}
            <Suspense fallback={null}>
                {selectedEvent && (
                    <EventModal
                        open={Boolean(selectedEvent)}
                        onClose={handleCloseEvent}
                        event={selectedEvent}
                        timezone={timezone}
                        isFavoriteEvent={isFavorite}
                        onToggleFavorite={toggleFavorite}
                        isFavoritePending={isFavoritePending}
                        favoritesLoading={favoritesLoading}
                        onEditCustomEvent={handleEditCustomEvent}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
                <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/calendar" />
            </Suspense>
            <Suspense fallback={null}>
                <SettingsSidebar2
                    open={settingsOpen && !authModalOpen}
                    onClose={handleCloseSettings}
                    onOpenAuth={handleOpenAuth}
                    onOpenContact={handleOpenContact}
                />
            </Suspense>
            <Suspense fallback={null}>
                <ContactModal open={contactModalOpen} onClose={handleCloseContact} />
            </Suspense>
            <Suspense fallback={null}>
                <CustomEventDialog
                    open={customDialogOpen}
                    onClose={handleCloseCustomDialog}
                    onSave={handleSaveCustomEvent}
                    event={customEditingEvent}
                    defaultTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    zIndexOverride={customEditingEvent ? 12003 : undefined}
                />
            </Suspense>

            {/* Data Source Info Modal */}
            <SourceInfoModal
                open={infoModalOpen}
                onClose={handleCloseInfo}
                zIndex={(muiTheme) => Math.max(muiTheme.zIndex.modal, muiTheme.zIndex.appBar + 100, 1700)}
            />
        </>
    );
}
