/**
 * src/components/EventsTable.jsx
 * 
 * Purpose: Enterprise-grade data table for economic events
 * Advanced table with sorting and pagination
 * 
 * Key Features:
 * - MUI Table with custom styling
 * - Columns: Date, Time, Currency (flag), Impact (icons), Event Name, Actual/Forecast/Previous, Action
 * - Sortable columns (click header to sort)
 * - Pagination (10/25/50/100 rows per page)
 * - Export functionality (CSV + JSON)
 * - Mobile card view toggle
 * - Loading skeletons and error states
 * - Opens EventModal on row click
 * - Keyboard navigation
 * - Accessibility compliant
 * 
 * Changelog:
 * v1.13.0 - 2026-02-10 - BEP: Accept and pass onEditCustomEvent prop to EventModal so custom events show edit icon.
 * v1.12.0 - 2026-02-06 - BEP: Display rescheduled/reinstated event indicators under event name. Reschedule badge (ScheduleIcon, color: secondary) shows when rescheduledFrom is set. Reinstate badge (RestoreIcon, color: info) shows when status is cancelled but has reappeared.
 * v1.11.0 - 2026-01-30 - BEP i18n migration: Added useTranslation hook, converted 8 column headers (COLUMNS), 5 impact labels (IMPACT_CONFIG), and associated strings to t() calls for calendar namespace
 * v1.10.2 - 2026-01-24 - Phase 2 prep: File header updated, scheduled for i18n migration (requires memoized column header component for t() integration)
 * v1.10.1 - 2026-01-16 - Default auth redirect to /calendar instead of /app for the public clock route.
 * v1.10.0 - 2026-01-16 - Show GPT all-day/tentative time labels when available.
   * v1.9.9 - 2026-01-08 - Render table row skeletons during filter-triggered loading with page-sized (capped) skeleton count for fast, stable UX.
   * v1.9.8 - 2026-01-08 - Gate row clicks for guests: open AuthModal2 instead of EventModal when unauthenticated.
   * v1.9.5 - 2025-12-16 - Always show "Actual: —" when actual values are unavailable.
   * v1.9.4 - 2025-12-16 - Moved next clock icon to the right of time; added inline metrics summary as secondary text.
    * v1.9.7 - 2026-01-07 - Restore horizontal scrolling and widen table min widths so the grid stays within its Paper on xl after left rail growth.
   * v1.9.6 - 2025-12-18 - Centralize impact colors (low impact yellow #F2C94C, unknown taupe #C7B8A4) for table chips to avoid collisions with session/NOW palette.
   * v1.9.3 - 2025-12-16 - Removed horizontal overflow; table now fits drawer width with wrapping text and compact spacing.
    * v1.9.2 - 2025-12-16 - Moved favorite/notes action column to the first position in table rows (mobile layout across all breakpoints).
    * v1.9.1 - 2025-12-16 - Unified mobile table layout for all breakpoints; horizontal scroll retained for full data access.
 * v1.9.0 - 2025-12-15 - REFACTOR: Replaced hardcoded NOW/NEXT calculations with global eventTimeEngine utilities (computeNowNextState, getNowEpochMs)
 * v1.8.4 - 2026-02-11 - BEP PERFORMANCE: Lazy-loaded AuthModal2 (conditionally rendered for
 *                        non-authenticated users). Wrapped in Suspense to defer Firebase Auth SDK.
 * v1.8.3 - 2025-12-15 - ENHANCEMENT: NEXT detection now based on filtered displayed events (matching timeline behavior), not contextEvents
 * v1.8.2 - 2025-12-15 - BUGFIX: Fixed NEXT/NOW badge detection - NOW events no longer counted as NEXT, added debug logging
 * v1.8.1 - 2025-12-15 - ENHANCEMENT: Mobile optimizations - hide headers, narrower time/currency columns, simple green clock icon for NEXT/NOW, flag-only currency display
 * v1.8.0 - 2025-12-15 - ENHANCEMENT: Compact UI mode - reduced padding, smaller fonts, optimized mobile view (Forex Factory style)
 * v1.7.1 - 2025-12-16 - Floating scroll action targets NOW when present (info/blue), otherwise NEXT.
 * v1.7.0 - 2025-12-12 - NEXT handling now highlights all simultaneous next events (same timestamp) instead of a single row.
 * v1.6.0 - 2025-12-12 - Added event notes control with loading state and shared actions column.
 * v1.5.0 - 2025-12-12 - Added favorites heart action with pending/loading states and auth-aware toggles.
 * v1.4.0 - 2025-12-11 - ENHANCEMENT: Added auto-scroll to next event functionality matching timeline behavior. Table now auto-scrolls and navigates to the correct page when drawer opens.
 * v1.3.0 - 2025-12-11 - ENHANCEMENT: Separated Actual, Forecast, and Previous into individual columns for better data visibility.
 * v1.2.4 - 2025-12-11 - ENHANCEMENT: Added floating 'Scroll to Next' button with dynamic up/down arrow. Added localStorage persistence for rowsPerPage selection.
 * v1.2.3 - 2025-12-11 - ENHANCEMENT: Added contextEvents prop for NEXT detection from unfiltered today+future events; NEXT row highlight is now accurate regardless of date filter.
 * v1.2.2 - 2025-12-11 - Gray out past events to mirror timeline past-state styling.
 * v1.2.1 - 2025-12-11 - Highlight next upcoming event row to match timeline UX.
 * v1.2.0 - 2025-12-11 - Removed toolbar title row and export actions for a cleaner embedded view.
 * v1.1.0 - 2025-12-11 - Removed card view and view toggle; always render table view (even on mobile).
 * v1.0.1 - 2025-12-08 - Fixed timezone handling: CSV export now uses user's selected timezone instead of hardcoded 'UTC', filename includes timezone
 * v1.0.0 - 2025-12-08 - Initial implementation
 */

