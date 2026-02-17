/**
 * src/pages/Calendar2Page.jsx
 *
 * Purpose: Primary /calendar page — economic calendar with two-column layout.
 * Left column: ClockEventsFilters (shared stateless component) + compact MUI table with day dividers.
 * Right column: TabbedStickyPanel with Clock tab + Insights tab (Phase 8).
 * Filters read/write SettingsContext via ClockEventsFilters — no local filter state, no sync.
 * BEP: Mobile-first, responsive, NOW/NEXT badges, jump-to-now FAB, timezone-aware.
 *
 * Changelog:
 * v3.17.0 - 2026-02-14 - BEP SYNCED FAB ANIMATION: Jump-to-now FAB on xs/sm now moves in sync
 *                        with the auto-hiding bottom AppBar. When the bar hides (scroll down), the
 *                        FAB slides from bottom:80px → bottom:24px. When the bar shows (scroll up),
 *                        it slides back up. Uses the same 0.3s cubic-bezier(0.4,0,0.2,1) transition
 *                        as the AppBar for perfectly matched motion. Powered by new
 *                        onBottomNavVisibilityChange callback threaded through PublicLayout → AppBar.
 *                        Desktop (md+) unaffected — FAB stays at bottom:24px.
 * v3.16.0 - 2026-02-14 - BEP I18N SKELETON HEADER: Added TextSkeleton guards to header section
 *                        (title, info tooltip, subtitle). Eliminates i18n key flash when page loads.
 *                        Title wrapped with width={180}, Subtitle with width={240}. Tooltip text
 *                        conditional: empty string until isReady, then "Powered by Forex Factory".
 * v3.15.0 - 2026-02-13 - BEP SCROLL FIX + FLASH HIGHLIGHT: (1) Fixed jump-to-now FAB scrolling
 *                        the entire page, causing title/filters to disappear above viewport.
 *                        Root cause: scrollIntoView({ block:'center' }) scrolls nearest ancestor,
 *                        which on md+ is the page — not the TableContainer. Fix: On desktop (md+),
 *                        calculate scrollTop offset to center the target row WITHIN the TableContainer.
 *                        On mobile (xs/sm), use scrollIntoView({ block:'nearest' }) for minimal scroll.
 *                        (2) Added MUI keyframes flash/pulse animation on NOW/NEXT row when FAB is
 *                        clicked. 3 pulses over 1.8s with theme-aware color (info for NOW, success for
 *                        NEXT). Uses CSS custom property --flash-color for keyframe compatibility.
 *                        highlightKey state increments to re-trigger animation via React key change.
 * v3.9.0 - 2026-02-12 - BEP MOBILE FIX: Fixed jump-to-now FAB not working on mobile devices.
 *                       Root cause: TableContainer has no maxHeight on xs/sm, so it expands to
 *                       full content height and never scrolls. (1) handleJumpToNow now uses
 *                       scrollIntoView (browser finds nearest scrollable ancestor automatically).
 *                       (2) checkTargetRowVisibility now uses visual viewport instead of container
 *                       bounds. (3) Scroll listener added to window for mobile page scroll.
 * v3.8.3 - 2026-02-11 - BEP LINTING: Removed unused ViewListIcon import. Moved clockTabContent
 *                        and insightsTabContent JSX definitions inside useMemo callback to fix
 *                        exhaustive-deps ESLint warnings. Props now properly included in dependency
 *                        array. Resolves 3 ESLint warnings.
 * v3.8.2 - 2026-02-11 - BEP PERFORMANCE: Lazy-loaded SourceInfoModal and InsightsPanel (both
 *                        conditionally rendered). SourceInfoModal defers until info button click.
 *                        InsightsPanel defers until Insights tab is selected, wrapped in Suspense
 *                        with LoadingAnimation fallback. Reduces initial JS parse/eval on /calendar.
 * v3.8.1 - 2026-02-11 - BUGFIX REVERT: Reverted height-first scaling approach (v3.8.0 mistake).
 *                        User-visible flag sizing was incorrect with height {{ xs: 9, sm: 12 }}.
 *                        Root cause: flagcdn.com w20/w40 endpoints need width-based sizing for
 *                        proper display. Fix: Restored width {{ xs: 14, sm: 18 }}, height='auto'.
 *                        This preserves original flag aspect ratios and displays correctly at all
 *                        breakpoints (xs, sm, md, lg). Flags now match event table display.
 * v3.8.0 - 2026-02-11 - BEP ASPECT RATIO PRESERVATION: Fixed flag aspect ratio distortion
 *                        for non-3:2 flags (e.g., square Switzerland). Root cause: Forced
 *                        dimensions (xs:14×9, sm:18×12) locked all flags to 3:2 ratio.
 *                        Fix: Set width only (xs:14, sm:18), height='auto' — allows flags to
 *                        scale proportionally and preserve original aspect ratio from flagcdn.
 *                        All flags (rectangular, square, any ratio) now display correctly.
 *                        Removed objectFit:'cover' which was squashing flags to fit container.
 * v3.7.0 - 2026-02-11 - BEP CURRENCY FLAG PROPORTIONS: Fixed CurrencyLabel component to use
 *                        proper 3:2 aspect ratio for country flags (xs: 14×9, sm: 18×12).
 *                        Previous 4:3 ratio (12×9, 16×12) distorted flag appearance. Added
 *                        minHeight to Stack for consistent vertical alignment, increased spacing
 *                        (0.25→0.4), improved font sizes (0.5rem→0.65rem xs, 0.7rem→0.75rem sm),
 *                        added flexShrink:0 to prevent flag compression. Now flags display
 *                        correctly in event table currency column and filter chips.
 * v3.6.0 - 2026-02-11 - BEP ICON THEME-AWARE: Replaced StorageIcon with official MUI InsightsIcon
 *                        for Insights tab. InsightsIcon is semantically correct and auto-adapts to
 *                        light/dark themes. More professional appearance, consistent with MUI design.
 * v3.5.0 - 2026-02-10 - BEP TRENDING INSIGHTS FIX: Insights tab now shows content for all users
 *                        (auth and non-auth) even when no currency filter is applied. Root cause:
 *                        InsightsPanel 24h timeframe was too narrow for trending mode, and service
 *                        lacked cascading fallback. Fixes: InsightsPanel timeframe 24h→7d,
 *                        insightsQueryService cascading fallback (constrained→unconstrained).
 * v3.4.0 - 2026-02-10 - Phase 8 INTEGRATION: (1) Replaced Tab 2 placeholder with InsightsPanel.
 *                        (2) Filter-aware context: uses calendar currency filters as context for Insights.
 *                        (3) Tab label "Insights" with InsightsIcon. (4) rightTabs now memoized for performance.
 *                        (5) Updated i18n keys: tabs.tab2 → tabs.insights (EN/ES/FR).
 * v3.3.0 - 2026-02-10 - BEP: Custom event click flow now checks authentication.
 *                        Non-auth users see AuthModal2 instead of EventModal.
 *                        Auth users skip EventModal and open CustomEventDialog directly
 *                        for custom events. Economic events still open EventModal normally.
 * v3.14.0 - 2026-02-12 - BEP REVERT: Restored LoadingAnimation as clock tab Suspense fallback.
 *                        Skeleton was too jarring. Real fix: ClockCanvas entry animation removed
 *                        (arcs render at full opacity instantly, no GSAP fade-in on tab switch).
 * v3.13.0 - 2026-02-12 - BUGFIX: Removed Suspense wrapper from insightsTabContent. TabbedStickyPanel
 *                        already handles Suspense with LoadingAnimation fallback. Nested Suspense was
 *                        causing loader conflicts. Now Insights tab loading is unified via parent layout.
 * v3.12.0 - 2026-02-12 - FEATURE: Added notes support to EventModal. Imported useEventNotes hook,
 *                        added EventNotesDialog lazy component, noteTarget state, and note handlers.
 *                        EventModal now receives hasEventNotes, onOpenNotes, isEventNotesLoading props.
 * v3.11.0 - 2026-02-12 - BUGFIX: CustomEventDialog now has onDelete={handleDeleteCustomEvent} prop.
 *                        Delete button was not connected — modal didn't call removeCustomEvent. Also
 *                        added removeEvent to useCustomEvents destructure. Delete now works BEP.
 * v3.10.0 - 2026-02-12 - BUGFIX: CustomEventDialog defaultTimezone now uses settingsContext.selectedTimezone
 *                        instead of Intl device timezone. Ensures custom event time is interpreted in the
 *                        user's selected timezone, not the browser's local timezone.
 * v3.10.0 - 2026-02-12 - BEP I18N SKELETON GUARD: Added isI18nReady state to prevent translation
 *                        key flash on page load. All client-facing text now shows Skeleton until i18n
 *                        translations are fully mounted. Used useTranslation('calendar').ready flag to
 *                        detect when all 3 namespaces are loaded. Created TextSkeleton helper component
 *                        for consistent conditional rendering (Skeleton if !ready, text if ready).
 *                        Wrapped: page title, subtitle, all table headers, day labels, no-events message,
 *                        event count, FAB tooltip. Eliminates i18n key flash entirely. v3.9.0 compat.
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
import { useTheme, alpha, keyframes } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import useMediaQuery from '@mui/material/useMediaQuery';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import UpdateIcon from '@mui/icons-material/Update';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InsightsIcon from '@mui/icons-material/Insights';
import PublicLayout from '../components/PublicLayout';
import MainLayout from '../components/layouts/MainLayout';
const SourceInfoModal = lazy(() => import('../components/SourceInfoModal'));
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { useCalendarData } from '../hooks/useCalendarData';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEngine } from '../hooks/useTimeEngine';
import useCustomEvents from '../hooks/useCustomEvents';
import { useEventNotes } from '../hooks/useEventNotes';
import { useTranslation } from 'react-i18next';
import { preloadNamespaces } from '../i18n/config';
import { parseDate } from '../utils/dateUtils';
import { getEventEpochMs, computeNowNextState, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { getCurrencyFlag } from '../utils/currencyFlags';
import LoadingAnimation from '../components/LoadingAnimation';
import useI18nReady from '../hooks/useI18nReady';
import TextSkeleton from '../components/TextSkeleton';
const InsightsPanel = lazy(() => import('../components/InsightsPanel'));

const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const EventModal = lazy(() => import('../components/EventModal'));
const EventNotesDialog = lazy(() => import('../components/EventNotesDialog'));
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

/** BEP v3.15.0: Flash highlight keyframes for jump-to-now FAB.
 *  3 pulses: transparent → highlight color → transparent. Uses theme-aware palette
 *  via sx prop. Applied to EventRow when isHighlighted=true. */
