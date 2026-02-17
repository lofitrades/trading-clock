/**
 * src/components/ClockEventsTable.jsx
 *
 * Purpose: Compact "Today's Events" table for the /clock page Events tab.
 * Renders an xs-optimized MUI table with NOW/NEXT badges, impact dots, currency
 * flags, and monospace time column. Fixed to "today" date preset — reads currency
 * and impact filters from SettingsContext via useCalendarData. No date filter UI.
 * Reuses the same data pipeline (useCalendarData → eventsStorageAdapter) as
 * Calendar2Page for consistency.
 *
 * BEP: Mobile-first compact layout, i18n, theme-aware, lazy-loadable, skeleton
 * loading states, NOW/NEXT detection, event click → parent handler.
 *
 * Changelog:
 * v1.4.0 - 2026-02-13 - BEP I18N SKELETON GUARD: Added ready flag from useI18nReady hook to prevent
 *                        raw translation key flash on first load. Table headers, event count label, and
 *                        no-events message now show Skeleton placeholders until translations are fetched.
 *                        Added missing 'clockPage' namespace to useTranslation call. Uses shared
 *                        useI18nReady + TextSkeleton pattern (codebase-wide BEP standard).
 * v1.3.0 - 2026-02-13 - BEP HOOK-LEVEL DATE ISOLATION: Replaced surface-level date-locking hacks
 *                        (mount force, handleFilterChange date stripping) with useCalendarData's
 *                        new `isolatedDatePreset` option. The hook now handles ALL date isolation
 *                        internally — ignores SettingsContext datePreset, never writes dates back,
 *                        always uses 'today' range. ClockEventsTable is now ONLY affected by
 *                        currency and impact filters. Removed hasForcedToday ref and date-strip
 *                        logic. handleFilterChange is a clean passthrough to applyFilters since
 *                        the hook already strips date fields internally.
 * v1.2.0 - 2026-02-13 - BEP TODAY-LOCK: Hardened date enforcement. handleFilterChange now
 *                        strips datePreset/startDate/endDate from incoming filter partials and
 *                        always re-injects datePreset:'today'. Prevents date drift when shared
 *                        SettingsContext.eventFilters.datePreset changes (e.g., user visits
 *                        /calendar with "thisWeek" then returns to /clock). Mount force
 *                        (hasForcedToday) still handles initialization. Every subsequent filter
 *                        interaction (currency/impact change) re-asserts today. Clock canvas
 *                        only shows today's events — table must match.
 * v1.1.0 - 2026-02-13 - BEP INLINE FILTERS: Added ClockEventsFilters to table header area
 *                        (no date filter — fixed to today). Currency and impact selectors
 *                        inline above the table, disabled during loading. Filters write to
 *                        SettingsContext via applyFilters — single source of truth shared
 *                        with Overview tab. Skeleton fallback while filter component loads.
 *                        Event count badge repositioned below filters for visual hierarchy.
 * v1.0.0 - 2026-02-13 - Initial implementation. Extracted table sub-components from
 *                        Calendar2Page (ImpactDot, CurrencyLabel, EventRow, SkeletonRows).
 *                        Uses useCalendarData({ defaultPreset: 'today' }) with overridden
 *                        fixed date range. NOW/NEXT detection via eventTimeEngine.
 *                        Currency/impact filter-aware via SettingsContext. Compact xs UI.
 */

import { useState, useEffect, useMemo, useRef, useCallback, memo, lazy, Suspense, startTransition } from 'react';
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
    Skeleton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import useI18nReady from '../hooks/useI18nReady';