import React, { Suspense, lazy, useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Button,
  Chip,
  Typography,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  AlertTitle,
  alpha,
  useTheme,
  Fab,
  Zoom,
  CircularProgress,
  Stack,
} from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import {
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FavoriteBorderOutlined as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  NoteAltOutlined as NoteAltOutlinedIcon,
  NoteAlt as NoteAltIcon,
  Schedule as ScheduleIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import EventModal from './EventModal';
const AuthModal2 = lazy(() => import('./AuthModal2'));
import { useAuth } from '../contexts/AuthContext';
import { formatTime, formatDate } from '../utils/dateUtils';
import {
  NOW_WINDOW_MS,
  getEventEpochMs,
  getNowEpochMs,
  isPastToday as isPastTodayEngine,
  computeNowNextState,
} from '../utils/eventTimeEngine';
import { resolveImpactMeta } from '../utils/newsApi';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Table columns configuration
 */
const COLUMNS = [
  { id: 'action', label: '', labelExpanded: '', labelKey: '', sortable: false, align: 'center' },
  { id: 'time', label: 'Time', labelExpanded: 'Time', labelKey: 'calendar:table.headers.time', sortable: true, align: 'left' },
  { id: 'currency', label: 'Cur', labelExpanded: 'Cur', labelKey: 'calendar:table.headers.currency', sortable: true, align: 'center' },
  { id: 'impact', label: 'Imp', labelExpanded: 'Imp', labelKey: 'calendar:table.headers.impact', sortable: true, align: 'center' },
  { id: 'name', label: 'Event Name', labelExpanded: 'Event Name', labelKey: 'calendar:table.headers.event', sortable: true, align: 'left' },
  { id: 'actual', label: 'A', labelExpanded: 'Actual', labelKey: 'calendar:table.headers.actual', sortable: false, align: 'center' },
  { id: 'forecast', label: 'F', labelExpanded: 'Forecast', labelKey: 'calendar:table.headers.forecast', sortable: false, align: 'center' },
  { id: 'previous', label: 'P', labelExpanded: 'Previous', labelKey: 'calendar:table.headers.previous', sortable: false, align: 'center' },
];

/**
 * Mobile columns (reduced for smaller screens)
 */
const MOBILE_COLUMNS = ['action', 'time', 'currency', 'impact', 'name'];

/**
 * Currency to country code mapping
 */
const CURRENCY_TO_COUNTRY = {
  'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
  'AUD': 'au', 'CAD': 'ca', 'NZD': 'nz', 'CNY': 'cn', 'HKD': 'hk',
  'SGD': 'sg', 'SEK': 'se', 'NOK': 'no', 'DKK': 'dk', 'PLN': 'pl',
  'CZK': 'cz', 'HUF': 'hu', 'RON': 'ro', 'TRY': 'tr', 'ZAR': 'za',
  'BRL': 'br', 'MXN': 'mx', 'INR': 'in', 'KRW': 'kr', 'RUB': 'ru',
  'THB': 'th', 'IDR': 'id', 'MYR': 'my', 'PHP': 'ph', 'ILS': 'il',
  'CLP': 'cl', 'ARS': 'ar', 'COP': 'co', 'PEN': 'pe', 'VND': 'vn',
};

/**
 * Impact configuration
 */
const IMPACT_CONFIG = {
  strong: { icon: '!!!', label: 'High', labelKey: 'calendar:impact.high.label' },
  moderate: { icon: '!!', label: 'Medium', labelKey: 'calendar:impact.medium.label' },
  weak: { icon: '!', label: 'Low', labelKey: 'calendar:impact.low.label' },
  'my-events': { icon: '★', label: 'My Events', labelKey: 'calendar:impact.myEvents.label' },
  'not-loaded': { icon: '?', label: 'Data Not Loaded', labelKey: 'calendar:impact.notLoaded.label' },
  'non-economic': { icon: '~', label: 'Non-Economic', labelKey: 'calendar:impact.nonEconomic.label' },
  unknown: { icon: '?', label: 'Unknown', labelKey: 'calendar:impact.unknown.label' },
};

const SPEECH_TITLE_REGEX = /(speaks|remarks|address|testifies|statement|press conference|hearing|meeting|vote)/i;

const hasMetricValue = (value) => {
  if (value === 0 || value === '0') return true;
  if (value === null || value === undefined) return false;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed === '-') return false;
  return true;
};