const flashHighlight = keyframes`
  0%   { background-color: transparent; }
  20%  { background-color: var(--flash-color); }
  40%  { background-color: transparent; }
  60%  { background-color: var(--flash-color); }
  80%  { background-color: transparent; }
  100% { background-color: var(--flash-color); }
`;

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

/** Currency badge with flag (BEP: 3:2 aspect ratio, proper alignment) */
const CurrencyLabel = memo(({ currency }) => {
    const code = (currency || '').toUpperCase();
    const countryCode = getCurrencyFlag(code);
    if (countryCode) {
        return (
            <Stack direction="row" spacing={0.4} alignItems="center" justifyContent="center" sx={{ minHeight: 16 }}>
                <Box
                    component="img"
                    loading="lazy"
                    width={{ xs: 14, sm: 18 }}
                    height="auto"
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={code}
                    sx={{ borderRadius: 0.4, flexShrink: 0 }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, whiteSpace: 'nowrap' }}>
                    {code}
                </Typography>
            </Stack>
        );
    }
    return (
        <Typography variant="caption" fontWeight={700} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
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
    isHighlighted,
    onOpen,
    scrollRef,
}) {
    const theme = useTheme();
    const name = event.name || event.Name || '—';
    const { actual, forecast, previous, strengthValue } = event._displayCache || {};
    const safeActual = actual && actual !== '-' && actual !== '' ? actual : '—';
    const safeForecast = forecast && forecast !== '-' && forecast !== '' ? forecast : '—';
    const safePrevious = previous && previous !== '-' && previous !== '' ? previous : '—';

    // BEP: Flash highlight color — info for NOW, success for NEXT
    const flashColor = isNow
        ? alpha(theme.palette.info.main, 0.18)
        : alpha(theme.palette.success.main, 0.16);

    return (
        <TableRow
            ref={scrollRef}
            hover
            onClick={() => onOpen(event)}
            sx={{
                cursor: 'pointer',
                // BEP v3.15.0: CSS custom property for keyframe animation color
                '--flash-color': flashColor,
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
                // BEP v3.15.0: Flash animation on jump-to-now
                ...(isHighlighted && {
                    animation: `${flashHighlight} 1.8s ease-in-out`,
                }),
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
    isHighlighted: PropTypes.bool,
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

/** Loading skeleton rows — align + padding matches EventRow cells exactly */
const SkeletonRows = ({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
                <TableCell align="center" sx={{ px: { xs: 0.3, sm: 0.5, md: 0.4 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width={50} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ px: { xs: 0.15, sm: 0.5, md: 0.3 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ px: { xs: 0.15, sm: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="circular" width={12} height={12} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell sx={{ px: { xs: 0.4, sm: 0.75, md: 0.5 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width="80%" /></TableCell>
                <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ ...METRIC_CELL_SX, px: { xs: 0.3, md: 0.25 }, py: { xs: 0.75, md: 0.5 } }}><Skeleton variant="text" width={30} sx={{ mx: 'auto' }} /></TableCell>
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
    const { t, i18n, isReady } = useI18nReady(['calendar', 'filter', 'common']);
    const theme = useTheme();
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));
    const isMd = useMediaQuery(theme.breakpoints.up('md'));
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
    const { events: customEvents, createEvent: createCustomEvent, saveEvent: saveCustomEvent, removeEvent: removeCustomEvent } = useCustomEvents({
        startDate: calendarFilters.startDate,
        endDate: calendarFilters.endDate,
    });

    // BEP v3.12.0: Event notes support
    const {
        hasNotes,
        ensureNotesStream,
        stopNotesStream,
        addNote,
        removeNote,
        isEventNotesLoading,
        getNotesForEvent,
    } = useEventNotes();
    const [noteTarget, setNoteTarget] = useState(null);

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

    // BEP v3.12.0: Notes handlers
    const handleOpenNotes = useCallback((event) => {
        const result = ensureNotesStream(event);
        if (result?.requiresAuth) {
            setAuthModalOpen(true);
            return;
        }
        setNoteTarget(event);
    }, [ensureNotesStream]);

    const handleCloseNotes = useCallback(() => {
        if (noteTarget) stopNotesStream(noteTarget);
        setNoteTarget(null);
    }, [noteTarget, stopNotesStream]);

    const handleAddNote = useCallback(async (content) => {
        if (!noteTarget) return { success: false, requiresAuth: false };
        const result = await addNote(noteTarget, content);
        if (result?.requiresAuth) setAuthModalOpen(true);
        return result;
    }, [addNote, noteTarget]);

    const handleRemoveNote = useCallback(async (noteId) => {
        if (!noteTarget) return { success: false, requiresAuth: false };
        const result = await removeNote(noteTarget, noteId);
        if (result?.requiresAuth) setAuthModalOpen(true);
        return result;
    }, [noteTarget, removeNote]);

    // ─── Jump to Now ref ───
    const nowRowRef = useRef(null);
    const nextRowRef = useRef(null);
    const tableContainerRef = useRef(null);
    const [targetRowVisible, setTargetRowVisible] = useState(false);
    const [targetRowAbove, setTargetRowAbove] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    // BEP v3.15.0: Flash highlight key — incremented on each FAB click to re-trigger animation
    const [highlightKey, setHighlightKey] = useState(0);

    const handleJumpToNow = useCallback(() => {
        const target = nowRowRef.current || nextRowRef.current;
        if (!target) return;

        const container = tableContainerRef.current;

        if (isMd && container) {
            // BEP v3.15.0: Desktop (md+) — scroll WITHIN the TableContainer only.
            // The container has maxHeight and overflowY:auto. We calculate the offset
            // to center the target row inside the container without moving the page.
            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const targetOffsetInContainer = targetRect.top - containerRect.top + container.scrollTop;
            const centeredScroll = targetOffsetInContainer - (containerRect.height / 2) + (targetRect.height / 2);
            container.scrollTo({ top: Math.max(0, centeredScroll), behavior: 'smooth' });
        } else {
            // BEP v3.15.0: Mobile (xs/sm) — the page scrolls. Use scrollIntoView
            // with block:'nearest' so the browser scrolls just enough to make the row
            // visible without pushing the title/filters off-screen.
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // BEP v3.15.0: Trigger flash highlight animation on target row
        setHighlightKey((k) => k + 1);
    }, [isMd]);

    // Check if target row is visible in viewport and position relative to viewport
    // BEP v3.9.0: Uses visual viewport for detection instead of container bounds.
    // On mobile (xs/sm), TableContainer has no maxHeight (fully expanded), so container-based
    // detection always reports rows as "visible". Using window viewport works on all breakpoints.
    const checkTargetRowVisibility = useCallback(() => {
        const target = nowRowRef.current || nextRowRef.current;

        if (!target) {
            setTargetRowVisible(false);
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

        // Check if target is within the visual viewport (works on both mobile and desktop)
        const isVisible = (
            targetRect.top >= 0 &&
            targetRect.bottom <= viewportHeight
        );

        // Check if target is above the viewport
        const isAbove = targetRect.bottom < 0;

        setTargetRowVisible(isVisible);
        setTargetRowAbove(isAbove);
    }, []);

    // Listen to scroll events on BOTH the table container (desktop) and window (mobile)
    // BEP v3.9.0: On mobile, TableContainer is fully expanded (no maxHeight), so the
    // page itself scrolls. We listen on window to detect visibility changes on all devices.
    useEffect(() => {
        const container = tableContainerRef.current;

        const handleScroll = () => {
            checkTargetRowVisibility();
        };

        // Desktop: container scrolls internally (has maxHeight on md+)
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }
        // Mobile: the page scrolls, not the container
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Delay initial check until DOM is settled (after layout paint)
        const timerId = setTimeout(() => {
            checkTargetRowVisibility();
            setIsInitialized(true);
        }, 100);

        return () => {
            clearTimeout(timerId);
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
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

    // BEP: Add custom event button handler — check auth and open appropriate dialog
    const handleOpenAddEvent = useCallback(() => {
        if (!isAuthenticated()) {
            setAuthModalOpen(true);
        } else {
            setCustomDialogOpen(true);
        }
    }, [isAuthenticated]);

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

    const handleDeleteCustomEvent = useCallback(async (eventToDelete) => {
        const eventId = eventToDelete?.seriesId || eventToDelete?.id;
        if (!eventId) return;
        const confirmed = window.confirm('Delete this reminder?');
        if (!confirmed) return;
        const result = await removeCustomEvent(eventId);
        if (result?.success) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
        }
    }, [removeCustomEvent]);

    // BEP v3.17.0: Track mobile bottom nav visibility for synced FAB animation
    const [bottomNavVisible, setBottomNavVisible] = useState(true);
    const handleBottomNavVisibilityChange = useCallback((visible) => {
        setBottomNavVisible(visible);
    }, []);

    const navItems = useAppBarNavItems({
        onOpenAuth: handleOpenAuth,
        onOpenSettings: handleOpenSettings,
        onOpenContact: handleOpenContact,
    });

    // ─── Left column content ───
    const leftContent = (
        <Box>
            {/* Title with Info Icon — BEP i18n skeleton guard */}
            <Stack direction="row" alignItems="center" sx={{ mb: 0.5, gap: 0.75 }}>
                <TextSkeleton ready={isReady} width={180}>
                    <Typography variant="h5" fontWeight={800}>
                        {t('calendar:title')}
                    </Typography>
                </TextSkeleton>
                <Tooltip title={isReady ? 'Powered by Forex Factory' : ''} placement="right">
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

            {/* Subtitle — BEP i18n skeleton guard */}
            <TextSkeleton ready={isReady} width={240}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('calendar:subtitle')}
                </Typography>
            </TextSkeleton>

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
                                        <TextSkeleton ready={isReady} width={col.id === 'name' ? 50 : 30}>
                                            {t(col.headerKey)}
                                        </TextSkeleton>
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
                                        <TextSkeleton ready={isReady} width={200}>
                                            {t('calendar:noEvents')}
                                        </TextSkeleton>
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

                                            // BEP v3.15.0: Flash highlight on FAB jump target rows only
                                            const isJumpTarget = key === firstNowKey || key === firstNextKey;

                                            return (
                                                <EventRow
                                                    key={isJumpTarget ? `${key}-hl-${highlightKey}` : key}
                                                    event={event}
                                                    timezone={timezone}
                                                    isNow={isNow}
                                                    isNext={isNext}
                                                    isPast={isPast}
                                                    isHighlighted={isJumpTarget && highlightKey > 0}
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

    // ─── Right column tabs config ───
    const rightTabs = useMemo(() => {
        // Clock tab content
        const clockTabContent = (
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
                    onOpenAddEvent={handleOpenAddEvent}
                    onLoadingStateChange={handleClockOverlayLoadingStateChange}
                />
            </Suspense>
        );

        // Insights tab content
        const insightsContext = {
            currencyTags: calendarFilters.currencies || [],
        };
        const insightsTabContent = (
            <InsightsPanel
                context={insightsContext}
                maxHeight={undefined}
            />
        );

        return [
            {
                key: 'clock',
                label: t('calendar:tabs.clock'),
                icon: <AccessTimeIcon sx={{ fontSize: 16 }} />,
                content: clockTabContent,
            },
            {
                key: 'insights',
                label: t('calendar:tabs.insights'),
                icon: <InsightsIcon sx={{ fontSize: 16 }} />,
                content: insightsTabContent,
            },
        ];
    }, [t, timeEngine, settingsContext, handleOpenTimezone, handleOpenEvent, handleOpenAddEvent, handleClockOverlayLoadingStateChange, calendarFilters.currencies]);

    return (
        <>
            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
                onOpenAddReminder={handleOpenCustomDialog}
                onBottomNavVisibilityChange={handleBottomNavVisibilityChange}
            >
                <MainLayout
                    left={leftContent}
                    rightTabs={rightTabs}
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
                            // BEP v3.17.0: FAB slides down when bottom nav hides, up when it shows.
                            // 80px = 64px AppBar + 16px gap. 24px = flush with viewport edge + gap.
                            // Matches AppBar transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1).
                            bottom: {
                                xs: bottomNavVisible ? 80 : 24,
                                md: 24,
                            },
                            left: { xs: 16, md: 24 },
                            zIndex: 1100,
                            transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                        hasEventNotes={hasNotes}
                        onOpenNotes={handleOpenNotes}
                        isEventNotesLoading={isEventNotesLoading}
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
                    onDelete={handleDeleteCustomEvent}
                    event={customEditingEvent}
                    defaultTimezone={settingsContext.selectedTimezone}
                    zIndexOverride={customEditingEvent ? 12003 : undefined}
                />
            </Suspense>

            {/* Data Source Info Modal */}
            <Suspense fallback={null}>
                <SourceInfoModal
                    open={infoModalOpen}
                    onClose={handleCloseInfo}
                    zIndex={(muiTheme) => Math.max(muiTheme.zIndex.modal, muiTheme.zIndex.appBar + 100, 1700)}
                />
            </Suspense>

            {/* BEP v3.12.0: Event Notes Dialog */}
            <Suspense fallback={null}>
                <EventNotesDialog
                    open={Boolean(noteTarget)}
                    onClose={handleCloseNotes}
                    event={noteTarget}
                    notes={noteTarget ? getNotesForEvent(noteTarget) : []}
                    onAddNote={handleAddNote}
                    onRemoveNote={handleRemoveNote}
                    isLoading={noteTarget && isEventNotesLoading(noteTarget)}
                />
            </Suspense>
        </>
    );
}