import TextSkeleton from './TextSkeleton';
import { useCalendarData } from '../hooks/useCalendarData';
import { parseDate } from '../utils/dateUtils';
import { getEventEpochMs, computeNowNextState, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { getCurrencyFlag } from '../utils/currencyFlags';

// Lazy-loaded filter bar (code-split with own Suspense boundary)
const ClockEventsFilters = lazy(() => import('./ClockEventsFilters'));

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

/** Compact columns: time, currency, impact, event name (no actual/forecast/previous on clock) */
const COMPACT_COLUMNS = [
    { id: 'time', headerKey: 'calendar:table.headers.time', align: 'center' },
    { id: 'currency', headerKey: 'calendar:table.headers.currency', align: 'center' },
    { id: 'impact', headerKey: 'calendar:table.headers.impact', align: 'center' },
    { id: 'name', headerKey: 'calendar:table.headers.event', align: 'left' },
];

// ============================================================================
// HELPERS
// ============================================================================

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

/** Compact impact dot */
const ImpactDot = memo(({ strength }) => {
    const color = IMPACT_COLORS[strength] || '#9e9e9e';
    return (
        <Box
            sx={{
                width: 10,
                height: 10,
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

/** Currency badge with flag (compact) */
const CurrencyLabel = memo(({ currency }) => {
    const code = (currency || '').toUpperCase();
    const countryCode = getCurrencyFlag(code);
    if (countryCode) {
        return (
            <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center" sx={{ minHeight: 14 }}>
                <Box
                    component="img"
                    loading="lazy"
                    width={14}
                    height="auto"
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={code}
                    sx={{ borderRadius: 0.3, flexShrink: 0 }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {code}
                </Typography>
            </Stack>
        );
    }
    return (
        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6rem' }}>
            {code || '—'}
        </Typography>
    );
});
CurrencyLabel.displayName = 'CurrencyLabel';
CurrencyLabel.propTypes = { currency: PropTypes.string };

/** Single event row (compact — no actual/forecast/previous) */
const CompactEventRow = memo(function CompactEventRow({
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
    const { strengthValue } = event._displayCache || {};

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
                opacity: isPast && !isNow && !isNext ? 0.55 : 1,
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
            <TableCell align="center" sx={{ px: 0.3, py: 0.5, borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {formatTime12h(event, timezone)}
                </Typography>
            </TableCell>

            {/* CURRENCY */}
            <TableCell align="center" sx={{ px: 0.15, py: 0.5, borderColor: 'divider' }}>
                <CurrencyLabel currency={event.currency || event.Currency} />
            </TableCell>

            {/* IMPACT */}
            <TableCell align="center" sx={{ px: 0.15, py: 0.5, borderColor: 'divider' }}>
                <ImpactDot strength={strengthValue} />
            </TableCell>

            {/* EVENT NAME */}
            <TableCell sx={{ px: 0.4, py: 0.5, borderColor: 'divider' }}>
                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: isPast && !isNow ? 'text.secondary' : 'text.primary',
                            overflow: 'hidden',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: '0.7rem',
                            lineHeight: 1.3,
                        }}
                    >
                        {name}
                    </Typography>
                    {isNow && (
                        <Chip label="NOW" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.main', fontWeight: 800, height: 16, fontSize: '0.55rem', flex: '0 0 auto', '& .MuiChip-label': { px: 0.4 } }} />
                    )}
                    {isNext && (
                        <Chip label="NEXT" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.main', fontWeight: 800, height: 16, fontSize: '0.55rem', flex: '0 0 auto', '& .MuiChip-label': { px: 0.4 } }} />
                    )}
                </Stack>
            </TableCell>
        </TableRow>
    );
});
CompactEventRow.displayName = 'CompactEventRow';
CompactEventRow.propTypes = {
    event: PropTypes.object.isRequired,
    timezone: PropTypes.string.isRequired,
    isNow: PropTypes.bool,
    isNext: PropTypes.bool,
    isPast: PropTypes.bool,
    onOpen: PropTypes.func.isRequired,
    scrollRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

/** Loading skeleton rows (compact — 4 columns) */
const SkeletonRows = ({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
                <TableCell align="center" sx={{ px: 0.3, py: 0.5 }}><Skeleton variant="text" width={40} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ px: 0.15, py: 0.5 }}><Skeleton variant="text" width={28} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell align="center" sx={{ px: 0.15, py: 0.5 }}><Skeleton variant="circular" width={10} height={10} sx={{ mx: 'auto' }} /></TableCell>
                <TableCell sx={{ px: 0.4, py: 0.5 }}><Skeleton variant="text" width="80%" /></TableCell>
            </TableRow>
        ))}
    </>
);
SkeletonRows.propTypes = { count: PropTypes.number };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Compact events table for the /clock page Events tab.
 * Fixed to "today" preset. Reads currency/impact filters from SettingsContext.
 *
 * @param {Function} onOpenEvent — Called with event object when a row is clicked.
 */
export default function ClockEventsTable({ onOpenEvent }) {
    const { t, isReady } = useI18nReady(['calendar', 'clockPage', 'common']);

    // ─── Data: isolated 'today' preset (hook-level date isolation) ───
    // BEP v1.3.0: isolatedDatePreset tells the hook to:
    //   1. Always compute date range from 'today' (ignores SettingsContext datePreset)
    //   2. Never write date fields back to SettingsContext (no Calendar page date drift)
    //   3. Only sync currency/impact/favorites filters with SettingsContext
    //   4. Automatically recalculate on day rollover and timezone change
    const {
        events: economicEvents,
        loading,
        initialLoading,
        timezone,
        applyFilters,
    } = useCalendarData({ isolatedDatePreset: 'today' });

    // ─── NOW / NEXT detection ───
    const [nowEpochMs, setNowEpochMs] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => {
            startTransition(() => setNowEpochMs(Date.now()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const { nowEventIds, nextEventIds } = useMemo(
        () => computeNowNextState({ events: economicEvents, nowEpochMs, nowWindowMs: NOW_WINDOW_MS, buildKey: buildEventKey }),
        [economicEvents, nowEpochMs],
    );

    // ─── Scroll to NOW/NEXT refs ───
    const nowRowRef = useRef(null);
    const nextRowRef = useRef(null);

    const firstNowKey = useMemo(() => {
        for (const evt of economicEvents) {
            const key = buildEventKey(evt);
            if (nowEventIds.has(key)) return key;
        }
        return null;
    }, [economicEvents, nowEventIds]);

    const firstNextKey = useMemo(() => {
        for (const evt of economicEvents) {
            const key = buildEventKey(evt);
            if (nextEventIds.has(key)) return key;
        }
        return null;
    }, [economicEvents, nextEventIds]);

    // Auto-scroll to NOW/NEXT on first load
    const hasScrolled = useRef(false);
    useEffect(() => {
        if (hasScrolled.current || initialLoading) return;
        const target = nowRowRef.current || nextRowRef.current;
        if (target) {
            hasScrolled.current = true;
            // Small delay to let layout settle
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [initialLoading, economicEvents, firstNowKey, firstNextKey]);

    // ─── Filter change handler — clean passthrough (hook isolates dates internally) ───
    // BEP v1.3.0: No date stripping needed here — useCalendarData({ isolatedDatePreset })
    // automatically strips date fields from incoming filter partials and forces 'today' range.
    // Only currency/impact/favorites changes pass through to SettingsContext.
    const handleFilterChange = useCallback((partialFilters) => {
        applyFilters(partialFilters);
    }, [applyFilters]);

    // ─── Event count label ───
    const eventCount = economicEvents.length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Filters — currency & impact only (no date — fixed to today) */}
            <Box sx={{ px: 0.5, pb: 1 }}>
                <Suspense fallback={
                    <Stack spacing={0.75}>
                        <Skeleton variant="rounded" width="100%" height={34} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="rounded" width="55%" height={26} sx={{ borderRadius: 2 }} />
                    </Stack>
                }>
                    <ClockEventsFilters
                        onChange={handleFilterChange}
                        disabled={loading || initialLoading}
                    />
                </Suspense>
            </Box>

            {/* Event count badge */}
            {!initialLoading && eventCount > 0 && (
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, pb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        <TextSkeleton ready={isReady} width={80}>
                            {t('clockPage:tabs.upcomingEvents.todayCount', { count: eventCount })}
                        </TextSkeleton>
                    </Typography>
                </Stack>
            )}

            {/* Compact Table */}
            <TableContainer sx={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(var(--t2t-vv-height, 100dvh) - 200px)' }}>
                <Table size="small" stickyHeader sx={{ tableLayout: 'auto' }}>
                    <colgroup>
                        {COMPACT_COLUMNS.map((col) => (
                            <col key={col.id} />
                        ))}
                    </colgroup>

                    <TableHead>
                        <TableRow>
                            {COMPACT_COLUMNS.map((col) => (
                                <TableCell
                                    key={col.id}
                                    align={col.align}
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: '0.55rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.4,
                                        py: 0.4,
                                        px: 0.3,
                                        bgcolor: 'background.paper',
                                        borderColor: 'divider',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <TextSkeleton ready={isReady} width={col.id === 'name' ? 50 : 28}>
                                        {t(col.headerKey)}
                                    </TextSkeleton>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {initialLoading ? (
                            <SkeletonRows count={8} />
                        ) : eventCount === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={COMPACT_COLUMNS.length} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <TextSkeleton ready={isReady} width={180}>
                                            {t('clockPage:tabs.upcomingEvents.noEvents')}
                                        </TextSkeleton>
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {economicEvents.map((event) => {
                                    const key = buildEventKey(event);
                                    const isNow = nowEventIds.has(key);
                                    const isNext = nextEventIds.has(key);
                                    const epoch = getEventEpochMs(event);
                                    const isPast = epoch !== null && epoch < nowEpochMs;

                                    const refProp =
                                        key === firstNowKey ? nowRowRef
                                            : key === firstNextKey ? nextRowRef
                                                : undefined;

                                    return (
                                        <CompactEventRow
                                            key={key}
                                            event={event}
                                            timezone={timezone}
                                            isNow={isNow}
                                            isNext={isNext}
                                            isPast={isPast}
                                            onOpen={onOpenEvent}
                                            scrollRef={refProp}
                                        />
                                    );
                                })}
                                {loading && eventCount > 0 && (
                                    <SkeletonRows count={3} />
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

ClockEventsTable.propTypes = {
    onOpenEvent: PropTypes.func.isRequired,
};