const isSpeechLikeEvent = (event) => {
  const category = `${event.category || event.Category || event.type || event.Type || event.eventType || event.EventType || ''}`.toLowerCase();
  const name = `${event.name || event.Name || ''}`;
  const categorySpeech = /speech|statement|address|testimony|press conference|hearing|meeting|vote/.test(category);
  const titleSpeech = SPEECH_TITLE_REGEX.test(name);
  const noMetrics = !hasMetricValue(event.actual) && !hasMetricValue(event.forecast) && !hasMetricValue(event.previous);
  return (categorySpeech || titleSpeech) && noMetrics;
};

const getSpeechSummary = (event) => {
  const name = event.name || event.Name || 'Scheduled remarks';
  const desc = event.description || event.Description || event.summary || event.Summary;
  if (desc) return desc;
  return `Scheduled remarks: ${name}`;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get impact config based on strength value
 */
const getImpactConfig = (strength) => {
  const meta = resolveImpactMeta(strength);
  const base = IMPACT_CONFIG[meta.key] || IMPACT_CONFIG.unknown;
  return {
    ...base,
    color: meta.color,
    icon: base.icon || meta.icon,
    label: base.label || meta.label,
  };
};

/**
 * Get country code for currency flag
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
};

/**
 * Determine if an event time has already passed in the target timezone.
 * Uses eventTimeEngine for accurate timezone-aware detection.
 */
const isPastEvent = (date, timezone, nowEpochMs) => {
  const eventEpochMs = getEventEpochMs({ date });
  if (eventEpochMs === null) return false;
  return isPastTodayEngine({ eventEpochMs, nowEpochMs, timezone, nowWindowMs: NOW_WINDOW_MS });
};



// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

/**
 * Loading Skeleton Row
 */
const SkeletonRow = memo(({ columnsCount }) => (
  <TableRow>
    {Array.from({ length: columnsCount }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton variant="text" width="100%" height={32} />
      </TableCell>
    ))}
  </TableRow>
));

SkeletonRow.displayName = 'SkeletonRow';

SkeletonRow.propTypes = {
  columnsCount: PropTypes.number.isRequired,
};

/**
 * Empty State Component
 */
const EmptyState = memo(({ searchQuery = '' }) => {
  const hasSearch = Boolean(searchQuery && searchQuery.trim());

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {hasSearch ? 'No events found' : 'No Events Found'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400, mb: hasSearch ? 1 : 0 }}>
        {hasSearch
          ? `No events match your search "${searchQuery}"`
          : 'Try adjusting your filters or date range to see more events.'}
      </Typography>
      {hasSearch && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            maxWidth: 400,
            fontStyle: 'italic',
          }}
        >
          Try different search terms or adjust your filters.
        </Typography>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';

EmptyState.propTypes = {
  searchQuery: PropTypes.string,
};

/**
 * Currency Flag Cell
 */
const CurrencyCell = memo(({ currency, isMobile }) => {
  const countryCode = getCurrencyFlag(currency);

  if (!countryCode) {
    return (
      <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
        {currency}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
      <Box
        component="span"
        className={`fi fi-${countryCode}`}
        sx={{
          fontSize: 16,
          lineHeight: 1,
        }}
      />
      {!isMobile && (
        <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
          {currency}
        </Typography>
      )}
    </Box>
  );
});

CurrencyCell.displayName = 'CurrencyCell';

CurrencyCell.propTypes = {
  currency: PropTypes.string,
  isMobile: PropTypes.bool.isRequired,
};

/**
 * Impact Cell
 */
const ImpactCell = memo(({ strength, isPast }) => {
  const config = getImpactConfig(strength);

  return (
    <Chip
      label={config.icon}
      size="small"
      sx={{
        bgcolor: isPast ? '#9e9e9e' : config.color,
        color: 'common.white',
        fontWeight: 700,
        minWidth: 40,
        height: 20,
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        '& .MuiChip-label': { px: 0.75, py: 0 },
      }}
    />
  );
});

ImpactCell.displayName = 'ImpactCell';

ImpactCell.propTypes = {
  strength: PropTypes.string,
  isPast: PropTypes.bool.isRequired,
};

/**
 * Data Values Cell (Actual / Forecast / Previous)
 */
const DataValuesCell = memo(({ event }) => {
  // Check if event is in the future
  const eventDate = new Date(event.date);
  const now = new Date();
  const isFuture = eventDate.getTime() > now.getTime();

  const actual = isFuture ? '—' : (hasMetricValue(event.actual) ? event.actual : '—');
  const forecast = hasMetricValue(event.forecast) ? event.forecast : '—';
  const previous = hasMetricValue(event.previous) ? event.previous : '—';

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      <Typography
        variant="body2"
        fontWeight={700}
      >
        {actual}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        /
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {forecast}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        /
      </Typography>
      <Typography variant="body2">
        {previous}
      </Typography>
    </Box>
  );
});

DataValuesCell.displayName = 'DataValuesCell';

DataValuesCell.propTypes = {
  event: PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    actual: PropTypes.string,
    forecast: PropTypes.string,
    previous: PropTypes.string,
    outcome: PropTypes.string,
    Outcome: PropTypes.string,
  }).isRequired,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventsTable Component
 */
export default function EventsTable({
  events,
  isExpanded = false,
  loading,
  error,
  timezone,
  onRefresh,
  autoScrollToNextKey = null,
  searchQuery = '',
  disableMinWidth = false,
  isFavoriteEvent = () => false,
  onToggleFavorite = null,
  isFavoritePending = () => false,
  favoritesLoading = false,
  hasEventNotes = () => false,
  onOpenNotes = null,
  isEventNotesLoading = () => false,
  onOpenAuth = null,
  authRedirectPath = null,
  onEditCustomEvent = null,
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation(['calendar', 'common']);
  // Force the compact mobile layout for all breakpoints
  const isMobile = true;

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(getNowEpochMs(timezone));
    }, 1000); // 1 second for immediate NOW/NEXT updates
    return () => clearInterval(interval);
  }, [timezone]);

  // ========== STATE ==========
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem('eventsTableRowsPerPage');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('asc');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showScrollToNext, setShowScrollToNext] = useState(false);
  const [favoriteConfirm, setFavoriteConfirm] = useState({ anchor: null, event: null });
  const [nowTick, setNowTick] = useState(() => getNowEpochMs(timezone));
  const tableContainerRef = useRef(null);
  const lastScrollTokenRef = useRef(null);
  const computedAuthRedirect = useMemo(() => (
    authRedirectPath
      ? authRedirectPath
      : (typeof window !== 'undefined' ? (window.location.pathname || '/calendar') : '/calendar')
  ), [authRedirectPath]);

  useEffect(() => {
    if (user && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [user, authModalOpen]);

  // ========== SORTING ==========
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const comparator = (a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'time':
          aValue = new Date(a.time || a.date).getTime();
          bValue = new Date(b.time || b.date).getTime();
          break;
        case 'currency':
          aValue = a.currency || '';
          bValue = b.currency || '';
          break;
        case 'impact': {
          const getImpactValue = (strength) => resolveImpactMeta(strength).priority;
          aValue = getImpactValue(a.strength);
          bValue = getImpactValue(b.strength);
          break;
        }
        case 'name':
          aValue = a.Name || '';
          bValue = b.Name || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    };

    return [...events].sort(comparator);
  }, [events, orderBy, order]);

  /**
   * NEXT and NOW event detection using displayed (filtered) events
   * This matches timeline behavior - NEXT is based on what the user is currently viewing
   * Uses global eventTimeEngine for timezone-aware detection
   */
  const nextEventMeta = useMemo(() => {
    const eventsForNext = events; // Use filtered displayed events, not contextEvents
    if (!eventsForNext || eventsForNext.length === 0) {
      return { nextIds: new Set(), nextFirstId: null, nextTime: null, nowIds: new Set() };
    }

    const nowEpochMs = nowTick;
    const state = computeNowNextState({
      events: eventsForNext,
      nowEpochMs,
      nowWindowMs: NOW_WINDOW_MS,
    });

    const nowIds = new Set(state.nowEventIds);
    const nextIds = new Set(state.nextEventIds);
    const nextFirstId = state.nextEventIds[0] || null;
    const nextTime = state.nextEventEpochMs;

    return { nextIds, nextFirstId, nextTime, nowIds };
  }, [events, nowTick]);

  // ========== AUTO SCROLL LOGIC ==========
  const targetToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object') {
      const { eventId, ts } = autoScrollToNextKey;
      if (eventId) return `${eventId}-${ts ?? 'na'}`;
    }
    return null;
  }, [autoScrollToNextKey]);

  const targetIdFromToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object' && autoScrollToNextKey.eventId) return autoScrollToNextKey.eventId;
    return null;
  }, [autoScrollToNextKey]);

  useEffect(() => {
    if (!nextEventMeta.nextTime && nextEventMeta.nowIds.size === 0) return undefined;
    // Removed countdown timer as countdownNow state was unused
    return undefined;
  }, [nextEventMeta.nextTime, nextEventMeta.nowIds]);

  /**
   * Track scroll position for floating 'Scroll to Next' button
   * Enterprise pattern: Show/hide based on scroll proximity to next event row
   * CRITICAL: Only show if next event is actually in the current paginated view
   */
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      // Removed setScrollPosition as scrollPosition state was unused

      const hasNow = nextEventMeta.nowIds.size > 0;
      const targetIds = hasNow ? nextEventMeta.nowIds : nextEventMeta.nextIds;
      const firstTargetId = targetIds.size > 0 ? Array.from(targetIds)[0] : null;

      if (!firstTargetId) {
        setShowScrollToNext(false);
        return;
      }

      // CRITICAL: Check if target event is in the current paginated rows
      const paginatedEvents = sortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      const isTargetInPaginatedView = paginatedEvents.some((evt) => targetIds.has(evt.id));
      if (!isTargetInPaginatedView) {
        setShowScrollToNext(false);
        return;
      }

      const targetRow = document.querySelector(`[data-event-id="${firstTargetId}"]`);
      if (!targetRow) {
        setShowScrollToNext(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const rowRect = targetRow.getBoundingClientRect();
      const rowTop = rowRect.top - containerRect.top + container.scrollTop;
      const viewportCenter = container.scrollTop + containerRect.height / 2;
      const distanceFromCenter = Math.abs(rowTop - viewportCenter);

      // Show button if target event is more than 200px away from viewport center
      setShowScrollToNext(distanceFromCenter > 200);
    };

    handleScroll(); // Initial check
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nextEventMeta.nextFirstId, nextEventMeta.nextIds, nextEventMeta.nowIds, page, rowsPerPage, sortedEvents]);

  /**
   * Reset scroll token when autoScrollToNextKey changes
   */
  useEffect(() => {
    lastScrollTokenRef.current = null;
  }, [autoScrollToNextKey]);

  /**
   * Auto-scroll to specific event when requested (via autoScrollToNextKey)
   * Enterprise pattern: Smooth scroll with page navigation if needed
   */
  useEffect(() => {
    if (!targetToken || !targetIdFromToken) return;
    if (lastScrollTokenRef.current === targetToken) return;

    const targetEvent = sortedEvents.find((evt) => evt.id === targetIdFromToken);
    if (!targetEvent) return;

    // Find which page the target event is on
    const eventIndex = sortedEvents.indexOf(targetEvent);
    const targetPage = Math.floor(eventIndex / rowsPerPage);

    // Navigate to the correct page if needed
    if (targetPage !== page) {
      setPage(targetPage);
    }

    // Scroll to the target row after DOM update
    const scrollToTarget = () => {
      const targetRow = document.querySelector(`[data-event-id="${targetIdFromToken}"]`);

      if (targetRow && tableContainerRef.current) {
        const container = tableContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const rowRect = targetRow.getBoundingClientRect();
        const rowTop = rowRect.top - containerRect.top + container.scrollTop;
        const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);

        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        lastScrollTokenRef.current = targetToken;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTarget);
    });
  }, [targetToken, targetIdFromToken, sortedEvents, page, rowsPerPage]);

  /**
   * Fallback: auto-scroll to next event when no explicit target is provided
   */
  useEffect(() => {
    if (loading) return;
    if (targetToken) return; // explicit target handled above
    if (lastScrollTokenRef.current === 'next-default') return;

    const firstDefaultId = nextEventMeta.nowIds.size > 0
      ? Array.from(nextEventMeta.nowIds)[0]
      : nextEventMeta.nextFirstId;

    if (firstDefaultId) {
      const nextRow = document.querySelector(`[data-event-id="${firstDefaultId}"]`);

      if (nextRow && tableContainerRef.current) {
        const container = tableContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const rowRect = nextRow.getBoundingClientRect();
        const rowTop = rowRect.top - containerRect.top + container.scrollTop;
        const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);

        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        lastScrollTokenRef.current = 'next-default';
      }
    }
  }, [nextEventMeta.nextFirstId, nextEventMeta.nowIds, targetToken, loading]);

  // Countdown hidden in table view; icon-only indicator retained

  /**
   * Group events by date for table display
   */
  const groupedEvents = useMemo(() => {
    if (!sortedEvents || sortedEvents.length === 0) return {};

    const groups = {};
    sortedEvents.forEach(event => {
      const dateKey = formatDate(event.date, timezone);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  }, [sortedEvents, timezone]);

  // ========== PAGINATION ==========
  const paginatedEvents = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedEvents.slice(start, end);
  }, [sortedEvents, page, rowsPerPage]);

  // ========== COLUMNS VISIBILITY ==========
  const visibleColumns = useMemo(() => {
    // Use the compact/mobile column set for all breakpoints
    return COLUMNS.filter(col => MOBILE_COLUMNS.includes(col.id) || col.id === 'action').map(col => ({
      ...col,
      label: isExpanded ? col.labelExpanded : col.label,
    }));
  }, [isExpanded]);

  const skeletonRowCount = useMemo(() => {
    // Match page density without rendering excessive skeleton rows (performance)
    const resolved = Number.isFinite(rowsPerPage) ? rowsPerPage : 10;
    return Math.max(5, Math.min(resolved, 25));
  }, [rowsPerPage]);

  // ========== HANDLERS ==========
  const handleSort = useCallback((columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  }, [orderBy, order]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    localStorage.setItem('eventsTableRowsPerPage', newRowsPerPage.toString());
    setPage(0);
  }, []);

  const handleRowClick = useCallback((event) => {
    if (!user) {
      setSelectedEvent(null);
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        setAuthModalOpen(true);
      }
      return;
    }

    setSelectedEvent(event);
  }, [onOpenAuth, user]);

  const handleOpenNotes = useCallback((event, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (onOpenNotes) {
      onOpenNotes(event);
    }
  }, [onOpenNotes]);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const handleFavoriteToggle = useCallback((event, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!onToggleFavorite) return;
    if (favoritesLoading || isFavoritePending(event)) return;

    if (isFavoriteEvent(event)) {
      setFavoriteConfirm({ anchor: e?.currentTarget || null, event });
      return;
    }

    onToggleFavorite(event);
  }, [favoritesLoading, isFavoriteEvent, isFavoritePending, onToggleFavorite]);

  const handleFavoriteRemove = useCallback(() => {
    if (favoriteConfirm.event && onToggleFavorite) {
      onToggleFavorite(favoriteConfirm.event);
    }
    setFavoriteConfirm({ anchor: null, event: null });
  }, [favoriteConfirm, onToggleFavorite]);

  const handleFavoriteConfirmClose = useCallback(() => {
    setFavoriteConfirm({ anchor: null, event: null });
  }, []);

  /**
   * Scroll to next event row
   * Enterprise UX: Smooth scroll with center alignment for optimal viewing
   */
  const handleScrollToNext = useCallback(() => {
    const firstTargetId = nextEventMeta.nowIds.size > 0
      ? Array.from(nextEventMeta.nowIds)[0]
      : nextEventMeta.nextFirstId;
    if (!firstTargetId) return;

    const nextRow = document.querySelector(`[data-event-id="${firstTargetId}"]`);

    if (nextRow && tableContainerRef.current) {
      const container = tableContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const rowRect = nextRow.getBoundingClientRect();
      const rowTop = rowRect.top - containerRect.top + container.scrollTop;
      const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);

      container.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [nextEventMeta.nextFirstId, nextEventMeta.nowIds]);

  // ========== RENDER ==========

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button
          onClick={onRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', height: '100%', minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <TableContainer
        ref={tableContainerRef}
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: disableMinWidth ? 'hidden' : 'auto',
          overflowY: 'auto',
          // Reserve gutter on scrollbar side only to avoid reducing usable width
          scrollbarGutter: 'stable',
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            width: '100%',
            minWidth: disableMinWidth ? 0 : { xs: 720, sm: 840, md: 960, lg: 1080, xl: 1200 },
            tableLayout: disableMinWidth ? 'fixed' : 'auto',
          }}
        >
          <TableHead sx={{ display: 'none' }}>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 0.5,
                    px: 0.75,
                    fontSize: '0.8125rem',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.labelKey ? t(column.labelKey) : column.label}
                    </TableSortLabel>
                  ) : (
                    column.labelKey ? t(column.labelKey) : column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, index) => (
                <SkeletonRow key={index} columnsCount={visibleColumns.length} />
              ))
            ) : paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length}>
                  <EmptyState searchQuery={searchQuery} />
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
                const pageEvents = dateEvents.filter(event => paginatedEvents.includes(event));
                if (pageEvents.length === 0) return null;

                return (
                  <React.Fragment key={dateKey}>
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          py: 0.5,
                          px: 1,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        {dateKey}
                      </TableCell>
                    </TableRow>

                    {pageEvents.map((event) => {
                      const nowEpochMs = Date.now();
                      const isNow = nextEventMeta.nowIds.has(event.id);
                      const isNext = nextEventMeta.nextIds.has(event.id);
                      const isPast = isPastEvent(event.time || event.date, timezone, nowEpochMs);

                      return (
                        <TableRow
                          key={event.id}
                          data-event-id={event.id}
                          hover
                          onClick={() => handleRowClick(event)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isNow
                              ? alpha(theme.palette.info.main, 0.08)
                              : isNext
                                ? alpha(theme.palette.primary.main, 0.06)
                                : isPast
                                  ? '#f5f5f5'
                                  : 'transparent',
                            color: isPast ? '#424242' : 'inherit',
                            borderLeft: isNow
                              ? `3px solid ${theme.palette.info.main}`
                              : isNext
                                ? `3px solid ${theme.palette.primary.main}`
                                : 'none',
                            '& td': {
                              py: 0.5,
                              px: 1,
                              fontSize: '0.8125rem',
                            },
                            '& td, & th, & span, & p': {
                              color: 'inherit',
                            },
                            '&:hover': {
                              bgcolor: isNow
                                ? alpha(theme.palette.info.main, 0.12)
                                : alpha(theme.palette.primary.main, 0.1),
                              '& .metrics-summary': {
                                display: 'block',
                              },
                            },
                          }}
                        >
                          {(() => {
                            const speechNoMetrics = isSpeechLikeEvent(event);
                            const speechSummary = speechNoMetrics ? getSpeechSummary(event) : null;
                            const metricColumnsInView = visibleColumns.filter((c) => ['actual', 'forecast', 'previous'].includes(c.id)).map((c) => c.id);

                            return visibleColumns.map((column) => {
                              // Check if event is in the future for data values
                              const eventDate = new Date(event.date);
                              const now = new Date();
                              const isFuture = eventDate.getTime() > now.getTime();

                              // Merge metric columns into a single cell when speech has no data
                              if (speechNoMetrics && metricColumnsInView.length > 0) {
                                if (column.id === 'actual') {
                                  return (
                                    <TableCell key={column.id} align="left" colSpan={metricColumnsInView.length}>
                                      <Typography
                                        className="metrics-summary"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          display: 'none',
                                          fontSize: '0.75rem',
                                          lineHeight: 1.3,
                                          '@media (hover: none)': {
                                            display: 'none !important',
                                          },
                                        }}
                                      >
                                        {speechSummary}
                                      </Typography>
                                    </TableCell>
                                  );
                                }
                                if (['forecast', 'previous'].includes(column.id)) {
                                  return null;
                                }
                              }

                              // Mobile/tablet fallback: add speech summary under name when metric columns are hidden
                              const shouldShowInlineSpeech = speechNoMetrics && metricColumnsInView.length === 0 && column.id === 'name';
                              const metricsSummary = (() => {
                                if (speechNoMetrics) return null;
                                const parts = [];
                                const actualLabel = isExpanded ? 'Actual' : 'A';
                                const forecastLabel = isExpanded ? 'Forecast' : 'F';
                                const previousLabel = isExpanded ? 'Previous' : 'P';
                                if (hasMetricValue(event.actual)) parts.push(`${actualLabel}: ${event.actual}`);
                                if (hasMetricValue(event.forecast)) parts.push(`${forecastLabel}: ${event.forecast}`);
                                if (hasMetricValue(event.previous)) parts.push(`${previousLabel}: ${event.previous}`);
                                return parts.length ? parts.join(' | ') : null;
                              })();

                              return (
                                <TableCell key={column.id} align={column.align}>
                                  {column.id === 'time' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="body2" fontFamily="monospace" fontWeight={600} fontSize="0.8125rem">
                                        {event.timeLabel || formatTime(event.time || event.date, timezone)}
                                      </Typography>
                                      {isNext && (
                                        <AccessTimeIcon
                                          sx={{
                                            fontSize: 16,
                                            color: 'success.main',
                                            display: 'inline-flex',
                                            ml: 0.5,
                                            animation: 'pulseClockMobile 1.5s ease-in-out infinite',
                                            '@keyframes pulseClockMobile': {
                                              '0%, 100%': { opacity: 1 },
                                              '50%': { opacity: 0.6 },
                                            },
                                          }}
                                        />
                                      )}
                                    </Box>
                                  )}
                                  {column.id === 'currency' && <CurrencyCell currency={event.currency} isMobile={isMobile} />}
                                  {column.id === 'impact' && <ImpactCell strength={event.strength} isPast={isPast} />}
                                  {column.id === 'name' && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        fontSize="0.8125rem"
                                        lineHeight={1.3}
                                        sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                                      >
                                        {event.Name}
                                      </Typography>
                                      {/* BEP v1.12.0: Reschedule/Reinstate badges */}
                                      <Stack direction="row" spacing={0.5}>
                                        {event.rescheduledFrom && (
                                          <MuiTooltip
                                            title={t('events:status.rescheduledFrom', { date: new Date(event.rescheduledFrom).toLocaleString() })}
                                            arrow
                                            placement="top"
                                          >
                                            <Chip
                                              icon={<ScheduleIcon />}
                                              label={t('events:status.rescheduled')}
                                              size="small"
                                              variant="outlined"
                                              color="secondary"
                                              sx={{
                                                height: 18,
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                              }}
                                            />
                                          </MuiTooltip>
                                        )}
                                        {event.status === 'cancelled' && (
                                          <MuiTooltip title={t('events:status.reinstatedTooltip')} arrow placement="top">
                                            <Chip
                                              icon={<RestoreIcon />}
                                              label={t('events:status.reinstated')}
                                              size="small"
                                              variant="outlined"
                                              color="info"
                                              sx={{
                                                height: 18,
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                              }}
                                            />
                                          </MuiTooltip>
                                        )}
                                      </Stack>
                                    </Box>
                                  )}
                                  {shouldShowInlineSpeech && speechSummary && (
                                    <Typography
                                      className="metrics-summary"
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: 'none',
                                        mt: 0.25,
                                        fontSize: '0.7rem',
                                        lineHeight: 1.2,
                                        '@media (hover: none)': {
                                          display: 'none !important',
                                        },
                                      }}
                                    >
                                      {speechSummary}
                                    </Typography>
                                  )}
                                  {column.id === 'name' && metricsSummary && (
                                    <Typography
                                      className="metrics-summary"
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: 'none',
                                        mt: 0.25,
                                        fontSize: '0.7rem',
                                        lineHeight: 1.2,
                                        '@media (hover: none)': {
                                          display: 'none !important',
                                        },
                                      }}
                                    >
                                      {metricsSummary}
                                    </Typography>
                                  )}
                                  {column.id === 'actual' && !speechNoMetrics && (
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                      fontSize="0.8125rem"
                                    >
                                      {`Actual: ${hasMetricValue(event.actual) && !isFuture ? event.actual : '—'}`}
                                    </Typography>
                                  )}
                                  {column.id === 'forecast' && !speechNoMetrics && (
                                    <Typography variant="body2" fontWeight={600} fontSize="0.8125rem">
                                      {hasMetricValue(event.forecast) ? event.forecast : '—'}
                                    </Typography>
                                  )}
                                  {column.id === 'previous' && !speechNoMetrics && (
                                    <Typography variant="body2" fontSize="0.8125rem">
                                      {hasMetricValue(event.previous) ? event.previous : '—'}
                                    </Typography>
                                  )}
                                  {column.id === 'action' && (
                                    <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center">
                                      <MuiTooltip
                                        title={isEventNotesLoading(event) ? t('calendar:tooltip.loadingNotes') : (hasEventNotes(event) ? t('calendar:tooltip.viewNotes') : t('calendar:tooltip.addNote'))}
                                        arrow
                                        placement="top"
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleOpenNotes(event, e)}
                                            disabled={isEventNotesLoading(event)}
                                            sx={{
                                              p: 0.5,
                                              color: hasEventNotes(event) ? 'primary.main' : 'text.secondary',
                                              '&:hover': {
                                                color: 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                              },
                                              '&.Mui-disabled': {
                                                color: 'text.disabled',
                                              },
                                            }}
                                          >
                                            {isEventNotesLoading(event) ? (
                                              <CircularProgress size={16} thickness={5} />
                                            ) : hasEventNotes(event) ? (
                                              <NoteAltIcon sx={{ fontSize: 18 }} />
                                            ) : (
                                              <NoteAltOutlinedIcon sx={{ fontSize: 18 }} />
                                            )}
                                          </IconButton>
                                        </span>
                                      </MuiTooltip>

                                      <MuiTooltip
                                        title={favoritesLoading ? t('calendar:tooltip.loadingFavorites') : (isFavoriteEvent(event) ? t('calendar:tooltip.removeFromFavorites') : t('calendar:tooltip.saveToFavorites'))}
                                        arrow
                                        placement="top"
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleFavoriteToggle(event, e)}
                                            disabled={favoritesLoading || isFavoritePending(event)}
                                            sx={{
                                              p: 0.5,
                                              color: isFavoriteEvent(event) ? 'error.main' : 'text.secondary',
                                              '&:hover': {
                                                color: isFavoriteEvent(event) ? 'error.dark' : 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                              },
                                              '&.Mui-disabled': {
                                                color: 'text.disabled',
                                              },
                                            }}
                                          >
                                            {isFavoritePending(event) ? (
                                              <CircularProgress size={16} thickness={5} />
                                            ) : isFavoriteEvent(event) ? (
                                              <FavoriteIcon sx={{ fontSize: 18 }} />
                                            ) : (
                                              <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                                            )}
                                          </IconButton>
                                        </span>
                                      </MuiTooltip>
                                    </Stack>
                                  )}
                                </TableCell>
                              );
                            });
                          })()}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && paginatedEvents.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <Menu
        anchorEl={favoriteConfirm.anchor}
        open={Boolean(favoriteConfirm.anchor)}
        onClose={handleFavoriteConfirmClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        <MenuItem onClick={handleFavoriteRemove} sx={{ fontWeight: 700, color: 'error.main' }}>
          Remove favorite
        </MenuItem>
        <MenuItem onClick={handleFavoriteConfirmClose}>Cancel</MenuItem>
      </Menu>

      {/* Floating Scroll to Next/Now Button */}
      {showScrollToNext && (nextEventMeta.nowIds.size > 0 || nextEventMeta.nextFirstId) && (() => {
        const hasNow = nextEventMeta.nowIds.size > 0;
        const firstTargetId = hasNow ? Array.from(nextEventMeta.nowIds)[0] : nextEventMeta.nextFirstId;
        const container = tableContainerRef.current;
        const nextRow = container && firstTargetId
          ? document.querySelector(`[data-event-id="${firstTargetId}"]`)
          : null;

        let isNextAbove = false;
        if (container && nextRow) {
          const containerRect = container.getBoundingClientRect();
          const rowRect = nextRow.getBoundingClientRect();
          const rowTop = rowRect.top - containerRect.top + container.scrollTop;
          const viewportCenter = container.scrollTop + containerRect.height / 2;
          isNextAbove = rowTop < viewportCenter;
        }

        return (
          <Zoom in timeout={300}>
            <Fab
              color={hasNow ? 'info' : 'primary'}
              size="medium"
              onClick={handleScrollToNext}
              sx={{
                position: 'absolute',
                bottom: {
                  xs: 'calc(72px + var(--t2t-safe-bottom, 0px))',
                  sm: 'calc(80px + var(--t2t-safe-bottom, 0px))',
                },
                right: { xs: 16, sm: 24 },
                zIndex: 1000,
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 8,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <MuiTooltip
                title={`${hasNow ? t('calendar:tooltip.scrollToNow') : t('calendar:tooltip.scrollToNext')} ${isNextAbove ? t('calendar:tooltip.above') : t('calendar:tooltip.below')}`}
                arrow
                placement="left"
              >
                {isNextAbove ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 28 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 28 }} />
                )}
              </MuiTooltip>
            </Fab>
          </Zoom>
        );
      })()}

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          open={Boolean(selectedEvent)}
          onClose={handleCloseModal}
          event={selectedEvent}
          timezone={timezone}
          isFavoriteEvent={isFavoriteEvent}
          onToggleFavorite={onToggleFavorite}
          isFavoritePending={isFavoritePending}
          favoritesLoading={favoritesLoading}
          hasEventNotes={hasEventNotes}
          onOpenNotes={onOpenNotes}
          isEventNotesLoading={isEventNotesLoading}
          onEditCustomEvent={onEditCustomEvent}
        />
      )}

      {!user && (
        <Suspense fallback={null}>
          <AuthModal2
            open={authModalOpen}
            onClose={handleCloseAuthModal}
            redirectPath={computedAuthRedirect}
          />
        </Suspense>
      )}
    </Paper>
  );
}

EventsTable.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  isExpanded: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  timezone: PropTypes.string.isRequired,
  onRefresh: PropTypes.func,
  autoScrollToNextKey: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  searchQuery: PropTypes.string,
  disableMinWidth: PropTypes.bool,
  isFavoriteEvent: PropTypes.func,
  onToggleFavorite: PropTypes.func,
  isFavoritePending: PropTypes.func,
  favoritesLoading: PropTypes.bool,
  hasEventNotes: PropTypes.func,
  onOpenNotes: PropTypes.func,
  isEventNotesLoading: PropTypes.func,
  onOpenAuth: PropTypes.func,
  authRedirectPath: PropTypes.string,
  onEditCustomEvent: PropTypes.func,
};
